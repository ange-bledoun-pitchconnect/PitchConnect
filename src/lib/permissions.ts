// ============================================================================
// 🔐 PITCHCONNECT - PERMISSIONS UTILITY
// ============================================================================
// Role-based access control helpers for sensitive data
// ============================================================================

// ============================================================================
// INJURY DATA ACCESS LEVELS
// ============================================================================

type InjuryAccessLevel = 'FULL' | 'LIMITED' | 'MANAGE' | 'NONE';

const INJURY_ACCESS_MATRIX: Record<string, Record<InjuryAccessLevel, boolean>> = {
  OWNER: { FULL: true, LIMITED: true, MANAGE: true, NONE: false },
  ADMIN: { FULL: true, LIMITED: true, MANAGE: true, NONE: false },
  MANAGER: { FULL: true, LIMITED: true, MANAGE: true, NONE: false },
  COACH: { FULL: true, LIMITED: true, MANAGE: true, NONE: false },
  MEDICAL_STAFF: { FULL: true, LIMITED: true, MANAGE: true, NONE: false },
  PHYSIO: { FULL: true, LIMITED: true, MANAGE: true, NONE: false },
  ASSISTANT_COACH: { FULL: false, LIMITED: true, MANAGE: false, NONE: false },
  ANALYST: { FULL: false, LIMITED: true, MANAGE: false, NONE: false },
  PLAYER: { FULL: false, LIMITED: true, MANAGE: false, NONE: false },
  PARENT: { FULL: false, LIMITED: true, MANAGE: false, NONE: false },
  VIEWER: { FULL: false, LIMITED: true, MANAGE: false, NONE: false },
};

/**
 * Check if a role has access to injury data at a specific level
 */
export function canAccessInjuryData(role: string, level: InjuryAccessLevel): boolean {
  const roleAccess = INJURY_ACCESS_MATRIX[role.toUpperCase()];
  if (!roleAccess) return false;
  return roleAccess[level] ?? false;
}

// ============================================================================
// CONTRACT DATA ACCESS
// ============================================================================

type ContractAccessLevel = 'FULL' | 'LIMITED' | 'MANAGE' | 'NONE';

const CONTRACT_ACCESS_MATRIX: Record<string, Record<ContractAccessLevel, boolean>> = {
  OWNER: { FULL: true, LIMITED: true, MANAGE: true, NONE: false },
  ADMIN: { FULL: true, LIMITED: true, MANAGE: true, NONE: false },
  MANAGER: { FULL: true, LIMITED: true, MANAGE: true, NONE: false },
  TREASURER: { FULL: true, LIMITED: true, MANAGE: true, NONE: false },
  COACH: { FULL: false, LIMITED: true, MANAGE: false, NONE: false },
  ASSISTANT_COACH: { FULL: false, LIMITED: false, MANAGE: false, NONE: false },
  PLAYER: { FULL: false, LIMITED: false, MANAGE: false, NONE: false }, // Own contract only
  VIEWER: { FULL: false, LIMITED: false, MANAGE: false, NONE: false },
};

/**
 * Check if a role has access to contract data at a specific level
 */
export function canAccessContractData(role: string, level: ContractAccessLevel): boolean {
  const roleAccess = CONTRACT_ACCESS_MATRIX[role.toUpperCase()];
  if (!roleAccess) return false;
  return roleAccess[level] ?? false;
}

// ============================================================================
// FINANCIAL DATA ACCESS
// ============================================================================

type FinancialAccessLevel = 'FULL' | 'SUMMARY' | 'NONE';

const FINANCIAL_ACCESS_MATRIX: Record<string, Record<FinancialAccessLevel, boolean>> = {
  OWNER: { FULL: true, SUMMARY: true, NONE: false },
  ADMIN: { FULL: true, SUMMARY: true, NONE: false },
  TREASURER: { FULL: true, SUMMARY: true, NONE: false },
  MANAGER: { FULL: false, SUMMARY: true, NONE: false },
  COACH: { FULL: false, SUMMARY: false, NONE: false },
  PLAYER: { FULL: false, SUMMARY: false, NONE: false },
  VIEWER: { FULL: false, SUMMARY: false, NONE: false },
};

/**
 * Check if a role has access to financial data at a specific level
 */
export function canAccessFinancialData(role: string, level: FinancialAccessLevel): boolean {
  const roleAccess = FINANCIAL_ACCESS_MATRIX[role.toUpperCase()];
  if (!roleAccess) return false;
  return roleAccess[level] ?? false;
}

// ============================================================================
// TEAM MANAGEMENT PERMISSIONS
// ============================================================================

