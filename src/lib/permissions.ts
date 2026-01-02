// src/lib/permissions.ts
// ============================================================================
// 🔐 PITCHCONNECT - ENTERPRISE PERMISSIONS & RBAC
// ============================================================================
// Multi-sport role-based access control with:
// - Sport-specific permission matrices
// - Hierarchical role inheritance
// - Resource-level permissions
// - Audit-ready access control
// - Subscription tier gating
// ============================================================================

import { Sport, Role, SubscriptionTier } from '@prisma/client';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * All available permissions in the system
 */
export type Permission =
  // User management
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'user:manage_roles'
  
  // Team management
  | 'team:read'
  | 'team:create'
  | 'team:update'
  | 'team:delete'
  | 'team:manage_members'
  | 'team:manage_settings'
  | 'team:approve_requests'
  
  // Player management
  | 'player:read'
  | 'player:create'
  | 'player:update'
  | 'player:delete'
  | 'player:manage_contracts'
  | 'player:view_sensitive'
  
  // Match management
  | 'match:read'
  | 'match:create'
  | 'match:update'
  | 'match:delete'
  | 'match:manage_lineup'
  | 'match:record_events'
  | 'match:record_stats'
  
  // Training management
  | 'training:read'
  | 'training:create'
  | 'training:update'
  | 'training:delete'
  | 'training:record_attendance'
  
  // Injury management
  | 'injury:read'
  | 'injury:read_full'
  | 'injury:create'
  | 'injury:update'
  | 'injury:delete'
  
  // Contract management
  | 'contract:read'
  | 'contract:read_full'
  | 'contract:create'
  | 'contract:update'
  | 'contract:delete'
  
  // Financial management
  | 'finance:read_summary'
  | 'finance:read_full'
  | 'finance:manage'
  
  // Analytics & reporting
  | 'analytics:read'
  | 'analytics:advanced'
  | 'analytics:export'
  
  // Tactics & strategy
  | 'tactics:read'
  | 'tactics:create'
  | 'tactics:update'
  | 'tactics:delete'
  
  // Announcements
  | 'announcement:read'
  | 'announcement:create'
  | 'announcement:update'
  | 'announcement:delete'
  
  // League management
  | 'league:read'
  | 'league:create'
  | 'league:update'
  | 'league:delete'
  | 'league:manage_teams'
  
  // Admin permissions
  | 'admin:access'
  | 'admin:manage_users'
  | 'admin:manage_system'
  | 'admin:view_audit_logs'
  | 'superadmin:all';

/**
 * Access levels for sensitive data
 */
export type AccessLevel = 'NONE' | 'LIMITED' | 'FULL' | 'MANAGE';

/**
 * Resource types for permission checking
 */
export type ResourceType = 
  | 'user' 
  | 'team' 
  | 'player' 
  | 'match' 
  | 'training' 
  | 'injury' 
  | 'contract' 
  | 'finance' 
  | 'analytics' 
  | 'tactics' 
  | 'announcement' 
  | 'league';

// ============================================================================
// ROLE HIERARCHY - Determines inheritance
// ============================================================================

