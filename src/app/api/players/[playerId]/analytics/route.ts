// =============================================================================
// 📊 PLAYER ANALYTICS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/players/[playerId]/analytics - Comprehensive AI-powered analytics
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Models: PlayerAnalytic, PlayerInsight, PlayerMatchPerformance
// Access: COACH, ANALYST, SCOUT, MANAGER, ADMIN (+ self limited view)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport, Position } from '@prisma/client';

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

interface PlayerProfile {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  preferredFoot: string | null;
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
  jerseyNumber: number | null;
  marketValue: number | null;
  isVerified: boolean;
}

interface SeasonStats {
  season: string;
  matches: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  avgRating: number | null;
  goalsPerMatch: number;
  assistsPerMatch: number;
  minutesPerGoal: number | null;
}

interface CareerStats {
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  totalMinutes: number;
  totalYellowCards: number;
  totalRedCards: number;
  totalCleanSheets: number;
  avgGoalsPerMatch: number;
  avgAssistsPerMatch: number;
  avgRating: number;
}

interface FormAnalysis {
  last5Matches: Array<{
    matchId: string;
    opponent: string;
    date: string;
    result: 'WIN' | 'DRAW' | 'LOSS';
    minutesPlayed: number;
    goals: number;
    assists: number;
    rating: number | null;
  }>;
  formRating: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  consistency: number;
  winRate: number;
}

interface AttributeRatings {
  // Technical (sport-specific available)
  pace: number | null;
  shooting: number | null;
  passing: number | null;
  dribbling: number | null;
  defending: number | null;
  physical: number | null;
  
  // Mental
  leadership: number | null;
  teamwork: number | null;
  composure: number | null;
  creativity: number | null;
  vision: number | null;
  workRate: number | null;
  
  // Overall
  overallRating: number;
  potentialRating: number | null;
}

interface AIPredictions {
  expectedGoals: number | null;
  expectedAssists: number | null;
  injuryRisk: number;
  fatigueLevel: number;
  developmentPotential: number;
  recommendedActions: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}

interface Rankings {
  positionRank: number | null;
  clubRank: number | null;
  leagueRank: number | null;
  ageGroupRank: number | null;
  totalInPosition: number | null;
  totalInClub: number | null;
}

interface PlayerAnalyticsResponse {
  profile: PlayerProfile;
  currentSeason: SeasonStats;
  career: CareerStats;
  form: FormAnalysis;
  attributes: AttributeRatings;
  predictions: AIPredictions;
  seasonHistory: SeasonStats[];
  rankings: Rankings;
  sport: Sport;
  generatedAt: string;
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

// Roles with full analytics access
const ANALYTICS_ROLES = [
  'SUPERADMIN',
  'ADMIN',
  'ANALYST',
  'SCOUT',
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'MANAGER',
  'OWNER',
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetAnalyticsSchema = z.object({
  season: z.coerce.number().int().min(2000).max(2100).optional(),
  includeHistory: z.coerce.boolean().default(false),
  includeRankings: z.coerce.boolean().default(true),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
      'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
    },
  });
}

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

function calculateTrend(ratings: (number | null)[]): 'UP' | 'DOWN' | 'STABLE' {
  const validRatings = ratings.filter((r): r is number => r !== null);
  if (validRatings.length < 2) return 'STABLE';

  const midpoint = Math.ceil(validRatings.length / 2);
  const recentAvg = validRatings.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
  const olderAvg = validRatings.slice(midpoint).reduce((a, b) => a + b, 0) / (validRatings.length - midpoint);

  const diff = recentAvg - olderAvg;
  if (diff > 0.3) return 'UP';
  if (diff < -0.3) return 'DOWN';
  return 'STABLE';
}

function calculateConsistency(ratings: (number | null)[]): number {
  const validRatings = ratings.filter((r): r is number => r !== null);
  if (validRatings.length < 2) return 100;

  const mean = validRatings.reduce((a, b) => a + b, 0) / validRatings.length;
  const variance = validRatings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / validRatings.length;
  const stdDev = Math.sqrt(variance);

  // Map stdDev to consistency (lower stdDev = higher consistency)
  const consistency = Math.max(0, Math.min(100, 100 - stdDev * 50));
  return Math.round(consistency);
}

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Season runs July to June
  return month >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

/**
 * Check user access to player analytics
 */
async function checkAnalyticsAccess(
  userId: string,
  playerId: string
): Promise<{ allowed: boolean; fullAccess: boolean; isSelf: boolean; reason?: string }> {
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
    return { allowed: false, fullAccess: false, isSelf: false, reason: 'User not found' };
  }

  const isSelf = user.player?.id === playerId;

  // Super admin has full access
  if (user.isSuperAdmin) {
    return { allowed: true, fullAccess: true, isSelf };
  }

  // Check global analytics roles
  const hasAnalyticsRole = user.roles.some(r => ANALYTICS_ROLES.includes(r));

  // Get player's clubs
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

  // Check if in same club with analytics role
  const relevantMembership = user.clubMembers.find(m => playerClubIds.includes(m.clubId));
  const hasClubAnalyticsRole = relevantMembership && ANALYTICS_ROLES.includes(relevantMembership.role);

  if (hasAnalyticsRole || hasClubAnalyticsRole) {
    return { allowed: true, fullAccess: true, isSelf };
  }

  // Self can view limited analytics
  if (isSelf) {
    return { allowed: true, fullAccess: false, isSelf };
  }

  // Same club member can view basic analytics
  if (relevantMembership) {
    return { allowed: true, fullAccess: false, isSelf };
  }

  return { allowed: false, fullAccess: false, isSelf, reason: 'Access denied' };
}

