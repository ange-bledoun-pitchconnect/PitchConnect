/**
 * ============================================================================
 * Sport Configuration for Dashboard Components
 * ============================================================================
 * 
 * Centralized configuration for multi-sport support across all dashboard
 * components including events, stats, formations, and scoring.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * SUPPORTED SPORTS (from Schema v7.10.1):
 * - FOOTBALL, NETBALL, RUGBY, CRICKET, AMERICAN_FOOTBALL
 * - BASKETBALL, HOCKEY, LACROSSE, AUSTRALIAN_RULES
 * - GAELIC_FOOTBALL, FUTSAL, BEACH_FOOTBALL
 * 
 * ============================================================================
 */

import {
  Goal,
  AlertCircle,
  Repeat2,
  Users,
  CornerDownRight,
  Activity,
  Target,
  Shield,
  Zap,
  Clock,
  Flag,
  AlertTriangle,
  Hand,
  Circle,
  Square,
  Timer,
  type LucideIcon,
} from 'lucide-react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Sport enum from schema
 */
export type Sport =
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
 * Match event category
 */
export type EventCategory = 
  | 'scoring' 
  | 'disciplinary' 
  | 'substitution' 
  | 'set_piece' 
  | 'time' 
  | 'other';

/**
 * Match event type definition
 */
export interface MatchEventType {
  key: string;
  label: string;
  category: EventCategory;
  icon: string;
  color: string;
  bgColor: string;
  points?: number;
  requiresPlayer: boolean;
  requiresSecondPlayer?: boolean;
  hasModifiers?: string[];
}

/**
 * Sport statistic definition
 */
export interface SportStatistic {
  key: string;
  label: string;
  shortLabel: string;
  type: 'count' | 'percentage' | 'duration' | 'distance' | 'ratio';
  category: 'offensive' | 'defensive' | 'general' | 'goalkeeper' | 'specialist';
  higherIsBetter: boolean;
  maxValue?: number;
  unit?: string;
}

/**
 * Formation/lineup configuration
 */
export interface FormationConfig {
  key: string;
  label: string;
  playerCount: number;
  rows: number[];
  positions: string[];
}

/**
 * Sport configuration
 */
export interface SportDashboardConfig {
  sport: Sport;
  name: string;
  icon: string;
  primaryColor: string;
  secondaryColor: string;
  scoringTerms: {
    primary: string;
    secondary?: string;
    unit: string;
  };
  hasDraws: boolean;
  hasPeriods: boolean;
  periodName: string;
  periodCount: number;
  matchDuration: number;
  eventTypes: MatchEventType[];
  statistics: SportStatistic[];
  formations: FormationConfig[];
  positionCategories: string[];
}

// =============================================================================
// SHARED EVENT TYPES
// =============================================================================

const COMMON_EVENTS = {
  SUBSTITUTION: {
    key: 'SUBSTITUTION',
    label: 'Substitution',
    category: 'substitution' as EventCategory,
    icon: '🔄',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    requiresPlayer: true,
    requiresSecondPlayer: true,
  },
  INJURY: {
    key: 'INJURY',
    label: 'Injury',
    category: 'other' as EventCategory,
    icon: '🏥',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    requiresPlayer: true,
  },
  TIMEOUT: {
    key: 'TIMEOUT',
    label: 'Timeout',
    category: 'time' as EventCategory,
    icon: '⏸️',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    requiresPlayer: false,
  },
  PERIOD_START: {
    key: 'PERIOD_START',
    label: 'Period Start',
    category: 'time' as EventCategory,
    icon: '▶️',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    requiresPlayer: false,
  },
  PERIOD_END: {
    key: 'PERIOD_END',
    label: 'Period End',
    category: 'time' as EventCategory,
    icon: '⏹️',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    requiresPlayer: false,
  },
};

// =============================================================================
// SPORT CONFIGURATIONS
// =============================================================================

