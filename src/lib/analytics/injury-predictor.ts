/**
 * ============================================================================
 * 🏥 PITCHCONNECT ANALYTICS - INJURY PREDICTOR v7.10.1
 * ============================================================================
 * Enterprise injury risk prediction for all 12 sports
 * Integrates with Prisma Injury model and body part enums
 * ============================================================================
 */

import type {
  Sport,
  InjuryType,
  InjurySeverity,
  BodyPart,
  InjuryRiskAssessment,
  InjuryRiskFactor,
  BodyPartRisk,
} from './types';
import { getSportMetricConfig, getPositionInjuryRisk } from './sport-metrics';

// =============================================================================
// CONSTANTS
// =============================================================================

export const INJURY_MODEL_VERSION = '7.10.1-injury';

export const RISK_THRESHOLDS = {
  LOW: 25,
  MODERATE: 50,
  HIGH: 75,
  CRITICAL: 90,
};

export const WORKLOAD_THRESHOLDS = {
  ACWR_SAFE_MIN: 0.8,
  ACWR_SAFE_MAX: 1.3,
  ACWR_DANGER: 1.5,
};

// Body part vulnerability by position category
const POSITION_BODY_PART_RISKS: Record<string, BodyPart[]> = {
  // Football/Soccer
  GOALKEEPER: ['SHOULDER', 'WRIST', 'HAND', 'KNEE'],
  DEFENDER: ['ANKLE', 'KNEE', 'GROIN', 'HAMSTRING'],
  MIDFIELDER: ['HAMSTRING', 'CALF', 'ANKLE', 'GROIN'],
  FORWARD: ['HAMSTRING', 'KNEE', 'ANKLE', 'THIGH'],
  
  // Rugby
  PROP: ['NECK', 'SHOULDER', 'BACK', 'KNEE'],
  HOOKER: ['NECK', 'SHOULDER', 'BACK'],
  LOCK: ['KNEE', 'SHOULDER', 'ANKLE'],
  FLANKER: ['SHOULDER', 'KNEE', 'ANKLE', 'HEAD'],
  BACK: ['HAMSTRING', 'GROIN', 'ANKLE', 'HEAD'],
  
  // Basketball
  GUARD: ['ANKLE', 'KNEE', 'HAMSTRING'],
  FORWARD_BASKETBALL: ['KNEE', 'ANKLE', 'BACK'],
  CENTER: ['KNEE', 'BACK', 'ANKLE', 'FOOT'],
  
  // Cricket
  BATTER: ['HAND', 'FINGER', 'BACK', 'KNEE'],
  BOWLER: ['SHOULDER', 'BACK', 'ANKLE', 'KNEE'],
  WICKET_KEEPER: ['KNEE', 'HAND', 'FINGER', 'BACK'],
  
  // American Football
  QUARTERBACK: ['SHOULDER', 'KNEE', 'ANKLE', 'HAND'],
  RUNNING_BACK: ['KNEE', 'ANKLE', 'SHOULDER', 'HEAD'],
  RECEIVER: ['HAMSTRING', 'KNEE', 'ANKLE', 'SHOULDER'],
  LINEMAN: ['KNEE', 'ANKLE', 'SHOULDER', 'BACK'],
  
  // Default
  DEFAULT: ['KNEE', 'ANKLE', 'HAMSTRING', 'GROIN'],
};

// Age-related injury risk multipliers
const AGE_RISK_MULTIPLIERS: Record<string, number> = {
  'UNDER_18': 1.15,    // Growing bodies, technique development
  '18_23': 0.9,        // Peak physical condition
  '24_28': 1.0,        // Prime years
  '29_32': 1.2,        // Early decline
  '33_PLUS': 1.4,      // Higher injury risk
};

// =============================================================================
// INJURY PREDICTION CACHE
// =============================================================================

interface InjuryCache {
  predictions: Map<string, { data: InjuryRiskAssessment; expiresAt: Date }>;
}