/**
 * Role hierarchy for permission inheritance
 * Higher number = more permissions inherited
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPERADMIN: 100,
  LEAGUE_ADMIN: 90,
  CLUB_OWNER: 80,
  MANAGER: 70,
  TREASURER: 65,
  COACH: 60,
  ASSISTANT_COACH: 50,
  MEDICAL_STAFF: 45,
  PHYSIO: 44,
  ANALYST: 40,
  REFEREE: 35,
  PLAYER: 30,
  PARENT: 20,
  VIEWER: 10,
  USER: 5,
};

// ============================================================================
// BASE PERMISSION MATRIX - Role to Permissions mapping
// ============================================================================

/**
 * Base permissions for each role (before sport-specific modifications)
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPERADMIN: ['superadmin:all'],
  
  LEAGUE_ADMIN: [
    'league:read', 'league:create', 'league:update', 'league:delete', 'league:manage_teams',
    'team:read', 'team:create', 'team:update',
    'match:read', 'match:create', 'match:update',
    'player:read',
    'analytics:read', 'analytics:advanced', 'analytics:export',
    'admin:access', 'admin:view_audit_logs',
  ],
  
  CLUB_OWNER: [
    'team:read', 'team:create', 'team:update', 'team:delete', 'team:manage_members', 'team:manage_settings', 'team:approve_requests',
    'player:read', 'player:create', 'player:update', 'player:delete', 'player:manage_contracts', 'player:view_sensitive',
    'match:read', 'match:create', 'match:update', 'match:delete', 'match:manage_lineup', 'match:record_events', 'match:record_stats',
    'training:read', 'training:create', 'training:update', 'training:delete', 'training:record_attendance',
    'injury:read', 'injury:read_full', 'injury:create', 'injury:update', 'injury:delete',
    'contract:read', 'contract:read_full', 'contract:create', 'contract:update', 'contract:delete',
    'finance:read_summary', 'finance:read_full', 'finance:manage',
    'analytics:read', 'analytics:advanced', 'analytics:export',
    'tactics:read', 'tactics:create', 'tactics:update', 'tactics:delete',
    'announcement:read', 'announcement:create', 'announcement:update', 'announcement:delete',
    'user:read', 'user:manage_roles',
    'admin:access',
  ],
  
  MANAGER: [
    'team:read', 'team:update', 'team:manage_members', 'team:approve_requests',
    'player:read', 'player:create', 'player:update', 'player:view_sensitive',
    'match:read', 'match:create', 'match:update', 'match:manage_lineup', 'match:record_events', 'match:record_stats',
    'training:read', 'training:create', 'training:update', 'training:delete', 'training:record_attendance',
    'injury:read', 'injury:read_full', 'injury:create', 'injury:update',
    'contract:read', 'contract:read_full',
    'finance:read_summary',
    'analytics:read', 'analytics:advanced', 'analytics:export',
    'tactics:read', 'tactics:create', 'tactics:update', 'tactics:delete',
    'announcement:read', 'announcement:create', 'announcement:update',
    'user:read',
  ],
  
  TREASURER: [
    'team:read',
    'player:read',
    'contract:read', 'contract:read_full', 'contract:create', 'contract:update',
    'finance:read_summary', 'finance:read_full', 'finance:manage',
    'analytics:read',
  ],
  
  COACH: [
    'team:read',
    'player:read', 'player:update', 'player:view_sensitive',
    'match:read', 'match:update', 'match:manage_lineup', 'match:record_events', 'match:record_stats',
    'training:read', 'training:create', 'training:update', 'training:record_attendance',
    'injury:read', 'injury:read_full', 'injury:create', 'injury:update',
    'analytics:read', 'analytics:advanced',
    'tactics:read', 'tactics:create', 'tactics:update',
    'announcement:read',
  ],
  
  ASSISTANT_COACH: [
    'team:read',
    'player:read', 'player:view_sensitive',
    'match:read', 'match:manage_lineup', 'match:record_events',
    'training:read', 'training:create', 'training:update', 'training:record_attendance',
    'injury:read',
    'analytics:read',
    'tactics:read', 'tactics:update',
    'announcement:read',
  ],
  
  MEDICAL_STAFF: [
    'team:read',
    'player:read', 'player:view_sensitive',
    'injury:read', 'injury:read_full', 'injury:create', 'injury:update', 'injury:delete',
    'training:read',
    'announcement:read',
  ],
  
  PHYSIO: [
    'team:read',
    'player:read', 'player:view_sensitive',
    'injury:read', 'injury:read_full', 'injury:create', 'injury:update',
    'training:read',
    'announcement:read',
  ],
  
  ANALYST: [
    'team:read',
    'player:read',
    'match:read', 'match:record_stats',
    'training:read',
    'analytics:read', 'analytics:advanced', 'analytics:export',
    'tactics:read',
    'announcement:read',
  ],
  
  REFEREE: [
    'match:read', 'match:record_events',
    'team:read',
    'player:read',
  ],
  
  PLAYER: [
    'team:read',
    'player:read',
    'match:read',
    'training:read',
    'injury:read', // Own injuries only
    'contract:read', // Own contract only
    'analytics:read',
    'tactics:read',
    'announcement:read',
  ],
  
  PARENT: [
    'team:read',
    'player:read', // Child only
    'match:read',
    'training:read',
    'injury:read', // Child's injuries only
    'announcement:read',
  ],
  
  VIEWER: [
    'team:read',
    'match:read',
    'player:read',
    'announcement:read',
  ],
  
  USER: [
    'announcement:read',
  ],
};

// ============================================================================
// SPORT-SPECIFIC ROLE MODIFIERS
// ============================================================================

/**
 * Sport-specific additional roles and permissions
 */
