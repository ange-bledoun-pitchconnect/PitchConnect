/**
 * Teams API Endpoints
 * GET    /api/teams       - Get all teams
 * POST   /api/teams       - Create new team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'ACTIVE';

    const skip = (page - 1) * limit;

    // Build where clause for Team model
    const whereClause: any = {
      status: status || undefined,
    };

    if (clubId) {
      whereClause.clubId = clubId;
    }

    // Get teams from Team model with member count
    const teams = await prisma.team.findMany({
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
        _count: {
          select: {
            members: true, // Count TeamMember relations
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.team.count({ where: whereClause });

    // Transform teams
    const transformedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      code: team.code,
      ageGroup: team.ageGroup,
      category: team.category,
      status: team.status,
      club: team.club,
      memberCount: team._count.members,
      createdAt: team.createdAt,
    }));

    return NextResponse.json(
      {
        teams: transformedTeams,
        data: transformedTeams, // Keep for backward compatibility
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

    // Generate unique code (club code + random suffix)
    const baseCode = name.substring(0, 3).toUpperCase();
    const code = `${club.code}_${baseCode}`;

    // Create team
    const team = await prisma.team.create({
      data: {
        clubId,
        name,
        code,
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
