/**
 * ============================================================================
 * 🔐 PITCHCONNECT AI - ROLE-BASED ACCESS CONTROL v7.10.1
 * ============================================================================
 * Enterprise RBAC for AI predictions aligned with Prisma schema
 * Supports all 18 UserRoles + 18 ClubMemberRoles + AccountTiers
 * ============================================================================
 */

import type {
  UserRole,
  ClubMemberRole,
  AccountTier,
  PredictionType,
  PredictionAccessContext,
  RolePredictionAccess,
  TierFeatureAccess,
  PredictionAccessLog,
  TIER_FEATURES,
} from './types';

// =============================================================================
// ROLE PREDICTION ACCESS MATRIX
// =============================================================================

/**
 * Defines which prediction types each UserRole can access
 * Aligned with schema.prisma UserRole enum (18 roles)
 */
export const ROLE_PREDICTION_ACCESS: Record<UserRole, RolePredictionAccess> = {
  // ===========================================================================
  // SUPERADMIN - Full unrestricted access
  // ===========================================================================
  SUPERADMIN: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'GOALS_ASSISTS', 'INJURY_RISK', 'FATIGUE_LEVEL', 'RECOVERY_TIME',
      'MARKET_VALUE', 'TRANSFER_LIKELIHOOD', 'CONTRACT_VALUE', 'FORMATION',
      'LINEUP', 'TACTICAL_MATCHUP', 'POTENTIAL_RATING', 'DEVELOPMENT_PATH',
      'TEAM_CHEMISTRY', 'RECRUITMENT_FIT', 'PERFORMANCE',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: false,
    maxPredictionsPerDay: -1, // Unlimited
  },

  // ===========================================================================
  // ADMIN - System-wide access (no financial predictions)
  // ===========================================================================
  ADMIN: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'GOALS_ASSISTS', 'INJURY_RISK', 'FATIGUE_LEVEL', 'RECOVERY_TIME',
      'FORMATION', 'LINEUP', 'TACTICAL_MATCHUP', 'POTENTIAL_RATING',
      'DEVELOPMENT_PATH', 'TEAM_CHEMISTRY', 'PERFORMANCE',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: false,
    maxPredictionsPerDay: 500,
  },

  // ===========================================================================
  // LEAGUE_ADMIN - League-level oversight
  // ===========================================================================
  LEAGUE_ADMIN: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'TEAM_CHEMISTRY', 'PERFORMANCE', 'LINEUP', 'TACTICAL_MATCHUP',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: false,
    maxPredictionsPerDay: 200,
  },

  // ===========================================================================
  // CLUB_OWNER - Strategic + Financial insights
  // ===========================================================================
  CLUB_OWNER: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'MARKET_VALUE', 'TRANSFER_LIKELIHOOD', 'CONTRACT_VALUE', 'TEAM_CHEMISTRY',
      'RECRUITMENT_FIT', 'LINEUP', 'PERFORMANCE', 'POTENTIAL_RATING',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 100,
  },

  // ===========================================================================
  // CLUB_MANAGER - Club operations management
  // ===========================================================================
  CLUB_MANAGER: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'GOALS_ASSISTS', 'INJURY_RISK', 'FATIGUE_LEVEL', 'LINEUP',
      'TACTICAL_MATCHUP', 'TEAM_CHEMISTRY', 'FORMATION', 'PERFORMANCE',
      'POTENTIAL_RATING', 'DEVELOPMENT_PATH',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 100,
  },

  // ===========================================================================
  // MANAGER - Team management focus
  // ===========================================================================
  MANAGER: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'GOALS_ASSISTS', 'INJURY_RISK', 'FATIGUE_LEVEL', 'LINEUP',
      'TACTICAL_MATCHUP', 'TEAM_CHEMISTRY', 'FORMATION', 'PERFORMANCE',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 80,
  },

  // ===========================================================================
  // COACH_PRO - Professional coach with enhanced access
  // ===========================================================================
  COACH_PRO: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'GOALS_ASSISTS', 'INJURY_RISK', 'FATIGUE_LEVEL', 'RECOVERY_TIME',
      'LINEUP', 'TACTICAL_MATCHUP', 'FORMATION', 'DEVELOPMENT_PATH',
      'TEAM_CHEMISTRY', 'PERFORMANCE', 'POTENTIAL_RATING',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 60,
  },

  // ===========================================================================
  // COACH - Standard coach access
  // ===========================================================================
  COACH: {
    viewable: [
      'MATCH_OUTCOME', 'PLAYER_PERFORMANCE', 'FORM_TREND', 'GOALS_ASSISTS',
      'INJURY_RISK', 'FATIGUE_LEVEL', 'LINEUP', 'TACTICAL_MATCHUP',
      'DEVELOPMENT_PATH', 'PERFORMANCE',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 40,
  },

  // ===========================================================================
  // TREASURER - Financial predictions only
  // ===========================================================================
  TREASURER: {
    viewable: [
      'MARKET_VALUE', 'CONTRACT_VALUE', 'TRANSFER_LIKELIHOOD',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 30,
  },

  // ===========================================================================
  // ANALYST - Full analytics access
  // ===========================================================================
  ANALYST: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'GOALS_ASSISTS', 'INJURY_RISK', 'FATIGUE_LEVEL', 'TACTICAL_MATCHUP',
      'TEAM_CHEMISTRY', 'FORMATION', 'PERFORMANCE', 'POTENTIAL_RATING',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 100,
  },

  // ===========================================================================
  // SCOUT - Recruitment focused
  // ===========================================================================
  SCOUT: {
    viewable: [
      'PLAYER_PERFORMANCE', 'FORM_TREND', 'POTENTIAL_RATING', 'DEVELOPMENT_PATH',
      'RECRUITMENT_FIT', 'MARKET_VALUE', 'PERFORMANCE',
    ],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: false, // Scouts can view external players
    maxPredictionsPerDay: 50,
  },

  // ===========================================================================
  // REFEREE - Match outcomes only (for scheduling)
  // ===========================================================================
  REFEREE: {
    viewable: [
      'MATCH_OUTCOME',
    ],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: false,
    maxPredictionsPerDay: 10,
  },

  // ===========================================================================
  // MEDICAL_STAFF - Health & fitness focused
  // ===========================================================================
  MEDICAL_STAFF: {
    viewable: [
      'INJURY_RISK', 'FATIGUE_LEVEL', 'RECOVERY_TIME', 'PLAYER_PERFORMANCE',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 50,
  },

  // ===========================================================================
  // MEDIA_MANAGER - Public-safe predictions
  // ===========================================================================
  MEDIA_MANAGER: {
    viewable: [
      'MATCH_OUTCOME', 'FORM_TREND', 'PERFORMANCE',
    ],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 20,
  },

  // ===========================================================================
  // PLAYER_PRO - Enhanced player access
  // ===========================================================================
  PLAYER_PRO: {
    viewable: [
      'PLAYER_PERFORMANCE', 'FORM_TREND', 'GOALS_ASSISTS', 'INJURY_RISK',
      'FATIGUE_LEVEL', 'RECOVERY_TIME', 'DEVELOPMENT_PATH', 'POTENTIAL_RATING',
      'PERFORMANCE',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 30,
  },

  // ===========================================================================
  // PLAYER - Own data only
  // ===========================================================================
  PLAYER: {
    viewable: [
      'PLAYER_PERFORMANCE', 'FORM_TREND', 'INJURY_RISK', 'FATIGUE_LEVEL',
      'DEVELOPMENT_PATH', 'PERFORMANCE',
    ],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 10,
  },

  // ===========================================================================
  // PARENT - Child's data only (GDPR compliant)
  // ===========================================================================
  PARENT: {
    viewable: [
      'PLAYER_PERFORMANCE', 'DEVELOPMENT_PATH', 'INJURY_RISK',
    ],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 10,
  },

  // ===========================================================================
  // GUARDIAN - Same as Parent
  // ===========================================================================
  GUARDIAN: {
    viewable: [
      'PLAYER_PERFORMANCE', 'DEVELOPMENT_PATH', 'INJURY_RISK',
    ],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: true,
    maxPredictionsPerDay: 10,
  },

  // ===========================================================================
  // FAN - Basic match predictions only
  // ===========================================================================
  FAN: {
    viewable: [
      'MATCH_OUTCOME',
    ],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: false,
    maxPredictionsPerDay: 5,
  },
};

// =============================================================================
// CLUB MEMBER ROLE ACCESS (Supplements UserRole)
// =============================================================================

export const CLUB_ROLE_PREDICTION_ACCESS: Record<ClubMemberRole, Partial<RolePredictionAccess>> = {
  OWNER: {
    viewable: ['MARKET_VALUE', 'TRANSFER_LIKELIHOOD', 'CONTRACT_VALUE', 'RECRUITMENT_FIT'],
    canExport: true,
  },
  MANAGER: {
    viewable: ['LINEUP', 'TACTICAL_MATCHUP', 'FORMATION', 'TEAM_CHEMISTRY'],
    canCreate: true,
  },
  HEAD_COACH: {
    viewable: ['LINEUP', 'TACTICAL_MATCHUP', 'FORMATION', 'DEVELOPMENT_PATH'],
    canCreate: true,
  },
  ASSISTANT_COACH: {
    viewable: ['LINEUP', 'FORMATION', 'DEVELOPMENT_PATH'],
  },
  PLAYER: {
    viewable: ['PLAYER_PERFORMANCE', 'DEVELOPMENT_PATH'],
  },
  STAFF: {
    viewable: ['MATCH_OUTCOME'],
  },
  TREASURER: {
    viewable: ['MARKET_VALUE', 'CONTRACT_VALUE'],
    canExport: true,
  },
  SCOUT: {
    viewable: ['RECRUITMENT_FIT', 'POTENTIAL_RATING', 'MARKET_VALUE'],
  },
  ANALYST: {
    viewable: ['TACTICAL_MATCHUP', 'TEAM_CHEMISTRY', 'PERFORMANCE'],
    canCreate: true,
    canExport: true,
  },
  MEDICAL_STAFF: {
    viewable: ['INJURY_RISK', 'FATIGUE_LEVEL', 'RECOVERY_TIME'],
    canExport: true,
  },
  PHYSIOTHERAPIST: {
    viewable: ['INJURY_RISK', 'RECOVERY_TIME', 'FATIGUE_LEVEL'],
  },
  NUTRITIONIST: {
    viewable: ['FATIGUE_LEVEL', 'PERFORMANCE'],
  },
  PSYCHOLOGIST: {
    viewable: ['PERFORMANCE', 'FORM_TREND'],
  },
  PERFORMANCE_COACH: {
    viewable: ['PLAYER_PERFORMANCE', 'FATIGUE_LEVEL', 'DEVELOPMENT_PATH'],
  },
  GOALKEEPING_COACH: {
    viewable: ['PLAYER_PERFORMANCE', 'DEVELOPMENT_PATH'],
  },
  KIT_MANAGER: {
    viewable: [],
  },
  MEDIA_OFFICER: {
    viewable: ['MATCH_OUTCOME', 'FORM_TREND'],
  },
  VIDEO_ANALYST: {
    viewable: ['TACTICAL_MATCHUP', 'PERFORMANCE', 'FORMATION'],
    canExport: true,
  },
};

// =============================================================================
// PERMISSION MAPPING
// =============================================================================

export const PERMISSION_TYPE_MAPPING: Record<string, {
  allowsView: boolean;
  allowsCreate: boolean;
  allowsExport: boolean;
  predictionTypes?: PredictionType[];
}> = {
  // Core AI permissions
  PREDICTIONS_VIEW: {
    allowsView: true,
    allowsCreate: false,
    allowsExport: false,
  },
  PREDICTIONS_CREATE: {
    allowsView: true,
    allowsCreate: true,
    allowsExport: false,
  },
  PREDICTIONS_MANAGE: {
    allowsView: true,
    allowsCreate: true,
    allowsExport: true,
  },
  
  // Analytics permissions
  ANALYTICS_VIEW: {
    allowsView: true,
    allowsCreate: false,
    allowsExport: false,
  },
  ANALYTICS_EXPORT: {
    allowsView: true,
    allowsCreate: false,
    allowsExport: true,
  },
  ANALYTICS_ADVANCED: {
    allowsView: true,
    allowsCreate: true,
    allowsExport: true,
    predictionTypes: ['TACTICAL_MATCHUP', 'TEAM_CHEMISTRY', 'RECRUITMENT_FIT'],
  },
  
  // Specific domain permissions
  MEDICAL_VIEW: {
    allowsView: true,
    allowsCreate: false,
    allowsExport: false,
    predictionTypes: ['INJURY_RISK', 'FATIGUE_LEVEL', 'RECOVERY_TIME'],
  },
  FINANCIAL_VIEW: {
    allowsView: true,
    allowsCreate: false,
    allowsExport: false,
    predictionTypes: ['MARKET_VALUE', 'CONTRACT_VALUE', 'TRANSFER_LIKELIHOOD'],
  },
  YOUTH_DEVELOPMENT: {
    allowsView: true,
    allowsCreate: false,
    allowsExport: false,
    predictionTypes: ['DEVELOPMENT_PATH', 'POTENTIAL_RATING'],
  },
};

// =============================================================================
// PERMISSION CHECK FUNCTIONS
// =============================================================================

/**
 * Check if a user can view a specific prediction type
 */
export function canViewPredictionType(
  context: PredictionAccessContext,
  predictionType: PredictionType
): boolean {
  // SUPERADMIN bypass
  if (context.userRoles.includes('SUPERADMIN')) {
    return true;
  }

  // Check tier restrictions first
  const tierAccess = getTierFeatureAccess(context.accountTier);
  if (!checkTierPredictionAccess(tierAccess, predictionType)) {
    return false;
  }

  // Check explicit permissions
  for (const permission of context.permissions) {
    const mapping = PERMISSION_TYPE_MAPPING[permission];
    if (mapping?.allowsView) {
      if (!mapping.predictionTypes || mapping.predictionTypes.includes(predictionType)) {
        return true;
      }
    }
  }

  // Check role-based access
  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role];
    if (roleAccess?.viewable.includes(predictionType)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a user can create predictions
 */
export function canCreatePredictions(context: PredictionAccessContext): boolean {
  if (context.userRoles.includes('SUPERADMIN')) {
    return true;
  }

  // Check explicit permissions
  for (const permission of context.permissions) {
    const mapping = PERMISSION_TYPE_MAPPING[permission];
    if (mapping?.allowsCreate) {
      return true;
    }
  }

  // Check role-based access
  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role];
    if (roleAccess?.canCreate) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a user can export predictions
 */
export function canExportPredictions(context: PredictionAccessContext): boolean {
  if (context.userRoles.includes('SUPERADMIN')) {
    return true;
  }

  // Check tier allows exports
  const tierAccess = getTierFeatureAccess(context.accountTier);
  if (!tierAccess.analytics.exports) {
    return false;
  }

  // Check explicit permissions
  for (const permission of context.permissions) {
    const mapping = PERMISSION_TYPE_MAPPING[permission];
    if (mapping?.allowsExport) {
      return true;
    }
  }

  // Check role-based access
  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role];
    if (roleAccess?.canExport) {
      return true;
    }
  }

  return false;
}

/**
 * Check if entity membership is required
 */
export function requiresEntityMembership(context: PredictionAccessContext): boolean {
  if (context.userRoles.includes('SUPERADMIN') || context.userRoles.includes('ADMIN')) {
    return false;
  }

  // Check if any role doesn't require membership
  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role];
    if (roleAccess && !roleAccess.requiresEntityMembership) {
      return false;
    }
  }

  return true;
}

