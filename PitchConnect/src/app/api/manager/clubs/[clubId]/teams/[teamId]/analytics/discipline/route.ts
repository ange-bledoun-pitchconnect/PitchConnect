// src/app/api/manager/clubs/[clubId]/teams/[teamId]/analytics/discipline/route.ts
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

    // Get disciplinary records
    const cardEvents = await prisma.matchEvent.findMany({
      where: {
        eventType: {
          in: ['YELLOW_CARD', 'RED_CARD'],
        },
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
          date: 'desc',
        },
      },
    });

    // Group by player
    const playerDiscipline = new Map<string, any>();

    cardEvents.forEach((event) => {
      const playerId = event.playerId;
      if (!playerDiscipline.has(playerId)) {
        playerDiscipline.set(playerId, {
          playerId,
          playerName: `${event.player.user.firstName} ${event.player.user.lastName}`,
          position: event.player.position,
          yellowCards: 0,
          redCards: 0,
          suspensions: 0,
          cards: [],
        });
      }
      const player = playerDiscipline.get(playerId);

      if (event.eventType === 'YELLOW_CARD') {
        player.yellowCards++;
      } else if (event.eventType === 'RED_CARD') {
        player.redCards++;
        player.suspensions++;
      }

      player.cards.push({
        type: event.eventType,
        date: event.match.date,
        minute: event.minute,
        match: `${event.match.homeTeam.name} vs ${event.match.awayTeam.name}`,
        note: event.note,
      });
    });

    const discipline = Array.from(playerDiscipline.values()).sort(
      (a, b) => (b.yellowCards + b.redCards * 2) - (a.yellowCards + a.redCards * 2)
    );

    return NextResponse.json(discipline);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/discipline error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch disciplinary records',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
