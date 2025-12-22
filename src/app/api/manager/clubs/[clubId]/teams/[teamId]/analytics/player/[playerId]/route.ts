/**
 * Player Performance Analytics API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/player/[playerId]
 *
 * Returns: Detailed performance analytics for a specific player including:
 * - Goals, assists, discipline records
 * - Match-by-match breakdown with detailed events
 * - Aggregate statistics and performance trends
 *
 * Authorization: Only club owner can access
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     player: {
 *       id: string,
 *       userId: string,
 *       name: string,
 *       position: string,
 *       shirtNumber: number | null,
 *       preferredFoot: string
 *     },
 *     performance: Array<{
 *       date: Date,
 *       matchId: string,
 *       opponent: string,
 *       goals: number,
 *       assists: number,
 *       yellowCards: number,
 *       redCards: number,
 *       minutesPlayed: number,
 *       performanceRating: number | null,
 *       isStarting: boolean,
 *       events: Array<{
 *         type: string,
 *         minute: number,
 *         note?: string
 *       }>
 *     }>,
 *     stats: {
 *       totalGoals: number,
 *       totalAssists: number,
 *       totalYellowCards: number,
 *       totalRedCards: number,
 *       totalAppearances: number,
 *       startingAppearances: number,
 *       substitutedAppearances: number,
 *       totalMinutesPlayed: number,
 *       avgPerformanceRating: number
 *     }
 *   }
 * }
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface MatchEvent {
  type: string;
  minute: number;
  note?: string;
}

interface PerformanceRecord {
  date: Date;
  matchId: string;
  opponent: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  performanceRating: number | null;
  isStarting: boolean;
  events: MatchEvent[];
}

interface PlayerStats {
  totalGoals: number;
  totalAssists: number;
  totalYellowCards: number;
  totalRedCards: number;
  totalAppearances: number;
  startingAppearances: number;
  substitutedAppearances: number;
  totalMinutesPlayed: number;
  avgPerformanceRating: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; playerId: string } }
) {
  const session = await auth();

  if (!session) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { clubId, teamId, playerId } = params;

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

    // Get player with user details
    const player = await prisma.player.findUnique({
      where: { id: playerId },
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

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Verify player belongs to the team using TeamMember relation
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: player.userId,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Player not found in this team' },
        { status: 404 }
      );
    }

    // Get all match events for this player
    const events = await prisma.matchEvent.findMany({
      where: {
        playerId,
        match: {
          status: 'FINISHED',
        },
      },
      include: {
        match: {
          select: {
            id: true,
            date: true,
            homeTeamId: true,
            homeTeam: {
              select: {
                name: true,
              },
            },
            awayTeam: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        match: {
          date: 'asc',
        },
      },
    });

    // Get all match attendances for this player (tracks lineup/participation)
    const matchAttendances = await prisma.matchAttendance.findMany({
      where: {
        playerId,
        match: {
          status: 'FINISHED',
        },
      },
      include: {
        match: {
          select: {
            id: true,
            date: true,
          },
        },
      },
      orderBy: {
        match: {
          date: 'asc',
        },
      },
    });

    // Build performance history by match using matchId as key for uniqueness
    const performanceByMatch = new Map<string, PerformanceRecord>();

    // First, add match attendances to establish match presence
    matchAttendances.forEach((attendance) => {
      const matchId = attendance.match.id;

      // Determine if player was starting
      const isStarting = attendance.status === 'STARTING_LINEUP';

      if (!performanceByMatch.has(matchId)) {
        performanceByMatch.set(matchId, {
          date: attendance.match.date,
          matchId,
          opponent: 'Unknown',
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: attendance.minutesPlayed || 0,
          performanceRating: attendance.performanceRating || null,
          isStarting,
          events: [],
        });
      } else {
        // Update starting status and minutes if needed
        const perf = performanceByMatch.get(matchId)!;
        if (isStarting) {
          perf.isStarting = true;
        }
        if (!perf.minutesPlayed && attendance.minutesPlayed) {
          perf.minutesPlayed = attendance.minutesPlayed;
        }
        if (!perf.performanceRating && attendance.performanceRating) {
          perf.performanceRating = attendance.performanceRating;
        }
      }
    });

    // Add all events to corresponding matches
    events.forEach((event) => {
      const matchId = event.match.id;

      if (!performanceByMatch.has(matchId)) {
        // Determine opponent
        const isHomeTeam = event.match.homeTeamId === teamId;
        const opponentName = isHomeTeam
          ? event.match.awayTeam?.name || 'Unknown'
          : event.match.homeTeam?.name || 'Unknown';

        performanceByMatch.set(matchId, {
          date: event.match.date,
          matchId,
          opponent: opponentName,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0,
          performanceRating: null,
          isStarting: false,
          events: [],
        });
      }

      const perf = performanceByMatch.get(matchId)!;

      // Set opponent if not already set
      if (perf.opponent === 'Unknown') {
        const isHomeTeam = event.match.homeTeamId === teamId;
        const opponentName = isHomeTeam
          ? event.match.awayTeam?.name || 'Unknown'
          : event.match.homeTeam?.name || 'Unknown';
        perf.opponent = opponentName;
      }

      // Count event types using correct schema field name 'type'
      if (event.type === 'GOAL') {
        perf.goals++;
      } else if (event.type === 'ASSIST') {
        perf.assists++;
      } else if (event.type === 'YELLOW_CARD') {
        perf.yellowCards++;
      } else if (event.type === 'RED_CARD') {
        perf.redCards++;
      }

      perf.events.push({
        type: event.type,
        minute: event.minute,
        note: event.additionalInfo || undefined,
      });
    });

    // Convert to array and sort by date
    const performance = Array.from(performanceByMatch.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Calculate aggregate statistics
    const startingAppearances = performance.filter((p) => p.isStarting).length;
    const substitutedAppearances = performance.filter((p) => !p.isStarting).length;
    const totalMinutesPlayed = performance.reduce((sum, p) => sum + p.minutesPlayed, 0);
    const performanceRatings = performance
      .filter((p) => p.performanceRating !== null)
      .map((p) => p.performanceRating as number);
    const avgPerformanceRating = performanceRatings.length > 0
      ? parseFloat((
          performanceRatings.reduce((a, b) => a + b, 0) / performanceRatings.length
        ).toFixed(2))
      : 0;

    const stats: PlayerStats = {
      totalGoals: performance.reduce((sum, p) => sum + p.goals, 0),
      totalAssists: performance.reduce((sum, p) => sum + p.assists, 0),
      totalYellowCards: performance.reduce((sum, p) => sum + p.yellowCards, 0),
      totalRedCards: performance.reduce((sum, p) => sum + p.redCards, 0),
      totalAppearances: performance.length,
      startingAppearances,
      substitutedAppearances,
      totalMinutesPlayed,
      avgPerformanceRating,
    };

    return NextResponse.json({
      success: true,
      data: {
        player: {
          id: player.id,
          userId: player.user.id,
          name: `${player.user.firstName} ${player.user.lastName}`,
          position: player.position,
          shirtNumber: player.shirtNumber,
          preferredFoot: player.preferredFoot,
        },
        performance,
        stats,
      },
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/player/[playerId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch player performance analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
