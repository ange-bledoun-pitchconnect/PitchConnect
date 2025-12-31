// =============================================================================
// ⚽ PLAYER MATCHES API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/players/[playerId]/matches - Get player's match history
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Models: PlayerMatchPerformance, Match, MatchEvent
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport, MatchStatus, Position } from '@prisma/client';

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

interface MatchPerformance {
  id: string;
  matchId: string;
  
  // Match info
  match: {
    date: string;
    time: string | null;
    venue: string | null;
    competition: string | null;
    matchType: string;
    status: MatchStatus;
    
    homeTeam: {
      id: string;
      name: string;
      logo: string | null;
    };
    awayTeam: {
      id: string;
      name: string;
      logo: string | null;
    };
    
    homeScore: number | null;
    awayScore: number | null;
  };
  
  // Player's performance
  performance: {
    started: boolean;
    position: Position | null;
    jerseyNumber: number | null;
    minutesPlayed: number;
    rating: number | null;
    
    // Key stats (sport-aware)
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    
    // Substitution info
    substitutedIn: number | null;  // Minute
    substitutedOut: number | null; // Minute
    
    // Sport-specific stats
    sportStats: Record<string, number>;
  };
  
  // Match events for this player
  events: Array<{
    id: string;
    type: string;
    minute: number;
    description: string | null;
  }>;
  
  // Result from player's perspective
  result: 'WIN' | 'DRAW' | 'LOSS';
  isHome: boolean;
  sport: Sport;
}

interface MatchesResponse {
  player: {
    id: string;
    name: string;
  };
  
  matches: MatchPerformance[];
  
