/**
 * ============================================================================
 * 🔐 USE AUTH HOOK v7.10.1 - ENTERPRISE AUTHENTICATION
 * ============================================================================
 * 
 * Comprehensive authentication hook with role hierarchy and permissions.
 * Integrates with NextAuth.js and provides type-safe access control.
 * 
 * Features:
 * - Full UserRole enum support (18 roles)
 * - ClubMemberRole support (18 roles)
 * - Role hierarchy with inheritance
 * - Permission checking
 * - Club membership context
 * - Account tier awareness
 * - Zod validation
 * 
 * @version 7.10.1
 * @path src/hooks/useAuth.ts
 * ============================================================================
 */

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useMemo, useCallback } from 'react';
import { z } from 'zod';

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

export const UserRoleEnum = z.enum([
  'SUPERADMIN',
  'ADMIN',
  'PLAYER',
  'PLAYER_PRO',
  'COACH',
  'COACH_PRO',
  'MANAGER',
  'CLUB_MANAGER',
  'CLUB_OWNER',
  'TREASURER',
  'REFEREE',
  'SCOUT',
  'ANALYST',
  'PARENT',
  'GUARDIAN',
  'LEAGUE_ADMIN',
  'MEDICAL_STAFF',
  'MEDIA_MANAGER',
  'FAN',
]);

export type UserRole = z.infer<typeof UserRoleEnum>;

export const ClubMemberRoleEnum = z.enum([
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'PLAYER',
  'STAFF',
  'TREASURER',
  'SCOUT',
  'ANALYST',
  'MEDICAL_STAFF',
  'PHYSIOTHERAPIST',
  'NUTRITIONIST',
  'PSYCHOLOGIST',
  'PERFORMANCE_COACH',
  'GOALKEEPING_COACH',
  'KIT_MANAGER',
  'MEDIA_OFFICER',
  'VIDEO_ANALYST',
]);

export type ClubMemberRole = z.infer<typeof ClubMemberRoleEnum>;

export const AccountTierEnum = z.enum([
  'FREE',
  'PRO',
  'PREMIUM',
  'ENTERPRISE',
]);

export type AccountTier = z.infer<typeof AccountTierEnum>;

export const UserStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'BANNED',
  'PENDING_VERIFICATION',
  'PENDING_EMAIL_VERIFICATION',
  'PENDING_PHONE_VERIFICATION',
  'PENDING_APPROVAL',
  'ARCHIVED',
  'DELETED',
  'DEACTIVATED',
]);

export type UserStatus = z.infer<typeof UserStatusEnum>;

// =============================================================================
// TYPES
// =============================================================================

export interface ClubMembership {
  clubId: string;
  clubName: string;
  role: ClubMemberRole;
  isActive: boolean;
  isPrimary: boolean;
  teamIds: string[];
  permissions: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  roles: UserRole[];
  status: UserStatus;
  tier: AccountTier;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  clubMemberships: ClubMembership[];
  playerId?: string;
  coachId?: string;
  refereeId?: string;
  scoutId?: string;
  linkedChildren?: string[];
  preferences?: Record<string, unknown>;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
  error: Error | null;
}

// =============================================================================
// ROLE HIERARCHY - Higher number = more permissions
// =============================================================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  FAN: 1,
  PARENT: 2,
  GUARDIAN: 2,
  PLAYER: 3,
  PLAYER_PRO: 4,
  REFEREE: 5,
  SCOUT: 5,
  ANALYST: 5,
  MEDICAL_STAFF: 5,
  MEDIA_MANAGER: 5,
  COACH: 6,
  COACH_PRO: 7,
  TREASURER: 7,
  MANAGER: 8,
  CLUB_MANAGER: 9,
  CLUB_OWNER: 10,
  LEAGUE_ADMIN: 11,
  ADMIN: 12,
  SUPERADMIN: 100,
};

const CLUB_ROLE_HIERARCHY: Record<ClubMemberRole, number> = {
  PLAYER: 1,
  KIT_MANAGER: 2,
  MEDIA_OFFICER: 2,
  VIDEO_ANALYST: 3,
  NUTRITIONIST: 3,
  PSYCHOLOGIST: 3,
  PHYSIOTHERAPIST: 4,
  MEDICAL_STAFF: 4,
  ANALYST: 5,
  SCOUT: 5,
  PERFORMANCE_COACH: 5,
  GOALKEEPING_COACH: 5,
  STAFF: 5,
  ASSISTANT_COACH: 6,
  TREASURER: 7,
  HEAD_COACH: 8,
  MANAGER: 9,
  OWNER: 10,
};

