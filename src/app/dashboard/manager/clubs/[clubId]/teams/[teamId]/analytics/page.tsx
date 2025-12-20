'use client';

/**
 * PitchConnect Team Analytics Dashboard - v2.0 ENHANCED
 * Location: ./src/app/dashboard/manager/clubs/[clubId]/teams/[teamId]/analytics/page.tsx
 *
 * Features:
 * ✅ Team performance statistics overview
 * ✅ Player statistics with filtering and sorting
 * ✅ Position-based filtering
 * ✅ Search functionality
 * ✅ CSV report download
 * ✅ Team stats cards (matches, goals, win rate)
 * ✅ Match record breakdown (W/D/L/CS)
 * ✅ Advanced player statistics table
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Loading and error states
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Full TypeScript type safety
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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
  Check,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

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

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// TOAST COMPONENT
// ============================================================================

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  const baseClasses =
    'fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 z-50';

  const typeClasses = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400',
  };

  const icons = {
    success: <Check className="h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    info: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => onRemove(toast.id)}
      />
    ))}
  </div>
);

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) => {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-charcoal-600 dark:text-charcoal-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white">
            {value}
          </p>
        </div>
        <Icon className="h-8 w-8 text-purple-500 opacity-30" />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [filteredStats, setFilteredStats] = useState<PlayerStats[]>([]);
  const [sortBy, setSortBy] = useState('goals');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const positions = [
    'ALL',
    'Goalkeeper',
    'Defender',
    'Midfielder',
    'Forward',
    'Winger',
    'Striker',
  ];
  const sortOptions = [
    { value: 'goals', label: 'Goals Scored' },
    { value: 'assists', label: 'Assists' },
    { value: 'appearances', label: 'Appearances' },
    { value: 'goalsPerGame', label: 'Goals Per Game' },
    { value: 'assistsPerGame', label: 'Assists Per Game' },
    { value: 'yellowCards', label: 'Yellow Cards' },
  ];

  // Toast utility
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    fetchAnalytics();
  }, [clubId, teamId]);

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
      setPlayerStats(data.playerStats || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast('Failed to load analytics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // FILTERS & SORTING
  // ========================================================================

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

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleDownloadReport = () => {
    try {
      let csv =
        'Player,Position,Jersey,Goals,Assists,Appearances,Goals/Game,Assists/Game,Starting XI,Subbed On,Subbed Off,Yellow Cards,Red Cards,Own Goals\n';

      filteredStats.forEach((player) => {
        csv += `"${player.playerName}","${player.position}","${player.jerseyNumber || '-'}",${player.goals},${player.assists},${player.appearances},${player.goalsPerGame.toFixed(2)},${player.assistsPerGame.toFixed(2)},${player.matchesInStarting11},${player.substitutedOn},${player.substitutedOff},${player.yellowCards},${player.redCards},${player.ownGoals}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `player-statistics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      showToast('Report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading report:', error);
      showToast('Failed to download report', 'error');
    }
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-purple-50/10 to-pink-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/10 to-pink-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Team
            </button>
          </Link>

          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white lg:text-4xl">
                  Performance Analytics
                </h1>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  Player statistics and team performance metrics
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 font-semibold text-white transition-all hover:from-purple-700 hover:to-pink-600"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
          </div>
        </div>

        {/* TEAM STATS OVERVIEW */}
        {teamStats && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Matches"
              value={teamStats.totalMatches}
              icon={Users}
            />
            <StatCard
              label="Total Goals"
              value={teamStats.totalGoals}
              icon={Goal}
            />
            <StatCard
              label="Goals Per Game"
              value={teamStats.goalsPerGame.toFixed(2)}
              icon={TrendingUp}
            />
            <StatCard
              label="Win Rate"
              value={`${teamStats.winRate.toFixed(1)}%`}
              icon={Award}
            />
          </div>
        )}

        {/* MATCH RECORD */}
        {teamStats && (
          <div className="mb-8 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
                Match Record
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {[
                  {
                    label: 'Wins',
                    value: teamStats.wins,
                    color: 'text-green-600 dark:text-green-400',
                  },
                  {
                    label: 'Draws',
                    value: teamStats.draws,
                    color: 'text-blue-600 dark:text-blue-400',
                  },
                  {
                    label: 'Losses',
                    value: teamStats.losses,
                    color: 'text-red-600 dark:text-red-400',
                  },
                  {
                    label: 'Clean Sheets',
                    value: teamStats.cleanSheets,
                    color: 'text-orange-600 dark:text-orange-400',
                  },
                  {
                    label: 'Total Assists',
                    value: teamStats.totalAssists,
                    color: 'text-purple-600 dark:text-purple-400',
                  },
                ].map((record, idx) => (
                  <div key={idx} className="text-center">
                    <p className="mb-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                      {record.label}
                    </p>
                    <p className={`text-3xl font-bold ${record.color}`}>
                      {record.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FILTERS & SEARCH */}
        <div className="mb-8 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
              <Filter className="h-5 w-5" />
              Filters & Search
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                Search Player
              </label>
              <input
                type="text"
                placeholder="Enter player name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-purple-500"
              />
            </div>

            {/* Position Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                Position
              </label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-purple-500"
              >
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-purple-500"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* PLAYER STATISTICS TABLE */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
              Player Statistics ({filteredStats.length})
            </h2>
            <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
              Detailed performance metrics for all players
            </p>
          </div>
          <div className="p-6">
            {filteredStats.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  No players found matching your filters
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-charcoal-700">
                      <th className="px-4 py-3 text-left font-semibold text-charcoal-900 dark:text-white">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-charcoal-900 dark:text-white">
                        Position
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-charcoal-900 dark:text-white">
                        Goals
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-charcoal-900 dark:text-white">
                        Assists
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-charcoal-900 dark:text-white">
                        Apps
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-charcoal-900 dark:text-white">
                        G/Game
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-charcoal-900 dark:text-white">
                        A/Game
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-charcoal-900 dark:text-white">
                        Starting XI
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-charcoal-900 dark:text-white">
                        Yellow
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-charcoal-900 dark:text-white">
                        Red
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-charcoal-700">
                    {filteredStats.map((player, idx) => (
                      <tr
                        key={player.playerId}
                        className="transition-colors hover:bg-neutral-50 dark:hover:bg-charcoal-700"
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
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {player.goals}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
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
                        <td className="px-4 py-3 text-center text-charcoal-700 dark:text-charcoal-300">
                          {player.matchesInStarting11}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {player.yellowCards > 0 && (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-yellow-100 text-xs font-bold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                              {player.yellowCards}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {player.redCards > 0 && (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-red-100 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
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
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
