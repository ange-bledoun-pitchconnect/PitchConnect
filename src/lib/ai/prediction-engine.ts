/**
 * ============================================================================
 * 🤖 PITCHCONNECT AI - PREDICTION ENGINE v7.10.1
 * ============================================================================
 * Enterprise algorithmic prediction engine for all 12 sports
 * Uses statistical modeling, form analysis, and feature-based predictions
 * ============================================================================
 */

import type { Sport } from './types';
import type {
  MatchFeatureVector,
  PlayerFeatureVector,
  TeamFeatureVector,
  MatchPrediction,
  PlayerPrediction,
  TeamPrediction,
  PredictionFactor,
  TeamRecommendation,
} from './types';
import {
  getSportConfig,
  getSportWeights,
  sportHasDraws,
  getScoringTerminology,
  getPositionImportance,
} from './sport-config';

// =============================================================================
// CONSTANTS
// =============================================================================

export const MODEL_VERSION = '7.10.1-enterprise';
const CONFIDENCE_HIGH_THRESHOLD = 25;
const CONFIDENCE_MEDIUM_THRESHOLD = 12;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Normalize a value to a 0-100 scale
 */
function normalizeToScale(
  value: number,
  inputMin: number,
  inputMax: number,
  outputMin: number = 0,
  outputMax: number = 100
): number {
  const normalized = (value - inputMin) / (inputMax - inputMin);
  return Math.max(outputMin, Math.min(outputMax, outputMin + normalized * (outputMax - outputMin)));
}

/**
 * Calculate head-to-head factor
 */
function calculateH2HFactor(features: MatchFeatureVector): { homeScore: number; awayScore: number } {
  const totalH2H = features.h2hTotalMatches;
  
  if (totalH2H === 0) {
    return { homeScore: 50, awayScore: 50 };
  }
  
  const homeWinRate = features.h2hHomeWins / totalH2H;
  const awayWinRate = features.h2hAwayWins / totalH2H;
  const drawRate = features.h2hDraws / totalH2H;
  
  // Include goal difference in H2H analysis
  const goalDiff = features.h2hHomeGoals - features.h2hAwayGoals;
  const normalizedGoalDiff = normalizeToScale(goalDiff, -10, 10, -20, 20);
  
  const homeScore = (homeWinRate * 100) + (drawRate * 50) + normalizedGoalDiff;
  const awayScore = (awayWinRate * 100) + (drawRate * 50) - normalizedGoalDiff;
  
  return {
    homeScore: Math.max(0, Math.min(100, homeScore)),
    awayScore: Math.max(0, Math.min(100, awayScore)),
  };
}

/**
 * Calculate expected goals/points based on sport
 */
function calculateExpectedScore(
  avgScored: number,
  oppAvgConceded: number,
  strengthFactor: number,
  sport: Sport
): number {
  const config = getSportConfig(sport);
  
  // Base expected score from averages
  const baseExpected = (avgScored + oppAvgConceded) / 2;
  
  // Apply strength factor
  const adjusted = baseExpected * (0.5 + strengthFactor * 0.5);
  
  // Sport-specific adjustments
  switch (sport) {
    case 'CRICKET':
      // Cricket scores are much higher
      return Math.max(0, adjusted * 30);
    case 'BASKETBALL':
      // Basketball typically 80-120 points
      return Math.max(0, adjusted * 25);
    case 'AMERICAN_FOOTBALL':
      // NFL typically 17-35 points
      return Math.max(0, adjusted * 8);
    case 'AUSTRALIAN_RULES':
      // AFL typically 60-120 points
      return Math.max(0, adjusted * 20);
    default:
      // Most sports: 0-5 goals/tries typical
      return Math.max(0, adjusted);
  }
}

/**
 * Calculate injury risk score for a player
 */
function calculateInjuryRisk(features: PlayerFeatureVector): number {
  let riskScore = 0;
  
  // Fatigue contribution (40% weight)
  riskScore += (features.fatigueLevel / 100) * 40;
  
  // Historical injury risk (30% weight)
  riskScore += (features.injuryHistoryScore / 100) * 30;
  
  // Recent workload (days since injury - less is more risky) (20% weight)
  const daysFactor = features.daysSinceLastInjury < 30 ? 20 :
                     features.daysSinceLastInjury < 90 ? 10 :
                     features.daysSinceLastInjury < 180 ? 5 : 0;
  riskScore += daysFactor;
  
  // Age factor (10% weight) - older and very young players have higher risk
  const ageFactor = features.age < 18 ? 8 :
                    features.age > 32 ? 10 :
                    features.age > 30 ? 5 : 0;
  riskScore += ageFactor;
  
  // Minutes played factor - overuse risk
  const avgMinutes = features.minutesPlayed / Math.max(features.matchesPlayed, 1);
  if (avgMinutes > 85) riskScore += 5; // Full match regular
  
  return Math.min(100, Math.max(0, riskScore));
}

