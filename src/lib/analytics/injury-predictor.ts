// ============================================================================
// src/lib/analytics/injury-predictor.ts
// 🏥 PitchConnect Enterprise Analytics - Injury Risk Prediction Engine
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// INTEGRATES: Existing cache system, Prediction model, Multi-sport support
// ============================================================================

import { prisma } from '@/lib/prisma';
import { getOrSetCache, deleteFromCache } from '@/lib/cache/redis';
import { logger } from '@/lib/logging';
import {
  getSportMetricConfig,
  getPositionInjuryRisk,
} from './sport-metrics';
import type {
  InjuryRiskAssessment,
  InjuryRiskFactor,
  BodyPartRisk,
} from './types';
import type {
  Sport,
  Position,
  InjuryType,
  PredictionType,
  PredictionStatus,
  PredictionImpact,
} from '@prisma/client';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL_VERSION = '2.0.0-injury';
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const CACHE_PREFIX = 'analytics:injury';

// Risk thresholds
const RISK_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 100,
};

// Workload thresholds
const WORKLOAD_THRESHOLDS = {
  HIGH_MINUTES_PER_MATCH: 85,
  HIGH_MATCHES_30_DAYS: 8,
  LOW_REST_DAYS: 3,
  OVERLOADED_TRAINING: 80,
};

// Body part mapping by injury type
const INJURY_TYPE_BODY_PARTS: Record<InjuryType, string> = {
  MUSCLE: 'Muscle (Hamstring/Quad/Calf)',
  LIGAMENT: 'Ligament (Knee/Ankle)',
  BONE: 'Bone (Fracture/Stress)',
  CONCUSSION: 'Head',
  JOINT: 'Joint (Knee/Hip/Shoulder)',
  TENDON: 'Tendon (Achilles/Patellar)',
  SPRAIN: 'Ankle/Wrist',
  STRAIN: 'Muscle/Groin',
  FRACTURE: 'Bone',
  ILLNESS: 'General Health',
  OTHER: 'Other',
};

// ============================================================================
// MAIN PREDICTION FUNCTION
// ============================================================================

/**
 * Predict injury risk for a player
 * Uses cache-aside pattern with existing cache system
 */
export async function predictInjuryRisk(
  playerId: string,
  forceRefresh: boolean = false
): Promise<InjuryRiskAssessment> {
  const cacheKey = `${CACHE_PREFIX}:${playerId}`;

  // Use cache-aside pattern unless force refresh
  if (!forceRefresh) {
    try {
      const cached = await getOrSetCache<InjuryRiskAssessment>(
        cacheKey,
        async () => generateInjuryPrediction(playerId),
        CACHE_TTL_SECONDS
      );
      return cached;
    } catch (error) {
      logger.warn({ playerId, error }, 'Cache miss, generating fresh prediction');
    }
  }

  // Generate fresh prediction
  return generateInjuryPrediction(playerId);
}

/**
 * Generate injury risk prediction (internal)
 */
async function generateInjuryPrediction(playerId: string): Promise<InjuryRiskAssessment> {
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
            },
          },
        },
        take: 1,
      },
      injuries: {
        orderBy: { dateFrom: 'desc' },
        take: 20,
      },
      matchPerformances: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          minutesPlayed: true,
          startedMatch: true,
          createdAt: true,
          match: {
            select: {
              kickOffTime: true,
            },
          },
        },
      },
      statistics: {
        orderBy: { season: 'desc' },
        take: 1,
      },
    },
  });

  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }

  const sport = player.teamPlayers[0]?.team.club.sport || 'FOOTBALL';
  const playerName = `${player.user.firstName} ${player.user.lastName}`;

  // Calculate all risk factors
  const historicalData = analyzeInjuryHistory(player.injuries);
  const workloadAnalysis = analyzeWorkload(player.matchPerformances, sport);
  const bodyPartRisks = analyzeBodyPartRisks(player.injuries);
  const riskFactors = calculateRiskFactors(player, sport, historicalData, workloadAnalysis);

  // Calculate overall risk score
  const riskScore = calculateOverallRiskScore(riskFactors, historicalData, workloadAnalysis, sport, player.primaryPosition);
  const riskLevel = determineRiskLevel(riskScore);
  const confidence = calculateConfidence(player.matchPerformances.length, player.injuries.length);

  // Generate recommendations
  const recommendations = generateRecommendations(riskLevel, riskFactors, workloadAnalysis);

  const assessment: InjuryRiskAssessment = {
    playerId,
    playerName,
    sport,
    position: player.primaryPosition,
    riskLevel,
    riskScore: Math.round(riskScore),
    confidence: Math.round(confidence),
    riskFactors,
    bodyPartRisks,
    recommendations,
    historicalData,
    workloadAnalysis,
    metadata: {
      modelVersion: MODEL_VERSION,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + CACHE_TTL_SECONDS * 1000),
      dataPointsUsed: player.matchPerformances.length + player.injuries.length,
    },
  };

  // Store prediction in database
  await storePrediction(playerId, assessment, sport);

  logger.info({
    playerId,
    riskLevel,
    riskScore: Math.round(riskScore),
  }, 'Injury prediction generated');

  return assessment;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze player's injury history
 */
