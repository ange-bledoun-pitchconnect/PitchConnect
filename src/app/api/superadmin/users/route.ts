/**
 * SuperAdmin Users Management API
 * Manage all platform users
 * @route GET    /api/superadmin/users - List all users
 * @route PATCH  /api/superadmin/users - Update user (single or bulk)
 * @route DELETE /api/superadmin/users - Delete user (single or bulk)
 * @access SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
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
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const tab = searchParams.get('tab'); // For tab filtering
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filters
    const where: any = {};

    // Search filter (name or email)
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filter using userRoles junction table
    if (role && role !== 'ALL') {
      where.userRoles = {
        some: {
          roleName: role,
        },
      };
    }

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Tab-based filtering
    if (tab) {
      switch (tab) {
        case 'active':
          where.status = 'ACTIVE';
          break;
        case 'suspended':
          where.status = { in: ['SUSPENDED', 'BANNED'] };
          break;
        case 'recent':
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          where.createdAt = { gte: sevenDaysAgo };
          break;
        // 'all' tab has no additional filter
      }
    }

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
            playerTeams: true,
            coachTeams: true,
          },
        },
      },
    });

    // Get total count
    const total = await prisma.user.count({ where });

    // Get stats for tabs
    const stats = {
      all: await prisma.user.count(),
      active: await prisma.user.count({ where: { status: 'ACTIVE' } }),
      suspended: await prisma.user.count({ where: { status: { in: ['SUSPENDED', 'BANNED'] } } }),
      recent: await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    };

    // Format response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.avatar,
      role: user.userRoles[0]?.roleName || 'PLAYER', // Primary role
      roles: user.userRoles.map((ur) => ur.roleName),
      status: user.status,
      isSuperAdmin: user.isSuperAdmin,
      subscriptionStatus: user.subscription?.tier || 'Player FREE',
      subscription: user.subscription
        ? {
            tier: user.subscription.tier,
            status: user.subscription.status,
          }
        : null,
      teamCount: user._count.playerTeams + user._count.coachTeams,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString() || null,
      phoneNumber: user.phoneNumber,
    }));

    return NextResponse.json(
      {
        success: true,
        users: formattedUsers,
        stats,
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
// PATCH - Update User (Single or Bulk)
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
    const { userId, userIds, action, data } = body; // Support both single and bulk

    // Validation
    if ((!userId && !userIds) || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: (userId or userIds) and action' },
        { status: 400 }
      );
    }

    // Determine if bulk operation
    const isBulk = !!userIds && Array.isArray(userIds);
    const targetUserIds = isBulk ? userIds : [userId];

    // Validate bulk operation limit (max 100 users at once)
    if (isBulk && targetUserIds.length > 100) {
      return NextResponse.json(
        { error: 'Bulk operations limited to 100 users at a time' },
        { status: 400 }
      );
    }

    // Get target users
    const targetUsers = await prisma.user.findMany({
      where: { id: { in: targetUserIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        isSuperAdmin: true,
        userRoles: {
          select: {
            roleName: true,
          },
        },
      },
    });

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    // Prevent actions on other SuperAdmins
    const superAdminTargets = targetUsers.filter(
      (u) => u.isSuperAdmin && u.id !== adminUser.id
    );
    if (superAdminTargets.length > 0) {
      return NextResponse.json(
        { error: 'Cannot modify other SuperAdmins' },
        { status: 403 }
      );
    }

    // Handle different actions
    let updatedUsers = [];
    let auditAction;
    let auditReason;

    switch (action) {
      case 'SUSPEND':
        updatedUsers = await prisma.$transaction(
          targetUserIds.map((id) =>
            prisma.user.update({
              where: { id },
              data: { status: 'SUSPENDED' },
              include: { userRoles: { select: { roleName: true } } },
            })
          )
        );
        auditAction = 'USER_SUSPENDED';
        auditReason = data?.reason || 'User(s) suspended by SuperAdmin';
        break;

      case 'ACTIVATE':
        updatedUsers = await prisma.$transaction(
          targetUserIds.map((id) =>
            prisma.user.update({
              where: { id },
              data: { status: 'ACTIVE' },
              include: { userRoles: { select: { roleName: true } } },
            })
          )
        );
        auditAction = 'USER_UPDATED';
        auditReason = 'User(s) activated by SuperAdmin';
        break;

      case 'BAN':
        updatedUsers = await prisma.$transaction(
          targetUserIds.map((id) =>
            prisma.user.update({
              where: { id },
              data: { status: 'BANNED' },
              include: { userRoles: { select: { roleName: true } } },
            })
          )
        );
        auditAction = 'USER_BANNED';
        auditReason = data?.reason || 'User(s) banned by SuperAdmin';
        break;

      case 'UPDATE_ROLES':
        if (!data?.roles || !Array.isArray(data.roles)) {
          return NextResponse.json({ error: 'Invalid roles data' }, { status: 400 });
        }

        // Only support single user for role updates
        if (isBulk) {
          return NextResponse.json(
            { error: 'Bulk role updates not supported. Update one user at a time.' },
            { status: 400 }
          );
        }

        // Update roles using transaction
        const updatedUser = await prisma.$transaction(async (tx) => {
          // Delete existing roles
          await tx.userRole_User.deleteMany({
            where: { userId: targetUserIds[0] },
          });

          // Create new roles
          await tx.userRole_User.createMany({
            data: data.roles.map((role: string) => ({
              userId: targetUserIds[0],
              roleName: role,
            })),
          });

          // Return updated user with roles
          return tx.user.findUnique({
            where: { id: targetUserIds[0] },
            include: {
              userRoles: {
                select: { roleName: true },
              },
            },
          });
        });

        updatedUsers = [updatedUser];
        auditAction = 'ROLE_UPGRADED';
        auditReason = `Roles updated to: ${data.roles.join(', ')}`;
        break;

      case 'UPDATE_PROFILE':
        // Only support single user for profile updates
        if (isBulk) {
          return NextResponse.json(
            { error: 'Bulk profile updates not supported. Update one user at a time.' },
            { status: 400 }
          );
        }

        updatedUsers = [
          await prisma.user.update({
            where: { id: targetUserIds[0] },
            data: {
              firstName: data?.firstName || targetUsers[0].firstName,
              lastName: data?.lastName || targetUsers[0].lastName,
              phoneNumber: data?.phoneNumber,
            },
            include: {
              userRoles: {
                select: { roleName: true },
              },
            },
          }),
        ];
        auditAction = 'USER_UPDATED';
        auditReason = 'User profile updated by SuperAdmin';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Create audit logs for all affected users
    await prisma.auditLog.createMany({
      data: targetUsers.map((targetUser, index) => ({
        performedBy: adminUser.id,
        affectedUser: targetUser.id,
        action: auditAction,
        entityType: 'User',
        entityId: targetUser.id,
        previousValue: {
          status: targetUser.status,
          roles: targetUser.userRoles.map((ur) => ur.roleName),
        },
        newValue: {
          status: updatedUsers[index]?.status,
          roles: updatedUsers[index]?.userRoles.map((ur: any) => ur.roleName),
        },
        reason: auditReason,
      })),
    });

    // Send notifications to affected users
    await prisma.notification.createMany({
      data: targetUserIds.map((id) => ({
        userId: id,
        type: 'SYSTEM_ALERT',
        title: `Account ${action.toLowerCase()}`,
        message: auditReason,
        link: '/dashboard/settings',
      })),
    });

    return NextResponse.json(
      {
        success: true,
        message: `${updatedUsers.length} user(s) ${action.toLowerCase()}d successfully`,
        count: updatedUsers.length,
        users: updatedUsers.map((u) => ({
          id: u.id,
          status: u.status,
          roles: u.userRoles.map((ur: any) => ur.roleName),
        })),
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
// DELETE - Delete User (Single or Bulk)
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
    const userIds = searchParams.get('userIds'); // Comma-separated IDs for bulk

    if (!userId && !userIds) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId or userIds' },
        { status: 400 }
      );
    }

    // Determine if bulk operation
    const targetUserIds = userIds ? userIds.split(',') : [userId!];

    // Validate bulk operation limit
    if (targetUserIds.length > 100) {
      return NextResponse.json(
        { error: 'Bulk delete limited to 100 users at a time' },
        { status: 400 }
      );
    }

    // Get target users
    const targetUsers = await prisma.user.findMany({
      where: { id: { in: targetUserIds } },
      select: { id: true, isSuperAdmin: true, email: true },
    });

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    // Prevent deleting SuperAdmins
    const superAdminTargets = targetUsers.filter((u) => u.isSuperAdmin);
    if (superAdminTargets.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete SuperAdmin users' },
        { status: 403 }
      );
    }

    // Delete users (CASCADE will handle related records including userRoles)
    await prisma.user.deleteMany({
      where: { id: { in: targetUserIds } },
    });

    // Create audit logs
    await prisma.auditLog.createMany({
      data: targetUsers.map((user) => ({
        performedBy: adminUser.id,
        affectedUser: null, // User no longer exists
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: user.id,
        reason: `User ${user.email} deleted by SuperAdmin`,
      })),
    });

    return NextResponse.json(
      {
        success: true,
        message: `${targetUsers.length} user(s) deleted successfully`,
        count: targetUsers.length,
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
