/**
 * League Admin Dashboard API
 * Get league admin dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get competitions
    const competitions = await prisma.competition.findMany({
      include: {
        teams: true,
        matches: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get standings
    const standings = await prisma.standing.findMany({
      include: {
        team: true,
        competition: true,
      },
      orderBy: { points: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      leagueAdmin: {
        id: user.id,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
      },
      competitions: competitions.map((comp) => ({
        id: comp.id,
        name: comp.name,
        teamCount: comp.teams.length,
        matchCount: comp.matches.length,
      })),
      standings: standings.map((standing) => ({
        id: standing.id,
        teamName: standing.team.name,
        points: standing.points,
        matches: standing.matchesPlayed,
        wins: standing.wins,
        draws: standing.draws,
        losses: standing.losses,
      })),
      stats: {
        totalCompetitions: competitions.length,
        totalMatches: competitions.reduce((sum, comp) => sum + comp.matches.length, 0),
      },
    });
  } catch (error) {
    console.error('League admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
