/**
 * ============================================================================
 * 🔐 PITCHCONNECT - AUTH HELPERS v2.0
 * ============================================================================
 * Path: /src/lib/auth-helpers.ts
 *
 * Authentication and authorization utilities for Server Components & Actions
 *
 * Features:
 * ✅ Uses centralized Prisma client (Prisma 7 compatible)
 * ✅ NextAuth v4/v5 session integration
 * ✅ Role-based access control (RBAC)
 * ✅ Permission checking
 * ✅ Password utilities (bcryptjs)
 * ✅ User display helpers
 * ✅ Full TypeScript support
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { hash, compare } from 'bcryptjs';

// ============================================================================
// ✅ IMPORT CENTRALIZED PRISMA CLIENT (NOT new PrismaClient())
// ============================================================================
import { prisma } from '@/lib/prisma';

// Re-export for convenience
export { prisma };

// ============================================================================
// 🔧 CONSTANTS
// ============================================================================

const HASH_ROUNDS = 12;

/** Role priority (highest to lowest privilege) */
const ROLE_PRIORITY = [
  'SUPERADMIN',
  'ADMIN',
  'CLUB_OWNER',
  'LEAGUE_ADMIN',
  'MANAGER',
  'COACH',
  'ANALYST',
  'SCOUT',
  'REFEREE',
  'PLAYER_PRO',
  'PLAYER',
  'GUARDIAN',
  'PARENT',
  'FAN',
] as const;

const ERROR_MESSAGES = {
  unauthorized: 'Unauthorized: Authentication required',
  forbidden: 'Forbidden: Insufficient permissions',
  invalidInput: 'Invalid input provided',
  hashFailed: 'Password hashing failed',
  verifyFailed: 'Password verification failed',
  userNotFound: 'User not found',
} as const;

// ============================================================================
// 🏷️ TYPE DEFINITIONS
// ============================================================================

export type UserRole = (typeof ROLE_PRIORITY)[number];

export type UserStatus =
  | 'ACTIVE'
  | 'PENDING_EMAIL_VERIFICATION'
  | 'PENDING_APPROVAL'
  | 'SUSPENDED'
  | 'BANNED'
  | 'INACTIVE'
  | 'ARCHIVED';

export type PermissionName =
  | 'system:admin'
  | 'users:read' | 'users:write' | 'users:delete'
  | 'clubs:read' | 'clubs:write' | 'clubs:delete'
  | 'teams:read' | 'teams:write' | 'teams:delete'
  | 'players:read' | 'players:write' | 'players:delete'
  | 'matches:read' | 'matches:write' | 'matches:delete'
  | 'analytics:read' | 'analytics:export'
  | 'payments:read' | 'payments:write'
  | 'audit:read'
  | 'settings:read' | 'settings:write';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: UserRole;
  roles: UserRole[];
  permissions: PermissionName[];
  status: UserStatus;
  clubId?: string | null;
  teamId?: string | null;
  emailVerified?: Date | null;
}

export interface UserWithRoles {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  avatar?: string | null;
  roles: UserRole[];
  isSuperAdmin: boolean;
  emailVerified: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  clubId?: string | null;
  teamId?: string | null;
  playerProfile?: {
    id: string;
    position?: string | null;
    preferredFoot?: string | null;
    height?: number | null;
    weight?: number | null;
    shirtNumber?: number | null;
  } | null;
  coachProfile?: {
    id: string;
    coachType?: string | null;
    yearsExperience?: number | null;
  } | null;
  subscription?: {
    tier: string;
    status: string;
  } | null;
}

// ============================================================================
// 🔐 SESSION HELPERS
// ============================================================================

/**
 * Get current authenticated user from session
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user || null;
  } catch (error) {
    console.error('[AUTH] Error getting current user:', error);
    return null;
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('[AUTH] Error getting session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Require authentication - redirect if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }
  return user;
}

/**
 * Require authentication - throw if not authenticated (for Server Actions)
 */
export async function requireAuthThrow(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error(ERROR_MESSAGES.unauthorized);
  }
  return user;
}

// ============================================================================
// 🛡️ ROLE CHECKING
// ============================================================================

/**
 * Check if current user has a specific role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.roles?.includes(requiredRole) || false;
  } catch {
    return false;
  }
}

/**
 * Check if current user has ANY of the specified roles
 */
