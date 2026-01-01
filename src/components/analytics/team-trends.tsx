/**
 * ============================================================================
 * TeamTrends Component
 * ============================================================================
 * 
 * Enterprise-grade team performance trends with full multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - COACH: Team performance analysis
 * - MANAGER: Team management decisions
 * - ANALYST: Deep dive analytics
 * - CLUB_MANAGER: Club-wide team analytics
 * - CLUB_OWNER: High-level performance overview
 * - SCOUT: Team evaluation for transfers
 * 
 * SCHEMA ALIGNMENT:
 * - Club model
 * - Team model
 * - Match model
 * - CompetitionStanding model
 * - Sport enum (all 12 sports)
 * 
 * SUPPORTED SPORTS:
 * - Football/Soccer ⚽
 * - Rugby 🏉
 * - Basketball 🏀
 * - Cricket 🏏
 * - American Football 🏈
 * - Hockey 🏒
 * - Netball 🏐
 * - Lacrosse 🥍
 * - Australian Rules 🏉
 * - Gaelic Football 🏐
 * - Futsal ⚽
 * - Beach Football ⚽
 * 
 * ============================================================================
 */

'use client';

import { useMemo, useState } from 'react';
import { useTeamTrend } from '@/hooks/useAdvancedAnalytics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  Activity,
  Trophy,
  Calendar,
  Users,
  Zap,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS (Aligned with Schema v7.10.1)
// =============================================================================

/**
 * Sport types from schema
 */
type Sport =
  | 'FOOTBALL'
  | 'NETBALL'
  | 'RUGBY'
  | 'CRICKET'
  | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL'
  | 'HOCKEY'
  | 'LACROSSE'
  | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL'
  | 'FUTSAL'
  | 'BEACH_FOOTBALL';

/**
 * Time range options
 */
type TimeRange = 'week' | 'month' | 'season' | 'all';

/**
 * Form status
 */
type FormStatus = 'excellent' | 'good' | 'average' | 'poor' | 'unknown';

/**
 * Team statistics interface aligned with schema
 */
interface TeamStats {
  // Record
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  total: number;
  winRate: number;
  
  // Goals/Points
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  pointsFor?: number; // For sports like basketball
  pointsAgainst?: number;
  
  // Defense
  cleanSheets: number;
  
  // Attack
  shotsPerGame?: number;
  shotAccuracy?: number;
  
  // Form & Momentum
  form: FormStatus;
  momentum: number;
  consistency: number;
  formString?: string; // e.g., "WWDLW"
  
  // Advanced
  homeRecord?: { wins: number; draws: number; losses: number };
  awayRecord?: { wins: number; draws: number; losses: number };
  xG?: number;
  xGA?: number;
  
  // Sport-specific
  sportSpecificStats?: Record<string, number | string>;
}

/**
 * Trend data point
 */
interface TrendDataPoint {
  date: string;
  rating: number;
  points?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  matchId?: string;
}

/**
 * Component props
 */
