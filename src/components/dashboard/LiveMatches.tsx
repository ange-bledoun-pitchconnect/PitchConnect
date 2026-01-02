/**
 * ============================================================================
 * LiveMatches Component
 * ============================================================================
 * 
 * Enterprise-grade live/upcoming matches display with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users viewing matches
 * - COACH: Upcoming fixtures
 * - PLAYER: Match schedule
 * - ANALYST: Match tracking
 * 
 * SCHEMA ALIGNMENT:
 * - Fixture model
 * - MatchResult model
 * - Sport enum (all 12 sports)
 * - Club model
 * 
 * FEATURES:
 * - Multi-sport scoring terminology
 * - Sport-specific stats preview
 * - Real-time updates (polling)
 * - Status indicators (live/scheduled/completed)
 * - Team logos
 * - Match linking
 * - Dark mode support
 * - Accessible
 * 
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Trophy, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getSportStatistics,
  getScoringTerm,
  type Sport,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type MatchStatus = 
  | 'SCHEDULED' 
  | 'LIVE' 
  | 'COMPLETED' 
  | 'POSTPONED' 
  | 'CANCELLED'
  | 'HALF_TIME'
  | 'FULL_TIME';

export interface Club {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
}

export interface MatchStats {
  [key: string]: number | { home: number; away: number } | undefined;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  stats?: MatchStats;
}

export interface Match {
  id: string;
  sport: Sport;
  homeClub: Club;
  awayClub: Club;
  scheduledDate: string;
  venue?: string;
  status: MatchStatus;
  currentMinute?: number;
  currentPeriod?: number;
  result?: MatchResult;
  leagueId?: string;
  leagueName?: string;
}

export interface LiveMatchesProps {
  /** Filter by sport */
  sport?: Sport;
  /** Filter by league ID */
  leagueId?: string;
  /** Maximum matches to show */
  limit?: number;
  /** Show stats preview */
  showStats?: boolean;
  /** Refresh interval in ms (0 to disable) */
  refreshInterval?: number;
  /** Custom class name */
  className?: string;
  /** Title */
  title?: string;
  /** Link prefix for match details */
  linkPrefix?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get status display configuration
 */
function getStatusConfig(status: MatchStatus) {
  switch (status) {
    case 'LIVE':
      return {
        label: 'LIVE',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        badge: 'bg-red-600 text-white',
        icon: Activity,
        animate: true,
      };
    case 'HALF_TIME':
      return {
        label: 'HT',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        badge: 'bg-amber-600 text-white',
        icon: Clock,
        animate: false,
      };
    case 'COMPLETED':
    case 'FULL_TIME':
      return {
        label: 'FT',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
        badge: 'bg-green-600 text-white',
        icon: Trophy,
        animate: false,
      };
    case 'SCHEDULED':
      return {
        label: 'Scheduled',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        badge: 'bg-blue-600 text-white',
        icon: Calendar,
        animate: false,
      };
    case 'POSTPONED':
      return {
        label: 'Postponed',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        badge: 'bg-orange-600 text-white',
        icon: AlertCircle,
        animate: false,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-800',
        badge: 'bg-gray-600 text-white',
        icon: AlertCircle,
        animate: false,
      };
    default:
      return {
        label: status,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        badge: 'bg-gray-600 text-white',
        icon: Clock,
        animate: false,
      };
  }
}

/**
 * Format match time display
 */
