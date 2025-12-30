// ============================================================================
// src/lib/analytics/player-comparator.ts
// ⚖️ PitchConnect Enterprise Analytics - Player Comparison Engine
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// INTEGRATES: Existing cache system, Multi-sport metrics
// ============================================================================

import { prisma } from '@/lib/prisma';
import { getOrSetCache } from '@/lib/cache/redis';
import { logger } from '@/lib/logging';
import {
  getSportMetricConfig,
  getRatingWeights,
  getPositionValueMultiplier,
} from './sport-metrics';
import type {
  PlayerComparison,
  PlayerComparisonProfile,
  CategoryComparison,
} from './types';
import type { Sport, Position } from '@prisma/client';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL_VERSION = '2.0.0-comparison';
const CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours
const CACHE_PREFIX = 'analytics:comparison';

// Comparison categories with weights
const COMPARISON_CATEGORIES = [
  { name: 'Overall Rating', key: 'overall', weight: 0.2 },
  { name: 'Goals', key: 'goals', weight: 0.15 },
  { name: 'Assists', key: 'assists', weight: 0.12 },
  { name: 'Minutes Played', key: 'minutes', weight: 0.1 },
  { name: 'Consistency', key: 'consistency', weight: 0.12 },
  { name: 'Form', key: 'form', weight: 0.15 },
  { name: 'Appearances', key: 'appearances', weight: 0.08 },
  { name: 'Age Profile', key: 'age', weight: 0.08 },
];

// ============================================================================
// MAIN COMPARISON FUNCTION
// ============================================================================

/**
 * Compare two players in detail
 */
export async function comparePlayerStats(
  player1Id: string,
  player2Id: string,
  forceRefresh: boolean = false
): Promise<PlayerComparison> {
  // Sort IDs to ensure consistent cache key
  const sortedIds = [player1Id, player2Id].sort();
  const cacheKey = `${CACHE_PREFIX}:${sortedIds[0]}:${sortedIds[1]}`;

  if (!forceRefresh) {
    try {
      const cached = await getOrSetCache<PlayerComparison>(
        cacheKey,
        async () => generateComparison(player1Id, player2Id),
        CACHE_TTL_SECONDS
      );
      return cached;
    } catch (error) {
      logger.warn({ player1Id, player2Id, error }, 'Cache miss, generating fresh comparison');
    }
  }

  return generateComparison(player1Id, player2Id);
}

/**
 * Generate player comparison (internal)
 */
