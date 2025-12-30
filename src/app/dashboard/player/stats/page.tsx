'use client';

// ============================================================================
// 🏆 PITCHCONNECT PLAYER STATS v7.5.0
// ============================================================================
// Comprehensive statistics dashboard with season comparison
// ============================================================================

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Clock,
  Award,
  Zap,
  ChevronDown,
  ChevronRight,
  BarChart3,
  PieChart,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Sport, SPORT_CONFIGS, formatPosition } from '@/lib/sport-config';

// ============================================================================
// TYPES
// ============================================================================

interface SeasonStats {
  seasonId: string;
  seasonName: string;
  teamName: string;
  sport: Sport;
  matches: number;
  starts: number;
  substitutes: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  avgRating: number;
  cleanSheets?: number;
  saves?: number;
  passAccuracy?: number;
  shotsOnTarget?: number;
  tackles?: number;
  interceptions?: number;
  aerialDuels?: number;
}

interface CareerStats {
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  totalMinutes: number;
  totalYellowCards: number;
  totalRedCards: number;
  avgRating: number;
  bestRating: number;
  longestStreak: number;
  currentStreak: number;
}

interface PerformanceTrend {
  month: string;
  matches: number;
  goals: number;
  assists: number;
  avgRating: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_SEASONS: SeasonStats[] = [
  {
    seasonId: 's-2024',
    seasonName: '2024/25',
    teamName: 'First Team',
    sport: 'FOOTBALL',
    matches: 18,
    starts: 15,
    substitutes: 3,
    minutesPlayed: 1350,
    goals: 8,
    assists: 5,
    yellowCards: 2,
    redCards: 0,
    avgRating: 7.4,
    passAccuracy: 82,
    shotsOnTarget: 24,
    tackles: 18,
    interceptions: 12,
  },
  {
    seasonId: 's-2023',
    seasonName: '2023/24',
    teamName: 'First Team',
    sport: 'FOOTBALL',
    matches: 35,
    starts: 30,
    substitutes: 5,
    minutesPlayed: 2680,
    goals: 12,
    assists: 8,
    yellowCards: 4,
    redCards: 1,
    avgRating: 7.2,
    passAccuracy: 79,
    shotsOnTarget: 42,
    tackles: 35,
    interceptions: 28,
  },
  {
    seasonId: 's-2022',
    seasonName: '2022/23',
    teamName: 'First Team',
    sport: 'FOOTBALL',
    matches: 38,
    starts: 35,
    substitutes: 3,
    minutesPlayed: 3120,
    goals: 17,
    assists: 11,
    yellowCards: 3,
    redCards: 0,
    avgRating: 7.6,
    passAccuracy: 84,
    shotsOnTarget: 58,
    tackles: 42,
    interceptions: 31,
  },
];

const MOCK_CAREER: CareerStats = {
  totalMatches: 287,
  totalGoals: 89,
  totalAssists: 52,
  totalMinutes: 22450,
  totalYellowCards: 24,
  totalRedCards: 2,
  avgRating: 7.3,
  bestRating: 9.4,
  longestStreak: 23,
  currentStreak: 5,
};

const MOCK_TRENDS: PerformanceTrend[] = [
  { month: 'Aug', matches: 4, goals: 2, assists: 1, avgRating: 7.2 },
  { month: 'Sep', matches: 5, goals: 3, assists: 2, avgRating: 7.5 },
  { month: 'Oct', matches: 4, goals: 1, assists: 0, avgRating: 6.8 },
  { month: 'Nov', matches: 5, goals: 2, assists: 2, avgRating: 7.4 },
  { month: 'Dec', matches: 6, goals: 3, assists: 1, avgRating: 7.6 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function PlayerStatsPage() {
  const { data: session } = useSession();
  const [seasons, setSeasons] = useState<SeasonStats[]>([]);
  const [career, setCareer] = useState<CareerStats | null>(null);
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSeason, setCompareSeason] = useState<string>('');

  const sport: Sport = 'FOOTBALL';
  const sportConfig = SPORT_CONFIGS[sport];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setSeasons(MOCK_SEASONS);
        setCareer(MOCK_CAREER);
        setTrends(MOCK_TRENDS);
      } catch (err) {
        console.error('Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get selected season data
  const currentSeasonData = selectedSeason === 'all' 
    ? null 
    : seasons.find((s) => s.seasonId === selectedSeason);

  const compareSeasonData = compareSeason 
    ? seasons.find((s) => s.seasonId === compareSeason) 
    : null;

  // Calculate comparison
  const getComparison = (current: number, compare: number) => {
    if (!compare) return { diff: 0, percentage: 0, trend: 'neutral' as const };
    const diff = current - compare;
    const percentage = compare !== 0 ? ((diff / compare) * 100) : 0;
    return {
      diff,
      percentage: Math.abs(percentage),
      trend: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'neutral' as const,
    };
  };

  // Render stat card with comparison
  const renderStatCard = (
    label: string,
    value: number | string,
    icon: typeof Activity,
    compareValue?: number,
    suffix?: string,
    decimals = 0
  ) => {
    const Icon = icon;
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    const comparison = compareValue !== undefined ? getComparison(numValue, compareValue) : null;

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">{label}</span>
          <Icon className="h-4 w-4 text-zinc-500" />
        </div>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-white">
            {typeof value === 'number' ? value.toFixed(decimals) : value}
            {suffix && <span className="text-sm text-zinc-400 ml-1">{suffix}</span>}
          </p>
          {comparison && comparison.trend !== 'neutral' && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm',
                comparison.trend === 'up' ? 'text-green-400' : 'text-red-400'
              )}
            >
              {comparison.trend === 'up' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {comparison.percentage.toFixed(0)}%
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render progress bar
  const renderProgressBar = (label: string, value: number, max: number, color: string) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );

  // Render mini bar chart
  const renderMiniChart = () => {
    const maxGoals = Math.max(...trends.map((t) => t.goals));

    return (
      <div className="flex items-end justify-between h-20 gap-1">
        {trends.map((trend, i) => (
          <div key={trend.month} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-full rounded-t transition-all',
                i === trends.length - 1 ? 'bg-green-500' : 'bg-zinc-700'
              )}
              style={{ height: `${(trend.goals / maxGoals) * 100}%`, minHeight: '4px' }}
            />
            <span className="text-[10px] text-zinc-500">{trend.month}</span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-green-500" />
                My Statistics
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Performance analytics across all seasons
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Season selector */}
              <div className="relative">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <option value="all">All Time</option>
                  {seasons.map((s) => (
                    <option key={s.seasonId} value={s.seasonId}>
                      {s.seasonName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>

              {/* Compare toggle */}
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  compareMode
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                )}
              >
                Compare
              </button>
            </div>
          </div>

          {/* Compare season selector */}
          {compareMode && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-zinc-400">Compare with:</span>
              <select
                value={compareSeason}
                onChange={(e) => setCompareSeason(e.target.value)}
                className="appearance-none px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="">Select season</option>
                {seasons
                  .filter((s) => s.seasonId !== selectedSeason)
                  .map((s) => (
                    <option key={s.seasonId} value={s.seasonId}>
                      {s.seasonName}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Career Overview (when "All Time" selected) */}
        {selectedSeason === 'all' && career && (
          <>
            {/* Hero stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/20 rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-white">{career.totalMatches}</p>
                <p className="text-sm text-green-400">Career Matches</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20 rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-white">{career.totalGoals}</p>
                <p className="text-sm text-blue-400">{sportConfig.primaryStat}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/20 rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-white">{career.totalAssists}</p>
                <p className="text-sm text-purple-400">{sportConfig.secondaryStat}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/20 rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-white">{career.avgRating.toFixed(1)}</p>
                <p className="text-sm text-yellow-400">Avg Rating</p>
              </div>
            </div>

            {/* Additional career stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {renderStatCard('Minutes', Math.round(career.totalMinutes / 60), Clock, undefined, 'hrs')}
              {renderStatCard('Yellow Cards', career.totalYellowCards, AlertCircle)}
              {renderStatCard('Red Cards', career.totalRedCards, AlertCircle)}
              {renderStatCard('Best Rating', career.bestRating, Award, undefined, undefined, 1)}
              {renderStatCard('Current Streak', career.currentStreak, Zap, undefined, 'games')}
              {renderStatCard('Best Streak', career.longestStreak, TrendingUp, undefined, 'games')}
            </div>
          </>
        )}

        {/* Season Stats */}
        {currentSeasonData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {renderStatCard(
                'Matches',
                currentSeasonData.matches,
                Activity,
                compareSeasonData?.matches
              )}
              {renderStatCard(
                sportConfig.primaryStat,
                currentSeasonData.goals,
                Target,
                compareSeasonData?.goals
              )}
              {renderStatCard(
                sportConfig.secondaryStat,
                currentSeasonData.assists,
                Zap,
                compareSeasonData?.assists
              )}
              {renderStatCard(
                'Avg Rating',
                currentSeasonData.avgRating,
                Award,
                compareSeasonData?.avgRating,
                undefined,
                1
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Playing time */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-zinc-400" />
                  Playing Time
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Total Minutes</span>
                    <span className="text-white font-bold">{currentSeasonData.minutesPlayed}'</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Starts</span>
                    <span className="text-white font-bold">{currentSeasonData.starts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Substitute Appearances</span>
                    <span className="text-white font-bold">{currentSeasonData.substitutes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Avg Minutes/Game</span>
                    <span className="text-white font-bold">
                      {Math.round(currentSeasonData.minutesPlayed / currentSeasonData.matches)}'
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance metrics */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-zinc-400" />
                  Performance Metrics
                </h3>
                <div className="space-y-4">
                  {currentSeasonData.passAccuracy && (
                    renderProgressBar('Pass Accuracy', currentSeasonData.passAccuracy, 100, 'bg-blue-500')
                  )}
                  {currentSeasonData.shotsOnTarget && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Shots on Target</span>
                      <span className="text-white font-bold">{currentSeasonData.shotsOnTarget}</span>
                    </div>
                  )}
                  {currentSeasonData.tackles && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Tackles Won</span>
                      <span className="text-white font-bold">{currentSeasonData.tackles}</span>
                    </div>
                  )}
                  {currentSeasonData.interceptions && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Interceptions</span>
                      <span className="text-white font-bold">{currentSeasonData.interceptions}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Season by Season */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-zinc-400" />
            Season by Season
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400">Season</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400">Team</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400 text-center">Apps</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400 text-center">{sportConfig.primaryStat}</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400 text-center">{sportConfig.secondaryStat}</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400 text-center">Mins</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400 text-center">Rating</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((season) => (
                  <tr key={season.seasonId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-white">{season.seasonName}</td>
                    <td className="px-4 py-3 text-zinc-300">{season.teamName}</td>
                    <td className="px-4 py-3 text-center text-white">{season.matches}</td>
                    <td className="px-4 py-3 text-center text-white font-bold">{season.goals}</td>
                    <td className="px-4 py-3 text-center text-white">{season.assists}</td>
                    <td className="px-4 py-3 text-center text-zinc-300">{season.minutesPlayed}'</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-sm font-bold',
                          season.avgRating >= 7.5
                            ? 'bg-green-500/10 text-green-400'
                            : season.avgRating >= 7.0
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-zinc-500/10 text-zinc-300'
                        )}
                      >
                        {season.avgRating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-zinc-400" />
            Monthly Form (Current Season)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-zinc-400 mb-3">{sportConfig.primaryStat} by Month</p>
              {renderMiniChart()}
            </div>
            <div className="space-y-3">
              {trends.slice(-3).reverse().map((trend) => (
                <div key={trend.month} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-300">{trend.month}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-400">{trend.matches} games</span>
                    <span className="text-white font-bold">{trend.goals}G {trend.assists}A</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded',
                        trend.avgRating >= 7.5
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-zinc-600/50 text-zinc-300'
                      )}
                    >
                      {trend.avgRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
