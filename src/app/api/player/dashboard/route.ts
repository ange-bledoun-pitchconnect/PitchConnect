// =============================================================================
// 📊 PLAYER DASHBOARD API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/player/dashboard - Comprehensive player dashboard data
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Access: PLAYER, PLAYER_PRO, PARENT (for child), COACH (roster view)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Sport,
  MatchStatus,
  TrainingStatus,
  NotificationType,
  JoinRequestStatus,
  Prisma,
} from '@prisma/client';

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
  };
}

interface PlayerDashboardResponse {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    avatar: string | null;
    primaryPosition: string | null;
    overallRating: number | null;
    formRating: number | null;
    isVerified: boolean;
    hasCompletedProfile: boolean;
    profileCompleteness: number;
  };
  
  teams: Array<{
    id: string;
    name: string;
    logo: string | null;
    ageGroup: string | null;
    role: string;
    jerseyNumber: number | null;
    position: string | null;
    isCaptain: boolean;
    club: {
      id: string;
      name: string;
      logo: string | null;
      sport: Sport;
    };
  }>;
  
  upcomingMatches: Array<{
    id: string;
    date: string;
    time: string | null;
    venue: string | null;
    type: string;
    status: MatchStatus;
    homeTeam: { id: string; name: string; logo: string | null };
    awayTeam: { id: string; name: string; logo: string | null };
    isHome: boolean;
    sport: Sport;
  }>;
  
  upcomingTraining: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string | null;
    venue: string | null;
    type: string | null;
    status: TrainingStatus;
    team: { id: string; name: string };
    attendanceStatus: string | null;
    sport: Sport;
  }>;
  
  pendingRequests: Array<{
    id: string;
    status: JoinRequestStatus;
    team: { id: string; name: string };
    club: { id: string; name: string; sport: Sport };
    createdAt: string;
  }>;
  
  recentNotifications: Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    link: string | null;
  }>;
  
  stats: {
    totalTeams: number;
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    upcomingMatchesCount: number;
    upcomingTrainingCount: number;
    pendingRequestsCount: number;
    unreadNotificationsCount: number;
  };
  
  // Quick actions available
  quickActions: {
    canBrowseTeams: boolean;
    canEditProfile: boolean;
    canViewStats: boolean;
    hasIncompleteProfile: boolean;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const DashboardFiltersSchema = z.object({
  forPlayerId: z.string().cuid().optional(), // Parent/coach viewing player
  includeStats: z.coerce.boolean().default(true),
  matchesLimit: z.coerce.number().int().min(1).max(10).default(5),
  trainingLimit: z.coerce.number().int().min(1).max(10).default(5),
  notificationsLimit: z.coerce.number().int().min(1).max(10).default(5),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `dash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
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
      'Cache-Control': 'private, max-age=60', // Cache for 1 minute
    },
  });
}

/**
 * Check if user has access to player dashboard
 */
async function checkDashboardAccess(
  userId: string,
  targetPlayerId?: string
): Promise<{ 
  allowed: boolean; 
  playerId: string | null; 
  accessType: 'SELF' | 'PARENT' | 'COACH' | null;
  reason?: string;
}> {
  // Self access
  if (!targetPlayerId) {
    const player = await prisma.player.findUnique({
      where: { userId },
      select: { id: true },
    });
    return {
      allowed: !!player,
      playerId: player?.id || null,
      accessType: player ? 'SELF' : null,
      reason: player ? undefined : 'Player profile not found',
    };
  }

  // Check if user owns this player
  const ownPlayer = await prisma.player.findFirst({
    where: { id: targetPlayerId, userId },
    select: { id: true },
  });

  if (ownPlayer) {
    return { allowed: true, playerId: ownPlayer.id, accessType: 'SELF' };
  }

  // Check parent access
  const parentAccess = await prisma.parentPortalAccess.findFirst({
    where: {
      parent: { userId },
      playerId: targetPlayerId,
      isActive: true,
    },
  });

  if (parentAccess) {
    return { allowed: true, playerId: targetPlayerId, accessType: 'PARENT' };
  }

  // Check coach access (can view players on their teams)
  const coachTeams = await prisma.clubMember.findMany({
    where: {
      userId,
      isActive: true,
      role: { in: ['HEAD_COACH', 'ASSISTANT_COACH', 'MANAGER', 'OWNER'] },
    },
    select: {
      club: {
        select: {
          teams: {
            select: {
              players: {
                where: { playerId: targetPlayerId, isActive: true },
                select: { playerId: true },
              },
            },
          },
        },
      },
    },
  });

  const hasCoachAccess = coachTeams.some((cm) =>
    cm.club.teams.some((t) => t.players.length > 0)
  );

  if (hasCoachAccess) {
    return { allowed: true, playerId: targetPlayerId, accessType: 'COACH' };
  }

  return { 
    allowed: false, 
    playerId: null, 
    accessType: null,
    reason: 'Access denied to this player\'s dashboard',
  };
}

/**
 * Calculate profile completeness
 */
function calculateProfileCompleteness(
  user: { dateOfBirth: Date | null; nationality: string | null },
  player: { 
    height: number | null; 
    primaryPosition: string | null; 
    preferredFoot: string | null;
  }
): number {
  let completed = 0;
  const total = 5;
  
  if (user.dateOfBirth) completed++;
  if (user.nationality) completed++;
  if (player.height) completed++;
  if (player.primaryPosition && player.primaryPosition !== 'UTILITY') completed++;
  if (player.preferredFoot) completed++;
  
  return Math.round((completed / total) * 100);
}

// =============================================================================
// GET HANDLER - Player Dashboard
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

    const userId = session.user.id;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = DashboardFiltersSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Invalid parameters',
        },
        requestId,
        status: 400,
      });
    }

    const filters = validation.data;

    // 3. Check access
    const access = await checkDashboardAccess(userId, filters.forPlayerId);
    if (!access.allowed || !access.playerId) {
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

    const playerId = access.playerId;
    const now = new Date();

    // 4. Fetch all data in parallel
    const [
      player,
      teamMemberships,
      upcomingMatches,
      upcomingTraining,
      pendingRequests,
      recentNotifications,
      unreadCount,
    ] = await Promise.all([
      // Player profile with user
      prisma.player.findUnique({
        where: { id: playerId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatar: true,
              dateOfBirth: true,
              nationality: true,
            },
          },
          aggregateStats: true,
        },
      }),

      // Team memberships
      prisma.teamPlayer.findMany({
        where: { playerId, isActive: true },
        include: {
          team: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  sport: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      }),

      // Upcoming matches (next 5)
      prisma.match.findMany({
        where: {
          date: { gte: now },
          status: { in: [MatchStatus.SCHEDULED, MatchStatus.CONFIRMED] },
          OR: [
            { homeTeam: { players: { some: { playerId, isActive: true } } } },
            { awayTeam: { players: { some: { playerId, isActive: true } } } },
          ],
        },
        include: {
          homeTeam: {
            select: { 
              id: true, 
              name: true, 
              logo: true,
              club: { select: { sport: true } },
              players: { where: { playerId }, select: { playerId: true } },
            },
          },
          awayTeam: {
            select: { 
              id: true, 
              name: true, 
              logo: true,
              club: { select: { sport: true } },
            },
          },
          venue: { select: { name: true } },
        },
        orderBy: { date: 'asc' },
        take: filters.matchesLimit,
      }),

      // Upcoming training (next 5)
      prisma.training.findMany({
        where: {
          date: { gte: now },
          status: { in: [TrainingStatus.SCHEDULED, TrainingStatus.CONFIRMED] },
          team: { players: { some: { playerId, isActive: true } } },
        },
        include: {
          team: {
            select: { 
              id: true, 
              name: true,
              club: { select: { sport: true } },
            },
          },
          venue: { select: { name: true } },
          attendees: {
            where: { playerId },
            select: { status: true },
          },
        },
        orderBy: { date: 'asc' },
        take: filters.trainingLimit,
      }),

      // Pending join requests
      prisma.teamJoinRequest.findMany({
        where: {
          playerId,
          status: JoinRequestStatus.PENDING,
        },
        include: {
          team: {
            select: { id: true, name: true },
          },
          club: {
            select: { id: true, name: true, sport: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Recent notifications (for self only)
      access.accessType === 'SELF'
        ? prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: filters.notificationsLimit,
          })
        : Promise.resolve([]),

      // Unread notification count
      access.accessType === 'SELF'
        ? prisma.notification.count({
            where: { userId, read: false },
          })
        : Promise.resolve(0),
    ]);

    // 5. Handle missing player
    if (!player || !player.user) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player profile not found',
        },
        requestId,
        status: 404,
      });
    }

    // 6. Calculate profile completeness
    const profileCompleteness = calculateProfileCompleteness(player.user, player);

    // 7. Build response
    const response: PlayerDashboardResponse = {
      player: {
        id: player.id,
        firstName: player.user.firstName,
        lastName: player.user.lastName,
        displayName: player.user.displayName,
        avatar: player.user.avatar,
        primaryPosition: player.primaryPosition,
        overallRating: player.overallRating,
        formRating: player.formRating,
        isVerified: player.isVerified,
        hasCompletedProfile: player.hasCompletedProfile,
        profileCompleteness,
      },

      teams: teamMemberships.map((tm) => ({
        id: tm.team.id,
        name: tm.team.name,
        logo: tm.team.logo,
        ageGroup: tm.team.ageGroup,
        role: tm.role,
        jerseyNumber: tm.jerseyNumber,
        position: tm.position,
        isCaptain: tm.isCaptain,
        club: {
          id: tm.team.club.id,
          name: tm.team.club.name,
          logo: tm.team.club.logo,
          sport: tm.team.club.sport,
        },
      })),

      upcomingMatches: upcomingMatches.map((match) => {
        const isHome = match.homeTeam.players.length > 0;
        return {
          id: match.id,
          date: match.date.toISOString(),
          time: match.time,
          venue: match.venue?.name || match.location,
          type: match.matchType,
          status: match.status,
          homeTeam: {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            logo: match.homeTeam.logo,
          },
          awayTeam: {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            logo: match.awayTeam.logo,
          },
          isHome,
          sport: match.homeTeam.club.sport,
        };
      }),

      upcomingTraining: upcomingTraining.map((training) => ({
        id: training.id,
        date: training.date.toISOString(),
        startTime: training.startTime,
        endTime: training.endTime,
        venue: training.venue?.name || training.location,
        type: training.type,
        status: training.status,
        team: {
          id: training.team.id,
          name: training.team.name,
        },
        attendanceStatus: training.attendees[0]?.status || null,
        sport: training.team.club.sport,
      })),

      pendingRequests: pendingRequests.map((req) => ({
        id: req.id,
        status: req.status,
        team: { id: req.team.id, name: req.team.name },
        club: { 
          id: req.club.id, 
          name: req.club.name,
          sport: req.club.sport,
        },
        createdAt: req.createdAt.toISOString(),
      })),

      recentNotifications: recentNotifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        link: n.link,
      })),

      stats: {
        totalTeams: teamMemberships.length,
        totalMatches: player.aggregateStats?.totalMatches || 0,
        totalGoals: player.aggregateStats?.totalGoals || 0,
        totalAssists: player.aggregateStats?.totalAssists || 0,
        upcomingMatchesCount: upcomingMatches.length,
        upcomingTrainingCount: upcomingTraining.length,
        pendingRequestsCount: pendingRequests.length,
        unreadNotificationsCount: unreadCount,
      },

      quickActions: {
        canBrowseTeams: true,
        canEditProfile: access.accessType === 'SELF',
        canViewStats: true,
        hasIncompleteProfile: profileCompleteness < 100,
      },
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player dashboard loaded`, {
      playerId,
      accessType: access.accessType,
      teamsCount: teamMemberships.length,
      matchesCount: upcomingMatches.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/player/dashboard error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to load dashboard',
        details: error instanceof Error ? error.message : undefined,
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
