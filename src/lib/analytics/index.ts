/**
 * ============================================================================
 * 📊 PITCHCONNECT ANALYTICS MODULE v7.10.1
 * ============================================================================
 * Enterprise analytics for all 12 sports
 * Injury prediction, performance analysis, market valuation, comparisons
 * ============================================================================
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core types
  Sport,
  InjuryType,
  InjurySeverity,
  InjuryStatus,
  BodyPart,
  Position,
  UserRole,
  AccountTier,
  Currency,
  TimeHorizon,
  
  // Injury types
  InjuryRiskAssessment,
  InjuryRiskFactor,
  BodyPartRisk,
  
  // Performance types
  PerformancePrediction,
  PerformanceFactor,
  
  // Comparison types
  PlayerComparison,
  PlayerComparisonProfile,
  CategoryComparison,
  
  // Market value types
  MarketValueAssessment,
  ValueFactor,
  ComparablePlayer,
  
  // Team analytics
  TeamAnalytics,
  FormationAnalysis,
  FormationSuggestion,
  PositionAnalysis,
  RotationSuggestion,
  
  // API
  AnalyticsAPIResponse,
  
  // Sport metrics
  SportMetricConfig,
} from './types';

export {
  SportEnum,
  InjuryTypeEnum,
  InjurySeverityEnum,
  InjuryStatusEnum,
  BodyPartEnum,
  UserRoleEnum,
  AccountTierEnum,
  CurrencyEnum,
  CURRENCY_SYMBOLS,
  CURRENCY_RATES,
  ANALYTICS_ACCESS_MATRIX,
  ANALYTICS_MODEL_VERSIONS,
} from './types';

// =============================================================================
// INJURY PREDICTOR EXPORTS
// =============================================================================

export {
  predictInjuryRisk,
  predictTeamInjuryRisks,
  invalidateInjuryPrediction,
  invalidateTeamInjuryPredictions,
  RISK_THRESHOLDS,
  WORKLOAD_THRESHOLDS,
  INJURY_MODEL_VERSION,
} from './injury-predictor';

// =============================================================================
// PERFORMANCE PREDICTOR EXPORTS
// =============================================================================

export {
  predictPlayerPerformance,
  predictTeamPerformance,
  invalidatePerformancePredictions,
  FORM_THRESHOLDS,
  PERFORMANCE_MODEL_VERSION,
} from './performance-predictor';

// =============================================================================
// PLAYER COMPARATOR EXPORTS
// =============================================================================

export {
  comparePlayerStats,
  rankPlayers,
  COMPARISON_CATEGORIES,
  COMPARISON_MODEL_VERSION,
} from './player-comparator';

// =============================================================================
// MARKET VALUE EXPORTS
// =============================================================================

export {
  calculatePlayerMarketValue,
  calculateTeamMarketValues,
  calculateTeamTotalValue,
  formatMarketValue,
  BASE_VALUES_BY_SPORT,
  PERFORMANCE_TIERS,
  MARKET_VALUE_MODEL_VERSION,
} from './market-value-calculator';

// =============================================================================
// SPORT METRICS EXPORTS
// =============================================================================

export {
  SPORT_METRIC_CONFIGS,
  getSportMetricConfig,
  getPositionValueMultiplier,
  getAgeAdjustmentFactor,
  getPositionInjuryRisk,
  getFormationsForSport,
  getKeyMetricsForSport,
  getRatingWeights,
  isSportSupported,
  getSupportedSports,
} from './sport-metrics';

// =============================================================================
// ACCESS CONTROL HELPERS
// =============================================================================

import type { UserRole, AccountTier } from './types';
import { ANALYTICS_ACCESS_MATRIX } from './types';

/**
 * Check if user has access to analytics feature
 */
export function hasAnalyticsAccess(
  userRoles: UserRole[],
  feature: string
): boolean {
  for (const role of userRoles) {
    const access = ANALYTICS_ACCESS_MATRIX[role];
    if (!access) continue;
    
    if (access.canAccess.includes('ALL') || access.canAccess.includes(feature)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all analytics features available to user
 */
export function getAvailableFeatures(userRoles: UserRole[]): string[] {
  const features = new Set<string>();
  
  for (const role of userRoles) {
    const access = ANALYTICS_ACCESS_MATRIX[role];
    if (!access) continue;
    
    if (access.canAccess.includes('ALL')) {
      return ['ALL'];
    }
    
    for (const feature of access.canAccess) {
      features.add(feature);
    }
  }
  
  return Array.from(features);
}

/**
 * Check if analytics feature requires club membership
 */
export function requiresClubMembership(userRoles: UserRole[]): boolean {
  for (const role of userRoles) {
    const access = ANALYTICS_ACCESS_MATRIX[role];
    if (access && !access.requiresClubMembership) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if user can export analytics data
 */
export function canExportAnalytics(userRoles: UserRole[]): boolean {
  for (const role of userRoles) {
    const access = ANALYTICS_ACCESS_MATRIX[role];
    if (access?.exportAllowed) {
      return true;
    }
  }
  return false;
}

// =============================================================================
// ANALYTICS ENGINE FACADE
// =============================================================================

import { predictInjuryRisk, predictTeamInjuryRisks, invalidateInjuryPrediction } from './injury-predictor';
import { predictPlayerPerformance, predictTeamPerformance, invalidatePerformancePredictions } from './performance-predictor';
import { comparePlayerStats, rankPlayers } from './player-comparator';
import { calculatePlayerMarketValue, calculateTeamMarketValues, calculateTeamTotalValue, formatMarketValue } from './market-value-calculator';
import { getSportMetricConfig, getFormationsForSport, getKeyMetricsForSport, isSportSupported, getSupportedSports } from './sport-metrics';
import type { Sport, TimeHorizon, Currency } from './types';

/**
 * Analytics Engine - High-level API for all analytics operations
 */
export const AnalyticsEngine = {
  // ===========================================================================
  // INJURY PREDICTION
  // ===========================================================================
  injury: {
    predict: predictInjuryRisk,
    predictTeam: predictTeamInjuryRisks,
    invalidate: invalidateInjuryPrediction,
  },
  
  // ===========================================================================
  // PERFORMANCE PREDICTION
  // ===========================================================================
  performance: {
    predictPlayer: predictPlayerPerformance,
    predictTeam: predictTeamPerformance,
    invalidate: invalidatePerformancePredictions,
  },
  
  // ===========================================================================
  // PLAYER COMPARISON
  // ===========================================================================
  comparison: {
    compare: comparePlayerStats,
    rank: rankPlayers,
  },
  
  // ===========================================================================
  // MARKET VALUE
  // ===========================================================================
  marketValue: {
    calculate: calculatePlayerMarketValue,
    calculateTeam: calculateTeamMarketValues,
    getTeamTotal: calculateTeamTotalValue,
    format: formatMarketValue,
  },
  
  // ===========================================================================
  // ACCESS CONTROL
  // ===========================================================================
  access: {
    hasAccess: hasAnalyticsAccess,
    getFeatures: getAvailableFeatures,
    requiresMembership: requiresClubMembership,
    canExport: canExportAnalytics,
  },
  
  // ===========================================================================
  // SPORT CONFIGURATION
  // ===========================================================================
  sports: {
    getConfig: getSportMetricConfig,
    getFormations: getFormationsForSport,
    getKeyMetrics: getKeyMetricsForSport,
    isSupported: isSportSupported,
    getAllSupported: getSupportedSports,
  },
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default AnalyticsEngine;