/**
 * Generate key factors for match prediction
 */
function generateMatchKeyFactors(
  features: MatchFeatureVector,
  homeScore: number,
  awayScore: number,
  sport: Sport
): PredictionFactor[] {
  const factors: PredictionFactor[] = [];
  const terminology = getScoringTerminology(sport);
  
  // Form factor
  if (features.homeRecentForm > features.awayRecentForm + 15) {
    factors.push({
      factor: 'Home Team Form',
      impact: 'POSITIVE',
      weight: 25,
      description: `Home team in significantly better form (${features.homeRecentForm.toFixed(0)}% vs ${features.awayRecentForm.toFixed(0)}%)`,
      value: features.homeRecentForm,
    });
  } else if (features.awayRecentForm > features.homeRecentForm + 15) {
    factors.push({
      factor: 'Away Team Form',
      impact: 'NEGATIVE',
      weight: 25,
      description: `Away team in significantly better form (${features.awayRecentForm.toFixed(0)}% vs ${features.homeRecentForm.toFixed(0)}%)`,
      value: features.awayRecentForm,
    });
  }
  
  // Home advantage
  if (!features.isNeutralVenue) {
    const homeAdvantage = getSportConfig(sport).weights.homeAdvantage;
    factors.push({
      factor: 'Home Advantage',
      impact: 'POSITIVE',
      weight: homeAdvantage,
      description: `Playing at home venue provides ${homeAdvantage}% boost`,
      value: homeAdvantage,
    });
  }
  
  // Squad availability
  if (features.homeKeyPlayersAvailable < 70) {
    factors.push({
      factor: 'Home Squad Issues',
      impact: 'NEGATIVE',
      weight: 15,
      description: `Key player availability at ${features.homeKeyPlayersAvailable.toFixed(0)}%`,
      value: features.homeKeyPlayersAvailable,
    });
  }
  if (features.awayKeyPlayersAvailable < 70) {
    factors.push({
      factor: 'Away Squad Issues',
      impact: 'POSITIVE',
      weight: 15,
      description: `Opposition key player availability at ${features.awayKeyPlayersAvailable.toFixed(0)}%`,
      value: features.awayKeyPlayersAvailable,
    });
  }
  
  // Rest days
  if (features.homeRestDays < 3) {
    factors.push({
      factor: 'Home Team Fatigue',
      impact: 'NEGATIVE',
      weight: 8,
      description: `Only ${features.homeRestDays} days rest since last match`,
      value: features.homeRestDays,
    });
  }
  if (features.awayRestDays < 3) {
    factors.push({
      factor: 'Away Team Fatigue',
      impact: 'POSITIVE',
      weight: 8,
      description: `Opposition only ${features.awayRestDays} days rest`,
      value: features.awayRestDays,
    });
  }
  
  // Head-to-head
  if (features.h2hTotalMatches >= 3) {
    const homeH2HWinRate = (features.h2hHomeWins / features.h2hTotalMatches) * 100;
    if (homeH2HWinRate > 60) {
      factors.push({
        factor: 'Historical Dominance',
        impact: 'POSITIVE',
        weight: 10,
        description: `Home team won ${features.h2hHomeWins} of last ${features.h2hTotalMatches} meetings`,
        value: homeH2HWinRate,
      });
    } else if (homeH2HWinRate < 30) {
      factors.push({
        factor: 'Historical Struggles',
        impact: 'NEGATIVE',
        weight: 10,
        description: `Home team won only ${features.h2hHomeWins} of last ${features.h2hTotalMatches} meetings`,
        value: homeH2HWinRate,
      });
    }
  }
  
  // Scoring patterns
  const homeAvgScored = features.homeGoalsScoredAvg;
  const awayAvgConceded = features.awayGoalsConcededAvg;
  if (homeAvgScored > 2 && awayAvgConceded > 1.5) {
    factors.push({
      factor: `${terminology.primary} Threat`,
      impact: 'POSITIVE',
      weight: 20,
      description: `High-scoring home attack (${homeAvgScored.toFixed(1)}/match) vs leaky defence (${awayAvgConceded.toFixed(1)} conceded/match)`,
      value: homeAvgScored,
    });
  }
  
  return factors.slice(0, 6); // Return top 6 factors
}