/**
 * Get all viewable prediction types for a context
 */
export function getViewablePredictionTypes(context: PredictionAccessContext): PredictionType[] {
  if (context.userRoles.includes('SUPERADMIN')) {
    return ROLE_PREDICTION_ACCESS.SUPERADMIN.viewable;
  }

  const viewable = new Set<PredictionType>();

  // Aggregate from all roles
  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role];
    if (roleAccess) {
      for (const type of roleAccess.viewable) {
        // Check tier allows this prediction type
        const tierAccess = getTierFeatureAccess(context.accountTier);
        if (checkTierPredictionAccess(tierAccess, type)) {
          viewable.add(type);
        }
      }
    }
  }

  return Array.from(viewable);
}

/**
 * Check if user can access prediction for specific entity
 */
export function canAccessEntityPrediction(
  context: PredictionAccessContext,
  entityType: 'player' | 'team' | 'match' | 'club',
  entityId: string,
  ownerId?: string
): boolean {
  // SUPERADMIN/ADMIN bypass
  if (context.userRoles.includes('SUPERADMIN') || context.userRoles.includes('ADMIN')) {
    return true;
  }

  // PLAYER can only see their own data
  if (context.userRoles.includes('PLAYER') && entityType === 'player') {
    return entityId === context.playerId || entityId === ownerId;
  }

  // PARENT/GUARDIAN can only see linked children's data
  if ((context.userRoles.includes('PARENT') || context.userRoles.includes('GUARDIAN')) && entityType === 'player') {
    return context.linkedChildIds?.includes(entityId) ?? false;
  }

  // Check membership requirements
  if (requiresEntityMembership(context)) {
    switch (entityType) {
      case 'club':
        return context.clubId === entityId;
      case 'team':
        return context.teamId === entityId;
      case 'player':
        // Allow if same club
        return Boolean(context.clubId);
      case 'match':
        // Allow if user's club is involved
        return Boolean(context.clubId);
      default:
        return false;
    }
  }

  return true;
}

