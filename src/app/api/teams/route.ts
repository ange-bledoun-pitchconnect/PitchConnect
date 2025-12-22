// ============================================================================
// 🏆 ENHANCED: src/app/api/teams/route.ts
// POST - Create team | GET - List teams with advanced filtering & pagination
// VERSION: 3.0 - World-Class Enhanced
// ============================================================================

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  parseJsonBody,
  validateRequired,
  validateStringLength,
  validateHexColor,
  validateUrl,
} from '@/lib/api/validation';
import { errorResponse } from '@/lib/api/responses';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logResourceCreated, createAuditLog } from '@/lib/api/audit';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CreateTeamRequest {
  name: string;
  shortCode: string;
  sport: 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICANFOOTBALL' | 'BASKETBALL';
  clubId: string;
  managerId: string;
  description?: string;
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
  founded?: number;
}

interface TeamListItem {
  id: string;
  name: string;
  shortCode: string;
  sport: string;
  club: {
    id: string;
    name: string;
    city: string | null;
    country: string;
    logo: string | null;
    location: string;
  };
  manager: {
    id: string;
    name: string;
    email: string;
  };
  description: string | null;
  logo: string | null;
  colors: Record<string, any>;
  founded: number;
  stats: {
    playerCount: number;
    matchCount: number;
    leagueCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateTeamResponse {
  success: true;
  id: string;
  name: string;
  shortCode: string;
  sport: string;
  clubId: string;
  club: {
    id: string;
    name: string;
    city: string | null;
    country: string;
  };
  manager: {
    id: string;
    name: string;
    email: string;
  };
  description: string | null;
  logo: string | null;
  colors: Record<string, any>;
  founded: number;
  message: string;
  timestamp: string;
  requestId: string;
}

interface TeamsListResponse {
  success: true;
  teams: TeamListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
  filters: Record<string, any>;
  sort: Record<string, any>;
  timestamp: string;
  requestId: string;
}

// ============================================================================
// POST /api/teams - Create Team
// ============================================================================

/**
 * POST /api/teams
 * Create a new team within a club
 * 
 * Authorization: SUPERADMIN, CLUB_MANAGER, CLUB_OWNER
 * 
 * Request Body:
 *   Required:
 *     - name: string (3-100 chars)
 *     - shortCode: string (2-10 uppercase alphanumeric, unique per club)
 *     - sport: enum (FOOTBALL, NETBALL, RUGBY, CRICKET, AMERICANFOOTBALL, BASKETBALL)
 *     - clubId: string (valid club ID)
 *     - managerId: string (valid user ID)
 *   
 *   Optional:
 *     - description: string
 *     - logo: string (valid URL)
 *     - colors: { primary: hex, secondary: hex }
 *     - founded: number (year)
 * 
 * Returns: 201 Created with team details
 * 
 * Features:
 *   ✅ Multi-role authorization
 *   ✅ Comprehensive validation
 *   ✅ Duplicate short code prevention
 *   ✅ Transaction support
 *   ✅ Detailed audit logging
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateTeamResponse | { success: false; error: string; code: string; requestId: string }>> {
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
          requestId,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isClubManager = session.user.roles?.includes('CLUB_MANAGER');
    const isClubOwner = session.user.roles?.includes('CLUB_OWNER');

    if (!isSuperAdmin && !isClubManager && !isClubOwner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only SUPERADMIN, CLUB_MANAGER, or CLUB_OWNER can create teams',
          code: 'INSUFFICIENT_PERMISSIONS',
          requestId,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Parse request body
    let body: CreateTeamRequest;
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
    validateRequired(body, ['name', 'shortCode', 'sport', 'clubId', 'managerId']);

    // 5. Validate name
    validateStringLength(body.name, 3, 100, 'Team name');

    // 6. Validate short code format
    validateStringLength(body.shortCode, 2, 10, 'Team short code');

    if (!/^[A-Z0-9]+$/.test(body.shortCode)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Short code must contain only uppercase letters and numbers',
          code: 'INVALID_SHORT_CODE',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 7. Validate sport enum
    const validSports = ['FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICANFOOTBALL', 'BASKETBALL'];
    if (!validSports.includes(body.sport)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid sport. Must be one of: ${validSports.join(', ')}`,
          code: 'INVALID_SPORT',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 8. Validate colors if provided
    if (body.colors) {
      if (body.colors.primary) validateHexColor(body.colors.primary, 'Primary color');
      if (body.colors.secondary) validateHexColor(body.colors.secondary, 'Secondary color');
    }

    // 9. Validate logo if provided
    if (body.logo) validateUrl(body.logo, 'Logo URL');

    // 10. Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: body.clubId },
      select: { id: true, name: true, ownerId: true, city: true, country: true },
    });

    if (!club) {
      return NextResponse.json(
        {
          success: false,
          error: `Club "${body.clubId}" not found`,
          code: 'CLUB_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 11. Verify manager exists
    const manager = await prisma.user.findUnique({
      where: { id: body.managerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roles: true,
      },
    });

    if (!manager) {
      return NextResponse.json(
        {
          success: false,
          error: `Manager "${body.managerId}" not found`,
          code: 'MANAGER_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 12. Authorization: verify user owns club or is superadmin
    if (!isSuperAdmin && session.user.id !== club.ownerId && !isClubManager) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - You can only create teams for clubs you own or manage',
          code: 'INSUFFICIENT_PERMISSIONS',
          requestId,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 13. Check for duplicate short code within club
    const existingTeam = await prisma.team.findFirst({
      where: {
        clubId: body.clubId,
        shortCode: body.shortCode.toUpperCase(),
      },
      select: { id: true, name: true },
    });

    if (existingTeam) {
      return NextResponse.json(
        {
          success: false,
          error: `Team with short code "${body.shortCode}" already exists in ${club.name}`,
          code: 'DUPLICATE_SHORT_CODE',
          requestId,
        },
        { status: 409, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 14. Create team with transaction
    const team = await prisma.$transaction(async (tx) => {
      return await tx.team.create({
        data: {
          name: body.name.trim(),
          shortCode: body.shortCode.toUpperCase(),
          sport: body.sport,
          clubId: body.clubId,
          managerId: body.managerId,
          description: body.description?.trim() || null,
          logo: body.logo || null,
          colors: body.colors || { primary: '#000000', secondary: '#FFFFFF' },
          founded: body.founded || new Date().getFullYear(),
        },
        include: {
          club: { select: { id: true, name: true, city: true, country: true } },
          manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
    });

    // 15. Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'TEAMCREATED',
      resourceType: 'Team',
      resourceId: team.id,
      details: {
        teamName: team.name,
        clubName: club.name,
        sport: team.sport,
        shortCode: team.shortCode,
        managerName: `${manager.firstName} ${manager.lastName}`,
      },
      requestId,
    });

    // 16. Build response
    const response: CreateTeamResponse = {
      success: true,
      id: team.id,
      name: team.name,
      shortCode: team.shortCode,
      sport: team.sport,
      clubId: team.clubId,
      club: team.club,
      manager: {
        id: team.manager.id,
        name: `${team.manager.firstName} ${team.manager.lastName}`,
        email: team.manager.email,
      },
      description: team.description,
      logo: team.logo,
      colors: team.colors,
      founded: team.founded,
      message: `Team "${team.name}" created successfully in ${club.name}`,
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 201,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[POST /api/teams]', {
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
// GET /api/teams - List Teams
// ============================================================================

/**
 * GET /api/teams
 * List teams with advanced filtering and pagination
 * 
 * Authorization: Any authenticated user
 * 
 * Query Parameters:
 *   - page: number (default: 1, min: 1)
 *   - limit: number (default: 25, min: 1, max: 100)
 *   - clubId: string (filter by club)
 *   - sport: string (filter by sport)
 *   - managerId: string (filter by manager)
 *   - search: string (search by name/code)
 *   - sortBy: 'created' | 'name' (default: 'created')
 *   - sortOrder: 'asc' | 'desc' (default: 'desc')
 * 
 * Returns: 200 OK with paginated teams
 * 
 * Features:
 *   ✅ Advanced pagination
 *   ✅ Multiple filter options
 *   ✅ Text search
 *   ✅ Flexible sorting
 *   ✅ Rich metadata
 */
export async function GET(request: NextRequest): Promise<NextResponse<TeamsListResponse | { success: false; error: string; code: string; requestId: string }>> {
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
          requestId,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Parse and validate pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    // 3. Extract filter parameters
    const clubId = searchParams.get('clubId');
    const sport = searchParams.get('sport');
    const managerId = searchParams.get('managerId');
    const search = searchParams.get('search')?.trim();
    const sortBy = searchParams.get('sortBy') || 'created';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // 4. Build where clause
    const where: any = {};

    if (clubId) where.clubId = clubId;
    if (sport) where.sport = sport;
    if (managerId) where.managerId = managerId;

    // 5. Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search.toUpperCase() } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 6. Get total count for pagination
    const total = await prisma.team.count({ where });
    const totalPages = Math.ceil(total / limit);

    // 7. Fetch teams with relationships
    const teams = await prisma.team.findMany({
      where,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            logo: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          select: { id: true },
        },
        matches: {
          select: { id: true },
        },
        leagues: {
          select: { id: true },
        },
      },
      orderBy: sortBy === 'name' ? { name: sortOrder } : { createdAt: sortOrder },
      skip,
      take: limit,
    });

