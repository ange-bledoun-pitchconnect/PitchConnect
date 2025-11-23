import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leagueId } = params;

    // Get all teams
    const allTeams = await prisma.team.findMany({
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
        leagueId,
        leftAt: null,
      },
      select: {
        teamId: true,
      },
    });

    const leagueTeamIds = new Set(leagueTeams.map((lt) => lt.teamId));

    // Transform teams with league membership status
    const teams = allTeams.map((team) => ({
      id: team.id,
      name: team.name,
      ageGroup: team.ageGroup,
      category: team.category,
      club: team.club,
      isInLeague: leagueTeamIds.has(team.id),
    }));

    return NextResponse.json({
      teams,
    });
  } catch (error) {
    console.error('Get available teams error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch available teams',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