interface TeamTrendsProps {
  /** Club/Team ID from database */
  clubId: string;
  /** Team ID (optional, for specific team within club) */
  teamId?: string;
  /** Club/Team name for display */
  clubName?: string;
  /** Sport type for sport-specific stats */
  sport?: Sport;
  /** Time range for data */
  timeRange?: TimeRange;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode */
  compact?: boolean;
  /** Hide charts */
  hideCharts?: boolean;
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

interface SportConfig {
  icon: string;
  label: string;
  color: string;
  primaryScoring: string;
  secondaryScoring?: string;
  hasDraws: boolean;
  primaryStats: string[];
}

const SPORT_CONFIG: Record<Sport, SportConfig> = {
  FOOTBALL: {
    icon: '⚽',
    label: 'Football',
    color: 'green',
    primaryScoring: 'Goals',
    hasDraws: true,
    primaryStats: ['winRate', 'goalsFor', 'goalsAgainst', 'cleanSheets'],
  },
  RUGBY: {
    icon: '🏉',
    label: 'Rugby',
    color: 'red',
    primaryScoring: 'Tries',
    secondaryScoring: 'Points',
    hasDraws: true,
    primaryStats: ['winRate', 'pointsFor', 'pointsAgainst', 'tryDifference'],
  },
  BASKETBALL: {
    icon: '🏀',
    label: 'Basketball',
    color: 'orange',
    primaryScoring: 'Points',
    hasDraws: false,
    primaryStats: ['winRate', 'pointsPerGame', 'pointsAgainstPerGame', 'reboundDiff'],
  },
  CRICKET: {
    icon: '🏏',
    label: 'Cricket',
    color: 'amber',
    primaryScoring: 'Runs',
    hasDraws: true,
    primaryStats: ['winRate', 'runRate', 'battingAverage', 'bowlingAverage'],
  },
  AMERICAN_FOOTBALL: {
    icon: '🏈',
    label: 'American Football',
    color: 'brown',
    primaryScoring: 'Points',
    hasDraws: true, // Rare but possible
    primaryStats: ['winRate', 'pointsFor', 'pointsAgainst', 'turnoverDiff'],
  },
  HOCKEY: {
    icon: '🏒',
    label: 'Hockey',
    color: 'blue',
    primaryScoring: 'Goals',
    hasDraws: true,
    primaryStats: ['winRate', 'goalsFor', 'goalsAgainst', 'powerPlayPct'],
  },
  NETBALL: {
    icon: '🏐',
    label: 'Netball',
    color: 'purple',
    primaryScoring: 'Goals',
    hasDraws: true,
    primaryStats: ['winRate', 'goalsFor', 'goalsAgainst', 'shootingAccuracy'],
  },
  LACROSSE: {
    icon: '🥍',
    label: 'Lacrosse',
    color: 'indigo',
    primaryScoring: 'Goals',
    hasDraws: false,
    primaryStats: ['winRate', 'goalsFor', 'goalsAgainst', 'faceoffWinPct'],
  },
  AUSTRALIAN_RULES: {
    icon: '🏉',
    label: 'AFL',
    color: 'yellow',
    primaryScoring: 'Points',
    hasDraws: true,
    primaryStats: ['winRate', 'pointsFor', 'pointsAgainst', 'disposalEfficiency'],
  },
  GAELIC_FOOTBALL: {
    icon: '🏐',
    label: 'Gaelic Football',
    color: 'emerald',
    primaryScoring: 'Points',
    hasDraws: true,
    primaryStats: ['winRate', 'goalsScored', 'pointsScored', 'scoreDifference'],
  },
  FUTSAL: {
    icon: '⚽',
    label: 'Futsal',
    color: 'teal',
    primaryScoring: 'Goals',
    hasDraws: true,
    primaryStats: ['winRate', 'goalsFor', 'goalsAgainst', 'shootingAccuracy'],
  },
  BEACH_FOOTBALL: {
    icon: '⚽',
    label: 'Beach Football',
    color: 'cyan',
    primaryScoring: 'Goals',
    hasDraws: false,
    primaryStats: ['winRate', 'goalsFor', 'goalsAgainst', 'spectacularGoals'],
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get form badge color
 */
function getFormColor(form: FormStatus): string {
  switch (form) {
    case 'excellent':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'good':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'average':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'poor':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }
}

/**
 * Get momentum color
 */
function getMomentumColor(momentum: number): string {
  if (momentum > 20) return '#10b981'; // Green
  if (momentum > 0) return '#3b82f6'; // Blue
  if (momentum > -20) return '#f59e0b'; // Orange
  return '#ef4444'; // Red
}

/**
 * Format form string to badges
 */
function FormStringDisplay({ formString }: { formString?: string }) {
  if (!formString) return null;
  
  const getResultColor = (result: string) => {
    switch (result.toUpperCase()) {
      case 'W':
        return 'bg-green-500';
      case 'D':
        return 'bg-yellow-500';
      case 'L':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center gap-1">
      {formString.split('').slice(-5).map((result, i) => (
        <div
          key={i}
          className={cn(
            'w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold',
            getResultColor(result)
          )}
        >
          {result.toUpperCase()}
        </div>
      ))}
    </div>
  );
}

/**
 * Calculate per-game stats
 */
function perGame(total: number, matches: number): string {
  if (!matches) return '0.0';
  return (total / matches).toFixed(1);
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function TrendsSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-16 w-20" />
          </div>
        </div>
      </Card>

      {!compact && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-8 w-8 mb-2" />
                <Skeleton className="h-10 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </Card>
        </>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TeamTrends({
  clubId,
  teamId,
  clubName = 'Team',
  sport = 'FOOTBALL',
  timeRange: initialTimeRange = 'season',
  className = '',
  compact = false,
  hideCharts = false,
}: TeamTrendsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [activeTab, setActiveTab] = useState<'overview' | 'attack' | 'defense'>('overview');

  // Fetch team trend data
  const { data, isLoading, error, refetch } = useTeamTrend(clubId, timeRange, { teamId });

  // Get sport configuration
  const sportConfig = SPORT_CONFIG[sport];

  // Process data
  const stats: TeamStats = useMemo(() => data?.stats || {
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    total: 0,
    winRate: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    cleanSheets: 0,
    form: 'unknown' as FormStatus,
    momentum: 0,
    consistency: 0,
  }, [data]);

  const trends: TrendDataPoint[] = useMemo(() => data?.trends || [], [data]);

  // Match record data for pie chart
  const recordData = useMemo(() => {
    const data = [
      { name: 'Wins', value: stats.wins, color: '#10b981' },
      { name: 'Losses', value: stats.losses, color: '#ef4444' },
    ];
    
    if (sportConfig.hasDraws && stats.draws > 0) {
      data.splice(1, 0, { name: 'Draws', value: stats.draws, color: '#f59e0b' });
    }
    
    return data;
  }, [stats, sportConfig]);

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-200">
              Failed to load team trend data
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error.message || 'Please try again later'}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-4 text-sm text-red-600 dark:text-red-400 underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return <TrendsSkeleton compact={compact} />;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Sport Icon */}
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                `bg-${sportConfig.color}-100 dark:bg-${sportConfig.color}-900/30`
              )}
              title={sportConfig.label}
            >
              {sportConfig.icon}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {clubName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Team Trends & Momentum
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Form Badge */}
            <Badge className={cn('px-3 py-1', getFormColor(stats.form))}>
              {stats.form?.toUpperCase() || 'UNKNOWN'}
            </Badge>

            {/* Recent Form */}
            <FormStringDisplay formString={stats.formString} />

            {/* Momentum Score */}
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div
                className="text-3xl font-bold"
                style={{ color: getMomentumColor(stats.momentum) }}
              >
                {stats.momentum > 0 ? '+' : ''}
                {stats.momentum}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Momentum</p>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <div className="flex gap-1">
              {(['week', 'month', 'season', 'all'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full transition-colors',
                    timeRange === range
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80'
                  )}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.winRate}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Win Rate
          </p>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.goalsFor || stats.pointsFor || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {sportConfig.primaryScoring} For
          </p>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.goalsAgainst || stats.pointsAgainst || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {sportConfig.primaryScoring} Against
          </p>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.consistency}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Consistency
          </p>
        </Card>
      </div>

      {/* Charts Section (hidden in compact mode) */}
      {!compact && !hideCharts && (
        <>
          {/* Performance Trajectory */}
          {trends.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Performance Trajectory
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="rating"
                    name="Rating"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRating)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Attack vs Defense */}
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Performance Breakdown
                </h3>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="attack">Attack</TabsTrigger>
                  <TabsTrigger value="defense">Defense</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Attack Stats */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-500" />
                      Attack
                    </h4>
                    <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {sportConfig.primaryScoring} per Match
                      </span>
                      <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {perGame(stats.goalsFor || stats.pointsFor || 0, stats.matches)}
                      </span>
                    </div>
                    {stats.shotsPerGame !== undefined && (
                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Shots per Match
                        </span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {stats.shotsPerGame.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Defense Stats */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      Defense
                    </h4>
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Clean Sheets
                      </span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.cleanSheets || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {sportConfig.primaryScoring} Against per Match
                      </span>
                      <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {perGame(stats.goalsAgainst || stats.pointsAgainst || 0, stats.matches)}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attack">
                <div className="text-center py-8 text-gray-500">
                  Detailed attack analytics coming soon
                </div>
              </TabsContent>

              <TabsContent value="defense">
                <div className="text-center py-8 text-gray-500">
                  Detailed defense analytics coming soon
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Match Record */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Match Record ({timeRange})
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Record Numbers */}
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {stats.wins || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Wins</p>
                  </div>
                  {sportConfig.hasDraws && (
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                      <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {stats.draws || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Draws</p>
                    </div>
                  )}
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {stats.losses || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Losses</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {stats.total > 0 && (
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(stats.wins / stats.total) * 100}%` }}
                    />
                    {sportConfig.hasDraws && (
                      <div
                        className="h-full bg-yellow-500"
                        style={{ width: `${(stats.draws / stats.total) * 100}%` }}
                      />
                    )}
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${(stats.losses / stats.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Pie Chart */}
              {stats.total > 0 && (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width={150} height={150}>
                    <PieChart>
                      <Pie
                        data={recordData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {recordData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="ml-4 space-y-2">
                    {recordData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.name}: {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Home vs Away (if available) */}
            {stats.homeRecord && stats.awayRecord && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      🏠 Home
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.homeRecord.wins}W - {stats.homeRecord.draws}D - {stats.homeRecord.losses}L
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                      ✈️ Away
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.awayRecord.wins}W - {stats.awayRecord.draws}D - {stats.awayRecord.losses}L
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

TeamTrends.displayName = 'TeamTrends';

export default TeamTrends;
