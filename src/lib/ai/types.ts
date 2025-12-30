// ============================================================================
// src/lib/ai/types.ts
// 🤖 PitchConnect Enterprise AI Prediction System - Type Definitions
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: Football, Rugby, Cricket, Basketball, American Football,
//              Netball, Hockey, Lacrosse, Australian Rules, Gaelic Football,
//              Futsal, Beach Football
// ============================================================================

import type {
  Sport,
  Position,
  PredictionType,
  PredictionStatus,
  PredictionImpact,
  ClubMemberRole,
  UserRole,
  MatchStatus,
} from '@prisma/client';

// ============================================================================
// PREDICTION ENGINE CONFIGURATION
// ============================================================================

/**
 * Sport-specific configuration for prediction algorithms
 */
export interface SportPredictionConfig {
  sport: Sport;
  displayName: string;
  
  // Scoring system
  scoring: {
    maxPointsPerMatch: number;
    winPoints: number;
    drawPoints: number;
    lossPoints: number;
    bonusPointsAvailable: boolean;
  };
  
  // Match configuration
  match: {
    standardDuration: number; // minutes
    hasExtraTime: boolean;
    hasPenalties: boolean;
    hasOvertimePeriods: boolean;
    periodsCount: number;
  };
  
  // Prediction weights (must sum to 100)
  weights: {
    recentForm: number;           // Last 5-10 matches
    headToHead: number;           // Historical matchups
    homeAdvantage: number;        // Home/away factor
    squadStrength: number;        // Player quality
    injuryImpact: number;         // Missing key players
    restDays: number;             // Fatigue factor
    competitionImportance: number; // Match stakes
  };
  
  // Key performance metrics for this sport
  keyMetrics: string[];
  
  // Position categories for squad analysis
  positionCategories: {
    category: string;
    positions: Position[];
    importanceWeight: number;
  }[];
}

/**
 * Feature vector for match prediction
 */
export interface MatchFeatureVector {
  // Team identifiers
  homeTeamId: string;
  awayTeamId: string;
  
  // Form metrics (0-100 scale)
  homeRecentForm: number;
  awayRecentForm: number;
  homeGoalsScoredAvg: number;
  awayGoalsScoredAvg: number;
  homeGoalsConcededAvg: number;
  awayGoalsConcededAvg: number;
  
  // Head-to-head
  h2hHomeWins: number;
  h2hAwayWins: number;
  h2hDraws: number;
  h2hTotalMatches: number;
  
  // Squad strength (0-100)
  homeSquadRating: number;
  awaySquadRating: number;
  homeKeyPlayersAvailable: number;
  awayKeyPlayersAvailable: number;
  
  // Contextual factors
  homeRestDays: number;
  awayRestDays: number;
  competitionImportance: number; // 0-100
  isNeutralVenue: boolean;
  
  // Sport-specific metrics (JSON)
  sportSpecificFeatures: Record<string, number>;
}

/**
 * Player performance feature vector
 */
export interface PlayerFeatureVector {
  playerId: string;
  sport: Sport;
  position: Position | null;
  
  // Recent performance (last 10 matches)
  matchesPlayed: number;
  minutesPlayed: number;
  goalsScored: number;
  assists: number;
  
  // Form indicators
  averageRating: number;
  ratingTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  consistencyScore: number; // Standard deviation inverse
  
  // Physical metrics
  fatigueLevel: number; // 0-100
  injuryHistory: number; // Risk factor
  daysSinceLastMatch: number;
  recentTrainingLoad: number;
  
  // Position-specific metrics
  positionMetrics: Record<string, number>;
}

/**
 * Team analytics feature vector
 */
export interface TeamFeatureVector {
  teamId: string;
  clubId: string;
  sport: Sport;
  
  // Performance metrics
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  
  // Advanced metrics
  formScore: number; // 0-100
  homeFormScore: number;
  awayFormScore: number;
  goalDifferentialTrend: number;
  cleanSheetPercentage: number;
  
  // Squad analysis
  squadDepth: number;
  averageSquadRating: number;
  keyPlayerCount: number;
  injuredPlayerCount: number;
  
  // Competition context
  leaguePosition: number | null;
  pointsFromTop: number | null;
  pointsFromSafety: number | null;
}

// ============================================================================
// PREDICTION OUTPUT TYPES
// ============================================================================

/**
 * Match prediction result
 */
export interface MatchPrediction {
  matchId: string;
  
  // Probabilities (must sum to 100)
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  
  // Predicted outcome
  predictedOutcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
  
  // Expected scores
  expectedHomeScore: number;
  expectedAwayScore: number;
  expectedTotalGoals: number;
  
  // Confidence metrics
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number; // 0-100
  
  // Key factors
  keyFactors: PredictionFactor[];
  
  // Risk assessment
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: string[];
  
