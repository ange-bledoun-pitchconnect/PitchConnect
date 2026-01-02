/**
 * ============================================================================
 * 🏆 PITCHCONNECT AI - MULTI-SPORT CONFIGURATION v7.10.1
 * ============================================================================
 * Complete sport configurations for AI prediction algorithms
 * Supports all 12 sports with authentic terminology and weights
 * ============================================================================
 */

import type { Sport, SportPredictionConfig } from './types';

// =============================================================================
// SPORT PREDICTION CONFIGURATIONS
// =============================================================================

export const SPORT_PREDICTION_CONFIGS: Record<Sport, SportPredictionConfig> = {
  // ===========================================================================
  // FOOTBALL (Soccer)
  // ===========================================================================
  FOOTBALL: {
    sport: 'FOOTBALL',
    displayName: 'Football',
    icon: '⚽',
    scoring: {
      maxPointsPerMatch: 3,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
      scoringTerminology: { primary: 'Goal' },
    },
    match: {
      standardDuration: 90,
      hasExtraTime: true,
      hasPenalties: true,
      hasOvertimePeriods: false,
      periodsCount: 2,
      periodName: 'Half',
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
      'expectedGoals', 'expectedAssists', 'passCompletionRate', 'pressureSuccessRate',
      'tackleSuccessRate', 'shotAccuracy', 'cleanSheets', 'goalsConceded',
      'possessionPercentage', 'duelsWon', 'aerialDuelsWon', 'interceptions',
    ],
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER'], importanceWeight: 15 },
      { category: 'Defense', positions: ['LEFT_BACK', 'RIGHT_BACK', 'CENTRE_BACK', 'SWEEPER', 'WING_BACK_LEFT', 'WING_BACK_RIGHT'], importanceWeight: 25 },
      { category: 'Midfield', positions: ['DEFENSIVE_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'ATTACKING_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER', 'BOX_TO_BOX'], importanceWeight: 30 },
      { category: 'Attack', positions: ['STRIKER', 'CENTRE_FORWARD', 'LEFT_WINGER', 'RIGHT_WINGER', 'SECOND_STRIKER', 'FALSE_NINE'], importanceWeight: 30 },
    ],
  },

  // ===========================================================================
  // RUGBY (Union)
  // ===========================================================================
  RUGBY: {
    sport: 'RUGBY',
    displayName: 'Rugby',
    icon: '🏉',
    scoring: {
      maxPointsPerMatch: 5,
      winPoints: 4,
      drawPoints: 2,
      lossPoints: 0,
      bonusPointsAvailable: true,
      scoringTerminology: { primary: 'Try', secondary: 'Conversion' },
    },
    match: {
      standardDuration: 80,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: true,
      periodsCount: 2,
      periodName: 'Half',
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
      'triesScored', 'conversionRate', 'penaltySuccessRate', 'lineoutWinRate',
      'scrumWinRate', 'tackleCompletionRate', 'metersGained', 'turnoversWon',
      'offloads', 'lineBreaks', 'defendersBeaten', 'carriesPerGame',
    ],
    positionCategories: [
      { category: 'Front Row', positions: ['LOOSEHEAD_PROP', 'HOOKER', 'TIGHTHEAD_PROP'], importanceWeight: 20 },
      { category: 'Second Row', positions: ['LOCK', 'SECOND_ROW'], importanceWeight: 15 },
      { category: 'Back Row', positions: ['BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER', 'NUMBER_EIGHT', 'FLANKER'], importanceWeight: 20 },
      { category: 'Half Backs', positions: ['SCRUM_HALF', 'FLY_HALF'], importanceWeight: 20 },
      { category: 'Backs', positions: ['INSIDE_CENTRE', 'OUTSIDE_CENTRE', 'WINGER', 'FULL_BACK', 'WING'], importanceWeight: 25 },
    ],
  },

  // ===========================================================================
  // CRICKET
  // ===========================================================================
  CRICKET: {
    sport: 'CRICKET',
    displayName: 'Cricket',
    icon: '🏏',
    scoring: {
      maxPointsPerMatch: 4,
      winPoints: 4,
      drawPoints: 2,
      lossPoints: 0,
      bonusPointsAvailable: true,
      scoringTerminology: { primary: 'Run', secondary: 'Wicket' },
    },
    match: {
      standardDuration: 420,
      hasExtraTime: false,
      hasPenalties: false,
      hasOvertimePeriods: false,
      periodsCount: 2,
      periodName: 'Innings',
    },
    weights: {
      recentForm: 20,
      headToHead: 15,
      homeAdvantage: 20,
      squadStrength: 20,
      injuryImpact: 10,
      restDays: 5,
      competitionImportance: 10,
    },
    keyMetrics: [
      'battingAverage', 'strikeRate', 'bowlingAverage', 'economyRate',
      'catchSuccessRate', 'boundaryRate', 'wicketsPerMatch', 'runsPerMatch',
      'dotBallPercentage', 'maidenOvers', 'centuries', 'fifties',
    ],
    positionCategories: [
      { category: 'Openers', positions: ['OPENING_BATTER', 'OPENER'], importanceWeight: 25 },
      { category: 'Middle Order', positions: ['MIDDLE_ORDER_BATTER', 'TOP_ORDER', 'LOWER_ORDER'], importanceWeight: 25 },
      { category: 'All-Rounders', positions: ['ALL_ROUNDER', 'BATTING_ALL_ROUNDER', 'BOWLING_ALL_ROUNDER'], importanceWeight: 20 },
      { category: 'Bowlers', positions: ['FAST_BOWLER', 'SPIN_BOWLER', 'MEDIUM_PACER', 'LEG_SPINNER', 'OFF_SPINNER'], importanceWeight: 20 },
      { category: 'Wicket Keeper', positions: ['WICKET_KEEPER'], importanceWeight: 10 },
    ],
  },

  // ===========================================================================
  // BASKETBALL
  // ===========================================================================
  BASKETBALL: {
    sport: 'BASKETBALL',
    displayName: 'Basketball',
    icon: '🏀',
    scoring: {
      maxPointsPerMatch: 2,
      winPoints: 2,
      drawPoints: 0,
      lossPoints: 0,
      bonusPointsAvailable: false,
      scoringTerminology: { primary: 'Point', secondary: 'Three-Pointer' },
    },
    match: {
      standardDuration: 48,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: true,
      periodsCount: 4,
      periodName: 'Quarter',
    },
    weights: {
      recentForm: 28,
      headToHead: 8,
      homeAdvantage: 12,
      squadStrength: 24,
      injuryImpact: 16,
      restDays: 6,
      competitionImportance: 6,
    },
    keyMetrics: [
      'pointsPerGame', 'reboundsPerGame', 'assistsPerGame', 'stealsPerGame',
      'blocksPerGame', 'fieldGoalPercentage', 'threePointPercentage',
      'freeThrowPercentage', 'turnoversPerGame', 'plusMinus', 'playerEfficiency',
    ],
    positionCategories: [
      { category: 'Guards', positions: ['POINT_GUARD', 'SHOOTING_GUARD', 'COMBO_GUARD'], importanceWeight: 35 },
      { category: 'Forwards', positions: ['SMALL_FORWARD', 'POWER_FORWARD', 'STRETCH_FOUR'], importanceWeight: 35 },
      { category: 'Center', positions: ['CENTER_BASKETBALL'], importanceWeight: 30 },
    ],
  },

  // ===========================================================================
  // AMERICAN FOOTBALL
  // ===========================================================================
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    displayName: 'American Football',
    icon: '🏈',
    scoring: {
      maxPointsPerMatch: 2,
      winPoints: 2,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
      scoringTerminology: { primary: 'Touchdown', secondary: 'Field Goal' },
    },
    match: {
      standardDuration: 60,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: true,
      periodsCount: 4,
      periodName: 'Quarter',
    },
    weights: {
      recentForm: 24,
      headToHead: 10,
      homeAdvantage: 14,
      squadStrength: 24,
      injuryImpact: 14,
      restDays: 8,
      competitionImportance: 6,
    },
    keyMetrics: [
      'passingYards', 'rushingYards', 'receivingYards', 'touchdowns',
      'interceptions', 'sacks', 'tacklesPerGame', 'completionPercentage',
      'quarterbackRating', 'yardsPerCarry', 'yardsPerReception', 'turnoverDifferential',
    ],
    positionCategories: [
      { category: 'Offense - Skill', positions: ['QUARTERBACK', 'RUNNING_BACK', 'WIDE_RECEIVER', 'TIGHT_END', 'FULLBACK'], importanceWeight: 40 },
      { category: 'Offense - Line', positions: ['OFFENSIVE_TACKLE', 'OFFENSIVE_GUARD', 'CENTER_NFL'], importanceWeight: 15 },
      { category: 'Defense - Line', positions: ['DEFENSIVE_END', 'DEFENSIVE_TACKLE', 'NOSE_TACKLE'], importanceWeight: 15 },
      { category: 'Defense - Secondary', positions: ['LINEBACKER', 'CORNERBACK', 'SAFETY', 'FREE_SAFETY', 'STRONG_SAFETY'], importanceWeight: 20 },
      { category: 'Special Teams', positions: ['KICKER', 'PUNTER', 'LONG_SNAPPER', 'KICK_RETURNER'], importanceWeight: 10 },
    ],
  },

  // ===========================================================================
  // NETBALL
  // ===========================================================================
  NETBALL: {
    sport: 'NETBALL',
    displayName: 'Netball',
    icon: '🏐',
    scoring: {
      maxPointsPerMatch: 2,
      winPoints: 2,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
      scoringTerminology: { primary: 'Goal', secondary: 'Super Shot' },
    },
    match: {
      standardDuration: 60,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: false,
      periodsCount: 4,
      periodName: 'Quarter',
    },
    weights: {
      recentForm: 26,
      headToHead: 10,
      homeAdvantage: 12,
      squadStrength: 24,
      injuryImpact: 14,
      restDays: 8,
      competitionImportance: 6,
    },
    keyMetrics: [
      'goalsScored', 'goalAttempts', 'shootingPercentage', 'centrePassReceives',
      'feeds', 'feedsWithAttempt', 'goalAssists', 'intercepts',
      'deflections', 'rebounds', 'penalties', 'turnovers',
    ],
    positionCategories: [
      { category: 'Shooters', positions: ['GOAL_SHOOTER', 'GOAL_ATTACK'], importanceWeight: 35 },
      { category: 'Midcourt', positions: ['WING_ATTACK', 'CENTRE', 'WING_DEFENCE'], importanceWeight: 35 },
      { category: 'Defenders', positions: ['GOAL_DEFENCE', 'GOAL_KEEPER'], importanceWeight: 30 },
    ],
  },

  // ===========================================================================
  // HOCKEY (Field Hockey)
  // ===========================================================================
  HOCKEY: {
    sport: 'HOCKEY',
    displayName: 'Hockey',
    icon: '🏑',
    scoring: {
      maxPointsPerMatch: 3,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
      scoringTerminology: { primary: 'Goal' },
    },
    match: {
      standardDuration: 60,
      hasExtraTime: true,
      hasPenalties: true,
      hasOvertimePeriods: false,
      periodsCount: 4,
      periodName: 'Quarter',
    },
    weights: {
      recentForm: 25,
      headToHead: 10,
      homeAdvantage: 14,
      squadStrength: 22,
      injuryImpact: 14,
      restDays: 8,
      competitionImportance: 7,
    },
    keyMetrics: [
      'goalsPerGame', 'assistsPerGame', 'shotsPerGame', 'shotAccuracy',
      'penaltyCornerConversion', 'tacklesPerGame', 'interceptions',
      'passCompletionRate', 'circleEntries', 'saves', 'cleanSheets',
    ],
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER_HOCKEY'], importanceWeight: 20 },
      { category: 'Defenders', positions: ['DEFENDER_HOCKEY', 'SWEEPER_HOCKEY', 'FULL_BACK_HOCKEY'], importanceWeight: 25 },
      { category: 'Midfielders', positions: ['MIDFIELDER_HOCKEY', 'HALF_BACK_HOCKEY'], importanceWeight: 30 },
      { category: 'Forwards', positions: ['FORWARD_HOCKEY', 'STRIKER_HOCKEY', 'INSIDE_FORWARD'], importanceWeight: 25 },
    ],
  },

  // ===========================================================================
  // LACROSSE
  // ===========================================================================
  LACROSSE: {
    sport: 'LACROSSE',
    displayName: 'Lacrosse',
    icon: '🥍',
    scoring: {
      maxPointsPerMatch: 2,
      winPoints: 2,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
      scoringTerminology: { primary: 'Goal', secondary: 'Two-Point Goal' },
    },
    match: {
      standardDuration: 60,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: true,
      periodsCount: 4,
      periodName: 'Quarter',
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
      'goalsPerGame', 'assistsPerGame', 'groundBallsPerGame', 'faceoffWinPercentage',
      'shotPercentage', 'savePercentage', 'turnoversPerGame', 'clearsPercentage',
      'causedTurnovers', 'shotsOnGoal',
    ],
    positionCategories: [
      { category: 'Goalie', positions: ['GOALKEEPER_LACROSSE', 'GOALIE_LACROSSE'], importanceWeight: 25 },
      { category: 'Defense', positions: ['DEFENDER_LACROSSE', 'LONG_STICK_MIDFIELDER'], importanceWeight: 25 },
      { category: 'Midfield', positions: ['MIDFIELDER_LACROSSE', 'FOGO'], importanceWeight: 25 },
      { category: 'Attack', positions: ['ATTACKER_LACROSSE', 'ATTACK'], importanceWeight: 25 },
    ],
  },

  // ===========================================================================
  // AUSTRALIAN RULES FOOTBALL (AFL)
  // ===========================================================================
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    displayName: 'Australian Rules Football',
    icon: '🏉',
    scoring: {
      maxPointsPerMatch: 4,
      winPoints: 4,
      drawPoints: 2,
      lossPoints: 0,
      bonusPointsAvailable: false,
      scoringTerminology: { primary: 'Goal', secondary: 'Behind' },
    },
    match: {
      standardDuration: 80,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: false,
      periodsCount: 4,
      periodName: 'Quarter',
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
      'disposalsPerGame', 'kicksPerGame', 'handballsPerGame', 'marksPerGame',
      'tacklesPerGame', 'hitoutsPerGame', 'goalsPerGame', 'behindsPerGame',
      'clearancesPerGame', 'contestedPossessions', 'inside50s', 'reboundsDefensive',
    ],
    positionCategories: [
      { category: 'Key Forwards', positions: ['FULL_FORWARD_AFL', 'CENTRE_HALF_FORWARD', 'FORWARD_POCKET'], importanceWeight: 25 },
      { category: 'Midfield', positions: ['CENTRE_AFL', 'RUCK', 'RUCK_ROVER', 'ROVER', 'WING_AFL'], importanceWeight: 35 },
      { category: 'Key Defenders', positions: ['FULL_BACK_AFL', 'CENTRE_HALF_BACK', 'BACK_POCKET'], importanceWeight: 25 },
      { category: 'Utility', positions: ['INTERCHANGE', 'UTILITY_AFL'], importanceWeight: 15 },
    ],
  },

  // ===========================================================================
  // GAELIC FOOTBALL
  // ===========================================================================
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    displayName: 'Gaelic Football',
    icon: '🏐',
    scoring: {
      maxPointsPerMatch: 2,
      winPoints: 2,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
      scoringTerminology: { primary: 'Goal', secondary: 'Point' },
    },
    match: {
      standardDuration: 70,
      hasExtraTime: true,
      hasPenalties: false,
      hasOvertimePeriods: false,
      periodsCount: 2,
      periodName: 'Half',
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
      'goalsScored', 'pointsScored', 'totalScore', 'kickoutsWonPercentage',
      'turnoversWonPerGame', 'tacklesPerGame', 'freesTakenAccuracy',
      'marksPerGame', 'handPasses', 'kickPasses',
    ],
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER_GAA'], importanceWeight: 15 },
      { category: 'Full Back Line', positions: ['FULL_BACK_GAA', 'CORNER_BACK_LEFT', 'CORNER_BACK_RIGHT'], importanceWeight: 20 },
      { category: 'Half Back Line', positions: ['CENTRE_BACK_GAA', 'WING_BACK_LEFT_GAA', 'WING_BACK_RIGHT_GAA'], importanceWeight: 20 },
      { category: 'Midfield', positions: ['MIDFIELDER_GAA'], importanceWeight: 20 },
      { category: 'Forwards', positions: ['CENTRE_FORWARD_GAA', 'CORNER_FORWARD_LEFT', 'CORNER_FORWARD_RIGHT', 'FULL_FORWARD_GAA', 'WING_FORWARD_LEFT', 'WING_FORWARD_RIGHT'], importanceWeight: 25 },
    ],
  },

  // ===========================================================================
  // FUTSAL
  // ===========================================================================
  FUTSAL: {
    sport: 'FUTSAL',
    displayName: 'Futsal',
    icon: '⚽',
    scoring: {
      maxPointsPerMatch: 3,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
      scoringTerminology: { primary: 'Goal' },
    },
    match: {
      standardDuration: 40,
      hasExtraTime: true,
      hasPenalties: true,
      hasOvertimePeriods: false,
      periodsCount: 2,
      periodName: 'Half',
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
      'goalsPerMatch', 'assistsPerMatch', 'shotAccuracy', 'possessionPercentage',
      'tackleSuccessRate', 'savePercentage', 'foulsCommitted', 'accumulatedFouls',
    ],
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER_FUTSAL', 'FLYING_GOALKEEPER'], importanceWeight: 25 },
      { category: 'Defender', positions: ['FIXO', 'DEFENDER_FUTSAL'], importanceWeight: 25 },
      { category: 'Winger', positions: ['ALA_LEFT', 'ALA_RIGHT', 'WINGER_FUTSAL'], importanceWeight: 25 },
      { category: 'Pivot', positions: ['PIVOT', 'STRIKER_FUTSAL'], importanceWeight: 25 },
    ],
  },

  // ===========================================================================
  // BEACH FOOTBALL
  // ===========================================================================
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    displayName: 'Beach Football',
    icon: '🏖️',
    scoring: {
      maxPointsPerMatch: 3,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      bonusPointsAvailable: false,
      scoringTerminology: { primary: 'Goal' },
    },
    match: {
      standardDuration: 36,
      hasExtraTime: true,
      hasPenalties: true,
      hasOvertimePeriods: false,
      periodsCount: 3,
      periodName: 'Period',
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
      'goalsPerMatch', 'assistsPerMatch', 'shotAccuracy', 'bicycleKicks',
      'volleyGoals', 'savePercentage', 'scissorKicks', 'spectacularGoals',
    ],
    positionCategories: [
      { category: 'Goalkeeper', positions: ['GOALKEEPER_BEACH'], importanceWeight: 30 },
      { category: 'Outfield', positions: ['DEFENDER_BEACH', 'FORWARD_BEACH', 'PIVOT_BEACH'], importanceWeight: 70 },
    ],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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
 * Get sport icon
 */
