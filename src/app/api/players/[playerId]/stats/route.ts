// ============================================================================
// WORLD-CLASS ENHANCED: /src/app/api/players/[playerId]/stats/route.ts
// Player Statistics with Seasonal & Comparative Analytics
// VERSION: 3.0 - Production Grade
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

interface StatsParams {
  params: { playerId: string };
}

// ============================================================================
// GET /api/players/[playerId]/stats - Get Player Statistics
// Query Params:
//   - season: number (optional, defaults to current year)
//   - teamId: string (optional, filter by team)
//   - period: 'season' | 'range' (optional)
//   - limit: number (optional, max 20, defaults to 5)
// ============================================================================

export async function GET(request: NextRequest, { params }: StatsParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] GET /api/players/[${params.playerId}]/stats`);

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

    // ✅ Validate player exists
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      select: { id: true, firstName: true, lastName: true, position: true },
    });

    if (!player) {
      throw new NotFoundError('Player', params.playerId);
    }

    // ✅ Parse query parameters
    const url = new URL(request.url);
    const season = url.searchParams.get('season')
      ? parseInt(url.searchParams.get('season')!, 10)
      : new Date().getFullYear();
    const teamId = url.searchParams.get('teamId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '5', 10), 20);

    // ✅ Validate season
    const currentYear = new Date().getFullYear();
    if (season < currentYear - 10 || season > currentYear + 1) {
      throw new BadRequestError('Season must be within valid range (last 10 years)', {
        validRange: `${currentYear - 10}-${currentYear + 1}`,
        requested: season,
      });
    }

    // ✅ Build dynamic where clause
    const whereClause: any = { playerId: params.playerId };

    if (season === -1) {
      // Special case: get all seasons
    } else {
      whereClause.season = season;
    }

    if (teamId) {
      whereClause.teamId = teamId;
    }

    // ✅ Fetch stats with optimized query
    const stats = await prisma.playerStats.findMany({
      where: whereClause,
      orderBy: { season: 'desc' },
      take: limit,
      select: {
        id: true,
        season: true,
        teamId: true,
        appearances: true,
        goals: true,
        assists: true,
        minutesPlayed: true,
        passingAccuracy: true,
        passes: true,
        passesCompleted: true,
        tackles: true,
        interceptions: true,
        clearances: true,
        blocks: true,
        shotsOnTarget: true,
        totalShots: true,
        expectedGoals: true,
        expectedAssists: true,
        sprintDistance: true,
        topSpeed: true,
        acceleration: true,
        jumpHeight: true,
        dribbles: true,
        foulsCommitted: true,
        foulsDrawn: true,
        yellowCards: true,
        redCards: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ✅ Calculate derived metrics for each season
    const enhancedStats = stats.map((s) => ({
      ...s,
      // Offensive metrics
      goalsPerMatch: s.appearances > 0 ? (s.goals / s.appearances).toFixed(2) : '0.00',
      assistsPerMatch: s.appearances > 0 ? (s.assists / s.appearances).toFixed(2) : '0.00',
      minutesPerAppearance: s.appearances > 0 ? Math.round(s.minutesPlayed / s.appearances) : 0,
      totalContributions: s.goals + s.assists,
      contributionsPerMatch:
        s.appearances > 0
          ? ((s.goals + s.assists) / s.appearances).toFixed(2)
          : '0.00',

      // Shooting metrics
      shotsPerMatch: s.totalShots && s.appearances > 0 ? (s.totalShots / s.appearances).toFixed(2) : null,
      shotAccuracy: s.totalShots ? ((s.shotsOnTarget || 0) / s.totalShots * 100).toFixed(1) : null,
      xGPerMatch: s.expectedGoals && s.appearances > 0 ? (s.expectedGoals / s.appearances).toFixed(2) : null,
      overPerformingxG: s.expectedGoals ? (s.goals - s.expectedGoals).toFixed(2) : null,

      // Passing metrics
      passCompletionRate: s.passes ? ((s.passesCompleted || 0) / s.passes * 100).toFixed(1) : null,
      passesPerMatch: s.appearances > 0 ? (s.passes / s.appearances).toFixed(0) : null,

      // Defensive metrics
      tacklesPerMatch: s.tackles && s.appearances > 0 ? (s.tackles / s.appearances).toFixed(2) : null,
      interceptionsPerMatch: s.interceptions && s.appearances > 0 ? (s.interceptions / s.appearances).toFixed(2) : null,

      // Discipline
      cardsPerMatch:
        (s.yellowCards || 0) + (s.redCards || 0) > 0 && s.appearances > 0
          ? (((s.yellowCards || 0) + (s.redCards || 0)) / s.appearances).toFixed(2)
          : '0.00',

      // Physical metrics (if available)
      physicalMetrics: {
        sprintDistance: s.sprintDistance,
        topSpeed: s.topSpeed,
        acceleration: s.acceleration,
        jumpHeight: s.jumpHeight,
      },
    }));

    // ✅ Build comprehensive response
    const response = {
      success: true,
      data: {
        player: {
          id: player.id,
          name: `${player.firstName} ${player.lastName}`,
          position: player.position,
        },
        stats: enhancedStats,
        summary: {
          totalSeasons: stats.length,
          selectedSeason: season,
          totalAppearances: stats.reduce((sum, s) => sum + s.appearances, 0),
          totalGoals: stats.reduce((sum, s) => sum + s.goals, 0),
          totalAssists: stats.reduce((sum, s) => sum + s.assists, 0),
          totalMinutes: stats.reduce((sum, s) => sum + s.minutesPlayed, 0),
          careerContributions: stats.reduce((sum, s) => sum + s.goals + s.assists, 0),
          bestSeason: stats.length > 0 ? stats[0].season : null,
          bestSeasonGoals: stats.length > 0 ? stats[0].goals : null,
        },
        query: {
          season: season === -1 ? 'all' : season,
          teamId: teamId || null,
          limit,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          recordsReturned: enhancedStats.length,
        },
      },
    };

    logger.info(
      `[${requestId}] Successfully retrieved stats for player ${params.playerId}`,
      { seasons: stats.length, season }
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(`[${requestId}] Error in GET /api/players/[${params.playerId}]/stats:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'PLAYER_NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: 'Bad Request', message: (error as any).message, code: 'INVALID_INPUT', requestId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve statistics',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/players/[playerId]/stats - Create or Update Statistics
// Authorization: SUPERADMIN, COACH, ANALYST
// ============================================================================

