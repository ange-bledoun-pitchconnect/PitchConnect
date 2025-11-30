// src/app/api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]/attendance/route.ts
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

    // Get attendances
    const attendances = await prisma.attendance.findMany({
      where: { training: { id: trainingId, teamId } },
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
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]/attendance error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch attendances',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Validation
    if (!Array.isArray(body.attendances)) {
      return NextResponse.json({ error: 'Attendances array is required' }, { status: 400 });
    }

    // Delete existing attendances for this training
    await prisma.attendance.deleteMany({
      where: { trainingId },
    });

    // Create new attendances
    const createdAttendances = await Promise.all(
      body.attendances.map((att: any) =>
        prisma.attendance.create({
          data: {
            trainingId,
            playerId: att.playerId,
            status: att.status || 'PRESENT',
            notes: att.notes || null,
          },
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
        })
      )
    );

    return NextResponse.json(createdAttendances, { status: 201 });
  } catch (error) {
    console.error('POST /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]/attendance error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save attendances',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
