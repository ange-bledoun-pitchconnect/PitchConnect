import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { teamId, date, duration, location, focus, notes, drills } = body;

    if (!teamId || !date || !focus) {
      return NextResponse.json(
        { error: 'Team, date, and focus are required' },
        { status: 400 }
      );
    }

    // Verify team exists
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
      include: {
        players: {
          select: {
            playerId: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Create training session
    const session_record = await prisma.trainingSession.create({
      data: {
        teamId,
        date: new Date(date),
        duration: duration || 90,
        location,
        focus,
        notes,
        status: 'SCHEDULED',
      },
    });

    // Add drills to session
    if (drills && drills.length > 0) {
      await prisma.sessionDrill.createMany({
        data: drills.map((drillId: string, index: number) => ({
          sessionId: session_record.id,
          drillId,
          order: index + 1,
        })),
      });
    }

    // Create attendance records for all players
    if (team.players.length > 0) {
      await prisma.trainingAttendance.createMany({
        data: team.players.map((player) => ({
          sessionId: session_record.id,
          playerId: player.playerId,
          status: 'PENDING',
        })),
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: session_record.id,
      message: 'Training session created successfully',
    });
  } catch (error) {
    console.error('Create training session error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
