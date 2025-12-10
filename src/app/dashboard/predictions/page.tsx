// ============================================================================
// PHASE 10: src/app/dashboard/predictions/page.tsx
// Advanced Predictions & Analytics Dashboard - CHAMPIONSHIP QUALITY
//
// Features:
// - Player performance predictions (form 1-10, xG, xA)
// - Match outcome forecasts with confidence levels
// - Injury risk tracking and monitoring
// - Advanced filtering & search
// - CSV export functionality
// - Real-time data with intelligent caching
// - Dark mode support
// - Mobile-responsive design
// - Accessibility-first approach
//
// ============================================================================

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Download,
  Activity,
  Heart,
  Target,
  Zap,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/dashboard/DataTable';
import { LoadingState, SkeletonCard } from '@/components/dashboard/LoadingState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/dashboard/ErrorState';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerPrediction {
  id: string;
  name: string;
  position: string;
  team: string;
  formScore: number; // 1-10
  expectedGoals: number;
  expectedAssists: number;
  injuryRisk: number; // 0-100
  confidence: number; // 0-100
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
}

interface MatchForecast {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  homeWinProbability: number; // 0-100
  drawProbability: number;
  awayWinProbability: number;
  expectedGoals: number;
  confidence: number;
  modelAccuracy: number;
}

interface PredictionMetrics {
  totalPredictions: number;
  modelAccuracy: number;
  recentAccuracy: number;
  injuryAlerts: number;
  highFormPlayers: number;
}

interface PredictionsData {
  predictions: PlayerPrediction[];
  matches: MatchForecast[];
  metrics: PredictionMetrics;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const generateMockPredictions = (): PlayerPrediction[] => {
  const teams = ['Arsenal FC', 'Manchester City', 'Chelsea', 'Liverpool'];
  const positions = ['ST', 'CAM', 'CM', 'LW', 'RW', 'CB', 'LB', 'RB', 'GK'];
  const players = [
    'Bukayo Saka',
    'Kai Havertz',
    'Gabriel Martinelli',
    'Martin Odegaard',
    'Erling Haaland',
    'Rodri',
    'Phil Foden',
    'Kevin De Bruyne',
    'Cole Palmer',
    'Nicolas Jackson',
  ];

  return players.map((name, i) => ({
    id: `player-${i + 1}`,
    name,
    position: positions[i % positions.length],
    team: teams[i % teams.length],
    formScore: Math.round(Math.random() * 4 + 6),
    expectedGoals: parseFloat((Math.random() * 0.8 + 0.2).toFixed(2)),
    expectedAssists: parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)),
    injuryRisk: Math.round(Math.random() * 30),
    confidence: Math.round(Math.random() * 40 + 60),
    lastUpdated: new Date().toISOString(),
    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as
      | 'up'
      | 'down'
      | 'stable',
  }));
};

