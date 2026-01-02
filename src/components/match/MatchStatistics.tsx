/**
 * ============================================================================
 * Match Statistics Component
 * ============================================================================
 * 
 * Enterprise-grade match statistics display with multi-sport support.
 * Automatically adapts to show relevant metrics for each sport.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/match/MatchStatistics.tsx
 * 
 * FEATURES:
 * - Multi-sport support (all 12 sports)
 * - Sport-specific metrics
 * - Comparative home/away display
 * - Category grouping
 * - Progress bars for percentages
 * - Live update support
 * - Dark mode support
 * - Responsive design
 * - Accessibility compliant
 * 
 * AFFECTED USER ROLES:
 * - PLAYER, PLAYER_PRO: View own match stats
 * - COACH, COACH_PRO: Full stats analysis
 * - MANAGER, CLUB_MANAGER: Team statistics
 * - ANALYST: Full analytics access
 * - REFEREE: Match stats for reports
 * - FAN: Public match statistics
 * - MEDIA_MANAGER: Stats for content
 * 
 * ============================================================================
 */

'use client';

import { useMemo, useState } from 'react';
import { Activity, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  type Sport,
  SPORT_CONFIG,
} from '@/config/sport-dashboard-config';
import {
  type StatDefinition,
  type StatCategory,
  getMatchConfig,
  getStatsForSport,
  getStatsByCategory,
} from '@/config/sport-match-config';

// =============================================================================
// TYPES
// =============================================================================

export interface TeamStats {
  teamId: string;
  teamName: string;
  teamColor?: string;
  stats: Record<string, number | string | null>;
}

export interface MatchStatisticsProps {
  /** Sport type */
  sport: Sport;
  /** Home team statistics */
  homeTeam: TeamStats;
  /** Away team statistics */
  awayTeam: TeamStats;
  /** Show all stats or just key stats */
  showAll?: boolean;
  /** Categories to display */
  categories?: StatCategory[];
  /** Enable category collapsing */
  collapsible?: boolean;
  /** Show live update indicator */
  isLive?: boolean;
  /** Variant */
  variant?: 'default' | 'compact' | 'detailed';
  /** Custom class name */
  className?: string;
}

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const CATEGORY_CONFIG: Record<StatCategory, { label: string; icon: string; color: string }> = {
  POSSESSION: { label: 'Possession', icon: '⏱️', color: 'blue' },
  SCORING: { label: 'Scoring', icon: '🎯', color: 'green' },
  ATTACKING: { label: 'Attacking', icon: '⚡', color: 'amber' },
  DEFENDING: { label: 'Defending', icon: '🛡️', color: 'purple' },
  PASSING: { label: 'Passing', icon: '↔️', color: 'blue' },
  DISCIPLINE: { label: 'Discipline', icon: '📋', color: 'red' },
  SET_PIECES: { label: 'Set Pieces', icon: '🚩', color: 'amber' },
  GOALKEEPER: { label: 'Goalkeeper', icon: '🧤', color: 'green' },
  BATTING: { label: 'Batting', icon: '🏏', color: 'blue' },
  BOWLING: { label: 'Bowling', icon: '🎳', color: 'purple' },
  FIELDING: { label: 'Fielding', icon: '🤾', color: 'green' },
};

// =============================================================================
// STAT ROW COMPONENT
// =============================================================================

interface StatRowProps {
  stat: StatDefinition;
  homeValue: number | string | null;
  awayValue: number | string | null;
  homeColor?: string;
  awayColor?: string;
  variant: 'default' | 'compact' | 'detailed';
}

