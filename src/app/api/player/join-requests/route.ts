import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// CREATE JOIN REQUEST
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this team' }, { status: 400 });
    }

    // Check if already has pending request
    const existingRequest = await prisma.joinRequest.findFirst({
      where: {
        teamId,
        userId: user.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this team' },
        { status: 400 }
      );
    }

    // Create join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        teamId,
        userId: user.id,
        status: 'PENDING',
      },
    });

    // Notify team managers
    const teamManagers = await prisma.teamMember.findMany({
      where: {
        teamId,
        role: 'MANAGER',
      },
      select: {
        userId: true,
      },
    });

    // Create notifications for managers
    await Promise.all(
      teamManagers.map((manager) =>
        prisma.notification.create({
          data: {
            userId: manager.userId,
            type: 'JOIN_REQUEST',
            title: 'New Join Request',
            message: `${user.firstName} ${user.lastName} wants to join ${team.name}`,
            link: `/dashboard/clubs/${team.clubId}/teams/${teamId}/join-requests`,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      joinRequest: {
        id: joinRequest.id,
        status: joinRequest.status,
      },
      message: 'Join request sent successfully',
    });
  } catch (error) {
    console.error('Create join request error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create join request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET USER'S JOIN REQUESTS
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

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

    // Get all join requests for this user
    const joinRequests = await prisma.joinRequest.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      joinRequests: joinRequests.map((req) => ({
        id: req.id,
        status: req.status,
        createdAt: req.createdAt.toISOString(),
        team: {
          id: req.team.id,
          name: req.team.name,
          ageGroup: req.team.ageGroup,
          category: req.team.category,
          club: req.team.club,
        },
      })),
    });
  } catch (error) {
    console.error('Get join requests error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch join requests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
