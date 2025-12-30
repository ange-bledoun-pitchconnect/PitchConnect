// ============================================================================
// src/lib/analytics/index.ts
// 📊 PitchConnect Enterprise Analytics - Main Export
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// ============================================================================
// This is the main entry point for all analytics functionality.
// Import from '@/lib/analytics' for all analytics needs.
// ============================================================================

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Injury Prediction Types
  InjuryRiskAssessment,
  InjuryRiskFactor,
  BodyPartRisk,
  
  // Performance Prediction Types
  PerformancePrediction,
  PerformanceFactor,
  TimeHorizon,
  
  // Player Comparison Types
  PlayerComparison,
  PlayerComparisonProfile,
  CategoryComparison,
  
  // Market Value Types
  MarketValueAssessment,
  ValueFactor,
  ComparablePlayer,
  
  // Formation Types
  FormationAnalysis,
  FormationSuggestion,
  PositionAnalysis,
  RotationSuggestion,
  
  // Team Analytics Types
  TeamAnalytics,
  
  // Match Analytics Types
  MatchAnalytics,
  TeamMatchData,
  
  // Competition Analytics Types
  CompetitionAnalytics,
  CompetitionStandingEntry,
  MatchSummary,
  
  // Player Analytics Types
  PlayerAnalytics,
  
  // Advanced Analytics Types
  AdvancedAnalytics,
  LeaderboardEntry,
  TeamRankingEntry,
  TrendData,
  AnalyticsInsight,
  
  // API Types
  AnalyticsAPIResponse,
  
  // Prisma Re-exports
  Sport,
  Position,
  PredictionType,
  PredictionStatus,
  PredictionImpact,
  InjuryType,
  InjuryStatus,
  InjurySeverity,
} from './types';

// ============================================================================
// INJURY PREDICTION EXPORTS
// ============================================================================

export {
  predictInjuryRisk,
  invalidateInjuryPrediction,
  invalidateTeamInjuryPredictions,
  predictTeamInjuryRisks,
  RISK_THRESHOLDS,
  WORKLOAD_THRESHOLDS,
  INJURY_MODEL_VERSION,
} from './injury-predictor';

// ============================================================================
// PERFORMANCE PREDICTION EXPORTS
// ============================================================================

export {
  predictPlayerPerformance,
  invalidatePerformancePredictions,
  predictTeamPerformance,
  FORM_THRESHOLDS,
  PERFORMANCE_MODEL_VERSION,
} from './performance-predictor';

// ============================================================================
// PLAYER COMPARISON EXPORTS
// ============================================================================

export {
  comparePlayerStats,
  COMPARISON_CATEGORIES,
  COMPARISON_MODEL_VERSION,
} from './player-comparator';

// ============================================================================
// MARKET VALUE EXPORTS
// ============================================================================

export {
  calculatePlayerMarketValue,
  calculateTeamMarketValues,
  calculateTeamTotalValue,
  BASE_VALUES_BY_SPORT,
  PERFORMANCE_TIERS,
  MARKET_VALUE_MODEL_VERSION,
} from './market-value-calculator';

// ============================================================================
// SPORT METRICS EXPORTS
// ============================================================================

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

export type { SportMetricConfig } from './sport-metrics';

// ============================================================================
// ACCESS CONTROL EXPORTS
// ============================================================================

export { ANALYTICS_ACCESS_MATRIX } from './types';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';

/**
 * Check if user has access to analytics feature
 */
