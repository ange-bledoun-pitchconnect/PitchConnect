/**
 * ============================================================================
 * SPORT STATISTICS CONFIGURATION - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade multi-sport statistics configuration with:
 * - 12 sports with 500+ unique statistics
 * - Zod validation for runtime safety
 * - Category grouping for dashboards
 * - Position-relevant stat filtering
 * - Aggregation and trend analysis
 * - Leaderboard and ranking support
 * - Full TypeScript type safety
 * 
 * Sources:
 * - FIFA/UEFA Technical Reports
 * - Opta Sports Data Standards
 * - Stats Perform Metrics
 * - AFL Player Statistics
 * - NBA/FIBA Statistical Standards
 * - World Rugby Statistics
 * - Cricket ICC Playing Conditions
 * - World Lacrosse Official Stats
 * 
 * @version 3.0.0
 * @path src/config/sport-stats-config.ts
 * 
 * ============================================================================
 */

import { z } from 'zod';

// =============================================================================
// ENUMS & TYPES
// =============================================================================

export const SportEnum = z.enum([
  'FOOTBALL',
  'NETBALL',
  'RUGBY',
  'CRICKET',
  'AMERICAN_FOOTBALL',
  'BASKETBALL',
  'HOCKEY',
  'LACROSSE',
  'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL',
  'FUTSAL',
  'BEACH_FOOTBALL',
]);

export type Sport = z.infer<typeof SportEnum>;

export const StatTypeEnum = z.enum([
  'COUNT',       // Whole number count (goals, assists)
  'PERCENTAGE',  // Percentage value (pass accuracy)
  'RATIO',       // Ratio value (goals per game)
  'TIME',        // Time duration (minutes played)
  'DISTANCE',    // Distance value (km run)
  'AVERAGE',     // Calculated average
  'RATE',        // Rate per time/event (economy rate)
  'SCORE',       // Rating/score (match rating)
]);

export type StatType = z.infer<typeof StatTypeEnum>;

export const AggregationTypeEnum = z.enum([
  'SUM',         // Add all values
  'AVERAGE',     // Calculate mean
  'MAX',         // Highest value
  'MIN',         // Lowest value
  'LATEST',      // Most recent value
  'TOTAL',       // Running total
  'WEIGHTED',    // Weighted average
]);

export type AggregationType = z.infer<typeof AggregationTypeEnum>;

export const TrendDirectionEnum = z.enum([
  'HIGHER_BETTER',  // More is better (goals)
  'LOWER_BETTER',   // Less is better (fouls conceded)
  'NEUTRAL',        // No preference (appearances)
]);

export type TrendDirection = z.infer<typeof TrendDirectionEnum>;

export const StatCategoryEnum = z.enum([
  // Universal
  'GENERAL',
  'PERFORMANCE',
  
  // Football/Hockey/Futsal
  'ATTACKING',
  'DEFENSIVE',
  'PASSING',
  'PHYSICAL',
  'DISCIPLINE',
  'GOALKEEPING',
  'SET_PIECES',
  'POSSESSION',
  
  // Cricket
  'BATTING',
  'BOWLING',
  'FIELDING',
  
  // Basketball
  'SCORING',
  'REBOUNDING',
  'PLAYMAKING',
  
  // American Football
  'PASSING_AF',
  'RUSHING',
  'RECEIVING',
  'SPECIAL_TEAMS',
  'DEFENSIVE_AF',
  
  // Netball
  'SHOOTING',
  'FEEDING',
  'CENTRE_PLAY',
  
  // Lacrosse
  'FACE_OFFS',
  'GROUND_BALLS',
  
  // AFL
  'DISPOSALS',
  'CONTESTED',
  'CLEARANCES',
  'MARKS',
  
  // Gaelic
  'SCORING_GAA',
  'KICKOUTS',
]);

export type StatCategory = z.infer<typeof StatCategoryEnum>;

// =============================================================================
// SCHEMAS
// =============================================================================

export const StatDefinitionSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1).max(6),
  description: z.string(),
  category: StatCategoryEnum,
  type: StatTypeEnum,
  aggregation: AggregationTypeEnum,
  trend: TrendDirectionEnum,
  unit: z.string().optional(),
  precision: z.number().min(0).max(4).default(0),
  icon: z.string().optional(),
  color: z.string().optional(),
  isPrimary: z.boolean().default(false),
  showOnCard: z.boolean().default(false),
  showInLeaderboard: z.boolean().default(false),
  relevantPositions: z.array(z.string()).optional(),
  formula: z.string().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
});

export type StatDefinition = z.infer<typeof StatDefinitionSchema>;

export const StatCategoryConfigSchema = z.object({
  category: StatCategoryEnum,
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  order: z.number(),
});

export type StatCategoryConfig = z.infer<typeof StatCategoryConfigSchema>;

export const SportStatsConfigSchema = z.object({
  sport: SportEnum,
  categories: z.array(StatCategoryConfigSchema),
  stats: z.array(StatDefinitionSchema),
  cardStats: z.array(z.string()).max(4),
  seasonStats: z.array(z.string()),
  matchStats: z.array(z.string()),
  leaderboardStats: z.array(z.string()),
});

export type SportStatsConfig = z.infer<typeof SportStatsConfigSchema>;

// =============================================================================
// CATEGORY CONFIGURATIONS
// =============================================================================

