import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { timesheetId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        roles: true,
      },
    });

    if (!user || !user.roles.includes('MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized - Manager only' }, { status: 403 });
    }

    const { timesheetId } = params;

    // Get timesheet
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
    });

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    if (timesheet.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Timesheet has already been processed' },
        { status: 400 }
      );
    }

    // Approve timesheet
    await prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        status: 'APPROVED',
        approvedBy: `${user.firstName} ${user.lastName}`,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Timesheet approved successfully',
    });
  } catch (error) {
    console.error('Approve timesheet error:', error);
    return NextResponse.json(
      {
        error: 'Failed to approve timesheet',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
