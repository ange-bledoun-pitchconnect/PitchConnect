/**
 * ============================================================================
 * ⚖️ PITCHCONNECT ANALYTICS - PLAYER COMPARATOR v7.10.1
 * ============================================================================
 * Enterprise player comparison system for all 12 sports
 * Head-to-head statistical comparison with recommendations
 * ============================================================================
 */

import type {
  Sport,
  PlayerComparison,
  PlayerComparisonProfile,
  CategoryComparison,
} from './types';
import { getSportMetricConfig, getKeyMetricsForSport } from './sport-metrics';

// =============================================================================
// CONSTANTS
// =============================================================================

export const COMPARISON_MODEL_VERSION = '7.10.1-comparison';

// Comparison categories by sport
export const COMPARISON_CATEGORIES: Record<Sport, string[]> = {
  FOOTBALL: ['Attacking', 'Playmaking', 'Defensive', 'Physical', 'Technical'],
  RUGBY: ['Attack', 'Defense', 'Set Pieces', 'Physical', 'Game Management'],
  CRICKET: ['Batting', 'Bowling', 'Fielding', 'Match Winning', 'Consistency'],
  BASKETBALL: ['Scoring', 'Playmaking', 'Rebounding', 'Defense', 'Efficiency'],
  AMERICAN_FOOTBALL: ['Offense', 'Defense', 'Special Teams', 'Athleticism', 'Leadership'],
  NETBALL: ['Shooting', 'Feeding', 'Defending', 'Movement', 'Decision Making'],
  HOCKEY: ['Attack', 'Defense', 'Set Pieces', 'Fitness', 'Stick Skills'],
  LACROSSE: ['Offense', 'Defense', 'Ground Balls', 'Face-offs', 'Athleticism'],
  AUSTRALIAN_RULES: ['Disposal', 'Marking', 'Tackling', 'Clearances', 'Goal Kicking'],
  GAELIC_FOOTBALL: ['Scoring', 'Tackling', 'Kickouts', 'Work Rate', 'Skill'],
  FUTSAL: ['Goals', 'Assists', 'Defense', 'Technical', 'Positioning'],
  BEACH_FOOTBALL: ['Goals', 'Assists', 'Saves', 'Technical', 'Acrobatics'],
};

// Category metrics mapping
const CATEGORY_METRICS: Record<string, string[]> = {
  // Football
  Attacking: ['goals', 'shots', 'shotAccuracy', 'xG'],
  Playmaking: ['assists', 'keyPasses', 'throughBalls', 'xA'],
  Defensive: ['tackles', 'interceptions', 'clearances', 'blocks'],
  Physical: ['aerialDuelsWon', 'duelsWon', 'distance', 'sprints'],
  Technical: ['passAccuracy', 'dribbleSuccess', 'touches', 'ballControl'],
  
  // Rugby
  Attack: ['tries', 'metersGained', 'lineBreaks', 'offloads'],
  Defense: ['tackles', 'tackleSuccess', 'turnoversWon', 'missedTackles'],
  'Set Pieces': ['lineoutWins', 'scrumWins', 'kickingSuccess'],
  'Game Management': ['penalties', 'discipline', 'decisionMaking'],
  
  // Basketball
  Scoring: ['points', 'fieldGoalPct', 'threePointPct', 'freeThrowPct'],
  Rebounding: ['rebounds', 'offensiveRebounds', 'defensiveRebounds'],
  
  // Cricket
  Batting: ['runs', 'battingAverage', 'strikeRate', 'boundaries'],
  Bowling: ['wickets', 'bowlingAverage', 'economyRate', 'strikeRate'],
  Fielding: ['catches', 'runOuts', 'stumpings'],
  'Match Winning': ['centuries', 'fifties', 'highScores', 'clutchPerformances'],
  Consistency: ['averageScore', 'variance', 'notOuts'],
  
  // Generic
  Movement: ['positioning', 'offTheBall', 'spaceCreation'],
  'Decision Making': ['passSelection', 'shotSelection', 'timing'],
  Leadership: ['captaincy', 'communication', 'experience'],
};

// =============================================================================
// CACHE
// =============================================================================

interface ComparisonCache {
  comparisons: Map<string, { data: PlayerComparison; expiresAt: Date }>;
}

const comparisonCache: ComparisonCache = {
  comparisons: new Map(),
};

const CACHE_TTL = 60 * 60 * 6 * 1000; // 6 hours

// =============================================================================
// MAIN COMPARISON FUNCTION
// =============================================================================

/**
 * Compare two players' statistics
 */
