// ============================================================================
// 🏆 PITCHCONNECT - SPORT CONFIGURATION UTILITY
// ============================================================================
// Multi-sport configuration for positions, formations, events, metrics, and rules
// Schema v7.2.0 aligned
// ============================================================================

import { Sport, Position, MatchEventType, InjurySeverity } from '@prisma/client';

// ============================================================================
// SPORT METADATA
// ============================================================================

export interface SportConfig {
  name: string;
  icon: string;
  squadSize: number;
  maxSubstitutes: number;
  positions: Position[];
  formations: FormationConfig[];
  eventTypes: MatchEventType[];
  scoringEvents: MatchEventType[];
  disciplinaryEvents: MatchEventType[];
  metrics: MetricConfig[];
  injuryPatterns: string[];
  periodCount: number;
  periodDuration: number; // minutes
  hasExtraTime: boolean;
  hasPenalties: boolean;
}

export interface FormationConfig {
  id: string;
  name: string;
  positions: { position: Position; x: number; y: number }[];
}

export interface MetricConfig {
  key: string;
  label: string;
  icon?: string;
  category: 'scoring' | 'assists' | 'defensive' | 'disciplinary' | 'other';
}

// ============================================================================
// POSITION MAPPINGS BY SPORT
// ============================================================================

export const SPORT_POSITIONS: Record<Sport, Position[]> = {
  FOOTBALL: [
    'GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'RIGHT_BACK',
    'LEFT_WING_BACK', 'RIGHT_WING_BACK', 'DEFENSIVE_MIDFIELDER',
    'CENTRAL_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER',
    'ATTACKING_MIDFIELDER', 'LEFT_WINGER', 'RIGHT_WINGER',
    'STRIKER', 'CENTER_FORWARD', 'SECOND_STRIKER'
  ] as Position[],

  NETBALL: [
    'GOAL_SHOOTER', 'GOAL_ATTACK', 'WING_ATTACK', 'CENTER',
    'WING_DEFENSE', 'GOAL_DEFENSE', 'GOALKEEPER_NETBALL'
  ] as Position[],

  RUGBY: [
    'PROP', 'HOOKER', 'LOCK', 'FLANKER', 'NUMBER_8',
    'SCRUM_HALF', 'FLY_HALF', 'INSIDE_CENTER', 'OUTSIDE_CENTER',
    'LEFT_WINGER', 'RIGHT_WINGER', 'FULLBACK'
  ] as Position[],

  CRICKET: [
    'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER', 'FIELDER'
  ] as Position[],

  AMERICAN_FOOTBALL: [
    'QUARTERBACK', 'RUNNING_BACK', 'WIDE_RECEIVER', 'TIGHT_END',
    'LEFT_TACKLE', 'LEFT_GUARD', 'CENTER_POSITION', 'RIGHT_GUARD',
    'RIGHT_TACKLE', 'LINEBACKER', 'DEFENSIVE_END', 'DEFENSIVE_TACKLE',
    'SAFETY', 'CORNERBACK', 'PUNTER', 'KICKER'
  ] as Position[],

  BASKETBALL: [
    'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD',
    'POWER_FORWARD', 'CENTER_BASKETBALL'
  ] as Position[],

  HOCKEY: [
    'GOALTENDER', 'DEFENSEMAN', 'CENTER_HOCKEY', 'WINGER'
  ] as Position[],

  LACROSSE: [
    'GOALKEEPER', 'DEFENSEMAN', 'CENTRAL_MIDFIELDER', 'ATTACKING_MIDFIELDER'
  ] as Position[],

  AUSTRALIAN_RULES: [
    'FULLBACK', 'CENTER_BACK', 'CENTER_FORWARD', 'WINGER', 'UTILITY'
  ] as Position[],

  GAELIC_FOOTBALL: [
    'GOALKEEPER', 'FULLBACK', 'CENTER_BACK', 'CENTER_FORWARD', 'UTILITY'
  ] as Position[],

  FUTSAL: [
    'GOALKEEPER', 'DEFENDER', 'WINGER', 'STRIKER'
  ] as Position[],

  BEACH_FOOTBALL: [
    'GOALKEEPER', 'DEFENDER', 'STRIKER'
  ] as Position[],
};

