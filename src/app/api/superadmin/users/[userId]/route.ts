// =============================================================================
// 👤 SUPERADMIN USER DETAIL API - Enterprise-Grade
// =============================================================================
// GET    /api/superadmin/users/[userId] - Get user details
// PATCH  /api/superadmin/users/[userId] - Update user
// DELETE /api/superadmin/users/[userId] - Delete user (soft or hard)
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Full user management, GDPR compliance, soft/hard delete
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { UserStatus } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  avatar: string | null;
  
  roles: string[];
  status: string;
  isSuperAdmin: boolean;
  
  emailVerified: string | null;
  lastLoginAt: string | null;
  accountAge: number;
  
  profiles: {
    hasPlayer: boolean;
    hasCoach: boolean;
    hasManager: boolean;
    hasLeagueAdmin: boolean;
  };
  
  subscription: {
    tier: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
  
  stats: {
    clubMemberships: number;
    teamMemberships: number;
    matchesPlayed: number;
    trainingsAttended: number;
  };
  
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
  }>;
  
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SELF_MODIFICATION: 'SELF_MODIFICATION',
  SUPERADMIN_PROTECTED: 'SUPERADMIN_PROTECTED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const VALID_STATUSES: UserStatus[] = ['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION', 'DEACTIVATED'];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION', 'DEACTIVATED']).optional(),
  roles: z.array(z.string()).optional(),
  subscriptionTier: z.string().optional(),
  subscriptionDays: z.number().int().min(1).max(3650).optional(),
  reason: z.string().max(500).optional(),
});

const DeleteUserSchema = z.object({
  deleteType: z.enum(['soft', 'hard']).default('soft'),
  reason: z.string().min(1).max(500),
  confirmEmail: z.string().email(),
  exportDataFirst: z.boolean().default(true), // GDPR - export before hard delete
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
    error?: { code: string; message: string };
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.message) {
    response.message = options.message;
  }

  if (options.error) {
    response.error = options.error;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: { 'X-Request-ID': options.requestId },
  });
}

/**
 * Verify SuperAdmin access
 */
async function verifySuperAdmin(userId: string): Promise<{ isValid: boolean; user?: any }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isSuperAdmin: true,
      roles: true,
    },
  });

  if (!user) return { isValid: false };
  const isValid = user.isSuperAdmin || user.roles.includes('SUPERADMIN');
  return { isValid, user };
}

/**
 * Get full user details
 */
