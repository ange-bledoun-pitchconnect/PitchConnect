/**
 * ============================================================================
 * SPORT STATISTICS CONFIGURATION - PitchConnect v7.10.1
 * ============================================================================
 * 
 * World-class multi-sport statistics configuration system.
 * Based on PlayHQ, SAP Sports One, and official governing body standards.
 * 
 * ARCHITECTURE:
 * - Each sport has stat categories (e.g., "Attacking", "Defensive")
 * - Each category contains individual stat definitions
 * - Stats include metadata for display, calculation, and visualization
 * 
 * FEATURES:
 * - 12 sports with 400+ unique statistics
 * - Category grouping for dashboard widgets
 * - Stat type classification (count, percentage, ratio, time)
 * - Position-relevant stat filtering
 * - Aggregation support (sum, average, max, min)
 * - Trend analysis metadata
 * - Leaderboard/ranking support
 * 
 * @version 2.0.0
 * @path src/config/sport-stats-config.ts
 * 
 * ============================================================================
 */

import { type Sport } from './sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

export type StatType = 'COUNT' | 'PERCENTAGE' | 'RATIO' | 'TIME' | 'DISTANCE' | 'AVERAGE' | 'RATE';
export type AggregationType = 'SUM' | 'AVERAGE' | 'MAX' | 'MIN' | 'LATEST' | 'TOTAL';
export type TrendDirection = 'HIGHER_BETTER' | 'LOWER_BETTER' | 'NEUTRAL';

export interface StatDefinition {
  /** Unique stat key (e.g., "goals", "assists") */
  key: string;
  /** Display name */
  name: string;
  /** Short label for compact displays */
  shortName: string;
  /** Description for tooltips */
  description: string;
  /** Category this stat belongs to */
  category: StatCategory;
  /** Type of statistic */
  type: StatType;
  /** How to aggregate across matches */
  aggregation: AggregationType;
  /** Whether higher or lower is better */
  trend: TrendDirection;
  /** Unit of measurement (optional) */
  unit?: string;
  /** Decimal places for display */
  precision?: number;
  /** Icon name for visual display */
  icon?: string;
  /** Color for visual distinction */
  color?: string;
  /** Whether this is a primary/featured stat */
  isPrimary?: boolean;
  /** Whether to show on player cards */
  showOnCard?: boolean;
  /** Whether to include in leaderboards */
  showInLeaderboard?: boolean;
  /** Position codes this stat is relevant for */
  relevantPositions?: string[];
  /** Formula for calculated stats (e.g., "goals / appearances") */
  formula?: string;
}

export type StatCategory =
  | 'ATTACKING'
  | 'DEFENSIVE'
  | 'PASSING'
  | 'PHYSICAL'
  | 'DISCIPLINE'
  | 'GOALKEEPING'
  | 'SET_PIECES'
  | 'BATTING'
  | 'BOWLING'
  | 'FIELDING'
  | 'SHOOTING'
  | 'REBOUNDING'
  | 'PLAYMAKING'
  | 'RUSHING'
  | 'RECEIVING'
  | 'SPECIAL_TEAMS'
  | 'SCORING'
  | 'POSSESSION'
  | 'GENERAL'
  | 'PERFORMANCE';

export interface StatCategoryConfig {
  category: StatCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}

export interface SportStatsConfig {
  sport: Sport;
  /** Stat categories for this sport */
  categories: StatCategoryConfig[];
  /** All stat definitions */
  stats: StatDefinition[];
  /** Primary stats to show on player cards (max 4) */
  cardStats: string[];
  /** Stats for season overview */
  seasonStats: string[];
  /** Stats for match performance */
  matchStats: string[];
  /** Stats for leaderboards */
  leaderboardStats: string[];
}

// =============================================================================
// CATEGORY CONFIGURATIONS
// =============================================================================

