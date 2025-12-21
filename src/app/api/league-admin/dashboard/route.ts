/**
 * League Admin Dashboard API
 * Get league admin dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get leagues administered by this user
    const leagueAdmin = await prisma.leagueAdmin.findUnique({
      where: { userId: user.id },
      include: {
        leagues: {
          include: {
            teams: {
              include: {
                team: true,
              },
            },
            fixtures: {
              include: {
                matches: true,
              },
            },
            standings: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!leagueAdmin) {
      return NextResponse.json(
        { error: 'User is not a league admin' },
        { status: 403 }
      );
    }

    // Format response
    const leagues = leagueAdmin.leagues || [];
    
    // Aggregate all matches across leagues
    const allMatches = leagues.flatMap(
      league => league.fixtures.flatMap(fixture => fixture.matches || [])
    );

    // Aggregate all standings across leagues
    const allStandings = leagues.flatMap(league => league.standings || []);

    return NextResponse.json({
      leagueAdmin: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
      leagues: leagues.map((league) => ({
        id: league.id,
        name: league.name,
        code: league.code,
        status: league.status,
        teamCount: league.teams?.length || 0,
        fixtureCount: league.fixtures?.length || 0,
        matchCount: league.fixtures.reduce(
          (sum, fixture) => sum + (fixture.matches?.length || 0),
          0
        ),
      })),
      standings: allStandings.map((standing) => ({
        id: standing.id,
        position: standing.position,
        played: standing.played,
        won: standing.won,
        drawn: standing.drawn,
        lost: standing.lost,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        goalDifference: standing.goalDifference,
        points: standing.points,
      })),
      stats: {
        totalLeagues: leagues.length,
        totalTeams: leagues.reduce((sum, league) => sum + (league.teams?.length || 0), 0),
        totalFixtures: leagues.reduce((sum, league) => sum + (league.fixtures?.length || 0), 0),
        totalMatches: allMatches.length,
      },
    });
  } catch (error) {
    console.error('League admin dashboard error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch league admin dashboard',
        message: process.env.NODE_ENV === 'development'
          ? error instanceof Error ? error.message : 'Unknown error'
          : undefined,
      },
      { status: 500 }
    );
  }
}
