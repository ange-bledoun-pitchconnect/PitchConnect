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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'all';
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    // Tab filtering
    switch (tab) {
      case 'active':
        where.status = 'ACTIVE';
        break;
      case 'suspended':
        where.status = 'SUSPENDED';
        break;
      case 'banned':
        where.status = 'BANNED';
        break;
      case 'inactive':
        where.status = 'INACTIVE';
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

    // Role filtering
    if (roleFilter && roleFilter !== 'all') {
      where.userRoles = {
        some: {
          roleName: roleFilter,
        },
      };
    }

    console.log('\n📊 Fetching users with filter:', { tab, search, roleFilter, statusFilter });

    // Fetch users
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
            teamMemberships: true,
            clubMemberships: true,
          },
        },
      },
    });

    const total = await prisma.user.count({ where });

    console.log(`✅ Found ${users.length} users (total: ${total})`);

    // FIXED: Format users with proper roles array and name handling
    const formattedUsers = users.map((user) => {
      // Extract roles as simple string array
      const roles = user.userRoles.map((ur) => ur.roleName);
      
      // Build name with proper fallback
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || user.email.split('@')[0] || 'User';

      console.log(`👤 User: ${user.email}, Roles: [${roles.join(', ')}], Name: ${name}`);

      return {
        id: user.id,
        name: name,
        email: user.email,
        avatar: user.avatar,
        roles: roles, // FIXED: Return as flat array
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
      };
    });

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
    console.error('❌ Users GET Error:', error);
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
// PATCH - Update User(s) - ENHANCED WITH BULK ACTIONS
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const body = await request.json();
    const { userId, userIds, action, data } = body;

    // ENHANCED: Support bulk operations
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

    console.log(`\n🔧 ${action} action for ${targetIds.length} user(s)`);

    const validActions = ['SUSPEND', 'ACTIVATE', 'BAN', 'UPDATE_ROLES', 'UPDATE_PROFILE'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

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
              errors.push({ userId: user.id, error: 'Already suspended' });
              continue;
            }

            updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: { status: 'SUSPENDED' },
            });

            auditAction = 'USER_SUSPENDED';
            notificationMessage = `Your account has been suspended. Reason: ${data?.reason || 'Administrative action'}`;
            break;

          case 'ACTIVATE':
            if (user.status === 'ACTIVE') {
              errors.push({ userId: user.id, error: 'Already active' });
              continue;
            }

            updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: { status: 'ACTIVE' },
            });

            auditAction = 'USER_ACTIVATED';
            notificationMessage = 'Your account has been activated!';
            break;

          case 'BAN':
            if (user.status === 'BANNED') {
              errors.push({ userId: user.id, error: 'Already banned' });
              continue;
            }

            updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: { status: 'BANNED' },
            });

            auditAction = 'USER_BANNED';
            notificationMessage = `Your account has been banned. Reason: ${data?.reason || 'Terms violation'}`;
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
            if (data.roles.length > 0) {
              await prisma.userRoleUser.createMany({
                data: data.roles.map((roleName: string) => ({
                  userId: user.id,
                  roleName: roleName,
                })),
              });
            }

            updatedUser = await prisma.user.findUnique({
              where: { id: user.id },
            });

            auditAction = 'ROLE_UPDATED';
            notificationMessage = `Your roles have been updated to: ${data.roles.join(', ')}`;
            break;

          case 'UPDATE_PROFILE':
            if (!data) {
              errors.push({ userId: user.id, error: 'No profile data' });
              continue;
            }

            updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: {
                firstName: data.firstName !== undefined ? data.firstName : user.firstName,
                lastName: data.lastName !== undefined ? data.lastName : user.lastName,
                phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : user.phoneNumber,
              },
            });

            auditAction = 'USER_UPDATED';
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
            previousValue: JSON.stringify({
              status: user.status,
              roles: user.userRoles.map((r) => r.roleName),
            }),
            newValue: JSON.stringify({
              status: updatedUser?.status,
              action: action,
            }),
            reason: data?.reason || `${action} by SuperAdmin`,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM_ALERT',
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

        console.log(`✅ ${action} completed for user: ${user.email}`);
      } catch (error) {
        console.error(`❌ ${action} failed for user ${user.id}:`, error);
        errors.push({
          userId: user.id,
          error: error instanceof Error ? error.message : 'Update failed',
        });
      }
    }

    return NextResponse.json(
      {
        message: `${action} completed for ${results.length} user(s)`,
        results,
        errors: errors.length > 0 ? errors : undefined,
        successCount: results.length,
        errorCount: errors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Users PATCH Error:', error);
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
// DELETE - Delete User(s) - ENHANCED WITH BULK DELETE
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userIdsParam = searchParams.get('userIds');

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

    console.log(`\n🗑️ Deleting ${targetIds.length} user(s)`);

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
        // Soft delete: set status to INACTIVE
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'INACTIVE' },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            performedBy: adminUser.id,
            affectedUser: user.id,
            action: 'USER_DELETED',
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

        console.log(`✅ Deleted user: ${user.email}`);
      } catch (error) {
        console.error(`❌ Delete failed for user ${user.id}:`, error);
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
    console.error('❌ Users DELETE Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
