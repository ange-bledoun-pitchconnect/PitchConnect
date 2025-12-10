// ============================================================================
// PHASE 9: src/app/dashboard/analytics/page.tsx
// Analytics Dashboard Page - CHAMPIONSHIP QUALITY
//
// Features:
// - KPI cards (Total Matches, Win %, Goals/Match, Pass Accuracy)
// - Performance trend chart
// - Match results table with sorting
// - Player rankings
// - Real-time data fetching with caching
// - Responsive design
// - Dark mode support
//
// ============================================================================

'use client';

import { useState, useCallback } from 'react';
import { Activity, Target, TrendingUp, Zap } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/dashboard/DataTable';
import { LineChart } from '@/components/dashboard/LineChart';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { LoadingState, SkeletonCard } from '@/components/dashboard/LoadingState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/dashboard/ErrorState';
import {
  calculateFormScore,
  calculateWinPercentage,
  calculateAverageGoals,
  calculatePassAccuracy,
} from '@/lib/dashboard/analytics-utils';

// ============================================================================
// TYPES
// ============================================================================

interface Match {
  id: string;
  date: string;
  opponent: string;
  result: 'win' | 'draw' | 'loss';
  goalsFor: number;
  goalsAgainst: number;
}

interface Player {
  id: string;
  name: string;
  position: string;
  goals: number;
  assists: number;
  appearances: number;
  rating: number;
}

