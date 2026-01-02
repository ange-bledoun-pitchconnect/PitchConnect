/**
 * ============================================================================
 * PlayerComparison Component
 * ============================================================================
 * 
 * Enterprise-grade player comparison with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - SCOUT: Player evaluation
 * - ANALYST: Performance comparison
 * - COACH: Team selection
 * - MANAGER: Transfer decisions
 * 
 * SCHEMA ALIGNMENT:
 * - Player model
 * - Sport enum (all 12 sports)
 * 
 * FEATURES:
 * - Sport-specific stats comparison
 * - Visual bar comparison
 * - Radar chart (optional)
 * - Head-to-head summary
 * - Category filtering
 * - Dark mode support
 * - Accessible
 * 
 * ============================================================================
 */

'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
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

export interface ComparisonPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
  club: string;
  photo?: string;
  rating?: number;
  stats: Record<string, number>;
}

export interface PlayerComparisonProps {
  /** Sport type */
  sport: Sport;
  /** First player */
  player1: ComparisonPlayer;
  /** Second player */
  player2: ComparisonPlayer;
  /** Show category filter */
  showCategoryFilter?: boolean;
  /** Show overall winner */
  showWinner?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// COMPARISON ROW COMPONENT
// =============================================================================

interface ComparisonRowProps {
  stat: SportStatistic;
  value1: number;
  value2: number;
  player1Name: string;
  player2Name: string;
}

function ComparisonRow({
  stat,
  value1,
  value2,
  player1Name,
  player2Name,
}: ComparisonRowProps) {
  const max = Math.max(value1, value2, 1);
  const percent1 = (value1 / max) * 100;
  const percent2 = (value2 / max) * 100;

  // Determine winner for this stat
  const p1Wins = stat.higherIsBetter ? value1 > value2 : value1 < value2;
  const p2Wins = stat.higherIsBetter ? value2 > value1 : value2 < value1;
  const tied = value1 === value2;

  // Format value
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
    <div className="py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Stat Label */}
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center mb-3 uppercase tracking-wider">
        {stat.label}
      </p>

      {/* Comparison Bars */}
      <div className="flex items-center gap-4">
        {/* Player 1 */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex justify-end">
            <div
              className={cn(
                'h-full transition-all duration-500 flex items-center justify-end pr-2',
                p1Wins
                  ? 'bg-green-500 dark:bg-green-600'
                  : tied
                    ? 'bg-gray-400 dark:bg-gray-500'
                    : 'bg-blue-400 dark:bg-blue-500'
              )}
              style={{ width: `${percent1}%` }}
            >
              <span className="text-sm font-bold text-white whitespace-nowrap">
                {formatValue(value1)}
              </span>
            </div>
          </div>
        </div>

        {/* Winner Indicator */}
        <div className="w-8 flex justify-center">
          {p1Wins && (
            <TrendingUp className="w-5 h-5 text-green-500" />
          )}
          {p2Wins && (
            <TrendingDown className="w-5 h-5 text-green-500 rotate-180" style={{ transform: 'scaleX(-1)' }} />
          )}
          {tied && (
            <Minus className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Player 2 */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 flex items-center pl-2',
                p2Wins
                  ? 'bg-green-500 dark:bg-green-600'
                  : tied
                    ? 'bg-gray-400 dark:bg-gray-500'
                    : 'bg-orange-400 dark:bg-orange-500'
              )}
              style={{ width: `${percent2}%` }}
            >
              <span className="text-sm font-bold text-white whitespace-nowrap">
                {formatValue(value2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Player Names */}
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className={cn(p1Wins && 'font-semibold text-green-600 dark:text-green-400')}>
          {player1Name.split(' ').pop()}
        </span>
        <span className={cn(p2Wins && 'font-semibold text-green-600 dark:text-green-400')}>
          {player2Name.split(' ').pop()}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// PLAYER HEADER COMPONENT
// =============================================================================

interface PlayerHeaderProps {
  player: ComparisonPlayer;
  color: string;
  wins: number;
  isWinner: boolean;
}

function PlayerHeader({ player, color, wins, isWinner }: PlayerHeaderProps) {
  return (
    <Card className={cn(isWinner && 'ring-2 ring-green-500')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Photo/Avatar */}
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl',
                color === 'blue' ? 'bg-blue-500' : 'bg-orange-500'
              )}
            >
              #{player.number}
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {player.name}
              </h3>
              {isWinner && (
                <Trophy className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {player.position} • {player.club}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {player.rating && (
                <Badge
                  className={cn(
                    player.rating >= 8.5 && 'bg-green-500',
                    player.rating >= 7.5 && player.rating < 8.5 && 'bg-blue-500',
                    player.rating < 7.5 && 'bg-amber-500'
                  )}
                >
                  {player.rating.toFixed(1)}
                </Badge>
              )}
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {wins} stat{wins !== 1 ? 's' : ''} won
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PlayerComparison({
  sport,
  player1,
  player2,
  showCategoryFilter = true,
  showWinner = true,
  className,
}: PlayerComparisonProps) {
  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);
  const allStatistics = useMemo(() => getSportStatistics(sport), [sport]);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(allStatistics.map((s) => s.category));
    return ['all', ...Array.from(cats)];
  }, [allStatistics]);

  // Filter statistics
  const filteredStats = useMemo(() => {
    if (selectedCategory === 'all') return allStatistics;
    return allStatistics.filter((s) => s.category === selectedCategory);
  }, [allStatistics, selectedCategory]);

  // Calculate wins
  const { p1Wins, p2Wins, ties } = useMemo(() => {
    let p1 = 0;
    let p2 = 0;
    let t = 0;

    allStatistics.forEach((stat) => {
      const v1 = player1.stats[stat.key] ?? 0;
      const v2 = player2.stats[stat.key] ?? 0;

      if (v1 === v2) {
        t++;
      } else if (stat.higherIsBetter ? v1 > v2 : v1 < v2) {
        p1++;
      } else {
        p2++;
      }
    });

    return { p1Wins: p1, p2Wins: p2, ties: t };
  }, [allStatistics, player1.stats, player2.stats]);

  const overallWinner = p1Wins > p2Wins ? 1 : p2Wins > p1Wins ? 2 : 0;

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
    <div className={cn('space-y-6', className)}>
      {/* Player Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlayerHeader
          player={player1}
          color="blue"
          wins={p1Wins}
          isWinner={showWinner && overallWinner === 1}
        />
        <PlayerHeader
          player={player2}
          color="orange"
          wins={p2Wins}
          isWinner={showWinner && overallWinner === 2}
        />
      </div>

      {/* Summary */}
      {showWinner && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Head-to-Head Summary
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {player1.name.split(' ').pop()}: {p1Wins}
                </span>
                <span className="text-gray-500">Ties: {ties}</span>
                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                  {player2.name.split(' ').pop()}: {p2Wins}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{sportConfig.icon}</span>
            Statistical Comparison
          </CardTitle>
          <CardDescription>
            {sportConfig.name} performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          {showCategoryFilter && categories.length > 2 && (
            <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>
          )}

          {/* Comparison Rows */}
          <div className="space-y-2">
            {filteredStats.map((stat) => (
              <ComparisonRow
                key={stat.key}
                stat={stat}
                value1={player1.stats[stat.key] ?? 0}
                value2={player2.stats[stat.key] ?? 0}
                player1Name={player1.name}
                player2Name={player2.name}
              />
            ))}
          </div>

          {filteredStats.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No statistics available for this category
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

PlayerComparison.displayName = 'PlayerComparison';

export default PlayerComparison;
