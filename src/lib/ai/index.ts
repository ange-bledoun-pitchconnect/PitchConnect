/**
 * ============================================================================
 * 🤖 PITCHCONNECT AI MODULE v7.10.1
 * ============================================================================
 * Enterprise AI prediction engine for all 12 sports
 * Algorithmic predictions based on historical data analysis
 * ============================================================================
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Enums
  Sport,
  PredictionType,
  PredictionStatus,
  PredictionImpact,
  UserRole,
  ClubMemberRole,
  AccountTier,
  
  // Sport Configuration
  SportPredictionConfig,
  
  // Access Control
  PredictionAccessContext,
  RolePredictionAccess,
  TierFeatureAccess,
  PredictionAccessLog,
  PrivacySettings,
  
  // Feature Vectors
  MatchFeatureVector,
  PlayerFeatureVector,
  TeamFeatureVector,
  
  // Predictions
  BasePrediction,
  MatchPrediction,
  PlayerPrediction,
  TeamPrediction,
  PredictionFactor,
  TeamRecommendation,
  
  // Cache
  CacheConfig,
  CachedPrediction,
  
  // API
  PredictionAPIResponse,
} from './types';

export {
  SportEnum,
  PredictionTypeEnum,
  PredictionStatusEnum,
  PredictionImpactEnum,
  UserRoleEnum,
  ClubMemberRoleEnum,
  AccountTierEnum,
  TIER_FEATURES,
  MODEL_VERSION,
} from './types';

// =============================================================================
// SPORT CONFIGURATION EXPORTS
// =============================================================================

export {
  SPORT_PREDICTION_CONFIGS,
  getSportConfig,
  getSportWeights,
  getSportKeyMetrics,
  getSportPositionCategories,
  getSupportedSports,
  isSportSupported,
  getSportDisplayName,
  getSportIcon,
  getDefaultSport,
  sportHasDraws,
  sportHasBonusPoints,
  getHomeAdvantageFactor,
  getPositionImportance,
  getScoringTerminology,
  getPeriodName,
  getPeriodsCount,
  getMatchDuration,
  getPositionCategory,
  getAllPositionsForSport,
} from './sport-config';

// =============================================================================
// PREDICTION ENGINE EXPORTS
// =============================================================================

export {
  predictMatchOutcome,
  predictPlayerPerformance,
  predictTeamPerformance,
  calculateInjuryRisk,
  MODEL_VERSION as PREDICTION_MODEL_VERSION,
} from './prediction-engine';

// =============================================================================
// PERMISSIONS EXPORTS
// =============================================================================

export {
  ROLE_PREDICTION_ACCESS,
  CLUB_ROLE_PREDICTION_ACCESS,
  PERMISSION_TYPE_MAPPING,
  canViewPredictionType,
  canCreatePredictions,
  canExportPredictions,
  requiresEntityMembership,
  getViewablePredictionTypes,
  canAccessEntityPrediction,
  getPredictionRateLimit,
  getTierFeatureAccess,
  buildAccessContext,
  validatePredictionAccess,
  createAccessLog,
  shouldAnonymizeForMinor,
  getDataRetentionDays,
} from './permissions';

// =============================================================================
// CACHE MANAGER EXPORTS
// =============================================================================

export {
  DEFAULT_CACHE_CONFIG,
  DYNAMIC_MATCH_TTL,
  generateMatchCacheKey,
  generatePlayerCacheKey,
  generateTeamCacheKey,
  generateRecommendationCacheKey,
  parseCacheKey,
  getCachedMatchPrediction,
  setCachedMatchPrediction,
  getCachedPlayerPrediction,
  setCachedPlayerPrediction,
  getCachedTeamPrediction,
  setCachedTeamPrediction,
  getCachedRecommendations,
  setCachedRecommendations,
  invalidateCacheEntry,
  invalidateEntityCache,
  invalidateSportCache,
  clearAllCache,
  runCacheCleanup,
  getCacheStats,
  getCacheHealth,
  getExpiringSoonEntries,
  getHotEntries,
  warmMatchCache,
} from './cache-manager';

// =============================================================================
// AI ENGINE FACADE
// =============================================================================

import type { Sport, MatchFeatureVector, PlayerFeatureVector, TeamFeatureVector, PredictionAccessContext, PredictionType } from './types';
import { predictMatchOutcome, predictPlayerPerformance, predictTeamPerformance } from './prediction-engine';
import { getSportConfig, getSportDisplayName, getSportIcon } from './sport-config';
import { buildAccessContext, validatePredictionAccess, canViewPredictionType } from './permissions';
import {
  getCachedMatchPrediction,
  setCachedMatchPrediction,
  generateMatchCacheKey,
  getCachedPlayerPrediction,
  setCachedPlayerPrediction,
  generatePlayerCacheKey,
  getCachedTeamPrediction,
  setCachedTeamPrediction,
  generateTeamCacheKey,
  getCacheStats,
} from './cache-manager';

/**
 * AI Engine Facade - Unified API for all AI operations
 * Combines predictions, caching, and permissions
 */
