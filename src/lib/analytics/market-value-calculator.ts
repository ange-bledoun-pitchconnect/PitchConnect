/**
 * ============================================================================
 * 💰 PITCHCONNECT ANALYTICS - MARKET VALUE CALCULATOR v7.10.1
 * ============================================================================
 * Enterprise player market value estimation for all 12 sports
 * Supports multiple currencies with GBP as default
 * ============================================================================
 */

import type {
  Sport,
  Currency,
  MarketValueAssessment,
  ValueFactor,
  ComparablePlayer,
  CURRENCY_RATES,
  CURRENCY_SYMBOLS,
} from './types';
import {
  getSportMetricConfig,
  getPositionValueMultiplier,
  getAgeAdjustmentFactor,
} from './sport-metrics';

// =============================================================================
// CONSTANTS
// =============================================================================

export const MARKET_VALUE_MODEL_VERSION = '7.10.1-market-value';

// Base values by sport (in GBP) - grassroots/amateur level
export const BASE_VALUES_BY_SPORT: Record<Sport, number> = {
  FOOTBALL: 50000,
  RUGBY: 40000,
  CRICKET: 35000,
  BASKETBALL: 45000,
  AMERICAN_FOOTBALL: 50000,
  NETBALL: 25000,
  HOCKEY: 30000,
  LACROSSE: 30000,
  AUSTRALIAN_RULES: 45000,
  GAELIC_FOOTBALL: 20000,  // Amateur sport
  FUTSAL: 25000,
  BEACH_FOOTBALL: 20000,
};

// Performance tier multipliers
export const PERFORMANCE_TIERS: Record<string, { minRating: number; multiplier: number }> = {
  ELITE: { minRating: 8.5, multiplier: 20.0 },
  EXCELLENT: { minRating: 7.5, multiplier: 10.0 },
  GOOD: { minRating: 6.5, multiplier: 5.0 },
  AVERAGE: { minRating: 5.5, multiplier: 2.0 },
  BELOW_AVERAGE: { minRating: 4.5, multiplier: 1.0 },
  POOR: { minRating: 0, multiplier: 0.5 },
};

// Contract effect on value
const CONTRACT_FACTORS = {
  YEARS_4_PLUS: 1.0,
  YEARS_3: 0.95,
  YEARS_2: 0.85,
  YEARS_1: 0.7,
  EXPIRING: 0.5,
  FREE_AGENT: 0.3,
};

// =============================================================================
// CACHE
// =============================================================================

interface ValueCache {
  assessments: Map<string, { data: MarketValueAssessment; expiresAt: Date }>;
}

const valueCache: ValueCache = {
  assessments: new Map(),
};

const CACHE_TTL = 60 * 60 * 24 * 1000; // 24 hours

// =============================================================================
// MAIN CALCULATION FUNCTION
// =============================================================================

/**
 * Calculate player market value
 */
