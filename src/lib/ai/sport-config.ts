// ============================================================================
// src/lib/ai/sport-config.ts
// 🏆 PitchConnect Enterprise AI - Multi-Sport Configuration
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// SUPPORTS: All 12 sports in PitchConnect platform
// ============================================================================

import type { Sport, Position } from '@prisma/client';
import type { SportPredictionConfig } from './types';

// ============================================================================
// SPORT PREDICTION CONFIGURATIONS
// ============================================================================

/**
 * Complete sport configurations for prediction algorithms
 * Each sport has customized weights, metrics, and position categories
 */
export const SPORT_PREDICTION_CONFIGS: Record<Sport, SportPredictionConfig> = {
  // ==========================================================================
  // FOOTBALL / SOCCER
  // ==========================================================================
  FOOTBALL: {
    sport: 'FOOTBALL',
    displayName: 'Football',
    scoring: {
      maxPointsPerMatch: 3,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
    },
    match: {
      standardDuration: 90,
      hasExtraTime: true,
      hasPenalties: true,
      hasOvertimePeriods: false,
      periodsCount: 2,
    },
    weights: {
      recentForm: 25,
      headToHead: 10,
      homeAdvantage: 15,
      squadStrength: 20,
      injuryImpact: 15,
      restDays: 8,
      competitionImportance: 7,
    },
    keyMetrics: [
      'expectedGoals', 'expectedAssists', 'passCompletionRate',
      'pressureSuccessRate', 'tackleSuccessRate', 'shotAccuracy',
      'cleanSheets', 'goalsConceded', 'possessionPercentage',
    ],
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER'], importanceWeight: 15 },
      { category: 'Defense', positions: ['LEFT_BACK', 'RIGHT_BACK', 'CENTRE_BACK', 'SWEEPER'], importanceWeight: 25 },
      { category: 'Midfield', positions: ['DEFENSIVE_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'ATTACKING_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER'], importanceWeight: 30 },
      { category: 'Attack', positions: ['STRIKER', 'CENTRE_FORWARD', 'LEFT_WINGER', 'RIGHT_WINGER', 'SECOND_STRIKER'], importanceWeight: 30 },
    ],
  },

  // ==========================================================================
  // FUTSAL
  // ==========================================================================
  FUTSAL: {
    sport: 'FUTSAL',
    displayName: 'Futsal',
    scoring: {
      maxPointsPerMatch: 3,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
    },
    match: {
      standardDuration: 40,
      hasExtraTime: true,
      hasPenalties: true,
      hasOvertimePeriods: false,
      periodsCount: 2,
    },
    weights: {
      recentForm: 28,
      headToHead: 8,
      homeAdvantage: 12,
      squadStrength: 22,
      injuryImpact: 18,
      restDays: 7,
      competitionImportance: 5,
    },
    keyMetrics: [
      'goalsPerMatch', 'assistsPerMatch', 'shotAccuracy',
      'possessionPercentage', 'tackleSuccessRate', 'savePercentage',
    ],
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER'], importanceWeight: 20 },
      { category: 'Defense', positions: ['CENTRE_BACK'], importanceWeight: 25 },
      { category: 'Midfield', positions: ['CENTRAL_MIDFIELDER'], importanceWeight: 30 },
      { category: 'Attack', positions: ['STRIKER'], importanceWeight: 25 },
    ],
  },

  // ==========================================================================
  // BEACH FOOTBALL
  // ==========================================================================
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    displayName: 'Beach Football',
    scoring: {
      maxPointsPerMatch: 3,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
    },
    match: {
      standardDuration: 36,
      hasExtraTime: true,
      hasPenalties: true,
      hasOvertimePeriods: false,
      periodsCount: 3,
    },
    weights: {
      recentForm: 30,
      headToHead: 8,
      homeAdvantage: 10,
      squadStrength: 25,
      injuryImpact: 15,
      restDays: 7,
      competitionImportance: 5,
    },
    keyMetrics: [
      'goalsPerMatch', 'assistsPerMatch', 'shotAccuracy',
      'bicycleKicks', 'volleyGoals', 'savePercentage',
    ],
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER'], importanceWeight: 25 },
      { category: 'Outfield', positions: ['STRIKER', 'CENTRE_FORWARD'], importanceWeight: 75 },
    ],
  },

  // ==========================================================================
  // RUGBY
  // ==========================================================================
  RUGBY: {
    sport: 'RUGBY',
    displayName: 'Rugby',
    scoring: {
      maxPointsPerMatch: 5,
      winPoints: 4,
      drawPoints: 2,
      lossPoints: 0,
      bonusPointsAvailable: true, // Try bonus, losing bonus
    },
    match: {
      standardDuration: 80,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: true,
      periodsCount: 2,
    },
    weights: {
      recentForm: 22,
      headToHead: 12,
      homeAdvantage: 18,
      squadStrength: 22,
      injuryImpact: 12,
      restDays: 8,
      competitionImportance: 6,
    },
    keyMetrics: [
      'triesScored', 'conversionsRate', 'penaltySuccessRate',
      'lineoutWinRate', 'scrumWinRate', 'tackleCompletionRate',
      'metersGained', 'turnoversWon', 'offloads',
    ],
    positionCategories: [
      { category: 'Front Row', positions: ['LOOSEHEAD_PROP', 'HOOKER', 'TIGHTHEAD_PROP'], importanceWeight: 20 },
      { category: 'Second Row', positions: ['LOCK'], importanceWeight: 15 },
      { category: 'Back Row', positions: ['BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER', 'NUMBER_EIGHT'], importanceWeight: 20 },
      { category: 'Half Backs', positions: ['SCRUM_HALF', 'FLY_HALF'], importanceWeight: 20 },
      { category: 'Backs', positions: ['INSIDE_CENTRE', 'OUTSIDE_CENTRE', 'WINGER', 'FULL_BACK'], importanceWeight: 25 },
    ],
  },

  // ==========================================================================
  // CRICKET
  // ==========================================================================
  CRICKET: {
    sport: 'CRICKET',
    displayName: 'Cricket',
    scoring: {
      maxPointsPerMatch: 4,
      winPoints: 4,
      drawPoints: 2, // Or tie points
      lossPoints: 0,
      bonusPointsAvailable: true, // Net run rate affects standings
    },
    match: {
      standardDuration: 420, // T20: 200, ODI: 420, Test: varies
      hasExtraTime: false,
      hasPenalties: false,
      hasOvertimePeriods: false,
      periodsCount: 2, // Innings
    },
    weights: {
      recentForm: 20,
      headToHead: 15,
      homeAdvantage: 20, // Pitch conditions matter
      squadStrength: 20,
      injuryImpact: 10,
      restDays: 5,
      competitionImportance: 10,
    },
    keyMetrics: [
      'battingAverage', 'strikeRate', 'bowlingAverage',
      'economyRate', 'catchSuccessRate', 'boundaryRate',
      'wicketsPerMatch', 'runsPerMatch', 'dotBallPercentage',
    ],
    positionCategories: [
      { category: 'Openers', positions: ['OPENING_BATTER'], importanceWeight: 25 },
      { category: 'Middle Order', positions: ['MIDDLE_ORDER_BATTER'], importanceWeight: 25 },
      { category: 'All-Rounders', positions: ['ALL_ROUNDER'], importanceWeight: 20 },
      { category: 'Bowlers', positions: ['FAST_BOWLER', 'SPIN_BOWLER'], importanceWeight: 20 },
      { category: 'Wicket Keeper', positions: ['WICKET_KEEPER'], importanceWeight: 10 },
    ],
  },

  // ==========================================================================
  // BASKETBALL
  // ==========================================================================
  BASKETBALL: {
    sport: 'BASKETBALL',
    displayName: 'Basketball',
    scoring: {
      maxPointsPerMatch: 2,
      winPoints: 2,
      drawPoints: 0, // No draws in basketball
      lossPoints: 0,
      bonusPointsAvailable: false,
    },
    match: {
      standardDuration: 48, // NBA: 48, FIBA: 40
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: true,
      periodsCount: 4,
    },
    weights: {
      recentForm: 25,
      headToHead: 10,
      homeAdvantage: 12,
      squadStrength: 25,
      injuryImpact: 18,
      restDays: 5,
      competitionImportance: 5,
    },
    keyMetrics: [
      'pointsPerGame', 'fieldGoalPercentage', 'threePointPercentage',
      'freeThrowPercentage', 'reboundsPerGame', 'assistsPerGame',
      'stealsPerGame', 'blocksPerGame', 'turnoversPerGame', 'plusMinus',
    ],
    positionCategories: [
      { category: 'Guards', positions: ['POINT_GUARD', 'SHOOTING_GUARD'], importanceWeight: 35 },
      { category: 'Forwards', positions: ['SMALL_FORWARD', 'POWER_FORWARD'], importanceWeight: 35 },
      { category: 'Center', positions: ['CENTER'], importanceWeight: 30 },
    ],
  },

  // ==========================================================================
  // AMERICAN FOOTBALL
  // ==========================================================================
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    displayName: 'American Football',
    scoring: {
      maxPointsPerMatch: 2,
      winPoints: 2,
      drawPoints: 1, // Rare ties
      lossPoints: 0,
      bonusPointsAvailable: false,
    },
    match: {
      standardDuration: 60,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: true,
      periodsCount: 4,
    },
    weights: {
      recentForm: 22,
      headToHead: 12,
      homeAdvantage: 15,
      squadStrength: 20,
      injuryImpact: 18,
      restDays: 8,
      competitionImportance: 5,
    },
    keyMetrics: [
      'passingYardsPerGame', 'rushingYardsPerGame', 'completionPercentage',
      'touchdownsPerGame', 'interceptionsPerGame', 'sacksAllowed',
      'thirdDownConversionRate', 'redZoneEfficiency', 'turnoversPerGame',
    ],
    positionCategories: [
      { category: 'Quarterback', positions: ['QUARTERBACK'], importanceWeight: 30 },
      { category: 'Running Backs', positions: ['RUNNING_BACK', 'FULLBACK'], importanceWeight: 15 },
      { category: 'Receivers', positions: ['WIDE_RECEIVER', 'TIGHT_END'], importanceWeight: 20 },
      { category: 'Offensive Line', positions: ['OFFENSIVE_TACKLE', 'GUARD', 'CENTER_NFL'], importanceWeight: 15 },
      { category: 'Defense', positions: ['DEFENSIVE_END', 'DEFENSIVE_TACKLE', 'LINEBACKER', 'CORNERBACK', 'SAFETY'], importanceWeight: 20 },
    ],
  },

  // ==========================================================================
  // NETBALL
  // ==========================================================================
  NETBALL: {
    sport: 'NETBALL',
    displayName: 'Netball',
    scoring: {
      maxPointsPerMatch: 2,
      winPoints: 2,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
    },
    match: {
      standardDuration: 60,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: false,
      periodsCount: 4,
    },
    weights: {
      recentForm: 28,
      headToHead: 10,
      homeAdvantage: 12,
      squadStrength: 22,
      injuryImpact: 16,
      restDays: 7,
      competitionImportance: 5,
    },
    keyMetrics: [
      'goalPercentage', 'centrePassReceives', 'feedsPerMatch',
      'goalAssistsPerMatch', 'interceptionsPerMatch', 'deflectionsPerMatch',
      'reboundsPerMatch', 'turnoversPerMatch',
    ],
    positionCategories: [
      { category: 'Shooters', positions: ['GOAL_SHOOTER', 'GOAL_ATTACK'], importanceWeight: 35 },
      { category: 'Mid Court', positions: ['WING_ATTACK', 'CENTRE', 'WING_DEFENCE'], importanceWeight: 35 },
      { category: 'Defenders', positions: ['GOAL_DEFENCE', 'GOAL_KEEPER'], importanceWeight: 30 },
    ],
  },

  // ==========================================================================
  // HOCKEY
  // ==========================================================================
  HOCKEY: {
    sport: 'HOCKEY',
    displayName: 'Hockey',
    scoring: {
      maxPointsPerMatch: 3,
      winPoints: 3,
      drawPoints: 1, // OT loss gets 1 point
      lossPoints: 0,
      bonusPointsAvailable: true,
    },
    match: {
      standardDuration: 60,
      hasExtraTime: true,
      hasPenalties: true, // Shootout
      hasOvertimePeriods: true,
      periodsCount: 3,
    },
    weights: {
      recentForm: 25,
      headToHead: 10,
      homeAdvantage: 15,
      squadStrength: 22,
      injuryImpact: 15,
      restDays: 8,
      competitionImportance: 5,
    },
    keyMetrics: [
      'goalsPerGame', 'assistsPerGame', 'pointsPerGame',
      'plusMinus', 'shootingPercentage', 'faceoffWinPercentage',
      'blockedShotsPerGame', 'hitsPerGame', 'powerPlayPercentage',
      'penaltyKillPercentage', 'savePercentage',
    ],
    positionCategories: [
      { category: 'Goaltender', positions: ['GOALTENDER'], importanceWeight: 30 },
      { category: 'Defense', positions: ['DEFENSEMAN'], importanceWeight: 30 },
      { category: 'Forwards', positions: ['CENTER_HOCKEY', 'LEFT_WING', 'RIGHT_WING'], importanceWeight: 40 },
    ],
  },

  // ==========================================================================
  // LACROSSE
  // ==========================================================================
  LACROSSE: {
    sport: 'LACROSSE',
    displayName: 'Lacrosse',
    scoring: {
      maxPointsPerMatch: 2,
      winPoints: 2,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
    },
    match: {
      standardDuration: 60,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: true,
      periodsCount: 4,
    },
    weights: {
      recentForm: 26,
      headToHead: 10,
      homeAdvantage: 14,
      squadStrength: 22,
      injuryImpact: 15,
      restDays: 8,
      competitionImportance: 5,
    },
    keyMetrics: [
      'goalsPerGame', 'assistsPerGame', 'groundBallsPerGame',
      'faceoffWinPercentage', 'shotPercentage', 'savePercentage',
      'turnoversPerGame', 'clearsPercentage',
    ],
    positionCategories: [
      { category: 'Goalie', positions: ['GOALKEEPER'], importanceWeight: 25 },
      { category: 'Defense', positions: ['DEFENDER_LACROSSE'], importanceWeight: 25 },
      { category: 'Midfield', positions: ['MIDFIELDER_LACROSSE'], importanceWeight: 25 },
      { category: 'Attack', positions: ['ATTACKER_LACROSSE'], importanceWeight: 25 },
    ],
  },

  // ==========================================================================
  // AUSTRALIAN RULES FOOTBALL
  // ==========================================================================
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    displayName: 'Australian Rules Football',
    scoring: {
      maxPointsPerMatch: 4,
      winPoints: 4,
      drawPoints: 2,
      lossPoints: 0,
      bonusPointsAvailable: false,
    },
    match: {
      standardDuration: 80,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: false,
      periodsCount: 4,
    },
    weights: {
      recentForm: 24,
      headToHead: 12,
      homeAdvantage: 16,
      squadStrength: 20,
      injuryImpact: 14,
      restDays: 8,
      competitionImportance: 6,
    },
    keyMetrics: [
      'disposalsPerGame', 'kicksPerGame', 'handballsPerGame',
      'marksPerGame', 'tacklesPerGame', 'hitoutsPerGame',
      'goalsPerGame', 'behindsPerGame', 'clearancesPerGame',
    ],
    positionCategories: [
      { category: 'Key Forwards', positions: ['FULL_FORWARD', 'HALF_FORWARD'], importanceWeight: 25 },
      { category: 'Midfield', positions: ['RUCK', 'RUCK_ROVER', 'ROVER'], importanceWeight: 35 },
      { category: 'Key Defenders', positions: ['FULL_BACK_AFL', 'HALF_BACK_AFL'], importanceWeight: 25 },
      { category: 'General', positions: ['CENTRE_MIDFIELDER'], importanceWeight: 15 },
    ],
  },

  // ==========================================================================
  // GAELIC FOOTBALL
  // ==========================================================================
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    displayName: 'Gaelic Football',
    scoring: {
      maxPointsPerMatch: 2,
      winPoints: 2,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
    },
    match: {
      standardDuration: 70,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: false,
      periodsCount: 2,
    },
    weights: {
      recentForm: 26,
      headToHead: 12,
      homeAdvantage: 15,
      squadStrength: 20,
      injuryImpact: 14,
      restDays: 8,
      competitionImportance: 5,
    },
    keyMetrics: [
      'goalsScored', 'pointsScored', 'totalScore',
      'kickoutsWonPercentage', 'turnoversWonPerGame',
      'tacklesPerGame', 'freesTakenAccuracy',
    ],
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER'], importanceWeight: 15 },
      { category: 'Full Back Line', positions: ['FULL_BACK', 'CORNER_BACK'], importanceWeight: 20 },
      { category: 'Half Back Line', positions: ['CENTRE_BACK', 'WING_BACK'], importanceWeight: 20 },
      { category: 'Midfield', positions: ['MIDFIELDER_GAA'], importanceWeight: 20 },
      { category: 'Forwards', positions: ['HALF_FORWARD_GAA', 'CORNER_FORWARD', 'FULL_FORWARD_GAA'], importanceWeight: 25 },
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get configuration for a specific sport
 */
