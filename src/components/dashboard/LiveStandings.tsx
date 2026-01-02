/**
 * ============================================================================
 * LiveStandings Component
 * ============================================================================
 * 
 * Enterprise-grade league standings with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users viewing standings
 * - COACH: League position tracking
 * - ANALYST: Performance trends
 * - CLUB_OWNER: League overview
 * 
 * SCHEMA ALIGNMENT:
 * - Standing model
 * - Sport enum (all 12 sports)
 * - Club model
 * - League model
 * 
 * FEATURES:
 * - Multi-sport scoring columns
 * - Dynamic column names (GD/PD/RD based on sport)
 * - Position trends
 * - Zone highlighting (promotion/relegation)
 * - Real-time updates
 * - Dark mode support
 * - Accessible
 * 
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity, Trophy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getScoringTerm,
  sportHasDraws,
  type Sport,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface StandingClub {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
}

export interface Standing {
  leagueId: string;
  clubId: string;
  club: StandingClub;
  position: number;
  previousPosition?: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  scored: number;      // Goals/Points/Runs scored
  conceded: number;    // Goals/Points/Runs conceded
  scoreDifference: number;
  points: number;
  form?: ('W' | 'D' | 'L')[];
}

export interface LeagueZone {
  name: string;
  positions: number[];
  color: string;
  bgColor: string;
}

export interface LiveStandingsProps {
  /** Sport type */
  sport: Sport;
  /** Standings data */
  standings: Standing[];
  /** League name */
  leagueName?: string;
  /** Show form guide */
  showForm?: boolean;
  /** Show position trends */
  showTrends?: boolean;
  /** Maximum rows to display */
  maxRows?: number;
  /** Highlight specific club ID */
  highlightClubId?: string;
  /** League zones configuration */
  zones?: LeagueZone[];
  /** Real-time indicator */
  isLive?: boolean;
  /** Last updated timestamp */
  lastUpdated?: string;
  /** Loading state */
  loading?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// DEFAULT ZONES
// =============================================================================