/**
 * Generate risk factors for prediction
 */
function generateRiskFactors(features: MatchFeatureVector, confidenceScore: number): string[] {
  const risks: string[] = [];
  
  if (confidenceScore < 10) {
    risks.push('Very close match - outcome highly unpredictable');
  }
  
  if (features.h2hTotalMatches < 3) {
    risks.push('Limited head-to-head data available');
  }
  
  if (features.homeKeyPlayersAvailable < 80 || features.awayKeyPlayersAvailable < 80) {
    risks.push('Key player availability may impact result');
  }
  
  if (features.isKnockout) {
    risks.push('Knockout match - higher stakes may affect performance');
  }
  
  if (features.competitionImportance > 70) {
    risks.push('High-stakes match - form patterns may not apply');
  }
  
  if (features.weatherConditions && features.weatherConditions !== 'CLEAR') {
    risks.push(`Weather conditions (${features.weatherConditions}) may affect play`);
  }
  
  return risks;
}

// =============================================================================
// MATCH PREDICTION ENGINE
// =============================================================================

/**
 * Generate match outcome prediction
 * Uses weighted feature analysis with sport-specific configurations
 */
export function predictMatchOutcome(
  features: MatchFeatureVector,
  sport: Sport = 'FOOTBALL'
): MatchPrediction {
  const weights = getSportWeights(sport);
  const config = getSportConfig(sport);
  
  // Calculate component scores (0-100 scale)
  const homeFormScore = features.homeRecentForm;
  const awayFormScore = features.awayRecentForm;
  
  // Head-to-head factor
  const h2hFactor = calculateH2HFactor(features);
  
  // Home advantage (adjusted by sport)
  const homeAdvantageScore = features.isNeutralVenue ? 0 : weights.homeAdvantage;
  
  // Squad strength differential
  const squadDifferential = features.homeSquadRating - features.awaySquadRating;
  const squadFactor = normalizeToScale(squadDifferential, -50, 50, 0, 100);
  
  // Injury impact
  const homeInjuryImpact = (features.homeKeyPlayersAvailable / 100) * 100;
  const awayInjuryImpact = (features.awayKeyPlayersAvailable / 100) * 100;
  
  // Rest days factor (diminishing returns after 7 days)
  const homeRestFactor = Math.min(features.homeRestDays / 7, 1) * 100;
  const awayRestFactor = Math.min(features.awayRestDays / 7, 1) * 100;
  
  // Competition importance boost
  const importanceMultiplier = 1 + (features.competitionImportance / 200);
  
  // Calculate weighted home and away scores
  const homeRawScore = 
    (homeFormScore * weights.recentForm / 100) +
    (h2hFactor.homeScore * weights.headToHead / 100) +
    (homeAdvantageScore) +
    (squadFactor * weights.squadStrength / 100) +
    (homeInjuryImpact * weights.injuryImpact / 100) +
    (homeRestFactor * weights.restDays / 100);
  
  const awayRawScore = 
    (awayFormScore * weights.recentForm / 100) +
    (h2hFactor.awayScore * weights.headToHead / 100) +
    ((100 - squadFactor) * weights.squadStrength / 100) +
    (awayInjuryImpact * weights.injuryImpact / 100) +
    (awayRestFactor * weights.restDays / 100);
  
  // Apply importance multiplier
  const homeScore = homeRawScore * importanceMultiplier;
  const awayScore = awayRawScore * importanceMultiplier;
  
  // Calculate draw factor (sport-specific)
  const drawBaseProbability = sportHasDraws(sport) ? 22 : 0;
  const scoreDifferential = Math.abs(homeScore - awayScore);
  const drawReduction = Math.min(scoreDifferential * 0.5, drawBaseProbability * 0.7);
  const adjustedDrawProbability = Math.max(drawBaseProbability - drawReduction, 0);
  
  // Convert to probabilities
  const totalScore = homeScore + awayScore + (adjustedDrawProbability / 2);
  let homeWinProbability = Math.round((homeScore / totalScore) * (100 - adjustedDrawProbability));
  let awayWinProbability = Math.round((awayScore / totalScore) * (100 - adjustedDrawProbability));
  let drawProbability = Math.round(adjustedDrawProbability);
  
  // Ensure probabilities sum to 100
  const probabilitySum = homeWinProbability + awayWinProbability + drawProbability;
  if (probabilitySum !== 100) {
    const adjustment = 100 - probabilitySum;
    if (homeWinProbability > awayWinProbability) {
      homeWinProbability += adjustment;
    } else {
      awayWinProbability += adjustment;
    }
  }
  
  // Determine predicted outcome
  let predictedOutcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN' = 'DRAW';
  if (homeWinProbability > awayWinProbability && homeWinProbability > drawProbability) {
    predictedOutcome = 'HOME_WIN';
  } else if (awayWinProbability > homeWinProbability && awayWinProbability > drawProbability) {
    predictedOutcome = 'AWAY_WIN';
  }
  
  // Calculate expected scores
  const expectedHomeScore = calculateExpectedScore(
    features.homeGoalsScoredAvg,
    features.awayGoalsConcededAvg,
    homeScore / 100,
    sport
  );
  const expectedAwayScore = calculateExpectedScore(
    features.awayGoalsScoredAvg,
    features.homeGoalsConcededAvg,
    awayScore / 100,
    sport
  );
  
  // Determine confidence level
  const confidenceScore = Math.abs(homeWinProbability - awayWinProbability);
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (confidenceScore >= CONFIDENCE_HIGH_THRESHOLD) {
    confidence = 'HIGH';
  } else if (confidenceScore >= CONFIDENCE_MEDIUM_THRESHOLD) {
    confidence = 'MEDIUM';
  }
  
  // Generate key factors and risks
  const keyFactors = generateMatchKeyFactors(features, homeScore, awayScore, sport);
  const riskFactors = generateRiskFactors(features, confidenceScore);
  
  return {
    matchId: '',
    homeClubId: features.homeClubId,
    awayClubId: features.awayClubId,
    homeWinProbability,
    drawProbability,
    awayWinProbability,
    predictedOutcome,
    expectedHomeScore: Math.round(expectedHomeScore * 10) / 10,
    expectedAwayScore: Math.round(expectedAwayScore * 10) / 10,
    expectedTotalGoals: Math.round((expectedHomeScore + expectedAwayScore) * 10) / 10,
    confidence,
    confidenceScore: Math.round(confidenceScore * 10) / 10,
    keyFactors,
    riskLevel: confidenceScore < 10 ? 'HIGH' : confidenceScore < 20 ? 'MEDIUM' : 'LOW',
    riskFactors,
    modelVersion: MODEL_VERSION,
    dataPoints: 0,
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    sport,
  };
}

