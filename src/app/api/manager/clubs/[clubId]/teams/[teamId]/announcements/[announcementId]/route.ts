/**
 * Delete Team Announcement API
 *
 * DELETE /api/manager/clubs/[clubId]/teams/[teamId]/announcements/[announcementId]
 *
 * Deletes a team announcement. Only the creator of the announcement or club
 * owner can delete it.
 *
 * Authorization: Club owner OR announcement creator
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string
 * }
 */

/**
 * Delete Team Announcement API
 *
 * DELETE /api/manager/clubs/[clubId]/teams/[teamId]/announcements/[announcementId]
 *
 * Deletes a team announcement. Only the creator of the announcement or club
 * owner can delete it.
 *
 * Authorization: Club owner OR announcement creator
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
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; announcementId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, announcementId } = params;

    // Verify club exists and user owns it
    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== session.user.id) {
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get announcement and verify it belongs to this team
    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get announcement and verify it belongs to this team
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement || announcement.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Verify user is either the creator or club owner
    // (Already checked club.ownerId above, but also allow announcement creator)
    if (
      announcement.createdBy !== session.user.id &&
      club.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the announcement
    // Delete the announcement
    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error(
      'DELETE /api/manager/clubs/[clubId]/teams/[teamId]/announcements/[announcementId] error:',
      error
    );
    console.error(
      'DELETE /api/manager/clubs/[clubId]/teams/[teamId]/announcements/[announcementId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to delete announcement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
