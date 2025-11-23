import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;

    // Get training session
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        team: {
          include: {
            club: {
              select: {
                name: true,
              },
            },
          },
        },
        drills: {
          include: {
            drill: {
              select: {
                id: true,
                name: true,
                duration: true,
                category: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        attendance: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            drills: true,
            attendance: true,
          },
        },
      },
    });

    if (!trainingSession) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Calculate attendance stats
    const attendance = {
      present: trainingSession.attendance.filter((a) => a.status === 'PRESENT').length,
      absent: trainingSession.attendance.filter((a) => a.status === 'ABSENT').length,
      pending: trainingSession.attendance.filter((a) => a.status === 'PENDING').length,
    };

    return NextResponse.json({
      session: {
        id: trainingSession.id,
        date: trainingSession.date.toISOString(),
        duration: trainingSession.duration,
        location: trainingSession.location,
        focus: trainingSession.focus,
        notes: trainingSession.notes,
        status: trainingSession.status,
        team: {
          id: trainingSession.team.id,
          name: trainingSession.team.name,
          club: trainingSession.team.club,
        },
        drills: trainingSession.drills.map((d) => ({
          id: d.drill.id,
          name: d.drill.name,
          duration: d.drill.duration,
          category: d.drill.category,
          order: d.order,
        })),
        attendance,
        drillCount: trainingSession._count.drills,
      },
    });
  } catch (error) {
    console.error('Get training session error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