async function generateComparison(
  player1Id: string,
  player2Id: string
): Promise<PlayerComparison> {
  // Fetch both players with all related data
  const [player1Data, player2Data] = await Promise.all([
    fetchPlayerData(player1Id),
    fetchPlayerData(player2Id),
  ]);

  if (!player1Data) {
    throw new Error(`Player 1 not found: ${player1Id}`);
  }
  if (!player2Data) {
    throw new Error(`Player 2 not found: ${player2Id}`);
  }

  // Determine sport (use first player's sport or default)
  const sport = player1Data.sport || player2Data.sport || 'FOOTBALL';

  // Build comparison profiles
  const player1 = buildProfile(player1Data, sport);
  const player2 = buildProfile(player2Data, sport);

  // Calculate category comparisons
  const categoryComparison = calculateCategoryComparisons(player1, player2, player1Data, player2Data, sport);

  // Calculate overall similarity
  const overallSimilarity = calculateSimilarity(player1, player2, categoryComparison);

  // Determine head-to-head winner
  const headToHead = determineWinner(categoryComparison);

  // Analyze strengths
  const strengthsComparison = analyzeStrengths(categoryComparison, player1Data, player2Data);

  // Value comparison
  const valueComparison = compareValues(player1, player2, sport);

  // Generate recommendation
  const recommendation = generateRecommendation(
    player1,
    player2,
    headToHead,
    categoryComparison,
    sport
  );

  const comparison: PlayerComparison = {
    player1,
    player2,
    overallSimilarity,
    headToHead,
    categoryComparison,
    strengthsComparison,
    valueComparison,
    recommendation,
    metadata: {
      modelVersion: MODEL_VERSION,
      generatedAt: new Date(),
      sport,
      positionsCompared: `${player1.position || 'N/A'} vs ${player2.position || 'N/A'}`,
    },
  };

  logger.info({
    player1Id,
    player2Id,
    similarity: overallSimilarity,
    winner: headToHead.winner,
  }, 'Player comparison generated');

  return comparison;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch player data for comparison
 */
async function fetchPlayerData(playerId: string) {
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
      matchPerformances: {
        orderBy: { createdAt: 'desc' },
        take: 20,
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
        take: 1,
      },
    },
  });

  if (!player) return null;

  const sport = player.teamPlayers[0]?.team.club.sport || 'FOOTBALL';
  const teamName = player.teamPlayers[0]?.team.club.name || 'Unknown';

  // Calculate age
  let age: number | null = null;
  if (player.user.dateOfBirth) {
    age = Math.floor(
      (Date.now() - new Date(player.user.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
  }

  // Calculate stats
  const performances = player.matchPerformances || [];
  const stats = player.statistics[0];

  const ratings = performances.map(p => p.rating).filter(r => r != null);
  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 6.0;

  // Calculate consistency
  let consistency = 50;
  if (ratings.length > 1) {
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length;
    consistency = Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 20));
  }

  // Calculate form rating (last 5 matches)
  const recentRatings = ratings.slice(0, 5);
  const formRating = recentRatings.length > 0
    ? recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length
    : avgRating;

  return {
    id: player.id,
    name: `${player.user.firstName} ${player.user.lastName}`,
    position: player.primaryPosition,
    age,
    sport,
    teamName,
    overallRating: player.overallRating || avgRating,
    formRating: player.formRating || formRating,
    marketValue: player.marketValue || 100000,
    performances,
    stats: {
      appearances: stats?.appearances || performances.length,
      goals: stats?.goals || performances.reduce((sum, p) => sum + (p.goals || 0), 0),
      assists: stats?.assists || performances.reduce((sum, p) => sum + (p.assists || 0), 0),
      minutesPlayed: stats?.minutesPlayed || performances.reduce((sum, p) => sum + (p.minutesPlayed || 0), 0),
      avgRating,
    },
    consistency,
  };
}

// ============================================================================
// PROFILE BUILDING
// ============================================================================

/**
 * Build comparison profile from player data
 */
function buildProfile(data: any, sport: Sport): PlayerComparisonProfile {
  return {
    id: data.id,
    name: data.name,
    position: data.position,
    age: data.age,
    overallRating: Math.round(data.overallRating * 10) / 10,
    formRating: Math.round(data.formRating * 10) / 10,
    marketValue: data.marketValue,
    stats: {
      appearances: data.stats.appearances,
      goals: data.stats.goals,
      assists: data.stats.assists,
      minutesPlayed: data.stats.minutesPlayed,
      avgRating: Math.round(data.stats.avgRating * 10) / 10,
    },
    attributes: {
      consistency: Math.round(data.consistency),
      form: Math.round(data.formRating * 10),
      experience: Math.min(100, data.stats.appearances * 2),
      productivity: calculateProductivity(data.stats),
    },
  };
}

/**
 * Calculate productivity score
 */
function calculateProductivity(stats: any): number {
  if (stats.appearances === 0) return 0;
  
  const goalsPerGame = stats.goals / stats.appearances;
  const assistsPerGame = stats.assists / stats.appearances;
  
  // Productivity = weighted combination of goals + assists per game
  const productivity = (goalsPerGame * 0.6 + assistsPerGame * 0.4) * 100;
  
  return Math.min(100, Math.round(productivity));
}

// ============================================================================
// COMPARISON CALCULATIONS
// ============================================================================

/**
 * Calculate category-by-category comparisons
 */
