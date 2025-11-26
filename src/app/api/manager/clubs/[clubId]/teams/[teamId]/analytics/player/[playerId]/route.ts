// src/app/api/manager/clubs/[clubId]/teams/[teamId]/analytics/player/[playerId]/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; playerId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, playerId } = params;

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Verify access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get player
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

    if (!player || player.teamId !== teamId) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get all events for this player ordered by date
    const events = await prisma.matchEvent.findMany({
      where: { playerId },
      include: {
        match: {
          select: {
            date: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
            homeScore: true,
            awayScore: true,
          },
        },
      },
      orderBy: {
        match: {
          date: 'asc',
        },
      },
    });

    // Get lineup appearances
    const lineupAppearances = await prisma.lineupPlayer.findMany({
      where: { playerId },
      include: {
        lineup: {
          include: {
            match: {
              select: {
                date: true,
              },
            },
          },
        },
      },
      orderBy: {
        lineup: {
          match: {
            date: 'asc',
          },
        },
      },
    });

    // Build performance history by match
    const performanceByMatch = new Map<string, any>();

    lineupAppearances.forEach((appearance) => {
      const matchDate = appearance.lineup.match.date;
      const dateKey = matchDate.toISOString();

      if (!performanceByMatch.has(dateKey)) {
        performanceByMatch.set(dateKey, {
          date: matchDate,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          isStarting: !appearance.isSubstitute,
          events: [],
        });
      }
    });

    events.forEach((event) => {
      const matchDate = event.match.date;
      const dateKey = matchDate.toISOString();

      if (!performanceByMatch.has(dateKey)) {
        performanceByMatch.set(dateKey, {
          date: matchDate,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          isStarting: false,
          events: [],
        });
      }

      const perf = performanceByMatch.get(dateKey);

      if (event.eventType === 'GOAL') {
        perf.goals++;
      } else if (event.eventType === 'ASSIST') {
        perf.assists++;
      } else if (event.eventType === 'YELLOW_CARD') {
        perf.yellowCards++;
      } else if (event.eventType === 'RED_CARD') {
        perf.redCards++;
      }

      perf.events.push({
        type: event.eventType,
        minute: event.minute,
        note: event.note,
      });
    });

    const performance = Array.from(performanceByMatch.values());

    return NextResponse.json({
      player: {
        id: player.id,
        name: `${player.user.firstName} ${player.user.lastName}`,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
      },
      performance,
    });
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/player/[playerId] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch player performance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
