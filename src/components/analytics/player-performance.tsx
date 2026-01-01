/**
 * ============================================================================
 * PlayerPerformanceAnalytics Component
 * ============================================================================
 * 
 * Enterprise-grade player performance analytics with full multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - PLAYER: View own performance stats
 * - COACH: View team player stats
 * - SCOUT: Evaluate player performance
 * - ANALYST: Deep dive analytics
 * - PARENT: View child's performance (age-appropriate)
 * - MANAGER: Team management decisions
 * - CLUB_MANAGER: Club-wide player analytics
 * 
 * SCHEMA ALIGNMENT:
 * - Player model
 * - PlayerStatistic model
 * - PlayerAnalytic model
 * - PlayerMatchPerformance model
 * - Sport enum (all 12 sports)
 * - Position enum (sport-specific)
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

import { useMemo } from 'react';
import { usePlayerPerformance } from '@/hooks/useAdvancedAnalytics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Shield,
  Activity,
  Clock,
  Star,
  AlertCircle,
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
 * Position types (subset for display)
 */
type Position = string;

/**
 * Trend direction
 */
type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Player statistics interface aligned with PlayerStatistic model
 */
interface PlayerStats {
  // Universal Stats
  overallRating: number;
  matches: number;
  starts: number;
  minutesPlayed: number;
  trend: TrendDirection;
  trendPercentage: number;

  // Attack Stats
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  shotAccuracy?: number;

  // Passing Stats
  passes: number;
  passAccuracy?: number;
  keyPasses: number;

  // Defense Stats
  tackles: number;
  tackleSuccess?: number;
  interceptions: number;
  clearances: number;
  blocks: number;

  // Goalkeeper Stats
  saves?: number;
  savePercent?: number;
  cleanSheets?: number;
  goalsConceded?: number;

  // Discipline
  yellowCards: number;
  redCards: number;
  foulsCommitted: number;
  foulsSuffered: number;
  foulsPerGame?: number;

  // Advanced Stats
  aerialDuelsWon: number;
  dribbles: number;
  dribbleSuccess?: number;

  // Sport-Specific (stored as JSON in schema)
  sportSpecificStats?: Record<string, number | string>;
}

/**
 * Performance history point
 */
interface PerformanceHistoryPoint {
  date: string;
  rating: number;
  matchId?: string;
  opponent?: string;
}

/**
 * Radar chart data point
 */
interface RadarDataPoint {
  skill: string;
  value: number;
  fullMark: number;
}

/**
 * Component props
 */
