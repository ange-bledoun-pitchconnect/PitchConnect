// ============================================================================
// 🔐 NEXTAUTH TYPE DEFINITIONS - PitchConnect v7.5.0
// Path: src/types/next-auth.d.ts
// ============================================================================
//
// NextAuth.js type augmentation for enterprise authentication.
// CRITICAL: These types MUST be kept in sync with src/lib/auth.ts
//
// ============================================================================

import 'next-auth';
import 'next-auth/jwt';
import { DefaultSession, DefaultUser } from 'next-auth';

// ============================================================================
// USER ROLE TYPES (19 ROLES - Matches lib/auth.ts)
// ============================================================================

/**
 * All user roles in the system with hierarchical permissions.
 * Hierarchy: SUPERADMIN (100) → USER (10)
 */
export type UserRole =
  | 'SUPERADMIN'        // 100 - Full system access
  | 'ADMIN'             // 90  - Organization admin
  | 'LEAGUE_ADMIN'      // 85  - League management
  | 'CLUB_OWNER'        // 80  - Club ownership
  | 'MANAGER'           // 75  - Team/club management
  | 'TREASURER'         // 70  - Financial management
  | 'COACH'             // 65  - Head coach
  | 'ASSISTANT_COACH'   // 60  - Assistant coaching
  | 'MEDICAL_STAFF'     // 55  - Medical team lead
  | 'PHYSIO'            // 50  - Physiotherapy
  | 'ANALYST'           // 45  - Performance analysis
  | 'SCOUT'             // 40  - Player scouting
  | 'REFEREE'           // 35  - Match officiating
  | 'PLAYER_PRO'        // 30  - Professional player
  | 'PLAYER'            // 25  - Amateur/youth player
  | 'PARENT'            // 20  - Parent/legal guardian
  | 'GUARDIAN'          // 20  - Legal guardian (non-parent)
  | 'VIEWER'            // 15  - Read-only access
  | 'USER';             // 10  - Basic authenticated user

/**
 * Role hierarchy for permission checks
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPERADMIN: 100,
  ADMIN: 90,
  LEAGUE_ADMIN: 85,
  CLUB_OWNER: 80,
  MANAGER: 75,
  TREASURER: 70,
  COACH: 65,
  ASSISTANT_COACH: 60,
  MEDICAL_STAFF: 55,
  PHYSIO: 50,
  ANALYST: 45,
  SCOUT: 40,
  REFEREE: 35,
  PLAYER_PRO: 30,
  PLAYER: 25,
  PARENT: 20,
  GUARDIAN: 20,
  VIEWER: 15,
  USER: 10,
};

// ============================================================================
// PERMISSION TYPES (Granular Access Control)
// ============================================================================

/**
 * All granular permissions in the system.
 * Organized by domain for maintainability.
 */
export type PermissionName =
  // System Administration
  | 'system:admin'
  | 'manage_users'
  | 'view_audit_logs'
  | 'manage_settings'
  
  // Organization & Club Management
  | 'manage_organisations'
  | 'manage_clubs'
  | 'manage_club'
  | 'view_club'
  | 'manage_members'
  
  // Team Management
  | 'manage_teams'
  | 'manage_team'
  | 'view_team'
  | 'manage_roster'
  
  // Player Management
  | 'manage_players'
  | 'view_players'
  | 'manage_profile'
  | 'view_profile'
  | 'view_child_profile'
  
  // League & Competition
  | 'manage_leagues'
  | 'manage_league'
  | 'manage_competitions'
  | 'manage_fixtures'
  | 'manage_standings'
  | 'manage_results'
  
  // Match Management
  | 'manage_matches'
  | 'view_matches'
  | 'record_match_events'
  | 'approve_results'
  | 'manage_officials'
  
  // Training Management
  | 'manage_training'
  | 'view_training'
  | 'manage_tactics'
  | 'manage_drills'
  | 'record_attendance'
  
  // Analytics & Reporting
  | 'view_analytics'
  | 'analyze_performance'
  | 'generate_reports'
  | 'view_reports'
  | 'view_stats'
  | 'view_match_stats'
  | 'export_data'
  
  // Scouting
  | 'manage_scouting'
  | 'view_scouting'
  | 'create_scout_reports'
  
  // Finance
  | 'manage_payments'
  | 'view_payments'
  | 'manage_subscriptions'
  | 'view_invoices'
  | 'manage_budgets'
  
  // Media & Content
  | 'manage_videos'
  | 'view_videos'
  | 'manage_media'
  | 'manage_live_matches'
  | 'upload_media'
  
  // Medical & Fitness
  | 'manage_injuries'
  | 'view_injuries'
  | 'manage_medical'
  | 'view_medical'
  | 'manage_fitness'
  | 'view_fitness'
  
  // Communication
  | 'send_notifications'
  | 'manage_announcements'
  | 'send_messages'
  
  // Jobs & Recruitment
  | 'manage_jobs'
  | 'view_jobs'
  | 'apply_jobs'
  | 'review_applications';

