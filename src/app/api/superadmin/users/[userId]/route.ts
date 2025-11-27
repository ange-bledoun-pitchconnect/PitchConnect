// src/app/api/superadmin/users/[userId]/route.ts
/**
 * SuperAdmin User Detail API
 * GET    - Get user details with full history
 * PATCH  - Update user (role, status, subscription)
 * DELETE - Delete user account (GDPR)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  checkSuperAdminSession,
  getUserDetails,
  suspendUser,
  banUser,
  unbanUser,
  grantSubscription,
  createAuditLog,
  getUserAuditLogs,
  formatUserResponse,
} from '@/lib/superadmin-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/users/[userId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await checkSuperAdminSession();

    const { userId } = params;

    const user = await getUserDetails(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const auditLogs = await getUserAuditLogs(userId, 50, 0);

    const accountAge = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          ...formatUserResponse(user),
          accountAge,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          nationality: user.nationality,
          avatar: user.avatar,
          profiles: {
            player: user.playerProfile ? true : false,
            coach: user.coachProfile ? true : false,
            manager: user.clubManager ? true : false,
            leagueAdmin: user.leagueAdmin ? true : false,
          },
          auditLogs: auditLogs.map((log) => ({
            id: log.id,
            action: log.action,
            details: JSON.parse(log.details || '{}'),
            performedBy: log.performedBy,
            timestamp: log.timestamp,
          })),
        },
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] User GET error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/users/[userId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await checkSuperAdminSession();

    const { userId } = params;
    const body = await request.json();
    const { status, subscriptionTier, roles, firstName, lastName, reason = '' } = body;

    const currentUser = await getUserDetails(userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const updates: any = {};
    const auditDetails: any = {};

    if (status && status !== currentUser.status) {
      if (!['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }

      updates.status = status;
      auditDetails.statusChange = {
        from: currentUser.status,
        to: status,
        reason,
      };

      if (status === 'SUSPENDED') {
        await suspendUser(userId, reason);
        await createAuditLog(admin.id, userId, 'USER_SUSPENDED', auditDetails);
      } else if (status === 'BANNED') {
        await banUser(userId, reason);
        await createAuditLog(admin.id, userId, 'USER_BANNED', auditDetails);
      } else if (status === 'ACTIVE' && currentUser.status === 'BANNED') {
        await unbanUser(userId);
        await createAuditLog(admin.id, userId, 'USER_UNBANNED', auditDetails);
      }
    }

    if (firstName) {
      updates.firstName = firstName;
      auditDetails.firstName = firstName;
    }
    if (lastName) {
      updates.lastName = lastName;
      auditDetails.lastName = lastName;
    }

    if (subscriptionTier) {
      const validTiers = ['FREE', 'PLAYER_PRO', 'COACH', 'MANAGER', 'LEAGUE_ADMIN'];
      if (!validTiers.includes(subscriptionTier)) {
        return NextResponse.json(
          { success: false, error: 'Invalid subscription tier' },
          { status: 400 }
        );
      }

      await grantSubscription(userId, subscriptionTier, 365);
      auditDetails.subscriptionTier = subscriptionTier;
      await createAuditLog(
        admin.id,
        userId,
        'SUBSCRIPTION_GRANTED',
        auditDetails
      );
    }

    if (roles && Array.isArray(roles)) {
      await prisma.userRole_User.deleteMany({
        where: { userId },
      });

      for (const role of roles) {
        await prisma.userRole_User.create({
          data: {
            userId,
            roleName: role,
          },
        });
      }

      auditDetails.rolesChange = {
        from: currentUser.userRoles.map((r) => r.roleName),
        to: roles,
      };

      const hasRoleChange = JSON.stringify(
        currentUser.userRoles.map((r) => r.roleName).sort()
      ) !== JSON.stringify(roles.sort());

      if (hasRoleChange) {
        await createAuditLog(
          admin.id,
          userId,
          'ROLE_UPGRADED',
          auditDetails
        );
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await prisma.user.update({
        where: { id: userId },
        data: updates,
      });
    }

    if (!auditDetails.statusChange && !auditDetails.subscriptionTier && !auditDetails.rolesChange) {
      await createAuditLog(
        admin.id,
        userId,
        'USER_UPDATED',
        { updates }
      );
    }

    const updatedUser = await getUserDetails(userId);

    return NextResponse.json(
      {
        success: true,
        message: 'User updated successfully',
        data: formatUserResponse(updatedUser),
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] User PATCH error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/users/[userId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await checkSuperAdminSession();

    const { userId } = params;
    const body = await request.json();
    const { reason, confirmEmail } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Deletion reason is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (confirmEmail !== user.email) {
      return NextResponse.json(
        { success: false, error: 'Email confirmation does not match' },
        { status: 400 }
      );
    }

    await prisma.player.deleteMany({ where: { userId } });
    await prisma.coach.deleteMany({ where: { userId } });
    await prisma.userRole_User.deleteMany({ where: { userId } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.payment.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    await createAuditLog(
      admin.id,
      userId,
      'USER_DELETED',
      {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        reason,
        gdprCompliant: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'User deleted successfully (GDPR compliant)',
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] User DELETE error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}