  // Model metadata
  modelVersion: string;
  dataPoints: number;
  generatedAt: Date;
  validUntil: Date;
}

/**
 * Player performance prediction
 */
export interface PlayerPrediction {
  playerId: string;
  playerName: string;
  position: Position | null;
  sport: Sport;
  
  // Performance predictions
  predictions: {
    nextMatchRating: number;
    goalsNext5Matches: number;
    assistsNext5Matches: number;
    minutesExpected: number;
  };
  
  // Risk assessments
  risks: {
    injuryRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    injuryRiskScore: number;
    fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    formDropRisk: number;
  };
  
  // Development insights
  development: {
    currentLevel: string;
    potentialRating: number;
    developmentAreas: string[];
    strengths: string[];
    weaknesses: string[];
  };
  
  // Trend analysis
  trends: {
    performanceTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    weeklyChange: number;
    monthlyChange: number;
    seasonChange: number;
  };
  
  // Recommendations
  recommendations: string[];
  
  // Model metadata
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  modelVersion: string;
  generatedAt: Date;
}

/**
 * Team prediction result
 */
export interface TeamPrediction {
  teamId: string;
  teamName: string;
  clubId: string;
  sport: Sport;
  
  // Season projections
  seasonProjection: {
    predictedPosition: number;
    predictedPoints: number;
    promotionProbability: number;
    relegationRisk: number;
    titleChanceProbability: number;
  };
  
  // Form analysis
  formAnalysis: {
    currentForm: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
    formScore: number;
    formTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    expectedPointsNext5: number;
  };
  
  // Squad health
  squadHealth: {
    overallFitness: number;
    injuryCount: number;
    suspensionCount: number;
    fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    squadDepthScore: number;
  };
  
  // Strengths and weaknesses
  analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  // Recommendations
  recommendations: TeamRecommendation[];
  
  // Model metadata
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  modelVersion: string;
  generatedAt: Date;
}

/**
 * Prediction factor explanation
 */
export interface PredictionFactor {
  factor: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  weight: number;
  description: string;
  dataPoint?: string | number;
}

/**
 * Team recommendation
 */
export interface TeamRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'STRATEGY' | 'PLAYER_DEVELOPMENT' | 'LINEUP' | 'RECRUITMENT' | 'FITNESS';
  recommendation: string;
  rationale: string;
  expectedImpact: string;
  implementation: string[];
}

// ============================================================================
// CACHING TYPES
// ============================================================================

/**
 * Cached prediction wrapper
 */