// =============================================================================
// PERMISSION SETS
// =============================================================================

const ADMIN_ROLES: UserRole[] = ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN'];
const MANAGEMENT_ROLES: UserRole[] = ['CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER'];
const COACHING_ROLES: UserRole[] = ['COACH', 'COACH_PRO'];
const STAFF_ROLES: UserRole[] = ['ANALYST', 'SCOUT', 'MEDICAL_STAFF', 'MEDIA_MANAGER', 'TREASURER'];
const PLAYER_ROLES: UserRole[] = ['PLAYER', 'PLAYER_PRO'];
const GUARDIAN_ROLES: UserRole[] = ['PARENT', 'GUARDIAN'];

const CLUB_ADMIN_ROLES: ClubMemberRole[] = ['OWNER', 'MANAGER'];
const CLUB_COACHING_ROLES: ClubMemberRole[] = ['HEAD_COACH', 'ASSISTANT_COACH', 'GOALKEEPING_COACH', 'PERFORMANCE_COACH'];
const CLUB_MEDICAL_ROLES: ClubMemberRole[] = ['MEDICAL_STAFF', 'PHYSIOTHERAPIST', 'NUTRITIONIST', 'PSYCHOLOGIST'];
const CLUB_ANALYTICS_ROLES: ClubMemberRole[] = ['ANALYST', 'VIDEO_ANALYST', 'SCOUT'];

// =============================================================================
// HOOK
// =============================================================================

export interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
  onUnauthenticated?: () => void;
}

export interface UseAuthReturn extends AuthState {
  // User checks
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
  hasClubRole: (clubId: string, role: ClubMemberRole | ClubMemberRole[]) => boolean;
  hasMinimumClubRole: (clubId: string, minimumRole: ClubMemberRole) => boolean;
  
  // Category checks
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isManagement: boolean;
  isCoach: boolean;
  isStaff: boolean;
  isPlayer: boolean;
  isGuardian: boolean;
  isReferee: boolean;
  isScout: boolean;
  isFan: boolean;
  
  // Account checks
  isPro: boolean;
  isPremium: boolean;
  isEnterprise: boolean;
  isVerified: boolean;
  
  // Club membership checks
  isMemberOfClub: (clubId: string) => boolean;
  isClubAdmin: (clubId: string) => boolean;
  isClubCoach: (clubId: string) => boolean;
  isClubMedical: (clubId: string) => boolean;
  getClubMembership: (clubId: string) => ClubMembership | undefined;
  getPrimaryClub: () => ClubMembership | undefined;
  getClubsWithRole: (role: ClubMemberRole | ClubMemberRole[]) => ClubMembership[];
  
  // Permission checks
  canManageUsers: boolean;
  canManageClubs: boolean;
  canManageMatches: boolean;
  canManageTeams: boolean;
  canManagePlayers: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  canAccessMedicalRecords: boolean;
  canManageBilling: boolean;
  
  // Actions
  signIn: typeof signIn;
  signOut: typeof signOut;
  refreshSession: () => Promise<void>;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { data: session, status, update } = useSession({
    required: options.required,
    onUnauthenticated: options.onUnauthenticated,
  });

  // Parse user from session
  const user = useMemo<AuthUser | null>(() => {
    if (!session?.user) return null;
    
    // Type assertion - in production, this comes from your NextAuth config
    return session.user as unknown as AuthUser;
  }, [session]);

  // Basic auth state
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!user;
  const isUnauthenticated = status === 'unauthenticated';

