// ============================================================================
// 🏆 ENHANCED: src/app/api/matches/route.ts
// GET - List matches with advanced filtering | POST - Create match
// VERSION: 3.5 - World-Class Enhanced
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, validateRequired } from '@/lib/api/validation';
import { errorResponse } from '@/lib/api/responses';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logResourceCreated, createAuditLog } from '@/lib/api/audit';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CreateMatchRequest {
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  kickOffTime?: string;
  venue?: string;
  venueCity?: string;
  fixtureId?: string;
  refereeId?: string;
  notes?: string;
}

interface MatchListItem {
  id: string;
  status: string;
  sport: string;
  date: string;
  kickOffTime: string | null;
  venue: string | null;
  venueCity: string | null;
  homeTeam: {
    id: string;
    name: string;
    code: string;
    logo: string | null;
    location: string;
  };
  awayTeam: {
    id: string;
    name: string;
    code: string;
    logo: string | null;
    location: string;
  };
  score: {
    homeGoals: number | null;
    awayGoals: number | null;
    result: string;
  };
  referee: {
    id: string;
    name: string;
    license: string;
  } | null;
  fixture: {
    id: string;
    matchweek: number;
    season: number;
    league: {
      id: string;
      name: string;
    };
  } | null;
  statistics: {
    possession: { home: number | null; away: number | null };
    shots: { home: number | null; away: number | null };
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateMatchResponse {
  success: true;
  id: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  date: string;
  venue: string | null;
  status: string;
  sport: string;
  message: string;
  timestamp: string;
  requestId: string;
}

interface MatchesListResponse {
  success: true;
  matches: MatchListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: Record<string, any>;
  sort: Record<string, any>;
  timestamp: string;
  requestId: string;
}

// ============================================================================
// GET /api/matches - List Matches
// ============================================================================

/**
 * GET /api/matches
 * List matches with comprehensive filtering and pagination
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 25, max: 100)
 *   - status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'POSTPONED' | 'ALL'
 *   - teamId: string (filter by team - home or away)
 *   - leagueId: string (filter by league)
 *   - dateFrom: ISO string (start date)
 *   - dateTo: ISO string (end date)
 *   - sport: string (FOOTBALL, NETBALL, RUGBY, etc.)
 *   - sortBy: 'date' | 'status' (default: 'date')
 *   - sortOrder: 'asc' | 'desc' (default: 'desc')
 * 
 * Authorization: Any authenticated user
 * 
 * Returns: 200 OK with paginated matches
 * 
 * Features:
 *   ✅ Advanced filtering by status, team, league, date, sport
 *   ✅ Date range filtering
 *   ✅ Flexible sorting
 *   ✅ Rich match metadata
 *   ✅ Statistics included
 */
export async function GET(request: NextRequest): Promise<NextResponse<MatchesListResponse | { success: false; error: string; code: string; requestId: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    // 3. Extract filter parameters
    const statusFilter = searchParams.get('status') || 'ALL';
    const teamId = searchParams.get('teamId');
    const leagueId = searchParams.get('leagueId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sport = searchParams.get('sport');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // 4. Validate date parameters
    if (dateFrom) {
      try {
        new Date(dateFrom);
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid dateFrom format. Use ISO 8601 (YYYY-MM-DD)',
            code: 'INVALID_DATE_FORMAT',
            requestId,
          },
          { status: 400, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    if (dateTo) {
      try {
        new Date(dateTo);
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid dateTo format. Use ISO 8601 (YYYY-MM-DD)',
            code: 'INVALID_DATE_FORMAT',
            requestId,
          },
          { status: 400, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    // 5. Build where clause
    const where: any = {};

    // Status filter
    const validStatuses = ['SCHEDULED', 'LIVE', 'HALFTIME', 'FINISHED', 'CANCELLED', 'POSTPONED', 'ABANDONED'];
    if (statusFilter !== 'ALL') {
      if (!validStatuses.includes(statusFilter)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}, or ALL`,
            code: 'INVALID_STATUS',
            requestId,
          },
          { status: 400, headers: { 'X-Request-ID': requestId } }
        );
      }
      where.status = statusFilter;
    }

    // Team filter (home or away)
    if (teamId) {
      where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }

    // League filter (via fixture)
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

    // 6. Determine sort order
    const orderBy: any = {};
    if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy.date = sortOrder;
    }

    // 7. Get total count
    const total = await prisma.match.count({ where });
    const totalPages = Math.ceil(total / limit);

    // 8. Fetch matches with relationships
    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            logo: true,
            club: { select: { city: true, country: true } },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            logo: true,
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
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // 9. Format matches
    const formattedMatches: MatchListItem[] = matches.map((match) => {
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
        date: match.date.toISOString(),
        kickOffTime: match.kickOffTime?.toISOString() || null,
        venue: match.venue,
        venueCity: match.venueCity,
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          code: match.homeTeam.shortCode,
          logo: match.homeTeam.logo,
          location: `${match.homeTeam.club?.city || 'Unknown'}, ${match.homeTeam.club?.country}`,
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          code: match.awayTeam.shortCode,
          logo: match.awayTeam.logo,
          location: `${match.awayTeam.club?.city || 'Unknown'}, ${match.awayTeam.club?.country}`,
        },
        score: {
          homeGoals,
          awayGoals,
          result,
        },
        referee: match.referee
          ? {
              id: match.referee.id,
              name: `${match.referee.user.firstName} ${match.referee.user.lastName}`,
              license: match.referee.licenseNumber || 'N/A',
            }
          : null,
        fixture: match.fixture
          ? {
              id: match.fixture.id,
              matchweek: match.fixture.matchweek,
              season: match.fixture.season,
              league: match.fixture.league,
            }
          : null,
        statistics: {
          possession: {
            home: match.stats?.homePossession,
            away: match.stats?.awayPossession,
          },
          shots: {
            home: match.stats?.homeShots,
            away: match.stats?.awayShots,
          },
        },
        createdAt: match.createdAt.toISOString(),
        updatedAt: match.updatedAt.toISOString(),
      };
    });

    // 10. Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'MATCHESVIEWED',
      resourceType: 'Match',
      details: {
        filters: {
          status: statusFilter,
          teamId: teamId || 'all',
          leagueId: leagueId || 'all',
          sport: sport || 'all',
        },
        pageSize: limit,
        currentPage: page,
        totalMatches: total,
      },
      requestId,
    });

    // 11. Build response
    const response: MatchesListResponse = {
      success: true,
      matches: formattedMatches,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
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
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[GET /api/matches]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}

// ============================================================================
// POST /api/matches - Create Match
// ============================================================================

/**
 * POST /api/matches
 * Create a new match
 * 
 * Authorization: SUPERADMIN, LEAGUE_ADMIN, CLUB_MANAGER
 * 
 * Request Body:
 *   Required:
 *     - homeTeamId: string
 *     - awayTeamId: string
 *     - date: ISO string (future date)
 *   
 *   Optional:
 *     - kickOffTime: ISO string
 *     - venue: string
 *     - venueCity: string
 *     - fixtureId: string
 *     - refereeId: string
 *     - notes: string
 * 
 * Returns: 201 Created with match details
 * 
 * Features:
 *   ✅ Multi-role authorization
 *   ✅ Team validation
 *   ✅ Date validation
 *   ✅ Transaction support
 *   ✅ Comprehensive audit logging
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateMatchResponse | { success: false; error: string; code: string; requestId: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN');
    const isClubManager = session.user.roles?.includes('CLUB_MANAGER');

    if (!isSuperAdmin && !isLeagueAdmin && !isClubManager) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only SUPERADMIN, LEAGUE_ADMIN, or CLUB_MANAGER can create matches',
          code: 'INSUFFICIENT_PERMISSIONS',
          requestId,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Parse request body
    let body: CreateMatchRequest;
    try {
      body = await parseJsonBody(request);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Validate required fields
    validateRequired(body, ['homeTeamId', 'awayTeamId', 'date']);

    // 5. Verify both teams exist and are different
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

    if (!homeTeam) {
      return NextResponse.json(
        {
          success: false,
          error: `Home team "${body.homeTeamId}" not found`,
          code: 'HOME_TEAM_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (!awayTeam) {
      return NextResponse.json(
        {
          success: false,
          error: `Away team "${body.awayTeamId}" not found`,
          code: 'AWAY_TEAM_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (homeTeam.id === awayTeam.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'A team cannot play against itself',
          code: 'INVALID_MATCH_SETUP',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (homeTeam.sport !== awayTeam.sport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Teams must be from the same sport',
          code: 'SPORT_MISMATCH',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 6. Validate match date
    const matchDate = new Date(body.date);
    if (isNaN(matchDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use ISO 8601 (YYYY-MM-DDTHH:mm:ss)',
          code: 'INVALID_DATE_FORMAT',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (matchDate < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Match date cannot be in the past',
          code: 'INVALID_DATE',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 7. Verify referee if provided
    if (body.refereeId) {
      const referee = await prisma.referee.findUnique({
        where: { id: body.refereeId },
        select: { id: true },
      });

      if (!referee) {
        return NextResponse.json(
          {
            success: false,
            error: `Referee "${body.refereeId}" not found`,
            code: 'REFEREE_NOT_FOUND',
            requestId,
          },
          { status: 404, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    // 8. Verify fixture if provided
    if (body.fixtureId) {
      const fixture = await prisma.fixture.findUnique({
        where: { id: body.fixtureId },
        select: { id: true },
      });

      if (!fixture) {
        return NextResponse.json(
          {
            success: false,
            error: `Fixture "${body.fixtureId}" not found`,
            code: 'FIXTURE_NOT_FOUND',
            requestId,
          },
          { status: 404, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    // 9. Create match with transaction
    const match = await prisma.$transaction(async (tx) => {
      return await tx.match.create({
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
        },
      });
    });

    // 10. Create audit log
    await logResourceCreated(
      session.user.id,
      'Match',
      match.id,
      `${homeTeam.name} vs ${awayTeam.name}`,
      {
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        date: matchDate.toISOString(),
        venue: body.venue || 'TBD',
        sport: homeTeam.sport,
      },
      `Created match: ${homeTeam.name} vs ${awayTeam.name}`
    );

    // 11. Build response
    const response: CreateMatchResponse = {
      success: true,
      id: match.id,
      homeTeam: { id: homeTeam.id, name: homeTeam.name },
      awayTeam: { id: awayTeam.id, name: awayTeam.name },
      date: match.date.toISOString(),
      venue: match.venue,
      status: match.status,
      sport: match.sport,
      message: `Match "${homeTeam.name} vs ${awayTeam.name}" created successfully`,
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 201,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[POST /api/matches]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}
