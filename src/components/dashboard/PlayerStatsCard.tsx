// ============================================================================
// src/components/dashboard/PlayerStatsCard.tsx
// Player Statistics Card Component
// ============================================================================

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
  lastMatchRating: number;
  passPasses: number;
  shotsOnTarget: number;
}

interface PlayerStatsCardProps {
  player: PlayerStats;
}

export function PlayerStatsCard({ player }: PlayerStatsCardProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 8.5) return 'bg-green-100 text-green-700';
    if (rating >= 7.5) return 'bg-blue-100 text-blue-700';
    if (rating >= 6.5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-charcoal-900">
              #{player.number} {player.name}
            </h3>
            <p className="text-sm text-charcoal-600">{player.position}</p>
          </div>
          <div className="flex items-center gap-1">
            {player.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
            {player.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
          </div>
        </div>

        {/* RATING */}
        <div className="mb-4">
          <Badge className={getRatingColor(player.rating)}>
            Rating: {player.rating.toFixed(1)}
          </Badge>
        </div>

        {/* KEY STATS */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-2 bg-neutral-50 rounded">
            <p className="text-xs text-charcoal-600">Goals</p>
            <p className="text-2xl font-bold text-charcoal-900">{player.goals}</p>
          </div>
          <div className="p-2 bg-neutral-50 rounded">
            <p className="text-xs text-charcoal-600">Assists</p>
            <p className="text-2xl font-bold text-charcoal-900">{player.assists}</p>
          </div>
          <div className="p-2 bg-neutral-50 rounded">
            <p className="text-xs text-charcoal-600">Apps</p>
            <p className="text-2xl font-bold text-charcoal-900">{player.appearances}</p>
          </div>
          <div className="p-2 bg-neutral-50 rounded">
            <p className="text-xs text-charcoal-600">Last Match</p>
            <p className="text-2xl font-bold text-charcoal-900">{player.lastMatchRating.toFixed(1)}</p>
          </div>
        </div>

        {/* DETAILED STATS */}
        <div className="space-y-2 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between text-sm">
            <p className="text-charcoal-600">Passes</p>
            <p className="font-semibold text-charcoal-900">{player.passPasses}</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <p className="text-charcoal-600">Shots on Target</p>
            <p className="font-semibold text-charcoal-900">{player.shotsOnTarget}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