// =============================================================================
// PLAYER PREDICTION ENGINE
// =============================================================================

/**
 * Generate player performance prediction
 */
export function predictPlayerPerformance(
  features: PlayerFeatureVector,
  sport: Sport = 'FOOTBALL'
): PlayerPrediction {
  const config = getSportConfig(sport);
  const terminology = getScoringTerminology(sport);
  
  // Calculate performance projections based on recent form
  const matchAvg = features.matchesPlayed > 0 ? features.goalsScored / features.matchesPlayed : 0;
  const assistAvg = features.matchesPlayed > 0 ? features.assists / features.matchesPlayed : 0;
  
  // Trend factor adjustment
  const trendMultiplier = features.ratingTrend === 'IMPROVING' ? 1.1 :
                          features.ratingTrend === 'DECLINING' ? 0.9 : 1.0;
  
  // Fatigue adjustment
  const fatigueMultiplier = 1 - (features.fatigueLevel / 200);
  
  // Calculate injury risk
  const injuryRiskScore = calculateInjuryRisk(features);
  
  // Calculate predicted metrics
  const predictedRating = Math.min(10, Math.max(1,
    features.averageRating * trendMultiplier * fatigueMultiplier
  ));
  
  // Calculate expected contributions (over next 5 matches)
  const contributionMultiplier = trendMultiplier * fatigueMultiplier;
  const expectedContributions: PlayerPrediction['expectedContributions'] = [
    {
      metric: terminology.primary + 's',
      value: Math.round(matchAvg * 5 * contributionMultiplier * 10) / 10,
      unit: 'per 5 matches',
    },
    {
      metric: 'Assists',
      value: Math.round(assistAvg * 5 * contributionMultiplier * 10) / 10,
      unit: 'per 5 matches',
    },
  ];
  
  // Position-specific metrics
  const positionImportance = getPositionImportance(sport, features.position);
  
  // Calculate expected minutes based on fatigue and importance
  const avgMinutes = features.matchesPlayed > 0
    ? features.minutesPlayed / features.matchesPlayed
    : config.match.standardDuration * 0.8;
  const expectedMinutes = Math.round(avgMinutes * fatigueMultiplier);
  
  // Determine form status
  const formScore = features.formScore;
  let currentForm: PlayerPrediction['formAnalysis']['currentForm'] = 'AVERAGE';
  if (formScore >= 80) currentForm = 'EXCELLENT';
  else if (formScore >= 65) currentForm = 'GOOD';
  else if (formScore <= 35) currentForm = 'POOR';
  else if (formScore <= 20) currentForm = 'CRITICAL';
  
  // Calculate season comparison
  const seasonComparison = Math.round((predictedRating - features.averageRating) / features.averageRating * 100);
  
  // Generate recommendations
  const recommendations = generatePlayerRecommendations(features, injuryRiskScore, sport);
  
  // Generate development insights for youth players
  let developmentInsights: PlayerPrediction['developmentInsights'];
  if (features.isYouth) {
    developmentInsights = {
      areasOfStrength: identifyStrengths(features, sport),
      areasForImprovement: identifyWeaknesses(features, sport),
      potentialCeiling: features.potentialRating,
      timeToReachPotential: calculateDevelopmentTime(features),
    };
  }
  
  // Determine confidence
  const dataPointsCount = features.matchesPlayed;
  const confidence: PlayerPrediction['confidence'] = 
    dataPointsCount >= 20 ? 'HIGH' :
    dataPointsCount >= 10 ? 'MEDIUM' : 'LOW';
  
  return {
    playerId: features.playerId,
    playerName: '',
    position: features.position,
    predictionType: 'PLAYER_PERFORMANCE',
    predictedRating: Math.round(predictedRating * 10) / 10,
    ratingRange: {
      min: Math.round((predictedRating - 0.5) * 10) / 10,
      max: Math.round((predictedRating + 0.5) * 10) / 10,
    },
    expectedContributions,
    injuryRiskScore: Math.round(injuryRiskScore),
    injuryRiskFactors: generateInjuryRiskFactors(features),
    fatigueLevel: features.fatigueLevel,
    recommendedMinutes: expectedMinutes,
    formAnalysis: {
      currentForm,
      trend: features.ratingTrend,
      comparedToSeason: seasonComparison,
    },
    developmentInsights,
    recommendations,
    trainingFocus: generateTrainingFocus(features, sport),
    modelVersion: MODEL_VERSION,
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000),
    confidence,
    confidenceScore: confidence === 'HIGH' ? 85 : confidence === 'MEDIUM' ? 60 : 35,
    dataPoints: dataPointsCount,
    sport,
  };
}

