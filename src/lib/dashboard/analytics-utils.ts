// ============================================================================
// PHASE 9: src/lib/dashboard/analytics-utils.ts
// Utility Functions for Analytics Data Transformation
//
// Features:
// - Calculate KPI metrics
// - Format data for charts
// - Transform API responses
// - Calculate trends
//
// Usage:
// const formScore = calculateFormScore(recentMatches)
// ============================================================================

/**
 * Calculate team form score from recent matches
 * Formula: (Wins * 3 + Draws * 1) / matches * 100
 */
export function calculateFormScore(
  matches: Array<{ result: 'win' | 'draw' | 'loss' }>
): number {
  if (matches.length === 0) return 0;

  const points = matches.reduce((total, match) => {
    if (match.result === 'win') return total + 3;
    if (match.result === 'draw') return total + 1;
    return total;
  }, 0);

  const percentage = (points / (matches.length * 3)) * 100;
  return Math.round(percentage);
}

/**
 * Calculate win percentage from matches
 */
export function calculateWinPercentage(
  matches: Array<{ result: 'win' | 'draw' | 'loss' }>
): number {
  if (matches.length === 0) return 0;

  const wins = matches.filter((m) => m.result === 'win').length;
  return Math.round((wins / matches.length) * 100);
}

/**
 * Calculate average goals per match
 */
export function calculateAverageGoals(
  matches: Array<{ goalsFor: number }>
): number {
  if (matches.length === 0) return 0;

  const totalGoals = matches.reduce((sum, m) => sum + m.goalsFor, 0);
  return parseFloat((totalGoals / matches.length).toFixed(2));
}

/**
 * Calculate pass accuracy percentage
 */
export function calculatePassAccuracy(
  matches: Array<{ completedPasses: number; totalPasses: number }>
): number {
  if (matches.length === 0) return 0;

  const totalCompleted = matches.reduce((sum, m) => sum + m.completedPasses, 0);
  const totalAttempts = matches.reduce((sum, m) => sum + m.totalPasses, 0);

  if (totalAttempts === 0) return 0;
  return Math.round((totalCompleted / totalAttempts) * 100);
}

/**
 * Calculate trend (improving, stable, declining)
 */
export function calculateTrend(
  current: number,
  previous: number
): 'improving' | 'stable' | 'declining' {
  const difference = current - previous;
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}

/**
 * Format large numbers with K/M suffix
 * Example: 1000 -> "1K", 1000000 -> "1M"
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format percentage with % symbol
 */
export function formatPercentage(num: number): string {
  return `${Math.round(num)}%`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date range for display
 */
export function formatDateRange(from: Date | string, to: Date | string): string {
  return `${formatDate(from)} - ${formatDate(to)}`;
}

/**
 * Transform match data for chart display
 */
export function transformMatchDataForChart(
  matches: Array<{
    date: string;
    goalsFor: number;
    goalsAgainst: number;
  }>
) {
  return matches.map((match) => ({
    date: formatDate(match.date),
    goals: match.goalsFor,
    conceded: match.goalsAgainst,
  }));
}

/**
 * Get trend color based on value
 */
export function getTrendColor(
  trend: 'improving' | 'stable' | 'declining'
): string {
  switch (trend) {
    case 'improving':
      return 'text-green-600 dark:text-green-400';
    case 'declining':
      return 'text-red-600 dark:text-red-400';
    case 'stable':
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Get trend icon based on value
 */
export function getTrendIcon(
  trend: 'improving' | 'stable' | 'declining'
): string {
  switch (trend) {
    case 'improving':
      return '↑';
    case 'declining':
      return '↓';
    case 'stable':
      return '→';
  }
}
