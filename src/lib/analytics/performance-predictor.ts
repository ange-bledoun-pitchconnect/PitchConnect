// ============================================================================
// src/lib/analytics/performance-predictor.ts
// 📈 PitchConnect Enterprise Analytics - Performance Prediction Engine
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// INTEGRATES: Existing cache system, Prediction model, Multi-sport support
// ============================================================================

import { prisma } from '@/lib/prisma';
import { getOrSetCache, deleteFromCache } from '@/lib/cache/redis';
import { logger } from '@/lib/logging';
import {
  getSportMetricConfig,
  getRatingWeights,
  getKeyMetricsForSport,
} from './sport-metrics';
import type {
  PerformancePrediction,
  PerformanceFactor,
  TimeHorizon,
} from './types';
import type {
  Sport,
  Position,
  PredictionType,
  PredictionStatus,
  PredictionImpact,
} from '@prisma/client';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL_VERSION = '2.0.0-performance';
const CACHE_PREFIX = 'analytics:performance';

// Cache TTLs by time horizon
const CACHE_TTL_BY_HORIZON: Record<TimeHorizon, number> = {
  NEXT_MATCH: 4 * 60 * 60,     // 4 hours
  NEXT_WEEK: 12 * 60 * 60,    // 12 hours
  NEXT_MONTH: 24 * 60 * 60,   // 24 hours
  SEASON: 48 * 60 * 60,       // 48 hours
};

// Form thresholds
const FORM_THRESHOLDS = {
  EXCELLENT: 8.0,
  GOOD: 7.0,
  AVERAGE: 6.0,
  POOR: 5.0,
};

// ============================================================================
// MAIN PREDICTION FUNCTION
// ============================================================================

/**
 * Predict player performance for a given time horizon
 */
export async function predictPlayerPerformance(
  playerId: string,
  timeHorizon: TimeHorizon = 'NEXT_MATCH',
  forceRefresh: boolean = false
): Promise<PerformancePrediction> {
  const cacheKey = `${CACHE_PREFIX}:${playerId}:${timeHorizon}`;
  const cacheTTL = CACHE_TTL_BY_HORIZON[timeHorizon];

  if (!forceRefresh) {
    try {
      const cached = await getOrSetCache<PerformancePrediction>(
        cacheKey,
        async () => generatePerformancePrediction(playerId, timeHorizon),
        cacheTTL
      );
      return cached;
    } catch (error) {
      logger.warn({ playerId, timeHorizon, error }, 'Cache miss, generating fresh prediction');
    }
  }

  return generatePerformancePrediction(playerId, timeHorizon);
}

/**
 * Generate performance prediction (internal)
 */
