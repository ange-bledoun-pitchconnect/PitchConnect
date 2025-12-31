// =============================================================================
// 📊 SUPERADMIN DASHBOARD API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/superadmin/dashboard - Platform overview and key metrics
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Multi-sport breakdown, real-time metrics, recent activity
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Sport, MatchStatus } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface PlatformMetrics {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    pendingVerification: number;
  };
  
  subscriptions: {
    active: number;
    trialing: number;
    churned: number;
    mrr: number;
  };
  
  content: {
    totalClubs: number;
    totalTeams: number;
    totalLeagues: number;
    totalMatches: number;
    liveMatches: number;
  };
}

interface SportBreakdown {
  sport: Sport;
  clubs: number;
  teams: number;
  players: number;
  matches: number;
  leagues: number;
}

interface RecentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  createdAt: string;
  status: string;
}

interface RecentActivity {
  id: string;
  action: string;
  performedBy: {
    id: string;
    name: string;
  };
  targetUser: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  severity: string;
}

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  api: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  lastChecked: string;
}

interface DashboardResponse {
  metrics: PlatformMetrics;
  sportBreakdown: SportBreakdown[];
  recentSignups: RecentUser[];
  recentActivity: RecentActivity[];
  systemHealth: SystemHealth;
  
  quickStats: {
    matchesToday: number;
    trainingsToday: number;
    activeImpersonations: number;
    pendingApprovals: number;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
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

  if (options.error) {
    response.error = options.error;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
      'Cache-Control': 'private, max-age=30',
    },
  });
}

/**
 * Verify SuperAdmin access
 */
async function verifySuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      roles: true,
    },
  });

  return user?.isSuperAdmin || user?.roles.includes('SUPERADMIN') || false;
}

// =============================================================================
// GET HANDLER - Dashboard Metrics
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const isSuperAdmin = await verifySuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'SuperAdmin access required',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Calculate date boundaries
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 4. Fetch all metrics in parallel
    const [
      // User metrics
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      pendingVerification,
      
      // Subscription metrics
      activeSubscriptions,
      trialingSubscriptions,
      churnedSubscriptions,
      
      // Content metrics
      totalClubs,
      totalTeams,
      totalLeagues,
      totalMatches,
      liveMatches,
      
      // Recent signups
      recentSignups,
      
      // Recent activity
      recentAuditLogs,
      
      // Sport breakdown
      clubsBySport,
      
      // Quick stats
      matchesToday,
      trainingsToday,
      activeImpersonations,
      
      // Revenue for MRR
      activeSubscriptionsWithTier,
    ] = await Promise.all([
      // Users
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart }, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo }, deletedAt: null } }),
      prisma.user.count({ where: { status: 'PENDING_VERIFICATION', deletedAt: null } }),
      
      // Subscriptions
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIALING' } }),
      prisma.subscription.count({ where: { status: 'CANCELLED' } }),
      
      // Content
      prisma.club.count({ where: { deletedAt: null } }),
      prisma.team.count({ where: { deletedAt: null } }),
      prisma.league.count({ where: { deletedAt: null } }),
      prisma.match.count({ where: { deletedAt: null } }),
      prisma.match.count({ where: { status: 'LIVE' } }),
      
      // Recent signups (last 10)
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
          status: true,
        },
      }),
      
      // Recent audit logs (last 20)
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
          targetUser: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      
      // Clubs by sport
      prisma.club.groupBy({
        by: ['sport'],
        _count: true,
        where: { deletedAt: null },
      }),
      
      // Matches today
      prisma.match.count({
        where: {
          date: {
            gte: todayStart,
            lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Trainings today
      prisma.training.count({
        where: {
          date: {
            gte: todayStart,
            lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Active impersonations
      prisma.impersonationSession.count({
        where: { endedAt: null },
      }),
      
      // Subscriptions with tier for MRR calculation
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { tier: true, monthlyPrice: true, customPrice: true },
      }),
    ]);

    // 5. Calculate MRR
    const mrr = activeSubscriptionsWithTier.reduce((sum, sub) => {
      return sum + (sub.customPrice || sub.monthlyPrice || 0);
    }, 0);

    // 6. Build sport breakdown
    const sportBreakdown: SportBreakdown[] = await Promise.all(
      clubsBySport.map(async (sportData) => {
        const clubIds = await prisma.club.findMany({
          where: { sport: sportData.sport, deletedAt: null },
          select: { id: true },
        });
        
        const clubIdList = clubIds.map(c => c.id);
        
        const [teams, players, matches, leagues] = await Promise.all([
          prisma.team.count({ where: { clubId: { in: clubIdList }, deletedAt: null } }),
          prisma.teamPlayer.count({
            where: { team: { clubId: { in: clubIdList } }, isActive: true },
          }),
          prisma.match.count({
            where: {
              OR: [
                { homeTeam: { clubId: { in: clubIdList } } },
                { awayTeam: { clubId: { in: clubIdList } } },
              ],
            },
          }),
          prisma.league.count({
            where: {
              competition: { clubs: { some: { clubId: { in: clubIdList } } } },
              deletedAt: null,
            },
          }),
        ]);
        
        return {
          sport: sportData.sport,
          clubs: sportData._count,
          teams,
          players,
          matches,
          leagues,
        };
      })
    );

    // 7. Transform recent signups
    const transformedSignups: RecentUser[] = recentSignups.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      status: user.status,
    }));

    // 8. Transform recent activity
    const transformedActivity: RecentActivity[] = recentAuditLogs.map(log => ({
      id: log.id,
      action: log.action,
      performedBy: {
        id: log.user?.id || 'system',
        name: log.user 
          ? `${log.user.firstName} ${log.user.lastName}`.trim() 
          : 'System',
      },
      targetUser: log.targetUser ? {
        id: log.targetUser.id,
        name: `${log.targetUser.firstName} ${log.targetUser.lastName}`.trim(),
      } : null,
      createdAt: log.createdAt.toISOString(),
      severity: log.severity,
    }));

    // 9. System health (simplified check)
    const systemHealth: SystemHealth = {
      database: 'healthy', // Would check actual DB health
      api: 'healthy',
      storage: 'healthy',
      lastChecked: new Date().toISOString(),
    };

    // 10. Build response
    const response: DashboardResponse = {
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          pendingVerification,
        },
        subscriptions: {
          active: activeSubscriptions,
          trialing: trialingSubscriptions,
          churned: churnedSubscriptions,
          mrr,
        },
        content: {
          totalClubs,
          totalTeams,
          totalLeagues,
          totalMatches,
          liveMatches,
        },
      },
      
      sportBreakdown,
      recentSignups: transformedSignups,
      recentActivity: transformedActivity,
      systemHealth,
      
      quickStats: {
        matchesToday,
        trainingsToday,
        activeImpersonations,
        pendingApprovals: pendingVerification,
      },
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Dashboard loaded`, {
      adminId: session.user.id,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/dashboard error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to load dashboard',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';