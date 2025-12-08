/**
 * Team Assists Analytics API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/assists
 *
 * Returns: Top assist providers for a team sorted by number of assists
 * Authorization: Only club owner can access
 *
 * Response:
 * {
 *   teamId: string,
 *   clubId: string,
 *   totalAssists: number,
 *   topAssistProviders: Array<{
 *     playerId: string,
 *     playerName: string,
 *     position: string,
 *     assistCount: number,
 *     lastAssistDate: Date
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

    // Verify club ownership
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

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

    // Get assist events - MatchEvent uses 'type' field, not 'eventType'
    // Find assists by players in this team
    const assistEvents = await prisma.matchEvent.findMany({
      where: {
        type: 'ASSIST', // Correct field name from schema
        player: {
          // Get assists from players in this team
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
          },
        },
        match: {
          select: {
            id: true,
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

    // Group assists by player with proper typing
    const playerAssistsMap = new Map<
      string,
      {
        playerId: string;
        playerName: string;
        position: string;
        assistCount: number;
        lastAssistDate: Date;
      }
    >();

    assistEvents.forEach((event) => {
      // TypeScript safety: Filter out events with null player
      if (!event.player) {
        return;
      }

      const playerId = event.player.id;
      const playerName = `${event.player.firstName} ${event.player.lastName}`;

      if (!playerAssistsMap.has(playerId)) {
        playerAssistsMap.set(playerId, {
          playerId,
          playerName,
          position: event.player.position,
          assistCount: 0,
          lastAssistDate: event.match.date,
        });
      }

      const playerData = playerAssistsMap.get(playerId)!;
      playerData.assistCount++;
      playerData.lastAssistDate = event.match.date; // Keep most recent
    });

    // Convert to array and sort by assist count (descending)
    const topAssistProviders = Array.from(playerAssistsMap.values()).sort(
      (a, b) => b.assistCount - a.assistCount
    );

    return NextResponse.json({
      teamId,
      clubId,
      totalAssists: assistEvents.length,
      topAssistProviders,
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/assists error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch assists analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
