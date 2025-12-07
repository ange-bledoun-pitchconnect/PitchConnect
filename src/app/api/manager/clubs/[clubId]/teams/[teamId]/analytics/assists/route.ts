/**
 * Team Assists Analytics API
 * 
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/assists
 * 
 * Returns: Top assist providers for a team sorted by number of assists
 * Authorization: Only club owner can access
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

    // Get assist events from matches where team played
    // Note: Assists are recorded as ASSIST MatchEventType
    const assistEvents = await prisma.matchEvent.findMany({
      where: {
        type: 'ASSIST', // Changed from eventType to type (correct field name)
        player: {
          // Find assists by players in this team
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

    // Group assists by player
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
    const assists = Array.from(playerAssistsMap.values()).sort(
      (a, b) => b.assistCount - a.assistCount
    );

    return NextResponse.json({
      teamId,
      clubId,
      totalAssists: assistEvents.length,
      topAssistProviders: assists,
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