export const SPORT_SPECIFIC_ROLES: Partial<Record<Sport, Record<string, Permission[]>>> = {
  CRICKET: {
    SCORER: [
      'match:read', 'match:record_events', 'match:record_stats',
      'player:read',
    ],
    UMPIRE: [
      'match:read', 'match:record_events',
      'player:read',
    ],
  },
  
  AMERICAN_FOOTBALL: {
    OFFENSIVE_COORDINATOR: [
      'tactics:read', 'tactics:create', 'tactics:update',
      'player:read', 'player:view_sensitive',
      'match:read', 'match:manage_lineup',
      'analytics:read', 'analytics:advanced',
    ],
    DEFENSIVE_COORDINATOR: [
      'tactics:read', 'tactics:create', 'tactics:update',
      'player:read', 'player:view_sensitive',
      'match:read', 'match:manage_lineup',
      'analytics:read', 'analytics:advanced',
    ],
    SPECIAL_TEAMS_COACH: [
      'tactics:read', 'tactics:update',
      'player:read',
      'match:read',
      'analytics:read',
    ],
  },
  
  RUGBY: {
    TMO: [ // Television Match Official
      'match:read', 'match:record_events',
      'player:read',
    ],
    TOUCH_JUDGE: [
      'match:read', 'match:record_events',
    ],
  },
  
  BASKETBALL: {
    STATISTICIAN: [
      'match:read', 'match:record_stats',
      'player:read',
      'analytics:read', 'analytics:advanced',
    ],
  },
  
  HOCKEY: {
    VIDEO_UMPIRE: [
      'match:read', 'match:record_events',
      'player:read',
    ],
  },
  
  AUSTRALIAN_RULES: {
    BOUNDARY_UMPIRE: [
      'match:read', 'match:record_events',
    ],
    GOAL_UMPIRE: [
      'match:read', 'match:record_events',
    ],
  },
};

// ============================================================================
// SUBSCRIPTION TIER GATING
// ============================================================================

/**
 * Features available per subscription tier
 */
