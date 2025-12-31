// =============================================================================
// 📊 MATCH STATS API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/matches/[matchId]/stats - Get match statistics
// POST /api/matches/[matchId]/stats - Update manual stats
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// 
// STATS SOURCES:
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ AUTO-CALCULATED: Aggregated from match events & player performances    │
// │ MANUAL ENTRY: Coach/Analyst can enter stats not captured by events     │
// │ COMBINED: Both sources merged for complete match statistics            │
// └─────────────────────────────────────────────────────────────────────────┘
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, Sport } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  requestId: string;
  timestamp: string;
}

interface RouteParams {
  params: {
    matchId: string;
  };
}

interface TeamStats {
  // Possession & Territory
  possession: number;
  territorialAdvantage: number;
  
  // Shooting/Scoring
  shots: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  shotsBlocked: number;
  
  // Passing
  passes: number;
  passesComplete: number;
  passAccuracy: number;
  keyPasses: number;
  
  // Discipline
  fouls: number;
  yellowCards: number;
  redCards: number;
  
  // Set Pieces
  corners: number;
  freeKicks: number;
  
  // Defense
  tackles: number;
  tacklesWon: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  
  // Other
  offsides: number;
  saves: number;
  
  // Sport-specific (stored as JSON)
  sportSpecificStats: Record<string, number>;
}

// =============================================================================
// MULTI-SPORT STATS CONFIGURATION
// =============================================================================

