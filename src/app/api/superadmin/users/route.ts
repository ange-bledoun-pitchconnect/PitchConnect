/**
 * SuperAdmin Users Management API
 * Manage all platform users
 * @route GET    /api/superadmin/users - List all users
 * @route PATCH  /api/superadmin/users - Update user
 * @route DELETE /api/superadmin/users - Delete user
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
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
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

    // Role filter
    if (role) {
      where.roles = { has: role };
    }

    // Status filter
    if (status) {
      where.status = status;
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
        roles: true,
        status: true,
        isSuperAdmin: true,
        createdAt: true,
        lastLogin: true,
        subscription: {
          select: {
            tier: true,
            status: true,
          },
        },
      },
    });

    // Get total count
    const total = await prisma.user.count({ where });

    // Format response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.avatar,
      roles: user.roles,
      status: user.status,
      isSuperAdmin: user.isSuperAdmin,
      subscription: user.subscription
        ? {
            tier: user.subscription.tier,
            status: user.subscription.status,
          }
        : null,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString() || null,
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
// PATCH - Update User
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
    const { userId, action, data } = body;

    // Validation
    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action' },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        status: true,
        isSuperAdmin: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent actions on other SuperAdmins
    if (targetUser.isSuperAdmin && targetUser.id !== adminUser.id) {
      return NextResponse.json(
        { error: 'Cannot modify other SuperAdmins' },
        { status: 403 }
      );
    }

    // Handle different actions
    let updatedUser;
    let auditAction;
    let auditReason;

    switch (action) {
      case 'SUSPEND':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { status: 'SUSPENDED' },
        });
        auditAction = 'USER_SUSPENDED';
        auditReason = data?.reason || 'User suspended by SuperAdmin';
        break;

      case 'ACTIVATE':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { status: 'ACTIVE' },
        });
        auditAction = 'USER_UPDATED';
        auditReason = 'User activated by SuperAdmin';
        break;

      case 'BAN':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { status: 'BANNED' },
        });
        auditAction = 'USER_BANNED';
        auditReason = data?.reason || 'User banned by SuperAdmin';
        break;

      case 'UPDATE_ROLES':
        if (!data?.roles || !Array.isArray(data.roles)) {
          return NextResponse.json(
            { error: 'Invalid roles data' },
            { status: 400 }
          );
        }

        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { roles: data.roles },
        });
        auditAction = 'ROLE_UPGRADED';
        auditReason = `Roles updated to: ${data.roles.join(', ')}`;
        break;

      case 'UPDATE_PROFILE':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            firstName: data?.firstName || targetUser.firstName,
            lastName: data?.lastName || targetUser.lastName,
            phoneNumber: data?.phoneNumber,
          },
        });
        auditAction = 'USER_UPDATED';
        auditReason = 'User profile updated by SuperAdmin';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        performedBy: adminUser.id,
        affectedUser: userId,
        action: auditAction,
        entityType: 'User',
        entityId: userId,
        previousValue: {
          status: targetUser.status,
          roles: targetUser.roles,
        },
        newValue: {
          status: updatedUser.status,
          roles: updatedUser.roles,
        },
        reason: auditReason,
      },
    });

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'SYSTEM_ALERT',
        title: `Account ${action.toLowerCase()}`,
        message: auditReason,
        link: '/dashboard/settings',
      },
    });

    return NextResponse.json(
      {
        message: `User ${action.toLowerCase()}d successfully`,
        user: {
          id: updatedUser.id,
          status: updatedUser.status,
          roles: updatedUser.roles,
        },
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
// DELETE - Delete User
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

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isSuperAdmin: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting SuperAdmins
    if (targetUser.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete SuperAdmin users' },
        { status: 403 }
      );
    }

    // Delete user (CASCADE will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        performedBy: adminUser.id,
        affectedUser: null, // User no longer exists
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: userId,
        reason: `User ${targetUser.email} deleted by SuperAdmin`,
      },
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
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
