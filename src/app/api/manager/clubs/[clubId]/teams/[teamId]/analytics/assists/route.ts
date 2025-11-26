// src/app/api/manager/clubs/[clubId]/teams/[teamId]/analytics/assists/route.ts
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

    // Get top assist providers
    const assistEvents = await prisma.matchEvent.findMany({
      where: {
        eventType: 'ASSIST',
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
    const playerAssists = new Map<string, any>();

    assistEvents.forEach((event) => {
      const playerId = event.playerId;
      if (!playerAssists.has(playerId)) {
        playerAssists.set(playerId, {
          playerId,
          playerName: `${event.player.user.firstName} ${event.player.user.lastName}`,
          position: event.player.position,
          assists: 0,
          lastAssistDate: event.match.date,
        });
      }
      const player = playerAssists.get(playerId);
      player.assists++;
      player.lastAssistDate = event.match.date;
    });

    const assists = Array.from(playerAssists.values()).sort((a, b) => b.assists - a.assists);

    return NextResponse.json(assists);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/assists error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch top assists',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