export async function comparePlayerStats(
  player1Id: string,
  player2Id: string,
  player1Data: {
    name: string;
    sport: Sport;
    position: string;
    age: number;
    matchesPlayed: number;
    averageRating: number;
    marketValue?: number;
    
    // Stats (generic - works for all sports)
    stats: Record<string, number>;
  },
  player2Data: {
    name: string;
    sport: Sport;
    position: string;
    age: number;
    matchesPlayed: number;
    averageRating: number;
    marketValue?: number;
    stats: Record<string, number>;
  },
  forceRefresh: boolean = false
): Promise<PlayerComparison> {
  // Validate same sport
  if (player1Data.sport !== player2Data.sport) {
    throw new Error('Cannot compare players from different sports');
  }
  
  const sport = player1Data.sport;
  
  // Check cache
  const cacheKey = `compare:${[player1Id, player2Id].sort().join(':')}`;
  if (!forceRefresh) {
    const cached = comparisonCache.comparisons.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }
  }
  
  // Build player profiles
  const player1: PlayerComparisonProfile = {
    playerId: player1Id,
    name: player1Data.name,
    position: player1Data.position,
    age: player1Data.age,
    matchesPlayed: player1Data.matchesPlayed,
    averageRating: player1Data.averageRating,
    marketValue: player1Data.marketValue,
  };
  
  const player2: PlayerComparisonProfile = {
    playerId: player2Id,
    name: player2Data.name,
    position: player2Data.position,
    age: player2Data.age,
    matchesPlayed: player2Data.matchesPlayed,
    averageRating: player2Data.averageRating,
    marketValue: player2Data.marketValue,
  };
  
  // Get comparison categories for sport
  const categories = COMPARISON_CATEGORIES[sport];
  const categoryComparisons: CategoryComparison[] = [];
  
  let totalPlayer1Score = 0;
  let totalPlayer2Score = 0;
  
  for (const category of categories) {
    const categoryResult = compareCategory(
      category,
      player1Data.stats,
      player2Data.stats,
      sport
    );
    
    categoryComparisons.push(categoryResult);
    totalPlayer1Score += categoryResult.player1Score;
    totalPlayer2Score += categoryResult.player2Score;
  }
  
  // Determine overall winner
  let overallWinner: PlayerComparison['overallWinner'];
  const scoreDiff = totalPlayer1Score - totalPlayer2Score;
  if (scoreDiff > 5) {
    overallWinner = 'PLAYER1';
  } else if (scoreDiff < -5) {
    overallWinner = 'PLAYER2';
  } else {
    overallWinner = 'DRAW';
  }
  
  const winnerAdvantage = Math.abs(scoreDiff / (totalPlayer1Score + totalPlayer2Score)) * 100;
  
  // Find key differences
  const keyDifferences = findKeyDifferences(player1Data.stats, player2Data.stats, sport);
  
  // Generate recommendations
  const recommendations = generateComparisonRecommendations(
    player1Data,
    player2Data,
    categoryComparisons
  );
  
  // Build comparison
  const comparison: PlayerComparison = {
    player1,
    player2,
    sport,
    categories: categoryComparisons,
    overallWinner,
    winnerAdvantage: Math.round(winnerAdvantage * 10) / 10,
    keyDifferences,
    recommendations,
    generatedAt: new Date(),
    modelVersion: COMPARISON_MODEL_VERSION,
  };
  
  // Cache result
  comparisonCache.comparisons.set(cacheKey, {
    data: comparison,
    expiresAt: new Date(Date.now() + CACHE_TTL),
  });
  
  return comparison;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function compareCategory(
  category: string,
  player1Stats: Record<string, number>,
  player2Stats: Record<string, number>,
  sport: Sport
): CategoryComparison {
  const metricNames = CATEGORY_METRICS[category] || getKeyMetricsForSport(sport).map(m => m.name);
  
  const metrics: CategoryComparison['metrics'] = [];
  let player1Total = 0;
  let player2Total = 0;
  let validMetrics = 0;
  
  for (const metricName of metricNames) {
    const player1Value = player1Stats[metricName];
    const player2Value = player2Stats[metricName];
    
    if (player1Value !== undefined && player2Value !== undefined) {
      metrics.push({
        name: formatMetricName(metricName),
        player1: player1Value,
        player2: player2Value,
      });
      
      // Normalize and score (higher is better for most metrics)
      const max = Math.max(player1Value, player2Value, 0.01);
      player1Total += (player1Value / max) * 100;
      player2Total += (player2Value / max) * 100;
      validMetrics++;
    }
  }
  
  // Average scores
  const player1Score = validMetrics > 0 ? Math.round(player1Total / validMetrics) : 50;
  const player2Score = validMetrics > 0 ? Math.round(player2Total / validMetrics) : 50;
  
  // Determine winner
  let winner: CategoryComparison['winner'] = 'DRAW';
  if (player1Score > player2Score + 5) winner = 'PLAYER1';
  else if (player2Score > player1Score + 5) winner = 'PLAYER2';
  
  return {
    category,
    player1Score,
    player2Score,
    winner,
    metrics,
  };
}

