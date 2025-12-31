// =============================================================================
// 🏃 MATCH PERFORMANCES API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/matches/[matchId]/performances - Get player performances
// POST /api/matches/[matchId]/performances - Create/Update single performance
// PUT  /api/matches/[matchId]/performances - Bulk update performances
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports with sport-specific metrics
// Permission: Club members (view), Coach/Analyst (edit)
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

interface PlayerPerformance {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
    avatar: string | null;
    shirtNumber: number | null;
    position: string | null;
  };
  teamId: string;
  teamName: string;
  teamSide: 'home' | 'away';
  
  // Playing time
  minutesPlayed: number;
  startedMatch: boolean;
  substituteOn: number | null;
  substituteOff: number | null;
  
  // Key stats
  goals: number;
  assists: number;
  
  // Discipline
  yellowCards: number;
  redCard: boolean;
  secondYellow: boolean;
  
  // Passing
  passes: number;
  passesComplete: number;
  passAccuracy: number;
  
  // Shooting
  shots: number;
  shotsOnTarget: number;
  
  // Defense
  tackles: number;
  interceptions: number;
  saves: number;
  
  // Ratings
  rating: number | null;
  coachRating: number | null;
  coachNotes: string | null;
  
  // Sport-specific
  sportSpecificStats: Record<string, unknown>;
}

// =============================================================================
// MULTI-SPORT PERFORMANCE METRICS
// =============================================================================

