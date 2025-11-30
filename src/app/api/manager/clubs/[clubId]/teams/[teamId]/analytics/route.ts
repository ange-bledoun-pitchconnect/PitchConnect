// src/app/api/manager/clubs/[clubId]/teams/[teamId]/analytics/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Check if manager owns this club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get all matches for this team
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: 'COMPLETED',
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
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

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

    // Get player statistics
    const players = await prisma.player.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const playerStats = await Promise.all(
      players.map(async (player) => {
        // Get all events for this player
        const playerEvents = await prisma.matchEvent.findMany({
          where: {
            playerId: player.id,
          },
          include: {
            match: true,
          },
        });

        // Count events
        const goals = playerEvents.filter((e) => e.eventType === 'GOAL').length;
        const assists = playerEvents.filter((e) => e.eventType === 'ASSIST').length;
        const yellowCards = playerEvents.filter((e) => e.eventType === 'YELLOW_CARD').length;
        const redCards = playerEvents.filter((e) => e.eventType === 'RED_CARD').length;
        const ownGoals = playerEvents.filter((e) => e.eventType === 'OWN_GOAL').length;

        // Get lineup appearances
        const lineupAppearances = await prisma.lineupPlayer.findMany({
          where: { playerId: player.id },
        });

        const appearances = lineupAppearances.length;
        const matchesInStarting11 = lineupAppearances.filter((lp) => !lp.isSubstitute).length;
        const substitutedOn = playerEvents.filter((e) => e.eventType === 'SUBSTITUTION_ON').length;
        const substitutedOff = playerEvents.filter((e) => e.eventType === 'SUBSTITUTION_OFF').length;

        return {
          playerId: player.id,
          playerName: `${player.user.firstName} ${player.user.lastName}`,
          position: player.position || 'Unknown',
          jerseyNumber: player.jerseyNumber,
          goals,
          assists,
          appearances,
          goalsPerGame: appearances > 0 ? goals / appearances : 0,
          assistsPerGame: appearances > 0 ? assists / appearances : 0,
          matchesInStarting11,
          substitutedOn,
          substitutedOff,
          yellowCards,
          redCards,
          ownGoals,
        };
      })
    );

    // Calculate team assists
    const allGoalEvents = await prisma.matchEvent.findMany({
      where: {
        match: {
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        },
        eventType: 'GOAL',
      },
    });

    const totalAssists = playerStats.reduce((sum, p) => sum + p.assists, 0);
    const avgAppearances = players.length > 0 ? playerStats.reduce((sum, p) => sum + p.appearances, 0) / players.length : 0;

    return NextResponse.json({
      teamStats: {
        totalMatches,
        totalGoals: totalGoalsFor,
        totalAssists,
        wins,
        draws,
        losses,
        winRate,
        goalsPerGame,
        cleanSheets,
        avgAppearances,
      },
      playerStats: playerStats.sort((a, b) => b.goals - a.goals),
    });
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
