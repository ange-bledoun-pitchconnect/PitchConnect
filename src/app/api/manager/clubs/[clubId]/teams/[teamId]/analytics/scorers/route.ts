// src/app/api/manager/clubs/[clubId]/teams/[teamId]/analytics/scorers/route.ts
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

    // Verify access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get top scorers
    const goalEvents = await prisma.matchEvent.findMany({
      where: {
        eventType: 'GOAL',
        player: {
          teamId,
        },
      },
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
        match: {
          select: {
            date: true,
          },
        },
      },
      orderBy: {
        match: {
          date: 'desc',
        },
      },
    });

    // Group by player
    const playerGoals = new Map<string, any>();

    goalEvents.forEach((event) => {
      const playerId = event.playerId;
      if (!playerGoals.has(playerId)) {
        playerGoals.set(playerId, {
          playerId,
          playerName: `${event.player.user.firstName} ${event.player.user.lastName}`,
          position: event.player.position,
          goals: 0,
          lastGoalDate: event.match.date,
        });
      }
      const player = playerGoals.get(playerId);
      player.goals++;
      player.lastGoalDate = event.match.date;
    });

    const scorers = Array.from(playerGoals.values()).sort((a, b) => b.goals - a.goals);

    return NextResponse.json(scorers);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/scorers error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch top scorers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
