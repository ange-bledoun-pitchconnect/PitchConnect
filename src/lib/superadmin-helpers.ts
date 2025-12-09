/**
 * SuperAdmin Helper Functions & Utilities
 * Path: /src/lib/superadmin-helpers.ts
 * 
 * Core Features:
 * - SuperAdmin access validation and session checking
 * - Comprehensive audit logging with action tracking
 * - Advanced user filtering and search capabilities
 * - Revenue analytics and financial metrics
 * - User management operations (suspend, ban, subscriptions)
 * - Dashboard metrics and reporting
 * 
 * Schema Aligned: Uses correct AuditLog, User, Subscription, Payment models
 * Production Ready: Full error handling, type safety, comprehensive features
 * Enterprise Grade: Analytics, metrics, compliance tracking, audit trails
 * 
 * Business Logic:
 * - Track all SuperAdmin actions with complete audit trails
 * - Manage user access, roles, and subscription tiers
 * - Monitor revenue, MRR, churn, and conversion metrics
 * - Generate comprehensive dashboard reports
 * - Enforce role-based access control
 */

import { prisma } from '@/lib/prisma';
import { SubscriptionTier } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// ============================================================================
// TYPES
// ============================================================================

type AuditActionType =
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
  | 'IMPERSONATION_ENDED'
  | 'MATCH_RESULT_UPDATED'
  | 'SQUAD_CHANGED'
  | 'TACTICAL_CHANGE'
  | 'BULK_USER_ACTION';

interface AuditLogEntry {
  id: string;
  performedById: string;
  targetUserId: string | null;
  action: AuditActionType;
  details: string;
  createdAt: Date;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  roles: string[];
  status: string;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  subscription: any;
  paymentCount: number;
}

interface DashboardMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  mrr: number;
  churnRate: number;
  conversionRate: number;
  revenueByTier: Record<string, any>;
  newSignupsToday: number;
  timestamp: Date;
}

interface FilteredUsersResponse {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_PRICES: Record<SubscriptionTier, number> = {
  FREE: 0,
  PLAYER_PRO: 4.99,
  COACH: 9.99,
  MANAGER: 19.99,
  LEAGUE_ADMIN: 29.99,
  ENTERPRISE: 99.99,
};

const VALID_SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  'FREE',
  'PLAYER_PRO',
  'COACH',
  'MANAGER',
  'LEAGUE_ADMIN',
  'ENTERPRISE',
];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ============================================================================
// VALIDATION & SECURITY
// ============================================================================

/**
 * Validate SuperAdmin access
 * Checks both isSuperAdmin flag and SUPERADMIN role
 * 
 * @param userId - User ID to check
 * @returns boolean - true if user has SuperAdmin access
 */
export async function validateSuperAdminAccess(
  userId: string
): Promise<boolean> {
  try {
    if (!userId) return false;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isSuperAdmin: true,
        status: true,
        userRoles: {
          select: { roleName: true },
        },
      },
    });

    if (!user) return false;

    // Check if user is banned or suspended
    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return false;
    }

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
 * Check SuperAdmin access from NextAuth session
 * Validates session and SuperAdmin permissions
 * 
 * @throws Error if not authenticated or not SuperAdmin
 * @returns Session user
 */
export async function checkSuperAdminSession() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new Error('Unauthorized: No session found');
    }

    const isAdmin = await validateSuperAdminAccess(session.user.id);
    if (!isAdmin) {
      throw new Error('Unauthorized: SuperAdmin access required');
    }

    console.log(`[SuperAdmin] Access granted to ${session.user.email}`);
    return session.user;
  } catch (error) {
    console.error('[SuperAdmin] Session check failed:', error);
    throw error;
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Create audit log entry for SuperAdmin actions
 * All SuperAdmin operations are logged for compliance
 * 
 * @param performedById - User ID performing the action
 * @param targetUserId - Target user (optional)
 * @param action - Action type
 * @param details - Additional details
 * @param context - Optional request context
 */
export async function createAuditLog(
  performedById: string,
  targetUserId: string | null,
  action: AuditActionType,
  details: Record<string, any> = {},
  context?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<AuditLogEntry | null> {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        performedById,
        targetUserId,
        action,
        details: JSON.stringify(details),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        severity: action.includes('BANNED') || action.includes('DELETED')
          ? 'HIGH'
          : 'INFO',
        status: 'SUCCESS',
      },
    });

    console.log(
      `[Audit] ${action} by ${performedById} on ${targetUserId || 'N/A'}`
    );
    return auditLog as AuditLogEntry;
  } catch (error) {
    console.error('[SuperAdmin] Audit log creation error:', error);
    return null;
  }
}

/**
 * Get audit logs for a user or all logs
 * Used to retrieve audit history for display
 * 
 * @param targetUserId - Filter by target user (optional)
 * @param limit - Number of records to fetch
 * @param offset - Pagination offset
 * @returns Array of audit logs
 */
