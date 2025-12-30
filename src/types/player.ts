// ============================================================================
// 🏆 PITCHCONNECT - Player & Sport Types v7.5.0
// Path: src/types/player.ts
// ============================================================================
// 
// Comprehensive type definitions for multi-sport support across 12 sports.
// Used by dashboards, forms, and components throughout the platform.
//
// ============================================================================

// ============================================================================
// SPORT ENUM (matches Prisma schema)
// ============================================================================

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

// ============================================================================
// POSITION ENUM (matches Prisma schema)
// ============================================================================

export type Position =
  // Football
  | 'GOALKEEPER' | 'LEFT_BACK' | 'CENTER_BACK' | 'RIGHT_BACK'
  | 'LEFT_WING_BACK' | 'RIGHT_WING_BACK' | 'DEFENSIVE_MIDFIELDER'
  | 'CENTRAL_MIDFIELDER' | 'LEFT_MIDFIELDER' | 'RIGHT_MIDFIELDER'
  | 'ATTACKING_MIDFIELDER' | 'LEFT_WINGER' | 'RIGHT_WINGER'
  | 'STRIKER' | 'CENTER_FORWARD' | 'SECOND_STRIKER'
  // Netball
  | 'GOALKEEPER_NETBALL' | 'GOAL_ATTACK' | 'WING_ATTACK' | 'CENTER'
  | 'WING_DEFENSE' | 'GOAL_DEFENSE' | 'GOAL_SHOOTER'
  // Rugby
  | 'PROP' | 'HOOKER' | 'LOCK' | 'FLANKER' | 'NUMBER_8'
  | 'SCRUM_HALF' | 'FLY_HALF' | 'INSIDE_CENTER' | 'OUTSIDE_CENTER' | 'FULLBACK'
  | 'HOOKER_LEAGUE' | 'PROP_LEAGUE' | 'SECOND_ROW' | 'LOOSE_FORWARD'
  // American Football
  | 'QUARTERBACK' | 'RUNNING_BACK' | 'WIDE_RECEIVER' | 'TIGHT_END'
  | 'LEFT_TACKLE' | 'LEFT_GUARD' | 'CENTER_POSITION' | 'RIGHT_GUARD' | 'RIGHT_TACKLE'
  | 'LINEBACKER' | 'DEFENSIVE_END' | 'DEFENSIVE_TACKLE' | 'SAFETY' | 'CORNERBACK'
  | 'PUNTER' | 'KICKER'
  // Basketball
  | 'POINT_GUARD' | 'SHOOTING_GUARD' | 'SMALL_FORWARD' | 'POWER_FORWARD' | 'CENTER_BASKETBALL'
  // Cricket
  | 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'FIELDER' | 'WICKET_KEEPER'
  // Hockey
  | 'GOALTENDER' | 'DEFENSEMAN' | 'WINGER' | 'CENTER_HOCKEY'
  // Generic
  | 'UTILITY' | 'SUBSTITUTE';

// ============================================================================
// SPORT CONFIGURATION
// ============================================================================

export interface SportConfig {
  name: string;
  icon: string;
  emoji: string;
  primaryStat: string;
  secondaryStat: string;
  primaryStatKey: string;
  secondaryStatKey: string;
  positions: Position[];
  formations: string[];
  scoringUnits: string;
  matchDuration: number; // in minutes
  periods: number;
  playersOnField: number;
  substitutes: number;
  scoreBreakdown: ScoreBreakdownConfig[];
  eventTypes: string[];
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface ScoreBreakdownConfig {
  key: string;
  label: string;
  points: number;
  icon?: string;
}

// ============================================================================
// SPORT CONFIGURATIONS - 12 SPORTS
// ============================================================================

export const SPORT_CONFIGS: Record<Sport, SportConfig> = {
  FOOTBALL: {
    name: 'Football',
    icon: '⚽',
    emoji: '⚽',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    primaryStatKey: 'goals',
    secondaryStatKey: 'assists',
    positions: [
      'GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'RIGHT_BACK',
      'LEFT_WING_BACK', 'RIGHT_WING_BACK', 'DEFENSIVE_MIDFIELDER',
      'CENTRAL_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER',
      'ATTACKING_MIDFIELDER', 'LEFT_WINGER', 'RIGHT_WINGER',
      'STRIKER', 'CENTER_FORWARD', 'SECOND_STRIKER',
    ],
    formations: [
      '4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-2-3-1', '4-1-4-1',
      '3-4-3', '5-4-1', '4-5-1', '4-4-1-1', '4-3-2-1',
    ],
    scoringUnits: 'goals',
    matchDuration: 90,
    periods: 2,
    playersOnField: 11,
    substitutes: 7,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '⚽' },
    ],
    eventTypes: ['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'PENALTY_SCORED', 'PENALTY_MISSED', 'OWN_GOAL', 'CORNER', 'FREE_KICK', 'OFFSIDE'],
    color: '#22c55e',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600',
  },