export async function calculatePlayerMarketValue(
  playerId: string,
  playerData: {
    name: string;
    sport: Sport;
    position: string;
    age: number;
    
    // Performance
    averageRating: number;
    matchesPlayed: number;
    goalsOrContributions: number;
    assists?: number;
    
    // Form
    formTrend: 'RISING' | 'STABLE' | 'FALLING';
    consistencyScore: number;      // 0-100
    
    // Contract
    contractYearsRemaining?: number;
    currentSalary?: number;
    
    // Previous value
    previousAssessmentValue?: number;
    previousAssessmentDate?: Date;
    
    // Comparable context
    comparablePlayers?: ComparablePlayer[];
    recentTransferFee?: number;
  },
  currency: Currency = 'GBP',
  forceRefresh: boolean = false
): Promise<MarketValueAssessment> {
  // Check cache
  const cacheKey = `value:${playerId}:${currency}`;
  if (!forceRefresh) {
    const cached = valueCache.assessments.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }
  }
  
  const sportConfig = getSportMetricConfig(playerData.sport);
  
  // Start with base value for sport
  let baseValue = BASE_VALUES_BY_SPORT[playerData.sport];
  
  // Initialize factors
  const valueFactors: ValueFactor[] = [];
  
  // 1. Performance tier multiplier
  const performanceTier = getPerformanceTier(playerData.averageRating);
  const tierMultiplier = PERFORMANCE_TIERS[performanceTier].multiplier;
  baseValue *= tierMultiplier;
  valueFactors.push({
    factor: 'Performance Level',
    impact: tierMultiplier,
    description: `${performanceTier} tier (Rating: ${playerData.averageRating.toFixed(1)})`,
    direction: tierMultiplier > 2 ? 'POSITIVE' : tierMultiplier < 1 ? 'NEGATIVE' : 'NEUTRAL',
  });
  
  // 2. Position value multiplier
  const positionMultiplier = getPositionValueMultiplier(playerData.sport, playerData.position);
  baseValue *= positionMultiplier;
  valueFactors.push({
    factor: 'Position Premium',
    impact: positionMultiplier,
    description: `${playerData.position} position value factor`,
    direction: positionMultiplier > 1.1 ? 'POSITIVE' : positionMultiplier < 0.95 ? 'NEGATIVE' : 'NEUTRAL',
  });
  
  // 3. Age adjustment
  const ageMultiplier = getAgeAdjustmentFactor(playerData.sport, playerData.age);
  baseValue *= ageMultiplier;
  const ageDirection: ValueFactor['direction'] = 
    playerData.age < sportConfig.ageFactors.peakAgeMin ? 'POSITIVE' :
    playerData.age > sportConfig.ageFactors.peakAgeMax ? 'NEGATIVE' : 'NEUTRAL';
  valueFactors.push({
    factor: 'Age Profile',
    impact: ageMultiplier,
    description: `Age ${playerData.age} - ${getAgeProfile(playerData.age, sportConfig.ageFactors)}`,
    direction: ageDirection,
  });
  
  // 4. Experience/matches played factor
  const experienceMultiplier = calculateExperienceMultiplier(playerData.matchesPlayed);
  baseValue *= experienceMultiplier;
  valueFactors.push({
    factor: 'Experience',
    impact: experienceMultiplier,
    description: `${playerData.matchesPlayed} matches played`,
    direction: experienceMultiplier > 1 ? 'POSITIVE' : 'NEUTRAL',
  });
  
  // 5. Form trend factor
  const formMultiplier = playerData.formTrend === 'RISING' ? 1.15 :
                         playerData.formTrend === 'FALLING' ? 0.85 : 1.0;
  baseValue *= formMultiplier;
  valueFactors.push({
    factor: 'Current Form',
    impact: formMultiplier,
    description: `Form trend: ${playerData.formTrend}`,
    direction: playerData.formTrend === 'RISING' ? 'POSITIVE' : 
               playerData.formTrend === 'FALLING' ? 'NEGATIVE' : 'NEUTRAL',
  });
  
  // 6. Consistency factor
  const consistencyMultiplier = 0.8 + (playerData.consistencyScore / 100) * 0.4;
  baseValue *= consistencyMultiplier;
  valueFactors.push({
    factor: 'Consistency',
    impact: consistencyMultiplier,
    description: `Consistency score: ${playerData.consistencyScore}%`,
    direction: playerData.consistencyScore > 70 ? 'POSITIVE' : 
               playerData.consistencyScore < 40 ? 'NEGATIVE' : 'NEUTRAL',
  });
  
  // 7. Contract situation
  let contractMultiplier = 1.0;
  let contractEffect = 1.0;
  if (playerData.contractYearsRemaining !== undefined) {
    if (playerData.contractYearsRemaining >= 4) {
      contractMultiplier = CONTRACT_FACTORS.YEARS_4_PLUS;
    } else if (playerData.contractYearsRemaining >= 3) {
      contractMultiplier = CONTRACT_FACTORS.YEARS_3;
    } else if (playerData.contractYearsRemaining >= 2) {
      contractMultiplier = CONTRACT_FACTORS.YEARS_2;
    } else if (playerData.contractYearsRemaining >= 1) {
      contractMultiplier = CONTRACT_FACTORS.YEARS_1;
    } else if (playerData.contractYearsRemaining > 0) {
      contractMultiplier = CONTRACT_FACTORS.EXPIRING;
    } else {
      contractMultiplier = CONTRACT_FACTORS.FREE_AGENT;
    }
    contractEffect = contractMultiplier;
    baseValue *= contractMultiplier;
    valueFactors.push({
      factor: 'Contract Situation',
      impact: contractMultiplier,
      description: `${playerData.contractYearsRemaining?.toFixed(1) ?? 0} years remaining`,
      direction: contractMultiplier >= 0.85 ? 'NEUTRAL' : 'NEGATIVE',
    });
  }
  
  // 8. Contribution bonus (goals/assists for attackers)
  if (playerData.goalsOrContributions > 0) {
    const contributionBonus = 1 + (playerData.goalsOrContributions * 0.02);
    baseValue *= Math.min(contributionBonus, 1.5);
    valueFactors.push({
      factor: 'Goal Contributions',
      impact: contributionBonus,
      description: `${playerData.goalsOrContributions} goals/key contributions`,
      direction: contributionBonus > 1.1 ? 'POSITIVE' : 'NEUTRAL',
    });
  }
  
  // Calculate value range
  const estimatedValue = Math.round(baseValue);
  const valueRange = {
    min: Math.round(estimatedValue * 0.8),
    max: Math.round(estimatedValue * 1.2),
  };
  
  // Calculate value trajectory
  let valueTrajectory: MarketValueAssessment['valueTrajectory'] = 'STABLE';
  let valueChange = 0;
  if (playerData.previousAssessmentValue) {
    valueChange = ((estimatedValue - playerData.previousAssessmentValue) / playerData.previousAssessmentValue) * 100;
    if (valueChange > 10) valueTrajectory = 'RISING';
    else if (valueChange < -10) valueTrajectory = 'FALLING';
  }
  
  // Determine market context
  const marketContext = {
    positionDemand: getPositionDemand(playerData.sport, playerData.position),
    ageProfile: getAgeProfile(playerData.age, sportConfig.ageFactors),
    transferWindow: 'CLOSED' as const, // Would be dynamic in production
    marketTrend: 'STABLE' as const,
  };
  
  // Convert to requested currency
  const currencyRate = getCurrencyRate(currency);
  const finalValue = Math.round(estimatedValue * currencyRate);
  const finalRange = {
    min: Math.round(valueRange.min * currencyRate),
    max: Math.round(valueRange.max * currencyRate),
  };
  
  // Build assessment
  const assessment: MarketValueAssessment = {
    playerId,
    playerName: playerData.name,
    sport: playerData.sport,
    position: playerData.position,
    age: playerData.age,
    estimatedValue: finalValue,
    currency,
    valueRange: finalRange,
    previousValue: playerData.previousAssessmentValue 
      ? Math.round(playerData.previousAssessmentValue * currencyRate) 
      : undefined,
    valueChange: Math.round(valueChange * 10) / 10,
    valueTrajectory,
    peakValue: playerData.recentTransferFee 
      ? Math.round(playerData.recentTransferFee * currencyRate)
      : undefined,
    valueFactors: valueFactors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
    comparablePlayers: playerData.comparablePlayers?.map(p => ({
      ...p,
      marketValue: Math.round(p.marketValue * currencyRate),
      recentTransferFee: p.recentTransferFee 
        ? Math.round(p.recentTransferFee * currencyRate)
        : undefined,
    })) ?? [],
    contractInfo: playerData.contractYearsRemaining !== undefined ? {
      yearsRemaining: playerData.contractYearsRemaining,
      contractEffect,
    } : undefined,
    marketContext,
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + CACHE_TTL),
    modelVersion: MARKET_VALUE_MODEL_VERSION,
    confidence: playerData.matchesPlayed >= 30 ? 'HIGH' :
                playerData.matchesPlayed >= 15 ? 'MEDIUM' : 'LOW',
  };
  
  // Cache result
  valueCache.assessments.set(cacheKey, {
    data: assessment,
    expiresAt: new Date(Date.now() + CACHE_TTL),
  });
  
  return assessment;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getPerformanceTier(rating: number): string {
  for (const [tier, config] of Object.entries(PERFORMANCE_TIERS)) {
    if (rating >= config.minRating) {
      return tier;
    }
  }
  return 'POOR';
}

