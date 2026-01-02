/**
 * ============================================================================
 * ScoreBoard Component
 * ============================================================================
 * 
 * Enterprise-grade live scoreboard with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All match viewers
 * - BROADCASTER: Live display
 * 
 * SCHEMA ALIGNMENT:
 * - Fixture model
 * - MatchResult model
 * - Sport enum (all 12 sports)
 * 
 * FEATURES:
 * - Sport-specific scoring display
 * - Multi-period support
 * - Live status indicators
 * - Team logos
 * - Possession bar (where applicable)
 * - Period breakdown
 * - Dark mode support
 * - Responsive design
 * 
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  type Sport,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
}

export interface PeriodScore {
  period: number;
  home: number;
  away: number;
}

export type MatchStatus = 
  | 'scheduled'
  | 'live'
  | 'halftime'
  | 'break'
  | 'paused'
  | 'finished'
  | 'postponed'
  | 'cancelled';

export interface ScoreBoardProps {
  /** Sport type */
  sport: Sport;
  /** Home team */
  homeTeam: Team;
  /** Away team */
  awayTeam: Team;
  /** Home score (total) */
  homeScore: number;
  /** Away score (total) */
  awayScore: number;
  /** Current match minute */
  currentMinute?: number;
  /** Current period */
  currentPeriod?: number;
  /** Match status */
  status: MatchStatus;
  /** Injury/stoppage time */
  injuryTime?: number;
  /** Possession (where applicable) */
  possession?: { home: number; away: number };
  /** Period scores breakdown */
  periodScores?: PeriodScore[];
  /** Secondary score (for AFL goals/behinds, cricket wickets, etc.) */
  secondaryScore?: {
    home: number | string;
    away: number | string;
    label: string;
  };
  /** Compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ScoreBoard({
  sport,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  currentMinute = 0,
  currentPeriod = 1,
  status,
  injuryTime = 0,
  possession,
  periodScores,
  secondaryScore,
  compact = false,
  className,
}: ScoreBoardProps) {
  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);

  // Format time display
  const timeDisplay = useMemo(() => {
    if (status === 'scheduled') return 'Kick-off';
    if (status === 'finished') return 'Full Time';
    if (status === 'halftime') return 'Half Time';
    if (status === 'break') return `${sportConfig.periodName} Break`;
    if (status === 'paused') return 'Paused';
    if (status === 'postponed') return 'Postponed';
    if (status === 'cancelled') return 'Cancelled';

    if (injuryTime > 0) {
      return `${currentMinute}+${injuryTime}'`;
    }
    return `${currentMinute}'`;
  }, [status, currentMinute, injuryTime, sportConfig.periodName]);

  // Status badge styling
  const getStatusBadge = () => {
    switch (status) {
      case 'live':
        return (
          <Badge variant="destructive" className="animate-pulse gap-1.5">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            LIVE
          </Badge>
        );
      case 'halftime':
      case 'break':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            {status === 'halftime' ? 'HT' : 'BREAK'}
          </Badge>
        );
      case 'finished':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            FT
          </Badge>
        );
      case 'postponed':
      case 'cancelled':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            {status.toUpperCase()}
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get score display format based on sport
  const formatScore = (home: number, away: number) => {
    // For cricket, might show as "245/6"
    // For AFL, might show as "12.8 (80)"
    // Default: simple number
    return { home: home.toString(), away: away.toString() };
  };

  const scores = formatScore(homeScore, awayScore);

  // Compact rendering
  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Home Team */}
            <div className="flex items-center gap-2 flex-1">
              {homeTeam.logo && (
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={homeTeam.logo}
                    alt={homeTeam.name}
                    fill
                    className="object-contain rounded-full"
                  />
                </div>
              )}
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {homeTeam.shortName || homeTeam.name}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {scores.home}
              </span>
              <span className="text-gray-400">-</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {scores.away}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {awayTeam.shortName || awayTeam.name}
              </span>
              {awayTeam.logo && (
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={awayTeam.logo}
                    alt={awayTeam.name}
                    fill
                    className="object-contain rounded-full"
                  />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              {status === 'live' ? (
                <span className="text-xs font-semibold text-red-600">{timeDisplay}</span>
              ) : (
                getStatusBadge()
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full rendering
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 p-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">{sportConfig.icon}</span>
          <span className="text-white text-sm font-medium">{sportConfig.name}</span>
        </div>
      </div>

      <CardContent className="p-6 sm:p-8">
        {/* Main Score Area */}
        <div className="flex items-center justify-between mb-6">
          {/* Home Team */}
          <div className="flex-1 text-center">
            {homeTeam.logo && (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3">
                <Image
                  src={homeTeam.logo}
                  alt={homeTeam.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
              {homeTeam.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">HOME</p>
          </div>

          {/* Score & Time */}
          <div className="px-4 sm:px-8 text-center">
            {/* Status Badge */}
            <div className="mb-3">
              {getStatusBadge()}
            </div>

            {/* Score */}
            <div className="flex items-center gap-3 sm:gap-6 justify-center mb-3">
              <span className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white">
                {scores.home}
              </span>
              <span className="text-3xl sm:text-4xl font-bold text-gray-300 dark:text-gray-600">
                -
              </span>
              <span className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white">
                {scores.away}
              </span>
            </div>

            {/* Secondary Score (e.g., AFL behinds, cricket wickets) */}
            {secondaryScore && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>{secondaryScore.label}: </span>
                <span className="font-medium">
                  {secondaryScore.home} - {secondaryScore.away}
                </span>
              </div>
            )}

            {/* Time Display */}
            {status === 'live' && (
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {timeDisplay}
                </span>
              </div>
            )}

            {/* Period Indicator */}
            {status === 'live' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {sportConfig.periodName} {currentPeriod} of {sportConfig.periodCount}
              </p>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            {awayTeam.logo && (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3">
                <Image
                  src={awayTeam.logo}
                  alt={awayTeam.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
              {awayTeam.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">AWAY</p>
          </div>
        </div>

        {/* Possession Bar (for applicable sports) */}
        {possession && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {possession.home}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Possession
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {possession.away}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${possession.home}%` }}
              />
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${possession.away}%` }}
              />
            </div>
          </div>
        )}

        {/* Period Breakdown */}
        {periodScores && periodScores.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">
              {sportConfig.periodName} Breakdown
            </h4>
            <div className="grid grid-cols-[1fr,repeat(var(--periods),minmax(0,1fr)),1fr] gap-2 items-center text-center"
              style={{ '--periods': periodScores.length } as React.CSSProperties}
            >
              {/* Headers */}
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Team</div>
              {periodScores.map((ps) => (
                <div key={ps.period} className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {sportConfig.periodName.slice(0, 1)}{ps.period}
                </div>
              ))}
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</div>

              {/* Home Row */}
              <div className="text-sm font-semibold text-gray-900 dark:text-white text-left truncate">
                {homeTeam.shortName || homeTeam.name}
              </div>
              {periodScores.map((ps) => (
                <div key={`home-${ps.period}`} className="text-sm text-gray-700 dark:text-gray-300">
                  {ps.home}
                </div>
              ))}
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {homeScore}
              </div>

              {/* Away Row */}
              <div className="text-sm font-semibold text-gray-900 dark:text-white text-left truncate">
                {awayTeam.shortName || awayTeam.name}
              </div>
              {periodScores.map((ps) => (
                <div key={`away-${ps.period}`} className="text-sm text-gray-700 dark:text-gray-300">
                  {ps.away}
                </div>
              ))}
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {awayScore}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

ScoreBoard.displayName = 'ScoreBoard';

export default ScoreBoard;
