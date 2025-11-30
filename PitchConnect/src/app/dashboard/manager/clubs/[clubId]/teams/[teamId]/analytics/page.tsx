'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Goal,
  Zap,
  Users,
  TrendingUp,
  Award,
  BarChart3,
  Download,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PlayerStats {
  playerId: string;
  playerName: string;
  position: string;
  jerseyNumber?: number;
  goals: number;
  assists: number;
  appearances: number;
  goalsPerGame: number;
  assistsPerGame: number;
  matchesInStarting11: number;
  substitutedOn: number;
  substitutedOff: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
}

interface TeamStats {
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  goalsPerGame: number;
  cleanSheets: number;
  avgAppearances: number;
}

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [filteredStats, setFilteredStats] = useState<PlayerStats[]>([]);
  const [sortBy, setSortBy] = useState('goals');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const positions = ['ALL', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger', 'Striker'];
  const sortOptions = [
    { value: 'goals', label: 'Goals Scored' },
    { value: 'assists', label: 'Assists' },
    { value: 'appearances', label: 'Appearances' },
    { value: 'goalsPerGame', label: 'Goals Per Game' },
    { value: 'assistsPerGame', label: 'Assists Per Game' },
    { value: 'yellowCards', label: 'Yellow Cards' },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [playerStats, sortBy, positionFilter, searchQuery]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/analytics`
      );

      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setTeamStats(data.teamStats);
      setPlayerStats(data.playerStats);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...playerStats];

    // Filter by position
    if (positionFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.position === positionFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.playerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof PlayerStats] as number;
      const bValue = b[sortBy as keyof PlayerStats] as number;
      return bValue - aValue;
    });

    setFilteredStats(filtered);
  };

  const handleDownloadReport = () => {
    try {
      let csv = 'Player,Position,Goals,Assists,Appearances,Goals/Game,Assists/Game,Yellow Cards,Red Cards\n';

      filteredStats.forEach((player) => {
        csv += `"${player.playerName}","${player.position}",${player.goals},${player.assists},${player.appearances},${player.goalsPerGame.toFixed(2)},${player.assistsPerGame.toFixed(2)},${player.yellowCards},${player.redCards}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'player-statistics.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded!');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/10 to-pink-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/10 to-pink-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                  Performance Analytics
                </h1>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  Player statistics and team performance
                </p>
              </div>
            </div>
            <Button
              onClick={handleDownloadReport}
              className="bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white font-bold"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Team Stats Overview */}
        {teamStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Matches', value: teamStats.totalMatches, icon: Users },
              { label: 'Total Goals', value: teamStats.totalGoals, icon: Goal },
              { label: 'Goals Per Game', value: teamStats.goalsPerGame.toFixed(2), icon: TrendingUp },
              { label: 'Win Rate', value: `${teamStats.winRate.toFixed(1)}%`, icon: Award },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <Card key={idx} className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-charcoal-900 dark:text-white">
                          {stat.value}
                        </p>
                      </div>
                      <Icon className="w-8 h-8 text-purple-500 opacity-30" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Match Records */}
        {teamStats && (
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 mb-8">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Match Record</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Wins', value: teamStats.wins, color: 'text-green-600 dark:text-green-400' },
                  { label: 'Draws', value: teamStats.draws, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Losses', value: teamStats.losses, color: 'text-red-600 dark:text-red-400' },
                  { label: 'Clean Sheets', value: teamStats.cleanSheets, color: 'text-orange-600 dark:text-orange-400' },
                  { label: 'Total Assists', value: teamStats.totalAssists, color: 'text-purple-600 dark:text-purple-400' },
                ].map((record, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-2">{record.label}</p>
                    <p className={`text-3xl font-bold ${record.color}`}>{record.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters & Search */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 mb-8">
          <CardHeader>
            <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Search Player
                </label>
                <input
                  type="text"
                  placeholder="Name, position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-100 dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-700 transition-all"
                />
              </div>

              {/* Position Filter */}
              <div>
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Position
                </label>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-100 dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-700 transition-all"
                >
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-100 dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-700 transition-all"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Statistics Table */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="text-charcoal-900 dark:text-white">
              Player Statistics ({filteredStats.length})
            </CardTitle>
            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              Detailed performance metrics for all players
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStats.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <p className="text-charcoal-600 dark:text-charcoal-400">No players found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-charcoal-700">
                      <th className="px-4 py-3 text-left text-charcoal-900 dark:text-white font-semibold">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-charcoal-900 dark:text-white font-semibold">
                        Position
                      </th>
                      <th className="px-4 py-3 text-center text-charcoal-900 dark:text-white font-semibold">
                        Goals
                      </th>
                      <th className="px-4 py-3 text-center text-charcoal-900 dark:text-white font-semibold">
                        Assists
                      </th>
                      <th className="px-4 py-3 text-center text-charcoal-900 dark:text-white font-semibold">
                        Apps
                      </th>
                      <th className="px-4 py-3 text-center text-charcoal-900 dark:text-white font-semibold">
                        G/Game
                      </th>
                      <th className="px-4 py-3 text-center text-charcoal-900 dark:text-white font-semibold">
                        A/Game
                      </th>
                      <th className="px-4 py-3 text-center text-charcoal-900 dark:text-white font-semibold">
                        Yellow
                      </th>
                      <th className="px-4 py-3 text-center text-charcoal-900 dark:text-white font-semibold">
                        Red
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStats.map((player, idx) => (
                      <tr
                        key={player.playerId}
                        className={`border-b border-neutral-200 dark:border-charcoal-700 hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-colors ${
                          idx % 2 === 0 ? 'bg-white dark:bg-charcoal-800' : 'bg-neutral-50 dark:bg-charcoal-750'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-charcoal-900 dark:text-white">
                              {player.playerName}
                            </p>
                            {player.jerseyNumber && (
                              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                                #{player.jerseyNumber}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-charcoal-700 dark:text-charcoal-300">
                          {player.position}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold">
                            {player.goals}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">
                            {player.assists}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-charcoal-700 dark:text-charcoal-300">
                          {player.appearances}
                        </td>
                        <td className="px-4 py-3 text-center text-charcoal-700 dark:text-charcoal-300">
                          {player.goalsPerGame.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center text-charcoal-700 dark:text-charcoal-300">
                          {player.assistsPerGame.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {player.yellowCards > 0 && (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold text-xs">
                              {player.yellowCards}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {player.redCards > 0 && (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-xs">
                              {player.redCards}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
