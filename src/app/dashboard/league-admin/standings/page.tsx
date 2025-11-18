/**
 * League Admin Standings Page
 * View league tables and standings
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  TrendingUp,
  Target,
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

interface Team {
  pos: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: ('W' | 'D' | 'L')[];
}

export default function StandingsPage() {
  const { isLoading } = useAuth();
  const [selectedLeague, setSelectedLeague] = useState('PREMIER');

  const standings: Record<string, Team[]> = {
    PREMIER: [
      { pos: 1, name: 'Manchester City', played: 20, won: 16, drawn: 3, lost: 1, gf: 52, ga: 12, gd: 40, pts: 51, form: ['W', 'W', 'W', 'D', 'W'] },
      { pos: 2, name: 'Arsenal FC', played: 20, won: 15, drawn: 2, lost: 3, gf: 48, ga: 18, gd: 30, pts: 47, form: ['W', 'W', 'L', 'W', 'W'] },
      { pos: 3, name: 'Liverpool FC', played: 20, won: 14, drawn: 4, lost: 2, gf: 45, ga: 15, gd: 30, pts: 46, form: ['W', 'D', 'W', 'W', 'D'] },
      { pos: 4, name: 'Chelsea FC', played: 20, won: 12, drawn: 3, lost: 5, gf: 38, ga: 22, gd: 16, pts: 39, form: ['W', 'L', 'W', 'D', 'W'] },
      { pos: 5, name: 'Tottenham', played: 20, won: 11, drawn: 2, lost: 7, gf: 35, ga: 28, gd: 7, pts: 35, form: ['L', 'W', 'W', 'D', 'L'] },
    ],
    CHAMPIONSHIP: [
      { pos: 1, name: 'Leeds United', played: 20, won: 14, drawn: 4, lost: 2, gf: 42, ga: 16, gd: 26, pts: 46, form: ['W', 'D', 'W', 'W', 'W'] },
      { pos: 2, name: 'Sunderland AFC', played: 20, won: 13, drawn: 5, lost: 2, gf: 40, ga: 14, gd: 26, pts: 44, form: ['D', 'W', 'W', 'D', 'W'] },
      { pos: 3, name: 'West Brom', played: 20, won: 12, drawn: 5, lost: 3, gf: 38, ga: 20, gd: 18, pts: 41, form: ['W', 'D', 'W', 'D', 'W'] },
    ],
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const teams = standings[selectedLeague] || standings.PREMIER;

  const getFormColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'D':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'L':
        return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  const getFormIcon = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W':
        return '✓';
      case 'D':
        return '=';
      case 'L':
        return '✕';
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-charcoal-900 mb-2">League Standings</h1>
        <p className="text-charcoal-600">Current season league tables and positions</p>
      </div>

      {/* LEAGUE SELECTOR */}
      <div className="flex gap-3">
        {['PREMIER', 'CHAMPIONSHIP'].map((league) => (
          <button
            key={league}
            onClick={() => setSelectedLeague(league)}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              selectedLeague === league
                ? 'bg-gradient-to-r from-gold-500 to-orange-400 text-white shadow-lg'
                : 'bg-neutral-100 text-charcoal-700 hover:bg-neutral-200'
            }`}
          >
            {league === 'PREMIER' ? 'Premier League' : 'Championship'}
          </button>
        ))}
      </div>

      {/* STATS CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-gold-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Leader</h3>
          <p className="text-2xl font-bold text-charcoal-900">{teams[0]?.name}</p>
          <p className="text-xs text-charcoal-500 mt-2">{teams[0]?.pts} points</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Goals</h3>
          <p className="text-3xl font-bold text-blue-600">{teams.reduce((sum, t) => sum + t.gf, 0)}</p>
          <p className="text-xs text-charcoal-500 mt-2">Across league</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Teams</h3>
          <p className="text-3xl font-bold text-purple-600">{teams.length}</p>
          <p className="text-xs text-charcoal-500 mt-2">In competition</p>
        </div>
      </div>

      {/* STANDINGS TABLE */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-gold-600" />
            League Table
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">Pos</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">P</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">W</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">D</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">L</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">GF</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">GA</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">GD</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">Pts</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {teams.map((team) => (
                  <tr
                    key={team.name}
                    className={`hover:bg-neutral-50 transition-colors ${
                      team.pos <= 4 ? 'bg-green-50/50' : team.pos === 5 ? 'bg-yellow-50/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-charcoal-900">
                      <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {team.pos}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-charcoal-900">{team.name}</td>
                    <td className="px-6 py-4 text-center text-charcoal-700">{team.played}</td>
                    <td className="px-6 py-4 text-center text-green-700 font-bold">{team.won}</td>
                    <td className="px-6 py-4 text-center text-yellow-700 font-bold">{team.drawn}</td>
                    <td className="px-6 py-4 text-center text-red-700 font-bold">{team.lost}</td>
                    <td className="px-6 py-4 text-center text-charcoal-700 font-semibold">{team.gf}</td>
                    <td className="px-6 py-4 text-center text-charcoal-700 font-semibold">{team.ga}</td>
                    <td className="px-6 py-4 text-center font-bold text-charcoal-900">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                    <td className="px-6 py-4 text-center font-bold text-gold-600 text-lg">{team.pts}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 justify-center">
                        {team.form.map((result, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border ${getFormColor(result)}`}
                          >
                            {getFormIcon(result)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* LEGEND */}
      <div className="grid md:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded" />
          <span className="text-sm text-charcoal-700">Champion & Qualified</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded" />
          <span className="text-sm text-charcoal-700">Play-off spots</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded" />
          <span className="text-sm text-charcoal-700">Relegated</span>
        </div>
      </div>
    </div>
  );
}
