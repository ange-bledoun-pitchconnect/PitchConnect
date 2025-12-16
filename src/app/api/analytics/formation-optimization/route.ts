// ============================================================================
// FIXED: src/app/api/analytics/formation-optimization/route.ts
// ============================================================================
// Production-Ready Formation Analysis API
// ✅ Proper async exports for "use server" directive
// ✅ No default exports (Next.js 15 compatibility)
// ✅ Full error handling and request tracking
// ============================================================================

'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type Sport = 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL' | 'BASKETBALL';

interface PositionPerformance {
  position: string;
  playerCount: number;
  averageRating: number;
  averageAppearances: number;
  averageGoals: number;
  averageAssists: number;
  maxRating: number;
  minRating: number;
  consistencyScore: number;
}

interface FormationAnalysis {
  teamId: string;
  teamName: string;
  sport: Sport;
  analysisTimestamp: string;
  currentFormation: string | null;
  squadSummary: {
    totalPlayers: number;
    activePlayers: number;
    injuredPlayers: number;
    averageTeamRating: number;
    positionBreakdown: Record<string, number>;
  };
  suggestedFormations: Array<{
    formation: string;
    suitability: number;
    reasoning: string;
    recommendedPositions: string[];
  }>;
  teamAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  playersAvailableForRotation: Array<{
    name: string;
    position: string;
    rating: number;
    minutesPlayed: number;
    matches: number;
  }>;
  strategicRecommendations: string[];
  historicalPerformance?: {
    averageWinRate: number;
    commonFormations: string[];
    performanceTrend: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  requestId: string;
  timestamp: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const formationOptimizationRequestSchema = z.object({
  teamId: z.string().uuid('Invalid team ID format'),
  sport: z.enum(['FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL', 'BASKETBALL']),
  analysisType: z.enum(['GENERAL', 'OFFENSIVE', 'DEFENSIVE', 'BALANCED']).default('GENERAL'),
  includeHistoricalData: z.boolean().default(false),
  includeAltFormations: z.boolean().default(true),
});

// ============================================================================
// SPORT-SPECIFIC FORMATION CONFIGURATIONS
// ============================================================================

const FORMATION_CONFIGS: Record<Sport, Record<string, string[]>> = {
  FOOTBALL: {
    '4-3-3': ['CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'LW', 'ST', 'RW', 'GK'],
    '4-2-3-1': ['CB', 'CB', 'LB', 'RB', 'CDM', 'CDM', 'LM', 'CAM', 'RM', 'ST', 'GK'],
    '3-5-2': ['CB', 'CB', 'CB', 'LWB', 'RWB', 'CM', 'CM', 'CAM', 'ST', 'ST', 'GK'],
    '5-3-2': ['CB', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'ST', 'ST', 'GK'],
  },
  NETBALL: {
    '7v7': ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'],
  },
  RUGBY: {
    '15v15': ['P', 'H', 'P', 'L', 'L', 'TH', 'BL', 'BL', 'N8', 'SH', 'FH', 'ITW', 'CTB', 'CTB', 'WTB', 'WTB', 'FB'],
  },
  CRICKET: {
    '11v11': ['WK', 'BAT', 'BAT', 'BAT', 'BAT', 'BAT', 'AR', 'AR', 'BWL', 'BWL', 'BWL'],
  },
  AMERICAN_FOOTBALL: {
    '11v11': ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'OL', 'OL', 'OL', 'OL', 'OL'],
  },
  BASKETBALL: {
    '5v5': ['PG', 'SG', 'SF', 'PF', 'C'],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createErrorResponse(
  code: string,
  message: string,
  statusCode: number,
  requestId: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

function createSuccessResponse<T>(
  data: T,
  message: string,
  requestId: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

async function validateUserTeamAccess(
  userId: string,
  teamId: string,
  requiredRoles: string[]
): Promise<boolean> {
  try {
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId,
        club: {
          teams: {
            some: { id: teamId },
          },
        },
      },
    });

    return !!membership;
  } catch (error) {
    console.error('Authorization check failed:', error);
    return false;
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function calculatePositionPerformance(
  players: any[]
): Record<string, PositionPerformance> {
  const positionGroups: Record<string, any[]> = {};

  players.forEach((player) => {
    const position = player.position || 'UNKNOWN';
    if (!positionGroups[position]) {
      positionGroups[position] = [];
    }
    positionGroups[position].push(player);
  });

  const metrics: Record<string, PositionPerformance> = {};

  Object.entries(positionGroups).forEach(([position, positionPlayers]) => {
    const ratings = positionPlayers
      .map((p) => p.analytics?.overallRating || 0)
      .filter((r) => r > 0);

    const goals = positionPlayers.map((p) => p.statistics?.[0]?.goals || 0);
    const assists = positionPlayers.map((p) => p.statistics?.[0]?.assists || 0);
    const minutes = positionPlayers.map((p) => p.statistics?.[0]?.minutesPlayed || 0);

    const averageRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const consistencyScore =
      ratings.length > 1
        ? Math.max(
            0,
            100 -
              (Math.sqrt(
                ratings.reduce((sq, n) => sq + Math.pow(n - averageRating, 2), 0) /
                  ratings.length
              ) *
                10)
          )
        : 100;

    metrics[position] = {
      position,
      playerCount: positionPlayers.length,
      averageRating: Math.round(averageRating * 10) / 10,
      averageAppearances: Math.round(
        minutes.reduce((a, b) => a + b, 0) / (positionPlayers.length * 90)
      ),
      averageGoals:
        Math.round(
          (goals.reduce((a, b) => a + b, 0) / positionPlayers.length) * 10
        ) / 10,
      averageAssists:
        Math.round(
          (assists.reduce((a, b) => a + b, 0) / positionPlayers.length) * 10
        ) / 10,
      maxRating: Math.max(...ratings, 0),
      minRating: ratings.length > 0 ? Math.min(...ratings) : 0,
      consistencyScore: Math.round(consistencyScore),
    };
  });

  return metrics;
}

function generateFormationSuggestions(
  sport: Sport,
  players: any[],
  positionPerformance: Record<string, PositionPerformance>,
  analysisType: string
): FormationAnalysis['suggestedFormations'] {
  const formations = FORMATION_CONFIGS[sport] || {};
  const suggestions: FormationAnalysis['suggestedFormations'] = [];

  Object.entries(formations).forEach(([formation, positions]) => {
    let suitability = 0;
    const availablePositions: string[] = [];

    positions.forEach((position) => {
      if (positionPerformance[position]) {
        const posPerf = positionPerformance[position];
        if (posPerf.playerCount > 0) {
          suitability += (posPerf.averageRating / 10) * (100 / positions.length);
          availablePositions.push(position);
        }
      }
    });

    suitability = Math.min(100, Math.round(suitability));

    let reasoning = '';
    if (analysisType === 'OFFENSIVE') {
      reasoning = `${formation} provides attacking flexibility`;
    } else if (analysisType === 'DEFENSIVE') {
      reasoning = `${formation} provides defensive stability`;
    } else {
      reasoning = `${formation} offers balanced play`;
    }

    suggestions.push({
      formation,
      suitability,
      reasoning,
      recommendedPositions: availablePositions,
    });
  });

  return suggestions.sort((a, b) => b.suitability - a.suitability);
}

function analyzeTeamStrengthsWeaknesses(
  positionPerformance: Record<string, PositionPerformance>,
  squadSummary: any
): FormationAnalysis['teamAnalysis'] {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];

  Object.entries(positionPerformance).forEach(([position, metrics]) => {
    if (metrics.averageRating > 7.5) {
      strengths.push(`Strong ${position} unit with ${metrics.averageRating} rating`);
    } else if (metrics.averageRating < 6) {
      weaknesses.push(`Weak ${position} unit with ${metrics.averageRating} rating`);
    }
  });

  if (squadSummary.injuredPlayers > squadSummary.totalPlayers * 0.2) {
    weaknesses.push(`High injury rate (${squadSummary.injuredPlayers} players)`);
  } else {
    opportunities.push('Good squad depth for rotation');
  }

  if (squadSummary.averageTeamRating > 7) {
    strengths.push('Strong overall team quality');
  } else if (squadSummary.averageTeamRating < 6) {
    weaknesses.push('Squad quality needs improvement');
  }

  return {
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    opportunities: opportunities.slice(0, 2),
  };
}

function getRotationPlayers(players: any[]): FormationAnalysis['playersAvailableForRotation'] {
  return players
    .filter((p) => p.statistics?.[0] && !p.injuries?.some((i: any) => i.status === 'ACTIVE'))
    .map((p) => ({
      name: p.user?.firstName ? `${p.user.firstName} ${p.user.lastName}` : 'Unknown',
      position: p.position || 'UNKNOWN',
      rating: p.analytics?.overallRating || 0,
      minutesPlayed: p.statistics?.[0]?.minutesPlayed || 0,
      matches: p.statistics?.[0]?.appearances || 0,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
}

async function analyzeTeamFormation(
  team: any,
  sport: Sport,
  analysisType: string,
  includeHistoricalData: boolean
): Promise<FormationAnalysis> {
  const positionPerformance = calculatePositionPerformance(team.players);

  const activePlayers = team.players.filter(
    (p: any) => !p.injuries?.some((i: any) => i.status === 'ACTIVE')
  ).length;
  const injuredPlayers = team.players.filter((p: any) =>
    p.injuries?.some((i: any) => i.status === 'ACTIVE')
  ).length;

  const ratings = team.players
    .map((p: any) => p.analytics?.overallRating || 0)
    .filter((r: number) => r > 0);

  const squadSummary = {
    totalPlayers: team.players.length,
    activePlayers,
    injuredPlayers,
    averageTeamRating:
      ratings.length > 0
        ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
        : 0,
    positionBreakdown: Object.entries(positionPerformance).reduce(
      (acc, [pos, metrics]) => {
        acc[pos] = metrics.playerCount;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  const suggestedFormations = generateFormationSuggestions(
    sport,
    team.players,
    positionPerformance,
    analysisType
  );

  const teamAnalysis = analyzeTeamStrengthsWeaknesses(positionPerformance, squadSummary);
  const rotationPlayers = getRotationPlayers(team.players);

  const strategicRecommendations = [
    'Focus on maintaining squad depth',
    'Develop youth academy players',
    'Improve tactical flexibility',
  ];

  return {
    teamId: team.id,
    teamName: team.name,
    sport,
    analysisTimestamp: new Date().toISOString(),
    currentFormation: null,
    squadSummary,
    suggestedFormations,
    teamAnalysis,
    playersAvailableForRotation: rotationPlayers,
    strategicRecommendations,
  };
}

// ============================================================================
// API ROUTE HANDLERS - MUST BE ASYNC IN "use server" FILES
// ============================================================================

/**
 * POST /api/analytics/formation-optimization
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401, requestId);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('INVALID_JSON', 'Invalid request body', 400, requestId);
    }

    const validation = formationOptimizationRequestSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request parameters', 400, requestId);
    }

    const { teamId, sport, analysisType, includeHistoricalData } = validation.data;

    const hasAccess = await validateUserTeamAccess(session.user.id, teamId, [
      'COACH',
      'MANAGER',
      'ANALYST',
      'ADMIN',
    ]);

    if (!hasAccess) {
      return createErrorResponse(
        'FORBIDDEN',
        'Insufficient permissions to analyze this team',
        403,
        requestId
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
            analytics: true,
            statistics: {
              orderBy: { season: 'desc' },
              take: 1,
            },
            injuries: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!team) {
      return createErrorResponse('NOT_FOUND', `Team with ID ${teamId} not found`, 404, requestId);
    }

    const analysis = await analyzeTeamFormation(
      team,
      sport,
      analysisType,
      includeHistoricalData
    );

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ANALYSIS_PERFORMED',
          entity: 'FORMATION_ANALYSIS',
          entityId: teamId,
          changes: { sport, analysisType },
        },
      });
    } catch (auditError) {
      console.error('Audit log failed:', auditError);
      // Continue anyway - don't fail the request
    }

    return createSuccessResponse(analysis, 'Formation analysis completed successfully', requestId);
  } catch (error) {
    console.error(`[${requestId}] Formation optimization error:`, error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createErrorResponse('INTERNAL_SERVER_ERROR', message, 500, requestId);
  }
}

/**
 * GET /api/analytics/formation-optimization
 * Health check endpoint
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        401,
        crypto.randomUUID()
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'available',
          message: 'Formation optimization endpoint is operational',
        },
        message: 'OK',
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Health check failed',
      500,
      crypto.randomUUID()
    );
  }
}
