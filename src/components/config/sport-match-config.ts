/**
 * ============================================================================
 * Sport Match Statistics Configuration
 * ============================================================================
 * 
 * Comprehensive configuration for match statistics, events, and metrics
 * across all 12 supported sports in PitchConnect.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/config/sport-match-config.ts
 * 
 * SPORTS SUPPORTED:
 * Football, Rugby, Cricket, Basketball, American Football,
 * Hockey, Netball, Lacrosse, Australian Rules, Gaelic Football,
 * Futsal, Beach Football
 * 
 * ============================================================================
 */

import { type Sport } from './sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

export type StatCategory = 
  | 'POSSESSION'
  | 'SCORING'
  | 'ATTACKING'
  | 'DEFENDING'
  | 'PASSING'
  | 'DISCIPLINE'
  | 'SET_PIECES'
  | 'GOALKEEPER'
  | 'BATTING'
  | 'BOWLING'
  | 'FIELDING';

export type EventType =
  // Universal
  | 'SUBSTITUTION'
  | 'INJURY'
  | 'TIMEOUT'
  | 'PERIOD_END'
  | 'MATCH_END'
  // Football/Futsal/Beach Football
  | 'GOAL'
  | 'ASSIST'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'PENALTY_AWARDED'
  | 'PENALTY_SCORED'
  | 'PENALTY_MISSED'
  | 'PENALTY_SAVED'
  | 'OWN_GOAL'
  | 'OFFSIDE'
  | 'VAR_DECISION'
  | 'CORNER'
  | 'FREE_KICK'
  // Rugby
  | 'TRY'
  | 'CONVERSION'
  | 'PENALTY_GOAL'
  | 'DROP_GOAL'
  | 'SCRUM'
  | 'LINEOUT'
  | 'MAUL'
  | 'RUCK'
  | 'SIN_BIN'
  | 'TMO_DECISION'
  // Cricket
  | 'RUN'
  | 'BOUNDARY_FOUR'
  | 'BOUNDARY_SIX'
  | 'WICKET'
  | 'WIDE'
  | 'NO_BALL'
  | 'BYE'
  | 'LEG_BYE'
  | 'OVER_COMPLETE'
  | 'INNINGS_END'
  | 'POWERPLAY_START'
  | 'POWERPLAY_END'
  | 'MILESTONE'
  | 'PARTNERSHIP'
  | 'DRS_REVIEW'
  // Basketball
  | 'TWO_POINTER'
  | 'THREE_POINTER'
  | 'FREE_THROW'
  | 'REBOUND'
  | 'BLOCK'
  | 'STEAL'
  | 'TURNOVER'
  | 'PERSONAL_FOUL'
  | 'TECHNICAL_FOUL'
  | 'FLAGRANT_FOUL'
  | 'SHOT_CLOCK_VIOLATION'
  // American Football
  | 'TOUCHDOWN'
  | 'FIELD_GOAL_MADE'
  | 'FIELD_GOAL_MISSED'
  | 'EXTRA_POINT'
  | 'TWO_POINT_CONVERSION'
  | 'SAFETY'
  | 'INTERCEPTION'
  | 'FUMBLE'
  | 'SACK'
  | 'FIRST_DOWN'
  | 'PUNT'
  | 'KICKOFF'
  // Hockey
  | 'HOCKEY_GOAL'
  | 'MINOR_PENALTY'
  | 'MAJOR_PENALTY'
  | 'POWER_PLAY_START'
  | 'POWER_PLAY_END'
  | 'PENALTY_SHOT'
  | 'FACE_OFF'
  | 'ICING'
  // Netball
  | 'NETBALL_GOAL'
  | 'CENTRE_PASS'
  | 'CONTACT_FOUL'
  | 'OBSTRUCTION'
  | 'HELD_BALL'
  // Australian Rules
  | 'AFL_GOAL'
  | 'BEHIND'
  | 'MARK'
  | 'HANDBALL'
  | 'BOUNCE'
  // Gaelic Football
  | 'GAELIC_GOAL'
  | 'POINT'
  | 'SIDELINE_KICK'
  | '45_KICK'
  // Lacrosse
  | 'LACROSSE_GOAL'
  | 'GROUND_BALL'
  | 'CLEAR'
  | 'RIDE'
  | 'SLASH';

export interface StatDefinition {
  key: string;
  label: string;
  shortLabel: string;
  unit?: string;
  category: StatCategory;
  isPercentage?: boolean;
  isComparative?: boolean; // Shows home vs away
  color?: string;
  icon?: string;
}

export interface EventDefinition {
  type: EventType;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  points?: number; // Points awarded for this event
  isScoring?: boolean;
  isCard?: boolean;
  isPenalty?: boolean;
}

export interface PeriodDefinition {
  name: string;
  shortName: string;
  duration?: number; // in minutes
  count: number;
  hasOvertime?: boolean;
  overtimeName?: string;
}

export interface SportMatchConfig {
  sport: Sport;
  name: string;
  stats: StatDefinition[];
  events: EventDefinition[];
  periods: PeriodDefinition;
  scoringUnit: string;
  hasDraws: boolean;
  hasPenaltyShootout?: boolean;
  hasExtraTime?: boolean;
  formation?: boolean;
  maxSubstitutions?: number;
  playersOnField: number;
}

// =============================================================================
// UNIVERSAL EVENTS (Available for all sports)
// =============================================================================

