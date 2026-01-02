// ============================================================================
// 🏆 PITCHCONNECT - Player & Sport Types v7.5.0
// Path: src/types/player.ts
// ============================================================================
// 
// Comprehensive type definitions for multi-sport support across 12 sports.
// Used by dashboards, forms, and components throughout the platform.
//
// SPORTS SUPPORTED:
// Football, Netball, Rugby, Cricket, American Football, Basketball,
// Hockey, Lacrosse, Australian Rules, Gaelic Football, Futsal, Beach Football
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

/**
 * All sports as array (for iteration)
 */
export const ALL_SPORTS: Sport[] = [
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
];

// ============================================================================
// POSITION ENUM (matches Prisma schema)
// ============================================================================

export type Position =
  // Football (Association Football/Soccer)
  | 'GOALKEEPER' | 'LEFT_BACK' | 'CENTER_BACK' | 'RIGHT_BACK'
  | 'LEFT_WING_BACK' | 'RIGHT_WING_BACK' | 'DEFENSIVE_MIDFIELDER'
  | 'CENTRAL_MIDFIELDER' | 'LEFT_MIDFIELDER' | 'RIGHT_MIDFIELDER'
  | 'ATTACKING_MIDFIELDER' | 'LEFT_WINGER' | 'RIGHT_WINGER'
  | 'STRIKER' | 'CENTER_FORWARD' | 'SECOND_STRIKER'
  
  // Netball
  | 'GOALKEEPER_NETBALL' | 'GOAL_KEEPER' | 'GOAL_ATTACK' | 'WING_ATTACK' 
  | 'CENTER' | 'WING_DEFENSE' | 'GOAL_DEFENSE' | 'GOAL_SHOOTER'
  
  // Rugby Union
  | 'PROP' | 'LOOSEHEAD_PROP' | 'TIGHTHEAD_PROP' | 'HOOKER' 
  | 'LOCK' | 'BLINDSIDE_FLANKER' | 'OPENSIDE_FLANKER' | 'FLANKER' | 'NUMBER_8'
  | 'SCRUM_HALF' | 'FLY_HALF' | 'INSIDE_CENTER' | 'OUTSIDE_CENTER' 
  | 'LEFT_WING' | 'RIGHT_WING' | 'FULLBACK'
  
  // Rugby League
  | 'HOOKER_LEAGUE' | 'PROP_LEAGUE' | 'SECOND_ROW' | 'LOOSE_FORWARD'
  | 'HALFBACK' | 'FIVE_EIGHTH' | 'WING_LEAGUE' | 'CENTRE_LEAGUE' | 'FULLBACK_LEAGUE'
  
  // American Football - Offense
  | 'QUARTERBACK' | 'RUNNING_BACK' | 'HALFBACK' | 'FULLBACK_AF'
  | 'WIDE_RECEIVER' | 'TIGHT_END' | 'LEFT_TACKLE' | 'LEFT_GUARD' 
  | 'CENTER_POSITION' | 'RIGHT_GUARD' | 'RIGHT_TACKLE'
  
  // American Football - Defense
  | 'LINEBACKER' | 'MIDDLE_LINEBACKER' | 'OUTSIDE_LINEBACKER'
  | 'DEFENSIVE_END' | 'DEFENSIVE_TACKLE' | 'NOSE_TACKLE'
  | 'SAFETY' | 'FREE_SAFETY' | 'STRONG_SAFETY' | 'CORNERBACK'
  
  // American Football - Special Teams
  | 'PUNTER' | 'KICKER' | 'LONG_SNAPPER' | 'KICK_RETURNER' | 'PUNT_RETURNER'
  
  // Basketball
  | 'POINT_GUARD' | 'SHOOTING_GUARD' | 'SMALL_FORWARD' 
  | 'POWER_FORWARD' | 'CENTER_BASKETBALL'
  
  // Cricket
  | 'BATSMAN' | 'OPENING_BATSMAN' | 'TOP_ORDER_BATSMAN' | 'MIDDLE_ORDER_BATSMAN'
  | 'LOWER_ORDER_BATSMAN' | 'BOWLER' | 'FAST_BOWLER' | 'MEDIUM_PACER' 
  | 'SPIN_BOWLER' | 'ALL_ROUNDER' | 'BATTING_ALL_ROUNDER' | 'BOWLING_ALL_ROUNDER'
  | 'FIELDER' | 'WICKET_KEEPER'
  
  // Hockey (Ice/Field)
  | 'GOALTENDER' | 'DEFENSEMAN' | 'LEFT_DEFENSEMAN' | 'RIGHT_DEFENSEMAN'
  | 'WINGER' | 'LEFT_WINGER_HOCKEY' | 'RIGHT_WINGER_HOCKEY' | 'CENTER_HOCKEY'
  
  // Lacrosse
  | 'ATTACK' | 'MIDFIELD' | 'DEFENSE_LAX' | 'GOALIE_LAX'
  | 'FACE_OFF_SPECIALIST' | 'LONG_STICK_MIDFIELD'
  
  // Australian Rules Football
  | 'FULL_FORWARD' | 'FULL_BACK' | 'CENTER_HALF_FORWARD' | 'CENTER_HALF_BACK'
  | 'HALF_FORWARD_FLANK' | 'HALF_BACK_FLANK' | 'FORWARD_POCKET' | 'BACK_POCKET'
  | 'WING_AFL' | 'CENTRE_AFL' | 'RUCK' | 'RUCK_ROVER' | 'ROVER'
  
  // Gaelic Football
  | 'GOALKEEPER_GAA' | 'CORNER_BACK' | 'FULL_BACK_GAA' | 'HALF_BACK_GAA'
  | 'MIDFIELD_GAA' | 'HALF_FORWARD_GAA' | 'CORNER_FORWARD' | 'FULL_FORWARD_GAA'
  
  // Futsal
  | 'GOLEIRO' | 'FIXO' | 'ALA' | 'PIVO'
  
  // Beach Football
  | 'GOALKEEPER_BEACH' | 'DEFENDER_BEACH' | 'WINGER_BEACH' | 'PIVOT_BEACH'
  
  // Generic
  | 'UTILITY' | 'SUBSTITUTE' | 'RESERVE';

