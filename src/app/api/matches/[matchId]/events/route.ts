// ============================================================================
// ENHANCED: /src/app/api/matches/[matchId]/events/route.ts
// Real-time match events API with comprehensive validation & RBAC
// Fully aligned with PitchConnect schema and architecture
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAnyRole } from '@/lib/api/middleware/auth';
import { success, created, errorResponse, paginated } from '@/lib/api/responses';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';
import { z } from 'zod';
import type { MatchEventType } from '@/types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createMatchEventSchema = z.object({
  type: z.enum([
    'GOAL',
    'OWN_GOAL',
    'ASSIST',
    'YELLOW_CARD',
    'RED_CARD',
    'SUBSTITUTION',
    'INJURY_TIME',
    'PENALTY',
    'MISSED_PENALTY',
  ] as const),
  minute: z.number().int().min(0).max(120),
  team: z.enum(['HOME', 'AWAY']),
  playerId: z.string().uuid().optional(),
  assistPlayerId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
});

type CreateMatchEventInput = z.infer<typeof createMatchEventSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify user has permission to create events for a match
 * Can be:
 * - Match referee
 * - League admin for the league
 * - Super admin
 * - Designated match operator
 */
async function verifyMatchEventPermission(
  userId: string,
  matchId: string,
  userRoles: string[],
) {
  // Super admin has access
  if (userRoles.includes('SUPERADMIN') || userRoles.includes('SUPER_ADMIN')) {
    return true;
  }

  // Check if user is the match referee
  const matchAsReferee = await prisma.match.findUnique({
    where: { id: matchId },
    select: { refereeId: true },
  });

  if (matchAsReferee?.refereeId === userId) {
    return true;
  }

  // Check if user is league admin for this match
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      fixture: {
        select: {
          leagueId: true,
        },
      },
    },
  });

  if (match?.fixture?.leagueId) {
    const leagueAdmin = await prisma.league.findUnique({
      where: { id: match.fixture.leagueId },
      select: { createdByUserId: true },
    });

    if (leagueAdmin?.createdByUserId === userId) {
      return true;
    }
  }

  return false;
}

/**
 * Validate player exists and belongs to match's team
 */
async function validatePlayerForMatch(
  playerId: string,
  matchId: string,
  team: 'HOME' | 'AWAY',
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      homeTeamId: true,
      awayTeamId: true,
    },
  });

  if (!match) {
    throw new NotFoundError('Match');
  }

  const teamId = team === 'HOME' ? match.homeTeamId : match.awayTeamId;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      clubId: true,
      userId: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!player) {
    throw new NotFoundError('Player');
  }

  if (player.clubId !== teamId) {
    throw new BadRequestError(
      `Player does not belong to the ${team} team`,
    );
  }

  return player;
}

/**
 * Broadcast event to real-time subscribers (Socket.IO)
 */
async function broadcastMatchEvent(
  matchId: string,
  event: any,
) {
  // This would integrate with Socket.IO server
  // For now, we'll log it for reference
  logger.info(`Broadcasting event to match ${matchId}:`, event);

  // In production, this would emit via Socket.IO:
  // io.to(`match:${matchId}`).emit(`match:${matchId}:event`, event);
}

/**
 * Update match statistics based on event
 */
async function updateMatchStats(
  matchId: string,
  event: CreateMatchEventInput,
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new NotFoundError('Match');
  }

  // Update match result based on event type
  if (event.type === 'GOAL' || event.type === 'OWN_GOAL') {
    const isHomeTeam = event.team === 'HOME';
    const updateData: any = {};

    if (event.type === 'GOAL') {
      if (isHomeTeam) {
        updateData['result.homeGoals'] = (match.homeTeamGoals || 0) + 1;
      } else {
        updateData['result.awayGoals'] = (match.awayTeamGoals || 0) + 1;
      }
    } else if (event.type === 'OWN_GOAL') {
      // Own goal counts for opposing team
      if (isHomeTeam) {
        updateData['result.awayGoals'] = (match.awayTeamGoals || 0) + 1;
      } else {
        updateData['result.homeGoals'] = (match.homeTeamGoals || 0) + 1;
      }
    }

    await prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });
  }
}

