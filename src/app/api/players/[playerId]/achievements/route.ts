// =============================================================================
// 🏆 PLAYER ACHIEVEMENTS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/players/[playerId]/achievements - Get player's achievements & badges
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Models: PlayerAchievement, Achievement, PlayerMilestone, PlayerLevel
// Access: PLAYER (self), COACH, PARENT, SCOUT, ANALYST, ADMIN
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: PaginationMeta;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface AchievementItem {
  id: string;
  achievementId: string;
  
  // Achievement details
  name: string;
  description: string;
  icon: string | null;
  category: string;
  rarity: string;
  points: number;
  xpReward: number;
  
  // Progress
  progress: number;
  criteriaValue: number;
  progressPercentage: number;
  isComplete: boolean;
  
  // Dates
  earnedAt: string | null;
  createdAt: string;
  
  // Context
  earnedInMatchId: string | null;
  metadata: Record<string, unknown> | null;
  
  // Global stats
  unlockedCount: number;
  isSecret: boolean;
}

interface MilestoneItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  value: number;
  previousValue: number | null;
  sport: Sport;
  achievedAt: string;
  
  // Context
  match: { id: string; date: string } | null;
  team: { id: string; name: string } | null;
}

interface PlayerLevelInfo {
  level: number;
  currentXp: number;
  totalXp: number;
  xpToNextLevel: number;
  progressToNextLevel: number;
  
  // Streaks
  loginStreak: number;
  trainingStreak: number;
  matchStreak: number;
}

interface AchievementsResponse {
  player: {
    id: string;
    name: string;
  };
  
  // Level & XP
  level: PlayerLevelInfo | null;
  
  // Achievements
  achievements: {
    earned: AchievementItem[];
    inProgress: AchievementItem[];
    totalEarned: number;
    totalPoints: number;
  };
  
  // Milestones
  milestones: MilestoneItem[];
  
