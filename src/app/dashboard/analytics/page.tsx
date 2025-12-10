// ============================================================================
// src/app/dashboard/analytics/page.tsx
// Analytics Dashboard - Real-Time Statistics & Insights
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowUp, TrendingUp, Users, Trophy, BarChart3, Zap } from 'lucide-react';

interface TeamAnalytics {
  teamId: string;
  teamName: string;
  shortCode: string;
  stats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    winRate: string;
    goalAverage: number;
    homeWins: number;
    awayWins: number;
  };
  standing: { position: number; points: number } | null;
  squad: { playerCount: number; leagueCount: number };
}

interface AnalyticsSummary {
  totalTeams: number;
  filters: Record<string, unknown>;
  sortedBy: string;
  timestamp: string;
}

export default function AnalyticsDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<TeamAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState('FOOTBALL');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/teams?sport=${selectedSport}&sortBy=points&limit=25`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data.analytics || []);
        setSummary(data.summary);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchAnalytics();
    }
  }, [session, selectedSport]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in to view analytics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-slate-400">
                Real-time team performance metrics and insights
              </p>
            </div>
            <div className="flex gap-2">
              {['FOOTBALL', 'NETBALL'].map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSport === sport
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-500 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Teams</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {summary?.totalTeams || 0}
                </p>
              </div>
              <Trophy className="w-12 h-12 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-green-500 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Goals/Match</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {analytics.length > 0
                    ? (
                        analytics.reduce((sum, a) => sum + a.stats.goalAverage, 0) /
                        analytics.length
                      ).toFixed(1)
                    : '0.0'}
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-green-500 opacity-80" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-purple-500 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Top Win Rate</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {analytics.length > 0
                    ? Math.max(
                        ...analytics.map((a) =>
                          parseFloat(a.stats.winRate.replace('%', ''))
                        )
                      ).toFixed(1)
                    : '0.0'}
                  %
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-80" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-orange-500 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Players</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {analytics.reduce((sum, a) => sum + a.squad.playerCount, 0)}
                </p>
              </div>
              <Users className="w-12 h-12 text-orange-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Teams Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-900">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Team Rankings
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p>Loading analytics data...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">
              <p>Error: {error}</p>
            </div>
          ) : analytics.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p>No analytics data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">#</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                      Team
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      P
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      W
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      D
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      L
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      GF
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      GA
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      GD
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      Pts
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      W%
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((team, index) => (
                    <tr
                      key={team.teamId}
                      className="border-t border-slate-700 hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-300">
                        {team.standing?.position || index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/teams/${team.teamId}`}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          {team.teamName}
                        </Link>
                        <span className="text-slate-500 ml-2">({team.shortCode})</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-300">
                        {team.stats.played}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-green-400 font-semibold">
                        {team.stats.wins}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-yellow-400 font-semibold">
                        {team.stats.draws}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-red-400 font-semibold">
                        {team.stats.losses}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-300">
                        {team.stats.goalsFor}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-300">
                        {team.stats.goalsAgainst}
                      </td>
                      <td className="px-6 py-4 text-sm text-center font-semibold text-slate-300">
                        {team.stats.goalDifference > 0 ? (
                          <span className="text-green-400">+{team.stats.goalDifference}</span>
                        ) : (
                          <span className={team.stats.goalDifference < 0 ? 'text-red-400' : ''}>
                            {team.stats.goalDifference}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center font-bold text-white bg-slate-700/50 rounded">
                        {team.standing?.points || team.stats.points}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            parseFloat(team.stats.winRate) >= 60
                              ? 'bg-green-900 text-green-300'
                              : parseFloat(team.stats.winRate) >= 40
                              ? 'bg-yellow-900 text-yellow-300'
                              : 'bg-red-900 text-red-300'
                          }`}
                        >
                          {team.stats.winRate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Last updated: {summary?.timestamp ? new Date(summary.timestamp).toLocaleString() : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
