import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all active teams with club info
    const teams = await prisma.team.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            logoUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Check if user has join requests or is already a member
    const userTeamMemberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      select: { teamId: true },
    });

    const userJoinRequests = await prisma.joinRequest.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
      select: { teamId: true },
    });

    const memberTeamIds = new Set(userTeamMemberships.map((m) => m.teamId));
    const requestedTeamIds = new Set(userJoinRequests.map((r) => r.teamId));

    // Transform teams with user-specific info
    const transformedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      ageGroup: team.ageGroup,
      category: team.category,
      status: team.status,
      club: team.club,
      _count: team._count,
      isMember: memberTeamIds.has(team.id),
      hasJoinRequest: requestedTeamIds.has(team.id),
    }));

    return NextResponse.json({
      teams: transformedTeams,
    });
  } catch (error) {
    console.error('Browse teams error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