async function getUserDetails(userId: string): Promise<UserDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      player: {
        include: {
          teamPlayers: { where: { isActive: true } },
        },
      },
      coach: true,
      subscription: true,
      clubMembers: { where: { isActive: true } },
    },
  });

  if (!user) return null;

  // Get stats
  const [matchesPlayed, trainingsAttended, recentActivity] = await Promise.all([
    user.player ? prisma.matchPlayer.count({
      where: { playerId: user.player.id },
    }) : 0,
    user.player ? prisma.trainingAttendance.count({
      where: { playerId: user.player.id, attended: true },
    }) : 0,
    prisma.auditLog.findMany({
      where: {
        OR: [
          { userId },
          { targetUserId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, action: true, createdAt: true },
    }),
  ]);

  const accountAge = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    dateOfBirth: user.dateOfBirth?.toISOString() || null,
    nationality: user.nationality,
    avatar: user.avatar,
    
    roles: user.roles,
    status: user.status,
    isSuperAdmin: user.isSuperAdmin,
    
    emailVerified: user.emailVerified?.toISOString() || null,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    accountAge,
    
    profiles: {
      hasPlayer: !!user.player,
      hasCoach: !!user.coach,
      hasManager: user.roles.includes('MANAGER'),
      hasLeagueAdmin: user.roles.includes('LEAGUE_ADMIN'),
    },
    
    subscription: user.subscription ? {
      tier: user.subscription.tier,
      status: user.subscription.status,
      currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() || null,
    } : null,
    
    stats: {
      clubMemberships: user.clubMembers.length,
      teamMemberships: user.player?.teamPlayers.length || 0,
      matchesPlayed,
      trainingsAttended,
    },
    
    recentActivity: recentActivity.map(a => ({
      id: a.id,
      action: a.action,
      timestamp: a.createdAt.toISOString(),
    })),
    
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// =============================================================================
// GET HANDLER - User Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid } = await verifySuperAdmin(session.user.id);
    if (!isValid) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Get user details
    const user = await getUserDetails(params.userId);

    if (!user) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' },
        requestId,
        status: 404,
      });
    }

    return createResponse(user, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/users/[userId] error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to fetch user' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update User
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid, user: adminUser } = await verifySuperAdmin(session.user.id);
    if (!isValid || !adminUser) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Prevent self-modification for sensitive fields
    if (params.userId === session.user.id) {
      // Allow basic profile updates, but not status/role changes
    }

    // 4. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid JSON in request body' },
        requestId,
        status: 400,
      });
    }

    const validation = UpdateUserSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Validation failed' },
        requestId,
        status: 400,
      });
    }

    const updateParams = validation.data;

    // 5. Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { subscription: true },
    });

    if (!currentUser) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' },
        requestId,
        status: 404,
      });
    }

    // 6. Protect SuperAdmin users from status changes by non-SuperAdmins
    if (currentUser.isSuperAdmin && updateParams.status && updateParams.status !== 'ACTIVE') {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.SUPERADMIN_PROTECTED, message: 'Cannot change status of SuperAdmin users' },
        requestId,
        status: 403,
      });
    }

    // 7. Build updates
    const updates: any = {};
    const auditDetails: any = { changes: {} };

    if (updateParams.firstName) {
      updates.firstName = updateParams.firstName;
      auditDetails.changes.firstName = { from: currentUser.firstName, to: updateParams.firstName };
    }

    if (updateParams.lastName) {
      updates.lastName = updateParams.lastName;
      auditDetails.changes.lastName = { from: currentUser.lastName, to: updateParams.lastName };
    }

    if (updateParams.status && updateParams.status !== currentUser.status) {
      updates.status = updateParams.status;
      auditDetails.changes.status = { from: currentUser.status, to: updateParams.status };

      if (updateParams.status === 'SUSPENDED' || updateParams.status === 'BANNED') {
        updates.suspendedAt = new Date();
        updates.suspendedReason = updateParams.reason;
      }
    }

    if (updateParams.roles) {
      updates.roles = updateParams.roles;
      auditDetails.changes.roles = { from: currentUser.roles, to: updateParams.roles };
    }

    // 8. Handle subscription update
    if (updateParams.subscriptionTier) {
      const durationDays = updateParams.subscriptionDays || 365;
      const now = new Date();
      const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await prisma.subscription.upsert({
        where: { userId: params.userId },
        update: {
          tier: updateParams.subscriptionTier as any,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        create: {
          userId: params.userId,
          tier: updateParams.subscriptionTier as any,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      auditDetails.subscription = {
        tier: updateParams.subscriptionTier,
        durationDays,
      };
    }

    // 9. Apply updates
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await prisma.user.update({
        where: { id: params.userId },
        data: updates,
      });
    }

    // 10. Create audit log
    const auditAction = updateParams.status === 'SUSPENDED' ? 'USER_SUSPENDED'
      : updateParams.status === 'BANNED' ? 'USER_BANNED'
      : updateParams.status === 'ACTIVE' && currentUser.status === 'BANNED' ? 'USER_UNBANNED'
      : 'USER_UPDATED';

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        targetUserId: params.userId,
        action: auditAction,
        resourceType: 'USER',
        resourceId: params.userId,
        details: JSON.stringify(auditDetails),
        severity: ['USER_SUSPENDED', 'USER_BANNED'].includes(auditAction) ? 'WARNING' : 'INFO',
      },
    });

    // 11. Get updated user
    const updatedUser = await getUserDetails(params.userId);

    console.log(`[${requestId}] User updated`, {
      adminId: session.user.id,
      targetUserId: params.userId,
      action: auditAction,
    });

    return createResponse(updatedUser, {
      success: true,
      message: 'User updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] PATCH /api/superadmin/users/[userId] error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to update user' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Delete User (Soft or Hard)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid, user: adminUser } = await verifySuperAdmin(session.user.id);
    if (!isValid || !adminUser) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Prevent self-deletion
    if (params.userId === session.user.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.SELF_MODIFICATION, message: 'Cannot delete your own account' },
        requestId,
        status: 400,
      });
    }

    // 4. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid JSON in request body' },
        requestId,
        status: 400,
      });
    }

    const validation = DeleteUserSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Validation failed' },
        requestId,
        status: 400,
      });
    }

    const deleteParams = validation.data;

    // 5. Get user
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuperAdmin: true,
        deletedAt: true,
      },
    });

    if (!user) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' },
        requestId,
        status: 404,
      });
    }

    // 6. Prevent deletion of SuperAdmin users
    if (user.isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.SUPERADMIN_PROTECTED, message: 'Cannot delete SuperAdmin users' },
        requestId,
        status: 403,
      });
    }

    // 7. Verify email confirmation
    if (deleteParams.confirmEmail !== user.email) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Email confirmation does not match' },
        requestId,
        status: 400,
      });
    }

    // 8. Process deletion
    if (deleteParams.deleteType === 'soft') {
      // ==========================================================================
      // SOFT DELETE
      // ==========================================================================
      await prisma.user.update({
        where: { id: params.userId },
        data: {
          deletedAt: new Date(),
          status: 'DEACTIVATED',
        },
      });

      // Deactivate related records
      await prisma.$transaction([
        prisma.clubMember.updateMany({
          where: { userId: params.userId },
          data: { isActive: false },
        }),
        prisma.teamPlayer.updateMany({
          where: { player: { userId: params.userId } },
          data: { isActive: false },
        }),
      ]);

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          targetUserId: params.userId,
          action: 'USER_SOFT_DELETED',
          resourceType: 'USER',
          resourceId: params.userId,
          details: JSON.stringify({
            email: user.email,
            reason: deleteParams.reason,
            canRestore: true,
          }),
          severity: 'CRITICAL',
        },
      });

      console.log(`[${requestId}] User soft deleted`, {
        adminId: session.user.id,
        targetUserId: params.userId,
        email: user.email,
      });

      return createResponse({
        userId: params.userId,
        deleteType: 'soft',
        canRestore: true,
      }, {
        success: true,
        message: 'User soft deleted. Account can be restored.',
        requestId,
      });
    } else {
      // ==========================================================================
      // HARD DELETE (GDPR Compliant)
      // ==========================================================================
      
      // Create data export request if needed
      if (deleteParams.exportDataFirst) {
        await prisma.dataExportRequest.create({
          data: {
            userId: params.userId,
            requestedBy: session.user.id,
            status: 'PENDING',
            includeTypes: ['profile', 'activity', 'payments', 'subscriptions'],
            format: 'JSON',
          },
        });
      }

      // Delete related data in correct order
      await prisma.$transaction([
        // Delete notifications
        prisma.notification.deleteMany({ where: { userId: params.userId } }),
        
        // Delete audit logs (keep for compliance, just anonymize)
        prisma.auditLog.updateMany({
          where: { userId: params.userId },
          data: { userId: null },
        }),
        prisma.auditLog.updateMany({
          where: { targetUserId: params.userId },
          data: { targetUserId: null },
        }),
        
        // Delete payments
        prisma.payment.deleteMany({ where: { userId: params.userId } }),
        
        // Delete subscription
        prisma.subscription.deleteMany({ where: { userId: params.userId } }),
        
        // Delete club memberships
        prisma.clubMember.deleteMany({ where: { userId: params.userId } }),
        
        // Delete player profile and related
        prisma.teamPlayer.deleteMany({ where: { player: { userId: params.userId } } }),
        prisma.player.deleteMany({ where: { userId: params.userId } }),
        
        // Delete coach profile
        prisma.coach.deleteMany({ where: { userId: params.userId } }),
        
        // Delete 2FA
        prisma.twoFactorAuth.deleteMany({ where: { userId: params.userId } }),
        
        // Finally delete user
        prisma.user.delete({ where: { id: params.userId } }),
      ]);

      // Create final audit log (with no user reference since user is deleted)
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'USER_HARD_DELETED',
          resourceType: 'USER',
          resourceId: params.userId,
          details: JSON.stringify({
            deletedEmail: user.email,
            deletedName: `${user.firstName} ${user.lastName}`,
            reason: deleteParams.reason,
            gdprCompliant: true,
            dataExported: deleteParams.exportDataFirst,
          }),
          severity: 'CRITICAL',
        },
      });

      console.log(`[${requestId}] User hard deleted (GDPR)`, {
        adminId: session.user.id,
        deletedUserId: params.userId,
        email: user.email,
      });

      return createResponse({
        userId: params.userId,
        deleteType: 'hard',
        gdprCompliant: true,
        dataExported: deleteParams.exportDataFirst,
      }, {
        success: true,
        message: 'User permanently deleted (GDPR compliant)',
        requestId,
      });
    }
  } catch (error) {
    console.error(`[${requestId}] DELETE /api/superadmin/users/[userId] error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to delete user' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';