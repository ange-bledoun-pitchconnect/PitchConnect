// MATCH EVENTS API - POST & GET EVENTS
// Path: src/app/api/matches/[matchId]/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const VALID_EVENT_TYPES = [
  'GOAL',
  'OWN_GOAL',
  'YELLOW_CARD',
  'RED_CARD',
  'SUBSTITUTION',
  'INJURY',
  'INJURY_RETURN',
  'PENALTY',
  'PENALTY_MISS',
  'PENALTY_SAVED',
  'ASSIST',
  'CORNER',
  'FREE_KICK',
  'TACKLE',
  'PASS',
  'SHOT',
  'SAVE',
  'CLEARANCE',
  'FOUL',
  'OFFSIDE',
  'TIMEOUT',
  'WICKET',
  'RUN',
  'BOUNDARY',
  'LBW',
  'CAUGHT',
];

interface MatchEventPayload {
  eventType: string;
  teamId: string;
  playerId?: string;
  minute: number;
  additionalMinute?: number;
  description?: string;
  involvedPlayerIds?: string[]; // For assists, tackles involving multiple players
  notes?: string;
}

interface MatchEventResponse {
  id: string;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    status: string;
  };
  eventType: string;
  team: {
    id: string;
    name: string;
  };
  player?: {
    id: string;
    firstName: string;
    lastName: string;
    shirtNumber?: number;
  };
  minute: number;
  additionalMinute?: number;
  description?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
  pagination?: PaginationInfo;
  timestamp: string;
}

// ============================================================================
// GET HANDLER: Get Match Events Timeline
// ============================================================================

