// ============================================================================
// src/lib/analytics/types.ts
// 📊 PitchConnect Enterprise Analytics - Type Definitions
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================

import type {
  Sport,
  Position,
  PredictionType,
  PredictionStatus,
  PredictionImpact,
  InjuryType,
  InjuryStatus,
  InjurySeverity,
} from '@prisma/client';

// ============================================================================
// INJURY PREDICTION TYPES
// ============================================================================

/**
 * Injury risk assessment result
 */
export interface InjuryRiskAssessment {
  playerId: string;
  playerName: string;
  sport: Sport;
  position: Position | null;
  
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0-100
  confidence: number; // 0-100
  
  riskFactors: InjuryRiskFactor[];
  
  bodyPartRisks: BodyPartRisk[];
  
  recommendations: string[];
  
  historicalData: {
    totalInjuries: number;
    injuriesLastYear: number;
    avgRecoveryDays: number;
    mostCommonInjuryType: InjuryType | null;
    daysSinceLastInjury: number | null;
  };
  
  workloadAnalysis: {
    recentMinutesPlayed: number;
    avgMinutesPerMatch: number;
    matchesLast30Days: number;
    restDaysBetweenMatches: number;
    trainingLoadScore: number; // 0-100
    fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  
  metadata: {
    modelVersion: string;
    generatedAt: Date;
    validUntil: Date;
    dataPointsUsed: number;
  };
}

export interface InjuryRiskFactor {
  factor: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  description: string;
  mitigation?: string;
}

export interface BodyPartRisk {
  bodyPart: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  previousInjuries: number;
  lastInjuryDate: Date | null;
}

// ============================================================================
// PERFORMANCE PREDICTION TYPES
// ============================================================================

/**
 * Performance prediction result
 */
export interface PerformancePrediction {
  playerId: string;
  playerName: string;
  sport: Sport;
  position: Position | null;
  timeHorizon: TimeHorizon;
  
  predictions: {
    expectedRating: number;
    ratingRange: { min: number; max: number };
    goalsPredicted: number;
    assistsPredicted: number;
    minutesPredicted: number;
  };
  
  form: {
    current: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    consistency: number; // 0-100
    peakProbability: number; // Chance of peak performance
  };
  
  factors: PerformanceFactor[];
  
  sportSpecificMetrics: Record<string, number>;
  
  comparison: {
    vsPositionAverage: number; // Percentage difference
    vsTeamAverage: number;
    vsLeagueAverage: number;
    percentileRank: number;
  };
  
  recommendations: string[];
  
  metadata: {
    modelVersion: string;
    generatedAt: Date;
    validUntil: Date;
    matchesAnalyzed: number;
    confidence: number;
  };
}

export type TimeHorizon = 'NEXT_MATCH' | 'NEXT_WEEK' | 'NEXT_MONTH' | 'SEASON';

export interface PerformanceFactor {
  factor: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  weight: number;
  description: string;
}

// ============================================================================
// PLAYER COMPARISON TYPES
// ============================================================================

/**
 * Player comparison result
 */
export interface PlayerComparison {
  player1: PlayerComparisonProfile;
  player2: PlayerComparisonProfile;
  
  overallSimilarity: number; // 0-100
  
  headToHead: {
    winner: 'PLAYER1' | 'PLAYER2' | 'DRAW';
    winningCategories: {
      player1: string[];
      player2: string[];
      tied: string[];
    };
    margin: number; // How decisive the comparison is
  };
  
  categoryComparison: CategoryComparison[];
  
  strengthsComparison: {
    player1Advantages: string[];
    player2Advantages: string[];
    sharedStrengths: string[];
  };
  
  valueComparison: {
    player1Value: number;
    player2Value: number;
    valueDifference: number;
    betterValue: 'PLAYER1' | 'PLAYER2' | 'EQUAL';
  };
  
  recommendation: {
    summary: string;
    bestFor: Record<string, 'PLAYER1' | 'PLAYER2'>;
    context: string;
  };
  
  metadata: {
    modelVersion: string;
    generatedAt: Date;
    sport: Sport;
    positionsCompared: string;
  };
}

export interface PlayerComparisonProfile {
  id: string;
  name: string;
  position: Position | null;
  age: number | null;
  overallRating: number;
  formRating: number;
  marketValue: number;
  
  stats: {
    appearances: number;
    goals: number;
    assists: number;
    minutesPlayed: number;
    avgRating: number;
  };
  
  attributes: Record<string, number>;
}

export interface CategoryComparison {
  category: string;
  player1Score: number;
  player2Score: number;
  winner: 'PLAYER1' | 'PLAYER2' | 'DRAW';
  difference: number;
  weight: number; // Importance of this category
}

// ============================================================================
// MARKET VALUE TYPES
// ============================================================================

/**
 * Market value assessment
 */
export interface MarketValueAssessment {
  playerId: string;
  playerName: string;
  sport: Sport;
  position: Position | null;
  age: number | null;
  