// ============================================================================
// SPORT CONFIGURATION
// ============================================================================

export interface SportConfig {
  name: string;
  shortName: string;
  icon: string;
  emoji: string;
  
  // Stats
  primaryStat: string;
  secondaryStat: string;
  primaryStatKey: string;
  secondaryStatKey: string;
  
  // Positions & Formations
  positions: Position[];
  formations: string[];
  
  // Match Structure
  scoringUnits: string;
  matchDuration: number;        // in minutes
  periods: number;
  periodName: string;           // "Half", "Quarter", "Period", etc.
  playersOnField: number;
  substitutes: number;
  maxSubstitutions?: number;    // Rolling subs vs fixed
  
  // Scoring
  scoreBreakdown: ScoreBreakdownConfig[];
  
  // Events
  eventTypes: string[];
  
  // Styling
  color: string;
  gradientFrom: string;
  gradientTo: string;
  
  // Additional Config
  hasExtraTime?: boolean;
  hasPenaltyShootout?: boolean;
  hasOvertimeRules?: string;
  governingBody?: string;
}

export interface ScoreBreakdownConfig {
  key: string;
  label: string;
  points: number;
  icon?: string;
}

// ============================================================================
// SPORT CONFIGURATIONS - ALL 12 SPORTS
// ============================================================================

