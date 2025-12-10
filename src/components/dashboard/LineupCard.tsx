// ============================================================================
// PHASE 11: src/components/dashboard/LineupCard.tsx
// Reusable Lineup Card Component with Formation Display
// ============================================================================

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, AlertCircle } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
}

interface LineupCardProps {
  teamName: string;
  formation: string;
  players: Player[];
  confirmed: boolean;
  className?: string;
}

export function LineupCard({
  teamName,
  formation,
  players,
  confirmed,
  className = '',
}: LineupCardProps) {
  // Group players by row based on formation
  const getRows = () => {
    const formations: { [key: string]: number[] } = {
      '433': [1, 4, 3, 3], // GK, Defense, Midfield, Attack
      '4231': [1, 4, 2, 3, 1],
      '352': [1, 3, 5, 2],
      '532': [1, 5, 3, 2],
    };

    const rows = formations[formation] || [1, 4, 4, 2];
    const result: Player[][] = [];
    let index = 0;

    rows.forEach((count) => {
      result.push(players.slice(index, index + count));
      index += count;
    });

    return result;
  };

  const rows = getRows();

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-charcoal-900">{teamName}</h3>
            <p className="text-sm text-charcoal-600">{formation} Formation</p>
          </div>
          <div className="flex items-center gap-2">
            {confirmed ? (
              <>
                <Check className="w-5 h-5 text-green-500" />
                <Badge className="bg-green-100 text-green-700">Confirmed</Badge>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
              </>
            )}
          </div>
        </div>

        {/* FORMATION VISUALIZATION */}
        <div className="bg-green-50 rounded-lg p-6 min-h-[400px] flex flex-col justify-between">
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="flex justify-center items-center gap-3"
              style={{ marginBottom: rowIdx < rows.length - 1 ? '20px' : '0' }}
            >
              {row.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center font-bold shadow-lg hover:shadow-xl transition-shadow">
                    <span className="text-xs">{player.position}</span>
                    <span className="text-lg">#{player.number}</span>
                  </div>
                  <p className="text-xs text-charcoal-600 mt-2 text-center max-w-16 truncate">
                    {player.name.split(' ').pop()}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* PLAYER LIST */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <h4 className="font-semibold text-charcoal-900 mb-3">Squad</h4>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-charcoal-900 w-8">#{player.number}</span>
                  <div>
                    <p className="text-sm font-medium text-charcoal-900">{player.name}</p>
                    <p className="text-xs text-charcoal-600">{player.position}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {player.position}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