export function getSportConfig(sport: Sport): SportPredictionConfig {
  return SPORT_PREDICTION_CONFIGS[sport];
}

/**
 * Get prediction weights for a sport
 */
export function getSportWeights(sport: Sport): SportPredictionConfig['weights'] {
  return SPORT_PREDICTION_CONFIGS[sport].weights;
}

/**
 * Get key metrics for a sport
 */
export function getSportKeyMetrics(sport: Sport): string[] {
  return SPORT_PREDICTION_CONFIGS[sport].keyMetrics;
}

/**
 * Get position categories for a sport
 */
export function getSportPositionCategories(sport: Sport): SportPredictionConfig['positionCategories'] {
  return SPORT_PREDICTION_CONFIGS[sport].positionCategories;
}

/**
 * Get all supported sports
 */
export function getSupportedSports(): Sport[] {
  return Object.keys(SPORT_PREDICTION_CONFIGS) as Sport[];
}

/**
 * Check if a sport is supported
 */
export function isSportSupported(sport: string): sport is Sport {
  return sport in SPORT_PREDICTION_CONFIGS;
}

/**
 * Get sport display name
 */
export function getSportDisplayName(sport: Sport): string {
  return SPORT_PREDICTION_CONFIGS[sport].displayName;
}

/**
 * Get default sport (Football)
 */
export function getDefaultSport(): Sport {
  return 'FOOTBALL';
}

/**
 * Check if sport has draws
 */
export function sportHasDraws(sport: Sport): boolean {
  return SPORT_PREDICTION_CONFIGS[sport].scoring.drawPoints > 0;
}

/**
 * Check if sport has bonus points
 */
export function sportHasBonusPoints(sport: Sport): boolean {
  return SPORT_PREDICTION_CONFIGS[sport].scoring.bonusPointsAvailable;
}

/**
 * Get home advantage factor for a sport (0-100 scale)
 */
export function getHomeAdvantageFactor(sport: Sport): number {
  return SPORT_PREDICTION_CONFIGS[sport].weights.homeAdvantage;
}

/**
 * Calculate position importance for prediction
 */
export function getPositionImportance(sport: Sport, position: Position): number {
  const categories = SPORT_PREDICTION_CONFIGS[sport].positionCategories;
  const category = categories.find(c => c.positions.includes(position));
  return category?.importanceWeight ?? 10;
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

export default SPORT_PREDICTION_CONFIGS;