export const SPORT_CONFIGS: Record<Sport, SportConfig> = {
  FOOTBALL: {
    name: 'Football',
    shortName: 'Football',
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
      'STRIKER', 'CENTER_FORWARD', 'SECOND_STRIKER', 'UTILITY', 'SUBSTITUTE',
    ],
    formations: [
      '4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-2-3-1', '4-1-4-1',
      '3-4-3', '5-4-1', '4-5-1', '4-4-1-1', '4-3-2-1', '4-1-2-1-2',
      '3-4-1-2', '3-4-2-1', '4-2-2-2', '5-2-3',
    ],
    scoringUnits: 'goals',
    matchDuration: 90,
    periods: 2,
    periodName: 'Half',
    playersOnField: 11,
    substitutes: 7,
    maxSubstitutions: 5,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '⚽' },
    ],
    eventTypes: [
      'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW',
      'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'PENALTY_SCORED', 'PENALTY_MISSED',
      'OWN_GOAL', 'CORNER', 'FREE_KICK', 'OFFSIDE', 'SHOT', 'SHOT_ON_TARGET',
      'SAVE', 'FOUL', 'INJURY', 'VAR_REVIEW',
    ],
    color: '#22c55e',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600',
    hasExtraTime: true,
    hasPenaltyShootout: true,
    governingBody: 'FIFA/UEFA/FA',
  },

  NETBALL: {
    name: 'Netball',
    shortName: 'Netball',
    icon: '🏐',
    emoji: '🏐',
    primaryStat: 'Goals',
    secondaryStat: 'Interceptions',
    primaryStatKey: 'goals',
    secondaryStatKey: 'interceptions',
    positions: [
      'GOAL_KEEPER', 'GOAL_DEFENSE', 'WING_DEFENSE',
      'CENTER', 'WING_ATTACK', 'GOAL_ATTACK', 'GOAL_SHOOTER',
      'UTILITY', 'SUBSTITUTE',
    ],
    formations: ['Standard 7'],
    scoringUnits: 'goals',
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    playersOnField: 7,
    substitutes: 5,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '🎯' },
      { key: 'superShots', label: 'Super Shots', points: 2, icon: '⭐' },
    ],
    eventTypes: [
      'GOAL', 'SUPER_SHOT', 'INTERCEPTION', 'REBOUND', 'DEFLECTION',
      'CENTER_PASS', 'OBSTRUCTION', 'CONTACT', 'HELD_BALL',
      'STEPPING', 'OVER_THIRD', 'OFFSIDE_NETBALL', 'PENALTY_PASS',
    ],
    color: '#a855f7',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-violet-600',
    hasExtraTime: true,
    governingBody: 'INF/England Netball',
  },

  RUGBY: {
    name: 'Rugby Union',
    shortName: 'Rugby',
    icon: '🏉',
    emoji: '🏉',
    primaryStat: 'Tries',
    secondaryStat: 'Tackles',
    primaryStatKey: 'tries',
    secondaryStatKey: 'tackles',
    positions: [
      'LOOSEHEAD_PROP', 'HOOKER', 'TIGHTHEAD_PROP',
      'LOCK', 'BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER', 'NUMBER_8',
      'SCRUM_HALF', 'FLY_HALF', 'LEFT_WING', 'INSIDE_CENTER',
      'OUTSIDE_CENTER', 'RIGHT_WING', 'FULLBACK',
      'PROP', 'FLANKER', 'UTILITY', 'SUBSTITUTE',
    ],
    formations: ['Standard XV', 'Pods', 'Diamond', 'Flat Line'],
    scoringUnits: 'points',
    matchDuration: 80,
    periods: 2,
    periodName: 'Half',
    playersOnField: 15,
    substitutes: 8,
    scoreBreakdown: [
      { key: 'tries', label: 'Tries', points: 5, icon: '🏉' },
      { key: 'conversions', label: 'Conversions', points: 2, icon: '🥅' },
      { key: 'penaltyGoals', label: 'Penalty Goals', points: 3, icon: '🎯' },
      { key: 'dropGoals', label: 'Drop Goals', points: 3, icon: '🦶' },
    ],
    eventTypes: [
      'TRY', 'CONVERSION', 'PENALTY_GOAL', 'DROP_GOAL', 'PENALTY_TRY',
      'YELLOW_CARD_RUGBY', 'RED_CARD_RUGBY', 'SIN_BIN',
      'SCRUM', 'LINEOUT', 'KNOCK_ON', 'FORWARD_PASS', 'RUCK', 'MAUL',
      'TACKLE', 'TURNOVER', 'HIGH_TACKLE', 'DANGEROUS_PLAY',
    ],
    color: '#f97316',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-600',
    hasExtraTime: true,
    governingBody: 'World Rugby/RFU',
  },

  CRICKET: {
    name: 'Cricket',
    shortName: 'Cricket',
    icon: '🏏',
    emoji: '🏏',
    primaryStat: 'Runs',
    secondaryStat: 'Wickets',
    primaryStatKey: 'runs',
    secondaryStatKey: 'wickets',
    positions: [
      'OPENING_BATSMAN', 'TOP_ORDER_BATSMAN', 'MIDDLE_ORDER_BATSMAN',
      'LOWER_ORDER_BATSMAN', 'FAST_BOWLER', 'MEDIUM_PACER', 'SPIN_BOWLER',
      'BATTING_ALL_ROUNDER', 'BOWLING_ALL_ROUNDER', 'WICKET_KEEPER',
      'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'FIELDER', 'UTILITY', 'SUBSTITUTE',
    ],
    formations: ['Standard XI'],
    scoringUnits: 'runs',
    matchDuration: 480,
    periods: 2,
    periodName: 'Innings',
    playersOnField: 11,
    substitutes: 4,
    scoreBreakdown: [
      { key: 'runs', label: 'Runs', points: 1, icon: '🏃' },
      { key: 'boundaries', label: 'Fours', points: 4, icon: '4️⃣' },
      { key: 'sixes', label: 'Sixes', points: 6, icon: '6️⃣' },
    ],
    eventTypes: [
      'RUN', 'BOUNDARY', 'SIX', 'DOT_BALL', 'SINGLE', 'DOUBLE', 'TRIPLE',
      'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'WICKET', 'BOWLED', 'CAUGHT',
      'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'RETIRED_HURT',
      'MAIDEN_OVER', 'CENTURY', 'HALF_CENTURY', 'FIVE_WICKET_HAUL',
    ],
    color: '#eab308',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-amber-500',
    hasOvertimeRules: 'Super Over (T20/ODI)',
    governingBody: 'ICC/ECB',
  },

  AMERICAN_FOOTBALL: {
    name: 'American Football',
    shortName: 'Am. Football',
    icon: '🏈',
    emoji: '🏈',
    primaryStat: 'Touchdowns',
    secondaryStat: 'Yards',
    primaryStatKey: 'touchdowns',
    secondaryStatKey: 'totalYards',
    positions: [
      'QUARTERBACK', 'RUNNING_BACK', 'HALFBACK', 'FULLBACK_AF',
      'WIDE_RECEIVER', 'TIGHT_END', 'LEFT_TACKLE', 'LEFT_GUARD',
      'CENTER_POSITION', 'RIGHT_GUARD', 'RIGHT_TACKLE',
      'MIDDLE_LINEBACKER', 'OUTSIDE_LINEBACKER', 'LINEBACKER',
      'DEFENSIVE_END', 'DEFENSIVE_TACKLE', 'NOSE_TACKLE',
      'FREE_SAFETY', 'STRONG_SAFETY', 'SAFETY', 'CORNERBACK',
      'PUNTER', 'KICKER', 'LONG_SNAPPER', 'KICK_RETURNER', 'PUNT_RETURNER',
      'UTILITY', 'SUBSTITUTE',
    ],
    formations: [
      'I Formation', 'Shotgun', 'Pistol', 'Pro Set', 'Single Back',
      'Spread', 'Wildcat', '4-3 Defense', '3-4 Defense', 'Nickel', 'Dime',
    ],
    scoringUnits: 'points',
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    playersOnField: 11,
    substitutes: 46,
    scoreBreakdown: [
      { key: 'touchdowns', label: 'Touchdowns', points: 6, icon: '🏈' },
      { key: 'extraPoints', label: 'Extra Points', points: 1, icon: '✅' },
      { key: 'twoPointConversions', label: '2-Point Conv.', points: 2, icon: '2️⃣' },
      { key: 'fieldGoals', label: 'Field Goals', points: 3, icon: '🥅' },
      { key: 'safeties', label: 'Safeties', points: 2, icon: '🛡️' },
    ],
    eventTypes: [
      'TOUCHDOWN', 'EXTRA_POINT', 'TWO_POINT_CONVERSION', 'FIELD_GOAL', 'SAFETY',
      'RUSH', 'PASS_COMPLETE', 'PASS_INCOMPLETE', 'INTERCEPTION', 'FUMBLE',
      'SACK', 'TACKLE', 'TACKLE_FOR_LOSS', 'FIRST_DOWN', 'PUNT', 'KICKOFF',
      'PENALTY_FLAG', 'TIMEOUT', 'CHALLENGE',
    ],
    color: '#dc2626',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-red-800',
    hasExtraTime: true,
    hasOvertimeRules: 'Overtime Period',
    governingBody: 'NFL/NCAA',
  },

  BASKETBALL: {
    name: 'Basketball',
    shortName: 'Basketball',
    icon: '🏀',
    emoji: '🏀',
    primaryStat: 'Points',
    secondaryStat: 'Rebounds',
    primaryStatKey: 'points',
    secondaryStatKey: 'rebounds',
    positions: [
      'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD',
      'POWER_FORWARD', 'CENTER_BASKETBALL', 'UTILITY', 'SUBSTITUTE',
    ],
    formations: [
      '1-3-1', '2-3 Zone', '3-2 Zone', 'Man-to-Man',
      '1-2-2', 'Box-and-One', 'Triangle',
    ],
    scoringUnits: 'points',
    matchDuration: 48,
    periods: 4,
    periodName: 'Quarter',
    playersOnField: 5,
    substitutes: 7,
    scoreBreakdown: [
      { key: 'fieldGoals', label: '2-Pointers', points: 2, icon: '🏀' },
      { key: 'threePointers', label: '3-Pointers', points: 3, icon: '3️⃣' },
      { key: 'freeThrows', label: 'Free Throws', points: 1, icon: '🎯' },
    ],
    eventTypes: [
      'FIELD_GOAL', 'THREE_POINTER', 'FREE_THROW', 'DUNK', 'LAYUP',
      'REBOUND', 'OFFENSIVE_REBOUND', 'DEFENSIVE_REBOUND',
      'ASSIST', 'STEAL', 'BLOCK', 'TURNOVER', 'FOUL', 'TECHNICAL_FOUL',
      'FLAGRANT_FOUL', 'SHOT_CLOCK_VIOLATION', 'TIMEOUT',
    ],
    color: '#ef4444',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-500',
    hasExtraTime: true,
    hasOvertimeRules: '5-minute Overtime Periods',
    governingBody: 'FIBA/NBA',
  },

  HOCKEY: {
    name: 'Ice Hockey',
    shortName: 'Hockey',
    icon: '🏒',
    emoji: '🏒',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    primaryStatKey: 'goals',
    secondaryStatKey: 'assists',
    positions: [
      'GOALTENDER', 'LEFT_DEFENSEMAN', 'RIGHT_DEFENSEMAN', 'DEFENSEMAN',
      'LEFT_WINGER_HOCKEY', 'RIGHT_WINGER_HOCKEY', 'WINGER', 'CENTER_HOCKEY',
      'UTILITY', 'SUBSTITUTE',
    ],
    formations: [
      '1-2-2', '2-1-2', '1-3-1', '1-4', 'Trap',
      'Power Play Diamond', 'Penalty Kill Box',
    ],
    scoringUnits: 'goals',
    matchDuration: 60,
    periods: 3,
    periodName: 'Period',
    playersOnField: 6,
    substitutes: 17,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '🏒' },
      { key: 'powerPlayGoals', label: 'PP Goals', points: 1, icon: '⚡' },
      { key: 'shorthandedGoals', label: 'SH Goals', points: 1, icon: '🛡️' },
    ],
    eventTypes: [
      'GOAL', 'ASSIST', 'POWER_PLAY_GOAL', 'SHORTHANDED_GOAL', 'EMPTY_NET_GOAL',
      'SAVE', 'SHOT_ON_GOAL', 'BLOCKED_SHOT', 'MISSED_SHOT',
      'HIT', 'PENALTY', 'MINOR_PENALTY', 'MAJOR_PENALTY', 'MISCONDUCT',
      'FACEOFF_WIN', 'FACEOFF_LOSS', 'ICING', 'OFFSIDE',
    ],
    color: '#3b82f6',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
    hasExtraTime: true,
    hasOvertimeRules: 'Overtime + Shootout',
    governingBody: 'IIHF/NHL',
  },

  LACROSSE: {
    name: 'Lacrosse',
    shortName: 'Lacrosse',
    icon: '🥍',
    emoji: '🥍',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    primaryStatKey: 'goals',
    secondaryStatKey: 'assists',
    positions: [
      'ATTACK', 'MIDFIELD', 'DEFENSE_LAX', 'GOALIE_LAX',
      'FACE_OFF_SPECIALIST', 'LONG_STICK_MIDFIELD', 'UTILITY', 'SUBSTITUTE',
    ],
    formations: ['1-4-4-1', '2-3-1', '1-3-3-3', '2-2-2'],
    scoringUnits: 'goals',
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    playersOnField: 10,
    substitutes: 13,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '🥍' },
      { key: 'twoPointGoals', label: '2-Point Goals', points: 2, icon: '2️⃣' },
    ],
    eventTypes: [
      'GOAL', 'TWO_POINT_GOAL', 'ASSIST', 'SHOT', 'SHOT_ON_GOAL',
      'SAVE', 'GROUND_BALL', 'FACEOFF_WIN', 'CAUSED_TURNOVER',
      'CLEAR', 'MAN_UP_GOAL', 'MAN_DOWN_GOAL', 'PENALTY',
    ],
    color: '#8b5cf6',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    hasExtraTime: true,
    governingBody: 'World Lacrosse/PLL/NLL',
  },

  AUSTRALIAN_RULES: {
    name: 'Australian Rules Football',
    shortName: 'AFL',
    icon: '🏉',
    emoji: '🇦🇺',
    primaryStat: 'Goals',
    secondaryStat: 'Disposals',
    primaryStatKey: 'goals',
    secondaryStatKey: 'disposals',
    positions: [
      'FULL_FORWARD', 'CENTER_HALF_FORWARD', 'HALF_FORWARD_FLANK', 'FORWARD_POCKET',
      'CENTRE_AFL', 'WING_AFL', 'RUCK', 'RUCK_ROVER', 'ROVER',
      'CENTER_HALF_BACK', 'HALF_BACK_FLANK', 'BACK_POCKET', 'FULL_BACK',
      'UTILITY', 'SUBSTITUTE',
    ],
    formations: ['Standard XVIII', 'Flooding', 'Press'],
    scoringUnits: 'points',
    matchDuration: 80,
    periods: 4,
    periodName: 'Quarter',
    playersOnField: 18,
    substitutes: 4,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 6, icon: '🥅' },
      { key: 'behinds', label: 'Behinds', points: 1, icon: '|' },
    ],
    eventTypes: [
      'GOAL', 'BEHIND', 'RUSHED_BEHIND', 'MARK', 'HANDBALL', 'KICK',
      'TACKLE', 'CLEARANCE', 'INSIDE_50', 'REBOUND_50',
      'FREE_KICK_FOR', 'FREE_KICK_AGAINST', 'HIT_OUT',
    ],
    color: '#059669',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
    hasExtraTime: true,
    governingBody: 'AFL',
  },

  GAELIC_FOOTBALL: {
    name: 'Gaelic Football',
    shortName: 'GAA Football',
    icon: '🏐',
    emoji: '☘️',
    primaryStat: 'Goals',
    secondaryStat: 'Points',
    primaryStatKey: 'goals',
    secondaryStatKey: 'points',
    positions: [
      'GOALKEEPER_GAA', 'CORNER_BACK', 'FULL_BACK_GAA', 'HALF_BACK_GAA',
      'MIDFIELD_GAA', 'HALF_FORWARD_GAA', 'CORNER_FORWARD', 'FULL_FORWARD_GAA',
      'UTILITY', 'SUBSTITUTE',
    ],
    formations: ['Standard XV', 'Blanket Defense', 'Counter Attack'],
    scoringUnits: 'points',
    matchDuration: 70,
    periods: 2,
    periodName: 'Half',
    playersOnField: 15,
    substitutes: 6,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 3, icon: '🥅' },
      { key: 'points', label: 'Points', points: 1, icon: '🎯' },
    ],
    eventTypes: [
      'GOAL', 'POINT', 'WIDE', 'SHORT', 'MARK', 'FREE_KICK_GAA',
      'SIDELINE_KICK', '45_METER_KICK', 'PENALTY_GAA',
      'BLACK_CARD', 'YELLOW_CARD_GAA', 'RED_CARD_GAA',
    ],
    color: '#16a34a',
    gradientFrom: 'from-green-600',
    gradientTo: 'to-emerald-700',
    hasExtraTime: true,
    governingBody: 'GAA',
  },

  FUTSAL: {
    name: 'Futsal',
    shortName: 'Futsal',
    icon: '⚽',
    emoji: '🏟️',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    primaryStatKey: 'goals',
    secondaryStatKey: 'assists',
    positions: [
      'GOLEIRO', 'FIXO', 'ALA', 'PIVO', 'UTILITY', 'SUBSTITUTE',
    ],
    formations: ['1-2-1', '2-2', '3-1', '4-0 Rotation'],
    scoringUnits: 'goals',
    matchDuration: 40,
    periods: 2,
    periodName: 'Half',
    playersOnField: 5,
    substitutes: 7,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '⚽' },
    ],
    eventTypes: [
      'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW',
      'ACCUMULATED_FOUL', 'PENALTY_FUTSAL', 'DOUBLE_PENALTY',
      'CORNER', 'KICK_IN', 'TIMEOUT', 'POWER_PLAY',
    ],
    color: '#3b82f6',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-600',
    hasExtraTime: true,
    hasPenaltyShootout: true,
    governingBody: 'FIFA/AMF',
  },

  BEACH_FOOTBALL: {
    name: 'Beach Soccer',
    shortName: 'Beach',
    icon: '🏖️',
    emoji: '🏖️',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    primaryStatKey: 'goals',
    secondaryStatKey: 'assists',
    positions: [
      'GOALKEEPER_BEACH', 'DEFENDER_BEACH', 'WINGER_BEACH', 'PIVOT_BEACH',
      'UTILITY', 'SUBSTITUTE',
    ],
    formations: ['1-2-1', '2-2', '3-0'],
    scoringUnits: 'goals',
    matchDuration: 36,
    periods: 3,
    periodName: 'Period',
    playersOnField: 5,
    substitutes: 7,
    scoreBreakdown: [
      { key: 'goals', label: 'Goals', points: 1, icon: '⚽' },
    ],
    eventTypes: [
      'GOAL', 'ASSIST', 'BICYCLE_KICK', 'SCISSOR_KICK', 'HEADER',
      'YELLOW_CARD', 'RED_CARD', 'BLUE_CARD',
      'PENALTY_BEACH', 'FREE_KICK_BEACH', 'CORNER_BEACH',
    ],
    color: '#eab308',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-orange-500',
    hasExtraTime: true,
    hasPenaltyShootout: true,
    governingBody: 'FIFA/Beach Soccer Worldwide',
  },
};

