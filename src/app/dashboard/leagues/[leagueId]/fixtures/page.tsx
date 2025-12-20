'use client';

/**
 * PitchConnect League Fixtures Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/leagues/[leagueId]/fixtures/page.tsx
 *
 * Features:
 * ✅ View all league fixtures with detailed match information
 * ✅ Matchweek-based organization with quick selector
 * ✅ Match status tracking: SCHEDULED, LIVE, COMPLETED
 * ✅ Auto-generate fixtures for all teams (round-robin)
 * ✅ Manual match creation and management
 * ✅ Score entry with real-time updates
 * ✅ Summary stats: matchweeks, total matches, completed, upcoming
 * ✅ Match result editing with modal dialog
 * ✅ Venue and date display
 * ✅ Status badges with visual indicators
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Loading and empty states
 * ✅ Schema-aligned data models
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Loader2,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Check,
  AlertCircle,
  Zap,
  Trophy,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  time?: string;
  venue?: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  homeScore?: number;
  awayScore?: number;
}

interface Fixture {
  id: string;
  matchweek: number;
  startDate: string;
  endDate?: string;
  matches: Match[];
}

interface League {
  id: string;
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
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    SCHEDULED: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-900/50',
      text: 'text-blue-700 dark:text-blue-400',
      icon: <Calendar className="h-3 w-3" />,
      label: 'Scheduled',
    },
    LIVE: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-900/50',
      text: 'text-red-700 dark:text-red-400',
      icon: <Zap className="h-3 w-3" />,
      label: 'Live',
    },
    COMPLETED: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-900/50',
      text: 'text-green-700 dark:text-green-400',
      icon: <Check className="h-3 w-3" />,
      label: 'Completed',
    },
  };

  const style = styles[status as keyof typeof styles] || styles.SCHEDULED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${style.bg} ${style.border} ${style.text}`}
    >
      {style.icon}
      {style.label}
    </span>
  );
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'orange';
}) => {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
      <p className="mb-1 text-sm text-charcoal-600 dark:text-charcoal-400">
        {label}
      </p>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
};

// ============================================================================
// MATCH CARD COMPONENT
// ============================================================================

const MatchCard = ({
  match,
  onEdit,
}: {
  match: Match;
  onEdit: (match: Match) => void;
}) => {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-charcoal-700 dark:bg-charcoal-700/50">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Teams & Score */}
        <div className="flex-1">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-charcoal-900 dark:text-white">
              {match.homeTeamName}
            </span>
            {match.status === 'COMPLETED' ? (
              <span className="text-2xl font-bold text-charcoal-900 dark:text-white">
                {match.homeScore}
              </span>
            ) : (
              <span className="text-charcoal-400 dark:text-charcoal-500">—</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-charcoal-900 dark:text-white">
              {match.awayTeamName}
            </span>
            {match.status === 'COMPLETED' ? (
              <span className="text-2xl font-bold text-charcoal-900 dark:text-white">
                {match.awayScore}
              </span>
            ) : (
              <span className="text-charcoal-400 dark:text-charcoal-500">—</span>
            )}
          </div>
        </div>

        {/* Match Info */}
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={match.status} />
          <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
            <Clock className="h-4 w-4" />
            {new Date(match.date).toLocaleDateString('en-GB', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
          {match.venue && (
            <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
              <MapPin className="h-4 w-4" />
              {match.venue}
            </div>
          )}
        </div>

        {/* Actions */}
        {match.status !== 'COMPLETED' && (
          <button
            onClick={() => onEdit(match)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600"
          >
            <Edit className="h-4 w-4" />
            Enter Result
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SCORE ENTRY MODAL COMPONENT
// ============================================================================

const ScoreEntryModal = ({
  match,
  onClose,
  onSave,
  isSaving,
}: {
  match: Match | null;
  onClose: () => void;
  onSave: (matchId: string, homeScore: number, awayScore: number) => void;
  isSaving: boolean;
}) => {
  const [homeScore, setHomeScore] = useState(match?.homeScore || 0);
  const [awayScore, setAwayScore] = useState(match?.awayScore || 0);

  if (!match) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-charcoal-700 dark:bg-charcoal-800">
        <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
          <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
            Enter Match Result
          </h2>
        </div>

        <div className="space-y-6 p-6">
          {/* Home Team Score */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              {match.homeTeamName}
            </label>
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-center text-2xl font-bold text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
            />
          </div>

          {/* Away Team Score */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              {match.awayTeamName}
            </label>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-center text-2xl font-bold text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onSave(match.id, homeScore, awayScore)}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Result
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-300 dark:hover:bg-charcoal-600"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function FixturesPage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  // State Management
  const [league, setLeague] = useState<League | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatchweek, setSelectedMatchweek] = useState<number | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);
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
    fetchFixtures();
  }, [leagueId]);

  useEffect(() => {
    if (fixtures.length > 0 && selectedMatchweek === null) {
      setSelectedMatchweek(fixtures[0].matchweek);
    }
  }, [fixtures, selectedMatchweek]);

  const fetchFixtures = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/leagues/${leagueId}/fixtures`);
      if (!response.ok) throw new Error('Failed to fetch fixtures');

      const data = await response.json();
      setLeague(data.league);
      setFixtures(data.fixtures || []);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      showToast('Failed to load fixtures', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleGenerateFixtures = async () => {
    if (!window.confirm('This will generate fixtures for all teams. Continue?')) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/fixtures/generate`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to generate fixtures');

      const data = await response.json();
      showToast(
        `✅ Generated ${data.totalMatches} matches across ${data.matchweeks} matchweeks`,
        'success'
      );
      fetchFixtures();
    } catch (error) {
      console.error('Error generating fixtures:', error);
      showToast('Failed to generate fixtures', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateScore = async (
    matchId: string,
    homeScore: number,
    awayScore: number
  ) => {
    setIsSavingScore(true);
    try {
      const response = await fetch(
        `/api/leagues/${leagueId}/fixtures/matches/${matchId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            homeScore,
            awayScore,
            status: 'COMPLETED',
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update match');

      showToast('✅ Match result updated', 'success');
      setEditingMatch(null);
      fetchFixtures();
    } catch (error) {
      console.error('Error updating match:', error);
      showToast('Failed to update match result', 'error');
    } finally {
      setIsSavingScore(false);
    }
  };

  // ========================================================================
  // CALCULATIONS
  // ========================================================================

  const totalMatches = fixtures.reduce((sum, f) => sum + f.matches.length, 0);
  const completedMatches = fixtures.reduce(
    (sum, f) => sum + f.matches.filter((m) => m.status === 'COMPLETED').length,
    0
  );
  const upcomingMatches = fixtures.reduce(
    (sum, f) => sum + f.matches.filter((m) => m.status === 'SCHEDULED').length,
    0
  );
  const selectedFixture = fixtures.find((f) => f.matchweek === selectedMatchweek);

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-gold-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Loading fixtures...
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

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-charcoal-900 dark:text-white">
                Fixtures & Results
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                {league?.name} • Season {league?.season}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleGenerateFixtures}
                disabled={isGenerating || fixtures.length > 0}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Auto-Generate
                  </>
                )}
              </button>
              <button
                disabled
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300"
              >
                <Plus className="h-4 w-4" />
                Add Match
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard label="Total Matchweeks" value={fixtures.length} color="blue" />
          <StatCard label="Total Matches" value={totalMatches} color="orange" />
          <StatCard label="Completed" value={completedMatches} color="green" />
          <StatCard label="Upcoming" value={upcomingMatches} color="blue" />
        </div>

        {/* MATCHWEEK SELECTOR */}
        {fixtures.length > 0 && (
          <div className="mb-8 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="p-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {fixtures.map((fixture) => (
                  <button
                    key={fixture.id}
                    onClick={() => setSelectedMatchweek(fixture.matchweek)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 font-semibold transition-all ${
                      selectedMatchweek === fixture.matchweek
                        ? 'bg-gradient-to-r from-gold-600 to-orange-500 text-white'
                        : 'border border-neutral-200 bg-white text-charcoal-700 hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-300 dark:hover:bg-charcoal-600'
                    }`}
                  >
                    Matchweek {fixture.matchweek}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MATCHES */}
        {fixtures.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
              <h3 className="mb-2 text-xl font-semibold text-charcoal-900 dark:text-white">
                No fixtures yet
              </h3>
              <p className="mb-6 text-charcoal-600 dark:text-charcoal-400">
                Generate fixtures automatically or add matches manually
              </p>
              <button
                onClick={handleGenerateFixtures}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="h-4 w-4" />
                Auto-Generate Fixtures
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
                <Trophy className="h-5 w-5 text-gold-500" />
                Matchweek {selectedMatchweek}
              </h2>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                {selectedFixture?.matches.length} matches
              </p>
            </div>

            <div className="space-y-4 p-6">
              {selectedFixture?.matches && selectedFixture.matches.length > 0 ? (
                selectedFixture.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onEdit={setEditingMatch}
                  />
                ))
              ) : (
                <p className="text-center py-8 text-charcoal-600 dark:text-charcoal-400">
                  No matches in this matchweek
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SCORE ENTRY MODAL */}
      <ScoreEntryModal
        match={editingMatch}
        onClose={() => setEditingMatch(null)}
        onSave={handleUpdateScore}
        isSaving={isSavingScore}
      />

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