function calculateCategoryComparisons(
  profile1: PlayerComparisonProfile,
  profile2: PlayerComparisonProfile,
  data1: any,
  data2: any,
  sport: Sport
): CategoryComparison[] {
  const comparisons: CategoryComparison[] = [];

  for (const category of COMPARISON_CATEGORIES) {
    let score1 = 0;
    let score2 = 0;

    switch (category.key) {
      case 'overall':
        score1 = profile1.overallRating * 10;
        score2 = profile2.overallRating * 10;
        break;
      case 'goals':
        score1 = normalizeToScale(data1.stats.goals, 0, 30);
        score2 = normalizeToScale(data2.stats.goals, 0, 30);
        break;
      case 'assists':
        score1 = normalizeToScale(data1.stats.assists, 0, 20);
        score2 = normalizeToScale(data2.stats.assists, 0, 20);
        break;
      case 'minutes':
        score1 = normalizeToScale(data1.stats.minutesPlayed, 0, 3000);
        score2 = normalizeToScale(data2.stats.minutesPlayed, 0, 3000);
        break;
      case 'consistency':
        score1 = data1.consistency;
        score2 = data2.consistency;
        break;
      case 'form':
        score1 = profile1.formRating * 10;
        score2 = profile2.formRating * 10;
        break;
      case 'appearances':
        score1 = normalizeToScale(data1.stats.appearances, 0, 40);
        score2 = normalizeToScale(data2.stats.appearances, 0, 40);
        break;
      case 'age':
        // Younger is better (within prime years)
        score1 = getAgeScore(data1.age);
        score2 = getAgeScore(data2.age);
        break;
    }

    const winner: 'PLAYER1' | 'PLAYER2' | 'DRAW' =
      score1 > score2 + 2 ? 'PLAYER1' :
      score2 > score1 + 2 ? 'PLAYER2' : 'DRAW';

    comparisons.push({
      category: category.name,
      player1Score: Math.round(score1),
      player2Score: Math.round(score2),
      winner,
      difference: Math.round(Math.abs(score1 - score2)),
      weight: category.weight,
    });
  }

  return comparisons;
}

/**
 * Normalize value to 0-100 scale
 */