// ============================================================================
// SQUAD SIZE CONFIGURATION
// ============================================================================

export const SPORT_SQUAD_CONFIG: Record<Sport, { starting: number; maxSubs: number; totalSquad: number }> = {
  FOOTBALL: { starting: 11, maxSubs: 7, totalSquad: 18 },
  NETBALL: { starting: 7, maxSubs: 5, totalSquad: 12 },
  RUGBY: { starting: 15, maxSubs: 8, totalSquad: 23 },
  CRICKET: { starting: 11, maxSubs: 4, totalSquad: 15 },
  AMERICAN_FOOTBALL: { starting: 11, maxSubs: 42, totalSquad: 53 },
  BASKETBALL: { starting: 5, maxSubs: 7, totalSquad: 12 },
  HOCKEY: { starting: 6, maxSubs: 14, totalSquad: 20 },
  LACROSSE: { starting: 10, maxSubs: 13, totalSquad: 23 },
  AUSTRALIAN_RULES: { starting: 18, maxSubs: 4, totalSquad: 22 },
  GAELIC_FOOTBALL: { starting: 15, maxSubs: 6, totalSquad: 21 },
  FUTSAL: { starting: 5, maxSubs: 9, totalSquad: 14 },
  BEACH_FOOTBALL: { starting: 5, maxSubs: 5, totalSquad: 10 },
};

// ============================================================================
// EVENT TYPES BY SPORT
// ============================================================================

export const SPORT_EVENT_TYPES: Record<Sport, MatchEventType[]> = {
  FOOTBALL: [
    'GOAL', 'ASSIST', 'OWN_GOAL', 'PENALTY_SCORED', 'PENALTY_MISSED', 'PENALTY_SAVED',
    'YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    'INJURY', 'VAR_REVIEW', 'VAR_DECISION',
    'KICKOFF', 'HALFTIME', 'FULLTIME', 'INJURY_TIME'
  ] as MatchEventType[],

  RUGBY: [
    'TRY', 'CONVERSION', 'PENALTY_GOAL', 'DROP_GOAL',
    'YELLOW_CARD', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    'SCRUM', 'LINEOUT', 'MAUL', 'RUCK', 'KNOCK_ON', 'HIGH_TACKLE', 'OFFSIDE',
    'INJURY'
  ] as MatchEventType[],

  CRICKET: [
    'WICKET', 'BOUNDARY', 'MAIDEN_OVER', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'OVERTHROW'
  ] as MatchEventType[],

  BASKETBALL: [
    'GOAL', 'THREE_POINTER', 'ASSIST', 'REBOUND', 'INTERCEPT',
    'FAST_BREAK', 'TURNOVER', 'OFFENSIVE_FOUL', 'TRAVEL', 'DOUBLE_DRIBBLE',
    'TIMEOUT', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF'
  ] as MatchEventType[],

  AMERICAN_FOOTBALL: [
    'TOUCHDOWN', 'FIELD_GOAL', 'SAFETY_SCORE',
    'INTERCEPTION', 'FUMBLE', 'SACK',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT', 'CHALLENGE_REVIEW'
  ] as MatchEventType[],

  HOCKEY: [
    'GOAL', 'ASSIST', 'MAJOR_PENALTY', 'MINOR_PENALTY', 'FIGHT',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF'
  ] as MatchEventType[],

  NETBALL: [
    'GOAL', 'ASSIST', 'INTERCEPT', 'REBOUND', 'CENTER_PASS', 'OBSTRUCTION',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT'
  ] as MatchEventType[],

  LACROSSE: [
    'GOAL', 'ASSIST', 'MAJOR_PENALTY', 'MINOR_PENALTY',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF'
  ] as MatchEventType[],

  AUSTRALIAN_RULES: [
    'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF'
  ] as MatchEventType[],

  GAELIC_FOOTBALL: [
    'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF'
  ] as MatchEventType[],

  FUTSAL: [
    'GOAL', 'ASSIST', 'OWN_GOAL', 'PENALTY_SCORED', 'PENALTY_MISSED',
    'YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT'
  ] as MatchEventType[],

  BEACH_FOOTBALL: [
    'GOAL', 'ASSIST', 'OWN_GOAL', 'PENALTY_SCORED', 'PENALTY_MISSED',
    'YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF'
  ] as MatchEventType[],
};

