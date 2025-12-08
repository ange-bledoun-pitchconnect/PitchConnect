/**
 * Team Analytics API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics
 *
 * Returns: Comprehensive team statistics including:
 * - Match results and performance metrics
 * - Player statistics (goals, assists, appearances)
 * - Win rate, goal differential, clean sheets
 * - Individual player performance breakdown
 *
 * Authorization: Only club owner can access their club's analytics
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     teamStats: {
 *       totalMatches: number,
 *       wins: number,
 *       draws: number,
 *       losses: number,
 *       totalGoalsFor: number,
 *       totalGoalsAgainst: number,
 *       goalDifference: number,
 *       winRate: number (%),
 *       drawRate: number (%),
 *       lossRate: number (%),
 *       goalsPerGame: number,
 *       goalsAgainstPerGame: number,
 *       cleanSheets: number,
 *       avgAppearances: number
 *     },
 *     playerStats: Array<{
 *       playerId: string,
 *       playerName: string,
 *       position: string,
 *       shirtNumber: number | null,
 *       goals: number,
 *       assists: number,
 *       appearances: number,
 *       minutesPlayed: number,
 *       goalsPerGame: number,
 *       assistsPerGame: number,
 *       startingAppearances: number,
 *       substitutedOn: number,
 *       yellowCards: number,
 *       redCards: number,
 *       avgPerformanceRating: number
 *     }>
 *   }
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
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { clubId, teamId } = params;

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the club owner' },
        { status: 403 }
      );
    }

    // Verify team exists and belongs to club (using Team model from new schema)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        clubId: true,
      },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json(
        { error: 'Team not found or does not belong to this club' },
        { status: 404 }
      );
    }

    // Get all finished matches for this team
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: teamId },
          { awayTeamId: teamId },
        ],
        status: 'FINISHED',
      },
      include: {
        events: {
          include: {
            player: true,
          },
        },
        stats: true,
        homeTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate comprehensive team statistics
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

      // Skip matches without final scores
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

      // Track clean sheets (no goals conceded)
      if (opponentScore === 0) {
        cleanSheets++;
      }
    });

    // Calculate performance metrics
    const completedMatches = wins + draws + losses;
    const winRate = completedMatches > 0
      ? parseFloat(((wins / completedMatches) * 100).toFixed(2))
      : 0;
    const drawRate = completedMatches > 0
      ? parseFloat(((draws / completedMatches) * 100).toFixed(2))
      : 0;
    const lossRate = completedMatches > 0
      ? parseFloat(((losses / completedMatches) * 100).toFixed(2))
      : 0;
    const goalsPerGame = completedMatches > 0
      ? parseFloat((totalGoalsFor / completedMatches).toFixed(2))
      : 0;
    const goalsAgainstPerGame = completedMatches > 0
      ? parseFloat((totalGoalsAgainst / completedMatches).toFixed(2))
      : 0;

    // Get all players in this team
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get player profiles and statistics
    const playerStatsPromises = teamMembers.map(async (member) => {
      const playerProfile = await prisma.player.findUnique({
        where: { userId: member.userId },
        select: {
          id: true,
          position: true,
          shirtNumber: true,
        },
      });

      if (!playerProfile) {
        return null;
      }

      // Get all match events (goals, assists, cards) for this player
      const playerEvents = await prisma.matchEvent.findMany({
        where: {
          playerId: playerProfile.id,
          match: {
            status: 'FINISHED',
          },
        },
        include: {
          match: true,
        },
      });

      // Count event types
      const goals = playerEvents.filter((e) => e.type === 'GOAL').length;
      const assists = playerEvents.filter((e) => e.type === 'ASSIST').length;
      const yellowCards = playerEvents.filter((e) => e.type === 'YELLOW_CARD').length;
      const redCards = playerEvents.filter((e) => e.type === 'RED_CARD').length;

      // Get match attendance records for this player
      const matchAttendances = await prisma.matchAttendance.findMany({
        where: {
          playerId: playerProfile.id,
          match: {
            status: 'FINISHED',
          },
        },
        include: {
          match: true,
        },
      });

      // Calculate appearance statistics
      const totalAppearances = matchAttendances.length;
      const startingAppearances = matchAttendances.filter(
        (ma) => ma.status === 'STARTING_LINEUP'
      ).length;
      const substitutedOn = matchAttendances.filter(
        (ma) => ma.status === 'SUBSTITUTE'
      ).length;
      const totalMinutesPlayed = matchAttendances.reduce(
        (sum, ma) => sum + (ma.minutesPlayed || 0),
        0
      );

      // Calculate performance ratings average
      const performanceRatings = matchAttendances
        .filter((ma) => ma.performanceRating !== null)
        .map((ma) => ma.performanceRating as number);
      const avgPerformanceRating = performanceRatings.length > 0
        ? parseFloat((
            performanceRatings.reduce((a, b) => a + b, 0) / performanceRatings.length
          ).toFixed(2))
        : 0;

      // Calculate per-game averages
      const goalsPerGame = totalAppearances > 0
        ? parseFloat((goals / totalAppearances).toFixed(2))
        : 0;
      const assistsPerGame = totalAppearances > 0
        ? parseFloat((assists / totalAppearances).toFixed(2))
        : 0;

      return {
        playerId: playerProfile.id,
        userId: member.userId,
        playerName: `${member.user.firstName} ${member.user.lastName}`,
        position: playerProfile.position || 'Unknown',
        shirtNumber: playerProfile.shirtNumber,
        goals,
        assists,
        appearances: totalAppearances,
        minutesPlayed: totalMinutesPlayed,
        goalsPerGame,
        assistsPerGame,
        startingAppearances,
        substitutedOn,
        yellowCards,
        redCards,
        avgPerformanceRating,
      };
    });

    const playerStats = (await Promise.all(playerStatsPromises))
      .filter((p) => p !== null)
      .sort((a, b) => (b?.goals || 0) - (a?.goals || 0));

    // Calculate team-wide player statistics
    const totalAssists = playerStats.reduce((sum, p) => sum + (p?.assists || 0), 0);
    const avgAppearances = playerStats.length > 0
      ? parseFloat(
          (playerStats.reduce((sum, p) => sum + (p?.appearances || 0), 0) / playerStats.length)
            .toFixed(2)
        )
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        team: {
          id: team.id,
          name: team.name,
        },
        teamStats: {
          totalMatches: completedMatches,
          wins,
          draws,
          losses,
          totalGoalsFor,
          totalGoalsAgainst,
          goalDifference: totalGoalsFor - totalGoalsAgainst,
          winRate,
          drawRate,
          lossRate,
          goalsPerGame,
          goalsAgainstPerGame,
          cleanSheets,
          avgAppearances,
        },
        playerStats,
      },
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch team analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