// ============================================================================
// FITNESS STATUS TYPES
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

export const FITNESS_STATUS_CONFIG: Record<FitnessStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: string;
  description: string;
}> = {
  FIT: { 
    label: 'Fit', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    icon: '✅',
    description: 'Fully fit to train and play',
  },
  FIT_WITH_CAUTION: { 
    label: 'Fit (Caution)', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-100',
    icon: '⚠️',
    description: 'Can participate with monitoring',
  },
  LIMITED: { 
    label: 'Limited', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-100',
    icon: '🔶',
    description: 'Restricted to certain activities',
  },
  NOT_FIT: { 
    label: 'Not Fit', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    icon: '❌',
    description: 'Cannot participate in training or matches',
  },
  PENDING_REVIEW: { 
    label: 'Pending Review', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    icon: '🔄',
    description: 'Awaiting medical assessment',
  },
  CLEARED: { 
    label: 'Cleared', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    icon: '✅',
    description: 'Medically cleared to return',
  },
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

export const INJURY_SEVERITY_CONFIG: Record<InjurySeverity, { 
  label: string; 
  color: string; 
  bgColor: string;
  days: string;
  icon: string;
}> = {
  MINOR: { 
    label: 'Minor', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-100',
    days: '1-7 days',
    icon: '🟡',
  },
  MODERATE: { 
    label: 'Moderate', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-100',
    days: '1-4 weeks',
    icon: '🟠',
  },
  SEVERE: { 
    label: 'Severe', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    days: '1-3 months',
    icon: '🔴',
  },
  CRITICAL: { 
    label: 'Critical', 
    color: 'text-red-800', 
    bgColor: 'bg-red-200',
    days: '3-6 months',
    icon: '⛔',
  },
  CAREER_THREATENING: { 
    label: 'Career Threatening', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100',
    days: '6+ months',
    icon: '💔',
  },
};

export const INJURY_STATUS_CONFIG: Record<InjuryStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: string;
}> = {
  ACTIVE: { 
    label: 'Active Injury', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    icon: '🏥',
  },
  RECOVERING: { 
    label: 'Recovering', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-100',
    icon: '🔄',
  },
  REHABILITATION: { 
    label: 'Rehabilitation', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    icon: '💪',
  },
  CLEARED: { 
    label: 'Cleared', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    icon: '✅',
  },
  CHRONIC: { 
    label: 'Chronic', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100',
    icon: '⚕️',
  },
};

