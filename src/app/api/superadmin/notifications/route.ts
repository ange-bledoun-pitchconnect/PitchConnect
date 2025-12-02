import { verifySuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySuperAdmin(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, message, targetRole, targetUsers } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message' },
        { status: 400 }
      );
    }

    // Determine recipients
    let recipients: any[] = [];

    if (targetUsers && targetUsers.length > 0) {
      recipients = await prisma.user.findMany({
        where: { id: { in: targetUsers } },
        select: { id: true },
      });
    } else if (targetRole) {
      recipients = await prisma.user.findMany({
        where: { roles: { has: targetRole } },
        select: { id: true },
      });
    } else {
      // Send to all users
      recipients = await prisma.user.findMany({
        select: { id: true },
      });
    }

    // Create notifications
    const notifications = await prisma.notification.createMany({
      data: recipients.map(user => ({
        userId: user.id,
        title,
        message,
        type: 'SYSTEM',
        read: false,
      })),
    });

    console.log(`📬 Sent ${notifications.count} system notifications`);

    return NextResponse.json({
      success: true,
      notificationsSent: notifications.count,
    });
  } catch (error) {
    console.error('❌ Send Notification Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
