/**
 * ============================================================================
 * 🤖 PITCHCONNECT AI MODULE - TYPE DEFINITIONS v7.10.1
 * ============================================================================
 * Enterprise AI prediction types aligned with Prisma schema v7.10.1
 * Supports all 12 sports with position-aware predictions
 * ============================================================================
 */

import { z } from 'zod';

// =============================================================================
// PRISMA ENUM RE-EXPORTS (for type safety without Prisma dependency)
// =============================================================================

export const SportEnum = z.enum([
  'FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL',
  'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL',
]);
export type Sport = z.infer<typeof SportEnum>;

export const PredictionTypeEnum = z.enum([
  'PERFORMANCE', 'FORM_TREND', 'GOALS_ASSISTS', 'INJURY_RISK',
  'FATIGUE_LEVEL', 'RECOVERY_TIME', 'MARKET_VALUE', 'TRANSFER_LIKELIHOOD',
  'CONTRACT_VALUE', 'FORMATION', 'LINEUP', 'TACTICAL_MATCHUP',
  'MATCH_OUTCOME', 'SCORE_PREDICTION', 'POTENTIAL_RATING',
  'DEVELOPMENT_PATH', 'TEAM_CHEMISTRY', 'RECRUITMENT_FIT',
]);
export type PredictionType = z.infer<typeof PredictionTypeEnum>;

export const PredictionStatusEnum = z.enum([
  'PENDING', 'ACTIVE', 'VERIFIED_CORRECT', 'VERIFIED_INCORRECT',
  'PARTIALLY_CORRECT', 'EXPIRED', 'INVALIDATED',
]);
export type PredictionStatus = z.infer<typeof PredictionStatusEnum>;

export const PredictionImpactEnum = z.enum([
  'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL',
]);
export type PredictionImpact = z.infer<typeof PredictionImpactEnum>;