  summary: {
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    totalGoals: number;
    totalAssists: number;
    averageRating: number | null;
    averageMinutes: number;
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

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetMatchesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  season: z.string().optional(),
  teamId: z.string().cuid().optional(),
  competition: z.string().optional(),
  result: z.enum(['WIN', 'DRAW', 'LOSS']).optional(),
  status: z.nativeEnum(MatchStatus).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `matches_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
 * Check user access to player matches
 */
async function checkMatchAccess(
  userId: string,
  playerId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      roles: true,
      player: { select: { id: true } },
      clubMembers: {
        where: { isActive: true },
        select: { clubId: true },
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

  // Admin access
  if (user.isSuperAdmin || user.roles.some(r => ['ADMIN', 'SCOUT', 'ANALYST'].includes(r))) {
    return { allowed: true };
  }

  // Same club access
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

  return { allowed: false, reason: 'Access denied' };
}

// =============================================================================
// ROUTE CONTEXT
// =============================================================================

interface RouteContext {
  params: Promise<{ playerId: string }>;
}

// =============================================================================
// GET HANDLER - Get Player Matches
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
    const access = await checkMatchAccess(userId, playerId);
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

    const validation = GetMatchesSchema.safeParse(rawParams);
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

    // 4. Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        teamPlayers: {
          where: { isActive: true },
          select: { teamId: true },
        },
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

    const playerTeamIds = player.teamPlayers.map(tp => tp.teamId);

    // 5. Build performance query
    const performanceWhere: any = {
      playerId,
    };

    // Apply filters
    if (filters.status) {
      performanceWhere.match = { status: filters.status };
    }

    if (filters.teamId) {
      performanceWhere.match = {
        ...performanceWhere.match,
        OR: [
          { homeTeamId: filters.teamId },
          { awayTeamId: filters.teamId },
        ],
      };
    }

    if (filters.from || filters.to) {
      performanceWhere.match = {
        ...performanceWhere.match,
        date: {
          ...(filters.from && { gte: new Date(filters.from) }),
          ...(filters.to && { lte: new Date(filters.to) }),
        },
      };
    }

    // 6. Execute query
    const offset = (filters.page - 1) * filters.limit;

    const [performances, total] = await Promise.all([
      prisma.playerMatchPerformance.findMany({
        where: performanceWhere,
        include: {
          match: {
            include: {
              homeTeam: {
                select: { 
                  id: true, 
                  name: true, 
                  logo: true,
                  club: { select: { sport: true } },
                },
              },
              awayTeam: {
                select: { id: true, name: true, logo: true },
              },
              venue: { select: { name: true } },
              competition: { select: { name: true } },
              events: {
                where: { playerId },
                orderBy: { minute: 'asc' },
              },
            },
          },
        },
        orderBy: { match: { date: filters.sortOrder } },
        skip: offset,
        take: filters.limit,
      }),
      prisma.playerMatchPerformance.count({ where: performanceWhere }),
    ]);

    // 7. Transform performances
    const transformedMatches: MatchPerformance[] = performances.map((perf) => {
      const match = perf.match;
      const isHome = playerTeamIds.includes(match.homeTeamId);
      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;

      let result: 'WIN' | 'DRAW' | 'LOSS';
      if (homeScore === awayScore) {
        result = 'DRAW';
      } else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) {
        result = 'WIN';
      } else {
        result = 'LOSS';
      }

      // Build sport-specific stats from performance data
      const sportStats: Record<string, number> = {};
      if (perf.shotsOnTarget) sportStats.shotsOnTarget = perf.shotsOnTarget;
      if (perf.passesCompleted) sportStats.passesCompleted = perf.passesCompleted;
      if (perf.passAccuracy) sportStats.passAccuracy = perf.passAccuracy;
      if (perf.tackles) sportStats.tackles = perf.tackles;
      if (perf.interceptions) sportStats.interceptions = perf.interceptions;
      if (perf.foulsCommitted) sportStats.foulsCommitted = perf.foulsCommitted;
      if (perf.foulsSuffered) sportStats.foulsSuffered = perf.foulsSuffered;

      return {
        id: perf.id,
        matchId: perf.matchId,
        
        match: {
          date: match.date.toISOString(),
          time: match.time,
          venue: match.venue?.name || match.location,
          competition: match.competition?.name || null,
          matchType: match.matchType,
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
          
          homeScore,
          awayScore,
        },
        
        performance: {
          started: perf.started,
          position: perf.position,
          jerseyNumber: perf.jerseyNumber,
          minutesPlayed: perf.minutesPlayed || 0,
          rating: perf.rating,
          
          goals: perf.goals || 0,
          assists: perf.assists || 0,
          yellowCards: perf.yellowCards || 0,
          redCards: perf.redCards || 0,
          
          substitutedIn: perf.substitutedIn,
          substitutedOut: perf.substitutedOut,
          
          sportStats,
        },
        
        events: match.events.map(e => ({
          id: e.id,
          type: e.type,
          minute: e.minute,
          description: e.description,
        })),
        
        result,
        isHome,
        sport: match.homeTeam.club.sport,
      };
    });

    // 8. Filter by result if specified
    let filteredMatches = transformedMatches;
    if (filters.result) {
      filteredMatches = transformedMatches.filter(m => m.result === filters.result);
    }

    // 9. Calculate summary
    const completedMatches = transformedMatches.filter(m => m.match.status === MatchStatus.COMPLETED);
    const wins = completedMatches.filter(m => m.result === 'WIN').length;
    const draws = completedMatches.filter(m => m.result === 'DRAW').length;
    const losses = completedMatches.filter(m => m.result === 'LOSS').length;

    const totalGoals = completedMatches.reduce((sum, m) => sum + m.performance.goals, 0);
    const totalAssists = completedMatches.reduce((sum, m) => sum + m.performance.assists, 0);
    const totalMinutes = completedMatches.reduce((sum, m) => sum + m.performance.minutesPlayed, 0);

    const ratingsWithValues = completedMatches.filter(m => m.performance.rating !== null);
    const averageRating = ratingsWithValues.length > 0
      ? Math.round(ratingsWithValues.reduce((sum, m) => sum + (m.performance.rating || 0), 0) / ratingsWithValues.length * 10) / 10
      : null;

    const summary = {
      totalMatches: completedMatches.length,
      wins,
      draws,
      losses,
      winRate: completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0,
      totalGoals,
      totalAssists,
      averageRating,
      averageMinutes: completedMatches.length > 0 ? Math.round(totalMinutes / completedMatches.length) : 0,
    };

    // 10. Build response
    const response: MatchesResponse = {
      player: {
        id: player.id,
        name: `${player.user.firstName} ${player.user.lastName}`,
      },
      matches: filteredMatches,
      summary,
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player matches fetched`, {
      playerId,
      userId,
      total,
      returned: filteredMatches.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
        hasMore: offset + performances.length < total,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/players/[id]/matches error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch player matches',
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