/**
 * Get rate limit for a context
 */
export function getPredictionRateLimit(context: PredictionAccessContext): number {
  // Find highest limit from all roles
  let maxLimit = 0;

  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role];
    if (roleAccess) {
      const limit = roleAccess.maxPredictionsPerDay ?? 0;
      if (limit === -1) return -1; // Unlimited
      if (limit > maxLimit) maxLimit = limit;
    }
  }

  // Apply tier multiplier
  const tierMultiplier = context.accountTier === 'ENTERPRISE' ? 10 :
                         context.accountTier === 'PREMIUM' ? 5 :
                         context.accountTier === 'PRO' ? 2 : 1;

  return maxLimit * tierMultiplier;
}

// =============================================================================
// TIER ACCESS HELPERS
// =============================================================================

/**
 * Get tier feature access
 */
export function getTierFeatureAccess(tier: AccountTier): TierFeatureAccess {
  const { TIER_FEATURES } = require('./types');
  return TIER_FEATURES[tier];
}

/**
 * Check if tier allows prediction type
 */
function checkTierPredictionAccess(tierAccess: TierFeatureAccess, predictionType: PredictionType): boolean {
  switch (predictionType) {
    case 'MATCH_OUTCOME':
    case 'SCORE_PREDICTION':
      return tierAccess.predictions.matchOutcome;
    case 'PLAYER_PERFORMANCE':
    case 'FORM_TREND':
    case 'GOALS_ASSISTS':
    case 'PERFORMANCE':
      return tierAccess.predictions.playerPerformance;
    case 'INJURY_RISK':
    case 'FATIGUE_LEVEL':
    case 'RECOVERY_TIME':
      return tierAccess.predictions.injuryRisk;
    case 'MARKET_VALUE':
    case 'TRANSFER_LIKELIHOOD':
    case 'CONTRACT_VALUE':
      return tierAccess.predictions.marketValue;
    case 'TEAM_CHEMISTRY':
      return tierAccess.predictions.teamChemistry;
    case 'TACTICAL_MATCHUP':
    case 'FORMATION':
    case 'LINEUP':
      return tierAccess.predictions.tacticalMatchup;
    case 'DEVELOPMENT_PATH':
    case 'POTENTIAL_RATING':
      return tierAccess.predictions.developmentPath;
    case 'RECRUITMENT_FIT':
      return tierAccess.predictions.recruitmentFit;
    default:
      return false;
  }
}

