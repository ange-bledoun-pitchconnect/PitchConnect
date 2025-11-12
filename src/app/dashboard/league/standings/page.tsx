/**
 * League Standings Page
 * Display league tables, points, head-to-head records
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp, Target } from 'lucide-react';

export default function LeagueStandingsPage() {
  const { user, isLoading } = useAuth();

  const standings = [
    { pos: 1, team: 'Arsenal FC', played: 12, won: 8, drew: 2, lost: 2, gf: 28, ga: 12, gd: 16, pts: 26, form: 'WWDWW' },
    { pos: 2, team: 'Manchester City', played: 12, won: 8, drew: 1, lost: 3, gf: 26, ga: 14, gd: 12, pts: 25, form: 'WLWWW' },
    { pos: 3, team: 'Liverpool', played: 12, won: 7, drew: 2, lost: 3, gf: 24, ga: 15, gd: 9, pts: 23, form: 'WWWDL' },
    { pos: 4, team: 'Manchester United', played: 12, won: 6, drew: 2, lost: 4, gf: 20, ga: 16, gd: 4, pts: 20, form: 'WDWLW' },
    { pos: 5, team: 'Tottenham', played: 12, won: 5, drew: 3, lost: 4, gf: 22, ga: 18, gd: 4, pts: 18, form: 'DWWLD' },
    { pos: 6, team: 'Chelsea', played: 12, won: 5, drew: 2, lost: 5, gf: 18, ga: 19, gd: -1, pts: 17, form: 'DLWDL' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">League Standings</h1>
          <p className="text-foreground/70">Premier League 2024/25</p>
        </div>

        {/* Main Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-gold" />
              Final Standings
            </CardTitle>
            <CardDescription>Position, matches played, and points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold w-12">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Team</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">P</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-green-600">W</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-yellow-600">D</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-red-600">L</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">GF</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">GA</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">GD</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold font-bold">Pts</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, index) => (
                    <tr 
                      key={row.pos} 
                      className={`border-b border-border/50 hover:bg-muted/30 transition ${
                        row.team === 'Arsenal FC' ? 'bg-brand-gold/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className={`w-8 h-8 flex items-center justify-center font-bold rounded ${
                          row.pos === 1 ? 'bg-yellow-500/20 text-yellow-600' :
                          row.pos === 2 ? 'bg-gray-400/20 text-gray-600' :
                          row.pos === 3 ? 'bg-orange-500/20 text-orange-600' :
                          'bg-muted text-foreground/60'
                        }`}>
                          {row.pos === 1 ? '🥇' : row.pos === 2 ? '🥈' : row.pos === 3 ? '🥉' : row.pos}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{row.team}</td>
                      <td className="py-3 px-4 text-center text-sm">{row.played}</td>
                      <td className="py-3 px-4 text-center text-sm font-semibold text-green-600">{row.won}</td>
                      <td className="py-3 px-4 text-center text-sm font-semibold text-yellow-600">{row.drew}</td>
                      <td className="py-3 px-4 text-center text-sm font-semibold text-red-600">{row.lost}</td>
                      <td className="py-3 px-4 text-center text-sm">{row.gf}</td>
                      <td className="py-3 px-4 text-center text-sm">{row.ga}</td>
                      <td className="py-3 px-4 text-center text-sm font-semibold">{row.gd > 0 ? '+' : ''}{row.gd}</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-brand-gold text-lg">{row.pts}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {row.form.split('').map((result, i) => (
                            <div 
                              key={i}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                result === 'W' ? 'bg-green-500/20 text-green-600' :
                                result === 'D' ? 'bg-yellow-500/20 text-yellow-600' :
                                'bg-red-500/20 text-red-600'
                              }`}
                            >
                              {result}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2 text-sm text-foreground/60">
              <p><strong>P</strong> = Played | <strong>W</strong> = Won | <strong>D</strong> = Drew | <strong>L</strong> = Lost</p>
              <p><strong>GF</strong> = Goals For | <strong>GA</strong> = Goals Against | <strong>GD</strong> = Goal Difference | <strong>Pts</strong> = Points</p>
            </div>
          </CardContent>
        </Card>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Scorers */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-gold" />
                Top Scorers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { rank: 1, name: 'Harry Kane', goals: 12, team: 'Man City' },
                { rank: 2, name: 'Marcus Johnson', goals: 11, team: 'Arsenal' },
                { rank: 3, name: 'Mohamed Salah', goals: 10, team: 'Liverpool' },
              ].map((player) => (
                <div key={player.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center font-bold text-sm text-brand-gold">
                      {player.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{player.name}</p>
                      <p className="text-xs text-foreground/60">{player.team}</p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-brand-gold">{player.goals}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Most Assists */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-gold" />
                Most Assists
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { rank: 1, name: 'David De Bruyne', assists: 9, team: 'Man City' },
                { rank: 2, name: 'Bukayo Saka', assists: 8, team: 'Arsenal' },
                { rank: 3, name: 'Luis Díaz', assists: 7, team: 'Liverpool' },
              ].map((player) => (
                <div key={player.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center font-bold text-sm text-brand-purple">
                      {player.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{player.name}</p>
                      <p className="text-xs text-foreground/60">{player.team}</p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-brand-purple">{player.assists}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Latest Results */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Latest Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span>Arsenal vs City</span>
                <span className="font-bold text-green-600">3-1 ✓</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span>Man Utd vs Liverpool</span>
                <span className="font-bold text-yellow-600">2-2 =</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span>Chelsea vs Spurs</span>
                <span className="font-bold text-red-600">1-2 ✗</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
