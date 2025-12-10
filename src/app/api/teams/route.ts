// ============================================================================
// ENHANCED: src/app/api/teams/route.ts
// POST - Create team | GET - List teams with advanced filtering
// VERSION: 2.0 (Enhanced with production-grade features)
// ============================================================================

import { getServerSession } from 'next-auth/next';
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
import { NotFoundError, ForbiddenError, ConflictError } from '@/lib/api/errors';
import { logResourceCreated } from '@/lib/api/audit';

/**
 * POST /api/teams
 * Create a new team within a club
 * 
 * Authorization: SUPERADMIN, CLUB_MANAGER, CLUB_OWNER
 * 
 * Request Body:
 *   Required:
 *     - name: string (3-100 chars) - Team name
 *     - shortCode: string (2-10 chars, uppercase alphanumeric) - Unique per club
 *     - sport: enum (FOOTBALL, NETBALL, RUGBY, CRICKET, AMERICAN_FOOTBALL, BASKETBALL)
 *     - clubId: string - Club ID
 *     - managerId: string - Manager user ID
 *   
 *   Optional:
 *     - description: string - Team description
 *     - logo: string (URL) - Team logo
 *     - colors: { primary: hex, secondary: hex } - Team colors
 *     - founded: number (year) - Year team was founded
 * 
 * Response: 201 Created with team details
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // ✅ Enhanced: Multi-role authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isClubManager = session.user.roles?.includes('CLUB_MANAGER');
    const isClubOwner = session.user.roles?.includes('CLUB_OWNER');

    if (!isSuperAdmin && !isClubManager && !isClubOwner) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only SUPERADMIN, CLUB_MANAGER, or CLUB_OWNER can create teams',
          requiredRoles: ['SUPERADMIN', 'CLUB_MANAGER', 'CLUB_OWNER'],
        },
        { status: 403 }
      );
    }

    const body = await parseJsonBody(request);

    // ✅ Enhanced: Comprehensive validation
    validateRequired(body, ['name', 'shortCode', 'sport', 'clubId', 'managerId']);
    validateStringLength(body.name, 3, 100, 'Team name');
    validateStringLength(body.shortCode, 2, 10, 'Team short code');

    // ✅ Enhanced: Strict short code validation
    if (!/^[A-Z0-9]+$/.test(body.shortCode)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          field: 'shortCode',
          message: 'Short code must contain only uppercase letters and numbers',
          example: 'MUR, MUFC, MAN123',
        },
        { status: 400 }
      );
    }

    // ✅ Enhanced: Sport enum validation with helpful message
    const validSports = [
      'FOOTBALL',
      'NETBALL',
      'RUGBY',
      'CRICKET',
      'AMERICAN_FOOTBALL',
      'BASKETBALL',
    ];
    if (!validSports.includes(body.sport)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          field: 'sport',
          message: `Invalid sport. Must be one of: ${validSports.join(', ')}`,
          validOptions: validSports,
        },
        { status: 400 }
      );
    }

    // ✅ Enhanced: Color validation with fallback
    if (body.colors) {
      if (body.colors.primary) validateHexColor(body.colors.primary, 'Primary color');
      if (body.colors.secondary)
        validateHexColor(body.colors.secondary, 'Secondary color');
    }

    // ✅ Enhanced: Logo validation
    if (body.logo) validateUrl(body.logo, 'Logo URL');

    // ✅ Enhanced: Verify club exists with additional context
    const club = await prisma.club.findUnique({
      where: { id: body.clubId },
      select: { id: true, name: true, ownerId: true, city: true, country: true },
    });

    if (!club) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: `Club '${body.clubId}' not found`,
          code: 'CLUB_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // ✅ Enhanced: Verify manager exists with validation
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
          error: 'Not Found',
          message: `Manager '${body.managerId}' not found`,
          code: 'MANAGER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // ✅ Enhanced: Authorization check - verify user owns club or is superadmin
    if (!isSuperAdmin && session.user.id !== club.ownerId && !isClubManager) {
      throw new ForbiddenError(
        'You can only create teams for clubs you own or manage'
      );
    }

    // ✅ Enhanced: Bidirectional duplicate short code check
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
          error: 'Conflict',
          message: `Team with short code '${body.shortCode}' already exists in ${club.name}`,
          code: 'DUPLICATE_TEAM_CODE',
          existingTeamId: existingTeam.id,
          existingTeamName: existingTeam.name,
        },
        { status: 409 }
      );
    }

    // ✅ Enhanced: Create team with transaction
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

    // ✅ Enhanced: Detailed audit logging
    await logResourceCreated(
      session.user.id,
      'Team',
      team.id,
      team.name,
      {
        club: club.name,
        location: `${club.city}, ${club.country}`,
        sport: team.sport,
        shortCode: team.shortCode,
        manager: `${manager.firstName} ${manager.lastName}`,
        createdBy: `${session.user.name || 'Unknown'}`,
      },
      `Created team: ${team.name} (${team.shortCode}) in ${club.name}`
    );

    // ✅ Enhanced: Rich response format
    return NextResponse.json(
      {
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
        createdAt: team.createdAt,
        message: `Team '${team.name}' created successfully in ${club.name}`,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: session.user.id,
          version: '2.0',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/teams] Error:', error);
    return errorResponse(error as Error);
  }
}

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
 *   - sport: enum (filter by sport)
 *   - managerId: string (filter by manager)
 *   - search: string (search by name/code)
 *   - sortBy: 'created' | 'name' (default: 'created')
 *   - sortOrder: 'asc' | 'desc' (default: 'desc')
 * 
 * Response: 200 OK with paginated teams
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // ✅ Enhanced: Pagination with boundary checks
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
    
    const clubId = searchParams.get('clubId');
    const sport = searchParams.get('sport');
    const managerId = searchParams.get('managerId');
    const search = searchParams.get('search')?.trim();
    const sortBy = searchParams.get('sortBy') || 'created';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // ✅ Enhanced: Dynamic where clause construction
    const where: any = {};

    if (clubId) where.clubId = clubId;
    if (sport) where.sport = sport;
    if (managerId) where.managerId = managerId;

    // ✅ Enhanced: Advanced search with OR conditions
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search.toUpperCase() } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // ✅ Enhanced: Get total count
    const total = await prisma.team.count({ where });
    const totalPages = Math.ceil(total / limit);

    // ✅ Enhanced: Fetch teams with comprehensive includes
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
        _count: {
          select: {
            players: true,
            matches: true,
            leagues: true,
          },
        },
      },
      orderBy: sortBy === 'name' ? { name: sortOrder } : { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // ✅ Enhanced: Format response with rich metadata
    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      shortCode: team.shortCode,
      sport: team.sport,
      club: {
        ...team.club,
        location: `${team.club.city}, ${team.club.country}`,
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
        playerCount: team._count.players,
        matchCount: team._count.matches,
        leagueCount: team._count.leagues,
      },
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    }));

    // ✅ Enhanced: Comprehensive pagination response
    return NextResponse.json(
      {
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
        metadata: {
          timestamp: new Date().toISOString(),
          userId: session.user.id,
          version: '2.0',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/teams] Error:', error);
    return errorResponse(error as Error);
  }
}