function normalizeToScale(value: number, min: number, max: number): number {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Get age score (prime years = highest)
 */
function getAgeScore(age: number | null): number {
  if (age === null) return 50;
  
  if (age < 21) return 60 + (age - 18) * 5; // Young potential
  if (age >= 21 && age <= 24) return 80 + (age - 21) * 5; // Rising
  if (age >= 25 && age <= 29) return 95; // Prime
  if (age >= 30 && age <= 32) return 85 - (age - 30) * 5; // Experienced
  if (age > 32) return Math.max(50, 70 - (age - 32) * 5); // Declining
  
  return 50;
}

/**
 * Calculate overall similarity percentage
 */
function calculateSimilarity(
  profile1: PlayerComparisonProfile,
  profile2: PlayerComparisonProfile,
  categoryComparisons: CategoryComparison[]
): number {
  // Position similarity
  const samePosition = profile1.position === profile2.position;
  let similarity = samePosition ? 30 : 10;

  // Rating similarity
  const ratingDiff = Math.abs(profile1.overallRating - profile2.overallRating);
  similarity += Math.max(0, 20 - ratingDiff * 5);

  // Stats similarity
  const statsDiff = categoryComparisons.reduce((sum, c) => sum + c.difference, 0) / categoryComparisons.length;
  similarity += Math.max(0, 30 - statsDiff * 0.3);

  // Age similarity
  if (profile1.age && profile2.age) {
    const ageDiff = Math.abs(profile1.age - profile2.age);
    similarity += Math.max(0, 20 - ageDiff * 3);
  }

  return Math.round(Math.min(100, similarity));
}

/**
 * Determine overall winner
 */
function determineWinner(categoryComparisons: CategoryComparison[]): PlayerComparison['headToHead'] {
  let player1Wins = 0;
  let player2Wins = 0;
  let ties = 0;
  let weightedScore1 = 0;
  let weightedScore2 = 0;

  const player1Categories: string[] = [];
  const player2Categories: string[] = [];
  const tiedCategories: string[] = [];

  for (const c of categoryComparisons) {
    weightedScore1 += c.player1Score * c.weight;
    weightedScore2 += c.player2Score * c.weight;

    if (c.winner === 'PLAYER1') {
      player1Wins++;
      player1Categories.push(c.category);
    } else if (c.winner === 'PLAYER2') {
      player2Wins++;
      player2Categories.push(c.category);
    } else {
      ties++;
      tiedCategories.push(c.category);
    }
  }

  const winner: 'PLAYER1' | 'PLAYER2' | 'DRAW' =
    weightedScore1 > weightedScore2 + 5 ? 'PLAYER1' :
    weightedScore2 > weightedScore1 + 5 ? 'PLAYER2' : 'DRAW';

  const margin = Math.abs(weightedScore1 - weightedScore2);

  return {
    winner,
    winningCategories: {
      player1: player1Categories,
      player2: player2Categories,
      tied: tiedCategories,
    },
    margin: Math.round(margin),
  };
}

/**
 * Analyze strengths and weaknesses
 */
function analyzeStrengths(
  categoryComparisons: CategoryComparison[],
  data1: any,
  data2: any
): PlayerComparison['strengthsComparison'] {
  const player1Advantages: string[] = [];
  const player2Advantages: string[] = [];
  const sharedStrengths: string[] = [];

  for (const c of categoryComparisons) {
    if (c.difference >= 15) {
      if (c.winner === 'PLAYER1') {
        player1Advantages.push(c.category);
      } else if (c.winner === 'PLAYER2') {
        player2Advantages.push(c.category);
      }
    } else if (c.player1Score >= 70 && c.player2Score >= 70) {
      sharedStrengths.push(c.category);
    }
  }

  // Add context-specific strengths
  if (data1.consistency >= 75) player1Advantages.push('High Consistency');
  if (data2.consistency >= 75) player2Advantages.push('High Consistency');

  return {
    player1Advantages,
    player2Advantages,
    sharedStrengths,
  };
}

/**
 * Compare market values
 */
function compareValues(
  profile1: PlayerComparisonProfile,
  profile2: PlayerComparisonProfile,
  sport: Sport
): PlayerComparison['valueComparison'] {
  const valueDiff = profile1.marketValue - profile2.marketValue;
  
  let betterValue: 'PLAYER1' | 'PLAYER2' | 'EQUAL' = 'EQUAL';
  
  // Compare value relative to rating
  const valuePerRating1 = profile1.marketValue / Math.max(profile1.overallRating, 1);
  const valuePerRating2 = profile2.marketValue / Math.max(profile2.overallRating, 1);
  
  if (valuePerRating1 < valuePerRating2 * 0.9) {
    betterValue = 'PLAYER1'; // Player 1 is better value
  } else if (valuePerRating2 < valuePerRating1 * 0.9) {
    betterValue = 'PLAYER2';
  }

  return {
    player1Value: profile1.marketValue,
    player2Value: profile2.marketValue,
    valueDifference: Math.abs(valueDiff),
    betterValue,
  };
}

/**
 * Generate comparison recommendation
 */
function generateRecommendation(
  profile1: PlayerComparisonProfile,
  profile2: PlayerComparisonProfile,
  headToHead: PlayerComparison['headToHead'],
  categoryComparisons: CategoryComparison[],
  sport: Sport
): PlayerComparison['recommendation'] {
  const winnerName = headToHead.winner === 'PLAYER1' ? profile1.name :
                     headToHead.winner === 'PLAYER2' ? profile2.name : 'Neither';

  let summary = '';
  if (headToHead.winner === 'DRAW') {
    summary = `${profile1.name} and ${profile2.name} are closely matched overall`;
  } else {
    const margin = headToHead.margin >= 20 ? 'significantly' : 'marginally';
    summary = `${winnerName} is ${margin} better overall`;
  }

  // Determine best use cases
  const bestFor: Record<string, 'PLAYER1' | 'PLAYER2'> = {};
  
  const goalsComparison = categoryComparisons.find(c => c.category === 'Goals');
  if (goalsComparison && goalsComparison.winner !== 'DRAW') {
    bestFor['Goal Scoring'] = goalsComparison.winner;
  }
  
  const formComparison = categoryComparisons.find(c => c.category === 'Form');
  if (formComparison && formComparison.winner !== 'DRAW') {
    bestFor['Immediate Impact'] = formComparison.winner;
  }
  
  const ageComparison = categoryComparisons.find(c => c.category === 'Age Profile');
  if (ageComparison && ageComparison.winner !== 'DRAW') {
    bestFor['Long-term Investment'] = ageComparison.winner;
  }

  const context = profile1.position === profile2.position
    ? `Both players play ${profile1.position}, making this a direct positional comparison.`
    : `Players play different positions (${profile1.position || 'N/A'} vs ${profile2.position || 'N/A'}), which affects direct comparison.`;

  return {
    summary,
    bestFor,
    context,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  COMPARISON_CATEGORIES,
  MODEL_VERSION as COMPARISON_MODEL_VERSION,
};