async function generatePerformancePrediction(
  playerId: string,
  timeHorizon: TimeHorizon
): Promise<PerformancePrediction> {
  // Fetch player with all related data
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          dateOfBirth: true,
        },
      },
      teamPlayers: {
        where: { isActive: true },
        include: {
          team: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  sport: true,
                },
              },
              players: {
                where: { isActive: true },
                include: {
                  player: {
                    select: {
                      id: true,
                      overallRating: true,
                      formRating: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: 1,
      },
      matchPerformances: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          match: {
            select: {
              id: true,
              kickOffTime: true,
              homeScore: true,
              awayScore: true,
              status: true,
              competition: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      statistics: {
        orderBy: { season: 'desc' },
        take: 2,
      },
      injuries: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }

  const sport = player.teamPlayers[0]?.team.club.sport || 'FOOTBALL';
  const playerName = `${player.user.firstName} ${player.user.lastName}`;
  const teamPlayers = player.teamPlayers[0]?.team.players || [];

  // Calculate predictions
  const baseMetrics = calculateBaseMetrics(player.matchPerformances, sport);
  const form = analyzeForm(player.matchPerformances, sport);
  const factors = calculatePerformanceFactors(player, sport, form);
  const predictions = calculatePredictions(baseMetrics, form, factors, timeHorizon, sport);
  const comparison = calculateComparison(player, teamPlayers, sport);
  const sportSpecificMetrics = calculateSportSpecificMetrics(player.matchPerformances, sport);
  const recommendations = generatePerformanceRecommendations(form, factors, sport);

  const confidence = calculatePredictionConfidence(
    player.matchPerformances.length,
    form.consistency,
    timeHorizon
  );

  const prediction: PerformancePrediction = {
    playerId,
    playerName,
    sport,
    position: player.primaryPosition,
    timeHorizon,
    predictions,
    form,
    factors,
    sportSpecificMetrics,
    comparison,
    recommendations,
    metadata: {
      modelVersion: MODEL_VERSION,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + CACHE_TTL_BY_HORIZON[timeHorizon] * 1000),
      matchesAnalyzed: player.matchPerformances.length,
      confidence,
    },
  };

  // Store prediction in database
  await storePrediction(playerId, prediction, sport);

  logger.info({
    playerId,
    timeHorizon,
    expectedRating: predictions.expectedRating,
    form: form.current,
  }, 'Performance prediction generated');

  return prediction;
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate base performance metrics
 */
function calculateBaseMetrics(performances: any[], sport: Sport): {
  avgRating: number;
  avgGoals: number;
  avgAssists: number;
  avgMinutes: number;
  consistency: number;
} {
  if (performances.length === 0) {
    return {
      avgRating: 6.0,
      avgGoals: 0,
      avgAssists: 0,
      avgMinutes: 0,
      consistency: 50,
    };
  }

  const ratings = performances.map(p => p.rating).filter(r => r != null);
  const goals = performances.map(p => p.goals || 0);
  const assists = performances.map(p => p.assists || 0);
  const minutes = performances.map(p => p.minutesPlayed || 0);

  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 6.0;

  // Calculate consistency (inverse of standard deviation)
  let consistency = 50;
  if (ratings.length > 1) {
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length;
    const stdDev = Math.sqrt(variance);
    consistency = Math.max(0, Math.min(100, 100 - stdDev * 20));
  }

  return {
    avgRating: Math.round(avgRating * 100) / 100,
    avgGoals: Math.round((goals.reduce((a, b) => a + b, 0) / performances.length) * 100) / 100,
    avgAssists: Math.round((assists.reduce((a, b) => a + b, 0) / performances.length) * 100) / 100,
    avgMinutes: Math.round(minutes.reduce((a, b) => a + b, 0) / performances.length),
    consistency: Math.round(consistency),
  };
}

/**
 * Analyze player form
 */
function analyzeForm(performances: any[], sport: Sport): PerformancePrediction['form'] {
  const recentPerformances = performances.slice(0, 5);
  const olderPerformances = performances.slice(5, 10);

  if (recentPerformances.length === 0) {
    return {
      current: 'AVERAGE',
      trend: 'STABLE',
      consistency: 50,
      peakProbability: 20,
    };
  }

  // Calculate recent form
  const recentRatings = recentPerformances.map(p => p.rating).filter(r => r != null);
  const avgRecentRating = recentRatings.length > 0
    ? recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length
    : 6.0;

  // Determine form level
  let current: PerformancePrediction['form']['current'] = 'AVERAGE';
  if (avgRecentRating >= FORM_THRESHOLDS.EXCELLENT) current = 'EXCELLENT';
  else if (avgRecentRating >= FORM_THRESHOLDS.GOOD) current = 'GOOD';
  else if (avgRecentRating >= FORM_THRESHOLDS.AVERAGE) current = 'AVERAGE';
  else if (avgRecentRating >= FORM_THRESHOLDS.POOR) current = 'POOR';
  else current = 'CRITICAL';

  // Determine trend
  let trend: PerformancePrediction['form']['trend'] = 'STABLE';
  if (olderPerformances.length >= 3) {
    const olderRatings = olderPerformances.map(p => p.rating).filter(r => r != null);
    const avgOlderRating = olderRatings.length > 0
      ? olderRatings.reduce((a, b) => a + b, 0) / olderRatings.length
      : 6.0;

    if (avgRecentRating > avgOlderRating + 0.3) trend = 'IMPROVING';
    else if (avgRecentRating < avgOlderRating - 0.3) trend = 'DECLINING';
  }

  // Calculate consistency
  let consistency = 50;
  if (recentRatings.length > 1) {
    const variance = recentRatings.reduce((sum, r) => sum + Math.pow(r - avgRecentRating, 2), 0) / recentRatings.length;
    consistency = Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 20));
  }

  // Calculate peak probability
  const peakRatings = recentRatings.filter(r => r >= 8.0);
  const peakProbability = recentRatings.length > 0
    ? Math.round((peakRatings.length / recentRatings.length) * 100)
    : 20;

  return {
    current,
    trend,
    consistency: Math.round(consistency),
    peakProbability: Math.min(80, peakProbability + (trend === 'IMPROVING' ? 10 : 0)),
  };
}

/**
 * Calculate performance factors
 */
function calculatePerformanceFactors(
  player: any,
  sport: Sport,
  form: PerformancePrediction['form']
): PerformanceFactor[] {
  const factors: PerformanceFactor[] = [];
  const performances = player.matchPerformances || [];

  // 1. Current Form Factor
  factors.push({
    factor: 'Current Form',
    impact: form.current === 'EXCELLENT' || form.current === 'GOOD' ? 'POSITIVE' : 
            form.current === 'POOR' || form.current === 'CRITICAL' ? 'NEGATIVE' : 'NEUTRAL',
    weight: 0.25,
    description: `Player is in ${form.current.toLowerCase()} form`,
  });

  // 2. Form Trend Factor
  factors.push({
    factor: 'Form Trend',
    impact: form.trend === 'IMPROVING' ? 'POSITIVE' : 
            form.trend === 'DECLINING' ? 'NEGATIVE' : 'NEUTRAL',
    weight: 0.15,
    description: `Performance trend is ${form.trend.toLowerCase()}`,
  });

  // 3. Consistency Factor
  factors.push({
    factor: 'Consistency',
    impact: form.consistency >= 70 ? 'POSITIVE' : 
            form.consistency <= 40 ? 'NEGATIVE' : 'NEUTRAL',
    weight: 0.2,
    description: `Performance consistency at ${form.consistency}%`,
  });

  // 4. Match Fitness Factor
  const recentMatches = performances.slice(0, 5).filter(p => 
    (p.minutesPlayed || 0) >= 60
  ).length;
  
  factors.push({
    factor: 'Match Fitness',
    impact: recentMatches >= 4 ? 'POSITIVE' : 
            recentMatches <= 1 ? 'NEGATIVE' : 'NEUTRAL',
    weight: 0.15,
    description: `${recentMatches}/5 recent matches with 60+ minutes`,
  });

  // 5. Injury Status Factor
  const hasActiveInjury = player.injuries?.length > 0;
  if (hasActiveInjury) {
    factors.push({
      factor: 'Injury Concern',
      impact: 'NEGATIVE',
      weight: 0.15,
      description: 'Currently recovering from injury',
    });
  }

  // 6. Recent Goal/Assist Involvement
  const recentGoalInvolvement = performances.slice(0, 5).reduce(
    (sum: number, p: any) => sum + (p.goals || 0) + (p.assists || 0),
    0
  );
  
  if (recentGoalInvolvement >= 3) {
    factors.push({
      factor: 'Attacking Form',
      impact: 'POSITIVE',
      weight: 0.1,
      description: `${recentGoalInvolvement} goal involvements in last 5 matches`,
    });
  }

  return factors;
}

/**
 * Calculate predictions based on analysis
 */
function calculatePredictions(
  baseMetrics: ReturnType<typeof calculateBaseMetrics>,
  form: PerformancePrediction['form'],
  factors: PerformanceFactor[],
  timeHorizon: TimeHorizon,
  sport: Sport
): PerformancePrediction['predictions'] {
  // Apply factors to base rating
  let ratingAdjustment = 0;
  for (const factor of factors) {
    if (factor.impact === 'POSITIVE') ratingAdjustment += factor.weight * 0.5;
    else if (factor.impact === 'NEGATIVE') ratingAdjustment -= factor.weight * 0.5;
  }

  // Apply trend adjustment
  if (form.trend === 'IMPROVING') ratingAdjustment += 0.2;
  else if (form.trend === 'DECLINING') ratingAdjustment -= 0.2;

  const expectedRating = Math.max(4, Math.min(10, baseMetrics.avgRating + ratingAdjustment));

  // Calculate range based on consistency and time horizon
  const horizonUncertainty: Record<TimeHorizon, number> = {
    NEXT_MATCH: 0.5,
    NEXT_WEEK: 0.7,
    NEXT_MONTH: 1.0,
    SEASON: 1.2,
  };

  const uncertainty = horizonUncertainty[timeHorizon] * (1 - form.consistency / 100);
  const ratingRange = {
    min: Math.max(4, Math.round((expectedRating - uncertainty) * 10) / 10),
    max: Math.min(10, Math.round((expectedRating + uncertainty) * 10) / 10),
  };

  // Calculate expected goals/assists based on time horizon
  const matchMultiplier: Record<TimeHorizon, number> = {
    NEXT_MATCH: 1,
    NEXT_WEEK: 2,
    NEXT_MONTH: 6,
    SEASON: 30,
  };

  const multiplier = matchMultiplier[timeHorizon];
  const formMultiplier = form.current === 'EXCELLENT' ? 1.2 :
                        form.current === 'GOOD' ? 1.1 :
                        form.current === 'POOR' ? 0.9 :
                        form.current === 'CRITICAL' ? 0.7 : 1.0;

  return {
    expectedRating: Math.round(expectedRating * 10) / 10,
    ratingRange,
    goalsPredicted: Math.round(baseMetrics.avgGoals * multiplier * formMultiplier * 10) / 10,
    assistsPredicted: Math.round(baseMetrics.avgAssists * multiplier * formMultiplier * 10) / 10,
    minutesPredicted: Math.round(baseMetrics.avgMinutes * multiplier),
  };
}

/**
 * Calculate comparison metrics
 */
function calculateComparison(
  player: any,
  teamPlayers: any[],
  sport: Sport
): PerformancePrediction['comparison'] {
  const playerRating = player.overallRating || player.formRating || 6.0;

  // Team average
  const teamRatings = teamPlayers
    .map(tp => tp.player?.overallRating || tp.player?.formRating)
    .filter(r => r != null) as number[];
  
  const teamAvg = teamRatings.length > 0
    ? teamRatings.reduce((a, b) => a + b, 0) / teamRatings.length
    : 6.0;

  // Position average (simplified - same as team for now)
  const positionAvg = teamAvg;

  // League average (assumed 6.5 baseline)
  const leagueAvg = 6.5;

  // Calculate percentile
  const betterCount = teamRatings.filter(r => r < playerRating).length;
  const percentileRank = teamRatings.length > 0
    ? Math.round((betterCount / teamRatings.length) * 100)
    : 50;

  return {
    vsPositionAverage: Math.round((playerRating - positionAvg) * 100) / 100,
    vsTeamAverage: Math.round((playerRating - teamAvg) * 100) / 100,
    vsLeagueAverage: Math.round((playerRating - leagueAvg) * 100) / 100,
    percentileRank,
  };
}

/**
 * Calculate sport-specific metrics
 */
function calculateSportSpecificMetrics(
  performances: any[],
  sport: Sport
): Record<string, number> {
  const keyMetrics = getKeyMetricsForSport(sport);
  const metrics: Record<string, number> = {};

  // Calculate averages for each key metric
  // This would use sport-specific data from match performances
  // For now, returning placeholder values based on available data

  if (performances.length === 0) {
    return metrics;
  }

  // Common metrics across sports
  const totalMinutes = performances.reduce((sum, p) => sum + (p.minutesPlayed || 0), 0);
  const avgMinutes = totalMinutes / performances.length;

  metrics['avgMinutesPerMatch'] = Math.round(avgMinutes);
  metrics['totalGoalInvolvements'] = performances.reduce(
    (sum, p) => sum + (p.goals || 0) + (p.assists || 0),
    0
  );

  // Add sport-specific calculations based on available data
  // These would be enhanced with actual sport-specific stats from the database

  return metrics;
}

/**
 * Calculate prediction confidence
 */
function calculatePredictionConfidence(
  dataPoints: number,
  consistency: number,
  timeHorizon: TimeHorizon
): number {
  // Base confidence from data availability
  let confidence = 50;

  if (dataPoints >= 20) confidence += 25;
  else if (dataPoints >= 10) confidence += 15;
  else if (dataPoints >= 5) confidence += 8;

  // Adjust for consistency
  confidence += (consistency - 50) * 0.2;

  // Reduce confidence for longer time horizons
  const horizonPenalty: Record<TimeHorizon, number> = {
    NEXT_MATCH: 0,
    NEXT_WEEK: 5,
    NEXT_MONTH: 15,
    SEASON: 25,
  };

  confidence -= horizonPenalty[timeHorizon];

  return Math.max(30, Math.min(95, Math.round(confidence)));
}

/**
 * Generate performance recommendations
 */
function generatePerformanceRecommendations(
  form: PerformancePrediction['form'],
  factors: PerformanceFactor[],
  sport: Sport
): string[] {
  const recommendations: string[] = [];

  // Form-based recommendations
  if (form.current === 'EXCELLENT') {
    recommendations.push('Maintain current training intensity and match rhythm');
    recommendations.push('Consider for high-stakes matches');
  } else if (form.current === 'GOOD') {
    recommendations.push('Continue current program with minor tactical adjustments');
  } else if (form.current === 'AVERAGE') {
    recommendations.push('Review recent match footage for improvement areas');
    recommendations.push('Consider additional technical training sessions');
  } else if (form.current === 'POOR' || form.current === 'CRITICAL') {
    recommendations.push('Implement confidence-building training exercises');
    recommendations.push('Consider reduced playing time or positional change');
    recommendations.push('One-on-one coaching sessions recommended');
  }

  // Trend-based recommendations
  if (form.trend === 'IMPROVING') {
    recommendations.push('Capitalize on momentum with increased responsibility');
  } else if (form.trend === 'DECLINING') {
    recommendations.push('Identify and address root cause of decline');
    recommendations.push('Consider physical and mental wellness check');
  }

  // Consistency recommendations
  if (form.consistency < 50) {
    recommendations.push('Focus on consistent preparation routines');
    recommendations.push('Work on mental concentration techniques');
  }

  // Factor-based recommendations
  for (const factor of factors) {
    if (factor.impact === 'NEGATIVE' && factor.factor === 'Match Fitness') {
      recommendations.push('Gradually increase match minutes to build fitness');
    }
    if (factor.impact === 'NEGATIVE' && factor.factor === 'Injury Concern') {
      recommendations.push('Follow return-to-play protocol carefully');
    }
  }

  return recommendations.slice(0, 6);
}

// ============================================================================
// DATABASE INTEGRATION
// ============================================================================

/**
 * Store prediction in database using Prediction model
 */
async function storePrediction(
  playerId: string,
  prediction: PerformancePrediction,
  sport: Sport
): Promise<void> {
  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        userId: true,
        teamPlayers: {
          where: { isActive: true },
          select: {
            team: {
              select: {
                clubId: true,
                club: {
                  select: {
                    organisationId: true,
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!player) return;

    const clubId = player.teamPlayers[0]?.team.clubId;
    const organisationId = player.teamPlayers[0]?.team.club.organisationId;

    // Map form to impact
    const impactMap: Record<string, PredictionImpact> = {
      EXCELLENT: 'HIGH',
      GOOD: 'MEDIUM',
      AVERAGE: 'LOW',
      POOR: 'MEDIUM',
      CRITICAL: 'HIGH',
    };

    await prisma.prediction.create({
      data: {
        type: 'PERFORMANCE' as PredictionType,
        status: 'ACTIVE' as PredictionStatus,
        impact: impactMap[prediction.form.current],
        title: `Performance Forecast: ${prediction.playerName}`,
        description: `${prediction.form.current} form (${prediction.predictions.expectedRating}/10) - ${prediction.form.trend} trend`,
        confidence: prediction.metadata.confidence / 100,
        relatedEntityType: 'PLAYER',
        relatedEntityId: playerId,
        relatedEntityName: prediction.playerName,
        sport,
        modelVersion: MODEL_VERSION,
        dataSourcesUsed: ['match_performances', 'player_statistics', 'team_context'],
        validFrom: new Date(),
        validUntil: prediction.metadata.validUntil,
        predictionData: prediction as any,
        tags: [
          `form:${prediction.form.current.toLowerCase()}`,
          `trend:${prediction.form.trend.toLowerCase()}`,
          `horizon:${prediction.timeHorizon.toLowerCase()}`,
          `sport:${sport.toLowerCase()}`,
        ],
        isPublic: false,
        createdBy: { connect: { id: player.userId } },
        ...(organisationId && { organisation: { connect: { id: organisationId } } }),
        ...(clubId && { club: { connect: { id: clubId } } }),
      },
    });

    logger.debug({ playerId }, 'Performance prediction stored in database');
  } catch (error) {
    logger.error({ playerId, error }, 'Failed to store performance prediction');
  }
}

// ============================================================================
// CACHE INVALIDATION
// ============================================================================

/**
 * Invalidate cached predictions for a player
 */
export async function invalidatePerformancePredictions(playerId: string): Promise<void> {
  const horizons: TimeHorizon[] = ['NEXT_MATCH', 'NEXT_WEEK', 'NEXT_MONTH', 'SEASON'];
  
  for (const horizon of horizons) {
    const cacheKey = `${CACHE_PREFIX}:${playerId}:${horizon}`;
    await deleteFromCache(cacheKey);
  }
  
  logger.debug({ playerId }, 'Performance prediction caches invalidated');
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Generate performance predictions for all players in a team
 */
export async function predictTeamPerformance(
  teamId: string,
  timeHorizon: TimeHorizon = 'NEXT_MATCH'
): Promise<PerformancePrediction[]> {
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: { teamId, isActive: true },
    select: { playerId: true },
  });

  const predictions: PerformancePrediction[] = [];

  for (const tp of teamPlayers) {
    try {
      const prediction = await predictPlayerPerformance(tp.playerId, timeHorizon);
      predictions.push(prediction);
    } catch (error) {
      logger.error({ playerId: tp.playerId, error }, 'Failed to predict performance');
    }
  }

  // Sort by expected rating descending
  return predictions.sort((a, b) => b.predictions.expectedRating - a.predictions.expectedRating);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  FORM_THRESHOLDS,
  MODEL_VERSION as PERFORMANCE_MODEL_VERSION,
};