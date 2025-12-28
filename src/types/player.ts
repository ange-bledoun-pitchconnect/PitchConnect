/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Multi-Sport Types v2.0
 * Path: src/types/player.ts
 * ============================================================================
 * 
 * Comprehensive types for multi-sport platform supporting:
 * - Football/Soccer ⚽
 * - Netball 🏐
 * - Rugby (Union & League) 🏉
 * - American Football 🏈
 * - Basketball 🏀
 * - Cricket 🏏
 * - Hockey 🏒
 * - Gaelic Football 🟢
 * 
 * ============================================================================
 */

// ============================================================================
// SPORT ENUM
// ============================================================================

export type Sport =
  | 'FOOTBALL'
  | 'NETBALL'
  | 'RUGBY'
  | 'CRICKET'
  | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL'
  | 'HOCKEY'
  | 'GAELIC_FOOTBALL'
  | 'BEACH_FOOTBALL';

// ============================================================================
// POSITION ENUM (All Sports)
// ============================================================================

export type Position =
  // Football/Soccer
  | 'GOALKEEPER'
  | 'LEFT_BACK'
  | 'CENTER_BACK'
  | 'RIGHT_BACK'
  | 'LEFT_WING_BACK'
  | 'RIGHT_WING_BACK'
  | 'DEFENSIVE_MIDFIELDER'
  | 'CENTRAL_MIDFIELDER'
  | 'LEFT_MIDFIELDER'
  | 'RIGHT_MIDFIELDER'
  | 'ATTACKING_MIDFIELDER'
  | 'LEFT_WINGER'
  | 'RIGHT_WINGER'
  | 'STRIKER'
  | 'CENTER_FORWARD'
  | 'SECOND_STRIKER'
  // Netball
  | 'GOALKEEPER_NETBALL'
  | 'GOAL_ATTACK'
  | 'WING_ATTACK'
  | 'CENTER'
  | 'WING_DEFENSE'
  | 'GOAL_DEFENSE'
  | 'GOAL_SHOOTER'
  // Rugby Union
  | 'PROP'
  | 'HOOKER'
  | 'LOCK'
  | 'FLANKER'
  | 'NUMBER_8'
  | 'SCRUM_HALF'
  | 'FLY_HALF'
  | 'INSIDE_CENTER'
  | 'OUTSIDE_CENTER'
  | 'FULLBACK'
  // Rugby League
  | 'HOOKER_LEAGUE'
  | 'PROP_LEAGUE'
  | 'SECOND_ROW'
  | 'LOOSE_FORWARD'
  // American Football
  | 'QUARTERBACK'
  | 'RUNNING_BACK'
  | 'WIDE_RECEIVER'
  | 'TIGHT_END'
  | 'LEFT_TACKLE'
  | 'LEFT_GUARD'
  | 'CENTER_POSITION'
  | 'RIGHT_GUARD'
  | 'RIGHT_TACKLE'
  | 'LINEBACKER'
  | 'DEFENSIVE_END'
  | 'DEFENSIVE_TACKLE'
  | 'SAFETY'
  | 'CORNERBACK'
  | 'PUNTER'
  | 'KICKER'
  // Basketball
  | 'POINT_GUARD'
  | 'SHOOTING_GUARD'
  | 'SMALL_FORWARD'
  | 'POWER_FORWARD'
  | 'CENTER_BASKETBALL'
  // Cricket
  | 'BATSMAN'
  | 'BOWLER'
  | 'ALL_ROUNDER'
  | 'FIELDER'
  | 'WICKET_KEEPER'
  // Hockey
  | 'GOALTENDER'
  | 'DEFENSEMAN'
  | 'WINGER'
  | 'CENTER_HOCKEY'
  // Universal
  | 'UTILITY'
  | 'SUBSTITUTE';

export type PreferredFoot = 'LEFT' | 'RIGHT' | 'BOTH';

