'use client';

/**
 * PitchConnect Live Dashboard Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/live/page.tsx
 *
 * Features:
 * ✅ Real-time league standings display
 * ✅ Live match updates and scores
 * ✅ League selection dropdown
 * ✅ Tab-based navigation (Standings/Matches)
 * ✅ Auto-refresh functionality
 * ✅ Custom data fetching (zero @tanstack/react-query)
 * ✅ Custom loading states
 * ✅ Custom toast notifications
 * ✅ Empty states handling
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Full TypeScript type safety
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  RefreshCw,
  Loader2,
  TrendingUp,
  Trophy,
  Zap,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface League {
  id: string;
  name: string;
  code: string;
  season: number;
  sport: string;
}

interface StandingsEntry {
  teamId: string;
  teamName: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number;
  trend?: 'up' | 'down' | 'stable';
}

interface Match {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'live' | 'completed';
  kickoffTime?: string;
  updatedAt?: string;
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
// BADGE COMPONENT
// ============================================================================

const Badge = ({
  children,
  variant = 'default',
  color = 'neutral',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  color?: 'gold' | 'green' | 'red' | 'neutral';
}) => {
  const colorMap = {
    default: {
      gold: 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 border-gold-300 dark:border-gold-600',
      green:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600',
      neutral:
        'bg-neutral-100 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600',
    },
    outline: {
      gold: 'border-gold-300 dark:border-gold-600 text-gold-700 dark:text-gold-300',
      green: 'border-green-300 dark:border-green-600 text-green-700 dark:text-green-300',
      red: 'border-red-300 dark:border-red-600 text-red-700 dark:text-red-300',
      neutral: 'border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300',
    },
  };

  const baseClasses =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border';
  const variantClasses =
    variant === 'outline'
      ? `border ${colorMap.outline[color]}`
      : `border ${colorMap.default[color]}`;

  return <span className={`${baseClasses} ${variantClasses}`}>{children}</span>;
};

// ============================================================================
// STANDINGS TABLE COMPONENT
// ============================================================================

const StandingsTable = ({
  standings,
  isLoading,
}: {
  standings: StandingsEntry[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-charcoal-700 dark:bg-charcoal-800">
        <Trophy className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
        <h3 className="mb-2 text-lg font-semibold text-charcoal-900 dark:text-white">
          No standings available
        </h3>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Standings will appear once matches have been played
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
      <table className="w-full">
        <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-charcoal-700 dark:bg-charcoal-800">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              Pos
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              Team
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              P
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              W
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              D
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              L
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              PF
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              PA
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              Pts
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-charcoal-700">
          {standings.map((entry) => (
            <tr
              key={entry.teamId}
              className="transition-colors hover:bg-neutral-50 dark:hover:bg-charcoal-700"
            >
              <td className="px-4 py-3 text-sm font-bold text-charcoal-900 dark:text-white">
                {entry.position}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-charcoal-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <span>{entry.teamName}</span>
                  {entry.trend === 'up' && (
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-center text-sm text-charcoal-600 dark:text-charcoal-400">
                {entry.played}
              </td>
              <td className="px-4 py-3 text-center text-sm text-charcoal-600 dark:text-charcoal-400">
                {entry.wins}
              </td>
              <td className="px-4 py-3 text-center text-sm text-charcoal-600 dark:text-charcoal-400">
                {entry.draws}
              </td>
              <td className="px-4 py-3 text-center text-sm text-charcoal-600 dark:text-charcoal-400">
                {entry.losses}
              </td>
              <td className="px-4 py-3 text-center text-sm text-charcoal-600 dark:text-charcoal-400">
                {entry.pointsFor}
              </td>
              <td className="px-4 py-3 text-center text-sm text-charcoal-600 dark:text-charcoal-400">
                {entry.pointsAgainst}
              </td>
              <td className="px-4 py-3 text-right text-sm font-bold text-gold-600 dark:text-gold-400">
                {entry.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// MATCHES LIST COMPONENT
// ============================================================================

const MatchesList = ({
  matches,
  isLoading,
}: {
  matches: Match[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-charcoal-700 dark:bg-charcoal-800">
        <Zap className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
        <h3 className="mb-2 text-lg font-semibold text-charcoal-900 dark:text-white">
          No matches available
        </h3>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Matches will appear once they are scheduled
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <div
          key={match.id}
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-charcoal-700 dark:bg-charcoal-800"
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Home Team */}
            <div className="flex flex-1 flex-col items-center md:items-end">
              <p className="text-sm font-semibold text-charcoal-900 dark:text-white">
                {match.homeTeamName}
              </p>
              {match.status === 'completed' && (
                <p className="text-2xl font-bold text-charcoal-900 dark:text-white">
                  {match.homeScore}
                </p>
              )}
            </div>

            {/* Match Info */}
            <div className="flex flex-col items-center gap-2">
              {match.status === 'live' && (
                <Badge color="red">
                  <Activity className="h-3 w-3 animate-pulse" />
                  LIVE
                </Badge>
              )}
              {match.status === 'scheduled' && (
                <Badge color="neutral">
                  {match.kickoffTime
                    ? new Date(match.kickoffTime).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'TBD'}
                </Badge>
              )}
              {match.status === 'completed' && (
                <Badge color="green">FT</Badge>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-1 flex-col items-center md:items-start">
              <p className="text-sm font-semibold text-charcoal-900 dark:text-white">
                {match.awayTeamName}
              </p>
              {match.status === 'completed' && (
                <p className="text-2xl font-bold text-charcoal-900 dark:text-white">
                  {match.awayScore}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function LiveDashboardPage() {
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'standings' | 'matches'>(
    'standings'
  );
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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
  // FETCH LEAGUES
  // ========================================================================

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setIsLoadingLeagues(true);
        const response = await fetch('/api/leagues?limit=50');
        if (!response.ok) throw new Error('Failed to fetch leagues');
        const data = await response.json();
        setLeagues(data.data || []);

        // Auto-select first league
        if (data.data && data.data.length > 0 && !selectedLeague) {
          setSelectedLeague(data.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
        showToast('Failed to load leagues', 'error');
      } finally {
        setIsLoadingLeagues(false);
      }
    };

    fetchLeagues();
  }, []);

  // ========================================================================
  // FETCH DATA FOR SELECTED LEAGUE
  // ========================================================================

  useEffect(() => {
    if (!selectedLeague) return;

    const fetchData = async () => {
      try {
        setIsLoadingData(true);

        // Fetch standings
        const standingsRes = await fetch(
          `/api/leagues/${selectedLeague}/standings`
        );
        if (standingsRes.ok) {
          const standingsData = await standingsRes.json();
          setStandings(standingsData.standings || []);
        }

        // Fetch matches
        const matchesRes = await fetch(
          `/api/leagues/${selectedLeague}/matches?limit=10`
        );
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setMatches(matchesData.matches || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Failed to load league data', 'error');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();

    // Set up auto-refresh interval (every 30 seconds)
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedLeague, autoRefresh]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleManualRefresh = () => {
    if (!selectedLeague) return;
    showToast('Refreshing data...', 'info');
    // Trigger refetch by toggling autoRefresh
    setAutoRefresh(false);
    setTimeout(() => setAutoRefresh(true), 100);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  const selectedLeagueData = leagues.find((l) => l.id === selectedLeague);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-charcoal-900 dark:text-white lg:text-4xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              Live Dashboard
            </h1>
            <p className="mt-2 text-charcoal-600 dark:text-charcoal-400">
              Real-time league standings and match updates
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={isLoadingData || !selectedLeague}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
            >
              {isLoadingData ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>

            <Badge color="red">
              <Activity className="h-3 w-3 animate-pulse" />
              LIVE
            </Badge>

            <label className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 dark:border-charcoal-600 dark:bg-charcoal-800">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                Auto Refresh
              </span>
            </label>
          </div>
        </div>

        {/* LEAGUE SELECTOR */}
        {isLoadingLeagues ? (
          <div className="mb-8 flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        ) : (
          <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-3">
              Select League
            </label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
            >
              <option value="">Choose a league...</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name} • {league.code} • Season {league.season}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CONTENT TABS */}
        {selectedLeague && selectedLeagueData ? (
          <div className="space-y-6">
            {/* TAB NAVIGATION */}
            <div className="flex gap-2 border-b border-neutral-200 dark:border-charcoal-700">
              <button
                onClick={() => setActiveTab('standings')}
                className={`px-4 py-3 font-semibold transition-colors ${
                  activeTab === 'standings'
                    ? 'border-b-2 border-gold-500 text-gold-600 dark:text-gold-400'
                    : 'text-charcoal-600 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white'
                }`}
              >
                Standings
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-4 py-3 font-semibold transition-colors ${
                  activeTab === 'matches'
                    ? 'border-b-2 border-gold-500 text-gold-600 dark:text-gold-400'
                    : 'text-charcoal-600 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white'
                }`}
              >
                Matches
              </button>
            </div>

            {/* STANDINGS TAB */}
            {activeTab === 'standings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
                    League Standings
                  </h2>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    {selectedLeagueData.season}/{selectedLeagueData.season + 1}
                  </p>
                </div>
                <StandingsTable standings={standings} isLoading={isLoadingData} />
              </div>
            )}

            {/* MATCHES TAB */}
            {activeTab === 'matches' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
                    Recent Matches
                  </h2>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    Latest 10 matches
                  </p>
                </div>
                <MatchesList matches={matches} isLoading={isLoadingData} />
              </div>
            )}
          </div>
        ) : !isLoadingLeagues && selectedLeague ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center dark:border-blue-900/50 dark:bg-blue-900/20">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-blue-600 dark:text-blue-400" />
            <p className="text-lg text-blue-900 dark:text-blue-300">
              League not found
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-charcoal-700 dark:bg-charcoal-800">
            <Trophy className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
            <h3 className="mb-2 text-lg font-semibold text-charcoal-900 dark:text-white">
              Select a league to get started
            </h3>
            <p className="text-charcoal-600 dark:text-charcoal-400">
              Choose a league from the dropdown above to view live standings and
              matches
            </p>
          </div>
        )}
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