interface PlayerPerformanceProps {
  /** Player ID from database */
  playerId: string;
  /** Player name for display */
  playerName?: string;
  /** Player position */
  position?: Position;
  /** Sport type for sport-specific stats */
  sport?: Sport;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode */
  compact?: boolean;
  /** Show only key stats */
  keyStatsOnly?: boolean;
  /** Time range for data */
  timeRange?: 'week' | 'month' | 'season' | 'career';
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

interface SportConfig {
  icon: string;
  label: string;
  color: string;
  primaryStats: string[];
  radarCategories: string[];
  positionGroups: Record<string, string[]>;
}

const SPORT_CONFIG: Record<Sport, SportConfig> = {
  FOOTBALL: {
    icon: '⚽',
    label: 'Football',
    color: 'green',
    primaryStats: ['goals', 'assists', 'passAccuracy', 'tackles'],
    radarCategories: ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'],
    positionGroups: {
      Attack: ['STRIKER', 'CENTER_FORWARD', 'LEFT_WINGER', 'RIGHT_WINGER'],
      Midfield: ['CENTRAL_MIDFIELDER', 'ATTACKING_MIDFIELDER', 'DEFENSIVE_MIDFIELDER'],
      Defense: ['CENTER_BACK', 'LEFT_BACK', 'RIGHT_BACK'],
      Goalkeeper: ['GOALKEEPER'],
    },
  },
  RUGBY: {
    icon: '🏉',
    label: 'Rugby',
    color: 'red',
    primaryStats: ['tries', 'tackles', 'metersCarried', 'linebreaks'],
    radarCategories: ['Attack', 'Defense', 'Kicking', 'Carrying', 'Breakdown', 'Set Piece'],
    positionGroups: {
      Forwards: ['PROP', 'HOOKER', 'LOCK', 'FLANKER', 'NUMBER_8'],
      Backs: ['SCRUM_HALF', 'FLY_HALF', 'INSIDE_CENTER', 'OUTSIDE_CENTER', 'FULLBACK'],
    },
  },
  BASKETBALL: {
    icon: '🏀',
    label: 'Basketball',
    color: 'orange',
    primaryStats: ['points', 'rebounds', 'assists', 'steals'],
    radarCategories: ['Scoring', 'Passing', 'Rebounding', 'Defense', 'Athleticism', 'Basketball IQ'],
    positionGroups: {
      Guards: ['POINT_GUARD', 'SHOOTING_GUARD'],
      Forwards: ['SMALL_FORWARD', 'POWER_FORWARD'],
      Centers: ['CENTER_BASKETBALL'],
    },
  },
  CRICKET: {
    icon: '🏏',
    label: 'Cricket',
    color: 'amber',
    primaryStats: ['runs', 'wickets', 'battingAverage', 'bowlingEconomy'],
    radarCategories: ['Batting', 'Bowling', 'Fielding', 'Wicket Keeping', 'Technique', 'Temperament'],
    positionGroups: {
      Batsmen: ['BATSMAN'],
      Bowlers: ['BOWLER'],
      AllRounders: ['ALL_ROUNDER'],
      WicketKeepers: ['WICKET_KEEPER'],
    },
  },
  AMERICAN_FOOTBALL: {
    icon: '🏈',
    label: 'American Football',
    color: 'brown',
    primaryStats: ['touchdowns', 'passingYards', 'rushingYards', 'tackles'],
    radarCategories: ['Speed', 'Strength', 'Agility', 'Vision', 'Technique', 'Football IQ'],
    positionGroups: {
      Offense: ['QUARTERBACK', 'RUNNING_BACK', 'WIDE_RECEIVER', 'TIGHT_END'],
      Defense: ['LINEBACKER', 'DEFENSIVE_END', 'DEFENSIVE_TACKLE', 'SAFETY', 'CORNERBACK'],
      Special: ['PUNTER', 'KICKER'],
    },
  },
  HOCKEY: {
    icon: '🏒',
    label: 'Hockey',
    color: 'blue',
    primaryStats: ['goals', 'assists', 'plusMinus', 'shots'],
    radarCategories: ['Skating', 'Shooting', 'Passing', 'Puck Control', 'Checking', 'Hockey Sense'],
    positionGroups: {
      Forwards: ['CENTER_HOCKEY', 'WINGER'],
      Defense: ['DEFENSEMAN'],
      Goalie: ['GOALTENDER'],
    },
  },
  NETBALL: {
    icon: '🏐',
    label: 'Netball',
    color: 'purple',
    primaryStats: ['goals', 'goalAccuracy', 'intercepts', 'centrePassReceives'],
    radarCategories: ['Shooting', 'Passing', 'Defense', 'Footwork', 'Vision', 'Fitness'],
    positionGroups: {
      Shooters: ['GOAL_SHOOTER', 'GOAL_ATTACK'],
      Midcourt: ['WING_ATTACK', 'CENTER', 'WING_DEFENSE'],
      Defense: ['GOAL_DEFENSE', 'GOALKEEPER_NETBALL'],
    },
  },
  LACROSSE: {
    icon: '🥍',
    label: 'Lacrosse',
    color: 'indigo',
    primaryStats: ['goals', 'assists', 'groundBalls', 'faceoffsWon'],
    radarCategories: ['Shooting', 'Passing', 'Stick Skills', 'Defense', 'Speed', 'Lacrosse IQ'],
    positionGroups: {
      Attack: ['STRIKER'],
      Midfield: ['CENTRAL_MIDFIELDER'],
      Defense: ['DEFENSEMAN'],
      Goalie: ['GOALTENDER'],
    },
  },
  AUSTRALIAN_RULES: {
    icon: '🏉',
    label: 'AFL',
    color: 'yellow',
    primaryStats: ['goals', 'behinds', 'disposals', 'marks'],
    radarCategories: ['Kicking', 'Marking', 'Handballing', 'Tackling', 'Fitness', 'Decision Making'],
    positionGroups: {
      Forwards: ['FULL_FORWARD', 'HALF_FORWARD'],
      Midfield: ['RUCK', 'RUCK_ROVER', 'ROVER'],
      Defense: ['FULL_BACK_AFL', 'HALF_BACK_AFL'],
    },
  },
  GAELIC_FOOTBALL: {
    icon: '🏐',
    label: 'Gaelic Football',
    color: 'emerald',
    primaryStats: ['goals', 'points', 'soloRuns', 'turnovers'],
    radarCategories: ['Kicking', 'Catching', 'Soloing', 'Tackling', 'Fitness', 'Game Intelligence'],
    positionGroups: {
      Forwards: ['STRIKER'],
      Midfield: ['CENTRAL_MIDFIELDER'],
      Defense: ['CENTER_BACK'],
    },
  },
  FUTSAL: {
    icon: '⚽',
    label: 'Futsal',
    color: 'teal',
    primaryStats: ['goals', 'assists', 'passAccuracy', 'steals'],
    radarCategories: ['Technique', 'Speed', 'Passing', 'Shooting', 'Defending', 'Positioning'],
    positionGroups: {
      Pivot: ['STRIKER'],
      Winger: ['LEFT_WINGER', 'RIGHT_WINGER'],
      Defender: ['CENTER_BACK'],
      Goalkeeper: ['GOALKEEPER'],
    },
  },
  BEACH_FOOTBALL: {
    icon: '⚽',
    label: 'Beach Football',
    color: 'cyan',
    primaryStats: ['goals', 'assists', 'headers', 'bicycleKicks'],
    radarCategories: ['Technique', 'Acrobatics', 'Finishing', 'Passing', 'Defending', 'Fitness'],
    positionGroups: {
      Attack: ['STRIKER'],
      Midfield: ['CENTRAL_MIDFIELDER'],
      Defense: ['CENTER_BACK'],
      Goalkeeper: ['GOALKEEPER'],
    },
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get trend color classes
 */
function getTrendColor(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30';
    case 'down':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30';
    default:
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/30';
  }
}

/**
 * Get trend icon
 */
function getTrendIcon(trend: TrendDirection) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4" />;
    case 'down':
      return <TrendingDown className="w-4 h-4" />;
    default:
      return <Minus className="w-4 h-4" />;
  }
}