export type MatchStatus =
  | 'SCHEDULED'
  | 'WARMUP'
  | 'LIVE'
  | 'HALFTIME'
  | 'SECOND_HALF'
  | 'EXTRA_TIME_FIRST'
  | 'EXTRA_TIME_SECOND'
  | 'PENALTIES'
  | 'FINISHED'
  | 'CANCELLED'
  | 'POSTPONED'
  | 'ABANDONED';

// ============================================================================
// SPORT CONFIGURATION
// ============================================================================

export interface SportConfig {
  id: Sport;
  name: string;
  icon: string;
  color: string;
  positions: Position[];
  statLabels: {
    primaryStat: string;
    secondaryStat: string;
    defensiveStat: string;
  };
  periodName: string;
  scoringUnit: string;
  preferredSideLabel: string; // "Preferred Foot", "Preferred Hand", "Shooting Hand"
}

export const SPORT_CONFIGS: Record<Sport, SportConfig> = {
  FOOTBALL: {
    id: 'FOOTBALL',
    name: 'Football',
    icon: '⚽',
    color: 'green',
    positions: [
      'GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'RIGHT_BACK',
      'LEFT_WING_BACK', 'RIGHT_WING_BACK', 'DEFENSIVE_MIDFIELDER',
      'CENTRAL_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER',
      'ATTACKING_MIDFIELDER', 'LEFT_WINGER', 'RIGHT_WINGER',
      'STRIKER', 'CENTER_FORWARD', 'SECOND_STRIKER', 'UTILITY', 'SUBSTITUTE',
    ],
    statLabels: { primaryStat: 'Goals', secondaryStat: 'Assists', defensiveStat: 'Tackles' },
    periodName: 'Half',
    scoringUnit: 'Goal',
    preferredSideLabel: 'Preferred Foot',
  },
  NETBALL: {
    id: 'NETBALL',
    name: 'Netball',
    icon: '🏐',
    color: 'pink',
    positions: [
      'GOALKEEPER_NETBALL', 'GOAL_DEFENSE', 'WING_DEFENSE',
      'CENTER', 'WING_ATTACK', 'GOAL_ATTACK', 'GOAL_SHOOTER',
      'UTILITY', 'SUBSTITUTE',
    ],
    statLabels: { primaryStat: 'Goals', secondaryStat: 'Assists', defensiveStat: 'Interceptions' },
    periodName: 'Quarter',
    scoringUnit: 'Goal',
    preferredSideLabel: 'Preferred Hand',
  },
  RUGBY: {
    id: 'RUGBY',
    name: 'Rugby',
    icon: '🏉',
    color: 'red',
    positions: [
      'PROP', 'HOOKER', 'LOCK', 'FLANKER', 'NUMBER_8',
      'SCRUM_HALF', 'FLY_HALF', 'INSIDE_CENTER', 'OUTSIDE_CENTER',
      'LEFT_WINGER', 'RIGHT_WINGER', 'FULLBACK',
      'HOOKER_LEAGUE', 'PROP_LEAGUE', 'SECOND_ROW', 'LOOSE_FORWARD',
      'UTILITY', 'SUBSTITUTE',
    ],
    statLabels: { primaryStat: 'Tries', secondaryStat: 'Conversions', defensiveStat: 'Tackles' },
    periodName: 'Half',
    scoringUnit: 'Try',
    preferredSideLabel: 'Preferred Foot',
  },
  CRICKET: {
    id: 'CRICKET',
    name: 'Cricket',
    icon: '🏏',
    color: 'amber',
    positions: [
      'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'FIELDER', 'WICKET_KEEPER',
      'UTILITY', 'SUBSTITUTE',
    ],
    statLabels: { primaryStat: 'Runs', secondaryStat: 'Wickets', defensiveStat: 'Catches' },
    periodName: 'Innings',
    scoringUnit: 'Run',
    preferredSideLabel: 'Batting Hand',
  },
  AMERICAN_FOOTBALL: {
    id: 'AMERICAN_FOOTBALL',
    name: 'American Football',
    icon: '🏈',
    color: 'orange',
    positions: [
      'QUARTERBACK', 'RUNNING_BACK', 'WIDE_RECEIVER', 'TIGHT_END',
      'LEFT_TACKLE', 'LEFT_GUARD', 'CENTER_POSITION', 'RIGHT_GUARD', 'RIGHT_TACKLE',
      'LINEBACKER', 'DEFENSIVE_END', 'DEFENSIVE_TACKLE',
      'SAFETY', 'CORNERBACK', 'PUNTER', 'KICKER',
      'UTILITY', 'SUBSTITUTE',
    ],
    statLabels: { primaryStat: 'Touchdowns', secondaryStat: 'Yards', defensiveStat: 'Sacks' },
    periodName: 'Quarter',
    scoringUnit: 'Touchdown',
    preferredSideLabel: 'Throwing Hand',
  },
  BASKETBALL: {
    id: 'BASKETBALL',
    name: 'Basketball',
    icon: '🏀',
    color: 'orange',
    positions: [
      'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD',
      'POWER_FORWARD', 'CENTER_BASKETBALL',
      'UTILITY', 'SUBSTITUTE',
    ],
    statLabels: { primaryStat: 'Points', secondaryStat: 'Assists', defensiveStat: 'Rebounds' },
    periodName: 'Quarter',
    scoringUnit: 'Point',
    preferredSideLabel: 'Preferred Hand',
  },
  HOCKEY: {
    id: 'HOCKEY',
    name: 'Hockey',
    icon: '🏒',
    color: 'blue',
    positions: [
      'GOALTENDER', 'DEFENSEMAN', 'WINGER', 'CENTER_HOCKEY',
      'UTILITY', 'SUBSTITUTE',
    ],
    statLabels: { primaryStat: 'Goals', secondaryStat: 'Assists', defensiveStat: 'Saves' },
    periodName: 'Period',
    scoringUnit: 'Goal',
    preferredSideLabel: 'Shooting Hand',
  },
  GAELIC_FOOTBALL: {
    id: 'GAELIC_FOOTBALL',
    name: 'Gaelic Football',
    icon: '🟢',
    color: 'green',
    positions: [
      'GOALKEEPER', 'FULLBACK', 'CENTER_BACK', 'LEFT_BACK', 'RIGHT_BACK',
      'CENTER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER',
      'CENTER_FORWARD', 'LEFT_WINGER', 'RIGHT_WINGER',
      'UTILITY', 'SUBSTITUTE',
    ],
    statLabels: { primaryStat: 'Points', secondaryStat: 'Goals', defensiveStat: 'Blocks' },
    periodName: 'Half',
    scoringUnit: 'Point',
    preferredSideLabel: 'Preferred Foot',
  },
  BEACH_FOOTBALL: {
    id: 'BEACH_FOOTBALL',
    name: 'Beach Football',
    icon: '🏖️',
    color: 'yellow',
    positions: [
      'GOALKEEPER', 'FULLBACK', 'WINGER', 'CENTER_FORWARD',
      'UTILITY', 'SUBSTITUTE',
    ],
    statLabels: { primaryStat: 'Goals', secondaryStat: 'Assists', defensiveStat: 'Saves' },
    periodName: 'Period',
    scoringUnit: 'Goal',
    preferredSideLabel: 'Preferred Foot',
  },
};

