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
    const { sessionId, date, hours, description, hourlyRate } = body;

    if (!date || !hours || hours <= 0) {
      return NextResponse.json(
        { error: 'Date and valid hours are required' },
        { status: 400 }
      );
    }

    if (!sessionId && !description) {
      return NextResponse.json(
        { error: 'Either session ID or description is required' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = hours * (hourlyRate || 25);

    // Create timesheet
    const timesheet = await prisma.timesheet.create({
      data: {
        coachId: user.id,
        sessionId: sessionId || null,
        date: new Date(date),
        hours: parseFloat(hours.toString()),
        hourlyRate: hourlyRate || 25,
        totalAmount,
        description: description || null,
        status: 'PENDING',
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
    });

    return NextResponse.json({
      success: true,
      timesheetId: timesheet.id,
      message: 'Timesheet created successfully',
    });
  } catch (error) {
    console.error('Create timesheet error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create timesheet',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
