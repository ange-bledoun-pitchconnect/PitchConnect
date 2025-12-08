/**
 * Player Performance Analytics API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/player/[playerId]
 *
 * Returns: Detailed performance analytics for a specific player including goals,
 * assists, cards, and match-by-match breakdown
 *
 * Authorization: Only club owner can access
 *
 * Response:
 * {
 *   player: { id, name, position, shirtNumber },
 *   performance: Array<{
 *     date: Date,
 *     matchId: string,
 *     goals: number,
 *     assists: number,
 *     yellowCards: number,
 *     redCards: number,
 *     isStarting: boolean,
 *     events: Array<{ type, minute, note }>
 *   }>,
 *   stats: {
 *     totalGoals: number,
 *     totalAssists: number,
 *     totalYellowCards: number,
 *     totalRedCards: number,
 *     totalAppearances: number
 *   }
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type PerformanceRecord = {
  date: Date;
  matchId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  isStarting: boolean;
  events: Array<{
    type: string;
    minute: number;
    note?: string;
  }>;
};

type PerformanceRecord = {
  date: Date;
  matchId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  isStarting: boolean;
  events: Array<{
    type: string;
    minute: number;
    note?: string;
  }>;
};

export async function GET(
  _req: NextRequest,
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; playerId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, playerId } = params;

    // Verify club exists and user owns it
    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== session.user.id) {
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

    // Get player with user details
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!player) {
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Verify player belongs to the team using TeamPlayer relation (correct per schema)
    const teamPlayer = await prisma.teamPlayer.findFirst({
      where: {
        playerId,
        teamId,
      },
    });

    if (!teamPlayer) {
      return NextResponse.json(
        { error: 'Player not found in this team' },
        { status: 404 }
      );
    }

    // Get all match events for this player
    const events = await prisma.matchEvent.findMany({
      where: { playerId },
      include: {
        match: {
          select: {
            id: true,
            id: true,
            date: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
            homeGoals: true,
            awayGoals: true,
            homeGoals: true,
            awayGoals: true,
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
      where: { playerId },
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
        match: {
          date: 'asc',
        },
      },
    });

    // Build performance history by match using matchId as key for uniqueness
    const performanceByMatch = new Map<string, PerformanceRecord>();
    // Build performance history by match using matchId as key for uniqueness
    const performanceByMatch = new Map<string, PerformanceRecord>();

    // First, add match attendances to establish match presence
    matchAttendances.forEach((attendance) => {
      const matchId = attendance.match.id;

      // Determine if player was starting
      const isStarting =
        attendance.status === 'STARTING_LINEUP' || attendance.status === 'ATTENDED';

      if (!performanceByMatch.has(matchId)) {
        performanceByMatch.set(matchId, {
          date: attendance.match.date,
          matchId,
      if (!performanceByMatch.has(matchId)) {
        performanceByMatch.set(matchId, {
          date: attendance.match.date,
          matchId,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          isStarting,
          isStarting,
          events: [],
        });
      } else {
        // Update starting status if this is a starting appearance
        const perf = performanceByMatch.get(matchId)!;
        if (isStarting) {
          perf.isStarting = true;
        }
      } else {
        // Update starting status if this is a starting appearance
        const perf = performanceByMatch.get(matchId)!;
        if (isStarting) {
          perf.isStarting = true;
        }
      }
    });

    // Add all events to corresponding matches
    // Add all events to corresponding matches
    events.forEach((event) => {
      const matchId = event.match.id;
      const matchId = event.match.id;

      if (!performanceByMatch.has(matchId)) {
        performanceByMatch.set(matchId, {
          date: event.match.date,
          matchId,
      if (!performanceByMatch.has(matchId)) {
        performanceByMatch.set(matchId, {
          date: event.match.date,
          matchId,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          isStarting: false,
          events: [],
        });
      }

      const perf = performanceByMatch.get(matchId)!;
      const perf = performanceByMatch.get(matchId)!;

      // Count event types using correct schema field name 'type'
      if (event.type === 'GOAL') {
        perf.goals++;
      } else if (event.type === 'ASSIST') {
      } else if (event.type === 'ASSIST') {
        perf.assists++;
      } else if (event.type === 'YELLOW_CARD') {
      } else if (event.type === 'YELLOW_CARD') {
        perf.yellowCards++;
      } else if (event.type === 'RED_CARD') {
      } else if (event.type === 'RED_CARD') {
        perf.redCards++;
      }

      perf.events.push({
        type: event.type,
        type: event.type,
        minute: event.minute,
        note: event.additionalInfo || undefined,
        note: event.additionalInfo || undefined,
      });
    });

    // Convert to array and sort by date
    const performance = Array.from(performanceByMatch.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Calculate aggregate statistics
    const stats = performance.reduce(
      (acc, perf) => ({
        totalGoals: acc.totalGoals + perf.goals,
        totalAssists: acc.totalAssists + perf.assists,
        totalYellowCards: acc.totalYellowCards + perf.yellowCards,
        totalRedCards: acc.totalRedCards + perf.redCards,
        totalAppearances: acc.totalAppearances + 1,
      }),
      {
        totalGoals: 0,
        totalAssists: 0,
        totalYellowCards: 0,
        totalRedCards: 0,
        totalAppearances: 0,
      }
    );
    // Convert to array and sort by date
    const performance = Array.from(performanceByMatch.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Calculate aggregate statistics
    const stats = performance.reduce(
      (acc, perf) => ({
        totalGoals: acc.totalGoals + perf.goals,
        totalAssists: acc.totalAssists + perf.assists,
        totalYellowCards: acc.totalYellowCards + perf.yellowCards,
        totalRedCards: acc.totalRedCards + perf.redCards,
        totalAppearances: acc.totalAppearances + 1,
      }),
      {
        totalGoals: 0,
        totalAssists: 0,
        totalYellowCards: 0,
        totalRedCards: 0,
        totalAppearances: 0,
      }
    );

    return NextResponse.json({
      player: {
        id: player.id,
        name: `${player.user.firstName} ${player.user.lastName}`,
        position: player.position,
        shirtNumber: player.shirtNumber,
      },
      performance,
      stats,
      stats,
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/player/[playerId] error:',
      error
    );
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/player/[playerId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch player performance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