// =============================================================================
// ROUTE CONTEXT
// =============================================================================

interface RouteContext {
  params: Promise<{ playerId: string }>;
}

// =============================================================================
// GET HANDLER - Get Player Analytics
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
    const access = await checkAnalyticsAccess(userId, playerId);
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

    const validation = GetAnalyticsSchema.safeParse(rawParams);
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
    const currentSeason = getCurrentSeason();
    const targetSeason = filters.season?.toString() || currentSeason;

    // 4. Fetch player with all analytics data
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            dateOfBirth: true,
            nationality: true,
          },
        },
        analytics: true,
        insights: true,
        aggregateStats: true,
        statistics: {
          orderBy: { season: 'desc' },
          take: filters.includeHistory ? 10 : 1,
        },
        teamPlayers: {
          where: { isActive: true },
          take: 1,
          include: {
            team: {
              include: {
                club: { select: { sport: true } },
              },
            },
          },
        },
        matchPerformances: {
          where: {
            match: { status: 'COMPLETED' },
          },
          include: {
            match: {
              include: {
                homeTeam: { select: { id: true, name: true } },
                awayTeam: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { match: { date: 'desc' } },
          take: 10,
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

    // Determine sport
    const sport = player.teamPlayers[0]?.team.club.sport || Sport.FOOTBALL;

    // 5. Build profile
    const profile: PlayerProfile = {
      id: player.id,
      userId: player.userId,
      name: `${player.user.firstName} ${player.user.lastName}`,
      avatar: player.user.avatar,
      nationality: player.user.nationality,
      dateOfBirth: player.user.dateOfBirth?.toISOString() || null,
      age: calculateAge(player.user.dateOfBirth),
      height: player.height,
      weight: player.weight,
      preferredFoot: player.preferredFoot,
      primaryPosition: player.primaryPosition,
      secondaryPosition: player.secondaryPosition,
      jerseyNumber: player.jerseyNumber,
      marketValue: player.marketValue,
      isVerified: player.isVerified,
    };

    // 6. Build current season stats
    const currentSeasonStat = player.statistics.find(s => s.season === targetSeason);
    const currentSeasonStats: SeasonStats = {
      season: targetSeason,
      matches: currentSeasonStat?.matches || 0,
      starts: currentSeasonStat?.starts || 0,
      minutes: currentSeasonStat?.minutes || 0,
      goals: currentSeasonStat?.goals || 0,
      assists: currentSeasonStat?.assists || 0,
      yellowCards: currentSeasonStat?.yellowCards || 0,
      redCards: currentSeasonStat?.redCards || 0,
      cleanSheets: currentSeasonStat?.cleanSheets || 0,
      avgRating: currentSeasonStat?.avgRating || null,
      goalsPerMatch: currentSeasonStat?.matches 
        ? Math.round((currentSeasonStat.goals / currentSeasonStat.matches) * 100) / 100 
        : 0,
      assistsPerMatch: currentSeasonStat?.matches 
        ? Math.round((currentSeasonStat.assists / currentSeasonStat.matches) * 100) / 100 
        : 0,
      minutesPerGoal: currentSeasonStat?.goals 
        ? Math.round(currentSeasonStat.minutes / currentSeasonStat.goals) 
        : null,
    };

    // 7. Build career stats
    const careerStats: CareerStats = {
      totalMatches: player.aggregateStats?.totalMatches || 0,
      totalGoals: player.aggregateStats?.totalGoals || 0,
      totalAssists: player.aggregateStats?.totalAssists || 0,
      totalMinutes: player.aggregateStats?.totalMinutes || 0,
      totalYellowCards: player.aggregateStats?.yellowCards || 0,
      totalRedCards: player.aggregateStats?.redCards || 0,
      totalCleanSheets: player.aggregateStats?.cleanSheets || 0,
      avgGoalsPerMatch: player.aggregateStats?.totalMatches 
        ? Math.round((player.aggregateStats.totalGoals / player.aggregateStats.totalMatches) * 100) / 100 
        : 0,
      avgAssistsPerMatch: player.aggregateStats?.totalMatches 
        ? Math.round((player.aggregateStats.totalAssists / player.aggregateStats.totalMatches) * 100) / 100 
        : 0,
      avgRating: player.aggregateStats?.avgRating || 0,
    };

    // 8. Build form analysis from recent performances
    const recentPerformances = player.matchPerformances.slice(0, 5);
    const ratings = recentPerformances.map(p => p.rating);
    const wins = recentPerformances.filter(p => {
      const isHome = p.match.homeTeam.id === player.teamPlayers[0]?.teamId;
      const homeScore = p.match.homeScore || 0;
      const awayScore = p.match.awayScore || 0;
      return isHome ? homeScore > awayScore : awayScore > homeScore;
    }).length;

    const form: FormAnalysis = {
      last5Matches: recentPerformances.map(p => {
        const isHome = p.match.homeTeam.id === player.teamPlayers[0]?.teamId;
        const homeScore = p.match.homeScore || 0;
        const awayScore = p.match.awayScore || 0;
        
        let result: 'WIN' | 'DRAW' | 'LOSS';
        if (homeScore === awayScore) result = 'DRAW';
        else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) result = 'WIN';
        else result = 'LOSS';

        return {
          matchId: p.matchId,
          opponent: isHome ? p.match.awayTeam.name : p.match.homeTeam.name,
          date: p.match.date.toISOString(),
          result,
          minutesPlayed: p.minutesPlayed || 0,
          goals: p.goals || 0,
          assists: p.assists || 0,
          rating: p.rating,
        };
      }),
      formRating: player.analytics?.formRating || 
        (ratings.filter(r => r !== null).length > 0 
          ? Math.round(ratings.filter((r): r is number => r !== null).reduce((a, b) => a + b, 0) / ratings.filter(r => r !== null).length * 10) / 10 
          : 0),
      trend: calculateTrend(ratings),
      consistency: calculateConsistency(ratings),
      winRate: recentPerformances.length > 0 
        ? Math.round((wins / recentPerformances.length) * 100) 
        : 0,
    };

    // 9. Build attribute ratings
    const attributes: AttributeRatings = {
      pace: player.insights?.pace || null,
      shooting: player.insights?.shooting || null,
      passing: player.insights?.passing || null,
      dribbling: player.insights?.dribbling || null,
      defending: player.insights?.defending || null,
      physical: player.insights?.physical || null,
      leadership: player.insights?.leadership || null,
      teamwork: player.insights?.teamwork || null,
      composure: player.insights?.composure || null,
      creativity: player.insights?.creativity || null,
      vision: player.insights?.vision || null,
      workRate: player.insights?.workRate || null,
      overallRating: player.analytics?.overallRating || player.overallRating || 0,
      potentialRating: player.analytics?.potentialRating || player.potentialRating || null,
    };

    // 10. Build AI predictions (full access only)
    const predictions: AIPredictions = access.fullAccess ? {
      expectedGoals: player.analytics?.expectedGoals || null,
      expectedAssists: player.analytics?.expectedAssists || null,
      injuryRisk: player.analytics?.injuryRisk || 0,
      fatigueLevel: player.analytics?.fatigueLevel || 0,
      developmentPotential: player.analytics?.developmentPotential || 0,
      recommendedActions: [
        ...(player.analytics?.recommendedActions || []),
        ...(player.insights?.developmentAreas || []),
      ].slice(0, 5),
      strengthAreas: player.insights?.strengthAreas || [],
      improvementAreas: player.insights?.improvementAreas || [],
    } : {
      expectedGoals: null,
      expectedAssists: null,
      injuryRisk: 0,
      fatigueLevel: 0,
      developmentPotential: 0,
      recommendedActions: [],
      strengthAreas: [],
      improvementAreas: [],
    };

    // 11. Build season history
    const seasonHistory: SeasonStats[] = filters.includeHistory 
      ? player.statistics.map(s => ({
          season: s.season,
          matches: s.matches,
          starts: s.starts,
          minutes: s.minutes,
          goals: s.goals,
          assists: s.assists,
          yellowCards: s.yellowCards,
          redCards: s.redCards,
          cleanSheets: s.cleanSheets,
          avgRating: s.avgRating,
          goalsPerMatch: s.matches ? Math.round((s.goals / s.matches) * 100) / 100 : 0,
          assistsPerMatch: s.matches ? Math.round((s.assists / s.matches) * 100) / 100 : 0,
          minutesPerGoal: s.goals ? Math.round(s.minutes / s.goals) : null,
        }))
      : [];

    // 12. Build rankings (if requested and full access)
    const rankings: Rankings = filters.includeRankings && access.fullAccess ? {
      positionRank: player.analytics?.positionRank || null,
      clubRank: player.aggregateStats?.clubRank || null,
      leagueRank: player.analytics?.leagueRank || null,
      ageGroupRank: player.analytics?.ageGroupRank || null,
      totalInPosition: null,
      totalInClub: null,
    } : {
      positionRank: null,
      clubRank: null,
      leagueRank: null,
      ageGroupRank: null,
      totalInPosition: null,
      totalInClub: null,
    };

    // 13. Build response
    const response: PlayerAnalyticsResponse = {
      profile,
      currentSeason: currentSeasonStats,
      career: careerStats,
      form,
      attributes,
      predictions,
      seasonHistory,
      rankings,
      sport,
      generatedAt: new Date().toISOString(),
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player analytics fetched`, {
      playerId,
      userId,
      sport,
      fullAccess: access.fullAccess,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/players/[id]/analytics error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch player analytics',
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