function calculateExperienceMultiplier(matchesPlayed: number): number {
  if (matchesPlayed >= 200) return 1.3;
  if (matchesPlayed >= 100) return 1.2;
  if (matchesPlayed >= 50) return 1.1;
  if (matchesPlayed >= 20) return 1.0;
  return 0.9;
}

function getAgeProfile(
  age: number,
  factors: { peakAgeMin: number; peakAgeMax: number }
): 'PRIME' | 'DEVELOPING' | 'DECLINING' {
  if (age < factors.peakAgeMin) return 'DEVELOPING';
  if (age > factors.peakAgeMax) return 'DECLINING';
  return 'PRIME';
}

function getPositionDemand(sport: Sport, position: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  // High-demand positions by sport
  const highDemand: Record<Sport, string[]> = {
    FOOTBALL: ['STRIKER', 'ATTACKING_MIDFIELDER', 'CENTRE_BACK'],
    RUGBY: ['FLY_HALF', 'SCRUM_HALF', 'NUMBER_EIGHT'],
    CRICKET: ['ALL_ROUNDER', 'FAST_BOWLER'],
    BASKETBALL: ['POINT_GUARD', 'SMALL_FORWARD'],
    AMERICAN_FOOTBALL: ['QUARTERBACK', 'EDGE_RUSHER'],
    NETBALL: ['GOAL_SHOOTER', 'CENTRE'],
    HOCKEY: ['FORWARD_HOCKEY', 'MIDFIELDER_HOCKEY'],
    LACROSSE: ['ATTACKER_LACROSSE', 'MIDFIELDER_LACROSSE'],
    AUSTRALIAN_RULES: ['MIDFIELDER_AFL', 'KEY_FORWARD'],
    GAELIC_FOOTBALL: ['MIDFIELDER_GAA', 'CENTRE_FORWARD_GAA'],
    FUTSAL: ['PIVOT', 'WINGER_FUTSAL'],
    BEACH_FOOTBALL: ['FORWARD_BEACH', 'PIVOT_BEACH'],
  };
  
  if (highDemand[sport]?.includes(position)) return 'HIGH';
  return 'MEDIUM';
}

