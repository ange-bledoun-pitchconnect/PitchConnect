/**
 * ============================================================================
 * 🏆 PITCHCONNECT - UNIFIED MULTI-SPORT CONFIGURATION v8.0.0
 * ============================================================================
 * Path: src/lib/sports/index.ts
 * 
 * CONSOLIDATES: sports.ts + sport-config.ts into ONE comprehensive module
 * 
 * FEATURES:
 * ✅ All 12 sports from Prisma schema (Sport enum)
 * ✅ All 75+ positions from Prisma schema (Position enum)
 * ✅ All formations from Prisma schema (FormationType enum)
 * ✅ Sport-specific event types (MatchEventType enum)
 * ✅ Drill categories per sport (DrillCategory enum)
 * ✅ Ranking/leaderboard categories
 * ✅ UI configuration (icons, colors, gradients)
 * ✅ Match duration and period configurations
 * ✅ Position groupings and display names
 * ✅ Sport-specific statistics definitions
 * ✅ TypeScript-first with Prisma type imports
 * ============================================================================
 */

import type { Sport, Position, FormationType, DrillCategory, MatchEventType } from '@prisma/client';

// ============================================================================
// RE-EXPORT PRISMA ENUMS FOR CONVENIENCE
// ============================================================================

export type { Sport, Position, FormationType, DrillCategory, MatchEventType };

// ============================================================================
// SPORT METADATA CONFIGURATION
// ============================================================================

export interface SportConfig {
  /** Display name */
  name: string;
  /** Short name for compact displays */
  shortName: string;
  /** Emoji icon */
  emoji: string;
  /** Lucide icon name */
  icon: string;
  /** Primary brand color (hex) */
  color: string;
  /** Gradient start color */
  gradientFrom: string;
  /** Gradient end color */
  gradientTo: string;
  /** Standard team size on field/court */
  teamSize: number;
  /** Match duration in minutes (0 = variable like cricket) */
  matchDuration: number;
  /** Number of periods/halves/quarters */
  periods: number;
  /** Name of period (Half, Quarter, Period, Innings, etc.) */
  periodName: string;
  /** Scoring unit singular */
  scoringUnit: string;
  /** Scoring unit plural */
  scoringUnitPlural: string;
  /** Whether sport uses goals (vs points/runs) */
  usesGoals: boolean;
  /** Whether sport has extra time */
  hasExtraTime: boolean;
  /** Whether sport has penalty shootouts */
  hasPenalties: boolean;
  /** Default formation for this sport */
  defaultFormation?: FormationType;
}

export const SPORT_CONFIG: Record<Sport, SportConfig> = {
  FOOTBALL: {
    name: 'Football',
    shortName: 'Football',
    emoji: '⚽',
    icon: 'Circle',
    color: '#22c55e',
    gradientFrom: '#22c55e',
    gradientTo: '#16a34a',
    teamSize: 11,
    matchDuration: 90,
    periods: 2,
    periodName: 'Half',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
    usesGoals: true,
    hasExtraTime: true,
    hasPenalties: true,
    defaultFormation: 'FOUR_FOUR_TWO',
  },
  FUTSAL: {
    name: 'Futsal',
    shortName: 'Futsal',
    emoji: '⚽',
    icon: 'Circle',
    color: '#f59e0b',
    gradientFrom: '#f59e0b',
    gradientTo: '#d97706',
    teamSize: 5,
    matchDuration: 40,
    periods: 2,
    periodName: 'Half',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
    usesGoals: true,
    hasExtraTime: true,
    hasPenalties: true,
    defaultFormation: 'TWO_THREE',
  },
  BEACH_FOOTBALL: {
    name: 'Beach Football',
    shortName: 'Beach',
    emoji: '🏖️',
    icon: 'Sun',
    color: '#06b6d4',
    gradientFrom: '#06b6d4',
    gradientTo: '#0891b2',
    teamSize: 5,
    matchDuration: 36,
    periods: 3,
    periodName: 'Period',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
    usesGoals: true,
    hasExtraTime: true,
    hasPenalties: true,
    defaultFormation: 'TWO_THREE',
  },
  RUGBY: {
    name: 'Rugby Union',
    shortName: 'Rugby',
    emoji: '🏉',
    icon: 'Oval',
    color: '#dc2626',
    gradientFrom: '#dc2626',
    gradientTo: '#b91c1c',
    teamSize: 15,
    matchDuration: 80,
    periods: 2,
    periodName: 'Half',
    scoringUnit: 'Point',
    scoringUnitPlural: 'Points',
    usesGoals: false,
    hasExtraTime: true,
    hasPenalties: false,
  },
  BASKETBALL: {
    name: 'Basketball',
    shortName: 'Basketball',
    emoji: '🏀',
    icon: 'Circle',
    color: '#f97316',
    gradientFrom: '#f97316',
    gradientTo: '#ea580c',
    teamSize: 5,
    matchDuration: 48,
    periods: 4,
    periodName: 'Quarter',
    scoringUnit: 'Point',
    scoringUnitPlural: 'Points',
    usesGoals: false,
    hasExtraTime: true,
    hasPenalties: false,
  },
  CRICKET: {
    name: 'Cricket',
    shortName: 'Cricket',
    emoji: '🏏',
    icon: 'Bat',
    color: '#84cc16',
    gradientFrom: '#84cc16',
    gradientTo: '#65a30d',
    teamSize: 11,
    matchDuration: 0, // Variable (T20, ODI, Test)
    periods: 2,
    periodName: 'Innings',
    scoringUnit: 'Run',
    scoringUnitPlural: 'Runs',
    usesGoals: false,
    hasExtraTime: false,
    hasPenalties: false,
  },
  AMERICAN_FOOTBALL: {
    name: 'American Football',
    shortName: 'NFL',
    emoji: '🏈',
    icon: 'Oval',
    color: '#7c3aed',
    gradientFrom: '#7c3aed',
    gradientTo: '#6d28d9',
    teamSize: 11,
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    scoringUnit: 'Point',
    scoringUnitPlural: 'Points',
    usesGoals: false,
    hasExtraTime: true,
    hasPenalties: false,
    defaultFormation: 'I_FORMATION',
  },
  NETBALL: {
    name: 'Netball',
    shortName: 'Netball',
    emoji: '🏐',
    icon: 'Circle',
    color: '#ec4899',
    gradientFrom: '#ec4899',
    gradientTo: '#db2777',
    teamSize: 7,
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
    usesGoals: true,
    hasExtraTime: true,
    hasPenalties: false,
    defaultFormation: 'DIAMOND',
  },
  HOCKEY: {
    name: 'Ice Hockey',
    shortName: 'Hockey',
    emoji: '🏒',
    icon: 'Slash',
    color: '#3b82f6',
    gradientFrom: '#3b82f6',
    gradientTo: '#2563eb',
    teamSize: 6,
    matchDuration: 60,
    periods: 3,
    periodName: 'Period',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
    usesGoals: true,
    hasExtraTime: true,
    hasPenalties: true,
  },
  LACROSSE: {
    name: 'Lacrosse',
    shortName: 'Lacrosse',
    emoji: '🥍',
    icon: 'Target',
    color: '#14b8a6',
    gradientFrom: '#14b8a6',
    gradientTo: '#0d9488',
    teamSize: 10,
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
    usesGoals: true,
    hasExtraTime: true,
    hasPenalties: false,
  },
  AUSTRALIAN_RULES: {
    name: 'Australian Rules',
    shortName: 'AFL',
    emoji: '🏉',
    icon: 'Oval',
    color: '#eab308',
    gradientFrom: '#eab308',
    gradientTo: '#ca8a04',
    teamSize: 18,
    matchDuration: 80,
    periods: 4,
    periodName: 'Quarter',
    scoringUnit: 'Point',
    scoringUnitPlural: 'Points',
    usesGoals: false,
    hasExtraTime: true,
    hasPenalties: false,
  },
  GAELIC_FOOTBALL: {
    name: 'Gaelic Football',
    shortName: 'GAA',
    emoji: '🏐',
    icon: 'Circle',
    color: '#10b981',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
    teamSize: 15,
    matchDuration: 70,
    periods: 2,
    periodName: 'Half',
    scoringUnit: 'Point',
    scoringUnitPlural: 'Points',
    usesGoals: false,
    hasExtraTime: true,
    hasPenalties: false,
  },
};

