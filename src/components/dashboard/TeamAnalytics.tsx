// ============================================================================
// src/components/dashboard/TeamAnalytics.tsx
// Team Analytics Panel Component
// ============================================================================

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TeamStats {
  id: string;
  name: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  possession: number;
  shotsPerGame: number;
  cleanSheets: number;
}

interface TeamAnalyticsProps {
  team: TeamStats;
  expanded?: boolean;
}

export function TeamAnalytics({ team, expanded = false }: TeamAnalyticsProps) {
  const totalMatches = team.wins + team.draws + team.losses;
  const winPercentage = ((team.wins / totalMatches) * 100).toFixed(0);
  const goalDifference = team.goalsFor - team.goalsAgainst;

  const StatBar = ({ label, value, max = 100 }: { label: string; value: number; max?: number }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-charcoal-600">{label}</p>
        <p className="font-semibold text-charcoal-900">{value}{label.includes('%') ? '' : ''}</p>
      </div>
      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <Card className={expanded ? '' : ''}>
      <CardHeader>
        <CardTitle className="text-2xl">{team.name}</CardTitle>
        <CardDescription>Season statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* RECORD */}
        <div>
          <h4 className="font-semibold text-charcoal-900 mb-3">Record</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-charcoal-600">Wins</p>
              <p className="text-3xl font-bold text-green-600">{team.wins}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-center">
              <p className="text-sm text-charcoal-600">Draws</p>
              <p className="text-3xl font-bold text-yellow-600">{team.draws}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <p className="text-sm text-charcoal-600">Losses</p>
              <p className="text-3xl font-bold text-red-600">{team.losses}</p>
            </div>
          </div>
          <p className="text-xs text-charcoal-600 mt-2">
            Win Percentage: <span className="font-semibold">{winPercentage}%</span>
          </p>
        </div>

        {/* GOALS */}
        <div>
          <h4 className="font-semibold text-charcoal-900 mb-3">Goals</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-charcoal-600">Scored</p>
              <p className="text-3xl font-bold text-blue-600">{team.goalsFor}</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg text-center">
              <p className="text-sm text-charcoal-600">Conceded</p>
              <p className="text-3xl font-bold text-charcoal-600">{team.goalsAgainst}</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${goalDifference >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-charcoal-600">Difference</p>
              <p className={`text-3xl font-bold ${goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {goalDifference > 0 ? '+' : ''}{goalDifference}
              </p>
            </div>
          </div>
        </div>

        {/* STATISTICS */}
        <div>
          <h4 className="font-semibold text-charcoal-900 mb-3">Statistics</h4>
          <div className="space-y-4">
            <StatBar label="Possession" value={team.possession} max={100} />
            <StatBar label="Shots/Game" value={team.shotsPerGame} max={20} />
            <StatBar label="Clean Sheets" value={team.cleanSheets} max={totalMatches} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