// ============================================================================
// SCORING EVENTS (for calculating match scores)
// ============================================================================

export const SPORT_SCORING_EVENTS: Record<Sport, { event: MatchEventType; points: number }[]> = {
  FOOTBALL: [
    { event: 'GOAL', points: 1 },
    { event: 'OWN_GOAL', points: 1 },
    { event: 'PENALTY_SCORED', points: 1 },
  ],
  RUGBY: [
    { event: 'TRY', points: 5 },
    { event: 'CONVERSION', points: 2 },
    { event: 'PENALTY_GOAL', points: 3 },
    { event: 'DROP_GOAL', points: 3 },
  ],
  CRICKET: [
    { event: 'BOUNDARY', points: 4 },
  ],
  BASKETBALL: [
    { event: 'GOAL', points: 2 },
    { event: 'THREE_POINTER', points: 3 },
  ],
  AMERICAN_FOOTBALL: [
    { event: 'TOUCHDOWN', points: 6 },
    { event: 'FIELD_GOAL', points: 3 },
    { event: 'SAFETY_SCORE', points: 2 },
  ],
  HOCKEY: [
    { event: 'GOAL', points: 1 },
  ],
  NETBALL: [
    { event: 'GOAL', points: 1 },
  ],
  LACROSSE: [
    { event: 'GOAL', points: 1 },
  ],
  AUSTRALIAN_RULES: [
    { event: 'GOAL', points: 6 },
  ],
  GAELIC_FOOTBALL: [
    { event: 'GOAL', points: 3 },
  ],
  FUTSAL: [
    { event: 'GOAL', points: 1 },
    { event: 'OWN_GOAL', points: 1 },
    { event: 'PENALTY_SCORED', points: 1 },
  ],
  BEACH_FOOTBALL: [
    { event: 'GOAL', points: 1 },
    { event: 'OWN_GOAL', points: 1 },
    { event: 'PENALTY_SCORED', points: 1 },
  ],
};

// ============================================================================
// RANKING METRICS BY SPORT
// ============================================================================

