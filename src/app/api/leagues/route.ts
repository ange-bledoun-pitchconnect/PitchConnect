// ============================================================================
// 🏆 ENHANCED: src/app/api/leagues/route.ts
// GET - List leagues with advanced filtering & pagination
// POST - Create new league with configuration
// VERSION: 3.0 - World-Class Enhanced
// ============================================================================

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, validateStringLength } from '@/lib/api/validation';
import { errorResponse } from '@/lib/api/responses';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { createAuditLog } from '@/lib/api/audit';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LeagueListItem {
  id: string;
  name: string;
  code: string;
  sport: string;
  season: number;
  country: string | null;
  status: string;
  format: string;
  visibility: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
  configuration: {
    pointsWin: number;
    pointsDraw: number;
    minTeams: number;
    maxTeams: number;
    registrationOpen: boolean;
    bonusPointsEnabled: boolean;
  };
  stats: {
    teamCount: number;
    fixtureCount: number;
    standingCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface LeagueListResponse {
  success: true;
  leagues: LeagueListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  timestamp: string;
  requestId: string;
}

interface CreateLeagueRequest {
  name: string;
  code: string;
  sport: 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICANFOOTBALL' | 'BASKETBALL';
  season: number;
  country?: string;
  description?: string;
  format?: 'LEAGUE' | 'KNOCKOUT' | 'ROUNDROBIN' | 'GROUPS';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  pointsWin?: number;
  pointsDraw?: number;
  pointsLoss?: number;
  minTeams?: number;
  maxTeams?: number;
  bonusPointsEnabled?: boolean;
  registrationOpen?: boolean;
}

interface CreateLeagueResponse {
  success: true;
  id: string;
  name: string;
  code: string;
  sport: string;
  season: number;
  country: string;
  status: string;
  format: string;
  visibility: string;
  admin: {
    id: string;
    name: string;
  };
  configuration: {
    pointsWin: number;
    pointsDraw: number;
    pointsLoss: number;
    minTeams: number;
    maxTeams: number;
    bonusPointsEnabled: boolean;
    registrationOpen: boolean;
  };
  message: string;
  timestamp: string;
  requestId: string;
}

// ============================================================================
// GET /api/leagues
// ============================================================================

/**
 * GET /api/leagues
 * List leagues with comprehensive filtering, pagination, and RBAC
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 25, max: 100)
 *   - sport: string filter (FOOTBALL, NETBALL, RUGBY, CRICKET, AMERICANFOOTBALL, BASKETBALL)
 *   - season: number filter (e.g., 2024)
 *   - status: string filter (DRAFT, ACTIVE, COMPLETED)
 *   - country: string filter
 *   - search: string (searches name)
 *   - includeArchived: boolean (default: false)
 * 
 * Authorization:
 *   - SUPERADMIN: See all leagues
 *   - LEAGUE_ADMIN: See only their leagues
 *   - Others: See public leagues only
 * 
 * Returns: 200 OK with paginated list
 * 
 * Features:
 *   ✅ Advanced filtering
 *   ✅ Pagination with metadata
 *   ✅ Role-based access control
 *   ✅ Search functionality
 *   ✅ Request tracking
 */
export async function GET(request: NextRequest): Promise<NextResponse<LeagueListResponse | { success: false; error: string; code: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await auth();
    if (!session) {
      return Response.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
          code: 'AUTH_REQUIRED',
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Parse and validate pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    // 3. Extract and validate filter parameters
    const sport = searchParams.get('sport');
    const status = searchParams.get('status');
    const season = searchParams.get('season');
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Validate sport enum
    const validSports = ['FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICANFOOTBALL', 'BASKETBALL'];
    if (sport && !validSports.includes(sport)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid sport. Must be one of: ${validSports.join(', ')}`,
          code: 'INVALID_SPORT',
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Build where clause with RBAC
    const where: any = {};

    // Role-based access control
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN');

    if (!isSuperAdmin) {
      if (isLeagueAdmin) {
        // League admins can only see their own leagues
        const leagueAdmin = await prisma.leagueAdmin.findFirst({
          where: { userId: session.user.id },
          select: { id: true },
        });

        if (leagueAdmin) {
          where.adminId = leagueAdmin.id;
        } else {
          // No leagues for this admin yet
          where.id = 'NONEXISTENT';
        }
      } else {
        // Regular users see only public leagues
        where.visibility = 'PUBLIC';
      }
    }

    // Apply filters
    if (sport) where.sport = sport;
    if (status) where.status = status;
    if (season) where.season = parseInt(season, 10);
    if (country) where.country = country;
    if (!includeArchived) {
      where.status = { not: 'ARCHIVED' };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 5. Fetch total count and paginated leagues
    const [total, leagues] = await Promise.all([
      prisma.league.count({ where }),
      prisma.league.findMany({
        where,
        include: {
          admin: {
            select: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          configuration: true,
          _count: {
            select: {
              teams: true,
              fixtures: true,
              standings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // 6. Format response
    const pages = Math.ceil(total / limit);
    const formattedLeagues: LeagueListItem[] = leagues.map((league) => ({
      id: league.id,
      name: league.name,
      code: league.code || 'N/A',
      sport: league.sport,
      season: league.season,
      country: league.country,
      status: league.status,
      format: league.format || 'LEAGUE',
      visibility: league.visibility,
      admin: {
        id: league.admin?.user?.id || '',
        name: league.admin?.user ? `${league.admin.user.firstName} ${league.admin.user.lastName}` : 'Unknown',
        email: league.admin?.user?.email || '',
      },
      configuration: {
        pointsWin: league.configuration?.pointsForWin || 3,
        pointsDraw: league.configuration?.pointsForDraw || 1,
        minTeams: league.configuration?.minTeams || 2,
        maxTeams: league.configuration?.maxTeams || 20,
        registrationOpen: league.configuration?.registrationOpen ?? true,
        bonusPointsEnabled: league.configuration?.bonusPointsEnabled ?? false,
      },
      stats: {
        teamCount: league._count.teams,
        fixtureCount: league._count.fixtures,
        standingCount: league._count.standings,
      },
      createdAt: league.createdAt.toISOString(),
      updatedAt: league.updatedAt.toISOString(),
    }));

    // 7. Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'LEAGUESVIEWED',
      resourceType: 'League',
      details: {
        filterApplied: {
          sport: sport || 'all',
          status: status || 'all',
          season: season || 'all',
          country: country || 'all',
        },
        pageSize: limit,
        currentPage: page,
      },
      requestId,
    });

    // 8. Build response
    const response: LeagueListResponse = {
      success: true,
      leagues: formattedLeagues,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPreviousPage: page > 1,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[GET /api/leagues]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}

// ============================================================================
// POST /api/leagues
// ============================================================================

/**
 * POST /api/leagues
 * Create a new league with configuration
 * 
 * Authorization: SUPERADMIN, LEAGUE_ADMIN only
 * 
 * Request Body:
 *   Required:
 *     - name: string (3-100 chars)
 *     - code: string (2-10 chars, unique)
 *     - sport: enum (FOOTBALL, NETBALL, RUGBY, CRICKET, AMERICANFOOTBALL, BASKETBALL)
 *     - season: number (e.g., 2024)
 *   
 *   Optional:
 *     - country: string (default: "United Kingdom")
 *     - description: string
 *     - format: enum (LEAGUE, KNOCKOUT, ROUNDROBIN, GROUPS)
 *     - visibility: enum (PUBLIC, PRIVATE, INVITE_ONLY)
 *     - pointsWin: number (default: 3)
 *     - pointsDraw: number (default: 1)
 *     - pointsLoss: number (default: 0)
 *     - minTeams: number (default: 2)
 *     - maxTeams: number (default: 20)
 *     - bonusPointsEnabled: boolean (default: false)
 *     - registrationOpen: boolean (default: true)
 * 
 * Returns: 201 Created with league details
 * 
 * Features:
 *   ✅ Comprehensive input validation
 *   ✅ Automatic admin profile creation
 *   ✅ Configuration template support
 *   ✅ Duplicate code prevention
 *   ✅ Detailed audit logging
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateLeagueResponse | { success: false; error: string; code: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
          code: 'AUTH_REQUIRED',
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN');

    if (!isSuperAdmin && !isLeagueAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only SUPERADMIN or LEAGUE_ADMIN can create leagues',
          code: 'INSUFFICIENT_PERMISSIONS',
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Parse request body
    let body: CreateLeagueRequest;
    try {
      body = await parseJsonBody(request);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Validate required fields
    const requiredFields = ['name', 'code', 'sport', 'season'];
    const missingFields = requiredFields.filter((field) => !body[field as keyof CreateLeagueRequest]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 5. Validate field formats
    validateStringLength(body.name, 3, 100, 'League name');

    if (body.code.length < 2 || body.code.length > 10) {
      throw new BadRequestError('League code must be 2-10 characters');
    }

    // Validate sport enum
    const validSports = ['FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICANFOOTBALL', 'BASKETBALL'];
    if (!validSports.includes(body.sport)) {
      throw new BadRequestError(`Invalid sport. Must be one of: ${validSports.join(', ')}`);
    }

    // Validate season
    if (typeof body.season !== 'number' || body.season < 2000 || body.season > new Date().getFullYear() + 2) {
      throw new BadRequestError('Invalid season year');
    }

    // 6. Check for duplicate league code
    const existingLeague = await prisma.league.findUnique({
      where: { code: body.code.toUpperCase() },
      select: { id: true, name: true },
    });

    if (existingLeague) {
      return NextResponse.json(
        {
          success: false,
          error: `League code "${body.code.toUpperCase()}" is already in use`,
          code: 'DUPLICATE_CODE',
        },
        { status: 409, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 7. Get or create LeagueAdmin profile
    let leagueAdmin = await prisma.leagueAdmin.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!leagueAdmin) {
      leagueAdmin = await prisma.leagueAdmin.create({
        data: { userId: session.user.id },
        select: { id: true },
      });
    }

    // 8. Create league with configuration
    const league = await prisma.league.create({
      data: {
        name: body.name.trim(),
        code: body.code.toUpperCase(),
        sport: body.sport,
        country: body.country || 'United Kingdom',
        season: body.season,
        description: body.description?.trim() || null,
        format: body.format || 'LEAGUE',
        status: 'ACTIVE',
        visibility: body.visibility || 'PUBLIC',
        adminId: leagueAdmin.id,
        configuration: {
          create: {
            pointsForWin: body.pointsWin || 3,
            pointsForDraw: body.pointsDraw || 1,
            pointsForLoss: body.pointsLoss || 0,
            minTeams: Math.max(2, body.minTeams || 2),
            maxTeams: Math.min(100, body.maxTeams || 20),
            registrationOpen: body.registrationOpen ?? true,
            bonusPointsEnabled: body.bonusPointsEnabled ?? false,
            bonusPointsForGoals: 0,
          },
        },
      },
      include: {
        admin: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        configuration: true,
      },
    });

    // 9. Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'LEAGUECREATED',
      resourceType: 'League',
      resourceId: league.id,
      details: {
        leagueName: league.name,
        leagueCode: league.code,
        sport: league.sport,
        season: league.season,
        format: league.format,
      },
      requestId,
    });

    // 10. Build response
    const response: CreateLeagueResponse = {
      success: true,
      id: league.id,
      name: league.name,
      code: league.code,
      sport: league.sport,
      season: league.season,
      country: league.country,
      status: league.status,
      format: league.format,
      visibility: league.visibility,
      admin: {
        id: league.admin?.user?.id || '',
        name: league.admin?.user ? `${league.admin.user.firstName} ${league.admin.user.lastName}` : 'Unknown',
      },
      configuration: {
        pointsWin: league.configuration?.pointsForWin || 3,
        pointsDraw: league.configuration?.pointsForDraw || 1,
        pointsLoss: league.configuration?.pointsForLoss || 0,
        minTeams: league.configuration?.minTeams || 2,
        maxTeams: league.configuration?.maxTeams || 20,
        bonusPointsEnabled: league.configuration?.bonusPointsEnabled ?? false,
        registrationOpen: league.configuration?.registrationOpen ?? true,
      },
      message: `League "${league.name}" created successfully`,
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 201,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[POST /api/leagues]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'BADREQUEST',
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}
