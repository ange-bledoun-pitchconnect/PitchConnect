// src/app/api/analytics/formation-optimization/route.ts
// ============================================================================
// FORMATION OPTIMIZATION ANALYTICS ENDPOINT
// Enhanced for PitchConnect Multi-Sport Management Platform
// ============================================================================
// Analyzes team formations and suggests optimized formations based on:
// - Player statistics and performance ratings
// - Sport-specific formation rules and best practices
// - Team strengths and weaknesses analysis
// - Position compatibility scoring
// - Strategic recommendations (offensive/defensive/balanced)
// ============================================================================

'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiResponse } from '@/lib/api/responses';
import { ApiError } from '@/lib/api/errors';
import prisma from '@/lib/prisma';
import { Sport } from '@prisma/client';
import { z } from 'zod';
import {
  validateUserTeamAccess,
  logApiRequest,
  handleApiError,
} from '@/lib/api/helpers';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Request payload for formation optimization analysis
 */
interface FormationOptimizationRequest {
  teamId: string;
  sport: Sport;
  analysisType?: 'OFFENSIVE' | 'DEFENSIVE' | 'BALANCED';
  includeHistoricalData?: boolean;
  includeAltFormations?: boolean;
}

/**
 * Position performance metrics
 */
interface PositionPerformance {
  position: string;
  playerCount: number;
  averageRating: number;
  averageAppearances: number;
  averageGoals: number;
  averageAssists: number;
  maxRating: number;
  minRating: number;
  consistencyScore: number; // 0-100: how consistent is the position
}

/**
 * Individual player-position compatibility
 */
interface PlayerPositionCompatibility {
  playerId: string;
  playerName: string;
  currentPosition: string;
  targetPosition: string;
  compatibility: number; // 0-100
  reasoning: string;
  alternativePositions?: string[];
  performanceInPosition?: number;
}

/**
 * Formation suggestion with detailed analysis
 */
interface SuggestedFormation {
  formation: string;
  formationCode: string; // e.g., "4-3-3" for football
  score: number; // 0-100: overall suitability score
  reasoning: string;
  compatibility: number; // 0-100: how well it suits current squad
  offensiveRating: number;
  defensiveRating: number;
  balanceRating: number;
  positionRecommendations: PlayerPositionCompatibility[];
  keyStrengths: string[];
  potentialWeaknesses: string[];
  estimatedWinProbability?: number; // Predictive metric (0-100)
}

/**
 * Complete formation analysis response
 */