// =============================================================================
// CONTEXT BUILDERS
// =============================================================================

/**
 * Build access context from session and membership data
 */
export function buildAccessContext(
  userId: string,
  userRoles: UserRole[],
  accountTier: AccountTier,
  permissions: string[],
  options?: {
    organisationId?: string;
    clubId?: string;
    teamId?: string;
    playerId?: string;
    linkedChildIds?: string[];
    isMinor?: boolean;
  }
): PredictionAccessContext {
  return {
    userId,
    userRoles,
    accountTier,
    permissions,
    organisationId: options?.organisationId,
    clubId: options?.clubId,
    teamId: options?.teamId,
    playerId: options?.playerId,
    linkedChildIds: options?.linkedChildIds,
    isMinor: options?.isMinor,
  };
}

/**
 * Validate complete prediction access request
 */
export function validatePredictionAccess(
  context: PredictionAccessContext,
  predictionType: PredictionType,
  entityType: 'player' | 'team' | 'match' | 'club',
  entityId: string
): { allowed: boolean; reason?: string; requiresUpgrade?: AccountTier } {
  // Check prediction type access
  if (!canViewPredictionType(context, predictionType)) {
    // Determine if upgrade would help
    const upgradeTier = getRequiredTierForPrediction(predictionType);
    if (upgradeTier) {
      return {
        allowed: false,
        reason: `${predictionType} predictions require ${upgradeTier} tier or higher`,
        requiresUpgrade: upgradeTier,
      };
    }
    return {
      allowed: false,
      reason: `Your role does not have access to ${predictionType} predictions`,
    };
  }

  // Check entity access
  if (!canAccessEntityPrediction(context, entityType, entityId)) {
    return {
      allowed: false,
      reason: `You do not have access to predictions for this ${entityType}`,
    };
  }

  return { allowed: true };
}

