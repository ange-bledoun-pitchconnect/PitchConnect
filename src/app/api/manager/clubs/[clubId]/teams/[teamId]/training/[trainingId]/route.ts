// src/app/api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; trainingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, trainingId } = params;

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Verify access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get training with attendances
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        attendances: {
          include: {
            player: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!training || training.teamId !== teamId) {
      return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
    }

    return NextResponse.json(training);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId] error:', error);
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
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, trainingId } = params;
    const body = await req.json();

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Verify access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get training
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
    });

    if (!training || training.teamId !== teamId) {
      return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
    }

    // Update training
    const updatedTraining = await prisma.training.update({
      where: { id: trainingId },
      data: {
        title: body.title || undefined,
        description: body.description !== undefined ? body.description : undefined,
        date: body.date ? new Date(body.date) : undefined,
        startTime: body.startTime || undefined,
        endTime: body.endTime || undefined,
        location: body.location !== undefined ? body.location : undefined,
        type: body.type || undefined,
        intensity: body.intensity || undefined,
        focusAreas: body.focusAreas !== undefined ? body.focusAreas : undefined,
      },
      include: {
        _count: {
          select: {
            attendances: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTraining);
  } catch (error) {
    console.error('PATCH /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId] error:', error);
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
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; trainingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, trainingId } = params;

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Verify access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get training
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
    });

    if (!training || training.teamId !== teamId) {
      return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
    }

    // Delete training and associated attendances
    await prisma.training.delete({
      where: { id: trainingId },
    });

    return NextResponse.json({
      success: true,
      message: 'Training session deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
