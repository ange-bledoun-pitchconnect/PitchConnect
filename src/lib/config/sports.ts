// ============================================================================
// 🏆 PITCHCONNECT - SPORT CONFIGURATION SYSTEM v7.3.0
// ============================================================================
// Path: src/lib/config/sports.ts
// Comprehensive multi-sport configuration for all 12 supported sports
// Schema v7.3.0 aligned - Uses Prisma enums
// ============================================================================

import {
  Sport,
  Position,
  FormationType,
  MatchEventType,
  MatchStatus,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface SportConfig {
  sport: Sport;
  name: string;
  icon: string;
  primaryColor: string;
  secondaryColor: string;
  
  // Scoring
  scoring: SportScoring;
  
  // Squad configuration
  squad: SquadConfig;
  
  // Available positions
  positions: Position[];
  
  // Available formations
  formations: FormationType[];
  
  // Match event types relevant to this sport
  eventTypes: MatchEventType[];
  
  // Scoring event types (events that affect the score)
  scoringEvents: MatchEventType[];
  
  // Period configuration
  periods: PeriodConfig;
  
  // Match statuses applicable to this sport
  matchStatuses: MatchStatus[];
}

export interface SportScoring {
  // Whether to track detailed breakdown or just total
  trackBreakdown: boolean;
  
  // Point values for each scoring type
  pointValues: Record<string, number>;
  
  // Labels for scoring types
  labels: Record<string, string>;
  
  // Default display (e.g., "Goals", "Points", "Runs")
  displayLabel: string;
  
  // Maximum score input (for validation)
  maxScore: number;
}

export interface SquadConfig {
  startingSize: number;
  maxSubstitutes: number;
  maxTotalSquad: number;
  substitutionsAllowed: number;
  rollingSubstitutions: boolean;
}

export interface PeriodConfig {
  count: number;
  durationMinutes: number;
  breakMinutes: number;
  extraTimeEnabled: boolean;
  extraTimeDuration?: number;
  penaltiesEnabled?: boolean;
  overtimeEnabled?: boolean;
  labels: string[];
}

// ============================================================================
// SPORT CONFIGURATIONS
// ============================================================================

export const SPORT_CONFIGS: Record<Sport, SportConfig> = {
  // =========================================================================
  // FOOTBALL (Soccer)
  // =========================================================================
  FOOTBALL: {
    sport: 'FOOTBALL',
    name: 'Football',
    icon: '⚽',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    
    scoring: {
      trackBreakdown: false,
      pointValues: { GOAL: 1 },
      labels: { GOAL: 'Goal' },
      displayLabel: 'Goals',
      maxScore: 20,
    },
    
    squad: {
      startingSize: 11,
      maxSubstitutes: 9,
      maxTotalSquad: 20,
      substitutionsAllowed: 5,
      rollingSubstitutions: false,
    },
    
    positions: [
      'GOALKEEPER',
      'LEFT_BACK',
      'CENTER_BACK',
      'RIGHT_BACK',
      'LEFT_WING_BACK',
      'RIGHT_WING_BACK',
      'DEFENSIVE_MIDFIELDER',
      'CENTRAL_MIDFIELDER',
      'LEFT_MIDFIELDER',
      'RIGHT_MIDFIELDER',
      'ATTACKING_MIDFIELDER',
      'LEFT_WINGER',
      'RIGHT_WINGER',
      'STRIKER',
      'CENTER_FORWARD',
      'SECOND_STRIKER',
    ],
    
    formations: [
      'FOUR_FOUR_TWO',
      'FOUR_THREE_THREE',
      'THREE_FIVE_TWO',
      'FIVE_THREE_TWO',
      'FIVE_FOUR_ONE',
      'THREE_FOUR_THREE',
      'FOUR_TWO_THREE_ONE',
      'FOUR_ONE_FOUR_ONE',
      'FOUR_FIVE_ONE',
      'FOUR_ONE_TWO_THREE',
      'FOUR_FOUR_ONE_ONE',
      'FOUR_THREE_TWO_ONE',
      'CUSTOM',
    ],
    
    eventTypes: [
      'GOAL',
      'ASSIST',
      'YELLOW_CARD',
      'SECOND_YELLOW',
      'RED_CARD',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'INJURY',
      'INJURY_TIME',
      'FULLTIME',
      'HALFTIME',
      'KICKOFF',
      'PENALTY_SCORED',
      'PENALTY_MISSED',
      'PENALTY_SAVED',
      'OWN_GOAL',
      'VAR_REVIEW',
      'VAR_DECISION',
      'OFFSIDE',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['GOAL', 'PENALTY_SCORED', 'OWN_GOAL'],
    
    periods: {
      count: 2,
      durationMinutes: 45,
      breakMinutes: 15,
      extraTimeEnabled: true,
      extraTimeDuration: 15,
      penaltiesEnabled: true,
      labels: ['1st Half', '2nd Half', 'Extra Time 1', 'Extra Time 2', 'Penalties'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'WARMUP',
      'LIVE',
      'HALFTIME',
      'SECOND_HALF',
      'EXTRA_TIME_FIRST',
      'EXTRA_TIME_SECOND',
      'PENALTIES',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
      'ABANDONED',
      'DELAYED',
      'SUSPENDED',
    ],
  },

  // =========================================================================
  // RUGBY
  // =========================================================================
  RUGBY: {
    sport: 'RUGBY',
    name: 'Rugby Union',
    icon: '🏉',
    primaryColor: '#DC2626',
    secondaryColor: '#B91C1C',
    
    scoring: {
      trackBreakdown: true,
      pointValues: {
        TRY: 5,
        CONVERSION: 2,
        PENALTY_GOAL: 3,
        DROP_GOAL: 3,
      },
      labels: {
        TRY: 'Try',
        CONVERSION: 'Conversion',
        PENALTY_GOAL: 'Penalty',
        DROP_GOAL: 'Drop Goal',
      },
      displayLabel: 'Points',
      maxScore: 100,
    },
    
    squad: {
      startingSize: 15,
      maxSubstitutes: 8,
      maxTotalSquad: 23,
      substitutionsAllowed: 8,
      rollingSubstitutions: false,
    },
    
    positions: [
      'PROP',
      'HOOKER',
      'LOCK',
      'FLANKER',
      'NUMBER_8',
      'SCRUM_HALF',
      'FLY_HALF',
      'INSIDE_CENTER',
      'OUTSIDE_CENTER',
      'WINGER',
      'FULLBACK',
    ],
    
    formations: ['PODS', 'DIAMOND', 'FLAT_LINE', 'CUSTOM'],
    
    eventTypes: [
      'TRY',
      'CONVERSION',
      'PENALTY_GOAL',
      'DROP_GOAL',
      'YELLOW_CARD_RUGBY',
      'RED_CARD_RUGBY',
      'SIN_BIN',
      'SCRUM',
      'LINEOUT',
      'MAUL',
      'RUCK',
      'KNOCK_ON',
      'HIGH_TACKLE',
      'OFFSIDE',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'INJURY',
      'HALFTIME',
      'FULLTIME',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['TRY', 'CONVERSION', 'PENALTY_GOAL', 'DROP_GOAL'],
    
    periods: {
      count: 2,
      durationMinutes: 40,
      breakMinutes: 10,
      extraTimeEnabled: true,
      extraTimeDuration: 10,
      penaltiesEnabled: false,
      labels: ['1st Half', '2nd Half', 'Extra Time'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'WARMUP',
      'LIVE',
      'HALFTIME',
      'SECOND_HALF',
      'EXTRA_TIME_FIRST',
      'EXTRA_TIME_SECOND',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
      'ABANDONED',
    ],
  },

  // =========================================================================
  // BASKETBALL
  // =========================================================================
  BASKETBALL: {
    sport: 'BASKETBALL',
    name: 'Basketball',
    icon: '🏀',
    primaryColor: '#F97316',
    secondaryColor: '#EA580C',
    
    scoring: {
      trackBreakdown: true,
      pointValues: {
        THREE_POINTER: 3,
        TWO_POINTER: 2,
        FREE_THROW_MADE: 1,
      },
      labels: {
        THREE_POINTER: '3-Pointer',
        TWO_POINTER: '2-Pointer',
        FREE_THROW_MADE: 'Free Throw',
      },
      displayLabel: 'Points',
      maxScore: 200,
    },
    
    squad: {
      startingSize: 5,
      maxSubstitutes: 7,
      maxTotalSquad: 12,
      substitutionsAllowed: -1, // Unlimited
      rollingSubstitutions: true,
    },
    
    positions: [
      'POINT_GUARD',
      'SHOOTING_GUARD',
      'SMALL_FORWARD',
      'POWER_FORWARD',
      'CENTER_BASKETBALL',
    ],
    
    formations: [
      'ONE_THREE_ONE',
      'TWO_THREE',
      'TWO_ONE_TWO',
      'THREE_TWO',
      'ONE_TWO_TWO',
      'CUSTOM',
    ],
    
    eventTypes: [
      'THREE_POINTER',
      'TWO_POINTER',
      'FREE_THROW_MADE',
      'FREE_THROW_MISSED',
      'FAST_BREAK',
      'TURNOVER',
      'OFFENSIVE_FOUL',
      'DEFENSIVE_FOUL',
      'TRAVEL',
      'DOUBLE_DRIBBLE',
      'BLOCK',
      'STEAL',
      'DUNK',
      'ALLEY_OOP',
      'REBOUND',
      'TIMEOUT',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['THREE_POINTER', 'TWO_POINTER', 'FREE_THROW_MADE'],
    
    periods: {
      count: 4,
      durationMinutes: 12,
      breakMinutes: 2,
      extraTimeEnabled: true,
      overtimeEnabled: true,
      extraTimeDuration: 5,
      labels: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'WARMUP',
      'LIVE',
      'HALFTIME',
      'OVERTIME_START',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
    ],
  },

  // =========================================================================
  // AMERICAN FOOTBALL
  // =========================================================================
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    name: 'American Football',
    icon: '🏈',
    primaryColor: '#7C3AED',
    secondaryColor: '#6D28D9',
    
    scoring: {
      trackBreakdown: true,
      pointValues: {
        TOUCHDOWN: 6,
        EXTRA_POINT: 1,
        TWO_POINT_CONVERSION: 2,
        FIELD_GOAL: 3,
        SAFETY_SCORE: 2,
      },
      labels: {
        TOUCHDOWN: 'Touchdown',
        EXTRA_POINT: 'Extra Point',
        TWO_POINT_CONVERSION: '2-Point Conversion',
        FIELD_GOAL: 'Field Goal',
        SAFETY_SCORE: 'Safety',
      },
      displayLabel: 'Points',
      maxScore: 100,
    },
    
    squad: {
      startingSize: 11,
      maxSubstitutes: 42,
      maxTotalSquad: 53,
      substitutionsAllowed: -1, // Unlimited
      rollingSubstitutions: true,
    },
    
    positions: [
      'QUARTERBACK',
      'RUNNING_BACK',
      'WIDE_RECEIVER',
      'TIGHT_END',
      'LEFT_TACKLE',
      'LEFT_GUARD',
      'CENTER_POSITION',
      'RIGHT_GUARD',
      'RIGHT_TACKLE',
      'LINEBACKER',
      'DEFENSIVE_END',
      'DEFENSIVE_TACKLE',
      'SAFETY',
      'CORNERBACK',
      'PUNTER',
      'KICKER',
    ],
    
    formations: [
      'I_FORMATION',
      'SHOTGUN',
      'PISTOL',
      'SPREAD',
      'SINGLE_BACK',
      'PRO_SET',
      'WILDCAT',
      'CUSTOM',
    ],
    
    eventTypes: [
      'TOUCHDOWN',
      'FIELD_GOAL',
      'SAFETY_SCORE',
      'EXTRA_POINT',
      'TWO_POINT_CONVERSION',
      'INTERCEPTION',
      'FUMBLE',
      'SACK',
      'PUNT',
      'KICKOFF_RETURN',
      'FAIR_CATCH',
      'TIMEOUT',
      'CHALLENGE_REVIEW',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'INJURY',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['TOUCHDOWN', 'FIELD_GOAL', 'SAFETY_SCORE', 'EXTRA_POINT', 'TWO_POINT_CONVERSION'],
    
    periods: {
      count: 4,
      durationMinutes: 15,
      breakMinutes: 2,
      extraTimeEnabled: true,
      overtimeEnabled: true,
      extraTimeDuration: 10,
      labels: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'WARMUP',
      'LIVE',
      'HALFTIME',
      'OVERTIME_START',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
      'DELAYED',
    ],
  },

  // =========================================================================
  // CRICKET
  // =========================================================================
  CRICKET: {
    sport: 'CRICKET',
    name: 'Cricket',
    icon: '🏏',
    primaryColor: '#16A34A',
    secondaryColor: '#15803D',
    
    scoring: {
      trackBreakdown: true,
      pointValues: {
        BOUNDARY: 4,
        SIX: 6,
        // Runs are tracked separately
      },
      labels: {
        BOUNDARY: 'Four',
        SIX: 'Six',
      },
      displayLabel: 'Runs',
      maxScore: 500,
    },
    
    squad: {
      startingSize: 11,
      maxSubstitutes: 1, // Only for fielding in some formats
      maxTotalSquad: 15,
      substitutionsAllowed: 1,
      rollingSubstitutions: false,
    },
    
    positions: [
      'BATSMAN',
      'BOWLER',
      'ALL_ROUNDER',
      'WICKET_KEEPER',
      'FIELDER',
    ],
    
    formations: ['CUSTOM'],
    
    eventTypes: [
      'WICKET',
      'BOUNDARY',
      'SIX',
      'MAIDEN_OVER',
      'WIDE',
      'NO_BALL',
      'BYE',
      'LEG_BYE',
      'OVERTHROW',
      'RUN_OUT',
      'CAUGHT',
      'BOWLED',
      'LBW',
      'STUMPED',
      'INJURY',
      'WEATHER_DELAY',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['BOUNDARY', 'SIX'],
    
    periods: {
      count: 2, // Innings
      durationMinutes: -1, // Overs-based, not time-based
      breakMinutes: 20,
      extraTimeEnabled: false,
      labels: ['1st Innings', '2nd Innings'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'LIVE',
      'HALFTIME', // Innings break
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
      'ABANDONED',
      'WEATHER_DELAY',
    ],
  },

  // =========================================================================
  // HOCKEY (Ice/Field)
  // =========================================================================
  HOCKEY: {
    sport: 'HOCKEY',
    name: 'Hockey',
    icon: '🏒',
    primaryColor: '#0EA5E9',
    secondaryColor: '#0284C7',
    
    scoring: {
      trackBreakdown: false,
      pointValues: { GOAL: 1 },
      labels: { GOAL: 'Goal' },
      displayLabel: 'Goals',
      maxScore: 15,
    },
    
    squad: {
      startingSize: 6, // Ice hockey: 5 + goalie
      maxSubstitutes: 14,
      maxTotalSquad: 20,
      substitutionsAllowed: -1,
      rollingSubstitutions: true,
    },
    
    positions: [
      'GOALTENDER',
      'DEFENSEMAN',
      'WINGER',
      'CENTER_HOCKEY',
    ],
    
    formations: ['CUSTOM'],
    
    eventTypes: [
      'GOAL',
      'ASSIST',
      'MINOR_PENALTY',
      'MAJOR_PENALTY',
      'POWER_PLAY_GOAL',
      'SHORTHANDED_GOAL',
      'EMPTY_NET_GOAL',
      'HAT_TRICK',
      'FIGHT',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'INJURY',
      'TIMEOUT',
      'PERIOD_START',
      'PERIOD_END',
      'OVERTIME_START',
      'SHOOTOUT_START',
    ],
    
    scoringEvents: ['GOAL', 'POWER_PLAY_GOAL', 'SHORTHANDED_GOAL', 'EMPTY_NET_GOAL'],
    
    periods: {
      count: 3,
      durationMinutes: 20,
      breakMinutes: 15,
      extraTimeEnabled: true,
      overtimeEnabled: true,
      extraTimeDuration: 5,
      labels: ['1st Period', '2nd Period', '3rd Period', 'OT', 'Shootout'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'WARMUP',
      'LIVE',
      'OVERTIME_START',
      'SHOOTOUT_START',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
    ],
  },

  // =========================================================================
  // NETBALL
  // =========================================================================
  NETBALL: {
    sport: 'NETBALL',
    name: 'Netball',
    icon: '🏐',
    primaryColor: '#EC4899',
    secondaryColor: '#DB2777',
    
    scoring: {
      trackBreakdown: false,
      pointValues: { GOAL: 1 },
      labels: { GOAL: 'Goal' },
      displayLabel: 'Goals',
      maxScore: 100,
    },
    
    squad: {
      startingSize: 7,
      maxSubstitutes: 5,
      maxTotalSquad: 12,
      substitutionsAllowed: -1,
      rollingSubstitutions: true,
    },
    
    positions: [
      'GOALKEEPER_NETBALL',
      'GOAL_DEFENSE',
      'WING_DEFENSE',
      'CENTER',
      'WING_ATTACK',
      'GOAL_ATTACK',
      'GOAL_SHOOTER',
    ],
    
    formations: ['CUSTOM'],
    
    eventTypes: [
      'GOAL',
      'CENTER_PASS',
      'OBSTRUCTION',
      'INTERCEPT',
      'REBOUND',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'INJURY',
      'TIMEOUT',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['GOAL'],
    
    periods: {
      count: 4,
      durationMinutes: 15,
      breakMinutes: 3,
      extraTimeEnabled: true,
      extraTimeDuration: 7,
      labels: ['Q1', 'Q2', 'Q3', 'Q4', 'ET'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'WARMUP',
      'LIVE',
      'HALFTIME',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
    ],
  },

  // =========================================================================
  // LACROSSE
  // =========================================================================
  LACROSSE: {
    sport: 'LACROSSE',
    name: 'Lacrosse',
    icon: '🥍',
    primaryColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
    
    scoring: {
      trackBreakdown: false,
      pointValues: { GOAL: 1 },
      labels: { GOAL: 'Goal' },
      displayLabel: 'Goals',
      maxScore: 25,
    },
    
    squad: {
      startingSize: 10,
      maxSubstitutes: 13,
      maxTotalSquad: 23,
      substitutionsAllowed: -1,
      rollingSubstitutions: true,
    },
    
    positions: [
      'GOALKEEPER',
      'DEFENSEMAN',
      'CENTRAL_MIDFIELDER',
      'ATTACKING_MIDFIELDER',
      'STRIKER',
    ],
    
    formations: ['CUSTOM'],
    
    eventTypes: [
      'GOAL',
      'ASSIST',
      'YELLOW_CARD',
      'RED_CARD',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'INJURY',
      'TIMEOUT',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['GOAL'],
    
    periods: {
      count: 4,
      durationMinutes: 15,
      breakMinutes: 2,
      extraTimeEnabled: true,
      overtimeEnabled: true,
      extraTimeDuration: 4,
      labels: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'WARMUP',
      'LIVE',
      'HALFTIME',
      'OVERTIME_START',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
    ],
  },

  // =========================================================================
  // AUSTRALIAN RULES
  // =========================================================================
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    name: 'Australian Rules Football',
    icon: '🏉',
    primaryColor: '#EAB308',
    secondaryColor: '#CA8A04',
    
    scoring: {
      trackBreakdown: true,
      pointValues: {
        GOAL: 6,
        BEHIND: 1,
      },
      labels: {
        GOAL: 'Goal',
        BEHIND: 'Behind',
      },
      displayLabel: 'Points',
      maxScore: 200,
    },
    
    squad: {
      startingSize: 18,
      maxSubstitutes: 4,
      maxTotalSquad: 22,
      substitutionsAllowed: 90, // Interchange cap
      rollingSubstitutions: true,
    },
    
    positions: [
      'FULLBACK',
      'CENTER_BACK',
      'CENTRAL_MIDFIELDER',
      'CENTER_FORWARD',
      'WINGER',
      'UTILITY',
    ],
    
    formations: ['CUSTOM'],
    
    eventTypes: [
      'GOAL',
      // Using ASSIST as 'BEHIND' proxy
      'ASSIST',
      'YELLOW_CARD',
      'RED_CARD',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'INJURY',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['GOAL', 'ASSIST'], // ASSIST used as BEHIND
    
    periods: {
      count: 4,
      durationMinutes: 20,
      breakMinutes: 6,
      extraTimeEnabled: true,
      extraTimeDuration: 5,
      labels: ['Q1', 'Q2', 'Q3', 'Q4', 'ET'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'WARMUP',
      'LIVE',
      'HALFTIME',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
    ],
  },

  // =========================================================================
  // GAELIC FOOTBALL
  // =========================================================================
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    name: 'Gaelic Football',
    icon: '🏐',
    primaryColor: '#059669',
    secondaryColor: '#047857',
    
    scoring: {
      trackBreakdown: true,
      pointValues: {
        GOAL: 3,
        POINT: 1,
      },
      labels: {
        GOAL: 'Goal',
        POINT: 'Point',
      },
      displayLabel: 'Score',
      maxScore: 50,
    },
    
    squad: {
      startingSize: 15,
      maxSubstitutes: 9,
      maxTotalSquad: 24,
      substitutionsAllowed: 5,
      rollingSubstitutions: false,
    },
    
    positions: [
      'GOALKEEPER',
      'FULLBACK',
      'CENTER_BACK',
      'CENTRAL_MIDFIELDER',
      'CENTER_FORWARD',
      'STRIKER',
    ],
    
    formations: ['CUSTOM'],
    
    eventTypes: [
      'GOAL',
      'ASSIST', // Used as Point
      'YELLOW_CARD',
      'RED_CARD',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'INJURY',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['GOAL', 'ASSIST'],
    
    periods: {
      count: 2,
      durationMinutes: 35,
      breakMinutes: 15,
      extraTimeEnabled: true,
      extraTimeDuration: 10,
      labels: ['1st Half', '2nd Half', 'ET1', 'ET2'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'WARMUP',
      'LIVE',
      'HALFTIME',
      'EXTRA_TIME_FIRST',
      'EXTRA_TIME_SECOND',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
    ],
  },

  // =========================================================================
  // FUTSAL
  // =========================================================================
  FUTSAL: {
    sport: 'FUTSAL',
    name: 'Futsal',
    icon: '⚽',
    primaryColor: '#3B82F6',
    secondaryColor: '#2563EB',
    
    scoring: {
      trackBreakdown: false,
      pointValues: { GOAL: 1 },
      labels: { GOAL: 'Goal' },
      displayLabel: 'Goals',
      maxScore: 20,
    },
    
    squad: {
      startingSize: 5,
      maxSubstitutes: 9,
      maxTotalSquad: 14,
      substitutionsAllowed: -1,
      rollingSubstitutions: true,
    },
    
    positions: [
      'GOALKEEPER',
      'DEFENDER',
      'WINGER',
      'PIVOT',
    ],
    
    formations: ['CUSTOM'],
    
    eventTypes: [
      'GOAL',
      'ASSIST',
      'YELLOW_CARD',
      'SECOND_YELLOW',
      'RED_CARD',
      'PENALTY_SCORED',
      'PENALTY_MISSED',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'INJURY',
      'TIMEOUT',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['GOAL', 'PENALTY_SCORED'],
    
    periods: {
      count: 2,
      durationMinutes: 20,
      breakMinutes: 10,
      extraTimeEnabled: true,
      extraTimeDuration: 5,
      penaltiesEnabled: true,
      labels: ['1st Half', '2nd Half', 'ET1', 'ET2', 'Penalties'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'WARMUP',
      'LIVE',
      'HALFTIME',
      'EXTRA_TIME_FIRST',
      'EXTRA_TIME_SECOND',
      'PENALTIES',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
    ],
  },

  // =========================================================================
  // BEACH FOOTBALL
  // =========================================================================
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    name: 'Beach Football',
    icon: '⚽',
    primaryColor: '#F59E0B',
    secondaryColor: '#D97706',
    
    scoring: {
      trackBreakdown: false,
      pointValues: { GOAL: 1 },
      labels: { GOAL: 'Goal' },
      displayLabel: 'Goals',
      maxScore: 15,
    },
    
    squad: {
      startingSize: 5,
      maxSubstitutes: 5,
      maxTotalSquad: 10,
      substitutionsAllowed: -1,
      rollingSubstitutions: true,
    },
    
    positions: [
      'GOALKEEPER',
      'DEFENDER',
      'WINGER',
      'STRIKER',
    ],
    
    formations: ['CUSTOM'],
    
    eventTypes: [
      'GOAL',
      'ASSIST',
      'YELLOW_CARD',
      'RED_CARD',
      'PENALTY_SCORED',
      'PENALTY_MISSED',
      'SUBSTITUTION_ON',
      'SUBSTITUTION_OFF',
      'INJURY',
      'PERIOD_START',
      'PERIOD_END',
    ],
    
    scoringEvents: ['GOAL', 'PENALTY_SCORED'],
    
    periods: {
      count: 3,
      durationMinutes: 12,
      breakMinutes: 3,
      extraTimeEnabled: true,
      extraTimeDuration: 3,
      penaltiesEnabled: true,
      labels: ['1st Period', '2nd Period', '3rd Period', 'ET', 'Penalties'],
    },
    
    matchStatuses: [
      'SCHEDULED',
      'LIVE',
      'PENALTIES',
      'FINISHED',
      'CANCELLED',
      'POSTPONED',
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get sport configuration by sport enum
 */
export function getSportConfig(sport: Sport): SportConfig {
  return SPORT_CONFIGS[sport];
}

/**
 * Get all positions for a sport
 */
export function getPositionsForSport(sport: Sport): Position[] {
  return SPORT_CONFIGS[sport].positions;
}

/**
 * Get all formations for a sport
 */
export function getFormationsForSport(sport: Sport): FormationType[] {
  return SPORT_CONFIGS[sport].formations;
}

/**
 * Get all event types for a sport
 */
export function getEventTypesForSport(sport: Sport): MatchEventType[] {
  return SPORT_CONFIGS[sport].eventTypes;
}

/**
 * Get scoring event types for a sport
 */
export function getScoringEventsForSport(sport: Sport): MatchEventType[] {
  return SPORT_CONFIGS[sport].scoringEvents;
}

/**
 * Calculate score from events for a sport
 */
export function calculateScoreFromEvents(
  sport: Sport,
  events: Array<{ eventType: MatchEventType; playerId?: string | null }>,
  teamPlayerIds: string[]
): number {
  const config = SPORT_CONFIGS[sport];
  
  return events
    .filter(
      (event) =>
        config.scoringEvents.includes(event.eventType) &&
        event.playerId &&
        teamPlayerIds.includes(event.playerId)
    )
    .reduce((total, event) => {
      const pointValue = config.scoring.pointValues[event.eventType] || 1;
      return total + pointValue;
    }, 0);
}

/**
 * Get display label for an event type
 */
export function getEventTypeLabel(eventType: MatchEventType): string {
  const labels: Record<MatchEventType, string> = {
    // Football
    GOAL: 'Goal',
    ASSIST: 'Assist',
    YELLOW_CARD: 'Yellow Card',
    SECOND_YELLOW: 'Second Yellow',
    RED_CARD: 'Red Card',
    SUBSTITUTION_ON: 'Substitution On',
    SUBSTITUTION_OFF: 'Substitution Off',
    INJURY: 'Injury',
    INJURY_TIME: 'Injury Time',
    FULLTIME: 'Full Time',
    HALFTIME: 'Half Time',
    KICKOFF: 'Kick Off',
    PENALTY_SCORED: 'Penalty Scored',
    PENALTY_MISSED: 'Penalty Missed',
    PENALTY_SAVED: 'Penalty Saved',
    OWN_GOAL: 'Own Goal',
    VAR_REVIEW: 'VAR Review',
    VAR_DECISION: 'VAR Decision',
    
    // General
    CHALLENGE_REVIEW: 'Challenge Review',
    TIMEOUT: 'Timeout',
    INTERCEPT: 'Interception',
    REBOUND: 'Rebound',
    
    // Netball
    CENTER_PASS: 'Center Pass',
    OBSTRUCTION: 'Obstruction',
    
    // Rugby
    TRY: 'Try',
    CONVERSION: 'Conversion',
    PENALTY_GOAL: 'Penalty Goal',
    DROP_GOAL: 'Drop Goal',
    SCRUM: 'Scrum',
    LINEOUT: 'Lineout',
    MAUL: 'Maul',
    RUCK: 'Ruck',
    KNOCK_ON: 'Knock On',
    HIGH_TACKLE: 'High Tackle',
    OFFSIDE: 'Offside',
    SIN_BIN: 'Sin Bin',
    YELLOW_CARD_RUGBY: 'Yellow Card',
    RED_CARD_RUGBY: 'Red Card',
    
    // Cricket
    WICKET: 'Wicket',
    BOUNDARY: 'Boundary',
    SIX: 'Six',
    MAIDEN_OVER: 'Maiden Over',
    WIDE: 'Wide',
    NO_BALL: 'No Ball',
    BYE: 'Bye',
    LEG_BYE: 'Leg Bye',
    OVERTHROW: 'Overthrow',
    RUN_OUT: 'Run Out',
    CAUGHT: 'Caught',
    BOWLED: 'Bowled',
    LBW: 'LBW',
    STUMPED: 'Stumped',
    
    // Basketball
    THREE_POINTER: '3-Pointer',
    TWO_POINTER: '2-Pointer',
    FREE_THROW_MADE: 'Free Throw Made',
    FREE_THROW_MISSED: 'Free Throw Missed',
    FAST_BREAK: 'Fast Break',
    TURNOVER: 'Turnover',
    OFFENSIVE_FOUL: 'Offensive Foul',
    DEFENSIVE_FOUL: 'Defensive Foul',
    TRAVEL: 'Travel',
    DOUBLE_DRIBBLE: 'Double Dribble',
    BLOCK: 'Block',
    STEAL: 'Steal',
    DUNK: 'Dunk',
    ALLEY_OOP: 'Alley-Oop',
    
    // American Football
    TOUCHDOWN: 'Touchdown',
    FIELD_GOAL: 'Field Goal',
    SAFETY_SCORE: 'Safety',
    INTERCEPTION: 'Interception',
    FUMBLE: 'Fumble',
    SACK: 'Sack',
    TWO_POINT_CONVERSION: '2-Point Conversion',
    EXTRA_POINT: 'Extra Point',
    PUNT: 'Punt',
    KICKOFF_RETURN: 'Kickoff Return',
    FAIR_CATCH: 'Fair Catch',
    
    // Hockey
    HAT_TRICK: 'Hat Trick',
    MAJOR_PENALTY: 'Major Penalty',
    MINOR_PENALTY: 'Minor Penalty',
    FIGHT: 'Fight',
    POWER_PLAY_GOAL: 'Power Play Goal',
    SHORTHANDED_GOAL: 'Shorthanded Goal',
    EMPTY_NET_GOAL: 'Empty Net Goal',
    
    // General
    CAPTAIN_CHANGE: 'Captain Change',
    WEATHER_DELAY: 'Weather Delay',
    FLOODLIGHT_FAILURE: 'Floodlight Failure',
    PERIOD_START: 'Period Start',
    PERIOD_END: 'Period End',
    OVERTIME_START: 'Overtime Start',
    SHOOTOUT_START: 'Shootout Start',
  };
  
  return labels[eventType] || eventType.replace(/_/g, ' ');
}

/**
 * Get icon/emoji for an event type
 */
export function getEventTypeIcon(eventType: MatchEventType): string {
  const icons: Partial<Record<MatchEventType, string>> = {
    GOAL: '⚽',
    TRY: '🏉',
    TOUCHDOWN: '🏈',
    THREE_POINTER: '🏀',
    WICKET: '🏏',
    YELLOW_CARD: '🟨',
    RED_CARD: '🟥',
    SUBSTITUTION_ON: '🔄',
    SUBSTITUTION_OFF: '🔄',
    INJURY: '🏥',
    PENALTY_SCORED: '⚽',
    PENALTY_MISSED: '❌',
    VAR_REVIEW: '📺',
    TIMEOUT: '⏱️',
    ASSIST: '👟',
    OWN_GOAL: '😬',
    HAT_TRICK: '🎩',
  };
  
  return icons[eventType] || '📋';
}

/**
 * Get sport icon
 */
export function getSportIcon(sport: Sport): string {
  return SPORT_CONFIGS[sport].icon;
}

/**
 * Get sport display name
 */
export function getSportDisplayName(sport: Sport): string {
  return SPORT_CONFIGS[sport].name;
}

/**
 * Format score display for a sport (handles breakdown vs simple)
 */
export function formatScoreDisplay(
  sport: Sport,
  homeScore: number,
  awayScore: number,
  homeBreakdown?: Record<string, number>,
  awayBreakdown?: Record<string, number>
): { home: string; away: string; label: string } {
  const config = SPORT_CONFIGS[sport];
  
  if (config.scoring.trackBreakdown && homeBreakdown && awayBreakdown) {
    // For sports like Rugby, Gaelic Football with detailed breakdown
    if (sport === 'GAELIC_FOOTBALL') {
      const homeGoals = homeBreakdown.GOAL || 0;
      const homePoints = homeBreakdown.POINT || 0;
      const awayGoals = awayBreakdown.GOAL || 0;
      const awayPoints = awayBreakdown.POINT || 0;
      return {
        home: `${homeGoals}-${homePoints} (${homeScore})`,
        away: `${awayGoals}-${awayPoints} (${awayScore})`,
        label: 'Goals-Points (Total)',
      };
    }
  }
  
  return {
    home: homeScore.toString(),
    away: awayScore.toString(),
    label: config.scoring.displayLabel,
  };
}
