import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { userEmail, role } = body;

    if (!userEmail || !role) {
      return NextResponse.json(
        { error: 'User email and role are required' },
        { status: 400 }
      );
    }

    // Find the user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
    }

    // Add user to team
    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: userToAdd.id,
        role,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Create notification for the added user
    await prisma.notification.create({
      data: {
        userId: userToAdd.id,
        type: 'TEAM_MESSAGE',
        title: 'Added to Team',
        message: `You have been added to the team as ${role}`,
        link: `/dashboard/clubs/${params.clubId}/teams/${teamId}`,
      },
    });

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        role: newMember.role,
        status: newMember.status,
        joinedAt: newMember.joinedAt.toISOString(),
        user: newMember.user,
      },
      message: 'Member added successfully',
    });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json(
      {
        error: 'Failed to add member',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
