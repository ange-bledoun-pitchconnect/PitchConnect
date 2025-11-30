// src/app/api/manager/clubs/[clubId]/teams/[teamId]/training/analytics/route.ts
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

    // Get training analytics
    const trainingSessions = await prisma.training.findMany({
      where: { teamId },
      include: {
        attendances: {
          select: {
            status: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalSessions = trainingSessions.length;
    const totalAttendanceRecords = trainingSessions.reduce(
      (sum, t) => sum + t.attendances.length,
      0
    );

    const attendanceStats = {
      present: trainingSessions.reduce(
        (sum, t) => sum + t.attendances.filter((a) => a.status === 'PRESENT').length,
        0
      ),
      absent: trainingSessions.reduce(
        (sum, t) => sum + t.attendances.filter((a) => a.status === 'ABSENT').length,
        0
      ),
      injured: trainingSessions.reduce(
        (sum, t) => sum + t.attendances.filter((a) => a.status === 'INJURED').length,
        0
      ),
      excused: trainingSessions.reduce(
        (sum, t) => sum + t.attendances.filter((a) => a.status === 'EXCUSED').length,
        0
      ),
    };

    const avgAttendanceRate =
      totalAttendanceRecords > 0
        ? (attendanceStats.present / totalAttendanceRecords) * 100
        : 0;

    // Get player-level statistics
    const playerStats = await prisma.player.findMany({
      where: { teamId },
      include: {
        attendances: {
          select: {
            status: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const playerAttendanceStats = playerStats.map((player) => {
      const attendances = player.attendances;
      const totalAttended = attendances.length;
      const present = attendances.filter((a) => a.status === 'PRESENT').length;
      const rate = totalAttended > 0 ? (present / totalAttended) * 100 : 0;

      return {
        playerId: player.id,
        playerName: `${player.user.firstName} ${player.user.lastName}`,
        totalSessions: totalAttended,
        present,
        absent: attendances.filter((a) => a.status === 'ABSENT').length,
        injured: attendances.filter((a) => a.status === 'INJURED').length,
        excused: attendances.filter((a) => a.status === 'EXCUSED').length,
        attendanceRate: Math.round(rate),
      };
    });

    return NextResponse.json({
      totalSessions,
      attendanceStats,
      avgAttendanceRate: Math.round(avgAttendanceRate),
      playerStats: playerAttendanceStats,
    });
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/training/analytics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch training analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
