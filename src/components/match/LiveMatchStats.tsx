/**
 * ============================================================================
 * Live Match Stats Widget Component
 * ============================================================================
 * 
 * Real-time match statistics widget with multi-sport support.
 * Compact view for dashboards and live match tracking.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/match/LiveMatchStats.tsx
 * 
 * FEATURES:
 * - Multi-sport support (all 12 sports)
 * - Real-time updates
 * - Key stat highlights
 * - Compact dashboard view
 * - Full stats expandable
 * - Dark mode support
 * - Responsive design
 * 
 * ============================================================================
 */

'use client';

import { useMemo, useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type Sport,
  SPORT_CONFIG,
} from '@/config/sport-dashboard-config';
import {
  getMatchConfig,
  getStatsForSport,
  type StatDefinition,
} from '@/config/sport-match-config';

// =============================================================================
// TYPES
// =============================================================================

export interface LiveMatchStatsProps {
  /** Sport type */
  sport: Sport;
  /** Home team ID */
  homeTeamId: string;
  /** Away team ID */
  awayTeamId: string;
  /** Home team name */
  homeTeamName: string;
  /** Away team name */
  awayTeamName: string;
  /** Statistics object */
  stats: Record<string, { home: number | null; away: number | null }>;
  /** Current period */
  period?: number;
  /** Current minute/time */
  minute?: number;
  /** Is match live */
  isLive?: boolean;
  /** Last update timestamp */
  lastUpdate?: Date | string;
  /** Expanded by default */
  defaultExpanded?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// KEY STATS BY SPORT
// =============================================================================

const KEY_STATS_BY_SPORT: Record<Sport, string[]> = {
  FOOTBALL: ['possession', 'shots', 'shotsOnTarget', 'corners', 'fouls'],
  RUGBY: ['possession', 'territory', 'tackles', 'lineoutsWon', 'penaltiesConceded'],
  CRICKET: ['runs', 'wickets', 'runRate', 'boundaries', 'extras'],
  BASKETBALL: ['points', 'rebounds', 'assists', 'steals', 'turnovers'],
  AMERICAN_FOOTBALL: ['totalYards', 'passingYards', 'rushingYards', 'firstDowns', 'turnovers'],
  HOCKEY: ['possession', 'shots', 'penaltyCorners', 'saves', 'greenCards'],
  NETBALL: ['goals', 'goalAccuracy', 'centrePassReceives', 'interceptions', 'turnovers'],
  LACROSSE: ['goals', 'assists', 'groundBalls', 'faceoffsWon', 'saves'],
  AUSTRALIAN_RULES: ['goals', 'behinds', 'disposals', 'marks', 'tackles'],
  GAELIC_FOOTBALL: ['goals', 'points', 'wides', 'frees', 'turnovers'],
  FUTSAL: ['possession', 'shots', 'shotsOnTarget', 'fouls', 'corners'],
  BEACH_FOOTBALL: ['possession', 'shots', 'shotsOnTarget', 'fouls', 'corners'],
};

// =============================================================================
// STAT BAR COMPONENT
// =============================================================================

interface StatBarProps {
  label: string;
  homeValue: number | null;
  awayValue: number | null;
  unit?: string;
  isPercentage?: boolean;
}

function StatBar({ label, homeValue, awayValue, unit, isPercentage }: StatBarProps) {
  const home = homeValue ?? 0;
  const away = awayValue ?? 0;
  const total = home + away || 1;
  const homePercent = (home / total) * 100;

  const formatValue = (val: number | null) => {
    if (val === null) return '-';
    if (isPercentage) return `${val}%`;
    if (unit) return `${val}${unit}`;
    return String(val);
  };

  const homeBetter = home > away;
  const awayBetter = away > home;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className={cn(
          'font-semibold tabular-nums',
          homeBetter ? 'text-green-600 dark:text-green-400' : 'text-charcoal-700 dark:text-charcoal-300'
        )}>
          {formatValue(homeValue)}
        </span>
        <span className="text-xs text-charcoal-500 dark:text-charcoal-400">
          {label}
        </span>
        <span className={cn(
          'font-semibold tabular-nums',
          awayBetter ? 'text-green-600 dark:text-green-400' : 'text-charcoal-700 dark:text-charcoal-300'
        )}>
          {formatValue(awayValue)}
        </span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-neutral-200 dark:bg-charcoal-700">
        <div
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${100 - homePercent}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LiveMatchStats({
  sport,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  stats,
  period,
  minute,
  isLive = false,
  lastUpdate,
  defaultExpanded = false,
  className,
}: LiveMatchStatsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Get sport config
  const sportConfig = useMemo(() => SPORT_CONFIG[sport], [sport]);
  const matchConfig = useMemo(() => getMatchConfig(sport), [sport]);
  const allStatDefs = useMemo(() => getStatsForSport(sport), [sport]);

  // Get key stats for this sport
  const keyStatKeys = KEY_STATS_BY_SPORT[sport] || KEY_STATS_BY_SPORT.FOOTBALL;

  // Map stat keys to definitions
  const keyStats = useMemo(() => {
    return keyStatKeys
      .map((key) => {
        const def = allStatDefs.find((s) => s.key === key);
        return def ? { ...def, value: stats[key] } : null;
      })
      .filter(Boolean) as (StatDefinition & { value: { home: number | null; away: number | null } })[];
  }, [keyStatKeys, allStatDefs, stats]);

  // Get all stats for expanded view
  const allStats = useMemo(() => {
    return allStatDefs
      .filter((def) => stats[def.key])
      .map((def) => ({ ...def, value: stats[def.key] }));
  }, [allStatDefs, stats]);

  // Format period name
  const periodName = matchConfig.periods.shortName;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-lg',
              sportConfig.bgColor
            )}>
              {sportConfig.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Live Stats
              </h3>
              {isLive && minute !== undefined && (
                <p className="text-xs text-charcoal-500">
                  {periodName}{period} • {minute}'
                </p>
              )}
            </div>
          </div>

          {isLive && (
            <Badge className="bg-red-500 text-white animate-pulse text-xs">
              <Zap className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          )}
        </div>

        {/* Team Headers */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="font-medium text-charcoal-700 dark:text-charcoal-300 truncate max-w-[100px]">
              {homeTeamName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-charcoal-700 dark:text-charcoal-300 truncate max-w-[100px]">
              {awayTeamName}
            </span>
            <div className="w-3 h-3 rounded-full bg-red-500" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Key Stats */}
        <div className="space-y-1">
          {keyStats.map((stat) => (
            <StatBar
              key={stat.key}
              label={stat.shortLabel}
              homeValue={stat.value?.home ?? null}
              awayValue={stat.value?.away ?? null}
              unit={stat.unit}
              isPercentage={stat.isPercentage}
            />
          ))}
        </div>

        {/* Expanded Stats */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-charcoal-700 space-y-1">
            {allStats
              .filter((s) => !keyStatKeys.includes(s.key))
              .map((stat) => (
                <StatBar
                  key={stat.key}
                  label={stat.shortLabel}
                  homeValue={stat.value?.home ?? null}
                  awayValue={stat.value?.away ?? null}
                  unit={stat.unit}
                  isPercentage={stat.isPercentage}
                />
              ))}
          </div>
        )}

        {/* Expand/Collapse */}
        {allStats.length > keyStats.length && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show {allStats.length - keyStats.length} More Stats
              </>
            )}
          </Button>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <p className="text-xs text-charcoal-400 text-center mt-2">
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

LiveMatchStats.displayName = 'LiveMatchStats';

export default LiveMatchStats;