export const SPORT_RANKING_METRICS: Record<Sport, MetricConfig[]> = {
  FOOTBALL: [
    { key: 'goals', label: 'Goals', category: 'scoring', icon: '⚽' },
    { key: 'assists', label: 'Assists', category: 'assists', icon: '🅰️' },
    { key: 'cleanSheets', label: 'Clean Sheets', category: 'defensive', icon: '🧤' },
    { key: 'yellowCards', label: 'Yellow Cards', category: 'disciplinary', icon: '🟨' },
    { key: 'redCards', label: 'Red Cards', category: 'disciplinary', icon: '🟥' },
  ],
  RUGBY: [
    { key: 'tries', label: 'Tries', category: 'scoring', icon: '🏉' },
    { key: 'conversions', label: 'Conversions', category: 'scoring', icon: '🎯' },
    { key: 'tackles', label: 'Tackles', category: 'defensive', icon: '💪' },
    { key: 'lineBreaks', label: 'Line Breaks', category: 'other', icon: '💨' },
    { key: 'yellowCards', label: 'Sin Bins', category: 'disciplinary', icon: '🟨' },
  ],
  BASKETBALL: [
    { key: 'points', label: 'Points', category: 'scoring', icon: '🏀' },
    { key: 'rebounds', label: 'Rebounds', category: 'defensive', icon: '📊' },
    { key: 'assists', label: 'Assists', category: 'assists', icon: '🅰️' },
    { key: 'steals', label: 'Steals', category: 'defensive', icon: '🔥' },
    { key: 'blocks', label: 'Blocks', category: 'defensive', icon: '🚫' },
  ],
  CRICKET: [
    { key: 'runs', label: 'Runs', category: 'scoring', icon: '🏏' },
    { key: 'wickets', label: 'Wickets', category: 'other', icon: '🎳' },
    { key: 'catches', label: 'Catches', category: 'defensive', icon: '🧤' },
    { key: 'stumpings', label: 'Stumpings', category: 'defensive', icon: '⚡' },
  ],
  NETBALL: [
    { key: 'goals', label: 'Goals', category: 'scoring', icon: '🥅' },
    { key: 'intercepts', label: 'Intercepts', category: 'defensive', icon: '🔥' },
    { key: 'rebounds', label: 'Rebounds', category: 'defensive', icon: '📊' },
    { key: 'deflections', label: 'Deflections', category: 'defensive', icon: '✋' },
  ],
  AMERICAN_FOOTBALL: [
    { key: 'touchdowns', label: 'Touchdowns', category: 'scoring', icon: '🏈' },
    { key: 'passingYards', label: 'Passing Yards', category: 'other', icon: '📏' },
    { key: 'rushingYards', label: 'Rushing Yards', category: 'other', icon: '🏃' },
    { key: 'sacks', label: 'Sacks', category: 'defensive', icon: '💥' },
    { key: 'interceptions', label: 'Interceptions', category: 'defensive', icon: '🔄' },
  ],
  HOCKEY: [
    { key: 'goals', label: 'Goals', category: 'scoring', icon: '🏒' },
    { key: 'assists', label: 'Assists', category: 'assists', icon: '🅰️' },
    { key: 'saves', label: 'Saves', category: 'defensive', icon: '🧤' },
    { key: 'penaltyMinutes', label: 'Penalty Minutes', category: 'disciplinary', icon: '⏱️' },
  ],
  LACROSSE: [
    { key: 'goals', label: 'Goals', category: 'scoring', icon: '🥍' },
    { key: 'assists', label: 'Assists', category: 'assists', icon: '🅰️' },
    { key: 'groundBalls', label: 'Ground Balls', category: 'other', icon: '⚽' },
  ],
  AUSTRALIAN_RULES: [
    { key: 'goals', label: 'Goals', category: 'scoring', icon: '🏉' },
    { key: 'behinds', label: 'Behinds', category: 'scoring', icon: '📊' },
    { key: 'disposals', label: 'Disposals', category: 'other', icon: '🎯' },
    { key: 'marks', label: 'Marks', category: 'other', icon: '✋' },
  ],
  GAELIC_FOOTBALL: [
    { key: 'goals', label: 'Goals', category: 'scoring', icon: '⚽' },
    { key: 'points', label: 'Points', category: 'scoring', icon: '📊' },
  ],
  FUTSAL: [
    { key: 'goals', label: 'Goals', category: 'scoring', icon: '⚽' },
    { key: 'assists', label: 'Assists', category: 'assists', icon: '🅰️' },
    { key: 'yellowCards', label: 'Yellow Cards', category: 'disciplinary', icon: '🟨' },
    { key: 'redCards', label: 'Red Cards', category: 'disciplinary', icon: '🟥' },
  ],
  BEACH_FOOTBALL: [
    { key: 'goals', label: 'Goals', category: 'scoring', icon: '⚽' },
    { key: 'assists', label: 'Assists', category: 'assists', icon: '🅰️' },
    { key: 'yellowCards', label: 'Yellow Cards', category: 'disciplinary', icon: '🟨' },
    { key: 'redCards', label: 'Red Cards', category: 'disciplinary', icon: '🟥' },
  ],
};

// ============================================================================
// FORMATIONS BY SPORT
// ============================================================================

