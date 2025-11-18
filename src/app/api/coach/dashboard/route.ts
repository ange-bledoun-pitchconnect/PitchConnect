/**
 * Coach Dashboard API
 * Get coach dashboard data
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

    // Get coach record
    const coach = await prisma.coach.findFirst({
      where: { userId: user.id },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Get teams
    const teams = await prisma.team.findMany({
      where: { coachId: coach.id },
      include: {
        players: true,
        matches: true,
      },
    });

    // Get recent matches
    const recentMatches = await prisma.match.findMany({
      where: {
        teams: {
          some: {
            coachId: coach.id,
          },
        },
      },
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        teams: true,
      },
    });

    // Calculate stats
    const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);
    const totalMatches = teams.reduce((sum, team) => sum + team.matches.length, 0);

    return NextResponse.json({
      coach: {
        id: coach.id,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        bio: coach.bio,
        yearsExperience: coach.yearsExperience,
        qualifications: coach.qualifications,
      },
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        playerCount: team.players.length,
        matchCount: team.matches.length,
      })),
      stats: {
        totalTeams: teams.length,
        totalPlayers,
        totalMatches,
      },
      recentMatches: recentMatches.map((match) => ({
        id: match.id,
        date: match.date,
        homeTeam: match.teams[0]?.name || 'N/A',
        awayTeam: match.teams[1]?.name || 'N/A',
      })),
    });
  } catch (error) {
    console.error('Coach dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