export const TIER_FEATURES: Record<SubscriptionTier, Permission[]> = {
  PLAYER_FREE: [
    'team:read',
    'player:read',
    'match:read',
    'training:read',
    'announcement:read',
    'analytics:read',
  ],
  
  PLAYER_PRO: [
    'team:read',
    'player:read', 'player:view_sensitive',
    'match:read',
    'training:read',
    'injury:read',
    'contract:read',
    'announcement:read',
    'analytics:read', 'analytics:advanced',
    'tactics:read',
  ],
  
  COACH: [
    'team:read',
    'player:read', 'player:update', 'player:view_sensitive',
    'match:read', 'match:manage_lineup', 'match:record_events', 'match:record_stats',
    'training:read', 'training:create', 'training:update', 'training:record_attendance',
    'injury:read', 'injury:create', 'injury:update',
    'announcement:read', 'announcement:create',
    'analytics:read', 'analytics:advanced',
    'tactics:read', 'tactics:create', 'tactics:update',
  ],
  
  MANAGER: [
    'team:read', 'team:update', 'team:manage_members', 'team:approve_requests',
    'player:read', 'player:create', 'player:update', 'player:view_sensitive',
    'match:read', 'match:create', 'match:update', 'match:manage_lineup', 'match:record_events', 'match:record_stats',
    'training:read', 'training:create', 'training:update', 'training:delete', 'training:record_attendance',
    'injury:read', 'injury:read_full', 'injury:create', 'injury:update',
    'contract:read', 'contract:read_full',
    'finance:read_summary',
    'announcement:read', 'announcement:create', 'announcement:update',
    'analytics:read', 'analytics:advanced', 'analytics:export',
    'tactics:read', 'tactics:create', 'tactics:update', 'tactics:delete',
  ],
  
  LEAGUE_ADMIN: [
    // All permissions from MANAGER plus league management
    'team:read', 'team:create', 'team:update', 'team:delete', 'team:manage_members', 'team:manage_settings', 'team:approve_requests',
    'player:read', 'player:create', 'player:update', 'player:delete', 'player:manage_contracts', 'player:view_sensitive',
    'match:read', 'match:create', 'match:update', 'match:delete', 'match:manage_lineup', 'match:record_events', 'match:record_stats',
    'training:read', 'training:create', 'training:update', 'training:delete', 'training:record_attendance',
    'injury:read', 'injury:read_full', 'injury:create', 'injury:update', 'injury:delete',
    'contract:read', 'contract:read_full', 'contract:create', 'contract:update', 'contract:delete',
    'finance:read_summary', 'finance:read_full', 'finance:manage',
    'announcement:read', 'announcement:create', 'announcement:update', 'announcement:delete',
    'analytics:read', 'analytics:advanced', 'analytics:export',
    'tactics:read', 'tactics:create', 'tactics:update', 'tactics:delete',
    'league:read', 'league:create', 'league:update', 'league:delete', 'league:manage_teams',
    'admin:access', 'admin:view_audit_logs',
  ],
};

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  // Superadmin has all permissions
  if (role === 'SUPERADMIN') return true;
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission) || permissions.includes('superadmin:all');
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  if (role === 'SUPERADMIN') {
    // Return all possible permissions
    return Object.values(ROLE_PERMISSIONS).flat();
  }
  return [...ROLE_PERMISSIONS[role] || []];
}

/**
 * Check if one role is higher than another in hierarchy
 */
export function isHigherRole(role1: Role, role2: Role): boolean {
  return (ROLE_HIERARCHY[role1] || 0) > (ROLE_HIERARCHY[role2] || 0);
}

/**
 * Get the highest role from a list
 */
export function getHighestRole(roles: Role[]): Role | null {
  if (roles.length === 0) return null;
  return roles.reduce((highest, role) => 
    isHigherRole(role, highest) ? role : highest
  );
}

// ============================================================================
// ACCESS LEVEL MATRICES
// ============================================================================

/**
 * Injury data access matrix
 */
const INJURY_ACCESS_MATRIX: Record<Role, AccessLevel> = {
  SUPERADMIN: 'MANAGE',
  LEAGUE_ADMIN: 'FULL',
  CLUB_OWNER: 'MANAGE',
  MANAGER: 'MANAGE',
  TREASURER: 'NONE',
  COACH: 'FULL',
  ASSISTANT_COACH: 'LIMITED',
  MEDICAL_STAFF: 'MANAGE',
  PHYSIO: 'FULL',
  ANALYST: 'LIMITED',
  REFEREE: 'NONE',
  PLAYER: 'LIMITED', // Own injuries only
  PARENT: 'LIMITED', // Child's injuries only
  VIEWER: 'NONE',
  USER: 'NONE',
};

/**
 * Contract data access matrix
 */
