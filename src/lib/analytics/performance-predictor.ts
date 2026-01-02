/**
 * ============================================================================
 * 📈 PITCHCONNECT ANALYTICS - PERFORMANCE PREDICTOR v7.10.1
 * ============================================================================
 * Enterprise performance prediction for all 12 sports
 * Forecasts player and team performance across multiple time horizons
 * ============================================================================
 */

import type {
  Sport,
  TimeHorizon,
  PerformancePrediction,
  PerformanceFactor,
} from './types';
import { getSportMetricConfig, getRatingWeights } from './sport-metrics';

// =============================================================================
// CONSTANTS
// =============================================================================

export const PERFORMANCE_MODEL_VERSION = '7.10.1-performance';

export const FORM_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 65,
  AVERAGE: 45,
  POOR: 30,
  CRITICAL: 0,
};

const TIME_HORIZON_WEIGHTS: Record<TimeHorizon, number> = {
  NEXT_MATCH: 0.7,    // Recent form weighted heavily
  NEXT_WEEK: 0.6,
  NEXT_MONTH: 0.5,
  SEASON: 0.4,        // Long-term averages weighted more
};

// =============================================================================
// CACHE
// =============================================================================

interface PerformanceCache {
  predictions: Map<string, { data: PerformancePrediction; expiresAt: Date }>;
}

const performanceCache: PerformanceCache = {
  predictions: new Map(),
};

const CACHE_TTL: Record<TimeHorizon, number> = {
  NEXT_MATCH: 60 * 60 * 4 * 1000,     // 4 hours
  NEXT_WEEK: 60 * 60 * 12 * 1000,     // 12 hours
  NEXT_MONTH: 60 * 60 * 24 * 1000,    // 24 hours
  SEASON: 60 * 60 * 48 * 1000,        // 48 hours
};

// =============================================================================
// MAIN PREDICTION FUNCTION
// =============================================================================

/**
 * Predict player performance
 */