/**
 * Generate player recommendations
 */
function generatePlayerRecommendations(
  features: PlayerFeatureVector,
  injuryRiskScore: number,
  sport: Sport
): string[] {
  const recommendations: string[] = [];
  
  if (injuryRiskScore > 60) {
    recommendations.push('Implement reduced training load to manage injury risk');
    recommendations.push('Consider rotation in upcoming fixtures');
  }
  
  if (features.fatigueLevel > 60) {
    recommendations.push('Prioritize recovery sessions between matches');
    recommendations.push('Monitor sleep and nutrition closely');
  }
  
  if (features.ratingTrend === 'DECLINING') {
    recommendations.push('Schedule one-on-one coaching sessions for confidence building');
    recommendations.push('Review recent match footage to identify areas for improvement');
  }
  
  if (features.consistencyScore < 50) {
    recommendations.push('Focus on mental preparation routines');
    recommendations.push('Work on decision-making under pressure');
  }
  
  if (features.averageRating >= 7.5) {
    recommendations.push('Consider leadership responsibilities within the team');
    recommendations.push('Mentor younger players in the squad');
  }
  
  if (features.isYouth && features.trainingAttendance < 90) {
    recommendations.push('Improve training attendance for consistent development');
  }
  
  // Ensure minimum recommendations
  if (recommendations.length < 2) {
    recommendations.push('Maintain current training intensity');
    recommendations.push('Continue building chemistry with teammates');
  }
  
  return recommendations;
}

/**
 * Generate injury risk factors
 */
