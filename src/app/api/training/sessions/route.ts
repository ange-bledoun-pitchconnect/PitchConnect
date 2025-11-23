import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: any = {};

    if (teamId) {
      whereClause.teamId = teamId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Get training sessions
    const sessions = await prisma.trainingSession.findMany({
      where: whereClause,
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
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    // Transform response
    const transformedSessions = sessions.map((session) => {
      const attendance = {
        present: session.attendance.filter((a) => a.status === 'PRESENT').length,
        absent: session.attendance.filter((a) => a.status === 'ABSENT').length,
        pending: session.attendance.filter((a) => a.status === 'PENDING').length,
      };

      return {
        id: session.id,
        date: session.date.toISOString(),
        duration: session.duration,
        location: session.location,
        focus: session.focus,
        notes: session.notes,
        status: session.status,
        team: {
          id: session.team.id,
          name: session.team.name,
          club: session.team.club,
        },
        drills: session.drills.map((d) => ({
          id: d.drill.id,
          name: d.drill.name,
          duration: d.drill.duration,
          category: d.drill.category,
          order: d.order,
        })),
        attendance,
        drillCount: session._count.drills,
      };
    });

    return NextResponse.json({
      sessions: transformedSessions,
      total: transformedSessions.length,
    });
  } catch (error) {
    console.error('Get training sessions error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch training sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
