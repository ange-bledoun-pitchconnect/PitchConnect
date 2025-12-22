/**
 * Team Discipline Analytics API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/discipline
 *
 * Returns: Disciplinary records (yellow/red cards) for team players
 * with detailed breakdown and suspension tracking
 *
 * Authorization: Only club owner can access
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     teamId: string,
 *     teamName: string,
 *     clubId: string,
 *     totalCards: number,
 *     totalYellowCards: number,
 *     totalRedCards: number,
 *     playerDiscipline: Array<{
 *       playerId: string,
 *       userId: string,
 *       playerName: string,
 *       position: string,
 *       shirtNumber: number | null,
 *       yellowCards: number,
 *       redCards: number,
 *       totalDisciplinaryPoints: number,
 *       cards: Array<{
 *         type: string,
 *         date: Date,
 *         minute: number,
 *         matchInfo: string,
 *         note?: string
 *       }>
 *     }>
 *   }
 * }
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface DisciplinaryCard {
  type: string;
  date: Date;
  minute: number;
  matchInfo: string;
  note?: string;
}

interface PlayerDiscipline {
  playerId: string;
  userId: string;
  playerName: string;
  position: string;
  shirtNumber: number | null;
  yellowCards: number;
  redCards: number;
  totalDisciplinaryPoints: number;
  cards: DisciplinaryCard[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await auth();

  if (!session) {
    return Response.json(
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

    // Get disciplinary records (yellow and red cards) from players in this team
    const cardEvents = await prisma.matchEvent.findMany({
      where: {
        type: {
          in: ['YELLOW_CARD', 'RED_CARD'],
        },
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

    // Group discipline records by player
    const playerDisciplineMap = new Map<string, PlayerDiscipline>();

    cardEvents.forEach((event) => {
      // TypeScript safety: Filter out events with null player
      if (!event.player || !event.player.user) {
        return;
      }

      const playerId = event.player.id;
      const userId = event.player.user.id;
      const playerName = `${event.player.user.firstName} ${event.player.user.lastName}`;
      const position = event.player.position || 'Unknown';
      const shirtNumber = event.player.shirtNumber;

      // Determine match info
      const isHomeTeam = event.match.homeTeamId === teamId;
      const opponentName = isHomeTeam
        ? event.match.awayTeam?.name || 'Unknown'
        : event.match.homeTeam?.name || 'Unknown';
      const matchInfo = `vs ${opponentName}`;

      if (!playerDisciplineMap.has(playerId)) {
        playerDisciplineMap.set(playerId, {
          playerId,
          userId,
          playerName,
          position,
          shirtNumber,
          yellowCards: 0,
          redCards: 0,
          totalDisciplinaryPoints: 0,
          cards: [],
        });
      }

      const playerData = playerDisciplineMap.get(playerId)!;

      // Track card type and update counts
      if (event.type === 'YELLOW_CARD') {
        playerData.yellowCards++;
        playerData.totalDisciplinaryPoints += 1;
      } else if (event.type === 'RED_CARD') {
        playerData.redCards++;
        playerData.totalDisciplinaryPoints += 3; // Red cards weighted 3x
      }

      // Add card record
      playerData.cards.push({
        type: event.type,
        date: event.match.date,
        minute: event.minute,
        matchInfo,
        note: event.additionalInfo || undefined,
      });
    });

    // Convert to array and sort by disciplinary points (severity-weighted)
    const playerDiscipline: PlayerDiscipline[] = Array.from(
      playerDisciplineMap.values()
    )
      .map((player) => ({
        ...player,
        cards: player.cards.sort((a, b) => b.date.getTime() - a.date.getTime()),
      }))
      .sort((a, b) => {
        // Primary sort: by total disciplinary points (descending)
        if (b.totalDisciplinaryPoints !== a.totalDisciplinaryPoints) {
          return b.totalDisciplinaryPoints - a.totalDisciplinaryPoints;
        }
        // Secondary sort: by red cards (descending)
        if (b.redCards !== a.redCards) {
          return b.redCards - a.redCards;
        }
        // Tertiary sort: by yellow cards (descending)
        return b.yellowCards - a.yellowCards;
      });

    // Calculate team-wide discipline stats
    const totalYellowCards = cardEvents.filter((e) => e.type === 'YELLOW_CARD').length;
    const totalRedCards = cardEvents.filter((e) => e.type === 'RED_CARD').length;

    return NextResponse.json({
      success: true,
      data: {
        teamId,
        teamName: team.name,
        clubId,
        totalCards: cardEvents.length,
        totalYellowCards,
        totalRedCards,
        playerCount: playerDisciplineMap.size,
        playerDiscipline,
      },
    });
  } catch (error) {
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