interface FormationAnalysis {
  teamId: string;
  teamName: string;
  sport: Sport;
  analysisTimestamp: string;
  currentFormation: string | null;
  squadSummary: {
    totalPlayers: number;
    activePlayerCount: number;
    injuredPlayerCount: number;
    averageTeamRating: number;
    squaderBalance: number; // 0-100: position distribution balance
  };
  suggestedFormations: SuggestedFormation[];
  teamAnalysis: {
    strengths: Array<{
      position: string;
      rating: number;
      description: string;
    }>;
    weaknesses: Array<{
      position: string;
      rating: number;
      description: string;
    }>;
    overallTeamStrength: number; // 0-100
    recommendedFocus: string[];
  };
  playersAvailableForRotation: Array<{
    playerId: string;
    playerName: string;
    currentPosition: string;
    canPlayPositions: string[];
    preferredPosition: string;
    averageRating: number;
    appearanceCount: number;
    injuryStatus: string;
  }>;
  strategicRecommendations: string[];
  historicalPerformance?: {
    bestPerformingFormation?: string;
    averageWinRateByFormation?: Record<string, number>;
    formationTrend?: string;
  };
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const formationOptimizationRequestSchema = z.object({
  teamId: z.string().uuid('Invalid team ID format'),
  sport: z.nativeEnum(Sport, {
    errorMap: () => ({ message: 'Invalid sport specified' }),
  }),
  analysisType: z
    .enum(['OFFENSIVE', 'DEFENSIVE', 'BALANCED'])
    .optional()
    .default('BALANCED'),
  includeHistoricalData: z.boolean().optional().default(false),
  includeAltFormations: z.boolean().optional().default(true),
});

// ============================================================================
// SPORT-SPECIFIC FORMATION DEFINITIONS
// ============================================================================

/**
 * Formation definitions for each sport with position requirements
 */
const FORMATION_DEFINITIONS: Record<Sport, Record<string, any>> = {
  FOOTBALL: {
    '4-4-2': {
      formationCode: '4-4-2',
      positions: { GOALKEEPER: 1, DEFENDER: 4, MIDFIELDER: 4, FORWARD: 2 },
      offensiveRating: 7,
      defensiveRating: 8,
      balanceRating: 7.5,
      description: 'Classic formation with balanced attack and defense',
    },
    '4-3-3': {
      formationCode: '4-3-3',
      positions: { GOALKEEPER: 1, DEFENDER: 4, MIDFIELDER: 3, FORWARD: 3 },
      offensiveRating: 8,
      defensiveRating: 7.5,
      balanceRating: 8,
      description: 'Modern formation with strong midfield control',
    },
    '3-5-2': {
      formationCode: '3-5-2',
      positions: { GOALKEEPER: 1, DEFENDER: 3, MIDFIELDER: 5, FORWARD: 2 },
      offensiveRating: 8,
      defensiveRating: 7,
      balanceRating: 7.5,
      description: 'Attack-minded formation with wing control',
    },
    '5-3-2': {
      formationCode: '5-3-2',
      positions: { GOALKEEPER: 1, DEFENDER: 5, MIDFIELDER: 3, FORWARD: 2 },
      offensiveRating: 6,
      defensiveRating: 9,
      balanceRating: 7,
      description: 'Defensive formation with strong back line',
    },
    '4-2-3-1': {
      formationCode: '4-2-3-1',
      positions: { GOALKEEPER: 1, DEFENDER: 4, MIDFIELDER: 5, FORWARD: 1 },
      offensiveRating: 7.5,
      defensiveRating: 8.5,
      balanceRating: 8.2,
      description: 'Structured formation with defensive midfield shield',
    },
    '3-4-3': {
      formationCode: '3-4-3',
      positions: { GOALKEEPER: 1, DEFENDER: 3, MIDFIELDER: 4, FORWARD: 3 },
      offensiveRating: 8.5,
      defensiveRating: 7.5,
      balanceRating: 8,
      description: 'Fluid formation with wing-based attacks',
    },
  },
  NETBALL: {
    'TRADITIONAL_7': {
      formationCode: '7-0',
      positions: {
        GOAL_SHOOTER: 1,
        GOAL_ATTACK: 1,
        WING_ATTACK: 1,
        CENTER: 1,
        WING_DEFENSE: 1,
        GOAL_DEFENSE: 1,
        GOALKEEPER_NETBALL: 1,
      },
      offensiveRating: 8,
      defensiveRating: 8,
      balanceRating: 8,
      description: 'Standard netball formation with all positions',
    },
  },
  RUGBY: {
    'STANDARD_15': {
      formationCode: '15-0',
      positions: {
        HOOKER: 1,
        LOOSEHEAD_PROP: 1,
        TIGHTHEAD_PROP: 1,
        LOCK: 2,
        FLANKER: 2,
        NUMBER_8: 1,
        SCRUM_HALF: 1,
        FLY_HALF: 1,
        INSIDE_CENTER: 1,
        OUTSIDE_CENTER: 1,
        WING: 2,
        FULLBACK: 1,
      },
      offensiveRating: 7.5,
      defensiveRating: 8,
      balanceRating: 7.75,
      description: 'Traditional rugby union formation',
    },
  },
  CRICKET: {
    'STANDARD_11': {
      formationCode: '11-0',
      positions: {
        WICKET_KEEPER: 1,
        BATSMAN: 6,
        BOWLER: 3,
        ALL_ROUNDER: 1,
      },
      offensiveRating: 7,
      defensiveRating: 7,
      balanceRating: 7,
      description: 'Standard cricket XI formation',
    },
  },
  AMERICAN_FOOTBALL: {
    'STANDARD_OFFENSE': {
      formationCode: 'OFF-11',
      positions: {
        QUARTERBACK: 1,
        RUNNING_BACK: 1,
        WIDE_RECEIVER: 3,
        TIGHT_END: 1,
        OFFENSIVE_LINEMAN: 4,
      },
      offensiveRating: 8.5,
      defensiveRating: 0,
      balanceRating: 4.25,
      description: 'Standard offensive formation',
    },
    'STANDARD_DEFENSE': {
      formationCode: 'DEF-11',
      positions: {
        DEFENSIVE_LINEMAN: 4,
        LINEBACKER: 3,
        CORNERBACK: 2,
        SAFETY: 2,
      },
      offensiveRating: 0,
      defensiveRating: 8.5,
      balanceRating: 4.25,
      description: 'Standard defensive formation',
    },
  },
  BASKETBALL: {
    'STANDARD_5': {
      formationCode: '5-0',
      positions: {
        POINT_GUARD: 1,
        SHOOTING_GUARD: 1,
        SMALL_FORWARD: 1,
        POWER_FORWARD: 1,
        CENTER_BASKETBALL: 1,
      },
      offensiveRating: 8,
      defensiveRating: 8,
      balanceRating: 8,
      description: 'Traditional basketball starting five',
    },
  },
};

// ============================================================================
// POSITION COMPATIBILITY MATRIX
// ============================================================================

/**
 * Define which positions players can transition to with compatibility scores
 */
const POSITION_COMPATIBILITY: Record<string, Record<string, number>> = {
  // Football positions
  GOALKEEPER: { GOALKEEPER: 100 },
  DEFENDER: { DEFENDER: 100, MIDFIELDER: 60 },
  MIDFIELDER: { MIDFIELDER: 100, DEFENDER: 65, FORWARD: 55 },
  FORWARD: { FORWARD: 100, MIDFIELDER: 60 },
  // Netball positions
  GOAL_SHOOTER: { GOAL_SHOOTER: 100, GOAL_ATTACK: 75 },
  GOAL_ATTACK: { GOAL_ATTACK: 100, GOAL_SHOOTER: 75, WING_ATTACK: 70 },
  WING_ATTACK: { WING_ATTACK: 100, GOAL_ATTACK: 65, CENTER: 60 },
  CENTER: { CENTER: 100, WING_ATTACK: 60, WING_DEFENSE: 55 },
  WING_DEFENSE: { WING_DEFENSE: 100, CENTER: 55, GOAL_DEFENSE: 70 },
  GOAL_DEFENSE: { GOAL_DEFENSE: 100, WING_DEFENSE: 70, GOALKEEPER_NETBALL: 60 },
  GOALKEEPER_NETBALL: { GOALKEEPER_NETBALL: 100, GOAL_DEFENSE: 55 },
};

// ============================================================================
// MAIN ROUTE HANDLER
// ============================================================================

/**
 * POST /api/analytics/formation-optimization
 * Analyzes team formations and provides optimization suggestions
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<FormationAnalysis>>> {
  const requestId = crypto.randomUUID();

  try {
    // ========== AUTHENTICATION ==========
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        ApiError.unauthorized('Authentication required'),
        { status: 401 },
      );
    }

    logApiRequest('POST', '/api/analytics/formation-optimization', requestId, {
      userId: session.user.id,
    });

    // ========== REQUEST PARSING & VALIDATION ==========
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        ApiError.badRequest('Invalid JSON in request body'),
        { status: 400 },
      );
    }

    const validationResult = formationOptimizationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json(
        ApiError.validation('Invalid request parameters', {
          fieldErrors: errors.fieldErrors,
        }),
        { status: 400 },
      );
    }

    const { teamId, sport, analysisType, includeHistoricalData, includeAltFormations } =
      validationResult.data;

    // ========== AUTHORIZATION ==========
    const hasAccess = await validateUserTeamAccess(
      session.user.id,
      teamId,
      ['COACH', 'MANAGER', 'ANALYST', 'ADMIN'],
    );

    if (!hasAccess) {
      return NextResponse.json(
        ApiError.forbidden('Insufficient permissions to analyze this team'),
        { status: 403 },
      );
    }

    // ========== FETCH TEAM DATA ==========
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        league: {
          select: { sport: true },
        },
        players: {
          where: {
            status: 'ACTIVE', // Include active players
          },
          include: {
            stats: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            injuries: {
              where: {
                recoveryStatus: 'ACTIVE',
              },
              orderBy: { dateOccurred: 'desc' },
              take: 1,
            },
          },
        },
        tactic: {
          select: { formation: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        ApiError.notFound(`Team with ID ${teamId} not found`),
        { status: 404 },
      );
    }

    // Verify sport matches league configuration
    if (team.league?.sport !== sport) {
      return NextResponse.json(
        ApiError.badRequest(
          `Sport mismatch: team is in ${team.league?.sport} league`,
        ),
        { status: 400 },
      );
    }

    // ========== PERFORM ANALYSIS ==========
    const analysis = await analyzeTeamFormation(
      team,
      sport,
      analysisType,
      includeHistoricalData,
      includeAltFormations,
      session.user.id,
    );

    // ========== RETURN RESPONSE ==========
    return NextResponse.json(
      ApiResponse.success(
        analysis,
        `Formation optimization analysis completed for ${team.name}`,
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error(`[${requestId}] Formation optimization error:`, error);
    return handleApiError(
      error,
      'Formation optimization analysis failed',
      requestId,
    );
  }
}

/**
 * GET /api/analytics/formation-optimization
 * Health check endpoint
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<{ status: string; message: string }>>> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      ApiError.unauthorized('Authentication required'),
      { status: 401 },
    );
  }

  return NextResponse.json(
    ApiResponse.success(
      {
        status: 'available',
        message: 'Formation optimization endpoint is operational',
      },
      'OK',
    ),
    { status: 200 },
  );
}

// ============================================================================
// CORE ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Main analysis function - orchestrates all analysis operations
 */
async function analyzeTeamFormation(
  team: any,
  sport: Sport,
  analysisType: string,
  includeHistoricalData: boolean,
  includeAltFormations: boolean,
  userId: string,
): Promise<FormationAnalysis> {
  // Calculate position performance metrics
  const positionPerformance = calculatePositionPerformance(team.players);

  // Analyze team composition
  const squadSummary = calculateSquadSummary(team.players, positionPerformance);

  // Generate formation suggestions
  const suggestedFormations = generateFormationSuggestions(
    sport,
    team.players,
    positionPerformance,
    analysisType,
    includeAltFormations,
  );

  // Analyze strengths and weaknesses
  const teamAnalysis = analyzeTeamStrengthsWeaknesses(
    positionPerformance,
    squadSummary,
  );

  // Get rotation options
  const rotationPlayers = getRotationPlayers(team.players);

  // Generate strategic recommendations
  const recommendations = generateStrategicRecommendations(
    analysisType,
    teamAnalysis,
    squadSummary,
  );

  // Fetch historical performance if requested
  let historicalPerformance: any = undefined;
  if (includeHistoricalData) {
    historicalPerformance = await fetchHistoricalPerformance(team.id, sport);
  }

  return {
    teamId: team.id,
    teamName: team.name,
    sport,
    analysisTimestamp: new Date().toISOString(),
    currentFormation: team.tactic?.formation || null,
    squadSummary,
    suggestedFormations,
    teamAnalysis,
    playersAvailableForRotation: rotationPlayers,
    strategicRecommendations: recommendations,
    historicalPerformance,
  };
}

/**
 * Calculate performance metrics for each position
 */
function calculatePositionPerformance(
  players: any[],
): Record<string, PositionPerformance> {
  const positionGroups: Record<string, any[]> = {};

  // Group players by position
  players.forEach((player) => {
    const position = player.position || 'UNKNOWN';
    if (!positionGroups[position]) {
      positionGroups[position] = [];
    }
    positionGroups[position].push(player);
  });

  // Calculate metrics for each position
  const metrics: Record<string, PositionPerformance> = {};

  Object.entries(positionGroups).forEach(([position, positionPlayers]) => {
    const ratings = positionPlayers
      .map((p) => p.stats?.[0]?.rating || 0)
      .filter((r) => r > 0);
    const goals = positionPlayers.map((p) => p.stats?.[0]?.goals || 0);
    const assists = positionPlayers.map((p) => p.stats?.[0]?.assists || 0);
    const appearances = positionPlayers.map((p) => p.stats?.[0]?.minutes || 0);

    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const consistencyScore =
      ratings.length > 1
        ? Math.max(
            0,
            100 -
              (Math.sqrt(
                ratings.reduce((sq, n) => sq + Math.pow(n - averageRating, 2), 0) /
                  ratings.length,
              ) *
                10),
          )
        : 100;

    metrics[position] = {
      position,
      playerCount: positionPlayers.length,
      averageRating: Math.round(averageRating * 10) / 10,
      averageAppearances: Math.round(
        appearances.reduce((a, b) => a + b, 0) / positionPlayers.length,
      ),
      averageGoals: Math.round(
        (goals.reduce((a, b) => a + b, 0) / positionPlayers.length) * 10,
      ) / 10,
      averageAssists: Math.round(
        (assists.reduce((a, b) => a + b, 0) / positionPlayers.length) * 10,
      ) / 10,
      maxRating: Math.max(...ratings, 0),
      minRating: Math.min(...ratings),
      consistencyScore: Math.round(consistencyScore),
    };
  });

  return metrics;
}

/**
 * Calculate squad-level summary statistics
 */
function calculateSquadSummary(
  players: any[],
  positionPerformance: Record<string, PositionPerformance>,
): FormationAnalysis['squadSummary'] {
  const activeCount = players.length;
  const injuredCount = players.filter((p) => p.injuries?.length > 0).length;
  const ratings = players
    .map((p) => p.stats?.[0]?.rating || 0)
    .filter((r) => r > 0);

  const averageTeamRating =
    ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;

  // Calculate squad balance (0-100: how evenly distributed are players across positions)
  const positionCounts = Object.values(positionPerformance).map(
    (p) => p.playerCount,
  );
  const avgPositionCount =
    positionCounts.length > 0
      ? positionCounts.reduce((a, b) => a + b, 0) / positionCounts.length
      : 0;
  const variance =
    positionCounts.length > 0
      ? positionCounts.reduce(
          (sum, count) => sum + Math.pow(count - avgPositionCount, 2),
          0,
        ) / positionCounts.length
      : 0;
  const squaderBalance = Math.max(
    0,
    Math.round(100 - Math.sqrt(variance) * 10),
  );

  return {
    totalPlayers: players.length,
    activePlayerCount: activeCount,
    injuredPlayerCount: injuredCount,
    averageTeamRating,
    squaderBalance,
  };
}

/**
 * Generate formation suggestions based on squad analysis
 */
function generateFormationSuggestions(
  sport: Sport,
  players: any[],
  positionPerformance: Record<string, PositionPerformance>,
  analysisType: string,
  includeAltFormations: boolean,
): SuggestedFormation[] {
  const formations: SuggestedFormation[] = [];
  const sportFormations = FORMATION_DEFINITIONS[sport] || {};

  let selectedFormations = Object.values(sportFormations);
  if (!includeAltFormations && selectedFormations.length > 0) {
    selectedFormations = [selectedFormations[0]];
  }

  selectedFormations.forEach((formationDef: any) => {
    // Calculate compatibility score
    const compatibility = calculateFormationCompatibility(
      formationDef,
      players,
      positionPerformance,
    );

    // Calculate rating based on analysis type
    let score = (compatibility * 0.6 + formationDef.balanceRating * 0.4) * 10;
    if (analysisType === 'OFFENSIVE') {
      score = (compatibility * 0.5 + formationDef.offensiveRating * 0.5) * 10;
    } else if (analysisType === 'DEFENSIVE') {
      score = (compatibility * 0.5 + formationDef.defensiveRating * 0.5) * 10;
    }

    // Get position recommendations
    const positionRecs = getPositionRecommendations(
      formationDef,
      players,
      positionPerformance,
    );

    formations.push({
      formation: formationDef.description,
      formationCode: formationDef.formationCode,
      score: Math.min(100, Math.round(score)),
      reasoning: generateFormationReasoning(
        formationDef,
        analysisType,
        positionPerformance,
      ),
      compatibility: Math.min(100, Math.round(compatibility * 100)),
      offensiveRating: formationDef.offensiveRating * 10,
      defensiveRating: formationDef.defensiveRating * 10,
      balanceRating: formationDef.balanceRating * 10,
      positionRecommendations: positionRecs,
      keyStrengths: identifyFormationStrengths(
        formationDef,
        positionPerformance,
      ),
      potentialWeaknesses: identifyFormationWeaknesses(
        formationDef,
        positionPerformance,
      ),
      estimatedWinProbability: Math.round(
        (compatibility * 100 + score) / 2,
      ),
    });
  });

  // Sort by score (best first)
  return formations.sort((a, b) => b.score - a.score);
}

/**
 * Analyze team strengths and weaknesses
 */
function analyzeTeamStrengthsWeaknesses(
  positionPerformance: Record<string, PositionPerformance>,
  squadSummary: FormationAnalysis['squadSummary'],
): FormationAnalysis['teamAnalysis'] {
  const strengths: Array<{
    position: string;
    rating: number;
    description: string;
  }> = [];
  const weaknesses: Array<{
    position: string;
    rating: number;
    description: string;
  }> = [];

  Object.entries(positionPerformance).forEach(([position, metrics]) => {
    if (metrics.averageRating >= 7.5) {
      strengths.push({
        position,
        rating: metrics.averageRating,
        description: `${position} performing excellently (${metrics.playerCount} players, avg rating ${metrics.averageRating}/10)`,
      });
    } else if (metrics.averageRating < 5) {
      weaknesses.push({
        position,
        rating: metrics.averageRating,
        description: `${position} needs development (${metrics.playerCount} players, avg rating ${metrics.averageRating}/10)`,
      });
    }
  });

  const recommendedFocus: string[] = [];
  if (weaknesses.length > 0) {
    recommendedFocus.push(
      `Improve performance in: ${weaknesses.map((w) => w.position).join(', ')}`,
    );
  }
  if (squadSummary.injuredPlayerCount > 0) {
    recommendedFocus.push(
      `Manage ${squadSummary.injuredPlayerCount} injured players in rotation`,
    );
  }
  if (squadSummary.squaderBalance < 50) {
    recommendedFocus.push('Recruit players to balance position distribution');
  }

  return {
    strengths: strengths.sort((a, b) => b.rating - a.rating),
    weaknesses: weaknesses.sort((a, b) => a.rating - b.rating),
    overallTeamStrength: squadSummary.averageTeamRating * 10,
    recommendedFocus,
  };
}

/**
 * Get players available for rotation and substitution
 */
function getRotationPlayers(players: any[]): FormationAnalysis['playersAvailableForRotation'] {
  return players
    .filter((p) => !p.injuries?.length)
    .map((p) => ({
      playerId: p.id,
      playerName: `${p.firstName} ${p.lastName}`,
      currentPosition: p.position,
      canPlayPositions: getAlternatePositions(p.position),
      preferredPosition: p.position,
      averageRating: p.stats?.[0]?.rating || 0,
      appearanceCount: p.stats?.length || 0,
      injuryStatus: 'HEALTHY',
    }))
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 14); // Top 14 available
}