type TeamManagementAction = 
  | 'MANAGE_LINEUP'
  | 'MANAGE_EVENTS'
  | 'MANAGE_PLAYERS'
  | 'MANAGE_INJURIES'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_ANNOUNCEMENTS'
  | 'MANAGE_CONTRACTS'
  | 'MANAGE_TRAINING'
  | 'APPROVE_JOIN_REQUESTS';

const TEAM_MANAGEMENT_PERMISSIONS: Record<string, TeamManagementAction[]> = {
  OWNER: [
    'MANAGE_LINEUP', 'MANAGE_EVENTS', 'MANAGE_PLAYERS', 'MANAGE_INJURIES',
    'VIEW_ANALYTICS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_CONTRACTS',
    'MANAGE_TRAINING', 'APPROVE_JOIN_REQUESTS'
  ],
  ADMIN: [
    'MANAGE_LINEUP', 'MANAGE_EVENTS', 'MANAGE_PLAYERS', 'MANAGE_INJURIES',
    'VIEW_ANALYTICS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_CONTRACTS',
    'MANAGE_TRAINING', 'APPROVE_JOIN_REQUESTS'
  ],
  MANAGER: [
    'MANAGE_LINEUP', 'MANAGE_EVENTS', 'MANAGE_PLAYERS', 'MANAGE_INJURIES',
    'VIEW_ANALYTICS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_TRAINING', 'APPROVE_JOIN_REQUESTS'
  ],
  COACH: [
    'MANAGE_LINEUP', 'MANAGE_EVENTS', 'MANAGE_INJURIES',
    'VIEW_ANALYTICS', 'MANAGE_TRAINING'
  ],
  ASSISTANT_COACH: [
    'MANAGE_LINEUP', 'MANAGE_EVENTS', 'VIEW_ANALYTICS', 'MANAGE_TRAINING'
  ],
  ANALYST: ['VIEW_ANALYTICS'],
  MEDICAL_STAFF: ['MANAGE_INJURIES'],
  PHYSIO: ['MANAGE_INJURIES'],
  TREASURER: ['MANAGE_CONTRACTS'],
  PLAYER: [],
  PARENT: [],
  VIEWER: [],
};

/**
 * Check if a role can perform a specific team management action
 */
export function canPerformTeamAction(role: string, action: TeamManagementAction): boolean {
  const permissions = TEAM_MANAGEMENT_PERMISSIONS[role.toUpperCase()];
  if (!permissions) return false;
  return permissions.includes(action);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): TeamManagementAction[] {
  return TEAM_MANAGEMENT_PERMISSIONS[role.toUpperCase()] || [];
}

// ============================================================================
// ANNOUNCEMENT VISIBILITY
// ============================================================================

/**
 * Check if a user can view an announcement based on target roles
 */
export function canViewAnnouncement(
  userRole: string,
  targetRoles: string[] | null,
  isPublic: boolean
): boolean {
  // Public announcements are visible to everyone
  if (isPublic) return true;
  
  // No target roles means visible to all club members
  if (!targetRoles || targetRoles.length === 0) return true;
  
  // Check if user's role is in target roles
  return targetRoles.includes(userRole.toUpperCase());
}

// ============================================================================
// DATA EXPORT PERMISSIONS
// ============================================================================

type ExportableData = 
  | 'PLAYER_LIST'
  | 'MATCH_HISTORY'
  | 'STATISTICS'
  | 'INJURIES'
  | 'CONTRACTS'
  | 'FINANCIAL';

const EXPORT_PERMISSIONS: Record<string, ExportableData[]> = {
  OWNER: ['PLAYER_LIST', 'MATCH_HISTORY', 'STATISTICS', 'INJURIES', 'CONTRACTS', 'FINANCIAL'],
  ADMIN: ['PLAYER_LIST', 'MATCH_HISTORY', 'STATISTICS', 'INJURIES', 'CONTRACTS', 'FINANCIAL'],
  MANAGER: ['PLAYER_LIST', 'MATCH_HISTORY', 'STATISTICS', 'INJURIES'],
  COACH: ['PLAYER_LIST', 'MATCH_HISTORY', 'STATISTICS'],
  ANALYST: ['MATCH_HISTORY', 'STATISTICS'],
  MEDICAL_STAFF: ['INJURIES'],
  TREASURER: ['CONTRACTS', 'FINANCIAL'],
};

/**
 * Check if a role can export specific data type
 */
export function canExportData(role: string, dataType: ExportableData): boolean {
  const permissions = EXPORT_PERMISSIONS[role.toUpperCase()];
  if (!permissions) return false;
  return permissions.includes(dataType);
}

// ============================================================================
// HELPER TYPES EXPORT
// ============================================================================

export type {
  InjuryAccessLevel,
  ContractAccessLevel,
  FinancialAccessLevel,
  TeamManagementAction,
  ExportableData,
};