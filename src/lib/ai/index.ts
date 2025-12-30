// ============================================================================
// src/lib/ai/index.ts
// 🤖 PitchConnect Enterprise AI - Library Exports
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// ============================================================================

// Types
export * from './types';

// Sport Configuration
export * from './sport-config';

// Prediction Engine
export {
  predictMatchOutcome,
  predictPlayerPerformance,
  predictTeamPerformance,
  MODEL_VERSION,
} from './prediction-engine';

// Cache Manager
export {
  generateMatchCacheKey,
  generatePlayerCacheKey,
  generateTeamCacheKey,
  generateRecommendationCacheKey,
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
  clearAllCache,
  runCacheCleanup,
  getCacheStats,
  getCacheConfig,
  getExpiringSoonEntries,
  DEFAULT_CACHE_CONFIG,
} from './cache-manager';

// Permissions
export {
  canViewPredictionType,
  canCreatePredictions,
  canExportPredictions,
  requiresEntityMembership,
  getViewablePredictionTypes,
  canAccessEntityPrediction,
  buildAccessContext,
  validatePredictionAccess,
  createAccessLog,
  ROLE_PREDICTION_ACCESS,
  PERMISSION_TYPE_MAPPING,
} from './permissions';

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

import type { Sport } from '@prisma/client';
import { getSportConfig, getSportDisplayName } from './sport-config';
import { predictMatchOutcome, predictPlayerPerformance, predictTeamPerformance } from './prediction-engine';
import { buildAccessContext, validatePredictionAccess } from './permissions';
import type { PredictionAccessContext, MatchFeatureVector, PlayerFeatureVector, TeamFeatureVector } from './types';

/**
 * AI Engine facade for simplified access
 */
export const AIEngine = {
  // Prediction methods
  predictMatch: predictMatchOutcome,
  predictPlayer: predictPlayerPerformance,
  predictTeam: predictTeamPerformance,
  
  // Config helpers
  getSportConfig,
  getSportName: getSportDisplayName,
  
  // Permission helpers
  buildContext: buildAccessContext,
  validateAccess: validatePredictionAccess,
};

export default AIEngine;