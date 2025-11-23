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

    // Get league info
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        name: true,
        code: true,
        season: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Get standings with team info
    const standings = await prisma.standings.findMany({
      where: { leagueId },
      orderBy: [
        { points: 'desc' },
        { goalDifference: 'desc' },
        { goalsFor: 'desc' },
      ],
    });

    // Get team names
    const teamIds = standings.map((s) => s.teamId);
    const teams = await prisma.team.findMany({
      where: {
        id: { in: teamIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const teamMap = new Map(teams.map((t) => [t.id, t.name]));

    // Update positions and get form (last 5 matches)
    // For now, we'll use dummy form data - you can implement actual form tracking
    const standingsWithDetails = await Promise.all(
      standings.map(async (s, index) => {
        // Update position if changed
        const newPosition = index + 1;
        if (s.position !== newPosition) {
          await prisma.standings.update({
            where: { id: s.id },
            data: { position: newPosition },
          });
        }

        return {
          id: s.id,
          position: newPosition,
          teamId: s.teamId,
          teamName: teamMap.get(s.teamId) || 'Unknown Team',
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDifference: s.goalDifference,
          points: s.points,
          form: [], // TODO: Implement actual form tracking from matches
        };
      })
    );

    return NextResponse.json({
      league,
      standings: standingsWithDetails,
    });
  } catch (error) {
    console.error('Get standings error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch standings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