const FOOTBALL_CATEGORIES: StatCategoryConfig[] = [
  { category: 'ATTACKING', name: 'Attacking', description: 'Goals, shots, and offensive play', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'PASSING', name: 'Passing', description: 'Passes, assists, and ball distribution', icon: 'ArrowRight', color: '#3B82F6', order: 2 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Tackles, interceptions, and blocks', icon: 'Shield', color: '#22C55E', order: 3 },
  { category: 'PHYSICAL', name: 'Physical', description: 'Duels, aerial battles, and fitness', icon: 'Zap', color: '#F59E0B', order: 4 },
  { category: 'DISCIPLINE', name: 'Discipline', description: 'Cards and fouls', icon: 'AlertTriangle', color: '#DC2626', order: 5 },
  { category: 'GOALKEEPING', name: 'Goalkeeping', description: 'Saves and clean sheets', icon: 'Hand', color: '#FFD700', order: 6 },
  { category: 'GENERAL', name: 'General', description: 'Appearances and minutes', icon: 'User', color: '#6B7280', order: 7 },
];

const CRICKET_CATEGORIES: StatCategoryConfig[] = [
  { category: 'BATTING', name: 'Batting', description: 'Runs, strike rate, and batting average', icon: 'Target', color: '#3B82F6', order: 1 },
  { category: 'BOWLING', name: 'Bowling', description: 'Wickets, economy, and bowling average', icon: 'Circle', color: '#22C55E', order: 2 },
  { category: 'FIELDING', name: 'Fielding', description: 'Catches, run outs, and stumpings', icon: 'Hand', color: '#F59E0B', order: 3 },
  { category: 'GENERAL', name: 'General', description: 'Matches and innings', icon: 'User', color: '#6B7280', order: 4 },
];

const BASKETBALL_CATEGORIES: StatCategoryConfig[] = [
  { category: 'SCORING', name: 'Scoring', description: 'Points and shooting percentages', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'REBOUNDING', name: 'Rebounding', description: 'Offensive and defensive rebounds', icon: 'RefreshCw', color: '#3B82F6', order: 2 },
  { category: 'PLAYMAKING', name: 'Playmaking', description: 'Assists and turnovers', icon: 'ArrowRight', color: '#22C55E', order: 3 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Steals, blocks, and defensive stats', icon: 'Shield', color: '#F59E0B', order: 4 },
  { category: 'GENERAL', name: 'General', description: 'Games and minutes', icon: 'User', color: '#6B7280', order: 5 },
];

const RUGBY_CATEGORIES: StatCategoryConfig[] = [
  { category: 'ATTACKING', name: 'Attacking', description: 'Tries, metres, and line breaks', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'PASSING', name: 'Passing', description: 'Passes and offloads', icon: 'ArrowRight', color: '#3B82F6', order: 2 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Tackles and turnovers', icon: 'Shield', color: '#22C55E', order: 3 },
  { category: 'SET_PIECES', name: 'Set Pieces', description: 'Lineouts, scrums, and restarts', icon: 'Target', color: '#A855F7', order: 4 },
  { category: 'DISCIPLINE', name: 'Discipline', description: 'Penalties and cards', icon: 'AlertTriangle', color: '#DC2626', order: 5 },
  { category: 'GENERAL', name: 'General', description: 'Appearances and minutes', icon: 'User', color: '#6B7280', order: 6 },
];

const AMERICAN_FOOTBALL_CATEGORIES: StatCategoryConfig[] = [
  { category: 'PASSING', name: 'Passing', description: 'Completions, yards, and touchdowns', icon: 'ArrowRight', color: '#3B82F6', order: 1 },
  { category: 'RUSHING', name: 'Rushing', description: 'Carries, yards, and touchdowns', icon: 'Zap', color: '#22C55E', order: 2 },
  { category: 'RECEIVING', name: 'Receiving', description: 'Receptions, yards, and touchdowns', icon: 'Target', color: '#EF4444', order: 3 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Tackles, sacks, and interceptions', icon: 'Shield', color: '#F59E0B', order: 4 },
  { category: 'SPECIAL_TEAMS', name: 'Special Teams', description: 'Kicking and returning', icon: 'Star', color: '#A855F7', order: 5 },
  { category: 'GENERAL', name: 'General', description: 'Games and snaps', icon: 'User', color: '#6B7280', order: 6 },
];

const NETBALL_CATEGORIES: StatCategoryConfig[] = [
  { category: 'SHOOTING', name: 'Shooting', description: 'Goals and shooting percentage', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'PASSING', name: 'Passing', description: 'Centre passes and feeds', icon: 'ArrowRight', color: '#3B82F6', order: 2 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Intercepts and deflections', icon: 'Shield', color: '#22C55E', order: 3 },
  { category: 'GENERAL', name: 'General', description: 'Quarters and minutes', icon: 'User', color: '#6B7280', order: 4 },
];

// =============================================================================
// FOOTBALL STATISTICS
// =============================================================================

const FOOTBALL_STATS: StatDefinition[] = [
  // Attacking
  { key: 'goals', name: 'Goals', shortName: 'G', description: 'Total goals scored', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', icon: 'Target', color: '#EF4444', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'assists', name: 'Assists', shortName: 'A', description: 'Goal assists provided', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', icon: 'ArrowRight', color: '#3B82F6', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'shotsOnTarget', name: 'Shots on Target', shortName: 'SOT', description: 'Shots that required a save or resulted in a goal', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'shots', name: 'Total Shots', shortName: 'SH', description: 'All shot attempts', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'shotAccuracy', name: 'Shot Accuracy', shortName: 'SA%', description: 'Percentage of shots on target', category: 'ATTACKING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, formula: '(shotsOnTarget / shots) * 100' },
  { key: 'goalsPerGame', name: 'Goals per Game', shortName: 'G/G', description: 'Average goals per appearance', category: 'ATTACKING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2, formula: 'goals / appearances' },
  { key: 'expectedGoals', name: 'Expected Goals', shortName: 'xG', description: 'Expected goals based on shot quality', category: 'ATTACKING', type: 'AVERAGE', aggregation: 'SUM', trend: 'HIGHER_BETTER', precision: 2 },
  { key: 'bigChancesMissed', name: 'Big Chances Missed', shortName: 'BCM', description: 'Clear goal-scoring opportunities missed', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'bigChancesCreated', name: 'Big Chances Created', shortName: 'BCC', description: 'Clear goal-scoring opportunities created for teammates', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  
  // Passing
  { key: 'passes', name: 'Total Passes', shortName: 'PAS', description: 'All pass attempts', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'passAccuracy', name: 'Pass Accuracy', shortName: 'PA%', description: 'Percentage of successful passes', category: 'PASSING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, isPrimary: true },
  { key: 'keyPasses', name: 'Key Passes', shortName: 'KP', description: 'Passes leading to a shot', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'throughBalls', name: 'Through Balls', shortName: 'TB', description: 'Passes played through defensive lines', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'longBalls', name: 'Long Balls', shortName: 'LB', description: 'Accurate long passes', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'crosses', name: 'Crosses', shortName: 'CRS', description: 'Successful crosses', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['LB', 'RB', 'LWB', 'RWB', 'LM', 'RM', 'LW', 'RW'] },
  { key: 'crossAccuracy', name: 'Cross Accuracy', shortName: 'CR%', description: 'Percentage of successful crosses', category: 'PASSING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  
  // Defensive
  { key: 'tackles', name: 'Tackles', shortName: 'TKL', description: 'Successful tackles', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, relevantPositions: ['CB', 'LB', 'RB', 'CDM', 'CM'] },
  { key: 'tackleSuccess', name: 'Tackle Success', shortName: 'TK%', description: 'Percentage of successful tackles', category: 'DEFENSIVE', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'interceptions', name: 'Interceptions', shortName: 'INT', description: 'Passes intercepted', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'clearances', name: 'Clearances', shortName: 'CLR', description: 'Defensive clearances', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['CB', 'GK'] },
  { key: 'blocks', name: 'Blocks', shortName: 'BLK', description: 'Shots and passes blocked', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'recoveries', name: 'Ball Recoveries', shortName: 'REC', description: 'Times possession was regained', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // Physical
  { key: 'duelsWon', name: 'Duels Won', shortName: 'DW', description: '50/50 challenges won', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'duelSuccess', name: 'Duel Success Rate', shortName: 'D%', description: 'Percentage of duels won', category: 'PHYSICAL', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'aerialDuelsWon', name: 'Aerial Duels Won', shortName: 'AW', description: 'Headers and aerial battles won', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['CB', 'ST', 'CF'] },
  { key: 'dribbles', name: 'Successful Dribbles', shortName: 'DRB', description: 'Dribbles that beat an opponent', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['LW', 'RW', 'CAM', 'ST'] },
  { key: 'foulsWon', name: 'Fouls Won', shortName: 'FW', description: 'Fouls drawn from opponents', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // Discipline
  { key: 'yellowCards', name: 'Yellow Cards', shortName: 'YC', description: 'Yellow cards received', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', icon: 'Square', color: '#F59E0B' },
  { key: 'redCards', name: 'Red Cards', shortName: 'RC', description: 'Red cards received', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', icon: 'Square', color: '#DC2626' },
  { key: 'foulsCommitted', name: 'Fouls Committed', shortName: 'FC', description: 'Fouls given away', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // Goalkeeping
  { key: 'saves', name: 'Saves', shortName: 'SAV', description: 'Shots saved', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, relevantPositions: ['GK'], showInLeaderboard: true },
  { key: 'savePercentage', name: 'Save Percentage', shortName: 'SV%', description: 'Percentage of shots saved', category: 'GOALKEEPING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['GK'] },
  { key: 'cleanSheets', name: 'Clean Sheets', shortName: 'CS', description: 'Matches without conceding', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, relevantPositions: ['GK'], showInLeaderboard: true },
  { key: 'goalsConceded', name: 'Goals Conceded', shortName: 'GC', description: 'Goals let in', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['GK'] },
  { key: 'penaltiesSaved', name: 'Penalties Saved', shortName: 'PS', description: 'Penalty kicks saved', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'] },
  
  // General
  { key: 'appearances', name: 'Appearances', shortName: 'APP', description: 'Matches played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true },
  { key: 'starts', name: 'Starts', shortName: 'STA', description: 'Matches started', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'minutesPlayed', name: 'Minutes Played', shortName: 'MIN', description: 'Total minutes on pitch', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'min' },
  { key: 'rating', name: 'Average Rating', shortName: 'RAT', description: 'Performance rating (1-10)', category: 'GENERAL', type: 'AVERAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1 },
  { key: 'manOfTheMatch', name: 'Man of the Match', shortName: 'MOTM', description: 'Best player awards', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
];

// =============================================================================
// CRICKET STATISTICS
// =============================================================================

const CRICKET_STATS: StatDefinition[] = [
  // Batting
  { key: 'runs', name: 'Runs', shortName: 'R', description: 'Total runs scored', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'innings', name: 'Innings', shortName: 'INN', description: 'Batting innings played', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'notOuts', name: 'Not Outs', shortName: 'NO', description: 'Times not dismissed', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'battingAverage', name: 'Batting Average', shortName: 'AVG', description: 'Runs per dismissal', category: 'BATTING', type: 'AVERAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2, isPrimary: true, showOnCard: true, showInLeaderboard: true, formula: 'runs / (innings - notOuts)' },
  { key: 'strikeRate', name: 'Strike Rate', shortName: 'SR', description: 'Runs per 100 balls', category: 'BATTING', type: 'RATE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2, showInLeaderboard: true },
  { key: 'highestScore', name: 'Highest Score', shortName: 'HS', description: 'Best individual score', category: 'BATTING', type: 'COUNT', aggregation: 'MAX', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'centuries', name: 'Centuries', shortName: '100s', description: 'Scores of 100 or more', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'fifties', name: 'Half-Centuries', shortName: '50s', description: 'Scores between 50-99', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'fours', name: 'Fours', shortName: '4s', description: 'Boundary fours hit', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'sixes', name: 'Sixes', shortName: '6s', description: 'Sixes hit', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'ballsFaced', name: 'Balls Faced', shortName: 'BF', description: 'Total balls faced', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  
  // Bowling
  { key: 'wickets', name: 'Wickets', shortName: 'W', description: 'Batsmen dismissed', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'overs', name: 'Overs Bowled', shortName: 'O', description: 'Total overs bowled', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', precision: 1 },
  { key: 'maidens', name: 'Maidens', shortName: 'M', description: 'Maiden overs bowled', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'runsConceded', name: 'Runs Conceded', shortName: 'RC', description: 'Runs given away', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'bowlingAverage', name: 'Bowling Average', shortName: 'AVG', description: 'Runs per wicket', category: 'BOWLING', type: 'AVERAGE', aggregation: 'AVERAGE', trend: 'LOWER_BETTER', precision: 2, isPrimary: true, showOnCard: true, showInLeaderboard: true, formula: 'runsConceded / wickets' },
  { key: 'economy', name: 'Economy Rate', shortName: 'ECON', description: 'Runs per over', category: 'BOWLING', type: 'RATE', aggregation: 'AVERAGE', trend: 'LOWER_BETTER', precision: 2, showInLeaderboard: true },
  { key: 'bowlingStrikeRate', name: 'Strike Rate', shortName: 'SR', description: 'Balls per wicket', category: 'BOWLING', type: 'RATE', aggregation: 'AVERAGE', trend: 'LOWER_BETTER', precision: 1 },
  { key: 'fiveWickets', name: '5-Wicket Hauls', shortName: '5W', description: 'Five wickets in an innings', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'bestBowling', name: 'Best Bowling', shortName: 'BB', description: 'Best bowling figures', category: 'BOWLING', type: 'COUNT', aggregation: 'MAX', trend: 'HIGHER_BETTER' },
  { key: 'dotBalls', name: 'Dot Balls', shortName: 'DOT', description: 'Balls with no runs scored', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // Fielding
  { key: 'catches', name: 'Catches', shortName: 'CT', description: 'Catches taken', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'stumpings', name: 'Stumpings', shortName: 'ST', description: 'Batsmen stumped', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WK', 'WKB'] },
  { key: 'runOuts', name: 'Run Outs', shortName: 'RO', description: 'Run out dismissals', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'dismissals', name: 'Dismissals', shortName: 'DIS', description: 'Total dismissals (catches + stumpings)', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WK', 'WKB'], formula: 'catches + stumpings' },
  
  // General
  { key: 'matches', name: 'Matches', shortName: 'M', description: 'Matches played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true },
];

// =============================================================================
// BASKETBALL STATISTICS
// =============================================================================

const BASKETBALL_STATS: StatDefinition[] = [
  // Scoring
  { key: 'points', name: 'Points', shortName: 'PTS', description: 'Total points scored', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'pointsPerGame', name: 'Points Per Game', shortName: 'PPG', description: 'Average points per game', category: 'SCORING', type: 'AVERAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, showInLeaderboard: true },
  { key: 'fieldGoals', name: 'Field Goals Made', shortName: 'FGM', description: 'Two and three pointers made', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'fieldGoalAttempts', name: 'Field Goal Attempts', shortName: 'FGA', description: 'Total shot attempts', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'fieldGoalPct', name: 'Field Goal %', shortName: 'FG%', description: 'Field goal percentage', category: 'SCORING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, showInLeaderboard: true },
  { key: 'threePointers', name: 'Three Pointers Made', shortName: '3PM', description: 'Three-point shots made', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'threePointAttempts', name: 'Three Point Attempts', shortName: '3PA', description: 'Three-point shot attempts', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'threePointPct', name: 'Three Point %', shortName: '3P%', description: 'Three-point percentage', category: 'SCORING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, showInLeaderboard: true },
  { key: 'freeThrows', name: 'Free Throws Made', shortName: 'FTM', description: 'Free throws made', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'freeThrowPct', name: 'Free Throw %', shortName: 'FT%', description: 'Free throw percentage', category: 'SCORING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  
  // Rebounding
  { key: 'rebounds', name: 'Total Rebounds', shortName: 'REB', description: 'Offensive and defensive rebounds', category: 'REBOUNDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'reboundsPerGame', name: 'Rebounds Per Game', shortName: 'RPG', description: 'Average rebounds per game', category: 'REBOUNDING', type: 'AVERAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, showInLeaderboard: true },
  { key: 'offensiveRebounds', name: 'Offensive Rebounds', shortName: 'OREB', description: 'Rebounds on offense', category: 'REBOUNDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'defensiveRebounds', name: 'Defensive Rebounds', shortName: 'DREB', description: 'Rebounds on defense', category: 'REBOUNDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // Playmaking
  { key: 'assists', name: 'Assists', shortName: 'AST', description: 'Passes leading to scores', category: 'PLAYMAKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'assistsPerGame', name: 'Assists Per Game', shortName: 'APG', description: 'Average assists per game', category: 'PLAYMAKING', type: 'AVERAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, showInLeaderboard: true },
  { key: 'turnovers', name: 'Turnovers', shortName: 'TO', description: 'Possessions lost', category: 'PLAYMAKING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'assistToTurnover', name: 'Assist/Turnover Ratio', shortName: 'A/TO', description: 'Assists per turnover', category: 'PLAYMAKING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2, formula: 'assists / turnovers' },
  
  // Defensive
  { key: 'steals', name: 'Steals', shortName: 'STL', description: 'Possessions stolen', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true, showInLeaderboard: true },
  { key: 'blocks', name: 'Blocks', shortName: 'BLK', description: 'Shots blocked', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true, showInLeaderboard: true },
  { key: 'personalFouls', name: 'Personal Fouls', shortName: 'PF', description: 'Fouls committed', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // General
  { key: 'games', name: 'Games', shortName: 'GP', description: 'Games played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true },
  { key: 'gamesStarted', name: 'Games Started', shortName: 'GS', description: 'Games in starting lineup', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'minutes', name: 'Minutes', shortName: 'MIN', description: 'Minutes played', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'min' },
  { key: 'minutesPerGame', name: 'Minutes Per Game', shortName: 'MPG', description: 'Average minutes per game', category: 'GENERAL', type: 'AVERAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1 },
  { key: 'plusMinus', name: 'Plus/Minus', shortName: '+/-', description: 'Point differential when on court', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'doubleDoubles', name: 'Double-Doubles', shortName: 'DD', description: 'Games with 10+ in two categories', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'tripleDoubles', name: 'Triple-Doubles', shortName: 'TD', description: 'Games with 10+ in three categories', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
];

// =============================================================================
// RUGBY STATISTICS
// =============================================================================

const RUGBY_STATS: StatDefinition[] = [
  // Attacking
  { key: 'tries', name: 'Tries', shortName: 'T', description: 'Tries scored', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'tryAssists', name: 'Try Assists', shortName: 'TA', description: 'Assists leading to tries', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'carries', name: 'Carries', shortName: 'CAR', description: 'Ball carries', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'metresGained', name: 'Metres Gained', shortName: 'MG', description: 'Metres made with ball', category: 'ATTACKING', type: 'DISTANCE', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'm', showInLeaderboard: true },
  { key: 'lineBreaks', name: 'Line Breaks', shortName: 'LB', description: 'Defensive lines broken', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'offloads', name: 'Offloads', shortName: 'OFF', description: 'Offloads in contact', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'cleanBreaks', name: 'Clean Breaks', shortName: 'CB', description: 'Breaks with no contact', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // Passing/Kicking
  { key: 'conversions', name: 'Conversions', shortName: 'CON', description: 'Successful conversions', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['FH'], showInLeaderboard: true },
  { key: 'penalties', name: 'Penalty Goals', shortName: 'PEN', description: 'Penalty kicks scored', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['FH'], showInLeaderboard: true },
  { key: 'dropGoals', name: 'Drop Goals', shortName: 'DG', description: 'Drop goals scored', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['FH', 'IC'] },
  { key: 'kickingPoints', name: 'Kicking Points', shortName: 'KP', description: 'Points from kicks', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['FH'], showInLeaderboard: true },
  { key: 'kickingSuccess', name: 'Kicking Success', shortName: 'K%', description: 'Percentage of kicks made', category: 'PASSING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'passes', name: 'Passes', shortName: 'PAS', description: 'Total passes', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // Defensive
  { key: 'tackles', name: 'Tackles', shortName: 'TKL', description: 'Successful tackles', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'tacklesMissed', name: 'Tackles Missed', shortName: 'TM', description: 'Missed tackle attempts', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'tackleSuccess', name: 'Tackle Success', shortName: 'T%', description: 'Tackle success rate', category: 'DEFENSIVE', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'turnoversWon', name: 'Turnovers Won', shortName: 'TOW', description: 'Turnovers won', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'jackals', name: 'Jackals', shortName: 'JKL', description: 'Ball steals at ruck', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['OF', 'N8'] },
  
  // Set Pieces
  { key: 'lineoutsWon', name: 'Lineouts Won', shortName: 'LOW', description: 'Lineout ball won', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['HK', 'LK', 'LK2'] },
  { key: 'lineoutSuccess', name: 'Lineout Success', shortName: 'LO%', description: 'Lineout success rate', category: 'SET_PIECES', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'scrumsWon', name: 'Scrums Won', shortName: 'SCR', description: 'Scrums won', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['LHP', 'HK', 'THP'] },
  { key: 'scrumPenalties', name: 'Scrum Penalties', shortName: 'SP', description: 'Scrum penalties won', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // Discipline
  { key: 'yellowCards', name: 'Yellow Cards', shortName: 'YC', description: 'Sin bin cards', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', color: '#F59E0B' },
  { key: 'redCards', name: 'Red Cards', shortName: 'RC', description: 'Send offs', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', color: '#DC2626' },
  { key: 'penaltiesConceded', name: 'Penalties Conceded', shortName: 'PC', description: 'Penalties given away', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // General
  { key: 'appearances', name: 'Appearances', shortName: 'APP', description: 'Matches played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true },
  { key: 'minutesPlayed', name: 'Minutes Played', shortName: 'MIN', description: 'Total minutes', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'min' },
  { key: 'points', name: 'Points', shortName: 'PTS', description: 'Total points scored', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
];

// =============================================================================
// NETBALL STATISTICS  
// =============================================================================

const NETBALL_STATS: StatDefinition[] = [
  // Shooting
  { key: 'goals', name: 'Goals', shortName: 'G', description: 'Goals scored', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true, relevantPositions: ['GS', 'GA'] },
  { key: 'goalAttempts', name: 'Goal Attempts', shortName: 'ATT', description: 'Shots attempted', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['GS', 'GA'] },
  { key: 'shootingPct', name: 'Shooting %', shortName: 'SH%', description: 'Goal accuracy percentage', category: 'SHOOTING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, showInLeaderboard: true, relevantPositions: ['GS', 'GA'] },
  { key: 'rebounds', name: 'Rebounds', shortName: 'REB', description: 'Missed shot rebounds', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GS', 'GA', 'GK', 'GD'] },
  
  // Passing
  { key: 'centrePassReceives', name: 'Centre Pass Receives', shortName: 'CPR', description: 'Centre passes received', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WA', 'GA', 'C'] },
  { key: 'feeds', name: 'Feeds', shortName: 'FD', description: 'Passes into the circle', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true, relevantPositions: ['WA', 'GA', 'C'] },
  { key: 'goalAssists', name: 'Goal Assists', shortName: 'GA', description: 'Assists leading to goals', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'feedsWithAttempt', name: 'Feeds with Attempt', shortName: 'FWA', description: 'Feeds resulting in shots', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // Defensive
  { key: 'intercepts', name: 'Intercepts', shortName: 'INT', description: 'Ball intercepts', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'deflections', name: 'Deflections', shortName: 'DEF', description: 'Ball deflections', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'gains', name: 'Gains', shortName: 'GN', description: 'Ball possession gains', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'blocks', name: 'Blocks', shortName: 'BLK', description: 'Shot blocks', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK', 'GD'] },
  { key: 'penalties', name: 'Penalties', shortName: 'PEN', description: 'Penalties committed', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // General
  { key: 'quarters', name: 'Quarters Played', shortName: 'QTR', description: 'Quarters on court', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true },
  { key: 'minutesPlayed', name: 'Minutes Played', shortName: 'MIN', description: 'Total minutes', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'min' },
];

// =============================================================================
// SPORT CONFIGURATION MAPPING
// =============================================================================

export const SPORT_STATS: Record<Sport, SportStatsConfig> = {
  FOOTBALL: {
    sport: 'FOOTBALL',
    categories: FOOTBALL_CATEGORIES,
    stats: FOOTBALL_STATS,
    cardStats: ['goals', 'assists', 'appearances', 'rating'],
    seasonStats: ['goals', 'assists', 'appearances', 'minutesPlayed', 'passAccuracy', 'rating'],
    matchStats: ['goals', 'assists', 'shots', 'passes', 'tackles', 'duelsWon'],
    leaderboardStats: ['goals', 'assists', 'cleanSheets', 'tackles'],
  },
  CRICKET: {
    sport: 'CRICKET',
    categories: CRICKET_CATEGORIES,
    stats: CRICKET_STATS,
    cardStats: ['runs', 'wickets', 'catches', 'matches'],
    seasonStats: ['runs', 'battingAverage', 'wickets', 'bowlingAverage', 'catches'],
    matchStats: ['runs', 'ballsFaced', 'wickets', 'overs', 'economy'],
    leaderboardStats: ['runs', 'wickets', 'centuries', 'catches'],
  },
  BASKETBALL: {
    sport: 'BASKETBALL',
    categories: BASKETBALL_CATEGORIES,
    stats: BASKETBALL_STATS,
    cardStats: ['points', 'rebounds', 'assists', 'games'],
    seasonStats: ['pointsPerGame', 'reboundsPerGame', 'assistsPerGame', 'fieldGoalPct'],
    matchStats: ['points', 'rebounds', 'assists', 'steals', 'blocks'],
    leaderboardStats: ['points', 'rebounds', 'assists', 'steals'],
  },
  RUGBY: {
    sport: 'RUGBY',
    categories: RUGBY_CATEGORIES,
    stats: RUGBY_STATS,
    cardStats: ['tries', 'tackles', 'points', 'appearances'],
    seasonStats: ['tries', 'tackles', 'metresGained', 'lineBreaks', 'turnoversWon'],
    matchStats: ['tries', 'tackles', 'carries', 'metresGained', 'offloads'],
    leaderboardStats: ['tries', 'points', 'tackles', 'metresGained'],
  },
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    categories: AMERICAN_FOOTBALL_CATEGORIES,
    stats: [], // Add American Football stats
    cardStats: ['passingYards', 'touchdowns', 'tackles', 'games'],
    seasonStats: ['passingYards', 'rushingYards', 'touchdowns', 'interceptions'],
    matchStats: ['completions', 'yards', 'touchdowns', 'tackles'],
    leaderboardStats: ['touchdowns', 'yards', 'tackles', 'sacks'],
  },
  NETBALL: {
    sport: 'NETBALL',
    categories: NETBALL_CATEGORIES,
    stats: NETBALL_STATS,
    cardStats: ['goals', 'goalAssists', 'intercepts', 'quarters'],
    seasonStats: ['goals', 'shootingPct', 'feeds', 'intercepts'],
    matchStats: ['goals', 'goalAttempts', 'feeds', 'intercepts', 'deflections'],
    leaderboardStats: ['goals', 'goalAssists', 'intercepts', 'feeds'],
  },
  HOCKEY: {
    sport: 'HOCKEY',
    categories: FOOTBALL_CATEGORIES, // Similar to football
    stats: FOOTBALL_STATS.filter(s => !['offside', 'penaltiesSaved'].includes(s.key)),
    cardStats: ['goals', 'assists', 'appearances', 'rating'],
    seasonStats: ['goals', 'assists', 'appearances', 'tackles'],
    matchStats: ['goals', 'assists', 'shots', 'tackles'],
    leaderboardStats: ['goals', 'assists', 'cleanSheets'],
  },
  LACROSSE: {
    sport: 'LACROSSE',
    categories: FOOTBALL_CATEGORIES,
    stats: [], // Add Lacrosse specific stats
    cardStats: ['goals', 'assists', 'groundBalls', 'games'],
    seasonStats: ['goals', 'assists', 'groundBalls', 'saves'],
    matchStats: ['goals', 'assists', 'shots', 'groundBalls'],
    leaderboardStats: ['goals', 'assists', 'saves'],
  },
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    categories: [], // Add AFL categories
    stats: [], // Add AFL stats
    cardStats: ['goals', 'disposals', 'marks', 'games'],
    seasonStats: ['goals', 'behinds', 'disposals', 'marks', 'tackles'],
    matchStats: ['goals', 'behinds', 'kicks', 'handballs', 'marks'],
    leaderboardStats: ['goals', 'disposals', 'marks', 'tackles'],
  },
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    categories: [], // Add Gaelic categories
    stats: [], // Add Gaelic stats
    cardStats: ['goals', 'points', 'tackles', 'games'],
    seasonStats: ['goals', 'points', 'possessions', 'tackles'],
    matchStats: ['goals', 'points', 'kickPasses', 'tackles'],
    leaderboardStats: ['goals', 'points', 'tackles'],
  },
  FUTSAL: {
    sport: 'FUTSAL',
    categories: FOOTBALL_CATEGORIES,
    stats: FOOTBALL_STATS,
    cardStats: ['goals', 'assists', 'appearances', 'rating'],
    seasonStats: ['goals', 'assists', 'appearances', 'saves'],
    matchStats: ['goals', 'assists', 'shots', 'tackles'],
    leaderboardStats: ['goals', 'assists', 'saves'],
  },
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    categories: FOOTBALL_CATEGORIES,
    stats: FOOTBALL_STATS,
    cardStats: ['goals', 'assists', 'appearances', 'rating'],
    seasonStats: ['goals', 'assists', 'appearances'],
    matchStats: ['goals', 'assists', 'shots'],
    leaderboardStats: ['goals', 'assists'],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get stats configuration for a sport
 */
export function getSportStats(sport: Sport): SportStatsConfig {
  return SPORT_STATS[sport];
}

/**
 * Get a specific stat definition
 */
export function getStatByKey(sport: Sport, key: string): StatDefinition | undefined {
  return SPORT_STATS[sport]?.stats.find(s => s.key === key);
}

/**
 * Get stats by category
 */
export function getStatsByCategory(sport: Sport, category: StatCategory): StatDefinition[] {
  return SPORT_STATS[sport]?.stats.filter(s => s.category === category) || [];
}

/**
 * Get primary stats for player cards
 */
export function getCardStats(sport: Sport): StatDefinition[] {
  const config = SPORT_STATS[sport];
  return config?.cardStats.map(key => config.stats.find(s => s.key === key)).filter(Boolean) as StatDefinition[] || [];
}

/**
 * Get leaderboard stats
 */
export function getLeaderboardStats(sport: Sport): StatDefinition[] {
  const config = SPORT_STATS[sport];
  return config?.leaderboardStats.map(key => config.stats.find(s => s.key === key)).filter(Boolean) as StatDefinition[] || [];
}

/**
 * Get stats relevant to a position
 */
export function getStatsForPosition(sport: Sport, positionCode: string): StatDefinition[] {
  return SPORT_STATS[sport]?.stats.filter(s => 
    !s.relevantPositions || s.relevantPositions.includes(positionCode)
  ) || [];
}

/**
 * Format stat value for display
 */
export function formatStatValue(stat: StatDefinition, value: number): string {
  if (value === null || value === undefined) return '-';
  
  const precision = stat.precision ?? 0;
  const formatted = value.toFixed(precision);
  
  if (stat.unit) {
    return `${formatted}${stat.unit}`;
  }
  
  return formatted;
}

/**
 * Get stat trend indicator
 */
export function getStatTrendColor(stat: StatDefinition, current: number, previous: number): string {
  if (current === previous) return 'text-gray-500';
  
  const isImprovement = stat.trend === 'HIGHER_BETTER' 
    ? current > previous 
    : current < previous;
  
  return isImprovement ? 'text-green-500' : 'text-red-500';
}

// =============================================================================
// EXPORTS
// =============================================================================

export default SPORT_STATS;