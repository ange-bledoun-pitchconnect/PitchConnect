// 1: MATCH MANAGEMENT APIs 
// Path: src/app/api/matches/route.ts
// Complete endpoint for POST /api/matches and GET /api/matches

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError, ValidationError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MatchParams {
  homeTeamId: string;
  awayTeamId: string;
  leagueId: string;
  venueId?: string;
  scheduledDate: string;
  sport: 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL' | 'BASKETBALL';
  matchType?: 'LEAGUE' | 'CUP' | 'FRIENDLY' | 'PLAYOFF';
  notes?: string;
}

interface MatchResponse {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    logo?: string;
  };
  league: {
    id: string;
    name: string;
  };
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
  date: string;
  sport: string;
  matchType: string;
  venue?: string;
  attendance?: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
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
  details?: string;
}

interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
  pagination?: PaginationInfo;
  timestamp: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateSport(sport: string): boolean {
  const validSports = ['FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL', 'BASKETBALL'];
  return validSports.includes(sport.toUpperCase());
}

function validateMatchType(type: string): boolean {
  const validTypes = ['LEAGUE', 'CUP', 'FRIENDLY', 'PLAYOFF'];
  return validTypes.includes(type.toUpperCase());
}

function validatePaginationParams(page: string | null, limit: string | null) {
  const parsedPage = Math.max(1, parseInt(page || '1', 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
}

function validateDateFormat(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// ============================================================================
// GET HANDLER: List Matches with Advanced Filtering
// ============================================================================

/**
 * GET /api/matches
 * Query Parameters:
 * - leagueId: Filter by league
 * - teamId: Filter by team (home or away)
 * - status: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
 * - sport: FOOTBALL, NETBALL, RUGBY, CRICKET, AMERICAN_FOOTBALL, BASKETBALL
 * - dateFrom: ISO 8601 date
 * - dateTo: ISO 8601 date
 * - page: Page number (default 1)
 * - limit: Results per page (default 20, max 100)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    logger.info(`[${requestId}] GET /api/matches - Start`);

    // 1. AUTHORIZATION CHECK
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'AUTH_REQUIRED',
        } as ErrorResponse,
        {
          status: 401,
          headers: { 'X-Request-ID': requestId },
        }
      );
    }

    // 2. PARSE & VALIDATE PARAMETERS
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = validatePaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    );

    // Build dynamic filter
    const filter: any = {};
    
    const leagueId = searchParams.get('leagueId');
    if (leagueId) filter.leagueId = leagueId;

    const teamId = searchParams.get('teamId');
    if (teamId) {
      filter.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }

    const status = searchParams.get('status');
    if (status && ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      filter.status = status;
    }

    const sport = searchParams.get('sport');
    if (sport && validateSport(sport)) {
      filter.sport = sport.toUpperCase();
    }

    // Date range filtering
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom && validateDateFormat(dateFrom)) {
        filter.date.gte = new Date(dateFrom);
      }
      if (dateTo && validateDateFormat(dateTo)) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire day
        filter.date.lte = toDate;
      }
    }

    // 3. FETCH MATCHES WITH OPTIMIZATION
    const [matches, totalCount] = await Promise.all([
      prisma.match.findMany({
        where: filter,
        include: {
          homeTeam: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          league: {
            select: {
              id: true,
              name: true,
            },
          },
          venue: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: limit,
        skip,
      }),
      prisma.match.count({ where: filter }),
    ]);

    // 4. LOG TO AUDIT TRAIL
    await logAuditAction(
      session.user.id,
      null,
      'DATA_EXPORTED',
      {
        action: 'matches_list_accessed',
        requestId,
        filters: {
          leagueId: searchParams.get('leagueId'),
          teamId: searchParams.get('teamId'),
          status: searchParams.get('status'),
          sport: searchParams.get('sport'),
        },
        resultCount: matches.length,
        page,
        limit,
        timestamp: new Date().toISOString(),
      }
    );

    // 5. BUILD RESPONSE
    const pagination: PaginationInfo = {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      hasMore: page < Math.ceil(totalCount / limit),
    };

    const response: SuccessResponse<MatchResponse[]> = {
      success: true,
      data: matches.map((match) => ({
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        status: match.status,
        date: match.date.toISOString(),
        sport: match.sport,
        matchType: match.matchType,
        venue: match.venue?.name,
        attendance: match.attendance,
        duration: match.duration,
        createdAt: match.createdAt.toISOString(),
        updatedAt: match.updatedAt.toISOString(),
      })),
      pagination,
      timestamp: new Date().toISOString(),
    };

    const duration = performance.now() - startTime;
    logger.info(`[${requestId}] GET /api/matches - Success`, {
      resultCount: matches.length,
      duration: Math.round(duration),
      userId: session.user.id,
      page,
      totalPages: pagination.pages,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`[${requestId}] GET /api/matches - Error`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Math.round(duration),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch matches',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      } as ErrorResponse,
      {
        status: 500,
        headers: { 'X-Request-ID': requestId },
      }
    );
  }
}

// ============================================================================
// POST HANDLER: Create New Match
// ============================================================================

/**
 * POST /api/matches
 * Body:
 * {
 *   "homeTeamId": "string",
 *   "awayTeamId": "string",
 *   "leagueId": "string",
 *   "venueId": "string (optional)",
 *   "scheduledDate": "ISO 8601 datetime",
 *   "sport": "FOOTBALL|NETBALL|RUGBY|CRICKET|AMERICAN_FOOTBALL|BASKETBALL",
 *   "matchType": "LEAGUE|CUP|FRIENDLY|PLAYOFF (optional)",
 *   "notes": "string (optional)"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    logger.info(`[${requestId}] POST /api/matches - Start`);

    // 1. AUTHORIZATION CHECK
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'AUTH_REQUIRED',
        } as ErrorResponse,
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Check if user is authorized to create matches (MANAGER, LEAGUE_ADMIN, SUPER_ADMIN)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true, id: true },
    });

    if (!user || !user.roles?.some((r) => ['MANAGER', 'LEAGUE_ADMIN', 'SUPER_ADMIN'].includes(r))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions to create matches',
          code: 'FORBIDDEN',
        } as ErrorResponse,
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. PARSE & VALIDATE REQUEST BODY
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'BAD_REQUEST',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { homeTeamId, awayTeamId, leagueId, venueId, scheduledDate, sport, matchType = 'LEAGUE', notes } = body;

    // Validate required fields
    if (!homeTeamId) throw new BadRequestError('homeTeamId is required');
    if (!awayTeamId) throw new BadRequestError('awayTeamId is required');
    if (!leagueId) throw new BadRequestError('leagueId is required');
    if (!scheduledDate) throw new BadRequestError('scheduledDate is required');
    if (!sport) throw new BadRequestError('sport is required');

    // Validate sport
    if (!validateSport(sport)) {
      throw new BadRequestError(`Invalid sport. Must be one of: FOOTBALL, NETBALL, RUGBY, CRICKET, AMERICAN_FOOTBALL, BASKETBALL`);
    }

    // Validate match type
    if (!validateMatchType(matchType)) {
      throw new BadRequestError('Invalid matchType. Must be one of: LEAGUE, CUP, FRIENDLY, PLAYOFF');
    }

    // Validate date format
    if (!validateDateFormat(scheduledDate)) {
      throw new BadRequestError('Invalid scheduledDate format. Use ISO 8601 format');
    }

    const matchDate = new Date(scheduledDate);
    if (matchDate < new Date()) {
      throw new BadRequestError('Match date cannot be in the past');
    }

    // Validate teams exist and are different
    if (homeTeamId === awayTeamId) {
      throw new BadRequestError('Home team and away team must be different');
    }

    const [homeTeam, awayTeam, league] = await Promise.all([
      prisma.team.findUnique({ where: { id: homeTeamId }, select: { id: true, name: true } }),
      prisma.team.findUnique({ where: { id: awayTeamId }, select: { id: true, name: true } }),
      prisma.league.findUnique({ where: { id: leagueId }, select: { id: true, name: true } }),
    ]);

    if (!homeTeam) throw new NotFoundError('Home team', homeTeamId);
    if (!awayTeam) throw new NotFoundError('Away team', awayTeamId);
    if (!league) throw new NotFoundError('League', leagueId);

    // Validate venue if provided
    let venue = null;
    if (venueId) {
      venue = await prisma.venue.findUnique({
        where: { id: venueId },
        select: { id: true, name: true },
      });
      if (!venue) throw new NotFoundError('Venue', venueId);
    }

    // 3. CHECK FOR DUPLICATE MATCHES (Same teams on same date)
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          {
            AND: [
              { homeTeamId },
              { awayTeamId },
              { date: { gte: new Date(matchDate.getTime() - 86400000), lte: new Date(matchDate.getTime() + 86400000) } },
            ],
          },
        ],
      },
    });

    if (existingMatch) {
      throw new BadRequestError('A match between these teams already exists on this date');
    }

    // 4. CREATE MATCH
    const newMatch = await prisma.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        leagueId,
        venueId: venueId || undefined,
        date: matchDate,
        sport: sport.toUpperCase() as any,
        matchType: matchType.toUpperCase() as any,
        status: 'SCHEDULED',
        notes: notes || undefined,
      },
      include: {
        homeTeam: { select: { id: true, name: true, logo: true } },
        awayTeam: { select: { id: true, name: true, logo: true } },
        league: { select: { id: true, name: true } },
        venue: { select: { name: true } },
      },
    });

    // 5. LOG AUDIT ACTION
    await logAuditAction(
      session.user.id,
      null,
      'MATCH_CREATED',
      {
        matchId: newMatch.id,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        league: league.name,
        date: matchDate.toISOString(),
        sport,
        matchType,
        requestId,
      }
    );

    const duration = performance.now() - startTime;
    const response: SuccessResponse<MatchResponse> = {
      success: true,
      data: {
        id: newMatch.id,
        homeTeam: newMatch.homeTeam,
        awayTeam: newMatch.awayTeam,
        league: newMatch.league,
        homeGoals: newMatch.homeGoals,
        awayGoals: newMatch.awayGoals,
        status: newMatch.status,
        date: newMatch.date.toISOString(),
        sport: newMatch.sport,
        matchType: newMatch.matchType,
        venue: newMatch.venue?.name,
        createdAt: newMatch.createdAt.toISOString(),
        updatedAt: newMatch.updatedAt.toISOString(),
      },
      message: 'Match created successfully',
      timestamp: new Date().toISOString(),
    };

    logger.info(`[${requestId}] POST /api/matches - Success`, {
      matchId: newMatch.id,
      duration: Math.round(duration),
      userId: session.user.id,
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

    if (error instanceof BadRequestError) {
      logger.warn(`[${requestId}] POST /api/matches - Validation Error`, {
        message: error.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (error instanceof NotFoundError) {
      logger.warn(`[${requestId}] POST /api/matches - Not Found`, {
        message: error.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'NOT_FOUND',
        } as ErrorResponse,
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    logger.error(`[${requestId}] POST /api/matches - Error`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Math.round(duration),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create match',
        code: 'INTERNAL_ERROR',
      } as ErrorResponse,
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}