export function getSportIcon(sport: Sport): string {
  return SPORT_PREDICTION_CONFIGS[sport].icon;
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
export function getPositionImportance(sport: Sport, position: string): number {
  const categories = SPORT_PREDICTION_CONFIGS[sport].positionCategories;
  const category = categories.find(c => c.positions.includes(position));
  return category?.importanceWeight ?? 10;
}

/**
 * Get scoring terminology for a sport
 */
export function getScoringTerminology(sport: Sport): { primary: string; secondary?: string } {
  return SPORT_PREDICTION_CONFIGS[sport].scoring.scoringTerminology;
}

/**
 * Get period name for a sport
 */
export function getPeriodName(sport: Sport): string {
  return SPORT_PREDICTION_CONFIGS[sport].match.periodName;
}

/**
 * Get number of periods for a sport
 */
export function getPeriodsCount(sport: Sport): number {
  return SPORT_PREDICTION_CONFIGS[sport].match.periodsCount;
}

/**
 * Get standard match duration for a sport (minutes)
 */
export function getMatchDuration(sport: Sport): number {
  return SPORT_PREDICTION_CONFIGS[sport].match.standardDuration;
}

/**
 * Find which position category a position belongs to
 */
export function getPositionCategory(sport: Sport, position: string): string | null {
  const categories = SPORT_PREDICTION_CONFIGS[sport].positionCategories;
  const category = categories.find(c => c.positions.includes(position));
  return category?.category ?? null;
}

/**
 * Get all positions for a sport
 */
export function getAllPositionsForSport(sport: Sport): string[] {
  const categories = SPORT_PREDICTION_CONFIGS[sport].positionCategories;
  return categories.flatMap(c => c.positions);
}

// =============================================================================
// EXPORT
// =============================================================================

export default SPORT_PREDICTION_CONFIGS;