const DEFAULT_ZONES: LeagueZone[] = [
  {
    name: 'Promotion',
    positions: [1, 2, 3, 4],
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    name: 'Playoff',
    positions: [5, 6],
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    name: 'Relegation',
    positions: [-3, -2, -1], // Negative = from bottom
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get trend icon based on position change
 */
function getTrendIcon(current: number, previous?: number) {
  if (!previous) return null;
  
  if (previous > current) {
    return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
  }
  if (previous < current) {
    return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
  }
  return <Minus className="w-4 h-4 text-gray-400" />;
}

/**
 * Get position zone styling
 */
function getPositionZone(
  position: number,
  totalTeams: number,
  zones: LeagueZone[]
): LeagueZone | null {
  for (const zone of zones) {
    for (const zonePos of zone.positions) {
      // Handle negative positions (from bottom)
      const actualPos = zonePos < 0 ? totalTeams + zonePos + 1 : zonePos;
      if (position === actualPos) {
        return zone;
      }
    }
  }
  return null;
}

/**
 * Get column header for score difference based on sport
 */
function getScoreDiffHeader(sport: Sport): string {
  switch (sport) {
    case 'FOOTBALL':
    case 'FUTSAL':
    case 'BEACH_FOOTBALL':
    case 'HOCKEY':
    case 'LACROSSE':
      return 'GD'; // Goal Difference
    case 'RUGBY':
    case 'AMERICAN_FOOTBALL':
    case 'GAELIC_FOOTBALL':
      return 'PD'; // Point Difference
    case 'BASKETBALL':
    case 'NETBALL':
      return '+/-'; // Plus/Minus
    case 'CRICKET':
      return 'NRR'; // Net Run Rate
    case 'AUSTRALIAN_RULES':
      return '%'; // Percentage
    default:
      return 'Diff';
  }
}

/**
 * Get scored/conceded headers based on sport
 */
function getScoredConcededHeaders(sport: Sport): { scored: string; conceded: string } {
  switch (sport) {
    case 'FOOTBALL':
    case 'FUTSAL':
    case 'BEACH_FOOTBALL':
    case 'HOCKEY':
    case 'LACROSSE':
    case 'NETBALL':
      return { scored: 'GF', conceded: 'GA' }; // Goals For/Against
    case 'RUGBY':
    case 'AMERICAN_FOOTBALL':
    case 'GAELIC_FOOTBALL':
    case 'BASKETBALL':
      return { scored: 'PF', conceded: 'PA' }; // Points For/Against
    case 'CRICKET':
      return { scored: 'RF', conceded: 'RA' }; // Runs For/Against
    case 'AUSTRALIAN_RULES':
      return { scored: 'PF', conceded: 'PA' }; // Points For/Against
    default:
      return { scored: 'F', conceded: 'A' };
  }
}

// =============================================================================
// FORM BADGE COMPONENT
// =============================================================================

interface FormBadgeProps {
  result: 'W' | 'D' | 'L';
}

function FormBadge({ result }: FormBadgeProps) {
  const styles = {
    W: 'bg-green-500 text-white',
    D: 'bg-gray-400 text-white',
    L: 'bg-red-500 text-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold',
        styles[result]
      )}
    >
      {result}
    </span>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function StandingsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {['Pos', 'Team', 'P', 'W', 'D', 'L', 'F', 'A', 'GD', 'Pts'].map((_, i) => (
              <th key={i} className="px-3 py-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
              {Array.from({ length: 10 }).map((_, j) => (
                <td key={j} className="px-3 py-3">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LiveStandings({
  sport,
  standings,
  leagueName,
  showForm = true,
  showTrends = true,
  maxRows = 20,
  highlightClubId,
  zones = DEFAULT_ZONES,
  isLive = false,
  lastUpdated,
  loading = false,
  className,
}: LiveStandingsProps) {
  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);
  const hasDraws = useMemo(() => sportHasDraws(sport), [sport]);
  const scoreDiffHeader = useMemo(() => getScoreDiffHeader(sport), [sport]);
  const { scored: scoredHeader, conceded: concededHeader } = useMemo(
    () => getScoredConcededHeaders(sport),
    [sport]
  );

  const displayStandings = useMemo(() => {
    return standings.slice(0, maxRows);
  }, [standings, maxRows]);

  const totalTeams = standings.length;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <StandingsSkeleton rows={maxRows} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {leagueName || 'League Standings'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>{sportConfig.icon}</span>
              <span>{sportConfig.name}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {displayStandings.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No standings data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Pos
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Team
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    P
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    W
                  </th>
                  {hasDraws && (
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      D
                    </th>
                  )}
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    L
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    {scoredHeader}
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    {concededHeader}
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    {scoreDiffHeader}
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Pts
                  </th>
                  {showForm && (
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Form
                    </th>
                  )}
                  {showTrends && (
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Trend
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayStandings.map((standing) => {
                  const zone = getPositionZone(standing.position, totalTeams, zones);
                  const isHighlighted = highlightClubId === standing.clubId;

                  return (
                    <tr
                      key={`${standing.leagueId}-${standing.clubId}`}
                      className={cn(
                        'border-b border-gray-200 dark:border-gray-700 transition-colors',
                        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                        zone?.bgColor,
                        isHighlighted && 'bg-primary/10 dark:bg-primary/20'
                      )}
                    >
                      {/* Position */}
                      <td className="px-3 py-3">
                        <span className={cn(
                          'font-bold',
                          zone?.color || 'text-gray-900 dark:text-white'
                        )}>
                          {standing.position}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {standing.club.logoUrl ? (
                            <img
                              src={standing.club.logoUrl}
                              alt={standing.club.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                          )}
                          <span className={cn(
                            'font-medium',
                            isHighlighted
                              ? 'text-primary font-bold'
                              : 'text-gray-900 dark:text-white'
                          )}>
                            {standing.club.shortName || standing.club.name}
                          </span>
                        </div>
                      </td>

                      {/* Played */}
                      <td className="px-3 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                        {standing.played}
                      </td>

                      {/* Wins */}
                      <td className="px-3 py-3 text-center text-sm font-semibold text-green-700 dark:text-green-400">
                        {standing.wins}
                      </td>

                      {/* Draws */}
                      {hasDraws && (
                        <td className="px-3 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {standing.draws}
                        </td>
                      )}

                      {/* Losses */}
                      <td className="px-3 py-3 text-center text-sm font-semibold text-red-700 dark:text-red-400">
                        {standing.losses}
                      </td>

                      {/* Scored */}
                      <td className="px-3 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                        {standing.scored}
                      </td>

                      {/* Conceded */}
                      <td className="px-3 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                        {standing.conceded}
                      </td>

                      {/* Score Difference */}
                      <td className="px-3 py-3 text-center text-sm">
                        <span className={cn(
                          'font-medium',
                          standing.scoreDifference > 0
                            ? 'text-green-600 dark:text-green-400'
                            : standing.scoreDifference < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                        )}>
                          {standing.scoreDifference > 0 ? '+' : ''}
                          {standing.scoreDifference}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {standing.points}
                        </span>
                      </td>

                      {/* Form */}
                      {showForm && (
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {standing.form?.slice(0, 5).map((result, i) => (
                              <FormBadge key={i} result={result} />
                            ))}
                          </div>
                        </td>
                      )}

                      {/* Trend */}
                      {showTrends && (
                        <td className="px-3 py-3 text-center">
                          {getTrendIcon(standing.position, standing.previousPosition)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Zone Legend */}
        {zones.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
            <div className="flex flex-wrap gap-4 text-xs">
              {zones.map((zone) => (
                <div key={zone.name} className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded', zone.bgColor)} />
                  <span className={zone.color}>{zone.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

LiveStandings.displayName = 'LiveStandings';

export default LiveStandings;
