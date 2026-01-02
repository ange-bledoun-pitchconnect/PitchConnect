/**
 * ============================================================================
 * 📊 PITCHCONNECT ANALYTICS - TYPE DEFINITIONS v7.10.1
 * ============================================================================
 * Enterprise analytics types aligned with Prisma schema v7.10.1
 * Supports injury prediction, performance analysis, market valuation
 * ============================================================================
 */

import { z } from 'zod';

// =============================================================================
// PRISMA ENUM RE-EXPORTS
// =============================================================================

export const SportEnum = z.enum([
  'FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL',
  'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL',
]);
export type Sport = z.infer<typeof SportEnum>;

export const InjuryTypeEnum = z.enum([
  'MUSCLE', 'LIGAMENT', 'BONE', 'CONCUSSION', 'ILLNESS',
  'OTHER', 'TENDON', 'JOINT', 'BACK', 'KNEE', 'ANKLE',
  'HAMSTRING', 'GROIN', 'CALF', 'THIGH', 'SHOULDER',
]);
export type InjuryType = z.infer<typeof InjuryTypeEnum>;

export const InjurySeverityEnum = z.enum([
  'MINOR', 'MODERATE', 'SEVERE', 'CAREER_THREATENING',
]);
export type InjurySeverity = z.infer<typeof InjurySeverityEnum>;

export const InjuryStatusEnum = z.enum([
  'ACTIVE', 'RECOVERING', 'REHABILITATION', 'CLEARED', 'CHRONIC',
]);
export type InjuryStatus = z.infer<typeof InjuryStatusEnum>;

export const BodyPartEnum = z.enum([
  'HEAD', 'NECK', 'SHOULDER', 'ARM', 'ELBOW', 'WRIST', 'HAND',
  'CHEST', 'BACK', 'ABDOMEN', 'HIP', 'GROIN', 'THIGH', 'KNEE',
  'CALF', 'ANKLE', 'FOOT', 'TOE', 'FINGER', 'OTHER',
]);
export type BodyPart = z.infer<typeof BodyPartEnum>;

export const PositionEnum = z.enum([
  // Football
  'GOALKEEPER', 'LEFT_BACK', 'RIGHT_BACK', 'CENTRE_BACK', 'SWEEPER',
  'DEFENSIVE_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'ATTACKING_MIDFIELDER',
  'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER', 'LEFT_WINGER', 'RIGHT_WINGER',
  'STRIKER', 'CENTRE_FORWARD', 'SECOND_STRIKER',
  // Rugby
  'LOOSEHEAD_PROP', 'HOOKER', 'TIGHTHEAD_PROP', 'LOCK', 'FLANKER',
  'BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER', 'NUMBER_EIGHT', 'SCRUM_HALF',
  'FLY_HALF', 'INSIDE_CENTRE', 'OUTSIDE_CENTRE', 'WINGER', 'FULL_BACK',
  // Cricket
  'OPENING_BATTER', 'MIDDLE_ORDER_BATTER', 'ALL_ROUNDER', 'WICKET_KEEPER',
  'FAST_BOWLER', 'SPIN_BOWLER',
  // Basketball
  'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'POWER_FORWARD', 'CENTER_BASKETBALL',
  // American Football
  'QUARTERBACK', 'RUNNING_BACK', 'WIDE_RECEIVER', 'TIGHT_END', 'OFFENSIVE_TACKLE',
  'OFFENSIVE_GUARD', 'CENTER_NFL', 'DEFENSIVE_END', 'DEFENSIVE_TACKLE',
  'LINEBACKER', 'CORNERBACK', 'SAFETY', 'KICKER', 'PUNTER',
  // Netball
  'GOAL_SHOOTER', 'GOAL_ATTACK', 'WING_ATTACK', 'CENTRE', 'WING_DEFENCE',
  'GOAL_DEFENCE', 'GOAL_KEEPER',
  // Other positions...
]);
export type Position = z.infer<typeof PositionEnum>;

