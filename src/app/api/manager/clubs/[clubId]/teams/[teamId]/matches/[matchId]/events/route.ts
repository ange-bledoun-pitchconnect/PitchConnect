// =============================================================================
// ⚡ MATCH EVENTS API - Enterprise-Grade Multi-Sport Implementation
// =============================================================================
// POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events
// Create match events (goals, cards, substitutions, etc.)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club Owner, Manager, Head Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport, ClubMemberRole, MatchEventType } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  requestId: string;
  timestamp: string;
}

interface RouteParams {
  params: {
    clubId: string;
    teamId: string;
    matchId: string;
  };
}

interface CreatedEvent {
  id: string;
  eventType: MatchEventType;
  minute: number;
  additionalMinute?: number;
  period: string;
  description?: string;
  player?: {
    id: string;
    name: string;
  };
  relatedPlayer?: {
    id: string;
    name: string;
  };
  teamId: string;
  createdAt: string;
}

// =============================================================================
// SPORT-SPECIFIC EVENT TYPES
// =============================================================================

const SPORT_EVENT_TYPES: Record<Sport, MatchEventType[]> = {
  FOOTBALL: ['GOAL', 'ASSIST', 'OWN_GOAL', 'PENALTY_SCORED', 'PENALTY_MISSED', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'INJURY'],
  FUTSAL: ['GOAL', 'ASSIST', 'OWN_GOAL', 'PENALTY_SCORED', 'PENALTY_MISSED', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'],
  BEACH_FOOTBALL: ['GOAL', 'ASSIST', 'OWN_GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'],
  RUGBY: ['TRY', 'CONVERSION', 'PENALTY_KICK', 'DROP_GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'],
  CRICKET: ['WICKET', 'CATCH', 'RUN_OUT', 'STUMPING', 'BOUNDARY_FOUR', 'BOUNDARY_SIX', 'LBW', 'BOWLED'],
  AMERICAN_FOOTBALL: ['TOUCHDOWN', 'FIELD_GOAL', 'EXTRA_POINT', 'TWO_POINT_CONVERSION', 'SAFETY', 'INTERCEPTION', 'FUMBLE', 'SACK'],
  BASKETBALL: ['FIELD_GOAL', 'THREE_POINTER', 'FREE_THROW', 'REBOUND', 'ASSIST', 'BLOCK', 'STEAL', 'TURNOVER', 'FOUL', 'TECHNICAL_FOUL'],
  HOCKEY: ['GOAL', 'ASSIST', 'PENALTY_CORNER', 'GREEN_CARD', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'],
  LACROSSE: ['GOAL', 'ASSIST', 'GROUND_BALL', 'SAVE', 'TURNOVER', 'PENALTY'],
  NETBALL: ['GOAL', 'ASSIST', 'INTERCEPTION', 'REBOUND', 'TURNOVER'],
  AUSTRALIAN_RULES: ['GOAL', 'BEHIND', 'MARK', 'TACKLE', 'HANDBALL', 'FREE_KICK'],
  GAELIC_FOOTBALL: ['GOAL', 'POINT', 'ASSIST', 'YELLOW_CARD', 'BLACK_CARD', 'RED_CARD', 'SUBSTITUTION'],
};

// Events that affect score
const SCORING_EVENTS: Record<Sport, { event: MatchEventType; points: number }[]> = {
  FOOTBALL: [{ event: 'GOAL', points: 1 }, { event: 'OWN_GOAL', points: 1 }, { event: 'PENALTY_SCORED', points: 1 }],
  FUTSAL: [{ event: 'GOAL', points: 1 }, { event: 'OWN_GOAL', points: 1 }, { event: 'PENALTY_SCORED', points: 1 }],
  BEACH_FOOTBALL: [{ event: 'GOAL', points: 1 }, { event: 'OWN_GOAL', points: 1 }],
  RUGBY: [{ event: 'TRY', points: 5 }, { event: 'CONVERSION', points: 2 }, { event: 'PENALTY_KICK', points: 3 }, { event: 'DROP_GOAL', points: 3 }],
  CRICKET: [], // Scoring handled differently
  AMERICAN_FOOTBALL: [{ event: 'TOUCHDOWN', points: 6 }, { event: 'FIELD_GOAL', points: 3 }, { event: 'EXTRA_POINT', points: 1 }, { event: 'TWO_POINT_CONVERSION', points: 2 }, { event: 'SAFETY', points: 2 }],
  BASKETBALL: [{ event: 'FIELD_GOAL', points: 2 }, { event: 'THREE_POINTER', points: 3 }, { event: 'FREE_THROW', points: 1 }],
  HOCKEY: [{ event: 'GOAL', points: 1 }],
  LACROSSE: [{ event: 'GOAL', points: 1 }],
  NETBALL: [{ event: 'GOAL', points: 1 }],
  AUSTRALIAN_RULES: [{ event: 'GOAL', points: 6 }, { event: 'BEHIND', points: 1 }],
  GAELIC_FOOTBALL: [{ event: 'GOAL', points: 3 }, { event: 'POINT', points: 1 }],
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateEventSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  minute: z.number().int().min(0).max(150),
  additionalMinute: z.number().int().min(0).max(30).optional(),
  period: z.string().max(50).optional(),
  playerId: z.string().optional(), // Player who performed the action
  relatedPlayerId: z.string().optional(), // e.g., assisting player, player subbed off
  description: z.string().max(500).optional(),
  isForOpponent: z.boolean().default(false), // For own goals, etc.
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: string;
    code?: string;
    message?: string;
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    requestId: options.requestId,
    timestamp: new Date().toISOString(),
  };

  if (options.success && data !== null) response.data = data;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;
  if (options.message) response.message = options.message;

  return NextResponse.json(response, { status: options.status || 200 });
}

const EDIT_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

async function hasEditPermission(userId: string, clubId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (user?.isSuperAdmin) return true;

  const clubMember = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: EDIT_ROLES },
    },
  });

  return !!clubMember;
}

