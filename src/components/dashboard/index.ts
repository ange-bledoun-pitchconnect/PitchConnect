/**
 * ============================================================================
 * Dashboard Components - Enterprise Library
 * ============================================================================
 * 
 * Multi-sport dashboard components aligned with PitchConnect Schema v7.10.1
 * 
 * @version 2.0.0
 * 
 * SUPPORTED SPORTS (12):
 * - FOOTBALL, NETBALL, RUGBY, CRICKET, AMERICAN_FOOTBALL
 * - BASKETBALL, HOCKEY, LACROSSE, AUSTRALIAN_RULES
 * - GAELIC_FOOTBALL, FUTSAL, BEACH_FOOTBALL
 * 
 * ============================================================================
 */

// Config
export {
  SPORT_DASHBOARD_CONFIGS,
  getSportConfig,
  getSportEventTypes,
  getSportStatistics,
  getSportFormations,
  getScoringTerm,
  sportHasDraws,
  getAllSports,
  type Sport,
  type SportDashboardConfig,
  type MatchEventType,
  type SportStatistic,
  type FormationConfig,
  type EventCategory,
} from '../config/sport-dashboard-config';

// Data Table
export {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
} from './DataTable';

// Event Logger
export {
  EventLogger,
  type EventLoggerProps,
  type MatchEvent,
  type Player as EventPlayer,
  type Team as EventTeam,
} from './EventLogger';

// Event Timeline
export {
  EventTimeline,
  type EventTimelineProps,
  type TimelineEvent,
} from './EventTimeline';

// Filter Bar
export {
  FilterBar,
  type FilterBarProps,
} from './FilterBar';

// Lineup Card
export {
  LineupCard,
  type LineupCardProps,
  type LineupPlayer,
} from './LineupCard';

// Live Stats
export {
  LiveStats,
  CompactStatBar,
  type LiveStatsProps,
  type TeamStats as LiveTeamStats,
} from './LiveStats';

// Player Card
export {
  PlayerCard,
  type PlayerCardProps,
  type Player,
  type PlayerStats,
  type PlayerInjury,
  type PlayerContract,
  type PlayerStatus,
} from './PlayerCard';

// Player Comparison
export {
  PlayerComparison,
  type PlayerComparisonProps,
  type ComparisonPlayer,
} from './PlayerComparison';

// Player Stats Card
export {
  PlayerStatsCard,
  type PlayerStatsCardProps,
} from './PlayerStatsCard';

// Score Board
export {
  ScoreBoard,
  type ScoreBoardProps,
} from './ScoreBoard';

// State Components (Loading, Empty, Error)
export {
  LoadingState,
  SkeletonLoader,
  SkeletonCard,
  EmptyState,
  ErrorState,
  type LoadingStateProps,
  type EmptyStateProps,
  type ErrorStateProps,
} from './StateComponents';

// Statistics Grid
export {
  StatisticsGrid,
  type StatisticsGridProps,
} from './StatisticsGrid';

// Team Analytics
export {
  TeamAnalytics,
  type TeamAnalyticsProps,
  type TeamRecord,
  type TeamScoring,
  type TeamStats,
  type FormResult,
} from './TeamAnalytics';

// Chart Components
export {
  KPICard,
  LineChart,
  PerformanceChart,
  type KPICardProps,
  type LineChartProps,
  type LineChartDataPoint,
  type PerformanceChartProps,
  type PerformanceChartData,
} from './ChartComponents';

// Live Matches
export {
  LiveMatches,
  type LiveMatchesProps,
  type Match,
  type MatchResult,
  type MatchStats,
  type Club,
  type MatchStatus,
} from './LiveMatches';

// Live Standings
export {
  LiveStandings,
  type LiveStandingsProps,
  type Standing,
  type StandingClub,
  type LeagueZone,
} from './LiveStandings';

// Match Detail Modal
export {
  MatchDetailModal,
  type MatchDetailModalProps,
  type MatchDetail,
  type MatchTeam,
} from './MatchDetailModal';
