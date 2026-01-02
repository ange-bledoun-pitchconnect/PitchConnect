/**
 * ============================================================================
 * SPORT DASHBOARD CONFIGURATION - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade dashboard configuration for multi-sport support including:
 * - Match event types with icons and colors
 * - Scoring systems and terminology
 * - Period/quarter configurations
 * - Formation support indicators
 * - Dashboard widget configurations
 * 
 * All 12 sports fully configured with authentic rules and terminology.
 * 
 * @version 3.0.0
 * @path src/config/sport-dashboard-config.ts
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

export const EventCategoryEnum = z.enum([
  'scoring',
  'disciplinary',
  'substitution',
  'set_piece',
  'time',
  'defensive',
  'other',
]);

export type EventCategory = z.infer<typeof EventCategoryEnum>;

// =============================================================================
// SCHEMAS
// =============================================================================

export const MatchEventTypeSchema = z.object({
  key: z.string(),
  label: z.string(),
  category: EventCategoryEnum,
  icon: z.string(),
  color: z.string(),
  bgColor: z.string(),
  points: z.number().optional(),
  requiresPlayer: z.boolean(),
  requiresSecondPlayer: z.boolean().optional(),
  hasModifiers: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export type MatchEventType = z.infer<typeof MatchEventTypeSchema>;

export const SportDashboardConfigSchema = z.object({
  sport: SportEnum,
  name: z.string(),
  shortName: z.string(),
  icon: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  scoringTerms: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    unit: z.string(),
  }),
  hasDraws: z.boolean(),
  hasPeriods: z.boolean(),
  periodName: z.string(),
  periodCount: z.number(),
  matchDuration: z.number(),
  hasOvertime: z.boolean(),
  hasFormations: z.boolean(),
  eventTypes: z.array(MatchEventTypeSchema),
  positionCategories: z.array(z.string()),
  dashboardWidgets: z.array(z.string()),
});

export type SportDashboardConfig = z.infer<typeof SportDashboardConfigSchema>;

// =============================================================================
// COMMON EVENT TYPES (Shared across sports)
// =============================================================================

const COMMON_EVENTS = {
  SUBSTITUTION: {
    key: 'SUBSTITUTION',
    label: 'Substitution',
    category: 'substitution' as EventCategory,
    icon: '🔄',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    requiresPlayer: true,
    requiresSecondPlayer: true,
    description: 'Player substitution',
  },
  INJURY: {
    key: 'INJURY',
    label: 'Injury',
    category: 'other' as EventCategory,
    icon: '🏥',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    requiresPlayer: true,
    description: 'Player injury',
  },
  TIMEOUT: {
    key: 'TIMEOUT',
    label: 'Timeout',
    category: 'time' as EventCategory,
    icon: '⏸️',
    color: 'text-neutral-600 dark:text-neutral-400',
    bgColor: 'bg-neutral-100 dark:bg-neutral-800',
    requiresPlayer: false,
    description: 'Team timeout',
  },
  PERIOD_START: {
    key: 'PERIOD_START',
    label: 'Period Start',
    category: 'time' as EventCategory,
    icon: '▶️',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    requiresPlayer: false,
    description: 'Period/half begins',
  },
  PERIOD_END: {
    key: 'PERIOD_END',
    label: 'Period End',
    category: 'time' as EventCategory,
    icon: '⏹️',
    color: 'text-neutral-600 dark:text-neutral-400',
    bgColor: 'bg-neutral-100 dark:bg-neutral-800',
    requiresPlayer: false,
    description: 'Period/half ends',
  },
  VAR_REVIEW: {
    key: 'VAR_REVIEW',
    label: 'VAR Review',
    category: 'other' as EventCategory,
    icon: '📺',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    requiresPlayer: false,
    description: 'Video review',
  },
};

// =============================================================================
// FOOTBALL (SOCCER) DASHBOARD CONFIG
// =============================================================================

const FOOTBALL_CONFIG: SportDashboardConfig = {
  sport: 'FOOTBALL',
  name: 'Football',
  shortName: 'Football',
  icon: '⚽',
  primaryColor: '#22C55E',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Goal', unit: 'goals' },
  hasDraws: true,
  hasPeriods: true,
  periodName: 'Half',
  periodCount: 2,
  matchDuration: 90,
  hasOvertime: true,
  hasFormations: true,
  eventTypes: [
    { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '⚽', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true, hasModifiers: ['penalty', 'own_goal', 'header', 'free_kick'] },
    { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🎯', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
    { key: 'YELLOW_CARD', label: 'Yellow Card', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
    { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'SECOND_YELLOW', label: 'Second Yellow', category: 'disciplinary', icon: '🟨🟥', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'PENALTY_AWARDED', label: 'Penalty Awarded', category: 'set_piece', icon: '⚠️', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: false },
    { key: 'PENALTY_MISSED', label: 'Penalty Missed', category: 'set_piece', icon: '❌', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'PENALTY_SAVED', label: 'Penalty Saved', category: 'set_piece', icon: '🧤', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: true },
    { key: 'CORNER', label: 'Corner', category: 'set_piece', icon: '🚩', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: false },
    { key: 'OFFSIDE', label: 'Offside', category: 'other', icon: '🚫', color: 'text-neutral-600 dark:text-neutral-400', bgColor: 'bg-neutral-100 dark:bg-neutral-800', requiresPlayer: true },
    { key: 'SAVE', label: 'Save', category: 'defensive', icon: '🧤', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.INJURY,
    COMMON_EVENTS.VAR_REVIEW,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Goalkeeper', 'Defense', 'Midfield', 'Attack'],
  dashboardWidgets: ['live_score', 'timeline', 'formations', 'stats', 'player_ratings', 'possession', 'shots', 'cards'],
};

// =============================================================================
// RUGBY UNION DASHBOARD CONFIG
// =============================================================================

const RUGBY_CONFIG: SportDashboardConfig = {
  sport: 'RUGBY',
  name: 'Rugby Union',
  shortName: 'Rugby',
  icon: '🏉',
  primaryColor: '#8B5CF6',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Try', secondary: 'Conversion', unit: 'points' },
  hasDraws: true,
  hasPeriods: true,
  periodName: 'Half',
  periodCount: 2,
  matchDuration: 80,
  hasOvertime: true,
  hasFormations: false,
  eventTypes: [
    { key: 'TRY', label: 'Try', category: 'scoring', icon: '🏉', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 5, requiresPlayer: true },
    { key: 'CONVERSION', label: 'Conversion', category: 'scoring', icon: '🥅', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 2, requiresPlayer: true },
    { key: 'PENALTY_GOAL', label: 'Penalty Goal', category: 'scoring', icon: '🎯', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', points: 3, requiresPlayer: true },
    { key: 'DROP_GOAL', label: 'Drop Goal', category: 'scoring', icon: '🦶', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 3, requiresPlayer: true },
    { key: 'PENALTY_TRY', label: 'Penalty Try', category: 'scoring', icon: '⚠️', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 7, requiresPlayer: false },
    { key: 'YELLOW_CARD', label: 'Yellow Card', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
    { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'PENALTY', label: 'Penalty Conceded', category: 'disciplinary', icon: '⚠️', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
    { key: 'SCRUM', label: 'Scrum', category: 'set_piece', icon: '🤼', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: false },
    { key: 'LINEOUT', label: 'Lineout', category: 'set_piece', icon: '📏', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: false },
    { key: 'TURNOVER', label: 'Turnover', category: 'defensive', icon: '🔄', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', requiresPlayer: true },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.INJURY,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Front Row', 'Locks', 'Back Row', 'Half Backs', 'Centres', 'Outside Backs'],
  dashboardWidgets: ['live_score', 'timeline', 'stats', 'possession', 'territory', 'scrums', 'lineouts', 'tackles'],
};

// =============================================================================
// CRICKET DASHBOARD CONFIG
// =============================================================================

const CRICKET_CONFIG: SportDashboardConfig = {
  sport: 'CRICKET',
  name: 'Cricket',
  shortName: 'Cricket',
  icon: '🏏',
  primaryColor: '#F59E0B',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Run', secondary: 'Wicket', unit: 'runs' },
  hasDraws: true,
  hasPeriods: true,
  periodName: 'Innings',
  periodCount: 2,
  matchDuration: 420,
  hasOvertime: false,
  hasFormations: false,
  eventTypes: [
    { key: 'RUN', label: 'Run', category: 'scoring', icon: '🏃', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true },
    { key: 'BOUNDARY_FOUR', label: 'Four', category: 'scoring', icon: '4️⃣', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 4, requiresPlayer: true },
    { key: 'BOUNDARY_SIX', label: 'Six', category: 'scoring', icon: '6️⃣', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 6, requiresPlayer: true },
    { key: 'WICKET', label: 'Wicket', category: 'scoring', icon: '🎯', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true, requiresSecondPlayer: true, hasModifiers: ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket'] },
    { key: 'WIDE', label: 'Wide', category: 'other', icon: '↔️', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', points: 1, requiresPlayer: true },
    { key: 'NO_BALL', label: 'No Ball', category: 'other', icon: '🚫', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', points: 1, requiresPlayer: true },
    { key: 'BYE', label: 'Bye', category: 'other', icon: '👋', color: 'text-neutral-600 dark:text-neutral-400', bgColor: 'bg-neutral-100 dark:bg-neutral-800', requiresPlayer: false },
    { key: 'LEG_BYE', label: 'Leg Bye', category: 'other', icon: '🦵', color: 'text-neutral-600 dark:text-neutral-400', bgColor: 'bg-neutral-100 dark:bg-neutral-800', requiresPlayer: false },
    { key: 'CATCH', label: 'Catch', category: 'defensive', icon: '🧤', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
    { key: 'DROP', label: 'Dropped Catch', category: 'other', icon: '❌', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'REVIEW', label: 'DRS Review', category: 'other', icon: '📺', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: false },
    { key: 'DRINKS', label: 'Drinks Break', category: 'time', icon: '🥤', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: false },
    { key: 'INNINGS_END', label: 'Innings End', category: 'time', icon: '🔚', color: 'text-neutral-600 dark:text-neutral-400', bgColor: 'bg-neutral-100 dark:bg-neutral-800', requiresPlayer: false },
  ],
  positionCategories: ['Wicket-Keeper', 'Batsman', 'Bowler', 'All-Rounder'],
  dashboardWidgets: ['scorecard', 'wagon_wheel', 'manhattan', 'partnerships', 'bowling_analysis', 'over_by_over'],
};

// =============================================================================
// BASKETBALL DASHBOARD CONFIG
// =============================================================================

const BASKETBALL_CONFIG: SportDashboardConfig = {
  sport: 'BASKETBALL',
  name: 'Basketball',
  shortName: 'Basketball',
  icon: '🏀',
  primaryColor: '#EF4444',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Point', secondary: 'Three-Pointer', unit: 'points' },
  hasDraws: false,
  hasPeriods: true,
  periodName: 'Quarter',
  periodCount: 4,
  matchDuration: 48,
  hasOvertime: true,
  hasFormations: false,
  eventTypes: [
    { key: 'TWO_POINTER', label: '2-Point FG', category: 'scoring', icon: '🏀', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 2, requiresPlayer: true },
    { key: 'THREE_POINTER', label: '3-Point FG', category: 'scoring', icon: '3️⃣', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 3, requiresPlayer: true },
    { key: 'FREE_THROW', label: 'Free Throw', category: 'scoring', icon: '🎯', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 1, requiresPlayer: true },
    { key: 'FREE_THROW_MISS', label: 'FT Miss', category: 'other', icon: '❌', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🤝', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
    { key: 'REBOUND', label: 'Rebound', category: 'defensive', icon: '🔄', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true, hasModifiers: ['offensive', 'defensive'] },
    { key: 'STEAL', label: 'Steal', category: 'defensive', icon: '🏃', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', requiresPlayer: true },
    { key: 'BLOCK', label: 'Block', category: 'defensive', icon: '✋', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
    { key: 'TURNOVER', label: 'Turnover', category: 'other', icon: '↩️', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'FOUL', label: 'Personal Foul', category: 'disciplinary', icon: '⚠️', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
    { key: 'TECH_FOUL', label: 'Technical Foul', category: 'disciplinary', icon: '🟥', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'FLAGRANT_FOUL', label: 'Flagrant Foul', category: 'disciplinary', icon: '🚨', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.TIMEOUT,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Guards', 'Forwards', 'Center'],
  dashboardWidgets: ['live_score', 'shot_chart', 'box_score', 'play_by_play', 'team_stats', 'quarter_breakdown'],
};

// =============================================================================
// AMERICAN FOOTBALL DASHBOARD CONFIG
// =============================================================================

const AMERICAN_FOOTBALL_CONFIG: SportDashboardConfig = {
  sport: 'AMERICAN_FOOTBALL',
  name: 'American Football',
  shortName: 'Am. Football',
  icon: '🏈',
  primaryColor: '#6366F1',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Touchdown', secondary: 'Field Goal', unit: 'points' },
  hasDraws: false,
  hasPeriods: true,
  periodName: 'Quarter',
  periodCount: 4,
  matchDuration: 60,
  hasOvertime: true,
  hasFormations: true,
  eventTypes: [
    { key: 'TOUCHDOWN', label: 'Touchdown', category: 'scoring', icon: '🏈', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 6, requiresPlayer: true },
    { key: 'EXTRA_POINT', label: 'Extra Point', category: 'scoring', icon: '➕', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 1, requiresPlayer: true },
    { key: 'TWO_POINT_CONV', label: '2-Point Conversion', category: 'scoring', icon: '2️⃣', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 2, requiresPlayer: true },
    { key: 'FIELD_GOAL', label: 'Field Goal', category: 'scoring', icon: '🥅', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', points: 3, requiresPlayer: true },
    { key: 'SAFETY', label: 'Safety', category: 'scoring', icon: '⚠️', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', points: 2, requiresPlayer: false },
    { key: 'INTERCEPTION', label: 'Interception', category: 'defensive', icon: '🤚', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'FUMBLE', label: 'Fumble', category: 'other', icon: '🔄', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'FUMBLE_RECOVERY', label: 'Fumble Recovery', category: 'defensive', icon: '✊', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', requiresPlayer: true },
    { key: 'SACK', label: 'Sack', category: 'defensive', icon: '💥', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
    { key: 'FIRST_DOWN', label: 'First Down', category: 'other', icon: '1️⃣', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: false },
    { key: 'PENALTY', label: 'Penalty', category: 'disciplinary', icon: '🚩', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: false, hasModifiers: ['holding', 'false_start', 'offside', 'pass_interference'] },
    { key: 'PUNT', label: 'Punt', category: 'other', icon: '🦶', color: 'text-neutral-600 dark:text-neutral-400', bgColor: 'bg-neutral-100 dark:bg-neutral-800', requiresPlayer: true },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.TIMEOUT,
    COMMON_EVENTS.INJURY,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Offense', 'Defense', 'Special Teams'],
  dashboardWidgets: ['live_score', 'drive_chart', 'box_score', 'play_by_play', 'passing_chart', 'rushing_stats'],
};

// =============================================================================
// NETBALL DASHBOARD CONFIG
// =============================================================================

const NETBALL_CONFIG: SportDashboardConfig = {
  sport: 'NETBALL',
  name: 'Netball',
  shortName: 'Netball',
  icon: '🏐',
  primaryColor: '#EC4899',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Goal', unit: 'goals' },
  hasDraws: true,
  hasPeriods: true,
  periodName: 'Quarter',
  periodCount: 4,
  matchDuration: 60,
  hasOvertime: true,
  hasFormations: false,
  eventTypes: [
    { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '🥅', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true },
    { key: 'SUPER_SHOT', label: 'Super Shot (2pts)', category: 'scoring', icon: '⭐', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 2, requiresPlayer: true },
    { key: 'GOAL_MISS', label: 'Goal Miss', category: 'other', icon: '❌', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'INTERCEPT', label: 'Intercept', category: 'defensive', icon: '🤚', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
    { key: 'DEFLECTION', label: 'Deflection', category: 'defensive', icon: '👆', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
    { key: 'GAIN', label: 'Gain', category: 'defensive', icon: '✊', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', requiresPlayer: true },
    { key: 'REBOUND', label: 'Rebound', category: 'defensive', icon: '🔄', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
    { key: 'TURNOVER', label: 'Turnover', category: 'other', icon: '↩️', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'CONTACT', label: 'Contact Penalty', category: 'disciplinary', icon: '⚠️', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
    { key: 'OBSTRUCTION', label: 'Obstruction', category: 'disciplinary', icon: '🚫', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
    { key: 'OFFSIDE', label: 'Offside', category: 'disciplinary', icon: '🚩', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.TIMEOUT,
    COMMON_EVENTS.INJURY,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Shooters', 'Centre Court', 'Defenders'],
  dashboardWidgets: ['live_score', 'shooting_stats', 'quarter_breakdown', 'player_stats', 'turnovers', 'gains'],
};

// =============================================================================
// HOCKEY (FIELD HOCKEY) DASHBOARD CONFIG
// =============================================================================

const HOCKEY_CONFIG: SportDashboardConfig = {
  sport: 'HOCKEY',
  name: 'Field Hockey',
  shortName: 'Hockey',
  icon: '🏑',
  primaryColor: '#06B6D4',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Goal', unit: 'goals' },
  hasDraws: true,
  hasPeriods: true,
  periodName: 'Quarter',
  periodCount: 4,
  matchDuration: 60,
  hasOvertime: true,
  hasFormations: true,
  eventTypes: [
    { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '🥅', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true, hasModifiers: ['field_goal', 'penalty_corner', 'penalty_stroke'] },
    { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🎯', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
    { key: 'PENALTY_CORNER', label: 'Penalty Corner', category: 'set_piece', icon: '🚩', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: false },
    { key: 'PENALTY_STROKE', label: 'Penalty Stroke', category: 'set_piece', icon: '⚠️', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'SAVE', label: 'Save', category: 'defensive', icon: '🧤', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: true },
    { key: 'GREEN_CARD', label: 'Green Card', category: 'disciplinary', icon: '🟩', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', requiresPlayer: true },
    { key: 'YELLOW_CARD', label: 'Yellow Card', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
    { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'FREE_HIT', label: 'Free Hit', category: 'set_piece', icon: '🏑', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: false },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.INJURY,
    COMMON_EVENTS.VAR_REVIEW,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Goalkeeper', 'Defense', 'Midfield', 'Attack'],
  dashboardWidgets: ['live_score', 'timeline', 'formations', 'penalty_corners', 'circle_entries', 'player_stats'],
};

// =============================================================================
// LACROSSE DASHBOARD CONFIG
// =============================================================================

const LACROSSE_CONFIG: SportDashboardConfig = {
  sport: 'LACROSSE',
  name: 'Lacrosse',
  shortName: 'Lacrosse',
  icon: '🥍',
  primaryColor: '#14B8A6',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Goal', unit: 'goals' },
  hasDraws: false,
  hasPeriods: true,
  periodName: 'Quarter',
  periodCount: 4,
  matchDuration: 60,
  hasOvertime: true,
  hasFormations: false,
  eventTypes: [
    { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '🥍', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true },
    { key: 'TWO_POINT_GOAL', label: '2-Point Goal', category: 'scoring', icon: '2️⃣', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 2, requiresPlayer: true },
    { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🎯', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
    { key: 'SAVE', label: 'Save', category: 'defensive', icon: '🧤', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
    { key: 'GROUND_BALL', label: 'Ground Ball', category: 'other', icon: '⚫', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
    { key: 'FACE_OFF_WIN', label: 'Face-Off Win', category: 'other', icon: '🤼', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
    { key: 'CAUSED_TURNOVER', label: 'Caused Turnover', category: 'defensive', icon: '🔄', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', requiresPlayer: true },
    { key: 'TURNOVER', label: 'Turnover', category: 'other', icon: '↩️', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'PENALTY', label: 'Penalty', category: 'disciplinary', icon: '⚠️', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true, hasModifiers: ['slashing', 'holding', 'illegal_body_check', 'cross_check'] },
    { key: 'MAN_UP_GOAL', label: 'Man-Up Goal', category: 'scoring', icon: '⬆️', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.TIMEOUT,
    COMMON_EVENTS.INJURY,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Goalkeeper', 'Defense', 'Midfield', 'Attack'],
  dashboardWidgets: ['live_score', 'face_offs', 'ground_balls', 'shot_chart', 'player_stats', 'penalties'],
};

// =============================================================================
// AUSTRALIAN RULES (AFL) DASHBOARD CONFIG
// =============================================================================

const AFL_CONFIG: SportDashboardConfig = {
  sport: 'AUSTRALIAN_RULES',
  name: 'Australian Rules Football',
  shortName: 'AFL',
  icon: '🏉',
  primaryColor: '#F97316',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Goal', secondary: 'Behind', unit: 'points' },
  hasDraws: true,
  hasPeriods: true,
  periodName: 'Quarter',
  periodCount: 4,
  matchDuration: 80,
  hasOvertime: true,
  hasFormations: false,
  eventTypes: [
    { key: 'GOAL', label: 'Goal (6 pts)', category: 'scoring', icon: '🥅', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 6, requiresPlayer: true },
    { key: 'BEHIND', label: 'Behind (1 pt)', category: 'scoring', icon: '🎯', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 1, requiresPlayer: true },
    { key: 'RUSHED_BEHIND', label: 'Rushed Behind', category: 'scoring', icon: '↩️', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', points: 1, requiresPlayer: false },
    { key: 'MARK', label: 'Mark', category: 'other', icon: '🙌', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: true, hasModifiers: ['contested', 'uncontested'] },
    { key: 'TACKLE', label: 'Tackle', category: 'defensive', icon: '💪', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', requiresPlayer: true },
    { key: 'HITOUT', label: 'Hitout', category: 'other', icon: '👆', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
    { key: 'CLEARANCE', label: 'Clearance', category: 'other', icon: '🔄', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
    { key: 'FREE_KICK', label: 'Free Kick', category: 'other', icon: '🦶', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
    { key: 'REPORT', label: 'Report', category: 'disciplinary', icon: '🟥', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'FIFTY_METRE', label: '50m Penalty', category: 'disciplinary', icon: '⚠️', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.INJURY,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Key Position', 'General', 'Ruck', 'On-Field'],
  dashboardWidgets: ['live_score', 'disposals', 'clearances', 'inside_50s', 'marks', 'player_stats'],
};

// =============================================================================
// GAELIC FOOTBALL DASHBOARD CONFIG
// =============================================================================

const GAELIC_CONFIG: SportDashboardConfig = {
  sport: 'GAELIC_FOOTBALL',
  name: 'Gaelic Football',
  shortName: 'GAA Football',
  icon: '🏐',
  primaryColor: '#84CC16',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Goal', secondary: 'Point', unit: 'points' },
  hasDraws: true,
  hasPeriods: true,
  periodName: 'Half',
  periodCount: 2,
  matchDuration: 70,
  hasOvertime: true,
  hasFormations: false,
  eventTypes: [
    { key: 'GOAL', label: 'Goal (3 pts)', category: 'scoring', icon: '🥅', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 3, requiresPlayer: true },
    { key: 'POINT', label: 'Point (1 pt)', category: 'scoring', icon: '🎯', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', points: 1, requiresPlayer: true, hasModifiers: ['play', 'free', '45', 'mark'] },
    { key: 'WIDE', label: 'Wide', category: 'other', icon: '↔️', color: 'text-neutral-600 dark:text-neutral-400', bgColor: 'bg-neutral-100 dark:bg-neutral-800', requiresPlayer: true },
    { key: 'FREE_KICK', label: 'Free Kick', category: 'set_piece', icon: '🦶', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: true },
    { key: 'FORTY_FIVE', label: '45 Metre Kick', category: 'set_piece', icon: '4️⃣5️⃣', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: true },
    { key: 'MARK', label: 'Mark', category: 'other', icon: '🙌', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', requiresPlayer: true },
    { key: 'YELLOW_CARD', label: 'Yellow Card', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
    { key: 'BLACK_CARD', label: 'Black Card', category: 'disciplinary', icon: '⬛', color: 'text-neutral-600 dark:text-neutral-400', bgColor: 'bg-neutral-100 dark:bg-neutral-800', requiresPlayer: true },
    { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'KICKOUT', label: 'Kickout', category: 'other', icon: '🥅', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.INJURY,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Goalkeeper', 'Backs', 'Midfield', 'Forwards'],
  dashboardWidgets: ['live_score', 'scoring_breakdown', 'kickouts', 'possessions', 'player_stats', 'wides'],
};

// =============================================================================
// FUTSAL DASHBOARD CONFIG
// =============================================================================

const FUTSAL_CONFIG: SportDashboardConfig = {
  sport: 'FUTSAL',
  name: 'Futsal',
  shortName: 'Futsal',
  icon: '⚽',
  primaryColor: '#10B981',
  secondaryColor: '#FFFFFF',
  scoringTerms: { primary: 'Goal', unit: 'goals' },
  hasDraws: true,
  hasPeriods: true,
  periodName: 'Half',
  periodCount: 2,
  matchDuration: 40,
  hasOvertime: true,
  hasFormations: true,
  eventTypes: [
    { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '⚽', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true },
    { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🎯', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
    { key: 'YELLOW_CARD', label: 'Yellow Card', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
    { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'FOUL', label: 'Foul', category: 'disciplinary', icon: '⚠️', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
    { key: 'ACCUMULATED_FOUL', label: 'Accumulated Foul (6th+)', category: 'set_piece', icon: '🔴', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: false, description: 'Free kick from 10m without wall' },
    { key: 'PENALTY', label: 'Penalty (6m)', category: 'set_piece', icon: '⚠️', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', requiresPlayer: true },
    { key: 'DOUBLE_PENALTY', label: 'Double Penalty (10m)', category: 'set_piece', icon: '⚠️', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'SAVE', label: 'Save', category: 'defensive', icon: '🧤', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
    { key: 'POWER_PLAY', label: 'Power Play (5v4)', category: 'other', icon: '⬆️', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', requiresPlayer: false },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.TIMEOUT,
    COMMON_EVENTS.INJURY,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Goleiro', 'Fixo/Beque', 'Ala', 'Pivô'],
  dashboardWidgets: ['live_score', 'timeline', 'formations', 'accumulated_fouls', 'shots', 'player_stats'],
};

// =============================================================================
// BEACH FOOTBALL (Beach Soccer) DASHBOARD CONFIG
// =============================================================================

const BEACH_FOOTBALL_CONFIG: SportDashboardConfig = {
  sport: 'BEACH_FOOTBALL',
  name: 'Beach Soccer',
  shortName: 'Beach Soccer',
  icon: '🏖️',
  primaryColor: '#FBBF24',
  secondaryColor: '#06B6D4',
  scoringTerms: { primary: 'Goal', unit: 'goals' },
  hasDraws: false,
  hasPeriods: true,
  periodName: 'Period',
  periodCount: 3,
  matchDuration: 36,
  hasOvertime: true,
  hasFormations: true,
  eventTypes: [
    { key: 'GOAL', label: 'Goal', category: 'scoring', icon: '⚽', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', points: 1, requiresPlayer: true, hasModifiers: ['bicycle_kick', 'scissor_kick', 'header', 'volley', 'free_kick'] },
    { key: 'BICYCLE_KICK_GOAL', label: 'Bicycle Kick Goal', category: 'scoring', icon: '🚴', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', points: 1, requiresPlayer: true },
    { key: 'SCISSOR_KICK_GOAL', label: 'Scissor Kick Goal', category: 'scoring', icon: '✂️', color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-100 dark:bg-pink-900/30', points: 1, requiresPlayer: true },
    { key: 'ASSIST', label: 'Assist', category: 'scoring', icon: '🎯', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
    { key: 'YELLOW_CARD', label: 'Yellow Card', category: 'disciplinary', icon: '🟨', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', requiresPlayer: true },
    { key: 'RED_CARD', label: 'Red Card', category: 'disciplinary', icon: '🟥', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'BLUE_CARD', label: 'Blue Card (2min)', category: 'disciplinary', icon: '🟦', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', requiresPlayer: true },
    { key: 'FOUL', label: 'Foul', category: 'disciplinary', icon: '⚠️', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', requiresPlayer: true },
    { key: 'PENALTY', label: 'Penalty', category: 'set_piece', icon: '⚠️', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', requiresPlayer: true },
    { key: 'SAVE', label: 'Save', category: 'defensive', icon: '🧤', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', requiresPlayer: true },
    { key: 'GOALKEEPER_GOAL', label: 'Goalkeeper Goal', category: 'scoring', icon: '🧤⚽', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', points: 1, requiresPlayer: true },
    COMMON_EVENTS.SUBSTITUTION,
    COMMON_EVENTS.TIMEOUT,
    COMMON_EVENTS.INJURY,
    COMMON_EVENTS.PERIOD_START,
    COMMON_EVENTS.PERIOD_END,
  ],
  positionCategories: ['Goalkeeper', 'Defense', 'Attack'],
  dashboardWidgets: ['live_score', 'timeline', 'formations', 'spectacular_goals', 'shots', 'player_stats'],
};

// =============================================================================
// SPORT DASHBOARD CONFIGURATION MAPPING
// =============================================================================

export const SPORT_DASHBOARD_CONFIGS: Record<Sport, SportDashboardConfig> = {
  FOOTBALL: FOOTBALL_CONFIG,
  RUGBY: RUGBY_CONFIG,
  CRICKET: CRICKET_CONFIG,
  BASKETBALL: BASKETBALL_CONFIG,
  AMERICAN_FOOTBALL: AMERICAN_FOOTBALL_CONFIG,
  NETBALL: NETBALL_CONFIG,
  HOCKEY: HOCKEY_CONFIG,
  LACROSSE: LACROSSE_CONFIG,
  AUSTRALIAN_RULES: AFL_CONFIG,
  GAELIC_FOOTBALL: GAELIC_CONFIG,
  FUTSAL: FUTSAL_CONFIG,
  BEACH_FOOTBALL: BEACH_FOOTBALL_CONFIG,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get sport dashboard configuration
 * @throws {Error} If sport is invalid
 */