const CONTRACT_ACCESS_MATRIX: Record<Role, AccessLevel> = {
  SUPERADMIN: 'MANAGE',
  LEAGUE_ADMIN: 'FULL',
  CLUB_OWNER: 'MANAGE',
  MANAGER: 'FULL',
  TREASURER: 'MANAGE',
  COACH: 'LIMITED',
  ASSISTANT_COACH: 'NONE',
  MEDICAL_STAFF: 'NONE',
  PHYSIO: 'NONE',
  ANALYST: 'NONE',
  REFEREE: 'NONE',
  PLAYER: 'LIMITED', // Own contract only
  PARENT: 'NONE',
  VIEWER: 'NONE',
  USER: 'NONE',
};

/**
 * Financial data access matrix
 */
const FINANCIAL_ACCESS_MATRIX: Record<Role, AccessLevel> = {
  SUPERADMIN: 'MANAGE',
  LEAGUE_ADMIN: 'FULL',
  CLUB_OWNER: 'MANAGE',
  MANAGER: 'LIMITED',
  TREASURER: 'MANAGE',
  COACH: 'NONE',
  ASSISTANT_COACH: 'NONE',
  MEDICAL_STAFF: 'NONE',
  PHYSIO: 'NONE',
  ANALYST: 'NONE',
  REFEREE: 'NONE',
  PLAYER: 'NONE',
  PARENT: 'NONE',
  VIEWER: 'NONE',
  USER: 'NONE',
};

/**
 * Check injury data access level
 */
export function getInjuryAccessLevel(role: Role): AccessLevel {
  return INJURY_ACCESS_MATRIX[role] || 'NONE';
}

/**
 * Check contract data access level
 */
export function getContractAccessLevel(role: Role): AccessLevel {
  return CONTRACT_ACCESS_MATRIX[role] || 'NONE';
}

/**
 * Check financial data access level
 */
export function getFinancialAccessLevel(role: Role): AccessLevel {
  return FINANCIAL_ACCESS_MATRIX[role] || 'NONE';
}

/**
 * Check if role has at least the specified access level
 */
export function hasAccessLevel(role: Role, required: AccessLevel, type: 'injury' | 'contract' | 'finance'): boolean {
  const levels: AccessLevel[] = ['NONE', 'LIMITED', 'FULL', 'MANAGE'];
  const requiredIndex = levels.indexOf(required);
  
  let actual: AccessLevel;
  switch (type) {
    case 'injury':
      actual = getInjuryAccessLevel(role);
      break;
    case 'contract':
      actual = getContractAccessLevel(role);
      break;
    case 'finance':
      actual = getFinancialAccessLevel(role);
      break;
  }
  
  const actualIndex = levels.indexOf(actual);
  return actualIndex >= requiredIndex;
}

// ============================================================================
// TEAM MANAGEMENT ACTIONS
// ============================================================================

export type TeamManagementAction =
  | 'MANAGE_LINEUP'
  | 'MANAGE_EVENTS'
  | 'MANAGE_PLAYERS'
  | 'MANAGE_INJURIES'
  | 'VIEW_ANALYTICS'
  | 'ADVANCED_ANALYTICS'
  | 'MANAGE_ANNOUNCEMENTS'
  | 'MANAGE_CONTRACTS'
  | 'MANAGE_TRAINING'
  | 'MANAGE_TACTICS'
  | 'APPROVE_JOIN_REQUESTS'
  | 'EXPORT_DATA';

const TEAM_ACTION_PERMISSIONS: Record<TeamManagementAction, Permission[]> = {
  MANAGE_LINEUP: ['match:manage_lineup'],
  MANAGE_EVENTS: ['match:record_events'],
  MANAGE_PLAYERS: ['player:create', 'player:update', 'player:delete'],
  MANAGE_INJURIES: ['injury:create', 'injury:update'],
  VIEW_ANALYTICS: ['analytics:read'],
  ADVANCED_ANALYTICS: ['analytics:advanced'],
  MANAGE_ANNOUNCEMENTS: ['announcement:create', 'announcement:update'],
  MANAGE_CONTRACTS: ['contract:create', 'contract:update'],
  MANAGE_TRAINING: ['training:create', 'training:update'],
  MANAGE_TACTICS: ['tactics:create', 'tactics:update'],
  APPROVE_JOIN_REQUESTS: ['team:approve_requests'],
  EXPORT_DATA: ['analytics:export'],
};

