/**
 * Top Scorers Analytics API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/scorers
 *
 * Returns: Ranked list of top goal scorers for the team with detailed stats,
 * goals per game, and performance metrics
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
 *     totalTeamGoals: number,
 *     topScorers: Array<{
 *       playerId: string,
 *       userId: string,
 *       playerName: string,
 *       position: string,
 *       shirtNumber: number | null,
 *       goals: number,
 *       goalsPerGame: number,
 *       appearances: number,
 *       lastGoalDate: Date,
 *       consecutiveGoals: number
 *     }>
 *   }
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ScorerStats {
  playerId: string;
  userId: string;
  playerName: string;
  position: string;
  shirtNumber: number | null;
  goals: number;
  goalsPerGame: number;
  appearances: number;
  lastGoalDate: Date;
  consecutiveGoals: number;
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

    // Verify club exists and user owns it
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

    if (club.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the club owner' },
        { status: 403 }
      );
    }

    // Verify team exists and belongs to club (using Team model from new schema)
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

    // Get goal events for players in this team using correct field name 'type'
    const goalEvents = await prisma.matchEvent.findMany({
      where: {
        type: 'GOAL',
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
          },
        },
      },
      orderBy: {
        match: {
          date: 'desc',
        },
      },
    });

    // Get match appearances for all players to calculate goals per game
    const matchAttendances = await prisma.matchAttendance.findMany({
      where: {
        playerId: {
          in: goalEvents.map((e) => e.playerId).filter(Boolean) as string[],
        },
        match: {
          status: 'FINISHED',
        },
      },
    });

    // Group by player and count goals with appearances
    const playerGoalsMap = new Map<string, ScorerStats>();
    const playerAppearances = new Map<string, number>();

    // Count appearances first
    matchAttendances.forEach((attendance) => {
      const count = playerAppearances.get(attendance.playerId) || 0;
      playerAppearances.set(attendance.playerId, count + 1);
    });

    // Process goal events
    goalEvents.forEach((event) => {
      // Null check for player
      if (!event.player || !event.player.user) {
        return;
      }

      const playerId = event.player.id;
      const userId = event.player.user.id;
      const playerName = `${event.player.user.firstName} ${event.player.user.lastName}`;
      const position = event.player.position || 'Unknown';
      const shirtNumber = event.player.shirtNumber;

      if (!playerGoalsMap.has(playerId)) {
        playerGoalsMap.set(playerId, {
          playerId,
          userId,
          playerName,
          position,
          shirtNumber,
          goals: 0,
          goalsPerGame: 0,
          appearances: playerAppearances.get(playerId) || 1,
          lastGoalDate: event.match.date,
          consecutiveGoals: 1,
        });
      }

      const playerData = playerGoalsMap.get(playerId)!;
      playerData.goals++;
      playerData.lastGoalDate = event.match.date;

      // Update goals per game
      playerData.goalsPerGame = parseFloat(
        (playerData.goals / playerData.appearances).toFixed(2)
      );
    });

    // Calculate consecutive goals (simplified: goals in last N matches)
    const topScorersArray = Array.from(playerGoalsMap.values()).map((scorer) => {
      // Get last 3 goals for this player
      const recentGoals = goalEvents
        .filter((e) => e.playerId === scorer.playerId)
        .slice(0, 3);

      // Count consecutive games with goals
      let consecutive = 0;
      for (const goal of recentGoals) {
        consecutive++;
        // If there's a gap between goals (more than 7 days), break the streak
        if (
          recentGoals[recentGoals.indexOf(goal) + 1] &&
          goal.match.date.getTime() -
            recentGoals[recentGoals.indexOf(goal) + 1].match.date.getTime() >
            7 * 24 * 60 * 60 * 1000
        ) {
          break;
        }
      }

      return {
        ...scorer,
        consecutiveGoals: consecutive,
      };
    });

    // Sort by goals (descending), then by goals per game
    const topScorers = topScorersArray.sort((a, b) => {
      if (b.goals !== a.goals) {
        return b.goals - a.goals;
      }
      return b.goalsPerGame - a.goalsPerGame;
    });

    // Calculate total team goals
    const totalTeamGoals = topScorers.reduce((sum, s) => sum + s.goals, 0);

    return NextResponse.json({
      success: true,
      data: {
        teamId,
        teamName: team.name,
        clubId,
        totalTeamGoals,
        scorerCount: topScorers.length,
        topScorers,
      },
    });
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
