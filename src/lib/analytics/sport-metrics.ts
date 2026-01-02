/**
 * ============================================================================
 * 📊 PITCHCONNECT ANALYTICS - SPORT METRICS v7.10.1
 * ============================================================================
 * Multi-sport metric configurations for analytics calculations
 * Position-specific weights, injury risk factors, age adjustments
 * ============================================================================
 */

import type { Sport, BodyPart } from './types';

// =============================================================================
// SPORT METRIC CONFIGURATION TYPE
// =============================================================================

export interface SportMetricConfig {
  sport: Sport;
  displayName: string;
  
  // Base values for market valuation (in GBP)
  baseValueByTier: {
    elite: number;          // Top tier professional
    professional: number;   // Professional league
    semipro: number;        // Semi-professional
    amateur: number;        // Amateur/grassroots
    youth: number;          // Youth development
  };
  
  // Position value multipliers
  positionMultipliers: Record<string, number>;
  
  // Age adjustment curve
  ageFactors: {
    peakAgeStart: number;
    peakAgeEnd: number;
    developmentMultiplier: number;  // Under peak
    declineRate: number;            // Per year over peak
    youthCeiling: number;           // Max multiplier for youth
  };
  
  // Injury risk by position
  positionInjuryRisk: Record<string, number>;  // 0-100 base risk
  
  // Common injury body parts by sport
  commonInjuryAreas: BodyPart[];
  
  // Key performance metrics
  keyMetrics: string[];
  
  // Rating weights for overall calculation
  ratingWeights: {
    metric: string;
    weight: number;
    category: 'ATTACK' | 'DEFENSE' | 'PHYSICAL' | 'MENTAL' | 'TECHNICAL';
  }[];
  
  // Formations available
  formations: string[];
}

// =============================================================================
// SPORT METRIC CONFIGURATIONS
// =============================================================================