export function getSportConfig(sport: Sport): SportDashboardConfig {
  const result = SportEnum.safeParse(sport);
  if (!result.success) {
    throw new Error(`Invalid sport: ${sport}. Valid sports: ${SportEnum.options.join(', ')}`);
  }
  return SPORT_DASHBOARD_CONFIGS[sport];
}

/**
 * Get event types for a sport
 */
export function getSportEventTypes(sport: Sport): MatchEventType[] {
  return getSportConfig(sport).eventTypes;
}

/**
 * Get event type by key
 */
export function getEventTypeByKey(sport: Sport, key: string): MatchEventType | undefined {
  return getSportConfig(sport).eventTypes.find(e => e.key === key);
}

/**
 * Get scoring events for a sport
 */
export function getScoringEvents(sport: Sport): MatchEventType[] {
  return getSportConfig(sport).eventTypes.filter(e => e.category === 'scoring');
}

/**
 * Get disciplinary events for a sport
 */
export function getDisciplinaryEvents(sport: Sport): MatchEventType[] {
  return getSportConfig(sport).eventTypes.filter(e => e.category === 'disciplinary');
}

/**
 * Get scoring term for a sport
 */
export function getScoringTerm(sport: Sport, plural: boolean = false): string {
  const config = getSportConfig(sport);
  return plural ? config.scoringTerms.unit : config.scoringTerms.primary;
}

