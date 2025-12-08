/**
 * Get or Update Training Attendance API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]/attendance
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]/attendance
 *
 * GET: Retrieves all attendance records for a training session
 * POST: Bulk update attendance records for a training session
 *
 * Authorization: Only club owner can access
 *
 * Request (POST):
 * {
 *   attendances: Array<{
 *     playerId: string,
 *     status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE',
 *     performanceRating: number,
 *     notes: string
 *   }>
 * }
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

    // Get all attendance records for this training session
    const attendances = await prisma.trainingAttendance.findMany({
      where: { trainingSessionId: trainingId },
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
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]/attendance error:',
      error
    );
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

    // Validation
    if (!Array.isArray(body.attendances) || body.attendances.length === 0) {
      return NextResponse.json(
        { error: 'Attendances array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each attendance record
    const validStatuses = ['PRESENT', 'ABSENT', 'EXCUSED', 'LATE'];
    for (const att of body.attendances) {
      if (!att.playerId?.trim()) {
        return NextResponse.json(
          { error: 'Player ID is required for each attendance record' },
          { status: 400 }
        );
      }
      if (!att.status) {
        return NextResponse.json(
          { error: 'Status is required for each attendance record' },
          { status: 400 }
        );
      }
      if (!validStatuses.includes(att.status)) {
        return NextResponse.json(
          {
            error: `Invalid status: ${att.status}. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Delete existing attendances for this training session
    await prisma.trainingAttendance.deleteMany({
      where: { trainingSessionId: trainingId },
    });

    // Create new attendance records
    const createdAttendances = await Promise.all(
      body.attendances.map((att: any) =>
        prisma.trainingAttendance.create({
          data: {
            trainingSessionId: trainingId,
            playerId: att.playerId,
            status: att.status,
            performanceRating: att.performanceRating || null,
            notes: att.notes || null,
          },
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
        })
      )
    );

    return NextResponse.json(createdAttendances, { status: 201 });
  } catch (error) {
    console.error(
      'POST /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]/attendance error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to save attendances',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
