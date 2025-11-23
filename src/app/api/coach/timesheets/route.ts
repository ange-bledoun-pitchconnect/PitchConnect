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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Parse month filter
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    // Get timesheets
    const timesheets = await prisma.timesheet.findMany({
      where: {
        coachId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
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
        date: 'desc',
      },
    });

    // Calculate summary
    const summary = {
      totalHours: timesheets.reduce((sum, t) => sum + t.hours, 0),
      totalEarnings: timesheets.reduce((sum, t) => sum + t.totalAmount, 0),
      pendingPayments: timesheets
        .filter((t) => t.status === 'PENDING' || t.status === 'APPROVED')
        .reduce((sum, t) => sum + t.totalAmount, 0),
      paidThisMonth: timesheets
        .filter((t) => t.status === 'PAID')
        .reduce((sum, t) => sum + t.totalAmount, 0),
    };

    return NextResponse.json({
      timesheets: timesheets.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        hours: t.hours,
        hourlyRate: t.hourlyRate,
        totalAmount: t.totalAmount,
        status: t.status,
        session: t.session
          ? {
              id: t.session.id,
              focus: t.session.focus,
              team: t.session.team,
            }
          : null,
        description: t.description,
        approvedBy: t.approvedBy,
        approvedAt: t.approvedAt?.toISOString() || null,
      })),
      summary,
    });
  } catch (error) {
    console.error('Get timesheets error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch timesheets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