const injuryCache: InjuryCache = {
  predictions: new Map(),
};

const CACHE_TTL = 60 * 60 * 4 * 1000; // 4 hours

// =============================================================================
// MAIN PREDICTION FUNCTION
// =============================================================================

/**
 * Predict injury risk for a player
 */
export async function predictInjuryRisk(
  playerId: string,
  playerData: {
    name: string;
    sport: Sport;
    position: string;
    age: number;
    
    // Workload data
    minutesLast7Days: number;
    minutesLast28Days: number;
    matchesLast7Days: number;
    matchesLast28Days: number;
    trainingLoadLast7Days: number;
    trainingLoadLast28Days: number;
    
    // Physical metrics
    fatigueLevel: number;           // 0-100
    fitnessScore: number;           // 0-100
    sleepQuality?: number;          // 0-100
    hydrationLevel?: number;        // 0-100
    
    // Injury history
    previousInjuries: {
      type: InjuryType;
      bodyPart: BodyPart;
      severity: InjurySeverity;
      date: Date;
      daysOut: number;
    }[];
    daysSinceLastInjury: number;
    
    // Context
    isYouth?: boolean;
  },
  forceRefresh: boolean = false
): Promise<InjuryRiskAssessment> {
  // Check cache
  const cacheKey = `injury:${playerId}`;
  if (!forceRefresh) {
    const cached = injuryCache.predictions.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }
  }
  
  const sportConfig = getSportMetricConfig(playerData.sport);
  
  // Calculate ACWR (Acute:Chronic Workload Ratio)
  const acuteLoad = playerData.minutesLast7Days + (playerData.trainingLoadLast7Days * 0.5);
  const chronicLoad = (playerData.minutesLast28Days + (playerData.trainingLoadLast28Days * 0.5)) / 4;
  const acuteChronicRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;
  
  // Determine workload risk zone
  let workloadRiskZone: 'SAFE' | 'CAUTION' | 'DANGER' = 'SAFE';
  if (acuteChronicRatio > WORKLOAD_THRESHOLDS.ACWR_DANGER) {
    workloadRiskZone = 'DANGER';
  } else if (acuteChronicRatio > WORKLOAD_THRESHOLDS.ACWR_SAFE_MAX || 
             acuteChronicRatio < WORKLOAD_THRESHOLDS.ACWR_SAFE_MIN) {
    workloadRiskZone = 'CAUTION';
  }
  
  // Calculate workload trend
  const weeklyAvgLast28 = playerData.minutesLast28Days / 4;
  const workloadTrend: 'INCREASING' | 'STABLE' | 'DECREASING' = 
    playerData.minutesLast7Days > weeklyAvgLast28 * 1.2 ? 'INCREASING' :
    playerData.minutesLast7Days < weeklyAvgLast28 * 0.8 ? 'DECREASING' : 'STABLE';
  
  // Calculate risk factors
  const riskFactors: InjuryRiskFactor[] = [];
  let totalRiskScore = 0;
  
  // 1. Workload Risk (25% weight)
  const workloadRiskScore = calculateWorkloadRisk(acuteChronicRatio, workloadRiskZone);
  totalRiskScore += workloadRiskScore * 0.25;
  riskFactors.push({
    factor: 'Training Load',
    contribution: workloadRiskScore,
    description: `ACWR: ${acuteChronicRatio.toFixed(2)} - ${workloadRiskZone} zone`,
    isModifiable: true,
    mitigationActions: workloadRiskScore > 50 ? [
      'Reduce training intensity by 20-30%',
      'Include additional recovery sessions',
      'Monitor closely for fatigue symptoms',
    ] : undefined,
  });
  
  // 2. Fatigue Risk (20% weight)
  const fatigueRiskScore = playerData.fatigueLevel;
  totalRiskScore += fatigueRiskScore * 0.20;
  riskFactors.push({
    factor: 'Fatigue Level',
    contribution: fatigueRiskScore,
    description: `Current fatigue: ${fatigueRiskScore}%`,
    isModifiable: true,
    mitigationActions: fatigueRiskScore > 60 ? [
      'Prioritize sleep and recovery',
      'Consider match rotation',
      'Reduce high-intensity training',
    ] : undefined,
  });
  
  // 3. Injury History Risk (20% weight)
  const historyRiskScore = calculateHistoryRisk(playerData.previousInjuries, playerData.daysSinceLastInjury);
  totalRiskScore += historyRiskScore * 0.20;
  riskFactors.push({
    factor: 'Injury History',
    contribution: historyRiskScore,
    description: `${playerData.previousInjuries.length} previous injuries, ${playerData.daysSinceLastInjury} days since last`,
    isModifiable: false,
  });
  
  // 4. Age Risk (15% weight)
  const ageRiskScore = calculateAgeRisk(playerData.age, playerData.isYouth);
  totalRiskScore += ageRiskScore * 0.15;
  riskFactors.push({
    factor: 'Age Profile',
    contribution: ageRiskScore,
    description: `Age ${playerData.age} - ${getAgeCategory(playerData.age)}`,
    isModifiable: false,
  });
  
  // 5. Position Risk (10% weight)
  const positionRiskScore = getPositionInjuryRisk(playerData.sport, playerData.position);
  totalRiskScore += positionRiskScore * 0.10;
  riskFactors.push({
    factor: 'Position Risk',
    contribution: positionRiskScore,
    description: `${playerData.position} position injury profile`,
    isModifiable: false,
  });
  
  // 6. Fitness/Conditioning Risk (10% weight)
  const fitnessRiskScore = 100 - playerData.fitnessScore;
  totalRiskScore += fitnessRiskScore * 0.10;
  riskFactors.push({
    factor: 'Physical Conditioning',
    contribution: fitnessRiskScore,
    description: `Fitness score: ${playerData.fitnessScore}%`,
    isModifiable: true,
    mitigationActions: fitnessRiskScore > 40 ? [
      'Increase conditioning work',
      'Focus on strength and flexibility',
      'Progressive load increases',
    ] : undefined,
  });
  
  // Calculate body part risks
  const bodyPartRisks = calculateBodyPartRisks(
    playerData.position,
    playerData.previousInjuries,
    playerData.sport
  );
  
  // Determine overall risk level
  const overallRiskScore = Math.min(100, Math.round(totalRiskScore));
  let riskLevel: InjuryRiskAssessment['riskLevel'] = 'LOW';
  if (overallRiskScore >= RISK_THRESHOLDS.CRITICAL) {
    riskLevel = 'CRITICAL';
  } else if (overallRiskScore >= RISK_THRESHOLDS.HIGH) {
    riskLevel = 'HIGH';
  } else if (overallRiskScore >= RISK_THRESHOLDS.MODERATE) {
    riskLevel = 'MODERATE';
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    riskLevel,
    riskFactors,
    workloadRiskZone,
    playerData
  );
  
  // Calculate suggested load reduction
  let suggestedLoadReduction: number | undefined;
  if (riskLevel === 'CRITICAL') {
    suggestedLoadReduction = 50;
  } else if (riskLevel === 'HIGH') {
    suggestedLoadReduction = 30;
  } else if (riskLevel === 'MODERATE' && workloadRiskZone !== 'SAFE') {
    suggestedLoadReduction = 15;
  }
  
  // Build assessment
  const assessment: InjuryRiskAssessment = {
    playerId,
    playerName: playerData.name,
    sport: playerData.sport,
    position: playerData.position,
    overallRiskScore,
    riskLevel,
    riskFactors: riskFactors.sort((a, b) => b.contribution - a.contribution),
    bodyPartRisks,
    workloadAnalysis: {
      acuteLoad: Math.round(acuteLoad),
      chronicLoad: Math.round(chronicLoad),
      acuteChronicRatio: Math.round(acuteChronicRatio * 100) / 100,
      trend: workloadTrend,
      riskZone: workloadRiskZone,
    },
    injuryHistory: {
      totalInjuries: playerData.previousInjuries.length,
      lastInjuryDate: playerData.previousInjuries.length > 0 
        ? playerData.previousInjuries.sort((a, b) => b.date.getTime() - a.date.getTime())[0].date
        : undefined,
      daysSinceLastInjury: playerData.daysSinceLastInjury,
      mostCommonType: getMostCommonInjuryType(playerData.previousInjuries),
      mostAffectedBodyPart: getMostAffectedBodyPart(playerData.previousInjuries),
    },
    recommendations,
    suggestedLoadReduction,
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + CACHE_TTL),
    modelVersion: INJURY_MODEL_VERSION,
    confidence: playerData.previousInjuries.length >= 3 ? 'HIGH' : 
                playerData.previousInjuries.length >= 1 ? 'MEDIUM' : 'LOW',
  };
  
  // Cache result
  injuryCache.predictions.set(cacheKey, {
    data: assessment,
    expiresAt: new Date(Date.now() + CACHE_TTL),
  });
  
  return assessment;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateWorkloadRisk(acwr: number, zone: 'SAFE' | 'CAUTION' | 'DANGER'): number {
  if (zone === 'DANGER') {
    return 80 + (acwr - WORKLOAD_THRESHOLDS.ACWR_DANGER) * 20;
  } else if (zone === 'CAUTION') {
    if (acwr > WORKLOAD_THRESHOLDS.ACWR_SAFE_MAX) {
      return 40 + (acwr - WORKLOAD_THRESHOLDS.ACWR_SAFE_MAX) * 40;
    } else {
      return 40 + (WORKLOAD_THRESHOLDS.ACWR_SAFE_MIN - acwr) * 40;
    }
  }
  return 20;
}

