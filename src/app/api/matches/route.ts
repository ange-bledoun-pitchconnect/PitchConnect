// ============================================================================
// WORLD-CLASS ENHANCED: /src/app/api/matches/route.ts
// Match Management (List & Create) with Advanced Filtering & Analytics
// VERSION: 3.0 - Production Grade | Multi-Sport Ready
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// GET /api/matches - List Matches with Advanced Filtering
// Query Params:
//   - page: number (default: 1)
//   - limit: number (default: 25, max: 100)
//   - status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'ALL'
//   - teamId: string (filter by team - home or away)
//   - leagueId: string (filter by league)
//   - dateFrom: ISO string
//   - dateTo: ISO string
//   - sport: 'FOOTBALL' | 'NETBALL' | etc
//   - sortBy: 'date' | 'status' (default: date)
//   - sortOrder: 'asc' | 'desc' (default: desc)
// ============================================================================

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] GET /api/matches`);

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

    // ✅ Parse pagination parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10))
    );
    const skip = (page - 1) * limit;

    // ✅ Parse filter parameters
    const statusFilter = url.searchParams.get('status') || 'ALL';
    const teamId = url.searchParams.get('teamId');
    const leagueId = url.searchParams.get('leagueId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const sport = url.searchParams.get('sport');
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // ✅ Validate date parameters
    if (dateFrom) {
      try {
        new Date(dateFrom);
      } catch {
        throw new BadRequestError('Invalid dateFrom format. Use ISO 8601');
      }
    }

    if (dateTo) {
      try {
        new Date(dateTo);
      } catch {
        throw new BadRequestError('Invalid dateTo format. Use ISO 8601');
      }
    }

    // ✅ Build dynamic where clause
    const where: any = {};

    // Status filter
    if (statusFilter !== 'ALL') {
      const validStatuses = [
        'SCHEDULED',
        'LIVE',
        'HALFTIME',
        'FINISHED',
        'CANCELLED',
        'POSTPONED',
        'ABANDONED',
      ];
      if (!validStatuses.includes(statusFilter)) {
        throw new BadRequestError('Invalid status. Must be one of: ' + validStatuses.join(', '));
      }
      where.status = statusFilter;
    }

    // Team filter (home or away)
    if (teamId) {
      where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }

    // League filter
    if (leagueId) {
      where.fixture = { leagueId };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.date.lte = endDate;
      }
    }

    // Sport filter
    if (sport) {
      where.sport = sport;
    }

    // ✅ Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'status':
        orderBy = { status: sortOrder };
        break;
      case 'date':
      default:
        orderBy = { date: sortOrder };
    }

    // ✅ Get total count
    const total = await prisma.match.count({ where });

    // ✅ Fetch matches with comprehensive relationships
    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
            club: { select: { city: true, country: true } },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
            club: { select: { city: true, country: true } },
          },
        },
        referee: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
            licenseNumber: true,
          },
        },
        fixture: {
          select: {
            id: true,
            matchweek: true,
            season: true,
            league: { select: { id: true, name: true } },
          },
        },
        stats: {
          select: {
            homePossession: true,
            awayPossession: true,
            homeShots: true,
            awayShots: true,
            homeShotsOnTarget: true,
            awayShotsOnTarget: true,
          },
        },
        _count: {
          select: { events: true, playerAttendances: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // ✅ Enhance match data with calculated fields
    const enhancedMatches = matches.map((match) => {
      const homeGoals = match.homeGoals || 0;
      const awayGoals = match.awayGoals || 0;
      let result = 'PENDING';

      if (match.status === 'FINISHED') {
        if (homeGoals > awayGoals) result = 'HOME_WIN';
        else if (awayGoals > homeGoals) result = 'AWAY_WIN';
        else result = 'DRAW';
      }

      return {
        id: match.id,
        status: match.status,
        sport: match.sport,
        date: match.date,
        kickOffTime: match.kickOffTime,
        venue: match.venue,
        venueCity: match.venueCity,

        // Teams
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          code: match.homeTeam.code,
          logo: match.homeTeam.logoUrl,
          location: `${match.homeTeam.club?.city}, ${match.homeTeam.club?.country}`,
        },

        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          code: match.awayTeam.code,
          logo: match.awayTeam.logoUrl,
          location: `${match.awayTeam.club?.city}, ${match.awayTeam.club?.country}`,
        },

        // Score
        score: {
          homeGoals,
          awayGoals,
          result,
          homeGoalsET: match.homeGoalsET,
          awayGoalsET: match.awayGoalsET,
          homePenalties: match.homePenalties,
          awayPenalties: match.awayPenalties,
        },

        // Referee
        referee: match.referee
          ? {
              id: match.referee.id,
              name: `${match.referee.user.firstName} ${match.referee.user.lastName}`,
              licenseNumber: match.referee.licenseNumber,
            }
          : null,

        // Fixture
        fixture: match.fixture
          ? {
              id: match.fixture.id,
              matchweek: match.fixture.matchweek,
              season: match.fixture.season,
              league: match.fixture.league,
            }
          : null,

        // Statistics
        statistics: {
          possession: {
            home: match.stats?.homePossession,
            away: match.stats?.awayPossession,
          },
          shots: {
            home: match.stats?.homeShots,
            away: match.stats?.awayShots,
            onTarget: {
              home: match.stats?.homeShotsOnTarget,
              away: match.stats?.awayShotsOnTarget,
            },
          },
          events: match._count.events,
          attendances: match._count.playerAttendances,
        },

        // Additional info
        attendance: match.attendance,
        highlights: match.highlights,
        notes: match.notes,

        // Metadata
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      };
    });

    // ✅ Calculate pagination data
    const totalPages = Math.ceil(total / limit);

    const response = {
      success: true,
      data: {
        matches: enhancedMatches,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
        filters: {
          status: statusFilter,
          teamId: teamId || null,
          leagueId: leagueId || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          sport: sport || null,
        },
        sort: {
          sortBy,
          sortOrder,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          recordsReturned: enhancedMatches.length,
        },
      },
    };

    logger.info(`[${requestId}] Successfully retrieved ${enhancedMatches.length} matches`);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(`[${requestId}] Error in GET /api/matches:`, error);

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: error.message,
          code: 'INVALID_INPUT',
          requestId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve matches',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/matches - Create New Match
// Authorization: SUPERADMIN, LEAGUE_ADMIN, CLUB_MANAGER
// ============================================================================

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] POST /api/matches`);

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
    const isClubManager = session.user.roles?.includes('CLUB_MANAGER');

    if (!isSuperAdmin && !isLeagueAdmin && !isClubManager) {
      throw new ForbiddenError('Only SUPERADMIN, LEAGUE_ADMIN, or CLUB_MANAGER can create matches');
    }

    // ✅ Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    // ✅ Validate required fields
    if (!body.homeTeamId || !body.awayTeamId) {
      throw new BadRequestError('homeTeamId and awayTeamId are required');
    }

    if (!body.date) {
      throw new BadRequestError('date is required');
    }

    // ✅ Verify teams exist and are different
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({
        where: { id: body.homeTeamId },
        select: { id: true, name: true, sport: true, club: { select: { id: true } } },
      }),
      prisma.team.findUnique({
        where: { id: body.awayTeamId },
        select: { id: true, name: true, sport: true, club: { select: { id: true } } },
      }),
    ]);

    if (!homeTeam || !awayTeam) {
      throw new NotFoundError('One or both teams not found');
    }

    if (homeTeam.id === awayTeam.id) {
      throw new BadRequestError('A team cannot play against itself');
    }

    if (homeTeam.sport !== awayTeam.sport) {
      throw new BadRequestError('Teams must be from the same sport');
    }

    // ✅ Parse and validate date
    const matchDate = new Date(body.date);
    if (isNaN(matchDate.getTime())) {
      throw new BadRequestError('Invalid date format. Use ISO 8601');
    }

    if (matchDate < new Date()) {
      throw new BadRequestError('Match date cannot be in the past');
    }

    // ✅ Verify referee if provided
    if (body.refereeId) {
      const referee = await prisma.referee.findUnique({
        where: { id: body.refereeId },
        select: { id: true },
      });

      if (!referee) {
        throw new NotFoundError('Referee', body.refereeId);
      }
    }

    // ✅ Verify fixture if provided
    if (body.fixtureId) {
      const fixture = await prisma.fixture.findUnique({
        where: { id: body.fixtureId },
        select: { id: true },
      });

      if (!fixture) {
        throw new NotFoundError('Fixture', body.fixtureId);
      }
    }

    // ✅ Create match
    const match = await prisma.match.create({
      data: {
        homeTeamId: body.homeTeamId,
        awayTeamId: body.awayTeamId,
        fixtureId: body.fixtureId || null,
        refereeId: body.refereeId || null,
        date: matchDate,
        kickOffTime: body.kickOffTime ? new Date(body.kickOffTime) : null,
        venue: body.venue || null,
        venueCity: body.venueCity || null,
        sport: homeTeam.sport,
        status: 'SCHEDULED',
        notes: body.notes || null,
        highlights: null,
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        fixture: { select: { id: true, matchweek: true } },
      },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: 'USER_CREATED',
      entityType: 'Match',
      entityId: match.id,
      changes: {
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        date: match.date,
        venue: match.venue,
        sport: match.sport,
      },
      details: `Created match: ${match.homeTeam.name} vs ${match.awayTeam.name} on ${match.date.toISOString()}`,
    });

    logger.info(
      `[${requestId}] Successfully created match ${match.id}`,
      { homeTeam: match.homeTeam.name, awayTeam: match.awayTeam.name }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Match created successfully',
        data: match,
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(`[${requestId}] Error in POST /api/matches:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
          code: 'NOT_FOUND',
          requestId,
        },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: error.message,
          code: 'ACCESS_DENIED',
          requestId,
        },
        { status: 403 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: error.message,
          code: 'INVALID_INPUT',
          requestId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create match',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
