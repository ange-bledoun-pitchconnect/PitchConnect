/**
 * Super Admin Dashboard API
 * Get system-wide dashboard data
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

    // Get user (verify super admin)
    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
    });

    if (!user || !user.roles?.includes('SUPERADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get system stats
    const totalUsers = await prisma.user.count();
    const totalTeams = await prisma.team.count();
    const totalMatches = await prisma.match.count();
    const totalCompetitions = await prisma.competition.count();

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      superAdmin: {
        id: user.id,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
      },
      stats: {
        totalUsers,
        totalTeams,
        totalMatches,
        totalCompetitions,
      },
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.roles?.[0] || 'USER',
        joinedAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error('Super admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