// =============================================================================
// GET HANDLER - List Match Events
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, matchId } = params;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Verify match exists and team is involved
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
      },
    });

    if (!match) {
      return createResponse(null, {
        success: false,
        error: 'Match not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Match not found for this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 3. Fetch events
    const events = await prisma.matchEvent.findMany({
      where: { matchId },
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        relatedPlayer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [
        { minute: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // 4. Transform response
    const transformedEvents = events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      minute: e.minute || 0,
      additionalMinute: e.additionalMinute || undefined,
      period: e.period || 'First Half',
      description: e.description || undefined,
      player: e.player ? {
        id: e.player.id,
        name: `${e.player.user.firstName} ${e.player.user.lastName}`,
        shirtNumber: e.player.shirtNumber,
      } : undefined,
      relatedPlayer: e.relatedPlayer ? {
        id: e.relatedPlayer.id,
        name: `${e.relatedPlayer.user.firstName} ${e.relatedPlayer.user.lastName}`,
        shirtNumber: e.relatedPlayer.shirtNumber,
      } : undefined,
      teamId: e.teamId,
      isHomeTeam: e.teamId === match.homeTeamId,
      createdAt: e.createdAt.toISOString(),
    }));

    return createResponse({
      matchId,
      events: transformedEvents,
      count: transformedEvents.length,
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] List Events error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch match events',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Match Event
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, matchId } = params;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Authorization
    const canEdit = await hasEditPermission(session.user.id, clubId);
    if (!canEdit) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to record match events',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify club and get sport
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, sport: true },
    });

    if (!club) {
      return createResponse(null, {
        success: false,
        error: 'Club not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Verify match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        status: true,
        homeScore: true,
        awayScore: true,
      },
    });

    if (!match) {
      return createResponse(null, {
        success: false,
        error: 'Match not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Match not found for this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
        requestId,
        status: 400,
      });
    }

    const validation = CreateEventSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { eventType, minute, additionalMinute, period, playerId, relatedPlayerId, description, isForOpponent } = validation.data;

    // 6. Validate event type for sport
    const allowedEvents = SPORT_EVENT_TYPES[club.sport] || [];
    if (!allowedEvents.includes(eventType as MatchEventType)) {
      return createResponse(null, {
        success: false,
        error: `Event type ${eventType} is not valid for ${club.sport}`,
        code: 'INVALID_EVENT_TYPE',
        requestId,
        status: 400,
      });
    }

    // 7. Verify player exists if provided
    if (playerId) {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
      });
      if (!player) {
        return createResponse(null, {
          success: false,
          error: 'Player not found',
          code: 'PLAYER_NOT_FOUND',
          requestId,
          status: 400,
        });
      }
    }

    // 8. Determine which team this event is for
    // For own goals, the scoring team is the opponent
    let eventTeamId = teamId;
    if (isForOpponent || eventType === 'OWN_GOAL') {
      eventTeamId = match.homeTeamId === teamId ? match.awayTeamId : match.homeTeamId;
    }

    // 9. Create the event
    const event = await prisma.matchEvent.create({
      data: {
        matchId,
        teamId: eventTeamId,
        eventType: eventType as MatchEventType,
        minute,
        additionalMinute: additionalMinute || null,
        period: period || 'First Half',
        playerId: playerId || null,
        relatedPlayerId: relatedPlayerId || null,
        description: description || null,
        createdById: session.user.id,
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        relatedPlayer: {
          include: {
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

    // 10. Update match score if this is a scoring event
    const sportScoringEvents = SCORING_EVENTS[club.sport] || [];
    const scoringEvent = sportScoringEvents.find((s) => s.event === eventType);
    
    if (scoringEvent) {
      const isHomeEvent = eventTeamId === match.homeTeamId;
      const currentHomeScore = match.homeScore || 0;
      const currentAwayScore = match.awayScore || 0;

      await prisma.match.update({
        where: { id: matchId },
        data: isHomeEvent
          ? { homeScore: currentHomeScore + scoringEvent.points }
          : { awayScore: currentAwayScore + scoringEvent.points },
      });
    }

    // 11. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'MATCH_EVENT',
        entityId: event.id,
        description: `Recorded ${eventType} at ${minute}'`,
        metadata: {
          matchId,
          eventType,
          minute,
          playerId,
        },
      },
    });

    // 12. Transform response
    const response: CreatedEvent = {
      id: event.id,
      eventType: event.eventType,
      minute: event.minute || 0,
      additionalMinute: event.additionalMinute || undefined,
      period: event.period || 'First Half',
      description: event.description || undefined,
      player: event.player ? {
        id: event.player.id,
        name: `${event.player.user.firstName} ${event.player.user.lastName}`,
      } : undefined,
      relatedPlayer: event.relatedPlayer ? {
        id: event.relatedPlayer.id,
        name: `${event.relatedPlayer.user.firstName} ${event.relatedPlayer.user.lastName}`,
      } : undefined,
      teamId: event.teamId,
      createdAt: event.createdAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      message: `${eventType} recorded successfully`,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Create Event error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create match event',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
