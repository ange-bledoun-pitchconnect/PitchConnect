// ============================================================================
// src/lib/ai/permissions.ts
// 🔐 PitchConnect Enterprise AI - Role-Based Access Control
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// INTEGRATES: PermissionType enum from Prisma schema
// ============================================================================

import type { 
  UserRole, 
  ClubMemberRole, 
  PredictionType,
  PermissionType 
} from '@prisma/client';
import type { PredictionAccessContext } from './types';

// ============================================================================
// PREDICTION ACCESS MATRIX
// ============================================================================

/**
 * Defines which prediction types each role can access
 */
const ROLE_PREDICTION_ACCESS: Record<string, {
  viewable: PredictionType[];
  canCreate: boolean;
  canExport: boolean;
  requiresEntityMembership: boolean;
}> = {
  // ============================================================================
  // SUPER ADMIN - Full access to everything
  // ============================================================================
  SUPER_ADMIN: {
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
  },
  
  // ============================================================================
  // CLUB OWNER - Strategic + Market insights
  // ============================================================================
  CLUB_OWNER: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'MARKET_VALUE', 'TRANSFER_LIKELIHOOD', 'CONTRACT_VALUE', 'TEAM_CHEMISTRY',
      'RECRUITMENT_FIT', 'LINEUP', 'PERFORMANCE',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // MANAGER / CLUB_MANAGER - Team management focus
  // ============================================================================
  MANAGER: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'GOALS_ASSISTS', 'INJURY_RISK', 'FATIGUE_LEVEL', 'LINEUP', 
      'TACTICAL_MATCHUP', 'TEAM_CHEMISTRY', 'FORMATION', 'PERFORMANCE',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // HEAD_COACH - Tactical + Player management
  // ============================================================================
  HEAD_COACH: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'GOALS_ASSISTS', 'INJURY_RISK', 'FATIGUE_LEVEL', 'RECOVERY_TIME',
      'LINEUP', 'TACTICAL_MATCHUP', 'FORMATION', 'DEVELOPMENT_PATH',
      'TEAM_CHEMISTRY', 'PERFORMANCE',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // ASSISTANT_COACH / COACH - Similar to head coach, slightly reduced
  // ============================================================================
  ASSISTANT_COACH: {
    viewable: [
      'MATCH_OUTCOME', 'PLAYER_PERFORMANCE', 'FORM_TREND', 'GOALS_ASSISTS',
      'INJURY_RISK', 'FATIGUE_LEVEL', 'LINEUP', 'TACTICAL_MATCHUP',
      'FORMATION', 'DEVELOPMENT_PATH', 'PERFORMANCE',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: true,
  },
  
  COACH: {
    viewable: [
      'MATCH_OUTCOME', 'PLAYER_PERFORMANCE', 'FORM_TREND', 'GOALS_ASSISTS',
      'INJURY_RISK', 'FATIGUE_LEVEL', 'LINEUP', 'TACTICAL_MATCHUP',
      'DEVELOPMENT_PATH', 'PERFORMANCE',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // ANALYST - Full analytics access
  // ============================================================================
  ANALYST: {
    viewable: [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'GOALS_ASSISTS', 'INJURY_RISK', 'FATIGUE_LEVEL', 'TACTICAL_MATCHUP',
      'TEAM_CHEMISTRY', 'FORMATION', 'PERFORMANCE', 'POTENTIAL_RATING',
    ],
    canCreate: true,
    canExport: true,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // SCOUT - Recruitment focused
  // ============================================================================
  SCOUT: {
    viewable: [
      'PLAYER_PERFORMANCE', 'FORM_TREND', 'POTENTIAL_RATING', 'DEVELOPMENT_PATH',
      'RECRUITMENT_FIT', 'MARKET_VALUE', 'PERFORMANCE',
    ],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: false, // Scouts can view external players
  },
  
  // ============================================================================
  // PLAYER - Own data only
  // ============================================================================
  PLAYER: {
    viewable: [
      'PLAYER_PERFORMANCE', 'FORM_TREND', 'INJURY_RISK', 'FATIGUE_LEVEL',
      'DEVELOPMENT_PATH', 'PERFORMANCE',
    ],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // PLAYER_PRO - Enhanced player access
  // ============================================================================
  PLAYER_PRO: {
    viewable: [
      'PLAYER_PERFORMANCE', 'FORM_TREND', 'GOALS_ASSISTS', 'INJURY_RISK',
      'FATIGUE_LEVEL', 'RECOVERY_TIME', 'DEVELOPMENT_PATH', 'POTENTIAL_RATING',
      'PERFORMANCE',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // MEDICAL_STAFF - Health focused
  // ============================================================================
  MEDICAL_STAFF: {
    viewable: [
      'INJURY_RISK', 'FATIGUE_LEVEL', 'RECOVERY_TIME', 'PLAYER_PERFORMANCE',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // TREASURER - Financial predictions
  // ============================================================================
  TREASURER: {
    viewable: [
      'MARKET_VALUE', 'CONTRACT_VALUE', 'TRANSFER_LIKELIHOOD',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // PARENT - Limited view of child's data
  // ============================================================================
  PARENT: {
    viewable: [
      'PLAYER_PERFORMANCE', 'DEVELOPMENT_PATH', 'INJURY_RISK',
    ],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // PERFORMANCE_COACH - Physical/fitness focus
  // ============================================================================
  PERFORMANCE_COACH: {
    viewable: [
      'PLAYER_PERFORMANCE', 'FORM_TREND', 'INJURY_RISK', 'FATIGUE_LEVEL',
      'RECOVERY_TIME', 'PERFORMANCE', 'DEVELOPMENT_PATH',
    ],
    canCreate: false,
    canExport: true,
    requiresEntityMembership: true,
  },
  
  // ============================================================================
  // DEFAULT / GUEST - Minimal access
  // ============================================================================
  DEFAULT: {
    viewable: [],
    canCreate: false,
    canExport: false,
    requiresEntityMembership: true,
  },
};

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

/**
 * Check if a user has access to view a specific prediction type
 */
export function canViewPredictionType(
  context: PredictionAccessContext,
  predictionType: PredictionType
): boolean {
  // Super admin bypass
  if (context.permissions.includes('SUPER_ADMIN') || 
      context.userRoles.includes('SUPER_ADMIN' as UserRole)) {
    return true;
  }
  
  // Check explicit permissions
  if (context.permissions.includes('PREDICTIONS_VIEW')) {
    // Check role-based type restrictions
    for (const role of context.userRoles) {
      const roleAccess = ROLE_PREDICTION_ACCESS[role as string] || ROLE_PREDICTION_ACCESS.DEFAULT;
      if (roleAccess.viewable.includes(predictionType)) {
        return true;
      }
    }
  }
  
  // Check role-based access
  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role as string] || ROLE_PREDICTION_ACCESS.DEFAULT;
    if (roleAccess.viewable.includes(predictionType)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a user can create predictions
 */
export function canCreatePredictions(context: PredictionAccessContext): boolean {
  // Super admin bypass
  if (context.permissions.includes('SUPER_ADMIN') ||
      context.userRoles.includes('SUPER_ADMIN' as UserRole)) {
    return true;
  }
  
  // Check explicit permission
  if (context.permissions.includes('PREDICTIONS_CREATE')) {
    return true;
  }
  
  // Check role-based access
  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role as string] || ROLE_PREDICTION_ACCESS.DEFAULT;
    if (roleAccess.canCreate) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a user can export prediction data
 */
export function canExportPredictions(context: PredictionAccessContext): boolean {
  // Super admin bypass
  if (context.permissions.includes('SUPER_ADMIN') ||
      context.userRoles.includes('SUPER_ADMIN' as UserRole)) {
    return true;
  }
  
  // Check explicit permission
  if (context.permissions.includes('ANALYTICS_EXPORT')) {
    return true;
  }
  
  // Check role-based access
  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role as string] || ROLE_PREDICTION_ACCESS.DEFAULT;
    if (roleAccess.canExport) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a user requires entity membership
 */
export function requiresEntityMembership(context: PredictionAccessContext): boolean {
  // Super admin doesn't require membership
  if (context.permissions.includes('SUPER_ADMIN') ||
      context.userRoles.includes('SUPER_ADMIN' as UserRole)) {
    return false;
  }
  
  // Check if any role doesn't require membership
  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role as string] || ROLE_PREDICTION_ACCESS.DEFAULT;
    if (!roleAccess.requiresEntityMembership) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get all viewable prediction types for a context
 */
export function getViewablePredictionTypes(context: PredictionAccessContext): PredictionType[] {
  const viewable = new Set<PredictionType>();
  
  // Super admin gets all
  if (context.permissions.includes('SUPER_ADMIN') ||
      context.userRoles.includes('SUPER_ADMIN' as UserRole)) {
    return ROLE_PREDICTION_ACCESS.SUPER_ADMIN.viewable;
  }
  
  // Aggregate viewable types from all roles
  for (const role of context.userRoles) {
    const roleAccess = ROLE_PREDICTION_ACCESS[role as string] || ROLE_PREDICTION_ACCESS.DEFAULT;
    for (const type of roleAccess.viewable) {
      viewable.add(type);
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
  // Super admin bypass
  if (context.permissions.includes('SUPER_ADMIN') ||
      context.userRoles.includes('SUPER_ADMIN' as UserRole)) {
    return true;
  }
  
  // Players can only see their own data
  if (context.userRoles.includes('PLAYER' as UserRole) && entityType === 'player') {
    return entityId === context.userId || entityId === ownerId;
  }
  
  // Check if user is member of the club/team
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

// ============================================================================
// PERMISSION MAPPING FROM SCHEMA
// ============================================================================

/**
 * Map PermissionType enum to prediction capabilities
 */
export const PERMISSION_TYPE_MAPPING: Record<string, {
  allowsView: boolean;
  allowsCreate: boolean;
  allowsExport: boolean;
}> = {
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
};

/**
 * Build access context from session and membership data
 */
export function buildAccessContext(
  userId: string,
  userRoles: UserRole[],
  permissions: string[],
  organisationId?: string,
  clubId?: string,
  teamId?: string
): PredictionAccessContext {
  return {
    userId,
    userRoles,
    organisationId,
    clubId,
    teamId,
    permissions,
  };
}

/**
 * Validate prediction access request
 */
export function validatePredictionAccess(
  context: PredictionAccessContext,
  predictionType: PredictionType,
  entityType: 'player' | 'team' | 'match' | 'club',
  entityId: string
): { allowed: boolean; reason?: string } {
  // Check if user can view this prediction type
  if (!canViewPredictionType(context, predictionType)) {
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

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log prediction access for audit trail
 */
export interface PredictionAccessLog {
  userId: string;
  action: 'VIEW' | 'CREATE' | 'EXPORT';
  predictionType: PredictionType;
  entityType: string;
  entityId: string;
  allowed: boolean;
  reason?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry for prediction access
 */
export function createAccessLog(
  context: PredictionAccessContext,
  action: 'VIEW' | 'CREATE' | 'EXPORT',
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
    entityType,
    entityId,
    allowed,
    reason,
    timestamp: new Date(),
    ipAddress,
    userAgent,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ROLE_PREDICTION_ACCESS,
};