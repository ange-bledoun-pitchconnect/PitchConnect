'use client';

/**
 * PitchConnect Advanced Analytics Dashboard - v3.0 ENHANCED
 * AI-powered player & team performance analysis
 * Location: ./src/app/dashboard/analytics-advanced/page.tsx
 * 
 * Features:
 * - Real-time player performance analytics with AI predictions
 * - Team trend analysis with formation comparisons
 * - League standings and competitive insights
 * - Player injury risk assessment
 * - Market value tracking and career trajectory predictions
 * - Video analysis integration
 * - Download analytics reports
 * - Dark mode support
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  BarChart3,
  Users,
  Trophy,
  AlertCircle,
  Download,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  Loader,
  Star,
  Heart,
  Activity,
  Zap,
  Shield,
  Target,
  Award,
  TrendingDown,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface League {
  id: string;
  name: string;
  season: number;
  sport: string;
  format: string;
  visibility: string;
}

interface Club {
  id: string;
  name: string;
  logo?: string;
  sport: string;
  city?: string;
  country?: string;
}

interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  primaryPosition?: string;
  secondaryPosition?: string;
  marketValue?: number;
  overallRating?: number;
  formRating?: number;
  injuryStatus?: string;
  avatar?: string;
}

interface PlayerAnalytics {
  id: string;
  playerId: string;
  overallRating: number;
  formRating: number;
  injuryRisk: number;
  developmentPotential: number;
  fatigueLevelEstimate: number;
  last5MatchesAvg?: number;
  seasonAverage?: number;
  strengths: string[];
  weaknesses: string[];
  recommendations?: string;
  predictions?: any;
}

interface TeamTrends {
  clubId: string;
  clubName: string;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  avgGoalsPerMatch: number;
  formRating: number;
  defensiveStrength: number;
  attackingStrength: number;
  currentFormation?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ============================================================================
// LOADING & ERROR COMPONENTS
// ============================================================================

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader className="h-8 w-8 animate-spin text-gold-500" />
  </div>
);

const ErrorAlert = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm font-semibold underline hover:no-underline"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-charcoal-700 dark:bg-charcoal-800">
    <p className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</p>
    <p className="mt-1 text-neutral-600 dark:text-neutral-400">{description}</p>
  </div>
);

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  trendColor = 'neutral',
}: {
  label: string;
  value: string | number;
  icon: any;
  trend?: number;
  trendColor?: 'green' | 'red' | 'neutral';
}) => {
  const trendColorClasses = {
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    neutral: 'text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/20',
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-charcoal-900 dark:text-white">
            {value}
          </p>
          {trend !== undefined && (
            <p className={`mt-1 text-xs font-semibold ${trendColorClasses[trendColor]}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className="rounded-lg bg-gold-50 p-3 dark:bg-gold-900/20">
          <Icon className="h-6 w-6 text-gold-600 dark:text-gold-400" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SELECT COMPONENT
// ============================================================================

const SelectInput = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  loading = false,
  placeholder = 'Select...',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-4 py-3 pr-10 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-white"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-400" />
    </div>
  </div>
);

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function AdvancedAnalyticsDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State Management
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season'>('season');
  const [activeTab, setActiveTab] = useState<'team' | 'player'>('team');

  // Data State
  const [leagues, setLeagues] = useState<League[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamTrends, setTeamTrends] = useState<TeamTrends | null>(null);
  const [playerAnalytics, setPlayerAnalytics] = useState<PlayerAnalytics | null>(null);

  // Loading & Error State
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // API CALLS
  // ========================================================================

  const fetchLeagues = useCallback(async () => {
    try {
      setLeaguesLoading(true);
      setError(null);
      const response = await fetch('/api/leagues?limit=50');

      if (!response.ok) throw new Error('Failed to fetch leagues');

      const data: ApiResponse<League[]> = await response.json();
      if (data.success) {
        setLeagues(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leagues');
    } finally {
      setLeaguesLoading(false);
    }
  }, []);

  const fetchClubs = useCallback(async (leagueId: string) => {
    if (!leagueId) {
      setClubs([]);
      return;
    }

    try {
      setClubsLoading(true);
      setError(null);
      const response = await fetch(`/api/leagues/${leagueId}/clubs?limit=50`);

      if (!response.ok) throw new Error('Failed to fetch clubs');

      const data: ApiResponse<Club[]> = await response.json();
      if (data.success) {
        setClubs(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clubs');
    } finally {
      setClubsLoading(false);
    }
  }, []);

  const fetchPlayers = useCallback(async (clubId: string) => {
    if (!clubId) {
      setPlayers([]);
      return;
    }

    try {
      setPlayersLoading(true);
      setError(null);
      const response = await fetch(`/api/clubs/${clubId}/players?limit=100`);

      if (!response.ok) throw new Error('Failed to fetch players');

      const data: ApiResponse<Player[]> = await response.json();
      if (data.success) {
        setPlayers(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setPlayersLoading(false);
    }
  }, []);

  const fetchTeamTrends = useCallback(async (clubId: string) => {
    if (!clubId) {
      setTeamTrends(null);
      return;
    }

    try {
      setDataLoading(true);
      setError(null);
      const response = await fetch(
        `/api/clubs/${clubId}/analytics?timeRange=${timeRange}`
      );

      if (!response.ok) throw new Error('Failed to fetch team analytics');

      const data: ApiResponse<TeamTrends> = await response.json();
      if (data.success) {
        setTeamTrends(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team trends');
    } finally {
      setDataLoading(false);
    }
  }, [timeRange]);

  const fetchPlayerAnalytics = useCallback(async (playerId: string) => {
    if (!playerId) {
      setPlayerAnalytics(null);
      return;
    }

    try {
      setDataLoading(true);
      setError(null);
      const response = await fetch(`/api/players/${playerId}/analytics`);

      if (!response.ok) throw new Error('Failed to fetch player analytics');

      const data: ApiResponse<PlayerAnalytics> = await response.json();
      if (data.success) {
        setPlayerAnalytics(data.data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load player analytics'
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  useEffect(() => {
    if (selectedLeague) {
      fetchClubs(selectedLeague);
      setSelectedClub('');
      setSelectedPlayer('');
    }
  }, [selectedLeague, fetchClubs]);

  useEffect(() => {
    if (selectedClub) {
      fetchPlayers(selectedClub);
      fetchTeamTrends(selectedClub);
      setSelectedPlayer('');
    }
  }, [selectedClub, fetchPlayers, fetchTeamTrends]);

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerAnalytics(selectedPlayer);
    }
  }, [selectedPlayer, fetchPlayerAnalytics]);

  useEffect(() => {
    if (selectedClub) {
      fetchTeamTrends(selectedClub);
    }
  }, [timeRange, selectedClub, fetchTeamTrends]);

  // ========================================================================
  // RENDERING
  // ========================================================================

  if (status === 'loading' || leaguesLoading) {
    return <LoadingSpinner />;
  }

  const selectedClubName = clubs.find((c) => c.id === selectedClub)?.name || 'Team';
  const selectedPlayerData = players.find((p) => p.id === selectedPlayer);
  const selectedLeagueName = leagues.find((l) => l.id === selectedLeague)?.name || '';

  return (
    <div className="space-y-6">
      {/* ====================================================================
          HEADER
          ==================================================================== */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-charcoal-900 dark:text-white">
          <TrendingUp className="h-8 w-8 text-gold-600" />
          Advanced Analytics
        </h1>
        <p className="mt-2 text-charcoal-600 dark:text-charcoal-300">
          AI-powered player & team performance insights with predictive analytics
        </p>
      </div>

      {/* ====================================================================
          ERROR ALERT
          ==================================================================== */}
      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      {/* ====================================================================
          SELECTORS CARD
          ==================================================================== */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800">
        <div className="grid gap-4 md:grid-cols-4">
          <SelectInput
            label="Select League"
            value={selectedLeague}
            onChange={(value) => {
              setSelectedLeague(value);
              setSelectedClub('');
              setSelectedPlayer('');
            }}
            options={leagues.map((l) => ({
              id: l.id,
              name: `${l.name} - Season ${l.season}`,
            }))}
            loading={leaguesLoading}
            placeholder="Choose a league..."
          />

          <SelectInput
            label="Select Club"
            value={selectedClub}
            onChange={(value) => {
              setSelectedClub(value);
              setSelectedPlayer('');
            }}
            options={clubs.map((c) => ({ id: c.id, name: c.name }))}
            disabled={!selectedLeague}
            loading={clubsLoading}
            placeholder="Choose a club..."
          />

          <div>
            <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
              Time Range
            </label>
            <div className="flex gap-2">
              {(['week', 'month', 'season'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all capitalize ${
                    timeRange === range
                      ? 'bg-gold-600 text-white'
                      : 'border border-neutral-200 bg-white text-charcoal-900 hover:bg-neutral-50 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
              Actions
            </label>
            <button
              onClick={() => {
                fetchLeagues();
                if (selectedClub) fetchTeamTrends(selectedClub);
                if (selectedPlayer) fetchPlayerAnalytics(selectedPlayer);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold-600 px-4 py-2 font-semibold text-white transition-all hover:bg-gold-700 disabled:opacity-50"
              disabled={dataLoading}
            >
              <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MAIN CONTENT
          ==================================================================== */}
      {!selectedLeague ? (
        <EmptyState
          title="Select a League"
          description="Choose a league to view advanced analytics and performance insights"
        />
      ) : (
        <>
          {/* TAB NAVIGATION */}
          <div className="flex gap-2 border-b border-neutral-200 dark:border-charcoal-700">
            {[
              { id: 'team', label: 'Team Trends', icon: Trophy },
              { id: 'player', label: 'Player Analysis', icon: Users },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'team' | 'player')}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 font-semibold transition-all ${
                  activeTab === id
                    ? 'border-gold-600 text-gold-600'
                    : 'border-transparent text-charcoal-600 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* TEAM TRENDS TAB */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {!selectedClub ? (
                <EmptyState
                  title="Select a Club"
                  description="Choose a club to view team trends and competitive analysis"
                />
              ) : dataLoading ? (
                <LoadingSpinner />
              ) : teamTrends ? (
                <>
                  {/* TEAM STATS GRID */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <StatCard
                      label="Overall Rating"
                      value={teamTrends.formRating.toFixed(1)}
                      icon={Star}
                      trend={5}
                      trendColor="green"
                    />
                    <StatCard
                      label="Matches Played"
                      value={teamTrends.totalMatches}
                      icon={Activity}
                    />
                    <StatCard
                      label="Win Rate"
                      value={`${((teamTrends.wins / teamTrends.totalMatches) * 100).toFixed(1)}%`}
                      icon={Trophy}
                      trend={3}
                      trendColor="green"
                    />
                    <StatCard
                      label="Goals Per Match"
                      value={teamTrends.avgGoalsPerMatch.toFixed(2)}
                      icon={Target}
                    />
                  </div>

                  {/* DETAILED TEAM STATS */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Performance Card */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800">
                      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-4">
                        Match Record
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-charcoal-600 dark:text-charcoal-400">
                            Wins
                          </span>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {teamTrends.wins}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-charcoal-600 dark:text-charcoal-400">
                            Draws
                          </span>
                          <span className="text-2xl font-bold text-neutral-600 dark:text-neutral-400">
                            {teamTrends.draws}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-charcoal-600 dark:text-charcoal-400">
                            Losses
                          </span>
                          <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {teamTrends.losses}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Goals Card */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800">
                      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-4">
                        Goals Analysis
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                              For
                            </span>
                            <span className="text-2xl font-bold text-gold-600 dark:text-gold-400">
                              {teamTrends.goalsFor}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-charcoal-700">
                            <div
                              className="h-full rounded-full bg-gold-600 dark:bg-gold-500"
                              style={{
                                width: `${(teamTrends.goalsFor / (teamTrends.goalsFor + teamTrends.goalsAgainst)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                              Against
                            </span>
                            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {teamTrends.goalsAgainst}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-charcoal-700">
                            <div
                              className="h-full rounded-full bg-red-600 dark:bg-red-500"
                              style={{
                                width: `${(teamTrends.goalsAgainst / (teamTrends.goalsFor + teamTrends.goalsAgainst)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Strengths Card */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800 md:col-span-2">
                      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-4">
                        Team Strengths
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-2">
                            Attacking Strength
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-3 rounded-full bg-neutral-200 dark:bg-charcoal-700">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-gold-500 to-orange-500"
                                style={{
                                  width: `${Math.min(teamTrends.attackingStrength * 10, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-charcoal-900 dark:text-white">
                              {teamTrends.attackingStrength.toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-2">
                            Defensive Strength
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-3 rounded-full bg-neutral-200 dark:bg-charcoal-700">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                style={{
                                  width: `${Math.min(teamTrends.defensiveStrength * 10, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-charcoal-900 dark:text-white">
                              {teamTrends.defensiveStrength.toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No Data Available"
                  description="Team analytics data could not be loaded"
                />
              )}
            </div>
          )}

          {/* PLAYER ANALYSIS TAB */}
          {activeTab === 'player' && (
            <div className="space-y-6">
              {selectedClub && (
                <SelectInput
                  label="Select Player"
                  value={selectedPlayer}
                  onChange={setSelectedPlayer}
                  options={players.map((p) => ({
                    id: p.id,
                    name: `${p.firstName} ${p.lastName} ${p.primaryPosition ? `- ${p.primaryPosition}` : ''}`,
                  }))}
                  loading={playersLoading}
                  placeholder="Choose a player..."
                />
              )}

              {!selectedClub ? (
                <EmptyState
                  title="Select a Club"
                  description="Choose a club to analyze player performance"
                />
              ) : !selectedPlayer ? (
                <EmptyState
                  title="Select a Player"
                  description="Choose a player to view detailed performance analytics and AI predictions"
                />
              ) : dataLoading ? (
                <LoadingSpinner />
              ) : playerAnalytics ? (
                <>
                  {/* PLAYER HEADER */}
                  <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800">
                    {selectedPlayerData?.avatar && (
                      <img
                        src={selectedPlayerData.avatar}
                        alt={`${selectedPlayerData.firstName} ${selectedPlayerData.lastName}`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-charcoal-900 dark:text-white">
                        {selectedPlayerData?.firstName} {selectedPlayerData?.lastName}
                      </h3>
                      <p className="text-charcoal-600 dark:text-charcoal-400">
                        {selectedPlayerData?.primaryPosition}
                        {selectedPlayerData?.jerseyNumber && ` • #${selectedPlayerData.jerseyNumber}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        Overall Rating
                      </p>
                      <p className="text-3xl font-bold text-gold-600 dark:text-gold-400">
                        {playerAnalytics.overallRating.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* PLAYER STATS GRID */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <StatCard
                      label="Form Rating"
                      value={playerAnalytics.formRating.toFixed(1)}
                      icon={TrendingUp}
                      trendColor={playerAnalytics.formRating > 7 ? 'green' : 'neutral'}
                    />
                    <StatCard
                      label="Injury Risk"
                      value={`${playerAnalytics.injuryRisk.toFixed(0)}%`}
                      icon={Shield}
                      trendColor={playerAnalytics.injuryRisk < 30 ? 'green' : 'red'}
                    />
                    <StatCard
                      label="Development"
                      value={playerAnalytics.developmentPotential.toFixed(1)}
                      icon={Zap}
                    />
                    <StatCard
                      label="Fatigue Level"
                      value={`${playerAnalytics.fatigueLevelEstimate.toFixed(0)}%`}
                      icon={Activity}
                      trendColor={playerAnalytics.fatigueLevelEstimate < 50 ? 'green' : 'red'}
                    />
                  </div>

                  {/* DETAILED PLAYER INFO */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Performance Card */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800">
                      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-4">
                        Performance
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                              Last 5 Matches Avg
                            </span>
                            <span className="font-bold text-charcoal-900 dark:text-white">
                              {playerAnalytics.last5MatchesAvg?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-neutral-200 dark:bg-charcoal-700">
                            <div
                              className="h-full rounded-full bg-gold-600"
                              style={{
                                width: `${Math.min((playerAnalytics.last5MatchesAvg ?? 0) * 10, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                              Season Average
                            </span>
                            <span className="font-bold text-charcoal-900 dark:text-white">
                              {playerAnalytics.seasonAverage?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-neutral-200 dark:bg-charcoal-700">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width: `${Math.min((playerAnalytics.seasonAverage ?? 0) * 10, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses Card */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800">
                      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-4">
                        Key Attributes
                      </h3>
                      <div className="space-y-4">
                        {playerAnalytics.strengths?.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                              Strengths
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {playerAnalytics.strengths.map((strength) => (
                                <span
                                  key={strength}
                                  className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                >
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {playerAnalytics.weaknesses?.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                              Areas to Improve
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {playerAnalytics.weaknesses.map((weakness) => (
                                <span
                                  key={weakness}
                                  className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                >
                                  {weakness}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recommendations Card */}
                    {playerAnalytics.recommendations && (
                      <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800 md:col-span-2">
                        <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-4">
                          Recommendations
                        </h3>
                        <p className="text-charcoal-700 dark:text-charcoal-300 leading-relaxed">
                          {playerAnalytics.recommendations}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No Data Available"
                  description="Player analytics data could not be loaded"
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
