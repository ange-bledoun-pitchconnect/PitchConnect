// ============================================================================
// src/lib/ai/prediction-engine.ts
// 🤖 PitchConnect Enterprise AI - Core Prediction Engine
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// ALGORITHMS: Statistical modeling, form analysis, feature-based predictions
// ============================================================================

import type { Sport, Position, PredictionType } from '@prisma/client';
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
import { getSportConfig, getSportWeights, sportHasDraws } from './sport-config';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL_VERSION = '2.0.0-enterprise';
const CONFIDENCE_HIGH_THRESHOLD = 25;
const CONFIDENCE_MEDIUM_THRESHOLD = 12;

// ============================================================================
// MATCH PREDICTION ENGINE
// ============================================================================

/**
 * Generate match outcome prediction
 * Uses weighted feature analysis with sport-specific configurations
 */
export function predictMatchOutcome(
  features: MatchFeatureVector,
  sport: Sport
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
  const squadDifferential = (features.homeSquadRating - features.awaySquadRating);
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
    (squadFactor * weights.squadStrength / 100 * -1 + 50) +
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
  
  // Calculate expected goals
  const expectedHomeScore = calculateExpectedGoals(features.homeGoalsScoredAvg, features.awayGoalsConcededAvg, homeScore / 100, sport);
  const expectedAwayScore = calculateExpectedGoals(features.awayGoalsScoredAvg, features.homeGoalsConcededAvg, awayScore / 100, sport);
  
  // Determine confidence level
  const confidenceScore = Math.abs(homeWinProbability - awayWinProbability);
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (confidenceScore >= CONFIDENCE_HIGH_THRESHOLD) {
    confidence = 'HIGH';
  } else if (confidenceScore >= CONFIDENCE_MEDIUM_THRESHOLD) {
    confidence = 'MEDIUM';
  }
  
  // Generate key factors
  const keyFactors = generateMatchKeyFactors(features, homeScore, awayScore, sport);
  
  // Generate risk assessment
  const riskFactors = generateRiskFactors(features, confidenceScore);
  
  return {
    matchId: '', // To be set by caller
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
    dataPoints: 0, // To be set by caller
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };
}

// ============================================================================
// PLAYER PREDICTION ENGINE
// ============================================================================

/**
 * Generate player performance prediction
 */
export function predictPlayerPerformance(
  features: PlayerFeatureVector,
  sport: Sport
): PlayerPrediction {
  const config = getSportConfig(sport);
  
  // Calculate performance projections based on recent form
  const matchAvg = features.matchesPlayed > 0 ? features.goalsScored / features.matchesPlayed : 0;
  const assistAvg = features.matchesPlayed > 0 ? features.assists / features.matchesPlayed : 0;
  
  // Trend factor adjustment
  const trendMultiplier = features.ratingTrend === 'IMPROVING' ? 1.1 : 
                          features.ratingTrend === 'DECLINING' ? 0.9 : 1.0;
  
  // Fatigue adjustment
  const fatigueMultiplier = 1 - (features.fatigueLevel / 200); // Max 50% reduction
  
  // Calculate injury risk
  const injuryRiskScore = calculateInjuryRisk(features);
  
  // Calculate predicted metrics
  const predictedRating = Math.min(10, Math.max(1, 
    features.averageRating * trendMultiplier * fatigueMultiplier
  ));
  
  const predictedGoals = Math.round(matchAvg * 5 * trendMultiplier * fatigueMultiplier * 10) / 10;
  const predictedAssists = Math.round(assistAvg * 5 * trendMultiplier * fatigueMultiplier * 10) / 10;
  
  // Calculate expected minutes
  const expectedMinutes = Math.round(
    (features.minutesPlayed / Math.max(features.matchesPlayed, 1)) * fatigueMultiplier
  );
  
  // Generate development insights
  const development = generateDevelopmentInsights(features, sport);
  
  // Calculate weekly/monthly/season changes
  const weeklyChange = features.ratingTrend === 'IMPROVING' ? 0.2 : 
                       features.ratingTrend === 'DECLINING' ? -0.15 : 0;
  
  // Determine confidence
  const confidence = features.matchesPlayed >= 10 ? 'HIGH' : 
                     features.matchesPlayed >= 5 ? 'MEDIUM' : 'LOW';
  
  // Generate recommendations
  const recommendations = generatePlayerRecommendations(features, injuryRiskScore, sport);
  
  return {
    playerId: features.playerId,
    playerName: '', // To be set by caller
    position: features.position,
    sport,
    predictions: {
      nextMatchRating: Math.round(predictedRating * 10) / 10,
      goalsNext5Matches: predictedGoals,
      assistsNext5Matches: predictedAssists,
      minutesExpected: expectedMinutes,
    },
    risks: {
      injuryRisk: injuryRiskScore > 70 ? 'HIGH' : injuryRiskScore > 40 ? 'MEDIUM' : 'LOW',
      injuryRiskScore: Math.round(injuryRiskScore),
      fatigueLevel: features.fatigueLevel > 70 ? 'HIGH' : features.fatigueLevel > 40 ? 'MEDIUM' : 'LOW',
      formDropRisk: features.ratingTrend === 'DECLINING' ? 60 : 20,
    },
    development,
    trends: {
      performanceTrend: features.ratingTrend,
      weeklyChange: Math.round(weeklyChange * 100) / 100,
      monthlyChange: Math.round(weeklyChange * 4 * 100) / 100,
      seasonChange: Math.round(weeklyChange * 16 * 100) / 100,
    },
    recommendations,
    confidence,
    modelVersion: MODEL_VERSION,
    generatedAt: new Date(),
  };
}