function getCurrencyRate(currency: Currency): number {
  const rates: Record<Currency, number> = {
    GBP: 1.00,
    EUR: 1.17,
    USD: 1.27,
    AUD: 1.93,
    CAD: 1.72,
    CHF: 1.11,
    JPY: 189.5,
  };
  return rates[currency] ?? 1.0;
}

/**
 * Format value with currency symbol
 */
export function formatMarketValue(value: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    GBP: '£',
    EUR: '€',
    USD: '$',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF ',
    JPY: '¥',
  };
  
  const symbol = symbols[currency] ?? '£';
  
  if (value >= 1000000) {
    return `${symbol}${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${symbol}${(value / 1000).toFixed(0)}K`;
  }
  return `${symbol}${value.toLocaleString()}`;
}

// =============================================================================
// BATCH CALCULATIONS
// =============================================================================

/**
 * Calculate market values for entire team
 */
export async function calculateTeamMarketValues(
  teamId: string,
  players: Parameters<typeof calculatePlayerMarketValue>[1][],
  currency: Currency = 'GBP'
): Promise<{
  teamId: string;
  assessments: MarketValueAssessment[];
  totalValue: number;
  averageValue: number;
  mostValuable: { playerId: string; name: string; value: number };
}> {
  const assessments: MarketValueAssessment[] = [];
  
  for (const player of players) {
    const assessment = await calculatePlayerMarketValue(player.name, player, currency);
    assessments.push(assessment);
  }
  
  const totalValue = assessments.reduce((sum, a) => sum + a.estimatedValue, 0);
  const averageValue = totalValue / assessments.length;
  
  const mostValuable = assessments.reduce((max, a) => 
    a.estimatedValue > max.value 
      ? { playerId: a.playerId, name: a.playerName, value: a.estimatedValue }
      : max,
    { playerId: '', name: '', value: 0 }
  );
  
  return {
    teamId,
    assessments,
    totalValue,
    averageValue: Math.round(averageValue),
    mostValuable,
  };
}

/**
 * Calculate total team market value
 */
export async function calculateTeamTotalValue(
  teamId: string,
  players: Parameters<typeof calculatePlayerMarketValue>[1][],
  currency: Currency = 'GBP'
): Promise<{
  teamId: string;
  totalValue: number;
  currency: Currency;
  playerCount: number;
  breakdown: {
    position: string;
    totalValue: number;
    playerCount: number;
  }[];
}> {
  const result = await calculateTeamMarketValues(teamId, players, currency);
  
  // Calculate breakdown by position
  const positionMap = new Map<string, { total: number; count: number }>();
  for (const assessment of result.assessments) {
    const existing = positionMap.get(assessment.position) || { total: 0, count: 0 };
    existing.total += assessment.estimatedValue;
    existing.count += 1;
    positionMap.set(assessment.position, existing);
  }
  
  const breakdown = Array.from(positionMap.entries()).map(([position, data]) => ({
    position,
    totalValue: data.total,
    playerCount: data.count,
  })).sort((a, b) => b.totalValue - a.totalValue);
  
  return {
    teamId,
    totalValue: result.totalValue,
    currency,
    playerCount: result.assessments.length,
    breakdown,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  calculatePlayerMarketValue,
  calculateTeamMarketValues,
  calculateTeamTotalValue,
  formatMarketValue,
  BASE_VALUES_BY_SPORT,
  PERFORMANCE_TIERS,
  MARKET_VALUE_MODEL_VERSION,
};
