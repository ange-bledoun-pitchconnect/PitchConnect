/**
 * Manager Dashboard API
 * Get manager dashboard data
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

    // Get manager record
    const manager = await prisma.manager.findFirst({
      where: { userId: user.id },
    });

    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    // Get clubs
    const clubs = await prisma.club.findMany({
      where: { managerId: manager.id },
      include: {
        teams: true,
      },
    });

    return NextResponse.json({
      manager: {
        id: manager.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
      clubs: clubs.map((club) => ({
        id: club.id,
        name: club.name,
        teamCount: club.teams.length,
      })),
      stats: {
        totalClubs: clubs.length,
        totalTeams: clubs.reduce((sum, club) => sum + club.teams.length, 0),
      },
    });
  } catch (error) {
    console.error('Manager dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