export const AIEngine = {
  // ===========================================================================
  // MATCH PREDICTIONS
  // ===========================================================================
  match: {
    /**
     * Get match prediction (with caching)
     */
    predict: async (
      matchId: string,
      features: MatchFeatureVector,
      options?: { forceRefresh?: boolean; matchDateTime?: Date }
    ) => {
      const cacheKey = generateMatchCacheKey(matchId, features.sport);
      
      // Check cache first
      if (!options?.forceRefresh) {
        const cached = getCachedMatchPrediction(cacheKey);
        if (cached) {
          return { prediction: cached.data, cached: true, cacheKey };
        }
      }
      
      // Generate prediction
      const prediction = predictMatchOutcome(features, features.sport);
      prediction.matchId = matchId;
      
      // Cache result
      setCachedMatchPrediction(cacheKey, prediction, options?.matchDateTime);
      
      return { prediction, cached: false, cacheKey };
    },
    
    /**
     * Invalidate match prediction
     */
    invalidate: (matchId: string, sport: Sport) => {
      const cacheKey = generateMatchCacheKey(matchId, sport);
      return invalidateCacheEntry('match', cacheKey);
    },
  },
  
  // ===========================================================================
  // PLAYER PREDICTIONS
  // ===========================================================================
  player: {
    /**
     * Get player prediction (with caching)
     */
    predict: async (
      playerId: string,
      features: PlayerFeatureVector,
      options?: { forceRefresh?: boolean; predictionType?: PredictionType }
    ) => {
      const cacheKey = generatePlayerCacheKey(playerId, features.sport, options?.predictionType);
      
      if (!options?.forceRefresh) {
        const cached = getCachedPlayerPrediction(cacheKey);
        if (cached) {
          return { prediction: cached.data, cached: true, cacheKey };
        }
      }
      
      const prediction = predictPlayerPerformance(features, features.sport);
      prediction.playerId = playerId;
      
      setCachedPlayerPrediction(cacheKey, prediction);
      
      return { prediction, cached: false, cacheKey };
    },
    
    /**
     * Invalidate player predictions
     */
    invalidate: (playerId: string, sport: Sport, predictionType?: PredictionType) => {
      const cacheKey = generatePlayerCacheKey(playerId, sport, predictionType);
      return invalidateCacheEntry('player', cacheKey);
    },
  },
  
  // ===========================================================================
  // TEAM PREDICTIONS
  // ===========================================================================
  team: {
    /**
     * Get team prediction (with caching)
     */
    predict: async (
      teamId: string,
      features: TeamFeatureVector,
      options?: { forceRefresh?: boolean; competitionId?: string }
    ) => {
      const cacheKey = generateTeamCacheKey(teamId, features.sport, options?.competitionId);
      
      if (!options?.forceRefresh) {
        const cached = getCachedTeamPrediction(cacheKey);
        if (cached) {
          return { prediction: cached.data, cached: true, cacheKey };
        }
      }
      
      const prediction = predictTeamPerformance(features, features.sport);
      prediction.teamId = teamId;
      
      setCachedTeamPrediction(cacheKey, prediction);
      
      return { prediction, cached: false, cacheKey };
    },
    
    /**
     * Invalidate team predictions
     */
    invalidate: (teamId: string, sport: Sport, competitionId?: string) => {
      const cacheKey = generateTeamCacheKey(teamId, sport, competitionId);
      return invalidateCacheEntry('team', cacheKey);
    },
  },
  
  // ===========================================================================
  // SPORT CONFIGURATION
  // ===========================================================================
  sports: {
    getConfig: getSportConfig,
    getName: getSportDisplayName,
    getIcon: getSportIcon,
  },
  
  // ===========================================================================
  // ACCESS CONTROL
  // ===========================================================================
  access: {
    buildContext: buildAccessContext,
    validate: validatePredictionAccess,
    canView: canViewPredictionType,
  },
  
  // ===========================================================================
  // CACHE MANAGEMENT
  // ===========================================================================
  cache: {
    getStats: getCacheStats,
    clear: clearAllCache,
  },
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default AIEngine;
