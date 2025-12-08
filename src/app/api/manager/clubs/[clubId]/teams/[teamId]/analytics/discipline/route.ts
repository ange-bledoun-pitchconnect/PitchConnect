/**
 * Team Discipline Analytics API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/discipline
 *
 * Returns: Disciplinary records (yellow/red cards) for team players
 * Authorization: Only club owner can access
 *
 * Response:
 * {
 *   teamId: string,
 *   clubId: string,
 *   totalCards: number,
 *   playerDiscipline: Array<{
 *     playerId: string,
 *     playerName: string,
 *     position: string,
 *     yellowCards: number,
 *     redCards: number,
 *     suspensions: number,
 *     cards: Array<{
 *       type: string,
 *       date: Date,
 *       minute: number,
 *       match: string,
 *       note?: string
 *     }>
 *   }>
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;

    // Verify club ownership
    // Verify club ownership
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check authorization - only club owner can access
    if (club.ownerId !== session.user.id) {
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check authorization - only club owner can access
    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get disciplinary records (yellow and red cards)
    // MatchEvent uses 'type' field, not 'eventType'
    // Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get disciplinary records (yellow and red cards)
    // MatchEvent uses 'type' field, not 'eventType'
    const cardEvents = await prisma.matchEvent.findMany({
      where: {
        type: {
        type: {
          in: ['YELLOW_CARD', 'RED_CARD'],
        },
        player: {
          // Get cards from players in this team
          teams: {
            some: {
              teamId: teamId,
            },
          },
          // Get cards from players in this team
          teams: {
            some: {
              teamId: teamId,
            },
          },
        },
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        match: {
          select: {
            id: true,
            id: true,
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

    // Group discipline records by player with proper typing
    const playerDisciplineMap = new Map<
      string,
      {
        playerId: string;
        playerName: string;
        position: string;
        yellowCards: number;
        redCards: number;
        suspensions: number;
        cards: Array<{
          type: string;
          date: Date;
          minute: number;
          match: string;
          note?: string;
        }>;
      }
    >();
    // Group discipline records by player with proper typing
    const playerDisciplineMap = new Map<
      string,
      {
        playerId: string;
        playerName: string;
        position: string;
        yellowCards: number;
        redCards: number;
        suspensions: number;
        cards: Array<{
          type: string;
          date: Date;
          minute: number;
          match: string;
          note?: string;
        }>;
      }
    >();

    cardEvents.forEach((event) => {
      // TypeScript safety: Filter out events with null player
      if (!event.player) {
        return;
      }

      const playerId = event.player.id;
      const playerName = `${event.player.firstName} ${event.player.lastName}`;

      if (!playerDisciplineMap.has(playerId)) {
        playerDisciplineMap.set(playerId, {
      // TypeScript safety: Filter out events with null player
      if (!event.player) {
        return;
      }

      const playerId = event.player.id;
      const playerName = `${event.player.firstName} ${event.player.lastName}`;

      if (!playerDisciplineMap.has(playerId)) {
        playerDisciplineMap.set(playerId, {
          playerId,
          playerName,
          playerName,
          position: event.player.position,
          yellowCards: 0,
          redCards: 0,
          suspensions: 0,
          cards: [],
        });
      }

      const playerData = playerDisciplineMap.get(playerId)!;

      const playerData = playerDisciplineMap.get(playerId)!;

      // Track card type and update counts
      if (event.type === 'YELLOW_CARD') {
        playerData.yellowCards++;
      } else if (event.type === 'RED_CARD') {
        playerData.redCards++;
        playerData.suspensions++;
      // Track card type and update counts
      if (event.type === 'YELLOW_CARD') {
        playerData.yellowCards++;
      } else if (event.type === 'RED_CARD') {
        playerData.redCards++;
        playerData.suspensions++;
      }

      // Add card record
      playerData.cards.push({
        type: event.type,
      // Add card record
      playerData.cards.push({
        type: event.type,
        date: event.match.date,
        minute: event.minute,
        match: `${event.match.homeTeam.name} vs ${event.match.awayTeam.name}`,
        note: event.additionalInfo || undefined,
        note: event.additionalInfo || undefined,
      });
    });

    // Convert to array and sort by severity (red cards weighted 2x)
    const playerDiscipline = Array.from(playerDisciplineMap.values()).sort(
      (a, b) =>
        b.yellowCards +
        b.redCards * 2 -
        (a.yellowCards + a.redCards * 2)
    // Convert to array and sort by severity (red cards weighted 2x)
    const playerDiscipline = Array.from(playerDisciplineMap.values()).sort(
      (a, b) =>
        b.yellowCards +
        b.redCards * 2 -
        (a.yellowCards + a.redCards * 2)
    );

    return NextResponse.json({
      teamId,
      clubId,
      totalCards: cardEvents.length,
      playerDiscipline,
    });
    return NextResponse.json({
      teamId,
      clubId,
      totalCards: cardEvents.length,
      playerDiscipline,
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/discipline error:',
      error
    );
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/discipline error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch disciplinary records',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
