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

    // Get league with teams and standings
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        teams: {
          include: {
            team: {
              include: {
                club: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        standings: {
          orderBy: {
            position: 'asc',
          },
        },
        fixtures: {
          orderBy: {
            matchweek: 'asc',
          },
          take: 5,
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Calculate stats
    const totalMatches = await prisma.match.count({
      where: {
        fixture: {
          leagueId,
        },
      },
    });

    const matchesPlayed = await prisma.match.count({
      where: {
        fixture: {
          leagueId,
        },
        status: 'FINISHED',
      },
    });

    const stats = {
      totalTeams: league.teams.length,
      totalMatches,
      matchesPlayed,
      matchesRemaining: totalMatches - matchesPlayed,
    };

    // Transform teams data
    const teams = league.teams.map((lt) => ({
      id: lt.team.id,
      name: lt.team.name,
      clubName: lt.team.club.name,
      ageGroup: lt.team.ageGroup,
      category: lt.team.category,
      joinedAt: lt.joinedAt.toISOString(),
    }));

    // Transform standings data
    const standings = league.standings.map((s) => ({
      id: s.id,
      position: s.position,
      teamId: s.teamId,
      teamName: teams.find((t) => t.id === s.teamId)?.name || 'Unknown Team',
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDifference: s.goalDifference,
      points: s.points,
    }));

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        code: league.code,
        country: league.country,
        season: league.season,
        status: league.status,
        pointsWin: league.pointsWin,
        pointsDraw: league.pointsDraw,
        pointsLoss: league.pointsLoss,
        teams,
        standings,
        fixtures: league.fixtures,
        stats,
      },
    });
  } catch (error) {
    console.error('Get league error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch league',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