// ============================================================================
// POSITION LABELS (All Sports)
// ============================================================================

export const POSITION_LABELS: Record<Position, string> = {
  // Football
  GOALKEEPER: 'Goalkeeper',
  LEFT_BACK: 'Left Back',
  CENTER_BACK: 'Center Back',
  RIGHT_BACK: 'Right Back',
  LEFT_WING_BACK: 'Left Wing Back',
  RIGHT_WING_BACK: 'Right Wing Back',
  DEFENSIVE_MIDFIELDER: 'Defensive Midfielder',
  CENTRAL_MIDFIELDER: 'Central Midfielder',
  LEFT_MIDFIELDER: 'Left Midfielder',
  RIGHT_MIDFIELDER: 'Right Midfielder',
  ATTACKING_MIDFIELDER: 'Attacking Midfielder',
  LEFT_WINGER: 'Left Winger',
  RIGHT_WINGER: 'Right Winger',
  STRIKER: 'Striker',
  CENTER_FORWARD: 'Center Forward',
  SECOND_STRIKER: 'Second Striker',
  // Netball
  GOALKEEPER_NETBALL: 'Goal Keeper',
  GOAL_ATTACK: 'Goal Attack',
  WING_ATTACK: 'Wing Attack',
  CENTER: 'Center',
  WING_DEFENSE: 'Wing Defense',
  GOAL_DEFENSE: 'Goal Defense',
  GOAL_SHOOTER: 'Goal Shooter',
  // Rugby Union
  PROP: 'Prop',
  HOOKER: 'Hooker',
  LOCK: 'Lock',
  FLANKER: 'Flanker',
  NUMBER_8: 'Number 8',
  SCRUM_HALF: 'Scrum Half',
  FLY_HALF: 'Fly Half',
  INSIDE_CENTER: 'Inside Center',
  OUTSIDE_CENTER: 'Outside Center',
  FULLBACK: 'Fullback',
  // Rugby League
  HOOKER_LEAGUE: 'Hooker',
  PROP_LEAGUE: 'Prop',
  SECOND_ROW: 'Second Row',
  LOOSE_FORWARD: 'Loose Forward',
  // American Football
  QUARTERBACK: 'Quarterback',
  RUNNING_BACK: 'Running Back',
  WIDE_RECEIVER: 'Wide Receiver',
  TIGHT_END: 'Tight End',
  LEFT_TACKLE: 'Left Tackle',
  LEFT_GUARD: 'Left Guard',
  CENTER_POSITION: 'Center',
  RIGHT_GUARD: 'Right Guard',
  RIGHT_TACKLE: 'Right Tackle',
  LINEBACKER: 'Linebacker',
  DEFENSIVE_END: 'Defensive End',
  DEFENSIVE_TACKLE: 'Defensive Tackle',
  SAFETY: 'Safety',
  CORNERBACK: 'Cornerback',
  PUNTER: 'Punter',
  KICKER: 'Kicker',
  // Basketball
  POINT_GUARD: 'Point Guard',
  SHOOTING_GUARD: 'Shooting Guard',
  SMALL_FORWARD: 'Small Forward',
  POWER_FORWARD: 'Power Forward',
  CENTER_BASKETBALL: 'Center',
  // Cricket
  BATSMAN: 'Batsman',
  BOWLER: 'Bowler',
  ALL_ROUNDER: 'All-Rounder',
  FIELDER: 'Fielder',
  WICKET_KEEPER: 'Wicket Keeper',
  // Hockey
  GOALTENDER: 'Goaltender',
  DEFENSEMAN: 'Defenseman',
  WINGER: 'Winger',
  CENTER_HOCKEY: 'Center',
  // Universal
  UTILITY: 'Utility',
  SUBSTITUTE: 'Substitute',
};