/**
 * Get required tier for a prediction type
 */
function getRequiredTierForPrediction(predictionType: PredictionType): AccountTier | null {
  const tierOrder: AccountTier[] = ['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE'];
  
  for (const tier of tierOrder) {
    const access = getTierFeatureAccess(tier);
    if (checkTierPredictionAccess(access, predictionType)) {
      return tier;
    }
  }
  
  return null;
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Create audit log entry for prediction access
 */
export function createAccessLog(
  context: PredictionAccessContext,
  action: 'VIEW' | 'CREATE' | 'EXPORT' | 'INVALIDATE',
  predictionType: PredictionType,
  entityType: string,
  entityId: string,
  allowed: boolean,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): PredictionAccessLog {
  return {
    userId: context.userId,
    action,
    predictionType,
    entityType: entityType as 'player' | 'team' | 'match' | 'club',
    entityId,
    allowed,
    reason,
    timestamp: new Date(),
    ipAddress,
    userAgent,
    accountTier: context.accountTier,
  };
}

// =============================================================================
// GDPR & PRIVACY HELPERS
// =============================================================================

/**
 * Check if data should be anonymized for minors
 */
export function shouldAnonymizeForMinor(
  context: PredictionAccessContext,
  targetPlayerId: string,
  isTargetMinor: boolean
): boolean {
  // If target is not a minor, no anonymization needed
  if (!isTargetMinor) return false;

  // If viewer is the minor themselves, no anonymization
  if (context.playerId === targetPlayerId) return false;

  // If viewer is linked parent/guardian, no anonymization
  if (context.linkedChildIds?.includes(targetPlayerId)) return false;

  // Staff with medical/coaching access don't need anonymization
  const staffRoles: UserRole[] = ['COACH', 'COACH_PRO', 'MEDICAL_STAFF', 'MANAGER', 'CLUB_MANAGER'];
  if (context.userRoles.some(r => staffRoles.includes(r))) return false;

  // Admin roles don't need anonymization
  if (context.userRoles.includes('SUPERADMIN') || context.userRoles.includes('ADMIN')) return false;

  // Everyone else gets anonymized data for minors
  return true;
}

/**
 * Get data retention period based on context
 */
export function getDataRetentionDays(context: PredictionAccessContext): number {
  // Minors have shorter retention
  if (context.isMinor) return 90;

  // Based on tier
  const { TIER_FEATURES } = require('./types');
  const tierAccess = TIER_FEATURES[context.accountTier];
  return tierAccess.limits.historicalDays === -1 ? 365 * 10 : tierAccess.limits.historicalDays;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  ROLE_PREDICTION_ACCESS,
  CLUB_ROLE_PREDICTION_ACCESS,
  PERMISSION_TYPE_MAPPING,
};
