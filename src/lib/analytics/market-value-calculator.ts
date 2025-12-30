// ============================================================================
// src/lib/analytics/market-value-calculator.ts
// 💰 PitchConnect Enterprise Analytics - Market Value Engine
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// INTEGRATES: Multi-sport metrics, Position value multipliers, Age curves
// ============================================================================

import { prisma } from '@/lib/prisma';
import { getOrSetCache } from '@/lib/cache/redis';
import { logger } from '@/lib/logging';
import {
  getSportMetricConfig,
  getPositionValueMultiplier,
  getAgeAdjustmentFactor,
} from './sport-metrics';
import type {
  MarketValueAssessment,
  ValueFactor,
  ComparablePlayer,
} from './types';
import type { Sport, Position } from '@prisma/client';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL_VERSION = '2.0.0-market-value';
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours (market values change slowly)
const CACHE_PREFIX = 'analytics:market-value';

// Base values by sport (in currency units - e.g., GBP)
const BASE_VALUES_BY_SPORT: Record<Sport, number> = {
  FOOTBALL: 100000,
  RUGBY: 80000,
  CRICKET: 70000,
  BASKETBALL: 90000,
  AMERICAN_FOOTBALL: 120000,
  NETBALL: 50000,
  HOCKEY: 60000,
  LACROSSE: 40000,
  AUSTRALIAN_RULES: 85000,
  GAELIC_FOOTBALL: 30000,
  FUTSAL: 40000,
  BEACH_FOOTBALL: 25000,
};

// Performance multipliers
const PERFORMANCE_TIERS = {
  ELITE: { minRating: 8.5, multiplier: 3.0 },
  EXCELLENT: { minRating: 7.5, multiplier: 2.0 },
  GOOD: { minRating: 6.5, multiplier: 1.3 },
  AVERAGE: { minRating: 5.5, multiplier: 1.0 },
  BELOW_AVERAGE: { minRating: 0, multiplier: 0.7 },
};

// Contract situation multipliers
const CONTRACT_MULTIPLIERS = {
  EXPIRING_12_MONTHS: 0.6,
  EXPIRING_24_MONTHS: 0.8,
  LONG_TERM: 1.0,
  NEW_CONTRACT: 1.1,
};

// ============================================================================
// MAIN VALUATION FUNCTION
// ============================================================================

/**
 * Calculate market value for a player
 */
export async function calculatePlayerMarketValue(
  playerId: string,
  forceRefresh: boolean = false
): Promise<MarketValueAssessment> {
  const cacheKey = `${CACHE_PREFIX}:${playerId}`;

  if (!forceRefresh) {
    try {
      const cached = await getOrSetCache<MarketValueAssessment>(
        cacheKey,
        async () => generateValuation(playerId),
        CACHE_TTL_SECONDS
      );
      return cached;
    } catch (error) {
      logger.warn({ playerId, error }, 'Cache miss, generating fresh valuation');
    }
  }

  return generateValuation(playerId);
}

/**
 * Generate market value assessment (internal)
 */