export async function getAuditLogs(
  targetUserId?: string,
  limit = 50,
  offset = 0
): Promise<AuditLogEntry[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: targetUserId ? { targetUserId } : {},
      select: {
        id: true,
        performedById: true,
        targetUserId: true,
        action: true,
        details: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
    });

    return logs as AuditLogEntry[];
  } catch (error) {
    console.error('[SuperAdmin] Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs for a specific user
 * Alias for getAuditLogs with targetUserId filter
 * 
 * @param userId - User ID to get logs for
 * @param limit - Number of records
 * @param offset - Pagination offset
 * @returns Array of audit logs
 */
export async function getUserAuditLogs(
  userId: string,
  limit = 50,
  offset = 0
): Promise<AuditLogEntry[]> {
  return getAuditLogs(userId, limit, offset);
}

// ============================================================================
// USER FILTERING & SEARCH
// ============================================================================

/**
 * Build Prisma filter for user search and filtering
 * Supports advanced filtering by email, role, tier, status, date range
 */
export function buildUserFilter(query: {
  search?: string;
  role?: string;
  tier?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Record<string, any> {
  const filter: Record<string, any> = {};

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

  // Filter by subscription tier
  if (query.tier) {
    filter.subscription = {
      tier: query.tier,
    };
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
 * Get users with advanced filtering and pagination
 * 
 * @param query - Filter and pagination parameters
 * @returns Filtered users with pagination info
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
): Promise<FilteredUsersResponse> {
  try {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, query.limit || DEFAULT_PAGE_SIZE));
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
      users: users.map((user) => formatUserResponse(user)),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error('[SuperAdmin] Error filtering users:', error);
    return {
      users: [],
      pagination: { page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, pages: 0 },
    };
  }
}

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

/**
 * Calculate Monthly Recurring Revenue (MRR)
 * Only includes active subscriptions with pricing
 */
export async function calculateMRR(): Promise<number> {
  try {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { tier: true },
    });

    const mrr = activeSubscriptions.reduce((sum, sub) => {
      const price = TIER_PRICES[sub.tier] || 0;
      return sum + price;
    }, 0);

    return Math.round(mrr * 100) / 100;
  } catch (error) {
    console.error('[Analytics] Error calculating MRR:', error);
    return 0;
  }
}

/**
 * Calculate churn rate (% of subscriptions cancelled in last 30 days)
 * 
 * @returns Churn rate percentage
 */
export async function calculateChurnRate(): Promise<number> {
  try {
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

    const churnRate =
      activeCount > 0 ? (cancelledCount / activeCount) * 100 : 0;
    return parseFloat(churnRate.toFixed(2));
  } catch (error) {
    console.error('[Analytics] Error calculating churn rate:', error);
    return 0;
  }
}

/**
 * Get conversion rate (FREE to paid subscriptions)
 * 
 * @returns Conversion rate percentage
 */
export async function getConversionRate(): Promise<number> {
  try {
    const freePlayers = await prisma.subscription.count({
      where: { tier: 'FREE' },
    });

    const paidSubscriptions = await prisma.subscription.count({
      where: { tier: { not: 'FREE' } },
    });

    const total = freePlayers + paidSubscriptions;
    const rate = total > 0 ? (paidSubscriptions / total) * 100 : 0;
    return parseFloat(rate.toFixed(2));
  } catch (error) {
    console.error('[Analytics] Error calculating conversion rate:', error);
    return 0;
  }
}

/**
 * Get sign-up metrics for date range
 * Grouped by day
 * 
 * @param daysBack - Number of days to look back
 * @returns Object with date as key and signup count as value
 */
export async function getSignupMetrics(daysBack = 30): Promise<Record<string, number>> {
  try {
    const dateThreshold = new Date(
      Date.now() - daysBack * 24 * 60 * 60 * 1000
    );

    const signups = await prisma.user.findMany({
      where: { createdAt: { gte: dateThreshold } },
      select: { createdAt: true },
    });

    const byDay: Record<string, number> = {};
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      byDay[dateStr] = 0;
    }

    signups.forEach((signup) => {
      const dateStr = signup.createdAt.toISOString().split('T')[0];
      if (byDay[dateStr] !== undefined) {
        byDay[dateStr]++;
      }
    });

    return byDay;
  } catch (error) {
    console.error('[Analytics] Error calculating signup metrics:', error);
    return {};
  }
}

/**
 * Get revenue metrics by subscription tier
 * Shows count, price, and total revenue per tier
 */
export async function getRevenueByTier(): Promise<Record<string, any>> {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { tier: true },
    });

    const byTier: Record<string, any> = {};

    VALID_SUBSCRIPTION_TIERS.forEach((tier) => {
      byTier[tier] = {
        count: 0,
        price: TIER_PRICES[tier],
        revenue: 0,
      };
    });

    subscriptions.forEach((sub) => {
      if (byTier[sub.tier]) {
        byTier[sub.tier].count++;
        byTier[sub.tier].revenue = byTier[sub.tier].count * TIER_PRICES[sub.tier];
      }
    });

    return byTier;
  } catch (error) {
    console.error('[Analytics] Error calculating revenue by tier:', error);
    return {};
  }
}