function calculateHistoryRisk(
  injuries: { type: InjuryType; severity: InjurySeverity; daysOut: number }[],
  daysSinceLastInjury: number
): number {
  if (injuries.length === 0) return 10;
  
  let score = 20;
  
  // More injuries = higher risk
  score += Math.min(injuries.length * 8, 40);
  
  // Recent injuries = higher risk
  if (daysSinceLastInjury < 30) {
    score += 30;
  } else if (daysSinceLastInjury < 90) {
    score += 20;
  } else if (daysSinceLastInjury < 180) {
    score += 10;
  }
  
  // Severe injuries = higher risk
  const severeCount = injuries.filter(i => 
    i.severity === 'SEVERE' || i.severity === 'CAREER_THREATENING'
  ).length;
  score += severeCount * 10;
  
  return Math.min(100, score);
}

function calculateAgeRisk(age: number, isYouth?: boolean): number {
  const category = getAgeCategory(age);
  const multiplier = AGE_RISK_MULTIPLIERS[category] || 1.0;
  
  let baseRisk = 30;
  if (isYouth) baseRisk += 10; // Additional youth consideration
  
  return Math.min(100, baseRisk * multiplier);
}

function getAgeCategory(age: number): string {
  if (age < 18) return 'UNDER_18';
  if (age <= 23) return '18_23';
  if (age <= 28) return '24_28';
  if (age <= 32) return '29_32';
  return '33_PLUS';
}

