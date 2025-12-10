// ============================================================================
// PHASE 13: src/components/dashboard/StatisticsGrid.tsx
// Statistics Grid Component with Sorting & Filtering
// ============================================================================

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlayerStats {
  id: string;
  name: string;
  number: number;
  position: string;
  club: string;
  goals: number;
  assists: number;
  appearances: number;
  rating: number;
  trend: 'up' | 'down' | 'stable';
}

interface StatisticsGridProps {
  players: PlayerStats[];
  sortBy: 'rating' | 'goals' | 'assists';
}

export function StatisticsGrid({ players, sortBy }: StatisticsGridProps) {
  const getSortLabel = () => {
    if (sortBy === 'rating') return 'Rating';
    if (sortBy === 'goals') return 'Goals';
    return 'Assists';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Statistics</CardTitle>
        <CardDescription>Sorted by {getSortLabel()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Player</th>
                <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Position</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-900">Goals</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-900">Assists</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-900">Apps</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-900">Rating</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, idx) => (
                <tr key={player.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-semibold text-charcoal-900">#{player.number} {player.name}</p>
                      <p className="text-xs text-charcoal-600">{player.club}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{player.position}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-charcoal-900">{player.goals}</td>
                  <td className="py-3 px-4 text-center font-semibold text-charcoal-900">{player.assists}</td>
                  <td className="py-3 px-4 text-center font-semibold text-charcoal-900">{player.appearances}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      className={
                        player.rating >= 8.5
                          ? 'bg-green-100 text-green-700'
                          : player.rating >= 7.5
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }
                    >
                      {player.rating.toFixed(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