const UNIVERSAL_EVENTS: EventDefinition[] = [
  {
    type: 'SUBSTITUTION',
    label: 'Substitution',
    shortLabel: 'Sub',
    icon: '🔄',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    type: 'INJURY',
    label: 'Injury',
    shortLabel: 'Inj',
    icon: '🚑',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  {
    type: 'TIMEOUT',
    label: 'Timeout',
    shortLabel: 'T/O',
    icon: '⏸️',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
  },
  {
    type: 'PERIOD_END',
    label: 'Period End',
    shortLabel: 'End',
    icon: '🔔',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  {
    type: 'MATCH_END',
    label: 'Full Time',
    shortLabel: 'FT',
    icon: '🏁',
    color: 'text-charcoal-900 dark:text-white',
    bgColor: 'bg-charcoal-100 dark:bg-charcoal-800',
    borderColor: 'border-charcoal-300 dark:border-charcoal-600',
  },
];

// =============================================================================
// FOOTBALL CONFIGURATION
// =============================================================================

const FOOTBALL_CONFIG: SportMatchConfig = {
  sport: 'FOOTBALL',
  name: 'Football',
  playersOnField: 11,
  formation: true,
  maxSubstitutions: 5,
  scoringUnit: 'Goals',
  hasDraws: true,
  hasPenaltyShootout: true,
  hasExtraTime: true,
  periods: {
    name: 'Half',
    shortName: 'H',
    duration: 45,
    count: 2,
    hasOvertime: true,
    overtimeName: 'Extra Time',
  },
  stats: [
    { key: 'possession', label: 'Ball Possession', shortLabel: 'Poss', unit: '%', category: 'POSSESSION', isPercentage: true, isComparative: true, color: 'blue' },
    { key: 'shots', label: 'Total Shots', shortLabel: 'Shots', category: 'ATTACKING', isComparative: true, color: 'green' },
    { key: 'shotsOnTarget', label: 'Shots on Target', shortLabel: 'On Target', category: 'ATTACKING', isComparative: true, color: 'green' },
    { key: 'shotsOffTarget', label: 'Shots off Target', shortLabel: 'Off Target', category: 'ATTACKING', isComparative: true, color: 'gray' },
    { key: 'blockedShots', label: 'Blocked Shots', shortLabel: 'Blocked', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'corners', label: 'Corners', shortLabel: 'Corners', category: 'SET_PIECES', isComparative: true, color: 'amber' },
    { key: 'freeKicks', label: 'Free Kicks', shortLabel: 'FKs', category: 'SET_PIECES', isComparative: true, color: 'amber' },
    { key: 'offsides', label: 'Offsides', shortLabel: 'Offs', category: 'ATTACKING', isComparative: true, color: 'red' },
    { key: 'passes', label: 'Total Passes', shortLabel: 'Passes', category: 'PASSING', isComparative: true, color: 'blue' },
    { key: 'passAccuracy', label: 'Pass Accuracy', shortLabel: 'Pass %', unit: '%', category: 'PASSING', isPercentage: true, isComparative: true, color: 'blue' },
    { key: 'tackles', label: 'Tackles', shortLabel: 'Tackles', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'interceptions', label: 'Interceptions', shortLabel: 'Int', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'clearances', label: 'Clearances', shortLabel: 'Clear', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'fouls', label: 'Fouls Committed', shortLabel: 'Fouls', category: 'DISCIPLINE', isComparative: true, color: 'red' },
    { key: 'yellowCards', label: 'Yellow Cards', shortLabel: 'Yellows', category: 'DISCIPLINE', isComparative: true, color: 'yellow', icon: '🟨' },
    { key: 'redCards', label: 'Red Cards', shortLabel: 'Reds', category: 'DISCIPLINE', isComparative: true, color: 'red', icon: '🟥' },
    { key: 'saves', label: 'Goalkeeper Saves', shortLabel: 'Saves', category: 'GOALKEEPER', isComparative: true, color: 'green' },
  ],
  events: [
    ...UNIVERSAL_EVENTS,
    { type: 'GOAL', label: 'Goal', shortLabel: 'Goal', icon: '⚽', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 1, isScoring: true },
    { type: 'ASSIST', label: 'Assist', shortLabel: 'Assist', icon: '👟', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' },
    { type: 'YELLOW_CARD', label: 'Yellow Card', shortLabel: 'Yellow', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-800', isCard: true },
    { type: 'RED_CARD', label: 'Red Card', shortLabel: 'Red', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', isCard: true },
    { type: 'PENALTY_AWARDED', label: 'Penalty Awarded', shortLabel: 'Pen', icon: '🎯', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', isPenalty: true },
    { type: 'PENALTY_SCORED', label: 'Penalty Scored', shortLabel: 'Pen ✓', icon: '⚽', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 1, isScoring: true, isPenalty: true },
    { type: 'PENALTY_MISSED', label: 'Penalty Missed', shortLabel: 'Pen ✗', icon: '❌', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', isPenalty: true },
    { type: 'OWN_GOAL', label: 'Own Goal', shortLabel: 'OG', icon: '😢', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', points: 1, isScoring: true },
    { type: 'OFFSIDE', label: 'Offside', shortLabel: 'Offs', icon: '🚩', color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-900/20', borderColor: 'border-gray-200 dark:border-gray-800' },
    { type: 'VAR_DECISION', label: 'VAR Decision', shortLabel: 'VAR', icon: '📺', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' },
    { type: 'CORNER', label: 'Corner', shortLabel: 'Cor', icon: '🚩', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800' },
  ],
};

// =============================================================================
// RUGBY CONFIGURATION
// =============================================================================

const RUGBY_CONFIG: SportMatchConfig = {
  sport: 'RUGBY',
  name: 'Rugby',
  playersOnField: 15,
  formation: true,
  maxSubstitutions: 8,
  scoringUnit: 'Points',
  hasDraws: true,
  hasExtraTime: true,
  periods: {
    name: 'Half',
    shortName: 'H',
    duration: 40,
    count: 2,
    hasOvertime: true,
    overtimeName: 'Extra Time',
  },
  stats: [
    { key: 'possession', label: 'Possession', shortLabel: 'Poss', unit: '%', category: 'POSSESSION', isPercentage: true, isComparative: true, color: 'blue' },
    { key: 'territory', label: 'Territory', shortLabel: 'Terr', unit: '%', category: 'POSSESSION', isPercentage: true, isComparative: true, color: 'green' },
    { key: 'tries', label: 'Tries', shortLabel: 'Tries', category: 'SCORING', isComparative: true, color: 'green' },
    { key: 'conversions', label: 'Conversions', shortLabel: 'Conv', category: 'SCORING', isComparative: true, color: 'green' },
    { key: 'penalties', label: 'Penalty Goals', shortLabel: 'Pens', category: 'SCORING', isComparative: true, color: 'amber' },
    { key: 'dropGoals', label: 'Drop Goals', shortLabel: 'Drop', category: 'SCORING', isComparative: true, color: 'purple' },
    { key: 'carries', label: 'Carries', shortLabel: 'Carr', category: 'ATTACKING', isComparative: true, color: 'blue' },
    { key: 'metresGained', label: 'Metres Gained', shortLabel: 'Metres', unit: 'm', category: 'ATTACKING', isComparative: true, color: 'green' },
    { key: 'passes', label: 'Passes', shortLabel: 'Pass', category: 'PASSING', isComparative: true, color: 'blue' },
    { key: 'offloads', label: 'Offloads', shortLabel: 'Offld', category: 'PASSING', isComparative: true, color: 'blue' },
    { key: 'tackles', label: 'Tackles Made', shortLabel: 'Tack', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'missedTackles', label: 'Missed Tackles', shortLabel: 'Miss', category: 'DEFENDING', isComparative: true, color: 'red' },
    { key: 'turnoversWon', label: 'Turnovers Won', shortLabel: 'T/O', category: 'DEFENDING', isComparative: true, color: 'green' },
    { key: 'lineoutsWon', label: 'Lineouts Won', shortLabel: 'L/O', category: 'SET_PIECES', isComparative: true, color: 'amber' },
    { key: 'scrumsWon', label: 'Scrums Won', shortLabel: 'Scr', category: 'SET_PIECES', isComparative: true, color: 'amber' },
    { key: 'penaltiesConceded', label: 'Penalties Conceded', shortLabel: 'Pens', category: 'DISCIPLINE', isComparative: true, color: 'red' },
    { key: 'yellowCards', label: 'Yellow Cards', shortLabel: 'Yellow', category: 'DISCIPLINE', isComparative: true, color: 'yellow', icon: '🟨' },
    { key: 'redCards', label: 'Red Cards', shortLabel: 'Red', category: 'DISCIPLINE', isComparative: true, color: 'red', icon: '🟥' },
  ],
  events: [
    ...UNIVERSAL_EVENTS,
    { type: 'TRY', label: 'Try', shortLabel: 'Try', icon: '🏉', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 5, isScoring: true },
    { type: 'CONVERSION', label: 'Conversion', shortLabel: 'Conv', icon: '🎯', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 2, isScoring: true },
    { type: 'PENALTY_GOAL', label: 'Penalty Goal', shortLabel: 'Pen', icon: '🥅', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', points: 3, isScoring: true },
    { type: 'DROP_GOAL', label: 'Drop Goal', shortLabel: 'Drop', icon: '🦶', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800', points: 3, isScoring: true },
    { type: 'YELLOW_CARD', label: 'Yellow Card', shortLabel: 'Yellow', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-800', isCard: true },
    { type: 'RED_CARD', label: 'Red Card', shortLabel: 'Red', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', isCard: true },
    { type: 'SIN_BIN', label: 'Sin Bin', shortLabel: 'Sin', icon: '⏱️', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-800', isCard: true },
    { type: 'SCRUM', label: 'Scrum', shortLabel: 'Scr', icon: '🤼', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' },
    { type: 'LINEOUT', label: 'Lineout', shortLabel: 'L/O', icon: '⬆️', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' },
    { type: 'TMO_DECISION', label: 'TMO Decision', shortLabel: 'TMO', icon: '📺', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800' },
  ],
};

// =============================================================================
// CRICKET CONFIGURATION
// =============================================================================

const CRICKET_CONFIG: SportMatchConfig = {
  sport: 'CRICKET',
  name: 'Cricket',
  playersOnField: 11,
  formation: false,
  scoringUnit: 'Runs',
  hasDraws: true, // Test matches can draw
  periods: {
    name: 'Innings',
    shortName: 'Inn',
    count: 2, // Can be 1-4 depending on format
    hasOvertime: false,
  },
  stats: [
    { key: 'runs', label: 'Total Runs', shortLabel: 'Runs', category: 'SCORING', isComparative: true, color: 'green' },
    { key: 'wickets', label: 'Wickets Lost', shortLabel: 'Wkts', category: 'SCORING', isComparative: true, color: 'red' },
    { key: 'overs', label: 'Overs Bowled', shortLabel: 'Overs', category: 'SCORING', isComparative: true, color: 'blue' },
    { key: 'runRate', label: 'Run Rate', shortLabel: 'RR', category: 'BATTING', isComparative: true, color: 'green' },
    { key: 'requiredRunRate', label: 'Required Rate', shortLabel: 'Req RR', category: 'BATTING', color: 'amber' },
    { key: 'boundaries', label: 'Boundaries (4s)', shortLabel: '4s', category: 'BATTING', isComparative: true, color: 'blue' },
    { key: 'sixes', label: 'Sixes', shortLabel: '6s', category: 'BATTING', isComparative: true, color: 'purple' },
    { key: 'dotBalls', label: 'Dot Balls', shortLabel: 'Dots', category: 'BOWLING', isComparative: true, color: 'gray' },
    { key: 'extras', label: 'Extras', shortLabel: 'Ext', category: 'BOWLING', isComparative: true, color: 'red' },
    { key: 'wides', label: 'Wides', shortLabel: 'Wd', category: 'BOWLING', isComparative: true, color: 'red' },
    { key: 'noBalls', label: 'No Balls', shortLabel: 'NB', category: 'BOWLING', isComparative: true, color: 'red' },
    { key: 'maidens', label: 'Maiden Overs', shortLabel: 'Mdn', category: 'BOWLING', isComparative: true, color: 'green' },
    { key: 'catches', label: 'Catches', shortLabel: 'C', category: 'FIELDING', isComparative: true, color: 'blue' },
    { key: 'runOuts', label: 'Run Outs', shortLabel: 'R/O', category: 'FIELDING', isComparative: true, color: 'green' },
    { key: 'stumpings', label: 'Stumpings', shortLabel: 'St', category: 'FIELDING', isComparative: true, color: 'purple' },
  ],
  events: [
    ...UNIVERSAL_EVENTS,
    { type: 'RUN', label: 'Run', shortLabel: 'Run', icon: '🏃', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800', points: 1, isScoring: true },
    { type: 'BOUNDARY_FOUR', label: 'Four', shortLabel: '4', icon: '4️⃣', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 4, isScoring: true },
    { type: 'BOUNDARY_SIX', label: 'Six', shortLabel: '6', icon: '6️⃣', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800', points: 6, isScoring: true },
    { type: 'WICKET', label: 'Wicket', shortLabel: 'W', icon: '🏏', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800' },
    { type: 'WIDE', label: 'Wide', shortLabel: 'Wd', icon: '↔️', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', points: 1, isScoring: true },
    { type: 'NO_BALL', label: 'No Ball', shortLabel: 'NB', icon: '🚫', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', points: 1, isScoring: true },
    { type: 'OVER_COMPLETE', label: 'Over Complete', shortLabel: 'Over', icon: '✅', color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-900/20', borderColor: 'border-gray-200 dark:border-gray-800' },
    { type: 'POWERPLAY_START', label: 'Powerplay Start', shortLabel: 'PP', icon: '⚡', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800' },
    { type: 'MILESTONE', label: 'Milestone', shortLabel: '🎯', icon: '🎯', color: 'text-gold-600', bgColor: 'bg-gold-50 dark:bg-gold-900/20', borderColor: 'border-gold-200 dark:border-gold-800' },
    { type: 'DRS_REVIEW', label: 'DRS Review', shortLabel: 'DRS', icon: '📺', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' },
  ],
};

// =============================================================================
// BASKETBALL CONFIGURATION
// =============================================================================

const BASKETBALL_CONFIG: SportMatchConfig = {
  sport: 'BASKETBALL',
  name: 'Basketball',
  playersOnField: 5,
  formation: false,
  maxSubstitutions: 999, // Unlimited
  scoringUnit: 'Points',
  hasDraws: false,
  hasExtraTime: true,
  periods: {
    name: 'Quarter',
    shortName: 'Q',
    duration: 12, // NBA, varies by league
    count: 4,
    hasOvertime: true,
    overtimeName: 'Overtime',
  },
  stats: [
    { key: 'points', label: 'Points', shortLabel: 'PTS', category: 'SCORING', isComparative: true, color: 'green' },
    { key: 'fieldGoalsMade', label: 'Field Goals Made', shortLabel: 'FGM', category: 'SCORING', isComparative: true, color: 'blue' },
    { key: 'fieldGoalsAttempted', label: 'Field Goals Attempted', shortLabel: 'FGA', category: 'SCORING', isComparative: true, color: 'blue' },
    { key: 'fieldGoalPct', label: 'FG%', shortLabel: 'FG%', unit: '%', category: 'SCORING', isPercentage: true, isComparative: true, color: 'green' },
    { key: 'threePointersMade', label: '3-Pointers Made', shortLabel: '3PM', category: 'SCORING', isComparative: true, color: 'purple' },
    { key: 'threePointersAttempted', label: '3-Pointers Attempted', shortLabel: '3PA', category: 'SCORING', isComparative: true, color: 'purple' },
    { key: 'threePointPct', label: '3PT%', shortLabel: '3P%', unit: '%', category: 'SCORING', isPercentage: true, isComparative: true, color: 'purple' },
    { key: 'freeThrowsMade', label: 'Free Throws Made', shortLabel: 'FTM', category: 'SCORING', isComparative: true, color: 'amber' },
    { key: 'freeThrowsAttempted', label: 'Free Throws Attempted', shortLabel: 'FTA', category: 'SCORING', isComparative: true, color: 'amber' },
    { key: 'freeThrowPct', label: 'FT%', shortLabel: 'FT%', unit: '%', category: 'SCORING', isPercentage: true, isComparative: true, color: 'amber' },
    { key: 'rebounds', label: 'Total Rebounds', shortLabel: 'REB', category: 'ATTACKING', isComparative: true, color: 'blue' },
    { key: 'offensiveRebounds', label: 'Offensive Rebounds', shortLabel: 'OREB', category: 'ATTACKING', isComparative: true, color: 'green' },
    { key: 'defensiveRebounds', label: 'Defensive Rebounds', shortLabel: 'DREB', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'assists', label: 'Assists', shortLabel: 'AST', category: 'PASSING', isComparative: true, color: 'blue' },
    { key: 'steals', label: 'Steals', shortLabel: 'STL', category: 'DEFENDING', isComparative: true, color: 'green' },
    { key: 'blocks', label: 'Blocks', shortLabel: 'BLK', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'turnovers', label: 'Turnovers', shortLabel: 'TO', category: 'DISCIPLINE', isComparative: true, color: 'red' },
    { key: 'personalFouls', label: 'Personal Fouls', shortLabel: 'PF', category: 'DISCIPLINE', isComparative: true, color: 'red' },
  ],
  events: [
    ...UNIVERSAL_EVENTS,
    { type: 'TWO_POINTER', label: '2-Point Field Goal', shortLabel: '2PT', icon: '🏀', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 2, isScoring: true },
    { type: 'THREE_POINTER', label: '3-Point Field Goal', shortLabel: '3PT', icon: '🎯', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800', points: 3, isScoring: true },
    { type: 'FREE_THROW', label: 'Free Throw', shortLabel: 'FT', icon: '🏀', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', points: 1, isScoring: true },
    { type: 'REBOUND', label: 'Rebound', shortLabel: 'REB', icon: '🔄', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' },
    { type: 'BLOCK', label: 'Block', shortLabel: 'BLK', icon: '🖐️', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800' },
    { type: 'STEAL', label: 'Steal', shortLabel: 'STL', icon: '🤚', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800' },
    { type: 'TURNOVER', label: 'Turnover', shortLabel: 'TO', icon: '❌', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800' },
    { type: 'PERSONAL_FOUL', label: 'Personal Foul', shortLabel: 'PF', icon: '🚨', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800' },
    { type: 'TECHNICAL_FOUL', label: 'Technical Foul', shortLabel: 'TF', icon: '🔴', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800' },
  ],
};

// =============================================================================
// AMERICAN FOOTBALL CONFIGURATION
// =============================================================================

const AMERICAN_FOOTBALL_CONFIG: SportMatchConfig = {
  sport: 'AMERICAN_FOOTBALL',
  name: 'American Football',
  playersOnField: 11,
  formation: true,
  scoringUnit: 'Points',
  hasDraws: false,
  hasExtraTime: true,
  periods: {
    name: 'Quarter',
    shortName: 'Q',
    duration: 15,
    count: 4,
    hasOvertime: true,
    overtimeName: 'Overtime',
  },
  stats: [
    { key: 'totalYards', label: 'Total Yards', shortLabel: 'YDS', unit: 'yds', category: 'ATTACKING', isComparative: true, color: 'green' },
    { key: 'passingYards', label: 'Passing Yards', shortLabel: 'Pass', unit: 'yds', category: 'PASSING', isComparative: true, color: 'blue' },
    { key: 'rushingYards', label: 'Rushing Yards', shortLabel: 'Rush', unit: 'yds', category: 'ATTACKING', isComparative: true, color: 'green' },
    { key: 'firstDowns', label: 'First Downs', shortLabel: '1st', category: 'ATTACKING', isComparative: true, color: 'amber' },
    { key: 'thirdDownConv', label: '3rd Down Conv', shortLabel: '3rd', category: 'ATTACKING', isComparative: true, color: 'blue' },
    { key: 'fourthDownConv', label: '4th Down Conv', shortLabel: '4th', category: 'ATTACKING', isComparative: true, color: 'purple' },
    { key: 'completions', label: 'Completions', shortLabel: 'Comp', category: 'PASSING', isComparative: true, color: 'blue' },
    { key: 'passAttempts', label: 'Pass Attempts', shortLabel: 'Att', category: 'PASSING', isComparative: true, color: 'blue' },
    { key: 'interceptions', label: 'Interceptions', shortLabel: 'INT', category: 'DEFENDING', isComparative: true, color: 'red' },
    { key: 'sacks', label: 'Sacks', shortLabel: 'Sack', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'fumbles', label: 'Fumbles', shortLabel: 'Fum', category: 'DISCIPLINE', isComparative: true, color: 'red' },
    { key: 'penalties', label: 'Penalties', shortLabel: 'Pen', category: 'DISCIPLINE', isComparative: true, color: 'red' },
    { key: 'penaltyYards', label: 'Penalty Yards', shortLabel: 'Pen Yds', unit: 'yds', category: 'DISCIPLINE', isComparative: true, color: 'red' },
    { key: 'timeOfPossession', label: 'Time of Possession', shortLabel: 'TOP', category: 'POSSESSION', isComparative: true, color: 'blue' },
  ],
  events: [
    ...UNIVERSAL_EVENTS,
    { type: 'TOUCHDOWN', label: 'Touchdown', shortLabel: 'TD', icon: '🏈', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 6, isScoring: true },
    { type: 'FIELD_GOAL_MADE', label: 'Field Goal', shortLabel: 'FG', icon: '🥅', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', points: 3, isScoring: true },
    { type: 'EXTRA_POINT', label: 'Extra Point', shortLabel: 'XP', icon: '➕', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 1, isScoring: true },
    { type: 'TWO_POINT_CONVERSION', label: '2-Point Conversion', shortLabel: '2PT', icon: '2️⃣', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800', points: 2, isScoring: true },
    { type: 'SAFETY', label: 'Safety', shortLabel: 'SAF', icon: '🛡️', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', points: 2, isScoring: true },
    { type: 'INTERCEPTION', label: 'Interception', shortLabel: 'INT', icon: '🤚', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800' },
    { type: 'FUMBLE', label: 'Fumble', shortLabel: 'FUM', icon: '💨', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800' },
    { type: 'SACK', label: 'Sack', shortLabel: 'SACK', icon: '💥', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800' },
    { type: 'FIRST_DOWN', label: 'First Down', shortLabel: '1st', icon: '⬇️', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' },
  ],
};

// =============================================================================
// HOCKEY CONFIGURATION
// =============================================================================

const HOCKEY_CONFIG: SportMatchConfig = {
  sport: 'HOCKEY',
  name: 'Hockey',
  playersOnField: 11, // Field hockey
  formation: true,
  scoringUnit: 'Goals',
  hasDraws: true,
  hasPenaltyShootout: true,
  hasExtraTime: true,
  periods: {
    name: 'Quarter',
    shortName: 'Q',
    duration: 15,
    count: 4,
    hasOvertime: true,
    overtimeName: 'Extra Time',
  },
  stats: [
    { key: 'possession', label: 'Possession', shortLabel: 'Poss', unit: '%', category: 'POSSESSION', isPercentage: true, isComparative: true, color: 'blue' },
    { key: 'shots', label: 'Shots', shortLabel: 'Shots', category: 'ATTACKING', isComparative: true, color: 'green' },
    { key: 'shotsOnTarget', label: 'Shots on Target', shortLabel: 'On Target', category: 'ATTACKING', isComparative: true, color: 'green' },
    { key: 'penaltyCorners', label: 'Penalty Corners', shortLabel: 'PC', category: 'SET_PIECES', isComparative: true, color: 'amber' },
    { key: 'penaltyStrokes', label: 'Penalty Strokes', shortLabel: 'PS', category: 'SET_PIECES', isComparative: true, color: 'red' },
    { key: 'tackles', label: 'Tackles', shortLabel: 'Tack', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'interceptions', label: 'Interceptions', shortLabel: 'Int', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'saves', label: 'Saves', shortLabel: 'Saves', category: 'GOALKEEPER', isComparative: true, color: 'green' },
    { key: 'greenCards', label: 'Green Cards', shortLabel: 'Green', category: 'DISCIPLINE', isComparative: true, color: 'green', icon: '🟩' },
    { key: 'yellowCards', label: 'Yellow Cards', shortLabel: 'Yellow', category: 'DISCIPLINE', isComparative: true, color: 'yellow', icon: '🟨' },
    { key: 'redCards', label: 'Red Cards', shortLabel: 'Red', category: 'DISCIPLINE', isComparative: true, color: 'red', icon: '🟥' },
  ],
  events: [
    ...UNIVERSAL_EVENTS,
    { type: 'HOCKEY_GOAL', label: 'Goal', shortLabel: 'Goal', icon: '🏑', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 1, isScoring: true },
    { type: 'PENALTY_SHOT', label: 'Penalty Stroke', shortLabel: 'PS', icon: '🎯', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', isPenalty: true },
    { type: 'YELLOW_CARD', label: 'Yellow Card', shortLabel: 'Yellow', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-800', isCard: true },
    { type: 'RED_CARD', label: 'Red Card', shortLabel: 'Red', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', isCard: true },
  ],
};

// =============================================================================
// NETBALL CONFIGURATION
// =============================================================================

const NETBALL_CONFIG: SportMatchConfig = {
  sport: 'NETBALL',
  name: 'Netball',
  playersOnField: 7,
  formation: true,
  scoringUnit: 'Goals',
  hasDraws: true,
  hasExtraTime: true,
  periods: {
    name: 'Quarter',
    shortName: 'Q',
    duration: 15,
    count: 4,
    hasOvertime: true,
    overtimeName: 'Extra Time',
  },
  stats: [
    { key: 'goals', label: 'Goals', shortLabel: 'Goals', category: 'SCORING', isComparative: true, color: 'green' },
    { key: 'goalAttempts', label: 'Goal Attempts', shortLabel: 'Att', category: 'SCORING', isComparative: true, color: 'blue' },
    { key: 'goalAccuracy', label: 'Goal Accuracy', shortLabel: 'Acc%', unit: '%', category: 'SCORING', isPercentage: true, isComparative: true, color: 'green' },
    { key: 'centrePassReceives', label: 'Centre Pass Receives', shortLabel: 'CPR', category: 'ATTACKING', isComparative: true, color: 'blue' },
    { key: 'feeds', label: 'Feeds', shortLabel: 'Feeds', category: 'PASSING', isComparative: true, color: 'blue' },
    { key: 'feedsWithAttempt', label: 'Feeds with Attempt', shortLabel: 'FwA', category: 'PASSING', isComparative: true, color: 'green' },
    { key: 'interceptions', label: 'Interceptions', shortLabel: 'Int', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'deflections', label: 'Deflections', shortLabel: 'Defl', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'rebounds', label: 'Rebounds', shortLabel: 'Reb', category: 'DEFENDING', isComparative: true, color: 'blue' },
    { key: 'turnovers', label: 'Turnovers', shortLabel: 'T/O', category: 'DISCIPLINE', isComparative: true, color: 'red' },
    { key: 'penalties', label: 'Penalties', shortLabel: 'Pen', category: 'DISCIPLINE', isComparative: true, color: 'red' },
  ],
  events: [
    ...UNIVERSAL_EVENTS,
    { type: 'NETBALL_GOAL', label: 'Goal', shortLabel: 'Goal', icon: '🏐', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 1, isScoring: true },
    { type: 'CENTRE_PASS', label: 'Centre Pass', shortLabel: 'CP', icon: '⭕', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' },
    { type: 'CONTACT_FOUL', label: 'Contact', shortLabel: 'Contact', icon: '🚨', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800' },
    { type: 'OBSTRUCTION', label: 'Obstruction', shortLabel: 'Obs', icon: '⛔', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800' },
  ],
};

// =============================================================================
// REMAINING SPORTS (LACROSSE, AFL, GAELIC, FUTSAL, BEACH FOOTBALL)
// =============================================================================

const LACROSSE_CONFIG: SportMatchConfig = {
  sport: 'LACROSSE',
  name: 'Lacrosse',
  playersOnField: 10,
  formation: true,
  scoringUnit: 'Goals',
  hasDraws: false,
  hasExtraTime: true,
  periods: { name: 'Quarter', shortName: 'Q', duration: 15, count: 4, hasOvertime: true, overtimeName: 'Overtime' },
  stats: [
    { key: 'goals', label: 'Goals', shortLabel: 'G', category: 'SCORING', isComparative: true, color: 'green' },
    { key: 'assists', label: 'Assists', shortLabel: 'A', category: 'SCORING', isComparative: true, color: 'blue' },
    { key: 'shots', label: 'Shots', shortLabel: 'SOG', category: 'ATTACKING', isComparative: true, color: 'green' },
    { key: 'groundBalls', label: 'Ground Balls', shortLabel: 'GB', category: 'ATTACKING', isComparative: true, color: 'blue' },
    { key: 'faceoffsWon', label: 'Faceoffs Won', shortLabel: 'FO', category: 'SET_PIECES', isComparative: true, color: 'amber' },
    { key: 'clears', label: 'Clears', shortLabel: 'Clr', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'saves', label: 'Saves', shortLabel: 'Sv', category: 'GOALKEEPER', isComparative: true, color: 'green' },
    { key: 'turnovers', label: 'Turnovers', shortLabel: 'TO', category: 'DISCIPLINE', isComparative: true, color: 'red' },
    { key: 'penalties', label: 'Penalties', shortLabel: 'Pen', category: 'DISCIPLINE', isComparative: true, color: 'red' },
  ],
  events: [
    ...UNIVERSAL_EVENTS,
    { type: 'LACROSSE_GOAL', label: 'Goal', shortLabel: 'Goal', icon: '🥍', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 1, isScoring: true },
    { type: 'GROUND_BALL', label: 'Ground Ball', shortLabel: 'GB', icon: '🔵', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' },
  ],
};

const AUSTRALIAN_RULES_CONFIG: SportMatchConfig = {
  sport: 'AUSTRALIAN_RULES',
  name: 'Australian Rules',
  playersOnField: 18,
  formation: true,
  scoringUnit: 'Points',
  hasDraws: true,
  hasExtraTime: true,
  periods: { name: 'Quarter', shortName: 'Q', duration: 20, count: 4, hasOvertime: true, overtimeName: 'Extra Time' },
  stats: [
    { key: 'goals', label: 'Goals', shortLabel: 'G', category: 'SCORING', isComparative: true, color: 'green' },
    { key: 'behinds', label: 'Behinds', shortLabel: 'B', category: 'SCORING', isComparative: true, color: 'amber' },
    { key: 'disposals', label: 'Disposals', shortLabel: 'Disp', category: 'ATTACKING', isComparative: true, color: 'blue' },
    { key: 'kicks', label: 'Kicks', shortLabel: 'K', category: 'ATTACKING', isComparative: true, color: 'blue' },
    { key: 'handballs', label: 'Handballs', shortLabel: 'HB', category: 'PASSING', isComparative: true, color: 'purple' },
    { key: 'marks', label: 'Marks', shortLabel: 'M', category: 'ATTACKING', isComparative: true, color: 'green' },
    { key: 'tackles', label: 'Tackles', shortLabel: 'T', category: 'DEFENDING', isComparative: true, color: 'purple' },
    { key: 'hitouts', label: 'Hitouts', shortLabel: 'HO', category: 'SET_PIECES', isComparative: true, color: 'amber' },
    { key: 'frees', label: 'Free Kicks', shortLabel: 'FK', category: 'DISCIPLINE', isComparative: true, color: 'red' },
  ],
  events: [
    ...UNIVERSAL_EVENTS,
    { type: 'AFL_GOAL', label: 'Goal', shortLabel: 'Goal', icon: '🏉', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 6, isScoring: true },
    { type: 'BEHIND', label: 'Behind', shortLabel: 'Bhd', icon: '1️⃣', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', points: 1, isScoring: true },
    { type: 'MARK', label: 'Mark', shortLabel: 'Mark', icon: '🙌', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' },
  ],
};

const GAELIC_FOOTBALL_CONFIG: SportMatchConfig = {
  sport: 'GAELIC_FOOTBALL',
  name: 'Gaelic Football',
  playersOnField: 15,
  formation: true,
  scoringUnit: 'Points',
  hasDraws: true,
  hasExtraTime: true,
  periods: { name: 'Half', shortName: 'H', duration: 35, count: 2, hasOvertime: true, overtimeName: 'Extra Time' },
  stats: [
    { key: 'goals', label: 'Goals', shortLabel: 'G', category: 'SCORING', isComparative: true, color: 'green' },
    { key: 'points', label: 'Points', shortLabel: 'P', category: 'SCORING', isComparative: true, color: 'blue' },
    { key: 'wides', label: 'Wides', shortLabel: 'W', category: 'ATTACKING', isComparative: true, color: 'red' },
    { key: 'frees', label: 'Frees Won', shortLabel: 'F', category: 'SET_PIECES', isComparative: true, color: 'amber' },
    { key: 'kickouts', label: 'Kickouts Won', shortLabel: 'KO', category: 'SET_PIECES', isComparative: true, color: 'blue' },
    { key: 'turnovers', label: 'Turnovers', shortLabel: 'TO', category: 'DISCIPLINE', isComparative: true, color: 'red' },
    { key: 'yellowCards', label: 'Yellow Cards', shortLabel: 'Yellow', category: 'DISCIPLINE', isComparative: true, color: 'yellow', icon: '🟨' },
    { key: 'redCards', label: 'Red Cards', shortLabel: 'Red', category: 'DISCIPLINE', isComparative: true, color: 'red', icon: '🟥' },
    { key: 'blackCards', label: 'Black Cards', shortLabel: 'Black', category: 'DISCIPLINE', isComparative: true, color: 'charcoal', icon: '⬛' },
  ],
  events: [
    ...UNIVERSAL_EVENTS,
    { type: 'GAELIC_GOAL', label: 'Goal', shortLabel: 'Goal', icon: '⚽', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', points: 3, isScoring: true },
    { type: 'POINT', label: 'Point', shortLabel: 'Pt', icon: '☝️', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800', points: 1, isScoring: true },
    { type: 'YELLOW_CARD', label: 'Yellow Card', shortLabel: 'Yellow', icon: '🟨', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-800', isCard: true },
    { type: 'RED_CARD', label: 'Red Card', shortLabel: 'Red', icon: '🟥', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', isCard: true },
  ],
};

// Futsal and Beach Football inherit from Football with adjustments
const FUTSAL_CONFIG: SportMatchConfig = {
  ...FOOTBALL_CONFIG,
  sport: 'FUTSAL',
  name: 'Futsal',
  playersOnField: 5,
  maxSubstitutions: 999, // Unlimited
  periods: { name: 'Half', shortName: 'H', duration: 20, count: 2, hasOvertime: true, overtimeName: 'Extra Time' },
};

const BEACH_FOOTBALL_CONFIG: SportMatchConfig = {
  ...FOOTBALL_CONFIG,
  sport: 'BEACH_FOOTBALL',
  name: 'Beach Football',
  playersOnField: 5,
  maxSubstitutions: 999,
  periods: { name: 'Period', shortName: 'P', duration: 12, count: 3, hasOvertime: true, overtimeName: 'Extra Time' },
};

// =============================================================================
// SPORT MATCH CONFIG MAP
// =============================================================================

export const SPORT_MATCH_CONFIG: Record<Sport, SportMatchConfig> = {
  FOOTBALL: FOOTBALL_CONFIG,
  RUGBY: RUGBY_CONFIG,
  CRICKET: CRICKET_CONFIG,
  BASKETBALL: BASKETBALL_CONFIG,
  AMERICAN_FOOTBALL: AMERICAN_FOOTBALL_CONFIG,
  HOCKEY: HOCKEY_CONFIG,
  NETBALL: NETBALL_CONFIG,
  LACROSSE: LACROSSE_CONFIG,
  AUSTRALIAN_RULES: AUSTRALIAN_RULES_CONFIG,
  GAELIC_FOOTBALL: GAELIC_FOOTBALL_CONFIG,
  FUTSAL: FUTSAL_CONFIG,
  BEACH_FOOTBALL: BEACH_FOOTBALL_CONFIG,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getMatchConfig(sport: Sport): SportMatchConfig {
  return SPORT_MATCH_CONFIG[sport] || FOOTBALL_CONFIG;
}

export function getStatsForSport(sport: Sport): StatDefinition[] {
  return SPORT_MATCH_CONFIG[sport]?.stats || FOOTBALL_CONFIG.stats;
}

export function getEventsForSport(sport: Sport): EventDefinition[] {
  return SPORT_MATCH_CONFIG[sport]?.events || FOOTBALL_CONFIG.events;
}

export function getScoringEvents(sport: Sport): EventDefinition[] {
  return getEventsForSport(sport).filter((e) => e.isScoring);
}

export function getCardEvents(sport: Sport): EventDefinition[] {
  return getEventsForSport(sport).filter((e) => e.isCard);
}

export function getEventDefinition(sport: Sport, eventType: EventType): EventDefinition | undefined {
  return getEventsForSport(sport).find((e) => e.type === eventType);
}

export function getStatsByCategory(sport: Sport, category: StatCategory): StatDefinition[] {
  return getStatsForSport(sport).filter((s) => s.category === category);
}

export default SPORT_MATCH_CONFIG;