function analyzeInjuryHistory(injuries: any[]): InjuryRiskAssessment['historicalData'] {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const injuriesLastYear = injuries.filter(
    (i) => new Date(i.dateFrom) >= oneYearAgo
  );

  // Calculate average recovery days
  const recoveryDays = injuries
    .filter((i) => i.dateFrom && i.dateTo)
    .map((i) => {
      const from = new Date(i.dateFrom);
      const to = new Date(i.dateTo);
      return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    });

  const avgRecoveryDays = recoveryDays.length > 0
    ? Math.round(recoveryDays.reduce((a, b) => a + b, 0) / recoveryDays.length)
    : 0;

  // Find most common injury type
  const injuryTypeCounts = injuries.reduce((acc, i) => {
    acc[i.injuryType] = (acc[i.injuryType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonType = Object.entries(injuryTypeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] as InjuryType | undefined;

  // Days since last injury
  const lastInjury = injuries[0];
  const daysSinceLastInjury = lastInjury
    ? Math.floor((Date.now() - new Date(lastInjury.dateFrom).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    totalInjuries: injuries.length,
    injuriesLastYear: injuriesLastYear.length,
    avgRecoveryDays,
    mostCommonInjuryType: mostCommonType || null,
    daysSinceLastInjury,
  };
}

/**
 * Analyze player workload
 */
function analyzeWorkload(
  performances: any[],
  sport: Sport
): InjuryRiskAssessment['workloadAnalysis'] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPerformances = performances.filter(
    (p) => new Date(p.createdAt) >= thirtyDaysAgo
  );

  const totalMinutes = recentPerformances.reduce(
    (sum, p) => sum + (p.minutesPlayed || 0),
    0
  );

  const avgMinutesPerMatch = recentPerformances.length > 0
    ? totalMinutes / recentPerformances.length
    : 0;

  // Calculate rest days between matches
  let totalRestDays = 0;
  let restDayCount = 0;

  for (let i = 0; i < recentPerformances.length - 1; i++) {
    const current = new Date(recentPerformances[i].match?.kickOffTime || recentPerformances[i].createdAt);
    const next = new Date(recentPerformances[i + 1].match?.kickOffTime || recentPerformances[i + 1].createdAt);
    const daysBetween = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    if (daysBetween > 0) {
      totalRestDays += daysBetween;
      restDayCount++;
    }
  }

  const avgRestDays = restDayCount > 0 ? totalRestDays / restDayCount : 7;

  // Calculate training load score (based on match frequency and minutes)
  let trainingLoadScore = 30; // Base
  trainingLoadScore += (avgMinutesPerMatch / 90) * 30;
  trainingLoadScore += (recentPerformances.length / 8) * 20;
  trainingLoadScore += Math.max(0, (7 - avgRestDays) * 5);
  trainingLoadScore = Math.min(100, Math.round(trainingLoadScore));

  // Determine fatigue level
  let fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (trainingLoadScore > 70) fatigueLevel = 'HIGH';
  else if (trainingLoadScore > 50) fatigueLevel = 'MEDIUM';

  return {
    recentMinutesPlayed: totalMinutes,
    avgMinutesPerMatch: Math.round(avgMinutesPerMatch),
    matchesLast30Days: recentPerformances.length,
    restDaysBetweenMatches: Math.round(avgRestDays * 10) / 10,
    trainingLoadScore,
    fatigueLevel,
  };
}

/**
 * Analyze body part injury risks
 */
function analyzeBodyPartRisks(injuries: any[]): BodyPartRisk[] {
  const bodyPartMap = new Map<string, { count: number; lastDate: Date | null }>();

  for (const injury of injuries) {
    const bodyPart = INJURY_TYPE_BODY_PARTS[injury.injuryType as InjuryType] || 'Other';
    const existing = bodyPartMap.get(bodyPart) || { count: 0, lastDate: null };
    
    existing.count++;
    const injuryDate = new Date(injury.dateFrom);
    if (!existing.lastDate || injuryDate > existing.lastDate) {
      existing.lastDate = injuryDate;
    }
    
    bodyPartMap.set(bodyPart, existing);
  }

  const results: BodyPartRisk[] = [];

  for (const [bodyPart, data] of bodyPartMap.entries()) {
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    
    if (data.count >= 3) riskLevel = 'HIGH';
    else if (data.count >= 2) riskLevel = 'MEDIUM';
    
    // Increase risk if recent injury
    if (data.lastDate) {
      const daysSince = Math.floor(
        (Date.now() - data.lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince < 90 && riskLevel !== 'HIGH') {
        riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
      }
    }

    results.push({
      bodyPart,
      riskLevel,
      previousInjuries: data.count,
      lastInjuryDate: data.lastDate,
    });
  }

  return results.sort((a, b) => {
    const levelOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
  });
}

/**
 * Calculate individual risk factors
 */
function calculateRiskFactors(
  player: any,
  sport: Sport,
  history: InjuryRiskAssessment['historicalData'],
  workload: InjuryRiskAssessment['workloadAnalysis']
): InjuryRiskFactor[] {
  const factors: InjuryRiskFactor[] = [];

  // 1. Injury History Factor
  if (history.injuriesLastYear >= 3) {
    factors.push({
      factor: 'Frequent Injury History',
      impact: 'HIGH',
      score: 25,
      description: `${history.injuriesLastYear} injuries in the past year indicates elevated risk`,
      mitigation: 'Implement preventive training program and regular physio assessments',
    });
  } else if (history.injuriesLastYear >= 1) {
    factors.push({
      factor: 'Recent Injury History',
      impact: 'MEDIUM',
      score: 15,
      description: `${history.injuriesLastYear} injury(ies) in the past year`,
      mitigation: 'Monitor training loads and recovery metrics',
    });
  }

  // 2. Workload Factor
  if (workload.fatigueLevel === 'HIGH') {
    factors.push({
      factor: 'High Training Load',
      impact: 'HIGH',
      score: 20,
      description: `Training load score of ${workload.trainingLoadScore}/100 indicates overload risk`,
      mitigation: 'Reduce match minutes and implement mandatory rest periods',
    });
  } else if (workload.fatigueLevel === 'MEDIUM') {
    factors.push({
      factor: 'Moderate Training Load',
      impact: 'MEDIUM',
      score: 10,
      description: 'Training load is elevated but manageable',
      mitigation: 'Monitor fatigue indicators closely',
    });
  }

  // 3. Rest Days Factor
  if (workload.restDaysBetweenMatches < WORKLOAD_THRESHOLDS.LOW_REST_DAYS) {
    factors.push({
      factor: 'Insufficient Recovery Time',
      impact: 'HIGH',
      score: 18,
      description: `Only ${workload.restDaysBetweenMatches} days average rest between matches`,
      mitigation: 'Rotate players more frequently and extend recovery windows',
    });
  }

  // 4. Minutes Played Factor
  if (workload.avgMinutesPerMatch > WORKLOAD_THRESHOLDS.HIGH_MINUTES_PER_MATCH) {
    factors.push({
      factor: 'High Match Minutes',
      impact: 'MEDIUM',
      score: 12,
      description: `Averaging ${workload.avgMinutesPerMatch} minutes per match`,
      mitigation: 'Plan strategic substitutions to manage playing time',
    });
  }

  // 5. Match Congestion Factor
  if (workload.matchesLast30Days >= WORKLOAD_THRESHOLDS.HIGH_MATCHES_30_DAYS) {
    factors.push({
      factor: 'Match Congestion',
      impact: 'HIGH',
      score: 15,
      description: `${workload.matchesLast30Days} matches in the last 30 days`,
      mitigation: 'Consider resting from non-critical fixtures',
    });
  }

  // 6. Recent Injury Recovery Factor
  if (history.daysSinceLastInjury !== null && history.daysSinceLastInjury < 60) {
    factors.push({
      factor: 'Recent Injury Recovery',
      impact: 'HIGH',
      score: 20,
      description: `Only ${history.daysSinceLastInjury} days since last injury`,
      mitigation: 'Follow graduated return-to-play protocol strictly',
    });
  }

  // 7. Age Factor (calculate from DOB if available)
  const dob = player.user?.dateOfBirth;
  if (dob) {
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365));
    if (age >= 32) {
      factors.push({
        factor: 'Age-Related Risk',
        impact: 'MEDIUM',
        score: 10,
        description: `Player age (${age}) increases recovery time and injury susceptibility`,
        mitigation: 'Tailored training program with enhanced recovery protocols',
      });
    }
  }

  // 8. Position-Specific Risk
  const positionRisk = player.primaryPosition 
    ? getPositionInjuryRisk(sport, player.primaryPosition)
    : 0.5;
  
  if (positionRisk > 0.75) {
    factors.push({
      factor: 'High-Risk Position',
      impact: 'MEDIUM',
      score: 8,
      description: `Position has elevated injury risk in ${sport}`,
      mitigation: 'Position-specific conditioning and protective techniques',
    });
  }

  // Sort by score descending
  return factors.sort((a, b) => b.score - a.score);
}

/**
 * Calculate overall risk score
 */
function calculateOverallRiskScore(
  factors: InjuryRiskFactor[],
  history: InjuryRiskAssessment['historicalData'],
  workload: InjuryRiskAssessment['workloadAnalysis'],
  sport: Sport,
  position: Position | null
): number {
  // Base score from factors
  let score = factors.reduce((sum, f) => sum + f.score, 0);

  // Add position-specific base risk
  const positionRisk = position ? getPositionInjuryRisk(sport, position) : 0.5;
  score += positionRisk * 15;

  // Adjust for chronic injury patterns
  if (history.totalInjuries >= 5) {
    score *= 1.2; // 20% increase for chronic injury history
  }

  // Ensure score is within bounds
  return Math.min(100, Math.max(0, score));
}

/**
 * Determine risk level from score
 */
function determineRiskLevel(score: number): InjuryRiskAssessment['riskLevel'] {
  if (score >= RISK_THRESHOLDS.HIGH) return 'CRITICAL';
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'HIGH';
  if (score >= RISK_THRESHOLDS.LOW) return 'MEDIUM';
  return 'LOW';
}

/**
 * Calculate confidence score
 */
function calculateConfidence(performanceCount: number, injuryCount: number): number {
  // More data = higher confidence
  let confidence = 50; // Base

  // Performance data
  if (performanceCount >= 20) confidence += 30;
  else if (performanceCount >= 10) confidence += 20;
  else if (performanceCount >= 5) confidence += 10;

  // Injury history data (paradoxically, more injuries = better model accuracy)
  if (injuryCount >= 3) confidence += 15;
  else if (injuryCount >= 1) confidence += 10;

  return Math.min(95, confidence);
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  riskLevel: InjuryRiskAssessment['riskLevel'],
  factors: InjuryRiskFactor[],
  workload: InjuryRiskAssessment['workloadAnalysis']
): string[] {
  const recommendations: string[] = [];

  // Critical risk recommendations
  if (riskLevel === 'CRITICAL') {
    recommendations.push('URGENT: Comprehensive medical evaluation recommended');
    recommendations.push('Consider mandatory rest period of 3-5 days');
    recommendations.push('Implement intensive injury prevention protocol');
  }

  // High risk recommendations
  if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
    recommendations.push('Reduce training intensity by 20-30%');
    recommendations.push('Schedule additional physiotherapy sessions');
    if (workload.matchesLast30Days > 6) {
      recommendations.push('Rest from next non-critical fixture');
    }
  }

  // Medium risk recommendations
  if (riskLevel === 'MEDIUM') {
    recommendations.push('Monitor fatigue levels closely');
    recommendations.push('Ensure adequate sleep and nutrition');
    recommendations.push('Include injury prevention exercises in warm-up');
  }

  // Factor-specific recommendations
  for (const factor of factors.slice(0, 3)) {
    if (factor.mitigation && !recommendations.includes(factor.mitigation)) {
      recommendations.push(factor.mitigation);
    }
  }

  // Workload-specific
  if (workload.fatigueLevel === 'HIGH') {
    recommendations.push('Implement active recovery sessions');
  }

  return recommendations.slice(0, 8);
}

// ============================================================================
// DATABASE INTEGRATION
// ============================================================================

/**
 * Store prediction in database using Prediction model
 */
async function storePrediction(
  playerId: string,
  assessment: InjuryRiskAssessment,
  sport: Sport
): Promise<void> {
  try {
    // Get player's club and org for proper relations
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

    // Map risk level to impact
    const impactMap: Record<string, PredictionImpact> = {
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW',
    };

    await prisma.prediction.create({
      data: {
        type: 'INJURY_RISK' as PredictionType,
        status: 'ACTIVE' as PredictionStatus,
        impact: impactMap[assessment.riskLevel],
        title: `Injury Risk Assessment: ${assessment.playerName}`,
        description: `${assessment.riskLevel} risk (${assessment.riskScore}/100) - ${assessment.riskFactors[0]?.factor || 'General assessment'}`,
        confidence: assessment.confidence / 100,
        relatedEntityType: 'PLAYER',
        relatedEntityId: playerId,
        relatedEntityName: assessment.playerName,
        sport,
        modelVersion: MODEL_VERSION,
        dataSourcesUsed: ['match_performances', 'injury_history', 'workload_data'],
        validFrom: new Date(),
        validUntil: assessment.metadata.validUntil,
        predictionData: assessment as any,
        tags: [
          `risk:${assessment.riskLevel.toLowerCase()}`,
          `sport:${sport.toLowerCase()}`,
          assessment.position ? `position:${assessment.position.toLowerCase()}` : null,
        ].filter(Boolean) as string[],
        isPublic: false,
        createdBy: { connect: { id: player.userId } },
        ...(organisationId && { organisation: { connect: { id: organisationId } } }),
        ...(clubId && { club: { connect: { id: clubId } } }),
      },
    });

    logger.debug({ playerId }, 'Injury prediction stored in database');
  } catch (error) {
    logger.error({ playerId, error }, 'Failed to store injury prediction');
    // Don't throw - prediction was generated successfully
  }
}

// ============================================================================
// CACHE INVALIDATION
// ============================================================================

/**
 * Invalidate cached prediction for a player
 */
export async function invalidateInjuryPrediction(playerId: string): Promise<void> {
  const cacheKey = `${CACHE_PREFIX}:${playerId}`;
  await deleteFromCache(cacheKey);
  logger.debug({ playerId }, 'Injury prediction cache invalidated');
}

/**
 * Invalidate all injury predictions for a team
 */
export async function invalidateTeamInjuryPredictions(teamId: string): Promise<void> {
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: { teamId, isActive: true },
    select: { playerId: true },
  });

  for (const tp of teamPlayers) {
    await invalidateInjuryPrediction(tp.playerId);
  }

  logger.info({ teamId, playerCount: teamPlayers.length }, 'Team injury predictions invalidated');
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Generate injury predictions for all players in a team
 */
export async function predictTeamInjuryRisks(
  teamId: string
): Promise<InjuryRiskAssessment[]> {
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: { teamId, isActive: true },
    select: { playerId: true },
  });

  const predictions: InjuryRiskAssessment[] = [];

  for (const tp of teamPlayers) {
    try {
      const prediction = await predictInjuryRisk(tp.playerId);
      predictions.push(prediction);
    } catch (error) {
      logger.error({ playerId: tp.playerId, error }, 'Failed to predict injury risk');
    }
  }

  // Sort by risk score descending
  return predictions.sort((a, b) => b.riskScore - a.riskScore);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  RISK_THRESHOLDS,
  WORKLOAD_THRESHOLDS,
  MODEL_VERSION as INJURY_MODEL_VERSION,
};