// ============================================================================
// POSITION CONFIGURATION
// ============================================================================

export interface PositionInfo {
  /** Position enum value from Prisma */
  value: Position;
  /** Display name */
  name: string;
  /** Short abbreviation (2-3 chars) */
  abbreviation: string;
  /** Position category for grouping */
  category: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'utility' | 'specialist';
  /** Display color */
  color: string;
  /** Sort order within category */
  sortOrder: number;
}

/** Position category colors */
export const POSITION_CATEGORY_COLORS: Record<string, string> = {
  goalkeeper: '#f59e0b',
  defender: '#3b82f6',
  midfielder: '#22c55e',
  forward: '#ef4444',
  utility: '#8b5cf6',
  specialist: '#06b6d4',
};

/** All positions organized by sport */
export const POSITIONS_BY_SPORT: Record<Sport, PositionInfo[]> = {
  FOOTBALL: [
    { value: 'GOALKEEPER', name: 'Goalkeeper', abbreviation: 'GK', category: 'goalkeeper', color: '#f59e0b', sortOrder: 1 },
    { value: 'LEFT_BACK', name: 'Left Back', abbreviation: 'LB', category: 'defender', color: '#3b82f6', sortOrder: 2 },
    { value: 'CENTER_BACK', name: 'Center Back', abbreviation: 'CB', category: 'defender', color: '#3b82f6', sortOrder: 3 },
    { value: 'RIGHT_BACK', name: 'Right Back', abbreviation: 'RB', category: 'defender', color: '#3b82f6', sortOrder: 4 },
    { value: 'LEFT_WING_BACK', name: 'Left Wing Back', abbreviation: 'LWB', category: 'defender', color: '#3b82f6', sortOrder: 5 },
    { value: 'RIGHT_WING_BACK', name: 'Right Wing Back', abbreviation: 'RWB', category: 'defender', color: '#3b82f6', sortOrder: 6 },
    { value: 'DEFENSIVE_MIDFIELDER', name: 'Defensive Midfielder', abbreviation: 'DM', category: 'midfielder', color: '#22c55e', sortOrder: 7 },
    { value: 'CENTRAL_MIDFIELDER', name: 'Central Midfielder', abbreviation: 'CM', category: 'midfielder', color: '#22c55e', sortOrder: 8 },
    { value: 'LEFT_MIDFIELDER', name: 'Left Midfielder', abbreviation: 'LM', category: 'midfielder', color: '#22c55e', sortOrder: 9 },
    { value: 'RIGHT_MIDFIELDER', name: 'Right Midfielder', abbreviation: 'RM', category: 'midfielder', color: '#22c55e', sortOrder: 10 },
    { value: 'ATTACKING_MIDFIELDER', name: 'Attacking Midfielder', abbreviation: 'AM', category: 'midfielder', color: '#22c55e', sortOrder: 11 },
    { value: 'LEFT_WINGER', name: 'Left Winger', abbreviation: 'LW', category: 'forward', color: '#ef4444', sortOrder: 12 },
    { value: 'RIGHT_WINGER', name: 'Right Winger', abbreviation: 'RW', category: 'forward', color: '#ef4444', sortOrder: 13 },
    { value: 'STRIKER', name: 'Striker', abbreviation: 'ST', category: 'forward', color: '#ef4444', sortOrder: 14 },
    { value: 'CENTER_FORWARD', name: 'Center Forward', abbreviation: 'CF', category: 'forward', color: '#ef4444', sortOrder: 15 },
    { value: 'SECOND_STRIKER', name: 'Second Striker', abbreviation: 'SS', category: 'forward', color: '#ef4444', sortOrder: 16 },
    { value: 'UTILITY', name: 'Utility', abbreviation: 'UTL', category: 'utility', color: '#8b5cf6', sortOrder: 17 },
    { value: 'SUBSTITUTE', name: 'Substitute', abbreviation: 'SUB', category: 'utility', color: '#8b5cf6', sortOrder: 18 },
  ],
  FUTSAL: [
    { value: 'GOALKEEPER', name: 'Goalkeeper', abbreviation: 'GK', category: 'goalkeeper', color: '#f59e0b', sortOrder: 1 },
    { value: 'DEFENDER', name: 'Defender', abbreviation: 'DEF', category: 'defender', color: '#3b82f6', sortOrder: 2 },
    { value: 'LEFT_WINGER', name: 'Left Winger', abbreviation: 'LW', category: 'forward', color: '#ef4444', sortOrder: 3 },
    { value: 'RIGHT_WINGER', name: 'Right Winger', abbreviation: 'RW', category: 'forward', color: '#ef4444', sortOrder: 4 },
    { value: 'STRIKER', name: 'Pivot', abbreviation: 'PIV', category: 'forward', color: '#ef4444', sortOrder: 5 },
    { value: 'UTILITY', name: 'Utility', abbreviation: 'UTL', category: 'utility', color: '#8b5cf6', sortOrder: 6 },
  ],
  BEACH_FOOTBALL: [
    { value: 'GOALKEEPER', name: 'Goalkeeper', abbreviation: 'GK', category: 'goalkeeper', color: '#f59e0b', sortOrder: 1 },
    { value: 'DEFENDER', name: 'Defender', abbreviation: 'DEF', category: 'defender', color: '#3b82f6', sortOrder: 2 },
    { value: 'CENTRAL_MIDFIELDER', name: 'Midfielder', abbreviation: 'MF', category: 'midfielder', color: '#22c55e', sortOrder: 3 },
    { value: 'LEFT_WINGER', name: 'Left Winger', abbreviation: 'LW', category: 'forward', color: '#ef4444', sortOrder: 4 },
    { value: 'RIGHT_WINGER', name: 'Right Winger', abbreviation: 'RW', category: 'forward', color: '#ef4444', sortOrder: 5 },
    { value: 'UTILITY', name: 'Utility', abbreviation: 'UTL', category: 'utility', color: '#8b5cf6', sortOrder: 6 },
  ],
  RUGBY: [
    // Forwards (Pack)
    { value: 'PROP', name: 'Loosehead Prop', abbreviation: '1', category: 'forward', color: '#ef4444', sortOrder: 1 },
    { value: 'HOOKER', name: 'Hooker', abbreviation: '2', category: 'forward', color: '#ef4444', sortOrder: 2 },
    { value: 'PROP', name: 'Tighthead Prop', abbreviation: '3', category: 'forward', color: '#ef4444', sortOrder: 3 },
    { value: 'LOCK', name: 'Lock', abbreviation: '4/5', category: 'forward', color: '#ef4444', sortOrder: 4 },
    { value: 'FLANKER', name: 'Blindside Flanker', abbreviation: '6', category: 'forward', color: '#ef4444', sortOrder: 5 },
    { value: 'FLANKER', name: 'Openside Flanker', abbreviation: '7', category: 'forward', color: '#ef4444', sortOrder: 6 },
    { value: 'NUMBER_8', name: 'Number 8', abbreviation: '8', category: 'forward', color: '#ef4444', sortOrder: 7 },
    // Backs
    { value: 'SCRUM_HALF', name: 'Scrum Half', abbreviation: '9', category: 'midfielder', color: '#22c55e', sortOrder: 8 },
    { value: 'FLY_HALF', name: 'Fly Half', abbreviation: '10', category: 'midfielder', color: '#22c55e', sortOrder: 9 },
    { value: 'LEFT_WINGER', name: 'Left Wing', abbreviation: '11', category: 'defender', color: '#3b82f6', sortOrder: 10 },
    { value: 'INSIDE_CENTER', name: 'Inside Center', abbreviation: '12', category: 'midfielder', color: '#22c55e', sortOrder: 11 },
    { value: 'OUTSIDE_CENTER', name: 'Outside Center', abbreviation: '13', category: 'midfielder', color: '#22c55e', sortOrder: 12 },
    { value: 'RIGHT_WINGER', name: 'Right Wing', abbreviation: '14', category: 'defender', color: '#3b82f6', sortOrder: 13 },
    { value: 'FULLBACK', name: 'Fullback', abbreviation: '15', category: 'defender', color: '#3b82f6', sortOrder: 14 },
    { value: 'UTILITY', name: 'Utility Back', abbreviation: 'UTL', category: 'utility', color: '#8b5cf6', sortOrder: 15 },
  ],
  BASKETBALL: [
    { value: 'POINT_GUARD', name: 'Point Guard', abbreviation: 'PG', category: 'midfielder', color: '#22c55e', sortOrder: 1 },
    { value: 'SHOOTING_GUARD', name: 'Shooting Guard', abbreviation: 'SG', category: 'midfielder', color: '#22c55e', sortOrder: 2 },
    { value: 'SMALL_FORWARD', name: 'Small Forward', abbreviation: 'SF', category: 'forward', color: '#ef4444', sortOrder: 3 },
    { value: 'POWER_FORWARD', name: 'Power Forward', abbreviation: 'PF', category: 'forward', color: '#ef4444', sortOrder: 4 },
    { value: 'CENTER_BASKETBALL', name: 'Center', abbreviation: 'C', category: 'forward', color: '#ef4444', sortOrder: 5 },
    { value: 'UTILITY', name: 'Utility', abbreviation: 'UTL', category: 'utility', color: '#8b5cf6', sortOrder: 6 },
  ],
  CRICKET: [
    { value: 'WICKET_KEEPER', name: 'Wicket Keeper', abbreviation: 'WK', category: 'goalkeeper', color: '#f59e0b', sortOrder: 1 },
    { value: 'BATSMAN', name: 'Opening Batsman', abbreviation: 'OPN', category: 'forward', color: '#ef4444', sortOrder: 2 },
    { value: 'BATSMAN', name: 'Top Order Batsman', abbreviation: 'TOP', category: 'forward', color: '#ef4444', sortOrder: 3 },
    { value: 'BATSMAN', name: 'Middle Order Batsman', abbreviation: 'MID', category: 'forward', color: '#ef4444', sortOrder: 4 },
    { value: 'ALL_ROUNDER', name: 'All Rounder', abbreviation: 'AR', category: 'midfielder', color: '#22c55e', sortOrder: 5 },
    { value: 'BOWLER', name: 'Fast Bowler', abbreviation: 'PACE', category: 'specialist', color: '#06b6d4', sortOrder: 6 },
    { value: 'BOWLER', name: 'Spin Bowler', abbreviation: 'SPIN', category: 'specialist', color: '#06b6d4', sortOrder: 7 },
    { value: 'FIELDER', name: 'Specialist Fielder', abbreviation: 'FLD', category: 'defender', color: '#3b82f6', sortOrder: 8 },
  ],
  AMERICAN_FOOTBALL: [
    // Offense
    { value: 'QUARTERBACK', name: 'Quarterback', abbreviation: 'QB', category: 'midfielder', color: '#22c55e', sortOrder: 1 },
    { value: 'RUNNING_BACK', name: 'Running Back', abbreviation: 'RB', category: 'forward', color: '#ef4444', sortOrder: 2 },
    { value: 'WIDE_RECEIVER', name: 'Wide Receiver', abbreviation: 'WR', category: 'forward', color: '#ef4444', sortOrder: 3 },
    { value: 'TIGHT_END', name: 'Tight End', abbreviation: 'TE', category: 'forward', color: '#ef4444', sortOrder: 4 },
    { value: 'LEFT_TACKLE', name: 'Left Tackle', abbreviation: 'LT', category: 'defender', color: '#3b82f6', sortOrder: 5 },
    { value: 'LEFT_GUARD', name: 'Left Guard', abbreviation: 'LG', category: 'defender', color: '#3b82f6', sortOrder: 6 },
    { value: 'CENTER_POSITION', name: 'Center', abbreviation: 'C', category: 'defender', color: '#3b82f6', sortOrder: 7 },
    { value: 'RIGHT_GUARD', name: 'Right Guard', abbreviation: 'RG', category: 'defender', color: '#3b82f6', sortOrder: 8 },
    { value: 'RIGHT_TACKLE', name: 'Right Tackle', abbreviation: 'RT', category: 'defender', color: '#3b82f6', sortOrder: 9 },
    // Defense
    { value: 'DEFENSIVE_END', name: 'Defensive End', abbreviation: 'DE', category: 'defender', color: '#3b82f6', sortOrder: 10 },
    { value: 'DEFENSIVE_TACKLE', name: 'Defensive Tackle', abbreviation: 'DT', category: 'defender', color: '#3b82f6', sortOrder: 11 },
    { value: 'LINEBACKER', name: 'Linebacker', abbreviation: 'LB', category: 'defender', color: '#3b82f6', sortOrder: 12 },
    { value: 'CORNERBACK', name: 'Cornerback', abbreviation: 'CB', category: 'defender', color: '#3b82f6', sortOrder: 13 },
    { value: 'SAFETY', name: 'Safety', abbreviation: 'S', category: 'defender', color: '#3b82f6', sortOrder: 14 },
    // Special Teams
    { value: 'KICKER', name: 'Kicker', abbreviation: 'K', category: 'specialist', color: '#06b6d4', sortOrder: 15 },
    { value: 'PUNTER', name: 'Punter', abbreviation: 'P', category: 'specialist', color: '#06b6d4', sortOrder: 16 },
  ],
  NETBALL: [
    { value: 'GOALKEEPER_NETBALL', name: 'Goal Keeper', abbreviation: 'GK', category: 'goalkeeper', color: '#f59e0b', sortOrder: 1 },
    { value: 'GOAL_DEFENSE', name: 'Goal Defence', abbreviation: 'GD', category: 'defender', color: '#3b82f6', sortOrder: 2 },
    { value: 'WING_DEFENSE', name: 'Wing Defence', abbreviation: 'WD', category: 'defender', color: '#3b82f6', sortOrder: 3 },
    { value: 'CENTER', name: 'Center', abbreviation: 'C', category: 'midfielder', color: '#22c55e', sortOrder: 4 },
    { value: 'WING_ATTACK', name: 'Wing Attack', abbreviation: 'WA', category: 'forward', color: '#ef4444', sortOrder: 5 },
    { value: 'GOAL_ATTACK', name: 'Goal Attack', abbreviation: 'GA', category: 'forward', color: '#ef4444', sortOrder: 6 },
    { value: 'GOAL_SHOOTER', name: 'Goal Shooter', abbreviation: 'GS', category: 'forward', color: '#ef4444', sortOrder: 7 },
  ],
  HOCKEY: [
    { value: 'GOALTENDER', name: 'Goaltender', abbreviation: 'G', category: 'goalkeeper', color: '#f59e0b', sortOrder: 1 },
    { value: 'DEFENSEMAN', name: 'Left Defenseman', abbreviation: 'LD', category: 'defender', color: '#3b82f6', sortOrder: 2 },
    { value: 'DEFENSEMAN', name: 'Right Defenseman', abbreviation: 'RD', category: 'defender', color: '#3b82f6', sortOrder: 3 },
    { value: 'WINGER', name: 'Left Wing', abbreviation: 'LW', category: 'forward', color: '#ef4444', sortOrder: 4 },
    { value: 'CENTER_HOCKEY', name: 'Center', abbreviation: 'C', category: 'forward', color: '#ef4444', sortOrder: 5 },
    { value: 'WINGER', name: 'Right Wing', abbreviation: 'RW', category: 'forward', color: '#ef4444', sortOrder: 6 },
    { value: 'UTILITY', name: 'Utility', abbreviation: 'UTL', category: 'utility', color: '#8b5cf6', sortOrder: 7 },
  ],
  LACROSSE: [
    { value: 'GOALTENDER', name: 'Goalie', abbreviation: 'G', category: 'goalkeeper', color: '#f59e0b', sortOrder: 1 },
    { value: 'DEFENSEMAN', name: 'Defenseman', abbreviation: 'D', category: 'defender', color: '#3b82f6', sortOrder: 2 },
    { value: 'DEFENSEMAN', name: 'Long Stick Midfielder', abbreviation: 'LSM', category: 'defender', color: '#3b82f6', sortOrder: 3 },
    { value: 'CENTER_HOCKEY', name: 'Midfielder', abbreviation: 'M', category: 'midfielder', color: '#22c55e', sortOrder: 4 },
    { value: 'WINGER', name: 'Attack', abbreviation: 'A', category: 'forward', color: '#ef4444', sortOrder: 5 },
    { value: 'UTILITY', name: 'Face-off Specialist', abbreviation: 'FO', category: 'specialist', color: '#06b6d4', sortOrder: 6 },
  ],
  AUSTRALIAN_RULES: [
    // Forwards
    { value: 'FULL_FORWARD', name: 'Full Forward', abbreviation: 'FF', category: 'forward', color: '#ef4444', sortOrder: 1 },
    { value: 'HALF_FORWARD', name: 'Half Forward Flank', abbreviation: 'HFF', category: 'forward', color: '#ef4444', sortOrder: 2 },
    { value: 'HALF_FORWARD', name: 'Centre Half Forward', abbreviation: 'CHF', category: 'forward', color: '#ef4444', sortOrder: 3 },
    // Midfield
    { value: 'RUCK', name: 'Ruck', abbreviation: 'R', category: 'midfielder', color: '#22c55e', sortOrder: 4 },
    { value: 'RUCK_ROVER', name: 'Ruck Rover', abbreviation: 'RR', category: 'midfielder', color: '#22c55e', sortOrder: 5 },
    { value: 'ROVER', name: 'Rover', abbreviation: 'ROV', category: 'midfielder', color: '#22c55e', sortOrder: 6 },
    { value: 'CENTER', name: 'Centre', abbreviation: 'C', category: 'midfielder', color: '#22c55e', sortOrder: 7 },
    { value: 'CENTER', name: 'Wing', abbreviation: 'W', category: 'midfielder', color: '#22c55e', sortOrder: 8 },
    // Defenders
    { value: 'HALF_BACK_AFL', name: 'Centre Half Back', abbreviation: 'CHB', category: 'defender', color: '#3b82f6', sortOrder: 9 },
    { value: 'HALF_BACK_AFL', name: 'Half Back Flank', abbreviation: 'HBF', category: 'defender', color: '#3b82f6', sortOrder: 10 },
    { value: 'FULL_BACK_AFL', name: 'Full Back', abbreviation: 'FB', category: 'defender', color: '#3b82f6', sortOrder: 11 },
    { value: 'UTILITY', name: 'Interchange', abbreviation: 'INT', category: 'utility', color: '#8b5cf6', sortOrder: 12 },
  ],
  GAELIC_FOOTBALL: [
    { value: 'GOALKEEPER', name: 'Goalkeeper', abbreviation: '1', category: 'goalkeeper', color: '#f59e0b', sortOrder: 1 },
    // Full Back Line
    { value: 'RIGHT_BACK', name: 'Right Corner Back', abbreviation: '2', category: 'defender', color: '#3b82f6', sortOrder: 2 },
    { value: 'CENTER_BACK', name: 'Full Back', abbreviation: '3', category: 'defender', color: '#3b82f6', sortOrder: 3 },
    { value: 'LEFT_BACK', name: 'Left Corner Back', abbreviation: '4', category: 'defender', color: '#3b82f6', sortOrder: 4 },
    // Half Back Line
    { value: 'RIGHT_BACK', name: 'Right Half Back', abbreviation: '5', category: 'defender', color: '#3b82f6', sortOrder: 5 },
    { value: 'CENTER_BACK', name: 'Centre Half Back', abbreviation: '6', category: 'defender', color: '#3b82f6', sortOrder: 6 },
    { value: 'LEFT_BACK', name: 'Left Half Back', abbreviation: '7', category: 'defender', color: '#3b82f6', sortOrder: 7 },
    // Midfield
    { value: 'CENTRAL_MIDFIELDER', name: 'Midfielder', abbreviation: '8/9', category: 'midfielder', color: '#22c55e', sortOrder: 8 },
    // Half Forward Line
    { value: 'RIGHT_WINGER', name: 'Right Half Forward', abbreviation: '10', category: 'forward', color: '#ef4444', sortOrder: 9 },
    { value: 'ATTACKING_MIDFIELDER', name: 'Centre Half Forward', abbreviation: '11', category: 'forward', color: '#ef4444', sortOrder: 10 },
    { value: 'LEFT_WINGER', name: 'Left Half Forward', abbreviation: '12', category: 'forward', color: '#ef4444', sortOrder: 11 },
    // Full Forward Line
    { value: 'RIGHT_WINGER', name: 'Right Corner Forward', abbreviation: '13', category: 'forward', color: '#ef4444', sortOrder: 12 },
    { value: 'STRIKER', name: 'Full Forward', abbreviation: '14', category: 'forward', color: '#ef4444', sortOrder: 13 },
    { value: 'LEFT_WINGER', name: 'Left Corner Forward', abbreviation: '15', category: 'forward', color: '#ef4444', sortOrder: 14 },
  ],
};