  // ==========================================================================
  // ROLE CHECKS
  // ==========================================================================

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user?.roles) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => user.roles.includes(r));
  }, [user]);

  const hasMinimumRole = useCallback((minimumRole: UserRole): boolean => {
    if (!user?.roles) return false;
    const minimumLevel = ROLE_HIERARCHY[minimumRole];
    return user.roles.some(r => ROLE_HIERARCHY[r] >= minimumLevel);
  }, [user]);

  const hasClubRole = useCallback((clubId: string, role: ClubMemberRole | ClubMemberRole[]): boolean => {
    if (!user?.clubMemberships) return false;
    const membership = user.clubMemberships.find(m => m.clubId === clubId && m.isActive);
    if (!membership) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(membership.role);
  }, [user]);

  const hasMinimumClubRole = useCallback((clubId: string, minimumRole: ClubMemberRole): boolean => {
    if (!user?.clubMemberships) return false;
    const membership = user.clubMemberships.find(m => m.clubId === clubId && m.isActive);
    if (!membership) return false;
    const minimumLevel = CLUB_ROLE_HIERARCHY[minimumRole];
    return CLUB_ROLE_HIERARCHY[membership.role] >= minimumLevel;
  }, [user]);

  // ==========================================================================
  // CATEGORY CHECKS
  // ==========================================================================

  const isAdmin = useMemo(() => hasRole(ADMIN_ROLES), [hasRole]);
  const isSuperAdmin = useMemo(() => hasRole('SUPERADMIN'), [hasRole]);
  const isManagement = useMemo(() => hasRole(MANAGEMENT_ROLES), [hasRole]);
  const isCoach = useMemo(() => hasRole(COACHING_ROLES), [hasRole]);
  const isStaff = useMemo(() => hasRole(STAFF_ROLES), [hasRole]);
  const isPlayer = useMemo(() => hasRole(PLAYER_ROLES), [hasRole]);
  const isGuardian = useMemo(() => hasRole(GUARDIAN_ROLES), [hasRole]);
  const isReferee = useMemo(() => hasRole('REFEREE'), [hasRole]);
  const isScout = useMemo(() => hasRole('SCOUT'), [hasRole]);
  const isFan = useMemo(() => hasRole('FAN'), [hasRole]);

  // ==========================================================================
  // ACCOUNT CHECKS
  // ==========================================================================

  const isPro = useMemo(() => {
    return ['PRO', 'PREMIUM', 'ENTERPRISE'].includes(user?.tier || '');
  }, [user]);

  const isPremium = useMemo(() => {
    return ['PREMIUM', 'ENTERPRISE'].includes(user?.tier || '');
  }, [user]);

  const isEnterprise = useMemo(() => {
    return user?.tier === 'ENTERPRISE';
  }, [user]);

  const isVerified = useMemo(() => {
    return user?.emailVerified === true;
  }, [user]);

  // ==========================================================================
  // CLUB MEMBERSHIP CHECKS
  // ==========================================================================

  const isMemberOfClub = useCallback((clubId: string): boolean => {
    return user?.clubMemberships?.some(m => m.clubId === clubId && m.isActive) ?? false;
  }, [user]);

  const isClubAdmin = useCallback((clubId: string): boolean => {
    return hasClubRole(clubId, CLUB_ADMIN_ROLES);
  }, [hasClubRole]);

  const isClubCoach = useCallback((clubId: string): boolean => {
    return hasClubRole(clubId, CLUB_COACHING_ROLES);
  }, [hasClubRole]);

  const isClubMedical = useCallback((clubId: string): boolean => {
    return hasClubRole(clubId, CLUB_MEDICAL_ROLES);
  }, [hasClubRole]);

  const getClubMembership = useCallback((clubId: string): ClubMembership | undefined => {
    return user?.clubMemberships?.find(m => m.clubId === clubId && m.isActive);
  }, [user]);

  const getPrimaryClub = useCallback((): ClubMembership | undefined => {
    return user?.clubMemberships?.find(m => m.isPrimary && m.isActive);
  }, [user]);

  const getClubsWithRole = useCallback((role: ClubMemberRole | ClubMemberRole[]): ClubMembership[] => {
    if (!user?.clubMemberships) return [];
    const roles = Array.isArray(role) ? role : [role];
    return user.clubMemberships.filter(m => m.isActive && roles.includes(m.role));
  }, [user]);

  // ==========================================================================
  // PERMISSION CHECKS
  // ==========================================================================

  const canManageUsers = useMemo(() => {
    return isAdmin || hasRole(['CLUB_OWNER', 'CLUB_MANAGER']);
  }, [isAdmin, hasRole]);

  const canManageClubs = useMemo(() => {
    return isAdmin || hasRole(['CLUB_OWNER', 'LEAGUE_ADMIN']);
  }, [isAdmin, hasRole]);

  const canManageMatches = useMemo(() => {
    return isAdmin || isManagement || isCoach || hasRole('REFEREE');
  }, [isAdmin, isManagement, isCoach, hasRole]);

  const canManageTeams = useMemo(() => {
    return isAdmin || isManagement || isCoach;
  }, [isAdmin, isManagement, isCoach]);

  const canManagePlayers = useMemo(() => {
    return isAdmin || isManagement || isCoach || isScout;
  }, [isAdmin, isManagement, isCoach, isScout]);

  const canViewAnalytics = useMemo(() => {
    return isAdmin || isManagement || isCoach || hasRole(['ANALYST', 'SCOUT']);
  }, [isAdmin, isManagement, isCoach, hasRole]);

  const canExportData = useMemo(() => {
    return isPro || isAdmin || isManagement;
  }, [isPro, isAdmin, isManagement]);

  const canAccessMedicalRecords = useMemo(() => {
    return isAdmin || hasRole(['MEDICAL_STAFF']) || 
           (user?.clubMemberships?.some(m => CLUB_MEDICAL_ROLES.includes(m.role)) ?? false);
  }, [isAdmin, hasRole, user]);

  const canManageBilling = useMemo(() => {
    return isSuperAdmin || hasRole(['CLUB_OWNER', 'TREASURER']);
  }, [isSuperAdmin, hasRole]);

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const refreshSession = useCallback(async () => {
    await update();
  }, [update]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    user,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    error: null,

    // Role checks
    hasRole,
    hasMinimumRole,
    hasClubRole,
    hasMinimumClubRole,

    // Category checks
    isAdmin,
    isSuperAdmin,
    isManagement,
    isCoach,
    isStaff,
    isPlayer,
    isGuardian,
    isReferee,
    isScout,
    isFan,

    // Account checks
    isPro,
    isPremium,
    isEnterprise,
    isVerified,

    // Club membership checks
    isMemberOfClub,
    isClubAdmin,
    isClubCoach,
    isClubMedical,
    getClubMembership,
    getPrimaryClub,
    getClubsWithRole,

    // Permission checks
    canManageUsers,
    canManageClubs,
    canManageMatches,
    canManageTeams,
    canManagePlayers,
    canViewAnalytics,
    canExportData,
    canAccessMedicalRecords,
    canManageBilling,

    // Actions
    signIn,
    signOut,
    refreshSession,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get display name for a user role
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    SUPERADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    PLAYER: 'Player',
    PLAYER_PRO: 'Pro Player',
    COACH: 'Coach',
    COACH_PRO: 'Pro Coach',
    MANAGER: 'Manager',
    CLUB_MANAGER: 'Club Manager',
    CLUB_OWNER: 'Club Owner',
    TREASURER: 'Treasurer',
    REFEREE: 'Referee',
    SCOUT: 'Scout',
    ANALYST: 'Analyst',
    PARENT: 'Parent',
    GUARDIAN: 'Guardian',
    LEAGUE_ADMIN: 'League Admin',
    MEDICAL_STAFF: 'Medical Staff',
    MEDIA_MANAGER: 'Media Manager',
    FAN: 'Fan',
  };
  return names[role] || role;
}

