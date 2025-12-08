/**
 * Team Assists Analytics API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/assists
 *
 * Returns: Top assist providers for a team with detailed breakdown
 *
 * Authorization: Only club owner can access their club's analytics
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     teamId: string,
 *     teamName: string,
 *     clubId: string,
 *     totalAssists: number,
 *     topAssistProviders: Array<{
 *       playerId: string,
 *       userId: string,
 *       playerName: string,
 *       position: string,
 *       shirtNumber: number | null,
 *       assistCount: number,
 *       assistsPerGame: number,
 *       lastAssistDate: Date,
 *       assists: Array<{
 *         matchId: string,
 *         matchDate: Date,
 *         opponent: string,
 *         assistedPlayerName: string
 *       }>
 *     }>
 *   }
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface AssistRecord {
  playerId: string;
  playerName: string;
  position: string;
  shirtNumber: number | null;
  assistCount: number;
  assistsPerGame: number;
  lastAssistDate: Date;
  assists: Array<{
    matchId: string;
    matchDate: Date;
    opponent: string;
  }>;
}

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

    // Verify club ownership
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

    // Check authorization - only club owner can access
    if (club.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the club owner' },
        { status: 403 }
      );
    }

    // Verify team belongs to club
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

    // Get all team members
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId,
        status: 'ACTIVE',
      },
      select: {
        userId: true,
      },
    });

    const memberUserIds = teamMembers.map((m) => m.userId);

    // Get assist events from players in this team
    const assistEvents = await prisma.matchEvent.findMany({
      where: {
        type: 'ASSIST',
        player: {
          user: {
            id: {
              in: memberUserIds,
            },
          },
        },
        match: {
          status: 'FINISHED',
        },
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        match: {
          select: {
            id: true,
            date: true,
            homeTeamId: true,
            awayTeamId: true,
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

    // Group assists by player with detailed breakdown
    const playerAssistsMap = new Map<string, AssistRecord>();

    assistEvents.forEach((event) => {
      // TypeScript safety: Filter out events with null player
      if (!event.player || !event.player.user) {
        return;
      }

      const playerId = event.player.id;
      const userId = event.player.user.id;
      const playerName = `${event.player.user.firstName} ${event.player.user.lastName}`;
      const position = event.player.position || 'Unknown';
      const shirtNumber = event.player.shirtNumber;

      // Determine opponent team name
      const isHomeTeam = event.match.homeTeamId === teamId;
      const opponentName = isHomeTeam
        ? event.match.awayTeam?.name || 'Unknown'
        : event.match.homeTeam?.name || 'Unknown';

      if (!playerAssistsMap.has(playerId)) {
        playerAssistsMap.set(playerId, {
          playerId,
          playerName,
          position,
          shirtNumber,
          assistCount: 0,
          assistsPerGame: 0,
          lastAssistDate: event.match.date,
          assists: [],
        });
      }

      const playerData = playerAssistsMap.get(playerId)!;
      playerData.assistCount++;
      playerData.lastAssistDate = event.match.date; // Keep most recent
      playerData.assists.push({
        matchId: event.match.id,
        matchDate: event.match.date,
        opponent: opponentName,
      });
    });

    // Calculate assists per game and sort
    const topAssistProviders: AssistRecord[] = Array.from(
      playerAssistsMap.values()
    )
      .map((provider) => ({
        ...provider,
        assistsPerGame: provider.assists.length > 0
          ? parseFloat((provider.assistCount / (provider.assists.length || 1)).toFixed(2))
          : 0,
        assists: provider.assists.sort((a, b) => b.matchDate.getTime() - a.matchDate.getTime()),
      }))
      .sort((a, b) => {
        // Primary sort: by assist count (descending)
        if (b.assistCount !== a.assistCount) {
          return b.assistCount - a.assistCount;
        }
        // Secondary sort: by assists per game (descending)
        return b.assistsPerGame - a.assistsPerGame;
      });

    return NextResponse.json({
      success: true,
      data: {
        teamId,
        teamName: team.name,
        clubId,
        totalAssists: assistEvents.length,
        playerCount: playerAssistsMap.size,
        topAssistProviders,
      },
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