export interface CachedPrediction<T> {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
  cacheKey: string;
  hitCount: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  matchPredictionTTL: number;    // seconds
  playerPredictionTTL: number;
  teamPredictionTTL: number;
  recommendationTTL: number;
  maxCacheSize: number;          // entries
  cleanupInterval: number;       // seconds
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Match prediction request
 */
export interface MatchPredictionRequest {
  matchId?: string;
  competitionId?: string;
  clubId?: string;
  upcomingOnly?: boolean;
  limit?: number;
  includeAnalytics?: boolean;
}

/**
 * Player prediction request
 */
export interface PlayerPredictionRequest {
  playerId?: string;
  teamId?: string;
  clubId?: string;
  position?: Position;
  sport?: Sport;
  limit?: number;
}

/**
 * Team prediction request
 */
export interface TeamPredictionRequest {
  teamId?: string;
  clubId?: string;
  competitionId?: string;
  sport?: Sport;
  forecastDays?: number;
}

/**
 * Recommendation request
 */
export interface RecommendationRequest {
  teamId?: string;
  clubId?: string;
  category: 'STRATEGY' | 'PLAYER_DEVELOPMENT' | 'LINEUP' | 'RECRUITMENT' | 'ALL';
  context?: 'UPCOMING_MATCH' | 'SEASON_PLANNING' | 'INJURY_CRISIS' | 'GENERAL';
}

/**
 * Standard API response wrapper
 */
export interface PredictionAPIResponse<T> {
  success: boolean;
  requestId: string;
  data: T;
  meta: {
    generatedAt: string;
    processingTimeMs: number;
    modelVersion: string;
    cacheHit: boolean;
    sport?: Sport;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

/**
 * Prediction access context
 */
export interface PredictionAccessContext {
  userId: string;
  userRoles: UserRole[];
  organisationId?: string;
  clubId?: string;
  teamId?: string;
  permissions: string[];
}

/**
 * Role-based prediction access
 */
export const PREDICTION_ACCESS_MATRIX: Record<string, {
  canView: PredictionType[];
  canCreate: boolean;
  canExport: boolean;
  requiresClubMembership: boolean;
}> = {
  SUPER_ADMIN: {
    canView: Object.values({} as Record<string, PredictionType>), // All types
    canCreate: true,
    canExport: true,
    requiresClubMembership: false,
  },
  CLUB_OWNER: {
    canView: ['MATCH_OUTCOME', 'PLAYER_PERFORMANCE', 'TEAM_CHEMISTRY', 'MARKET_VALUE', 'TRANSFER_LIKELIHOOD'] as any,
    canCreate: true,
    canExport: true,
    requiresClubMembership: true,
  },
  MANAGER: {
    canView: ['MATCH_OUTCOME', 'PLAYER_PERFORMANCE', 'TEAM_CHEMISTRY', 'LINEUP', 'TACTICAL_MATCHUP'] as any,
    canCreate: true,
    canExport: true,
    requiresClubMembership: true,
  },
  HEAD_COACH: {
    canView: ['MATCH_OUTCOME', 'PLAYER_PERFORMANCE', 'LINEUP', 'TACTICAL_MATCHUP', 'INJURY_RISK', 'FATIGUE_LEVEL'] as any,
    canCreate: true,
    canExport: true,
    requiresClubMembership: true,
  },
  ANALYST: {
    canView: ['MATCH_OUTCOME', 'PLAYER_PERFORMANCE', 'TEAM_CHEMISTRY', 'TACTICAL_MATCHUP', 'FORM_TREND'] as any,
    canCreate: true,
    canExport: true,
    requiresClubMembership: true,
  },
  SCOUT: {
    canView: ['PLAYER_PERFORMANCE', 'POTENTIAL_RATING', 'DEVELOPMENT_PATH', 'RECRUITMENT_FIT'] as any,
    canCreate: false,
    canExport: false,
    requiresClubMembership: false,
  },
  PLAYER: {
    canView: ['PLAYER_PERFORMANCE', 'INJURY_RISK', 'DEVELOPMENT_PATH'] as any, // Own profile only
    canCreate: false,
    canExport: false,
    requiresClubMembership: true,
  },
};

// ============================================================================
// SPORT-SPECIFIC METRIC TYPES
// ============================================================================

/**
 * Football/Soccer specific metrics
 */
export interface FootballMetrics {
  expectedGoals: number;
  expectedAssists: number;
  passCompletionRate: number;
  pressureSuccessRate: number;
  aerialDuelsWonRate: number;
  tackleSuccessRate: number;
  dribbleSuccessRate: number;
  shotAccuracy: number;
  keyPassesPerMatch: number;
  progressiveCarriesPerMatch: number;
}

/**
 * Rugby specific metrics
 */
export interface RugbyMetrics {
  triesScored: number;
  triesAssisted: number;
  conversionsRate: number;
  penaltySuccessRate: number;
  lineoutWinRate: number;
  scrumWinRate: number;
  tackleCompletionRate: number;
  metersGainedPerMatch: number;
  offloadsPerMatch: number;
  turnoversWonPerMatch: number;
}

/**
 * Cricket specific metrics
 */
export interface CricketMetrics {
  battingAverage: number;
  strikeRate: number;
  bowlingAverage: number;
  economyRate: number;
  catchSuccessRate: number;
  boundaryRate: number;
  dotBallPercentage: number;
  wicketsPerMatch: number;
  centuryConversionRate: number;
}

/**
 * Basketball specific metrics
 */
export interface BasketballMetrics {
  pointsPerGame: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  plusMinus: number;
}

/**
 * American Football specific metrics
 */
export interface AmericanFootballMetrics {
  passingYardsPerGame: number;
  rushingYardsPerGame: number;
  completionPercentage: number;
  touchdownsPerGame: number;
  interceptionsPerGame: number;
  sacksAllowed: number;
  yardsAfterCatch: number;
  thirdDownConversionRate: number;
  redZoneEfficiency: number;
}

/**
 * Netball specific metrics
 */
export interface NetballMetrics {
  goalPercentage: number;
  centrePassReceives: number;
  feedsPerMatch: number;
  goalAssistsPerMatch: number;
  interceptionsPerMatch: number;
  deflectionsPerMatch: number;
  reboundsPerMatch: number;
  penaltiesPerMatch: number;
}

/**
 * Hockey specific metrics
 */
export interface HockeyMetrics {
  goalsPerGame: number;
  assistsPerGame: number;
  pointsPerGame: number;
  plusMinus: number;
  shootingPercentage: number;
  faceoffWinPercentage: number;
  blockedShotsPerGame: number;
  hitsPerGame: number;
  penaltyMinutesPerGame: number;
  powerPlayPercentage: number;
  penaltyKillPercentage: number;
}

/**
 * Union type for all sport metrics
 */
export type SportMetrics = 
  | FootballMetrics 
  | RugbyMetrics 
  | CricketMetrics 
  | BasketballMetrics 
  | AmericanFootballMetrics 
  | NetballMetrics 
  | HockeyMetrics;

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  Sport,
  Position,
  PredictionType,
  PredictionStatus,
  PredictionImpact,
  ClubMemberRole,
  UserRole,
  MatchStatus,
};