const SPORT_STATS_CONFIG: Record<Sport, {
  primaryStats: string[];
  autoCalculatedStats: string[];
  manualStats: string[];
  sportSpecificStats: string[];
}> = {
  FOOTBALL: {
    primaryStats: ['possession', 'shots', 'shotsOnTarget', 'passes', 'passAccuracy'],
    autoCalculatedStats: ['shots', 'shotsOnTarget', 'yellowCards', 'redCards', 'corners', 'fouls', 'offsides'],
    manualStats: ['possession', 'passAccuracy', 'territorialAdvantage', 'keyPasses'],
    sportSpecificStats: ['crosses', 'crossAccuracy', 'duelsWon', 'aerialDuelsWon', 'dribbles'],
  },
  RUGBY: {
    primaryStats: ['possession', 'territorialAdvantage', 'tackles', 'lineoutsWon'],
    autoCalculatedStats: ['yellowCards', 'redCards'],
    manualStats: ['possession', 'territorialAdvantage', 'tackles', 'tacklesWon'],
    sportSpecificStats: ['lineoutsWon', 'scrumsWon', 'mauls', 'rucks', 'turnoversWon', 'penaltiesConceded', 'kicksFromHand', 'metersGained'],
  },
  BASKETBALL: {
    primaryStats: ['fieldGoalPercentage', 'threePointPercentage', 'freeThrowPercentage', 'rebounds'],
    autoCalculatedStats: ['threePointers', 'twoPointers', 'freeThrows'],
    manualStats: ['rebounds', 'assists', 'steals', 'blocks', 'turnovers'],
    sportSpecificStats: ['offensiveRebounds', 'defensiveRebounds', 'fastBreakPoints', 'pointsInPaint', 'secondChancePoints', 'benchPoints'],
  },
  CRICKET: {
    primaryStats: ['runRate', 'wickets', 'extras'],
    autoCalculatedStats: ['runs', 'wickets', 'sixes', 'fours'],
    manualStats: ['runRate', 'extras', 'wides', 'noBalls'],
    sportSpecificStats: ['maidens', 'dotBalls', 'boundaries', 'partnerships', 'duckworth_lewis'],
  },
  AMERICAN_FOOTBALL: {
    primaryStats: ['totalYards', 'passingYards', 'rushingYards', 'turnovers'],
    autoCalculatedStats: ['touchdowns', 'fieldGoals', 'safeties'],
    manualStats: ['totalYards', 'passingYards', 'rushingYards', 'timeOfPossession'],
    sportSpecificStats: ['firstDowns', 'thirdDownConversions', 'fourthDownConversions', 'sacks', 'interceptions', 'fumbles', 'puntYards', 'kickReturnYards'],
  },
  NETBALL: {
    primaryStats: ['goalPercentage', 'turnovers', 'interceptions'],
    autoCalculatedStats: ['goals'],
    manualStats: ['goalPercentage', 'turnovers', 'interceptions', 'rebounds'],
    sportSpecificStats: ['centrePassReceives', 'feeds', 'goalAssists', 'deflections', 'penalties'],
  },
  HOCKEY: {
    primaryStats: ['shots', 'shotsOnGoal', 'powerPlayPercentage', 'penaltyKillPercentage'],
    autoCalculatedStats: ['goals', 'powerPlayGoals', 'shortHandedGoals'],
    manualStats: ['shots', 'hits', 'blockedShots', 'faceoffWins'],
    sportSpecificStats: ['powerPlayOpportunities', 'penaltyMinutes', 'giveaways', 'takeaways', 'icing', 'timeOnAttack'],
  },
  LACROSSE: {
    primaryStats: ['shots', 'shotsOnGoal', 'groundBalls', 'faceoffWins'],
    autoCalculatedStats: ['goals', 'assists'],
    manualStats: ['shots', 'groundBalls', 'faceoffWins', 'turnovers'],
    sportSpecificStats: ['clears', 'clearAttempts', 'manUpOpportunities', 'manUpGoals', 'saves'],
  },
  AUSTRALIAN_RULES: {
    primaryStats: ['disposals', 'clearances', 'inside50s', 'tackles'],
    autoCalculatedStats: ['goals', 'behinds'],
    manualStats: ['disposals', 'clearances', 'inside50s', 'tackles'],
    sportSpecificStats: ['marks', 'handballs', 'kicks', 'hitouts', 'rebound50s', 'contestedPossessions', 'uncontested_possessions'],
  },
  GAELIC_FOOTBALL: {
    primaryStats: ['shots', 'wides', 'frees', 'turnovers'],
    autoCalculatedStats: ['goals', 'points'],
    manualStats: ['shots', 'wides', 'frees', 'turnovers'],
    sportSpecificStats: ['kickouts', 'kickoutRetention', 'marksInside45', 'blackCards'],
  },
  FUTSAL: {
    primaryStats: ['possession', 'shots', 'shotsOnTarget', 'fouls'],
    autoCalculatedStats: ['goals', 'yellowCards', 'redCards'],
    manualStats: ['possession', 'passAccuracy', 'corners'],
    sportSpecificStats: ['accumulatedFouls', 'powerPlayGoals', 'goalClearances', 'doublePenalties'],
  },
  BEACH_FOOTBALL: {
    primaryStats: ['possession', 'shots', 'shotsOnTarget'],
    autoCalculatedStats: ['goals', 'yellowCards', 'redCards'],
    manualStats: ['possession', 'corners'],
    sportSpecificStats: ['bicycleKicks', 'scissorKicks', 'headers', 'sandSaves'],
  },
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateStatsSchema = z.object({
  teamSide: z.enum(['home', 'away']),
  
  // Common stats
  possession: z.number().min(0).max(100).optional(),
  territorialAdvantage: z.number().min(0).max(100).optional(),
  shots: z.number().min(0).optional(),
  shotsOnTarget: z.number().min(0).optional(),
  shotsOffTarget: z.number().min(0).optional(),
  shotsBlocked: z.number().min(0).optional(),
  passes: z.number().min(0).optional(),
  passesComplete: z.number().min(0).optional(),
  passAccuracy: z.number().min(0).max(100).optional(),
  keyPasses: z.number().min(0).optional(),
  corners: z.number().min(0).optional(),
  freeKicks: z.number().min(0).optional(),
  tackles: z.number().min(0).optional(),
  tacklesWon: z.number().min(0).optional(),
  interceptions: z.number().min(0).optional(),
  clearances: z.number().min(0).optional(),
  blocks: z.number().min(0).optional(),
  saves: z.number().min(0).optional(),
  
  // Sport-specific as flexible object
  sportSpecificStats: z.record(z.number()).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `stats_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: string;
    code?: string;
    message?: string;
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    requestId: options.requestId,
    timestamp: new Date().toISOString(),
  };

  if (options.success && data !== null) response.data = data;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;
  if (options.message) response.message = options.message;

  return NextResponse.json(response, { status: options.status || 200 });
}

const STATS_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
];

// =============================================================================
// CALCULATE AUTO STATS FROM EVENTS & PERFORMANCES
// =============================================================================

async function calculateAutoStats(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string
): Promise<{ home: Partial<TeamStats>; away: Partial<TeamStats> }> {
  // Fetch events
  const events = await prisma.matchEvent.findMany({
    where: { matchId },
    select: { eventType: true, teamSide: true },
  });

  // Fetch player performances
  const performances = await prisma.playerMatchPerformance.findMany({
    where: { matchId },
    select: {
      teamId: true,
      passes: true,
      passesComplete: true,
      shots: true,
      shotsOnTarget: true,
      tackles: true,
      interceptions: true,
      saves: true,
      yellowCards: true,
      redCard: true,
      fouls: true,
    },
  });

  // Initialize stats
  const home: Partial<TeamStats> = {
    shots: 0,
    shotsOnTarget: 0,
    passes: 0,
    passesComplete: 0,
    passAccuracy: 0,
    tackles: 0,
    interceptions: 0,
    saves: 0,
    yellowCards: 0,
    redCards: 0,
    corners: 0,
    fouls: 0,
    offsides: 0,
  };

  const away: Partial<TeamStats> = { ...home };

  // Count from events
  events.forEach((event) => {
    const target = event.teamSide === 'home' ? home : away;

    switch (event.eventType) {
      case 'YELLOW_CARD':
      case 'SECOND_YELLOW':
        target.yellowCards = (target.yellowCards || 0) + 1;
        break;
      case 'RED_CARD':
        target.redCards = (target.redCards || 0) + 1;
        break;
      case 'CORNER':
        target.corners = (target.corners || 0) + 1;
        break;
      case 'FOUL':
        target.fouls = (target.fouls || 0) + 1;
        break;
      case 'OFFSIDE':
        target.offsides = (target.offsides || 0) + 1;
        break;
      // Shots counted from performances
    }
  });

  // Aggregate from performances
  performances.forEach((perf) => {
    const isHome = perf.teamId === homeTeamId;
    const target = isHome ? home : away;

    target.shots = (target.shots || 0) + (perf.shots || 0);
    target.shotsOnTarget = (target.shotsOnTarget || 0) + (perf.shotsOnTarget || 0);
    target.passes = (target.passes || 0) + (perf.passes || 0);
    target.passesComplete = (target.passesComplete || 0) + (perf.passesComplete || 0);
    target.tackles = (target.tackles || 0) + (perf.tackles || 0);
    target.interceptions = (target.interceptions || 0) + (perf.interceptions || 0);
    target.saves = (target.saves || 0) + (perf.saves || 0);
    target.fouls = (target.fouls || 0) + (perf.fouls || 0);
    target.yellowCards = (target.yellowCards || 0) + (perf.yellowCards || 0);
    if (perf.redCard) target.redCards = (target.redCards || 0) + 1;
  });

  // Calculate pass accuracy
  if ((home.passes || 0) > 0) {
    home.passAccuracy = Math.round(((home.passesComplete || 0) / home.passes!) * 100);
  }
  if ((away.passes || 0) > 0) {
    away.passAccuracy = Math.round(((away.passesComplete || 0) / away.passes!) * 100);
  }

  return { home, away };
}

// =============================================================================
// GET HANDLER - Get Match Stats
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { matchId } = params;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Fetch match
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        homeClub: { select: { sport: true } },
        homeScore: true,
        awayScore: true,
        status: true,
      },
    });

    if (!match) {
      return createResponse(null, {
        success: false,
        error: 'Match not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    const sport = match.homeClub.sport;
    const sportConfig = SPORT_STATS_CONFIG[sport];

    // 3. Get manual stats from MatchStats table (if exists)
    const manualStats = await prisma.matchStats.findUnique({
      where: { matchId },
    });

    // 4. Calculate auto stats from events & performances
    const autoStats = await calculateAutoStats(
      matchId,
      match.homeTeamId,
      match.awayTeamId
    );

    // 5. Merge manual and auto stats (manual overrides where present)
    const homeStats: TeamStats = {
      possession: manualStats?.homePossession || 50,
      territorialAdvantage: manualStats?.homeTerritorialAdvantage || 50,
      shots: autoStats.home.shots || 0,
      shotsOnTarget: autoStats.home.shotsOnTarget || 0,
      shotsOffTarget: (autoStats.home.shots || 0) - (autoStats.home.shotsOnTarget || 0),
      shotsBlocked: manualStats?.homeShotsBlocked || 0,
      passes: autoStats.home.passes || 0,
      passesComplete: autoStats.home.passesComplete || 0,
      passAccuracy: manualStats?.homePassAccuracy || autoStats.home.passAccuracy || 0,
      keyPasses: manualStats?.homeKeyPasses || 0,
      fouls: autoStats.home.fouls || 0,
      yellowCards: autoStats.home.yellowCards || 0,
      redCards: autoStats.home.redCards || 0,
      corners: autoStats.home.corners || 0,
      freeKicks: manualStats?.homeFreeKicks || 0,
      tackles: autoStats.home.tackles || 0,
      tacklesWon: manualStats?.homeTacklesWon || 0,
      interceptions: autoStats.home.interceptions || 0,
      clearances: manualStats?.homeClearances || 0,
      blocks: manualStats?.homeBlocks || 0,
      offsides: autoStats.home.offsides || 0,
      saves: autoStats.home.saves || 0,
      sportSpecificStats: (manualStats?.homeSportSpecificStats as Record<string, number>) || {},
    };

    const awayStats: TeamStats = {
      possession: manualStats?.awayPossession || 50,
      territorialAdvantage: manualStats?.awayTerritorialAdvantage || 50,
      shots: autoStats.away.shots || 0,
      shotsOnTarget: autoStats.away.shotsOnTarget || 0,
      shotsOffTarget: (autoStats.away.shots || 0) - (autoStats.away.shotsOnTarget || 0),
      shotsBlocked: manualStats?.awayShotsBlocked || 0,
      passes: autoStats.away.passes || 0,
      passesComplete: autoStats.away.passesComplete || 0,
      passAccuracy: manualStats?.awayPassAccuracy || autoStats.away.passAccuracy || 0,
      keyPasses: manualStats?.awayKeyPasses || 0,
      fouls: autoStats.away.fouls || 0,
      yellowCards: autoStats.away.yellowCards || 0,
      redCards: autoStats.away.redCards || 0,
      corners: autoStats.away.corners || 0,
      freeKicks: manualStats?.awayFreeKicks || 0,
      tackles: autoStats.away.tackles || 0,
      tacklesWon: manualStats?.awayTacklesWon || 0,
      interceptions: autoStats.away.interceptions || 0,
      clearances: manualStats?.awayClearances || 0,
      blocks: manualStats?.awayBlocks || 0,
      offsides: autoStats.away.offsides || 0,
      saves: autoStats.away.saves || 0,
      sportSpecificStats: (manualStats?.awaySportSpecificStats as Record<string, number>) || {},
    };

    return createResponse({
      matchId,
      status: match.status,
      score: {
        home: match.homeScore,
        away: match.awayScore,
      },
      teams: {
        home: match.homeTeam.name,
        away: match.awayTeam.name,
      },
      stats: {
        home: homeStats,
        away: awayStats,
      },
      sport,
      sportConfig: {
        primaryStats: sportConfig.primaryStats,
        sportSpecificStats: sportConfig.sportSpecificStats,
      },
      lastUpdated: manualStats?.updatedAt?.toISOString() || null,
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Stats error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch stats',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Update Manual Stats
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { matchId } = params;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Fetch match
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        homeClubId: true,
        awayClubId: true,
      },
    });

    if (!match) {
      return createResponse(null, {
        success: false,
        error: 'Match not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 3. Authorization
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: { in: [match.homeClubId, match.awayClubId] },
        isActive: true,
        role: { in: STATS_ROLES },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!membership && !user?.isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to update stats',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 4. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
        requestId,
        status: 400,
      });
    }

    const validation = UpdateStatsSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const data = validation.data;
    const isHome = data.teamSide === 'home';
    const prefix = isHome ? 'home' : 'away';

    // 5. Build update data
    const updateData: Record<string, unknown> = {};

    if (data.possession !== undefined) updateData[`${prefix}Possession`] = data.possession;
    if (data.territorialAdvantage !== undefined) updateData[`${prefix}TerritorialAdvantage`] = data.territorialAdvantage;
    if (data.shotsBlocked !== undefined) updateData[`${prefix}ShotsBlocked`] = data.shotsBlocked;
    if (data.passAccuracy !== undefined) updateData[`${prefix}PassAccuracy`] = data.passAccuracy;
    if (data.keyPasses !== undefined) updateData[`${prefix}KeyPasses`] = data.keyPasses;
    if (data.freeKicks !== undefined) updateData[`${prefix}FreeKicks`] = data.freeKicks;
    if (data.tacklesWon !== undefined) updateData[`${prefix}TacklesWon`] = data.tacklesWon;
    if (data.clearances !== undefined) updateData[`${prefix}Clearances`] = data.clearances;
    if (data.blocks !== undefined) updateData[`${prefix}Blocks`] = data.blocks;
    if (data.sportSpecificStats !== undefined) {
      updateData[`${prefix}SportSpecificStats`] = data.sportSpecificStats;
    }

    // 6. Upsert match stats
    const stats = await prisma.matchStats.upsert({
      where: { matchId },
      update: {
        ...updateData,
        updatedBy: session.user.id,
      },
      create: {
        matchId,
        ...updateData,
        updatedBy: session.user.id,
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MATCH_STATS_UPDATED',
        resourceType: 'MATCH',
        resourceId: matchId,
        afterState: {
          teamSide: data.teamSide,
          updatedFields: Object.keys(updateData),
        },
      },
    });

    return createResponse({
      matchId,
      teamSide: data.teamSide,
      updated: Object.keys(updateData),
      updatedAt: stats.updatedAt.toISOString(),
    }, {
      success: true,
      message: 'Stats updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Update Stats error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update stats',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}