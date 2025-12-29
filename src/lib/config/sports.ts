// ============================================================================
// 🏈 PITCHCONNECT SPORTS CONFIGURATION v7.4.0
// ============================================================================
// Multi-sport support with icons, event types, formations, and helpers
// ============================================================================

import type { Sport, MatchEventType, Position, FormationType } from '@prisma/client';
import {
  Dribbble,
  Circle,
  Hexagon,
  Target,
  Shirt,
  Activity,
  Flame,
  Zap,
  Trophy,
  Star,
  Shield,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// SPORT CONFIGURATION
// ============================================================================

export interface SportConfig {
  id: Sport;
  name: string;
  shortName: string;
  icon: LucideIcon;
  emoji: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  periodName: string;
  periods: number;
  periodDuration: number; // minutes
  hasExtraTime: boolean;
  hasPenalties: boolean;
  hasHalftime: boolean;
  scoringUnit: string;
  scoreBreakdownFields: ScoreBreakdownField[];
  positions: Position[];
  formations: FormationType[];
  eventTypes: MatchEventType[];
}

export interface ScoreBreakdownField {
  key: string;
  label: string;
  points: number;
  icon?: string;
}

export const SPORT_CONFIG: Record<Sport, SportConfig> = {
  FOOTBALL: {
    id: 'FOOTBALL',
    name: 'Football',
    shortName: 'Football',
    icon: Dribbble,
    emoji: '⚽',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100',
    darkBgColor: 'dark:bg-green-900/30',
    periodName: 'Half',
    periods: 2,
    periodDuration: 45,
    hasExtraTime: true,
    hasPenalties: true,
    hasHalftime: true,
    scoringUnit: 'goals',
    scoreBreakdownFields: [
      { key: 'goals', label: 'Goals', points: 1 },
      { key: 'ownGoals', label: 'Own Goals', points: 1 },
      { key: 'penalties', label: 'Penalties', points: 1 },
    ],
    positions: [
      'GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'RIGHT_BACK',
      'LEFT_WING_BACK', 'RIGHT_WING_BACK', 'DEFENSIVE_MIDFIELDER',
      'CENTRAL_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER',
      'ATTACKING_MIDFIELDER', 'LEFT_WINGER', 'RIGHT_WINGER',
      'STRIKER', 'CENTER_FORWARD', 'SECOND_STRIKER',
    ],
    formations: [
      'FOUR_FOUR_TWO', 'FOUR_THREE_THREE', 'THREE_FIVE_TWO',
      'FIVE_THREE_TWO', 'FIVE_FOUR_ONE', 'THREE_FOUR_THREE',
      'FOUR_TWO_THREE_ONE', 'FOUR_ONE_FOUR_ONE', 'FOUR_FIVE_ONE',
    ],
    eventTypes: [
      'GOAL', 'ASSIST', 'YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD',
      'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'INJURY', 'PENALTY_SCORED',
      'PENALTY_MISSED', 'PENALTY_SAVED', 'OWN_GOAL', 'VAR_REVIEW',
      'VAR_DECISION', 'OFFSIDE', 'FOUL', 'FREE_KICK', 'CORNER',
      'THROW_IN', 'GOAL_KICK', 'KICKOFF', 'HALFTIME', 'FULLTIME',
    ],
  },
  
  RUGBY: {
    id: 'RUGBY',
    name: 'Rugby Union',
    shortName: 'Rugby',
    icon: Hexagon,
    emoji: '🏉',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100',
    darkBgColor: 'dark:bg-amber-900/30',
    periodName: 'Half',
    periods: 2,
    periodDuration: 40,
    hasExtraTime: true,
    hasPenalties: false,
    hasHalftime: true,
    scoringUnit: 'points',
    scoreBreakdownFields: [
      { key: 'tries', label: 'Tries', points: 5 },
      { key: 'conversions', label: 'Conversions', points: 2 },
      { key: 'penalties', label: 'Penalty Goals', points: 3 },
      { key: 'dropGoals', label: 'Drop Goals', points: 3 },
    ],
    positions: [
      'PROP', 'HOOKER', 'LOCK', 'FLANKER', 'NUMBER_8',
      'SCRUM_HALF', 'FLY_HALF', 'INSIDE_CENTER', 'OUTSIDE_CENTER',
      'FULLBACK', 'WINGER',
    ],
    formations: ['PODS', 'DIAMOND', 'FLAT_LINE', 'CUSTOM'],
    eventTypes: [
      'TRY', 'CONVERSION', 'PENALTY_GOAL', 'DROP_GOAL', 'SCRUM',
      'LINEOUT', 'MAUL', 'RUCK', 'KNOCK_ON', 'HIGH_TACKLE',
      'SIN_BIN', 'YELLOW_CARD_RUGBY', 'RED_CARD_RUGBY',
      'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'INJURY',
    ],
  },
  
  BASKETBALL: {
    id: 'BASKETBALL',
    name: 'Basketball',
    shortName: 'Basketball',
    icon: Circle,
    emoji: '🏀',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100',
    darkBgColor: 'dark:bg-orange-900/30',
    periodName: 'Quarter',
    periods: 4,
    periodDuration: 12,
    hasExtraTime: true,
    hasPenalties: false,
    hasHalftime: true,
    scoringUnit: 'points',
    scoreBreakdownFields: [
      { key: 'twoPointers', label: '2-Pointers', points: 2 },
      { key: 'threePointers', label: '3-Pointers', points: 3 },
      { key: 'freeThrows', label: 'Free Throws', points: 1 },
    ],
    positions: [
      'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD',
      'POWER_FORWARD', 'CENTER_BASKETBALL',
    ],
    formations: [
      'ONE_THREE_ONE', 'TWO_THREE', 'TWO_ONE_TWO',
      'THREE_TWO', 'ONE_TWO_TWO', 'CUSTOM',
    ],
    eventTypes: [
      'THREE_POINTER', 'TWO_POINTER', 'FREE_THROW_MADE', 'FREE_THROW_MISSED',
      'FAST_BREAK', 'TURNOVER', 'OFFENSIVE_FOUL', 'DEFENSIVE_FOUL',
      'TRAVEL', 'DOUBLE_DRIBBLE', 'BLOCK', 'STEAL', 'DUNK', 'ALLEY_OOP',
      'TIMEOUT', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    ],
  },
  
  AMERICAN_FOOTBALL: {
    id: 'AMERICAN_FOOTBALL',
    name: 'American Football',
    shortName: 'NFL',
    icon: Flame,
    emoji: '🏈',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100',
    darkBgColor: 'dark:bg-red-900/30',
    periodName: 'Quarter',
    periods: 4,
    periodDuration: 15,
    hasExtraTime: true,
    hasPenalties: false,
    hasHalftime: true,
    scoringUnit: 'points',
    scoreBreakdownFields: [
      { key: 'touchdowns', label: 'Touchdowns', points: 6 },
      { key: 'extraPoints', label: 'Extra Points', points: 1 },
      { key: 'twoPointConversions', label: '2-Pt Conversions', points: 2 },
      { key: 'fieldGoals', label: 'Field Goals', points: 3 },
      { key: 'safeties', label: 'Safeties', points: 2 },
    ],
    positions: [
      'QUARTERBACK', 'RUNNING_BACK', 'WIDE_RECEIVER', 'TIGHT_END',
      'LEFT_TACKLE', 'LEFT_GUARD', 'CENTER_POSITION', 'RIGHT_GUARD',
      'RIGHT_TACKLE', 'LINEBACKER', 'DEFENSIVE_END', 'DEFENSIVE_TACKLE',
      'SAFETY', 'CORNERBACK', 'PUNTER', 'KICKER',
    ],
    formations: [
      'I_FORMATION', 'SHOTGUN', 'PISTOL', 'SPREAD',
      'SINGLE_BACK', 'PRO_SET', 'WILDCAT', 'CUSTOM',
    ],
    eventTypes: [
      'TOUCHDOWN', 'FIELD_GOAL', 'SAFETY_SCORE', 'EXTRA_POINT',
      'TWO_POINT_CONVERSION', 'INTERCEPTION', 'FUMBLE', 'SACK',
      'PUNT', 'KICKOFF_RETURN', 'FAIR_CATCH', 'TIMEOUT',
      'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    ],
  },
  
  CRICKET: {
    id: 'CRICKET',
    name: 'Cricket',
    shortName: 'Cricket',
    icon: Target,
    emoji: '🏏',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100',
    darkBgColor: 'dark:bg-emerald-900/30',
    periodName: 'Innings',
    periods: 2,
    periodDuration: 0, // Variable
    hasExtraTime: false,
    hasPenalties: false,
    hasHalftime: false,
    scoringUnit: 'runs',
    scoreBreakdownFields: [
      { key: 'runs', label: 'Runs', points: 1 },
      { key: 'wickets', label: 'Wickets', points: 0 },
      { key: 'overs', label: 'Overs', points: 0 },
      { key: 'extras', label: 'Extras', points: 1 },
    ],
    positions: [
      'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER', 'FIELDER',
    ],
    formations: ['CUSTOM'],
    eventTypes: [
      'WICKET', 'BOUNDARY', 'SIX', 'MAIDEN_OVER', 'WIDE', 'NO_BALL',
      'BYE', 'LEG_BYE', 'OVERTHROW', 'RUN_OUT', 'CAUGHT', 'BOWLED',
      'LBW', 'STUMPED', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    ],
  },
  
  HOCKEY: {
    id: 'HOCKEY',
    name: 'Ice Hockey',
    shortName: 'Hockey',
    icon: Zap,
    emoji: '🏒',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100',
    darkBgColor: 'dark:bg-blue-900/30',
    periodName: 'Period',
    periods: 3,
    periodDuration: 20,
    hasExtraTime: true,
    hasPenalties: true,
    hasHalftime: false,
    scoringUnit: 'goals',
    scoreBreakdownFields: [
      { key: 'goals', label: 'Goals', points: 1 },
      { key: 'powerPlayGoals', label: 'Power Play Goals', points: 1 },
      { key: 'shorthandedGoals', label: 'Shorthanded Goals', points: 1 },
      { key: 'emptyNetGoals', label: 'Empty Net Goals', points: 1 },
    ],
    positions: [
      'GOALTENDER', 'DEFENSEMAN', 'WINGER', 'CENTER_HOCKEY',
    ],
    formations: ['CUSTOM'],
    eventTypes: [
      'GOAL', 'ASSIST', 'HAT_TRICK', 'MAJOR_PENALTY', 'MINOR_PENALTY',
      'FIGHT', 'POWER_PLAY_GOAL', 'SHORTHANDED_GOAL', 'EMPTY_NET_GOAL',
      'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT',
    ],
  },
  
  NETBALL: {
    id: 'NETBALL',
    name: 'Netball',
    shortName: 'Netball',
    icon: Shield,
    emoji: '🏐',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100',
    darkBgColor: 'dark:bg-pink-900/30',
    periodName: 'Quarter',
    periods: 4,
    periodDuration: 15,
    hasExtraTime: true,
    hasPenalties: false,
    hasHalftime: true,
    scoringUnit: 'goals',
    scoreBreakdownFields: [
      { key: 'goals', label: 'Goals', points: 1 },
      { key: 'superShots', label: 'Super Shots', points: 2 },
    ],
    positions: [
      'GOALKEEPER_NETBALL', 'GOAL_ATTACK', 'WING_ATTACK', 'CENTER',
      'WING_DEFENSE', 'GOAL_DEFENSE', 'GOAL_SHOOTER',
    ],
    formations: ['CUSTOM'],
    eventTypes: [
      'GOAL', 'CENTER_PASS', 'OBSTRUCTION', 'CONTACT', 'HELD_BALL',
      'STEPPING', 'OVER_THIRD', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    ],
  },
  
  LACROSSE: {
    id: 'LACROSSE',
    name: 'Lacrosse',
    shortName: 'Lacrosse',
    icon: Activity,
    emoji: '🥍',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100',
    darkBgColor: 'dark:bg-indigo-900/30',
    periodName: 'Quarter',
    periods: 4,
    periodDuration: 15,
    hasExtraTime: true,
    hasPenalties: false,
    hasHalftime: true,
    scoringUnit: 'goals',
    scoreBreakdownFields: [
      { key: 'goals', label: 'Goals', points: 1 },
    ],
    positions: ['GOALKEEPER', 'DEFENSEMAN', 'MIDFIELDER', 'ATTACKER'],
    formations: ['CUSTOM'],
    eventTypes: [
      'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD',
      'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT',
    ],
  },
  
  AUSTRALIAN_RULES: {
    id: 'AUSTRALIAN_RULES',
    name: 'Australian Rules Football',
    shortName: 'AFL',
    icon: Trophy,
    emoji: '🏉',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100',
    darkBgColor: 'dark:bg-yellow-900/30',
    periodName: 'Quarter',
    periods: 4,
    periodDuration: 20,
    hasExtraTime: true,
    hasPenalties: false,
    hasHalftime: true,
    scoringUnit: 'points',
    scoreBreakdownFields: [
      { key: 'goals', label: 'Goals', points: 6 },
      { key: 'behinds', label: 'Behinds', points: 1 },
    ],
    positions: ['FORWARD', 'MIDFIELDER', 'DEFENDER', 'RUCK'],
    formations: ['CUSTOM'],
    eventTypes: [
      'GOAL', 'BEHIND', 'RUSHED_BEHIND', 'MARK', 'HANDBALL',
      'BOUNCE', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    ],
  },
  
  GAELIC_FOOTBALL: {
    id: 'GAELIC_FOOTBALL',
    name: 'Gaelic Football',
    shortName: 'GAA',
    icon: Star,
    emoji: '🏐',
    color: 'text-lime-600 dark:text-lime-400',
    bgColor: 'bg-lime-100',
    darkBgColor: 'dark:bg-lime-900/30',
    periodName: 'Half',
    periods: 2,
    periodDuration: 35,
    hasExtraTime: true,
    hasPenalties: false,
    hasHalftime: true,
    scoringUnit: 'points',
    scoreBreakdownFields: [
      { key: 'goals', label: 'Goals', points: 3 },
      { key: 'points', label: 'Points', points: 1 },
    ],
    positions: ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'],
    formations: ['CUSTOM'],
    eventTypes: [
      'GOAL', 'YELLOW_CARD', 'RED_CARD',
      'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    ],
  },
  
  FUTSAL: {
    id: 'FUTSAL',
    name: 'Futsal',
    shortName: 'Futsal',
    icon: Dribbble,
    emoji: '⚽',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100',
    darkBgColor: 'dark:bg-teal-900/30',
    periodName: 'Half',
    periods: 2,
    periodDuration: 20,
    hasExtraTime: true,
    hasPenalties: true,
    hasHalftime: true,
    scoringUnit: 'goals',
    scoreBreakdownFields: [
      { key: 'goals', label: 'Goals', points: 1 },
    ],
    positions: [
      'GOALKEEPER', 'DEFENDER', 'WINGER', 'PIVOT',
    ],
    formations: ['CUSTOM'],
    eventTypes: [
      'GOAL', 'ASSIST', 'YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD',
      'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'PENALTY_SCORED',
      'PENALTY_MISSED', 'OWN_GOAL',
    ],
  },
  
  BEACH_FOOTBALL: {
    id: 'BEACH_FOOTBALL',
    name: 'Beach Football',
    shortName: 'Beach',
    icon: Shirt,
    emoji: '⚽',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100',
    darkBgColor: 'dark:bg-cyan-900/30',
    periodName: 'Period',
    periods: 3,
    periodDuration: 12,
    hasExtraTime: true,
    hasPenalties: true,
    hasHalftime: false,
    scoringUnit: 'goals',
    scoreBreakdownFields: [
      { key: 'goals', label: 'Goals', points: 1 },
    ],
    positions: [
      'GOALKEEPER', 'DEFENDER', 'WINGER', 'PIVOT',
    ],
    formations: ['CUSTOM'],
    eventTypes: [
      'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD',
      'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSportConfig(sport: Sport): SportConfig {
  return SPORT_CONFIG[sport];
}

export function getSportIcon(sport: Sport): LucideIcon {
  return SPORT_CONFIG[sport].icon;
}

export function getSportDisplayName(sport: Sport): string {
  return SPORT_CONFIG[sport].name;
}

export function getSportEmoji(sport: Sport): string {
  return SPORT_CONFIG[sport].emoji;
}

export function getSportPositions(sport: Sport): Position[] {
  return SPORT_CONFIG[sport].positions;
}

export function getSportFormations(sport: Sport): FormationType[] {
  return SPORT_CONFIG[sport].formations;
}

export function getSportEventTypes(sport: Sport): MatchEventType[] {
  return SPORT_CONFIG[sport].eventTypes;
}

export function getSportScoreBreakdownFields(sport: Sport): ScoreBreakdownField[] {
  return SPORT_CONFIG[sport].scoreBreakdownFields;
}

export function calculateTotalScore(
  sport: Sport,
  breakdown: Record<string, number> | null
): number {
  if (!breakdown) return 0;
  
  const fields = getSportScoreBreakdownFields(sport);
  return fields.reduce((total, field) => {
    return total + (breakdown[field.key] || 0) * field.points;
  }, 0);
}

// ============================================================================
// EVENT TYPE CONFIGURATION
// ============================================================================

export interface EventTypeConfig {
  id: MatchEventType;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  bgColor: string;
  isScoring: boolean;
  isCard: boolean;
  isSubstitution: boolean;
  isPeriod: boolean;
  requiresPlayer: boolean;
  requiresAssist: boolean;
  requiresRelatedPlayer: boolean;
}

export const EVENT_TYPE_CONFIG: Partial<Record<MatchEventType, EventTypeConfig>> = {
  GOAL: {
    id: 'GOAL',
    label: 'Goal',
    shortLabel: 'Goal',
    icon: '⚽',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    isScoring: true,
    isCard: false,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: true,
    requiresRelatedPlayer: false,
  },
  ASSIST: {
    id: 'ASSIST',
    label: 'Assist',
    shortLabel: 'Assist',
    icon: '🎯',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    isScoring: false,
    isCard: false,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: true,
  },
  YELLOW_CARD: {
    id: 'YELLOW_CARD',
    label: 'Yellow Card',
    shortLabel: 'Yellow',
    icon: '🟨',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    isScoring: false,
    isCard: true,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
  SECOND_YELLOW: {
    id: 'SECOND_YELLOW',
    label: 'Second Yellow',
    shortLabel: '2nd Yellow',
    icon: '🟨🟥',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    isScoring: false,
    isCard: true,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
  RED_CARD: {
    id: 'RED_CARD',
    label: 'Red Card',
    shortLabel: 'Red',
    icon: '🟥',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    isScoring: false,
    isCard: true,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
  SUBSTITUTION_ON: {
    id: 'SUBSTITUTION_ON',
    label: 'Substitution On',
    shortLabel: 'Sub On',
    icon: '🔼',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    isScoring: false,
    isCard: false,
    isSubstitution: true,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: true,
  },
  SUBSTITUTION_OFF: {
    id: 'SUBSTITUTION_OFF',
    label: 'Substitution Off',
    shortLabel: 'Sub Off',
    icon: '🔽',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    isScoring: false,
    isCard: false,
    isSubstitution: true,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: true,
  },
  PENALTY_SCORED: {
    id: 'PENALTY_SCORED',
    label: 'Penalty Scored',
    shortLabel: 'Pen Scored',
    icon: '⚽',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    isScoring: true,
    isCard: false,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
  PENALTY_MISSED: {
    id: 'PENALTY_MISSED',
    label: 'Penalty Missed',
    shortLabel: 'Pen Missed',
    icon: '❌',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    isScoring: false,
    isCard: false,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
  OWN_GOAL: {
    id: 'OWN_GOAL',
    label: 'Own Goal',
    shortLabel: 'OG',
    icon: '😬',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    isScoring: true,
    isCard: false,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
  TRY: {
    id: 'TRY',
    label: 'Try',
    shortLabel: 'Try',
    icon: '🏉',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    isScoring: true,
    isCard: false,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: true,
    requiresRelatedPlayer: false,
  },
  CONVERSION: {
    id: 'CONVERSION',
    label: 'Conversion',
    shortLabel: 'Conv',
    icon: '✓',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    isScoring: true,
    isCard: false,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
  TOUCHDOWN: {
    id: 'TOUCHDOWN',
    label: 'Touchdown',
    shortLabel: 'TD',
    icon: '🏈',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    isScoring: true,
    isCard: false,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
  THREE_POINTER: {
    id: 'THREE_POINTER',
    label: '3-Pointer',
    shortLabel: '3PT',
    icon: '🏀',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    isScoring: true,
    isCard: false,
    isSubstitution: false,
    isPeriod: false,
    requiresPlayer: true,
    requiresAssist: true,
    requiresRelatedPlayer: false,
  },
  KICKOFF: {
    id: 'KICKOFF',
    label: 'Kick Off',
    shortLabel: 'KO',
    icon: '▶️',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    isScoring: false,
    isCard: false,
    isSubstitution: false,
    isPeriod: true,
    requiresPlayer: false,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
  HALFTIME: {
    id: 'HALFTIME',
    label: 'Half Time',
    shortLabel: 'HT',
    icon: '⏸️',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    isScoring: false,
    isCard: false,
    isSubstitution: false,
    isPeriod: true,
    requiresPlayer: false,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
  FULLTIME: {
    id: 'FULLTIME',
    label: 'Full Time',
    shortLabel: 'FT',
    icon: '🏁',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    isScoring: false,
    isCard: false,
    isSubstitution: false,
    isPeriod: true,
    requiresPlayer: false,
    requiresAssist: false,
    requiresRelatedPlayer: false,
  },
};

export function getEventTypeConfig(eventType: MatchEventType): EventTypeConfig | undefined {
  return EVENT_TYPE_CONFIG[eventType];
}

export function getEventIcon(eventType: MatchEventType): string {
  return EVENT_TYPE_CONFIG[eventType]?.icon || '📋';
}

export function getEventLabel(eventType: MatchEventType): string {
  return EVENT_TYPE_CONFIG[eventType]?.label || eventType.replace(/_/g, ' ');
}

export function isScoringEvent(eventType: MatchEventType): boolean {
  return EVENT_TYPE_CONFIG[eventType]?.isScoring || false;
}

// ============================================================================
// POSITION DISPLAY
// ============================================================================

export const POSITION_DISPLAY: Record<Position, string> = {
  // Football
  GOALKEEPER: 'GK',
  LEFT_BACK: 'LB',
  CENTER_BACK: 'CB',
  RIGHT_BACK: 'RB',
  LEFT_WING_BACK: 'LWB',
  RIGHT_WING_BACK: 'RWB',
  DEFENSIVE_MIDFIELDER: 'CDM',
  CENTRAL_MIDFIELDER: 'CM',
  LEFT_MIDFIELDER: 'LM',
  RIGHT_MIDFIELDER: 'RM',
  ATTACKING_MIDFIELDER: 'CAM',
  LEFT_WINGER: 'LW',
  RIGHT_WINGER: 'RW',
  STRIKER: 'ST',
  CENTER_FORWARD: 'CF',
  SECOND_STRIKER: 'SS',
  
  // Netball
  GOALKEEPER_NETBALL: 'GK',
  GOAL_ATTACK: 'GA',
  WING_ATTACK: 'WA',
  CENTER: 'C',
  WING_DEFENSE: 'WD',
  GOAL_DEFENSE: 'GD',
  GOAL_SHOOTER: 'GS',
  
  // Rugby
  PROP: 'Prop',
  HOOKER: 'Hooker',
  LOCK: 'Lock',
  FLANKER: 'Flanker',
  NUMBER_8: 'No.8',
  SCRUM_HALF: 'SH',
  FLY_HALF: 'FH',
  INSIDE_CENTER: 'IC',
  OUTSIDE_CENTER: 'OC',
  FULLBACK: 'FB',
  HOOKER_LEAGUE: 'Hooker',
  PROP_LEAGUE: 'Prop',
  SECOND_ROW: '2nd Row',
  LOOSE_FORWARD: 'LF',
  
  // American Football
  QUARTERBACK: 'QB',
  RUNNING_BACK: 'RB',
  WIDE_RECEIVER: 'WR',
  TIGHT_END: 'TE',
  LEFT_TACKLE: 'LT',
  LEFT_GUARD: 'LG',
  CENTER_POSITION: 'C',
  RIGHT_GUARD: 'RG',
  RIGHT_TACKLE: 'RT',
  LINEBACKER: 'LB',
  DEFENSIVE_END: 'DE',
  DEFENSIVE_TACKLE: 'DT',
  SAFETY: 'S',
  CORNERBACK: 'CB',
  PUNTER: 'P',
  KICKER: 'K',
  
  // Basketball
  POINT_GUARD: 'PG',
  SHOOTING_GUARD: 'SG',
  SMALL_FORWARD: 'SF',
  POWER_FORWARD: 'PF',
  CENTER_BASKETBALL: 'C',
  
  // Cricket
  BATSMAN: 'BAT',
  BOWLER: 'BOWL',
  ALL_ROUNDER: 'AR',
  FIELDER: 'FLD',
  WICKET_KEEPER: 'WK',
  
  // Hockey
  GOALTENDER: 'G',
  DEFENSEMAN: 'D',
  WINGER: 'W',
  CENTER_HOCKEY: 'C',
  
  // Generic
  UTILITY: 'UTL',
  SUBSTITUTE: 'SUB',
};

export function getPositionDisplay(position: Position): string {
  return POSITION_DISPLAY[position] || position;
}

export function getPositionFullName(position: Position): string {
  return position.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================================
// FORMATION DISPLAY
// ============================================================================

export const FORMATION_DISPLAY: Record<FormationType, string> = {
  // Football
  FOUR_FOUR_TWO: '4-4-2',
  FOUR_THREE_THREE: '4-3-3',
  THREE_FIVE_TWO: '3-5-2',
  FIVE_THREE_TWO: '5-3-2',
  FIVE_FOUR_ONE: '5-4-1',
  THREE_FOUR_THREE: '3-4-3',
  FOUR_TWO_THREE_ONE: '4-2-3-1',
  FOUR_ONE_FOUR_ONE: '4-1-4-1',
  THREE_THREE_FOUR: '3-3-4',
  FIVE_TWO_THREE: '5-2-3',
  TWO_THREE_FIVE: '2-3-5',
  FOUR_ONE_TWO_THREE: '4-1-2-3',
  FOUR_FOUR_ONE_ONE: '4-4-1-1',
  FOUR_THREE_TWO_ONE: '4-3-2-1',
  FOUR_FIVE_ONE: '4-5-1',
  
  // Basketball
  ONE_THREE_ONE: '1-3-1',
  TWO_THREE: '2-3',
  TWO_ONE_TWO: '2-1-2',
  THREE_TWO: '3-2',
  ONE_TWO_TWO: '1-2-2',
  
  // American Football
  I_FORMATION: 'I-Formation',
  SHOTGUN: 'Shotgun',
  PISTOL: 'Pistol',
  SPREAD: 'Spread',
  SINGLE_BACK: 'Single Back',
  PRO_SET: 'Pro Set',
  WILDCAT: 'Wildcat',
  
  // Rugby
  PODS: 'Pods',
  DIAMOND: 'Diamond',
  FLAT_LINE: 'Flat Line',
  
  // Generic
  CUSTOM: 'Custom',
};

export function getFormationDisplay(formation: FormationType): string {
  return FORMATION_DISPLAY[formation] || formation;
}
