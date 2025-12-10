// ============================================================================
// src/components/dashboard/LiveStats.tsx
// Live Statistics Display Component
// ============================================================================

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  homeTeam: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    completedPasses: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
    corners: number;
    offsides: number;
  };
  awayTeam: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    completedPasses: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
    corners: number;
    offsides: number;
  };
}

interface LiveStatsProps {
  stats: Stats;
}

export function LiveStats({ stats }: LiveStatsProps) {
  const StatRow = ({ label, home, away }: { label: string; home: number; away: number }) => (
    <div className="flex items-center justify-between py-3 border-b border-neutral-200 last:border-b-0">
      <p className="text-sm font-medium text-charcoal-900">{label}</p>
      <div className="flex items-center gap-4">
        <p className="text-lg font-bold text-charcoal-900 w-12 text-right">{home}</p>
        <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(home / (home + away)) * 100}%` }}
          />
        </div>
        <p className="text-lg font-bold text-charcoal-900 w-12 text-left">{away}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Statistics</CardTitle>
        <CardDescription>Real-time performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <StatRow label="Possession" home={stats.homeTeam.possession} away={stats.awayTeam.possession} />
          <StatRow label="Shots" home={stats.homeTeam.shots} away={stats.awayTeam.shots} />
          <StatRow label="Shots on Target" home={stats.homeTeam.shotsOnTarget} away={stats.awayTeam.shotsOnTarget} />
          <StatRow label="Passes" home={stats.homeTeam.passes} away={stats.awayTeam.passes} />
          <StatRow label="Pass Accuracy" home={Math.round((stats.homeTeam.completedPasses / stats.homeTeam.passes) * 100)} away={Math.round((stats.awayTeam.completedPasses / stats.awayTeam.passes) * 100)} />
          <StatRow label="Fouls" home={stats.homeTeam.fouls} away={stats.awayTeam.fouls} />
          <StatRow label="Yellow Cards" home={stats.homeTeam.yellowCards} away={stats.awayTeam.yellowCards} />
          <StatRow label="Red Cards" home={stats.homeTeam.redCards} away={stats.awayTeam.redCards} />
          <StatRow label="Corners" home={stats.homeTeam.corners} away={stats.awayTeam.corners} />
          <StatRow label="Offsides" home={stats.homeTeam.offsides} away={stats.awayTeam.offsides} />
        </div>
      </CardContent>
    </Card>
  );
}
