// ============================================================================
// src/lib/analytics/sport-metrics.ts
// 🏆 PitchConnect Enterprise Analytics - Multi-Sport Metrics
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// SUPPORTS: All 12 sports in PitchConnect platform
// ============================================================================

import type { Sport, Position } from '@prisma/client';

// ============================================================================
// SPORT METRIC CONFIGURATIONS
// ============================================================================

/**
 * Sport-specific metric definitions for analytics calculations
 */
export interface SportMetricConfig {
  sport: Sport;
  displayName: string;
  
  // Key performance indicators for this sport
  keyMetrics: string[];
  
  // Position value multipliers for market value
  positionValueMultipliers: Record<string, number>;
  
  // Age curve peak and decline
  ageCurve: {
    peakAgeStart: number;
    peakAgeEnd: number;
    earlyCareerEnd: number;
    declineStart: number;
  };
  
  // Injury risk factors by position
  positionInjuryRisk: Record<string, number>;
  
  // Performance rating weights
  ratingWeights: {
    goals: number;
    assists: number;
    minutesPlayed: number;
    consistency: number;
    sportSpecific: number;
  };
  
  // Formation configurations
  formations: Record<string, string[]>;
  
  // Position categories
  positionCategories: {
    category: string;
    positions: string[];
    importance: number;
  }[];
}

// ============================================================================
// SPORT CONFIGURATIONS
// ============================================================================