/**
 * GET /api/matches/[matchId]/events
 * Query Parameters:
 * - eventType: Filter by event type
 * - teamId: Filter by team
 * - playerId: Filter by player
 * - page: Page number
 * - limit: Results per page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    logger.info(`[${requestId}] GET /api/matches/${params.matchId}/events - Start`);

    // 1. AUTHORIZATION
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' } as ErrorResponse,
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. VALIDATE MATCH EXISTS
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      select: { id: true, status: true },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    // 3. PARSE PAGINATION & FILTERS
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const filter: any = { matchId: params.matchId };

    const eventType = searchParams.get('eventType');
    if (eventType && VALID_EVENT_TYPES.includes(eventType.toUpperCase())) {
      filter.eventType = eventType.toUpperCase();
    }

    const teamId = searchParams.get('teamId');
    if (teamId) {
      filter.teamId = teamId;
    }

    const playerId = searchParams.get('playerId');
    if (playerId) {
      filter.playerId = playerId;
    }

    // 4. FETCH EVENTS
    const [events, totalCount] = await Promise.all([
      prisma.matchEvent.findMany({
        where: filter,
        include: {
          player: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              shirtNumber: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          minute: 'asc',
        },
        take: limit,
        skip,
      }),
      prisma.matchEvent.count({ where: filter }),
    ]);

    // 5. LOG AUDIT
    await logAuditAction(session.user.id, null, 'DATA_VIEWED', {
      action: 'match_events_list_viewed',
      matchId: params.matchId,
      eventCount: totalCount,
      requestId,
    });

    // 6. BUILD RESPONSE
    const pagination: PaginationInfo = {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      hasMore: page < Math.ceil(totalCount / limit),
    };

    const response: SuccessResponse<MatchEventResponse[]> = {
      success: true,
      data: events.map((event) => ({
        id: event.id,
        match: {
          id: params.matchId,
          homeTeam: 'Home Team',
          awayTeam: 'Away Team',
          status: match.status,
        },
        eventType: event.eventType,
        team: event.team,
        player: event.player
          ? {
              id: event.player.id,
              firstName: event.player.user.firstName,
              lastName: event.player.user.lastName,
              shirtNumber: event.player.shirtNumber || undefined,
            }
          : undefined,
        minute: event.minute,
        additionalMinute: event.additionalMinute || undefined,
        description: event.description || undefined,
        createdAt: event.createdAt.toISOString(),
      })),
      pagination,
      timestamp: new Date().toISOString(),
    };

    const duration = performance.now() - startTime;
    logger.info(`[${requestId}] GET /api/matches/${params.matchId}/events - Success`, {
      duration: Math.round(duration),
      eventCount: events.length,
      totalCount,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;

    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      logger.warn(`[${requestId}] GET /api/matches/${params.matchId}/events - Error`, {
        error: error.message,
      });
      return NextResponse.json(
        { success: false, error: error.message, code: error instanceof NotFoundError ? 'NOT_FOUND' : 'BAD_REQUEST' } as ErrorResponse,
        { status: error instanceof NotFoundError ? 404 : 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    logger.error(`[${requestId}] GET /api/matches/${params.matchId}/events - Error`, {
      error: error instanceof Error ? error.message : String(error),
      duration: Math.round(duration),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch match events', code: 'INTERNAL_ERROR' } as ErrorResponse,
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// POST HANDLER: Log Match Event
// ============================================================================

/**
 * POST /api/matches/[matchId]/events
 * Body:
 * {
 *   "eventType": "GOAL|YELLOW_CARD|RED_CARD|SUBSTITUTION|etc",
 *   "teamId": "string",
 *   "playerId": "string (optional for team events)",
 *   "minute": 45,
 *   "additionalMinute": 2,
 *   "description": "string",
 *   "involvedPlayerIds": ["player1", "player2"]
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    logger.info(`[${requestId}] POST /api/matches/${params.matchId}/events - Start`);

    // 1. AUTHORIZATION
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' } as ErrorResponse,
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Check authorization (REFEREE, MANAGER, SUPER_ADMIN)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles?.some((r) => ['REFEREE', 'MANAGER', 'SUPER_ADMIN', 'STATISTICIAN'].includes(r))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', code: 'FORBIDDEN' } as ErrorResponse,
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. VALIDATE MATCH EXISTS & IS IN PROGRESS OR COMPLETED
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      select: {
        id: true,
        status: true,
        homeTeamId: true,
        awayTeamId: true,
      },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    if (!['IN_PROGRESS', 'COMPLETED'].includes(match.status)) {
      throw new BadRequestError(`Cannot log events for match with status: ${match.status}`);
    }

    // 3. PARSE & VALIDATE REQUEST BODY
    let body: MatchEventPayload;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    // Validate required fields
    if (!body.eventType) throw new BadRequestError('eventType is required');
    if (!body.teamId) throw new BadRequestError('teamId is required');
    if (body.minute === undefined) throw new BadRequestError('minute is required');

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(body.eventType.toUpperCase())) {
      throw new BadRequestError(
        `Invalid eventType. Valid types: ${VALID_EVENT_TYPES.slice(0, 5).join(', ')}, ...`
      );
    }

    // Validate team belongs to match
    if (![match.homeTeamId, match.awayTeamId].includes(body.teamId)) {
      throw new BadRequestError('teamId must be either homeTeamId or awayTeamId of this match');
    }

    // Validate minute
    if (typeof body.minute !== 'number' || body.minute < 0 || body.minute > 180) {
      throw new BadRequestError('minute must be between 0 and 180');
    }

    if (body.additionalMinute !== undefined) {
      if (typeof body.additionalMinute !== 'number' || body.additionalMinute < 0) {
        throw new BadRequestError('additionalMinute must be a non-negative number');
      }
    }

    // Validate player if provided
    if (body.playerId) {
      const player = await prisma.player.findUnique({
        where: { id: body.playerId },
        select: { teamId: true },
      });
      if (!player) {
        throw new NotFoundError('Player', body.playerId);
      }
      if (player.teamId !== body.teamId) {
        throw new BadRequestError('Player must belong to the specified team');
      }
    }

    // 4. CREATE EVENT
    const eventData: any = {
      matchId: params.matchId,
      eventType: body.eventType.toUpperCase(),
      teamId: body.teamId,
      minute: body.minute,
      description: body.description || undefined,
    };

    if (body.playerId) {
      eventData.playerId = body.playerId;
    }

    if (body.additionalMinute) {
      eventData.additionalMinute = body.additionalMinute;
    }

    const newEvent = await prisma.matchEvent.create({
      data: eventData,
      include: {
        player: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            shirtNumber: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 5. LOG AUDIT
    await logAuditAction(session.user.id, null, 'MATCH_EVENT_CREATED', {
      matchId: params.matchId,
      eventId: newEvent.id,
      eventType: body.eventType,
      teamId: body.teamId,
      playerId: body.playerId,
      minute: body.minute,
      requestId,
    });

    // 6. RETURN RESPONSE
    const response: SuccessResponse<MatchEventResponse> = {
      success: true,
      data: {
        id: newEvent.id,
        match: {
          id: params.matchId,
          homeTeam: 'Home Team',
          awayTeam: 'Away Team',
          status: match.status,
        },
        eventType: newEvent.eventType,
        team: newEvent.team,
        player: newEvent.player
          ? {
              id: newEvent.player.id,
              firstName: newEvent.player.user.firstName,
              lastName: newEvent.player.user.lastName,
              shirtNumber: newEvent.player.shirtNumber || undefined,
            }
          : undefined,
        minute: newEvent.minute,
        additionalMinute: newEvent.additionalMinute || undefined,
        description: newEvent.description || undefined,
        createdAt: newEvent.createdAt.toISOString(),
      },
      message: 'Event logged successfully',
      timestamp: new Date().toISOString(),
    };

    const duration = performance.now() - startTime;
    logger.info(`[${requestId}] POST /api/matches/${params.matchId}/events - Success`, {
      eventId: newEvent.id,
      eventType: body.eventType,
      duration: Math.round(duration),
    });

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      logger.warn(`[${requestId}] POST /api/matches/${params.matchId}/events - Validation Error`, {
        error: error.message,
      });
      return NextResponse.json(
        { success: false, error: error.message, code: error instanceof NotFoundError ? 'NOT_FOUND' : 'BAD_REQUEST' } as ErrorResponse,
        { status: error instanceof NotFoundError ? 404 : 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    logger.error(`[${requestId}] POST /api/matches/${params.matchId}/events - Error`, {
      error: error instanceof Error ? error.message : String(error),
      duration: Math.round(duration),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to log event', code: 'INTERNAL_ERROR' } as ErrorResponse,
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}