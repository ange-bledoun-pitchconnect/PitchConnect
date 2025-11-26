// src/app/api/manager/clubs/[clubId]/teams/[teamId]/training/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Check if manager owns this club
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

    // Get all training sessions for this team
    const trainingSessions = await prisma.training.findMany({
      where: { teamId },
      include: {
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(trainingSessions);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/training error:', error);
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
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;
    const body = await req.json();

    // Get manager profile
    let manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      manager = await prisma.manager.create({
        data: { userId: session.user.id },
      });
    }

    // Check if manager owns this club
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

    // Validation
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Training title is required' }, { status: 400 });
    }

    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    if (!body.startTime) {
      return NextResponse.json({ error: 'Start time is required' }, { status: 400 });
    }

    if (!body.endTime) {
      return NextResponse.json({ error: 'End time is required' }, { status: 400 });
    }

    // Create training session
    const training = await prisma.training.create({
      data: {
        title: body.title.trim(),
        description: body.description || null,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location || null,
        type: body.type || 'REGULAR_SESSION',
        intensity: body.intensity || 'MEDIUM',
        focusAreas: body.focusAreas || null,
        teamId,
      },
    });

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error('POST /api/manager/clubs/[clubId]/teams/[teamId]/training error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