export const SPORT_DASHBOARD_CONFIGS: Record<Sport, SportDashboardConfig> = {
  // =========================================================================
  // FOOTBALL (Soccer)
  // =========================================================================
  FOOTBALL: {
    sport: 'FOOTBALL',
    name: 'Football',
    icon: '⚽',
    primaryColor: 'green',
    secondaryColor: 'white',
    scoringTerms: { primary: 'Goal', unit: 'goals' },
    hasDraws: true,
    hasPeriods: true,
    periodName: 'Half',
    periodCount: 2,
    matchDuration: 90,
    eventTypes: [
      { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '⚽', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true, hasModifiers: ['penalty', 'own_goal', 'header', 'free_kick'] },
      { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🎯', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
      { key: 'YELLOW_CARD', label: 'Yellow Card', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
      { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      { key: 'CORNER', label: 'Corner Kick', category: 'set_piece', icon: '🚩', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: false },
      { key: 'FREE_KICK', label: 'Free Kick', category: 'set_piece', icon: '🦶', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
      { key: 'PENALTY_AWARDED', label: 'Penalty Awarded', category: 'set_piece', icon: '🎯', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', requiresPlayer: true },
      { key: 'OFFSIDE', label: 'Offside', category: 'other', icon: '🚫', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800', requiresPlayer: true },
      { key: 'FOUL', label: 'Foul', category: 'other', icon: '⚠️', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
      { key: 'SAVE', label: 'Save', category: 'other', icon: '🧤', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
      COMMON_EVENTS.SUBSTITUTION,
      COMMON_EVENTS.INJURY,
    ],
    statistics: [
      { key: 'possession', label: 'Possession', shortLabel: 'Poss', type: 'percentage', category: 'general', higherIsBetter: true, maxValue: 100, unit: '%' },
      { key: 'shots', label: 'Total Shots', shortLabel: 'Shots', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'shotsOnTarget', label: 'Shots on Target', shortLabel: 'SOT', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'passes', label: 'Passes', shortLabel: 'Pass', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'passAccuracy', label: 'Pass Accuracy', shortLabel: 'Pass%', type: 'percentage', category: 'general', higherIsBetter: true, maxValue: 100, unit: '%' },
      { key: 'corners', label: 'Corners', shortLabel: 'Corn', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'fouls', label: 'Fouls', shortLabel: 'Fouls', type: 'count', category: 'defensive', higherIsBetter: false },
      { key: 'offsides', label: 'Offsides', shortLabel: 'Off', type: 'count', category: 'offensive', higherIsBetter: false },
      { key: 'yellowCards', label: 'Yellow Cards', shortLabel: 'YC', type: 'count', category: 'defensive', higherIsBetter: false },
      { key: 'redCards', label: 'Red Cards', shortLabel: 'RC', type: 'count', category: 'defensive', higherIsBetter: false },
      { key: 'saves', label: 'Saves', shortLabel: 'Saves', type: 'count', category: 'goalkeeper', higherIsBetter: true },
    ],
    formations: [
      { key: '4-3-3', label: '4-3-3', playerCount: 11, rows: [1, 4, 3, 3], positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'] },
      { key: '4-4-2', label: '4-4-2', playerCount: 11, rows: [1, 4, 4, 2], positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'] },
      { key: '4-2-3-1', label: '4-2-3-1', playerCount: 11, rows: [1, 4, 2, 3, 1], positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'LW', 'CAM', 'RW', 'ST'] },
      { key: '3-5-2', label: '3-5-2', playerCount: 11, rows: [1, 3, 5, 2], positions: ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'CM', 'RWB', 'ST', 'ST'] },
      { key: '5-3-2', label: '5-3-2', playerCount: 11, rows: [1, 5, 3, 2], positions: ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'CM', 'ST', 'ST'] },
    ],
    positionCategories: ['Goalkeeper', 'Defense', 'Midfield', 'Attack'],
  },

  // =========================================================================
  // BASKETBALL
  // =========================================================================
  BASKETBALL: {
    sport: 'BASKETBALL',
    name: 'Basketball',
    icon: '🏀',
    primaryColor: 'orange',
    secondaryColor: 'white',
    scoringTerms: { primary: 'Point', unit: 'points' },
    hasDraws: false,
    hasPeriods: true,
    periodName: 'Quarter',
    periodCount: 4,
    matchDuration: 48,
    eventTypes: [
      { key: 'TWO_POINTER', label: '2-Point Field Goal', category: 'scoring', icon: '🏀', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', points: 2, requiresPlayer: true },
      { key: 'THREE_POINTER', label: '3-Point Field Goal', category: 'scoring', icon: '🎯', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 3, requiresPlayer: true },
      { key: 'FREE_THROW', label: 'Free Throw', category: 'scoring', icon: '🎪', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 1, requiresPlayer: true },
      { key: 'FREE_THROW_MISS', label: 'Free Throw Miss', category: 'other', icon: '❌', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      { key: 'REBOUND_OFF', label: 'Offensive Rebound', category: 'other', icon: '📥', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', requiresPlayer: true },
      { key: 'REBOUND_DEF', label: 'Defensive Rebound', category: 'other', icon: '📤', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
      { key: 'ASSIST', label: 'Assist', category: 'other', icon: '🎯', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
      { key: 'STEAL', label: 'Steal', category: 'other', icon: '🔥', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      { key: 'BLOCK', label: 'Block', category: 'other', icon: '🛡️', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
      { key: 'TURNOVER', label: 'Turnover', category: 'other', icon: '🔄', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
      { key: 'PERSONAL_FOUL', label: 'Personal Foul', category: 'disciplinary', icon: '⚠️', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
      { key: 'TECHNICAL_FOUL', label: 'Technical Foul', category: 'disciplinary', icon: '🟨', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', requiresPlayer: true },
      { key: 'FLAGRANT_FOUL', label: 'Flagrant Foul', category: 'disciplinary', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      COMMON_EVENTS.SUBSTITUTION,
      COMMON_EVENTS.TIMEOUT,
    ],
    statistics: [
      { key: 'points', label: 'Points', shortLabel: 'PTS', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'fieldGoalsMade', label: 'Field Goals Made', shortLabel: 'FGM', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'fieldGoalPct', label: 'Field Goal %', shortLabel: 'FG%', type: 'percentage', category: 'offensive', higherIsBetter: true, maxValue: 100, unit: '%' },
      { key: 'threePointersMade', label: '3-Pointers Made', shortLabel: '3PM', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'threePointPct', label: '3-Point %', shortLabel: '3P%', type: 'percentage', category: 'offensive', higherIsBetter: true, maxValue: 100, unit: '%' },
      { key: 'freeThrowsMade', label: 'Free Throws Made', shortLabel: 'FTM', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'freeThrowPct', label: 'Free Throw %', shortLabel: 'FT%', type: 'percentage', category: 'offensive', higherIsBetter: true, maxValue: 100, unit: '%' },
      { key: 'rebounds', label: 'Total Rebounds', shortLabel: 'REB', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'assists', label: 'Assists', shortLabel: 'AST', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'steals', label: 'Steals', shortLabel: 'STL', type: 'count', category: 'defensive', higherIsBetter: true },
      { key: 'blocks', label: 'Blocks', shortLabel: 'BLK', type: 'count', category: 'defensive', higherIsBetter: true },
      { key: 'turnovers', label: 'Turnovers', shortLabel: 'TO', type: 'count', category: 'general', higherIsBetter: false },
      { key: 'fouls', label: 'Personal Fouls', shortLabel: 'PF', type: 'count', category: 'defensive', higherIsBetter: false },
    ],
    formations: [
      { key: 'standard', label: 'Standard', playerCount: 5, rows: [2, 2, 1], positions: ['PG', 'SG', 'SF', 'PF', 'C'] },
      { key: 'small-ball', label: 'Small Ball', playerCount: 5, rows: [2, 2, 1], positions: ['PG', 'SG', 'SF', 'SF', 'PF'] },
      { key: 'big-lineup', label: 'Big Lineup', playerCount: 5, rows: [1, 2, 2], positions: ['PG', 'SF', 'PF', 'C', 'C'] },
    ],
    positionCategories: ['Guard', 'Forward', 'Center'],
  },

  // =========================================================================
  // RUGBY
  // =========================================================================
  RUGBY: {
    sport: 'RUGBY',
    name: 'Rugby',
    icon: '🏉',
    primaryColor: 'red',
    secondaryColor: 'white',
    scoringTerms: { primary: 'Try', secondary: 'Point', unit: 'points' },
    hasDraws: true,
    hasPeriods: true,
    periodName: 'Half',
    periodCount: 2,
    matchDuration: 80,
    eventTypes: [
      { key: 'TRY', label: 'Try', category: 'scoring', icon: '🏉', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 5, requiresPlayer: true },
      { key: 'CONVERSION', label: 'Conversion', category: 'scoring', icon: '🥅', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 2, requiresPlayer: true },
      { key: 'PENALTY_KICK', label: 'Penalty Kick', category: 'scoring', icon: '🎯', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', points: 3, requiresPlayer: true },
      { key: 'DROP_GOAL', label: 'Drop Goal', category: 'scoring', icon: '🦶', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 3, requiresPlayer: true },
      { key: 'YELLOW_CARD', label: 'Yellow Card (Sin Bin)', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
      { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      { key: 'SCRUM', label: 'Scrum', category: 'set_piece', icon: '🤼', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: false },
      { key: 'LINEOUT', label: 'Lineout', category: 'set_piece', icon: '📏', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: false },
      { key: 'PENALTY', label: 'Penalty Awarded', category: 'other', icon: '⚠️', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', requiresPlayer: true },
      { key: 'KNOCK_ON', label: 'Knock On', category: 'other', icon: '🤚', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800', requiresPlayer: true },
      COMMON_EVENTS.SUBSTITUTION,
      COMMON_EVENTS.INJURY,
    ],
    statistics: [
      { key: 'tries', label: 'Tries', shortLabel: 'Tries', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'conversions', label: 'Conversions', shortLabel: 'Conv', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'penaltyKicks', label: 'Penalty Kicks', shortLabel: 'PK', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'tackles', label: 'Tackles', shortLabel: 'Tack', type: 'count', category: 'defensive', higherIsBetter: true },
      { key: 'missedTackles', label: 'Missed Tackles', shortLabel: 'MTack', type: 'count', category: 'defensive', higherIsBetter: false },
      { key: 'metersCarried', label: 'Meters Carried', shortLabel: 'Mtrs', type: 'distance', category: 'offensive', higherIsBetter: true, unit: 'm' },
      { key: 'linebreaks', label: 'Line Breaks', shortLabel: 'LB', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'turnoversWon', label: 'Turnovers Won', shortLabel: 'TOW', type: 'count', category: 'defensive', higherIsBetter: true },
      { key: 'turnoversLost', label: 'Turnovers Lost', shortLabel: 'TOL', type: 'count', category: 'general', higherIsBetter: false },
      { key: 'scrums', label: 'Scrums Won', shortLabel: 'Scrm', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'lineouts', label: 'Lineouts Won', shortLabel: 'LO', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'penalties', label: 'Penalties Conceded', shortLabel: 'Pen', type: 'count', category: 'defensive', higherIsBetter: false },
    ],
    formations: [
      { key: 'standard-15', label: 'Standard 15', playerCount: 15, rows: [1, 4, 2, 3, 3, 2], positions: ['FB', 'RW', 'OC', 'IC', 'LW', 'FH', 'SH', 'N8', 'FL', 'FL', 'LK', 'LK', 'THP', 'HK', 'LHP'] },
    ],
    positionCategories: ['Backs', 'Forwards'],
  },

  // =========================================================================
  // CRICKET
  // =========================================================================
  CRICKET: {
    sport: 'CRICKET',
    name: 'Cricket',
    icon: '🏏',
    primaryColor: 'amber',
    secondaryColor: 'white',
    scoringTerms: { primary: 'Run', unit: 'runs' },
    hasDraws: true,
    hasPeriods: true,
    periodName: 'Innings',
    periodCount: 2,
    matchDuration: 360,
    eventTypes: [
      { key: 'RUN', label: 'Run', category: 'scoring', icon: '🏃', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true },
      { key: 'BOUNDARY_4', label: 'Boundary (4)', category: 'scoring', icon: '4️⃣', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 4, requiresPlayer: true },
      { key: 'SIX', label: 'Six', category: 'scoring', icon: '6️⃣', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 6, requiresPlayer: true },
      { key: 'WICKET', label: 'Wicket', category: 'other', icon: '🎯', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true, hasModifiers: ['bowled', 'caught', 'lbw', 'run_out', 'stumped'] },
      { key: 'WIDE', label: 'Wide', category: 'other', icon: '↔️', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', points: 1, requiresPlayer: true },
      { key: 'NO_BALL', label: 'No Ball', category: 'other', icon: '🚫', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', points: 1, requiresPlayer: true },
      { key: 'DOT_BALL', label: 'Dot Ball', category: 'other', icon: '⚫', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800', requiresPlayer: false },
      { key: 'OVER_COMPLETE', label: 'Over Complete', category: 'time', icon: '✅', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', requiresPlayer: true },
      COMMON_EVENTS.INJURY,
    ],
    statistics: [
      { key: 'runs', label: 'Runs', shortLabel: 'Runs', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'wickets', label: 'Wickets', shortLabel: 'Wkts', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'overs', label: 'Overs Bowled', shortLabel: 'Ovrs', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'runRate', label: 'Run Rate', shortLabel: 'RR', type: 'ratio', category: 'offensive', higherIsBetter: true },
      { key: 'boundaries', label: 'Boundaries', shortLabel: '4s', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'sixes', label: 'Sixes', shortLabel: '6s', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'extras', label: 'Extras', shortLabel: 'Ext', type: 'count', category: 'general', higherIsBetter: false },
      { key: 'dotBalls', label: 'Dot Balls', shortLabel: 'Dots', type: 'count', category: 'defensive', higherIsBetter: true },
      { key: 'economy', label: 'Economy Rate', shortLabel: 'Econ', type: 'ratio', category: 'defensive', higherIsBetter: false },
      { key: 'strikeRate', label: 'Strike Rate', shortLabel: 'SR', type: 'ratio', category: 'offensive', higherIsBetter: true },
    ],
    formations: [
      { key: 'batting-order', label: 'Batting Order', playerCount: 11, rows: [11], positions: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] },
    ],
    positionCategories: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'],
  },

  // =========================================================================
  // NETBALL
  // =========================================================================
  NETBALL: {
    sport: 'NETBALL',
    name: 'Netball',
    icon: '🏐',
    primaryColor: 'purple',
    secondaryColor: 'white',
    scoringTerms: { primary: 'Goal', unit: 'goals' },
    hasDraws: true,
    hasPeriods: true,
    periodName: 'Quarter',
    periodCount: 4,
    matchDuration: 60,
    eventTypes: [
      { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '🥅', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true },
      { key: 'GOAL_MISS', label: 'Goal Miss', category: 'other', icon: '❌', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      { key: 'INTERCEPT', label: 'Intercept', category: 'other', icon: '🤚', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
      { key: 'TURNOVER', label: 'Turnover', category: 'other', icon: '🔄', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
      { key: 'CONTACT', label: 'Contact', category: 'disciplinary', icon: '⚠️', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
      { key: 'OBSTRUCTION', label: 'Obstruction', category: 'disciplinary', icon: '🚫', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', requiresPlayer: true },
      { key: 'HELD_BALL', label: 'Held Ball', category: 'other', icon: '⏱️', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800', requiresPlayer: true },
      COMMON_EVENTS.SUBSTITUTION,
      COMMON_EVENTS.TIMEOUT,
    ],
    statistics: [
      { key: 'goals', label: 'Goals', shortLabel: 'G', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'goalAttempts', label: 'Goal Attempts', shortLabel: 'GA', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'goalAccuracy', label: 'Goal Accuracy', shortLabel: 'G%', type: 'percentage', category: 'offensive', higherIsBetter: true, maxValue: 100, unit: '%' },
      { key: 'intercepts', label: 'Intercepts', shortLabel: 'Int', type: 'count', category: 'defensive', higherIsBetter: true },
      { key: 'rebounds', label: 'Rebounds', shortLabel: 'Reb', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'centrePassReceives', label: 'Centre Pass Receives', shortLabel: 'CPR', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'turnovers', label: 'Turnovers', shortLabel: 'TO', type: 'count', category: 'general', higherIsBetter: false },
      { key: 'penalties', label: 'Penalties', shortLabel: 'Pen', type: 'count', category: 'defensive', higherIsBetter: false },
    ],
    formations: [
      { key: 'standard-7', label: 'Standard', playerCount: 7, rows: [2, 3, 2], positions: ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'] },
    ],
    positionCategories: ['Attack', 'Midcourt', 'Defense'],
  },

  // =========================================================================
  // AMERICAN FOOTBALL
  // =========================================================================
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    name: 'American Football',
    icon: '🏈',
    primaryColor: 'brown',
    secondaryColor: 'white',
    scoringTerms: { primary: 'Touchdown', secondary: 'Point', unit: 'points' },
    hasDraws: true,
    hasPeriods: true,
    periodName: 'Quarter',
    periodCount: 4,
    matchDuration: 60,
    eventTypes: [
      { key: 'TOUCHDOWN', label: 'Touchdown', category: 'scoring', icon: '🏈', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 6, requiresPlayer: true },
      { key: 'EXTRA_POINT', label: 'Extra Point', category: 'scoring', icon: '1️⃣', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 1, requiresPlayer: true },
      { key: 'TWO_POINT_CONVERSION', label: '2-Point Conversion', category: 'scoring', icon: '2️⃣', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 2, requiresPlayer: true },
      { key: 'FIELD_GOAL', label: 'Field Goal', category: 'scoring', icon: '🎯', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', points: 3, requiresPlayer: true },
      { key: 'SAFETY', label: 'Safety', category: 'scoring', icon: '🛡️', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', points: 2, requiresPlayer: false },
      { key: 'INTERCEPTION', label: 'Interception', category: 'other', icon: '🤚', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
      { key: 'FUMBLE', label: 'Fumble', category: 'other', icon: '🏈', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', requiresPlayer: true },
      { key: 'SACK', label: 'Sack', category: 'other', icon: '💥', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
      { key: 'PENALTY_FLAG', label: 'Penalty Flag', category: 'disciplinary', icon: '🚩', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
      COMMON_EVENTS.SUBSTITUTION,
      COMMON_EVENTS.TIMEOUT,
    ],
    statistics: [
      { key: 'passingYards', label: 'Passing Yards', shortLabel: 'PYds', type: 'distance', category: 'offensive', higherIsBetter: true, unit: 'yds' },
      { key: 'rushingYards', label: 'Rushing Yards', shortLabel: 'RYds', type: 'distance', category: 'offensive', higherIsBetter: true, unit: 'yds' },
      { key: 'totalYards', label: 'Total Yards', shortLabel: 'TYds', type: 'distance', category: 'offensive', higherIsBetter: true, unit: 'yds' },
      { key: 'firstDowns', label: 'First Downs', shortLabel: '1st', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'completions', label: 'Completions', shortLabel: 'Comp', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'interceptions', label: 'Interceptions', shortLabel: 'INT', type: 'count', category: 'defensive', higherIsBetter: true },
      { key: 'sacks', label: 'Sacks', shortLabel: 'Sck', type: 'count', category: 'defensive', higherIsBetter: true },
      { key: 'fumbles', label: 'Fumbles', shortLabel: 'Fum', type: 'count', category: 'general', higherIsBetter: false },
      { key: 'penalties', label: 'Penalties', shortLabel: 'Pen', type: 'count', category: 'general', higherIsBetter: false },
      { key: 'timeOfPossession', label: 'Time of Possession', shortLabel: 'TOP', type: 'duration', category: 'general', higherIsBetter: true },
    ],
    formations: [
      { key: 'offense-standard', label: 'Offense (Standard)', playerCount: 11, rows: [5, 1, 2, 2, 1], positions: ['LT', 'LG', 'C', 'RG', 'RT', 'QB', 'RB', 'FB', 'WR', 'WR', 'TE'] },
      { key: 'defense-4-3', label: 'Defense (4-3)', playerCount: 11, rows: [4, 3, 2, 2], positions: ['DE', 'DT', 'DT', 'DE', 'LB', 'LB', 'LB', 'CB', 'CB', 'SS', 'FS'] },
    ],
    positionCategories: ['Offense', 'Defense', 'Special Teams'],
  },

  // =========================================================================
  // HOCKEY (Ice/Field)
  // =========================================================================
  HOCKEY: {
    sport: 'HOCKEY',
    name: 'Hockey',
    icon: '🏒',
    primaryColor: 'blue',
    secondaryColor: 'white',
    scoringTerms: { primary: 'Goal', unit: 'goals' },
    hasDraws: true,
    hasPeriods: true,
    periodName: 'Period',
    periodCount: 3,
    matchDuration: 60,
    eventTypes: [
      { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '🥅', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true, hasModifiers: ['power_play', 'short_handed', 'empty_net'] },
      { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🎯', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
      { key: 'PENALTY_MINOR', label: 'Minor Penalty (2 min)', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
      { key: 'PENALTY_MAJOR', label: 'Major Penalty (5 min)', category: 'disciplinary', icon: '🟧', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', requiresPlayer: true },
      { key: 'PENALTY_MISCONDUCT', label: 'Misconduct', category: 'disciplinary', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      { key: 'POWER_PLAY_START', label: 'Power Play Start', category: 'other', icon: '⚡', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: false },
      { key: 'SAVE', label: 'Save', category: 'other', icon: '🧤', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
      { key: 'FACEOFF_WIN', label: 'Faceoff Win', category: 'other', icon: '🔄', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
      COMMON_EVENTS.SUBSTITUTION,
    ],
    statistics: [
      { key: 'goals', label: 'Goals', shortLabel: 'G', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'assists', label: 'Assists', shortLabel: 'A', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'points', label: 'Points (G+A)', shortLabel: 'P', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'plusMinus', label: '+/-', shortLabel: '+/-', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'shots', label: 'Shots', shortLabel: 'SOG', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'saves', label: 'Saves', shortLabel: 'SV', type: 'count', category: 'goalkeeper', higherIsBetter: true },
      { key: 'savePercentage', label: 'Save %', shortLabel: 'SV%', type: 'percentage', category: 'goalkeeper', higherIsBetter: true, maxValue: 100, unit: '%' },
      { key: 'penaltyMinutes', label: 'Penalty Minutes', shortLabel: 'PIM', type: 'duration', category: 'defensive', higherIsBetter: false, unit: 'min' },
      { key: 'faceoffWins', label: 'Faceoff Wins', shortLabel: 'FOW', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'hits', label: 'Hits', shortLabel: 'HIT', type: 'count', category: 'defensive', higherIsBetter: true },
      { key: 'blockedShots', label: 'Blocked Shots', shortLabel: 'BLK', type: 'count', category: 'defensive', higherIsBetter: true },
    ],
    formations: [
      { key: 'standard-6', label: 'Standard', playerCount: 6, rows: [1, 2, 2, 1], positions: ['G', 'LD', 'RD', 'LW', 'C', 'RW'] },
      { key: 'power-play', label: 'Power Play (5v4)', playerCount: 5, rows: [1, 2, 2], positions: ['G', 'D', 'D', 'F', 'F'] },
    ],
    positionCategories: ['Forwards', 'Defense', 'Goaltender'],
  },

  // =========================================================================
  // LACROSSE
  // =========================================================================
  LACROSSE: {
    sport: 'LACROSSE',
    name: 'Lacrosse',
    icon: '🥍',
    primaryColor: 'indigo',
    secondaryColor: 'white',
    scoringTerms: { primary: 'Goal', unit: 'goals' },
    hasDraws: false,
    hasPeriods: true,
    periodName: 'Quarter',
    periodCount: 4,
    matchDuration: 60,
    eventTypes: [
      { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '🥅', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true },
      { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🎯', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
      { key: 'GROUND_BALL', label: 'Ground Ball', category: 'other', icon: '🥍', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
      { key: 'FACEOFF_WIN', label: 'Faceoff Win', category: 'other', icon: '🔄', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: true },
      { key: 'SAVE', label: 'Save', category: 'other', icon: '🧤', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
      { key: 'TURNOVER', label: 'Turnover', category: 'other', icon: '🔄', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      { key: 'PENALTY', label: 'Penalty', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
      COMMON_EVENTS.SUBSTITUTION,
      COMMON_EVENTS.TIMEOUT,
    ],
    statistics: [
      { key: 'goals', label: 'Goals', shortLabel: 'G', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'assists', label: 'Assists', shortLabel: 'A', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'groundBalls', label: 'Ground Balls', shortLabel: 'GB', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'faceoffsWon', label: 'Faceoffs Won', shortLabel: 'FOW', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'saves', label: 'Saves', shortLabel: 'SV', type: 'count', category: 'goalkeeper', higherIsBetter: true },
      { key: 'turnovers', label: 'Turnovers', shortLabel: 'TO', type: 'count', category: 'general', higherIsBetter: false },
      { key: 'causedTurnovers', label: 'Caused Turnovers', shortLabel: 'CT', type: 'count', category: 'defensive', higherIsBetter: true },
    ],
    formations: [
      { key: 'standard-10', label: 'Standard', playerCount: 10, rows: [1, 3, 3, 3], positions: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'] },
    ],
    positionCategories: ['Attack', 'Midfield', 'Defense', 'Goalie'],
  },

  // =========================================================================
  // AUSTRALIAN RULES (AFL)
  // =========================================================================
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    name: 'Australian Rules',
    icon: '🏉',
    primaryColor: 'yellow',
    secondaryColor: 'navy',
    scoringTerms: { primary: 'Goal', secondary: 'Behind', unit: 'points' },
    hasDraws: true,
    hasPeriods: true,
    periodName: 'Quarter',
    periodCount: 4,
    matchDuration: 80,
    eventTypes: [
      { key: 'GOAL', label: 'Goal (6 pts)', category: 'scoring', icon: '🥅', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 6, requiresPlayer: true },
      { key: 'BEHIND', label: 'Behind (1 pt)', category: 'scoring', icon: '🎯', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 1, requiresPlayer: true },
      { key: 'MARK', label: 'Mark', category: 'other', icon: '🙌', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: true },
      { key: 'TACKLE', label: 'Tackle', category: 'other', icon: '💪', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
      { key: 'FREE_KICK', label: 'Free Kick', category: 'other', icon: '🦶', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
      { key: 'REPORT', label: 'Report', category: 'disciplinary', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      COMMON_EVENTS.SUBSTITUTION,
    ],
    statistics: [
      { key: 'goals', label: 'Goals', shortLabel: 'G', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'behinds', label: 'Behinds', shortLabel: 'B', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'disposals', label: 'Disposals', shortLabel: 'Disp', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'kicks', label: 'Kicks', shortLabel: 'K', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'handballs', label: 'Handballs', shortLabel: 'HB', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'marks', label: 'Marks', shortLabel: 'M', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'tackles', label: 'Tackles', shortLabel: 'T', type: 'count', category: 'defensive', higherIsBetter: true },
      { key: 'hitouts', label: 'Hitouts', shortLabel: 'HO', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'clearances', label: 'Clearances', shortLabel: 'CL', type: 'count', category: 'general', higherIsBetter: true },
    ],
    formations: [
      { key: 'standard-18', label: 'Standard', playerCount: 18, rows: [6, 6, 6], positions: ['FB', 'CHB', 'CHB', 'CHB', 'FB', 'HB', 'C', 'W', 'R', 'W', 'C', 'HF', 'CHF', 'CHF', 'CHF', 'HF', 'FF', 'FF'] },
    ],
    positionCategories: ['Forward', 'Midfield', 'Defense', 'Ruck'],
  },

  // =========================================================================
  // GAELIC FOOTBALL
  // =========================================================================
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    name: 'Gaelic Football',
    icon: '🏐',
    primaryColor: 'emerald',
    secondaryColor: 'white',
    scoringTerms: { primary: 'Goal', secondary: 'Point', unit: 'points' },
    hasDraws: true,
    hasPeriods: true,
    periodName: 'Half',
    periodCount: 2,
    matchDuration: 70,
    eventTypes: [
      { key: 'GOAL', label: 'Goal (3 pts)', category: 'scoring', icon: '🥅', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 3, requiresPlayer: true },
      { key: 'POINT', label: 'Point (1 pt)', category: 'scoring', icon: '🎯', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 1, requiresPlayer: true },
      { key: 'FREE_KICK', label: 'Free Kick', category: 'set_piece', icon: '🦶', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: true },
      { key: 'YELLOW_CARD', label: 'Yellow Card', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
      { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      { key: 'BLACK_CARD', label: 'Black Card', category: 'disciplinary', icon: '⬛', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800', requiresPlayer: true },
      COMMON_EVENTS.SUBSTITUTION,
    ],
    statistics: [
      { key: 'goals', label: 'Goals', shortLabel: 'G', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'points', label: 'Points', shortLabel: 'P', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'frees', label: 'Frees Won', shortLabel: 'F', type: 'count', category: 'general', higherIsBetter: true },
      { key: 'turnovers', label: 'Turnovers', shortLabel: 'TO', type: 'count', category: 'general', higherIsBetter: false },
      { key: 'soloRuns', label: 'Solo Runs', shortLabel: 'SR', type: 'count', category: 'offensive', higherIsBetter: true },
    ],
    formations: [
      { key: 'standard-15', label: 'Standard', playerCount: 15, rows: [1, 3, 3, 2, 3, 3], positions: ['GK', 'CB', 'FB', 'CB', 'HB', 'CHB', 'HB', 'MF', 'MF', 'HF', 'CHF', 'HF', 'CF', 'FF', 'CF'] },
    ],
    positionCategories: ['Goalkeeper', 'Defense', 'Midfield', 'Forward'],
  },

  // =========================================================================
  // FUTSAL
  // =========================================================================
  FUTSAL: {
    sport: 'FUTSAL',
    name: 'Futsal',
    icon: '⚽',
    primaryColor: 'teal',
    secondaryColor: 'white',
    scoringTerms: { primary: 'Goal', unit: 'goals' },
    hasDraws: true,
    hasPeriods: true,
    periodName: 'Half',
    periodCount: 2,
    matchDuration: 40,
    eventTypes: [
      { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '⚽', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true },
      { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🎯', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
      { key: 'YELLOW_CARD', label: 'Yellow Card', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
      { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      { key: 'FOUL', label: 'Foul', category: 'other', icon: '⚠️', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
      { key: 'ACCUMULATED_FOUL', label: 'Accumulated Foul (6th+)', category: 'other', icon: '🔴', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: false },
      COMMON_EVENTS.SUBSTITUTION,
      COMMON_EVENTS.TIMEOUT,
    ],
    statistics: [
      { key: 'goals', label: 'Goals', shortLabel: 'G', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'assists', label: 'Assists', shortLabel: 'A', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'shots', label: 'Shots', shortLabel: 'Sh', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'saves', label: 'Saves', shortLabel: 'SV', type: 'count', category: 'goalkeeper', higherIsBetter: true },
      { key: 'fouls', label: 'Fouls', shortLabel: 'F', type: 'count', category: 'defensive', higherIsBetter: false },
      { key: 'accumulatedFouls', label: 'Accumulated Fouls', shortLabel: 'AF', type: 'count', category: 'defensive', higherIsBetter: false },
    ],
    formations: [
      { key: 'standard-5', label: 'Standard', playerCount: 5, rows: [1, 2, 2], positions: ['GK', 'FX', 'FX', 'AL', 'PV'] },
      { key: 'power-play', label: 'Power Play (5v4)', playerCount: 5, rows: [1, 2, 2], positions: ['GK', 'AL', 'AL', 'PV', 'PV'] },
    ],
    positionCategories: ['Goalkeeper', 'Defense', 'Midfield', 'Attack'],
  },

  // =========================================================================
  // BEACH FOOTBALL
  // =========================================================================
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    name: 'Beach Football',
    icon: '🏖️',
    primaryColor: 'cyan',
    secondaryColor: 'yellow',
    scoringTerms: { primary: 'Goal', unit: 'goals' },
    hasDraws: false,
    hasPeriods: true,
    periodName: 'Period',
    periodCount: 3,
    matchDuration: 36,
    eventTypes: [
      { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '⚽', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true, hasModifiers: ['bicycle_kick', 'header', 'volley'] },
      { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🎯', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
      { key: 'YELLOW_CARD', label: 'Yellow Card', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
      { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
      { key: 'FOUL', label: 'Foul', category: 'other', icon: '⚠️', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
      COMMON_EVENTS.SUBSTITUTION,
    ],
    statistics: [
      { key: 'goals', label: 'Goals', shortLabel: 'G', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'assists', label: 'Assists', shortLabel: 'A', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'shots', label: 'Shots', shortLabel: 'Sh', type: 'count', category: 'offensive', higherIsBetter: true },
      { key: 'saves', label: 'Saves', shortLabel: 'SV', type: 'count', category: 'goalkeeper', higherIsBetter: true },
      { key: 'bicycleKicks', label: 'Bicycle Kicks', shortLabel: 'BK', type: 'count', category: 'offensive', higherIsBetter: true },
    ],
    formations: [
      { key: 'standard-5', label: 'Standard', playerCount: 5, rows: [1, 2, 2], positions: ['GK', 'DF', 'DF', 'WG', 'PV'] },
    ],
    positionCategories: ['Goalkeeper', 'Defense', 'Attack'],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get sport configuration by sport key
 */
export function getSportConfig(sport: Sport): SportDashboardConfig {
  return SPORT_DASHBOARD_CONFIGS[sport];
}

/**
 * Get event types for a sport
 */
export function getSportEventTypes(sport: Sport): MatchEventType[] {
  return SPORT_DASHBOARD_CONFIGS[sport]?.eventTypes || [];
}

/**
 * Get statistics for a sport
 */
export function getSportStatistics(sport: Sport): SportStatistic[] {
  return SPORT_DASHBOARD_CONFIGS[sport]?.statistics || [];
}

/**
 * Get formations for a sport
 */
export function getSportFormations(sport: Sport): FormationConfig[] {
  return SPORT_DASHBOARD_CONFIGS[sport]?.formations || [];
}

/**
 * Get scoring term for a sport
 */
export function getScoringTerm(sport: Sport, plural: boolean = false): string {
  const config = SPORT_DASHBOARD_CONFIGS[sport];
  return plural ? config?.scoringTerms.unit : config?.scoringTerms.primary;
}

/**
 * Check if sport has draws
 */
export function sportHasDraws(sport: Sport): boolean {
  return SPORT_DASHBOARD_CONFIGS[sport]?.hasDraws ?? true;
}

/**
 * Get all sports
 */
export function getAllSports(): Sport[] {
  return Object.keys(SPORT_DASHBOARD_CONFIGS) as Sport[];
}

export default SPORT_DASHBOARD_CONFIGS;
