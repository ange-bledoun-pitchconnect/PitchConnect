import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/utils/asyncHandler';
import { successResponse } from '@/lib/api/responses';
import { requireAuth } from '@/lib/api/middleware/auth';
import { validateBody } from '@/lib/api/middleware/validator';
import { PaginationQuerySchema, getPaginationParams } from '@/lib/api/utils/pagination';
import { validateQuery } from '@/lib/api/middleware/validator';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import { z } from 'zod';
import { MatchAttendanceStatus } from '@prisma/client';

// GET /api/matches/[matchId]/attendance - Get player attendance
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: { matchId: string } }) => {
    await requireAuth();

    const query = await validateQuery(request.nextUrl, PaginationQuerySchema);
    const { skip, take, page, pageSize } = getPaginationParams(query);

    const [attendance, total] = await Promise.all([
      prisma.matchAttendance.findMany({
        where: { matchId: params.matchId },
        skip,
        take,
        include: {
          player: {
            include: {
              user: true,
            },
          },
        },
      }),
      prisma.matchAttendance.count({
        where: { matchId: params.matchId },
      }),
    ]);

    return successResponse(attendance, 200, { total, page, pageSize });
  }
);

// POST /api/matches/[matchId]/attendance - Player confirms attendance
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: { matchId: string } }) => {
    const user = await requireAuth();

    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    const AttendanceSchema = z.object({
      playerId: z.string().cuid().optional(), // Admin can set for others
      status: z.nativeEnum(MatchAttendanceStatus),
      notes: z.string().optional(),
    });

    const body = await validateBody(request, AttendanceSchema);

    const playerId = body.playerId || user.id;

    // Check if player already exists
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
    });

    if (!player) {
      throw new ValidationError('Player profile not found');
    }

    // Create or update attendance
    const attendance = await prisma.matchAttendance.upsert({
      where: {
        matchId_playerId: {
          matchId: params.matchId,
          playerId: player.id,
        },
      },
      create: {
        matchId: params.matchId,
        playerId: player.id,
        status: body.status,
        notes: body.notes,
      },
      update: {
        status: body.status,
        notes: body.notes,
      },
    });

    return successResponse(attendance, 200);
  }
);