// ============================================================================
// COMMON INJURIES BY SPORT
// ============================================================================

export const COMMON_INJURIES: Record<Sport, string[]> = {
  FOOTBALL: [
    'Hamstring Strain', 'ACL Tear', 'MCL Sprain', 'Ankle Sprain',
    'Groin Strain', 'Calf Strain', 'Knee Ligament', 'Metatarsal Fracture',
    'Concussion', 'Achilles Tendinitis', 'Hip Flexor Strain',
  ],
  NETBALL: [
    'ACL Tear', 'Ankle Sprain', 'Knee Injury', 'Finger Dislocation',
    'Achilles Tendinitis', 'Patellar Tendinitis', 'Calf Strain',
  ],
  RUGBY: [
    'Concussion', 'Shoulder Dislocation', 'AC Joint Injury', 'Hamstring Strain',
    'ACL Tear', 'Neck Injury', 'Broken Collarbone', 'Rib Fracture',
    'Ankle Sprain', 'MCL Sprain',
  ],
  CRICKET: [
    'Shoulder Injury', 'Rotator Cuff', 'Back Strain', 'Hamstring Strain',
    'Side Strain', 'Finger Fracture', 'Knee Injury', 'Stress Fracture',
    'Groin Strain', 'Ankle Sprain',
  ],
  AMERICAN_FOOTBALL: [
    'Concussion', 'ACL Tear', 'MCL Sprain', 'Shoulder Injury',
    'Ankle Sprain', 'Hamstring Strain', 'Neck Injury', 'Turf Toe',
    'Hip Flexor', 'Meniscus Tear',
  ],
  BASKETBALL: [
    'Ankle Sprain', 'ACL Tear', 'Knee Injury', 'Finger Jam',
    'Achilles Injury', 'Back Strain', 'Hamstring Strain',
    'Patellar Tendinitis', 'Shin Splints',
  ],
  HOCKEY: [
    'Concussion', 'Shoulder Injury', 'Groin Strain', 'MCL Sprain',
    'Hip Flexor', 'Wrist Injury', 'High Ankle Sprain', 'Broken Collarbone',
  ],
  LACROSSE: [
    'Shoulder Injury', 'ACL Tear', 'Ankle Sprain', 'Concussion',
    'Wrist Fracture', 'Hip Flexor', 'Hamstring Strain',
  ],
  AUSTRALIAN_RULES: [
    'Hamstring Strain', 'ACL Tear', 'Concussion', 'Shoulder Injury',
    'Ankle Sprain', 'Groin Strain', 'Calf Strain', 'Broken Collarbone',
  ],
  GAELIC_FOOTBALL: [
    'Hamstring Strain', 'ACL Tear', 'Shoulder Injury', 'Ankle Sprain',
    'Concussion', 'Groin Strain', 'Knee Injury',
  ],
  FUTSAL: [
    'Ankle Sprain', 'Knee Injury', 'Groin Strain', 'Hamstring Strain',
    'Metatarsal Injury', 'Achilles Tendinitis',
  ],
  BEACH_FOOTBALL: [
    'Ankle Sprain', 'Knee Injury', 'Shoulder Injury', 'Foot Injury',
    'Back Strain', 'Hamstring Strain',
  ],
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
  | 'PERSONAL'
  | 'TRAINING_ONLY'
  | 'MATCH_FIT';

export const AVAILABILITY_STATUS_CONFIG: Record<AvailabilityStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: string;
  canTrain: boolean;
  canPlay: boolean;
}> = {
  AVAILABLE: { 
    label: 'Available', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    icon: '✅',
    canTrain: true,
    canPlay: true,
  },
  MATCH_FIT: { 
    label: 'Match Fit', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    icon: '⚡',
    canTrain: true,
    canPlay: true,
  },
  TRAINING_ONLY: { 
    label: 'Training Only', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    icon: '🏃',
    canTrain: true,
    canPlay: false,
  },
  UNAVAILABLE: { 
    label: 'Unavailable', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100',
    icon: '⛔',
    canTrain: false,
    canPlay: false,
  },
  INJURED: { 
    label: 'Injured', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    icon: '🏥',
    canTrain: false,
    canPlay: false,
  },
  ILL: { 
    label: 'Ill', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-100',
    icon: '🤒',
    canTrain: false,
    canPlay: false,
  },
  SUSPENDED: { 
    label: 'Suspended', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    icon: '🚫',
    canTrain: true,
    canPlay: false,
  },
  INTERNATIONAL_DUTY: { 
    label: 'International Duty', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    icon: '🌍',
    canTrain: false,
    canPlay: false,
  },
  LOAN: { 
    label: 'On Loan', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100',
    icon: '↔️',
    canTrain: false,
    canPlay: false,
  },
  PERSONAL: { 
    label: 'Personal', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100',
    icon: '👤',
    canTrain: false,
    canPlay: false,
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
    .replace(/NETBALL|LEAGUE|BASKETBALL|HOCKEY|POSITION|GAA|AFL|LAX|AF|BEACH/g, '')
    .trim()
    .split(' ')
    .filter(Boolean)
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
  const normalized = name.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
  
  // Direct match
  if (normalized in SPORT_CONFIGS) {
    return normalized as Sport;
  }
  
  // Search by display name
  for (const [key, config] of Object.entries(SPORT_CONFIGS)) {
    if (
      config.name.toUpperCase() === name.toUpperCase() ||
      config.shortName.toUpperCase() === name.toUpperCase()
    ) {
      return key as Sport;
    }
  }
  
  return null;
}

/**
 * Get all sports as array
 */
export function getAllSports(): Sport[] {
  return ALL_SPORTS;
}

/**
 * Get sport configuration
 */
export function getSportConfig(sport: Sport): SportConfig {
  return SPORT_CONFIGS[sport];
}

/**
 * Check if position is valid for sport
 */
export function isValidPositionForSport(position: Position, sport: Sport): boolean {
  return SPORT_CONFIGS[sport].positions.includes(position);
}

/**
 * Get sport color scheme
 */
export function getSportColors(sport: Sport): {
  primary: string;
  gradientFrom: string;
  gradientTo: string;
} {
  const config = SPORT_CONFIGS[sport];
  return {
    primary: config.color,
    gradientFrom: config.gradientFrom,
    gradientTo: config.gradientTo,
  };
}

/**
 * Format score for display based on sport
 */
export function formatScore(sport: Sport, breakdown: Record<string, number>): string {
  const config = SPORT_CONFIGS[sport];
  
  // For sports with simple scoring
  if (config.scoreBreakdown.length === 1) {
    const key = config.scoreBreakdown[0].key;
    return String(breakdown[key] || 0);
  }
  
  // For Gaelic Football / Australian Rules: "2-5" format
  if (sport === 'GAELIC_FOOTBALL') {
    return `${breakdown.goals || 0}-${breakdown.points || 0}`;
  }
  
  if (sport === 'AUSTRALIAN_RULES') {
    return `${breakdown.goals || 0}.${breakdown.behinds || 0}`;
  }
  
  // Default: calculate total
  return String(calculateTotalScore(sport, breakdown));
}

/**
 * Get match duration info
 */
export function getMatchDurationInfo(sport: Sport): {
  totalMinutes: number;
  periods: number;
  periodName: string;
  periodLength: number;
} {
  const config = SPORT_CONFIGS[sport];
  return {
    totalMinutes: config.matchDuration,
    periods: config.periods,
    periodName: config.periodName,
    periodLength: Math.round(config.matchDuration / config.periods),
  };
}