/**
 * Check if a role can perform a specific team management action
 */
export function canPerformTeamAction(role: Role, action: TeamManagementAction): boolean {
  const requiredPermissions = TEAM_ACTION_PERMISSIONS[action];
  return hasAnyPermission(role, requiredPermissions);
}

/**
 * Get all team actions a role can perform
 */
export function getAvailableTeamActions(role: Role): TeamManagementAction[] {
  return (Object.keys(TEAM_ACTION_PERMISSIONS) as TeamManagementAction[])
    .filter((action) => canPerformTeamAction(role, action));
}

// ============================================================================
// DATA EXPORT PERMISSIONS
// ============================================================================

export type ExportableData =
  | 'PLAYER_LIST'
  | 'MATCH_HISTORY'
  | 'STATISTICS'
  | 'INJURIES'
  | 'CONTRACTS'
  | 'FINANCIAL'
  | 'ANALYTICS';

const EXPORT_REQUIREMENTS: Record<ExportableData, Permission[]> = {
  PLAYER_LIST: ['player:read', 'analytics:export'],
  MATCH_HISTORY: ['match:read', 'analytics:export'],
  STATISTICS: ['analytics:read', 'analytics:export'],
  INJURIES: ['injury:read_full', 'analytics:export'],
  CONTRACTS: ['contract:read_full', 'analytics:export'],
  FINANCIAL: ['finance:read_full', 'analytics:export'],
  ANALYTICS: ['analytics:advanced', 'analytics:export'],
};

/**
 * Check if a role can export specific data type
 */
export function canExportData(role: Role, dataType: ExportableData): boolean {
  const required = EXPORT_REQUIREMENTS[dataType];
  return hasAllPermissions(role, required);
}

/**
 * Get all exportable data types for a role
 */
export function getExportableDataTypes(role: Role): ExportableData[] {
  return (Object.keys(EXPORT_REQUIREMENTS) as ExportableData[])
    .filter((dataType) => canExportData(role, dataType));
}

// ============================================================================
// ANNOUNCEMENT VISIBILITY
// ============================================================================

/**
 * Check if a user can view an announcement based on target roles
 */
export function canViewAnnouncement(
  userRole: Role,
  targetRoles: Role[] | null,
  isPublic: boolean
): boolean {
  // Public announcements visible to everyone
  if (isPublic) return true;
  
  // No target roles = visible to all team members
  if (!targetRoles || targetRoles.length === 0) return true;
  
  // Check if user's role is in target roles
  return targetRoles.includes(userRole);
}

/**
 * Get roles that can be targeted for announcements (lower or equal in hierarchy)
 */
export function getTargetableRoles(creatorRole: Role): Role[] {
  const creatorLevel = ROLE_HIERARCHY[creatorRole];
  return (Object.keys(ROLE_HIERARCHY) as Role[])
    .filter((role) => ROLE_HIERARCHY[role] <= creatorLevel);
}

// ============================================================================
// SUBSCRIPTION TIER CHECKS
// ============================================================================

/**
 * Check if a subscription tier allows a feature
 */
export function tierAllowsFeature(tier: SubscriptionTier, permission: Permission): boolean {
  const tierPermissions = TIER_FEATURES[tier] || [];
  return tierPermissions.includes(permission);
}

/**
 * Get the minimum tier required for a permission
 */
export function getMinimumTierForPermission(permission: Permission): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['PLAYER_FREE', 'PLAYER_PRO', 'COACH', 'MANAGER', 'LEAGUE_ADMIN'];
  
  for (const tier of tiers) {
    if (TIER_FEATURES[tier].includes(permission)) {
      return tier;
    }
  }
  
  return null;
}

