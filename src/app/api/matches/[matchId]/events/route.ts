import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/utils/asyncHandler';
import { successResponse } from '@/lib/api/responses';
import { requireAuth } from '@/lib/api/middleware/auth';
import { validateBody } from '@/lib/api/middleware/validator';
import { MatchEventSchema } from '@/lib/api/validators';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import { logger } from '@/lib/api/utils/logger';

// GET /api/matches/[matchId]/events
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: { matchId: string } }) => {
    await requireAuth();

    const events = await prisma.matchEvent.findMany({
      where: { matchId: params.matchId },
      orderBy: { minute: 'asc' },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
            shirtNumber: true,
          },
        },
      },
    });

    return successResponse(events, 200);
  }
);

// POST /api/matches/[matchId]/events - Add match event (GOAL, CARD, SUB, etc)
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: { matchId: string } }) => {
    const user = await requireAuth();

    // Get match and verify it's in progress
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    if (!['LIVE', 'HALFTIME'].includes(match.status)) {
      throw new ValidationError('Match must be live to add events');
    }

    // Verify user is referee or match official
    const isOfficial =
      user.roles.includes('SUPERADMIN') ||
      user.roles.includes('REFEREE') ||
      match.refereeId === (await prisma.referee.findFirst({
        where: { userId: user.id },
      }))?.id;

    if (!isOfficial) {
      throw new Error('Only match officials can add events');
    }

    const body = await validateBody(request, MatchEventSchema);

    // Validate player belongs to one of the teams
    if (body.playerId) {
      const playerInTeam = await prisma.teamMember.findFirst({
        where: {
          userId: body.playerId,
          team: {
            OR: [
              { id: match.homeTeamId },
              { id: match.awayTeamId },
            ],
          },
        },
      });

      if (!playerInTeam) {
        throw new ValidationError('Player does not belong to either team');
      }
    }

    // Create event
    const event = await prisma.matchEvent.create({
      data: {
        matchId: params.matchId,
        type: body.type,
        playerId: body.playerId,
        assistedBy: body.assistedBy,
        minute: body.minute,
        isExtraTime: body.isExtraTime,
        additionalInfo: body.additionalInfo,
      },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    logger.info('Match event added', {
      matchId: params.matchId,
      eventType: body.type,
      minute: body.minute,
      playerId: body.playerId,
    });

    // EMIT WEBSOCKET EVENT for real-time update
    // This will be picked up by the WebSocket handler
    // and broadcast to all connected clients watching this match

    return successResponse(event, 201);
  }
);
