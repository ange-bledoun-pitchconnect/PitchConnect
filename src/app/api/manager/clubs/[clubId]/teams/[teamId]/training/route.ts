/**
 * List or Create Training Sessions API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/training
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/training
 *
 * GET: Retrieves all training sessions for a team
 * POST: Creates a new training session for a team
 *
 * Authorization: Only club owner can access
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get all training sessions for this team
    const trainingSessions = await prisma.trainingSession.findMany({
      where: { teamId },
      include: {
        coach: {
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
        _count: {
          select: {
            attendance: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(trainingSessions);
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/training error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch training sessions',
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
  const session = await getServerSession(authOptions);
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
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify coach exists
    if (!body.coachId?.trim()) {
      return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 });
    }

    const coach = await prisma.coach.findUnique({
      where: { id: body.coachId },
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Validate required fields
    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    if (!body.duration || body.duration <= 0) {
      return NextResponse.json(
        { error: 'Duration (in minutes) is required and must be positive' },
        { status: 400 }
      );
    }

    if (!body.focus?.trim()) {
      return NextResponse.json({ error: 'Focus area is required' }, { status: 400 });
    }

    // Create training session
    const trainingSession = await prisma.trainingSession.create({
      data: {
        teamId,
        coachId: body.coachId,
        date: new Date(body.date),
        duration: body.duration,
        location: body.location?.trim() || null,
        focus: body.focus.trim(),
        notes: body.notes?.trim() || null,
      },
      include: {
        coach: {
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
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    return NextResponse.json(trainingSession, { status: 201 });
  } catch (error) {
    console.error(
      'POST /api/manager/clubs/[clubId]/teams/[teamId]/training error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to create training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