// ============================================================================
// USER STATUS & ACCOUNT TYPES
// ============================================================================

/**
 * User account status
 */
export type UserStatus = 
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'BANNED'
  | 'PENDING_VERIFICATION'
  | 'DELETED';

/**
 * Account/subscription tier
 */
export type AccountTier = 
  | 'FREE'
  | 'STARTER'
  | 'PRO'
  | 'PREMIUM'
  | 'ENTERPRISE';

// ============================================================================
// NEXTAUTH MODULE AUGMENTATION
// ============================================================================

declare module 'next-auth' {
  /**
   * User object returned from OAuth providers and credential auth.
   * Extended with PitchConnect-specific fields.
   */
  interface User extends DefaultUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    image?: string | null;
    avatar?: string | null;
    
    // Role & Permissions
    role: UserRole;
    roles: UserRole[];
    permissions?: PermissionName[];
    
    // Account Status
    status: UserStatus;
    isVerified: boolean;
    emailVerifiedAt?: Date | null;
    
    // Subscription
    tier: AccountTier;
    
    // Associations
    clubId?: string | null;
    teamId?: string | null;
    organisationId?: string | null;
    playerId?: string | null;
    
    // Preferences
    timezone?: string;
    locale?: string;
  }

  /**
   * Session object available via useSession() and getServerSession().
   * Contains user data and authentication state.
   */
  interface Session {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      image?: string | null;
      avatar?: string | null;
      
      // Role & Permissions
      role: UserRole;
      roles: UserRole[];
      permissions: PermissionName[];
      
      // Account Status
      status: UserStatus;
      isVerified: boolean;
      
      // Subscription
      tier: AccountTier;
      
      // Associations
      clubId?: string | null;
      teamId?: string | null;
      organisationId?: string | null;
      playerId?: string | null;
      
      // Preferences
      timezone?: string;
      locale?: string;
    } & DefaultSession['user'];
    
    // Session metadata
    expires: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWT token contents stored in HTTP-only cookie.
   * Refreshed based on session.updateAge config.
   */
  interface JWT {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    image?: string | null;
    avatar?: string | null;
    
    // Role & Permissions
    role: UserRole;
    roles: UserRole[];
    permissions: PermissionName[];
    
    // Account Status
    status: UserStatus;
    isVerified: boolean;
    
    // Subscription
    tier: AccountTier;
    
    // Associations
    clubId?: string | null;
    teamId?: string | null;
    organisationId?: string | null;
    playerId?: string | null;
    
    // JWT Metadata
    iat?: number;  // Issued at (Unix timestamp)
    exp?: number;  // Expiration (Unix timestamp)
    jti?: string;  // JWT ID
    sub?: string;  // Subject (user ID)
  }
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

/**
 * Check if a string is a valid UserRole
 */
export function isValidRole(role: string): role is UserRole {
  return Object.keys(ROLE_HIERARCHY).includes(role);
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRoles: UserRole[], role: UserRole): boolean {
  return userRoles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: UserRole[], roles: UserRole[]): boolean {
  return roles.some(role => userRoles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(userRoles: UserRole[], roles: UserRole[]): boolean {
  return roles.every(role => userRoles.includes(role));
}

/**
 * Get the highest role from a list of roles
 */
export function getHighestRole(roles: UserRole[]): UserRole {
  return roles.reduce((highest, current) => {
    return ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest;
  }, 'USER' as UserRole);
}

/**
 * Check if roleA is higher than roleB in hierarchy
 */
export function isHigherRole(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

// ============================================================================
// ROLE GROUPS (For UI & Permission Checks)
// ============================================================================

/**
 * Administrative roles with elevated privileges
 */
export const ADMIN_ROLES: UserRole[] = [
  'SUPERADMIN',
  'ADMIN',
  'LEAGUE_ADMIN',
];

/**
 * Club management roles
 */
export const CLUB_MANAGEMENT_ROLES: UserRole[] = [
  'CLUB_OWNER',
  'MANAGER',
  'TREASURER',
];

/**
 * Coaching staff roles
 */
export const COACHING_ROLES: UserRole[] = [
  'COACH',
  'ASSISTANT_COACH',
  'ANALYST',
];

/**
 * Medical staff roles
 */
export const MEDICAL_ROLES: UserRole[] = [
  'MEDICAL_STAFF',
  'PHYSIO',
];

/**
 * Player roles
 */
export const PLAYER_ROLES: UserRole[] = [
  'PLAYER_PRO',
  'PLAYER',
];

/**
 * Family/guardian roles
 */
export const FAMILY_ROLES: UserRole[] = [
  'PARENT',
  'GUARDIAN',
];

/**
 * All staff roles (non-player)
 */
export const STAFF_ROLES: UserRole[] = [
  ...ADMIN_ROLES,
  ...CLUB_MANAGEMENT_ROLES,
  ...COACHING_ROLES,
  ...MEDICAL_ROLES,
  'SCOUT',
  'REFEREE',
];

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  UserRole,
  PermissionName,
  UserStatus,
  AccountTier,
};