  valuation: {
    currentValue: number;
    previousValue: number;
    valueChange: number;
    valueChangePercent: number;
    projectedValue6Months: number;
    projectedValue12Months: number;
  };
  
  breakdown: {
    baseValue: number;
    performanceAdjustment: number;
    ageAdjustment: number;
    contractAdjustment: number;
    injuryAdjustment: number;
    marketDemandAdjustment: number;
  };
  
  factors: ValueFactor[];
  
  trend: 'RISING' | 'STABLE' | 'DECLINING';
  trendStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  
  comparables: ComparablePlayer[];
  
  transferWindow: {
    recommendedAction: 'SELL' | 'HOLD' | 'BUY' | 'MONITOR';
    optimalSellingPrice: number;
    minimumAcceptablePrice: number;
    reasoning: string;
  };
  
  metadata: {
    modelVersion: string;
    generatedAt: Date;
    validUntil: Date;
    dataSourcesUsed: string[];
  };
}

export interface ValueFactor {
  factor: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  adjustment: number;
  description: string;
}

export interface ComparablePlayer {
  playerId: string;
  playerName: string;
  position: Position | null;
  marketValue: number;
  similarity: number; // 0-100
  recentTransfer?: {
    fee: number;
    date: Date;
    fromClub: string;
    toClub: string;
  };
}

// ============================================================================
// FORMATION OPTIMIZATION TYPES
// ============================================================================

/**
 * Formation analysis result
 */
export interface FormationAnalysis {
  teamId: string;
  teamName: string;
  sport: Sport;
  
  currentFormation: string | null;
  
  squadSummary: {
    totalPlayers: number;
    availablePlayers: number;
    injuredPlayers: number;
    suspendedPlayers: number;
    averageRating: number;
    positionBreakdown: Record<string, number>;
  };
  
  suggestedFormations: FormationSuggestion[];
  
  positionAnalysis: PositionAnalysis[];
  
  teamAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  rotationSuggestions: RotationSuggestion[];
  
  strategicRecommendations: string[];
  
  metadata: {
    modelVersion: string;
    generatedAt: Date;
    analysisType: string;
  };
}

export interface FormationSuggestion {
  formation: string;
  suitabilityScore: number; // 0-100
  reasoning: string;
  positionsFilled: string[];
  positionsNeeded: string[];
  expectedPerformance: number;
}

export interface PositionAnalysis {
  position: string;
  playerCount: number;
  averageRating: number;
  bestPlayer: { id: string; name: string; rating: number } | null;
  depth: 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'POOR' | 'CRITICAL';
  recommendation: string;
}

export interface RotationSuggestion {
  playerIn: { id: string; name: string; position: string };
  playerOut: { id: string; name: string; position: string };
  reason: string;
  expectedImpact: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ============================================================================
// TEAM ANALYTICS TYPES
// ============================================================================

/**
 * Team analytics result
 */
export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  clubId: string;
  clubName: string;
  sport: Sport;
  
  performance: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    winRate: number;
    avgGoalsScored: number;
    avgGoalsConceded: number;
  };
  
  form: {
    current: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
    recentResults: string; // e.g., "WWDLW"
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    homeForm: string;
    awayForm: string;
  };
  
  squad: {
    totalPlayers: number;
    averageAge: number;
    averageRating: number;
    injuredCount: number;
    topScorer: { id: string; name: string; goals: number } | null;
    topAssister: { id: string; name: string; assists: number } | null;
  };
  
  standings: {
    position: number | null;
    pointsFromTop: number | null;
    pointsFromSafety: number | null;
    competitionId: string | null;
    competitionName: string | null;
  } | null;
  
  sportSpecificStats: Record<string, number>;
}

// ============================================================================
// MATCH ANALYTICS TYPES
// ============================================================================

/**
 * Match analytics result
 */
export interface MatchAnalytics {
  matchId: string;
  date: Date;
  status: string;
  sport: Sport;
  
  competition: {
    id: string;
    name: string;
  } | null;
  
  homeTeam: TeamMatchData;
  awayTeam: TeamMatchData;
  
  statistics: {
    totalGoals: number;
    goalDifference: number;
    outcome: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW';
    totalEvents: number;
  };
  
  eventBreakdown: {
    goals: number;
    yellowCards: number;
    redCards: number;
    substitutions: number;
    penalties: number;
  };
  
  performanceHighlights: {
    motm: { id: string; name: string; rating: number } | null;
    topScorer: { id: string; name: string; goals: number } | null;
  };
}

export interface TeamMatchData {
  id: string;
  name: string;
  shortName: string | null;
  score: number;
  outcome: 'WIN' | 'DRAW' | 'LOSS';
  possession?: number;
  shots?: number;
  shotsOnTarget?: number;
}