export function hasAnalyticsAccess(
  userRoles: string[],
  feature: string
): boolean {
  const { ANALYTICS_ACCESS_MATRIX } = require('./types');
  
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
export function getAvailableFeatures(userRoles: string[]): string[] {
  const { ANALYTICS_ACCESS_MATRIX } = require('./types');
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
export function requiresClubMembership(userRoles: string[]): boolean {
  const { ANALYTICS_ACCESS_MATRIX } = require('./types');
  
  for (const role of userRoles) {
    const access = ANALYTICS_ACCESS_MATRIX[role];
    if (access && !access.requiresClubMembership) {
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// ANALYTICS ENGINE FACADE
// ============================================================================

/**
 * Analytics Engine - High-level API for all analytics operations
 */
export const AnalyticsEngine = {
  // Injury Prediction
  injury: {
    predict: async (playerId: string, forceRefresh?: boolean) => {
      const { predictInjuryRisk } = await import('./injury-predictor');
      return predictInjuryRisk(playerId, forceRefresh);
    },
    predictTeam: async (teamId: string) => {
      const { predictTeamInjuryRisks } = await import('./injury-predictor');
      return predictTeamInjuryRisks(teamId);
    },
    invalidate: async (playerId: string) => {
      const { invalidateInjuryPrediction } = await import('./injury-predictor');
      return invalidateInjuryPrediction(playerId);
    },
  },
  
  // Performance Prediction
  performance: {
    predict: async (playerId: string, horizon?: 'NEXT_MATCH' | 'NEXT_WEEK' | 'NEXT_MONTH' | 'SEASON', forceRefresh?: boolean) => {
      const { predictPlayerPerformance } = await import('./performance-predictor');
      return predictPlayerPerformance(playerId, horizon || 'NEXT_MATCH', forceRefresh);
    },
    predictTeam: async (teamId: string, horizon?: 'NEXT_MATCH' | 'NEXT_WEEK' | 'NEXT_MONTH' | 'SEASON') => {
      const { predictTeamPerformance } = await import('./performance-predictor');
      return predictTeamPerformance(teamId, horizon || 'NEXT_MATCH');
    },
    invalidate: async (playerId: string) => {
      const { invalidatePerformancePredictions } = await import('./performance-predictor');
      return invalidatePerformancePredictions(playerId);
    },
  },
  
  // Player Comparison
  comparison: {
    compare: async (player1Id: string, player2Id: string, forceRefresh?: boolean) => {
      const { comparePlayerStats } = await import('./player-comparator');
      return comparePlayerStats(player1Id, player2Id, forceRefresh);
    },
  },
  
  // Market Value
  marketValue: {
    calculate: async (playerId: string, forceRefresh?: boolean) => {
      const { calculatePlayerMarketValue } = await import('./market-value-calculator');
      return calculatePlayerMarketValue(playerId, forceRefresh);
    },
    calculateTeam: async (teamId: string) => {
      const { calculateTeamMarketValues } = await import('./market-value-calculator');
      return calculateTeamMarketValues(teamId);
    },
    getTeamTotal: async (teamId: string) => {
      const { calculateTeamTotalValue } = await import('./market-value-calculator');
      return calculateTeamTotalValue(teamId);
    },
  },
  
  // Access Control
  access: {
    hasAccess: hasAnalyticsAccess,
    getFeatures: getAvailableFeatures,
    requiresMembership: requiresClubMembership,
  },
  
  // Sport Configuration
  sports: {
    getConfig: (sport: string) => {
      const { getSportMetricConfig } = require('./sport-metrics');
      return getSportMetricConfig(sport);
    },
    getFormations: (sport: string) => {
      const { getFormationsForSport } = require('./sport-metrics');
      return getFormationsForSport(sport);
    },
    getKeyMetrics: (sport: string) => {
      const { getKeyMetricsForSport } = require('./sport-metrics');
      return getKeyMetricsForSport(sport);
    },
    isSupported: (sport: string) => {
      const { isSportSupported } = require('./sport-metrics');
      return isSportSupported(sport);
    },
    getAllSupported: () => {
      const { getSupportedSports } = require('./sport-metrics');
      return getSupportedSports();
    },
  },
};

// ============================================================================
// MODEL VERSIONS
// ============================================================================

export const ANALYTICS_MODEL_VERSIONS = {
  injury: '2.0.0-injury',
  performance: '2.0.0-performance',
  comparison: '2.0.0-comparison',
  marketValue: '2.0.0-market-value',
  sportMetrics: '2.0.0',
};

// Default export
export default AnalyticsEngine;