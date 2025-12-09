import { verifySuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { NotificationType } from '@prisma/client';

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
    const { title, message, targetRole, targetUsers, notificationType = 'SYSTEM_ALERT' } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes: NotificationType[] = [
      'MATCH_SCHEDULED',
      'MATCH_REMINDER',
      'MATCH_LIVE_UPDATE',
      'TRAINING_SESSION',
      'TEAM_MESSAGE',
      'ACHIEVEMENT_UNLOCKED',
      'PAYMENT_RECEIVED',
      'PAYMENT_FAILED',
      'PLAYER_STATS_UPDATE',
      'SYSTEM_ALERT',
      'UPGRADE_REQUEST_APPROVED',
      'UPGRADE_REQUEST_REJECTED',
      'ROLE_CHANGED',
      'ACCOUNT_SUSPENDED',
      'MATCH_ATTENDANCE_REQUEST',
      'TIMESHEET_APPROVED',
      'TIMESHEET_REJECTED',
      'PAYMENT_PROCESSED',
      'JOIN_REQUEST',
      'LEAGUE_INVITATION',
      'PERFORMANCE_ALERT',
      'INJURY_ALERT',
      'TEAM_ANNOUNCEMENT',
    ];

    let notifType: NotificationType = 'SYSTEM_ALERT';
    if (notificationType && validTypes.includes(notificationType)) {
      notifType = notificationType;
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

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: true, notificationsSent: 0, message: 'No recipients found' },
        { status: 200 }
      );
    }

    // Create notifications
    const notifications = await prisma.notification.createMany({
      data: recipients.map((user) => ({
        userId: user.id,
        title,
        message,
        type: notifType,
        read: false,
      })),
      skipDuplicates: true,
    });

    console.log(`📬 Sent ${notifications.count} system notifications`);

    return NextResponse.json({
      success: true,
      notificationsSent: notifications.count,
      notificationType: notifType,
    });
  } catch (error) {
    console.error('❌ Send Notification Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
