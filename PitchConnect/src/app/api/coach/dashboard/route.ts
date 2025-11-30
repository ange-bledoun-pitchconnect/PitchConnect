/**
 * Coach Dashboard API
 * Get coach dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

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

    // Get teams with correct relations
    const teams = await prisma.team.findMany({
      where: { coachId: coach.id },
      include: {
        players: true,
        homeMatches: true,
        awayMatches: true,
      },
    });

    // Calculate total matches (home + away)
    const teamsWithMatchCount = teams.map((team) => ({
      id: team.id,
      name: team.name,
      playerCount: team.players.length,
      matchCount: (team.homeMatches?.length || 0) + (team.awayMatches?.length || 0),
    }));

    // Get recent matches for all teams
    const homeMatches = await prisma.match.findMany({
      where: {
        homeTeamId: {
          in: teams.map((t) => t.id),
        },
      },
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    const awayMatches = await prisma.match.findMany({
      where: {
        awayTeamId: {
          in: teams.map((t) => t.id),
        },
      },
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    const allMatches = [...homeMatches, ...awayMatches]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Calculate stats
    const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);
    const totalMatches = teams.reduce(
      (sum, team) => sum + (team.homeMatches?.length || 0) + (team.awayMatches?.length || 0),
      0
    );

    return NextResponse.json({
      coach: {
        id: coach.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        bio: coach.bio,
        yearsExperience: coach.yearsExperience,
        qualifications: coach.qualifications,
      },
      teams: teamsWithMatchCount,
      stats: {
        totalTeams: teams.length,
        totalPlayers,
        totalMatches,
      },
      recentMatches: allMatches.map((match) => ({
        id: match.id,
        date: match.date,
        homeTeam: match.homeTeam?.name || 'N/A',
        awayTeam: match.awayTeam?.name || 'N/A',
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: match.status,
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