export const SPORT_METRIC_CONFIGS: Record<Sport, SportMetricConfig> = {
  // ==========================================================================
  // FOOTBALL / SOCCER
  // ==========================================================================
  FOOTBALL: {
    sport: 'FOOTBALL',
    displayName: 'Football',
    keyMetrics: [
      'goals', 'assists', 'passAccuracy', 'shotsOnTarget', 'tackles',
      'interceptions', 'cleanSheets', 'saves', 'dribbles', 'aerialDuels',
    ],
    positionValueMultipliers: {
      STRIKER: 1.5,
      CENTRE_FORWARD: 1.4,
      LEFT_WINGER: 1.3,
      RIGHT_WINGER: 1.3,
      ATTACKING_MIDFIELDER: 1.25,
      CENTRAL_MIDFIELDER: 1.0,
      DEFENSIVE_MIDFIELDER: 0.9,
      CENTRE_BACK: 0.85,
      LEFT_BACK: 0.8,
      RIGHT_BACK: 0.8,
      GOALKEEPER: 0.7,
    },
    ageCurve: {
      peakAgeStart: 25,
      peakAgeEnd: 29,
      earlyCareerEnd: 23,
      declineStart: 32,
    },
    positionInjuryRisk: {
      STRIKER: 0.7,
      CENTRAL_MIDFIELDER: 0.65,
      DEFENSIVE_MIDFIELDER: 0.7,
      CENTRE_BACK: 0.6,
      LEFT_BACK: 0.75,
      RIGHT_BACK: 0.75,
      GOALKEEPER: 0.4,
      LEFT_WINGER: 0.8,
      RIGHT_WINGER: 0.8,
    },
    ratingWeights: {
      goals: 0.3,
      assists: 0.2,
      minutesPlayed: 0.15,
      consistency: 0.2,
      sportSpecific: 0.15,
    },
    formations: {
      '4-3-3': ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'],
      '4-4-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
      '4-2-3-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CDM', 'RW', 'CAM', 'LW', 'ST'],
      '3-5-2': ['GK', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'CAM', 'LWB', 'ST', 'ST'],
      '5-3-2': ['GK', 'RWB', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'CM', 'ST', 'ST'],
      '4-1-4-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'RM', 'CM', 'CM', 'LM', 'ST'],
    },
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER'], importance: 15 },
      { category: 'Defense', positions: ['LEFT_BACK', 'RIGHT_BACK', 'CENTRE_BACK', 'SWEEPER'], importance: 25 },
      { category: 'Midfield', positions: ['DEFENSIVE_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'ATTACKING_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER'], importance: 30 },
      { category: 'Attack', positions: ['STRIKER', 'CENTRE_FORWARD', 'LEFT_WINGER', 'RIGHT_WINGER', 'SECOND_STRIKER'], importance: 30 },
    ],
  },

  // ==========================================================================
  // RUGBY
  // ==========================================================================
  RUGBY: {
    sport: 'RUGBY',
    displayName: 'Rugby',
    keyMetrics: [
      'tries', 'conversions', 'penalties', 'tackles', 'carries',
      'metersGained', 'offloads', 'turnoversWon', 'lineoutWins', 'scrumWins',
    ],
    positionValueMultipliers: {
      FLY_HALF: 1.4,
      SCRUM_HALF: 1.3,
      FULL_BACK: 1.2,
      WINGER: 1.1,
      INSIDE_CENTRE: 1.0,
      OUTSIDE_CENTRE: 1.0,
      NUMBER_EIGHT: 1.0,
      OPENSIDE_FLANKER: 0.95,
      BLINDSIDE_FLANKER: 0.9,
      LOCK: 0.85,
      HOOKER: 0.85,
      LOOSEHEAD_PROP: 0.8,
      TIGHTHEAD_PROP: 0.8,
    },
    ageCurve: {
      peakAgeStart: 26,
      peakAgeEnd: 31,
      earlyCareerEnd: 24,
      declineStart: 33,
    },
    positionInjuryRisk: {
      LOOSEHEAD_PROP: 0.85,
      HOOKER: 0.8,
      TIGHTHEAD_PROP: 0.85,
      LOCK: 0.75,
      BLINDSIDE_FLANKER: 0.8,
      OPENSIDE_FLANKER: 0.8,
      NUMBER_EIGHT: 0.75,
      SCRUM_HALF: 0.65,
      FLY_HALF: 0.7,
      INSIDE_CENTRE: 0.75,
      OUTSIDE_CENTRE: 0.7,
      WINGER: 0.65,
      FULL_BACK: 0.6,
    },
    ratingWeights: {
      goals: 0.15, // Tries/points
      assists: 0.15,
      minutesPlayed: 0.2,
      consistency: 0.25,
      sportSpecific: 0.25, // Tackles, carries, etc.
    },
    formations: {
      '15v15': ['FB', 'RW', 'OC', 'IC', 'LW', 'FH', 'SH', 'N8', 'OF', 'BF', 'L', 'L', 'TH', 'H', 'LH'],
    },
    positionCategories: [
      { category: 'Front Row', positions: ['LOOSEHEAD_PROP', 'HOOKER', 'TIGHTHEAD_PROP'], importance: 20 },
      { category: 'Second Row', positions: ['LOCK'], importance: 15 },
      { category: 'Back Row', positions: ['BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER', 'NUMBER_EIGHT'], importance: 20 },
      { category: 'Half Backs', positions: ['SCRUM_HALF', 'FLY_HALF'], importance: 20 },
      { category: 'Backs', positions: ['INSIDE_CENTRE', 'OUTSIDE_CENTRE', 'WINGER', 'FULL_BACK'], importance: 25 },
    ],
  },

  // ==========================================================================
  // CRICKET
  // ==========================================================================
  CRICKET: {
    sport: 'CRICKET',
    displayName: 'Cricket',
    keyMetrics: [
      'runs', 'wickets', 'battingAverage', 'bowlingAverage', 'strikeRate',
      'economyRate', 'centuries', 'fifties', 'catches', 'stumpings',
    ],
    positionValueMultipliers: {
      ALL_ROUNDER: 1.5,
      OPENING_BATTER: 1.3,
      MIDDLE_ORDER_BATTER: 1.1,
      WICKET_KEEPER: 1.2,
      FAST_BOWLER: 1.1,
      SPIN_BOWLER: 1.0,
    },
    ageCurve: {
      peakAgeStart: 27,
      peakAgeEnd: 33,
      earlyCareerEnd: 25,
      declineStart: 35,
    },
    positionInjuryRisk: {
      FAST_BOWLER: 0.9,
      ALL_ROUNDER: 0.7,
      WICKET_KEEPER: 0.6,
      OPENING_BATTER: 0.5,
      MIDDLE_ORDER_BATTER: 0.4,
      SPIN_BOWLER: 0.5,
    },
    ratingWeights: {
      goals: 0.35, // Runs/wickets
      assists: 0.1,
      minutesPlayed: 0.15,
      consistency: 0.25,
      sportSpecific: 0.15,
    },
    formations: {
      '11v11': ['WK', 'OP1', 'OP2', 'MO1', 'MO2', 'MO3', 'AR', 'FB1', 'FB2', 'SB1', 'SB2'],
    },
    positionCategories: [
      { category: 'Wicket Keeper', positions: ['WICKET_KEEPER'], importance: 15 },
      { category: 'Batters', positions: ['OPENING_BATTER', 'MIDDLE_ORDER_BATTER'], importance: 35 },
      { category: 'All-Rounders', positions: ['ALL_ROUNDER'], importance: 20 },
      { category: 'Bowlers', positions: ['FAST_BOWLER', 'SPIN_BOWLER'], importance: 30 },
    ],
  },

  // ==========================================================================
  // BASKETBALL
  // ==========================================================================
  BASKETBALL: {
    sport: 'BASKETBALL',
    displayName: 'Basketball',
    keyMetrics: [
      'points', 'rebounds', 'assists', 'steals', 'blocks',
      'fieldGoalPct', 'threePointPct', 'freeThrowPct', 'turnovers', 'plusMinus',
    ],
    positionValueMultipliers: {
      POINT_GUARD: 1.3,
      SHOOTING_GUARD: 1.2,
      SMALL_FORWARD: 1.15,
      POWER_FORWARD: 1.1,
      CENTER: 1.0,
    },
    ageCurve: {
      peakAgeStart: 25,
      peakAgeEnd: 30,
      earlyCareerEnd: 23,
      declineStart: 33,
    },
    positionInjuryRisk: {
      POINT_GUARD: 0.7,
      SHOOTING_GUARD: 0.65,
      SMALL_FORWARD: 0.7,
      POWER_FORWARD: 0.75,
      CENTER: 0.7,
    },
    ratingWeights: {
      goals: 0.35, // Points
      assists: 0.2,
      minutesPlayed: 0.15,
      consistency: 0.15,
      sportSpecific: 0.15, // Rebounds, blocks, etc.
    },
    formations: {
      '5v5': ['PG', 'SG', 'SF', 'PF', 'C'],
    },
    positionCategories: [
      { category: 'Guards', positions: ['POINT_GUARD', 'SHOOTING_GUARD'], importance: 40 },
      { category: 'Forwards', positions: ['SMALL_FORWARD', 'POWER_FORWARD'], importance: 35 },
      { category: 'Center', positions: ['CENTER'], importance: 25 },
    ],
  },

  // ==========================================================================
  // AMERICAN FOOTBALL
  // ==========================================================================
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    displayName: 'American Football',
    keyMetrics: [
      'passingYards', 'rushingYards', 'receivingYards', 'touchdowns',
      'interceptions', 'completionPct', 'sacks', 'tackles', 'fumbles',
    ],
    positionValueMultipliers: {
      QUARTERBACK: 2.0,
      WIDE_RECEIVER: 1.3,
      RUNNING_BACK: 1.2,
      TIGHT_END: 1.0,
      OFFENSIVE_TACKLE: 0.9,
      GUARD: 0.85,
      CENTER_NFL: 0.85,
      DEFENSIVE_END: 1.1,
      LINEBACKER: 1.0,
      CORNERBACK: 1.1,
      SAFETY: 0.95,
    },
    ageCurve: {
      peakAgeStart: 25,
      peakAgeEnd: 30,
      earlyCareerEnd: 24,
      declineStart: 32,
    },
    positionInjuryRisk: {
      QUARTERBACK: 0.7,
      RUNNING_BACK: 0.85,
      WIDE_RECEIVER: 0.7,
      TIGHT_END: 0.75,
      OFFENSIVE_TACKLE: 0.7,
      LINEBACKER: 0.8,
      CORNERBACK: 0.65,
      SAFETY: 0.7,
    },
    ratingWeights: {
      goals: 0.35, // Touchdowns/yards
      assists: 0.1,
      minutesPlayed: 0.15,
      consistency: 0.2,
      sportSpecific: 0.2,
    },
    formations: {
      '11v11-offense': ['QB', 'RB', 'FB', 'WR', 'WR', 'TE', 'OT', 'OG', 'C', 'OG', 'OT'],
      '11v11-defense': ['DE', 'DT', 'DT', 'DE', 'LB', 'LB', 'LB', 'CB', 'CB', 'S', 'S'],
    },
    positionCategories: [
      { category: 'Quarterback', positions: ['QUARTERBACK'], importance: 25 },
      { category: 'Skill Players', positions: ['RUNNING_BACK', 'WIDE_RECEIVER', 'TIGHT_END'], importance: 30 },
      { category: 'Offensive Line', positions: ['OFFENSIVE_TACKLE', 'GUARD', 'CENTER_NFL'], importance: 20 },
      { category: 'Defense', positions: ['DEFENSIVE_END', 'DEFENSIVE_TACKLE', 'LINEBACKER', 'CORNERBACK', 'SAFETY'], importance: 25 },
    ],
  },

  // ==========================================================================
  // NETBALL
  // ==========================================================================
  NETBALL: {
    sport: 'NETBALL',
    displayName: 'Netball',
    keyMetrics: [
      'goals', 'goalAttempts', 'goalPercentage', 'feeds', 'centrePassReceives',
      'intercepts', 'deflections', 'rebounds', 'penalties',
    ],
    positionValueMultipliers: {
      GOAL_SHOOTER: 1.3,
      GOAL_ATTACK: 1.25,
      WING_ATTACK: 1.1,
      CENTRE: 1.15,
      WING_DEFENCE: 1.0,
      GOAL_DEFENCE: 1.1,
      GOAL_KEEPER: 1.1,
    },
    ageCurve: {
      peakAgeStart: 24,
      peakAgeEnd: 30,
      earlyCareerEnd: 22,
      declineStart: 32,
    },
    positionInjuryRisk: {
      GOAL_SHOOTER: 0.65,
      GOAL_ATTACK: 0.7,
      WING_ATTACK: 0.65,
      CENTRE: 0.7,
      WING_DEFENCE: 0.65,
      GOAL_DEFENCE: 0.7,
      GOAL_KEEPER: 0.65,
    },
    ratingWeights: {
      goals: 0.35,
      assists: 0.2,
      minutesPlayed: 0.15,
      consistency: 0.15,
      sportSpecific: 0.15,
    },
    formations: {
      '7v7': ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'],
    },
    positionCategories: [
      { category: 'Shooters', positions: ['GOAL_SHOOTER', 'GOAL_ATTACK'], importance: 35 },
      { category: 'Mid Court', positions: ['WING_ATTACK', 'CENTRE', 'WING_DEFENCE'], importance: 35 },
      { category: 'Defenders', positions: ['GOAL_DEFENCE', 'GOAL_KEEPER'], importance: 30 },
    ],
  },

  // ==========================================================================
  // HOCKEY (Ice/Field)
  // ==========================================================================
  HOCKEY: {
    sport: 'HOCKEY',
    displayName: 'Hockey',
    keyMetrics: [
      'goals', 'assists', 'points', 'plusMinus', 'shots',
      'shootingPct', 'faceoffWins', 'blockedShots', 'hits', 'saves',
    ],
    positionValueMultipliers: {
      CENTER_HOCKEY: 1.3,
      LEFT_WING: 1.2,
      RIGHT_WING: 1.2,
      DEFENSEMAN: 1.0,
      GOALTENDER: 1.1,
    },
    ageCurve: {
      peakAgeStart: 25,
      peakAgeEnd: 30,
      earlyCareerEnd: 23,
      declineStart: 33,
    },
    positionInjuryRisk: {
      CENTER_HOCKEY: 0.75,
      LEFT_WING: 0.7,
      RIGHT_WING: 0.7,
      DEFENSEMAN: 0.8,
      GOALTENDER: 0.6,
    },
    ratingWeights: {
      goals: 0.3,
      assists: 0.25,
      minutesPlayed: 0.15,
      consistency: 0.15,
      sportSpecific: 0.15,
    },
    formations: {
      'standard': ['G', 'LD', 'RD', 'LW', 'C', 'RW'],
    },
    positionCategories: [
      { category: 'Goaltender', positions: ['GOALTENDER'], importance: 25 },
      { category: 'Defense', positions: ['DEFENSEMAN'], importance: 30 },
      { category: 'Forwards', positions: ['CENTER_HOCKEY', 'LEFT_WING', 'RIGHT_WING'], importance: 45 },
    ],
  },

  // ==========================================================================
  // LACROSSE
  // ==========================================================================
  LACROSSE: {
    sport: 'LACROSSE',
    displayName: 'Lacrosse',
    keyMetrics: [
      'goals', 'assists', 'groundBalls', 'faceoffWins', 'shots',
      'shotPct', 'saves', 'turnovers', 'causedTurnovers',
    ],
    positionValueMultipliers: {
      ATTACKER_LACROSSE: 1.25,
      MIDFIELDER_LACROSSE: 1.15,
      DEFENDER_LACROSSE: 1.0,
      GOALKEEPER: 1.1,
    },
    ageCurve: {
      peakAgeStart: 24,
      peakAgeEnd: 29,
      earlyCareerEnd: 22,
      declineStart: 31,
    },
    positionInjuryRisk: {
      ATTACKER_LACROSSE: 0.7,
      MIDFIELDER_LACROSSE: 0.75,
      DEFENDER_LACROSSE: 0.7,
      GOALKEEPER: 0.55,
    },
    ratingWeights: {
      goals: 0.3,
      assists: 0.2,
      minutesPlayed: 0.15,
      consistency: 0.2,
      sportSpecific: 0.15,
    },
    formations: {
      'standard': ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
    },
    positionCategories: [
      { category: 'Goalie', positions: ['GOALKEEPER'], importance: 20 },
      { category: 'Defense', positions: ['DEFENDER_LACROSSE'], importance: 25 },
      { category: 'Midfield', positions: ['MIDFIELDER_LACROSSE'], importance: 30 },
      { category: 'Attack', positions: ['ATTACKER_LACROSSE'], importance: 25 },
    ],
  },

  // ==========================================================================
  // AUSTRALIAN RULES
  // ==========================================================================
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    displayName: 'Australian Rules Football',
    keyMetrics: [
      'goals', 'behinds', 'disposals', 'kicks', 'handballs',
      'marks', 'tackles', 'hitouts', 'clearances', 'inside50s',
    ],
    positionValueMultipliers: {
      FULL_FORWARD: 1.3,
      HALF_FORWARD: 1.15,
      RUCK: 1.2,
      RUCK_ROVER: 1.15,
      ROVER: 1.1,
      CENTRE_MIDFIELDER: 1.25,
      HALF_BACK_AFL: 1.0,
      FULL_BACK_AFL: 1.0,
    },
    ageCurve: {
      peakAgeStart: 25,
      peakAgeEnd: 30,
      earlyCareerEnd: 23,
      declineStart: 32,
    },
    positionInjuryRisk: {
      FULL_FORWARD: 0.7,
      HALF_FORWARD: 0.7,
      RUCK: 0.8,
      CENTRE_MIDFIELDER: 0.75,
      HALF_BACK_AFL: 0.7,
      FULL_BACK_AFL: 0.65,
    },
    ratingWeights: {
      goals: 0.25,
      assists: 0.15,
      minutesPlayed: 0.15,
      consistency: 0.2,
      sportSpecific: 0.25,
    },
    formations: {
      '18v18': ['FB', 'BP', 'BP', 'HB', 'HB', 'HB', 'WI', 'C', 'WI', 'HF', 'HF', 'HF', 'FP', 'FF', 'FP', 'R', 'RR', 'ROV'],
    },
    positionCategories: [
      { category: 'Forwards', positions: ['FULL_FORWARD', 'HALF_FORWARD'], importance: 25 },
      { category: 'Midfield', positions: ['RUCK', 'RUCK_ROVER', 'ROVER', 'CENTRE_MIDFIELDER'], importance: 35 },
      { category: 'Defenders', positions: ['HALF_BACK_AFL', 'FULL_BACK_AFL'], importance: 25 },
      { category: 'Wings', positions: [], importance: 15 },
    ],
  },

  // ==========================================================================
  // GAELIC FOOTBALL
  // ==========================================================================
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    displayName: 'Gaelic Football',
    keyMetrics: [
      'goals', 'points', 'totalScore', 'frees', 'kickouts',
      'tackles', 'turnoversWon', 'marks', 'solos',
    ],
    positionValueMultipliers: {
      FULL_FORWARD_GAA: 1.3,
      CORNER_FORWARD: 1.2,
      HALF_FORWARD_GAA: 1.15,
      MIDFIELDER_GAA: 1.2,
      CENTRE_BACK: 1.1,
      WING_BACK: 1.0,
      FULL_BACK: 1.0,
      CORNER_BACK: 0.95,
      GOALKEEPER: 0.9,
    },
    ageCurve: {
      peakAgeStart: 24,
      peakAgeEnd: 30,
      earlyCareerEnd: 22,
      declineStart: 32,
    },
    positionInjuryRisk: {
      GOALKEEPER: 0.5,
      CORNER_BACK: 0.65,
      FULL_BACK: 0.7,
      WING_BACK: 0.7,
      CENTRE_BACK: 0.7,
      MIDFIELDER_GAA: 0.75,
      HALF_FORWARD_GAA: 0.7,
      CORNER_FORWARD: 0.65,
      FULL_FORWARD_GAA: 0.7,
    },
    ratingWeights: {
      goals: 0.3,
      assists: 0.15,
      minutesPlayed: 0.15,
      consistency: 0.2,
      sportSpecific: 0.2,
    },
    formations: {
      '15v15': ['GK', 'CB', 'CB', 'CB', 'HB', 'HB', 'HB', 'MF', 'MF', 'HF', 'HF', 'HF', 'CF', 'FF', 'CF'],
    },
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER'], importance: 10 },
      { category: 'Full Back Line', positions: ['FULL_BACK', 'CORNER_BACK'], importance: 20 },
      { category: 'Half Back Line', positions: ['CENTRE_BACK', 'WING_BACK'], importance: 20 },
      { category: 'Midfield', positions: ['MIDFIELDER_GAA'], importance: 20 },
      { category: 'Forwards', positions: ['HALF_FORWARD_GAA', 'CORNER_FORWARD', 'FULL_FORWARD_GAA'], importance: 30 },
    ],
  },

  // ==========================================================================
  // FUTSAL
  // ==========================================================================
  FUTSAL: {
    sport: 'FUTSAL',
    displayName: 'Futsal',
    keyMetrics: [
      'goals', 'assists', 'shots', 'shotsOnTarget', 'passes',
      'passAccuracy', 'tackles', 'interceptions', 'saves',
    ],
    positionValueMultipliers: {
      STRIKER: 1.4,
      CENTRAL_MIDFIELDER: 1.2,
      CENTRE_BACK: 1.0,
      GOALKEEPER: 0.9,
    },
    ageCurve: {
      peakAgeStart: 25,
      peakAgeEnd: 31,
      earlyCareerEnd: 23,
      declineStart: 33,
    },
    positionInjuryRisk: {
      GOALKEEPER: 0.5,
      CENTRE_BACK: 0.65,
      CENTRAL_MIDFIELDER: 0.7,
      STRIKER: 0.7,
    },
    ratingWeights: {
      goals: 0.35,
      assists: 0.25,
      minutesPlayed: 0.1,
      consistency: 0.15,
      sportSpecific: 0.15,
    },
    formations: {
      '1-2-1': ['GK', 'D', 'M', 'M', 'F'],
      '2-2': ['GK', 'D', 'D', 'F', 'F'],
    },
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER'], importance: 20 },
      { category: 'Defense', positions: ['CENTRE_BACK'], importance: 25 },
      { category: 'Midfield', positions: ['CENTRAL_MIDFIELDER'], importance: 30 },
      { category: 'Attack', positions: ['STRIKER'], importance: 25 },
    ],
  },

  // ==========================================================================
  // BEACH FOOTBALL
  // ==========================================================================
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    displayName: 'Beach Football',
    keyMetrics: [
      'goals', 'assists', 'shots', 'passes', 'tackles',
      'saves', 'bicycleKicks', 'scissors',
    ],
    positionValueMultipliers: {
      STRIKER: 1.5,
      CENTRE_FORWARD: 1.3,
      GOALKEEPER: 1.0,
    },
    ageCurve: {
      peakAgeStart: 25,
      peakAgeEnd: 32,
      earlyCareerEnd: 23,
      declineStart: 34,
    },
    positionInjuryRisk: {
      GOALKEEPER: 0.55,
      STRIKER: 0.65,
      CENTRE_FORWARD: 0.6,
    },
    ratingWeights: {
      goals: 0.4,
      assists: 0.2,
      minutesPlayed: 0.1,
      consistency: 0.15,
      sportSpecific: 0.15,
    },
    formations: {
      '1-2-1': ['GK', 'D', 'M', 'F'],
      '2-1': ['GK', 'D', 'D', 'F'],
    },
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER'], importance: 25 },
      { category: 'Outfield', positions: ['STRIKER', 'CENTRE_FORWARD'], importance: 75 },
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get sport configuration
 */
