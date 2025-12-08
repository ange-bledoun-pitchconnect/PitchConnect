/**
 * Top Scorers Analytics API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/scorers
 *
 * Returns: Ranked list of top goal scorers for the team with goal count
 * and last goal date
 *
 * Authorization: Only club owner can access
 *
 * Response:
 * Array<{
 *   playerId: string,
 *   playerName: string,
 *   position: string,
 *   goals: number,
 *   lastGoalDate: Date
 * }>
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type ScorerStats = {
  playerId: string;
  playerName: string;
  position: string;
  goals: number;
  lastGoalDate: Date;
};

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

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team exists and belongs to club
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get goal events for players in this team
    // Using correct field name 'type' instead of 'eventType'
    const goalEvents = await prisma.matchEvent.findMany({
      where: {
        type: 'GOAL',
        player: {
          // Player must be in this team via TeamPlayer relation
          teams: {
            some: {
              teamId,
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

    // Group by player and count goals
    const playerGoals = new Map<string, ScorerStats>();

    goalEvents.forEach((event) => {
      // Null check for player
      if (!event.player) {
        return;
      }

      const playerId = event.player.id;

      if (!playerGoals.has(playerId)) {
        playerGoals.set(playerId, {
          playerId,
          playerName: `${event.player.user.firstName} ${event.player.user.lastName}`,
          position: event.player.position || 'Unknown',
          goals: 0,
          lastGoalDate: event.match.date,
        });
      }

      const player = playerGoals.get(playerId)!;
      player.goals++;
      player.lastGoalDate = event.match.date;
    });

    // Sort by goals (descending)
    const scorers = Array.from(playerGoals.values()).sort(
      (a, b) => b.goals - a.goals
    );

    return NextResponse.json(scorers);
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/scorers error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch top scorers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