// ============================================================================
// GET /api/matches/[matchId]/events - List Match Events
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } },
) {
  try {
    const user = await requireAuth();

    // Validate match exists
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      select: {
        id: true,
        status: true,
        fixture: {
          select: {
            leagueId: true,
          },
        },
      },
    });

    if (!match) {
      return errorResponse(new NotFoundError('Match'), 404);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50'));
    const skip = (page - 1) * limit;
    const type = url.searchParams.get('type');
    const team = url.searchParams.get('team');

    // Build filter
    const where: any = { matchId: params.matchId };
    if (type) where.type = type;
    if (team) where.team = team;

    // Get total count
    const total = await prisma.matchEvent.count({ where });

    // Fetch events
    const events = await prisma.matchEvent.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            jerseyNumber: true,
            position: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        assistPlayer: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { minute: 'asc' },
      skip,
      take: limit,
    });

    logger.info(`Retrieved ${events.length} events for match ${params.matchId}`);

    return paginated(events, {
      page,
      limit,
      total,
    });
  } catch (error) {
    logger.error('Error fetching match events:', error);
    return errorResponse(error as Error);
  }
}

// ============================================================================
// POST /api/matches/[matchId]/events - Create Match Event
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } },
) {
  try {
    const user = await requireAuth();
    requireAnyRole(user, ['SUPERADMIN', 'SUPER_ADMIN', 'LEAGUE_ADMIN', 'REFEREE']);

    // Validate match exists and is live/completed
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      select: {
        id: true,
        status: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        fixture: { select: { leagueId: true } },
      },
    });

    if (!match) {
      return errorResponse(new NotFoundError('Match'), 404);
    }

    // Only allow events during live or recently completed matches
    if (!['LIVE', 'COMPLETED'].includes(match.status)) {
      return errorResponse(
        new BadRequestError(
          `Cannot create events for ${match.status} matches. Match must be LIVE or COMPLETED.`,
        ),
        400,
      );
    }

    // Verify user has permission
    const hasPermission = await verifyMatchEventPermission(
      user.id,
      params.matchId,
      user.roles,
    );

    if (!hasPermission) {
      return errorResponse(
        new UnauthorizedError(
          'You do not have permission to create events for this match',
        ),
        403,
      );
    }

    // Parse and validate request body
    let body: CreateMatchEventInput;
    try {
      const rawBody = await request.json();
      body = createMatchEventSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(
          new BadRequestError(
            `Validation error: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          ),
          400,
        );
      }
      throw error;
    }

    // Validate player if provided
    if (body.playerId) {
      await validatePlayerForMatch(body.playerId, params.matchId, body.team);
    }

    // Validate assist player if provided
    if (body.assistPlayerId && body.type === 'ASSIST') {
      await validatePlayerForMatch(body.assistPlayerId, params.matchId, body.team);
    }

    // Create match event
    const event = await prisma.matchEvent.create({
      data: {
        matchId: params.matchId,
        type: body.type as MatchEventType,
        minute: body.minute,
        team: body.team,
        playerId: body.playerId,
        assistPlayerId: body.assistPlayerId,
        description: body.description,
      },
      include: {
        player: {
          select: {
            id: true,
            jerseyNumber: true,
            position: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        assistPlayer: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Update match statistics
    await updateMatchStats(params.matchId, body);

    // Broadcast to real-time subscribers
    await broadcastMatchEvent(params.matchId, event);

    // Log audit action
    const teamName = body.team === 'HOME' ? match.homeTeam.name : match.awayTeam.name;
    const playerName = event.player?.user
      ? `${event.player.user.firstName} ${event.player.user.lastName}`
      : 'Unknown';

    await logAuditAction({
      performedById: user.id,
      action: 'MATCH_EVENT_CREATED',
      entityType: 'MatchEvent',
      entityId: event.id,
      changes: {
        type: body.type,
        team: teamName,
        player: playerName,
        minute: body.minute,
      },
      details: `Created ${body.type} event for ${teamName} in match ${params.matchId}`,
    });

    logger.info(`Event created for match ${params.matchId}:`, {
      type: body.type,
      team: body.team,
      minute: body.minute,
      playerId: body.playerId,
    });

    return created(event);
  } catch (error) {
    logger.error('Error creating match event:', error);
    return errorResponse(error as Error);
  }
}

// ============================================================================
// DELETE /api/matches/[matchId]/events/[eventId] - Delete Event (Future)
// ============================================================================

// This can be added for event correction/removal in future versions