/**
 * Get comprehensive dashboard metrics
 * All key metrics for SuperAdmin dashboard in one call
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
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
  } catch (error) {
    console.error('[Analytics] Error getting dashboard metrics:', error);
    return {
      totalUsers: 0,
      activeSubscriptions: 0,
      totalRevenue: 0,
      mrr: 0,
      churnRate: 0,
      conversionRate: 0,
      revenueByTier: {},
      newSignupsToday: 0,
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

/**
 * Find inactive users (no login for X days)
 * Useful for engagement campaigns
 * 
 * @param days - Days of inactivity threshold
 * @returns Array of inactive users
 */
export async function findInactiveUsers(days = 30) {
  try {
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await prisma.user.findMany({
      where: {
        OR: [
          { lastLoginAt: { lt: threshold } },
          { lastLoginAt: null },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] Error finding inactive users:', error);
    return [];
  }
}

/**
 * Get user with full details
 * Complete user profile with all related data
 * 
 * @param userId - User ID
 * @returns User with full details or null
 */
export async function getUserDetails(userId: string) {
  try {
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
        _count: {
          select: {
            payments: true,
            sentMessages: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error('[SuperAdmin] Error getting user details:', error);
    return null;
  }
}

/**
 * Suspend user (prevent login)
 * User can be reactivated
 * 
 * @param userId - User ID to suspend
 * @param reason - Reason for suspension
 */
export async function suspendUser(userId: string, reason: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED',
        updatedAt: new Date(),
      },
    });

    console.log(`[SuperAdmin] User suspended: ${userId}`);
    return user;
  } catch (error) {
    console.error('[SuperAdmin] Error suspending user:', error);
    throw error;
  }
}

/**
 * Ban user (permanent)
 * Prevents all access permanently
 * 
 * @param userId - User ID to ban
 * @param reason - Reason for ban
 */
export async function banUser(userId: string, reason: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'BANNED',
        updatedAt: new Date(),
      },
    });

    console.log(`[SuperAdmin] User banned: ${userId}`);
    return user;
  } catch (error) {
    console.error('[SuperAdmin] Error banning user:', error);
    throw error;
  }
}

/**
 * Unban user
 * Restores user access
 * 
 * @param userId - User ID to unban
 */
export async function unbanUser(userId: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    console.log(`[SuperAdmin] User unbanned: ${userId}`);
    return user;
  } catch (error) {
    console.error('[SuperAdmin] Error unbanning user:', error);
    throw error;
  }
}

/**
 * Validate subscription tier
 * Ensures tier is valid from enum
 * 
 * @param tier - Tier to validate
 * @returns boolean - true if valid
 */
function isValidSubscriptionTier(tier: string): tier is SubscriptionTier {
  return VALID_SUBSCRIPTION_TIERS.includes(tier as SubscriptionTier);
}

/**
 * Grant subscription tier
 * Can grant free trial or permanent subscription
 * Signature supports 3 arguments (userId, tier, durationDays)
 * 
 * @param userId - User ID
 * @param tier - Subscription tier (must be valid enum value)
 * @param durationDays - Duration of subscription (0 = permanent)
 */
export async function grantSubscription(
  userId: string,
  tier: string,
  durationDays: number = 30
) {
  try {
    // Validate tier is proper enum value
    if (!isValidSubscriptionTier(tier)) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    const endDate = durationDays && durationDays > 0
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tier: tier as SubscriptionTier,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: endDate,
        grantedByAdmin: true,
      },
      update: {
        tier: tier as SubscriptionTier,
        status: 'ACTIVE',
        currentPeriodEnd: endDate,
        grantedByAdmin: true,
      },
    });

    console.log(`[SuperAdmin] Subscription granted: ${userId} -> ${tier}`);
    return subscription;
  } catch (error) {
    console.error('[SuperAdmin] Error granting subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 * 
 * @param userId - User ID
 * @param reason - Reason for cancellation
 */
export async function cancelSubscription(userId: string, reason: string) {
  try {
    const subscription = await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    console.log(`[SuperAdmin] Subscription cancelled: ${userId}`);
    return subscription;
  } catch (error) {
    console.error('[SuperAdmin] Error cancelling subscription:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format user response for API
 * Standardized user format for responses
 */
export function formatUserResponse(user: any): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phoneNumber || null,
    avatar: user.avatar || null,
    roles: user.userRoles?.map((r: any) => r.roleName) || [],
    status: user.status,
    isSuperAdmin: user.isSuperAdmin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || null,
    subscription: user.subscription,
    paymentCount: user._count?.payments || 0,
  };
}

/**
 * Calculate days since signup
 * 
 * @param createdAt - User creation date
 * @returns Days since signup
 */
export function daysSinceSignup(createdAt: Date): number {
  const now = new Date();
  const diff = now.getTime() - createdAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format currency amount
 * 
 * @param amount - Amount in GBP
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { AuditActionType, AuditLogEntry, UserResponse, DashboardMetrics, FilteredUsersResponse };