/**
 * Generate strategic recommendations
 */
function generateStrategicRecommendations(
  analysisType: string,
  teamAnalysis: FormationAnalysis['teamAnalysis'],
  squadSummary: FormationAnalysis['squadSummary'],
): string[] {
  const recommendations: string[] = [];

  // Base recommendations
  if (teamAnalysis.weaknesses.length > 0) {
    recommendations.push(
      `Focus training sessions on ${teamAnalysis.weaknesses[0].position} to improve squad depth`,
    );
  }

  // Tactical recommendations
  if (analysisType === 'OFFENSIVE') {
    recommendations.push(
      'Deploy attacking formation with emphasis on ball progression',
    );
    recommendations.push(
      'Utilize wide players for creating space and crossing opportunities',
    );
  } else if (analysisType === 'DEFENSIVE') {
    recommendations.push(
      'Maintain defensive structure with organized pressing',
    );
    recommendations.push('Protect possession and avoid turnovers in defensive areas');
  } else {
    recommendations.push(
      'Balance offensive ambition with defensive solidity',
    );
    recommendations.push(
      'Transition quickly between attack and defense to control pace of play',
    );
  }

  // Injury management
  if (squadSummary.injuredPlayerCount > 0) {
    recommendations.push(
      `Manage ${squadSummary.injuredPlayerCount} injured players with strategic substitutions`,
    );
  }

  // Squad balance
  if (squadSummary.squaderBalance < 60) {
    recommendations.push('Recruit additional depth in positions with fewer players');
  }

  // Performance-based
  if (squadSummary.averageTeamRating < 5) {
    recommendations.push(
      'Implement intensive skill development program across all positions',
    );
  } else if (squadSummary.averageTeamRating >= 8) {
    recommendations.push('Maintain current form with targeted maintenance training');
  }

  return recommendations;
}

