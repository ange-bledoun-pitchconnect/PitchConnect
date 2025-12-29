// =============================================================================
// 🏆 PITCHCONNECT - LIVE DASHBOARD CLIENT COMPONENT
// =============================================================================
// Interactive client component with real-time updates
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Clock,
  Calendar,
  MapPin,
  Filter,
  ChevronDown,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type MatchStatus = 
  | 'SCHEDULED' | 'WARMUP' | 'LIVE' | 'HALFTIME' | 'SECOND_HALF'
  | 'EXTRA_TIME_FIRST' | 'EXTRA_TIME_SECOND' | 'PENALTIES'
  | 'FINISHED' | 'CANCELLED' | 'POSTPONED' | 'ABANDONED';

type LeagueVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED' | 'INVITE_ONLY' | 'FRIENDS_ONLY';

interface LeagueOption {
  id: string;
  name: string;
  sport: Sport;
  season: number;
  visibility: LeagueVisibility;
  status: string;
  clubName: string;
}

interface StandingEntry {
  position: number;
  teamId: string | null;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null;
}

interface LiveMatch {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  kickOffTime: string;
  venue: string | null;
}

interface SportConfig {
  label: string;
  icon: string;
  color: string;
  scoringLabel: string;
  scoringLabelPlural: string;
  differenceLabel: string;
  standingsColumns: {
    for: string;
    against: string;
    difference: string;
  };
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface LiveDashboardClientProps {
  leagues: LeagueOption[];
  sportConfig: Record<Sport, SportConfig>;
  isAuthenticated: boolean;
}

// =============================================================================
// MATCH STATUS HELPERS
// =============================================================================

const LIVE_STATUSES: MatchStatus[] = ['WARMUP', 'LIVE', 'HALFTIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND', 'PENALTIES'];

const getStatusDisplay = (status: MatchStatus): { label: string; color: string; isLive: boolean } => {
  const statusMap: Record<MatchStatus, { label: string; color: string; isLive: boolean }> = {
    SCHEDULED: { label: 'Scheduled', color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400', isLive: false },
    WARMUP: { label: 'Warm Up', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', isLive: true },
    LIVE: { label: 'LIVE', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', isLive: true },
    HALFTIME: { label: 'HT', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', isLive: true },
    SECOND_HALF: { label: '2nd Half', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', isLive: true },
    EXTRA_TIME_FIRST: { label: 'ET 1st', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', isLive: true },
    EXTRA_TIME_SECOND: { label: 'ET 2nd', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', isLive: true },
    PENALTIES: { label: 'Pens', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400', isLive: true },
    FINISHED: { label: 'FT', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', isLive: false },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', isLive: false },
    POSTPONED: { label: 'Postponed', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', isLive: false },
    ABANDONED: { label: 'Abandoned', color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400', isLive: false },
  };
  return statusMap[status] || statusMap.SCHEDULED;
};

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function LiveDashboardClient({
  leagues,
  sportConfig,
  isAuthenticated,
}: LiveDashboardClientProps) {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'standings' | 'matches'>('standings');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sportFilter, setSportFilter] = useState<Sport | 'ALL'>('ALL');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Filter leagues by sport
  const filteredLeagues = useMemo(() => {
    if (sportFilter === 'ALL') return leagues;
    return leagues.filter(l => l.sport === sportFilter);
  }, [leagues, sportFilter]);

  // Get selected league
  const selectedLeague = useMemo(() => {
    return leagues.find(l => l.id === selectedLeagueId);
  }, [leagues, selectedLeagueId]);

  // Get sport config for selected league
  const currentSportConfig = useMemo(() => {
    if (!selectedLeague) return null;
    return sportConfig[selectedLeague.sport];
  }, [selectedLeague, sportConfig]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const fetchLeagueData = useCallback(async () => {
    if (!selectedLeagueId) return;

    setIsLoadingData(true);
    try {
      // Fetch standings
      const standingsRes = await fetch(`/api/leagues/${selectedLeagueId}/standings`);
      if (standingsRes.ok) {
        const data = await standingsRes.json();
        setStandings(data.standings || []);
      }

      // Fetch matches
      const matchesRes = await fetch(`/api/leagues/${selectedLeagueId}/matches?limit=20`);
      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Error fetching league data:', error);
      showToast('Failed to load league data', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedLeagueId, showToast]);

  // Initial fetch and auto-select first league
  useEffect(() => {
    if (filteredLeagues.length > 0 && !selectedLeagueId) {
      setSelectedLeagueId(filteredLeagues[0].id);
    }
  }, [filteredLeagues, selectedLeagueId]);

  // Fetch data when league changes
  useEffect(() => {
    fetchLeagueData();
  }, [fetchLeagueData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !selectedLeagueId) return;
    const interval = setInterval(fetchLeagueData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedLeagueId, fetchLeagueData]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleManualRefresh = () => {
    showToast('Refreshing data...', 'info');
    fetchLeagueData();
  };

  // Count live matches
  const liveMatchCount = matches.filter(m => LIVE_STATUSES.includes(m.status)).length;

  // Get unique sports from leagues
  const availableSports = useMemo(() => {
    return [...new Set(leagues.map(l => l.sport))];
  }, [leagues]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/10 to-orange-50/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Container */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
                  : toast.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400'
              }`}
            >
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)}><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white lg:text-4xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              Live Dashboard
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Real-time league standings and match updates
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={isLoadingData || !selectedLeagueId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold transition-colors disabled:opacity-50"
            >
              {isLoadingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>

            {liveMatchCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-semibold">
                <Activity className="w-3 h-3 animate-pulse" />
                {liveMatchCount} LIVE
              </span>
            )}

            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto Refresh</span>
            </label>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* Sport Filter */}
          {availableSports.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                Sport
              </label>
              <select
                value={sportFilter}
                onChange={(e) => {
                  setSportFilter(e.target.value as Sport | 'ALL');
                  setSelectedLeagueId('');
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
              >
                <option value="ALL">All Sports</option>
                {availableSports.map(sport => (
                  <option key={sport} value={sport}>
                    {sportConfig[sport].icon} {sportConfig[sport].label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* League Selector */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
              Select League
            </label>
            <select
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
            >
              <option value="">Choose a league...</option>
              {filteredLeagues.map(league => (
                <option key={league.id} value={league.id}>
                  {sportConfig[league.sport].icon} {league.name} • {league.clubName} • Season {league.season}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        {selectedLeague && currentSportConfig ? (
          <div className="space-y-6">
            {/* League Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${currentSportConfig.color}`} />
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentSportConfig.color} flex items-center justify-center shadow-lg`}>
                    <span className="text-3xl">{currentSportConfig.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedLeague.name}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {currentSportConfig.label} • {selectedLeague.clubName} • Season {selectedLeague.season}/{selectedLeague.season + 1}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('standings')}
                className={`px-4 py-3 font-semibold transition-colors ${
                  activeTab === 'standings'
                    ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Standings
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-4 py-3 font-semibold transition-colors ${
                  activeTab === 'matches'
                    ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Matches
                {liveMatchCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {liveMatchCount}
                  </span>
                )}
              </button>
            </div>

            {/* Standings Tab */}
            {activeTab === 'standings' && (
              <StandingsTable
                standings={standings}
                isLoading={isLoadingData}
                sportConfig={currentSportConfig}
              />
            )}

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <MatchesList
                matches={matches}
                isLoading={isLoadingData}
                sportConfig={currentSportConfig}
              />
            )}
          </div>
        ) : (
          <EmptyState
            isAuthenticated={isAuthenticated}
            hasLeagues={leagues.length > 0}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StandingsTable({
  standings,
  isLoading,
  sportConfig,
}: {
  standings: StandingEntry[];
  isLoading: boolean;
  sportConfig: SportConfig;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No standings available</h3>
        <p className="text-slate-600 dark:text-slate-400">Standings will appear once matches have been played</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Team</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">P</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">W</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">D</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">L</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{sportConfig.standingsColumns.for}</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{sportConfig.standingsColumns.against}</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{sportConfig.standingsColumns.difference}</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Form</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {standings.map((entry) => (
              <tr key={entry.teamId || entry.position} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{entry.position}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{entry.teamName}</td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{entry.played}</td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{entry.wins}</td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{entry.draws}</td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{entry.losses}</td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{entry.goalsFor}</td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{entry.goalsAgainst}</td>
                <td className={`px-4 py-3 text-center font-semibold ${
                  entry.goalDifference > 0 ? 'text-green-600 dark:text-green-400' :
                  entry.goalDifference < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                </td>
                <td className="px-4 py-3 text-center">
                  {entry.form && (
                    <div className="flex gap-0.5 justify-center">
                      {entry.form.split('').slice(-5).map((result, idx) => (
                        <span
                          key={idx}
                          className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${
                            result === 'W' ? 'bg-green-500 text-white' :
                            result === 'D' ? 'bg-amber-500 text-white' :
                            result === 'L' ? 'bg-red-500 text-white' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400 text-lg">{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchesList({
  matches,
  isLoading,
  sportConfig,
}: {
  matches: LiveMatch[];
  isLoading: boolean;
  sportConfig: SportConfig;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No matches available</h3>
        <p className="text-slate-600 dark:text-slate-400">Matches will appear once they are scheduled</p>
      </div>
    );
  }

  // Group matches by status
  const liveMatches = matches.filter(m => LIVE_STATUSES.includes(m.status));
  const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED');
  const completedMatches = matches.filter(m => m.status === 'FINISHED');

  return (
    <div className="space-y-6">
      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500 animate-pulse" />
            Live Now
          </h3>
          <div className="space-y-3">
            {liveMatches.map(match => (
              <MatchCard key={match.id} match={match} sportConfig={sportConfig} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Upcoming
          </h3>
          <div className="space-y-3">
            {upcomingMatches.map(match => (
              <MatchCard key={match.id} match={match} sportConfig={sportConfig} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Completed
          </h3>
          <div className="space-y-3">
            {completedMatches.map(match => (
              <MatchCard key={match.id} match={match} sportConfig={sportConfig} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, sportConfig }: { match: LiveMatch; sportConfig: SportConfig }) {
  const statusDisplay = getStatusDisplay(match.status);
  const kickOffDate = new Date(match.kickOffTime);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm p-4 transition-all hover:shadow-md ${
      statusDisplay.isLive ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'
    }`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex-1 text-center md:text-right">
          <p className="font-semibold text-slate-900 dark:text-white">{match.homeTeamName}</p>
          {(match.status === 'FINISHED' || statusDisplay.isLive) && match.homeScore !== null && (
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{match.homeScore}</p>
          )}
        </div>

        {/* Match Info */}
        <div className="flex flex-col items-center gap-2 px-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusDisplay.color}`}>
            {statusDisplay.isLive && <Activity className="w-3 h-3 inline mr-1 animate-pulse" />}
            {statusDisplay.label}
          </span>
          {match.status === 'SCHEDULED' && (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {kickOffDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {match.venue && (
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {match.venue}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center md:text-left">
          <p className="font-semibold text-slate-900 dark:text-white">{match.awayTeamName}</p>
          {(match.status === 'FINISHED' || statusDisplay.isLive) && match.awayScore !== null && (
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{match.awayScore}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ isAuthenticated, hasLeagues }: { isAuthenticated: boolean; hasLeagues: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
      <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {!hasLeagues ? 'No leagues available' : 'Select a league to get started'}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        {!isAuthenticated
          ? 'Sign in to see private leagues you have access to'
          : hasLeagues
            ? 'Choose a league from the dropdown above to view live standings and matches'
            : 'There are no active leagues at the moment'
        }
      </p>
      {!isAuthenticated && (
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-colors"
        >
          Sign In
        </Link>
      )}
    </div>
  );
}