/**
 * Check if user's tier meets requirement
 */
export function meetsTierRequirement(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierOrder: SubscriptionTier[] = ['PLAYER_FREE', 'PLAYER_PRO', 'COACH', 'MANAGER', 'LEAGUE_ADMIN'];
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
}

// ============================================================================
// SPORT-SPECIFIC PERMISSION HELPERS
// ============================================================================

/**
 * Get sport-specific roles
 */
export function getSportSpecificRoles(sport: Sport): string[] {
  const sportRoles = SPORT_SPECIFIC_ROLES[sport];
  return sportRoles ? Object.keys(sportRoles) : [];
}

/**
 * Get permissions for a sport-specific role
 */
export function getSportSpecificPermissions(sport: Sport, role: string): Permission[] {
  const sportRoles = SPORT_SPECIFIC_ROLES[sport];
  if (!sportRoles) return [];
  return sportRoles[role] || [];
}

/**
 * Check if a sport has a specific role
 */
export function sportHasRole(sport: Sport, role: string): boolean {
  const sportRoles = SPORT_SPECIFIC_ROLES[sport];
  return sportRoles ? role in sportRoles : false;
}

// ============================================================================
// RESOURCE OWNERSHIP CHECKS
// ============================================================================

/**
 * Check if user can access their own resource (e.g., player viewing own contract)
 */
export function canAccessOwnResource(
  role: Role,
  resourceType: ResourceType,
  isOwner: boolean
): boolean {
  // If they're the owner, check if their role allows self-access
  if (!isOwner) return hasPermission(role, `${resourceType}:read` as Permission);
  
  // Players/Parents can access their own limited resources
  if (role === 'PLAYER' || role === 'PARENT') {
    switch (resourceType) {
      case 'injury':
      case 'contract':
      case 'player':
        return true;
      default:
        return hasPermission(role, `${resourceType}:read` as Permission);
    }
  }
  
  return hasPermission(role, `${resourceType}:read` as Permission);
}

// ============================================================================
// PERMISSION SUMMARY
// ============================================================================

export interface PermissionSummary {
  role: Role;
  permissions: Permission[];
  accessLevels: {
    injury: AccessLevel;
    contract: AccessLevel;
    finance: AccessLevel;
  };
  teamActions: TeamManagementAction[];
  exportableData: ExportableData[];
  hierarchyLevel: number;
}

/**
 * Get complete permission summary for a role
 */
export function getPermissionSummary(role: Role): PermissionSummary {
  return {
    role,
    permissions: getRolePermissions(role),
    accessLevels: {
      injury: getInjuryAccessLevel(role),
      contract: getContractAccessLevel(role),
      finance: getFinancialAccessLevel(role),
    },
    teamActions: getAvailableTeamActions(role),
    exportableData: getExportableDataTypes(role),
    hierarchyLevel: ROLE_HIERARCHY[role],
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Role hierarchy
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  SPORT_SPECIFIC_ROLES,
  TIER_FEATURES,
  
  // Permission checks
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  
  // Role hierarchy
  isHigherRole,
  getHighestRole,
  
  // Access levels
  getInjuryAccessLevel,
  getContractAccessLevel,
  getFinancialAccessLevel,
  hasAccessLevel,
  
  // Team actions
  canPerformTeamAction,
  getAvailableTeamActions,
  
  // Export permissions
  canExportData,
  getExportableDataTypes,
  
  // Announcements
  canViewAnnouncement,
  getTargetableRoles,
  
  // Subscription tiers
  tierAllowsFeature,
  getMinimumTierForPermission,
  meetsTierRequirement,
  
  // Sport-specific
  getSportSpecificRoles,
  getSportSpecificPermissions,
  sportHasRole,
  
  // Resource ownership
  canAccessOwnResource,
  
  // Summary
  getPermissionSummary,
};