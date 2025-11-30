/**
 * Manager Dashboard API
 * Get manager dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get or create manager record
    let manager = await prisma.manager.findFirst({
      where: { userId: user.id },
    });

    if (!manager) {
      // Auto-create manager profile if doesn't exist
      manager = await prisma.manager.create({
        data: { userId: user.id },
      });
    }

    // Get clubs with comprehensive team data
    const clubs = await prisma.club.findMany({
      where: { managerId: manager.id },
      include: {
        teams: {
          include: {
            _count: {
              select: {
                players: true,
                coaches: true,
              },
            },
            players: {
              select: {
                id: true,
              },
            },
            coaches: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate total players across all clubs
    const totalPlayers = clubs.reduce(
      (sum, club) => sum + club.teams.reduce((teamSum, team) => teamSum + team.players.length, 0),
      0
    );

    // Get upcoming matches (next 5) for all teams managed by this manager
    const teamIds = clubs.flatMap((club) => club.teams.map((team) => team.id));

    const upcomingMatches = await prisma.match.findMany({
      where: {
        OR: [
          {
            homeTeamId: { in: teamIds },
          },
          {
            awayTeamId: { in: teamIds },
          },
        ],
        date: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        fixture: {
          select: {
            league: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 5,
    });

    // Get recent completed matches for performance tracking (last 10)
    const recentMatches = await prisma.match.findMany({
      where: {
        OR: [
          {
            homeTeamId: { in: teamIds },
          },
          {
            awayTeamId: { in: teamIds },
          },
        ],
        status: 'COMPLETED',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      include: {
        homeTeam: {
          select: {
            id: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    });

    // Calculate recent performance (W-D-L)
    let wins = 0;
    let draws = 0;
    let losses = 0;

    const managedTeamIdSet = new Set(teamIds);

    recentMatches.forEach((match) => {
      const isHomeTeam = managedTeamIdSet.has(match.homeTeam.id);
      const teamScore = isHomeTeam ? match.homeScore! : match.awayScore!;
      const opponentScore = isHomeTeam ? match.awayScore! : match.homeScore!;

      if (teamScore > opponentScore) {
        wins++;
      } else if (teamScore < opponentScore) {
        losses++;
      } else {
        draws++;
      }
    });

    // Format clubs data with detailed team information
    const formattedClubs = clubs.map((club) => ({
      id: club.id,
      name: club.name,
      teams: club.teams.map((team) => ({
        id: team.id,
        name: team.name,
        coaches: team.coaches.map((coach) => ({
          id: coach.id,
          name: `${coach.user.firstName} ${coach.user.lastName}`,
        })),
        playerCount: team.players.length,
        budget: 0, // TODO: Implement budget tracking from Club financials
        pendingRequests: 0, // TODO: Implement pending requests count
      })),
      teamsCount: club.teams.length,
      playersCount: club.teams.reduce((sum, team) => sum + team.players.length, 0),
      totalBudget: 0, // TODO: Implement club-level budget
      pendingRequests: 0, // TODO: Implement club-level pending requests
    }));

    // Format upcoming matches
    const formattedUpcomingMatches = upcomingMatches.map((match) => ({
      id: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      date: match.date.toISOString(),
      competition: match.fixture?.league?.name || 'Friendly',
      venue: match.venue || 'TBD',
    }));

    return NextResponse.json({
      manager: {
        id: manager.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.image,
        clubs: formattedClubs,
      },
      stats: {
        totalClubs: clubs.length,
        totalTeams: clubs.reduce((sum, club) => sum + club.teams.length, 0),
        totalPlayers: totalPlayers,
        upcomingMatches: upcomingMatches.length,
        recentResults: {
          wins,
          draws,
          losses,
        },
        pendingActions: formattedClubs.reduce((sum, club) => sum + club.pendingRequests, 0),
      },
      upcomingMatches: formattedUpcomingMatches,
      recentPerformance: {
        wins,
        draws,
        losses,
      },
    });
  } catch (error) {
    console.error('GET /api/manager/dashboard error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
