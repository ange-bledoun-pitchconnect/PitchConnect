// ============================================================================
// src/app/api/analytics/formation-optimization/route.ts
// ⚽ PitchConnect Enterprise Analytics - Formation Optimization API
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================
// ENDPOINTS:
// - GET /api/analytics/formation-optimization - Health check
// - POST /api/analytics/formation-optimization - Analyze formation
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import { getOrSetCache } from '@/lib/cache/redis';
import {
  hasAnalyticsAccess,
  getFormationsForSport,
  getSportMetricConfig,
  type FormationAnalysis,
  type FormationSuggestion,
  type PositionAnalysis,
  type RotationSuggestion,
} from '@/lib/analytics';
import type { Sport, Position } from '@prisma/client';
import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const CACHE_PREFIX = 'analytics:formation';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const formationRequestSchema = z.object({
  teamId: z.string().uuid('Invalid team ID format'),
  analysisType: z.enum(['GENERAL', 'OFFENSIVE', 'DEFENSIVE', 'BALANCED']).default('GENERAL'),
  includeHistoricalData: z.boolean().default(false),
  includeRotationSuggestions: z.boolean().default(true),
  opponentTeamId: z.string().uuid().optional(),
});

// ============================================================================
// GET - Health Check
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = `form-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', requestId },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId,
      status: 'available',
      message: 'Formation optimization endpoint is operational',
      supportedSports: [
        'FOOTBALL', 'RUGBY', 'BASKETBALL', 'AMERICAN_FOOTBALL',
        'NETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES',
        'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL', 'CRICKET',
      ],
      analysisTypes: ['GENERAL', 'OFFENSIVE', 'DEFENSIVE', 'BALANCED'],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error('Health check failed'), { requestId });
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Health check failed', requestId },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Analyze Formation
// ============================================================================

/**
 * POST /api/analytics/formation-optimization
 * 
 * Body:
 * - teamId: string (required) - Team to analyze
 * - analysisType: 'GENERAL' | 'OFFENSIVE' | 'DEFENSIVE' | 'BALANCED' (default: 'GENERAL')
 * - includeHistoricalData: boolean - Include historical performance data (default: false)
 * - includeRotationSuggestions: boolean - Include player rotation suggestions (default: true)
 * - opponentTeamId: string (optional) - Analyze against specific opponent
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `form-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn({ requestId }, 'Unauthorized formation analysis request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', requestId },
        { status: 401 }
      );
    }

    // ========================================================================
    // AUTHORIZATION
    // ========================================================================
    const userRoles = session.user.roles || [];
    
    if (!hasAnalyticsAccess(userRoles, 'formation')) {
      logger.warn({ requestId, userId: session.user.id, roles: userRoles }, 'Forbidden formation analysis access');
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'You do not have permission to access formation analysis', requestId },
        { status: 403 }
      );
    }

    // ========================================================================
    // PARSE & VALIDATE BODY
    // ========================================================================
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Invalid JSON body', requestId },
        { status: 400 }
      );
    }

    const validation = formationRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Invalid request parameters',
          details: validation.error.errors,
          requestId,
        },
        { status: 400 }
      );
    }

    const { teamId, analysisType, includeHistoricalData, includeRotationSuggestions } = validation.data;

    logger.info({
      requestId,
      teamId,
      analysisType,
      userId: session.user.id,
    }, 'Formation analysis request');

    // ========================================================================
    // VERIFY TEAM ACCESS
    // ========================================================================
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            sport: true,
            members: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: `Team with ID ${teamId} not found`, requestId },
        { status: 404 }
      );
    }

    // Check club membership (unless SUPER_ADMIN or SCOUT)
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isScout = userRoles.includes('SCOUT');
    const hasMembership = team.club.members.length > 0;

    if (!isSuperAdmin && !isScout && !hasMembership) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'You do not have access to this team', requestId },
        { status: 403 }
      );
    }

    // ========================================================================
    // CHECK CACHE
    // ========================================================================
    const cacheKey = `${CACHE_PREFIX}:${teamId}:${analysisType}`;
    
    const analysis = await getOrSetCache<FormationAnalysis>(
      cacheKey,
      async () => generateFormationAnalysis(teamId, team.club.sport, analysisType, includeHistoricalData, includeRotationSuggestions),
      CACHE_TTL_SECONDS
    );

    // ========================================================================
    // LOG AUDIT
    // ========================================================================
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ANALYTICS_VIEW',
          entity: 'FORMATION_ANALYSIS',
          entityId: teamId,
          changes: { sport: team.club.sport, analysisType },
        },
      });
    } catch (auditError) {
      logger.warn({ error: auditError, requestId }, 'Audit log failed');
    }

    return NextResponse.json({
      success: true,
      requestId,
      analysis,
      meta: {
        generatedAt: analysis.metadata.generatedAt.toISOString(),
        processingTimeMs: Date.now() - startTime,
        sport: team.club.sport,
        analysisType,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics/formation-optimization',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to generate formation analysis',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// FORMATION ANALYSIS GENERATOR
// ============================================================================

async function generateFormationAnalysis(
  teamId: string,
  sport: Sport,
  analysisType: string,
  includeHistoricalData: boolean,
  includeRotationSuggestions: boolean
): Promise<FormationAnalysis> {
  // Fetch team with players
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      players: {
        where: { isActive: true },
        include: {
          player: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              matchPerformances: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                  rating: true,
                  minutesPlayed: true,
                  goals: true,
                  assists: true,
                },
              },
              injuries: {
                where: { status: 'ACTIVE' },
                select: { id: true, injuryType: true },
              },
              statistics: {
                orderBy: { season: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!team) {
    throw new Error(`Team not found: ${teamId}`);
  }

  const players = team.players.map(tp => tp.player);

  // ========================================================================
  // CALCULATE SQUAD SUMMARY
  // ========================================================================
  const availablePlayers = players.filter(p => p.injuries.length === 0);
  const injuredPlayers = players.filter(p => p.injuries.length > 0);

  const ratings = players
    .map(p => p.overallRating || p.formRating)
    .filter(r => r != null) as number[];

  const averageRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : 0;

  // Position breakdown
  const positionBreakdown: Record<string, number> = {};
  for (const player of players) {
    const pos = player.primaryPosition || 'UNKNOWN';
    positionBreakdown[pos] = (positionBreakdown[pos] || 0) + 1;
  }

  const squadSummary = {
    totalPlayers: players.length,
    availablePlayers: availablePlayers.length,
    injuredPlayers: injuredPlayers.length,
    suspendedPlayers: 0, // Would need suspension data
    averageRating,
    positionBreakdown,
  };

  // ========================================================================
  // ANALYZE POSITIONS
  // ========================================================================
  const positionAnalysis: PositionAnalysis[] = [];
  const sportConfig = getSportMetricConfig(sport);

  for (const category of sportConfig.positionCategories) {
    const positionPlayers = players.filter(p => 
      category.positions.includes(p.primaryPosition || '')
    );

    const posRatings = positionPlayers
      .map(p => p.overallRating || p.formRating || 0)
      .filter(r => r > 0);

    const avgRating = posRatings.length > 0
      ? Math.round((posRatings.reduce((a, b) => a + b, 0) / posRatings.length) * 10) / 10
      : 0;

    // Find best player
    let bestPlayer: { id: string; name: string; rating: number } | null = null;
    for (const player of positionPlayers) {
      const rating = player.overallRating || player.formRating || 0;
      if (!bestPlayer || rating > bestPlayer.rating) {
        bestPlayer = {
          id: player.id,
          name: `${player.user.firstName} ${player.user.lastName}`,
          rating,
        };
      }
    }

    // Determine depth
    let depth: PositionAnalysis['depth'] = 'ADEQUATE';
    const requiredForPosition = Math.ceil(category.importance / 10);
    if (positionPlayers.length >= requiredForPosition * 2) depth = 'EXCELLENT';
    else if (positionPlayers.length >= requiredForPosition * 1.5) depth = 'GOOD';
    else if (positionPlayers.length >= requiredForPosition) depth = 'ADEQUATE';
    else if (positionPlayers.length > 0) depth = 'POOR';
    else depth = 'CRITICAL';

    positionAnalysis.push({
      position: category.category,
      playerCount: positionPlayers.length,
      averageRating: avgRating,
      bestPlayer,
      depth,
      recommendation: depth === 'CRITICAL' 
        ? `Urgent: Need to recruit ${category.category} players`
        : depth === 'POOR'
        ? `Consider adding depth in ${category.category}`
        : `${category.category} coverage is ${depth.toLowerCase()}`,
    });
  }

  // ========================================================================
  // GENERATE FORMATION SUGGESTIONS
  // ========================================================================
  const formations = getFormationsForSport(sport);
  const suggestedFormations: FormationSuggestion[] = [];

  for (const [formationName, positions] of Object.entries(formations)) {
    // Calculate suitability based on available players for each position
    let filledPositions = 0;
    const missingPositions: string[] = [];

    for (const position of positions) {
      const hasPlayer = players.some(p => 
        p.primaryPosition === position || p.secondaryPosition === position
      );
      if (hasPlayer) {
        filledPositions++;
      } else {
        missingPositions.push(position);
      }
    }

    const suitabilityScore = Math.round((filledPositions / positions.length) * 100);

    // Adjust based on analysis type
    let reasoning = '';
    let adjustedScore = suitabilityScore;

    if (analysisType === 'OFFENSIVE') {
      const attackingPositions = positions.filter(p => 
        p.includes('ST') || p.includes('FW') || p.includes('W') || p.includes('CAM')
      );
      if (attackingPositions.length >= 3) {
        adjustedScore += 10;
        reasoning = `${formationName} provides strong attacking options with ${attackingPositions.length} forward positions`;
      } else {
        reasoning = `${formationName} may lack attacking width`;
      }
    } else if (analysisType === 'DEFENSIVE') {
      const defensivePositions = positions.filter(p => 
        p.includes('CB') || p.includes('B') || p.includes('DM') || p.includes('GK')
      );
      if (defensivePositions.length >= 5) {
        adjustedScore += 10;
        reasoning = `${formationName} offers defensive solidity with ${defensivePositions.length} defensive positions`;
      } else {
        reasoning = `${formationName} may be vulnerable defensively`;
      }
    } else {
      reasoning = `${formationName} provides balanced coverage`;
    }

    suggestedFormations.push({
      formation: formationName,
      suitabilityScore: Math.min(100, adjustedScore),
      reasoning,
      positionsFilled: positions.filter((_, i) => i < filledPositions),
      positionsNeeded: missingPositions,
      expectedPerformance: Math.round(averageRating * 10),
    });
  }

  // Sort by suitability
  suggestedFormations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  // ========================================================================
  // TEAM SWOT ANALYSIS
  // ========================================================================
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  // Analyze strengths/weaknesses
  for (const pa of positionAnalysis) {
    if (pa.averageRating >= 7.5 && pa.depth !== 'CRITICAL' && pa.depth !== 'POOR') {
      strengths.push(`Strong ${pa.position} unit (${pa.averageRating} avg rating)`);
    } else if (pa.averageRating < 6 || pa.depth === 'CRITICAL') {
      weaknesses.push(`Weak ${pa.position} coverage`);
    }
  }

  if (squadSummary.injuredPlayers > squadSummary.totalPlayers * 0.2) {
    weaknesses.push(`High injury count (${squadSummary.injuredPlayers} players)`);
    threats.push('Risk of squad depth issues');
  } else {
    opportunities.push('Good squad fitness allows rotation');
  }

  if (averageRating >= 7.5) {
    strengths.push('High overall squad quality');
  } else if (averageRating < 6) {
    weaknesses.push('Squad quality needs improvement');
  }

  // ========================================================================
  // ROTATION SUGGESTIONS
  // ========================================================================
  const rotationSuggestions: RotationSuggestion[] = [];

  if (includeRotationSuggestions) {
    // Find players who need rest (high minutes, low recent rating)
    for (const player of availablePlayers) {
      const recentPerfs = player.matchPerformances;
      const totalMinutes = recentPerfs.reduce((sum, p) => sum + (p.minutesPlayed || 0), 0);
      const avgRating = recentPerfs.length > 0
        ? recentPerfs.reduce((sum, p) => sum + (p.rating || 0), 0) / recentPerfs.length
        : 0;

      // Find replacement if player is overworked
      if (totalMinutes > 800 && avgRating < 7) {
        const samePosition = availablePlayers.filter(p => 
          p.id !== player.id && 
          (p.primaryPosition === player.primaryPosition || p.secondaryPosition === player.primaryPosition)
        );

        if (samePosition.length > 0) {
          const replacement = samePosition[0];
          rotationSuggestions.push({
            playerIn: {
              id: replacement.id,
              name: `${replacement.user.firstName} ${replacement.user.lastName}`,
              position: replacement.primaryPosition || 'Unknown',
            },
            playerOut: {
              id: player.id,
              name: `${player.user.firstName} ${player.user.lastName}`,
              position: player.primaryPosition || 'Unknown',
            },
            reason: `${player.user.firstName} has played ${totalMinutes} minutes with declining form (${avgRating.toFixed(1)} avg)`,
            expectedImpact: 'Freshen up the team and allow recovery',
            priority: totalMinutes > 900 ? 'HIGH' : 'MEDIUM',
          });
        }
      }
    }
  }

  // ========================================================================
  // STRATEGIC RECOMMENDATIONS
  // ========================================================================
  const strategicRecommendations: string[] = [];

  if (suggestedFormations[0]) {
    strategicRecommendations.push(`Consider ${suggestedFormations[0].formation} formation (${suggestedFormations[0].suitabilityScore}% suitability)`);
  }

  for (const weakness of weaknesses.slice(0, 2)) {
    strategicRecommendations.push(`Address: ${weakness}`);
  }

  if (rotationSuggestions.length > 0) {
    strategicRecommendations.push(`Consider ${rotationSuggestions.length} player rotation(s) to manage workload`);
  }

  strategicRecommendations.push('Monitor training load and recovery metrics');
  strategicRecommendations.push('Develop tactical flexibility with multiple formation options');

  return {
    teamId,
    teamName: team.name,
    sport,
    currentFormation: null, // Would need to track current formation
    squadSummary,
    suggestedFormations: suggestedFormations.slice(0, 5),
    positionAnalysis,
    teamAnalysis: {
      strengths: strengths.slice(0, 4),
      weaknesses: weaknesses.slice(0, 4),
      opportunities: opportunities.slice(0, 3),
      threats: threats.slice(0, 3),
    },
    rotationSuggestions: rotationSuggestions.slice(0, 5),
    strategicRecommendations: strategicRecommendations.slice(0, 6),
    metadata: {
      modelVersion: '2.0.0-formation',
      generatedAt: new Date(),
      analysisType,
    },
  };
}