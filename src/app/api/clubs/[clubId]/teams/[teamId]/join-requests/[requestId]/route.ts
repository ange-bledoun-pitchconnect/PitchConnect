import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string; requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, requestId } = params;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get join request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            clubId: true,
          },
        },
      },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Join request has already been processed' },
        { status: 400 }
      );
    }

    if (action === 'APPROVE') {
      // Use transaction to approve request and add to team
      await prisma.$transaction(async (tx) => {
        // Update join request status
        await tx.joinRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        });

        // Add user to team
        await tx.teamMember.create({
          data: {
            teamId,
            userId: joinRequest.userId,
            role: 'PLAYER',
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
        });

        // Create notification for user
        await tx.notification.create({
          data: {
            userId: joinRequest.userId,
            type: 'JOIN_REQUEST',
            title: 'Join Request Approved',
            message: `Your request to join ${joinRequest.team.name} has been approved!`,
            link: `/dashboard/clubs/${joinRequest.team.clubId}/teams/${teamId}`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Join request approved and player added to team',
      });
    } else {
      // REJECT
      await prisma.$transaction(async (tx) => {
        // Update join request status
        await tx.joinRequest.update({
          where: { id: requestId },
          data: { status: 'REJECTED' },
        });

        // Create notification for user
        await tx.notification.create({
          data: {
            userId: joinRequest.userId,
            type: 'JOIN_REQUEST',
            title: 'Join Request Declined',
            message: `Your request to join ${joinRequest.team.name} has been declined.`,
            link: '/dashboard/player/browse-teams',
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Join request rejected',
      });
    }
  } catch (error) {
    console.error('Process join request error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process join request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