export async function hasAnyRole(requiredRoles: UserRole[]): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user?.roles || requiredRoles.length === 0) return false;
    return requiredRoles.some((role) => user.roles.includes(role));
  } catch {
    return false;
  }
}

/**
 * Check if current user has ALL of the specified roles
 */
export async function hasAllRoles(requiredRoles: UserRole[]): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user?.roles || requiredRoles.length === 0) return false;
    return requiredRoles.every((role) => user.roles.includes(role));
  } catch {
    return false;
  }
}

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(permission: PermissionName): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  } catch {
    return false;
  }
}

/**
 * Require a specific role - throws if not authorized
 */
export async function requireRole(requiredRole: UserRole): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error(ERROR_MESSAGES.unauthorized);
  if (!user.roles?.includes(requiredRole)) {
    throw new Error(`${ERROR_MESSAGES.forbidden} - Role '${requiredRole}' required`);
  }
  return user;
}

/**
 * Require ANY of the specified roles
 */
export async function requireAnyRole(requiredRoles: UserRole[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error(ERROR_MESSAGES.unauthorized);
  if (!requiredRoles.some((role) => user.roles?.includes(role))) {
    throw new Error(`${ERROR_MESSAGES.forbidden} - One of [${requiredRoles.join(', ')}] required`);
  }
  return user;
}

/**
 * Require a specific permission
 */
export async function requirePermission(permission: PermissionName): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error(ERROR_MESSAGES.unauthorized);
  if (!user.permissions?.includes(permission)) {
    throw new Error(`${ERROR_MESSAGES.forbidden} - Permission '${permission}' required`);
  }
  return user;
}

// ============================================================================
// 🔄 REDIRECT HELPERS
// ============================================================================

/**
 * Redirect if not authenticated
 */
export async function redirectIfUnauthenticated(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect('/auth/signin');
  }
}

/**
 * Redirect if user lacks a specific role
 */
export async function redirectIfNoRole(
  requiredRole: UserRole,
  redirectPath: string = '/dashboard'
): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.roles?.includes(requiredRole)) {
    redirect(redirectPath);
  }
}

/**
 * Redirect if user lacks ANY of the required roles
 */
export async function redirectIfNoAnyRole(
  requiredRoles: UserRole[],
  redirectPath: string = '/dashboard'
): Promise<void> {
  const user = await getCurrentUser();
  if (!requiredRoles.some((role) => user?.roles?.includes(role))) {
    redirect(redirectPath);
  }
}

// ============================================================================
// 🔐 PASSWORD UTILITIES
// ============================================================================

/**
 * Hash password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error(ERROR_MESSAGES.invalidInput);
  }
  return hash(password, HASH_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  if (!password || !hashed) {
    throw new Error(ERROR_MESSAGES.invalidInput);
  }
  return compare(password, hashed);
}

// ============================================================================
// 📊 USER QUERIES
// ============================================================================

/**
 * Get user by email with roles and relations
 */
export async function getUserWithRole(email: string): Promise<UserWithRoles | null> {
  if (!email) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatar: true,
        roles: true,
        isSuperAdmin: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        clubId: true,
        teamId: true,
        playerProfile: {
          select: {
            id: true,
            position: true,
            preferredFoot: true,
            height: true,
            weight: true,
            shirtNumber: true,
          },
        },
        coachProfile: {
          select: {
            id: true,
            coachType: true,
            yearsExperience: true,
          },
        },
        subscription: {
          select: {
            tier: true,
            status: true,
          },
        },
      },
    });

    return user as UserWithRoles | null;
  } catch (error) {
    console.error('[AUTH] Error fetching user:', error);
    return null;
  }
}

/**
 * Get user by ID with relations
 */
export async function getUserByIdWithRole(userId: string): Promise<UserWithRoles | null> {
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatar: true,
        roles: true,
        isSuperAdmin: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        clubId: true,
        teamId: true,
        playerProfile: {
          select: {
            id: true,
            position: true,
            preferredFoot: true,
            height: true,
            weight: true,
            shirtNumber: true,
          },
        },
        coachProfile: {
          select: {
            id: true,
            coachType: true,
            yearsExperience: true,
          },
        },
      },
    });

    return user as UserWithRoles | null;
  } catch (error) {
    console.error('[AUTH] Error fetching user by ID:', error);
    return null;
  }
}

/**
 * Check if user exists by email
 */
