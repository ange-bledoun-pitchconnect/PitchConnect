// src/lib/superadmin-helpers.ts
/**
 * SuperAdmin Helper Functions
 * Utilities for user management, analytics, audit logging, and data calculations
 */


import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';


// ============================================================================
// VALIDATION & SECURITY
// ============================================================================


/**
 * Validate SuperAdmin access
 * @param userId - User ID to check
 * @returns boolean - true if user has SuperAdmin access
 */
export async function validateSuperAdminAccess(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isSuperAdmin: true,
        userRoles: {
          select: { roleName: true },
        },
      },
    });


    if (!user) return false;


    const hasSuperAdminRole = user.userRoles.some(
      (role) => role.roleName === 'SUPERADMIN'
    );


    return user.isSuperAdmin || hasSuperAdminRole;
  } catch (error) {
    console.error('[SuperAdmin] Access validation error:', error);
    return false;
  }
}


/**
 * Check SuperAdmin access from session
 */
export async function checkSuperAdminSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized: No session');
  }


  const isAdmin = await validateSuperAdminAccess(session.user.id);
  if (!isAdmin) {
    throw new Error('Unauthorized: SuperAdmin access required');
  }


  return session.user;
}


// ============================================================================
// AUDIT LOGGING
// ============================================================================


export type AuditActionType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_SUSPENDED'
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'ROLE_UPGRADED'
  | 'ROLE_DOWNGRADED'
  | 'SUBSCRIPTION_GRANTED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'PAYMENT_REFUNDED'
  | 'DATA_EXPORTED'
  | 'USER_IMPERSONATED'
  | 'IMPERSONATION_ENDED';


/**
 * Log SuperAdmin action to audit trail
 */
export async function createAuditLog(
  performedById: string,
  targetUserId: string | null,
  action: AuditActionType,
  details: Record<string, any> = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        performedById,
        targetUserId,
        action,
        details: JSON.stringify(details),
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] Audit log creation error:', error);
  }
}


/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  targetUserId: string,
  limit = 50,
  offset = 0
) {
  return await prisma.auditLog.findMany({
    where: { targetUserId },
    include: {
      performedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
  });
}


// ============================================================================
// USER FILTERING & SEARCH
// ============================================================================


/**
 * Build Prisma filter for user search and filtering
 */
export function buildUserFilter(query: {
  search?: string;
  role?: string;
  tier?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const filter: any = {};


  // Search by email, firstName, lastName
  if (query.search) {
    filter.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }


  // Filter by status
  if (query.status) {
    filter.status = query.status;
  }


  // Filter by sign-up date range
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) {
      filter.createdAt.gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      filter.createdAt.lte = new Date(query.dateTo);
    }
  }


  return filter;
}


/**
 * Get users with advanced filtering
 */
export async function getFilteredUsers(
  query: {
    search?: string;
    role?: string;
    tier?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;


  const filter = buildUserFilter(query);


  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: filter,
      include: {
        userRoles: { select: { roleName: true } },
        subscription: { select: { tier: true, status: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.user.count({ where: filter }),
  ]);


  return {
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.userRoles.map((r) => r.roleName),
      status: user.status,
      subscriptionTier: user.subscription?.tier,
      subscriptionStatus: user.subscription?.status,
      paymentCount: user._count.payments,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isSuperAdmin: user.isSuperAdmin,
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
    },
  };
}


// ============================================================================
// ANALYTICS & METRICS
// ============================================================================


/**
 * Calculate Monthly Recurring Revenue (MRR)
 */
export async function calculateMRR() {
  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: {
      user: { select: { id: true } },
    },
  });


  const tierPrices: Record<string, number> = {
    FREE: 0,
    PLAYER_PRO: 4.99,
    COACH: 9.99,
    MANAGER: 19.99,
    LEAGUE_ADMIN: 29.99,
  };


  const mrr = activeSubscriptions.reduce((sum, sub) => {
    const price = tierPrices[sub.tier] || 0;
    return sum + price;
  }, 0);


  return mrr;
}


/**
 * Calculate churn rate (% of subscriptions cancelled)
 */
export async function calculateChurnRate() {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);


  const [cancelledCount, activeCount] = await Promise.all([
    prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        cancelledAt: { gte: monthAgo },
      },
    }),
    prisma.subscription.count({
      where: { status: 'ACTIVE' },
    }),
  ]);


  const churnRate = activeCount > 0 ? (cancelledCount / activeCount) * 100 : 0;
  return parseFloat(churnRate.toFixed(2));
}


/**
 * Get conversion rate (FREE to paid)
 */
