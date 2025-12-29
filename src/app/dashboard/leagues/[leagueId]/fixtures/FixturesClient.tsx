// =============================================================================
// 🏆 PITCHCONNECT - FIXTURES CLIENT COMPONENT
// =============================================================================
// Interactive client component for fixtures page
// Handles score entry, match editing, fixture generation
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Loader2,
  Clock,
  MapPin,
  Edit,
  Check,
  Zap,
  Trophy,
  X,
  ChevronDown,
  ChevronUp,
  Play,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type CompetitionFormat = 'LEAGUE' | 'KNOCKOUT' | 'GROUP_KNOCKOUT' | 'ROUND_ROBIN';

interface Match {
  id: string;
  homeTeam: { id: string; name: string; logo?: string | null };
  awayTeam: { id: string; name: string; logo?: string | null };
  kickOffTime: Date;
  venue: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  homeScore: number | null;
  awayScore: number | null;
  homeScoreDetails?: Record<string, number> | null;
  awayScoreDetails?: Record<string, number> | null;
  round?: string | null;
  matchweek?: number | null;
  groupName?: string | null;
}

interface Fixture {
  id: string;
  label: string;
  type: 'MATCHWEEK' | 'KNOCKOUT_ROUND' | 'GROUP_ROUND';
  matches: Match[];
}

interface SportConfig {
  label: string;
  icon: string;
  color: string;
  scoreLabel: string;
  detailedScoring: Array<{ key: string; label: string; icon: string }>;
}

