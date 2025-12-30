// ============================================================================
// src/app/api/ai/recommendations/route.ts
// 💡 PitchConnect Enterprise AI - Strategic Recommendations Engine
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports with context-aware recommendations
// ============================================================================
// CATEGORIES:
// - STRATEGY: Tactical & game planning
// - PLAYER_DEVELOPMENT: Individual growth paths
// - LINEUP: Squad selection & rotation
// - RECRUITMENT: Transfer & scouting targets
// - FITNESS: Physical conditioning & injury prevention
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import {
  getSportConfig,
  getSportDisplayName,
  generateRecommendationCacheKey,
  getCachedRecommendations,
  setCachedRecommendations,
  buildAccessContext,
  canViewPredictionType,
  MODEL_VERSION,
} from '@/lib/ai';
import type { TeamRecommendation } from '@/lib/ai/types';
import type { Sport, PredictionType, ClubMemberRole } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

type RecommendationCategory = 'STRATEGY' | 'PLAYER_DEVELOPMENT' | 'LINEUP' | 'RECRUITMENT' | 'FITNESS' | 'ALL';
type RecommendationContext = 'UPCOMING_MATCH' | 'SEASON_PLANNING' | 'INJURY_CRISIS' | 'GENERAL';

interface RecommendationsResponse {
  teamId: string;
  teamName: string;
  clubId: string;
  clubName: string;
  sport: Sport;
  sportDisplayName: string;
  category: RecommendationCategory;
  context: RecommendationContext;
  
  summary: {
    overallStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
    priorityCount: { high: number; medium: number; low: number };
    keyFocus: string;
    immediateActions: string[];
  };
  
  recommendations: TeamRecommendation[];
  
  insights: {
    strengths: string[];
    concerns: string[];
    opportunities: string[];
  };
  
  metadata: {
    modelVersion: string;
    generatedAt: string;
    validUntil: string;
    cacheHit: boolean;
  };
}

// ============================================================================
// GET - Recommendations
// ============================================================================