function generateInjuryRiskFactors(features: PlayerFeatureVector): string[] {
  const factors: string[] = [];
  
  if (features.fatigueLevel > 70) {
    factors.push('High accumulated fatigue level');
  }
  
  if (features.daysSinceLastInjury < 60) {
    factors.push('Recent injury history increases risk');
  }
  
  if (features.injuryHistoryScore > 50) {
    factors.push('Historical pattern of injuries');
  }
  
  if (features.age > 30) {
    factors.push('Age-related recovery considerations');
  } else if (features.age < 18) {
    factors.push('Youth player - muscle development still ongoing');
  }
  
  const avgMinutes = features.minutesPlayed / Math.max(features.matchesPlayed, 1);
  if (avgMinutes > 85) {
    factors.push('High match load - limited rotation');
  }
  
  return factors;
}

/**
 * Identify player strengths
 */
function identifyStrengths(features: PlayerFeatureVector, sport: Sport): string[] {
  const strengths: string[] = [];
  
  if (features.averageRating >= 7.0) strengths.push('Consistent match performances');
  if (features.consistencyScore >= 70) strengths.push('Reliable and dependable');
  if (features.formScore >= 70) strengths.push('Currently in excellent form');
  if (features.fitnessScore >= 80) strengths.push('Excellent physical condition');
  if (features.trainingAttendance >= 95) strengths.push('Exceptional training commitment');
  
  // Ensure at least 2 strengths
  if (strengths.length < 2) {
    strengths.push('Good attitude and work ethic');
    strengths.push('Developing technical skills');
  }
  
  return strengths.slice(0, 4);
}

/**
 * Identify areas for improvement
 */
function identifyWeaknesses(features: PlayerFeatureVector, sport: Sport): string[] {
  const weaknesses: string[] = [];
  
  if (features.consistencyScore < 50) weaknesses.push('Match-to-match consistency');
  if (features.formScore < 40) weaknesses.push('Current form needs improvement');
  if (features.fitnessScore < 60) weaknesses.push('Physical conditioning');
  if (features.trainingAttendance < 85) weaknesses.push('Training attendance');
  if (features.averageRating < 6.5) weaknesses.push('Overall performance level');
  
  // Ensure at least 2 areas
  if (weaknesses.length < 2) {
    weaknesses.push('Fine-tuning decision making');
    weaknesses.push('Developing leadership qualities');
  }
  
  return weaknesses.slice(0, 4);
}

/**
 * Calculate time to reach potential
 */
function calculateDevelopmentTime(features: PlayerFeatureVector): string {
  const gap = features.potentialRating - features.averageRating;
  const progress = features.developmentProgress / 100;
  
  if (gap <= 0.5) return 'Already near potential';
  if (gap <= 1.0 && progress > 0.7) return '6-12 months';
  if (gap <= 1.5) return '1-2 years';
  if (gap <= 2.5) return '2-4 years';
  return '4+ years';
}

/**
 * Generate training focus areas
 */
function generateTrainingFocus(features: PlayerFeatureVector, sport: Sport): string[] {
  const focus: string[] = [];
  
  if (features.consistencyScore < 60) {
    focus.push('Mental consistency and focus');
  }
  
  if (features.fitnessScore < 70) {
    focus.push('Aerobic conditioning');
  }
  
  if (features.ratingTrend === 'DECLINING') {
    focus.push('Confidence building exercises');
  }
  
  if (features.isYouth) {
    focus.push('Technical skill development');
    focus.push('Tactical awareness');
  }
  
  return focus.slice(0, 3);
}

// =============================================================================
// TEAM PREDICTION ENGINE
// =============================================================================

/**
 * Generate team performance prediction
 */