// ============================================================================
// TEAM PREDICTION ENGINE
// ============================================================================

/**
 * Generate team analytics prediction
 */
export function predictTeamPerformance(
  features: TeamFeatureVector,
  sport: Sport,
  totalTeamsInCompetition: number = 20
): TeamPrediction {
  const config = getSportConfig(sport);
  
  // Calculate form score
  const pointsPerMatch = features.matchesPlayed > 0 
    ? ((features.wins * config.scoring.winPoints) + (features.draws * config.scoring.drawPoints)) / features.matchesPlayed
    : 0;
  
  const maxPointsPerMatch = config.scoring.maxPointsPerMatch;
  const formPercentage = (pointsPerMatch / maxPointsPerMatch) * 100;
  
  // Determine form category
  let currentForm: TeamPrediction['formAnalysis']['currentForm'] = 'AVERAGE';
  if (formPercentage >= 80) currentForm = 'EXCELLENT';
  else if (formPercentage >= 65) currentForm = 'GOOD';
  else if (formPercentage >= 40) currentForm = 'AVERAGE';
  else if (formPercentage >= 25) currentForm = 'POOR';
  else currentForm = 'CRITICAL';
  
  // Calculate goal differential trend
  const goalDifferential = features.goalsFor - features.goalsAgainst;
  const goalDifferentialPerMatch = features.matchesPlayed > 0 ? goalDifferential / features.matchesPlayed : 0;
  
  // Project season finish
  const matchesRemaining = Math.max(0, (totalTeamsInCompetition - 1) * 2 - features.matchesPlayed);
  const predictedPoints = Math.round(
    ((features.wins * config.scoring.winPoints) + (features.draws * config.scoring.drawPoints)) +
    (matchesRemaining * pointsPerMatch)
  );
  
  // Position prediction (simplified linear projection)
  const predictedPosition = features.leaguePosition ?? Math.ceil(totalTeamsInCompetition / 2);
  
  // Calculate promotion/relegation probabilities
  const promotionProbability = features.leaguePosition && features.leaguePosition <= 3 
    ? Math.max(0, 80 - (features.leaguePosition * 20)) 
    : 0;
  
  const relegationRisk = features.leaguePosition && features.leaguePosition >= totalTeamsInCompetition - 3
    ? Math.min(100, (features.leaguePosition - totalTeamsInCompetition + 4) * 25)
    : 0;
  
  // Title chance
  const titleChance = features.leaguePosition === 1 && features.pointsFromTop === 0
    ? Math.min(80, formPercentage)
    : features.pointsFromTop && features.pointsFromTop <= 6
      ? Math.max(0, 50 - features.pointsFromTop * 8)
      : 0;
  
  // Squad health assessment
  const squadHealth = {
    overallFitness: Math.round((100 - (features.injuredPlayerCount * 5)) * features.squadDepth / 100),
    injuryCount: features.injuredPlayerCount,
    suspensionCount: 0, // To be set by caller
    fatigueLevel: features.matchesPlayed > 10 ? 'MEDIUM' : 'LOW' as const,
    squadDepthScore: Math.round(features.squadDepth),
  };
  
  // Generate SWOT analysis
  const analysis = generateTeamAnalysis(features, sport, currentForm);
  
  // Generate recommendations
  const recommendations = generateTeamRecommendations(features, sport, currentForm);
  
  // Determine confidence
  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' = features.matchesPlayed >= 15 ? 'HIGH' : 
                    features.matchesPlayed >= 8 ? 'MEDIUM' : 'LOW';
  
  return {
    teamId: features.teamId,
    teamName: '', // To be set by caller
    clubId: features.clubId,
    sport,
    seasonProjection: {
      predictedPosition,
      predictedPoints,
      promotionProbability: Math.round(promotionProbability),
      relegationRisk: Math.round(relegationRisk),
      titleChanceProbability: Math.round(titleChance),
    },
    formAnalysis: {
      currentForm,
      formScore: Math.round(formPercentage),
      formTrend: features.goalDifferentialTrend > 0 ? 'IMPROVING' : 
                 features.goalDifferentialTrend < 0 ? 'DECLINING' : 'STABLE',
      expectedPointsNext5: Math.round(pointsPerMatch * 5 * 10) / 10,
    },
    squadHealth,
    analysis,
    recommendations,
    confidence,
    modelVersion: MODEL_VERSION,
    generatedAt: new Date(),
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate head-to-head factor scores
 */
function calculateH2HFactor(features: MatchFeatureVector): { homeScore: number; awayScore: number } {
  if (features.h2hTotalMatches === 0) {
    return { homeScore: 50, awayScore: 50 }; // Neutral if no history
  }
  
  const homeWinRate = features.h2hHomeWins / features.h2hTotalMatches;
  const awayWinRate = features.h2hAwayWins / features.h2hTotalMatches;
  
  return {
    homeScore: homeWinRate * 100,
    awayScore: awayWinRate * 100,
  };
}

/**
 * Calculate expected goals based on attack/defense ratings
 */
function calculateExpectedGoals(
  scoringAvg: number,
  concedingAvg: number,
  strengthFactor: number,
  sport: Sport
): number {
  const config = getSportConfig(sport);
  
  // Base expected goals from historical averages
  const baseExpected = (scoringAvg + concedingAvg) / 2;
  
  // Apply strength factor adjustment
  const adjustedExpected = baseExpected * (0.5 + strengthFactor);
  
  // Sport-specific scoring adjustments
  const scoringMultiplier = sport === 'BASKETBALL' ? 0.01 : // Points → Goals equivalent
                            sport === 'CRICKET' ? 0.005 :   // Runs → Goals equivalent
                            1;
  
  return Math.max(0, adjustedExpected * scoringMultiplier);
}

/**
 * Calculate injury risk score (0-100)
 */
function calculateInjuryRisk(features: PlayerFeatureVector): number {
  let riskScore = 0;
  
  // Base risk from injury history
  riskScore += features.injuryHistory * 20;
  
  // Fatigue contribution
  riskScore += features.fatigueLevel * 0.3;
  
  // High training load risk
  if (features.recentTrainingLoad > 80) {
    riskScore += 15;
  }
  
  // Short rest period risk
  if (features.daysSinceLastMatch < 3) {
    riskScore += 20;
  } else if (features.daysSinceLastMatch < 5) {
    riskScore += 10;
  }
  
  // High minutes played risk
  if (features.minutesPlayed / Math.max(features.matchesPlayed, 1) > 85) {
    riskScore += 10;
  }
  
  return Math.min(100, Math.max(0, riskScore));
}

/**
 * Normalize a value to a scale
 */
function normalizeToScale(value: number, min: number, max: number, targetMin: number, targetMax: number): number {
  const normalized = (value - min) / (max - min);
  return targetMin + (normalized * (targetMax - targetMin));
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
  
  // Form comparison
  const formDiff = features.homeRecentForm - features.awayRecentForm;
  factors.push({
    factor: 'Recent Form',
    impact: formDiff > 10 ? 'POSITIVE' : formDiff < -10 ? 'NEGATIVE' : 'NEUTRAL',
    weight: 25,
    description: `Home team form: ${features.homeRecentForm.toFixed(0)}% vs Away: ${features.awayRecentForm.toFixed(0)}%`,
    dataPoint: `${formDiff > 0 ? '+' : ''}${formDiff.toFixed(0)}%`,
  });
  
  // Squad strength
  const squadDiff = features.homeSquadRating - features.awaySquadRating;
  factors.push({
    factor: 'Squad Strength',
    impact: squadDiff > 5 ? 'POSITIVE' : squadDiff < -5 ? 'NEGATIVE' : 'NEUTRAL',
    weight: 20,
    description: `Squad rating differential: ${squadDiff > 0 ? '+' : ''}${squadDiff.toFixed(1)}`,
    dataPoint: squadDiff.toFixed(1),
  });
  
  // Home advantage
  if (!features.isNeutralVenue) {
    factors.push({
      factor: 'Home Advantage',
      impact: 'POSITIVE',
      weight: getSportWeights(sport).homeAdvantage,
      description: `Playing at home provides tactical advantage`,
      dataPoint: `+${getSportWeights(sport).homeAdvantage}%`,
    });
  }
  
  // Key players availability
  const availabilityDiff = features.homeKeyPlayersAvailable - features.awayKeyPlayersAvailable;
  if (Math.abs(availabilityDiff) > 10) {
    factors.push({
      factor: 'Key Players Available',
      impact: availabilityDiff > 0 ? 'POSITIVE' : 'NEGATIVE',
      weight: 15,
      description: `Home: ${features.homeKeyPlayersAvailable}% vs Away: ${features.awayKeyPlayersAvailable}% key players fit`,
      dataPoint: `${availabilityDiff > 0 ? '+' : ''}${availabilityDiff}%`,
    });
  }
  
  // Rest days
  const restDiff = features.homeRestDays - features.awayRestDays;
  if (Math.abs(restDiff) >= 2) {
    factors.push({
      factor: 'Rest Advantage',
      impact: restDiff > 0 ? 'POSITIVE' : 'NEGATIVE',
      weight: 8,
      description: `Home: ${features.homeRestDays} days rest vs Away: ${features.awayRestDays} days`,
      dataPoint: `${restDiff > 0 ? '+' : ''}${restDiff} days`,
    });
  }
  
  return factors;
}

/**
 * Generate risk factors for prediction
 */
function generateRiskFactors(features: MatchFeatureVector, confidenceScore: number): string[] {
  const risks: string[] = [];
  
  if (confidenceScore < 15) {
    risks.push('Low prediction confidence due to similar team strengths');
  }
  
  if (features.h2hTotalMatches < 3) {
    risks.push('Limited head-to-head history between teams');
  }
  
  if (features.homeKeyPlayersAvailable < 80 || features.awayKeyPlayersAvailable < 80) {
    risks.push('Significant injury concerns may affect team performance');
  }
  
  if (features.competitionImportance > 80) {
    risks.push('High-stakes match may produce unpredictable results');
  }
  
  if (Math.abs(features.homeRestDays - features.awayRestDays) >= 3) {
    risks.push('Significant rest disparity may impact fitness levels');
  }
  
  return risks;
}

/**
 * Generate player development insights
 */
function generateDevelopmentInsights(
  features: PlayerFeatureVector,
  sport: Sport
): PlayerPrediction['development'] {
  // Determine current level based on rating
  let currentLevel = 'Developing';
  if (features.averageRating >= 8.5) currentLevel = 'World Class';
  else if (features.averageRating >= 7.5) currentLevel = 'Elite';
  else if (features.averageRating >= 6.5) currentLevel = 'Established';
  else if (features.averageRating >= 5.5) currentLevel = 'Promising';
  
  // Calculate potential (simplified)
  const potentialRating = Math.min(10, features.averageRating + 1 + (features.consistencyScore * 0.5));
  
  // Generate areas based on sport and performance
  const developmentAreas: string[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Generic assessments based on consistency
  if (features.consistencyScore > 70) {
    strengths.push('Highly consistent performances');
  } else if (features.consistencyScore < 40) {
    weaknesses.push('Performance consistency needs improvement');
    developmentAreas.push('Mental conditioning for consistency');
  }
  
  // Trend-based assessments
  if (features.ratingTrend === 'IMPROVING') {
    strengths.push('Strong upward trajectory in recent matches');
    developmentAreas.push('Maintain training intensity to continue growth');
  } else if (features.ratingTrend === 'DECLINING') {
    weaknesses.push('Recent form showing decline');
    developmentAreas.push('Technical refinement and confidence building');
  }
  
  // Physical assessments
  if (features.fatigueLevel > 60) {
    weaknesses.push('Showing signs of fatigue');
    developmentAreas.push('Recovery and load management');
  }
  
  return {
    currentLevel,
    potentialRating: Math.round(potentialRating * 10) / 10,
    developmentAreas,
    strengths,
    weaknesses,
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
  
  // Ensure at least 2 recommendations
  if (recommendations.length < 2) {
    recommendations.push('Maintain current training intensity');
    recommendations.push('Continue building chemistry with teammates');
  }
  
  return recommendations;
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
  
  // Analyze based on metrics
  const winRate = features.matchesPlayed > 0 ? features.wins / features.matchesPlayed : 0;
  const goalDifferential = features.goalsFor - features.goalsAgainst;
  
  // Strengths
  if (winRate > 0.6) strengths.push('Strong winning record');
  if (features.cleanSheetPercentage > 40) strengths.push('Excellent defensive organization');
  if (features.goalsFor / Math.max(features.matchesPlayed, 1) > 2) strengths.push('Prolific scoring output');
  if (features.homeFormScore > 70) strengths.push('Dominant home form');
  if (features.squadDepth > 80) strengths.push('Deep squad with quality rotation options');
  
  // Weaknesses
  if (features.goalsAgainst / Math.max(features.matchesPlayed, 1) > 1.5) weaknesses.push('Defensive vulnerabilities');
  if (features.awayFormScore < 40) weaknesses.push('Struggles in away fixtures');
  if (features.injuredPlayerCount > 3) weaknesses.push('Injury concerns affecting squad depth');
  if (features.cleanSheetPercentage < 20) weaknesses.push('Inability to keep clean sheets');
  
  // Opportunities
  if (currentForm === 'IMPROVING' || currentForm === 'EXCELLENT') {
    opportunities.push('Momentum to capitalize on in upcoming fixtures');
  }
  if (features.keyPlayerCount >= 5) {
    opportunities.push('Quality players to execute tactical game plans');
  }
  opportunities.push('Potential for improvement in set-piece efficiency');
  
  // Threats
  if (features.injuredPlayerCount > 0) {
    threats.push('Injury concerns may worsen during busy schedule');
  }
  if (currentForm === 'POOR' || currentForm === 'CRITICAL') {
    threats.push('Poor form could affect team confidence');
  }
  threats.push('Competitive league environment');
  
  // Ensure at least one item in each category
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
  
  // Strategic recommendations based on form
  if (currentForm === 'POOR' || currentForm === 'CRITICAL') {
    recommendations.push({
      priority: 'HIGH',
      category: 'STRATEGY',
      recommendation: 'Implement defensive-first approach in upcoming matches',
      rationale: 'Current poor form requires stability before attacking ambitions',
      expectedImpact: 'Reduced goals conceded and improved confidence',
      implementation: [
        'Focus on defensive shape in training',
        'Reduce high-pressing intensity temporarily',
        'Prioritize set-piece defending',
      ],
    });
  }
  
  // Squad rotation recommendation
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
    });
  }
  
  // Attacking improvement
  if (features.goalsFor / Math.max(features.matchesPlayed, 1) < 1.2) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'STRATEGY',
      recommendation: 'Improve attacking efficiency and creativity',
      rationale: `Averaging only ${(features.goalsFor / Math.max(features.matchesPlayed, 1)).toFixed(1)} goals per match`,
      expectedImpact: 'Increased goal output and match-winning capability',
      implementation: [
        'Focus on finishing drills in training',
        'Work on attacking movement patterns',
        'Increase set-piece goal threat',
      ],
    });
  }
  
  // Development recommendation
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
  });
  
  return recommendations;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  predictMatchOutcome,
  predictPlayerPerformance,
  predictTeamPerformance,
  MODEL_VERSION,
};