export async function userExists(email: string): Promise<boolean> {
  if (!email) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });
    return !!user;
  } catch {
    return false;
  }
}

// ============================================================================
// 🎯 ROLE UTILITIES (Synchronous)
// ============================================================================

/**
 * Get primary role from role array (highest privilege)
 */
export function getPrimaryRole(roles: UserRole[] | undefined): UserRole {
  if (!roles || roles.length === 0) return 'PLAYER';

  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }

  return roles[0] || 'PLAYER';
}

/**
 * Check if roles array includes a specific role (sync)
 */
export function hasRoleSync(roles: UserRole[] | undefined, requiredRole: UserRole): boolean {
  return roles?.includes(requiredRole) || false;
}

/**
 * Check if roles include ANY of the specified roles (sync)
 */
export function hasAnyRoleSync(roles: UserRole[] | undefined, requiredRoles: UserRole[]): boolean {
  if (!roles || requiredRoles.length === 0) return false;
  return requiredRoles.some((role) => roles.includes(role));
}

/**
 * Check if roles include ALL of the specified roles (sync)
 */
export function hasAllRolesSync(roles: UserRole[] | undefined, requiredRoles: UserRole[]): boolean {
  if (!roles || requiredRoles.length === 0) return false;
  return requiredRoles.every((role) => roles.includes(role));
}

/**
 * Check if user is SuperAdmin
 */
export function isSuperAdmin(flag: boolean | undefined): boolean {
  return flag === true;
}

/**
 * Get accessible roles for user (for role switcher UI)
 */
export function getAccessibleRoles(roles: UserRole[] | undefined, isSuperAdminFlag: boolean | undefined): UserRole[] {
  const accessible: UserRole[] = ['PLAYER'];

  if (isSuperAdminFlag) accessible.push('SUPERADMIN');
  
  roles?.forEach((role) => {
    if (!accessible.includes(role)) accessible.push(role);
  });

  return accessible;
}

// ============================================================================
// 🗺️ ROUTING HELPERS
// ============================================================================

/**
 * Get dashboard route based on primary role
 */
export function getRoleDashboardRoute(role: UserRole | string): string {
  const routeMap: Record<string, string> = {
    SUPERADMIN: '/dashboard/admin',
    ADMIN: '/dashboard/admin',
    CLUB_OWNER: '/dashboard/club',
    LEAGUE_ADMIN: '/dashboard/league',
    MANAGER: '/dashboard/team',
    COACH: '/dashboard/coach',
    ANALYST: '/dashboard/analytics',
    SCOUT: '/dashboard/scouting',
    REFEREE: '/dashboard/referee',
    PLAYER_PRO: '/dashboard/player',
    PLAYER: '/dashboard/player',
    GUARDIAN: '/dashboard/family',
    PARENT: '/dashboard/family',
    FAN: '/dashboard',
  };

  return routeMap[role] || '/dashboard';
}

// ============================================================================
// 📝 DISPLAY UTILITIES
// ============================================================================

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: { firstName?: string; lastName?: string } | null): string {
  if (!user) return 'Unknown User';
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Unknown User';
}

/**
 * Get user initials (for avatars)
 */
export function getUserInitials(user: { firstName?: string; lastName?: string } | null): string {
  if (!user) return 'U';
  const first = user.firstName?.charAt(0) || '';
  const last = user.lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || 'U';
}

/**
 * Format role for display
 */
export function formatRole(role: string): string {
  if (!role) return '';
  return role.split('_').map(capitalize).join(' ');
}

/**
 * Get role badge colors
 */
export function getRoleColor(role: string): { bg: string; text: string; icon: string } {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    SUPERADMIN: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: '⭐' },
    ADMIN: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', icon: '🛡️' },
    CLUB_OWNER: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', icon: '👑' },
    LEAGUE_ADMIN: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: '🏛️' },
    MANAGER: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: '⚙️' },
    COACH: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: '🎯' },
    ANALYST: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', icon: '📊' },
    SCOUT: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', icon: '🔍' },
    REFEREE: { bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-700 dark:text-slate-400', icon: '🏁' },
    PLAYER_PRO: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: '🏆' },
    PLAYER: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: '⚽' },
    GUARDIAN: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', icon: '🛡️' },
    PARENT: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', icon: '👨‍👧' },
    FAN: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', icon: '👏' },
  };

  return colorMap[role] || { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', icon: '❓' };
}