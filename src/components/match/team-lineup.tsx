'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Grid3x3 } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
}

interface TeamLineupProps {
  homeTeam: string;
  awayTeam: string;
  formation?: string;
  players?: Player[];
  onSave?: (lineup: Player[]) => void;
}

export function TeamLineup({
  homeTeam,
  awayTeam,
  formation = '4-4-2',
  players = [],
  onSave,
}: TeamLineupProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>(players);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Grid3x3 size={24} />
        Team Lineup
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Home Team */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-4">
            {homeTeam}
          </h3>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 aspect-video flex flex-col justify-between">
            {/* Formation Display */}
            <div className="text-center">
              <p className="text-sm text-gray-600">Formation</p>
              <p className="text-2xl font-bold text-blue-600">{formation}</p>
            </div>

            {/* Player Grid */}
            <div className="grid grid-cols-2 gap-2">
              {selectedPlayers.slice(0, 4).map((player) => (
                <div
                  key={player.id}
                  className="bg-white p-2 rounded border border-blue-200 text-center"
                >
                  <p className="text-xs font-semibold text-gray-900">
                    #{player.number}
                  </p>
                  <p className="text-xs text-gray-600">{player.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Substitutes</p>
            <div className="space-y-1">
              {selectedPlayers.slice(4, 7).map((player) => (
                <div
                  key={player.id}
                  className="text-sm text-gray-600 bg-gray-50 p-2 rounded"
                >
                  #{player.number} {player.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Away Team */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-4">
            {awayTeam}
          </h3>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 aspect-video flex flex-col justify-between">
            {/* Formation Display */}
            <div className="text-center">
              <p className="text-sm text-gray-600">Formation</p>
              <p className="text-2xl font-bold text-red-600">{formation}</p>
            </div>

            {/* Player Grid */}
            <div className="grid grid-cols-2 gap-2">
              {selectedPlayers.slice(0, 4).map((player) => (
                <div
                  key={player.id}
                  className="bg-white p-2 rounded border border-red-200 text-center"
                >
                  <p className="text-xs font-semibold text-gray-900">
                    #{player.number}
                  </p>
                  <p className="text-xs text-gray-600">{player.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Substitutes</p>
            <div className="space-y-1">
              {selectedPlayers.slice(4, 7).map((player) => (
                <div
                  key={player.id}
                  className="text-sm text-gray-600 bg-gray-50 p-2 rounded"
                >
                  #{player.number} {player.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {onSave && (
        <div className="mt-6 flex gap-4">
          <Button
            variant="secondary"
            onClick={() => setSelectedPlayers([])}
          >
            Clear
          </Button>
          <Button
            variant="primary"
            onClick={() => onSave(selectedPlayers)}
          >
            Save Lineup
          </Button>
        </div>
      )}
    </Card>
  );
}