  // Statistics
  statistics: {
    byRarity: Record<string, number>;
    byCategory: Record<string, number>;
    recentUnlocks: number;
    completionRate: number;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const RARITY_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetAchievementsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  category: z.string().optional(),
  rarity: z.string().optional(),
  status: z.enum(['earned', 'in_progress', 'all']).default('all'),
  includeSecret: z.coerce.boolean().default(false),
  includeMilestones: z.coerce.boolean().default(true),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `achieve_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
    pagination?: PaginationMeta;
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

  if (options.pagination) {
    response.meta!.pagination = options.pagination;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

/**
 * Check if user can view player achievements
 */
async function checkAchievementAccess(
  userId: string,
  playerId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      roles: true,
      player: { select: { id: true } },
      clubMembers: {
        where: { isActive: true },
        select: { clubId: true, role: true },
      },
    },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  // Self access
  if (user.player?.id === playerId) {
    return { allowed: true };
  }

  // Admin/Scout/Analyst access
  const viewAllRoles = ['SUPERADMIN', 'ADMIN', 'SCOUT', 'ANALYST'];
  if (user.isSuperAdmin || user.roles.some(r => viewAllRoles.includes(r))) {
    return { allowed: true };
  }

  // Parent access
  const parentAccess = await prisma.parentPortalAccess.findFirst({
    where: {
      parent: { userId },
      playerId,
      isActive: true,
    },
  });

  if (parentAccess) {
    return { allowed: true };
  }

  // Coach/Staff access (same club)
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      teamPlayers: {
        where: { isActive: true },
        select: { team: { select: { clubId: true } } },
      },
    },
  });

  const playerClubIds = player?.teamPlayers.map(tp => tp.team.clubId) || [];
  const inSameClub = user.clubMembers.some(m => playerClubIds.includes(m.clubId));

  if (inSameClub) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Access denied' };
}

// =============================================================================
// ROUTE CONTEXT
// =============================================================================

interface RouteContext {
  params: Promise<{ playerId: string }>;
}

// =============================================================================
// GET HANDLER - Get Player Achievements
// =============================================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
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

    const userId = session.user.id;
    const { playerId } = await context.params;

    // 2. Check access
    const access = await checkAchievementAccess(userId, playerId);
    if (!access.allowed) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: access.reason || 'Access denied',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = GetAchievementsSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid parameters',
        },
        requestId,
        status: 400,
      });
    }

    const filters = validation.data;

    // 4. Verify player exists and get basic info
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        playerLevel: true,
      },
    });

    if (!player) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player not found',
        },
        requestId,
        status: 404,
      });
    }

    // 5. Build achievement query
    const achievementWhere: any = {
      playerId,
    };

    if (filters.status === 'earned') {
      achievementWhere.isComplete = true;
    } else if (filters.status === 'in_progress') {
      achievementWhere.isComplete = false;
    }

    if (filters.category) {
      achievementWhere.achievement = {
        ...achievementWhere.achievement,
        category: filters.category,
      };
    }

    if (filters.rarity) {
      achievementWhere.achievement = {
        ...achievementWhere.achievement,
        rarity: filters.rarity,
      };
    }

    if (!filters.includeSecret) {
      achievementWhere.OR = [
        { achievement: { isSecret: false } },
        { isComplete: true },
      ];
    }

    // 6. Fetch achievements
    const offset = (filters.page - 1) * filters.limit;

    const [playerAchievements, totalAchievements] = await Promise.all([
      prisma.playerAchievement.findMany({
        where: achievementWhere,
        include: {
          achievement: true,
        },
        orderBy: [
          { isComplete: 'desc' },
          { earnedAt: 'desc' },
          { achievement: { rarity: 'desc' } },
        ],
        skip: offset,
        take: filters.limit,
      }),
      prisma.playerAchievement.count({ where: achievementWhere }),
    ]);

    // 7. Transform achievements
    const transformedAchievements: AchievementItem[] = playerAchievements.map((pa) => ({
      id: pa.id,
      achievementId: pa.achievementId,
      
      name: pa.achievement.name,
      description: pa.achievement.description,
      icon: pa.achievement.icon,
      category: pa.achievement.category,
      rarity: pa.achievement.rarity,
      points: pa.achievement.points,
      xpReward: pa.achievement.xpReward,
      
      progress: pa.progress,
      criteriaValue: pa.achievement.criteriaValue,
      progressPercentage: Math.min(100, Math.round((pa.progress / pa.achievement.criteriaValue) * 100)),
      isComplete: pa.isComplete,
      
      earnedAt: pa.earnedAt?.toISOString() || null,
      createdAt: pa.createdAt.toISOString(),
      
      earnedInMatchId: pa.earnedInMatchId,
      metadata: pa.metadata as Record<string, unknown> | null,
      
      unlockedCount: pa.achievement.unlockedCount,
      isSecret: pa.achievement.isSecret,
    }));

    // Separate earned and in-progress
    const earnedAchievements = transformedAchievements.filter(a => a.isComplete);
    const inProgressAchievements = transformedAchievements.filter(a => !a.isComplete);

    // 8. Fetch milestones (if requested)
    let milestones: MilestoneItem[] = [];
    
    if (filters.includeMilestones) {
      const playerMilestones = await prisma.playerMilestone.findMany({
        where: { playerId },
        include: {
          match: { select: { id: true, date: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: { achievedAt: 'desc' },
        take: 20,
      });

      milestones = playerMilestones.map((pm) => ({
        id: pm.id,
        type: pm.type,
        title: pm.title,
        description: pm.description,
        value: pm.value,
        previousValue: pm.previousValue,
        sport: pm.sport,
        achievedAt: pm.achievedAt.toISOString(),
        
        match: pm.match ? {
          id: pm.match.id,
          date: pm.match.date.toISOString(),
        } : null,
        team: pm.team ? {
          id: pm.team.id,
          name: pm.team.name,
        } : null,
      }));
    }

    // 9. Calculate statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUnlocks = earnedAchievements.filter(
      a => a.earnedAt && new Date(a.earnedAt) >= thirtyDaysAgo
    ).length;

    const byRarity = earnedAchievements.reduce((acc, a) => {
      acc[a.rarity] = (acc[a.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = earnedAchievements.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get total available achievements for completion rate
    const totalAvailable = await prisma.achievement.count({
      where: { isActive: true },
    });

    const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);
    const completionRate = totalAvailable > 0 
      ? Math.round((earnedAchievements.length / totalAvailable) * 100) 
      : 0;

    // 10. Build level info
    const levelInfo: PlayerLevelInfo | null = player.playerLevel ? {
      level: player.playerLevel.level,
      currentXp: player.playerLevel.currentXp,
      totalXp: player.playerLevel.totalXp,
      xpToNextLevel: player.playerLevel.xpToNextLevel,
      progressToNextLevel: Math.round(
        (player.playerLevel.currentXp / player.playerLevel.xpToNextLevel) * 100
      ),
      loginStreak: player.playerLevel.loginStreak,
      trainingStreak: player.playerLevel.trainingStreak,
      matchStreak: player.playerLevel.matchStreak,
    } : null;

    // 11. Build response
    const response: AchievementsResponse = {
      player: {
        id: player.id,
        name: `${player.user.firstName} ${player.user.lastName}`,
      },
      
      level: levelInfo,
      
      achievements: {
        earned: earnedAchievements,
        inProgress: inProgressAchievements,
        totalEarned: earnedAchievements.length,
        totalPoints,
      },
      
      milestones,
      
      statistics: {
        byRarity,
        byCategory,
        recentUnlocks,
        completionRate,
      },
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player achievements fetched`, {
      playerId,
      userId,
      earned: earnedAchievements.length,
      inProgress: inProgressAchievements.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalAchievements,
        totalPages: Math.ceil(totalAchievements / filters.limit),
        hasMore: offset + playerAchievements.length < totalAchievements,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/players/[id]/achievements error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch achievements',
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
