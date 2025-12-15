// src/app/api/fixtures/route.ts
// ============================================================================
// FIXTURES MANAGEMENT ENDPOINT
// Enhanced for PitchConnect Multi-Sport Management Platform
// ============================================================================
// GET - List fixtures with advanced filtering, pagination, and sorting
// POST - Create fixtures for league with transaction support
// VERSION: 4.0 - World-Class Enhanced with full type safety
// ============================================================================

'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiResponse } from '@/lib/api/responses';
import { ApiError } from '@/lib/api/errors';
import prisma from '@/lib/prisma';
import { Sport, MatchStatus, FixtureStatus } from '@prisma/client';
import { z } from 'zod';
import {
  logApiRequest,
  handleApiError,
  validateUserLeagueAccess,
  calculateAge,
  validateMatchResult,
} from '@/lib/api/helpers';

// ============================================================================
// TYPE DEFINITIONS & VALIDATION SCHEMAS
// ============================================================================

/**
 * Fixture list query parameters
 */
interface FixtureListQuery {
  page: number;
  limit: number;
  leagueId?: string;
  matchweek?: number;
  season?: number;
  status?: FixtureStatus;
  sortBy: 'matchweek' | 'date' | 'season';
  sortOrder: 'asc' | 'desc';
  sport?: Sport;
}

/**
 * Match in fixture list response
 */
interface FixtureMatchItem {
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
  scheduledDate: string | null;
  venue?: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  status: MatchStatus;
  attendance?: number;
}

/**
 * Fixture list item response
 */