export async function POST(request: NextRequest, { params }: StatsParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] POST /api/players/[${params.playerId}]/stats`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required', code: 'AUTH_REQUIRED', requestId },
        { status: 401 }
      );
    }

    // ✅ Authorization
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isCoach = session.user.roles?.includes('COACH');
    const isAnalyst = session.user.roles?.includes('ANALYST');

    if (!isSuperAdmin && !isCoach && !isAnalyst) {
      throw new ForbiddenError(
        'Only SUPERADMIN, COACH, or ANALYST can create/update statistics'
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
    if (!body.season) {
      throw new BadRequestError('season is required');
    }

    const season = parseInt(body.season, 10);
    const currentYear = new Date().getFullYear();

    if (season < currentYear - 10 || season > currentYear + 1) {
      throw new BadRequestError('season must be within valid range');
    }

    // ✅ Validate player exists
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      select: { id: true },
    });

    if (!player) {
      throw new NotFoundError('Player', params.playerId);
    }

    // ✅ Check if stats already exist
    const existing = await prisma.playerStats.findFirst({
      where: {
        playerId: params.playerId,
        season,
        teamId: body.teamId || null,
      },
    });

    // ✅ Prepare stats data with validation
    const statsData = {
      appearances: body.appearances ? Math.max(0, parseInt(body.appearances, 10)) : 0,
      goals: body.goals ? Math.max(0, parseInt(body.goals, 10)) : 0,
      assists: body.assists ? Math.max(0, parseInt(body.assists, 10)) : 0,
      minutesPlayed: body.minutesPlayed ? Math.max(0, parseInt(body.minutesPlayed, 10)) : 0,
      passingAccuracy: body.passingAccuracy ? parseFloat(body.passingAccuracy) : undefined,
      passes: body.passes ? Math.max(0, parseInt(body.passes, 10)) : undefined,
      passesCompleted: body.passesCompleted ? Math.max(0, parseInt(body.passesCompleted, 10)) : undefined,
      tackles: body.tackles ? Math.max(0, parseInt(body.tackles, 10)) : undefined,
      interceptions: body.interceptions ? Math.max(0, parseInt(body.interceptions, 10)) : undefined,
      clearances: body.clearances ? Math.max(0, parseInt(body.clearances, 10)) : undefined,
      blocks: body.blocks ? Math.max(0, parseInt(body.blocks, 10)) : undefined,
      shotsOnTarget: body.shotsOnTarget ? Math.max(0, parseInt(body.shotsOnTarget, 10)) : undefined,
      totalShots: body.totalShots ? Math.max(0, parseInt(body.totalShots, 10)) : undefined,
      expectedGoals: body.expectedGoals ? parseFloat(body.expectedGoals) : undefined,
      expectedAssists: body.expectedAssists ? parseFloat(body.expectedAssists) : undefined,
      sprintDistance: body.sprintDistance ? parseFloat(body.sprintDistance) : undefined,
      topSpeed: body.topSpeed ? parseFloat(body.topSpeed) : undefined,
      acceleration: body.acceleration ? parseFloat(body.acceleration) : undefined,
      jumpHeight: body.jumpHeight ? parseFloat(body.jumpHeight) : undefined,
      dribbles: body.dribbles ? Math.max(0, parseInt(body.dribbles, 10)) : undefined,
      foulsCommitted: body.foulsCommitted ? Math.max(0, parseInt(body.foulsCommitted, 10)) : undefined,
      foulsDrawn: body.foulsDrawn ? Math.max(0, parseInt(body.foulsDrawn, 10)) : undefined,
      yellowCards: body.yellowCards ? Math.max(0, parseInt(body.yellowCards, 10)) : undefined,
      redCards: body.redCards ? Math.max(0, parseInt(body.redCards, 10)) : undefined,
    };

    let stats;
    const action = existing ? 'UPDATE' : 'CREATE';

    if (existing) {
      stats = await prisma.playerStats.update({
        where: { id: existing.id },
        data: statsData,
      });
    } else {
      stats = await prisma.playerStats.create({
        data: {
          playerId: params.playerId,
          season,
          teamId: body.teamId || null,
          ...statsData,
        },
      });
    }

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: action === 'CREATE' ? 'USER_CREATED' : 'USER_UPDATED',
      entityType: 'PlayerStats',
      entityId: stats.id,
      changes: statsData,
      details: `${action} player statistics for season ${season}`,
    });

    logger.info(
      `[${requestId}] Successfully ${action} stats for player ${params.playerId}`,
      { season, action }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Statistics ${action === 'CREATE' ? 'created' : 'updated'} successfully`,
        action,
        data: stats,
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: action === 'CREATE' ? 201 : 200 }
    );
  } catch (error) {
    logger.error(`[${requestId}] Error in POST /api/players/[${params.playerId}]/stats:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'PLAYER_NOT_FOUND', requestId },
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
        message: 'Failed to create/update statistics',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
