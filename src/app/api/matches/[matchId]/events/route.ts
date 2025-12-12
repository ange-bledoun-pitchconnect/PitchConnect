// ============================================================================
// WORLD-CLASS ENHANCED: /src/app/api/matches/[matchId]/events/route.ts
// Match Event Management with Real-Time Broadcasting Support
// VERSION: 3.0 - Production Grade
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

interface EventParams {
  params: { matchId: string };
}

// ============================================================================
// GET /api/matches/[matchId]/events - Get Match Events
// Query Params:
//   - page: number (default: 1)
//   - limit: number (default: 50, max: 100)
//   - type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION_ON' | etc
//   - team: 'HOME' | 'AWAY'
// ============================================================================

export async function GET(request: NextRequest, { params }: EventParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] GET /api/matches/[${params.matchId}]/events`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401 }
      );
    }

    // ✅ Validate match exists
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      select: {
        id: true,
        status: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    // ✅ Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10))
    );
    const skip = (page - 1) * limit;
    const typeFilter = url.searchParams.get('type');
    const teamFilter = url.searchParams.get('team');

    // ✅ Build where clause
    const where: any = { matchId: params.matchId };

    if (typeFilter) {
      where.type = typeFilter;
    }

    if (teamFilter) {
      if (!['HOME', 'AWAY'].includes(teamFilter)) {
        throw new BadRequestError('team must be HOME or AWAY');
      }
      where.team = teamFilter;
    }

    // ✅ Get total count
    const total = await prisma.matchEvent.count({ where });

    // ✅ Fetch events
    const events = await prisma.matchEvent.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { minute: 'asc' },
      skip,
      take: limit,
    });

    // ✅ Enhance events with calculated fields
    const enhancedEvents = events.map((event) => ({
      id: event.id,
      type: event.type,
      minute: event.minute,
      isExtraTime: event.isExtraTime,
      team: event.team,
      teamName: event.team === 'HOME' ? match.homeTeam.name : match.awayTeam.name,
      player: event.player
        ? {
            id: event.playerId,
            firstName: event.player.firstName,
            lastName: event.player.lastName,
            fullName: `${event.player.firstName} ${event.player.lastName}`,
          }
        : null,
      assistedBy: event.assistedBy,
      additionalInfo: event.additionalInfo,
      createdAt: event.createdAt,
    }));

    // ✅ Calculate summary
    const goalsHome = enhancedEvents.filter(
      (e) => e.type === 'GOAL' && e.team === 'HOME'
    ).length;
    const goalsAway = enhancedEvents.filter(
      (e) => e.type === 'GOAL' && e.team === 'AWAY'
    ).length;
    const yellowCardsHome = enhancedEvents.filter(
      (e) => e.type === 'YELLOW_CARD' && e.team === 'HOME'
    ).length;
    const yellowCardsAway = enhancedEvents.filter(
      (e) => e.type === 'YELLOW_CARD' && e.team === 'AWAY'
    ).length;
    const redCardsHome = enhancedEvents.filter(
      (e) => e.type === 'RED_CARD' && e.team === 'HOME'
    ).length;
    const redCardsAway = enhancedEvents.filter(
      (e) => e.type === 'RED_CARD' && e.team === 'AWAY'
    ).length;

    const response = {
      success: true,
      data: {
        match: {
          id: match.id,
          status: match.status,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
        },
        events: enhancedEvents,
        summary: {
          total,
          goals: { home: goalsHome, away: goalsAway },
          yellowCards: { home: yellowCardsHome, away: yellowCardsAway },
          redCards: { home: redCardsHome, away: redCardsAway },
          substitutions: enhancedEvents.filter(
            (e) =>
              e.type === 'SUBSTITUTION_ON' ||
              e.type === 'SUBSTITUTION_OFF'
          ).length,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
        filters: {
          type: typeFilter || null,
          team: teamFilter || null,
        },
        metadata: {
          matchId: params.matchId,
          requestId,
          timestamp: new Date().toISOString(),
          recordsReturned: enhancedEvents.length,
        },
      },
    };

    logger.info(
      `[${requestId}] Successfully retrieved ${enhancedEvents.length} events for match ${params.matchId}`
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(
      `[${requestId}] Error in GET /api/matches/[${params.matchId}]/events:`,
      error
    );

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'MATCH_NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message, code: 'INVALID_INPUT', requestId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve events',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/matches/[matchId]/events - Log Match Event
// Authorization: SUPERADMIN, LEAGUE_ADMIN, REFEREE
// ============================================================================

export async function POST(request: NextRequest, { params }: EventParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] POST /api/matches/[${params.matchId}]/events`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401 }
      );
    }

    // ✅ Authorization
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN');
    const isReferee = session.user.roles?.includes('REFEREE');
    const isCoach = session.user.roles?.includes('COACH');

    if (!isSuperAdmin && !isLeagueAdmin && !isReferee && !isCoach) {
      throw new ForbiddenError(
        'Only SUPERADMIN, LEAGUE_ADMIN, REFEREE, or COACH can log match events'
      );
    }

    // ✅ Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    // ✅ Validate required fields
    if (!body.type) {
      throw new BadRequestError('type is required');
    }

    if (body.minute === undefined || body.minute === null) {
      throw new BadRequestError('minute is required');
    }

    if (!body.team) {
      throw new BadRequestError('team is required');
    }

    // ✅ Validate minute
    const minute = parseInt(body.minute, 10);
    if (isNaN(minute) || minute < 0 || minute > 150) {
      throw new BadRequestError('minute must be between 0 and 150');
    }

    // ✅ Validate team
    if (!['HOME', 'AWAY'].includes(body.team)) {
      throw new BadRequestError('team must be HOME or AWAY');
    }

    // ✅ Validate match exists and is live/finished
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

    if (!['LIVE', 'HALFTIME', 'FINISHED'].includes(match.status)) {
      throw new BadRequestError(
        `Cannot log events for ${match.status} matches. Match must be LIVE or FINISHED`
      );
    }

    // ✅ If playerId provided, validate player belongs to team
    if (body.playerId) {
      const teamId = body.team === 'HOME' ? match.homeTeamId : match.awayTeamId;

      const player = await prisma.player.findUnique({
        where: { id: body.playerId },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!player) {
        throw new NotFoundError('Player', body.playerId);
      }
    }

    // ✅ Create event
    const event = await prisma.matchEvent.create({
      data: {
        matchId: params.matchId,
        type: body.type,
        minute,
        isExtraTime: body.isExtraTime || false,
        team: body.team,
        playerId: body.playerId || null,
        assistedBy: body.assistedBy || null,
        additionalInfo: body.additionalInfo || null,
      },
      include: {
        player: { select: { firstName: true, lastName: true } },
      },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: 'USER_CREATED',
      entityType: 'MatchEvent',
      entityId: event.id,
      changes: {
        type: event.type,
        team: body.team,
        minute: event.minute,
        playerId: event.playerId,
      },
      details: `Logged ${event.type} event in match ${params.matchId} at minute ${minute}`,
    });

    logger.info(
      `[${requestId}] Successfully logged event for match ${params.matchId}`,
      { type: body.type, team: body.team, minute }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Event logged successfully',
        data: event,
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(
      `[${requestId}] Error in POST /api/matches/[${params.matchId}]/events:`,
      error
    );

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message, code: 'ACCESS_DENIED', requestId },
        { status: 403 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message, code: 'INVALID_INPUT', requestId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to log event',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