export function predictTeamPerformance(
  features: TeamFeatureVector,
  sport: Sport = 'FOOTBALL'
): TeamPrediction {
  const config = getSportConfig(sport);
  
  // Calculate form status
  const formScore = features.overallFormScore;
  let currentForm: TeamPrediction['formAnalysis']['currentForm'] = 'AVERAGE';
  if (formScore >= 80) currentForm = 'EXCELLENT';
  else if (formScore >= 65) currentForm = 'GOOD';
  else if (formScore <= 35) currentForm = 'POOR';
  else if (formScore <= 20) currentForm = 'CRITICAL';
  
  // Calculate form trend
  const recentWins = features.last5Results.filter(r => r === 'W').length;
  const trend: TeamPrediction['formAnalysis']['trend'] =
    recentWins >= 4 ? 'IMPROVING' :
    recentWins <= 1 ? 'DECLINING' : 'STABLE';
  
  // Calculate win rate and projected points
  const winRate = features.matchesPlayed > 0 ? features.wins / features.matchesPlayed : 0;
  const drawRate = features.matchesPlayed > 0 ? features.draws / features.matchesPlayed : 0;
  const pointsPerMatch = (winRate * config.scoring.winPoints) + (drawRate * config.scoring.drawPoints);
  
  // Project season finish (assuming 38 match season for most leagues)
  const remainingMatches = 38 - features.matchesPlayed;
  const currentPoints = (features.wins * config.scoring.winPoints) + (features.draws * config.scoring.drawPoints);
  const projectedPoints = Math.round(currentPoints + (remainingMatches * pointsPerMatch));
  
  // Calculate finish positions based on form
  const formAdjustment = (formScore - 50) / 100; // -0.5 to +0.5
  const basePosition = Math.round(10 - (winRate * 15)); // Rough estimate
  
  const projectedFinish = {
    bestCase: Math.max(1, basePosition - 4 + Math.round(formAdjustment * -3)),
    mostLikely: Math.max(1, basePosition + Math.round(formAdjustment * -2)),
    worstCase: Math.min(20, basePosition + 4 + Math.round(formAdjustment * 3)),
  };
  
  // Calculate squad health
  const availabilityRate = 1 - (features.injuredPlayerCount + features.suspendedPlayerCount) / 25;
  const overallFitness = Math.round(availabilityRate * 100 * (features.squadDepth / 100));
  
  const squadHealth: TeamPrediction['squadHealth'] = {
    overallFitness,
    injuryRisk: features.injuredPlayerCount > 4 ? 'HIGH' : features.injuredPlayerCount > 2 ? 'MEDIUM' : 'LOW',
    keyPlayerAvailability: Math.round(availabilityRate * 100),
    depthScore: features.squadDepth,
  };
  
  // Generate SWOT analysis
  const analysis = generateTeamAnalysis(features, sport, currentForm);
  
  // Generate recommendations
  const recommendations = generateTeamRecommendations(features, sport, currentForm);
  
  // Determine confidence
  const confidence: TeamPrediction['confidence'] =
    features.matchesPlayed >= 15 ? 'HIGH' :
    features.matchesPlayed >= 8 ? 'MEDIUM' : 'LOW';
  
  return {
    teamId: features.teamId,
    teamName: '',
    competitionId: features.competitionId,
    projectedFinish,
    projectedPoints,
    formAnalysis: {
      currentForm,
      formScore,
      trend,
      homeVsAway: {
        homeStrength: features.homeFormScore,
        awayStrength: features.awayFormScore,
      },
    },
    analysis,
    squadHealth,
    recommendations,
    modelVersion: MODEL_VERSION,
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000),
    confidence,
    confidenceScore: confidence === 'HIGH' ? 80 : confidence === 'MEDIUM' ? 55 : 30,
    dataPoints: features.matchesPlayed,
    sport,
  };
}

/**
 * Generate team SWOT analysis
 */
function generateTeamAnalysis(
  features: TeamFeatureVector,
  sport: Sport,
  currentForm: TeamPrediction['formAnalysis']['currentForm']
): TeamPrediction['analysis'] {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];
  
  const winRate = features.matchesPlayed > 0 ? features.wins / features.matchesPlayed : 0;
  const goalsPerMatch = features.matchesPlayed > 0 ? features.goalsFor / features.matchesPlayed : 0;
  const concededPerMatch = features.matchesPlayed > 0 ? features.goalsAgainst / features.matchesPlayed : 0;
  
  // Strengths
  if (winRate > 0.6) strengths.push('Strong winning record');
  if (features.cleanSheetPercentage > 40) strengths.push('Excellent defensive organization');
  if (goalsPerMatch > 2) strengths.push('Prolific scoring output');
  if (features.homeFormScore > 70) strengths.push('Dominant home form');
  if (features.squadDepth > 80) strengths.push('Deep squad with quality rotation options');
  if (features.teamChemistryScore > 75) strengths.push('Strong team chemistry and cohesion');
  
  // Weaknesses
  if (concededPerMatch > 1.5) weaknesses.push('Defensive vulnerabilities');
  if (features.awayFormScore < 40) weaknesses.push('Struggles in away fixtures');
  if (features.injuredPlayerCount > 3) weaknesses.push('Injury concerns affecting squad depth');
  if (features.cleanSheetPercentage < 20) weaknesses.push('Inability to keep clean sheets');
  if (goalsPerMatch < 1) weaknesses.push('Struggling to create and convert chances');
  
  // Opportunities
  if (currentForm === 'IMPROVING' || currentForm === 'EXCELLENT') {
    opportunities.push('Momentum to capitalize on in upcoming fixtures');
  }
  if (features.keyPlayerCount >= 5) {
    opportunities.push('Quality players to execute tactical game plans');
  }
  if (features.averageSquadAge < 26) {
    opportunities.push('Young squad with room for development');
  }
  opportunities.push('Potential for improvement in set-piece efficiency');
  
  // Threats
  if (features.injuredPlayerCount > 0) {
    threats.push('Injury concerns may worsen during busy schedule');
  }
  if (currentForm === 'POOR' || currentForm === 'CRITICAL') {
    threats.push('Poor form could affect team confidence');
  }
  if (features.managerTenure < 90) {
    threats.push('New management still implementing philosophy');
  }
  threats.push('Competitive league environment');
  
  // Ensure minimum items
  if (strengths.length === 0) strengths.push('Team cohesion and work ethic');
  if (weaknesses.length === 0) weaknesses.push('Room for improvement in overall consistency');
  if (opportunities.length === 0) opportunities.push('Upcoming fixture list presents winnable matches');
  if (threats.length === 0) threats.push('Need to maintain focus throughout the season');
  
  return { strengths, weaknesses, opportunities, threats };
}