    // 8. Format teams response
    const formattedTeams: TeamListItem[] = teams.map((team) => ({
      id: team.id,
      name: team.name,
      shortCode: team.shortCode,
      sport: team.sport,
      club: {
        id: team.club.id,
        name: team.club.name,
        city: team.club.city,
        country: team.club.country,
        logo: team.club.logo,
        location: `${team.club.city || 'Unknown'}, ${team.club.country}`,
      },
      manager: {
        id: team.manager.id,
        name: `${team.manager.firstName} ${team.manager.lastName}`,
        email: team.manager.email,
      },
      description: team.description,
      logo: team.logo,
      colors: team.colors,
      founded: team.founded,
      stats: {
        playerCount: team.members.length,
        matchCount: team.matches.length,
        leagueCount: team.leagues.length,
      },
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    }));

    // 9. Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'TEAMSVIEWED',
      resourceType: 'Team',
      details: {
        filters: {
          clubId: clubId || 'all',
          sport: sport || 'all',
          managerId: managerId || 'all',
          search: search || 'none',
        },
        pageSize: limit,
        currentPage: page,
      },
      requestId,
    });

    // 10. Build response
    const response: TeamsListResponse = {
      success: true,
      teams: formattedTeams,
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
        clubId,
        sport,
        managerId,
        search,
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
    console.error('[GET /api/teams]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}
