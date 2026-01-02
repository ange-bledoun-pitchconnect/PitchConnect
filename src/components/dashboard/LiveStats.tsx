/**
 * ============================================================================
 * LiveStats Component
 * ============================================================================
 * 
 * Enterprise-grade live match statistics with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All match viewers
 * - ANALYST: Detailed statistics
 * - COACH: Team performance
 * - BROADCASTER: Match data
 * 
 * SCHEMA ALIGNMENT:
 * - MatchResult model
 * - Sport enum (all 12 sports)
 * 
 * FEATURES:
 * - Sport-specific statistics
 * - Visual comparison bars
 * - Category filtering
 * - Dark mode support
 * - Responsive design
 * - Real-time updates
 * - Accessible
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getSportStatistics,
  type Sport,
  type SportStatistic,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface TeamStats {
  [key: string]: number | undefined;
}

export interface LiveStatsProps {
  /** Sport type */
  sport: Sport;
  /** Home team stats */
  homeStats: TeamStats;
  /** Away team stats */
  awayStats: TeamStats;
  /** Home team name */
  homeTeamName?: string;
  /** Away team name */
  awayTeamName?: string;
  /** Show category filter tabs */
  showCategoryFilter?: boolean;
  /** Highlight key stats */
  highlightKeyStats?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
  /** Real-time indicator */
  isLive?: boolean;
}

// =============================================================================
// STAT ROW COMPONENT
// =============================================================================

interface StatRowProps {
  stat: SportStatistic;
  homeValue: number;
  awayValue: number;
  compact?: boolean;
  highlighted?: boolean;
}

function StatRow({ stat, homeValue, awayValue, compact, highlighted }: StatRowProps) {
  // Calculate percentages for bar width
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;

  // Determine which side is "winning" for this stat
  const homeWinning = stat.higherIsBetter ? homeValue > awayValue : homeValue < awayValue;
  const awayWinning = stat.higherIsBetter ? awayValue > homeValue : awayValue < homeValue;
  const tied = homeValue === awayValue;

  // Format value based on stat type
  const formatValue = (value: number) => {
    switch (stat.type) {
      case 'percentage':
        return `${value}${stat.unit || '%'}`;
      case 'duration':
        return `${value}${stat.unit || 'min'}`;
      case 'distance':
        return `${value}${stat.unit || 'm'}`;
      case 'ratio':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  return (
    <div
      className={cn(
        'py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0',
        highlighted && 'bg-primary/5 dark:bg-primary/10 px-3 -mx-3 rounded-lg'
      )}
    >
      {/* Stat Label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {stat.label}
        </span>
        {highlighted && (
          <Badge variant="secondary" className="text-xs">
            Key Stat
          </Badge>
        )}
      </div>

      {/* Values and Bar */}
      <div className="flex items-center gap-4">
        {/* Home Value */}
        <div className={cn('w-16 text-right', compact && 'w-12')}>
          <span
            className={cn(
              'text-lg font-bold',
              compact && 'text-base',
              homeWinning && 'text-green-600 dark:text-green-400',
              !homeWinning && !tied && 'text-gray-700 dark:text-gray-300',
              tied && 'text-gray-700 dark:text-gray-300'
            )}
          >
            {formatValue(homeValue)}
          </span>
        </div>

        {/* Comparison Bar */}
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
          <div
            className={cn(
              'h-full transition-all duration-500',
              homeWinning
                ? 'bg-green-500 dark:bg-green-600'
                : tied
                  ? 'bg-gray-400 dark:bg-gray-500'
                  : 'bg-blue-400 dark:bg-blue-500'
            )}
            style={{ width: `${homePercent}%` }}
          />
          <div
            className={cn(
              'h-full transition-all duration-500',
              awayWinning
                ? 'bg-green-500 dark:bg-green-600'
                : tied
                  ? 'bg-gray-400 dark:bg-gray-500'
                  : 'bg-orange-400 dark:bg-orange-500'
            )}
            style={{ width: `${awayPercent}%` }}
          />
        </div>

        {/* Away Value */}
        <div className={cn('w-16 text-left', compact && 'w-12')}>
          <span
            className={cn(
              'text-lg font-bold',
              compact && 'text-base',
              awayWinning && 'text-green-600 dark:text-green-400',
              !awayWinning && !tied && 'text-gray-700 dark:text-gray-300',
              tied && 'text-gray-700 dark:text-gray-300'
            )}
          >
            {formatValue(awayValue)}
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LiveStats({
  sport,
  homeStats,
  awayStats,
  homeTeamName = 'Home',
  awayTeamName = 'Away',
  showCategoryFilter = true,
  highlightKeyStats = true,
  compact = false,
  className,
  isLive = false,
}: LiveStatsProps) {
  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);
  const allStatistics = useMemo(() => getSportStatistics(sport), [sport]);

  // Category state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(allStatistics.map((s) => s.category));
    return ['all', ...Array.from(cats)];
  }, [allStatistics]);

  // Filter statistics by category
  const filteredStats = useMemo(() => {
    if (selectedCategory === 'all') return allStatistics;
    return allStatistics.filter((s) => s.category === selectedCategory);
  }, [allStatistics, selectedCategory]);

  // Key stats (first 4 stats are considered "key")
  const keyStatKeys = useMemo(() => {
    return allStatistics.slice(0, 4).map((s) => s.key);
  }, [allStatistics]);

  // Category labels
  const categoryLabels: Record<string, string> = {
    all: 'All Stats',
    offensive: '⚡ Offensive',
    defensive: '🛡️ Defensive',
    general: '📊 General',
    goalkeeper: '🧤 Goalkeeper',
    specialist: '🎯 Specialist',
  };

  return (
    <Card className={className}>
      <CardHeader className={cn(compact && 'pb-3')}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>{sportConfig.icon}</span>
              Match Statistics
            </CardTitle>
            <CardDescription>
              {sportConfig.name} performance comparison
            </CardDescription>
          </div>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          )}
        </div>

        {/* Team Labels */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {homeTeamName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              {awayTeamName}
            </span>
            <div className="w-3 h-3 rounded-full bg-orange-500" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Category Filter */}
        {showCategoryFilter && categories.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {categoryLabels[category] || category}
              </button>
            ))}
          </div>
        )}

        {/* Statistics */}
        <div className="space-y-1">
          {filteredStats.map((stat) => {
            const homeValue = homeStats[stat.key] ?? 0;
            const awayValue = awayStats[stat.key] ?? 0;
            const isKeystat = highlightKeyStats && keyStatKeys.includes(stat.key);

            return (
              <StatRow
                key={stat.key}
                stat={stat}
                homeValue={homeValue}
                awayValue={awayValue}
                compact={compact}
                highlighted={isKeystat && selectedCategory === 'all'}
              />
            );
          })}
        </div>

        {/* Empty State */}
        {filteredStats.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No statistics available for this category
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// COMPACT STAT BAR (For use in other components)
// =============================================================================

interface CompactStatBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  unit?: string;
  higherIsBetter?: boolean;
}

export function CompactStatBar({
  label,
  homeValue,
  awayValue,
  unit = '',
  higherIsBetter = true,
}: CompactStatBarProps) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-gray-900 dark:text-white font-medium">
          {homeValue}{unit} - {awayValue}{unit}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${100 - homePercent}%` }}
        />
      </div>
    </div>
  );
}

LiveStats.displayName = 'LiveStats';
CompactStatBar.displayName = 'CompactStatBar';

export default LiveStats;