function StatRow({
  stat,
  homeValue,
  awayValue,
  homeColor = 'blue',
  awayColor = 'red',
  variant,
}: StatRowProps) {
  const homeNum = typeof homeValue === 'number' ? homeValue : parseFloat(String(homeValue)) || 0;
  const awayNum = typeof awayValue === 'number' ? awayValue : parseFloat(String(awayValue)) || 0;
  const total = homeNum + awayNum;
  const homePercent = total > 0 ? (homeNum / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayNum / total) * 100 : 50;

  // Determine which team is "winning" this stat
  const homeBetter = homeNum > awayNum;
  const awayBetter = awayNum > homeNum;

  // Format value
  const formatValue = (value: number | string | null): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value;
    if (stat.isPercentage) return `${value}%`;
    if (stat.unit) return `${value}${stat.unit}`;
    return String(value);
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <span className={cn(
          'w-12 text-right text-sm font-semibold',
          homeBetter ? 'text-green-600 dark:text-green-400' : 'text-charcoal-700 dark:text-charcoal-300'
        )}>
          {formatValue(homeValue)}
        </span>
        <div className="flex-1 h-2 bg-neutral-200 dark:bg-charcoal-700 rounded-full overflow-hidden flex">
          <div
            className={cn('h-full transition-all', `bg-${homeColor}-500`)}
            style={{ width: `${homePercent}%` }}
          />
          <div
            className={cn('h-full transition-all', `bg-${awayColor}-500`)}
            style={{ width: `${awayPercent}%` }}
          />
        </div>
        <span className={cn(
          'w-12 text-left text-sm font-semibold',
          awayBetter ? 'text-green-600 dark:text-green-400' : 'text-charcoal-700 dark:text-charcoal-300'
        )}>
          {formatValue(awayValue)}
        </span>
      </div>
    );
  }

  return (
    <div className="py-3 border-b border-neutral-100 dark:border-charcoal-700 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-lg font-bold',
            homeBetter ? 'text-green-600 dark:text-green-400' : 'text-charcoal-900 dark:text-white'
          )}>
            {formatValue(homeValue)}
          </span>
          {homeBetter && <TrendingUp className="w-4 h-4 text-green-500" />}
        </div>

        <span className="text-sm font-medium text-charcoal-600 dark:text-charcoal-400 text-center px-4">
          {stat.icon && <span className="mr-1">{stat.icon}</span>}
          {stat.label}
        </span>

        <div className="flex items-center gap-2">
          {awayBetter && <TrendingUp className="w-4 h-4 text-green-500" />}
          <span className={cn(
            'text-lg font-bold',
            awayBetter ? 'text-green-600 dark:text-green-400' : 'text-charcoal-900 dark:text-white'
          )}>
            {formatValue(awayValue)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex h-2.5 bg-neutral-200 dark:bg-charcoal-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="h-full bg-red-500 transition-all duration-500"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// CATEGORY GROUP COMPONENT
// =============================================================================

interface CategoryGroupProps {
  category: StatCategory;
  stats: StatDefinition[];
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  variant: 'default' | 'compact' | 'detailed';
  collapsible: boolean;
  defaultExpanded?: boolean;
}

function CategoryGroup({
  category,
  stats,
  homeTeam,
  awayTeam,
  variant,
  collapsible,
  defaultExpanded = true,
}: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const config = CATEGORY_CONFIG[category];

  if (stats.length === 0) return null;

  return (
    <div className="mb-4 last:mb-0">
      {/* Category Header */}
      <button
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        disabled={!collapsible}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg mb-2',
          'bg-neutral-100 dark:bg-charcoal-700',
          collapsible && 'hover:bg-neutral-200 dark:hover:bg-charcoal-600 cursor-pointer'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className="text-sm font-semibold text-charcoal-800 dark:text-charcoal-200">
            {config.label}
          </span>
          <Badge variant="secondary" className="text-xs">
            {stats.length}
          </Badge>
        </div>
        {collapsible && (
          isExpanded ? (
            <ChevronUp className="w-4 h-4 text-charcoal-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-charcoal-500" />
          )
        )}
      </button>

      {/* Stats */}
      {isExpanded && (
        <div className="px-2">
          {stats.map((stat) => (
            <StatRow
              key={stat.key}
              stat={stat}
              homeValue={homeTeam.stats[stat.key] ?? null}
              awayValue={awayTeam.stats[stat.key] ?? null}
              homeColor={homeTeam.teamColor}
              awayColor={awayTeam.teamColor}
              variant={variant}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MatchStatistics({
  sport,
  homeTeam,
  awayTeam,
  showAll = false,
  categories,
  collapsible = true,
  isLive = false,
  variant = 'default',
  className,
}: MatchStatisticsProps) {
  // Get sport config
  const sportConfig = useMemo(() => SPORT_CONFIG[sport], [sport]);
  const matchConfig = useMemo(() => getMatchConfig(sport), [sport]);
  const allStats = useMemo(() => getStatsForSport(sport), [sport]);

  // Group stats by category
  const statsByCategory = useMemo(() => {
    const grouped: Partial<Record<StatCategory, StatDefinition[]>> = {};
    
    const targetCategories = categories || [
      'SCORING', 'POSSESSION', 'ATTACKING', 'DEFENDING', 'PASSING', 
      'DISCIPLINE', 'SET_PIECES', 'GOALKEEPER', 'BATTING', 'BOWLING', 'FIELDING'
    ];

    targetCategories.forEach((cat) => {
      const catStats = getStatsByCategory(sport, cat);
      if (catStats.length > 0) {
        // If not showing all, limit to first 3-4 key stats per category
        grouped[cat] = showAll ? catStats : catStats.slice(0, 4);
      }
    });

    return grouped;
  }, [sport, categories, showAll]);

  // Calculate total stats count
  const totalStats = Object.values(statsByCategory).flat().length;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
              sportConfig.bgColor
            )}>
              {sportConfig.icon}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Match Statistics
              </CardTitle>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                {sportConfig.name} • {totalStats} metrics
              </p>
            </div>
          </div>

          {isLive && (
            <Badge className="bg-red-500 text-white animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full mr-2" />
              LIVE
            </Badge>
          )}
        </div>

        {/* Team Headers */}
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: homeTeam.teamColor || '#3B82F6' }}
            />
            <span className="text-sm font-semibold text-charcoal-900 dark:text-white">
              {homeTeam.teamName}
            </span>
          </div>
          <span className="text-xs text-charcoal-500">vs</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-charcoal-900 dark:text-white">
              {awayTeam.teamName}
            </span>
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: awayTeam.teamColor || '#EF4444' }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {Object.entries(statsByCategory).map(([category, stats]) => (
          <CategoryGroup
            key={category}
            category={category as StatCategory}
            stats={stats}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            variant={variant}
            collapsible={collapsible}
            defaultExpanded={category === 'SCORING' || category === 'POSSESSION'}
          />
        ))}

        {/* No data state */}
        {totalStats === 0 && (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
            <p className="text-charcoal-600 dark:text-charcoal-400">
              No statistics available yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

MatchStatistics.displayName = 'MatchStatistics';

export default MatchStatistics;
