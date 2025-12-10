// ============================================================================
// src/components/dashboard/ScoreBoard.tsx
// Live Scoreboard Component
// ============================================================================

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Team {
  id: string;
  name: string;
  logo?: string;
}

interface ScoreBoardProps {
  homeTeam: Team;
  awayTeam: Team;
  homeGoals: number;
  awayGoals: number;
  currentMinute: number;
  status: 'live' | 'paused' | 'finished' | 'halftime';
  injuryTime: number;
  possession: { home: number; away: number };
}

export function ScoreBoard({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  currentMinute,
  status,
  injuryTime,
  possession,
}: ScoreBoardProps) {
  const displayMinute = currentMinute > 45 ? `45+${injuryTime}` : currentMinute;
  const isFirstHalf = currentMinute <= 45;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-green-50">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          {/* HOME TEAM */}
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold text-charcoal-900 mb-2">{homeTeam.name}</h2>
            <p className="text-sm text-charcoal-600 mb-4">HOME</p>
          </div>

          {/* SCORE & TIME */}
          <div className="text-center mx-4">
            <div className="flex items-center gap-4 justify-center mb-4">
              <div className="text-6xl font-bold text-charcoal-900">{homeGoals}</div>
              <div className="text-4xl font-bold text-charcoal-400">-</div>
              <div className="text-6xl font-bold text-charcoal-900">{awayGoals}</div>
            </div>

            {status === 'live' && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <Badge className="bg-red-100 text-red-700">LIVE</Badge>
              </div>
            )}

            <div className="text-sm font-medium text-charcoal-600">
              {status === 'halftime' ? 'HALFTIME' : status === 'finished' ? 'FULL TIME' : `${displayMinute}'`}
            </div>

            <div className="text-xs text-charcoal-500 mt-2">
              {isFirstHalf ? '1st Half' : '2nd Half'}
            </div>
          </div>

          {/* AWAY TEAM */}
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold text-charcoal-900 mb-2">{awayTeam.name}</h2>
            <p className="text-sm text-charcoal-600 mb-4">AWAY</p>
          </div>
        </div>

        {/* POSSESSION */}
        <div className="mt-6 pt-6 border-t border-neutral-300">
          <p className="text-xs text-charcoal-600 mb-2 text-center">Possession</p>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-charcoal-900 w-12">{possession.home}%</span>
            <div className="flex-1 h-3 bg-neutral-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${possession.home}%` }}
              />
            </div>
            <span className="text-sm font-bold text-charcoal-900 w-12 text-right">{possession.away}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
