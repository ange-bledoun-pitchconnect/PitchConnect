// src/app/api/leagues/[id]/available-teams/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify league exists
    const league = await prisma.league.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Get all active teams from Team model (new structure)
    const newTeams = await prisma.team.findMany({
      where: {
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
      orderBy: {
        name: 'asc',
      },
    });

    // Get all active teams from OldTeam model (legacy structure)
    const oldTeams = await prisma.oldTeam.findMany({
      where: {
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
      orderBy: {
        name: 'asc',
      },
    });

    // Get teams already in this league
    const leagueTeams = await prisma.leagueTeam.findMany({
      where: {
        leagueId: params.id,
        leftAt: null, // Only active memberships
      },
      select: {
        teamId: true,
      },
    });

    const leagueTeamIds = new Set(leagueTeams.map((lt) => lt.teamId));

    // Get pending invitations
    const pendingInvitations = await prisma.leagueInvitation.findMany({
      where: {
        leagueId: params.id,
        status: 'PENDING',
      },
      select: {
        teamId: true,
      },
    });

    const invitedTeamIds = new Set(pendingInvitations.map((inv) => inv.teamId));

    // Combine and transform teams from new structure
    const transformedNewTeams = newTeams.map((team) => ({
      id: team.id,
      name: team.name,
      ageGroup: team.ageGroup,
      category: team.category,
      club: team.club,
      isInLeague: leagueTeamIds.has(team.id),
      hasInvitation: invitedTeamIds.has(team.id),
    }));

    // Transform teams from old structure
    const transformedOldTeams = oldTeams.map((team) => ({
      id: team.id,
      name: team.name,
      ageGroup: team.category, // Use category as ageGroup for old teams
      category: team.category,
      club: team.club,
      isInLeague: leagueTeamIds.has(team.id),
      hasInvitation: invitedTeamIds.has(team.id),
    }));

    // Combine both team lists
    const allTeams = [...transformedNewTeams, ...transformedOldTeams];

    // Remove duplicates by ID (in case of data migration overlap)
    const uniqueTeams = Array.from(
      new Map(allTeams.map((team) => [team.id, team])).values()
    );

    // Sort by name
    uniqueTeams.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      teams: uniqueTeams,
      league: {
        id: league.id,
        name: league.name,
      },
    });
  } catch (error) {
    console.error('GET /api/leagues/[id]/available-teams error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch available teams',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