export const SPORT_METRIC_CONFIGS: Record<Sport, SportMetricConfig> = {
  // ===========================================================================
  // FOOTBALL
  // ===========================================================================
  FOOTBALL: {
    sport: 'FOOTBALL',
    displayName: 'Football',
    baseValueByTier: {
      elite: 50000000,        // £50M
      professional: 5000000,  // £5M
      semipro: 100000,        // £100K
      amateur: 5000,          // £5K
      youth: 50000,           // £50K
    },
    positionMultipliers: {
      GOALKEEPER: 0.7,
      LEFT_BACK: 0.8,
      RIGHT_BACK: 0.8,
      CENTRE_BACK: 0.9,
      SWEEPER: 0.85,
      DEFENSIVE_MIDFIELDER: 1.0,
      CENTRAL_MIDFIELDER: 1.1,
      ATTACKING_MIDFIELDER: 1.3,
      LEFT_MIDFIELDER: 1.0,
      RIGHT_MIDFIELDER: 1.0,
      LEFT_WINGER: 1.2,
      RIGHT_WINGER: 1.2,
      STRIKER: 1.4,
      CENTRE_FORWARD: 1.5,
      SECOND_STRIKER: 1.3,
    },
    ageFactors: {
      peakAgeStart: 25,
      peakAgeEnd: 29,
      developmentMultiplier: 1.3,
      declineRate: 0.08,
      youthCeiling: 2.0,
    },
    positionInjuryRisk: {
      GOALKEEPER: 25,
      LEFT_BACK: 45,
      RIGHT_BACK: 45,
      CENTRE_BACK: 40,
      DEFENSIVE_MIDFIELDER: 50,
      CENTRAL_MIDFIELDER: 55,
      ATTACKING_MIDFIELDER: 50,
      LEFT_WINGER: 55,
      RIGHT_WINGER: 55,
      STRIKER: 50,
      CENTRE_FORWARD: 50,
    },
    commonInjuryAreas: ['HAMSTRING', 'KNEE', 'ANKLE', 'GROIN', 'CALF', 'THIGH'],
    keyMetrics: [
      'goals', 'assists', 'passAccuracy', 'tacklesWon', 'interceptions',
      'duelsWon', 'aerialDuelsWon', 'keyPasses', 'shotsOnTarget', 'cleanSheets',
    ],
    ratingWeights: [
      { metric: 'goals', weight: 15, category: 'ATTACK' },
      { metric: 'assists', weight: 12, category: 'ATTACK' },
      { metric: 'passAccuracy', weight: 15, category: 'TECHNICAL' },
      { metric: 'tacklesWon', weight: 10, category: 'DEFENSE' },
      { metric: 'interceptions', weight: 8, category: 'DEFENSE' },
      { metric: 'duelsWon', weight: 10, category: 'PHYSICAL' },
      { metric: 'keyPasses', weight: 10, category: 'ATTACK' },
      { metric: 'shotsOnTarget', weight: 8, category: 'ATTACK' },
      { metric: 'aerialDuelsWon', weight: 6, category: 'PHYSICAL' },
      { metric: 'decisionMaking', weight: 6, category: 'MENTAL' },
    ],
    formations: ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2', '4-1-4-1', '3-4-3', '4-4-1-1'],
  },

  // ===========================================================================
  // RUGBY
  // ===========================================================================
  RUGBY: {
    sport: 'RUGBY',
    displayName: 'Rugby',
    baseValueByTier: {
      elite: 2000000,
      professional: 500000,
      semipro: 50000,
      amateur: 2000,
      youth: 20000,
    },
    positionMultipliers: {
      LOOSEHEAD_PROP: 0.9,
      HOOKER: 1.0,
      TIGHTHEAD_PROP: 0.9,
      LOCK: 0.95,
      BLINDSIDE_FLANKER: 1.0,
      OPENSIDE_FLANKER: 1.1,
      NUMBER_EIGHT: 1.15,
      SCRUM_HALF: 1.2,
      FLY_HALF: 1.4,
      INSIDE_CENTRE: 1.1,
      OUTSIDE_CENTRE: 1.1,
      WINGER: 1.0,
      FULL_BACK: 1.2,
    },
    ageFactors: {
      peakAgeStart: 26,
      peakAgeEnd: 31,
      developmentMultiplier: 1.2,
      declineRate: 0.07,
      youthCeiling: 1.8,
    },
    positionInjuryRisk: {
      LOOSEHEAD_PROP: 55,
      HOOKER: 60,
      TIGHTHEAD_PROP: 55,
      LOCK: 50,
      BLINDSIDE_FLANKER: 55,
      OPENSIDE_FLANKER: 60,
      NUMBER_EIGHT: 55,
      SCRUM_HALF: 45,
      FLY_HALF: 50,
      INSIDE_CENTRE: 55,
      OUTSIDE_CENTRE: 55,
      WINGER: 45,
      FULL_BACK: 50,
    },
    commonInjuryAreas: ['SHOULDER', 'KNEE', 'HEAD', 'ANKLE', 'HAMSTRING', 'NECK'],
    keyMetrics: [
      'tries', 'assists', 'tackles', 'tackleSuccess', 'carries', 'metersGained',
      'lineBreaks', 'offloads', 'turnoversWon', 'lineoutWins', 'scrumSuccess',
    ],
    ratingWeights: [
      { metric: 'tries', weight: 12, category: 'ATTACK' },
      { metric: 'tackles', weight: 15, category: 'DEFENSE' },
      { metric: 'tackleSuccess', weight: 10, category: 'DEFENSE' },
      { metric: 'carries', weight: 10, category: 'ATTACK' },
      { metric: 'metersGained', weight: 12, category: 'ATTACK' },
      { metric: 'lineBreaks', weight: 10, category: 'ATTACK' },
      { metric: 'turnoversWon', weight: 10, category: 'DEFENSE' },
      { metric: 'workRate', weight: 8, category: 'PHYSICAL' },
      { metric: 'setpiece', weight: 8, category: 'TECHNICAL' },
      { metric: 'leadership', weight: 5, category: 'MENTAL' },
    ],
    formations: ['15-man', '7s'],
  },

  // ===========================================================================
  // CRICKET
  // ===========================================================================
  CRICKET: {
    sport: 'CRICKET',
    displayName: 'Cricket',
    baseValueByTier: {
      elite: 5000000,
      professional: 500000,
      semipro: 30000,
      amateur: 1000,
      youth: 15000,
    },
    positionMultipliers: {
      OPENING_BATTER: 1.2,
      MIDDLE_ORDER_BATTER: 1.1,
      ALL_ROUNDER: 1.4,
      WICKET_KEEPER: 1.0,
      FAST_BOWLER: 1.3,
      SPIN_BOWLER: 1.1,
    },
    ageFactors: {
      peakAgeStart: 27,
      peakAgeEnd: 33,
      developmentMultiplier: 1.15,
      declineRate: 0.05,
      youthCeiling: 1.6,
    },
    positionInjuryRisk: {
      OPENING_BATTER: 30,
      MIDDLE_ORDER_BATTER: 25,
      ALL_ROUNDER: 50,
      WICKET_KEEPER: 40,
      FAST_BOWLER: 65,
      SPIN_BOWLER: 35,
    },
    commonInjuryAreas: ['SHOULDER', 'BACK', 'KNEE', 'ANKLE', 'HAND', 'GROIN'],
    keyMetrics: [
      'runs', 'battingAverage', 'strikeRate', 'centuries', 'fifties',
      'wickets', 'bowlingAverage', 'economyRate', 'catches', 'stumpings',
    ],
    ratingWeights: [
      { metric: 'battingAverage', weight: 20, category: 'ATTACK' },
      { metric: 'strikeRate', weight: 10, category: 'ATTACK' },
      { metric: 'wickets', weight: 15, category: 'ATTACK' },
      { metric: 'bowlingAverage', weight: 15, category: 'TECHNICAL' },
      { metric: 'catches', weight: 10, category: 'DEFENSE' },
      { metric: 'fitness', weight: 10, category: 'PHYSICAL' },
      { metric: 'temperament', weight: 10, category: 'MENTAL' },
      { metric: 'consistency', weight: 10, category: 'MENTAL' },
    ],
    formations: ['Test', 'ODI', 'T20'],
  },

  // ===========================================================================
  // BASKETBALL
  // ===========================================================================
  BASKETBALL: {
    sport: 'BASKETBALL',
    displayName: 'Basketball',
    baseValueByTier: {
      elite: 30000000,
      professional: 3000000,
      semipro: 100000,
      amateur: 5000,
      youth: 50000,
    },
    positionMultipliers: {
      POINT_GUARD: 1.3,
      SHOOTING_GUARD: 1.2,
      SMALL_FORWARD: 1.25,
      POWER_FORWARD: 1.15,
      CENTER_BASKETBALL: 1.1,
    },
    ageFactors: {
      peakAgeStart: 25,
      peakAgeEnd: 30,
      developmentMultiplier: 1.4,
      declineRate: 0.08,
      youthCeiling: 2.2,
    },
    positionInjuryRisk: {
      POINT_GUARD: 45,
      SHOOTING_GUARD: 45,
      SMALL_FORWARD: 50,
      POWER_FORWARD: 50,
      CENTER_BASKETBALL: 55,
    },
    commonInjuryAreas: ['KNEE', 'ANKLE', 'BACK', 'SHOULDER', 'HAND', 'FOOT'],
    keyMetrics: [
      'points', 'rebounds', 'assists', 'steals', 'blocks',
      'fieldGoalPercentage', 'threePointPercentage', 'freeThrowPercentage',
      'turnovers', 'plusMinus',
    ],
    ratingWeights: [
      { metric: 'points', weight: 20, category: 'ATTACK' },
      { metric: 'rebounds', weight: 15, category: 'DEFENSE' },
      { metric: 'assists', weight: 15, category: 'ATTACK' },
      { metric: 'steals', weight: 10, category: 'DEFENSE' },
      { metric: 'blocks', weight: 10, category: 'DEFENSE' },
      { metric: 'fieldGoalPercentage', weight: 10, category: 'TECHNICAL' },
      { metric: 'efficiency', weight: 10, category: 'MENTAL' },
      { metric: 'athleticism', weight: 10, category: 'PHYSICAL' },
    ],
    formations: ['Standard'],
  },

  // ===========================================================================
  // AMERICAN FOOTBALL
  // ===========================================================================
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    displayName: 'American Football',
    baseValueByTier: {
      elite: 40000000,
      professional: 5000000,
      semipro: 100000,
      amateur: 5000,
      youth: 30000,
    },
    positionMultipliers: {
      QUARTERBACK: 2.0,
      RUNNING_BACK: 1.0,
      WIDE_RECEIVER: 1.3,
      TIGHT_END: 1.1,
      OFFENSIVE_TACKLE: 1.2,
      OFFENSIVE_GUARD: 0.9,
      CENTER_NFL: 0.85,
      DEFENSIVE_END: 1.3,
      DEFENSIVE_TACKLE: 1.1,
      LINEBACKER: 1.15,
      CORNERBACK: 1.4,
      SAFETY: 1.1,
      KICKER: 0.4,
      PUNTER: 0.3,
    },
    ageFactors: {
      peakAgeStart: 26,
      peakAgeEnd: 30,
      developmentMultiplier: 1.3,
      declineRate: 0.1,
      youthCeiling: 1.8,
    },
    positionInjuryRisk: {
      QUARTERBACK: 50,
      RUNNING_BACK: 70,
      WIDE_RECEIVER: 55,
      TIGHT_END: 60,
      OFFENSIVE_TACKLE: 55,
      DEFENSIVE_END: 55,
      LINEBACKER: 65,
      CORNERBACK: 50,
      SAFETY: 55,
    },
    commonInjuryAreas: ['KNEE', 'HEAD', 'SHOULDER', 'ANKLE', 'BACK', 'HAND'],
    keyMetrics: [
      'passingYards', 'rushingYards', 'receivingYards', 'touchdowns',
      'interceptions', 'sacks', 'tackles', 'completionPercentage',
      'yardsPerAttempt', 'quarterbackRating',
    ],
    ratingWeights: [
      { metric: 'touchdowns', weight: 20, category: 'ATTACK' },
      { metric: 'yards', weight: 15, category: 'ATTACK' },
      { metric: 'tackles', weight: 15, category: 'DEFENSE' },
      { metric: 'turnovers', weight: 10, category: 'MENTAL' },
      { metric: 'athleticism', weight: 15, category: 'PHYSICAL' },
      { metric: 'technique', weight: 15, category: 'TECHNICAL' },
      { metric: 'awareness', weight: 10, category: 'MENTAL' },
    ],
    formations: ['4-3', '3-4', 'Nickel', 'Dime', 'Goal Line'],
  },

  // ===========================================================================
  // NETBALL
  // ===========================================================================
  NETBALL: {
    sport: 'NETBALL',
    displayName: 'Netball',
    baseValueByTier: {
      elite: 200000,
      professional: 50000,
      semipro: 10000,
      amateur: 500,
      youth: 5000,
    },
    positionMultipliers: {
      GOAL_SHOOTER: 1.3,
      GOAL_ATTACK: 1.2,
      WING_ATTACK: 1.0,
      CENTRE: 1.15,
      WING_DEFENCE: 0.95,
      GOAL_DEFENCE: 1.1,
      GOAL_KEEPER: 1.1,
    },
    ageFactors: {
      peakAgeStart: 24,
      peakAgeEnd: 30,
      developmentMultiplier: 1.2,
      declineRate: 0.06,
      youthCeiling: 1.7,
    },
    positionInjuryRisk: {
      GOAL_SHOOTER: 45,
      GOAL_ATTACK: 50,
      WING_ATTACK: 45,
      CENTRE: 55,
      WING_DEFENCE: 45,
      GOAL_DEFENCE: 50,
      GOAL_KEEPER: 50,
    },
    commonInjuryAreas: ['KNEE', 'ANKLE', 'SHOULDER', 'BACK', 'HAND', 'FOOT'],
    keyMetrics: [
      'goals', 'goalAttempts', 'shootingPercentage', 'centrePassReceives',
      'feeds', 'goalAssists', 'intercepts', 'deflections', 'rebounds',
    ],
    ratingWeights: [
      { metric: 'goals', weight: 20, category: 'ATTACK' },
      { metric: 'shootingPercentage', weight: 15, category: 'TECHNICAL' },
      { metric: 'intercepts', weight: 15, category: 'DEFENSE' },
      { metric: 'feeds', weight: 15, category: 'ATTACK' },
      { metric: 'centrePassReceives', weight: 10, category: 'ATTACK' },
      { metric: 'deflections', weight: 10, category: 'DEFENSE' },
      { metric: 'fitness', weight: 10, category: 'PHYSICAL' },
      { metric: 'gameAwareness', weight: 5, category: 'MENTAL' },
    ],
    formations: ['Standard'],
  },

  // ===========================================================================
  // HOCKEY (Field Hockey)
  // ===========================================================================
  HOCKEY: {
    sport: 'HOCKEY',
    displayName: 'Hockey',
    baseValueByTier: {
      elite: 500000,
      professional: 100000,
      semipro: 20000,
      amateur: 1000,
      youth: 10000,
    },
    positionMultipliers: {
      GOALKEEPER_HOCKEY: 0.9,
      DEFENDER_HOCKEY: 0.95,
      MIDFIELDER_HOCKEY: 1.1,
      FORWARD_HOCKEY: 1.2,
    },
    ageFactors: {
      peakAgeStart: 25,
      peakAgeEnd: 30,
      developmentMultiplier: 1.2,
      declineRate: 0.06,
      youthCeiling: 1.6,
    },
    positionInjuryRisk: {
      GOALKEEPER_HOCKEY: 40,
      DEFENDER_HOCKEY: 45,
      MIDFIELDER_HOCKEY: 50,
      FORWARD_HOCKEY: 50,
    },
    commonInjuryAreas: ['KNEE', 'ANKLE', 'HAND', 'BACK', 'SHOULDER', 'FOOT'],
    keyMetrics: [
      'goals', 'assists', 'shotsOnTarget', 'tackles', 'interceptions',
      'penaltyCornerConversions', 'passAccuracy', 'saves', 'cleanSheets',
    ],
    ratingWeights: [
      { metric: 'goals', weight: 18, category: 'ATTACK' },
      { metric: 'assists', weight: 15, category: 'ATTACK' },
      { metric: 'tackles', weight: 12, category: 'DEFENSE' },
      { metric: 'passAccuracy', weight: 15, category: 'TECHNICAL' },
      { metric: 'penaltyCorners', weight: 10, category: 'ATTACK' },
      { metric: 'fitness', weight: 15, category: 'PHYSICAL' },
      { metric: 'positioning', weight: 10, category: 'MENTAL' },
      { metric: 'technique', weight: 5, category: 'TECHNICAL' },
    ],
    formations: ['4-3-3', '3-3-3-1', '4-4-2', '5-3-2'],
  },

  // ===========================================================================
  // LACROSSE
  // ===========================================================================
  LACROSSE: {
    sport: 'LACROSSE',
    displayName: 'Lacrosse',
    baseValueByTier: {
      elite: 300000,
      professional: 75000,
      semipro: 15000,
      amateur: 1000,
      youth: 8000,
    },
    positionMultipliers: {
      GOALKEEPER_LACROSSE: 0.9,
      DEFENDER_LACROSSE: 0.95,
      MIDFIELDER_LACROSSE: 1.1,
      ATTACKER_LACROSSE: 1.2,
      FOGO: 1.15,
    },
    ageFactors: {
      peakAgeStart: 24,
      peakAgeEnd: 29,
      developmentMultiplier: 1.25,
      declineRate: 0.07,
      youthCeiling: 1.7,
    },
    positionInjuryRisk: {
      GOALKEEPER_LACROSSE: 35,
      DEFENDER_LACROSSE: 50,
      MIDFIELDER_LACROSSE: 55,
      ATTACKER_LACROSSE: 50,
    },
    commonInjuryAreas: ['KNEE', 'ANKLE', 'SHOULDER', 'HEAD', 'HAND', 'BACK'],
    keyMetrics: [
      'goals', 'assists', 'groundBalls', 'faceoffWinPercentage',
      'shotPercentage', 'saves', 'turnovers', 'causedTurnovers',
    ],
    ratingWeights: [
      { metric: 'goals', weight: 20, category: 'ATTACK' },
      { metric: 'assists', weight: 15, category: 'ATTACK' },
      { metric: 'groundBalls', weight: 15, category: 'PHYSICAL' },
      { metric: 'faceoffs', weight: 10, category: 'TECHNICAL' },
      { metric: 'causedTurnovers', weight: 12, category: 'DEFENSE' },
      { metric: 'saves', weight: 10, category: 'DEFENSE' },
      { metric: 'stickSkills', weight: 10, category: 'TECHNICAL' },
      { metric: 'gameIQ', weight: 8, category: 'MENTAL' },
    ],
    formations: ['2-3-1', '1-4-1', '2-2-2', '3-3'],
  },

  // ===========================================================================
  // AUSTRALIAN RULES FOOTBALL
  // ===========================================================================
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    displayName: 'Australian Rules Football',
    baseValueByTier: {
      elite: 1500000,
      professional: 400000,
      semipro: 40000,
      amateur: 2000,
      youth: 20000,
    },
    positionMultipliers: {
      FULL_FORWARD_AFL: 1.2,
      CENTRE_HALF_FORWARD: 1.15,
      CENTRE_AFL: 1.3,
      RUCK: 1.1,
      ROVER: 1.2,
      CENTRE_HALF_BACK: 1.05,
      FULL_BACK_AFL: 1.0,
    },
    ageFactors: {
      peakAgeStart: 25,
      peakAgeEnd: 30,
      developmentMultiplier: 1.3,
      declineRate: 0.08,
      youthCeiling: 1.9,
    },
    positionInjuryRisk: {
      FULL_FORWARD_AFL: 50,
      CENTRE_HALF_FORWARD: 50,
      CENTRE_AFL: 55,
      RUCK: 55,
      ROVER: 55,
      CENTRE_HALF_BACK: 50,
      FULL_BACK_AFL: 50,
    },
    commonInjuryAreas: ['KNEE', 'HAMSTRING', 'SHOULDER', 'ANKLE', 'BACK', 'GROIN'],
    keyMetrics: [
      'disposals', 'kicks', 'handballs', 'marks', 'tackles', 'hitouts',
      'goals', 'behinds', 'clearances', 'inside50s', 'rebounds',
    ],
    ratingWeights: [
      { metric: 'disposals', weight: 20, category: 'ATTACK' },
      { metric: 'goals', weight: 15, category: 'ATTACK' },
      { metric: 'tackles', weight: 12, category: 'DEFENSE' },
      { metric: 'marks', weight: 12, category: 'TECHNICAL' },
      { metric: 'clearances', weight: 12, category: 'PHYSICAL' },
      { metric: 'hitouts', weight: 8, category: 'PHYSICAL' },
      { metric: 'inside50s', weight: 10, category: 'ATTACK' },
      { metric: 'workRate', weight: 6, category: 'PHYSICAL' },
      { metric: 'composure', weight: 5, category: 'MENTAL' },
    ],
    formations: ['Standard 18'],
  },

  // ===========================================================================
  // GAELIC FOOTBALL
  // ===========================================================================
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    displayName: 'Gaelic Football',
    baseValueByTier: {
      elite: 0,             // Amateur sport
      professional: 0,
      semipro: 0,
      amateur: 0,
      youth: 0,
    },
    positionMultipliers: {
      GOALKEEPER_GAA: 1.0,
      FULL_BACK_GAA: 1.0,
      CORNER_BACK_LEFT: 1.0,
      CORNER_BACK_RIGHT: 1.0,
      CENTRE_BACK_GAA: 1.1,
      MIDFIELDER_GAA: 1.2,
      CENTRE_FORWARD_GAA: 1.15,
      FULL_FORWARD_GAA: 1.1,
    },
    ageFactors: {
      peakAgeStart: 24,
      peakAgeEnd: 30,
      developmentMultiplier: 1.2,
      declineRate: 0.06,
      youthCeiling: 1.5,
    },
    positionInjuryRisk: {
      GOALKEEPER_GAA: 30,
      FULL_BACK_GAA: 45,
      CENTRE_BACK_GAA: 50,
      MIDFIELDER_GAA: 55,
      CENTRE_FORWARD_GAA: 50,
      FULL_FORWARD_GAA: 45,
    },
    commonInjuryAreas: ['KNEE', 'HAMSTRING', 'ANKLE', 'SHOULDER', 'GROIN', 'BACK'],
    keyMetrics: [
      'goals', 'points', 'totalScore', 'frees', 'kickouts',
      'turnoversWon', 'tackles', 'blocks', 'marks',
    ],
    ratingWeights: [
      { metric: 'totalScore', weight: 25, category: 'ATTACK' },
      { metric: 'tackles', weight: 15, category: 'DEFENSE' },
      { metric: 'turnoversWon', weight: 12, category: 'DEFENSE' },
      { metric: 'kickouts', weight: 10, category: 'TECHNICAL' },
      { metric: 'frees', weight: 10, category: 'TECHNICAL' },
      { metric: 'workRate', weight: 15, category: 'PHYSICAL' },
      { metric: 'aerial', weight: 8, category: 'PHYSICAL' },
      { metric: 'leadership', weight: 5, category: 'MENTAL' },
    ],
    formations: ['Standard 15'],
  },

  // ===========================================================================
  // FUTSAL
  // ===========================================================================
  FUTSAL: {
    sport: 'FUTSAL',
    displayName: 'Futsal',
    baseValueByTier: {
      elite: 1000000,
      professional: 200000,
      semipro: 20000,
      amateur: 1000,
      youth: 10000,
    },
    positionMultipliers: {
      GOALKEEPER_FUTSAL: 0.8,
      FIXO: 1.0,
      ALA_LEFT: 1.1,
      ALA_RIGHT: 1.1,
      PIVOT: 1.2,
    },
    ageFactors: {
      peakAgeStart: 25,
      peakAgeEnd: 31,
      developmentMultiplier: 1.2,
      declineRate: 0.06,
      youthCeiling: 1.6,
    },
    positionInjuryRisk: {
      GOALKEEPER_FUTSAL: 35,
      FIXO: 45,
      ALA_LEFT: 50,
      ALA_RIGHT: 50,
      PIVOT: 50,
    },
    commonInjuryAreas: ['ANKLE', 'KNEE', 'GROIN', 'FOOT', 'BACK', 'HAMSTRING'],
    keyMetrics: [
      'goals', 'assists', 'shots', 'passAccuracy', 'tackles',
      'interceptions', 'saves', 'cleanSheets',
    ],
    ratingWeights: [
      { metric: 'goals', weight: 25, category: 'ATTACK' },
      { metric: 'assists', weight: 15, category: 'ATTACK' },
      { metric: 'passAccuracy', weight: 15, category: 'TECHNICAL' },
      { metric: 'tackles', weight: 12, category: 'DEFENSE' },
      { metric: 'technique', weight: 15, category: 'TECHNICAL' },
      { metric: 'fitness', weight: 10, category: 'PHYSICAL' },
      { metric: 'decisionMaking', weight: 8, category: 'MENTAL' },
    ],
    formations: ['1-2-1', '2-2', '4-0', '3-1'],
  },

  // ===========================================================================
  // BEACH FOOTBALL
  // ===========================================================================
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    displayName: 'Beach Football',
    baseValueByTier: {
      elite: 300000,
      professional: 50000,
      semipro: 10000,
      amateur: 500,
      youth: 5000,
    },
    positionMultipliers: {
      GOALKEEPER_BEACH: 0.9,
      DEFENDER_BEACH: 1.0,
      FORWARD_BEACH: 1.2,
      PIVOT_BEACH: 1.15,
    },
    ageFactors: {
      peakAgeStart: 26,
      peakAgeEnd: 32,
      developmentMultiplier: 1.15,
      declineRate: 0.05,
      youthCeiling: 1.5,
    },
    positionInjuryRisk: {
      GOALKEEPER_BEACH: 35,
      DEFENDER_BEACH: 40,
      FORWARD_BEACH: 45,
      PIVOT_BEACH: 45,
    },
    commonInjuryAreas: ['ANKLE', 'KNEE', 'FOOT', 'BACK', 'SHOULDER', 'TOE'],
    keyMetrics: [
      'goals', 'assists', 'spectacularGoals', 'bicycleKicks',
      'volleys', 'saves', 'cleanSheets',
    ],
    ratingWeights: [
      { metric: 'goals', weight: 30, category: 'ATTACK' },
      { metric: 'spectacularGoals', weight: 15, category: 'TECHNICAL' },
      { metric: 'assists', weight: 15, category: 'ATTACK' },
      { metric: 'saves', weight: 12, category: 'DEFENSE' },
      { metric: 'technique', weight: 15, category: 'TECHNICAL' },
      { metric: 'fitness', weight: 8, category: 'PHYSICAL' },
      { metric: 'flair', weight: 5, category: 'MENTAL' },
    ],
    formations: ['1-2-1', '2-2'],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get sport metric configuration
 */
