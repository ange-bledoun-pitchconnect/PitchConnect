/**
 * Team Announcements API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/announcements
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/announcements
 *
 * GET: Returns list of announcements for the team
 * POST: Creates a new announcement for the team
 *
 * Authorization: Only club owner can access
 *
 * Response (GET):
 * Array<{
 *   id: string,
 *   teamId: string,
 *   createdBy: string,
 *   title: string,
 *   content: string,
 *   priority: string,
 *   pinned: boolean,
 *   createdAt: Date,
 *   updatedAt: Date
 * }>
 *
 * Response (POST):
 * {
 *   id: string,
 *   teamId: string,
 *   createdBy: string,
 *   title: string,
 *   content: string,
 *   priority: string,
 *   pinned: boolean,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;

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

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get announcements for this team
    const announcements = await prisma.announcement.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/announcements error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch announcements',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;
    const body = await req.json();

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

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Validate input
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Create announcement using correct field name 'createdBy'
    const announcement = await prisma.announcement.create({
      data: {
        title: body.title.trim(),
        content: body.content.trim(),
        teamId,
        createdBy: session.user.id,
        priority: body.priority || 'NORMAL',
        pinned: body.pinned || false,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error(
      'POST /api/manager/clubs/[clubId]/teams/[teamId]/announcements error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to create announcement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