const FOOTBALL_CATEGORIES: StatCategoryConfig[] = [
  { category: 'ATTACKING', name: 'Attacking', description: 'Goals, shots, and offensive play', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'PASSING', name: 'Passing', description: 'Passes, assists, and ball distribution', icon: 'ArrowRight', color: '#3B82F6', order: 2 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Tackles, interceptions, and blocks', icon: 'Shield', color: '#22C55E', order: 3 },
  { category: 'PHYSICAL', name: 'Physical', description: 'Duels, aerial battles, and fitness', icon: 'Zap', color: '#F59E0B', order: 4 },
  { category: 'DISCIPLINE', name: 'Discipline', description: 'Cards, fouls, and fair play', icon: 'AlertTriangle', color: '#DC2626', order: 5 },
  { category: 'GOALKEEPING', name: 'Goalkeeping', description: 'Saves, clean sheets, and distribution', icon: 'Hand', color: '#FFD700', order: 6 },
  { category: 'SET_PIECES', name: 'Set Pieces', description: 'Corners, free kicks, and penalties', icon: 'Flag', color: '#8B5CF6', order: 7 },
  { category: 'GENERAL', name: 'General', description: 'Appearances, minutes, and ratings', icon: 'User', color: '#6B7280', order: 8 },
];

const CRICKET_CATEGORIES: StatCategoryConfig[] = [
  { category: 'BATTING', name: 'Batting', description: 'Runs, strike rate, and batting performance', icon: 'Target', color: '#3B82F6', order: 1 },
  { category: 'BOWLING', name: 'Bowling', description: 'Wickets, economy, and bowling figures', icon: 'Circle', color: '#22C55E', order: 2 },
  { category: 'FIELDING', name: 'Fielding', description: 'Catches, run outs, and stumpings', icon: 'Hand', color: '#F59E0B', order: 3 },
  { category: 'GENERAL', name: 'General', description: 'Matches, innings, and all-round stats', icon: 'User', color: '#6B7280', order: 4 },
];

const BASKETBALL_CATEGORIES: StatCategoryConfig[] = [
  { category: 'SCORING', name: 'Scoring', description: 'Points, shooting, and efficiency', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'REBOUNDING', name: 'Rebounding', description: 'Offensive, defensive, and total rebounds', icon: 'RefreshCw', color: '#3B82F6', order: 2 },
  { category: 'PLAYMAKING', name: 'Playmaking', description: 'Assists, turnovers, and ball handling', icon: 'ArrowRight', color: '#22C55E', order: 3 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Steals, blocks, and defensive stats', icon: 'Shield', color: '#F59E0B', order: 4 },
  { category: 'PHYSICAL', name: 'Physical', description: 'Fouls, minutes, and efficiency', icon: 'Zap', color: '#8B5CF6', order: 5 },
  { category: 'GENERAL', name: 'General', description: 'Games, starts, and plus/minus', icon: 'User', color: '#6B7280', order: 6 },
];

const RUGBY_CATEGORIES: StatCategoryConfig[] = [
  { category: 'ATTACKING', name: 'Attacking', description: 'Tries, metres, and line breaks', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'PASSING', name: 'Passing', description: 'Passes, offloads, and distribution', icon: 'ArrowRight', color: '#3B82F6', order: 2 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Tackles, turnovers, and defence', icon: 'Shield', color: '#22C55E', order: 3 },
  { category: 'SET_PIECES', name: 'Set Pieces', description: 'Lineouts, scrums, and restarts', icon: 'Flag', color: '#A855F7', order: 4 },
  { category: 'DISCIPLINE', name: 'Discipline', description: 'Penalties and cards', icon: 'AlertTriangle', color: '#DC2626', order: 5 },
  { category: 'GENERAL', name: 'General', description: 'Appearances, minutes, and points', icon: 'User', color: '#6B7280', order: 6 },
];

const AMERICAN_FOOTBALL_CATEGORIES: StatCategoryConfig[] = [
  { category: 'PASSING_AF', name: 'Passing', description: 'Completions, yards, touchdowns, and QB rating', icon: 'ArrowRight', color: '#3B82F6', order: 1 },
  { category: 'RUSHING', name: 'Rushing', description: 'Carries, yards, and touchdowns', icon: 'Zap', color: '#22C55E', order: 2 },
  { category: 'RECEIVING', name: 'Receiving', description: 'Receptions, yards, and touchdowns', icon: 'Target', color: '#EF4444', order: 3 },
  { category: 'DEFENSIVE_AF', name: 'Defensive', description: 'Tackles, sacks, interceptions, and forced fumbles', icon: 'Shield', color: '#F59E0B', order: 4 },
  { category: 'SPECIAL_TEAMS', name: 'Special Teams', description: 'Kicking, punting, and returns', icon: 'Star', color: '#A855F7', order: 5 },
  { category: 'GENERAL', name: 'General', description: 'Games, snaps, and all-purpose yards', icon: 'User', color: '#6B7280', order: 6 },
];

const NETBALL_CATEGORIES: StatCategoryConfig[] = [
  { category: 'SHOOTING', name: 'Shooting', description: 'Goals, attempts, and shooting accuracy', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'FEEDING', name: 'Feeding', description: 'Feeds, goal assists, and circle entries', icon: 'ArrowRight', color: '#3B82F6', order: 2 },
  { category: 'CENTRE_PLAY', name: 'Centre Play', description: 'Centre passes, possessions, and turnovers', icon: 'Circle', color: '#22C55E', order: 3 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Intercepts, deflections, and gains', icon: 'Shield', color: '#F59E0B', order: 4 },
  { category: 'GENERAL', name: 'General', description: 'Quarters, minutes, and penalties', icon: 'User', color: '#6B7280', order: 5 },
];

const HOCKEY_CATEGORIES: StatCategoryConfig[] = [
  { category: 'ATTACKING', name: 'Attacking', description: 'Goals, shots, and circle entries', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'PASSING', name: 'Passing', description: 'Passes, assists, and distribution', icon: 'ArrowRight', color: '#3B82F6', order: 2 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Tackles, interceptions, and blocks', icon: 'Shield', color: '#22C55E', order: 3 },
  { category: 'SET_PIECES', name: 'Set Pieces', description: 'Penalty corners, strokes, and free hits', icon: 'Flag', color: '#A855F7', order: 4 },
  { category: 'GOALKEEPING', name: 'Goalkeeping', description: 'Saves, clean sheets, and distribution', icon: 'Hand', color: '#FFD700', order: 5 },
  { category: 'GENERAL', name: 'General', description: 'Appearances and minutes', icon: 'User', color: '#6B7280', order: 6 },
];

const LACROSSE_CATEGORIES: StatCategoryConfig[] = [
  { category: 'ATTACKING', name: 'Attacking', description: 'Goals, shots, and points', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'PASSING', name: 'Passing', description: 'Assists and turnovers', icon: 'ArrowRight', color: '#3B82F6', order: 2 },
  { category: 'FACE_OFFS', name: 'Face-Offs', description: 'Face-off wins and percentages', icon: 'Circle', color: '#22C55E', order: 3 },
  { category: 'GROUND_BALLS', name: 'Ground Balls', description: 'Ground balls and caused turnovers', icon: 'Target', color: '#F59E0B', order: 4 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Clears, saves, and defensive stats', icon: 'Shield', color: '#A855F7', order: 5 },
  { category: 'GOALKEEPING', name: 'Goalkeeping', description: 'Saves, save percentage, and goals against', icon: 'Hand', color: '#FFD700', order: 6 },
  { category: 'GENERAL', name: 'General', description: 'Games, minutes, and penalties', icon: 'User', color: '#6B7280', order: 7 },
];

const AFL_CATEGORIES: StatCategoryConfig[] = [
  { category: 'SCORING_GAA', name: 'Scoring', description: 'Goals, behinds, and accuracy', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'DISPOSALS', name: 'Disposals', description: 'Kicks, handballs, and efficiency', icon: 'ArrowRight', color: '#3B82F6', order: 2 },
  { category: 'CONTESTED', name: 'Contested', description: 'Contested possessions and one-percenters', icon: 'Zap', color: '#22C55E', order: 3 },
  { category: 'MARKS', name: 'Marks', description: 'Marks and contested marks', icon: 'Hand', color: '#F59E0B', order: 4 },
  { category: 'CLEARANCES', name: 'Clearances', description: 'Clearances and stoppages', icon: 'Circle', color: '#A855F7', order: 5 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Tackles, spoils, and rebounds', icon: 'Shield', color: '#14B8A6', order: 6 },
  { category: 'GENERAL', name: 'General', description: 'Games, minutes, and ratings', icon: 'User', color: '#6B7280', order: 7 },
];

const GAELIC_CATEGORIES: StatCategoryConfig[] = [
  { category: 'SCORING_GAA', name: 'Scoring', description: 'Goals, points, and totals', icon: 'Target', color: '#EF4444', order: 1 },
  { category: 'POSSESSION', name: 'Possession', description: 'Possessions, solos, and handpasses', icon: 'Circle', color: '#3B82F6', order: 2 },
  { category: 'KICKOUTS', name: 'Kickouts', description: 'Kickout retention and wins', icon: 'Flag', color: '#22C55E', order: 3 },
  { category: 'DEFENSIVE', name: 'Defensive', description: 'Tackles, turnovers, and blocks', icon: 'Shield', color: '#F59E0B', order: 4 },
  { category: 'DISCIPLINE', name: 'Discipline', description: 'Frees won/conceded and cards', icon: 'AlertTriangle', color: '#DC2626', order: 5 },
  { category: 'GENERAL', name: 'General', description: 'Games, minutes, and appearances', icon: 'User', color: '#6B7280', order: 6 },
];

// =============================================================================
// FOOTBALL STATISTICS (50+ stats)
// =============================================================================

const FOOTBALL_STATS: StatDefinition[] = [
  // ATTACKING (15 stats)
  { key: 'goals', name: 'Goals', shortName: 'G', description: 'Total goals scored', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', icon: 'Target', color: '#EF4444', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'assists', name: 'Assists', shortName: 'A', description: 'Passes leading directly to goals', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', icon: 'ArrowRight', color: '#3B82F6', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'shots', name: 'Shots', shortName: 'Sh', description: 'Total shots attempted', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'shotsOnTarget', name: 'Shots on Target', shortName: 'SoT', description: 'Shots on goal frame', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'shotAccuracy', name: 'Shot Accuracy', shortName: 'Sh%', description: 'Percentage of shots on target', category: 'ATTACKING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'conversionRate', name: 'Conversion Rate', shortName: 'Conv', description: 'Goals per shot percentage', category: 'ATTACKING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, formula: 'goals / shots * 100' },
  { key: 'expectedGoals', name: 'Expected Goals', shortName: 'xG', description: 'Quality of chances created', category: 'ATTACKING', type: 'AVERAGE', aggregation: 'SUM', trend: 'HIGHER_BETTER', precision: 2, showInLeaderboard: true },
  { key: 'expectedAssists', name: 'Expected Assists', shortName: 'xA', description: 'Quality of chances created for others', category: 'ATTACKING', type: 'AVERAGE', aggregation: 'SUM', trend: 'HIGHER_BETTER', precision: 2 },
  { key: 'goalsPerGame', name: 'Goals per Game', shortName: 'G/G', description: 'Average goals per appearance', category: 'ATTACKING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2, formula: 'goals / appearances' },
  { key: 'bigChancesCreated', name: 'Big Chances Created', shortName: 'BCC', description: 'Clear goalscoring opportunities created', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'bigChancesMissed', name: 'Big Chances Missed', shortName: 'BCM', description: 'Clear opportunities not converted', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'dribbles', name: 'Dribbles', shortName: 'Drb', description: 'Successful take-ons', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'dribblesAttempted', name: 'Dribbles Attempted', shortName: 'DrA', description: 'Total dribble attempts', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'dribbleSuccess', name: 'Dribble Success Rate', shortName: 'Dr%', description: 'Percentage of successful dribbles', category: 'ATTACKING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'touches', name: 'Touches', shortName: 'Tch', description: 'Total ball touches', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // PASSING (12 stats)
  { key: 'passes', name: 'Passes', shortName: 'Pas', description: 'Total passes attempted', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'passesCompleted', name: 'Passes Completed', shortName: 'PaC', description: 'Successful passes', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'passAccuracy', name: 'Pass Accuracy', shortName: 'Pa%', description: 'Percentage of completed passes', category: 'PASSING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, showInLeaderboard: true },
  { key: 'keyPasses', name: 'Key Passes', shortName: 'KP', description: 'Passes leading to shots', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'throughBalls', name: 'Through Balls', shortName: 'TB', description: 'Balls played through defence', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'longBalls', name: 'Long Balls', shortName: 'LB', description: 'Long passes attempted', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'longBallAccuracy', name: 'Long Ball Accuracy', shortName: 'LB%', description: 'Successful long balls percentage', category: 'PASSING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'crosses', name: 'Crosses', shortName: 'Crs', description: 'Crosses attempted', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['LB', 'RB', 'LWB', 'RWB', 'LW', 'RW', 'LM', 'RM'] },
  { key: 'crossAccuracy', name: 'Cross Accuracy', shortName: 'Cr%', description: 'Successful crosses percentage', category: 'PASSING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'progressivePasses', name: 'Progressive Passes', shortName: 'PrP', description: 'Passes moving ball significantly forward', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'passesIntoFinalThird', name: 'Passes into Final Third', shortName: 'PFT', description: 'Passes into attacking third', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'passesIntoPenaltyArea', name: 'Passes into Penalty Area', shortName: 'PPA', description: 'Passes into opposition box', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // DEFENSIVE (12 stats)
  { key: 'tackles', name: 'Tackles', shortName: 'Tkl', description: 'Successful tackles', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'tacklesWon', name: 'Tackles Won', shortName: 'TkW', description: 'Tackles winning possession', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'tackleSuccess', name: 'Tackle Success Rate', shortName: 'Tk%', description: 'Percentage of tackles won', category: 'DEFENSIVE', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'interceptions', name: 'Interceptions', shortName: 'Int', description: 'Passes intercepted', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'clearances', name: 'Clearances', shortName: 'Clr', description: 'Defensive clearances', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['CB', 'LB', 'RB', 'SW', 'GK'] },
  { key: 'blocks', name: 'Blocks', shortName: 'Blk', description: 'Shots and passes blocked', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'shotBlocks', name: 'Shot Blocks', shortName: 'ShB', description: 'Shots blocked', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'passBlocks', name: 'Pass Blocks', shortName: 'PaB', description: 'Passes blocked', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'recoveries', name: 'Recoveries', shortName: 'Rec', description: 'Ball recoveries', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'duelsWon', name: 'Duels Won', shortName: 'DuW', description: 'Individual battles won', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'duelSuccess', name: 'Duel Success Rate', shortName: 'Du%', description: 'Percentage of duels won', category: 'DEFENSIVE', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'errorsLeadingToGoal', name: 'Errors Leading to Goal', shortName: 'Err', description: 'Mistakes resulting in goals', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // PHYSICAL (8 stats)
  { key: 'aerialDuels', name: 'Aerial Duels Won', shortName: 'ADW', description: 'Headers won', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'aerialDuelSuccess', name: 'Aerial Success Rate', shortName: 'AD%', description: 'Percentage of aerials won', category: 'PHYSICAL', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'groundDuels', name: 'Ground Duels Won', shortName: 'GDW', description: 'Ground battles won', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'distanceCovered', name: 'Distance Covered', shortName: 'Dist', description: 'Total distance run', category: 'PHYSICAL', type: 'DISTANCE', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'km', precision: 1 },
  { key: 'sprints', name: 'Sprints', shortName: 'Spr', description: 'High-speed runs', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'topSpeed', name: 'Top Speed', shortName: 'Spd', description: 'Maximum speed reached', category: 'PHYSICAL', type: 'AVERAGE', aggregation: 'MAX', trend: 'HIGHER_BETTER', unit: 'km/h', precision: 1 },
  { key: 'pressures', name: 'Pressures', shortName: 'Prs', description: 'Pressing actions', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'pressureSuccess', name: 'Pressure Success Rate', shortName: 'Pr%', description: 'Successful pressing regains', category: 'PHYSICAL', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  
  // DISCIPLINE (5 stats)
  { key: 'yellowCards', name: 'Yellow Cards', shortName: 'YC', description: 'Yellow cards received', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', icon: 'Square', color: '#FBBF24' },
  { key: 'redCards', name: 'Red Cards', shortName: 'RC', description: 'Red cards received', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', icon: 'Square', color: '#EF4444' },
  { key: 'fouls', name: 'Fouls Committed', shortName: 'Fls', description: 'Fouls given away', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'foulsWon', name: 'Fouls Won', shortName: 'FlW', description: 'Fouls won', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'offsides', name: 'Offsides', shortName: 'Off', description: 'Caught offside', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // GOALKEEPING (10 stats)
  { key: 'saves', name: 'Saves', shortName: 'Sav', description: 'Shots saved', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'], showInLeaderboard: true },
  { key: 'savePercentage', name: 'Save Percentage', shortName: 'Sv%', description: 'Percentage of shots saved', category: 'GOALKEEPING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['GK'] },
  { key: 'cleanSheets', name: 'Clean Sheets', shortName: 'CS', description: 'Matches without conceding', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'], showOnCard: true, showInLeaderboard: true },
  { key: 'goalsConceded', name: 'Goals Conceded', shortName: 'GC', description: 'Goals let in', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['GK'] },
  { key: 'goalsConPer90', name: 'Goals Conceded per 90', shortName: 'GC90', description: 'Goals conceded per 90 minutes', category: 'GOALKEEPING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'LOWER_BETTER', precision: 2, relevantPositions: ['GK'] },
  { key: 'penaltiesSaved', name: 'Penalties Saved', shortName: 'PS', description: 'Penalty kicks saved', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'] },
  { key: 'punches', name: 'Punches', shortName: 'Pun', description: 'Ball punched clear', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['GK'] },
  { key: 'highClaims', name: 'High Claims', shortName: 'HC', description: 'Crosses caught', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'] },
  { key: 'sweepings', name: 'Sweepings', shortName: 'Swp', description: 'Clearances outside box', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'] },
  { key: 'passCompletionGK', name: 'GK Pass Completion', shortName: 'GP%', description: 'Goalkeeper pass accuracy', category: 'GOALKEEPING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['GK'] },
  
  // SET PIECES (5 stats)
  { key: 'penaltiesScored', name: 'Penalties Scored', shortName: 'PnS', description: 'Penalty kicks converted', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'penaltiesTaken', name: 'Penalties Taken', shortName: 'PnT', description: 'Penalty kicks attempted', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'freeKickGoals', name: 'Free Kick Goals', shortName: 'FKG', description: 'Goals from direct free kicks', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'cornersTaken', name: 'Corners Taken', shortName: 'Cor', description: 'Corner kicks taken', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'headerGoals', name: 'Headed Goals', shortName: 'HdG', description: 'Goals scored with head', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // GENERAL (6 stats)
  { key: 'appearances', name: 'Appearances', shortName: 'App', description: 'Total matches played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', isPrimary: true, showOnCard: true },
  { key: 'starts', name: 'Starts', shortName: 'Sta', description: 'Matches started', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'minutesPlayed', name: 'Minutes Played', shortName: 'Mins', description: 'Total playing time', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'NEUTRAL', unit: 'mins' },
  { key: 'rating', name: 'Match Rating', shortName: 'Rtg', description: 'Average performance rating', category: 'GENERAL', type: 'SCORE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, minValue: 0, maxValue: 10, showOnCard: true },
  { key: 'manOfTheMatch', name: 'Man of the Match', shortName: 'MoM', description: 'Best player awards', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'goalsContributions', name: 'Goal Contributions', shortName: 'G+A', description: 'Goals plus assists', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', formula: 'goals + assists', showInLeaderboard: true },
];
// =============================================================================
// AMERICAN FOOTBALL STATISTICS (55+ stats)
// =============================================================================

const AMERICAN_FOOTBALL_STATS: StatDefinition[] = [
  // PASSING (15 stats)
  { key: 'passingYards', name: 'Passing Yards', shortName: 'PYds', description: 'Total passing yards', category: 'PASSING_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'yds', isPrimary: true, showOnCard: true, showInLeaderboard: true, relevantPositions: ['QB'] },
  { key: 'passingTouchdowns', name: 'Passing TDs', shortName: 'PTD', description: 'Passing touchdowns thrown', category: 'PASSING_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true, showInLeaderboard: true, relevantPositions: ['QB'] },
  { key: 'completions', name: 'Completions', shortName: 'Cmp', description: 'Passes completed', category: 'PASSING_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['QB'] },
  { key: 'passAttempts', name: 'Pass Attempts', shortName: 'Att', description: 'Passes attempted', category: 'PASSING_AF', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['QB'] },
  { key: 'completionPct', name: 'Completion %', shortName: 'Cmp%', description: 'Pass completion percentage', category: 'PASSING_AF', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['QB'], showInLeaderboard: true },
  { key: 'yardsPerAttempt', name: 'Yards/Attempt', shortName: 'Y/A', description: 'Average yards per pass attempt', category: 'PASSING_AF', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, relevantPositions: ['QB'] },
  { key: 'interceptionsThrown', name: 'Interceptions', shortName: 'INT', description: 'Interceptions thrown', category: 'PASSING_AF', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['QB'] },
  { key: 'passerRating', name: 'Passer Rating', shortName: 'Rtg', description: 'NFL passer rating', category: 'PASSING_AF', type: 'SCORE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, relevantPositions: ['QB'], showInLeaderboard: true },
  { key: 'qbr', name: 'QBR', shortName: 'QBR', description: 'Total Quarterback Rating', category: 'PASSING_AF', type: 'SCORE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, minValue: 0, maxValue: 100, relevantPositions: ['QB'] },
  { key: 'sacksTaken', name: 'Sacks Taken', shortName: 'Sk', description: 'Times sacked', category: 'PASSING_AF', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['QB'] },
  { key: 'sackYardsLost', name: 'Sack Yards Lost', shortName: 'SkY', description: 'Yards lost to sacks', category: 'PASSING_AF', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['QB'] },
  { key: 'longestPass', name: 'Longest Pass', shortName: 'Lng', description: 'Longest completed pass', category: 'PASSING_AF', type: 'COUNT', aggregation: 'MAX', trend: 'HIGHER_BETTER', unit: 'yds', relevantPositions: ['QB'] },
  { key: 'passesOver20', name: '20+ Yard Passes', shortName: '20+', description: 'Completions of 20+ yards', category: 'PASSING_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['QB'] },
  { key: 'passesOver40', name: '40+ Yard Passes', shortName: '40+', description: 'Completions of 40+ yards', category: 'PASSING_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['QB'] },
  { key: 'gameWinningDrives', name: 'Game-Winning Drives', shortName: 'GWD', description: '4th quarter comebacks', category: 'PASSING_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['QB'] },
  
  // RUSHING (12 stats)
  { key: 'rushingYards', name: 'Rushing Yards', shortName: 'RYds', description: 'Total rushing yards', category: 'RUSHING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'yds', isPrimary: true, showOnCard: true, showInLeaderboard: true, relevantPositions: ['RB', 'FB', 'QB'] },
  { key: 'rushingTouchdowns', name: 'Rushing TDs', shortName: 'RTD', description: 'Rushing touchdowns', category: 'RUSHING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true, showInLeaderboard: true, relevantPositions: ['RB', 'FB', 'QB'] },
  { key: 'carries', name: 'Carries', shortName: 'Car', description: 'Rushing attempts', category: 'RUSHING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['RB', 'FB', 'QB'] },
  { key: 'yardsPerCarry', name: 'Yards/Carry', shortName: 'Y/C', description: 'Average yards per carry', category: 'RUSHING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, relevantPositions: ['RB', 'FB', 'QB'], showInLeaderboard: true },
  { key: 'longestRush', name: 'Longest Rush', shortName: 'Lng', description: 'Longest rushing play', category: 'RUSHING', type: 'COUNT', aggregation: 'MAX', trend: 'HIGHER_BETTER', unit: 'yds', relevantPositions: ['RB', 'FB', 'QB'] },
  { key: 'rushOver20', name: '20+ Yard Rushes', shortName: '20+', description: 'Rushes of 20+ yards', category: 'RUSHING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['RB', 'FB'] },
  { key: 'rushOver40', name: '40+ Yard Rushes', shortName: '40+', description: 'Rushes of 40+ yards', category: 'RUSHING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['RB', 'FB'] },
  { key: 'fumbles', name: 'Fumbles', shortName: 'Fum', description: 'Total fumbles', category: 'RUSHING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'fumblesLost', name: 'Fumbles Lost', shortName: 'FL', description: 'Fumbles lost to opponent', category: 'RUSHING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'firstDownRushes', name: 'Rushing First Downs', shortName: '1D', description: 'First downs by rushing', category: 'RUSHING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['RB', 'FB'] },
  { key: 'rushYardsAfterContact', name: 'Yards After Contact', shortName: 'YAC', description: 'Rushing yards after contact', category: 'RUSHING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['RB', 'FB'] },
  { key: 'brokenTackles', name: 'Broken Tackles', shortName: 'BT', description: 'Tackles avoided', category: 'RUSHING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['RB', 'FB'] },
  
  // RECEIVING (12 stats)
  { key: 'receptions', name: 'Receptions', shortName: 'Rec', description: 'Passes caught', category: 'RECEIVING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true, relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'receivingYards', name: 'Receiving Yards', shortName: 'RcY', description: 'Total receiving yards', category: 'RECEIVING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'yds', showOnCard: true, showInLeaderboard: true, relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'receivingTouchdowns', name: 'Receiving TDs', shortName: 'RcTD', description: 'Receiving touchdowns', category: 'RECEIVING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true, relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'targets', name: 'Targets', shortName: 'Tgt', description: 'Times targeted', category: 'RECEIVING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'catchPct', name: 'Catch %', shortName: 'Cth%', description: 'Catch percentage', category: 'RECEIVING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'yardsPerReception', name: 'Yards/Reception', shortName: 'Y/R', description: 'Average yards per catch', category: 'RECEIVING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'yardsPerTarget', name: 'Yards/Target', shortName: 'Y/T', description: 'Average yards per target', category: 'RECEIVING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'longestReception', name: 'Longest Reception', shortName: 'Lng', description: 'Longest catch', category: 'RECEIVING', type: 'COUNT', aggregation: 'MAX', trend: 'HIGHER_BETTER', unit: 'yds', relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'yardsAfterCatch', name: 'Yards After Catch', shortName: 'YAC', description: 'Yards gained after catch', category: 'RECEIVING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'firstDownReceptions', name: 'Receiving First Downs', shortName: '1D', description: 'First downs by receiving', category: 'RECEIVING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'drops', name: 'Drops', shortName: 'Drp', description: 'Catchable balls dropped', category: 'RECEIVING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['WR', 'TE', 'RB'] },
  { key: 'contested_catches', name: 'Contested Catches', shortName: 'CC', description: 'Catches in traffic', category: 'RECEIVING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WR', 'TE'] },
  
  // DEFENSIVE (14 stats)
  { key: 'totalTackles', name: 'Total Tackles', shortName: 'Tkl', description: 'Combined tackles', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'soloTackles', name: 'Solo Tackles', shortName: 'Solo', description: 'Unassisted tackles', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'assistedTackles', name: 'Assisted Tackles', shortName: 'Ast', description: 'Assisted tackles', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'tacklesForLoss', name: 'Tackles for Loss', shortName: 'TFL', description: 'Tackles behind line', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'sacks', name: 'Sacks', shortName: 'Sck', description: 'Quarterback sacks', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'qbHits', name: 'QB Hits', shortName: 'QBH', description: 'Hits on quarterback', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'qbHurries', name: 'QB Hurries', shortName: 'Hur', description: 'Pressures on quarterback', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'interceptionsDef', name: 'Interceptions', shortName: 'INT', description: 'Passes intercepted', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true, showInLeaderboard: true },
  { key: 'interceptionYards', name: 'INT Return Yards', shortName: 'IYd', description: 'Interception return yards', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'interceptionTDs', name: 'INT Return TDs', shortName: 'ITD', description: 'Interception return touchdowns', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'passesDefended', name: 'Passes Defended', shortName: 'PD', description: 'Passes broken up', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'forcedFumbles', name: 'Forced Fumbles', shortName: 'FF', description: 'Fumbles caused', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'fumbleRecoveries', name: 'Fumble Recoveries', shortName: 'FR', description: 'Fumbles recovered', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'safeties', name: 'Safeties', shortName: 'Saf', description: 'Safeties scored', category: 'DEFENSIVE_AF', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // SPECIAL TEAMS (10 stats)
  { key: 'fieldGoals', name: 'Field Goals Made', shortName: 'FGM', description: 'Field goals made', category: 'SPECIAL_TEAMS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['K'], showInLeaderboard: true },
  { key: 'fieldGoalAttempts', name: 'Field Goal Attempts', shortName: 'FGA', description: 'Field goals attempted', category: 'SPECIAL_TEAMS', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['K'] },
  { key: 'fieldGoalPct', name: 'Field Goal %', shortName: 'FG%', description: 'Field goal percentage', category: 'SPECIAL_TEAMS', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['K'] },
  { key: 'longestFieldGoal', name: 'Longest FG', shortName: 'LFG', description: 'Longest field goal made', category: 'SPECIAL_TEAMS', type: 'COUNT', aggregation: 'MAX', trend: 'HIGHER_BETTER', unit: 'yds', relevantPositions: ['K'] },
  { key: 'extraPoints', name: 'Extra Points Made', shortName: 'XPM', description: 'Extra points made', category: 'SPECIAL_TEAMS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['K'] },
  { key: 'puntYards', name: 'Punt Yards', shortName: 'PYd', description: 'Total punt yards', category: 'SPECIAL_TEAMS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['P'] },
  { key: 'puntAverage', name: 'Punt Average', shortName: 'Avg', description: 'Average punt distance', category: 'SPECIAL_TEAMS', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, relevantPositions: ['P'] },
  { key: 'puntsInside20', name: 'Punts Inside 20', shortName: 'I20', description: 'Punts downed inside 20', category: 'SPECIAL_TEAMS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['P'] },
  { key: 'kickReturnYards', name: 'Kick Return Yards', shortName: 'KRY', description: 'Kick return yards', category: 'SPECIAL_TEAMS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'puntReturnYards', name: 'Punt Return Yards', shortName: 'PRY', description: 'Punt return yards', category: 'SPECIAL_TEAMS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // GENERAL (4 stats)
  { key: 'gamesPlayed', name: 'Games Played', shortName: 'GP', description: 'Total games played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', showOnCard: true },
  { key: 'gamesStarted', name: 'Games Started', shortName: 'GS', description: 'Games started', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'snaps', name: 'Snaps', shortName: 'Snp', description: 'Offensive/defensive snaps', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'allPurposeYards', name: 'All-Purpose Yards', shortName: 'APY', description: 'Combined yards from all sources', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
];

// =============================================================================
// LACROSSE STATISTICS (50+ stats)
// =============================================================================

const LACROSSE_STATS: StatDefinition[] = [
  // ATTACKING (12 stats)
  { key: 'goals', name: 'Goals', shortName: 'G', description: 'Total goals scored', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'assists', name: 'Assists', shortName: 'A', description: 'Passes leading to goals', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'points', name: 'Points', shortName: 'Pts', description: 'Goals plus assists', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', formula: 'goals + assists', showInLeaderboard: true },
  { key: 'shots', name: 'Shots', shortName: 'Sh', description: 'Shots attempted', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'shotsOnGoal', name: 'Shots on Goal', shortName: 'SOG', description: 'Shots on goal', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'shotPct', name: 'Shooting %', shortName: 'Sh%', description: 'Goals per shot percentage', category: 'ATTACKING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'twoPointGoals', name: '2-Point Goals', shortName: '2PG', description: 'Goals from 2-point arc', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'manUpGoals', name: 'Man-Up Goals', shortName: 'MUG', description: 'Goals during extra man', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'manDownGoals', name: 'Man-Down Goals', shortName: 'MDG', description: 'Goals while man down', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'unassistedGoals', name: 'Unassisted Goals', shortName: 'UAG', description: 'Goals without assist', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'goalsPerGame', name: 'Goals/Game', shortName: 'G/G', description: 'Average goals per game', category: 'ATTACKING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2 },
  { key: 'pointsPerGame', name: 'Points/Game', shortName: 'P/G', description: 'Average points per game', category: 'ATTACKING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2 },
  
  // FACE-OFFS (8 stats)
  { key: 'faceoffsWon', name: 'Face-Offs Won', shortName: 'FOW', description: 'Face-offs won', category: 'FACE_OFFS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'faceoffsLost', name: 'Face-Offs Lost', shortName: 'FOL', description: 'Face-offs lost', category: 'FACE_OFFS', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'faceoffPct', name: 'Face-Off %', shortName: 'FO%', description: 'Face-off win percentage', category: 'FACE_OFFS', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, showInLeaderboard: true },
  { key: 'faceoffGroundBalls', name: 'FO Ground Balls', shortName: 'FOGB', description: 'Ground balls off face-offs', category: 'FACE_OFFS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'clampWins', name: 'Clamp Wins', shortName: 'Clp', description: 'Face-off clamp wins', category: 'FACE_OFFS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'faceoffViolations', name: 'FO Violations', shortName: 'FOV', description: 'Face-off violations', category: 'FACE_OFFS', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'fastBreakGoalsFromFO', name: 'FB Goals from FO', shortName: 'FBG', description: 'Fast break goals from face-off', category: 'FACE_OFFS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'faceoffsAttempted', name: 'Face-Offs Attempted', shortName: 'FOA', description: 'Total face-offs taken', category: 'FACE_OFFS', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  
  // GROUND BALLS (6 stats)
  { key: 'groundBalls', name: 'Ground Balls', shortName: 'GB', description: 'Loose balls recovered', category: 'GROUND_BALLS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'causedTurnovers', name: 'Caused Turnovers', shortName: 'CT', description: 'Turnovers forced', category: 'GROUND_BALLS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'turnovers', name: 'Turnovers', shortName: 'TO', description: 'Ball possession lost', category: 'GROUND_BALLS', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'turnoverRatio', name: 'Turnover Ratio', shortName: 'T/R', description: 'Caused turnovers vs turnovers', category: 'GROUND_BALLS', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2 },
  { key: 'looseBallRecoveries', name: 'Loose Ball Recoveries', shortName: 'LBR', description: 'Recoveries of loose balls', category: 'GROUND_BALLS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'groundBallsPerGame', name: 'GB/Game', shortName: 'GB/G', description: 'Ground balls per game', category: 'GROUND_BALLS', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1 },
  
  // DEFENSIVE (8 stats)
  { key: 'clears', name: 'Clears', shortName: 'Clr', description: 'Successful clears', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'clearAttempts', name: 'Clear Attempts', shortName: 'ClrA', description: 'Clear attempts', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'clearPct', name: 'Clear %', shortName: 'Cl%', description: 'Clear success percentage', category: 'DEFENSIVE', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'takeaways', name: 'Takeaways', shortName: 'TA', description: 'Possessions stolen', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'checks', name: 'Checks', shortName: 'Chk', description: 'Stick checks', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'blockedShots', name: 'Blocked Shots', shortName: 'BS', description: 'Shots blocked', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'manDownDefense', name: 'Man-Down Defense', shortName: 'MDD', description: 'Successful man-down defenses', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'defensiveHolds', name: 'Defensive Holds', shortName: 'DH', description: 'Penalty holds', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // GOALKEEPING (10 stats)
  { key: 'savesLax', name: 'Saves', shortName: 'Sav', description: 'Shots saved', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['G'], showOnCard: true, showInLeaderboard: true },
  { key: 'goalsAgainst', name: 'Goals Against', shortName: 'GA', description: 'Goals conceded', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['G'] },
  { key: 'savePctLax', name: 'Save %', shortName: 'Sv%', description: 'Save percentage', category: 'GOALKEEPING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['G'], showInLeaderboard: true },
  { key: 'goalsAgainstAvg', name: 'Goals Against Avg', shortName: 'GAA', description: 'Goals against per 60 minutes', category: 'GOALKEEPING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'LOWER_BETTER', precision: 2, relevantPositions: ['G'] },
  { key: 'shutouts', name: 'Shutouts', shortName: 'SO', description: 'Games with zero goals against', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['G'] },
  { key: 'minutesInGoal', name: 'Minutes in Goal', shortName: 'Min', description: 'Minutes played in goal', category: 'GOALKEEPING', type: 'TIME', aggregation: 'SUM', trend: 'NEUTRAL', unit: 'mins', relevantPositions: ['G'] },
  { key: 'shotsAgainst', name: 'Shots Against', shortName: 'SA', description: 'Shots faced', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['G'] },
  { key: 'goalieClears', name: 'Goalie Clears', shortName: 'GC', description: 'Clears by goalkeeper', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['G'] },
  { key: 'goalieGroundBalls', name: 'Goalie Ground Balls', shortName: 'GGB', description: 'Ground balls by goalkeeper', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['G'] },
  { key: 'goalieAssists', name: 'Goalie Assists', shortName: 'GA', description: 'Assists by goalkeeper', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['G'] },
  
  // GENERAL (6 stats)
  { key: 'gamesLax', name: 'Games', shortName: 'GP', description: 'Games played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', showOnCard: true },
  { key: 'gamesStartedLax', name: 'Games Started', shortName: 'GS', description: 'Games started', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'minutesLax', name: 'Minutes', shortName: 'Min', description: 'Total minutes played', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'NEUTRAL', unit: 'mins' },
  { key: 'penalties', name: 'Penalties', shortName: 'Pen', description: 'Penalties committed', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'penaltyMinutes', name: 'Penalty Minutes', shortName: 'PIM', description: 'Time in penalty box', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'LOWER_BETTER', unit: 'mins' },
  { key: 'ejections', name: 'Ejections', shortName: 'Ej', description: 'Ejections from game', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
];

// =============================================================================
// AUSTRALIAN RULES (AFL) STATISTICS (55+ stats)
// =============================================================================

const AFL_STATS: StatDefinition[] = [
  // SCORING (8 stats)
  { key: 'goalsAFL', name: 'Goals', shortName: 'G', description: 'Goals kicked (6 points each)', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'behinds', name: 'Behinds', shortName: 'B', description: 'Behinds kicked (1 point each)', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'totalPoints', name: 'Total Points', shortName: 'Pts', description: 'Total points (G*6 + B)', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', formula: '(goalsAFL * 6) + behinds', showInLeaderboard: true },
  { key: 'goalAccuracy', name: 'Goal Accuracy', shortName: 'G%', description: 'Goals as percentage of scoring shots', category: 'SCORING_GAA', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'scoringShots', name: 'Scoring Shots', shortName: 'SS', description: 'Total goals + behinds', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'goalAssistsAFL', name: 'Goal Assists', shortName: 'GA', description: 'Passes leading to goals', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'scoreInvolvements', name: 'Score Involvements', shortName: 'SI', description: 'Involvements in scoring chains', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'scoreLaunches', name: 'Score Launches', shortName: 'SL', description: 'Started scoring chain from D50', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // DISPOSALS (12 stats)
  { key: 'disposals', name: 'Disposals', shortName: 'Disp', description: 'Kicks + handballs', category: 'DISPOSALS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'kicks', name: 'Kicks', shortName: 'K', description: 'Kicks made', category: 'DISPOSALS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'handballs', name: 'Handballs', shortName: 'HB', description: 'Handballs made', category: 'DISPOSALS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'disposalEfficiency', name: 'Disposal Efficiency', shortName: 'DE%', description: 'Effective disposals percentage', category: 'DISPOSALS', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'effectiveDisposals', name: 'Effective Disposals', shortName: 'ED', description: 'Disposals to advantage', category: 'DISPOSALS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'kickEfficiency', name: 'Kick Efficiency', shortName: 'KE%', description: 'Effective kicks percentage', category: 'DISPOSALS', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'clangers', name: 'Clangers', shortName: 'Clg', description: 'Costly errors', category: 'DISPOSALS', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'turnoversAFL', name: 'Turnovers', shortName: 'TO', description: 'Possessions lost', category: 'DISPOSALS', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'inside50s', name: 'Inside 50s', shortName: 'I50', description: 'Entries into attacking 50m', category: 'DISPOSALS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'rebound50s', name: 'Rebound 50s', shortName: 'R50', description: 'Exits from defensive 50m', category: 'DISPOSALS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'metersGained', name: 'Metres Gained', shortName: 'MG', description: 'Territory gained', category: 'DISPOSALS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'm' },
  { key: 'kickToHandballRatio', name: 'Kick:Handball Ratio', shortName: 'K:H', description: 'Kicks per handball', category: 'DISPOSALS', type: 'RATIO', aggregation: 'AVERAGE', trend: 'NEUTRAL', precision: 2 },
  
  // CONTESTED (10 stats)
  { key: 'contestedPossessions', name: 'Contested Possessions', shortName: 'CP', description: 'Possessions won under pressure', category: 'CONTESTED', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'uncontestedPossessions', name: 'Uncontested Possessions', shortName: 'UP', description: 'Possessions won freely', category: 'CONTESTED', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'groundBallGets', name: 'Ground Ball Gets', shortName: 'GBG', description: 'Ground balls collected', category: 'CONTESTED', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'hardBallGets', name: 'Hard Ball Gets', shortName: 'HBG', description: 'Ground balls in traffic', category: 'CONTESTED', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'looseBallGets', name: 'Loose Ball Gets', shortName: 'LBG', description: 'Free ground balls', category: 'CONTESTED', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'onePercenters', name: 'One Percenters', shortName: '1%', description: 'Selfless efforts', category: 'CONTESTED', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'spoils', name: 'Spoils', shortName: 'Spl', description: 'Defensive spoils', category: 'CONTESTED', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'contestedMarks', name: 'Contested Marks', shortName: 'CM', description: 'Marks in contests', category: 'CONTESTED', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'interceptMarks', name: 'Intercept Marks', shortName: 'IM', description: 'Marks cutting off opponent', category: 'CONTESTED', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'intercepts', name: 'Intercepts', shortName: 'Int', description: 'Possession intercepts', category: 'CONTESTED', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // MARKS (6 stats)
  { key: 'marks', name: 'Marks', shortName: 'M', description: 'Total marks taken', category: 'MARKS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'marksInside50', name: 'Marks Inside 50', shortName: 'MI50', description: 'Marks in attacking 50m', category: 'MARKS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'marksOnLead', name: 'Marks on Lead', shortName: 'MoL', description: 'Marks leading into space', category: 'MARKS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'uncontestedMarks', name: 'Uncontested Marks', shortName: 'UM', description: 'Marks without contest', category: 'MARKS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'f50GroundBallGets', name: 'F50 Ground Ball Gets', shortName: 'F50GB', description: 'Ground balls in forward 50', category: 'MARKS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'markKicks', name: 'Mark Kicks', shortName: 'MK', description: 'Kicks from marks', category: 'MARKS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // CLEARANCES (8 stats)
  { key: 'clearances', name: 'Clearances', shortName: 'CLR', description: 'Total clearances', category: 'CLEARANCES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'centreClearances', name: 'Centre Clearances', shortName: 'CCL', description: 'Clearances from centre bounces', category: 'CLEARANCES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'stoppageClearances', name: 'Stoppage Clearances', shortName: 'SCL', description: 'Clearances from stoppages', category: 'CLEARANCES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'hitouts', name: 'Hitouts', shortName: 'HO', description: 'Ruck hitouts', category: 'CLEARANCES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'hitoutsToAdvantage', name: 'Hitouts to Advantage', shortName: 'HTA', description: 'Hitouts to teammate', category: 'CLEARANCES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'hitoutWinPct', name: 'Hitout Win %', shortName: 'HO%', description: 'Hitout win percentage', category: 'CLEARANCES', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'ruckContests', name: 'Ruck Contests', shortName: 'RC', description: 'Ruck contest attendances', category: 'CLEARANCES', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'followUp', name: 'Follow Up', shortName: 'FU', description: 'Hitouts followed to ground', category: 'CLEARANCES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // DEFENSIVE (6 stats)
  { key: 'tacklesAFL', name: 'Tackles', shortName: 'T', description: 'Total tackles', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'tacklesInside50', name: 'Tackles Inside 50', shortName: 'TI50', description: 'Tackles in forward 50', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'pressureActs', name: 'Pressure Acts', shortName: 'PA', description: 'Defensive pressure actions', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'defHalfPressure', name: 'Def Half Pressure', shortName: 'DHP', description: 'Pressure in defensive half', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'knockOns', name: 'Knock Ons', shortName: 'KO', description: 'Ball knocked away', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'smothers', name: 'Smothers', shortName: 'Sm', description: 'Kicks smothered', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // GENERAL (5 stats)
  { key: 'gamesAFL', name: 'Games', shortName: 'GP', description: 'Games played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', showOnCard: true },
  { key: 'timeOnGround', name: 'Time on Ground', shortName: 'TOG', description: 'Percentage time on field', category: 'GENERAL', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'NEUTRAL', unit: '%', precision: 0 },
  { key: 'brownlowVotes', name: 'Brownlow Votes', shortName: 'BV', description: 'Best on ground votes', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'supercoachPoints', name: 'SuperCoach Points', shortName: 'SC', description: 'Fantasy score', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'dreamTeamPoints', name: 'Dream Team Points', shortName: 'DT', description: 'Dream Team score', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
];

// =============================================================================
// GAELIC FOOTBALL STATISTICS (50+ stats)
// =============================================================================

const GAELIC_STATS: StatDefinition[] = [
  // SCORING (10 stats)
  { key: 'goalsGAA', name: 'Goals', shortName: 'G', description: 'Goals scored (3 points each)', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'pointsGAA', name: 'Points', shortName: 'P', description: 'Points scored (1 point each)', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'totalScoreGAA', name: 'Total Score', shortName: 'TS', description: 'Total score (G*3 + P)', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', formula: '(goalsGAA * 3) + pointsGAA', showInLeaderboard: true },
  { key: 'scoresFromPlay', name: 'Scores from Play', shortName: 'SfP', description: 'Scores from open play', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'scoresFromDeadBall', name: 'Scores from Dead Ball', shortName: 'SfD', description: 'Scores from set pieces', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'frees', name: 'Frees Scored', shortName: 'F', description: 'Free kicks converted', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'fortyfives', name: '45s Scored', shortName: '45', description: '45 metre kicks converted', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'penalties', name: 'Penalties Scored', shortName: 'Pen', description: 'Penalties converted', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'wides', name: 'Wides', shortName: 'W', description: 'Shots gone wide', category: 'SCORING_GAA', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'shotAccuracyGAA', name: 'Shot Accuracy', shortName: 'Sh%', description: 'Shots on target percentage', category: 'SCORING_GAA', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  
  // POSSESSION (12 stats)
  { key: 'possessions', name: 'Possessions', shortName: 'Pos', description: 'Total possessions', category: 'POSSESSION', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'catches', name: 'Catches', shortName: 'C', description: 'Ball caught cleanly', category: 'POSSESSION', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'soloRuns', name: 'Solo Runs', shortName: 'SR', description: 'Solo runs made', category: 'POSSESSION', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'handPasses', name: 'Hand Passes', shortName: 'HP', description: 'Hand passes made', category: 'POSSESSION', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'kickPasses', name: 'Kick Passes', shortName: 'KP', description: 'Kick passes made', category: 'POSSESSION', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'kickPassAccuracy', name: 'Kick Pass Accuracy', shortName: 'KP%', description: 'Successful kick passes %', category: 'POSSESSION', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'marksCaught', name: 'Marks', shortName: 'Mrk', description: 'Clean catches from kicks', category: 'POSSESSION', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'breakingTackles', name: 'Breaking Tackles', shortName: 'BT', description: 'Tackles evaded', category: 'POSSESSION', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'turnoversGAA', name: 'Turnovers', shortName: 'TO', description: 'Possessions lost', category: 'POSSESSION', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'turnoversWon', name: 'Turnovers Won', shortName: 'TOW', description: 'Turnovers forced', category: 'POSSESSION', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'possessionRetention', name: 'Retention %', shortName: 'Ret%', description: 'Possession retention', category: 'POSSESSION', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'foulsSuffered', name: 'Fouls Suffered', shortName: 'FS', description: 'Fouls won', category: 'POSSESSION', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // KICKOUTS (8 stats)
  { key: 'kickoutsWon', name: 'Kickouts Won', shortName: 'KOW', description: 'Kickouts won', category: 'KICKOUTS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'kickoutsLost', name: 'Kickouts Lost', shortName: 'KOL', description: 'Kickouts lost to opponent', category: 'KICKOUTS', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'kickoutRetention', name: 'Kickout Retention', shortName: 'KO%', description: 'Kickout win percentage', category: 'KICKOUTS', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['GK'] },
  { key: 'shortKickouts', name: 'Short Kickouts', shortName: 'SKO', description: 'Short kickouts taken', category: 'KICKOUTS', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['GK'] },
  { key: 'longKickouts', name: 'Long Kickouts', shortName: 'LKO', description: 'Long kickouts taken', category: 'KICKOUTS', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['GK'] },
  { key: 'kickoutContests', name: 'Kickout Contests', shortName: 'KOC', description: 'Contested kickouts', category: 'KICKOUTS', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'kickoutBreaks', name: 'Kickout Breaks', shortName: 'KOB', description: 'Fast attacks from kickouts', category: 'KICKOUTS', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'kickoutAccuracy', name: 'Kickout Accuracy', shortName: 'KOA', description: 'Kickout accuracy percentage', category: 'KICKOUTS', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['GK'] },
  
  // DEFENSIVE (10 stats)
  { key: 'tacklesGAA', name: 'Tackles', shortName: 'T', description: 'Tackles made', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true, showInLeaderboard: true },
  { key: 'blocksGAA', name: 'Blocks', shortName: 'Blk', description: 'Shots blocked', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'hooksGAA', name: 'Hooks', shortName: 'Hk', description: 'Opponent stick hooked', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'interceptionsGAA', name: 'Interceptions', shortName: 'Int', description: 'Passes intercepted', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'clearancesGAA', name: 'Clearances', shortName: 'Clr', description: 'Defensive clearances', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'savesGAA', name: 'Saves', shortName: 'Sav', description: 'Goals saved', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'] },
  { key: 'goalsConcededGAA', name: 'Goals Conceded', shortName: 'GC', description: 'Goals let in', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['GK'] },
  { key: 'dispossessions', name: 'Dispossessions', shortName: 'Disp', description: 'Times dispossessed', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'cleanSheetGAA', name: 'Clean Sheets', shortName: 'CS', description: 'Games without goals conceded', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'] },
  { key: 'dirtyWork', name: 'Dirty Work', shortName: 'DW', description: 'All defensive actions', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // DISCIPLINE (6 stats)
  { key: 'freesWonGAA', name: 'Frees Won', shortName: 'FW', description: 'Free kicks won', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'freesConcededGAA', name: 'Frees Conceded', shortName: 'FC', description: 'Free kicks given away', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'yellowCardsGAA', name: 'Yellow Cards', shortName: 'YC', description: 'Yellow cards received', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'blackCardsGAA', name: 'Black Cards', shortName: 'BC', description: 'Black cards received (10 min sin bin)', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'redCardsGAA', name: 'Red Cards', shortName: 'RC', description: 'Red cards received', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'foulsCommittedGAA', name: 'Fouls Committed', shortName: 'Fls', description: 'Total fouls committed', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // GENERAL (4 stats)
  { key: 'gamesGAA', name: 'Games', shortName: 'GP', description: 'Games played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', showOnCard: true },
  { key: 'gamesStartedGAA', name: 'Games Started', shortName: 'GS', description: 'Games started', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'minutesGAA', name: 'Minutes', shortName: 'Min', description: 'Minutes played', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'NEUTRAL', unit: 'mins' },
  { key: 'manOfMatchGAA', name: 'Man of the Match', shortName: 'MoM', description: 'Best player awards', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
];
// =============================================================================
// CRICKET STATISTICS (55+ stats)
// =============================================================================

const CRICKET_STATS: StatDefinition[] = [
  // BATTING (20 stats)
  { key: 'runs', name: 'Runs', shortName: 'R', description: 'Total runs scored', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'innings', name: 'Innings', shortName: 'Inn', description: 'Batting innings played', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'notOuts', name: 'Not Outs', shortName: 'NO', description: 'Times not dismissed', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'highScore', name: 'High Score', shortName: 'HS', description: 'Highest individual score', category: 'BATTING', type: 'COUNT', aggregation: 'MAX', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'battingAverage', name: 'Batting Average', shortName: 'Avg', description: 'Runs per dismissal', category: 'BATTING', type: 'AVERAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2, formula: 'runs / (innings - notOuts)', showOnCard: true, showInLeaderboard: true },
  { key: 'strikeRate', name: 'Strike Rate', shortName: 'SR', description: 'Runs per 100 balls', category: 'BATTING', type: 'RATE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2, formula: '(runs / ballsFaced) * 100', showInLeaderboard: true },
  { key: 'ballsFaced', name: 'Balls Faced', shortName: 'BF', description: 'Total balls faced', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'fours', name: 'Fours', shortName: '4s', description: 'Boundaries (4 runs)', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'sixes', name: 'Sixes', shortName: '6s', description: 'Over boundaries (6 runs)', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'centuries', name: 'Centuries', shortName: '100', description: 'Scores of 100+', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'halfCenturies', name: 'Half Centuries', shortName: '50', description: 'Scores of 50-99', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'ducks', name: 'Ducks', shortName: '0', description: 'Dismissed for zero', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'dotBallsFaced', name: 'Dot Balls Faced', shortName: 'Dots', description: 'Balls faced without scoring', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'boundaryPct', name: 'Boundary %', shortName: 'Bnd%', description: 'Runs from boundaries percentage', category: 'BATTING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'runningBetweenWickets', name: 'Running Between Wickets', shortName: 'RBW', description: 'Runs from running', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'battingPosition', name: 'Avg Batting Position', shortName: 'Pos', description: 'Average batting order position', category: 'BATTING', type: 'AVERAGE', aggregation: 'AVERAGE', trend: 'NEUTRAL', precision: 1 },
  { key: 'minutesBatted', name: 'Minutes Batted', shortName: 'Mins', description: 'Time spent batting', category: 'BATTING', type: 'TIME', aggregation: 'SUM', trend: 'NEUTRAL', unit: 'mins' },
  { key: 'runsPerInnings', name: 'Runs/Innings', shortName: 'R/I', description: 'Average runs per innings', category: 'BATTING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2 },
  { key: 'dismissalMethods', name: 'Caught Out %', shortName: 'C%', description: 'Percentage dismissed caught', category: 'BATTING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'NEUTRAL', unit: '%', precision: 1 },
  { key: 'partnershipRuns', name: 'Partnership Runs', shortName: 'PR', description: 'Runs in partnerships', category: 'BATTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // BOWLING (20 stats)
  { key: 'wickets', name: 'Wickets', shortName: 'W', description: 'Total wickets taken', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'overs', name: 'Overs', shortName: 'O', description: 'Overs bowled', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', precision: 1 },
  { key: 'maidens', name: 'Maidens', shortName: 'M', description: 'Maiden overs bowled', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'runsConceded', name: 'Runs Conceded', shortName: 'R', description: 'Runs given away', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'bowlingAverage', name: 'Bowling Average', shortName: 'Avg', description: 'Runs per wicket', category: 'BOWLING', type: 'AVERAGE', aggregation: 'AVERAGE', trend: 'LOWER_BETTER', precision: 2, formula: 'runsConceded / wickets', showOnCard: true, showInLeaderboard: true },
  { key: 'economyRate', name: 'Economy Rate', shortName: 'Econ', description: 'Runs per over', category: 'BOWLING', type: 'RATE', aggregation: 'AVERAGE', trend: 'LOWER_BETTER', precision: 2, formula: 'runsConceded / overs', showInLeaderboard: true },
  { key: 'bowlingStrikeRate', name: 'Strike Rate', shortName: 'SR', description: 'Balls per wicket', category: 'BOWLING', type: 'RATE', aggregation: 'AVERAGE', trend: 'LOWER_BETTER', precision: 1, formula: '(overs * 6) / wickets' },
  { key: 'bestBowling', name: 'Best Bowling', shortName: 'BB', description: 'Best bowling figures', category: 'BOWLING', type: 'COUNT', aggregation: 'MAX', trend: 'HIGHER_BETTER' },
  { key: 'fourWicketHauls', name: '4 Wicket Hauls', shortName: '4W', description: 'Innings with 4+ wickets', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'fiveWicketHauls', name: '5 Wicket Hauls', shortName: '5W', description: 'Innings with 5+ wickets', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'dotBallsBowled', name: 'Dot Balls', shortName: 'Dots', description: 'Balls without runs', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'dotBallPct', name: 'Dot Ball %', shortName: 'Dot%', description: 'Percentage of dot balls', category: 'BOWLING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'wides', name: 'Wides', shortName: 'Wd', description: 'Wide balls bowled', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'noBalls', name: 'No Balls', shortName: 'NB', description: 'No balls bowled', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'boundariesConceded', name: 'Boundaries Conceded', shortName: 'BC', description: 'Fours and sixes conceded', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'hatTricks', name: 'Hat Tricks', shortName: 'HT', description: 'Three wickets in three balls', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'bowlingInnings', name: 'Bowling Innings', shortName: 'BI', description: 'Innings bowled', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'lbws', name: 'LBWs', shortName: 'LBW', description: 'LBW dismissals', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'bowledDismissals', name: 'Bowled', shortName: 'Bwld', description: 'Clean bowled dismissals', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'caughtAndBowled', name: 'Caught & Bowled', shortName: 'C&B', description: 'Caught off own bowling', category: 'BOWLING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // FIELDING (10 stats)
  { key: 'catches', name: 'Catches', shortName: 'Ct', description: 'Catches taken', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'runOuts', name: 'Run Outs', shortName: 'RO', description: 'Run out involvements', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'directHits', name: 'Direct Hits', shortName: 'DH', description: 'Direct hit run outs', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'stumpings', name: 'Stumpings', shortName: 'St', description: 'Stumpings effected', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WK'] },
  { key: 'catchesBehind', name: 'Catches Behind', shortName: 'Ct(wk)', description: 'Catches as wicket-keeper', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WK'] },
  { key: 'byes', name: 'Byes Conceded', shortName: 'B', description: 'Byes let through', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['WK'] },
  { key: 'legByes', name: 'Leg Byes', shortName: 'LB', description: 'Leg byes conceded', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['WK'] },
  { key: 'missedStumpings', name: 'Missed Stumpings', shortName: 'MSt', description: 'Stumping chances missed', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['WK'] },
  { key: 'droppedCatches', name: 'Dropped Catches', shortName: 'DC', description: 'Catches dropped', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'fieldingDismissals', name: 'Total Dismissals', shortName: 'Dis', description: 'Total dismissals (catches + run outs + stumpings)', category: 'FIELDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', formula: 'catches + runOuts + stumpings' },
  
  // GENERAL (5 stats)
  { key: 'matches', name: 'Matches', shortName: 'Mat', description: 'Matches played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', showOnCard: true },
  { key: 'wins', name: 'Wins', shortName: 'W', description: 'Matches won', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'manOfMatch', name: 'Player of Match', shortName: 'PoM', description: 'Player of match awards', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'allRounderRating', name: 'All-Rounder Rating', shortName: 'ARR', description: 'Combined batting/bowling rating', category: 'GENERAL', type: 'SCORE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1 },
  { key: 'mvpPoints', name: 'MVP Points', shortName: 'MVP', description: 'Most Valuable Player points', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
];

// =============================================================================
// BASKETBALL STATISTICS (50+ stats)
// =============================================================================

const BASKETBALL_STATS: StatDefinition[] = [
  // SCORING (18 stats)
  { key: 'points', name: 'Points', shortName: 'PTS', description: 'Total points scored', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'pointsPerGame', name: 'Points/Game', shortName: 'PPG', description: 'Average points per game', category: 'SCORING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, showInLeaderboard: true },
  { key: 'fieldGoals', name: 'Field Goals Made', shortName: 'FGM', description: 'Field goals made', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'fieldGoalAttempts', name: 'Field Goal Attempts', shortName: 'FGA', description: 'Field goals attempted', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'fieldGoalPct', name: 'Field Goal %', shortName: 'FG%', description: 'Field goal percentage', category: 'SCORING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, showInLeaderboard: true },
  { key: 'threePointers', name: '3-Pointers Made', shortName: '3PM', description: 'Three-pointers made', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'threePointAttempts', name: '3-Point Attempts', shortName: '3PA', description: 'Three-pointers attempted', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'threePointPct', name: '3-Point %', shortName: '3P%', description: 'Three-point percentage', category: 'SCORING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, showInLeaderboard: true },
  { key: 'freeThrows', name: 'Free Throws Made', shortName: 'FTM', description: 'Free throws made', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'freeThrowAttempts', name: 'Free Throw Attempts', shortName: 'FTA', description: 'Free throws attempted', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'freeThrowPct', name: 'Free Throw %', shortName: 'FT%', description: 'Free throw percentage', category: 'SCORING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'twoPointers', name: '2-Pointers Made', shortName: '2PM', description: 'Two-pointers made', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'twoPointPct', name: '2-Point %', shortName: '2P%', description: 'Two-point percentage', category: 'SCORING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'effectiveFGPct', name: 'Effective FG %', shortName: 'eFG%', description: 'Effective field goal percentage', category: 'SCORING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, formula: '(FGM + 0.5 * 3PM) / FGA' },
  { key: 'trueShootingPct', name: 'True Shooting %', shortName: 'TS%', description: 'True shooting percentage', category: 'SCORING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'pointsInPaint', name: 'Points in Paint', shortName: 'PITP', description: 'Points scored in the paint', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'fastBreakPoints', name: 'Fast Break Points', shortName: 'FBP', description: 'Points on fast breaks', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'secondChancePoints', name: 'Second Chance Points', shortName: '2CP', description: 'Points after offensive rebounds', category: 'SCORING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // REBOUNDING (10 stats)
  { key: 'rebounds', name: 'Total Rebounds', shortName: 'REB', description: 'Total rebounds', category: 'REBOUNDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'reboundsPerGame', name: 'Rebounds/Game', shortName: 'RPG', description: 'Average rebounds per game', category: 'REBOUNDING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, showInLeaderboard: true },
  { key: 'offensiveRebounds', name: 'Offensive Rebounds', shortName: 'OREB', description: 'Offensive rebounds', category: 'REBOUNDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'defensiveRebounds', name: 'Defensive Rebounds', shortName: 'DREB', description: 'Defensive rebounds', category: 'REBOUNDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'reboundPct', name: 'Rebound %', shortName: 'REB%', description: 'Percentage of available rebounds grabbed', category: 'REBOUNDING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'offRebPct', name: 'Off Rebound %', shortName: 'OREB%', description: 'Offensive rebound percentage', category: 'REBOUNDING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'defRebPct', name: 'Def Rebound %', shortName: 'DREB%', description: 'Defensive rebound percentage', category: 'REBOUNDING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'reboundChances', name: 'Rebound Chances', shortName: 'RBC', description: 'Rebound opportunities', category: 'REBOUNDING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'contestedRebounds', name: 'Contested Rebounds', shortName: 'CREB', description: 'Contested rebounds won', category: 'REBOUNDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'boxOuts', name: 'Box Outs', shortName: 'BO', description: 'Box outs performed', category: 'REBOUNDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // PLAYMAKING (10 stats)
  { key: 'assists', name: 'Assists', shortName: 'AST', description: 'Total assists', category: 'PLAYMAKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'assistsPerGame', name: 'Assists/Game', shortName: 'APG', description: 'Average assists per game', category: 'PLAYMAKING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, showInLeaderboard: true },
  { key: 'turnovers', name: 'Turnovers', shortName: 'TO', description: 'Ball turnovers', category: 'PLAYMAKING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'assistToTurnover', name: 'Assist/Turnover', shortName: 'A/TO', description: 'Assist to turnover ratio', category: 'PLAYMAKING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 2 },
  { key: 'assistPct', name: 'Assist %', shortName: 'AST%', description: 'Percentage of teammate FGs assisted', category: 'PLAYMAKING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'turnoverPct', name: 'Turnover %', shortName: 'TO%', description: 'Turnover percentage', category: 'PLAYMAKING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'LOWER_BETTER', unit: '%', precision: 1 },
  { key: 'potentialAssists', name: 'Potential Assists', shortName: 'PAST', description: 'Passes leading to shots', category: 'PLAYMAKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'assistPoints', name: 'Assist Points Created', shortName: 'APC', description: 'Points created from assists', category: 'PLAYMAKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'passes', name: 'Passes', shortName: 'PASS', description: 'Total passes made', category: 'PLAYMAKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'badPassTurnovers', name: 'Bad Pass Turnovers', shortName: 'BPT', description: 'Turnovers from bad passes', category: 'PLAYMAKING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // DEFENSIVE (10 stats)
  { key: 'steals', name: 'Steals', shortName: 'STL', description: 'Steals', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true, showInLeaderboard: true },
  { key: 'stealsPerGame', name: 'Steals/Game', shortName: 'SPG', description: 'Average steals per game', category: 'DEFENSIVE', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1 },
  { key: 'blocks', name: 'Blocks', shortName: 'BLK', description: 'Shots blocked', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true, showInLeaderboard: true },
  { key: 'blocksPerGame', name: 'Blocks/Game', shortName: 'BPG', description: 'Average blocks per game', category: 'DEFENSIVE', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1 },
  { key: 'deflections', name: 'Deflections', shortName: 'DEF', description: 'Ball deflections', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'chargesTaken', name: 'Charges Taken', shortName: 'CHG', description: 'Offensive fouls drawn', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'contestedShots', name: 'Contested Shots', shortName: 'CONT', description: 'Shots contested', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'looseBallsRecovered', name: 'Loose Balls Recovered', shortName: 'LBR', description: 'Loose balls recovered', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'defWinShares', name: 'Defensive Win Shares', shortName: 'DWS', description: 'Defensive win shares', category: 'DEFENSIVE', type: 'AVERAGE', aggregation: 'SUM', trend: 'HIGHER_BETTER', precision: 1 },
  { key: 'defRating', name: 'Defensive Rating', shortName: 'DRTG', description: 'Points allowed per 100 possessions', category: 'DEFENSIVE', type: 'RATE', aggregation: 'AVERAGE', trend: 'LOWER_BETTER', precision: 1 },
  
  // PHYSICAL/GENERAL (10 stats)
  { key: 'games', name: 'Games', shortName: 'GP', description: 'Games played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', showOnCard: true },
  { key: 'gamesStarted', name: 'Games Started', shortName: 'GS', description: 'Games started', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'minutesPlayed', name: 'Minutes', shortName: 'MIN', description: 'Total minutes played', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'NEUTRAL', unit: 'mins' },
  { key: 'minutesPerGame', name: 'Minutes/Game', shortName: 'MPG', description: 'Average minutes per game', category: 'GENERAL', type: 'RATIO', aggregation: 'AVERAGE', trend: 'NEUTRAL', precision: 1 },
  { key: 'personalFouls', name: 'Personal Fouls', shortName: 'PF', description: 'Personal fouls committed', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'technicalFouls', name: 'Technical Fouls', shortName: 'TF', description: 'Technical fouls', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'flagrantFouls', name: 'Flagrant Fouls', shortName: 'FF', description: 'Flagrant fouls', category: 'PHYSICAL', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'plusMinus', name: 'Plus/Minus', shortName: '+/-', description: 'Point differential while on court', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'playerEfficiency', name: 'Player Efficiency', shortName: 'PER', description: 'Player efficiency rating', category: 'GENERAL', type: 'SCORE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1, showInLeaderboard: true },
  { key: 'winShares', name: 'Win Shares', shortName: 'WS', description: 'Estimated wins contributed', category: 'GENERAL', type: 'AVERAGE', aggregation: 'SUM', trend: 'HIGHER_BETTER', precision: 1 },
];

// =============================================================================
// RUGBY STATISTICS (50+ stats)
// =============================================================================

const RUGBY_STATS: StatDefinition[] = [
  // ATTACKING (15 stats)
  { key: 'tries', name: 'Tries', shortName: 'T', description: 'Tries scored', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'tryAssists', name: 'Try Assists', shortName: 'TA', description: 'Passes leading to tries', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'conversions', name: 'Conversions', shortName: 'Con', description: 'Conversions kicked', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'penaltyGoals', name: 'Penalty Goals', shortName: 'PG', description: 'Penalty goals kicked', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'dropGoals', name: 'Drop Goals', shortName: 'DG', description: 'Drop goals scored', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'pointsRugby', name: 'Total Points', shortName: 'Pts', description: 'Total points scored', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true, showInLeaderboard: true },
  { key: 'metresGained', name: 'Metres Gained', shortName: 'MG', description: 'Metres carried forward', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'm', showInLeaderboard: true },
  { key: 'carries', name: 'Carries', shortName: 'Car', description: 'Ball carries', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'metresPerCarry', name: 'Metres/Carry', shortName: 'M/C', description: 'Average metres per carry', category: 'ATTACKING', type: 'RATIO', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', precision: 1 },
  { key: 'lineBreaks', name: 'Line Breaks', shortName: 'LB', description: 'Defensive line breaks', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'defendersBeaten', name: 'Defenders Beaten', shortName: 'DB', description: 'Defenders beaten with ball', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'cleanBreaks', name: 'Clean Breaks', shortName: 'CB', description: 'Clean breaks through defence', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'postContactMetres', name: 'Post Contact Metres', shortName: 'PCM', description: 'Metres gained after contact', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'm' },
  { key: 'runs', name: 'Runs', shortName: 'Run', description: 'Running plays', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'kickingMetres', name: 'Kicking Metres', shortName: 'KM', description: 'Metres gained from kicks', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', unit: 'm' },
  
  // PASSING (8 stats)
  { key: 'passes', name: 'Passes', shortName: 'Pas', description: 'Passes made', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'offloads', name: 'Offloads', shortName: 'Off', description: 'Offloads in tackle', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'handlingErrors', name: 'Handling Errors', shortName: 'HE', description: 'Handling mistakes', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'knockOns', name: 'Knock Ons', shortName: 'KO', description: 'Knock ons', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'forwardPasses', name: 'Forward Passes', shortName: 'FP', description: 'Forward passes', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'passAccuracyRugby', name: 'Pass Accuracy', shortName: 'PA%', description: 'Successful pass percentage', category: 'PASSING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'boxKicks', name: 'Box Kicks', shortName: 'BK', description: 'Box kicks made', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['SH'] },
  { key: 'kicksFromHand', name: 'Kicks from Hand', shortName: 'KfH', description: 'Kicks from hand', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  
  // DEFENSIVE (12 stats)
  { key: 'tacklesRugby', name: 'Tackles', shortName: 'Tkl', description: 'Tackles made', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'missedTackles', name: 'Missed Tackles', shortName: 'MT', description: 'Tackles missed', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'tackleSuccess', name: 'Tackle Success', shortName: 'Tk%', description: 'Tackle success rate', category: 'DEFENSIVE', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, showInLeaderboard: true },
  { key: 'dominantTackles', name: 'Dominant Tackles', shortName: 'DT', description: 'Tackles winning collision', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'turnoversWonRugby', name: 'Turnovers Won', shortName: 'TOW', description: 'Turnovers won at breakdown', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'turnoversConRugby', name: 'Turnovers Conceded', shortName: 'TOC', description: 'Turnovers conceded', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'jackals', name: 'Jackals', shortName: 'Jkl', description: 'Turnovers at breakdown', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'rucksWon', name: 'Rucks Won', shortName: 'RW', description: 'Rucks won', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'rucksLost', name: 'Rucks Lost', shortName: 'RL', description: 'Rucks lost', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'maulsWon', name: 'Mauls Won', shortName: 'MW', description: 'Mauls won', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'chargeDowns', name: 'Charge Downs', shortName: 'CD', description: 'Kicks charged down', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'intercepts', name: 'Intercepts', shortName: 'Int', description: 'Passes intercepted', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // SET PIECES (10 stats)
  { key: 'lineoutsWon', name: 'Lineouts Won', shortName: 'LOW', description: 'Lineout wins on own throw', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'lineoutsLost', name: 'Lineouts Lost', shortName: 'LOL', description: 'Lineouts lost', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'lineoutSuccessRate', name: 'Lineout Success', shortName: 'LO%', description: 'Lineout success rate', category: 'SET_PIECES', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'lineoutSteals', name: 'Lineout Steals', shortName: 'LOS', description: 'Lineouts stolen', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'scrumsWon', name: 'Scrums Won', shortName: 'SW', description: 'Scrums won', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'scrumsLost', name: 'Scrums Lost', shortName: 'SL', description: 'Scrums lost', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'scrumSuccessRate', name: 'Scrum Success', shortName: 'Sc%', description: 'Scrum success rate', category: 'SET_PIECES', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'scrumPenaltiesWon', name: 'Scrum Penalties Won', shortName: 'SPW', description: 'Penalties won at scrum', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'restartsCaught', name: 'Restarts Caught', shortName: 'RC', description: 'Kickoffs caught', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'restartsRegained', name: 'Restarts Regained', shortName: 'RR', description: 'Kickoffs regained', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // DISCIPLINE (5 stats)
  { key: 'penaltiesConceded', name: 'Penalties Conceded', shortName: 'PC', description: 'Penalties given away', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'yellowCardsRugby', name: 'Yellow Cards', shortName: 'YC', description: 'Yellow cards', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'redCardsRugby', name: 'Red Cards', shortName: 'RC', description: 'Red cards', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'sinBinMinutes', name: 'Sin Bin Minutes', shortName: 'SBM', description: 'Minutes in sin bin', category: 'DISCIPLINE', type: 'TIME', aggregation: 'SUM', trend: 'LOWER_BETTER', unit: 'mins' },
  { key: 'freeKicksConceded', name: 'Free Kicks Conceded', shortName: 'FK', description: 'Free kicks given away', category: 'DISCIPLINE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // GENERAL (4 stats)
  { key: 'appearances', name: 'Appearances', shortName: 'App', description: 'Matches played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', showOnCard: true },
  { key: 'starts', name: 'Starts', shortName: 'Sta', description: 'Matches started', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'minutesRugby', name: 'Minutes', shortName: 'Min', description: 'Minutes played', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'NEUTRAL', unit: 'mins' },
  { key: 'manOfMatchRugby', name: 'Man of Match', shortName: 'MoM', description: 'Man of match awards', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
];

// =============================================================================
// NETBALL STATISTICS (40+ stats)
// =============================================================================

const NETBALL_STATS: StatDefinition[] = [
  // SHOOTING (12 stats)
  { key: 'goals', name: 'Goals', shortName: 'G', description: 'Goals scored', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true, relevantPositions: ['GS', 'GA'] },
  { key: 'goalAttempts', name: 'Goal Attempts', shortName: 'GA', description: 'Shots at goal', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['GS', 'GA'] },
  { key: 'shootingPct', name: 'Shooting %', shortName: 'Sh%', description: 'Goal shooting accuracy', category: 'SHOOTING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, showInLeaderboard: true, relevantPositions: ['GS', 'GA'] },
  { key: 'superShots', name: 'Super Shots', shortName: 'SS', description: '2-point goals (Super Netball)', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GS', 'GA'] },
  { key: 'superShotAttempts', name: 'Super Shot Attempts', shortName: 'SSA', description: '2-point shot attempts', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['GS', 'GA'] },
  { key: 'superShotPct', name: 'Super Shot %', shortName: 'SS%', description: 'Super shot accuracy', category: 'SHOOTING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['GS', 'GA'] },
  { key: 'goalsFromFeed', name: 'Goals from Feed', shortName: 'GfF', description: 'Goals scored from feeds', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GS', 'GA'] },
  { key: 'missedShots', name: 'Missed Shots', shortName: 'Miss', description: 'Missed shot attempts', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['GS', 'GA'] },
  { key: 'reboundsOff', name: 'Offensive Rebounds', shortName: 'OReb', description: 'Rebounds from missed shots', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GS', 'GA'] },
  { key: 'goalAssists', name: 'Goal Assists', shortName: 'GAs', description: 'Passes leading to goals', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showOnCard: true, showInLeaderboard: true, relevantPositions: ['GA', 'WA', 'C'] },
  { key: 'secondPhaseGoals', name: 'Second Phase Goals', shortName: '2PG', description: 'Goals from rebounds', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GS', 'GA'] },
  { key: 'penaltyGoals', name: 'Penalty Goals', shortName: 'PG', description: 'Goals from penalties', category: 'SHOOTING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GS', 'GA'] },
  
  // FEEDING (10 stats)
  { key: 'feeds', name: 'Feeds', shortName: 'Fd', description: 'Passes into shooting circle', category: 'FEEDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true, relevantPositions: ['WA', 'GA', 'C'] },
  { key: 'feedsWithAttempt', name: 'Feeds with Attempt', shortName: 'FwA', description: 'Feeds resulting in shot', category: 'FEEDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WA', 'GA', 'C'] },
  { key: 'centrePassReceives', name: 'Centre Pass Receives', shortName: 'CPR', description: 'Centre passes received', category: 'FEEDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WA', 'GA'] },
  { key: 'circlePenetration', name: 'Circle Penetration', shortName: 'CP', description: 'Successful circle entries', category: 'FEEDING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['WA', 'GA', 'C'] },
  { key: 'feedAccuracy', name: 'Feed Accuracy', shortName: 'Fd%', description: 'Successful feed percentage', category: 'FEEDING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'offsideFeeds', name: 'Offside Feeds', shortName: 'OsF', description: 'Feeds called offside', category: 'FEEDING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'badHands', name: 'Bad Hands', shortName: 'BH', description: 'Dropped passes/fumbles', category: 'FEEDING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'contactPenalties', name: 'Contact Penalties', shortName: 'Cnt', description: 'Contact penalties', category: 'FEEDING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'obstructionPenalties', name: 'Obstruction Penalties', shortName: 'Obs', description: 'Obstruction penalties', category: 'FEEDING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'breakdowns', name: 'Breakdowns', shortName: 'BD', description: 'Attacks that broke down', category: 'FEEDING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  
  // CENTRE PLAY (8 stats)
  { key: 'centrePasses', name: 'Centre Passes', shortName: 'CPs', description: 'Centre passes taken', category: 'CENTRE_PLAY', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', relevantPositions: ['C'] },
  { key: 'centrePassSuccess', name: 'Centre Pass Success', shortName: 'CP%', description: 'Successful centre passes', category: 'CENTRE_PLAY', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['C'] },
  { key: 'possessions', name: 'Possessions', shortName: 'Pos', description: 'Total ball possessions', category: 'CENTRE_PLAY', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'turnoversNetball', name: 'Turnovers', shortName: 'TO', description: 'Possessions lost', category: 'CENTRE_PLAY', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'generalPlayTurnovers', name: 'GP Turnovers', shortName: 'GPTO', description: 'Turnovers in general play', category: 'CENTRE_PLAY', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'pickups', name: 'Pickups', shortName: 'PU', description: 'Loose ball pickups', category: 'CENTRE_PLAY', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'offsides', name: 'Offsides', shortName: 'OS', description: 'Offside calls', category: 'CENTRE_PLAY', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'throwIns', name: 'Throw Ins', shortName: 'TI', description: 'Throw in possessions', category: 'CENTRE_PLAY', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  
  // DEFENSIVE (10 stats)
  { key: 'intercepts', name: 'Intercepts', shortName: 'Int', description: 'Interceptions', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true, relevantPositions: ['GK', 'GD', 'WD'] },
  { key: 'deflections', name: 'Deflections', shortName: 'Def', description: 'Ball deflections', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true, relevantPositions: ['GK', 'GD', 'WD'] },
  { key: 'gains', name: 'Gains', shortName: 'Gns', description: 'Turnovers gained', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'rebounds', name: 'Defensive Rebounds', shortName: 'DReb', description: 'Defensive rebounds', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK', 'GD'] },
  { key: 'tipsNet', name: 'Tips', shortName: 'Tip', description: 'Ball tips', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK', 'GD', 'WD'] },
  { key: 'contestedBall', name: 'Contested Ball', shortName: 'CB', description: 'Contested possessions won', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'penalties', name: 'Penalties', shortName: 'Pen', description: 'Total penalties', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'penaltiesAgainst', name: 'Penalties Against', shortName: 'PA', description: 'Penalties awarded against', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'oppositionGoalsDef', name: 'Opposition Goals', shortName: 'OG', description: 'Goals conceded while defending', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['GK', 'GD'] },
  { key: 'pressures', name: 'Pressures', shortName: 'Prs', description: 'Defensive pressures applied', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK', 'GD', 'WD'] },
  
  // GENERAL (5 stats)
  { key: 'quarters', name: 'Quarters', shortName: 'Q', description: 'Quarters played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', showOnCard: true },
  { key: 'minutesNetball', name: 'Minutes', shortName: 'Min', description: 'Minutes on court', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'NEUTRAL', unit: 'mins' },
  { key: 'gamesNetball', name: 'Games', shortName: 'GP', description: 'Games played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'nispScore', name: 'Nissan Net Points', shortName: 'NNP', description: 'Performance rating (Super Netball)', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'mvpVotes', name: 'MVP Votes', shortName: 'MVP', description: 'MVP voting points', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
];

// =============================================================================
// HOCKEY (FIELD HOCKEY) STATISTICS - Using Football base with hockey-specific
// =============================================================================

const HOCKEY_STATS: StatDefinition[] = [
  // ATTACKING
  { key: 'goals', name: 'Goals', shortName: 'G', description: 'Goals scored', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'assists', name: 'Assists', shortName: 'A', description: 'Assists', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', isPrimary: true, showOnCard: true, showInLeaderboard: true },
  { key: 'shots', name: 'Shots', shortName: 'Sh', description: 'Shots at goal', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'shotsOnTarget', name: 'Shots on Target', shortName: 'SoT', description: 'Shots on target', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'circleEntries', name: 'Circle Entries', shortName: 'CE', description: 'Entries into shooting circle', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'pcGoals', name: 'Penalty Corner Goals', shortName: 'PCG', description: 'Goals from penalty corners', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'fieldGoals', name: 'Field Goals', shortName: 'FG', description: 'Goals from open play', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'psGoals', name: 'Penalty Stroke Goals', shortName: 'PSG', description: 'Goals from penalty strokes', category: 'ATTACKING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // PASSING
  { key: 'passes', name: 'Passes', shortName: 'Pas', description: 'Passes attempted', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'passAccuracy', name: 'Pass Accuracy', shortName: 'Pa%', description: 'Pass accuracy', category: 'PASSING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'crosses', name: 'Crosses', shortName: 'Crs', description: 'Crosses into circle', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'throughBalls', name: 'Through Balls', shortName: 'TB', description: 'Through balls played', category: 'PASSING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // DEFENSIVE
  { key: 'tackles', name: 'Tackles', shortName: 'Tkl', description: 'Tackles won', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', showInLeaderboard: true },
  { key: 'interceptions', name: 'Interceptions', shortName: 'Int', description: 'Interceptions', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'blocks', name: 'Blocks', shortName: 'Blk', description: 'Shots blocked', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'clearances', name: 'Clearances', shortName: 'Clr', description: 'Defensive clearances', category: 'DEFENSIVE', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  
  // SET PIECES
  { key: 'penaltyCornersWon', name: 'PCs Won', shortName: 'PCW', description: 'Penalty corners won', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER' },
  { key: 'penaltyCornersConceded', name: 'PCs Conceded', shortName: 'PCC', description: 'Penalty corners conceded', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'pcConversionRate', name: 'PC Conversion', shortName: 'PC%', description: 'Penalty corner conversion rate', category: 'SET_PIECES', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1 },
  { key: 'penaltyStrokes', name: 'Penalty Strokes', shortName: 'PS', description: 'Penalty strokes taken', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  { key: 'freeHits', name: 'Free Hits', shortName: 'FH', description: 'Free hits taken', category: 'SET_PIECES', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL' },
  
  // GOALKEEPING
  { key: 'saves', name: 'Saves', shortName: 'Sav', description: 'Shots saved', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'], showInLeaderboard: true },
  { key: 'savePercentage', name: 'Save %', shortName: 'Sv%', description: 'Save percentage', category: 'GOALKEEPING', type: 'PERCENTAGE', aggregation: 'AVERAGE', trend: 'HIGHER_BETTER', unit: '%', precision: 1, relevantPositions: ['GK'] },
  { key: 'cleanSheets', name: 'Clean Sheets', shortName: 'CS', description: 'Games without conceding', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'], showOnCard: true },
  { key: 'goalsConceded', name: 'Goals Conceded', shortName: 'GC', description: 'Goals let in', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER', relevantPositions: ['GK'] },
  { key: 'pcSaves', name: 'PC Saves', shortName: 'PCS', description: 'Penalty corner saves', category: 'GOALKEEPING', type: 'COUNT', aggregation: 'SUM', trend: 'HIGHER_BETTER', relevantPositions: ['GK'] },
  
  // GENERAL
  { key: 'appearances', name: 'Appearances', shortName: 'App', description: 'Games played', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'NEUTRAL', showOnCard: true },
  { key: 'minutesPlayed', name: 'Minutes', shortName: 'Min', description: 'Minutes played', category: 'GENERAL', type: 'TIME', aggregation: 'SUM', trend: 'NEUTRAL', unit: 'mins' },
  { key: 'yellowCards', name: 'Yellow Cards', shortName: 'YC', description: 'Yellow cards (2 min)', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'greenCards', name: 'Green Cards', shortName: 'GC', description: 'Green cards (warning)', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
  { key: 'redCards', name: 'Red Cards', shortName: 'RC', description: 'Red cards', category: 'GENERAL', type: 'COUNT', aggregation: 'SUM', trend: 'LOWER_BETTER' },
];
// =============================================================================
// SPORT STATISTICS CONFIGURATION MAPPING
// =============================================================================

export const SPORT_STATS: Record<Sport, SportStatsConfig> = {
  FOOTBALL: {
    sport: 'FOOTBALL',
    categories: FOOTBALL_CATEGORIES,
    stats: FOOTBALL_STATS,
    cardStats: ['goals', 'assists', 'appearances', 'rating'],
    seasonStats: ['goals', 'assists', 'appearances', 'cleanSheets', 'passAccuracy', 'tackles'],
    matchStats: ['goals', 'assists', 'shots', 'shotsOnTarget', 'passes', 'passAccuracy', 'tackles', 'interceptions'],
    leaderboardStats: ['goals', 'assists', 'cleanSheets', 'tackles', 'saves'],
  },
  
  RUGBY: {
    sport: 'RUGBY',
    categories: RUGBY_CATEGORIES,
    stats: RUGBY_STATS,
    cardStats: ['tries', 'tacklesRugby', 'pointsRugby', 'appearances'],
    seasonStats: ['tries', 'tryAssists', 'tacklesRugby', 'metresGained', 'lineBreaks', 'turnoversWonRugby'],
    matchStats: ['tries', 'tacklesRugby', 'carries', 'metresGained', 'offloads', 'passes'],
    leaderboardStats: ['tries', 'pointsRugby', 'tacklesRugby', 'metresGained', 'turnoversWonRugby'],
  },
  
  CRICKET: {
    sport: 'CRICKET',
    categories: CRICKET_CATEGORIES,
    stats: CRICKET_STATS,
    cardStats: ['runs', 'wickets', 'catches', 'matches'],
    seasonStats: ['runs', 'battingAverage', 'strikeRate', 'wickets', 'bowlingAverage', 'economyRate', 'catches'],
    matchStats: ['runs', 'ballsFaced', 'fours', 'sixes', 'wickets', 'overs', 'runsConceded', 'catches'],
    leaderboardStats: ['runs', 'wickets', 'centuries', 'fiveWicketHauls', 'catches'],
  },
  
  BASKETBALL: {
    sport: 'BASKETBALL',
    categories: BASKETBALL_CATEGORIES,
    stats: BASKETBALL_STATS,
    cardStats: ['points', 'rebounds', 'assists', 'games'],
    seasonStats: ['pointsPerGame', 'reboundsPerGame', 'assistsPerGame', 'fieldGoalPct', 'threePointPct'],
    matchStats: ['points', 'rebounds', 'assists', 'steals', 'blocks', 'fieldGoalPct', 'threePointers'],
    leaderboardStats: ['points', 'rebounds', 'assists', 'steals', 'blocks', 'threePointers'],
  },
  
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    categories: AMERICAN_FOOTBALL_CATEGORIES,
    stats: AMERICAN_FOOTBALL_STATS,
    cardStats: ['passingYards', 'rushingYards', 'totalTackles', 'gamesPlayed'],
    seasonStats: ['passingYards', 'passingTouchdowns', 'rushingYards', 'rushingTouchdowns', 'receptions', 'receivingYards', 'sacks', 'interceptionsDef'],
    matchStats: ['completions', 'passingYards', 'passingTouchdowns', 'carries', 'rushingYards', 'receptions', 'receivingYards', 'totalTackles'],
    leaderboardStats: ['passingYards', 'rushingYards', 'receivingYards', 'totalTackles', 'sacks', 'interceptionsDef'],
  },
  
  NETBALL: {
    sport: 'NETBALL',
    categories: NETBALL_CATEGORIES,
    stats: NETBALL_STATS,
    cardStats: ['goals', 'goalAssists', 'intercepts', 'quarters'],
    seasonStats: ['goals', 'shootingPct', 'goalAssists', 'feeds', 'intercepts', 'deflections', 'gains'],
    matchStats: ['goals', 'goalAttempts', 'shootingPct', 'feeds', 'intercepts', 'deflections', 'turnoversNetball'],
    leaderboardStats: ['goals', 'goalAssists', 'intercepts', 'deflections', 'feeds'],
  },
  
  HOCKEY: {
    sport: 'HOCKEY',
    categories: HOCKEY_CATEGORIES,
    stats: HOCKEY_STATS,
    cardStats: ['goals', 'assists', 'appearances', 'cleanSheets'],
    seasonStats: ['goals', 'assists', 'appearances', 'tackles', 'saves', 'cleanSheets'],
    matchStats: ['goals', 'assists', 'shots', 'circleEntries', 'tackles', 'interceptions'],
    leaderboardStats: ['goals', 'assists', 'tackles', 'saves', 'cleanSheets'],
  },
  
  LACROSSE: {
    sport: 'LACROSSE',
    categories: LACROSSE_CATEGORIES,
    stats: LACROSSE_STATS,
    cardStats: ['goals', 'assists', 'groundBalls', 'gamesLax'],
    seasonStats: ['goals', 'assists', 'points', 'groundBalls', 'causedTurnovers', 'faceoffsWon', 'savesLax'],
    matchStats: ['goals', 'assists', 'shots', 'groundBalls', 'causedTurnovers', 'faceoffsWon'],
    leaderboardStats: ['goals', 'assists', 'points', 'groundBalls', 'faceoffsWon', 'savesLax'],
  },
  
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    categories: AFL_CATEGORIES,
    stats: AFL_STATS,
    cardStats: ['goalsAFL', 'disposals', 'marks', 'gamesAFL'],
    seasonStats: ['goalsAFL', 'behinds', 'disposals', 'marks', 'tacklesAFL', 'clearances', 'hitouts'],
    matchStats: ['goalsAFL', 'behinds', 'kicks', 'handballs', 'marks', 'tacklesAFL', 'clearances'],
    leaderboardStats: ['goalsAFL', 'disposals', 'marks', 'tacklesAFL', 'clearances', 'hitouts'],
  },
  
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    categories: GAELIC_CATEGORIES,
    stats: GAELIC_STATS,
    cardStats: ['goalsGAA', 'pointsGAA', 'tacklesGAA', 'gamesGAA'],
    seasonStats: ['goalsGAA', 'pointsGAA', 'totalScoreGAA', 'possessions', 'tacklesGAA', 'blocksGAA'],
    matchStats: ['goalsGAA', 'pointsGAA', 'possessions', 'kickPasses', 'tacklesGAA', 'blocksGAA'],
    leaderboardStats: ['goalsGAA', 'pointsGAA', 'totalScoreGAA', 'tacklesGAA', 'blocksGAA'],
  },
  
  FUTSAL: {
    sport: 'FUTSAL',
    categories: FOOTBALL_CATEGORIES,
    stats: FOOTBALL_STATS.map(s => ({
      ...s,
      // Adjust some stats for Futsal context
      ...(s.key === 'distanceCovered' ? { description: 'Total distance run (smaller pitch)' } : {}),
    })),
    cardStats: ['goals', 'assists', 'appearances', 'saves'],
    seasonStats: ['goals', 'assists', 'appearances', 'saves', 'passAccuracy'],
    matchStats: ['goals', 'assists', 'shots', 'saves', 'fouls'],
    leaderboardStats: ['goals', 'assists', 'saves'],
  },
  
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    categories: FOOTBALL_CATEGORIES,
    stats: [
      ...FOOTBALL_STATS.filter(s => !['offside', 'distanceCovered', 'sprints'].includes(s.key)),
      // Add beach soccer specific stats
      { key: 'bicycleKicks', name: 'Bicycle Kicks', shortName: 'BK', description: 'Bicycle kick goals', category: 'ATTACKING' as StatCategory, type: 'COUNT' as StatType, aggregation: 'SUM' as AggregationType, trend: 'HIGHER_BETTER' as TrendDirection, showInLeaderboard: true },
      { key: 'volleyGoals', name: 'Volley Goals', shortName: 'VG', description: 'Goals from volleys', category: 'ATTACKING' as StatCategory, type: 'COUNT' as StatType, aggregation: 'SUM' as AggregationType, trend: 'HIGHER_BETTER' as TrendDirection },
      { key: 'scissorKicks', name: 'Scissor Kicks', shortName: 'SK', description: 'Scissor kick goals', category: 'ATTACKING' as StatCategory, type: 'COUNT' as StatType, aggregation: 'SUM' as AggregationType, trend: 'HIGHER_BETTER' as TrendDirection },
    ],
    cardStats: ['goals', 'assists', 'appearances', 'saves'],
    seasonStats: ['goals', 'assists', 'appearances', 'bicycleKicks'],
    matchStats: ['goals', 'assists', 'shots', 'saves'],
    leaderboardStats: ['goals', 'assists', 'bicycleKicks'],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get stats configuration for a sport
 * @throws {Error} If sport is invalid
 */
export function getSportStats(sport: Sport): SportStatsConfig {
  const result = SportEnum.safeParse(sport);
  if (!result.success) {
    throw new Error(`Invalid sport: ${sport}. Valid sports: ${SportEnum.options.join(', ')}`);
  }
  return SPORT_STATS[sport];
}

/**
 * Get a specific stat definition by key
 */
export function getStatByKey(sport: Sport, key: string): StatDefinition | undefined {
  const config = getSportStats(sport);
  return config.stats.find(s => s.key === key);
}

/**
 * Get stats by category
 */
export function getStatsByCategory(sport: Sport, category: StatCategory): StatDefinition[] {
  const config = getSportStats(sport);
  return config.stats.filter(s => s.category === category);
}

/**
 * Get primary stats for player cards (max 4)
 */
export function getCardStats(sport: Sport): StatDefinition[] {
  const config = getSportStats(sport);
  return config.cardStats
    .map(key => config.stats.find(s => s.key === key))
    .filter((s): s is StatDefinition => s !== undefined);
}

/**
 * Get season overview stats
 */
export function getSeasonStats(sport: Sport): StatDefinition[] {
  const config = getSportStats(sport);
  return config.seasonStats
    .map(key => config.stats.find(s => s.key === key))
    .filter((s): s is StatDefinition => s !== undefined);
}

/**
 * Get match performance stats
 */
export function getMatchStats(sport: Sport): StatDefinition[] {
  const config = getSportStats(sport);
  return config.matchStats
    .map(key => config.stats.find(s => s.key === key))
    .filter((s): s is StatDefinition => s !== undefined);
}

/**
 * Get leaderboard stats
 */
export function getLeaderboardStats(sport: Sport): StatDefinition[] {
  const config = getSportStats(sport);
  return config.leaderboardStats
    .map(key => config.stats.find(s => s.key === key))
    .filter((s): s is StatDefinition => s !== undefined);
}

/**
 * Get stats relevant to a specific position
 */
export function getStatsForPosition(sport: Sport, positionCode: string): StatDefinition[] {
  const config = getSportStats(sport);
  return config.stats.filter(s => 
    !s.relevantPositions || s.relevantPositions.includes(positionCode)
  );
}

/**
 * Get primary/featured stats
 */
export function getPrimaryStats(sport: Sport): StatDefinition[] {
  const config = getSportStats(sport);
  return config.stats.filter(s => s.isPrimary);
}

/**
 * Get stats that should show on player cards
 */
export function getShowOnCardStats(sport: Sport): StatDefinition[] {
  const config = getSportStats(sport);
  return config.stats.filter(s => s.showOnCard);
}

/**
 * Format stat value for display
 */
export function formatStatValue(stat: StatDefinition, value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  
  const precision = stat.precision ?? 0;
  let formatted = value.toFixed(precision);
  
  // Add thousands separator for large numbers
  if (value >= 1000 && stat.type === 'COUNT') {
    formatted = value.toLocaleString();
  }
  
  // Add unit if specified
  if (stat.unit) {
    return `${formatted}${stat.unit}`;
  }
  
  return formatted;
}

/**
 * Get stat trend color based on comparison
 */
export function getStatTrendColor(stat: StatDefinition, current: number, previous: number): string {
  if (current === previous) return 'text-neutral-500 dark:text-neutral-400';
  
  const isImprovement = stat.trend === 'HIGHER_BETTER' 
    ? current > previous 
    : stat.trend === 'LOWER_BETTER'
      ? current < previous
      : false;
  
  return isImprovement 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';
}

/**
 * Get stat trend icon
 */
export function getStatTrendIcon(stat: StatDefinition, current: number, previous: number): 'up' | 'down' | 'neutral' {
  if (current === previous) return 'neutral';
  return current > previous ? 'up' : 'down';
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get stat category configuration
 */
export function getStatCategory(sport: Sport, category: StatCategory): StatCategoryConfig | undefined {
  const config = getSportStats(sport);
  return config.categories.find(c => c.category === category);
}

/**
 * Get all stat categories for a sport
 */
export function getStatCategories(sport: Sport): StatCategoryConfig[] {
  const config = getSportStats(sport);
  return config.categories.sort((a, b) => a.order - b.order);
}

/**
 * Validate a stat value against its definition
 */
export function validateStatValue(stat: StatDefinition, value: number): boolean {
  if (stat.minValue !== undefined && value < stat.minValue) return false;
  if (stat.maxValue !== undefined && value > stat.maxValue) return false;
  if (stat.type === 'PERCENTAGE' && (value < 0 || value > 100)) return false;
  return true;
}

/**
 * Get all sports that have a specific stat
 */
export function getSportsWithStat(statKey: string): Sport[] {
  return (Object.keys(SPORT_STATS) as Sport[]).filter(sport => 
    SPORT_STATS[sport].stats.some(s => s.key === statKey)
  );
}

/**
 * Check if a sport has a specific stat
 */
export function sportHasStat(sport: Sport, statKey: string): boolean {
  return getSportStats(sport).stats.some(s => s.key === statKey);
}

/**
 * Get total number of stats for a sport
 */
export function getStatCount(sport: Sport): number {
  return getSportStats(sport).stats.length;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default SPORT_STATS;