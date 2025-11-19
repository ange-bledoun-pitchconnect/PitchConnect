/**
 * SuperAdmin Notifications API
 * Send bulk notifications to users
 * @route POST /api/superadmin/notifications - Send notification
 * @access SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

// ============================================================================
// POST - Send Bulk Notification
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // SuperAdmin check
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get SuperAdmin user
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Get request body
    const body = await request.json();
    const { target, title, message, type, link, userIds, roles, statuses } = body;

    // Validation
    if (!title || !message || !target) {
      return NextResponse.json(
        { error: 'Missing required fields: target, title, message' },
        { status: 400 }
      );
    }

    // Build user query based on target
    let targetUsers: string[] = [];

    switch (target) {
      case 'ALL':
        // Send to all users
        const allUsers = await prisma.user.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });
        targetUsers = allUsers.map((u) => u.id);
        break;

      case 'SPECIFIC':
        // Send to specific user IDs
        if (!userIds || !Array.isArray(userIds)) {
          return NextResponse.json(
            { error: 'userIds array required for SPECIFIC target' },
            { status: 400 }
          );
        }
        targetUsers = userIds;
        break;

      case 'BY_ROLE':
        // Send to users with specific roles
        if (!roles || !Array.isArray(roles)) {
          return NextResponse.json(
            { error: 'roles array required for BY_ROLE target' },
            { status: 400 }
          );
        }
        const roleUsers = await prisma.user.findMany({
          where: {
            roles: { hasSome: roles },
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        targetUsers = roleUsers.map((u) => u.id);
        break;

      case 'BY_STATUS':
        // Send to users with specific statuses
        if (!statuses || !Array.isArray(statuses)) {
          return NextResponse.json(
            { error: 'statuses array required for BY_STATUS target' },
            { status: 400 }
          );
        }
        const statusUsers = await prisma.user.findMany({
          where: { status: { in: statuses } },
          select: { id: true },
        });
        targetUsers = statusUsers.map((u) => u.id);
        break;

      default:
        return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
    }

    // Create notifications for all target users
    const notifications = await prisma.notification.createMany({
      data: targetUsers.map((userId) => ({
        userId,
        type: type || 'SYSTEM_ALERT',
        title,
        message,
        link: link || '/dashboard',
      })),
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        performedBy: adminUser.id,
        action: 'BULK_NOTIFICATION_SENT',
        entityType: 'Notification',
        entityId: 'bulk',
        reason: `Sent notification to ${targetUsers.length} users: "${title}"`,
      },
    });

    return NextResponse.json(
      {
        message: 'Notifications sent successfully',
        count: notifications.count,
        targets: targetUsers.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Notifications POST Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Export route segment config
// ============================================================================
export const dynamic = 'force-dynamic';
export const revalidate = 0;
