/**
 * Player Dashboard API
 * Get player dashboard data
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

    // Get player record
    const player = await prisma.player.findFirst({
      where: { userId: user.id },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get teams
    const teams = await prisma.team.findMany({
      where: {
        players: {
          some: {
            id: player.id,
          },
        },
      },
    });

    // Get player stats
    const stats = await prisma.playerStats.findFirst({
      where: { playerId: player.id },
    });

    // Get recent matches
    const recentMatches = await prisma.match.findMany({
      where: {
        teams: {
          some: {
            players: {
              some: {
                id: player.id,
              },
            },
          },
        },
      },
      take: 5,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      player: {
        id: player.id,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        position: player.position,
        shirtNumber: player.shirtNumber,
      },
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
      })),
      stats: {
        appearances: stats?.appearances || 0,
        goals: stats?.goals || 0,
        assists: stats?.assists || 0,
        rating: stats?.rating || 0,
      },
      recentMatches: recentMatches.map((match) => ({
        id: match.id,
        date: match.date,
        status: match.status,
      })),
    });
  } catch (error) {
    console.error('Player dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
