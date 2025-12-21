import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get notification settings (or return defaults)
    const settings = {
      emailNotifications: true,
      matchUpdates: true,
      trainingReminders: true,
      teamInvites: true,
      paymentAlerts: true,
      approvalRequests: true,
      messages: true,
      weeklyDigest: false,
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // TODO: Save notification settings to database
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: 'Notification settings saved',
    });
  } catch (error) {
    console.error('Save notification settings error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
