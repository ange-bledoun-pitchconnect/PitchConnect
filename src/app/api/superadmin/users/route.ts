/**
 * SuperAdmin Users Management API (FIXED)
 * Compatible with your Prisma schema
 * @route GET   /api/superadmin/users - List all users
 * @route PATCH /api/superadmin/users - Update user(s)
 * @route DELETE /api/superadmin/users - Delete user(s)
 * @access SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

// ============================================================================
// GET - List All Users
// ============================================================================

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'all';
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    // Tab filtering
    switch (tab) {
      case 'active':
        where.status = 'ACTIVE';
        break;
      case 'suspended':
        where.status = 'SUSPENDED';
        break;
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        where.createdAt = { gte: sevenDaysAgo };
        break;
    }

    // Search filtering
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filtering
    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    // Role filtering - FIXED to match your schema
    if (roleFilter && roleFilter !== 'all') {
      where.userRoles = {
        some: {
          roleName: roleFilter,
        },
      };
    }

    // Fetch users - FIXED field names to match your schema
    const users = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
        isSuperAdmin: true,
        createdAt: true,
        lastLogin: true,
        phoneNumber: true,
        userRoles: {
          select: {
            roleName: true,
          },
        },
        subscription: {
          select: {
            tier: true,
            status: true,
          },
        },
        _count: {
          select: {
            teamMemberships: true,  // FIXED: was playerTeams
            clubMemberships: true,  // FIXED: was coachTeams
          },
        },
      },
    });

    // Get total count
    const total = await prisma.user.count({ where });

    // Format users - FIXED to use actual field names
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.avatar,
      roles: user.userRoles.map((ur) => ur.roleName),
      status: user.status,
      isSuperAdmin: user.isSuperAdmin,
      subscription: user.subscription
        ? {
            tier: user.subscription.tier,
            status: user.subscription.status,
          }
        : null,
      teamCount: user._count.teamMemberships + user._count.clubMemberships,
      lastLogin: user.lastLogin?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      phoneNumber: user.phoneNumber,
    }));

    return NextResponse.json(
      {
        users: formattedUsers,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Users GET Error:', error);
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
// PATCH - Update User(s)
// ============================================================================

export async function PATCH(request: NextRequest) {
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
      select: { id: true, firstName: true, lastName: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Get request body
    const body = await request.json();
    const { userId, userIds, action, data } = body;

    // Determine bulk or single operation
    const isBulk = Array.isArray(userIds);
    const targetIds = isBulk ? userIds : [userId];

    if (!targetIds || targetIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: userId or userIds' },
        { status: 400 }
      );
    }

    if (isBulk && targetIds.length > 100) {
      return NextResponse.json(
        { error: 'Bulk operations limited to 100 users' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['SUSPEND', 'ACTIVATE', 'BAN', 'UPDATE_ROLES', 'UPDATE_PROFILE'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get affected users
    const affectedUsers = await prisma.user.findMany({
      where: { id: { in: targetIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        isSuperAdmin: true,
        userRoles: { select: { roleName: true } },
      },
    });

    if (affectedUsers.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    // Prevent modifying other SuperAdmins
    const hasOtherSuperAdmin = affectedUsers.some(
      (user) => user.isSuperAdmin && user.id !== adminUser.id
    );

    if (hasOtherSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot modify other SuperAdmins' },
        { status: 403 }
      );
    }

    // Perform action based on type
    const results = [];
    const errors = [];

    for (const user of affectedUsers) {
      try {
        let updatedUser;
        let auditAction;
        let notificationMessage;

        switch (action) {
          case 'SUSPEND':
            if (user.status === 'SUSPENDED') {
              errors.push({ userId: user.id, error: 'User already suspended' });
              continue;
            }

            updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: { status: 'SUSPENDED' },
            });

            auditAction = 'USERSUSPENDED';
            notificationMessage = `Your account has been suspended. Reason: ${data?.reason || 'No reason provided'}`;
            break;

          case 'ACTIVATE':
            if (user.status === 'ACTIVE') {
              errors.push({ userId: user.id, error: 'User already active' });
              continue;
            }

            updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: { status: 'ACTIVE' },
            });

            auditAction = 'USERUPDATED';
            notificationMessage = 'Your account has been reactivated!';
            break;

          case 'BAN':
            if (user.status === 'BANNED') {
              errors.push({ userId: user.id, error: 'User already banned' });
              continue;
            }

            updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: { status: 'BANNED' },
            });

            auditAction = 'USERBANNED';
            notificationMessage = `Your account has been banned. Reason: ${data?.reason || 'No reason provided'}`;
            break;

          case 'UPDATE_ROLES':
            if (!data?.roles || !Array.isArray(data.roles)) {
              errors.push({ userId: user.id, error: 'Invalid roles data' });
              continue;
            }

            // Delete existing roles
            await prisma.userRoleUser.deleteMany({
              where: { userId: user.id },
            });

            // Create new roles
            await prisma.userRoleUser.createMany({
              data: data.roles.map((roleName: string) => ({
                userId: user.id,
                roleName: roleName,
              })),
            });

            updatedUser = await prisma.user.findUnique({
              where: { id: user.id },
            });

            auditAction = 'ROLEUPGRADED';
            notificationMessage = `Your role has been updated to: ${data.roles.join(', ')}`;
            break;

          case 'UPDATE_PROFILE':
            if (!data) {
              errors.push({ userId: user.id, error: 'No profile data provided' });
              continue;
            }

            updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: {
                firstName: data.firstName || user.firstName,
                lastName: data.lastName || user.lastName,
                phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : user.phoneNumber,
              },
            });

            auditAction = 'USERUPDATED';
            notificationMessage = 'Your profile has been updated by an administrator.';
            break;

          default:
            errors.push({ userId: user.id, error: 'Invalid action' });
            continue;
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            performedBy: adminUser.id,
            affectedUser: user.id,
            action: auditAction,
            entityType: 'User',
            entityId: user.id,
            previousValue: {
              status: user.status,
              roles: user.userRoles.map((r) => r.roleName),
            },
            newValue: {
              status: updatedUser?.status,
              action: action,
            },
            reason: data?.reason || `${action} action performed by SuperAdmin`,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEMALERT',
            title: 'Account Update',
            message: notificationMessage,
            link: '/dashboard/settings',
          },
        });

        results.push({
          userId: user.id,
          success: true,
          action: action,
        });
      } catch (error) {
        errors.push({
          userId: user.id,
          error: error instanceof Error ? error.message : 'Update failed',
        });
      }
    }

    return NextResponse.json(
      {
        message: `${action} completed`,
        results,
        errors: errors.length > 0 ? errors : undefined,
        successCount: results.length,
        errorCount: errors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Users PATCH Error:', error);
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
// DELETE - Delete User(s)
// ============================================================================

export async function DELETE(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userIdsParam = searchParams.get('userIds');

    // Determine bulk or single operation
    const isBulk = !!userIdsParam;
    const targetIds = isBulk
      ? userIdsParam.split(',').filter(Boolean)
      : userId
      ? [userId]
      : [];

    if (targetIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId or userIds' },
        { status: 400 }
      );
    }

    if (isBulk && targetIds.length > 100) {
      return NextResponse.json(
        { error: 'Bulk operations limited to 100 users' },
        { status: 400 }
      );
    }

    // Get affected users
    const affectedUsers = await prisma.user.findMany({
      where: { id: { in: targetIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuperAdmin: true,
      },
    });

    if (affectedUsers.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    // Prevent deleting SuperAdmins
    const hasSuperAdmin = affectedUsers.some((user) => user.isSuperAdmin);

    if (hasSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete SuperAdmin users' },
        { status: 403 }
      );
    }

    const results = [];
    const errors = [];

    for (const user of affectedUsers) {
      try {
        // Soft delete: set status to INACTIVE instead of hard delete
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'INACTIVE' },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            performedBy: adminUser.id,
            affectedUser: user.id,
            action: 'USERDELETED',
            entityType: 'User',
            entityId: user.id,
            reason: 'User deleted by SuperAdmin',
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        });

        results.push({
          userId: user.id,
          success: true,
        });
      } catch (error) {
        errors.push({
          userId: user.id,
          error: error instanceof Error ? error.message : 'Delete failed',
        });
      }
    }

    return NextResponse.json(
      {
        message: `${results.length} user(s) deleted successfully`,
        results,
        errors: errors.length > 0 ? errors : undefined,
        successCount: results.length,
        errorCount: errors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Users DELETE Error:', error);
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