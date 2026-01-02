/**
 * ============================================================================
 * TeamAnalytics Component
 * ============================================================================
 * 
 * Enterprise-grade team analytics with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - COACH: Team performance analysis
 * - MANAGER: Strategic decisions
 * - ANALYST: Detailed metrics
 * - CLUB_OWNER: Performance overview
 * 
 * SCHEMA ALIGNMENT:
 * - Team model
 * - Sport enum (all 12 sports)
 * 
 * FEATURES:
 * - Sport-specific metrics
 * - Win/Draw/Loss record
 * - Scoring statistics
 * - Visual stat bars
 * - Form guide
 * - Expandable details
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
import {
  Trophy,
  Target,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getSportStatistics,
  getScoringTerm,
  sportHasDraws,
  type Sport,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface TeamRecord {
  wins: number;
  draws: number;
  losses: number;
  played: number;
}

export interface TeamScoring {
  scored: number;
  conceded: number;
}

export interface TeamStats {
  [key: string]: number | undefined;
}

export interface FormResult {
  result: 'W' | 'D' | 'L';
  opponent: string;
  score: string;
  date: string;
}

export interface TeamAnalyticsProps {
  /** Team name */
  teamName: string;
  /** Team logo URL */
  teamLogo?: string;
  /** Sport type */
  sport: Sport;
  /** Win/Draw/Loss record */
  record: TeamRecord;
  /** Scoring statistics */
  scoring: TeamScoring;
  /** Additional stats */
  stats?: TeamStats;
  /** Recent form (last 5 matches) */
  form?: FormResult[];
  /** Position in league */
  leaguePosition?: number;
  /** Total teams in league */
  totalTeams?: number;
  /** Expanded by default */
  expanded?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// STAT BAR COMPONENT
// =============================================================================

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
  unit?: string;
}

function StatBar({ label, value, max, color = 'bg-primary', unit = '' }: StatBarProps) {
  const percent = max > 0 ? (value / max) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {value}{unit}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500 rounded-full', color)}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// FORM BADGE COMPONENT
// =============================================================================

interface FormBadgeProps {
  result: 'W' | 'D' | 'L';
  tooltip?: string;
}

function FormBadge({ result, tooltip }: FormBadgeProps) {
  const styles = {
    W: 'bg-green-500 text-white',
    D: 'bg-gray-400 text-white',
    L: 'bg-red-500 text-white',
  };

  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
        styles[result]
      )}
      title={tooltip}
    >
      {result}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TeamAnalytics({
  teamName,
  teamLogo,
  sport,
  record,
  scoring,
  stats,
  form,
  leaguePosition,
  totalTeams,
  expanded: initialExpanded = false,
  className,
}: TeamAnalyticsProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);
  const sportStats = useMemo(() => getSportStatistics(sport), [sport]);
  const hasDraws = useMemo(() => sportHasDraws(sport), [sport]);
  const scoringTerm = useMemo(() => getScoringTerm(sport, true), [sport]);

  // Calculate derived stats
  const winPercentage = useMemo(() => {
    if (record.played === 0) return 0;
    return Math.round((record.wins / record.played) * 100);
  }, [record]);

  const scoringDiff = scoring.scored - scoring.conceded;
  const avgScored = record.played > 0 ? (scoring.scored / record.played).toFixed(1) : '0';
  const avgConceded = record.played > 0 ? (scoring.conceded / record.played).toFixed(1) : '0';

  // Points calculation (standard: 3 for win, 1 for draw)
  const points = record.wins * 3 + record.draws;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {teamLogo ? (
              <img
                src={teamLogo}
                alt={teamName}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-xl">{sportConfig.icon}</span>
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{teamName}</CardTitle>
              <CardDescription>
                {sportConfig.name} • Season Statistics
              </CardDescription>
            </div>
          </div>

          {/* League Position */}
          {leaguePosition && (
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Trophy
                  className={cn(
                    'w-5 h-5',
                    leaguePosition <= 4
                      ? 'text-amber-500'
                      : 'text-gray-400'
                  )}
                />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {leaguePosition}
                  <sup className="text-xs text-gray-500">
                    {leaguePosition === 1 ? 'st' : leaguePosition === 2 ? 'nd' : leaguePosition === 3 ? 'rd' : 'th'}
                  </sup>
                </span>
              </div>
              {totalTeams && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  of {totalTeams} teams
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Record */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Record
          </h4>
          <div className={cn('grid gap-3', hasDraws ? 'grid-cols-4' : 'grid-cols-3')}>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Played</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {record.played}
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <p className="text-sm text-green-600 dark:text-green-400">Wins</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {record.wins}
              </p>
            </div>
            {hasDraws && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Draws</p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {record.draws}
                </p>
              </div>
            )}
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
              <p className="text-sm text-red-600 dark:text-red-400">Losses</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {record.losses}
              </p>
            </div>
          </div>

          {/* Win Percentage & Points */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Win Rate: <span className="font-semibold text-gray-900 dark:text-white">{winPercentage}%</span>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Points: <span className="font-semibold text-gray-900 dark:text-white">{points}</span>
            </span>
          </div>
        </div>

        {/* Scoring */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            {scoringTerm.charAt(0).toUpperCase() + scoringTerm.slice(1)}
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <p className="text-sm text-blue-600 dark:text-blue-400">Scored</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {scoring.scored}
              </p>
              <p className="text-xs text-blue-500">Avg: {avgScored}/match</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Conceded</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {scoring.conceded}
              </p>
              <p className="text-xs text-gray-500">Avg: {avgConceded}/match</p>
            </div>
            <div
              className={cn(
                'p-3 rounded-lg text-center',
                scoringDiff > 0
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : scoringDiff < 0
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-gray-50 dark:bg-gray-800'
              )}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">Difference</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  scoringDiff > 0
                    ? 'text-green-700 dark:text-green-300'
                    : scoringDiff < 0
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-gray-700 dark:text-gray-300'
                )}
              >
                {scoringDiff > 0 ? '+' : ''}{scoringDiff}
              </p>
            </div>
          </div>
        </div>

        {/* Form Guide */}
        {form && form.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Form
            </h4>
            <div className="flex items-center gap-2">
              {form.slice(0, 5).map((match, index) => (
                <FormBadge
                  key={index}
                  result={match.result}
                  tooltip={`${match.result === 'W' ? 'Win' : match.result === 'D' ? 'Draw' : 'Loss'} vs ${match.opponent} (${match.score})`}
                />
              ))}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                (Last 5 matches)
              </span>
            </div>
          </div>
        )}

        {/* Expandable Statistics */}
        {stats && Object.keys(stats).length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Detailed Statistics
              </span>
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expanded && (
              <div className="mt-4 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {sportStats.slice(0, 8).map((stat) => {
                  const value = stats[stat.key];
                  if (value === undefined) return null;

                  // Determine max for percentage display
                  const max = stat.type === 'percentage' ? 100 : Math.max(value * 1.5, 100);

                  return (
                    <StatBar
                      key={stat.key}
                      label={stat.label}
                      value={value}
                      max={max}
                      unit={stat.unit}
                      color={
                        stat.category === 'offensive'
                          ? 'bg-blue-500'
                          : stat.category === 'defensive'
                            ? 'bg-green-500'
                            : 'bg-primary'
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

TeamAnalytics.displayName = 'TeamAnalytics';

export default TeamAnalytics;