function formatMetricName(name: string): string {
  // Convert camelCase to Title Case
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function findKeyDifferences(
  player1Stats: Record<string, number>,
  player2Stats: Record<string, number>,
  sport: Sport
): PlayerComparison['keyDifferences'] {
  const differences: PlayerComparison['keyDifferences'] = [];
  
  const allMetrics = new Set([...Object.keys(player1Stats), ...Object.keys(player2Stats)]);
  
  for (const metric of allMetrics) {
    const p1 = player1Stats[metric] ?? 0;
    const p2 = player2Stats[metric] ?? 0;
    
    if (p1 === 0 && p2 === 0) continue;
    
    const max = Math.max(p1, p2);
    const diff = Math.abs(p1 - p2);
    const diffPct = (diff / max) * 100;
    
    if (diffPct > 20) {
      differences.push({
        metric: formatMetricName(metric),
        player1Value: p1,
        player2Value: p2,
        advantage: p1 > p2 ? 'PLAYER1' : 'PLAYER2',
        significance: diffPct > 50 ? 'HIGH' : diffPct > 30 ? 'MEDIUM' : 'LOW',
      });
    }
  }
  
  return differences
    .sort((a, b) => {
      const sigOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return sigOrder[a.significance] - sigOrder[b.significance];
    })
    .slice(0, 6);
}

function generateComparisonRecommendations(
  player1Data: { name: string; stats: Record<string, number> },
  player2Data: { name: string; stats: Record<string, number> },
  categories: CategoryComparison[]
): PlayerComparison['recommendations'] {
  const forPlayer1: string[] = [];
  const forPlayer2: string[] = [];
  
  for (const cat of categories) {
    if (cat.winner === 'PLAYER2') {
      forPlayer1.push(`Improve ${cat.category.toLowerCase()} to match ${player2Data.name}'s level`);
    } else if (cat.winner === 'PLAYER1') {
      forPlayer2.push(`Improve ${cat.category.toLowerCase()} to match ${player1Data.name}'s level`);
    }
  }
  
  // Add generic recommendations
  if (forPlayer1.length < 2) {
    forPlayer1.push('Maintain current performance levels');
    forPlayer1.push('Focus on consistency across all categories');
  }
  if (forPlayer2.length < 2) {
    forPlayer2.push('Maintain current performance levels');
    forPlayer2.push('Focus on consistency across all categories');
  }
  
  return {
    forPlayer1: forPlayer1.slice(0, 4),
    forPlayer2: forPlayer2.slice(0, 4),
  };
}

// =============================================================================
// MULTI-PLAYER COMPARISON
// =============================================================================

/**
 * Compare multiple players and rank them
 */
export async function rankPlayers(
  sport: Sport,
  players: {
    playerId: string;
    name: string;
    position: string;
    stats: Record<string, number>;
    averageRating: number;
  }[]
): Promise<{
  rankings: {
    rank: number;
    playerId: string;
    name: string;
    score: number;
    strengths: string[];
  }[];
  categoryLeaders: {
    category: string;
    leader: string;
    score: number;
  }[];
}> {
  const categories = COMPARISON_CATEGORIES[sport];
  const playerScores: { playerId: string; name: string; totalScore: number; categoryScores: Record<string, number> }[] = [];
  
  // Calculate scores for each player
  for (const player of players) {
    const categoryScores: Record<string, number> = {};
    let totalScore = 0;
    
    for (const category of categories) {
      const metrics = CATEGORY_METRICS[category] || [];
      let categoryTotal = 0;
      let metricCount = 0;
      
      for (const metric of metrics) {
        if (player.stats[metric] !== undefined) {
          // Find max value across all players for normalization
          const maxValue = Math.max(...players.map(p => p.stats[metric] ?? 0), 0.01);
          categoryTotal += (player.stats[metric] / maxValue) * 100;
          metricCount++;
        }
      }
      
      const categoryScore = metricCount > 0 ? categoryTotal / metricCount : 50;
      categoryScores[category] = Math.round(categoryScore);
      totalScore += categoryScore;
    }
    
    playerScores.push({
      playerId: player.playerId,
      name: player.name,
      totalScore: totalScore / categories.length,
      categoryScores,
    });
  }
  
  // Sort by total score
  playerScores.sort((a, b) => b.totalScore - a.totalScore);
  
  // Build rankings
  const rankings = playerScores.map((p, index) => {
    const strengths = Object.entries(p.categoryScores)
      .filter(([_, score]) => score >= 70)
      .map(([category]) => category);
    
    return {
      rank: index + 1,
      playerId: p.playerId,
      name: p.name,
      score: Math.round(p.totalScore),
      strengths,
    };
  });
  
  // Find category leaders
  const categoryLeaders = categories.map(category => {
    const leader = playerScores.reduce((best, current) => 
      (current.categoryScores[category] ?? 0) > (best.categoryScores[category] ?? 0) ? current : best
    );
    return {
      category,
      leader: leader.name,
      score: leader.categoryScores[category] ?? 0,
    };
  });
  
  return { rankings, categoryLeaders };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  comparePlayerStats,
  rankPlayers,
  COMPARISON_CATEGORIES,
  COMPARISON_MODEL_VERSION,
};