export function getSportMetricConfig(sport: Sport): SportMetricConfig {
  return SPORT_METRIC_CONFIGS[sport];
}

/**
 * Get position value multiplier for market value calculation
 */
export function getPositionValueMultiplier(sport: Sport, position: Position | string): number {
  const config = SPORT_METRIC_CONFIGS[sport];
  return config.positionValueMultipliers[position] || 1.0;
}

/**
 * Get age adjustment factor for market value
 */
export function getAgeAdjustmentFactor(sport: Sport, age: number): number {
  const curve = SPORT_METRIC_CONFIGS[sport].ageCurve;
  
  if (age < curve.earlyCareerEnd) {
    // Young player premium
    return 1.15 - ((curve.earlyCareerEnd - age) * 0.02);
  } else if (age >= curve.peakAgeStart && age <= curve.peakAgeEnd) {
    // Peak years - full value
    return 1.0;
  } else if (age > curve.peakAgeEnd && age < curve.declineStart) {
    // Post-peak but not declining
    return 1.0 - ((age - curve.peakAgeEnd) * 0.02);
  } else if (age >= curve.declineStart) {
    // Declining phase
    return Math.max(0.5, 0.9 - ((age - curve.declineStart) * 0.05));
  }
  
  return 1.0;
}

/**
 * Get position injury risk factor
 */
export function getPositionInjuryRisk(sport: Sport, position: Position | string): number {
  const config = SPORT_METRIC_CONFIGS[sport];
  return config.positionInjuryRisk[position] || 0.5;
}

/**
 * Get available formations for a sport
 */
export function getFormationsForSport(sport: Sport): Record<string, string[]> {
  return SPORT_METRIC_CONFIGS[sport].formations;
}

/**
 * Get key metrics for a sport
 */
export function getKeyMetricsForSport(sport: Sport): string[] {
  return SPORT_METRIC_CONFIGS[sport].keyMetrics;
}

/**
 * Get rating weights for a sport
 */
export function getRatingWeights(sport: Sport): SportMetricConfig['ratingWeights'] {
  return SPORT_METRIC_CONFIGS[sport].ratingWeights;
}

/**
 * Check if sport is supported
 */
export function isSportSupported(sport: string): sport is Sport {
  return sport in SPORT_METRIC_CONFIGS;
}

/**
 * Get all supported sports
 */
export function getSupportedSports(): Sport[] {
  return Object.keys(SPORT_METRIC_CONFIGS) as Sport[];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SPORT_METRIC_CONFIGS;