export const POSITION_ABBREVIATIONS: Record<Position, string> = {
  // Football
  GOALKEEPER: 'GK', LEFT_BACK: 'LB', CENTER_BACK: 'CB', RIGHT_BACK: 'RB',
  LEFT_WING_BACK: 'LWB', RIGHT_WING_BACK: 'RWB', DEFENSIVE_MIDFIELDER: 'CDM',
  CENTRAL_MIDFIELDER: 'CM', LEFT_MIDFIELDER: 'LM', RIGHT_MIDFIELDER: 'RM',
  ATTACKING_MIDFIELDER: 'CAM', LEFT_WINGER: 'LW', RIGHT_WINGER: 'RW',
  STRIKER: 'ST', CENTER_FORWARD: 'CF', SECOND_STRIKER: 'SS',
  // Netball
  GOALKEEPER_NETBALL: 'GK', GOAL_ATTACK: 'GA', WING_ATTACK: 'WA',
  CENTER: 'C', WING_DEFENSE: 'WD', GOAL_DEFENSE: 'GD', GOAL_SHOOTER: 'GS',
  // Rugby Union
  PROP: 'PR', HOOKER: 'HK', LOCK: 'LK', FLANKER: 'FL', NUMBER_8: 'N8',
  SCRUM_HALF: 'SH', FLY_HALF: 'FH', INSIDE_CENTER: 'IC', OUTSIDE_CENTER: 'OC', FULLBACK: 'FB',
  // Rugby League
  HOOKER_LEAGUE: 'HK', PROP_LEAGUE: 'PR', SECOND_ROW: 'SR', LOOSE_FORWARD: 'LF',
  // American Football
  QUARTERBACK: 'QB', RUNNING_BACK: 'RB', WIDE_RECEIVER: 'WR', TIGHT_END: 'TE',
  LEFT_TACKLE: 'LT', LEFT_GUARD: 'LG', CENTER_POSITION: 'C',
  RIGHT_GUARD: 'RG', RIGHT_TACKLE: 'RT', LINEBACKER: 'LB',
  DEFENSIVE_END: 'DE', DEFENSIVE_TACKLE: 'DT', SAFETY: 'S', CORNERBACK: 'CB',
  PUNTER: 'P', KICKER: 'K',
  // Basketball
  POINT_GUARD: 'PG', SHOOTING_GUARD: 'SG', SMALL_FORWARD: 'SF',
  POWER_FORWARD: 'PF', CENTER_BASKETBALL: 'C',
  // Cricket
  BATSMAN: 'BAT', BOWLER: 'BWL', ALL_ROUNDER: 'AR', FIELDER: 'FLD', WICKET_KEEPER: 'WK',
  // Hockey
  GOALTENDER: 'G', DEFENSEMAN: 'D', WINGER: 'W', CENTER_HOCKEY: 'C',
  // Universal
  UTILITY: 'UTL', SUBSTITUTE: 'SUB',
};