const SPORT_PERFORMANCE_METRICS: Record<Sport, {
  coreMetrics: string[];
  sportSpecificMetrics: string[];
  ratingScale: { min: number; max: number };
}> = {
  FOOTBALL: {
    coreMetrics: ['goals', 'assists', 'shots', 'shotsOnTarget', 'passes', 'passesComplete', 'tackles', 'interceptions'],
    sportSpecificMetrics: ['dribbles', 'dribblesSuccessful', 'aerialDuelsWon', 'foulsDrawn', 'foulsConceded', 'offsides', 'crosses', 'keyPasses', 'longBalls', 'throughBalls'],
    ratingScale: { min: 1, max: 10 },
  },
  RUGBY: {
    coreMetrics: ['tries', 'conversions', 'penalties', 'tackles', 'tacklesMissed', 'carries', 'metersGained'],
    sportSpecificMetrics: ['lineoutThrows', 'lineoutSteals', 'turnoversWon', 'turnoversConceded', 'kicksFromHand', 'restarts', 'penaltiesConceded', 'scrumPenalties'],
    ratingScale: { min: 1, max: 10 },
  },
  BASKETBALL: {
    coreMetrics: ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers'],
    sportSpecificMetrics: ['fieldGoalsMade', 'fieldGoalsAttempted', 'threePointersMade', 'threePointersAttempted', 'freeThrowsMade', 'freeThrowsAttempted', 'offensiveRebounds', 'defensiveRebounds', 'personalFouls', 'plusMinus'],
    ratingScale: { min: 1, max: 10 },
  },
  CRICKET: {
    coreMetrics: ['runsScored', 'ballsFaced', 'wicketsTaken', 'oversBowled', 'runsConceded', 'catches'],
    sportSpecificMetrics: ['fours', 'sixes', 'strikeRate', 'maidens', 'economyRate', 'dotBalls', 'runOuts', 'stumpings', 'drops'],
    ratingScale: { min: 1, max: 10 },
  },
  AMERICAN_FOOTBALL: {
    coreMetrics: ['passingYards', 'rushingYards', 'receivingYards', 'touchdowns', 'interceptions', 'sacks'],
    sportSpecificMetrics: ['completions', 'attempts', 'carries', 'receptions', 'targets', 'tackles', 'tacklesForLoss', 'passesDefended', 'forcedFumbles', 'fumbleRecoveries', 'quarterbackHits'],
    ratingScale: { min: 1, max: 10 },
  },
  NETBALL: {
    coreMetrics: ['goals', 'goalAttempts', 'assists', 'interceptions', 'deflections', 'rebounds'],
    sportSpecificMetrics: ['centrePassReceives', 'feeds', 'feedsWithAttempt', 'goalAssists', 'pickups', 'penalties', 'obstructions', 'contacts'],
    ratingScale: { min: 1, max: 10 },
  },
  HOCKEY: {
    coreMetrics: ['goals', 'assists', 'points', 'shots', 'hits', 'blockedShots'],
    sportSpecificMetrics: ['plusMinus', 'penaltyMinutes', 'powerPlayGoals', 'powerPlayAssists', 'shortHandedGoals', 'gameWinningGoals', 'faceoffsWon', 'faceoffPercentage', 'timeOnIce', 'giveaways', 'takeaways'],
    ratingScale: { min: 1, max: 10 },
  },
  LACROSSE: {
    coreMetrics: ['goals', 'assists', 'points', 'groundBalls', 'causedTurnovers', 'faceoffsWon'],
    sportSpecificMetrics: ['shots', 'shotsOnGoal', 'turnovers', 'clears', 'failedClears', 'saves', 'goalsAgainst', 'savePercentage'],
    ratingScale: { min: 1, max: 10 },
  },
  AUSTRALIAN_RULES: {
    coreMetrics: ['goals', 'behinds', 'disposals', 'kicks', 'handballs', 'marks', 'tackles'],
    sportSpecificMetrics: ['hitouts', 'clearances', 'inside50s', 'rebound50s', 'contestedPossessions', 'uncontestedPossessions', 'clangers', 'freesFor', 'freesAgainst', 'onePercenters'],
    ratingScale: { min: 1, max: 10 },
  },
  GAELIC_FOOTBALL: {
    coreMetrics: ['goals', 'points', 'totalScore', 'frees', 'marks'],
    sportSpecificMetrics: ['kickPasses', 'handPasses', 'soloRuns', 'turnoversWon', 'turnoversConceded', 'blocks', 'hooks', 'blackCards', 'wides'],
    ratingScale: { min: 1, max: 10 },
  },
  FUTSAL: {
    coreMetrics: ['goals', 'assists', 'shots', 'shotsOnTarget', 'passes', 'tackles'],
    sportSpecificMetrics: ['keyPasses', 'clearances', 'interceptions', 'fouls', 'saves', 'dribbles'],
    ratingScale: { min: 1, max: 10 },
  },
  BEACH_FOOTBALL: {
    coreMetrics: ['goals', 'assists', 'shots', 'shotsOnTarget'],
    sportSpecificMetrics: ['bicycleKicks', 'headers', 'volleys', 'saves', 'clearances'],
    ratingScale: { min: 1, max: 10 },
  },
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const PerformanceSchema = z.object({
  playerId: z.string().min(1),
  teamId: z.string().min(1),
  
  // Playing time
  minutesPlayed: z.number().min(0).max(200).default(0),
  startedMatch: z.boolean().default(false),
  substituteOn: z.number().nullable().optional(),
  substituteOff: z.number().nullable().optional(),
  
  // Key stats
  goals: z.number().min(0).default(0),
  assists: z.number().min(0).default(0),
  
  // Discipline
  yellowCards: z.number().min(0).max(2).default(0),
  redCard: z.boolean().default(false),
  secondYellow: z.boolean().default(false),
  
  // Passing
  passes: z.number().min(0).default(0),
  passesComplete: z.number().min(0).default(0),
  
  // Shooting
  shots: z.number().min(0).default(0),
  shotsOnTarget: z.number().min(0).default(0),
  
  // Defense
  tackles: z.number().min(0).default(0),
  interceptions: z.number().min(0).default(0),
  saves: z.number().min(0).default(0),
  fouls: z.number().min(0).default(0),
  
  // Ratings
  rating: z.number().min(0).max(10).nullable().optional(),
  coachRating: z.number().min(0).max(10).nullable().optional(),
  coachNotes: z.string().max(1000).nullable().optional(),
  
  // Sport-specific
  sportSpecificStats: z.record(z.unknown()).nullable().optional(),
});

const BulkPerformanceSchema = z.object({
  performances: z.array(PerformanceSchema),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `perf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const PERFORMANCE_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
];

// =============================================================================
// GET HANDLER - Get Player Performances
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

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const teamSide = searchParams.get('teamSide') as 'home' | 'away' | null;

    // 3. Fetch match
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        homeClub: { select: { sport: true } },
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
    const sportConfig = SPORT_PERFORMANCE_METRICS[sport];

    // 4. Build where clause
    const where: Record<string, unknown> = { matchId };

    if (teamId) {
      where.teamId = teamId;
    } else if (teamSide) {
      where.teamId = teamSide === 'home' ? match.homeTeamId : match.awayTeamId;
    }

    // 5. Fetch performances
    const performances = await prisma.playerMatchPerformance.findMany({
      where,
      include: {
        player: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
        team: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { startedMatch: 'desc' },
        { minutesPlayed: 'desc' },
        { rating: 'desc' },
      ],
    });

    // 6. Transform response
    const perfList: PlayerPerformance[] = performances.map((p) => ({
      id: p.id,
      playerId: p.playerId,
      player: {
        id: p.player.id,
        name: `${p.player.user.firstName} ${p.player.user.lastName}`,
        avatar: p.player.user.avatar,
        shirtNumber: p.player.shirtNumber,
        position: p.player.primaryPosition,
      },
      teamId: p.teamId,
      teamName: p.team.name,
      teamSide: p.teamId === match.homeTeamId ? 'home' : 'away',
      
      minutesPlayed: p.minutesPlayed,
      startedMatch: p.startedMatch,
      substituteOn: p.substituteOn,
      substituteOff: p.substituteOff,
      
      goals: p.goals,
      assists: p.assists,
      
      yellowCards: p.yellowCards,
      redCard: p.redCard,
      secondYellow: p.secondYellow,
      
      passes: p.passes || 0,
      passesComplete: p.passesComplete || 0,
      passAccuracy: p.passes ? Math.round((p.passesComplete || 0) / p.passes * 100) : 0,
      
      shots: p.shots || 0,
      shotsOnTarget: p.shotsOnTarget || 0,
      
      tackles: p.tackles || 0,
      interceptions: p.interceptions || 0,
      saves: p.saves || 0,
      
      rating: p.rating,
      coachRating: p.coachRating,
      coachNotes: p.coachNotes,
      
      sportSpecificStats: (p.sportSpecificStats as Record<string, unknown>) || {},
    }));

    return createResponse({
      performances: perfList,
      sport,
      sportConfig: {
        coreMetrics: sportConfig.coreMetrics,
        sportSpecificMetrics: sportConfig.sportSpecificMetrics,
        ratingScale: sportConfig.ratingScale,
      },
      count: perfList.length,
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Performances error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch performances',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create/Update Single Performance
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
        role: { in: PERFORMANCE_ROLES },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!membership && !user?.isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to record performances',
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

    const validation = PerformanceSchema.safeParse(body);
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

    // 5. Upsert performance
    const performance = await prisma.playerMatchPerformance.upsert({
      where: {
        matchId_playerId: {
          matchId,
          playerId: data.playerId,
        },
      },
      update: data,
      create: {
        matchId,
        ...data,
      },
      include: {
        player: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // 6. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PERFORMANCE_UPDATED',
        resourceType: 'PLAYER_MATCH_PERFORMANCE',
        resourceId: performance.id,
        afterState: {
          playerId: data.playerId,
          goals: data.goals,
          assists: data.assists,
          rating: data.rating,
        },
      },
    });

    return createResponse({
      id: performance.id,
      playerId: performance.playerId,
      playerName: `${performance.player.user.firstName} ${performance.player.user.lastName}`,
      goals: performance.goals,
      assists: performance.assists,
      rating: performance.rating,
    }, {
      success: true,
      message: 'Performance recorded successfully',
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Create Performance error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to record performance',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PUT HANDLER - Bulk Update Performances
// =============================================================================

export async function PUT(
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

    // 3. Authorization (only managers/coaches for bulk)
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: { in: [match.homeClubId, match.awayClubId] },
        isActive: true,
        role: { in: [ClubMemberRole.OWNER, ClubMemberRole.MANAGER, ClubMemberRole.HEAD_COACH] },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!membership && !user?.isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to bulk update performances',
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

    const validation = BulkPerformanceSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { performances } = validation.data;

    // 5. Bulk upsert
    const results = await Promise.all(
      performances.map((data) =>
        prisma.playerMatchPerformance.upsert({
          where: {
            matchId_playerId: {
              matchId,
              playerId: data.playerId,
            },
          },
          update: data,
          create: {
            matchId,
            ...data,
          },
        })
      )
    );

    // 6. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PERFORMANCES_BULK_UPDATED',
        resourceType: 'MATCH',
        resourceId: matchId,
        afterState: {
          count: results.length,
          playerIds: performances.map((p) => p.playerId),
        },
      },
    });

    return createResponse({
      matchId,
      updated: results.length,
      performances: results.map((r) => ({
        playerId: r.playerId,
        goals: r.goals,
        assists: r.assists,
        rating: r.rating,
      })),
    }, {
      success: true,
      message: `Updated ${results.length} performances`,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Bulk Update Performances error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update performances',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}