  NETBALL: {
    name: 'Netball',
    icon: '🏀',
    emoji: '🏐',
    primaryStat: 'Goals',
    secondaryStat: 'Interceptions',
    primaryStatKey: 'goals',
    secondaryStatKey: 'interceptions',
    positions: [
      'GOALKEEPER_NETBALL', 'GOAL_ATTACK', 'WING_ATTACK', 'CENTER',
      'WING_DEFENSE', 'GOAL_DEFENSE', 'GOAL_SHOOTER',
    ],
    formations: ['Standard'],
    scoringUnits: 'goals',
    matchDuration: 60,
    periods: 4,
    playersOnField: 7,
    substitutes: 5,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '🎯' },
    ],
    eventTypes: ['GOAL', 'INTERCEPTION', 'CENTER_PASS', 'OBSTRUCTION', 'CONTACT', 'HELD_BALL', 'STEPPING', 'OVER_THIRD'],
    color: '#a855f7',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-violet-600',
  },

  RUGBY: {
    name: 'Rugby',
    icon: '🏉',
    emoji: '🏉',
    primaryStat: 'Tries',
    secondaryStat: 'Conversions',
    primaryStatKey: 'tries',
    secondaryStatKey: 'conversions',
    positions: [
      'PROP', 'HOOKER', 'LOCK', 'FLANKER', 'NUMBER_8',
      'SCRUM_HALF', 'FLY_HALF', 'INSIDE_CENTER', 'OUTSIDE_CENTER',
      'FULLBACK', 'WINGER',
    ],
    formations: ['Pods', 'Diamond', 'Flat Line'],
    scoringUnits: 'points',
    matchDuration: 80,
    periods: 2,
    playersOnField: 15,
    substitutes: 8,
    scoreBreakdown: [
      { key: 'tries', label: 'Tries', points: 5, icon: '🏉' },
      { key: 'conversions', label: 'Conversions', points: 2, icon: '🥅' },
      { key: 'penaltyGoals', label: 'Penalty Goals', points: 3, icon: '🎯' },
      { key: 'dropGoals', label: 'Drop Goals', points: 3, icon: '🦶' },
    ],
    eventTypes: ['TRY', 'CONVERSION', 'PENALTY_GOAL', 'DROP_GOAL', 'YELLOW_CARD_RUGBY', 'RED_CARD_RUGBY', 'SCRUM', 'LINEOUT', 'KNOCK_ON', 'SIN_BIN'],
    color: '#f97316',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-600',
  },

  CRICKET: {
    name: 'Cricket',
    icon: '🏏',
    emoji: '🏏',
    primaryStat: 'Runs',
    secondaryStat: 'Wickets',
    primaryStatKey: 'runs',
    secondaryStatKey: 'wickets',
    positions: [
      'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'FIELDER', 'WICKET_KEEPER',
    ],
    formations: ['Standard'],
    scoringUnits: 'runs',
    matchDuration: 480, // T20: 180, ODI: 480, Test: multi-day
    periods: 2, // Innings
    playersOnField: 11,
    substitutes: 4,
    scoreBreakdown: [
      { key: 'runs', label: 'Runs', points: 1, icon: '🏃' },
      { key: 'boundaries', label: 'Boundaries', points: 4, icon: '4️⃣' },
      { key: 'sixes', label: 'Sixes', points: 6, icon: '6️⃣' },
    ],
    eventTypes: ['WICKET', 'BOUNDARY', 'SIX', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'RUN_OUT', 'CAUGHT', 'BOWLED', 'LBW', 'STUMPED', 'MAIDEN_OVER'],
    color: '#eab308',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-amber-500',
  },

  AMERICAN_FOOTBALL: {
    name: 'American Football',
    icon: '🏈',
    emoji: '🏈',
    primaryStat: 'Touchdowns',
    secondaryStat: 'Passing Yards',
    primaryStatKey: 'touchdowns',
    secondaryStatKey: 'passingYards',
    positions: [
      'QUARTERBACK', 'RUNNING_BACK', 'WIDE_RECEIVER', 'TIGHT_END',
      'LEFT_TACKLE', 'LEFT_GUARD', 'CENTER_POSITION', 'RIGHT_GUARD', 'RIGHT_TACKLE',
      'LINEBACKER', 'DEFENSIVE_END', 'DEFENSIVE_TACKLE', 'SAFETY', 'CORNERBACK',
      'PUNTER', 'KICKER',
    ],
    formations: [
      'I-Formation', 'Shotgun', 'Pistol', 'Spread', 'Single Back',
      'Pro Set', 'Wildcat',
    ],
    scoringUnits: 'points',
    matchDuration: 60,
    periods: 4,
    playersOnField: 11,
    substitutes: 46,
    scoreBreakdown: [
      { key: 'touchdowns', label: 'Touchdowns', points: 6, icon: '🏈' },
      { key: 'extraPoints', label: 'Extra Points', points: 1, icon: '🥅' },
      { key: 'twoPointConversions', label: '2PT Conversions', points: 2, icon: '2️⃣' },
      { key: 'fieldGoals', label: 'Field Goals', points: 3, icon: '🎯' },
      { key: 'safeties', label: 'Safeties', points: 2, icon: '🛡️' },
    ],
    eventTypes: ['TOUCHDOWN', 'FIELD_GOAL', 'SAFETY_SCORE', 'EXTRA_POINT', 'TWO_POINT_CONVERSION', 'INTERCEPTION', 'FUMBLE', 'SACK', 'PUNT', 'KICKOFF_RETURN'],
    color: '#8b5cf6',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
  },

  BASKETBALL: {
    name: 'Basketball',
    icon: '🏀',
    emoji: '🏀',
    primaryStat: 'Points',
    secondaryStat: 'Rebounds',
    primaryStatKey: 'points',
    secondaryStatKey: 'rebounds',
    positions: [
      'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD',
      'POWER_FORWARD', 'CENTER_BASKETBALL',
    ],
    formations: ['1-3-1', '2-3', '2-1-2', '3-2', '1-2-2'],
    scoringUnits: 'points',
    matchDuration: 48, // NBA: 48, FIBA: 40
    periods: 4,
    playersOnField: 5,
    substitutes: 7,
    scoreBreakdown: [
      { key: 'twoPointers', label: '2-Pointers', points: 2, icon: '2️⃣' },
      { key: 'threePointers', label: '3-Pointers', points: 3, icon: '3️⃣' },
      { key: 'freeThrows', label: 'Free Throws', points: 1, icon: '🎯' },
    ],
    eventTypes: ['TWO_POINTER', 'THREE_POINTER', 'FREE_THROW_MADE', 'FREE_THROW_MISSED', 'BLOCK', 'STEAL', 'REBOUND', 'TURNOVER', 'FOUL', 'DUNK', 'ALLEY_OOP'],
    color: '#f97316',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-500',
  },

  HOCKEY: {
    name: 'Hockey',
    icon: '🏒',
    emoji: '🏒',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    primaryStatKey: 'goals',
    secondaryStatKey: 'assists',
    positions: [
      'GOALTENDER', 'DEFENSEMAN', 'WINGER', 'CENTER_HOCKEY',
    ],
    formations: ['1-2-2', '1-3-1', '2-1-2', 'Trap'],
    scoringUnits: 'goals',
    matchDuration: 60,
    periods: 3,
    playersOnField: 6,
    substitutes: 17,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '🏒' },
    ],
    eventTypes: ['GOAL', 'ASSIST', 'MINOR_PENALTY', 'MAJOR_PENALTY', 'POWER_PLAY_GOAL', 'SHORTHANDED_GOAL', 'EMPTY_NET_GOAL', 'HAT_TRICK'],
    color: '#0ea5e9',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-blue-600',
  },

  LACROSSE: {
    name: 'Lacrosse',
    icon: '🥍',
    emoji: '🥍',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    primaryStatKey: 'goals',
    secondaryStatKey: 'assists',
    positions: [
      'GOALKEEPER', 'DEFENSEMAN', 'MIDFIELDER', 'ATTACKER',
    ],
    formations: ['2-3-1', '1-4-1', '2-2-2'],
    scoringUnits: 'goals',
    matchDuration: 60,
    periods: 4,
    playersOnField: 10,
    substitutes: 13,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '🥍' },
    ],
    eventTypes: ['GOAL', 'ASSIST', 'GROUND_BALL', 'FACEOFF_WIN', 'SAVE', 'TURNOVER', 'PENALTY'],
    color: '#06b6d4',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-teal-600',
  },

  AUSTRALIAN_RULES: {
    name: 'Australian Rules',
    icon: '🏉',
    emoji: '🏉',
    primaryStat: 'Goals',
    secondaryStat: 'Behinds',
    primaryStatKey: 'goals',
    secondaryStatKey: 'behinds',
    positions: [
      'FULLBACK', 'CENTER_HALF_BACK', 'BACK_POCKET',
      'WING', 'CENTER', 'RUCK', 'ROVER', 'FORWARD_POCKET',
      'CENTER_HALF_FORWARD', 'FULL_FORWARD',
    ],
    formations: ['Standard'],
    scoringUnits: 'points',
    matchDuration: 80,
    periods: 4,
    playersOnField: 18,
    substitutes: 4,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 6, icon: '🥅' },
      { key: 'behinds', label: 'Behinds', points: 1, icon: '1️⃣' },
    ],
    eventTypes: ['GOAL', 'BEHIND', 'RUSHED_BEHIND', 'MARK', 'HANDBALL', 'BOUNCE', 'FREE_KICK', 'FIFTY_METER_PENALTY'],
    color: '#14b8a6',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-green-600',
  },

  GAELIC_FOOTBALL: {
    name: 'Gaelic Football',
    icon: '🏐',
    emoji: '🏐',
    primaryStat: 'Points',
    secondaryStat: 'Goals',
    primaryStatKey: 'points',
    secondaryStatKey: 'goals',
    positions: [
      'GOALKEEPER', 'CORNER_BACK', 'FULL_BACK', 'HALF_BACK',
      'MIDFIELDER', 'HALF_FORWARD', 'CORNER_FORWARD', 'FULL_FORWARD',
    ],
    formations: ['Standard'],
    scoringUnits: 'points',
    matchDuration: 70,
    periods: 2,
    playersOnField: 15,
    substitutes: 5,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 3, icon: '🥅' },
      { key: 'points', label: 'Points', points: 1, icon: '1️⃣' },
    ],
    eventTypes: ['GOAL', 'POINT', 'WIDE', 'FREE_KICK', 'YELLOW_CARD', 'RED_CARD', 'BLACK_CARD'],
    color: '#22c55e',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-lime-600',
  },

  FUTSAL: {
    name: 'Futsal',
    icon: '⚽',
    emoji: '⚽',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    primaryStatKey: 'goals',
    secondaryStatKey: 'assists',
    positions: [
      'GOALKEEPER', 'DEFENDER', 'WINGER', 'PIVOT',
    ],
    formations: ['1-2-1', '2-2', '1-1-2', '4-0'],
    scoringUnits: 'goals',
    matchDuration: 40,
    periods: 2,
    playersOnField: 5,
    substitutes: 7,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '⚽' },
    ],
    eventTypes: ['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'ACCUMULATED_FOUL', 'PENALTY_SCORED', 'PENALTY_MISSED', 'CORNER'],
    color: '#3b82f6',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-600',
  },

  BEACH_FOOTBALL: {
    name: 'Beach Football',
    icon: '🏖️',
    emoji: '🏖️',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    primaryStatKey: 'goals',
    secondaryStatKey: 'assists',
    positions: [
      'GOALKEEPER', 'DEFENDER', 'WINGER', 'PIVOT',
    ],
    formations: ['1-2-1', '2-2'],
    scoringUnits: 'goals',
    matchDuration: 36,
    periods: 3,
    playersOnField: 5,
    substitutes: 7,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '⚽' },
    ],
    eventTypes: ['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'BICYCLE_KICK', 'SCISSOR_KICK', 'PENALTY_SCORED'],
    color: '#eab308',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-orange-500',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get stat labels for a specific sport
 */
export function getStatLabels(sport: Sport): { primaryStat: string; secondaryStat: string } {
  const config = SPORT_CONFIGS[sport];
  return {
    primaryStat: config.primaryStat,
    secondaryStat: config.secondaryStat,
  };
}

/**
 * Get positions for a specific sport
 */
export function getPositionsForSport(sport: Sport): Position[] {
  return SPORT_CONFIGS[sport].positions;
}

/**
 * Get formations for a specific sport
 */
export function getFormationsForSport(sport: Sport): string[] {
  return SPORT_CONFIGS[sport].formations;
}

/**
 * Calculate total score from breakdown (for multi-sport)
 */
export function calculateTotalScore(sport: Sport, breakdown: Record<string, number>): number {
  const config = SPORT_CONFIGS[sport];
  return config.scoreBreakdown.reduce((total, item) => {
    return total + (breakdown[item.key] || 0) * item.points;
  }, 0);
}

/**
 * Format position for display
 */
export function formatPosition(position: Position): string {
  return position
    .replace(/_/g, ' ')
    .replace(/NETBALL|LEAGUE|BASKETBALL|HOCKEY|POSITION/g, '')
    .trim()
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get sport-specific event types
 */
export function getEventTypesForSport(sport: Sport): string[] {
  return SPORT_CONFIGS[sport].eventTypes;
}

/**
 * Check if sport uses score breakdown (multi-component scoring)
 */
export function usesScoreBreakdown(sport: Sport): boolean {
  return SPORT_CONFIGS[sport].scoreBreakdown.length > 1;
}

/**
 * Get sport by name (case-insensitive)
 */
export function getSportByName(name: string): Sport | null {
  const normalized = name.toUpperCase().replace(/\s+/g, '_');
  return (Object.keys(SPORT_CONFIGS) as Sport[]).find(
    sport => sport === normalized || SPORT_CONFIGS[sport].name.toUpperCase() === name.toUpperCase()
  ) || null;
}

/**
 * Get all sports as array
 */
export function getAllSports(): Sport[] {
  return Object.keys(SPORT_CONFIGS) as Sport[];
}

// ============================================================================
// FITNESS STATUS TYPES (NEW v7.5.0)
// ============================================================================

export type FitnessStatus = 
  | 'FIT'
  | 'FIT_WITH_CAUTION'
  | 'LIMITED'
  | 'NOT_FIT'
  | 'PENDING_REVIEW'
  | 'CLEARED';

export type FitnessAssessmentType =
  | 'PRE_SEASON'
  | 'MID_SEASON'
  | 'POST_SEASON'
  | 'RETURN_TO_PLAY'
  | 'INJURY_FOLLOW_UP'
  | 'ROUTINE'
  | 'TRANSFER_MEDICAL'
  | 'INITIAL_REGISTRATION';

export const FITNESS_STATUS_CONFIG: Record<FitnessStatus, { label: string; color: string; icon: string }> = {
  FIT: { label: 'Fit', color: 'green', icon: '✅' },
  FIT_WITH_CAUTION: { label: 'Fit (Caution)', color: 'yellow', icon: '⚠️' },
  LIMITED: { label: 'Limited', color: 'orange', icon: '🔶' },
  NOT_FIT: { label: 'Not Fit', color: 'red', icon: '❌' },
  PENDING_REVIEW: { label: 'Pending Review', color: 'blue', icon: '🔄' },
  CLEARED: { label: 'Cleared', color: 'green', icon: '✅' },
};

// ============================================================================
// INJURY TYPES
// ============================================================================

export type InjurySeverity = 
  | 'MINOR'
  | 'MODERATE'
  | 'SEVERE'
  | 'CRITICAL'
  | 'CAREER_THREATENING';

export type InjuryStatus =
  | 'ACTIVE'
  | 'RECOVERING'
  | 'REHABILITATION'
  | 'CLEARED'
  | 'CHRONIC';

export const INJURY_SEVERITY_CONFIG: Record<InjurySeverity, { label: string; color: string; days: string }> = {
  MINOR: { label: 'Minor', color: 'yellow', days: '1-7 days' },
  MODERATE: { label: 'Moderate', color: 'orange', days: '1-4 weeks' },
  SEVERE: { label: 'Severe', color: 'red', days: '1-3 months' },
  CRITICAL: { label: 'Critical', color: 'red', days: '3-6 months' },
  CAREER_THREATENING: { label: 'Career Threatening', color: 'red', days: '6+ months' },
};

export const INJURY_STATUS_CONFIG: Record<InjuryStatus, { label: string; color: string; icon: string }> = {
  ACTIVE: { label: 'Active Injury', color: 'red', icon: '🏥' },
  RECOVERING: { label: 'Recovering', color: 'orange', icon: '🔄' },
  REHABILITATION: { label: 'Rehabilitation', color: 'blue', icon: '💪' },
  CLEARED: { label: 'Cleared', color: 'green', icon: '✅' },
  CHRONIC: { label: 'Chronic', color: 'purple', icon: '⚕️' },
};

// ============================================================================
// COMMON INJURY TYPES BY SPORT
// ============================================================================

export const COMMON_INJURIES: Record<Sport, string[]> = {
  FOOTBALL: ['Hamstring Strain', 'ACL Tear', 'Ankle Sprain', 'Groin Strain', 'Calf Strain', 'Knee Ligament', 'Metatarsal Fracture', 'Concussion'],
  NETBALL: ['Ankle Sprain', 'ACL Tear', 'Knee Injury', 'Finger Dislocation', 'Achilles Tendinitis'],
  RUGBY: ['Concussion', 'Shoulder Dislocation', 'Hamstring Strain', 'ACL Tear', 'Neck Injury', 'Broken Collarbone'],
  CRICKET: ['Shoulder Injury', 'Back Strain', 'Hamstring Strain', 'Side Strain', 'Finger Fracture', 'Knee Injury'],
  AMERICAN_FOOTBALL: ['Concussion', 'ACL Tear', 'Shoulder Injury', 'Ankle Sprain', 'Hamstring Strain', 'Neck Injury'],
  BASKETBALL: ['Ankle Sprain', 'ACL Tear', 'Knee Injury', 'Finger Jam', 'Achilles Injury', 'Back Strain'],
  HOCKEY: ['Concussion', 'Shoulder Injury', 'Groin Strain', 'MCL Sprain', 'Hip Flexor', 'Wrist Injury'],
  LACROSSE: ['Shoulder Injury', 'ACL Tear', 'Ankle Sprain', 'Concussion', 'Wrist Fracture'],
  AUSTRALIAN_RULES: ['Hamstring Strain', 'ACL Tear', 'Concussion', 'Shoulder Injury', 'Ankle Sprain'],
  GAELIC_FOOTBALL: ['Hamstring Strain', 'ACL Tear', 'Shoulder Injury', 'Ankle Sprain', 'Concussion'],
  FUTSAL: ['Ankle Sprain', 'Knee Injury', 'Groin Strain', 'Hamstring Strain'],
  BEACH_FOOTBALL: ['Ankle Sprain', 'Knee Injury', 'Shoulder Injury', 'Foot Injury'],
};

// ============================================================================
// PLAYER AVAILABILITY STATUS
// ============================================================================

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'INJURED'
  | 'ILL'
  | 'SUSPENDED'
  | 'INTERNATIONAL_DUTY'
  | 'LOAN'
  | 'PERSONAL';

export const AVAILABILITY_STATUS_CONFIG: Record<AvailabilityStatus, { label: string; color: string; icon: string }> = {
  AVAILABLE: { label: 'Available', color: 'green', icon: '✅' },
  UNAVAILABLE: { label: 'Unavailable', color: 'gray', icon: '⛔' },
  INJURED: { label: 'Injured', color: 'red', icon: '🏥' },
  ILL: { label: 'Ill', color: 'orange', icon: '🤒' },
  SUSPENDED: { label: 'Suspended', color: 'red', icon: '🚫' },
  INTERNATIONAL_DUTY: { label: 'International Duty', color: 'blue', icon: '🌍' },
  LOAN: { label: 'On Loan', color: 'purple', icon: '↔️' },
  PERSONAL: { label: 'Personal', color: 'gray', icon: '👤' },
};
