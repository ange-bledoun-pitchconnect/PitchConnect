import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/utils/asyncHandler';
import { successResponse } from '@/lib/api/responses';
import { requireAuth } from '@/lib/api/middleware/auth';
import { PaginationQuerySchema, getPaginationParams } from '@/lib/api/utils/pagination';
import { validateQuery } from '@/lib/api/middleware/validator';
import { prisma } from '@/lib/prisma';

// GET /api/players/[playerId]/matches
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: { playerId: string } }) => {
    await requireAuth();

    const query = await validateQuery(request.nextUrl, PaginationQuerySchema);
    const { skip, take, page, pageSize } = getPaginationParams(query);

    const [matches, total] = await Promise.all([
      prisma.matchAttendance.findMany({
        where: { playerId: params.playerId },
        skip,
        take,
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              events: {
                where: { playerId: params.playerId },
              },
            },
          },
        },
        orderBy: {
          match: { date: 'desc' },
        },
      }),
      prisma.matchAttendance.count({
        where: { playerId: params.playerId },
      }),
    ]);

    return successResponse(matches, 200, { total, page, pageSize });
  }
);