interface AnalyticsData {
  teamName: string;
  season: string;
  recentMatches: Match[];
  topPlayers: Player[];
  stats: {
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    completedPasses: number;
    totalPasses: number;
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function AnalyticsDashboard() {
  // State management
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const debouncedTeamId = useDebounce(selectedTeamId, 300);

  // Build API URL based on filters
  const apiUrl = `/api/analytics/teams/${debouncedTeamId || '1'}?${
    dateRange
      ? `from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
      : ''
  }`;

  // Fetch analytics data
  const { data: analyticsData, loading, error, refetch } = useFetch<AnalyticsData>(
    apiUrl,
    {
      skip: !debouncedTeamId && !dateRange,
      cache: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  // Handlers
  const handleDateRangeChange = useCallback((from: Date, to: Date) => {
    setDateRange({ from, to });
  }, []);

  const handleTeamSelect = useCallback((teamId: string) => {
    setSelectedTeamId(teamId);
  }, []);

  // Mock data for demo
  const mockData: AnalyticsData = {
    teamName: 'Arsenal FC',
    season: '2024/25',
    recentMatches: [
      {
        id: '1',
        date: '2024-12-08',
        opponent: 'Manchester City',
        result: 'win',
        goalsFor: 3,
        goalsAgainst: 2,
      },
      {
        id: '2',
        date: '2024-12-05',
        opponent: 'Chelsea',
        result: 'draw',
        goalsFor: 2,
        goalsAgainst: 2,
      },
      {
        id: '3',
        date: '2024-12-01',
        opponent: 'Liverpool',
        result: 'loss',
        goalsFor: 1,
        goalsAgainst: 2,
      },
      {
        id: '4',
        date: '2024-11-28',
        opponent: 'Tottenham',
        result: 'win',
        goalsFor: 2,
        goalsAgainst: 1,
      },
      {
        id: '5',
        date: '2024-11-25',
        opponent: 'Brighton',
        result: 'win',
        goalsFor: 4,
        goalsAgainst: 0,
      },
    ],
    topPlayers: [
      {
        id: '1',
        name: 'Bukayo Saka',
        position: 'RW',
        goals: 8,
        assists: 5,
        appearances: 12,
        rating: 8.2,
      },
      {
        id: '2',
        name: 'Kai Havertz',
        position: 'ST',
        goals: 6,
        assists: 2,
        appearances: 11,
        rating: 7.8,
      },
      {
        id: '3',
        name: 'Gabriel Martinelli',
        position: 'LW',
        goals: 5,
        assists: 3,
        appearances: 13,
        rating: 7.6,
      },
      {
        id: '4',
        name: 'Martin Odegaard',
        position: 'CAM',
        goals: 4,
        assists: 7,
        appearances: 14,
        rating: 8.1,
      },
    ],
    stats: {
      totalMatches: 15,
      wins: 9,
      draws: 2,
      losses: 4,
      goalsFor: 32,
      goalsAgainst: 18,
      completedPasses: 3500,
      totalPasses: 4200,
    },
  };

  // Use mock data if API hasn't loaded yet
  const displayData = analyticsData || mockData;

  // Calculate KPI values
  const formScore = calculateFormScore(displayData.recentMatches);
  const winPercentage = calculateWinPercentage(displayData.recentMatches);
  const avgGoals = calculateAverageGoals(displayData.recentMatches);
  const passAccuracy = calculatePassAccuracy(
    displayData.recentMatches.map((m) => ({
      completedPasses: Math.round((displayData.stats.completedPasses / 5) * 0.9),
      totalPasses: Math.round(displayData.stats.totalPasses / 5),
    }))
  );

  // Prepare chart data
  const chartData = displayData.recentMatches.map((match) => ({
    label: new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: match.goalsFor,
  }));

  // Error handling
  if (error && analyticsData === null) {
    return (
      <div className="space-y-6">
        <FilterBar onTeamSelect={handleTeamSelect} onDateRangeChange={handleDateRangeChange} />
        <ErrorState
          title="Failed to load analytics"
          message={error.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  // ============================================================================
  // RENDER: Main Dashboard
  // ============================================================================

  return (
    <div className="space-y-6 pb-12">
      {/* Filter Section */}
      <FilterBar
        onTeamSelect={handleTeamSelect}
        onDateRangeChange={handleDateRangeChange}
        loading={loading}
      />

      {/* KPI Cards Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Team Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Form Score"
            value={formScore}
            unit="%"
            icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
            backgroundColor="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
            loading={loading}
            trend={{
              value: 12,
              direction: 'up',
            }}
          />
          <KPICard
            label="Win Rate"
            value={winPercentage}
            unit="%"
            icon={<Target className="w-5 h-5 text-green-500" />}
            backgroundColor="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
            loading={loading}
            trend={{
              value: 8,
              direction: 'up',
            }}
          />
          <KPICard
            label="Goals Per Match"
            value={avgGoals}
            unit="avg"
            icon={<Activity className="w-5 h-5 text-purple-500" />}
            backgroundColor="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
            loading={loading}
          />
          <KPICard
            label="Pass Accuracy"
            value={passAccuracy}
            unit="%"
            icon={<Zap className="w-5 h-5 text-orange-500" />}
            backgroundColor="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
            loading={loading}
          />
        </div>
      </div>

      {/* Performance Chart */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Scoring Trend</h2>
        <LineChart data={chartData} height={300} color="#F59E0B" loading={loading} />
      </div>

      {/* Recent Matches Table */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Recent Matches</h2>
        {loading && !analyticsData ? (
          <SkeletonCard />
        ) : displayData.recentMatches.length > 0 ? (
          <DataTable
            columns={[
              {
                header: 'Date',
                accessor: (row: Match) =>
                  new Date(row.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  }),
                sortable: true,
              },
              {
                header: 'Opponent',
                accessor: 'opponent',
                sortable: true,
              },
              {
                header: 'Result',
                accessor: (row: Match) => {
                  const colors = {
                    win: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
                    draw: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
                    loss: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                  };
                  return (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        colors[row.result]
                      }`}
                    >
                      {row.result.charAt(0).toUpperCase() + row.result.slice(1)}
                    </span>
                  );
                },
              },
              {
                header: 'Score',
                accessor: (row: Match) => `${row.goalsFor} - ${row.goalsAgainst}`,
              },
            ]}
            data={displayData.recentMatches}
            loading={loading}
            pageSize={10}
          />
        ) : (
          <EmptyState title="No matches found" message="No match data available for the selected filters." />
        )}
      </div>

      {/* Top Players Table */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Top Players</h2>
        {loading && !analyticsData ? (
          <SkeletonCard />
        ) : displayData.topPlayers.length > 0 ? (
          <DataTable
            columns={[
              {
                header: 'Player',
                accessor: 'name',
                sortable: true,
              },
              {
                header: 'Position',
                accessor: 'position',
              },
              {
                header: 'Goals',
                accessor: 'goals',
                sortable: true,
              },
              {
                header: 'Assists',
                accessor: 'assists',
                sortable: true,
              },
              {
                header: 'Apps',
                accessor: 'appearances',
                sortable: true,
              },
              {
                header: 'Rating',
                accessor: (row: Player) => row.rating.toFixed(1),
                sortable: true,
              },
            ]}
            data={displayData.topPlayers}
            loading={loading}
            pageSize={10}
          />
        ) : (
          <EmptyState title="No players found" message="No player data available." />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate CSV export of analytics data
 */
function generateAnalyticsCSV(
  data: TeamPerformanceMetrics,
  kpis: KPIMetrics
): string {
  let csv = 'PitchConnect Analytics Export\n';
  csv += `Team: ${data.teamName}\n`;
  csv += `Season: ${data.season}\n`;
  csv += `Period: ${data.period.from} to ${data.period.to}\n\n`;

  csv += 'KPI METRICS\n';
  csv += `Form Score,${kpis.formScore}%\n`;
  csv += `Win Percentage,${kpis.winPercentage}%\n`;
  csv += `Average Goals,${kpis.averageGoals}\n`;
  csv += `Pass Accuracy,${kpis.passAccuracy}%\n\n`;

  csv += 'MATCH SUMMARY\n';
  csv += `Total Matches,${data.matches.total}\n`;
  csv += `Wins,${data.matches.won}\n`;
  csv += `Draws,${data.matches.drawn}\n`;
  csv += `Losses,${data.matches.lost}\n`;
  csv += `Goals For,${data.matches.goalsFor}\n`;
  csv += `Goals Against,${data.matches.goalsAgainst}\n\n`;

  csv += 'RECENT MATCHES\n';
  csv += 'Date,Home Team,Away Team,Home Score,Away Score,Status\n';
  data.recentMatches?.forEach((match) => {
    csv += `${match.date},${match.homeTeam.name},${match.awayTeam.name},${match.homeScore},${match.awayScore},${match.status}\n`;
  });

  csv += '\nTOP PLAYERS\n';
  csv += 'Player,Position,Goals,Assists,Appearances,Rating\n';
  data.topPlayers?.forEach((player) => {
    csv += `${player.user.firstName} ${player.user.lastName},${player.position},${player.goals},${player.assists},${player.appearances},${player.rating}\n`;
  });

  return csv;
}

// ============================================================================
// DISPLAY NAME
// ============================================================================

export default AnalyticsDashboard;