export const UserRoleEnum = z.enum([
  'SUPERADMIN', 'ADMIN', 'PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO',
  'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'TREASURER', 'REFEREE',
  'SCOUT', 'ANALYST', 'PARENT', 'GUARDIAN', 'LEAGUE_ADMIN',
  'MEDICAL_STAFF', 'MEDIA_MANAGER', 'FAN',
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const AccountTierEnum = z.enum(['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE']);
export type AccountTier = z.infer<typeof AccountTierEnum>;

// =============================================================================
// CURRENCY SUPPORT
// =============================================================================

export const CurrencyEnum = z.enum(['GBP', 'EUR', 'USD', 'AUD', 'CAD', 'CHF', 'JPY']);
export type Currency = z.infer<typeof CurrencyEnum>;

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  JPY: '¥',
};

export const CURRENCY_RATES: Record<Currency, number> = {
  GBP: 1.00,
  EUR: 1.17,
  USD: 1.27,
  AUD: 1.93,
  CAD: 1.72,
  CHF: 1.11,
  JPY: 189.5,
};

// =============================================================================
// INJURY PREDICTION TYPES
// =============================================================================

export interface InjuryRiskAssessment {
  playerId: string;
  playerName: string;
  sport: Sport;
  position: string;
  
  // Overall risk
  overallRiskScore: number;         // 0-100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  
  // Risk breakdown by factor
  riskFactors: InjuryRiskFactor[];
  
  // Body part specific risks
  bodyPartRisks: BodyPartRisk[];
  
  // Workload analysis
  workloadAnalysis: {
    acuteLoad: number;              // Last 7 days
    chronicLoad: number;            // Last 28 days
    acuteChronicRatio: number;      // ACWR
    trend: 'INCREASING' | 'STABLE' | 'DECREASING';
    riskZone: 'SAFE' | 'CAUTION' | 'DANGER';
  };
  
  // Historical context
  injuryHistory: {
    totalInjuries: number;
    lastInjuryDate?: Date;
    daysSinceLastInjury: number;
    mostCommonType?: InjuryType;
    mostAffectedBodyPart?: BodyPart;
  };
  
  // Recommendations
  recommendations: string[];
  suggestedLoadReduction?: number;  // Percentage
  
  // Metadata
  generatedAt: Date;
  validUntil: Date;
  modelVersion: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface InjuryRiskFactor {
  factor: string;
  contribution: number;             // 0-100
  description: string;
  isModifiable: boolean;
  mitigationActions?: string[];
}

export interface BodyPartRisk {
  bodyPart: BodyPart;
  riskScore: number;                // 0-100
  historicalInjuries: number;
  lastInjuryDate?: Date;
  vulnerabilityReason?: string;
}

// =============================================================================
// PERFORMANCE PREDICTION TYPES
// =============================================================================

export type TimeHorizon = 'NEXT_MATCH' | 'NEXT_WEEK' | 'NEXT_MONTH' | 'SEASON';

export interface PerformancePrediction {
  playerId: string;
  playerName: string;
  sport: Sport;
  position: string;
  timeHorizon: TimeHorizon;
  
  // Predicted metrics
  predictedRating: number;          // 1-10
  ratingRange: { min: number; max: number };
  
  // Sport-specific contributions
  expectedContributions: {
    metric: string;
    predicted: number;
    confidence: number;
    seasonAverage: number;
  }[];
  
  // Form analysis
  currentForm: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
  formTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  formScore: number;                // 0-100
  
  // Factors
  positiveFactors: PerformanceFactor[];
  negativeFactors: PerformanceFactor[];
  
  // Context
  upcomingFixtures?: {
    matchId: string;
    opponent: string;
    expectedDifficulty: number;     // 1-10
  }[];
  
  // Metadata
  generatedAt: Date;
  validUntil: Date;
  modelVersion: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  dataPoints: number;
}

export interface PerformanceFactor {
  factor: string;
  impact: number;                   // -100 to +100
  description: string;
  trend?: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

// =============================================================================
// PLAYER COMPARISON TYPES
// =============================================================================

export interface PlayerComparison {
  player1: PlayerComparisonProfile;
  player2: PlayerComparisonProfile;
  sport: Sport;
  
  // Category comparisons
  categories: CategoryComparison[];
  
  // Overall verdict
  overallWinner?: 'PLAYER1' | 'PLAYER2' | 'DRAW';
  winnerAdvantage: number;          // Percentage
  
  // Key differentiators
  keyDifferences: {
    metric: string;
    player1Value: number;
    player2Value: number;
    advantage: 'PLAYER1' | 'PLAYER2';
    significance: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  
  // Recommendations
  recommendations: {
    forPlayer1: string[];
    forPlayer2: string[];
  };
  
  // Metadata
  generatedAt: Date;
  modelVersion: string;
}

export interface PlayerComparisonProfile {
  playerId: string;
  name: string;
  position: string;
  age: number;
  matchesPlayed: number;
  averageRating: number;
  marketValue?: number;
}

export interface CategoryComparison {
  category: string;
  player1Score: number;
  player2Score: number;
  winner: 'PLAYER1' | 'PLAYER2' | 'DRAW';
  metrics: {
    name: string;
    player1: number;
    player2: number;
    unit?: string;
  }[];
}

// =============================================================================
// MARKET VALUE TYPES
// =============================================================================

export interface MarketValueAssessment {
  playerId: string;
  playerName: string;
  sport: Sport;
  position: string;
  age: number;
  
  // Valuation
  estimatedValue: number;
  currency: Currency;
  valueRange: { min: number; max: number };
  
  // Historical
  previousValue?: number;
  valueChange: number;              // Percentage
  valueTrajectory: 'RISING' | 'STABLE' | 'FALLING';
  peakValue?: number;
  peakValueDate?: Date;
  
  // Factors
  valueFactors: ValueFactor[];
  
  // Comparables
  comparablePlayers: ComparablePlayer[];
  
  // Contract context
  contractInfo?: {
    expiryDate?: Date;
    yearsRemaining?: number;
    contractEffect: number;         // Multiplier
  };
  
  // Market context
  marketContext: {
    positionDemand: 'HIGH' | 'MEDIUM' | 'LOW';
    ageProfile: 'PRIME' | 'DEVELOPING' | 'DECLINING';
    transferWindow: 'OPEN' | 'CLOSED';
    marketTrend: 'INFLATING' | 'STABLE' | 'DEFLATING';
  };
  
  // Metadata
  generatedAt: Date;
  validUntil: Date;
  modelVersion: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ValueFactor {
  factor: string;
  impact: number;                   // Percentage multiplier
  description: string;
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface ComparablePlayer {
  playerId: string;
  name: string;
  age: number;
  position: string;
  marketValue: number;
  similarity: number;               // 0-100
  recentTransferFee?: number;
}

// =============================================================================
// TEAM ANALYTICS TYPES
// =============================================================================

export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  sport: Sport;
  seasonId?: string;
  
  // Performance overview
  performance: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    cleanSheets: number;
  };
  
  // Form
  form: {
    last5: ('W' | 'D' | 'L')[];
    last10: ('W' | 'D' | 'L')[];
    homeForm: number;
    awayForm: number;
    currentStreak: { type: 'W' | 'D' | 'L'; count: number };
  };
  
  // Squad analysis
  squad: {
    totalPlayers: number;
    averageAge: number;
    averageRating: number;
    totalMarketValue: number;
    injuredCount: number;
    suspendedCount: number;
  };
  
  // Key players
  keyPlayers: {
    playerId: string;
    name: string;
    position: string;
    rating: number;
    contributions: number;
  }[];
  
  // Strengths & Weaknesses
  analysis: {
    strengths: string[];
    weaknesses: string[];
  };
}

// =============================================================================
// FORMATION ANALYSIS TYPES
// =============================================================================

export interface FormationAnalysis {
  teamId: string;
  sport: Sport;
  
  // Current formation
  currentFormation: string;
  formationRating: number;
  
  // Alternative suggestions
  suggestions: FormationSuggestion[];
  
  // Position analysis
  positionAnalysis: PositionAnalysis[];
  
  // Rotation suggestions
  rotationSuggestions: RotationSuggestion[];
}

export interface FormationSuggestion {
  formation: string;
  suitability: number;              // 0-100
  advantages: string[];
  disadvantages: string[];
  idealLineup: {
    position: string;
    playerId: string;
    playerName: string;
    rating: number;
  }[];
}

export interface PositionAnalysis {
  position: string;
  currentPlayer?: string;
  depthOptions: {
    playerId: string;
    name: string;
    suitability: number;
  }[];
  isVulnerable: boolean;
  recommendation?: string;
}

export interface RotationSuggestion {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  currentPlayer: string;
  suggestedReplacement: string;
  reason: string;
  expectedImpact: string;
}

// =============================================================================
// ACCESS CONTROL MATRIX
// =============================================================================

export const ANALYTICS_ACCESS_MATRIX: Record<UserRole, {
  canAccess: string[];
  requiresClubMembership: boolean;
  exportAllowed: boolean;
}> = {
  SUPERADMIN: {
    canAccess: ['ALL'],
    requiresClubMembership: false,
    exportAllowed: true,
  },
  ADMIN: {
    canAccess: ['ALL'],
    requiresClubMembership: false,
    exportAllowed: true,
  },
  LEAGUE_ADMIN: {
    canAccess: ['TEAM_ANALYTICS', 'MATCH_ANALYTICS', 'COMPETITION_ANALYTICS'],
    requiresClubMembership: false,
    exportAllowed: true,
  },
  CLUB_OWNER: {
    canAccess: ['TEAM_ANALYTICS', 'PLAYER_ANALYTICS', 'MARKET_VALUE', 'INJURY_RISK', 'FORMATION'],
    requiresClubMembership: true,
    exportAllowed: true,
  },
  CLUB_MANAGER: {
    canAccess: ['TEAM_ANALYTICS', 'PLAYER_ANALYTICS', 'INJURY_RISK', 'FORMATION', 'PERFORMANCE'],
    requiresClubMembership: true,
    exportAllowed: true,
  },
  MANAGER: {
    canAccess: ['TEAM_ANALYTICS', 'PLAYER_ANALYTICS', 'INJURY_RISK', 'FORMATION', 'PERFORMANCE'],
    requiresClubMembership: true,
    exportAllowed: true,
  },
  COACH_PRO: {
    canAccess: ['PLAYER_ANALYTICS', 'INJURY_RISK', 'PERFORMANCE', 'FORMATION', 'COMPARISON'],
    requiresClubMembership: true,
    exportAllowed: true,
  },
  COACH: {
    canAccess: ['PLAYER_ANALYTICS', 'INJURY_RISK', 'PERFORMANCE'],
    requiresClubMembership: true,
    exportAllowed: false,
  },
  ANALYST: {
    canAccess: ['TEAM_ANALYTICS', 'PLAYER_ANALYTICS', 'PERFORMANCE', 'COMPARISON', 'FORMATION'],
    requiresClubMembership: true,
    exportAllowed: true,
  },
  SCOUT: {
    canAccess: ['PLAYER_ANALYTICS', 'MARKET_VALUE', 'COMPARISON', 'PERFORMANCE'],
    requiresClubMembership: false,
    exportAllowed: false,
  },
  TREASURER: {
    canAccess: ['MARKET_VALUE'],
    requiresClubMembership: true,
    exportAllowed: true,
  },
  MEDICAL_STAFF: {
    canAccess: ['INJURY_RISK', 'PLAYER_ANALYTICS'],
    requiresClubMembership: true,
    exportAllowed: true,
  },
  PLAYER_PRO: {
    canAccess: ['PLAYER_ANALYTICS', 'PERFORMANCE', 'INJURY_RISK'],
    requiresClubMembership: true,
    exportAllowed: true,
  },
  PLAYER: {
    canAccess: ['PLAYER_ANALYTICS', 'PERFORMANCE'],
    requiresClubMembership: true,
    exportAllowed: false,
  },
  PARENT: {
    canAccess: ['PLAYER_ANALYTICS', 'INJURY_RISK'],
    requiresClubMembership: true,
    exportAllowed: false,
  },
  GUARDIAN: {
    canAccess: ['PLAYER_ANALYTICS', 'INJURY_RISK'],
    requiresClubMembership: true,
    exportAllowed: false,
  },
  REFEREE: {
    canAccess: ['MATCH_ANALYTICS'],
    requiresClubMembership: false,
    exportAllowed: false,
  },
  MEDIA_MANAGER: {
    canAccess: ['TEAM_ANALYTICS'],
    requiresClubMembership: true,
    exportAllowed: false,
  },
  FAN: {
    canAccess: [],
    requiresClubMembership: false,
    exportAllowed: false,
  },
};

// =============================================================================
// API RESPONSE TYPE
// =============================================================================

export interface AnalyticsAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata: {
    cached: boolean;
    generatedAt: string;
    processingTimeMs: number;
    modelVersion: string;
  };
}

// =============================================================================
// MODEL VERSIONS
// =============================================================================

export const ANALYTICS_MODEL_VERSIONS = {
  injury: '7.10.1-injury',
  performance: '7.10.1-performance',
  comparison: '7.10.1-comparison',
  marketValue: '7.10.1-market-value',
  formation: '7.10.1-formation',
};