/**
 * Generate team recommendations
 */
function generateTeamRecommendations(
  features: TeamFeatureVector,
  sport: Sport,
  currentForm: TeamPrediction['formAnalysis']['currentForm']
): TeamRecommendation[] {
  const recommendations: TeamRecommendation[] = [];
  
  // Form-based recommendations
  if (currentForm === 'POOR' || currentForm === 'CRITICAL') {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'STRATEGY',
      recommendation: 'Implement defensive-first approach in upcoming matches',
      rationale: 'Current poor form requires stability before attacking ambitions',
      expectedImpact: 'Reduced goals conceded and improved confidence',
      implementation: [
        'Focus on defensive shape in training',
        'Reduce high-pressing intensity temporarily',
        'Prioritize set-piece defending',
      ],
      timeframe: 'Immediate - next 3 matches',
    });
  }
  
  // Squad rotation
  if (features.matchesPlayed > 10 && features.squadDepth > 60) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'LINEUP',
      recommendation: 'Implement strategic squad rotation',
      rationale: `${features.matchesPlayed} matches played - key players need managed rest`,
      expectedImpact: 'Reduced injury risk and maintained squad fitness',
      implementation: [
        'Rotate 2-3 players in less critical fixtures',
        'Prioritize rest for players with highest minutes',
        'Use cup competitions to give fringe players experience',
      ],
      timeframe: 'Ongoing throughout season',
    });
  }
  
  // Injury management
  if (features.injuredPlayerCount > 2) {
    recommendations.push({
      priority: 'HIGH',
      category: 'FITNESS',
      recommendation: 'Enhance injury prevention protocols',
      rationale: `${features.injuredPlayerCount} current injuries affecting squad depth`,
      expectedImpact: 'Reduced injury recurrence and improved availability',
      implementation: [
        'Review training load distribution',
        'Implement additional recovery sessions',
        'Assess injury patterns for prevention insights',
      ],
      timeframe: '2-4 weeks',
    });
  }
  
  // Attacking improvement
  const goalsPerMatch = features.goalsFor / Math.max(features.matchesPlayed, 1);
  if (goalsPerMatch < 1.2) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'TRAINING',
      recommendation: 'Improve attacking efficiency and creativity',
      rationale: `Averaging only ${goalsPerMatch.toFixed(1)} goals per match`,
      expectedImpact: 'Increased goal output and match-winning capability',
      implementation: [
        'Focus on finishing drills in training',
        'Work on attacking movement patterns',
        'Increase set-piece goal threat',
      ],
      timeframe: '4-6 weeks',
    });
  }
  
  // Youth development
  recommendations.push({
    priority: 'LOW',
    category: 'PLAYER_DEVELOPMENT',
    recommendation: 'Integrate youth players into first team setup',
    rationale: 'Long-term squad sustainability requires development pathway',
    expectedImpact: 'Improved squad depth and reduced recruitment costs',
    implementation: [
      'Include 1-2 youth players in matchday squads',
      'Schedule reserve/U21 fixtures for development',
      'Assign senior player mentors for young talents',
    ],
    timeframe: 'Season-long initiative',
  });
  
  return recommendations;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  predictMatchOutcome,
  predictPlayerPerformance,
  predictTeamPerformance,
  calculateInjuryRisk,
  MODEL_VERSION,
};