async function generateValuation(playerId: string): Promise<MarketValueAssessment> {
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
      contracts: {
        where: { status: 'ACTIVE' },
        orderBy: { endDate: 'desc' },
        take: 1,
      },
      matchPerformances: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          rating: true,
          goals: true,
          assists: true,
          minutesPlayed: true,
          createdAt: true,
        },
      },
      statistics: {
        orderBy: { season: 'desc' },
        take: 2,
      },
      injuries: {
        where: {
          dateFrom: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
          },
        },
        orderBy: { dateFrom: 'desc' },
      },
    },
  });

  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }

  const sport = player.teamPlayers[0]?.team.club.sport || 'FOOTBALL';
  const playerName = `${player.user.firstName} ${player.user.lastName}`;

  // Calculate age
  let age: number | null = null;
  if (player.user.dateOfBirth) {
    age = Math.floor(
      (Date.now() - new Date(player.user.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
  }

  // Calculate value components
  const baseValue = calculateBaseValue(sport, player.primaryPosition);
  const performanceAdjustment = calculatePerformanceAdjustment(player.matchPerformances, sport);
  const ageAdjustment = calculateAgeAdjustment(age, sport);
  const contractAdjustment = calculateContractAdjustment(player.contracts[0]);
  const injuryAdjustment = calculateInjuryAdjustment(player.injuries);
  const marketDemandAdjustment = calculateMarketDemandAdjustment(player.primaryPosition, sport);

  // Calculate total value
  const adjustedBase = baseValue * (1 + performanceAdjustment);
  const withAge = adjustedBase * ageAdjustment;
  const withContract = withAge * contractAdjustment;
  const withInjury = withContract * (1 - injuryAdjustment);
  const currentValue = Math.round(withInjury * (1 + marketDemandAdjustment));

  // Previous value (from database or estimate)
  const previousValue = player.marketValue || currentValue * 0.95;
  const valueChange = currentValue - previousValue;
  const valueChangePercent = previousValue > 0 ? (valueChange / previousValue) * 100 : 0;

  // Calculate trend
  const trend = determineTrend(player.matchPerformances, player.statistics);
  const trendStrength = determineTrendStrength(valueChangePercent);

  // Get comparable players
  const comparables = await findComparablePlayers(playerId, sport, player.primaryPosition, currentValue);

  // Generate value factors
  const factors = generateValueFactors(
    performanceAdjustment,
    ageAdjustment,
    contractAdjustment,
    injuryAdjustment,
    marketDemandAdjustment
  );

  // Transfer window recommendations
  const transferWindow = generateTransferRecommendation(
    currentValue,
    trend,
    player.contracts[0],
    age
  );

  // Project future values
  const projectedValue6Months = projectValue(currentValue, trend, 6);
  const projectedValue12Months = projectValue(currentValue, trend, 12);

  const assessment: MarketValueAssessment = {
    playerId,
    playerName,
    sport,
    position: player.primaryPosition,
    age,
    valuation: {
      currentValue,
      previousValue,
      valueChange,
      valueChangePercent: Math.round(valueChangePercent * 10) / 10,
      projectedValue6Months,
      projectedValue12Months,
    },
    breakdown: {
      baseValue,
      performanceAdjustment: Math.round(performanceAdjustment * baseValue),
      ageAdjustment: Math.round((ageAdjustment - 1) * adjustedBase),
      contractAdjustment: Math.round((contractAdjustment - 1) * withAge),
      injuryAdjustment: Math.round(injuryAdjustment * withContract),
      marketDemandAdjustment: Math.round(marketDemandAdjustment * withInjury),
    },
    factors,
    trend,
    trendStrength,
    comparables,
    transferWindow,
    metadata: {
      modelVersion: MODEL_VERSION,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + CACHE_TTL_SECONDS * 1000),
      dataSourcesUsed: ['match_performances', 'player_statistics', 'contracts', 'injury_history'],
    },
  };

  // Update player's market value in database
  await updatePlayerMarketValue(playerId, currentValue);

  logger.info({
    playerId,
    currentValue,
    trend,
  }, 'Market value calculated');

  return assessment;
}

// ============================================================================
// VALUE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate base value by sport and position
 */
function calculateBaseValue(sport: Sport, position: Position | null): number {
  const sportBase = BASE_VALUES_BY_SPORT[sport] || 100000;
  const positionMultiplier = position ? getPositionValueMultiplier(sport, position) : 1.0;
  
  return Math.round(sportBase * positionMultiplier);
}

/**
 * Calculate performance-based adjustment
 */
function calculatePerformanceAdjustment(performances: any[], sport: Sport): number {
  if (performances.length === 0) return 0;

  const ratings = performances.map(p => p.rating).filter(r => r != null);
  if (ratings.length === 0) return 0;

  const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  // Find performance tier
  for (const tier of Object.values(PERFORMANCE_TIERS)) {
    if (avgRating >= tier.minRating) {
      return tier.multiplier - 1; // Return as adjustment factor
    }
  }

  return 0;
}

/**
 * Calculate age-based adjustment
 */
function calculateAgeAdjustment(age: number | null, sport: Sport): number {
  if (age === null) return 1.0;
  return getAgeAdjustmentFactor(sport, age);
}

/**
 * Calculate contract-based adjustment
 */
function calculateContractAdjustment(contract: any): number {
  if (!contract || !contract.endDate) return CONTRACT_MULTIPLIERS.LONG_TERM;

  const monthsRemaining = Math.floor(
    (new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
  );

  if (monthsRemaining <= 12) return CONTRACT_MULTIPLIERS.EXPIRING_12_MONTHS;
  if (monthsRemaining <= 24) return CONTRACT_MULTIPLIERS.EXPIRING_24_MONTHS;
  
  // Check if recently signed
  if (contract.startDate) {
    const monthsSinceSigned = Math.floor(
      (Date.now() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (monthsSinceSigned <= 6) return CONTRACT_MULTIPLIERS.NEW_CONTRACT;
  }

  return CONTRACT_MULTIPLIERS.LONG_TERM;
}

/**
 * Calculate injury-based deduction
 */
function calculateInjuryAdjustment(injuries: any[]): number {
  if (injuries.length === 0) return 0;

  // Count injuries and severity
  const recentInjuries = injuries.length;
  
  // Calculate total days missed
  const totalDaysMissed = injuries.reduce((sum, injury) => {
    if (injury.dateFrom && injury.dateTo) {
      const days = Math.ceil(
        (new Date(injury.dateTo).getTime() - new Date(injury.dateFrom).getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }
    return sum + 14; // Default estimate
  }, 0);

  // Calculate deduction (max 30%)
  let deduction = 0;
  deduction += Math.min(0.15, recentInjuries * 0.03); // Up to 15% for frequency
  deduction += Math.min(0.15, totalDaysMissed * 0.001); // Up to 15% for severity

  return Math.min(0.3, deduction);
}

/**
 * Calculate market demand adjustment
 */
function calculateMarketDemandAdjustment(position: Position | null, sport: Sport): number {
  if (!position) return 0;

  // High-demand positions get premium
  const highDemandPositions: Record<Sport, string[]> = {
    FOOTBALL: ['STRIKER', 'CENTRE_FORWARD', 'ATTACKING_MIDFIELDER'],
    RUGBY: ['FLY_HALF', 'SCRUM_HALF', 'FULL_BACK'],
    CRICKET: ['ALL_ROUNDER', 'FAST_BOWLER'],
    BASKETBALL: ['POINT_GUARD', 'SHOOTING_GUARD'],
    AMERICAN_FOOTBALL: ['QUARTERBACK', 'WIDE_RECEIVER'],
    NETBALL: ['GOAL_SHOOTER', 'GOAL_ATTACK'],
    HOCKEY: ['CENTER_HOCKEY', 'GOALTENDER'],
    LACROSSE: ['ATTACKER_LACROSSE', 'MIDFIELDER_LACROSSE'],
    AUSTRALIAN_RULES: ['CENTRE_MIDFIELDER', 'FULL_FORWARD'],
    GAELIC_FOOTBALL: ['FULL_FORWARD_GAA', 'MIDFIELDER_GAA'],
    FUTSAL: ['STRIKER'],
    BEACH_FOOTBALL: ['STRIKER'],
  };

  const demandPositions = highDemandPositions[sport] || [];
  
  if (demandPositions.includes(position)) {
    return 0.15; // 15% premium for high-demand positions
  }

  return 0;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine value trend
 */
function determineTrend(performances: any[], statistics: any[]): MarketValueAssessment['trend'] {
  if (performances.length < 5) return 'STABLE';

  const recentRatings = performances.slice(0, 5).map(p => p.rating).filter(r => r != null);
  const olderRatings = performances.slice(5, 10).map(p => p.rating).filter(r => r != null);

  if (recentRatings.length === 0 || olderRatings.length === 0) return 'STABLE';

  const recentAvg = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
  const olderAvg = olderRatings.reduce((a, b) => a + b, 0) / olderRatings.length;

  if (recentAvg > olderAvg + 0.3) return 'RISING';
  if (recentAvg < olderAvg - 0.3) return 'DECLINING';
  return 'STABLE';
}

/**
 * Determine trend strength
 */
function determineTrendStrength(changePercent: number): MarketValueAssessment['trendStrength'] {
  const absChange = Math.abs(changePercent);
  if (absChange >= 20) return 'STRONG';
  if (absChange >= 10) return 'MODERATE';
  return 'WEAK';
}

/**
 * Project future value
 */
function projectValue(currentValue: number, trend: string, months: number): number {
  const monthlyChangeRates = {
    RISING: 0.02, // 2% per month
    STABLE: 0.005, // 0.5% per month
    DECLINING: -0.015, // -1.5% per month
  };

  const rate = monthlyChangeRates[trend as keyof typeof monthlyChangeRates] || 0;
  const projected = currentValue * Math.pow(1 + rate, months);
  
  return Math.round(projected);
}

/**
 * Find comparable players
 */
async function findComparablePlayers(
  playerId: string,
  sport: Sport,
  position: Position | null,
  targetValue: number
): Promise<ComparablePlayer[]> {
  if (!position) return [];

  try {
    const comparables = await prisma.player.findMany({
      where: {
        id: { not: playerId },
        primaryPosition: position,
        teamPlayers: {
          some: {
            isActive: true,
            team: {
              club: {
                sport,
              },
            },
          },
        },
        marketValue: {
          gte: targetValue * 0.5,
          lte: targetValue * 2,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 5,
      orderBy: {
        marketValue: 'desc',
      },
    });

    return comparables.map(p => {
      const similarity = calculateSimilarity(targetValue, p.marketValue || 0);
      return {
        playerId: p.id,
        playerName: `${p.user.firstName} ${p.user.lastName}`,
        position: p.primaryPosition,
        marketValue: p.marketValue || 0,
        similarity,
      };
    });
  } catch (error) {
    logger.error({ error }, 'Failed to find comparable players');
    return [];
  }
}

/**
 * Calculate similarity score
 */
function calculateSimilarity(value1: number, value2: number): number {
  if (value1 === 0 || value2 === 0) return 0;
  const ratio = Math.min(value1, value2) / Math.max(value1, value2);
  return Math.round(ratio * 100);
}

/**
 * Generate value factors
 */
function generateValueFactors(
  performance: number,
  age: number,
  contract: number,
  injury: number,
  demand: number
): ValueFactor[] {
  const factors: ValueFactor[] = [];

  // Performance factor
  factors.push({
    factor: 'Performance',
    impact: performance > 0 ? 'POSITIVE' : performance < 0 ? 'NEGATIVE' : 'NEUTRAL',
    adjustment: Math.round(performance * 100),
    description: performance > 0
      ? 'Strong recent performances increase value'
      : performance < 0
      ? 'Below average performances reduce value'
      : 'Average performance, no adjustment',
  });

  // Age factor
  factors.push({
    factor: 'Age Profile',
    impact: age > 1 ? 'POSITIVE' : age < 1 ? 'NEGATIVE' : 'NEUTRAL',
    adjustment: Math.round((age - 1) * 100),
    description: age > 1
      ? 'Prime career age adds value'
      : age < 1
      ? 'Age-related value adjustment'
      : 'Age at market standard',
  });

  // Contract factor
  factors.push({
    factor: 'Contract Situation',
    impact: contract > 1 ? 'POSITIVE' : contract < 1 ? 'NEGATIVE' : 'NEUTRAL',
    adjustment: Math.round((contract - 1) * 100),
    description: contract < 1
      ? 'Expiring contract reduces value'
      : contract > 1
      ? 'Long-term contract adds security'
      : 'Standard contract situation',
  });

  // Injury factor
  if (injury > 0) {
    factors.push({
      factor: 'Injury History',
      impact: 'NEGATIVE',
      adjustment: Math.round(-injury * 100),
      description: 'Recent injury history reduces value',
    });
  }

  // Demand factor
  if (demand > 0) {
    factors.push({
      factor: 'Market Demand',
      impact: 'POSITIVE',
      adjustment: Math.round(demand * 100),
      description: 'High-demand position increases value',
    });
  }

  return factors;
}

/**
 * Generate transfer recommendation
 */
function generateTransferRecommendation(
  currentValue: number,
  trend: string,
  contract: any,
  age: number | null
): MarketValueAssessment['transferWindow'] {
  let recommendedAction: 'SELL' | 'HOLD' | 'BUY' | 'MONITOR' = 'HOLD';
  let reasoning = '';

  // Contract expiring soon
  if (contract?.endDate) {
    const monthsRemaining = Math.floor(
      (new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (monthsRemaining <= 12 && trend === 'DECLINING') {
      recommendedAction = 'SELL';
      reasoning = 'Contract expiring with declining performance - consider sale';
    } else if (monthsRemaining <= 6) {
      recommendedAction = 'SELL';
      reasoning = 'Contract expiring imminently - sell or risk losing for free';
    }
  }

  // Age considerations
  if (age !== null) {
    if (age >= 30 && trend !== 'RISING') {
      recommendedAction = recommendedAction === 'HOLD' ? 'MONITOR' : recommendedAction;
      reasoning = reasoning || 'Player approaching end of peak years - monitor closely';
    } else if (age <= 23 && trend === 'RISING') {
      recommendedAction = 'HOLD';
      reasoning = 'Young player with rising value - hold for maximum return';
    }
  }

  // Trend considerations
  if (trend === 'RISING' && recommendedAction === 'HOLD') {
    reasoning = 'Value trending upward - hold for better return';
  } else if (trend === 'DECLINING' && recommendedAction !== 'SELL') {
    recommendedAction = 'MONITOR';
    reasoning = reasoning || 'Value declining - monitor and consider options';
  }

  // Default reasoning
  if (!reasoning) {
    reasoning = 'Stable value and situation - no immediate action required';
  }

  // Calculate prices
  const optimalSellingPrice = Math.round(currentValue * (trend === 'RISING' ? 1.2 : 1.1));
  const minimumAcceptablePrice = Math.round(currentValue * 0.85);

  return {
    recommendedAction,
    optimalSellingPrice,
    minimumAcceptablePrice,
    reasoning,
  };
}

/**
 * Update player's market value in database
 */
async function updatePlayerMarketValue(playerId: string, value: number): Promise<void> {
  try {
    await prisma.player.update({
      where: { id: playerId },
      data: { marketValue: value },
    });
  } catch (error) {
    logger.error({ playerId, error }, 'Failed to update player market value');
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Calculate market values for all players in a team
 */
export async function calculateTeamMarketValues(
  teamId: string
): Promise<MarketValueAssessment[]> {
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: { teamId, isActive: true },
    select: { playerId: true },
  });

  const assessments: MarketValueAssessment[] = [];

  for (const tp of teamPlayers) {
    try {
      const assessment = await calculatePlayerMarketValue(tp.playerId);
      assessments.push(assessment);
    } catch (error) {
      logger.error({ playerId: tp.playerId, error }, 'Failed to calculate market value');
    }
  }

  // Sort by value descending
  return assessments.sort((a, b) => b.valuation.currentValue - a.valuation.currentValue);
}

/**
 * Get team total market value
 */
export async function calculateTeamTotalValue(teamId: string): Promise<{
  totalValue: number;
  playerCount: number;
  avgValue: number;
  highestValue: { playerId: string; name: string; value: number } | null;
}> {
  const assessments = await calculateTeamMarketValues(teamId);

  const totalValue = assessments.reduce((sum, a) => sum + a.valuation.currentValue, 0);
  const avgValue = assessments.length > 0 ? Math.round(totalValue / assessments.length) : 0;
  
  const highest = assessments[0];

  return {
    totalValue,
    playerCount: assessments.length,
    avgValue,
    highestValue: highest ? {
      playerId: highest.playerId,
      name: highest.playerName,
      value: highest.valuation.currentValue,
    } : null,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  BASE_VALUES_BY_SPORT,
  PERFORMANCE_TIERS,
  MODEL_VERSION as MARKET_VALUE_MODEL_VERSION,
};