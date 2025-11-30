import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, memberId } = params;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if member exists
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Verify member belongs to this team
    if (member.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Member does not belong to this team' },
        { status: 400 }
      );
    }

    // Delete the member
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    // Create notification for removed user
    await prisma.notification.create({
      data: {
        userId: member.userId,
        type: 'TEAM_MESSAGE',
        title: 'Removed from Team',
        message: 'You have been removed from the team',
        link: '/dashboard',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove member',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId } = params;

    const body = await request.json();
    const { role, status } = body;

    // Update member
    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        ...(role && { role }),
        ...(status && { status }),
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

    return NextResponse.json({
      success: true,
      member: {
        id: updatedMember.id,
        role: updatedMember.role,
        status: updatedMember.status,
        joinedAt: updatedMember.joinedAt.toISOString(),
        user: updatedMember.user,
      },
      message: 'Member updated successfully',
    });
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update member',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