function calculateBodyPartRisks(
  position: string,
  injuries: { bodyPart: BodyPart; date: Date }[],
  sport: Sport
): BodyPartRisk[] {
  // Get vulnerable body parts for position
  const positionCategory = getPositionCategory(position);
  const vulnerableParts = POSITION_BODY_PART_RISKS[positionCategory] || 
                         POSITION_BODY_PART_RISKS.DEFAULT;
  
  const risks: BodyPartRisk[] = [];
  
  for (const bodyPart of vulnerableParts) {
    const partInjuries = injuries.filter(i => i.bodyPart === bodyPart);
    const lastInjury = partInjuries.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    
    let riskScore = 30; // Base risk for vulnerable position
    
    // Add history-based risk
    riskScore += partInjuries.length * 15;
    
    // Recent injury to this body part
    if (lastInjury) {
      const daysSince = Math.floor((Date.now() - lastInjury.date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < 90) riskScore += 25;
      else if (daysSince < 180) riskScore += 15;
    }
    
    risks.push({
      bodyPart,
      riskScore: Math.min(100, riskScore),
      historicalInjuries: partInjuries.length,
      lastInjuryDate: lastInjury?.date,
      vulnerabilityReason: `High-stress area for ${positionCategory} position`,
    });
  }
  
  return risks.sort((a, b) => b.riskScore - a.riskScore);
}

function getPositionCategory(position: string): string {
  const upper = position.toUpperCase();
  
  // Football/Soccer
  if (upper.includes('GOALKEEPER') || upper.includes('KEEPER')) return 'GOALKEEPER';
  if (upper.includes('BACK') || upper.includes('DEFENDER')) return 'DEFENDER';
  if (upper.includes('MIDFIELDER') || upper.includes('MIDFIELD')) return 'MIDFIELDER';
  if (upper.includes('FORWARD') || upper.includes('STRIKER') || upper.includes('WINGER')) return 'FORWARD';
  
  // Rugby
  if (upper.includes('PROP')) return 'PROP';
  if (upper.includes('HOOKER')) return 'HOOKER';
  if (upper.includes('LOCK')) return 'LOCK';
  if (upper.includes('FLANKER') || upper.includes('NUMBER_EIGHT')) return 'FLANKER';
  if (upper.includes('HALF') || upper.includes('CENTRE') || upper.includes('WING') || upper.includes('FULL_BACK')) return 'BACK';
  
  // Basketball
  if (upper.includes('GUARD')) return 'GUARD';
  if (upper.includes('CENTER')) return 'CENTER';
  if (upper.includes('FORWARD')) return 'FORWARD_BASKETBALL';
  
  // Cricket
  if (upper.includes('BATTER') || upper.includes('OPENER')) return 'BATTER';
  if (upper.includes('BOWLER')) return 'BOWLER';
  if (upper.includes('WICKET')) return 'WICKET_KEEPER';
  
  // American Football
  if (upper.includes('QUARTERBACK')) return 'QUARTERBACK';
  if (upper.includes('RUNNING')) return 'RUNNING_BACK';
  if (upper.includes('RECEIVER') || upper.includes('TIGHT_END')) return 'RECEIVER';
  if (upper.includes('TACKLE') || upper.includes('GUARD') || upper.includes('CENTER')) return 'LINEMAN';
  
  return 'DEFAULT';
}

function getMostCommonInjuryType(injuries: { type: InjuryType }[]): InjuryType | undefined {
  if (injuries.length === 0) return undefined;
  
  const counts = new Map<InjuryType, number>();
  for (const injury of injuries) {
    counts.set(injury.type, (counts.get(injury.type) || 0) + 1);
  }
  
  let maxType: InjuryType | undefined;
  let maxCount = 0;
  for (const [type, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  }
  
  return maxType;
}

function getMostAffectedBodyPart(injuries: { bodyPart: BodyPart }[]): BodyPart | undefined {
  if (injuries.length === 0) return undefined;
  
  const counts = new Map<BodyPart, number>();
  for (const injury of injuries) {
    counts.set(injury.bodyPart, (counts.get(injury.bodyPart) || 0) + 1);
  }
  
  let maxPart: BodyPart | undefined;
  let maxCount = 0;
  for (const [part, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxPart = part;
    }
  }
  
  return maxPart;
}

function generateRecommendations(
  riskLevel: InjuryRiskAssessment['riskLevel'],
  riskFactors: InjuryRiskFactor[],
  workloadZone: 'SAFE' | 'CAUTION' | 'DANGER',
  playerData: { age: number; isYouth?: boolean; fatigueLevel: number }
): string[] {
  const recommendations: string[] = [];
  
  // Risk level based recommendations
  if (riskLevel === 'CRITICAL') {
    recommendations.push('Immediate medical assessment recommended');
    recommendations.push('Consider complete rest for 48-72 hours');
    recommendations.push('Avoid competitive matches until reassessed');
  } else if (riskLevel === 'HIGH') {
    recommendations.push('Reduce training intensity by 30%');
    recommendations.push('Focus on recovery and regeneration');
    recommendations.push('Consider rotation for next match');
  }
  
  // Workload based
  if (workloadZone === 'DANGER') {
    recommendations.push('Significant workload reduction required');
    recommendations.push('Gradual return to full training over 7-10 days');
  } else if (workloadZone === 'CAUTION') {
    recommendations.push('Monitor workload carefully this week');
    recommendations.push('Include additional recovery sessions');
  }
  
  // Fatigue based
  if (playerData.fatigueLevel > 70) {
    recommendations.push('Prioritize sleep quality and duration');
    recommendations.push('Consider sports massage and hydrotherapy');
  }
  
  // Age based
  if (playerData.age > 32) {
    recommendations.push('Extended warm-up and cool-down protocols');
    recommendations.push('Focus on injury prevention exercises');
  }
  
  if (playerData.isYouth) {
    recommendations.push('Ensure adequate nutrition for development');
    recommendations.push('Monitor growth-related load tolerance');
  }
  
  // Ensure minimum recommendations
  if (recommendations.length < 2) {
    recommendations.push('Maintain current injury prevention protocols');
    recommendations.push('Continue regular monitoring');
  }
  
  return recommendations.slice(0, 6);
}

// =============================================================================
// BATCH PREDICTION
// =============================================================================

/**
 * Predict injury risks for entire team
 */
export async function predictTeamInjuryRisks(
  teamId: string,
  players: Parameters<typeof predictInjuryRisk>[1][]
): Promise<{
  teamId: string;
  predictions: InjuryRiskAssessment[];
  summary: {
    highRiskCount: number;
    averageRisk: number;
    mostVulnerablePosition: string;
  };
}> {
  const predictions: InjuryRiskAssessment[] = [];
  
  for (const player of players) {
    const prediction = await predictInjuryRisk(player.name, player);
    predictions.push(prediction);
  }
  
  // Calculate summary
  const highRiskCount = predictions.filter(p => 
    p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL'
  ).length;
  
  const averageRisk = predictions.reduce((sum, p) => sum + p.overallRiskScore, 0) / predictions.length;
  
  // Find most vulnerable position
  const positionRisks = new Map<string, number[]>();
  for (const p of predictions) {
    const risks = positionRisks.get(p.position) || [];
    risks.push(p.overallRiskScore);
    positionRisks.set(p.position, risks);
  }
  
  let mostVulnerablePosition = '';
  let highestAvg = 0;
  for (const [position, risks] of positionRisks) {
    const avg = risks.reduce((a, b) => a + b, 0) / risks.length;
    if (avg > highestAvg) {
      highestAvg = avg;
      mostVulnerablePosition = position;
    }
  }
  
  return {
    teamId,
    predictions,
    summary: {
      highRiskCount,
      averageRisk: Math.round(averageRisk),
      mostVulnerablePosition,
    },
  };
}

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

/**
 * Invalidate injury prediction cache for a player
 */
export function invalidateInjuryPrediction(playerId: string): boolean {
  return injuryCache.predictions.delete(`injury:${playerId}`);
}

/**
 * Invalidate all injury predictions for a team
 */
export function invalidateTeamInjuryPredictions(playerIds: string[]): number {
  let count = 0;
  for (const playerId of playerIds) {
    if (invalidateInjuryPrediction(playerId)) count++;
  }
  return count;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  predictInjuryRisk,
  predictTeamInjuryRisks,
  invalidateInjuryPrediction,
  invalidateTeamInjuryPredictions,
  RISK_THRESHOLDS,
  WORKLOAD_THRESHOLDS,
  INJURY_MODEL_VERSION,
};