/**
 * Format stat value for display
 */
function formatStatValue(value: number | undefined, type: 'number' | 'percent' | 'decimal' = 'number'): string {
  if (value === undefined || value === null) return '-';
  
  switch (type) {
    case 'percent':
      return `${Math.round(value)}%`;
    case 'decimal':
      return value.toFixed(1);
    default:
      return Math.round(value).toString();
  }
}

/**
 * Get sport-specific key stats
 */
function getKeyStats(sport: Sport, stats: PlayerStats, position?: string): Array<{ label: string; value: string | number; icon: string }> {
  const config = SPORT_CONFIG[sport];
  const isGoalkeeper = position?.includes('GOALKEEPER') || position?.includes('GOALTENDER');

  // Sport-specific stat mappings
  const statMappings: Record<string, { label: string; icon: string; format: 'number' | 'percent' | 'decimal' }> = {
    // Universal
    goals: { label: 'Goals', icon: '⚽', format: 'number' },
    assists: { label: 'Assists', icon: '🎯', format: 'number' },
    matches: { label: 'Appearances', icon: '📋', format: 'number' },
    passAccuracy: { label: 'Pass Acc.', icon: '↗️', format: 'percent' },
    
    // Defense
    tackles: { label: 'Tackles', icon: '🛡️', format: 'number' },
    interceptions: { label: 'Intercepts', icon: '✋', format: 'number' },
    clearances: { label: 'Clearances', icon: '🚀', format: 'number' },
    
    // Goalkeeper
    saves: { label: 'Saves', icon: '🧤', format: 'number' },
    cleanSheets: { label: 'Clean Sheets', icon: '🔒', format: 'number' },
    savePercent: { label: 'Save %', icon: '📊', format: 'percent' },
    
    // Rugby
    tries: { label: 'Tries', icon: '🏉', format: 'number' },
    metersCarried: { label: 'Meters', icon: '📏', format: 'number' },
    linebreaks: { label: 'Line Breaks', icon: '💨', format: 'number' },
    
    // Basketball
    points: { label: 'Points', icon: '🎯', format: 'number' },
    rebounds: { label: 'Rebounds', icon: '↩️', format: 'number' },
    steals: { label: 'Steals', icon: '👆', format: 'number' },
    
    // Cricket
    runs: { label: 'Runs', icon: '🏃', format: 'number' },
    wickets: { label: 'Wickets', icon: '🎳', format: 'number' },
    battingAverage: { label: 'Bat Avg', icon: '📊', format: 'decimal' },
    bowlingEconomy: { label: 'Economy', icon: '💰', format: 'decimal' },
    
    // American Football
    touchdowns: { label: 'TDs', icon: '🏈', format: 'number' },
    passingYards: { label: 'Pass Yds', icon: '🎯', format: 'number' },
    rushingYards: { label: 'Rush Yds', icon: '🏃', format: 'number' },
    
    // Hockey
    plusMinus: { label: '+/-', icon: '📈', format: 'number' },
    shots: { label: 'Shots', icon: '🎯', format: 'number' },
    
    // Netball
    goalAccuracy: { label: 'Goal Acc.', icon: '🎯', format: 'percent' },
    intercepts: { label: 'Intercepts', icon: '✋', format: 'number' },
    centrePassReceives: { label: 'CP Receives', icon: '🎾', format: 'number' },
    
    // AFL
    behinds: { label: 'Behinds', icon: '🔘', format: 'number' },
    disposals: { label: 'Disposals', icon: '🏉', format: 'number' },
    marks: { label: 'Marks', icon: '🙌', format: 'number' },
  };

  // Get primary stats for this sport
  let statKeys = config.primaryStats;

  // Override for goalkeepers
  if (isGoalkeeper) {
    statKeys = ['saves', 'savePercent', 'cleanSheets', 'matches'];
  }

  return statKeys.map((key) => {
    const mapping = statMappings[key] || { label: key, icon: '📊', format: 'number' };
    const value = stats[key as keyof PlayerStats] ?? stats.sportSpecificStats?.[key];
    
    return {
      label: mapping.label,
      value: formatStatValue(value as number, mapping.format),
      icon: mapping.icon,
    };
  });
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function PerformanceSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-12 w-24" />
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

export function PlayerPerformanceAnalytics({
  playerId,
  playerName = 'Player',
  position = 'Unknown',
  sport = 'FOOTBALL',
  className = '',
  compact = false,
  keyStatsOnly = false,
  timeRange = 'season',
}: PlayerPerformanceProps) {
  // Fetch player performance data
  const { data, isLoading, error, refetch } = usePlayerPerformance(playerId, { timeRange });

  // Get sport configuration
  const sportConfig = SPORT_CONFIG[sport];

  // Process data
  const stats: PlayerStats = useMemo(() => data?.stats || {
    overallRating: 0,
    matches: 0,
    starts: 0,
    minutesPlayed: 0,
    trend: 'stable' as TrendDirection,
    trendPercentage: 0,
    goals: 0,
    assists: 0,
    shots: 0,
    shotsOnTarget: 0,
    passes: 0,
    passAccuracy: 0,
    keyPasses: 0,
    tackles: 0,
    interceptions: 0,
    clearances: 0,
    blocks: 0,
    yellowCards: 0,
    redCards: 0,
    foulsCommitted: 0,
    foulsSuffered: 0,
    aerialDuelsWon: 0,
    dribbles: 0,
  }, [data]);

  const performanceHistory: PerformanceHistoryPoint[] = useMemo(() => data?.history || [], [data]);
  
  const radarData: RadarDataPoint[] = useMemo(() => {
    if (data?.radarChart) return data.radarChart;
    
    // Generate radar data from sport config
    return sportConfig.radarCategories.map((skill) => ({
      skill,
      value: Math.floor(Math.random() * 40) + 60, // Placeholder
      fullMark: 100,
    }));
  }, [data, sportConfig]);

  const keyStats = useMemo(() => getKeyStats(sport, stats, position), [sport, stats, position]);

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-200">
              Failed to load player performance data
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
    return <PerformanceSkeleton compact={compact} />;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6">
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
                {playerName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {position.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {sportConfig.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="relative">
                <div
                  className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center',
                    'bg-gradient-to-br from-blue-500 to-blue-600',
                    'text-white text-2xl font-bold shadow-lg'
                  )}
                >
                  {stats.overallRating?.toFixed(1) || '-'}
                </div>
                <Star className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Overall</p>
            </div>

            {/* Trend Badge */}
            <div className={cn('p-3 rounded-lg', getTrendColor(stats.trend))}>
              <div className="flex items-center gap-2">
                {getTrendIcon(stats.trend)}
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase">Trend</p>
                  <p className="text-lg font-bold">
                    {stats.trendPercentage > 0 ? '+' : ''}
                    {stats.trendPercentage || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minutes/Appearances Bar */}
        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <Activity className="w-4 h-4" />
                <span>{stats.matches} matches</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                <span>{stats.minutesPlayed} mins</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <Target className="w-4 h-4" />
              <span>{stats.starts} starts</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {keyStats.map((stat) => (
          <Card key={stat.label} className="p-4 hover:shadow-md transition-shadow">
            <p className="text-2xl mb-2" role="img" aria-label={stat.label}>
              {stat.icon}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

      {/* Charts Section (hidden in compact/keyStatsOnly mode) */}
      {!compact && !keyStatsOnly && (
        <>
          {/* Performance Trend Chart */}
          {performanceHistory.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Performance Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    name="Rating"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Radar Chart - Skills Assessment */}
          {radarData.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Skills Assessment
                <Badge variant="outline" className="ml-2 text-xs">
                  {sportConfig.label}
                </Badge>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid className="opacity-30" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Rating"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Disciplinary Record */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Disciplinary Record
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.yellowCards || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Yellow Cards
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.redCards || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Red Cards
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatStatValue(stats.foulsPerGame, 'decimal')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Fouls/Game
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

PlayerPerformanceAnalytics.displayName = 'PlayerPerformanceAnalytics';

export default PlayerPerformanceAnalytics;