// ============================================================================
// GET POSITIONS FOR SPORT
// ============================================================================

export function getPositionsForSport(sport: Sport): { value: Position; label: string; abbr: string }[] {
  const config = SPORT_CONFIGS[sport];
  if (!config) return [];
  
  return config.positions.map((pos) => ({
    value: pos,
    label: POSITION_LABELS[pos] || pos,
    abbr: POSITION_ABBREVIATIONS[pos] || pos.substring(0, 3),
  }));
}

// ============================================================================
// SPORT-SPECIFIC STAT LABELS
// ============================================================================

export function getStatLabels(sport: Sport) {
  return SPORT_CONFIGS[sport]?.statLabels || {
    primaryStat: 'Points',
    secondaryStat: 'Assists',
    defensiveStat: 'Defensive Actions',
  };
}

export function getSportConfig(sport: Sport): SportConfig {
  return SPORT_CONFIGS[sport] || SPORT_CONFIGS.FOOTBALL;
}

// ============================================================================
// PLAYER PROFILE TYPES
// ============================================================================

export interface PlayerProfile {
  id: string;
  userId: string;
  height: number | null;
  weight: number | null;
  dateOfBirth: string | null;
  nationality: string | null;
  secondNationality: string | null;
  jerseyNumber: number | null;
  preferredFoot: PreferredFoot | null;
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
  tertiaryPosition: Position | null;
  overallRating: number | null;
  formRating: number | null;
  fitnessLevel: number | null;
  injuryStatus: string | null;
  availabilityStatus: string;
  isActive: boolean;
  isVerified: boolean;
  hasCompletedProfile: boolean;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
  };
}

export interface PlayerStatistics {
  id: string;
  playerId: string;
  season: number;
  teamId: string | null;
  leagueId: string | null;
  matches: number;
  starts: number;
  minutesPlayed: number;
  // Universal stats
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  // Sport-specific stats stored as JSON
  sportSpecificStats: Record<string, unknown> | null;
}

// ============================================================================
// TEAM & CLUB TYPES
// ============================================================================

export interface Club {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
  city: string | null;
  country: string;
  sport: Sport;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export interface Team {
  id: string;
  clubId: string;
  name: string;
  ageGroup: string | null;
  gender: string | null;
  status: string;
  club: Club;
  _count?: { players: number };
}