export const UserRoleEnum = z.enum([
  'SUPERADMIN', 'ADMIN', 'PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO',
  'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'TREASURER', 'REFEREE',
  'SCOUT', 'ANALYST', 'PARENT', 'GUARDIAN', 'LEAGUE_ADMIN',
  'MEDICAL_STAFF', 'MEDIA_MANAGER', 'FAN',
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const ClubMemberRoleEnum = z.enum([
  'OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'PLAYER', 'STAFF',
  'TREASURER', 'SCOUT', 'ANALYST', 'MEDICAL_STAFF', 'PHYSIOTHERAPIST',
  'NUTRITIONIST', 'PSYCHOLOGIST', 'PERFORMANCE_COACH', 'GOALKEEPING_COACH',
  'KIT_MANAGER', 'MEDIA_OFFICER', 'VIDEO_ANALYST',
]);
export type ClubMemberRole = z.infer<typeof ClubMemberRoleEnum>;

export const AccountTierEnum = z.enum(['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE']);
export type AccountTier = z.infer<typeof AccountTierEnum>;

// =============================================================================
// SPORT CONFIGURATION TYPES
// =============================================================================

export interface SportPredictionConfig {
  sport: Sport;
  displayName: string;
  icon: string;
  
  scoring: {
    maxPointsPerMatch: number;
    winPoints: number;
    drawPoints: number;
    lossPoints: number;
    bonusPointsAvailable: boolean;
    scoringTerminology: {
      primary: string;      // "Goal", "Try", "Touchdown", etc.
      secondary?: string;   // "Behind", "Conversion", etc.
    };
  };
  
  match: {
    standardDuration: number;
    hasExtraTime: boolean;
    hasPenalties: boolean;
    hasOvertimePeriods: boolean;
    periodsCount: number;
    periodName: string;     // "Half", "Quarter", "Period", "Innings"
  };
  
  weights: {
    recentForm: number;
    headToHead: number;
    homeAdvantage: number;
    squadStrength: number;
    injuryImpact: number;
    restDays: number;
    competitionImportance: number;
  };
  
  keyMetrics: string[];
  
  positionCategories: {
    category: string;
    positions: string[];
    importanceWeight: number;
  }[];
}

// =============================================================================
// PREDICTION ACCESS & PERMISSIONS
// =============================================================================

export interface PredictionAccessContext {
  userId: string;
  userRoles: UserRole[];
  accountTier: AccountTier;
  permissions: string[];
  organisationId?: string;
  clubId?: string;
  teamId?: string;
  playerId?: string;
  linkedChildIds?: string[];  // For PARENT/GUARDIAN roles
  isMinor?: boolean;          // GDPR: Data subject is under 18
}

export interface RolePredictionAccess {
  viewable: PredictionType[];
  canCreate: boolean;
  canExport: boolean;
  requiresEntityMembership: boolean;
  maxPredictionsPerDay?: number;  // Rate limiting
}

export interface TierFeatureAccess {
  predictions: {
    matchOutcome: boolean;
    playerPerformance: boolean;
    injuryRisk: boolean;
    marketValue: boolean;
    teamChemistry: boolean;
    tacticalMatchup: boolean;
    developmentPath: boolean;
    recruitmentFit: boolean;
  };
  analytics: {
    basicStats: boolean;
    advancedMetrics: boolean;
    comparisons: boolean;
    exports: boolean;
    historicalData: boolean;
    realTimeUpdates: boolean;
  };
  limits: {
    predictionsPerMonth: number;
    comparisonsPerMonth: number;
    exportsPerMonth: number;
    historicalDays: number;
  };
}

// =============================================================================
// FEATURE VECTORS (Input for predictions)
// =============================================================================

export interface MatchFeatureVector {
  // Team identifiers
  homeClubId: string;
  awayClubId: string;
  sport: Sport;
  competitionId?: string;
  
  // Form metrics (0-100 scale)
  homeRecentForm: number;
  awayRecentForm: number;
  homeFormLast5: number[];    // W=3, D=1, L=0
  awayFormLast5: number[];
  
  // Head-to-head
  h2hHomeWins: number;
  h2hAwayWins: number;
  h2hDraws: number;
  h2hTotalMatches: number;
  h2hHomeGoals: number;
  h2hAwayGoals: number;
  
  // Venue
  isNeutralVenue: boolean;
  homeHomeFormScore: number;
  awayAwayFormScore: number;
  
  // Squad metrics
  homeSquadRating: number;      // Average player rating
  awaySquadRating: number;
  homeKeyPlayersAvailable: number;  // Percentage (0-100)
  awayKeyPlayersAvailable: number;
  
  // Fitness & rest
  homeRestDays: number;
  awayRestDays: number;
  homeAverageFatigue: number;   // 0-100
  awayAverageFatigue: number;
  
  // Goals/scoring (generic - works for all sports)
  homeGoalsScoredAvg: number;
  awayGoalsScoredAvg: number;
  homeGoalsConcededAvg: number;
  awayGoalsConcededAvg: number;
  
  // Competition context
  competitionImportance: number;  // 0-100 (League < Cup < Final)
  matchweek?: number;
  isKnockout: boolean;
  
  // Weather (for outdoor sports)
  weatherConditions?: 'CLEAR' | 'RAIN' | 'SNOW' | 'WIND' | 'EXTREME';
}

export interface PlayerFeatureVector {
  playerId: string;
  sport: Sport;
  position: string;
  age: number;
  isYouth: boolean;           // Under 18
  
  // Performance metrics
  matchesPlayed: number;
  minutesPlayed: number;
  averageRating: number;
  consistencyScore: number;   // Std deviation of ratings
  
  // Contribution (generic across sports)
  goalsScored: number;        // Or tries, touchdowns, etc.
  assists: number;
  keyContributions: number;   // Sport-specific key stats
  
  // Form analysis
  last5Ratings: number[];
  ratingTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  formScore: number;          // 0-100
  
  // Physical metrics
  fatigueLevel: number;       // 0-100
  fitnessScore: number;       // 0-100
  injuryHistoryScore: number; // Risk factor from history
  daysSinceLastInjury: number;
  
  // Development (for youth/potential)
  potentialRating: number;
  developmentProgress: number;
  trainingAttendance: number; // Percentage
  
  // Contract & value
  contractEndDate?: Date;
  currentMarketValue?: number;
  valueTrajectory: 'RISING' | 'STABLE' | 'FALLING';
}

export interface TeamFeatureVector {
  teamId: string;
  clubId: string;
  sport: Sport;
  competitionId?: string;
  
  // Results
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  
  // Scoring
  goalsFor: number;
  goalsAgainst: number;
  cleanSheetPercentage: number;
  
  // Form
  homeFormScore: number;
  awayFormScore: number;
  overallFormScore: number;
  last5Results: ('W' | 'D' | 'L')[];
  
  // Squad
  squadDepth: number;         // Quality of backup players
  keyPlayerCount: number;
  injuredPlayerCount: number;
  suspendedPlayerCount: number;
  averageSquadAge: number;
  
  // Chemistry
  teamChemistryScore: number;
  managerTenure: number;      // Days
  
  // Position in table
  currentPosition?: number;
  pointsFromTop?: number;
  pointsFromBottom?: number;
}

// =============================================================================
// PREDICTION OUTPUTS
// =============================================================================

export interface PredictionFactor {
  factor: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  weight: number;
  description: string;
  value?: number | string;
}

export interface BasePrediction {
  id?: string;
  modelVersion: string;
  generatedAt: Date;
  validUntil: Date;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;    // 0-100
  dataPoints: number;         // Number of data points used
  sport: Sport;
}

export interface MatchPrediction extends BasePrediction {
  matchId: string;
  homeClubId: string;
  awayClubId: string;
  
  // Outcome probabilities
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedOutcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
  
  // Score prediction
  expectedHomeScore: number;
  expectedAwayScore: number;
  expectedTotalGoals: number;
  scoreProbabilities?: {
    score: string;            // "2-1", "0-0", etc.
    probability: number;
  }[];
  
  // Analysis
  keyFactors: PredictionFactor[];
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskFactors: string[];
  
  // Betting insights (PREMIUM+)
  bttsLikelihood?: number;    // Both teams to score
  overUnderLines?: {
    line: number;
    overProbability: number;
    underProbability: number;
  }[];
}

export interface PlayerPrediction extends BasePrediction {
  playerId: string;
  playerName: string;
  position: string;
  predictionType: PredictionType;
  
  // Performance prediction
  predictedRating: number;
  ratingRange: { min: number; max: number };
  expectedContributions: {
    metric: string;
    value: number;
    unit: string;
  }[];
  
  // Risk assessment
  injuryRiskScore: number;    // 0-100
  injuryRiskFactors: string[];
  fatigueLevel: number;
  recommendedMinutes: number;
  
  // Form analysis
  formAnalysis: {
    currentForm: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    comparedToSeason: number; // +/- percentage
  };
  
  // Development (for youth)
  developmentInsights?: {
    areasOfStrength: string[];
    areasForImprovement: string[];
    potentialCeiling: number;
    timeToReachPotential: string;
  };
  
  // Recommendations
  recommendations: string[];
  trainingFocus?: string[];
}

export interface TeamPrediction extends BasePrediction {
  teamId: string;
  teamName: string;
  competitionId?: string;
  
  // Season projection
  projectedFinish: {
    bestCase: number;
    mostLikely: number;
    worstCase: number;
  };
  projectedPoints: number;
  
  // Form analysis
  formAnalysis: {
    currentForm: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
    formScore: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    homeVsAway: {
      homeStrength: number;
      awayStrength: number;
    };
  };
  
  // SWOT Analysis
  analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  // Squad analysis
  squadHealth: {
    overallFitness: number;
    injuryRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    keyPlayerAvailability: number;
    depthScore: number;
  };
  
  // Recommendations
  recommendations: TeamRecommendation[];
}

export interface TeamRecommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'STRATEGY' | 'LINEUP' | 'TRAINING' | 'FITNESS' | 'PLAYER_DEVELOPMENT' | 'RECRUITMENT';
  recommendation: string;
  rationale: string;
  expectedImpact: string;
  implementation: string[];
  timeframe?: string;
}

// =============================================================================
// CACHE TYPES
// =============================================================================

export interface CacheConfig {
  matchPredictionTTL: number;     // Seconds
  playerPredictionTTL: number;
  teamPredictionTTL: number;
  recommendationTTL: number;
  maxCacheSize: number;
  cleanupInterval: number;
}

export interface CachedPrediction<T> {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
  cacheKey: string;
  hitCount: number;
  lastAccessed?: Date;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface PredictionAPIResponse<T> {
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
// AUDIT & LOGGING
// =============================================================================

export interface PredictionAccessLog {
  id?: string;
  userId: string;
  action: 'VIEW' | 'CREATE' | 'EXPORT' | 'INVALIDATE';
  predictionType: PredictionType;
  entityType: 'player' | 'team' | 'match' | 'club';
  entityId: string;
  allowed: boolean;
  reason?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  accountTier: AccountTier;
}

// =============================================================================
// TIER FEATURE MATRIX
// =============================================================================

export const TIER_FEATURES: Record<AccountTier, TierFeatureAccess> = {
  FREE: {
    predictions: {
      matchOutcome: true,
      playerPerformance: false,
      injuryRisk: false,
      marketValue: false,
      teamChemistry: false,
      tacticalMatchup: false,
      developmentPath: false,
      recruitmentFit: false,
    },
    analytics: {
      basicStats: true,
      advancedMetrics: false,
      comparisons: false,
      exports: false,
      historicalData: false,
      realTimeUpdates: false,
    },
    limits: {
      predictionsPerMonth: 10,
      comparisonsPerMonth: 0,
      exportsPerMonth: 0,
      historicalDays: 7,
    },
  },
  PRO: {
    predictions: {
      matchOutcome: true,
      playerPerformance: true,
      injuryRisk: true,
      marketValue: false,
      teamChemistry: true,
      tacticalMatchup: false,
      developmentPath: true,
      recruitmentFit: false,
    },
    analytics: {
      basicStats: true,
      advancedMetrics: true,
      comparisons: true,
      exports: true,
      historicalData: true,
      realTimeUpdates: false,
    },
    limits: {
      predictionsPerMonth: 100,
      comparisonsPerMonth: 20,
      exportsPerMonth: 10,
      historicalDays: 90,
    },
  },
  PREMIUM: {
    predictions: {
      matchOutcome: true,
      playerPerformance: true,
      injuryRisk: true,
      marketValue: true,
      teamChemistry: true,
      tacticalMatchup: true,
      developmentPath: true,
      recruitmentFit: true,
    },
    analytics: {
      basicStats: true,
      advancedMetrics: true,
      comparisons: true,
      exports: true,
      historicalData: true,
      realTimeUpdates: true,
    },
    limits: {
      predictionsPerMonth: 500,
      comparisonsPerMonth: 100,
      exportsPerMonth: 50,
      historicalDays: 365,
    },
  },
  ENTERPRISE: {
    predictions: {
      matchOutcome: true,
      playerPerformance: true,
      injuryRisk: true,
      marketValue: true,
      teamChemistry: true,
      tacticalMatchup: true,
      developmentPath: true,
      recruitmentFit: true,
    },
    analytics: {
      basicStats: true,
      advancedMetrics: true,
      comparisons: true,
      exports: true,
      historicalData: true,
      realTimeUpdates: true,
    },
    limits: {
      predictionsPerMonth: -1,  // Unlimited
      comparisonsPerMonth: -1,
      exportsPerMonth: -1,
      historicalDays: -1,       // All time
    },
  },
};

// =============================================================================
// GDPR & PRIVACY
// =============================================================================

export interface PrivacySettings {
  isMinor: boolean;
  parentalConsentGiven: boolean;
  dataRetentionDays: number;
  allowedDataUsage: {
    predictions: boolean;
    analytics: boolean;
    sharing: boolean;
    marketing: boolean;
  };
  anonymizeAfterDays?: number;
}

export interface AnonymizedPrediction {
  // Same structure but with anonymized identifiers
  playerId: string;           // Hashed
  playerName: string;         // "Player A"
  aggregatedOnly: boolean;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const MODEL_VERSION = '7.10.1-enterprise';