/**
 * Check if sport has draws
 */
export function sportHasDraws(sport: Sport): boolean {
  return getSportConfig(sport).hasDraws;
}

/**
 * Check if sport has overtime
 */
export function sportHasOvertime(sport: Sport): boolean {
  return getSportConfig(sport).hasOvertime;
}

/**
 * Check if sport has formations
 */
export function sportHasFormations(sport: Sport): boolean {
  return getSportConfig(sport).hasFormations;
}

/**
 * Get all sports
 */
export function getAllSports(): Sport[] {
  return Object.keys(SPORT_DASHBOARD_CONFIGS) as Sport[];
}

/**
 * Get match duration for a sport
 */
export function getMatchDuration(sport: Sport): number {
  return getSportConfig(sport).matchDuration;
}

/**
 * Get period information for a sport
 */
export function getPeriodInfo(sport: Sport): { name: string; count: number } {
  const config = getSportConfig(sport);
  return { name: config.periodName, count: config.periodCount };
}

/**
 * Validate sport enum value
 */
export function isValidSport(value: unknown): value is Sport {
  return SportEnum.safeParse(value).success;
}

/**
 * Get dashboard widgets for a sport
 */
export function getDashboardWidgets(sport: Sport): string[] {
  return getSportConfig(sport).dashboardWidgets;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default SPORT_DASHBOARD_CONFIGS;