// src/app/api/leagues/[id]/invitations/[invitationId]/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; invitationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowedRoles = ['LEAGUE_ADMIN', 'SUPERADMIN'];
  if (!session.user.roles?.some((role: string) => allowedRoles.includes(role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Verify invitation exists and belongs to this league
    const invitation = await prisma.leagueInvitation.findUnique({
      where: { id: params.invitationId },
      include: {
        league: {
          include: {
            admin: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.leagueId !== params.id) {
      return NextResponse.json({ error: 'Invitation does not belong to this league' }, { status: 400 });
    }

    // Check if user is admin of this league
    const isSuperAdmin = session.user.isSuperAdmin || session.user.roles?.includes('SUPERADMIN');
    if (!isSuperAdmin && invitation.league.admin.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete invitation
    await prisma.leagueInvitation.delete({
      where: { id: params.invitationId },
    });

    return NextResponse.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('DELETE /api/leagues/[id]/invitations/[invitationId] error:', error);
    return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
  }
}
