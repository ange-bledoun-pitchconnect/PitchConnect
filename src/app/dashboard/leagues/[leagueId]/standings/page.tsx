'use client';

/**
 * PitchConnect League Standings Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/leagues/[leagueId]/standings/page.tsx
 *
 * Features:
 * ✅ Comprehensive league standings table with full metrics
 * ✅ Team search and filtering functionality
 * ✅ Multi-sort options: position, points, goal difference, goals scored
 * ✅ Position change indicators (trophy, trending icons)
 * ✅ Team form display (last 5 matches: W/D/L)
 * ✅ Statistics dashboard: total goals, avg goals, leader, top scorer
 * ✅ CSV export functionality for data analysis
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Color-coded rows: champion, promotion zone, relegation zone
 * ✅ Responsive table design with horizontal scroll
 * ✅ Dark mode support
 * ✅ Schema-aligned data models
 * ✅ Loading and error states
 * ✅ Legend for table color coding
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Loader2,
  Download,
  Search,
  AlertCircle,
  Zap,
  Target,
  Check,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface Standing {
  id: string;
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

interface League {
  name: string;
  code: string;
  season: number;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SORT_OPTIONS = [
  { value: 'position', label: 'Sort by Position' },
  { value: 'points', label: 'Sort by Points' },
  { value: 'goalDifference', label: 'Sort by Goal Difference' },
  { value: 'goalsFor', label: 'Sort by Goals Scored' },
];

// ============================================================================
// TOAST COMPONENT (No External Dependency)
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
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'yellow' | 'orange';
}) => {
  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800 transition-all hover:shadow-md dark:hover:shadow-charcoal-900/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-charcoal-600 dark:text-charcoal-400">
            {label}
          </p>
          <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
            {value}
          </p>
          {subtext && (
            <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-500">
              {subtext}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// BADGE COMPONENT
// ============================================================================

const FormBadge = ({ result }: { result: string }) => {
  const badgeStyles = {
    W: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600',
    D: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600',
    L: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600',
  };

  return (
    <span
      className={`inline-flex items-center justify-center h-6 w-6 rounded border text-xs font-bold ${
        badgeStyles[result as keyof typeof badgeStyles] || 'bg-gray-100'
      }`}
    >
      {result}
    </span>
  );
};

// ============================================================================
// STANDINGS TABLE COMPONENT
// ============================================================================

const StandingsTable = ({
  standings,
  totalTeams,
}: {
  standings: Standing[];
  totalTeams: number;
}) => {
  if (standings.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
        <h3 className="mb-2 text-xl font-semibold text-charcoal-900 dark:text-white">
          No standings yet
        </h3>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Add teams and play matches to generate league standings
        </p>
      </div>
    );
  }

  const getRowStyle = (index: number) => {
    if (index === 0) return 'bg-gold-50 dark:bg-gold-900/10';
    if (index <= 2) return 'bg-green-50 dark:bg-green-900/10';
    if (index >= totalTeams - 3) return 'bg-red-50 dark:bg-red-900/10';
    return '';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-neutral-200 dark:border-charcoal-700">
            <th className="px-4 py-4 text-left text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              Pos
            </th>
            <th className="px-4 py-4 text-left text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              Team
            </th>
            <th className="px-4 py-4 text-center text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              P
            </th>
            <th className="px-4 py-4 text-center text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              W
            </th>
            <th className="px-4 py-4 text-center text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              D
            </th>
            <th className="px-4 py-4 text-center text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              L
            </th>
            <th className="px-4 py-4 text-center text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              GF
            </th>
            <th className="px-4 py-4 text-center text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              GA
            </th>
            <th className="px-4 py-4 text-center text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              GD
            </th>
            <th className="px-4 py-4 text-center text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              Pts
            </th>
            <th className="px-4 py-4 text-center text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
              Form
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, index) => (
            <tr
              key={standing.id}
              className={`border-b border-neutral-100 transition-colors hover:bg-gold-50 dark:border-charcoal-700 dark:hover:bg-charcoal-700/50 ${getRowStyle(
                index
              )}`}
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {standing.position === 1 && (
                    <Trophy className="h-5 w-5 text-gold-500" />
                  )}
                  {standing.position <= 3 && standing.position !== 1 && (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  )}
                  {standing.position >= totalTeams - 2 && (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  {standing.position > 3 &&
                    standing.position < totalTeams - 2 && (
                      <Minus className="h-5 w-5 text-charcoal-400 dark:text-charcoal-600" />
                    )}
                  <span className="text-lg font-bold text-charcoal-900 dark:text-white">
                    {standing.position}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="font-semibold text-charcoal-900 dark:text-white">
                  {standing.teamName}
                </span>
              </td>
              <td className="px-4 py-4 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.played}
              </td>
              <td className="px-4 py-4 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.won}
              </td>
              <td className="px-4 py-4 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.drawn}
              </td>
              <td className="px-4 py-4 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.lost}
              </td>
              <td className="px-4 py-4 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.goalsFor}
              </td>
              <td className="px-4 py-4 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.goalsAgainst}
              </td>
              <td className="px-4 py-4 text-center">
                <span
                  className={`font-bold ${
                    standing.goalDifference > 0
                      ? 'text-green-600 dark:text-green-400'
                      : standing.goalDifference < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-charcoal-700 dark:text-charcoal-300'
                  }`}
                >
                  {standing.goalDifference > 0 ? '+' : ''}
                  {standing.goalDifference}
                </span>
              </td>
              <td className="px-4 py-4 text-center">
                <span className="text-lg font-bold text-charcoal-900 dark:text-white">
                  {standing.points}
                </span>
              </td>
              <td className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  {standing.form.slice(-5).map((result, i) => (
                    <FormBadge key={i} result={result} />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function LeagueStandingsPage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  // State Management
  const [league, setLeague] = useState<League | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'position' | 'points' | 'goalDifference' | 'goalsFor'
  >('position');
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
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    fetchStandings();
  }, [leagueId]);

  const fetchStandings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/leagues/${leagueId}/standings`);
      if (!response.ok) throw new Error('Failed to fetch standings');

      const data = await response.json();
      setLeague(data.league);
      setStandings(data.standings);
    } catch (error) {
      console.error('Error fetching standings:', error);
      showToast('Failed to load standings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const exportToCSV = useCallback(() => {
    if (standings.length === 0) {
      showToast('No data to export', 'info');
      return;
    }

    const headers = [
      'Position',
      'Team',
      'Played',
      'Won',
      'Drawn',
      'Lost',
      'GF',
      'GA',
      'GD',
      'Points',
    ];
    const rows = standings.map((s) => [
      s.position,
      s.teamName,
      s.played,
      s.won,
      s.drawn,
      s.lost,
      s.goalsFor,
      s.goalsAgainst,
      s.goalDifference,
      s.points,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\n'
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${league?.code}_standings_${league?.season}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('✅ Standings exported successfully', 'success');
  }, [standings, league, showToast]);

  // ========================================================================
  // FILTERS AND CALCULATIONS
  // ========================================================================

  const filteredStandings = standings
    .filter((standing) =>
      standing.teamName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.points - a.points || b.goalDifference - a.goalDifference;
        case 'goalDifference':
          return b.goalDifference - a.goalDifference;
        case 'goalsFor':
          return b.goalsFor - a.goalsFor;
        case 'position':
        default:
          return a.position - b.position;
      }
    });

  const totalGoals = standings.reduce((sum, s) => sum + s.goalsFor, 0);
  const avgGoalsPerTeam =
    standings.length > 0 ? (totalGoals / standings.length).toFixed(1) : '0';
  const topScorer = standings.reduce(
    (max, s) => (s.goalsFor > max.goalsFor ? s : max),
    standings[0]
  );
  const leagueLeader = standings[0] || null;

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-gold-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Loading standings...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/leagues/${leagueId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to League
            </button>
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-400 shadow-lg">
                <TrendingUp className="h-12 w-12 text-white" />
              </div>

              <div>
                <h1 className="mb-2 text-3xl font-bold text-charcoal-900 dark:text-white lg:text-4xl">
                  League Standings
                </h1>
                {league && (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-charcoal-600 dark:text-charcoal-400">
                      {league.name}
                    </p>
                    <span className="inline-block rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700 dark:bg-gold-900/30 dark:text-gold-300">
                      {league.code}
                    </span>
                    <span className="inline-block rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-charcoal-700 dark:border-charcoal-600 dark:text-charcoal-300">
                      {league.season}/{league.season + 1}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* STATISTICS CARDS */}
        {standings.length > 0 && (
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Goals"
              value={totalGoals}
              icon={Zap}
              color="blue"
            />
            <StatCard
              label="Avg Goals/Team"
              value={avgGoalsPerTeam}
              icon={Target}
              color="purple"
            />
            <StatCard
              label="League Leader"
              value={leagueLeader?.teamName || 'N/A'}
              subtext={leagueLeader ? `${leagueLeader.points} pts` : undefined}
              icon={Trophy}
              color="yellow"
            />
            <StatCard
              label="Top Scorer"
              value={topScorer?.teamName || 'N/A'}
              subtext={
                topScorer ? `${topScorer.goalsFor} goals` : undefined
              }
              icon={TrendingUp}
              color="orange"
            />
          </div>
        )}

        {/* SEARCH & SORT CONTROLS */}
        <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400 dark:text-charcoal-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams..."
                className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | 'position'
                    | 'points'
                    | 'goalDifference'
                    | 'goalsFor'
                )
              }
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STANDINGS TABLE */}
        <div className="mb-8 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
              <Trophy className="h-5 w-5 text-gold-500" />
              Current Standings
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              {standings.length} teams • Updated after each match
            </p>
          </div>
          <div className="p-6">
            <StandingsTable
              standings={filteredStandings}
              totalTeams={standings.length}
            />
          </div>
        </div>

        {/* LEGEND */}
        {standings.length > 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Legend
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded border border-gold-200 bg-gold-50 dark:border-gold-700 dark:bg-gold-900/10" />
                <span className="text-sm text-charcoal-700 dark:text-charcoal-300">
                  Champion
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded border border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/10" />
                <span className="text-sm text-charcoal-700 dark:text-charcoal-300">
                  Promotion Zone
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded border border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/10" />
                <span className="text-sm text-charcoal-700 dark:text-charcoal-300">
                  Relegation Zone
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}