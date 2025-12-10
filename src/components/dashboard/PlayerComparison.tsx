// ============================================================================
// PHASE 13: src/components/dashboard/PlayerComparison.tsx
// Player Comparison Component - Side-by-side Stats
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
  lastMatchRating: number;
  passPasses: number;
  shotsOnTarget: number;
}

interface PlayerComparisonProps {
  player1: PlayerStats;
  player2: PlayerStats;
}

export function PlayerComparison({ player1, player2 }: PlayerComparisonProps) {
  const ComparisonRow = ({
    label,
    value1,
    value2,
    unit = '',
  }: {
    label: string;
    value1: number;
    value2: number;
    unit?: string;
  }) => {
    const max = Math.max(value1, value2);
    const percent1 = (value1 / max) * 100;
    const percent2 = (value2 / max) * 100;

    return (
      <div className="py-4 border-b border-neutral-200 last:border-b-0">
        <p className="text-xs text-charcoal-600 mb-3">{label}</p>
        <div className="flex items-end gap-3 h-16">
          {/* PLAYER 1 */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-12 bg-blue-200 rounded-t flex items-end justify-center" style={{ height: `${percent1}%` }}>
              <p className="text-sm font-bold text-charcoal-900 mb-1">
                {value1}
                {unit}
              </p>
            </div>
            <p className="text-xs text-charcoal-600 mt-2">{player1.name.split(' ').pop()}</p>
          </div>

          {/* PLAYER 2 */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-12 bg-green-200 rounded-t flex items-end justify-center" style={{ height: `${percent2}%` }}>
              <p className="text-sm font-bold text-charcoal-900 mb-1">
                {value2}
                {unit}
              </p>
            </div>
            <p className="text-xs text-charcoal-600 mt-2">{player2.name.split(' ').pop()}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold text-charcoal-900 mb-1">
              #{player1.number} {player1.name}
            </h3>
            <p className="text-sm text-charcoal-600 mb-4">{player1.position} • {player1.club}</p>
            <Badge className="bg-blue-100 text-blue-700">Rating: {player1.rating.toFixed(1)}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold text-charcoal-900 mb-1">
              #{player2.number} {player2.name}
            </h3>
            <p className="text-sm text-charcoal-600 mb-4">{player2.position} • {player2.club}</p>
            <Badge className="bg-green-100 text-green-700">Rating: {player2.rating.toFixed(1)}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* COMPARISON */}
      <Card>
        <CardHeader>
          <CardTitle>Head-to-Head Statistics</CardTitle>
          <CardDescription>Detailed comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <ComparisonRow label="Goals" value1={player1.goals} value2={player2.goals} />
            <ComparisonRow label="Assists" value1={player1.assists} value2={player2.assists} />
            <ComparisonRow label="Appearances" value1={player1.appearances} value2={player2.appearances} />
            <ComparisonRow label="Passes" value1={player1.passPasses} value2={player2.passPasses} />
            <ComparisonRow label="Shots on Target" value1={player1.shotsOnTarget} value2={player2.shotsOnTarget} />
            <ComparisonRow label="Last Match Rating" value1={player1.lastMatchRating} value2={player2.lastMatchRating} unit=".0" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