// ============================================================================
// FORMATION CONFIGURATION
// ============================================================================

export interface FormationInfo {
  /** Formation enum value */
  value: FormationType;
  /** Display name */
  name: string;
  /** Visual representation (e.g., "4-4-2") */
  display: string;
  /** Positions array from back to front */
  positions: Position[];
  /** Description */
  description?: string;
}

export const FORMATIONS_BY_SPORT: Partial<Record<Sport, FormationInfo[]>> = {
  FOOTBALL: [
    { value: 'FOUR_FOUR_TWO', name: '4-4-2', display: '4-4-2', positions: ['GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'CENTER_BACK', 'RIGHT_BACK', 'LEFT_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'RIGHT_MIDFIELDER', 'STRIKER', 'STRIKER'], description: 'Classic balanced formation' },
    { value: 'FOUR_THREE_THREE', name: '4-3-3', display: '4-3-3', positions: ['GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'CENTER_BACK', 'RIGHT_BACK', 'CENTRAL_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'LEFT_WINGER', 'STRIKER', 'RIGHT_WINGER'], description: 'Attacking wide formation' },
    { value: 'THREE_FIVE_TWO', name: '3-5-2', display: '3-5-2', positions: ['GOALKEEPER', 'CENTER_BACK', 'CENTER_BACK', 'CENTER_BACK', 'LEFT_WING_BACK', 'CENTRAL_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'RIGHT_WING_BACK', 'STRIKER', 'STRIKER'], description: 'Midfield dominance' },
    { value: 'FOUR_TWO_THREE_ONE', name: '4-2-3-1', display: '4-2-3-1', positions: ['GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'CENTER_BACK', 'RIGHT_BACK', 'DEFENSIVE_MIDFIELDER', 'DEFENSIVE_MIDFIELDER', 'LEFT_WINGER', 'ATTACKING_MIDFIELDER', 'RIGHT_WINGER', 'STRIKER'], description: 'Modern attacking formation' },
    { value: 'FIVE_THREE_TWO', name: '5-3-2', display: '5-3-2', positions: ['GOALKEEPER', 'LEFT_WING_BACK', 'CENTER_BACK', 'CENTER_BACK', 'CENTER_BACK', 'RIGHT_WING_BACK', 'CENTRAL_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'STRIKER', 'STRIKER'], description: 'Defensive solidity' },
    { value: 'FOUR_ONE_FOUR_ONE', name: '4-1-4-1', display: '4-1-4-1', positions: ['GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'CENTER_BACK', 'RIGHT_BACK', 'DEFENSIVE_MIDFIELDER', 'LEFT_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'RIGHT_MIDFIELDER', 'STRIKER'], description: 'Defensive midfield anchor' },
    { value: 'THREE_FOUR_THREE', name: '3-4-3', display: '3-4-3', positions: ['GOALKEEPER', 'CENTER_BACK', 'CENTER_BACK', 'CENTER_BACK', 'LEFT_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'RIGHT_MIDFIELDER', 'LEFT_WINGER', 'STRIKER', 'RIGHT_WINGER'], description: 'Attacking three at the back' },
  ],
  FUTSAL: [
    { value: 'ONE_THREE_ONE', name: '1-3-1', display: '1-3-1', positions: ['GOALKEEPER', 'CENTER_BACK', 'LEFT_WINGER', 'CENTRAL_MIDFIELDER', 'RIGHT_WINGER', 'STRIKER'], description: 'Diamond shape' },
    { value: 'TWO_THREE', name: '2-3', display: '2-3', positions: ['GOALKEEPER', 'LEFT_BACK', 'RIGHT_BACK', 'LEFT_WINGER', 'CENTRAL_MIDFIELDER', 'RIGHT_WINGER'], description: 'Two defenders, three attackers' },
    { value: 'THREE_TWO', name: '3-2', display: '3-2', positions: ['GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'RIGHT_BACK', 'LEFT_WINGER', 'RIGHT_WINGER'], description: 'Defensive setup' },
  ],
  AMERICAN_FOOTBALL: [
    { value: 'I_FORMATION', name: 'I Formation', display: 'I', positions: ['CENTER_POSITION', 'LEFT_GUARD', 'RIGHT_GUARD', 'LEFT_TACKLE', 'RIGHT_TACKLE', 'TIGHT_END', 'WIDE_RECEIVER', 'QUARTERBACK', 'RUNNING_BACK', 'RUNNING_BACK', 'WIDE_RECEIVER'], description: 'Power running formation' },
    { value: 'SHOTGUN', name: 'Shotgun', display: 'Shotgun', positions: ['CENTER_POSITION', 'LEFT_GUARD', 'RIGHT_GUARD', 'LEFT_TACKLE', 'RIGHT_TACKLE', 'TIGHT_END', 'WIDE_RECEIVER', 'WIDE_RECEIVER', 'QUARTERBACK', 'RUNNING_BACK', 'WIDE_RECEIVER'], description: 'Pass-heavy formation' },
    { value: 'SPREAD', name: 'Spread', display: 'Spread', positions: ['CENTER_POSITION', 'LEFT_GUARD', 'RIGHT_GUARD', 'LEFT_TACKLE', 'RIGHT_TACKLE', 'WIDE_RECEIVER', 'WIDE_RECEIVER', 'WIDE_RECEIVER', 'QUARTERBACK', 'RUNNING_BACK', 'WIDE_RECEIVER'], description: 'Four/five wide receivers' },
  ],
  NETBALL: [
    { value: 'DIAMOND', name: 'Diamond', display: 'Diamond', positions: ['GOALKEEPER_NETBALL', 'GOAL_DEFENSE', 'WING_DEFENSE', 'CENTER', 'WING_ATTACK', 'GOAL_ATTACK', 'GOAL_SHOOTER'], description: 'Standard netball positioning' },
  ],
};

// ============================================================================
// DRILL CATEGORIES BY SPORT
// ============================================================================

export const DRILL_CATEGORIES_BY_SPORT: Record<Sport, DrillCategory[]> = {
  FOOTBALL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'DRIBBLING', 'FIRST_TOUCH', 'CROSSING', 'HEADING',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'SET_PIECES', 'TRANSITIONS', 'PRESSING',
    'BUILD_UP_PLAY', 'COUNTER_ATTACK', 'GOALKEEPER_TRAINING', 'SMALL_SIDED_GAMES',
    'MATCH_SIMULATION', 'CONDITIONING', 'COOL_DOWN', 'RECOVERY',
  ],
  FUTSAL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'DRIBBLING', 'FIRST_TOUCH',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'SET_PIECES', 'TRANSITIONS',
    'SMALL_SIDED_GAMES', 'CONDITIONING', 'COOL_DOWN',
  ],
  BEACH_FOOTBALL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'DRIBBLING', 'HEADING',
    'ATTACKING_PATTERNS', 'SET_PIECES', 'SMALL_SIDED_GAMES', 'CONDITIONING', 'COOL_DOWN',
  ],
  RUGBY: [
    'WARM_UP', 'PASSING', 'TACKLING_TECHNIQUE', 'SCRUMMAGING', 'LINEOUT',
    'RUCKING', 'MAULING', 'BREAKDOWN', 'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS',
    'SET_PIECES', 'CONDITIONING', 'STRENGTH_POWER', 'COOL_DOWN', 'RECOVERY',
  ],
  BASKETBALL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'DRIBBLING', 'FREE_THROWS', 'THREE_POINT_SHOOTING',
    'POST_MOVES', 'PICK_AND_ROLL', 'FAST_BREAK', 'ZONE_DEFENSE', 'MAN_TO_MAN',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'CONDITIONING', 'COOL_DOWN',
  ],
  CRICKET: [
    'WARM_UP', 'BATTING_TECHNIQUE', 'BOWLING_TECHNIQUE', 'FIELDING_DRILLS',
    'CATCHING', 'WICKET_KEEPING', 'CONDITIONING', 'SPEED_AGILITY', 'COOL_DOWN',
  ],
  AMERICAN_FOOTBALL: [
    'WARM_UP', 'PASSING', 'BLOCKING', 'ROUTE_RUNNING', 'COVERAGE', 'TACKLING_TECHNIQUE',
    'SPECIAL_TEAMS', 'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'CONDITIONING',
    'STRENGTH_POWER', 'SPEED_AGILITY', 'COOL_DOWN',
  ],
  NETBALL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'FOOTWORK', 'INTERCEPTIONS',
    'COURT_MOVEMENT', 'CIRCLE_WORK', 'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS',
    'CONDITIONING', 'SPEED_AGILITY', 'COOL_DOWN',
  ],
  HOCKEY: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'STICK_HANDLING', 'SLAP_SHOT',
    'POWER_PLAY', 'PENALTY_KILL', 'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS',
    'GOALKEEPER_TRAINING', 'CONDITIONING', 'COOL_DOWN',
  ],
  LACROSSE: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'STICK_HANDLING', 'CATCHING',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'CONDITIONING', 'COOL_DOWN',
  ],
  AUSTRALIAN_RULES: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'TACKLING_TECHNIQUE',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'CONDITIONING',
    'STRENGTH_POWER', 'SPEED_AGILITY', 'COOL_DOWN',
  ],
  GAELIC_FOOTBALL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'CATCHING', 'TACKLING_TECHNIQUE',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'SET_PIECES', 'CONDITIONING', 'COOL_DOWN',
  ],
};

// ============================================================================
// MATCH EVENT TYPES BY SPORT
// ============================================================================

export const MATCH_EVENT_TYPES_BY_SPORT: Record<Sport, MatchEventType[]> = {
  FOOTBALL: [
    'GOAL', 'ASSIST', 'OWN_GOAL', 'PENALTY_SCORED', 'PENALTY_MISSED', 'PENALTY_SAVED',
    'YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    'INJURY', 'VAR_REVIEW', 'VAR_DECISION', 'OFFSIDE', 'FOUL', 'FREE_KICK', 'CORNER',
    'THROW_IN', 'GOAL_KICK', 'KICKOFF', 'HALFTIME', 'FULLTIME', 'INJURY_TIME',
    'PERIOD_START', 'PERIOD_END', 'OVERTIME_START', 'SHOOTOUT_START',
  ],
  FUTSAL: [
    'GOAL', 'ASSIST', 'OWN_GOAL', 'PENALTY_SCORED', 'PENALTY_MISSED',
    'YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    'FOUL', 'FREE_KICK', 'KICKOFF', 'HALFTIME', 'FULLTIME', 'TIMEOUT',
  ],
  BEACH_FOOTBALL: [
    'GOAL', 'ASSIST', 'OWN_GOAL', 'PENALTY_SCORED', 'PENALTY_MISSED',
    'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    'FOUL', 'FREE_KICK', 'KICKOFF', 'PERIOD_START', 'PERIOD_END', 'FULLTIME',
  ],
  RUGBY: [
    'TRY', 'CONVERSION', 'PENALTY_GOAL', 'DROP_GOAL', 'SCRUM', 'LINEOUT', 'MAUL', 'RUCK',
    'KNOCK_ON', 'HIGH_TACKLE', 'SIN_BIN', 'YELLOW_CARD_RUGBY', 'RED_CARD_RUGBY',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'INJURY', 'HALFTIME', 'FULLTIME',
    'PERIOD_START', 'PERIOD_END',
  ],
  BASKETBALL: [
    'THREE_POINTER', 'TWO_POINTER', 'FREE_THROW_MADE', 'FREE_THROW_MISSED',
    'FAST_BREAK', 'DUNK', 'ALLEY_OOP', 'TURNOVER', 'STEAL', 'BLOCK',
    'OFFENSIVE_FOUL', 'DEFENSIVE_FOUL', 'TRAVEL', 'DOUBLE_DRIBBLE',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT', 'PERIOD_START', 'PERIOD_END',
  ],
  CRICKET: [
    'WICKET', 'BOUNDARY', 'SIX', 'MAIDEN_OVER', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE',
    'OVERTHROW', 'RUN_OUT', 'CAUGHT', 'BOWLED', 'LBW', 'STUMPED',
    'PERIOD_START', 'PERIOD_END', 'CHALLENGE_REVIEW',
  ],
  AMERICAN_FOOTBALL: [
    'TOUCHDOWN', 'FIELD_GOAL', 'SAFETY_SCORE', 'INTERCEPTION', 'FUMBLE', 'SACK',
    'TWO_POINT_CONVERSION', 'EXTRA_POINT', 'PUNT', 'KICKOFF_RETURN', 'FAIR_CATCH',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT', 'PERIOD_START', 'PERIOD_END',
    'CHALLENGE_REVIEW',
  ],
  NETBALL: [
    'GOAL', 'CENTER_PASS', 'OBSTRUCTION', 'CONTACT', 'HELD_BALL', 'STEPPING', 'OVER_THIRD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT', 'PERIOD_START', 'PERIOD_END',
  ],
  HOCKEY: [
    'GOAL', 'ASSIST', 'HAT_TRICK', 'MAJOR_PENALTY', 'MINOR_PENALTY', 'FIGHT',
    'POWER_PLAY_GOAL', 'SHORTHANDED_GOAL', 'EMPTY_NET_GOAL',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'PERIOD_START', 'PERIOD_END', 'SHOOTOUT_START',
  ],
  LACROSSE: [
    'GOAL', 'ASSIST', 'FOUL', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    'TIMEOUT', 'PERIOD_START', 'PERIOD_END',
  ],
  AUSTRALIAN_RULES: [
    'GOAL', 'BEHIND', 'RUSHED_BEHIND', 'MARK', 'HANDBALL', 'BOUNCE',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'PERIOD_START', 'PERIOD_END',
  ],
  GAELIC_FOOTBALL: [
    'GOAL', 'FOUL', 'FREE_KICK', 'YELLOW_CARD', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'HALFTIME', 'FULLTIME',
  ],
};

// ============================================================================
// RANKING CATEGORIES BY SPORT
// ============================================================================

export interface RankingCategory {
  key: string;
  name: string;
  statKey: string;
  icon: string;
  color: string;
  isHigherBetter: boolean;
  unit?: string;
}

export const RANKING_CATEGORIES_BY_SPORT: Record<Sport, RankingCategory[]> = {
  FOOTBALL: [
    { key: 'topScorers', name: 'Top Scorers', statKey: 'goals', icon: '⚽', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Top Assists', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'topCleanSheets', name: 'Clean Sheets', statKey: 'cleanSheets', icon: '🧤', color: '#f59e0b', isHigherBetter: true },
    { key: 'topRatings', name: 'Top Rated', statKey: 'averageRating', icon: '⭐', color: '#8b5cf6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Appearances', statKey: 'matches', icon: '📊', color: '#06b6d4', isHigherBetter: true },
    { key: 'mostMinutes', name: 'Minutes Played', statKey: 'minutesPlayed', icon: '⏱️', color: '#ec4899', isHigherBetter: true },
  ],
  FUTSAL: [
    { key: 'topScorers', name: 'Top Scorers', statKey: 'goals', icon: '⚽', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Top Assists', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Appearances', statKey: 'matches', icon: '📊', color: '#06b6d4', isHigherBetter: true },
  ],
  BEACH_FOOTBALL: [
    { key: 'topScorers', name: 'Top Scorers', statKey: 'goals', icon: '⚽', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Top Assists', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Appearances', statKey: 'matches', icon: '📊', color: '#06b6d4', isHigherBetter: true },
  ],
  RUGBY: [
    { key: 'topTryScorers', name: 'Try Scorers', statKey: 'goals', icon: '🏉', color: '#22c55e', isHigherBetter: true },
    { key: 'topConversions', name: 'Conversions', statKey: 'assists', icon: '🎯', color: '#3b82f6', isHigherBetter: true },
    { key: 'topTackles', name: 'Tackles', statKey: 'tackles', icon: '💪', color: '#f59e0b', isHigherBetter: true },
    { key: 'topCarries', name: 'Carries', statKey: 'dribbles', icon: '🏃', color: '#8b5cf6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Appearances', statKey: 'matches', icon: '📊', color: '#06b6d4', isHigherBetter: true },
  ],
  BASKETBALL: [
    { key: 'topScorers', name: 'Points Leaders', statKey: 'goals', icon: '🏀', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Assists Leaders', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'topRebounds', name: 'Rebounders', statKey: 'aerialDuelsWon', icon: '📊', color: '#f59e0b', isHigherBetter: true },
    { key: 'topSteals', name: 'Steals', statKey: 'interceptions', icon: '✋', color: '#8b5cf6', isHigherBetter: true },
    { key: 'topBlocks', name: 'Blocks', statKey: 'blocks', icon: '🛡️', color: '#06b6d4', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'matches', icon: '🎮', color: '#ec4899', isHigherBetter: true },
  ],
  CRICKET: [
    { key: 'topRunScorers', name: 'Run Scorers', statKey: 'goals', icon: '🏏', color: '#22c55e', isHigherBetter: true },
    { key: 'topWicketTakers', name: 'Wicket Takers', statKey: 'assists', icon: '🎯', color: '#3b82f6', isHigherBetter: true },
    { key: 'topCatches', name: 'Catches', statKey: 'interceptions', icon: '🧤', color: '#f59e0b', isHigherBetter: true },
    { key: 'bestAverage', name: 'Batting Average', statKey: 'averageRating', icon: '📈', color: '#06b6d4', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Matches', statKey: 'matches', icon: '📊', color: '#ec4899', isHigherBetter: true },
  ],
  AMERICAN_FOOTBALL: [
    { key: 'topTouchdowns', name: 'Touchdowns', statKey: 'goals', icon: '🏈', color: '#22c55e', isHigherBetter: true },
    { key: 'topPassingYards', name: 'Passing Yards', statKey: 'passes', icon: '📊', color: '#3b82f6', isHigherBetter: true, unit: 'yds' },
    { key: 'topRushingYards', name: 'Rushing Yards', statKey: 'dribbles', icon: '🏃', color: '#f59e0b', isHigherBetter: true, unit: 'yds' },
    { key: 'topInterceptions', name: 'Interceptions', statKey: 'interceptions', icon: '✋', color: '#06b6d4', isHigherBetter: true },
    { key: 'topSacks', name: 'Sacks', statKey: 'tackles', icon: '💥', color: '#ef4444', isHigherBetter: true },
  ],
  NETBALL: [
    { key: 'topScorers', name: 'Goal Scorers', statKey: 'goals', icon: '🥅', color: '#22c55e', isHigherBetter: true },
    { key: 'topAccuracy', name: 'Shooting %', statKey: 'shotAccuracy', icon: '🎯', color: '#3b82f6', isHigherBetter: true, unit: '%' },
    { key: 'topInterceptions', name: 'Intercepts', statKey: 'interceptions', icon: '✋', color: '#f59e0b', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'matches', icon: '📊', color: '#06b6d4', isHigherBetter: true },
  ],
  HOCKEY: [
    { key: 'topScorers', name: 'Goal Scorers', statKey: 'goals', icon: '🏒', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Assists', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'topPoints', name: 'Points', statKey: 'averageRating', icon: '⭐', color: '#f59e0b', isHigherBetter: true },
    { key: 'topSaves', name: 'Saves (Goalies)', statKey: 'saves', icon: '🧤', color: '#06b6d4', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'matches', icon: '🎮', color: '#ec4899', isHigherBetter: true },
  ],
  LACROSSE: [
    { key: 'topScorers', name: 'Goal Scorers', statKey: 'goals', icon: '🥍', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Assists', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'topGroundBalls', name: 'Ground Balls', statKey: 'interceptions', icon: '⚫', color: '#f59e0b', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'matches', icon: '📊', color: '#06b6d4', isHigherBetter: true },
  ],
  AUSTRALIAN_RULES: [
    { key: 'topGoals', name: 'Goal Kickers', statKey: 'goals', icon: '🏉', color: '#22c55e', isHigherBetter: true },
    { key: 'topDisposals', name: 'Disposals', statKey: 'passes', icon: '📊', color: '#3b82f6', isHigherBetter: true },
    { key: 'topMarks', name: 'Marks', statKey: 'aerialDuelsWon', icon: '✋', color: '#f59e0b', isHigherBetter: true },
    { key: 'topTackles', name: 'Tackles', statKey: 'tackles', icon: '💪', color: '#8b5cf6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'matches', icon: '🎮', color: '#ec4899', isHigherBetter: true },
  ],
  GAELIC_FOOTBALL: [
    { key: 'topScorers', name: 'Score Leaders', statKey: 'goals', icon: '🏐', color: '#22c55e', isHigherBetter: true },
    { key: 'topPoints', name: 'Points Scored', statKey: 'assists', icon: '🎯', color: '#3b82f6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'matches', icon: '📊', color: '#06b6d4', isHigherBetter: true },
  ],
};

// ============================================================================
// PLAYER STATUS CONFIGURATION
// ============================================================================

export const PLAYER_STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '✓' },
  INJURED: { label: 'Injured', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '🏥' },
  SUSPENDED: { label: 'Suspended', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '⚠️' },
  ON_LOAN: { label: 'On Loan', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '↔️' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: '○' },
  INTERNATIONAL_DUTY: { label: 'International', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '🌍' },
  AVAILABLE: { label: 'Available', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '✓' },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get sport configuration
 */
export function getSportConfig(sport: Sport): SportConfig {
  return SPORT_CONFIG[sport] || SPORT_CONFIG.FOOTBALL;
}

/**
 * Get positions for a sport
 */
export function getPositionsForSport(sport: Sport): PositionInfo[] {
  return POSITIONS_BY_SPORT[sport] || POSITIONS_BY_SPORT.FOOTBALL;
}

/**
 * Get formations for a sport
 */
export function getFormationsForSport(sport: Sport): FormationInfo[] {
  return FORMATIONS_BY_SPORT[sport] || FORMATIONS_BY_SPORT.FOOTBALL || [];
}

/**
 * Get drill categories for a sport
 */
export function getDrillCategories(sport: Sport): DrillCategory[] {
  return DRILL_CATEGORIES_BY_SPORT[sport] || DRILL_CATEGORIES_BY_SPORT.FOOTBALL;
}

/**
 * Get match event types for a sport
 */
export function getMatchEventTypes(sport: Sport): MatchEventType[] {
  return MATCH_EVENT_TYPES_BY_SPORT[sport] || MATCH_EVENT_TYPES_BY_SPORT.FOOTBALL;
}

/**
 * Get ranking categories for a sport
 */
export function getRankingCategories(sport: Sport): RankingCategory[] {
  return RANKING_CATEGORIES_BY_SPORT[sport] || RANKING_CATEGORIES_BY_SPORT.FOOTBALL;
}

/**
 * Format sport name for display
 */
export function formatSportName(sport: Sport): string {
  return SPORT_CONFIG[sport]?.name || sport;
}

/**
 * Get sport emoji icon
 */
export function getSportEmoji(sport: Sport): string {
  return SPORT_CONFIG[sport]?.emoji || '⚽';
}

/**
 * Get sport Lucide icon name
 */
export function getSportIcon(sport: Sport): string {
  return SPORT_CONFIG[sport]?.icon || 'Circle';
}

/**
 * Get position display name
 */
export function getPositionDisplayName(position: Position, sport: Sport = 'FOOTBALL'): string {
  const positions = getPositionsForSport(sport);
  const found = positions.find(p => p.value === position);
  return found?.name || position;
}

/**
 * Get position abbreviation
 */
export function getPositionAbbreviation(position: Position, sport: Sport = 'FOOTBALL'): string {
  const positions = getPositionsForSport(sport);
  const found = positions.find(p => p.value === position);
  return found?.abbreviation || position.substring(0, 2);
}

/**
 * Get position color
 */
export function getPositionColor(position: Position, sport: Sport = 'FOOTBALL'): string {
  const positions = getPositionsForSport(sport);
  const found = positions.find(p => p.value === position);
  return found?.color || '#6b7280';
}

/**
 * Get position category color
 */
export function getPositionCategoryColor(category: string): string {
  return POSITION_CATEGORY_COLORS[category] || '#6b7280';
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string | null): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get primary scoring stat key for a sport
 */
export function getPrimaryScoringStatKey(sport: Sport): string {
  const config = SPORT_CONFIG[sport];
  if (config.usesGoals) return 'goals';
  if (sport === 'CRICKET') return 'runs';
  return 'points';
}

/**
 * Check if a sport uses goals vs points
 */
export function sportUsesGoals(sport: Sport): boolean {
  return SPORT_CONFIG[sport]?.usesGoals ?? true;
}

/**
 * Get all sports as array
 */
export function getAllSports(): Sport[] {
  return Object.keys(SPORT_CONFIG) as Sport[];
}

/**
 * Get sports with a specific feature
 */
export function getSportsWithFeature(feature: keyof SportConfig): Sport[] {
  return getAllSports().filter(sport => SPORT_CONFIG[sport][feature]);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  SPORT_CONFIG,
  POSITIONS_BY_SPORT,
  FORMATIONS_BY_SPORT,
  DRILL_CATEGORIES_BY_SPORT,
  MATCH_EVENT_TYPES_BY_SPORT,
  RANKING_CATEGORIES_BY_SPORT,
  PLAYER_STATUS_CONFIG,
  POSITION_CATEGORY_COLORS,
  getSportConfig,
  getPositionsForSport,
  getFormationsForSport,
  getDrillCategories,
  getMatchEventTypes,
  getRankingCategories,
  formatSportName,
  getSportEmoji,
  getSportIcon,
  getPositionDisplayName,
  getPositionAbbreviation,
  getPositionColor,
  getPositionCategoryColor,
  calculateAge,
  formatDuration,
  formatCurrency,
  getPrimaryScoringStatKey,
  sportUsesGoals,
  getAllSports,
  getSportsWithFeature,
};