export async function getConversionRate() {
  const freePlayers = await prisma.subscription.count({
    where: { tier: 'FREE' },
  });


  const paidSubscriptions = await prisma.subscription.count({
    where: { tier: { not: 'FREE' } },
  });


  const total = freePlayers + paidSubscriptions;
  const rate = total > 0 ? (paidSubscriptions / total) * 100 : 0;
  return parseFloat(rate.toFixed(2));
}


/**
 * Get sign-up metrics for date range
 */
export async function getSignupMetrics(daysBack = 30) {
  const dateThreshold = new Date(
    Date.now() - daysBack * 24 * 60 * 60 * 1000
  );


  const signups = await prisma.user.groupBy({
    by: ['createdAt'],
    where: { createdAt: { gte: dateThreshold } },
    _count: true,
  });


  // Group by day
  const byDay: Record<string, number> = {};
  for (let i = daysBack; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    byDay[dateStr] = 0;
  }


  signups.forEach((signup) => {
    const dateStr = new Date(signup.createdAt)
      .toISOString()
      .split('T')[0];
    byDay[dateStr] = signup._count;
  });


  return byDay;
}


/**
 * Get revenue metrics by subscription tier
 */
export async function getRevenueByTier() {
  const tierPrices: Record<string, number> = {
    FREE: 0,
    PLAYER_PRO: 4.99,
    COACH: 9.99,
    MANAGER: 19.99,
    LEAGUE_ADMIN: 29.99,
  };


  const subscriptions = await prisma.subscription.groupBy({
    by: ['tier'],
    where: { status: 'ACTIVE' },
    _count: true,
  });


  const byTier: Record<string, any> = {};
  subscriptions.forEach((sub) => {
    byTier[sub.tier] = {
      count: sub._count,
      price: tierPrices[sub.tier],
      revenue: sub._count * (tierPrices[sub.tier] || 0),
    };
  });


  return byTier;
}


/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics() {
  const [
    totalUsers,
    activeSubscriptions,
    totalRevenue,
    mrr,
    churnRate,
    conversionRate,
    revenueByTier,
    newSignupsToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    calculateMRR(),
    calculateChurnRate(),
    getConversionRate(),
    getRevenueByTier(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);


  return {
    totalUsers,
    activeSubscriptions,
    totalRevenue: totalRevenue._sum.amount || 0,
    mrr: parseFloat(mrr.toFixed(2)),
    churnRate,
    conversionRate,
    revenueByTier,
    newSignupsToday,
    timestamp: new Date(),
  };
}


// ============================================================================
// USER OPERATIONS
// ============================================================================


/**
 * Find inactive users (no login for X days)
 */
export async function findInactiveUsers(days = 30) {
  const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);


  return await prisma.user.findMany({
    where: {
      OR: [
        { lastLogin: { lt: threshold } },
        { lastLogin: null },
      ],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      lastLogin: true,
      createdAt: true,
    },
  });
}


/**
 * Get user with full details
 */
export async function getUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: { select: { roleName: true } },
      subscription: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      playerProfile: { select: { id: true } },
      coachProfile: { select: { id: true } },
      clubManager: { select: { id: true } },
      leagueAdmin: { select: { id: true } },
    },
  });


  return user;
}


/**
 * Suspend user (prevent login)
 * @param userId - User ID to suspend
 * @param _reason - Reason for suspension (tracked in audit log)
 */
export async function suspendUser(userId: string, _reason: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'SUSPENDED',
      updatedAt: new Date(),
    },
  });
}


/**
 * Ban user (permanent)
 * @param userId - User ID to ban
 * @param _reason - Reason for ban (tracked in audit log)
 */
export async function banUser(userId: string, _reason: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'BANNED',
      updatedAt: new Date(),
    },
  });
}


/**
 * Unban user
 */
export async function unbanUser(userId: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      updatedAt: new Date(),
    },
  });
}


/**
 * Grant subscription tier
 */
export async function grantSubscription(
  userId: string,
  tier: string,
  durationDays = 30
) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);


  return await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: endDate,
    },
    update: {
      tier,
      status: 'ACTIVE',
      currentPeriodEnd: endDate,
    },
  });
}


/**
 * Cancel subscription
 * @param userId - User ID whose subscription to cancel
 * @param _reason - Reason for cancellation (tracked in audit log)
 */
export async function cancelSubscription(userId: string, _reason: string) {
  return await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================


/**
 * Format user response for API
 */
export function formatUserResponse(user: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phoneNumber,
    avatar: user.avatar,
    roles: user.userRoles?.map((r: any) => r.roleName) || [],
    status: user.status,
    isSuperAdmin: user.isSuperAdmin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin,
    subscription: user.subscription,
    paymentCount: user._count?.payments || 0,
  };
}


/**
 * Calculate days since signup
 */
export function daysSinceSignup(createdAt: Date): number {
  const now = new Date();
  const diff = now.getTime() - createdAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