interface FixturesClientProps {
  leagueId: string;
  leagueName: string;
  sport: Sport;
  sportConfig: SportConfig;
  format: CompetitionFormat;
  season: string;
  fixtures: Fixture[];
  stats: {
    totalMatches: number;
    completed: number;
    upcoming: number;
    live: number;
  };
  isAdmin: boolean;
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function FixturesClient({
  leagueId,
  leagueName,
  sport,
  sportConfig,
  format,
  season,
  fixtures: initialFixtures,
  stats,
  isAdmin,
}: FixturesClientProps) {
  const [fixtures, setFixtures] = useState(initialFixtures);
  const [selectedFixture, setSelectedFixture] = useState<string | null>(
    fixtures[0]?.id || null
  );
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Generate fixtures based on format
  const handleGenerateFixtures = async () => {
    if (!confirm(`Generate ${format.replace('_', ' ')} fixtures for all teams?`)) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`/api/leagues/${leagueId}/fixtures/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) throw new Error('Failed to generate fixtures');

      const data = await res.json();
      showToast(`Generated ${data.totalMatches} matches`, 'success');
      window.location.reload();
    } catch (error) {
      showToast('Failed to generate fixtures', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save match result
  const handleSaveScore = async (
    matchId: string,
    homeScore: number,
    awayScore: number,
    homeDetails?: Record<string, number>,
    awayDetails?: Record<string, number>
  ) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/leagues/${leagueId}/fixtures/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore,
          awayScore,
          homeScoreDetails: homeDetails,
          awayScoreDetails: awayDetails,
          status: 'FINISHED',
        }),
      });

      if (!res.ok) throw new Error('Failed to update match');

      // Update local state
      setFixtures(prev =>
        prev.map(f => ({
          ...f,
          matches: f.matches.map(m =>
            m.id === matchId
              ? { ...m, homeScore, awayScore, homeScoreDetails: homeDetails, awayScoreDetails: awayDetails, status: 'FINISHED' as const }
              : m
          ),
        }))
      );

      showToast('Match result saved', 'success');
      setEditingMatch(null);
    } catch (error) {
      showToast('Failed to save result', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const currentFixture = fixtures.find(f => f.id === selectedFixture);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/leagues/${leagueId}`}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Fixtures & Results</h1>
            <p className="text-slate-600 dark:text-slate-400">{leagueName} • {season}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-3">
            <button
              onClick={handleGenerateFixtures}
              disabled={isGenerating || fixtures.length > 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              Auto-Generate
            </button>
            <Link
              href={`/dashboard/leagues/${leagueId}/fixtures/create`}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
            >
              <Plus className="w-5 h-5" />
              Add Match
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Matches" value={stats.totalMatches} color="blue" />
        <StatCard label="Completed" value={stats.completed} color="green" />
        <StatCard label="Upcoming" value={stats.upcoming} color="purple" />
        <StatCard label="Live Now" value={stats.live} color="red" highlight={stats.live > 0} />
      </div>

      {/* Fixture Selector */}
      {fixtures.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {fixtures.map(fixture => (
              <button
                key={fixture.id}
                onClick={() => setSelectedFixture(fixture.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedFixture === fixture.id
                    ? `bg-gradient-to-r ${sportConfig.color} text-white`
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {fixture.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Matches */}
      {fixtures.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Fixtures Yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Generate fixtures automatically or add matches manually
          </p>
          {isAdmin && (
            <button
              onClick={handleGenerateFixtures}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl"
            >
              <Zap className="w-5 h-5" />
              Generate {format.replace('_', ' ')} Fixtures
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              {currentFixture?.label}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {currentFixture?.matches.length} matches
            </p>
          </div>

          <div className="p-5 space-y-4">
            {currentFixture?.matches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                sport={sport}
                sportConfig={sportConfig}
                isAdmin={isAdmin}
                onEdit={() => setEditingMatch(match)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Score Entry Modal */}
      {editingMatch && (
        <ScoreEntryModal
          match={editingMatch}
          sport={sport}
          sportConfig={sportConfig}
          onClose={() => setEditingMatch(null)}
          onSave={handleSaveScore}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({ label, value, color, highlight = false }: { 
  label: string; 
  value: number; 
  color: 'blue' | 'green' | 'purple' | 'red';
  highlight?: boolean;
}) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border p-4 ${
      highlight ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700'
    }`}>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
    </div>
  );
}

function MatchCard({
  match,
  sport,
  sportConfig,
  isAdmin,
  onEdit,
}: {
  match: Match;
  sport: Sport;
  sportConfig: SportConfig;
  isAdmin: boolean;
  onEdit: () => void;
}) {
  const statusConfig = {
    SCHEDULED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Scheduled', icon: <Calendar className="w-3 h-3" /> },
    LIVE: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Live', icon: <Play className="w-3 h-3" /> },
    HALFTIME: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Half Time', icon: <Clock className="w-3 h-3" /> },
    FINISHED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Finished', icon: <Check className="w-3 h-3" /> },
    POSTPONED: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-400', label: 'Postponed', icon: <Clock className="w-3 h-3" /> },
    CANCELLED: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-400', label: 'Cancelled', icon: <X className="w-3 h-3" /> },
  };

  const status = statusConfig[match.status];

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Teams & Score */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-slate-900 dark:text-white">{match.homeTeam.name}</span>
            {match.status === 'FINISHED' ? (
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{match.homeScore}</span>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 dark:text-white">{match.awayTeam.name}</span>
            {match.status === 'FINISHED' ? (
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{match.awayScore}</span>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
        </div>

        {/* Match Info */}
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
            {status.icon}
            {status.label}
          </span>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Clock className="w-4 h-4" />
            {new Date(match.kickOffTime).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {match.venue && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="w-4 h-4" />
              {match.venue}
            </div>
          )}
        </div>

        {/* Actions */}
        {isAdmin && match.status !== 'FINISHED' && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-colors"
          >
            <Edit className="w-4 h-4" />
            Enter Result
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreEntryModal({
  match,
  sport,
  sportConfig,
  onClose,
  onSave,
  isSaving,
}: {
  match: Match;
  sport: Sport;
  sportConfig: SportConfig;
  onClose: () => void;
  onSave: (matchId: string, homeScore: number, awayScore: number, homeDetails?: Record<string, number>, awayDetails?: Record<string, number>) => void;
  isSaving: boolean;
}) {
  const [homeScore, setHomeScore] = useState(match.homeScore || 0);
  const [awayScore, setAwayScore] = useState(match.awayScore || 0);
  const [showDetails, setShowDetails] = useState(false);
  const [homeDetails, setHomeDetails] = useState<Record<string, number>>(
    (match.homeScoreDetails as Record<string, number>) || {}
  );
  const [awayDetails, setAwayDetails] = useState<Record<string, number>>(
    (match.awayScoreDetails as Record<string, number>) || {}
  );

  const handleSave = () => {
    onSave(match.id, homeScore, awayScore, showDetails ? homeDetails : undefined, showDetails ? awayDetails : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-lg">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Enter Match Result</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </p>
        </div>

        <div className="p-5 space-y-6">
          {/* Simple Score Entry */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {match.homeTeam.name}
              </label>
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 text-center text-2xl font-bold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {match.awayTeam.name}
              </label>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 text-center text-2xl font-bold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Detailed Scoring Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? 'Hide' : 'Show'} detailed scoring breakdown
          </button>

          {/* Detailed Scoring */}
          {showDetails && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {sportConfig.scoreLabel} Breakdown
              </p>
              
              {/* Home Team Details */}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{match.homeTeam.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  {sportConfig.detailedScoring.map(field => (
                    <div key={field.key} className="flex items-center gap-2">
                      <span className="text-sm">{field.icon}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder={field.label}
                        value={homeDetails[field.key] || ''}
                        onChange={(e) => setHomeDetails(prev => ({ ...prev, [field.key]: parseInt(e.target.value) || 0 }))}
                        className="flex-1 px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Team Details */}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{match.awayTeam.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  {sportConfig.detailedScoring.map(field => (
                    <div key={field.key} className="flex items-center gap-2">
                      <span className="text-sm">{field.icon}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder={field.label}
                        value={awayDetails[field.key] || ''}
                        onChange={(e) => setAwayDetails(prev => ({ ...prev, [field.key]: parseInt(e.target.value) || 0 }))}
                        className="flex-1 px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Result
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}