/**
 * Get display name for a club member role
 */
export function getClubRoleDisplayName(role: ClubMemberRole): string {
  const names: Record<ClubMemberRole, string> = {
    OWNER: 'Owner',
    MANAGER: 'Manager',
    HEAD_COACH: 'Head Coach',
    ASSISTANT_COACH: 'Assistant Coach',
    PLAYER: 'Player',
    STAFF: 'Staff',
    TREASURER: 'Treasurer',
    SCOUT: 'Scout',
    ANALYST: 'Analyst',
    MEDICAL_STAFF: 'Medical Staff',
    PHYSIOTHERAPIST: 'Physiotherapist',
    NUTRITIONIST: 'Nutritionist',
    PSYCHOLOGIST: 'Psychologist',
    PERFORMANCE_COACH: 'Performance Coach',
    GOALKEEPING_COACH: 'Goalkeeping Coach',
    KIT_MANAGER: 'Kit Manager',
    MEDIA_OFFICER: 'Media Officer',
    VIDEO_ANALYST: 'Video Analyst',
  };
  return names[role] || role;
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  if (ADMIN_ROLES.includes(role)) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (MANAGEMENT_ROLES.includes(role)) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  if (COACHING_ROLES.includes(role)) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (STAFF_ROLES.includes(role)) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (PLAYER_ROLES.includes(role)) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200';
}

/**
 * Check if role is valid
 */
export function isValidUserRole(value: unknown): value is UserRole {
  return UserRoleEnum.safeParse(value).success;
}

/**
 * Check if club role is valid
 */
export function isValidClubRole(value: unknown): value is ClubMemberRole {
  return ClubMemberRoleEnum.safeParse(value).success;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useAuth;
