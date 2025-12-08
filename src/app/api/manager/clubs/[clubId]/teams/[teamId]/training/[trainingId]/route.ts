/**
 * Get, Update, or Delete Training Session API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]
 * PATCH /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]
 * DELETE /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]
 *
 * GET: Retrieves training session details with attendance records
 * PATCH: Updates training session information
 * DELETE: Deletes a training session and associated attendance records
 *
 * Authorization: Only club owner can access
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; trainingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, trainingId } = params;

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

    // Get training session with attendances
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: trainingId },
      include: {
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        attendance: {
          include: {
            player: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        drills: {
          include: {
            drill: true,
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    if (!trainingSession || trainingSession.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(trainingSession);
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; trainingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, trainingId } = params;
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

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get training session
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: trainingId },
    });

    if (!trainingSession || trainingSession.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Build update data - only include provided fields
    const updateData: any = {};

    if (body.date !== undefined) {
      updateData.date = new Date(body.date);
    }
    if (body.duration !== undefined) {
      updateData.duration = body.duration;
    }
    if (body.location !== undefined) {
      updateData.location = body.location;
    }
    if (body.focus !== undefined) {
      updateData.focus = body.focus;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    // Update training session
    const updatedTrainingSession = await prisma.trainingSession.update({
      where: { id: trainingId },
      data: updateData,
      include: {
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        attendance: {
          include: {
            player: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTrainingSession);
  } catch (error) {
    console.error(
      'PATCH /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to update training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; trainingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, trainingId } = params;

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

    // Get training session
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: trainingId },
    });

    if (!trainingSession || trainingSession.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Delete training session (cascades to attendance and drills)
    await prisma.trainingSession.delete({
      where: { id: trainingId },
    });

    return NextResponse.json({
      success: true,
      message: 'Training session deleted successfully',
    });
  } catch (error) {
    console.error(
      'DELETE /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to delete training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