export async function predictPlayerPerformance(
  playerId: string,
  playerData: {
    name: string;
    sport: Sport;
    position: string;
    age: number;
    
    // Historical performance
    seasonRating: number;
    last5Ratings: number[];
    last10Ratings: number[];
    averageRating: number;
    
    // Contribution stats
    goalsOrContributions: number;
    assists: number;
    matchesPlayed: number;
    minutesPlayed: number;
    
    // Physical
    fatigueLevel: number;
    fitnessScore: number;
    injuryRisk: number;
    
    // Form
    formScore: number;
    consistencyScore: number;
    
    // Context
    upcomingFixtures?: {
      matchId: string;
      opponent: string;
      opponentRating: number;
      isHome: boolean;
    }[];
  },
  horizon: TimeHorizon = 'NEXT_MATCH',
  forceRefresh: boolean = false
): Promise<PerformancePrediction> {
  // Check cache
  const cacheKey = `perf:${playerId}:${horizon}`;
  if (!forceRefresh) {
    const cached = performanceCache.predictions.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }
  }
  
  const sportConfig = getSportMetricConfig(playerData.sport);
  const horizonWeight = TIME_HORIZON_WEIGHTS[horizon];
  
  // Calculate form trend
  const formTrend = calculateFormTrend(playerData.last5Ratings, playerData.last10Ratings);
  
  // Calculate predicted rating
  const recentFormAvg = playerData.last5Ratings.length > 0
    ? playerData.last5Ratings.reduce((a, b) => a + b, 0) / playerData.last5Ratings.length
    : playerData.averageRating;
  
  const baseRating = (recentFormAvg * horizonWeight) + (playerData.seasonRating * (1 - horizonWeight));
  
  // Apply adjustment factors
  let adjustedRating = baseRating;
  const positiveFactors: PerformanceFactor[] = [];
  const negativeFactors: PerformanceFactor[] = [];
  
  // 1. Form trend adjustment
  const trendAdjustment = formTrend === 'IMPROVING' ? 0.3 :
                          formTrend === 'DECLINING' ? -0.3 : 0;
  adjustedRating += trendAdjustment;
  if (trendAdjustment !== 0) {
    const factor: PerformanceFactor = {
      factor: 'Form Trend',
      impact: trendAdjustment * 10,
      description: `${formTrend} form over recent matches`,
      trend: formTrend,
    };
    (trendAdjustment > 0 ? positiveFactors : negativeFactors).push(factor);
  }
  
  // 2. Fatigue adjustment
  if (playerData.fatigueLevel > 60) {
    const fatigueImpact = -((playerData.fatigueLevel - 60) / 100);
    adjustedRating += fatigueImpact;
    negativeFactors.push({
      factor: 'Fatigue Level',
      impact: fatigueImpact * 10,
      description: `High fatigue (${playerData.fatigueLevel}%) may impact performance`,
    });
  }
  
  // 3. Fitness factor
  if (playerData.fitnessScore < 70) {
    const fitnessImpact = -((70 - playerData.fitnessScore) / 100);
    adjustedRating += fitnessImpact;
    negativeFactors.push({
      factor: 'Fitness Level',
      impact: fitnessImpact * 10,
      description: `Sub-optimal fitness score (${playerData.fitnessScore}%)`,
    });
  } else if (playerData.fitnessScore > 85) {
    const fitnessBoost = (playerData.fitnessScore - 85) / 200;
    adjustedRating += fitnessBoost;
    positiveFactors.push({
      factor: 'Physical Conditioning',
      impact: fitnessBoost * 10,
      description: `Excellent fitness level (${playerData.fitnessScore}%)`,
    });
  }
  
  // 4. Injury risk factor
  if (playerData.injuryRisk > 50) {
    const injuryImpact = -((playerData.injuryRisk - 50) / 200);
    adjustedRating += injuryImpact;
    negativeFactors.push({
      factor: 'Injury Concern',
      impact: injuryImpact * 10,
      description: `Elevated injury risk (${playerData.injuryRisk}%) may affect output`,
    });
  }
  
  // 5. Consistency factor
  if (playerData.consistencyScore > 75) {
    const consistencyBoost = (playerData.consistencyScore - 75) / 250;
    adjustedRating += consistencyBoost;
    positiveFactors.push({
      factor: 'Consistency',
      impact: consistencyBoost * 10,
      description: `Highly consistent performer (${playerData.consistencyScore}%)`,
    });
  } else if (playerData.consistencyScore < 40) {
    negativeFactors.push({
      factor: 'Inconsistency',
      impact: -5,
      description: `Variable performances - prediction has wider range`,
    });
  }
  
  // 6. Upcoming fixture difficulty (if available)
  if (playerData.upcomingFixtures && playerData.upcomingFixtures.length > 0) {
    const avgOpponentRating = playerData.upcomingFixtures
      .reduce((sum, f) => sum + f.opponentRating, 0) / playerData.upcomingFixtures.length;
    
    if (avgOpponentRating > 7.5) {
      const fixtureImpact = -((avgOpponentRating - 7) / 20);
      adjustedRating += fixtureImpact;
      negativeFactors.push({
        factor: 'Fixture Difficulty',
        impact: fixtureImpact * 10,
        description: `Tough upcoming opponents (avg rating: ${avgOpponentRating.toFixed(1)})`,
      });
    } else if (avgOpponentRating < 6) {
      const fixtureBoost = (6 - avgOpponentRating) / 20;
      adjustedRating += fixtureBoost;
      positiveFactors.push({
        factor: 'Favorable Fixtures',
        impact: fixtureBoost * 10,
        description: `Weaker upcoming opponents (avg rating: ${avgOpponentRating.toFixed(1)})`,
      });
    }
  }
  
  // Clamp rating
  const predictedRating = Math.max(1, Math.min(10, adjustedRating));
  
  // Calculate rating range based on consistency
  const rangeMultiplier = playerData.consistencyScore > 70 ? 0.3 :
                          playerData.consistencyScore > 50 ? 0.5 : 0.7;
  const ratingRange = {
    min: Math.max(1, predictedRating - rangeMultiplier),
    max: Math.min(10, predictedRating + rangeMultiplier),
  };
  
  // Calculate expected contributions
  const matchMultiplier = horizon === 'NEXT_MATCH' ? 1 :
                          horizon === 'NEXT_WEEK' ? 2 :
                          horizon === 'NEXT_MONTH' ? 5 :
                          playerData.matchesPlayed > 0 
                            ? Math.round(38 * (playerData.minutesPlayed / (playerData.matchesPlayed * 90)))
                            : 20;
  
  const perMatchGoals = playerData.matchesPlayed > 0
    ? playerData.goalsOrContributions / playerData.matchesPlayed
    : 0;
  const perMatchAssists = playerData.matchesPlayed > 0
    ? playerData.assists / playerData.matchesPlayed
    : 0;
  
  const expectedContributions = [
    {
      metric: 'Rating',
      predicted: Math.round(predictedRating * 10) / 10,
      confidence: playerData.consistencyScore,
      seasonAverage: playerData.seasonRating,
    },
    {
      metric: sportConfig.keyMetrics[0]?.displayName ?? 'Goals',
      predicted: Math.round(perMatchGoals * matchMultiplier * 10) / 10,
      confidence: Math.min(90, playerData.matchesPlayed * 3),
      seasonAverage: Math.round(perMatchGoals * 10) / 10,
    },
    {
      metric: 'Assists',
      predicted: Math.round(perMatchAssists * matchMultiplier * 10) / 10,
      confidence: Math.min(90, playerData.matchesPlayed * 3),
      seasonAverage: Math.round(perMatchAssists * 10) / 10,
    },
  ];
  
  // Determine current form category
  let currentForm: PerformancePrediction['currentForm'] = 'AVERAGE';
  if (playerData.formScore >= FORM_THRESHOLDS.EXCELLENT) currentForm = 'EXCELLENT';
  else if (playerData.formScore >= FORM_THRESHOLDS.GOOD) currentForm = 'GOOD';
  else if (playerData.formScore >= FORM_THRESHOLDS.AVERAGE) currentForm = 'AVERAGE';
  else if (playerData.formScore >= FORM_THRESHOLDS.POOR) currentForm = 'POOR';
  else currentForm = 'CRITICAL';
  
  // Determine confidence
  const confidence: PerformancePrediction['confidence'] = 
    playerData.matchesPlayed >= 20 && playerData.consistencyScore > 60 ? 'HIGH' :
    playerData.matchesPlayed >= 10 ? 'MEDIUM' : 'LOW';
  
  // Build prediction
  const prediction: PerformancePrediction = {
    playerId,
    playerName: playerData.name,
    sport: playerData.sport,
    position: playerData.position,
    timeHorizon: horizon,
    predictedRating: Math.round(predictedRating * 10) / 10,
    ratingRange,
    expectedContributions,
    currentForm,
    formTrend,
    formScore: playerData.formScore,
    positiveFactors: positiveFactors.sort((a, b) => b.impact - a.impact),
    negativeFactors: negativeFactors.sort((a, b) => a.impact - b.impact),
    upcomingFixtures: playerData.upcomingFixtures?.map(f => ({
      matchId: f.matchId,
      opponent: f.opponent,
      expectedDifficulty: Math.round(f.opponentRating),
    })),
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + CACHE_TTL[horizon]),
    modelVersion: PERFORMANCE_MODEL_VERSION,
    confidence,
    dataPoints: playerData.matchesPlayed,
  };
  
  // Cache result
  performanceCache.predictions.set(cacheKey, {
    data: prediction,
    expiresAt: new Date(Date.now() + CACHE_TTL[horizon]),
  });
  
  return prediction;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateFormTrend(
  last5: number[],
  last10: number[]
): 'IMPROVING' | 'STABLE' | 'DECLINING' {
  if (last5.length < 3) return 'STABLE';
  
  const recent3Avg = last5.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const older3Avg = (last5.length >= 5 ? last5.slice(2, 5) : last10.slice(3, 6))
    .reduce((a, b) => a + b, 0) / 3;
  
  const difference = recent3Avg - older3Avg;
  
  if (difference > 0.3) return 'IMPROVING';
  if (difference < -0.3) return 'DECLINING';
  return 'STABLE';
}