export const SPORT_FORMATIONS: Record<Sport, { id: string; name: string; display: string }[]> = {
  FOOTBALL: [
    { id: 'FOUR_FOUR_TWO', name: '4-4-2', display: '4-4-2' },
    { id: 'FOUR_THREE_THREE', name: '4-3-3', display: '4-3-3' },
    { id: 'THREE_FIVE_TWO', name: '3-5-2', display: '3-5-2' },
    { id: 'FIVE_THREE_TWO', name: '5-3-2', display: '5-3-2' },
    { id: 'FOUR_TWO_THREE_ONE', name: '4-2-3-1', display: '4-2-3-1' },
    { id: 'THREE_FOUR_THREE', name: '3-4-3', display: '3-4-3' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  RUGBY: [
    { id: 'STANDARD_15', name: 'Standard XV', display: '8-7 (Standard)' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  BASKETBALL: [
    { id: 'STANDARD_5', name: 'Standard Five', display: '1-2-2' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  NETBALL: [
    { id: 'STANDARD_7', name: 'Standard Seven', display: '3-1-3' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  CRICKET: [
    { id: 'STANDARD_11', name: 'Standard XI', display: 'Standard' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  AMERICAN_FOOTBALL: [
    { id: 'OFFENSE', name: 'Offense', display: 'Offense' },
    { id: 'DEFENSE', name: 'Defense', display: 'Defense' },
    { id: 'SPECIAL', name: 'Special Teams', display: 'Special' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  HOCKEY: [
    { id: 'STANDARD_6', name: 'Standard Six', display: '1-2-3' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  LACROSSE: [
    { id: 'STANDARD_10', name: 'Standard Ten', display: '1-3-3-3' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  AUSTRALIAN_RULES: [
    { id: 'STANDARD_18', name: 'Standard 18', display: '6-6-6' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  GAELIC_FOOTBALL: [
    { id: 'STANDARD_15', name: 'Standard XV', display: '1-6-8' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  FUTSAL: [
    { id: 'STANDARD_5', name: 'Standard Five', display: '1-2-2' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
  BEACH_FOOTBALL: [
    { id: 'STANDARD_5', name: 'Standard Five', display: '1-2-2' },
    { id: 'CUSTOM', name: 'Custom', display: 'Custom' },
  ],
};

// ============================================================================
// INJURY PATTERNS BY SPORT
// ============================================================================

export const SPORT_INJURY_PATTERNS: Record<Sport, string[]> = {
  FOOTBALL: [
    'Hamstring Strain', 'ACL Tear', 'MCL Sprain', 'Ankle Sprain', 'Groin Strain',
    'Calf Strain', 'Quadriceps Strain', 'Concussion', 'Knee Contusion', 'Hip Flexor'
  ],
  RUGBY: [
    'Shoulder Dislocation', 'Concussion', 'Knee Ligament', 'Ankle Sprain', 'Neck Injury',
    'Rib Fracture', 'Hamstring Strain', 'Calf Strain', 'Thumb Injury', 'Back Strain'
  ],
  CRICKET: [
    'Shoulder Injury', 'Back Strain', 'Hamstring Strain', 'Side Strain', 'Finger Injury',
    'Ankle Sprain', 'Knee Injury', 'Elbow Injury', 'Groin Strain', 'Stress Fracture'
  ],
  BASKETBALL: [
    'Ankle Sprain', 'ACL Tear', 'Achilles Tendon', 'Knee Injury', 'Finger Sprain',
    'Hamstring Strain', 'Concussion', 'Shoulder Injury', 'Back Strain', 'Hip Injury'
  ],
  AMERICAN_FOOTBALL: [
    'Concussion', 'ACL Tear', 'MCL Sprain', 'Shoulder Injury', 'Ankle Sprain',
    'Hamstring Strain', 'Rib Injury', 'Back Strain', 'Neck Injury', 'Knee Contusion'
  ],
  HOCKEY: [
    'Concussion', 'Shoulder Separation', 'Knee Injury', 'Groin Strain', 'Hip Injury',
    'Ankle Sprain', 'Back Strain', 'Wrist Injury', 'Facial Laceration', 'Hand Injury'
  ],
  NETBALL: [
    'ACL Tear', 'Ankle Sprain', 'Knee Injury', 'Calf Strain', 'Finger Injury',
    'Shoulder Injury', 'Back Strain', 'Achilles Tendon', 'Hip Injury', 'Hamstring Strain'
  ],
  LACROSSE: [
    'Concussion', 'Shoulder Injury', 'Ankle Sprain', 'Knee Injury', 'Wrist Injury',
    'Back Strain', 'Hamstring Strain', 'Hip Injury', 'Groin Strain', 'Facial Injury'
  ],
  AUSTRALIAN_RULES: [
    'Hamstring Strain', 'ACL Tear', 'Shoulder Injury', 'Ankle Sprain', 'Concussion',
    'Groin Strain', 'Calf Strain', 'Back Strain', 'Knee Injury', 'Hip Injury'
  ],
  GAELIC_FOOTBALL: [
    'Hamstring Strain', 'ACL Tear', 'Shoulder Injury', 'Ankle Sprain', 'Knee Injury',
    'Back Strain', 'Groin Strain', 'Concussion', 'Finger Injury', 'Calf Strain'
  ],
  FUTSAL: [
    'Ankle Sprain', 'Knee Injury', 'Groin Strain', 'Hamstring Strain', 'Calf Strain',
    'Achilles Tendon', 'Hip Injury', 'Back Strain', 'Foot Injury', 'Toe Injury'
  ],
  BEACH_FOOTBALL: [
    'Ankle Sprain', 'Knee Injury', 'Shoulder Injury', 'Hamstring Strain', 'Foot Injury',
    'Calf Strain', 'Back Strain', 'Hip Injury', 'Groin Strain', 'Concussion'
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getSportConfig(sport: Sport): SportConfig {
  const squadConfig = SPORT_SQUAD_CONFIG[sport];
  const positions = SPORT_POSITIONS[sport] || [];
  const eventTypes = SPORT_EVENT_TYPES[sport] || [];
  const metrics = SPORT_RANKING_METRICS[sport] || [];
  const injuryPatterns = SPORT_INJURY_PATTERNS[sport] || [];

  return {
    name: formatSportName(sport),
    icon: getSportIcon(sport),
    squadSize: squadConfig.starting,
    maxSubstitutes: squadConfig.maxSubs,
    positions,
    formations: SPORT_FORMATIONS[sport]?.map(f => ({
      id: f.id,
      name: f.name,
      positions: [],
    })) || [],
    eventTypes,
    scoringEvents: SPORT_SCORING_EVENTS[sport]?.map(s => s.event) || [],
    disciplinaryEvents: eventTypes.filter(e =>
      ['YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD', 'MAJOR_PENALTY', 'MINOR_PENALTY'].includes(e)
    ),
    metrics,
    injuryPatterns,
    periodCount: getPeriodCount(sport),
    periodDuration: getPeriodDuration(sport),
    hasExtraTime: hasExtraTime(sport),
    hasPenalties: hasPenalties(sport),
  };
}

export function formatSportName(sport: Sport): string {
  const names: Record<Sport, string> = {
    FOOTBALL: 'Football',
    NETBALL: 'Netball',
    RUGBY: 'Rugby',
    CRICKET: 'Cricket',
    AMERICAN_FOOTBALL: 'American Football',
    BASKETBALL: 'Basketball',
    HOCKEY: 'Hockey',
    LACROSSE: 'Lacrosse',
    AUSTRALIAN_RULES: 'Australian Rules',
    GAELIC_FOOTBALL: 'Gaelic Football',
    FUTSAL: 'Futsal',
    BEACH_FOOTBALL: 'Beach Football',
  };
  return names[sport] || sport;
}

export function getSportIcon(sport: Sport): string {
  const icons: Record<Sport, string> = {
    FOOTBALL: '⚽',
    NETBALL: '🏐',
    RUGBY: '🏉',
    CRICKET: '🏏',
    AMERICAN_FOOTBALL: '🏈',
    BASKETBALL: '🏀',
    HOCKEY: '🏒',
    LACROSSE: '🥍',
    AUSTRALIAN_RULES: '🏉',
    GAELIC_FOOTBALL: '⚽',
    FUTSAL: '⚽',
    BEACH_FOOTBALL: '⚽',
  };
  return icons[sport] || '🏅';
}

function getPeriodCount(sport: Sport): number {
  const periods: Record<Sport, number> = {
    FOOTBALL: 2,
    NETBALL: 4,
    RUGBY: 2,
    CRICKET: 2, // innings
    AMERICAN_FOOTBALL: 4,
    BASKETBALL: 4,
    HOCKEY: 3,
    LACROSSE: 4,
    AUSTRALIAN_RULES: 4,
    GAELIC_FOOTBALL: 2,
    FUTSAL: 2,
    BEACH_FOOTBALL: 3,
  };
  return periods[sport] || 2;
}

function getPeriodDuration(sport: Sport): number {
  const durations: Record<Sport, number> = {
    FOOTBALL: 45,
    NETBALL: 15,
    RUGBY: 40,
    CRICKET: 0, // overs-based
    AMERICAN_FOOTBALL: 15,
    BASKETBALL: 12,
    HOCKEY: 20,
    LACROSSE: 15,
    AUSTRALIAN_RULES: 20,
    GAELIC_FOOTBALL: 35,
    FUTSAL: 20,
    BEACH_FOOTBALL: 12,
  };
  return durations[sport] || 45;
}

function hasExtraTime(sport: Sport): boolean {
  return ['FOOTBALL', 'RUGBY', 'BASKETBALL', 'HOCKEY', 'FUTSAL', 'BEACH_FOOTBALL'].includes(sport);
}

function hasPenalties(sport: Sport): boolean {
  return ['FOOTBALL', 'HOCKEY', 'FUTSAL', 'BEACH_FOOTBALL'].includes(sport);
}

export function formatPositionName(position: Position): string {
  return position
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function getEventTypeLabel(event: MatchEventType, sport: Sport): string {
  // Sport-specific labels
  const sportLabels: Partial<Record<Sport, Partial<Record<MatchEventType, string>>>> = {
    RUGBY: {
      'YELLOW_CARD': 'Sin Bin',
    },
    HOCKEY: {
      'MAJOR_PENALTY': 'Major Penalty',
      'MINOR_PENALTY': 'Minor Penalty',
    },
  };

  const sportLabel = sportLabels[sport]?.[event];
  if (sportLabel) return sportLabel;

  // Default labels
  return event
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function getEventTypeIcon(event: MatchEventType): string {
  const icons: Partial<Record<MatchEventType, string>> = {
    GOAL: '⚽',
    TRY: '🏉',
    TOUCHDOWN: '🏈',
    ASSIST: '🅰️',
    YELLOW_CARD: '🟨',
    SECOND_YELLOW: '🟨🟥',
    RED_CARD: '🟥',
    SUBSTITUTION_ON: '🔄',
    SUBSTITUTION_OFF: '🔄',
    INJURY: '🏥',
    PENALTY_SCORED: '⚽',
    PENALTY_MISSED: '❌',
    OWN_GOAL: '😬',
    THREE_POINTER: '🏀',
    WICKET: '🎳',
    CONVERSION: '🎯',
    DROP_GOAL: '🦶',
    PENALTY_GOAL: '⚽',
  };
  return icons[event] || '📋';
}

export function getSeverityColor(severity: InjurySeverity): string {
  const colors: Record<InjurySeverity, string> = {
    MINOR: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    MODERATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    SEVERE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    CAREER_THREATENING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
}

export function calculateDisciplinaryPoints(
  yellowCards: number,
  redCards: number,
  sport: Sport
): number {
  // Sport-specific disciplinary point systems
  const systems: Record<Sport, { yellow: number; red: number }> = {
    FOOTBALL: { yellow: 1, red: 3 },
    RUGBY: { yellow: 1, red: 3 },
    FUTSAL: { yellow: 1, red: 3 },
    BEACH_FOOTBALL: { yellow: 1, red: 3 },
    NETBALL: { yellow: 0, red: 0 }, // No card system
    BASKETBALL: { yellow: 0, red: 0 }, // Foul system instead
    CRICKET: { yellow: 0, red: 0 },
    AMERICAN_FOOTBALL: { yellow: 0, red: 0 },
    HOCKEY: { yellow: 0, red: 0 }, // Penalty minutes instead
    LACROSSE: { yellow: 0, red: 0 },
    AUSTRALIAN_RULES: { yellow: 1, red: 3 },
    GAELIC_FOOTBALL: { yellow: 1, red: 3 },
  };

  const system = systems[sport] || { yellow: 1, red: 3 };
  return (yellowCards * system.yellow) + (redCards * system.red);
}