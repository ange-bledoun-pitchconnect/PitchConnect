/**
 * Delete Team Coach API
 *
 * DELETE /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId]
 *
 * Removes a coach from a team. Only the club owner can remove coaches.
 * Note: Coach record is preserved; only the team association is removed.
 *
 * Authorization: Only club owner can access
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; coachId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, coachId } = params;

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify coach exists and belongs to this team
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      include: {
        oldTeams: {
          where: { id: teamId },
        },
      },
    });

    if (!coach || coach.oldTeams.length === 0) {
      return NextResponse.json(
        { error: 'Coach not found in this team' },
        { status: 404 }
      );
    }

    // Update coach to remove team association
    // Assuming the Coach model has a relation to OldTeam
    // This depends on your actual schema - adjust as needed
    // For now, we update the coach's team association
    await prisma.coach.update({
      where: { id: coachId },
      data: {
        // Clear team association if coach has a teamId field
        // Otherwise, handle through junction table if applicable
        oldTeams: {
          disconnect: {
            id: teamId,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Coach removed from team successfully',
    });
  } catch (error) {
    console.error(
      'DELETE /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to remove coach',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
