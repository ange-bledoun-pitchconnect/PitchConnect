'use client';

import { useLiveStandings } from '@/hooks/useLiveStandings';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { Standing } from '@/types';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface LiveStandingsProps {
  leagueId: string;
  className?: string;
  showTrends?: boolean;
  maxRows?: number;
}

const getTrendIcon = (position: number, prevPosition?: number) => {
  if (!prevPosition) return null;
  if (prevPosition > position)
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (prevPosition < position)
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
};

const getPositionColor = (position: number, maxTeams: number = 20) => {
  // Top 4 (Champions League)
  if (position <= 4) return 'bg-blue-50 border-blue-200';
  // 5-6 (Europa League)
  if (position <= 6) return 'bg-purple-50 border-purple-200';
  // Relegation zone
  if (position > maxTeams - 3) return 'bg-red-50 border-red-200';
  return 'bg-white';
};

export function LiveStandings({
  leagueId,
  className = '',
  showTrends = true,
  maxRows = 20,
}: LiveStandingsProps) {
  const { standings, isLoading, error, isLive, lastUpdated } = useLiveStandings({
    leagueId,
  });

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6">
        <p className="text-red-800">Failed to load standings</p>
        <p className="text-sm text-red-600">{error.message}</p>
      </Card>
    );
  }

  const displayStandings = standings.slice(0, maxRows);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">League Standings</h2>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge
                variant="primary"
                className="animate-pulse bg-red-600 text-white"
              >
                <Activity className="mr-1 h-3 w-3" />
                LIVE
              </Badge>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-600">
                Updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {isLoading && !displayStandings.length ? (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Pos
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Team
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  P
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  W
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  D
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  L
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  GD
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Pts
                </th>
                {showTrends && (
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Trend
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayStandings.map((standing: Standing) => (
                <tr
                  key={`${standing.leagueId}-${standing.clubId}`}
                  className={`border-b border-gray-200 transition-colors hover:bg-gray-50 ${getPositionColor(standing.position)}`}
                >
                  {/* Position */}
                  <td className="px-4 py-3 text-center font-bold text-gray-900">
                    {standing.position}
                  </td>

                  {/* Team Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {standing.club?.logoUrl && (
                        <img
                          src={standing.club.logoUrl}
                          alt={standing.club.name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium text-gray-900">
                        {standing.club?.shortName || standing.club?.name || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Played */}
                  <td className="px-4 py-3 text-center text-sm text-gray-700">
                    {standing.played}
                  </td>

                  {/* Wins */}
                  <td className="px-4 py-3 text-center text-sm font-semibold text-green-700">
                    {standing.wins}
                  </td>

                  {/* Draws */}
                  <td className="px-4 py-3 text-center text-sm text-gray-700">
                    {standing.draws}
                  </td>

                  {/* Losses */}
                  <td className="px-4 py-3 text-center text-sm font-semibold text-red-700">
                    {standing.losses}
                  </td>

                  {/* Goal Difference */}
                  <td className="px-4 py-3 text-center text-sm text-gray-700">
                    <span
                      className={
                        standing.goalDifference > 0
                          ? 'text-green-600'
                          : standing.goalDifference < 0
                            ? 'text-red-600'
                            : ''
                      }
                    >
                      {standing.goalDifference > 0 ? '+' : ''}
                      {standing.goalDifference}
                    </span>
                  </td>

                  {/* Points */}
                  <td className="px-4 py-3 text-center text-lg font-bold text-gray-900">
                    {standing.points}
                  </td>

                  {/* Trend */}
                  {showTrends && (
                    <td className="px-4 py-3 text-center">
                      {getTrendIcon(standing.position)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
        <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-blue-100"></div>
            Champions League
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-purple-100"></div>
            Europa League
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-red-100"></div>
            Relegation
          </div>
        </div>
      </div>
    </Card>
  );
}
