// ============================================================================
// 🏆 PITCHCONNECT BROWSE TEAMS API v7.5.0
// ============================================================================
// GET /api/player/browse-teams - Search and filter teams to join
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Sport } from '@prisma/client';

// ============================================================================
// GET - Browse teams with filters
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') as Sport | null;
    const ageGroup = searchParams.get('ageGroup');
    const gender = searchParams.get('gender');
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Get player's current team memberships to exclude
    const player = await prisma.player.findFirst({
      where: { userId: session.user.id },
      include: {
        teamPlayers: {
          where: { isActive: true },
          select: { teamId: true },
        },
      },
    });

    const currentTeamIds = player?.teamPlayers.map((tp) => tp.teamId) || [];

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      isRecruiting: true, // Only show teams that are actively recruiting
      id: { notIn: currentTeamIds }, // Exclude teams player is already in
    };

    // Sport filter (through club)
    if (sport) {
      where.club = { sport };
    }

    // Age group filter
    if (ageGroup) {
      where.ageGroup = ageGroup;
    }

    // Gender filter
    if (gender) {
      where.gender = gender;
    }

    // Location filters (through club)
    if (city || country) {
      where.club = {
        ...where.club,
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(country && { country: { contains: country, mode: 'insensitive' } }),
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { club: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Build order by
    const orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      case 'players':
        orderBy.teamPlayers = { _count: sortOrder };
        break;
      default:
        orderBy.name = 'asc';
    }

    // Execute query with pagination
    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          club: {
            select: {
              id: true,
              name: true,
              sport: true,
              logo: true,
              city: true,
              country: true,
            },
          },
          _count: {
            select: { teamPlayers: { where: { isActive: true } } },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.team.count({ where }),
    ]);

    // Check for pending join requests from this player
    const pendingRequests = player
      ? await prisma.joinRequest.findMany({
          where: {
            playerId: player.id,
            status: 'PENDING',
            teamId: { in: teams.map((t) => t.id) },
          },
          select: { teamId: true },
        })
      : [];

    const pendingTeamIds = new Set(pendingRequests.map((r) => r.teamId));

    // Transform response
    const transformedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      logo: team.logo,
      ageGroup: team.ageGroup,
      gender: team.gender,
      club: team.club,
      playerCount: team._count.teamPlayers,
      hasPendingRequest: pendingTeamIds.has(team.id),
    }));

    return NextResponse.json({
      teams: transformedTeams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Browse teams error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
