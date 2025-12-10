// ============================================================================
// src/app/dashboard/players/page.tsx
// Player Management Dashboard - Squad Management & Statistics
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Users, Search, Filter, Award, Shirt } from 'lucide-react';

interface Player {
  playerId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  sport: string;
  dateOfBirth: string;
  teams: Array<{
    teamId: string;
    teamName: string;
    shortCode: string;
    jerseyNumber: number;
    role: string;
  }>;
  statistics: {
    appearances: number;
    matches: number;
    goals: number;
    assists: number;
    goalsPerMatch: string;
    avgRating: number;
    appearanceRate: string;
  };
}

interface PlayersSummary {
  totalPlayers: number;
  filters: Record<string, unknown>;
  sortedBy: string;
  timestamp: string;
}

export default function PlayersDashboard() {
  const { data: session } = useSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [summary, setSummary] = useState<PlayersSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [sortBy, setSortBy] = useState('appearances');
  const [searchTerm, setSearchTerm] = useState('');

  const positions = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);

        let url = `/api/analytics/players?limit=100&sortBy=${sortBy}`;
        if (selectedPosition) url += `&position=${selectedPosition}`;
        if (selectedTeam) url += `&teamId=${selectedTeam}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch players');
        }

        const data = await response.json();
        let players = data.players || [];

        // Filter by search term
        if (searchTerm) {
          players = players.filter((p: Player) =>
            p.fullName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setPlayers(players);
        setSummary(data.summary);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Players fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchPlayers();
    }
  }, [session, selectedTeam, selectedPosition, sortBy, searchTerm]);

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GOALKEEPER':
        return 'bg-blue-900 text-blue-200';
      case 'DEFENDER':
        return 'bg-green-900 text-green-200';
      case 'MIDFIELDER':
        return 'bg-yellow-900 text-yellow-200';
      case 'FORWARD':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-slate-700 text-slate-200';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-400';
    if (rating >= 7) return 'text-yellow-400';
    return 'text-orange-400';
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in to manage players
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
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Users className="w-10 h-10 text-cyan-500" />
                Player Management
              </h1>
              <p className="text-slate-400">
                Squad statistics and player performance insights
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Position Filter */}
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="">All Positions</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="appearances">Appearances</option>
              <option value="goals">Goals</option>
              <option value="rating">Rating</option>
              <option value="name">Name</option>
            </select>

            {/* Results Count */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 flex items-center justify-center text-slate-300">
              <span className="text-sm">
                Showing{' '}
                <span className="font-bold text-white">{players.length}</span> players
              </span>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-4"></div>
              <p>Loading player data...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">
              <p>Error: {error}</p>
            </div>
          ) : players.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p>No players found matching criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                      Player Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                      Position
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      Team
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      Apps
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      Goals
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      Assists
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      G/M
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr
                      key={player.playerId}
                      className="border-t border-slate-700 hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/players/${player.playerId}`}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          {player.fullName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPositionColor(
                            player.position
                          )}`}
                        >
                          {player.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-300">
                        {player.teams[0]?.teamName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-center font-semibold text-slate-300">
                        {player.statistics.appearances}
                      </td>
                      <td className="px-6 py-4 text-sm text-center font-semibold text-green-400">
                        {player.statistics.goals}
                      </td>
                      <td className="px-6 py-4 text-sm text-center font-semibold text-blue-400">
                        {player.statistics.assists}
                      </td>
                      <td className={`px-6 py-4 text-sm text-center font-bold ${getRatingColor(player.statistics.avgRating)}`}>
                        {player.statistics.avgRating.toFixed(1)}/10
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-300">
                        {player.statistics.goalsPerMatch}
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