// =============================================================================
// TEAM PERFORMANCE PREDICTION
// =============================================================================

/**
 * Predict team performance
 */
export async function predictTeamPerformance(
  teamId: string,
  teamData: {
    name: string;
    sport: Sport;
    
    // Form
    last5Results: ('W' | 'D' | 'L')[];
    last10Results: ('W' | 'D' | 'L')[];
    homeForm: number;
    awayForm: number;
    
    // Stats
    goalsFor: number;
    goalsAgainst: number;
    matchesPlayed: number;
    
    // Squad
    averageSquadRating: number;
    keyPlayersAvailable: number;
    injuredCount: number;
  },
  horizon: TimeHorizon = 'NEXT_MATCH'
): Promise<{
  teamId: string;
  teamName: string;
  sport: Sport;
  timeHorizon: TimeHorizon;
  predictedPoints: number;
  predictedGoalsFor: number;
  predictedGoalsAgainst: number;
  formAnalysis: {
    currentForm: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    homeStrength: number;
    awayStrength: number;
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  generatedAt: Date;
}> {
  // Calculate form metrics
  const last5Points = teamData.last5Results.reduce((sum, r) => 
    sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0
  );
  const last10Points = teamData.last10Results.reduce((sum, r) => 
    sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0
  );
  
  const formScore = (last5Points / 15) * 100;
  
  // Determine form category
  let currentForm: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL' = 'AVERAGE';
  if (formScore >= 80) currentForm = 'EXCELLENT';
  else if (formScore >= 60) currentForm = 'GOOD';
  else if (formScore >= 40) currentForm = 'AVERAGE';
  else if (formScore >= 20) currentForm = 'POOR';
  else currentForm = 'CRITICAL';
  
  // Calculate trend
  const recentPoints = teamData.last5Results.slice(0, 3).reduce((sum, r) => 
    sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0
  );
  const olderPoints = teamData.last5Results.slice(2, 5).reduce((sum, r) => 
    sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0
  );
  
  const trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 
    recentPoints > olderPoints + 2 ? 'IMPROVING' :
    recentPoints < olderPoints - 2 ? 'DECLINING' : 'STABLE';
  
  // Predict points based on horizon
  const matchMultiplier = horizon === 'NEXT_MATCH' ? 1 :
                          horizon === 'NEXT_WEEK' ? 2 :
                          horizon === 'NEXT_MONTH' ? 5 : 20;
  
  const avgPointsPerMatch = teamData.matchesPlayed > 0
    ? (teamData.last10Results.reduce((sum, r) => sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0) / teamData.last10Results.length)
    : 1.5;
  
  // Adjust for squad availability
  const availabilityFactor = teamData.keyPlayersAvailable / 100;
  const predictedPoints = Math.round(avgPointsPerMatch * matchMultiplier * availabilityFactor * 10) / 10;
  
  // Predict goals
  const avgGoalsFor = teamData.matchesPlayed > 0 
    ? teamData.goalsFor / teamData.matchesPlayed 
    : 1.5;
  const avgGoalsAgainst = teamData.matchesPlayed > 0 
    ? teamData.goalsAgainst / teamData.matchesPlayed 
    : 1.5;
  
  const predictedGoalsFor = Math.round(avgGoalsFor * matchMultiplier * availabilityFactor * 10) / 10;
  const predictedGoalsAgainst = Math.round(avgGoalsAgainst * matchMultiplier * 10) / 10;
  
  return {
    teamId,
    teamName: teamData.name,
    sport: teamData.sport,
    timeHorizon: horizon,
    predictedPoints,
    predictedGoalsFor,
    predictedGoalsAgainst,
    formAnalysis: {
      currentForm,
      trend,
      homeStrength: teamData.homeForm,
      awayStrength: teamData.awayForm,
    },
    confidence: teamData.matchesPlayed >= 15 ? 'HIGH' :
                teamData.matchesPlayed >= 8 ? 'MEDIUM' : 'LOW',
    generatedAt: new Date(),
  };
}

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

/**
 * Invalidate performance predictions for a player
 */
export function invalidatePerformancePredictions(playerId: string): number {
  let count = 0;
  for (const [key] of performanceCache.predictions) {
    if (key.includes(playerId)) {
      performanceCache.predictions.delete(key);
      count++;
    }
  }
  return count;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  predictPlayerPerformance,
  predictTeamPerformance,
  invalidatePerformancePredictions,
  FORM_THRESHOLDS,
  PERFORMANCE_MODEL_VERSION,
};