function formatMatchTime(dateString: string): string {
  const matchDate = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today
  if (matchDate.toDateString() === now.toDateString()) {
    return matchDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Tomorrow
  if (matchDate.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${matchDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  // Other dates
  return matchDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// =============================================================================
// MATCH CARD COMPONENT
// =============================================================================

interface MatchCardProps {
  match: Match;
  showStats?: boolean;
  linkPrefix?: string;
}

function MatchCard({ match, showStats = true, linkPrefix = '/dashboard/matches' }: MatchCardProps) {
  const sportConfig = useMemo(() => getSportConfig(match.sport), [match.sport]);
  const sportStats = useMemo(() => getSportStatistics(match.sport), [match.sport]);
  const statusConfig = getStatusConfig(match.status);
  const StatusIcon = statusConfig.icon;

  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isFinished = match.status === 'COMPLETED' || match.status === 'FULL_TIME';
  const hasScore = match.result !== undefined;

  // Get key stats for preview (first 4)
  const keyStats = useMemo(() => sportStats.slice(0, 4), [sportStats]);

  return (
    <Link href={`${linkPrefix}/${match.id}`} className="block">
      <div
        className={cn(
          'rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-md',
          statusConfig.bg
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={cn(statusConfig.badge, statusConfig.animate && 'animate-pulse')}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {sportConfig.icon} {sportConfig.name}
            </Badge>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {formatMatchTime(match.scheduledDate)}
          </span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex flex-1 items-center gap-2">
            {match.homeClub.logoUrl ? (
              <img
                src={match.homeClub.logoUrl}
                alt={match.homeClub.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                {match.homeClub.shortName?.substring(0, 2) || match.homeClub.name.substring(0, 2)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {match.homeClub.shortName || match.homeClub.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Home</p>
            </div>
          </div>

          {/* Score */}
          <div className="px-4 text-center">
            {hasScore ? (
              <div>
                <p className={cn(
                  'text-3xl font-bold',
                  isLive ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                )}>
                  {match.result!.homeScore} - {match.result!.awayScore}
                </p>
                {isLive && match.currentMinute !== undefined && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold animate-pulse">
                    {match.currentMinute}' ⏱️
                  </p>
                )}
                {isFinished && (
                  <p className="text-xs text-green-600 dark:text-green-400">Final</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-lg text-gray-500 dark:text-gray-400">vs</p>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="flex-1 min-w-0 text-right">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {match.awayClub.shortName || match.awayClub.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Away</p>
            </div>
            {match.awayClub.logoUrl ? (
              <img
                src={match.awayClub.logoUrl}
                alt={match.awayClub.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                {match.awayClub.shortName?.substring(0, 2) || match.awayClub.name.substring(0, 2)}
              </div>
            )}
          </div>
        </div>

        {/* Stats Preview */}
        {showStats && (isLive || isFinished) && match.result?.stats && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {keyStats.map((stat) => {
                const statValue = match.result?.stats?.[stat.key];
                if (!statValue || typeof statValue !== 'object') return null;

                return (
                  <div key={stat.key}>
                    <p className="text-gray-500 dark:text-gray-400">{stat.shortLabel}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {statValue.home} - {statValue.away}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* League Name */}
        {match.leagueName && (
          <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {match.leagueName}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function MatchSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-4" />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LiveMatches({
  sport,
  leagueId,
  limit = 5,
  showStats = true,
  refreshInterval = 30000,
  className,
  title = 'Live & Upcoming Matches',
  linkPrefix = '/dashboard/matches',
}: LiveMatchesProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['matches', 'live', sport, leagueId, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'LIVE,HALF_TIME,SCHEDULED,COMPLETED',
        limit: limit.toString(),
        orderBy: 'scheduledDate',
      });

      if (sport) params.append('sport', sport);
      if (leagueId) params.append('leagueId', leagueId);

      const response = await axios.get(`/api/matches?${params.toString()}`);
      return response.data.data as Match[];
    },
    refetchInterval: refreshInterval > 0 ? refreshInterval : undefined,
    staleTime: refreshInterval > 0 ? refreshInterval / 2 : 30000,
  });

  const matches = data || [];

  // Group matches by status
  const { liveMatches, upcomingMatches, recentMatches } = useMemo(() => {
    const live: Match[] = [];
    const upcoming: Match[] = [];
    const recent: Match[] = [];

    matches.forEach((match) => {
      if (match.status === 'LIVE' || match.status === 'HALF_TIME') {
        live.push(match);
      } else if (match.status === 'SCHEDULED') {
        upcoming.push(match);
      } else if (match.status === 'COMPLETED' || match.status === 'FULL_TIME') {
        recent.push(match);
      }
    });

    return { liveMatches: live, upcomingMatches: upcoming, recentMatches: recent };
  }, [matches]);

  // Error state
  if (error) {
    return (
      <Card className={cn('border-red-200 dark:border-red-800', className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>Failed to load matches</p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {title}
          </CardTitle>
          {liveMatches.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {liveMatches.length} LIVE
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <MatchSkeleton key={i} />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No matches found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Matches */}
            {liveMatches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                  <Activity className="w-4 h-4 animate-pulse" />
                  Live Now
                </h3>
                <div className="space-y-3">
                  {liveMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      showStats={showStats}
                      linkPrefix={linkPrefix}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Upcoming
                </h3>
                <div className="space-y-3">
                  {upcomingMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      showStats={showStats}
                      linkPrefix={linkPrefix}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Results */}
            {recentMatches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Recent Results
                </h3>
                <div className="space-y-3">
                  {recentMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      showStats={showStats}
                      linkPrefix={linkPrefix}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

LiveMatches.displayName = 'LiveMatches';

export default LiveMatches;