const generateMockMatches = (): MatchForecast[] => {
  const fixtures = [
    { home: 'Arsenal FC', away: 'Manchester City' },
    { home: 'Chelsea', away: 'Liverpool' },
    { home: 'Manchester United', away: 'Tottenham' },
    { home: 'Brighton', away: 'Newcastle' },
  ];

  return fixtures.map((fixture, i) => {
    const homeWinProb = Math.round(Math.random() * 40 + 20);
    const awayWinProb = Math.round(Math.random() * 40 + 20);
    const drawProb = 100 - homeWinProb - awayWinProb;

    return {
      id: `match-${i + 1}`,
      homeTeam: fixture.home,
      awayTeam: fixture.away,
      matchDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      homeWinProbability: homeWinProb,
      drawProbability: drawProb,
      awayWinProbability: awayWinProb,
      expectedGoals: parseFloat((Math.random() * 3 + 1.5).toFixed(2)),
      confidence: Math.round(Math.random() * 30 + 70),
      modelAccuracy: Math.round(Math.random() * 15 + 72),
    };
  });
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function PredictionsDashboard() {
  // State Management
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [minFormScore, setMinFormScore] = useState<number>(0);
  const [maxInjuryRisk, setMaxInjuryRisk] = useState<number>(100);
  const [sortBy, setSortBy] = useState<'formScore' | 'injuryRisk' | 'confidence'>('formScore');
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Data Fetching
  const { data: apiData, loading, error, refetch } = useFetch<PredictionsData>(
    `/api/dashboard/predictions?team=${selectedTeam}&position=${selectedPosition}`,
    { cache: 10 * 60 * 1000 }
  );

  // Mock Data
  const mockData: PredictionsData = useMemo(
    () => ({
      predictions: generateMockPredictions(),
      matches: generateMockMatches(),
      metrics: {
        totalPredictions: 10,
        modelAccuracy: 78,
        recentAccuracy: 82,
        injuryAlerts: 3,
        highFormPlayers: 6,
      },
    }),
    []
  );

  const displayData = apiData || mockData;

  // Filtering Logic - Memoized
  const filteredPredictions = useMemo(() => {
    return displayData.predictions
      .filter((player) => {
        if (selectedTeam && player.team !== selectedTeam) return false;
        if (selectedPosition && player.position !== selectedPosition) return false;
        if (player.formScore < minFormScore) return false;
        if (player.injuryRisk > maxInjuryRisk) return false;
        if (
          debouncedSearch &&
          !player.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'formScore':
            return b.formScore - a.formScore;
          case 'injuryRisk':
            return a.injuryRisk - b.injuryRisk;
          case 'confidence':
            return b.confidence - a.confidence;
          default:
            return 0;
        }
      });
  }, [
    displayData.predictions,
    selectedTeam,
    selectedPosition,
    minFormScore,
    maxInjuryRisk,
    debouncedSearch,
    sortBy,
  ]);

  // Handlers
  const handleExportCSV = useCallback(() => {
    const headers = [
      'Player Name',
      'Position',
      'Team',
      'Form Score',
      'xG',
      'xA',
      'Injury Risk',
      'Confidence',
      'Last Updated',
    ];

    const rows = filteredPredictions.map((p) => [
      p.name,
      p.position,
      p.team,
      p.formScore,
      p.expectedGoals,
      p.expectedAssists,
      p.injuryRisk,
      p.confidence,
      new Date(p.lastUpdated).toLocaleDateString(),
    ]);

    const csv =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n') + '\n';

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [filteredPredictions]);

  const clearFilters = useCallback(() => {
    setSelectedTeam('');
    setSearchQuery('');
    setSelectedPosition('');
    setMinFormScore(0);
    setMaxInjuryRisk(100);
  }, []);

  // Error State
  if (error && !apiData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Player Predictions
          </h1>
        </div>
        <ErrorState
          title="Failed to load predictions"
          message={error.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  const injuryAlertPlayers = filteredPredictions.filter((p) => p.injuryRisk > 60);

  // Main Render
  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Player Predictions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered performance forecasts & injury risk monitoring
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading || filteredPredictions.length === 0}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* KPI CARDS */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            label="Total Predictions"
            value={displayData.metrics.totalPredictions}
            icon={<Target className="w-5 h-5 text-blue-500" />}
            backgroundColor="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
            loading={loading}
          />
          <KPICard
            label="Model Accuracy"
            value={displayData.metrics.modelAccuracy}
            unit="%"
            icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            backgroundColor="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
            loading={loading}
            trend={{ value: 4, direction: 'up' }}
          />
          <KPICard
            label="Recent Accuracy"
            value={displayData.metrics.recentAccuracy}
            unit="%"
            icon={<Activity className="w-5 h-5 text-purple-500" />}
            backgroundColor="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
            loading={loading}
          />
          <KPICard
            label="Injury Alerts"
            value={displayData.metrics.injuryAlerts}
            icon={<Heart className="w-5 h-5 text-red-500" />}
            backgroundColor="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20"
            loading={loading}
            trend={{ value: 2, direction: 'up' }}
          />
          <KPICard
            label="High Form Players"
            value={displayData.metrics.highFormPlayers}
            icon={<Zap className="w-5 h-5 text-yellow-500" />}
            backgroundColor="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20"
            loading={loading}
          />
        </div>
      </div>

      {/* MATCH FORECASTS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Match Forecasts
          </h2>
        </div>

        {loading && !apiData ? (
          <SkeletonCard />
        ) : displayData.matches.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayData.matches.map((match) => (
              <div
                key={match.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedMatch(expandedMatch === match.id ? null : match.id)
                  }
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {match.homeTeam} vs {match.awayTeam}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(match.matchDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex gap-2">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {match.homeWinProbability}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Home
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {match.drawProbability}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Draw
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {match.awayWinProbability}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Away
                          </p>
                        </div>
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedMatch === match.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {expandedMatch === match.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Expected Goals
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {match.expectedGoals}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Model Confidence
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {match.confidence}%
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Model Accuracy
                      </p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${match.modelAccuracy}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {match.modelAccuracy}% accuracy
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12">
            <EmptyState
              title="No matches found"
              message="No upcoming matches to forecast."
            />
          </div>
        )}
      </div>

      {/* FILTERS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
          {(selectedTeam ||
            searchQuery ||
            selectedPosition ||
            minFormScore > 0 ||
            maxInjuryRisk < 100) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Player Name
            </label>
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Teams</option>
              <option value="Arsenal FC">Arsenal FC</option>
              <option value="Manchester City">Manchester City</option>
              <option value="Chelsea">Chelsea</option>
              <option value="Liverpool">Liverpool</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Positions</option>
              <option value="ST">Striker</option>
              <option value="CAM">Attacking Mid</option>
              <option value="CM">Central Mid</option>
              <option value="LW">Left Wing</option>
              <option value="RW">Right Wing</option>
              <option value="CB">Centre Back</option>
              <option value="LB">Left Back</option>
              <option value="RB">Right Back</option>
              <option value="GK">Goalkeeper</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Min Form Score
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="10"
                value={minFormScore}
                onChange={(e) => setMinFormScore(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                {minFormScore.toFixed(1)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Injury Risk
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={maxInjuryRisk}
                onChange={(e) => setMaxInjuryRisk(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                {maxInjuryRisk}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PREDICTIONS TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Player Predictions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Showing {filteredPredictions.length} of {displayData.predictions.length} players
            </p>
          </div>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'formScore' | 'injuryRisk' | 'confidence')
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="formScore">Sort by Form Score</option>
            <option value="injuryRisk">Sort by Injury Risk</option>
            <option value="confidence">Sort by Confidence</option>
          </select>
        </div>

        {loading && !apiData ? (
          <SkeletonCard />
        ) : filteredPredictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Player
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Team
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Form
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    xG
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    xA
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Injury Risk
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPredictions.map((player) => (
                  <tr
                    key={player.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {player.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {player.position}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {player.team}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {player.formScore}/10
                        </div>
                        {player.trend === 'up' && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        {player.trend === 'down' && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {player.expectedGoals}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {player.expectedAssists}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          player.injuryRisk > 60
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            : player.injuryRisk > 30
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}
                      >
                        {player.injuryRisk}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-auto">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${player.confidence}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {player.confidence}%
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12">
            <EmptyState
              title="No predictions match your filters"
              message="Try adjusting your filter criteria."
            />
          </div>
        )}
      </div>

      {/* INJURY ALERTS */}
      {injuryAlertPlayers.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                High Injury Risk Alert
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                {injuryAlertPlayers.length} player(s) showing high injury risk:
              </p>
              <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                {injuryAlertPlayers.map((p) => (
                  <li key={p.id}>
                    • {p.name} ({p.position}) - {p.injuryRisk}% risk
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictionsDashboard;