export function getSportMetricConfig(sport: Sport): SportMetricConfig {
  return SPORT_METRIC_CONFIGS[sport];
}

/**
 * Get position value multiplier
 */
export function getPositionValueMultiplier(sport: Sport, position: string): number {
  const config = SPORT_METRIC_CONFIGS[sport];
  return config.positionMultipliers[position] ?? 1.0;
}

/**
 * Get age adjustment factor
 */
export function getAgeAdjustmentFactor(sport: Sport, age: number): number {
  const config = SPORT_METRIC_CONFIGS[sport];
  const { peakAgeStart, peakAgeEnd, developmentMultiplier, declineRate, youthCeiling } = config.ageFactors;
  
  // Youth player (under 21)
  if (age < 21) {
    const youthFactor = 1 + ((21 - age) * 0.1);
    return Math.min(youthFactor, youthCeiling);
  }
  
  // Pre-peak development
  if (age < peakAgeStart) {
    return developmentMultiplier - ((peakAgeStart - age) * 0.03);
  }
  
  // Peak years
  if (age >= peakAgeStart && age <= peakAgeEnd) {
    return 1.0;
  }
  
  // Post-peak decline
  const yearsOverPeak = age - peakAgeEnd;
  return Math.max(0.3, 1 - (yearsOverPeak * declineRate));
}

/**
 * Get position injury risk
 */
export function getPositionInjuryRisk(sport: Sport, position: string): number {
  const config = SPORT_METRIC_CONFIGS[sport];
  return config.positionInjuryRisk[position] ?? 40;
}

/**
 * Get formations for a sport
 */
export function getFormationsForSport(sport: Sport): string[] {
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

/**
 * Get base market value for tier
 */
export function getBaseMarketValue(sport: Sport, tier: keyof SportMetricConfig['baseValueByTier']): number {
  return SPORT_METRIC_CONFIGS[sport].baseValueByTier[tier];
}

/**
 * Get common injury areas for sport
 */
export function getCommonInjuryAreas(sport: Sport): BodyPart[] {
  return SPORT_METRIC_CONFIGS[sport].commonInjuryAreas;
}