/**
 * GET /api/ai/recommendations
 * Generate AI-powered strategic recommendations
 * 
 * Query Parameters:
 * - teamId: string (required)
 * - clubId: string (alternative to teamId)
 * - category: RecommendationCategory (default: 'ALL')
 * - context: RecommendationContext (default: 'GENERAL')
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user) {
      logger.warn('Unauthorized recommendations request', { requestId });
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // ========================================================================
    // PERMISSION CHECK
    // ========================================================================
    const accessContext = buildAccessContext(
      session.user.id,
      session.user.roles || [],
      session.user.permissions || [],
      session.user.organisationId,
      session.user.clubId
    );

    // Check if user can view recommendations (tactical/strategic predictions)
    if (!canViewPredictionType(accessContext, 'TACTICAL_MATCHUP' as PredictionType)) {
      logger.warn('Permission denied for recommendations', { 
        requestId, 
        userId: session.user.id 
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to view recommendations',
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // PARSE QUERY PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const clubId = searchParams.get('clubId');
    const category = (searchParams.get('category') || 'ALL').toUpperCase() as RecommendationCategory;
    const context = (searchParams.get('context') || 'GENERAL').toUpperCase() as RecommendationContext;

    if (!teamId && !clubId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Either teamId or clubId parameter is required',
        },
        { status: 400 }
      );
    }

    logger.info('Recommendations request', {
      requestId,
      teamId,
      clubId,
      category,
      context,
    });

    // ========================================================================
    // FETCH TEAM DATA
    // ========================================================================
    const whereClause: any = { deletedAt: null };
    if (teamId) whereClause.id = teamId;
    if (clubId && !teamId) whereClause.clubId = clubId;

    const team = await prisma.team.findFirst({
      where: whereClause,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            shortName: true,
            sport: true,
            aggregateStats: true,
          },
        },
        players: {
          where: { isActive: true },
          include: {
            player: {
              select: {
                id: true,
                primaryPosition: true,
                isActive: true,
                availabilityStatus: true,
                formRating: true,
                overallRating: true,
                injuries: {
                  where: { status: 'ACTIVE' },
                  take: 1,
                },
                matchPerformances: {
                  orderBy: { createdAt: 'desc' },
                  take: 5,
                  select: {
                    rating: true,
                    goals: true,
                    assists: true,
                    minutesPlayed: true,
                  },
                },
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        homeMatches: {
          where: { status: 'COMPLETED', deletedAt: null },
          orderBy: { kickOffTime: 'desc' },
          take: 10,
          select: {
            homeScore: true,
            awayScore: true,
            kickOffTime: true,
          },
        },
        awayMatches: {
          where: { status: 'COMPLETED', deletedAt: null },
          orderBy: { kickOffTime: 'desc' },
          take: 10,
          select: {
            homeScore: true,
            awayScore: true,
            kickOffTime: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: `Team not found`,
        },
        { status: 404 }
      );
    }

    const sport = team.club.sport;

    // ========================================================================
    // CHECK CACHE
    // ========================================================================
    const cacheKey = generateRecommendationCacheKey(team.id, category, context);
    const cached = getCachedRecommendations(cacheKey);

    if (cached) {
      const response = buildRecommendationsResponse(
        team,
        cached.data,
        sport,
        category,
        context,
        true
      );

      return NextResponse.json({
        success: true,
        requestId,
        ...response,
        timestamp: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`,
      });
    }

    // ========================================================================
    // GENERATE RECOMMENDATIONS
    // ========================================================================
    const recommendations = generateRecommendations(team, sport, category, context);

    // Cache recommendations
    setCachedRecommendations(cacheKey, recommendations);

    // Build response
    const response = buildRecommendationsResponse(
      team,
      recommendations,
      sport,
      category,
      context,
      false
    );

    logger.info('Recommendations generated', {
      requestId,
      teamId: team.id,
      recommendationCount: recommendations.length,
      processingTime: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      requestId,
      ...response,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Recommendations error', error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/ai/recommendations',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to generate recommendations',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// RECOMMENDATION GENERATION
// ============================================================================

function generateRecommendations(
  team: any,
  sport: Sport,
  category: RecommendationCategory,
  context: RecommendationContext
): TeamRecommendation[] {
  const recommendations: TeamRecommendation[] = [];
  const sportConfig = getSportConfig(sport);

  // Analyze team data
  const players = team.players || [];
  const availablePlayers = players.filter((tp: any) => 
    tp.player.isActive && !tp.player.injuries?.length
  );
  const injuredPlayers = players.filter((tp: any) => tp.player.injuries?.length > 0);

  // Combine matches
  const allMatches = [
    ...team.homeMatches.map((m: any) => ({ ...m, isHome: true })),
    ...team.awayMatches.map((m: any) => ({ ...m, isHome: false })),
  ];

  // Calculate form
  let wins = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  for (const match of allMatches.slice(0, 5)) {
    const teamGoals = match.isHome ? (match.homeScore || 0) : (match.awayScore || 0);
    const opponentGoals = match.isHome ? (match.awayScore || 0) : (match.homeScore || 0);
    goalsFor += teamGoals;
    goalsAgainst += opponentGoals;
    if (teamGoals > opponentGoals) wins++;
    else if (teamGoals < opponentGoals) losses++;
  }

  const isUnderperforming = losses > wins;
  const hasInjuryProblems = injuredPlayers.length >= 3;
  const hasSquadDepthIssues = availablePlayers.length < 14;

  // ========================================================================
  // STRATEGY RECOMMENDATIONS
  // ========================================================================
  if (category === 'ALL' || category === 'STRATEGY') {
    if (isUnderperforming) {
      recommendations.push({
        priority: 'HIGH',
        category: 'STRATEGY',
        recommendation: 'Adopt a more defensive tactical approach',
        rationale: `Recent form shows ${losses} losses in last 5 matches. Conceding ${goalsAgainst} goals indicates defensive vulnerabilities.`,
        expectedImpact: 'Improved defensive solidity and reduced goals conceded',
        implementation: [
          'Implement deeper defensive line',
          'Focus on counter-attacking opportunities',
          'Prioritize set-piece defending in training',
          'Consider switching to a more compact formation',
        ],
      });
    }

    if (goalsFor < 5) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'STRATEGY',
        recommendation: 'Enhance attacking creativity and finishing',
        rationale: `Only ${goalsFor} goals in last 5 matches suggests offensive struggles`,
        expectedImpact: 'Increased goal-scoring opportunities and conversion rate',
        implementation: [
          'Work on final third combinations',
          'Increase crossing and set-piece routines',
          'Implement more direct attacking patterns',
          'Focus on striker positioning drills',
        ],
      });
    }

    if (context === 'UPCOMING_MATCH') {
      recommendations.push({
        priority: 'HIGH',
        category: 'STRATEGY',
        recommendation: 'Prepare match-specific tactical plan',
        rationale: 'Upcoming match requires focused preparation',
        expectedImpact: 'Better tactical awareness and match readiness',
        implementation: [
          'Analyze opponent recent matches',
          'Identify key opposition threats',
          'Prepare set-piece routines',
          'Brief players on individual matchups',
        ],
      });
    }
  }

  // ========================================================================
  // PLAYER DEVELOPMENT RECOMMENDATIONS
  // ========================================================================
  if (category === 'ALL' || category === 'PLAYER_DEVELOPMENT') {
    // Find players with declining form
    const decliningPlayers = players.filter((tp: any) => {
      const performances = tp.player.matchPerformances || [];
      if (performances.length < 3) return false;
      const recentAvg = performances.slice(0, 2).reduce((s: number, p: any) => s + (p.rating || 6), 0) / 2;
      const olderAvg = performances.slice(2, 4).reduce((s: number, p: any) => s + (p.rating || 6), 0) / 2;
      return recentAvg < olderAvg - 0.5;
    });

    if (decliningPlayers.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PLAYER_DEVELOPMENT',
        recommendation: `Address form decline in ${decliningPlayers.length} player(s)`,
        rationale: 'Several players showing declining performance metrics',
        expectedImpact: 'Restored player confidence and improved output',
        implementation: [
          'Schedule individual feedback sessions',
          'Review recent match footage together',
          'Adjust training focus to address weaknesses',
          'Consider tactical role modifications',
        ],
      });
    }

    // Young player development
    const youngHighPotential = players.filter((tp: any) => 
      tp.player.overallRating && tp.player.overallRating < 70
    ).slice(0, 3);

    if (youngHighPotential.length > 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'PLAYER_DEVELOPMENT',
        recommendation: 'Integrate developing players into first team setup',
        rationale: 'Squad sustainability requires youth development pathway',
        expectedImpact: 'Long-term squad depth and reduced transfer dependency',
        implementation: [
          'Include in first team training sessions',
          'Provide cup competition opportunities',
          'Assign senior player mentors',
          'Track development milestones',
        ],
      });
    }
  }

  // ========================================================================
  // LINEUP RECOMMENDATIONS
  // ========================================================================
  if (category === 'ALL' || category === 'LINEUP') {
    if (hasSquadDepthIssues) {
      recommendations.push({
        priority: 'HIGH',
        category: 'LINEUP',
        recommendation: 'Address squad depth concerns',
        rationale: `Only ${availablePlayers.length} players available - below recommended squad size`,
        expectedImpact: 'Improved rotation options and reduced player fatigue',
        implementation: [
          'Recall loan players if possible',
          'Assess youth team promotion candidates',
          'Consider short-term loan signings',
          'Cross-train players for multiple positions',
        ],
      });
    }

    // Rotation recommendation
    const highMinutesPlayers = players.filter((tp: any) => {
      const performances = tp.player.matchPerformances || [];
      const avgMinutes = performances.length > 0 
        ? performances.reduce((s: number, p: any) => s + (p.minutesPlayed || 0), 0) / performances.length
        : 0;
      return avgMinutes > 80;
    });

    if (highMinutesPlayers.length >= 5) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'LINEUP',
        recommendation: 'Implement strategic squad rotation',
        rationale: `${highMinutesPlayers.length} players averaging 80+ minutes - fatigue risk`,
        expectedImpact: 'Reduced injury risk and sustained performance levels',
        implementation: [
          'Rotate 2-3 players in less critical matches',
          'Use substitutions earlier in matches',
          'Give key players rest in cup competitions',
          'Monitor training loads weekly',
        ],
      });
    }
  }

  // ========================================================================
  // FITNESS RECOMMENDATIONS
  // ========================================================================
  if (category === 'ALL' || category === 'FITNESS') {
    if (hasInjuryProblems) {
      recommendations.push({
        priority: 'HIGH',
        category: 'FITNESS',
        recommendation: 'Review and enhance injury prevention protocols',
        rationale: `${injuredPlayers.length} current injuries affecting squad availability`,
        expectedImpact: 'Reduced injury recurrence and improved squad availability',
        implementation: [
          'Audit current warm-up and cool-down routines',
          'Review training surface and equipment',
          'Implement GPS load monitoring',
          'Schedule regular physio assessments',
        ],
      });
    }

    if (context === 'INJURY_CRISIS') {
      recommendations.push({
        priority: 'HIGH',
        category: 'FITNESS',
        recommendation: 'Implement crisis injury management protocol',
        rationale: 'Multiple injuries require immediate action',
        expectedImpact: 'Optimized recovery and squad management',
        implementation: [
          'Prioritize recovery for key players',
          'Reduce training intensity temporarily',
          'Bring in specialist rehabilitation support',
          'Adjust tactical approach to available personnel',
        ],
      });
    }

    // General fitness recommendation
    recommendations.push({
      priority: 'LOW',
      category: 'FITNESS',
      recommendation: 'Optimize pre-match preparation routines',
      rationale: 'Consistent preparation improves match performance',
      expectedImpact: 'Better physical readiness and reduced early match fatigue',
      implementation: [
        'Standardize match-day warm-up routine',
        'Ensure adequate hydration protocols',
        'Plan nutrition for optimal energy',
        'Include activation exercises',
      ],
    });
  }

  // ========================================================================
  // RECRUITMENT RECOMMENDATIONS
  // ========================================================================
  if (category === 'ALL' || category === 'RECRUITMENT') {
    // Analyze position gaps
    const positions = players.map((tp: any) => tp.player.primaryPosition);
    const positionCounts = positions.reduce((acc: any, pos: any) => {
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {});

    // Sport-specific position requirements
    const keyPositions = sport === 'FOOTBALL' 
      ? ['GOALKEEPER', 'CENTRE_BACK', 'CENTRAL_MIDFIELDER', 'STRIKER']
      : sport === 'RUGBY'
        ? ['HOOKER', 'FLY_HALF', 'SCRUM_HALF', 'NUMBER_EIGHT']
        : sport === 'BASKETBALL'
          ? ['POINT_GUARD', 'CENTER', 'SHOOTING_GUARD']
          : ['GOALKEEPER', 'STRIKER'];

    const weakPositions = keyPositions.filter(pos => (positionCounts[pos] || 0) < 2);

    if (weakPositions.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'RECRUITMENT',
        recommendation: `Target recruitment in ${weakPositions.length} position area(s)`,
        rationale: `Limited depth in: ${weakPositions.join(', ')}`,
        expectedImpact: 'Improved squad balance and tactical flexibility',
        implementation: [
          'Create position-specific scouting criteria',
          'Review transfer market for available options',
          'Consider loan opportunities for immediate cover',
          'Explore youth academy solutions',
        ],
      });
    }

    if (context === 'SEASON_PLANNING') {
      recommendations.push({
        priority: 'LOW',
        category: 'RECRUITMENT',
        recommendation: 'Develop long-term recruitment strategy',
        rationale: 'Proactive planning ensures squad evolution',
        expectedImpact: 'Sustainable squad development and reduced emergency spending',
        implementation: [
          'Identify contract expiration timeline',
          'Create target player profiles by position',
          'Build relationships with feeder clubs',
          'Allocate scouting resources effectively',
        ],
      });
    }
  }

  // Sort by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

// ============================================================================
// RESPONSE BUILDER
// ============================================================================

function buildRecommendationsResponse(
  team: any,
  recommendations: TeamRecommendation[],
  sport: Sport,
  category: RecommendationCategory,
  context: RecommendationContext,
  cacheHit: boolean
): RecommendationsResponse {
  const players = team.players || [];
  const injuredPlayers = players.filter((tp: any) => tp.player.injuries?.length > 0);
  const availablePlayers = players.filter((tp: any) => !tp.player.injuries?.length);

  // Calculate priority counts
  const priorityCount = {
    high: recommendations.filter(r => r.priority === 'HIGH').length,
    medium: recommendations.filter(r => r.priority === 'MEDIUM').length,
    low: recommendations.filter(r => r.priority === 'LOW').length,
  };

  // Determine overall status
  let overallStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL' = 'GOOD';
  if (priorityCount.high >= 3) overallStatus = 'CRITICAL';
  else if (priorityCount.high >= 2) overallStatus = 'NEEDS_ATTENTION';
  else if (priorityCount.high === 0 && priorityCount.medium <= 2) overallStatus = 'EXCELLENT';

  // Key focus area
  const topRecommendation = recommendations[0];
  const keyFocus = topRecommendation 
    ? `${topRecommendation.category}: ${topRecommendation.recommendation}`
    : 'Maintain current approach';

  // Immediate actions
  const immediateActions = recommendations
    .filter(r => r.priority === 'HIGH')
    .slice(0, 3)
    .map(r => r.recommendation);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];
  const opportunities: string[] = [];

  if (availablePlayers.length >= 15) {
    strengths.push('Good squad availability');
  }
  if (injuredPlayers.length === 0) {
    strengths.push('Full squad fitness');
  }

  if (injuredPlayers.length >= 3) {
    concerns.push(`${injuredPlayers.length} players currently injured`);
  }
  if (priorityCount.high >= 2) {
    concerns.push('Multiple high-priority issues require attention');
  }

  opportunities.push('Room for tactical evolution');
  if (context === 'SEASON_PLANNING') {
    opportunities.push('Transfer window planning opportunity');
  }

  return {
    teamId: team.id,
    teamName: team.name,
    clubId: team.clubId,
    clubName: team.club.name,
    sport,
    sportDisplayName: getSportDisplayName(sport),
    category,
    context,
    summary: {
      overallStatus,
      priorityCount,
      keyFocus,
      immediateActions,
    },
    recommendations,
    insights: {
      strengths,
      concerns,
      opportunities,
    },
    metadata: {
      modelVersion: MODEL_VERSION,
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      cacheHit,
    },
  };
}