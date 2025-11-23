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

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized - Manager only' }, { status: 403 });
    }

    // Get pending timesheets
    const timesheets = await prisma.timesheet.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        coach: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        session: {
          include: {
            team: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate summary
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const approvedThisMonth = await prisma.timesheet.count({
      where: {
        status: 'APPROVED',
        approvedAt: {
          gte: currentMonth,
        },
      },
    });

    const uniqueCoaches = new Set(timesheets.map((t) => t.coachId));

    const summary = {
      totalPending: timesheets.length,
      totalPendingAmount: timesheets.reduce((sum, t) => sum + t.totalAmount, 0),
      approvedThisMonth,
      totalCoaches: uniqueCoaches.size,
    };

    return NextResponse.json({
      timesheets: timesheets.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        hours: t.hours,
        hourlyRate: t.hourlyRate,
        totalAmount: t.totalAmount,
        status: t.status,
        coach: {
          name: `${t.coach.firstName} ${t.coach.lastName}`,
          email: t.coach.email,
        },
        session: t.session
          ? {
              focus: t.session.focus,
              team: t.session.team,
            }
          : null,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
      summary,
    });
  } catch (error) {
    console.error('Get pending timesheets error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch pending timesheets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
