/**
 * Teams API Endpoints
 * GET    /api/teams       - Get all teams
 * POST   /api/teams       - Create new team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * GET /api/teams
 * Get all teams with pagination and filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // Increased for match creation
    const status = searchParams.get('status') || 'ACTIVE';
    const includeOldTeams = searchParams.get('includeOldTeams') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause for new Team model
    const whereClause: any = {
      status: status || undefined,
    };

    if (clubId) {
      whereClause.clubId = clubId;
    }

    // Get new Team model teams
    const newTeams = await prisma.team.findMany({
      where: whereClause,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
        members: {
          include: {
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
        _count: {
          select: {
            members: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // If includeOldTeams is true, also fetch from OldTeam model
    let oldTeams: any[] = [];
    if (includeOldTeams) {
      const oldTeamWhere: any = {
        status: status || undefined,
      };

      if (clubId) {
        oldTeamWhere.clubId = clubId;
      }

      oldTeams = await prisma.oldTeam.findMany({
        where: oldTeamWhere,
        include: {
          club: {
            select: {
              id: true,
              name: true,
              city: true,
              country: true,
            },
          },
          coach: {
            include: {
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
          _count: {
            select: {
              players: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Transform new teams
    const transformedNewTeams = newTeams.map((team) => ({
      id: team.id,
      name: team.name,
      ageGroup: team.ageGroup,
      category: team.category,
      status: team.status,
      club: team.club,
      memberCount: team._count.members,
      type: 'NEW_TEAM',
      createdAt: team.createdAt,
    }));

    // Transform old teams
    const transformedOldTeams = oldTeams.map((team) => ({
      id: team.id,
      name: team.name,
      category: team.category,
      season: team.season,
      status: team.status,
      club: team.club,
      coach: team.coach
        ? {
            id: team.coach.id,
            name: `${team.coach.user.firstName} ${team.coach.user.lastName}`,
            email: team.coach.user.email,
          }
        : null,
      playerCount: team._count.players,
      type: 'OLD_TEAM',
      createdAt: team.createdAt,
    }));

    // Combine and sort by createdAt
    const allTeams = [...transformedNewTeams, ...transformedOldTeams].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = newTeams.length + oldTeams.length;

    return NextResponse.json(
      {
        teams: allTeams, // Changed from 'data' to 'teams' for consistency
        data: allTeams, // Keep for backward compatibility
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Teams GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams
 * Create new team
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clubId, name, ageGroup, category } = body;

    if (!clubId || !name) {
      return NextResponse.json(
        { error: 'Club ID and team name are required' },
        { status: 400 }
      );
    }

    // Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        clubId,
        name,
        ageGroup: ageGroup || 'SENIOR',
        category: category || 'FIRST_TEAM',
        status: 'ACTIVE',
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        team,
        message: 'Team created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Teams POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