// ============================================================================
// COMPETITION ANALYTICS TYPES
// ============================================================================

/**
 * Competition analytics result
 */
export interface CompetitionAnalytics {
  competitionId: string;
  competitionName: string;
  type: string;
  sport: Sport;
  season: string | null;
  
  statistics: {
    totalTeams: number;
    totalMatches: number;
    completedMatches: number;
    totalGoals: number;
    avgGoalsPerMatch: number;
    totalCards: number;
  };
  
  topPerformers: {
    leader: {
      teamId: string;
      teamName: string;
      position: number;
      points: number;
    } | null;
    topScorer: {
      playerId: string;
      playerName: string;
      goals: number;
    } | null;
    topAssister: {
      playerId: string;
      playerName: string;
      assists: number;
    } | null;
  };
  
  standings: CompetitionStandingEntry[];
  
  recentMatches: MatchSummary[];
}

export interface CompetitionStandingEntry {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface MatchSummary {
  matchId: string;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
}

// ============================================================================
// PLAYER ANALYTICS TYPES
// ============================================================================

/**
 * Player analytics result
 */
export interface PlayerAnalytics {
  playerId: string;
  playerName: string;
  position: Position | null;
  secondaryPosition: Position | null;
  sport: Sport;
  
  team: {
    id: string;
    name: string;
    clubId: string;
    clubName: string;
  } | null;
  
  stats: {
    season: string;
    appearances: number;
    starts: number;
    minutesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
  
  ratings: {
    overall: number;
    form: number;
    potential: number;
    consistency: number;
  };
  
  performance: {
    form: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    peakRating: number;
    avgRating: number;
  };
  
  health: {
    availabilityStatus: string;
    activeInjuries: number;
    injuryRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  
  sportSpecificStats: Record<string, number>;
}

// ============================================================================
// ADVANCED ANALYTICS TYPES
// ============================================================================

/**
 * Advanced analytics result
 */
export interface AdvancedAnalytics {
  scope: {
    type: 'COMPETITION' | 'CLUB' | 'TEAM' | 'PLAYER';
    id: string;
    name: string;
  };
  
  timeRange: {
    start: Date;
    end: Date;
    label: string;
  };
  
  sport: Sport;
  
  topScorers: LeaderboardEntry[];
  topAssisters: LeaderboardEntry[];
  topRated: LeaderboardEntry[];
  
  teamRankings: TeamRankingEntry[];
  
  trends: {
    goalsPerMatch: TrendData[];
    winRates: TrendData[];
    averageRatings: TrendData[];
  };
  
  insights: AnalyticsInsight[];
  
  metadata: {
    modelVersion: string;
    generatedAt: Date;
    matchesAnalyzed: number;
    playersAnalyzed: number;
  };
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  teamName: string;
  position: string;
  value: number;
  appearances: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface TeamRankingEntry {
  teamId: string;
  teamName: string;
  rank: number;
  score: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
}

export interface AnalyticsInsight {
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  category: string;
  message: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface AnalyticsAPIResponse<T> {
  success: boolean;
  requestId: string;
  data: T;
  meta: {
    generatedAt: string;
    processingTimeMs: number;
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
// ROLE-BASED ACCESS
// ============================================================================

export const ANALYTICS_ACCESS_MATRIX: Record<string, {
  canAccess: string[];
  requiresClubMembership: boolean;
}> = {
  SUPER_ADMIN: {
    canAccess: ['ALL'],
    requiresClubMembership: false,
  },
  CLUB_OWNER: {
    canAccess: ['team', 'player', 'competition', 'market-value', 'formation', 'advanced'],
    requiresClubMembership: true,
  },
  MANAGER: {
    canAccess: ['team', 'player', 'competition', 'formation', 'injury', 'performance', 'comparison', 'advanced'],
    requiresClubMembership: true,
  },
  HEAD_COACH: {
    canAccess: ['team', 'player', 'formation', 'injury', 'performance', 'comparison', 'matches'],
    requiresClubMembership: true,
  },
  ANALYST: {
    canAccess: ['team', 'player', 'competition', 'formation', 'performance', 'comparison', 'matches', 'advanced'],
    requiresClubMembership: true,
  },
  SCOUT: {
    canAccess: ['player', 'market-value', 'comparison', 'performance'],
    requiresClubMembership: false,
  },
  MEDICAL_STAFF: {
    canAccess: ['injury', 'player'],
    requiresClubMembership: true,
  },
  PERFORMANCE_COACH: {
    canAccess: ['player', 'performance', 'injury', 'matches'],
    requiresClubMembership: true,
  },
  PLAYER: {
    canAccess: ['player-own', 'performance-own', 'injury-own'],
    requiresClubMembership: true,
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  Sport,
  Position,
  PredictionType,
  PredictionStatus,
  PredictionImpact,
  InjuryType,
  InjuryStatus,
  InjurySeverity,
};