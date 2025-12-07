/**
 * Team Analytics API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics
 *
 * Returns: Comprehensive team statistics including match results, player stats,
 * goals, assists, clean sheets, and win rate
 *
 * Authorization: Only club owner can access
 *
 * Response:
 * {
 *   teamStats: {
 *     totalMatches: number,
 *     totalGoals: number,
 *     totalAssists: number,
 *     wins: number,
 *     draws: number,
 *     losses: number,
 *     winRate: number,
 *     goalsPerGame: number,
 *     cleanSheets: number,
 *     avgAppearances: number
 *   },
 *   playerStats: Array<{
 *     playerId: string,
 *     playerName: string,
 *     position: string,
 *     shirtNumber: number,
 *     goals: number,
 *     assists: number,
 *     appearances: number,
 *     ... (other stats)
 *   }>
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get all matches for this team (use correct status)
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: 'FINISHED',
      },
      include: {
        events: true,
        homeTeam: true,
        awayTeam: true,
      },
    });

    // Calculate team stats
    const totalMatches = matches.length;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let totalGoalsFor = 0;
    let totalGoalsAgainst = 0;
    let cleanSheets = 0;

    matches.forEach((match) => {
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? match.homeGoals : match.awayGoals;
      const opponentScore = isHome ? match.awayGoals : match.homeGoals;

      // Handle null scores (match not completed)
      if (teamScore === null || opponentScore === null) return;

      totalGoalsFor += teamScore;
      totalGoalsAgainst += opponentScore;

      if (teamScore > opponentScore) {
        wins++;
      } else if (teamScore === opponentScore) {
        draws++;
      } else {
        losses++;
      }

      if (opponentScore === 0) {
        cleanSheets++;
      }
    });

    const goalsPerGame = totalMatches > 0 ? totalGoalsFor / totalMatches : 0;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    // Get all players in this team
    const teamPlayers = await prisma.teamPlayer.findMany({
      where: { teamId },
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const playerStats = await Promise.all(
      teamPlayers.map(async (tp) => {
        const player = tp.player;

        // Get all events for this player
        const playerEvents = await prisma.matchEvent.findMany({
          where: {
            playerId: player.id,
          },
          include: {
            match: true,
          },
        });

        // Count events using correct field name 'type'
        const goals = playerEvents.filter((e) => e.type === 'GOAL').length;
        const assists = playerEvents.filter((e) => e.type === 'ASSIST').length;
        const yellowCards = playerEvents.filter((e) => e.type === 'YELLOW_CARD').length;
        const redCards = playerEvents.filter((e) => e.type === 'RED_CARD').length;

        // Get match attendances for this player
        const matchAttendances = await prisma.matchAttendance.findMany({
          where: { playerId: player.id },
        });

        const appearances = matchAttendances.length;
        const matchesInStarting11 = matchAttendances.filter(
          (ma) => ma.status === 'STARTING_LINEUP'
        ).length;
        const substitutedOn = matchAttendances.filter(
          (ma) => ma.status === 'SUBSTITUTE'
        ).length;

        return {
          playerId: player.id,
          playerName: `${player.user.firstName} ${player.user.lastName}`,
          position: player.position || 'Unknown',
          shirtNumber: player.shirtNumber,
          goals,
          assists,
          appearances,
          goalsPerGame: appearances > 0 ? goals / appearances : 0,
          assistsPerGame: appearances > 0 ? assists / appearances : 0,
          matchesInStarting11,
          substitutedOn,
          yellowCards,
          redCards,
          cleanSheets: 0, // Could calculate per player if needed
        };
      })
    );

    // Calculate team assists (sum of all player assists)
    const totalAssists = playerStats.reduce((sum, p) => sum + p.assists, 0);
    const avgAppearances =
      playerStats.length > 0
        ? playerStats.reduce((sum, p) => sum + p.appearances, 0) / playerStats.length
        : 0;

    return NextResponse.json({
      teamStats: {
        totalMatches,
        totalGoals: totalGoalsFor,
        totalAssists,
        wins,
        draws,
        losses,
        winRate: parseFloat(winRate.toFixed(2)),
        goalsPerGame: parseFloat(goalsPerGame.toFixed(2)),
        cleanSheets,
        avgAppearances: parseFloat(avgAppearances.toFixed(2)),
      },
      playerStats: playerStats.sort((a, b) => b.goals - a.goals),
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