interface FixtureListItem {
  id: string;
  leagueId: string;
  league: {
    id: string;
    name: string;
    season: string;
    sport: Sport;
  };
  matchweek: number;
  season: number;
  status: FixtureStatus;
  matchCount: number;
  completedMatches: number;
  pendingMatches: number;
  matches: FixtureMatchItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination metadata
 */
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * GET /api/fixtures response
 */
interface FixturesListResponse {
  success: true;
  data: FixtureListItem[];
  pagination: PaginationMeta;
  filters: {
    leagueId?: string;
    matchweek?: number;
    season?: number;
    status?: FixtureStatus;
    sport?: Sport;
  };
  meta: {
    timestamp: string;
    requestId: string;
    resultCount: number;
  };
}

/**
 * Create fixture request validation schema
 */
const createFixtureRequestSchema = z.object({
  leagueId: z.string().uuid('Invalid league ID format'),
  matchweek: z
    .number()
    .int('Matchweek must be integer')
    .min(1, 'Matchweek must be at least 1')
    .max(52, 'Matchweek cannot exceed 52'),
  season: z
    .number()
    .int('Season must be integer')
    .min(1900, 'Invalid season')
    .max(new Date().getFullYear() + 5, 'Season too far in future'),
  fixtures: z
    .array(
      z.object({
        homeTeamId: z.string().uuid('Invalid home team ID'),
        awayTeamId: z.string().uuid('Invalid away team ID'),
        scheduledDate: z.string().datetime().optional(),
        venue: z.string().max(255).optional(),
      }),
    )
    .min(1, 'At least one fixture is required')
    .optional(),
  dryRun: z.boolean().optional().default(false),
});

type CreateFixtureRequest = z.infer<typeof createFixtureRequestSchema>;

/**
 * POST /api/fixtures response
 */
interface CreateFixtureResponse {
  success: true;
  data: {
    fixtureId: string;
    leagueId: string;
    league: {
      id: string;
      name: string;
      sport: Sport;
      season: string;
    };
    matchweek: number;
    season: number;
    status: FixtureStatus;
    matchesCreated: number;
    matches: Array<{
      id: string;
      homeTeam: { id: string; name: string };
      awayTeam: { id: string; name: string };
      status: MatchStatus;
    }>;
  };
  meta: {
    timestamp: string;
    requestId: string;
    dryRun: boolean;
  };
}

// ============================================================================
// GET /api/fixtures - List Fixtures
// ============================================================================

/**
 * GET /api/fixtures
 * List league fixtures with advanced filtering and pagination
 *
 * Query Parameters:
 *   - page: number (default: 1, min: 1)
 *   - limit: number (default: 20, max: 100)
 *   - leagueId: string (filter by league)
 *   - matchweek: number (filter by specific matchweek)
 *   - season: number (filter by season)
 *   - status: 'PENDING' | 'ONGOING' | 'COMPLETED' (filter by status)
 *   - sport: 'FOOTBALL' | 'NETBALL' | etc. (filter by sport)
 *   - sortBy: 'matchweek' | 'date' | 'season' (default: 'matchweek')
 *   - sortOrder: 'asc' | 'desc' (default: 'asc')
 *
 * Authorization: Any authenticated user (can see own league fixtures)
 *
 * Returns: 200 OK with paginated fixture list
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<FixturesListResponse | { success: false; error: any }>> {
  const requestId = crypto.randomUUID();

  try {
    // ========== AUTHENTICATION ==========
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        ApiError.unauthorized('Authentication required'),
        { status: 401 },
      );
    }

    logApiRequest('GET', '/api/fixtures', requestId, {
      userId: session.user.id,
    });

    // ========== PARSE QUERY PARAMETERS ==========
    const { searchParams } = new URL(req.url);

    const page = Math.max(
      1,
      parseInt(searchParams.get('page') || '1', 10),
    );
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '20', 10)),
    );
    const skip = (page - 1) * limit;

    const leagueId = searchParams.get('leagueId') || undefined;
    const matchweek = searchParams.get('matchweek')
      ? parseInt(searchParams.get('matchweek')!, 10)
      : undefined;
    const season = searchParams.get('season')
      ? parseInt(searchParams.get('season')!, 10)
      : undefined;
    const status = (searchParams.get('status') || 'PENDING') as FixtureStatus;
    const sport = searchParams.get('sport') as Sport | null;
    const sortBy =
      (searchParams.get('sortBy') as 'matchweek' | 'date' | 'season') ||
      'matchweek';
    const sortOrder =
      (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    // ========== BUILD PRISMA WHERE CLAUSE ==========
    const where: any = {};

    if (leagueId) {
      where.leagueId = leagueId;
    }

    if (matchweek !== undefined) {
      where.matchweek = matchweek;
    }

    if (season !== undefined) {
      where.season = season;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    // If sport filter provided, join with league
    if (sport) {
      where.league = {
        sport: sport,
      };
    }

    // ========== DETERMINE SORT ORDER ==========
    const orderBy: any = {};
    if (sortBy === 'date') {
      orderBy.updatedAt = sortOrder;
    } else if (sortBy === 'season') {
      orderBy.season = sortOrder;
      orderBy.matchweek = sortOrder;
    } else {
      orderBy.matchweek = sortOrder;
    }

    // ========== FETCH DATA ==========
    const [total, fixtures] = await Promise.all([
      prisma.fixture.count({ where }),
      prisma.fixture.findMany({
        where,
        include: {
          league: {
            select: {
              id: true,
              name: true,
              season: true,
              sport: true,
            },
          },
          matches: {
            include: {
              homeTeam: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
              awayTeam: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
            },
            orderBy: { scheduledDate: 'asc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    // ========== FORMAT RESPONSE ==========
    const totalPages = Math.ceil(total / limit);

    const formattedFixtures: FixtureListItem[] = fixtures.map((fixture) => {
      const completedMatches = fixture.matches.filter(
        (m) => m.status === 'COMPLETED',
      ).length;
      const pendingMatches = fixture.matches.filter(
        (m) => m.status === 'SCHEDULED' || m.status === 'PENDING',
      ).length;

      return {
        id: fixture.id,
        leagueId: fixture.leagueId,
        league: {
          id: fixture.league.id,
          name: fixture.league.name,
          season: fixture.league.season,
          sport: fixture.league.sport,
        },
        matchweek: fixture.matchweek,
        season: fixture.season,
        status: fixture.status,
        matchCount: fixture.matches.length,
        completedMatches,
        pendingMatches,
        matches: fixture.matches.map((match) => ({
          id: match.id,
          homeTeam: {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            logo: match.homeTeam.logoUrl,
          },
          awayTeam: {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            logo: match.awayTeam.logoUrl,
          },
          scheduledDate: match.scheduledDate?.toISOString() || null,
          venue: match.venue,
          homeGoals: match.homeGoals,
          awayGoals: match.awayGoals,
          status: match.status,
          attendance: match.attendance,
        })),
        createdAt: fixture.createdAt.toISOString(),
        updatedAt: fixture.updatedAt.toISOString(),
      };
    });

    const response: FixturesListResponse = {
      success: true,
      data: formattedFixtures,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        leagueId,
        matchweek,
        season,
        status,
        sport,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        resultCount: fixtures.length,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(`[${requestId}] GET /api/fixtures error:`, error);
    return handleApiError(error, 'Failed to fetch fixtures', requestId);
  }
}

// ============================================================================
// POST /api/fixtures - Create Fixtures
// ============================================================================

/**
 * POST /api/fixtures
 * Create fixture(s) for a league with multiple matches
 *
 * Authorization: COACH, MANAGER, LEAGUE_ADMIN, ADMIN (with league access)
 *
 * Request Body:
 * {
 *   "leagueId": "uuid",
 *   "matchweek": number,
 *   "season": number,
 *   "fixtures": [
 *     {
 *       "homeTeamId": "uuid",
 *       "awayTeamId": "uuid",
 *       "scheduledDate": "2025-12-15T19:00:00Z" (optional),
 *       "venue": "Stadium Name" (optional)
 *     }
 *   ],
 *   "dryRun": false (optional - validate without creating)
 * }
 *
 * Returns: 201 Created with fixture and match details
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<CreateFixtureResponse | { success: false; error: any }>> {
  const requestId = crypto.randomUUID();

  try {
    // ========== AUTHENTICATION ==========
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        ApiError.unauthorized('Authentication required'),
        { status: 401 },
      );
    }

    logApiRequest('POST', '/api/fixtures', requestId, {
      userId: session.user.id,
    });

    // ========== REQUEST PARSING & VALIDATION ==========
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        ApiError.badRequest('Invalid JSON in request body'),
        { status: 400 },
      );
    }

    const validationResult = createFixtureRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json(
        ApiError.validation('Invalid request parameters', {
          fieldErrors: errors.fieldErrors,
        }),
        { status: 400 },
      );
    }

    const {
      leagueId,
      matchweek,
      season,
      fixtures: fixtureMatches,
      dryRun,
    } = validationResult.data;

    // ========== AUTHORIZATION ==========
    const hasAccess = await validateUserLeagueAccess(
      session.user.id,
      leagueId,
      ['COACH', 'MANAGER', 'LEAGUE_ADMIN', 'ADMIN'],
    );

    if (!hasAccess) {
      return NextResponse.json(
        ApiError.forbidden(
          'Insufficient permissions to create fixtures for this league',
        ),
        { status: 403 },
      );
    }

    // ========== VERIFY LEAGUE EXISTS ==========
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        sport: true,
        season: true,
      },
    });

    if (!league) {
      return NextResponse.json(
        ApiError.notFound(`League with ID ${leagueId}`),
        { status: 404 },
      );
    }

    // ========== VALIDATE TEAMS ==========
    if (fixtureMatches && fixtureMatches.length > 0) {
      const teamIds = new Set<string>();
      fixtureMatches.forEach((f) => {
        teamIds.add(f.homeTeamId);
        teamIds.add(f.awayTeamId);
      });

      // Verify no duplicate matches
      const uniqueMatches = new Set<string>();
      for (const fixture of fixtureMatches) {
        const matchKey = [fixture.homeTeamId, fixture.awayTeamId]
          .sort()
          .join('-');
        if (uniqueMatches.has(matchKey)) {
          return NextResponse.json(
            ApiError.badRequest(
              `Duplicate match detected: ${fixture.homeTeamId} vs ${fixture.awayTeamId}`,
            ),
            { status: 400 },
          );
        }
        uniqueMatches.add(matchKey);
      }

      // Verify no team plays itself
      for (const fixture of fixtureMatches) {
        if (fixture.homeTeamId === fixture.awayTeamId) {
          return NextResponse.json(
            ApiError.badRequest('Team cannot play against itself'),
            { status: 400 },
          );
        }
      }

      // Verify teams exist and belong to league
      const teams = await prisma.team.findMany({
        where: {
          id: { in: Array.from(teamIds) },
          leagueId: leagueId,
        },
        select: {
          id: true,
          name: true,
          sport: true,
        },
      });

      if (teams.length !== teamIds.size) {
        const missingTeams = Array.from(teamIds).filter(
          (id) => !teams.find((t) => t.id === id),
        );
        return NextResponse.json(
          ApiError.notFound(
            `Teams not found in league: ${missingTeams.join(', ')}`,
          ),
          { status: 404 },
        );
      }

      // Verify all teams have correct sport
      const invalidTeams = teams.filter((t) => t.sport !== league.sport);
      if (invalidTeams.length > 0) {
        return NextResponse.json(
          ApiError.badRequest(
            `Teams have incorrect sport: ${invalidTeams.map((t) => t.name).join(', ')}`,
          ),
          { status: 400 },
        );
      }
    }

    // ========== CHECK FOR DUPLICATE FIXTURE ==========
    const existingFixture = await prisma.fixture.findFirst({
      where: {
        leagueId,
        matchweek,
        season,
      },
    });

    if (existingFixture) {
      return NextResponse.json(
        ApiError.badRequest(
          `Fixture already exists for ${league.name} Season ${season} Matchweek ${matchweek}`,
        ),
        { status: 409 },
      );
    }

    // ========== DRY RUN MODE ==========
    if (dryRun) {
      return NextResponse.json(
        {
          success: true,
          data: {
            fixtureId: 'dry-run-id',
            leagueId,
            league: {
              id: league.id,
              name: league.name,
              sport: league.sport,
              season: league.season,
            },
            matchweek,
            season,
            status: 'PENDING' as FixtureStatus,
            matchesCreated: fixtureMatches?.length || 0,
            matches: (fixtureMatches || []).map((f) => ({
              id: 'dry-run-match',
              homeTeam: { id: f.homeTeamId, name: 'Home Team' },
              awayTeam: { id: f.awayTeamId, name: 'Away Team' },
              status: 'SCHEDULED' as MatchStatus,
            })),
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
            dryRun: true,
          },
        } as CreateFixtureResponse,
        { status: 200 },
      );
    }

    // ========== CREATE FIXTURE WITH MATCHES (TRANSACTION) ==========
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create fixture
      const newFixture = await tx.fixture.create({
        data: {
          leagueId,
          matchweek,
          season,
          status: 'PENDING' as FixtureStatus,
        },
        include: {
          league: {
            select: {
              id: true,
              name: true,
              sport: true,
              season: true,
            },
          },
        },
      });

      // 2. Create matches if provided
      const createdMatches: any[] = [];
      if (fixtureMatches && fixtureMatches.length > 0) {
        for (const fixtureData of fixtureMatches) {
          const match = await tx.match.create({
            data: {
              fixtureId: newFixture.id,
              leagueId,
              homeTeamId: fixtureData.homeTeamId,
              awayTeamId: fixtureData.awayTeamId,
              sport: league.sport,
              status: 'SCHEDULED' as MatchStatus,
              scheduledDate: fixtureData.scheduledDate
                ? new Date(fixtureData.scheduledDate)
                : null,
              venue: fixtureData.venue,
            },
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
            },
          });
          createdMatches.push(match);
        }

        // Update fixture status if matches created
        await tx.fixture.update({
          where: { id: newFixture.id },
          data: {
            status: 'ONGOING' as FixtureStatus,
          },
        });
      }

      return { fixture: newFixture, matches: createdMatches };
    });

    // ========== RETURN RESPONSE ==========
    const response: CreateFixtureResponse = {
      success: true,
      data: {
        fixtureId: result.fixture.id,
        leagueId: result.fixture.leagueId,
        league: {
          id: result.fixture.league.id,
          name: result.fixture.league.name,
          sport: result.fixture.league.sport,
          season: result.fixture.league.season,
        },
        matchweek: result.fixture.matchweek,
        season: result.fixture.season,
        status: result.fixture.status,
        matchesCreated: result.matches.length,
        matches: result.matches.map((match) => ({
          id: match.id,
          homeTeam: { id: match.homeTeam.id, name: match.homeTeam.name },
          awayTeam: { id: match.awayTeam.id, name: match.awayTeam.name },
          status: match.status,
        })),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        dryRun: false,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error(`[${requestId}] POST /api/fixtures error:`, error);
    return handleApiError(error, 'Failed to create fixture', requestId);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate fixture statistics
 */
function calculateFixtureStats(matches: any[]) {
  return {
    total: matches.length,
    completed: matches.filter((m) => m.status === 'COMPLETED').length,
    ongoing: matches.filter((m) => m.status === 'IN_PROGRESS').length,
    pending: matches.filter((m) => m.status === 'SCHEDULED' || m.status === 'PENDING').length,
    totalGoals: matches.reduce((sum, m) => sum + (m.homeGoals || 0) + (m.awayGoals || 0), 0),
    averageGoals: 0,
  };
}

/**
 * Format fixture for response
 */
function formatFixture(fixture: any): FixtureListItem {
  const stats = calculateFixtureStats(fixture.matches);

  return {
    id: fixture.id,
    leagueId: fixture.leagueId,
    league: {
      id: fixture.league.id,
      name: fixture.league.name,
      season: fixture.league.season,
      sport: fixture.league.sport,
    },
    matchweek: fixture.matchweek,
    season: fixture.season,
    status: fixture.status,
    matchCount: stats.total,
    completedMatches: stats.completed,
    pendingMatches: stats.pending,
    matches: fixture.matches.map((match: any) => ({
      id: match.id,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        logo: match.homeTeam.logoUrl,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        logo: match.awayTeam.logoUrl,
      },
      scheduledDate: match.scheduledDate?.toISOString() || null,
      venue: match.venue,
      homeGoals: match.homeGoals,
      awayGoals: match.awayGoals,
      status: match.status,
      attendance: match.attendance,
    })),
    createdAt: fixture.createdAt.toISOString(),
    updatedAt: fixture.updatedAt.toISOString(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  GET,
  POST,
};
