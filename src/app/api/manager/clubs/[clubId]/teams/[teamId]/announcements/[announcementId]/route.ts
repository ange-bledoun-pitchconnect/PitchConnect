/**
 * Team Announcement API
 *
 * GET: Fetch a specific team announcement
 * DELETE: Delete a team announcement
 *
 * Authorization: Only club owner or announcement creator can delete
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: { ... },
 *   message?: string
 * }
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/announcements/[announcementId]
 * Fetch a specific announcement
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; announcementId: string } }
) {
  const session = await auth();

  if (!session) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { clubId, teamId, announcementId } = params;

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the club owner' },
        { status: 403 }
      );
    }

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        clubId: true,
      },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json(
        { error: 'Team not found or does not belong to this club' },
        { status: 404 }
      );
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
    }

    return NextResponse.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/announcements/[announcementId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch announcement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manager/clubs/[clubId]/teams/[teamId]/announcements/[announcementId]
 * Delete a team announcement
 *
 * Authorization: Club owner OR announcement creator can delete
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; announcementId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { clubId, teamId, announcementId } = params;

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the club owner' },
        { status: 403 }
      );
    }

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        clubId: true,
      },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json(
        { error: 'Team not found or does not belong to this club' },
        { status: 404 }
      );
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
    }

    // Verify user is either the creator or club owner
    if (
      announcement.createdBy !== session.user.id &&
      club.ownerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden - Only creator or club owner can delete' },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      {
        error: 'Failed to delete announcement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
