// ============================================================================
// ENHANCED: src/app/api/leagues/route.ts
// GET - List leagues | POST - Create new league
// ALIGNED WITH: Your Prisma schema (League, LeagueAdmin, LeagueConfiguration)
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/leagues
 * List leagues with comprehensive filtering and pagination
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 25, max: 100)
 *   - sport: enum filter (FOOTBALL, NETBALL, RUGBY, etc)
 *   - status: enum filter (ACTIVE, DRAFT, COMPLETED)
 *   - season: string filter (e.g., "2024-2025")
 *   - country: string filter
 *   - includeArchived: boolean (default: false)
 * 
 * Authorization:
 *   - SUPERADMIN: See all leagues
 *   - LEAGUE_ADMIN: See only their leagues
 *   - COACH/MANAGER: See all public leagues they're part of
 *   - PLAYER: See all public leagues
 * 
 * Response: Paginated list with metadata
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
    const sport = searchParams.get('sport');
    const status = searchParams.get('status');
    const season = searchParams.get('season');
    const country = searchParams.get('country');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Build where clause based on user role and filters
    const where: any = {};

    // Apply role-based access control
    if (!session.user.roles?.includes('SUPERADMIN')) {
      if (session.user.roles?.includes('LEAGUE_ADMIN')) {
        // LEAGUE_ADMIN: only their leagues
        const admin = await prisma.leagueAdmin.findUnique({
          where: { userId: session.user.id },
        });
        if (!admin) {
          return NextResponse.json(
            { leagues: [], total: 0, page, limit, totalPages: 0 },
            { status: 200 }
          );
        }
        where.adminId = admin.id;
      } else {
        // COACH/MANAGER/PLAYER/SCOUT: only public leagues or leagues they're part of
        where.OR = [
          { visibility: 'PUBLIC' },
          {
            teams: {
              some: {
                players: {
                  some: { userId: session.user.id },
                },
              },
            },
          },
        ];
      }
    }

    // Apply filters
    if (sport) where.sport = sport;
    if (status) where.status = status;
    if (season) where.season = season;
    if (country) where.country = country;
    if (!includeArchived) where.status = { not: 'ARCHIVED' };

    // Get total count for pagination
    const total = await prisma.league.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Fetch leagues with related data
    const leagues = await prisma.league.findMany({
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
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format response with proper structure
    const formattedLeagues = leagues.map((league) => ({
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
        id: league.admin?.user?.id,
        name: `${league.admin?.user?.firstName} ${league.admin?.user?.lastName}`,
        email: league.admin?.user?.email,
      },
      configuration: {
        pointsWin: league.configuration?.pointsForWin || 3,
        pointsDraw: league.configuration?.pointsForDraw || 1,
        pointsLoss: league.configuration?.pointsForLoss || 0,
        minTeams: league.configuration?.minTeams || 2,
        maxTeams: league.configuration?.maxTeams || 20,
        bonusPointsEnabled: league.configuration?.bonusPointsEnabled || false,
        registrationOpen: league.configuration?.registrationOpen ?? true,
      },
      stats: {
        teamCount: league._count.teams,
        fixtureCount: league._count.fixtures,
        standingCount: league._count.standings,
      },
      createdAt: league.createdAt?.toISOString(),
      updatedAt: league.updatedAt?.toISOString(),
    }));

    return NextResponse.json(
      {
        leagues: formattedLeagues,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/leagues] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch leagues',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leagues
 * Create a new league
 * 
 * Request Body:
 *   Required:
 *     - name: string (3-100 chars)
 *     - code: string (2-10 chars, unique)
 *     - sport: enum (FOOTBALL, NETBALL, RUGBY, CRICKET, AMERICAN_FOOTBALL, BASKETBALL)
 *     - season: string (YYYY-YYYY format)
 *   
 *   Optional:
 *     - country: string (default: "United Kingdom")
 *     - format: enum (ROUND_ROBIN, KNOCKOUT, SWISS, default: ROUND_ROBIN)
 *     - visibility: enum (PUBLIC, PRIVATE, default: PUBLIC)
 *     - status: enum (DRAFT, ACTIVE, default: ACTIVE)
 *     - pointsWin: number (default: 3)
 *     - pointsDraw: number (default: 1)
 *     - minTeams: number (default: 2)
 *     - maxTeams: number (default: 20)
 *     - bonusPointsEnabled: boolean (default: false)
 *     - registrationOpen: boolean (default: true)
 * 
 * Authorization: SUPERADMIN, LEAGUE_ADMIN
 * 
 * Returns: 201 Created with league details
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verify authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify authorization
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN');

    if (!isSuperAdmin && !isLeagueAdmin) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only SUPERADMIN or LEAGUE_ADMIN roles can create leagues',
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate required fields
    const requiredFields = ['name', 'code', 'sport', 'season'];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate field formats
    if (body.name.length < 3 || body.name.length > 100) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'League name must be 3-100 characters' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{4}$/.test(body.season)) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Season must be in YYYY-YYYY format (e.g., 2024-2025)' },
        { status: 400 }
      );
    }

    // Validate sport enum
    const validSports = ['FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL', 'BASKETBALL'];
    if (!validSports.includes(body.sport)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: `Invalid sport. Must be one of: ${validSports.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if league code already exists
    const existingLeague = await prisma.league.findUnique({
      where: { code: body.code.toUpperCase() },
    });

    if (existingLeague) {
      return NextResponse.json(
        { error: 'Conflict', message: 'A league with this code already exists' },
        { status: 409 }
      );
    }

    // Get or create LeagueAdmin profile
    let leagueAdmin = await prisma.leagueAdmin.findUnique({
      where: { userId: session.user.id },
    });

    if (!leagueAdmin) {
      // Create LeagueAdmin profile
      leagueAdmin = await prisma.leagueAdmin.create({
        data: { userId: session.user.id },
      });

      // Ensure LEAGUE_ADMIN role is assigned
      const hasRole = await prisma.userRole_User.findFirst({
        where: {
          userId: session.user.id,
          roleName: 'LEAGUE_ADMIN',
        },
      });

      if (!hasRole) {
        await prisma.userRole_User.create({
          data: {
            userId: session.user.id,
            roleName: 'LEAGUE_ADMIN',
          },
        });
      }
    }

    // Create league with configuration
    const league = await prisma.league.create({
      data: {
        name: body.name.trim(),
        code: body.code.toUpperCase(),
        sport: body.sport,
        country: body.country || 'United Kingdom',
        season: body.season,
        format: body.format || 'ROUND_ROBIN',
        status: body.status || 'ACTIVE',
        visibility: body.visibility || 'PUBLIC',
        pointsWin: body.pointsWin || 3,
        pointsDraw: body.pointsDraw || 1,
        pointsLoss: body.pointsLoss || 0,
        adminId: leagueAdmin.id,
        configuration: {
          create: {
            pointsForWin: body.pointsWin || 3,
            pointsForDraw: body.pointsDraw || 1,
            pointsForLoss: body.pointsLoss || 0,
            minTeams: Math.max(2, body.minTeams || 2),
            maxTeams: Math.min(100, body.maxTeams || 20),
            registrationOpen: body.registrationOpen ?? true,
            bonusPointsEnabled: body.bonusPointsEnabled || false,
            bonusPointsForGoals: body.bonusPointsForGoals || 0,
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

    return NextResponse.json(
      {
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
          id: league.admin?.user?.id,
          name: `${league.admin?.user?.firstName} ${league.admin?.user?.lastName}`,
        },
        configuration: {
          pointsWin: league.configuration?.pointsForWin,
          pointsDraw: league.configuration?.pointsForDraw,
          pointsLoss: league.configuration?.pointsForLoss,
          minTeams: league.configuration?.minTeams,
          maxTeams: league.configuration?.maxTeams,
          bonusPointsEnabled: league.configuration?.bonusPointsEnabled,
          registrationOpen: league.configuration?.registrationOpen,
        },
        message: `League '${league.name}' created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/leagues] Error:', error);

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Conflict', message: 'A league with this code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create league',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