/**
 * Fetch historical performance data if available
 */
async function fetchHistoricalPerformance(
  teamId: string,
  sport: Sport,
): Promise<any> {
  try {
    // Get recent matches and their results
    const recentMatches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      orderBy: { scheduledDate: 'desc' },
      take: 10,
      select: {
        id: true,
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        status: true,
        homeGoals: true,
        awayGoals: true,
      },
    });

    return {
      recentMatches: recentMatches.slice(0, 5),
      totalRecentMatches: recentMatches.length,
    };
  } catch (error) {
    console.error('Error fetching historical performance:', error);
    return undefined;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate how well a formation suits the current squad
 */
function calculateFormationCompatibility(
  formation: any,
  players: any[],
  positionPerformance: Record<string, PositionPerformance>,
): number {
  let compatibilityScore = 0;
  let totalRequiredPositions = 0;

  Object.entries(formation.positions).forEach(([position, required]) => {
    const posMetrics = positionPerformance[position];
    if (posMetrics) {
      const posScore = Math.min(
        100,
        (posMetrics.playerCount / (required as number)) * 100,
      );
      compatibilityScore += posScore;
    }
    totalRequiredPositions += required as number;
  });

  return compatibilityScore / Object.keys(formation.positions).length / 100;
}

/**
 * Get position recommendations for a formation
 */
function getPositionRecommendations(
  formation: any,
  players: any[],
  positionPerformance: Record<string, PositionPerformance>,
): PlayerPositionCompatibility[] {
  const recommendations: PlayerPositionCompatibility[] = [];

  Object.entries(formation.positions).forEach(([position, _required]) => {
    const topPlayers = players
      .filter((p) => p.position === position)
      .sort((a, b) => (b.stats?.[0]?.rating || 0) - (a.stats?.[0]?.rating || 0))
      .slice(0, 2);

    topPlayers.forEach((player) => {
      recommendations.push({
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        currentPosition: player.position,
        targetPosition: position,
        compatibility: 100,
        reasoning: `High-performing player in this position`,
        performanceInPosition: player.stats?.[0]?.rating || 0,
      });
    });
  });

  return recommendations;
}

/**
 * Generate reasoning for a formation suggestion
 */
function generateFormationReasoning(
  formation: any,
  analysisType: string,
  positionPerformance: Record<string, PositionPerformance>,
): string {
  let reasoning = formation.description;

  if (analysisType === 'OFFENSIVE') {
    reasoning += `. Maximizes attacking players (${formation.offensiveRating * 10}/100 offensive rating)`;
  } else if (analysisType === 'DEFENSIVE') {
    reasoning += `. Strengthens defense (${formation.defensiveRating * 10}/100 defensive rating)`;
  }

  return reasoning;
}

/**
 * Identify strengths of a formation
 */
function identifyFormationStrengths(
  formation: any,
  positionPerformance: Record<string, PositionPerformance>,
): string[] {
  const strengths: string[] = [];

  if (formation.offensiveRating >= 7.5) {
    strengths.push('Strong attacking potential');
  }
  if (formation.defensiveRating >= 7.5) {
    strengths.push('Solid defensive structure');
  }
  if (formation.balanceRating >= 7.5) {
    strengths.push('Balanced squad distribution');
  }

  return strengths.length > 0 ? strengths : ['Adaptable formation'];
}

/**
 * Identify weaknesses of a formation
 */
function identifyFormationWeaknesses(
  formation: any,
  positionPerformance: Record<string, PositionPerformance>,
): string[] {
  const weaknesses: string[] = [];

  if (formation.offensiveRating < 7) {
    weaknesses.push('Limited attacking options');
  }
  if (formation.defensiveRating < 7) {
    weaknesses.push('Exposed to counter-attacks');
  }

  return weaknesses;
}

/**
 * Get alternate positions a player can play
 */
function getAlternatePositions(primaryPosition: string): string[] {
  const compatibility = POSITION_COMPATIBILITY[primaryPosition] || {};
  return Object.entries(compatibility)
    .filter(([_pos, score]) => score >= 60 && score < 100)
    .map(([pos]) => pos);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  analyzeTeamFormation,
  calculatePositionPerformance,
  generateFormationSuggestions,
};
