/**
 * 🌟 PITCHCONNECT - Enhanced Auth Helpers Module
 * Path: /lib/auth-helpers.ts
 *
 * ============================================================================
 * CORE FEATURES
 * ============================================================================
 * ✅ NextAuth v5 integration (replacing old auth system)
 * ✅ Server Component & Server Action support
 * ✅ Password hashing with bcryptjs (legacy support)
 * ✅ User retrieval with complete role & relation data
 * ✅ Advanced role management and permission checking
 * ✅ User display formatting and utilities
 * ✅ Dashboard routing by role
 * ✅ Full TypeScript support with strict typing
 * ✅ Error handling and logging
 * ✅ Performance optimized queries
 *
 * ============================================================================
 * SCHEMA ALIGNMENT
 * ============================================================================
 * Models: User, Player, Coach, Club, League, Subscription, UserPreferences
 * Roles: SUPERADMIN, LEAGUE_ADMIN, CLUB_MANAGER, CLUB_OWNER, COACH, 
 *        PLAYER, PLAYER_PRO, PARENT, REFEREE, TREASURER, SCOUT, ANALYST
 *
 * ============================================================================
 * MIGRATION NOTE
 * ============================================================================
 * This replaces the old next-auth v4 implementation
 * Works seamlessly with the new NextAuth v5 configuration in /auth.ts
 * Supports both legacy password-based and new OAuth flows
 */

import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcryptjs';
import { redirect } from 'next/navigation';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const HASH_ROUNDS = 12;

const ROLE_PRIORITY = [
  'SUPERADMIN',
  'LEAGUE_ADMIN',
  'CLUB_MANAGER',
  'CLUB_OWNER',
  'COACH',
  'PLAYER_PRO',
  'PLAYER',
  'PARENT',
  'REFEREE',
  'TREASURER',
  'SCOUT',
  'ANALYST',
] as const;

const ERROR_MESSAGES = {
  hashFailed: 'Password hashing failed',
  verifyFailed: 'Password verification failed',
  userNotFound: 'User not found',
  roleCheckFailed: 'Role checking failed',
  unauthorized: 'Unauthorized: Authentication required',
  forbidden: 'Forbidden: Insufficient permissions',
  invalidInput: 'Invalid input provided',
} as const;

// Define proper TypeScript types
export type UserRole = typeof ROLE_PRIORITY[number];

export interface UserWithRoles {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
  roles: UserRole[];
  isSuperAdmin: boolean;
  emailVerified: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  playerProfile?: {
    id: string;
    position?: string;
    preferredFoot?: string;
    height?: number;
    weight?: number;
    dateOfBirth?: Date;
    shirtNumber?: number;
    nationality?: string;
    photo?: string;
  } | null;
  coachProfile?: {
    id: string;
    coachType?: string;
    yearsExperience?: number;
    qualifications?: string[];
    specializations?: string[];
    certifications?: string[];
  } | null;
  subscription?: {
    id: string;
    tier: string;
    status: string;
    currentPeriodEnd?: Date;
  } | null;
  preferences?: {
    id: string;
    theme: string;
    language: string;
    timezone: string;
    notificationsEmail: boolean;
  } | null;
}

// ============================================================================
// PRISMA CLIENT (Singleton)
// ============================================================================

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ============================================================================
// NEXTAUTH V5 SESSION HELPERS (Server Components & Actions)
// ============================================================================

/**
 * 🔐 Get current authenticated user from NextAuth v5 session
 * Safe to use in Server Components and Server Actions
 *
 * @returns User object or null if not authenticated
 * @throws Never throws - returns null on failure
 *
 * @example
 * // Server Component
 * const user = await getCurrentUser();
 * if (!user) return <SignInButton />;
 */
export async function getCurrentUser() {
  try {
    const session = await auth();
    return session?.user || null;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
}

/**
 * 🔐 Get current session from NextAuth v5
 * Safe to use in Server Components and Server Actions
 *
 * @returns Full session object or null
 *
 * @example
 * const session = await getCurrentSession();
 * const accessToken = session?.accessToken;
 */
export async function getCurrentSession() {
  try {
    const session = await auth();
    return session || null;
  } catch (error) {
    console.error('❌ Error getting session:', error);
    return null;
  }
}

/**
 * 🔐 Check if user is currently authenticated
 *
 * @returns True if authenticated, false otherwise
 *
 * @example
 * if (await isAuthenticated()) {
 *   // Show protected content
 * }
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * 🔐 Require authentication - redirect if not authenticated
 * Ideal for Server Components that need auth
 *
 * @throws Redirects to /auth/login if not authenticated
 * @returns User object (guaranteed)
 *
 * @example
 * // Server Component
 * const user = await requireAuth();
 * // User is guaranteed to exist here
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}

/**
 * 🔐 Throw-on-fail version for Server Actions
 * Use this when you need to throw instead of redirect
 *
 * @throws Error if not authenticated
 * @returns User object (guaranteed)
 *
 * @example
 * // Server Action
 * 'use server';
 * export async function myAction() {
 *   const user = await requireAuthThrow();
 *   // User guaranteed here
 * }
 */
export async function requireAuthThrow() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error(ERROR_MESSAGES.unauthorized);
  }
  return user;
}

// ============================================================================
// ROLE CHECKING (NextAuth v5 Session-based)
// ============================================================================

/**
 * ✅ Check if current user has a specific role
 * Safe for Server Components and Server Actions
 *
 * @param requiredRole - Role to check for
 * @returns True if user has role, false otherwise
 *
 * @example
 * if (await hasRole('ADMIN')) {
 *   // Show admin content
 * }
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user?.roles) return false;
    return user.roles.includes(requiredRole);
  } catch (error) {
    console.error('❌ Error checking role:', error);
    return false;
  }
}

/**
 * ✅ Check if current user has ANY of the specified roles
 *
 * @param requiredRoles - Array of roles to check for
 * @returns True if user has at least one role
 *
 * @example
 * if (await hasAnyRole(['COACH', 'MANAGER'])) {
 *   // Show coach/manager content
 * }
 */
export async function hasAnyRole(requiredRoles: UserRole[]): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user?.roles || requiredRoles.length === 0) return false;
    return requiredRoles.some((role) => user.roles.includes(role));
  } catch (error) {
    console.error('❌ Error checking any role:', error);
    return false;
  }
}

/**
 * ✅ Check if current user has ALL of the specified roles
 *
 * @param requiredRoles - Array of roles all must exist
 * @returns True if user has all roles
 *
 * @example
 * if (await hasAllRoles(['COACH', 'SUPERADMIN'])) {
 *   // User is both coach AND superadmin
 * }
 */
export async function hasAllRoles(requiredRoles: UserRole[]): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user?.roles || requiredRoles.length === 0) return false;
    return requiredRoles.every((role) => user.roles.includes(role));
  } catch (error) {
    console.error('❌ Error checking all roles:', error);
    return false;
  }
}

/**
 * 🛡️ Require a specific role - throws error if not authorized
 * Use in Server Actions for strict access control
 *
 * @param requiredRole - Role required
 * @throws Error if user lacks role
 * @returns User object (guaranteed)
 *
 * @example
 * 'use server';
 * export async function adminOnly() {
 *   const user = await requireRole('SUPERADMIN');
 *   // User guaranteed to be SUPERADMIN here
 * }
 */
export async function requireRole(requiredRole: UserRole) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error(ERROR_MESSAGES.unauthorized);
  }
  if (!user.roles?.includes(requiredRole)) {
    throw new Error(`${ERROR_MESSAGES.forbidden} - Role '${requiredRole}' required`);
  }
  return user;
}

/**
 * 🛡️ Require ANY of the specified roles
 *
 * @param requiredRoles - Roles required (any one)
 * @throws Error if user lacks all roles
 * @returns User object (guaranteed)
 */
export async function requireAnyRole(requiredRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error(ERROR_MESSAGES.unauthorized);
  }
  if (!requiredRoles.some((role) => user.roles?.includes(role))) {
    throw new Error(`${ERROR_MESSAGES.forbidden} - One of [${requiredRoles.join(', ')}] required`);
  }
  return user;
}

/**
 * 🛡️ Require ALL of the specified roles
 *
 * @param requiredRoles - Roles all required
 * @throws Error if user lacks any role
 * @returns User object (guaranteed)
 */
export async function requireAllRoles(requiredRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error(ERROR_MESSAGES.unauthorized);
  }
  if (!requiredRoles.every((role) => user.roles?.includes(role))) {
    throw new Error(`${ERROR_MESSAGES.forbidden} - All of [${requiredRoles.join(', ')}] required`);
  }
  return user;
}

// ============================================================================
// REDIRECT HELPERS (Server Components)
// ============================================================================

/**
 * 🔄 Redirect if not authenticated
 * Use in Server Components
 *
 * @throws Redirects to /auth/login if not authenticated
 *
 * @example
 * export default async function ProtectedPage() {
 *   await redirectIfUnauthenticated();
 *   // If we reach here, user is authenticated
 * }
 */
export async function redirectIfUnauthenticated(): Promise<void> {
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    redirect('/auth/login');
  }
}

/**
 * 🔄 Redirect if user lacks a specific role
 *
 * @param requiredRole - Role required
 * @param redirectPath - Where to redirect (default: /dashboard)
 *
 * @example
 * export default async function AdminPage() {
 *   await redirectIfNoRole('SUPERADMIN', '/unauthorized');
 *   // Safe to render admin content
 * }
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
 * 🔄 Redirect if user lacks ANY of the required roles
 *
 * @param requiredRoles - Roles to check
 * @param redirectPath - Where to redirect
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
// LEGACY PASSWORD UTILITIES (For database migration period)
// ============================================================================

/**
 * 🔐 Hash password using bcryptjs
 * Only needed for legacy password-based auth during migration
 * New OAuth flows don't need this
 *
 * @param password - Plain text password
 * @returns Hashed password
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error(ERROR_MESSAGES.invalidInput);
    }
    const hashedPassword = await hash(password, HASH_ROUNDS);
    console.log('✅ Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    console.error('❌ Password hashing failed:', error);
    throw new Error(ERROR_MESSAGES.hashFailed);
  }
}

/**
 * 🔐 Verify password against hash
 * Only needed for legacy password-based auth
 *
 * @param password - Plain text password to verify
 * @param hashed - Hashed password to compare
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  try {
    if (!password || !hashed) {
      throw new Error(ERROR_MESSAGES.invalidInput);
    }
    const isValid = await compare(password, hashed);
    return isValid;
  } catch (error) {
    console.error('❌ Password verification failed:', error);
    throw new Error(ERROR_MESSAGES.verifyFailed);
  }
}

// ============================================================================
// USER QUERIES (Database access)
// ============================================================================

/**
 * 📊 Get user by email with all roles and relations
 * Used during login or user lookups
 *
 * @param email - User email address
 * @returns Full user object with relations, or null if not found
 */
export async function getUserWithRole(email: string): Promise<UserWithRoles | null> {
  try {
    if (!email || typeof email !== 'string') {
      throw new Error(ERROR_MESSAGES.invalidInput);
    }

    const user = await prisma.user.findUnique({
      where: { email },
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

        // Player profile
        playerProfile: {
          select: {
            id: true,
            position: true,
            preferredFoot: true,
            height: true,
            weight: true,
            dateOfBirth: true,
            shirtNumber: true,
            nationality: true,
            photo: true,
          },
        },

        // Coach profile
        coachProfile: {
          select: {
            id: true,
            coachType: true,
            yearsExperience: true,
            qualifications: true,
            specializations: true,
            certifications: true,
          },
        },

        // Subscription
        subscription: {
          select: {
            id: true,
            tier: true,
            status: true,
            currentPeriodEnd: true,
          },
        },

        // Preferences
        preferences: {
          select: {
            theme: true,
            language: true,
            timezone: true,
            notificationsEmail: true,
          },
        },
      },
    });

    if (user) {
      console.log('✅ User fetched with roles:', user.id);
    } else {
      console.log('⚠️ User not found:', email);
    }

    return user as UserWithRoles | null;
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    return null;
  }
}

/**
 * 📊 Get user by ID with all relations
 *
 * @param userId - User ID
 * @returns Full user object or null if not found
 */
export async function getUserByIdWithRole(userId: string): Promise<UserWithRoles | null> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error(ERROR_MESSAGES.invalidInput);
    }

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
    console.error('❌ Error fetching user by ID:', error);
    return null;
  }
}

/**
 * 📊 Check if user exists by email
 *
 * @param email - User email
 * @returns True if user exists
 */
export async function userExists(email: string): Promise<boolean> {
  try {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!user;
  } catch (error) {
    console.error('❌ Error checking user existence:', error);
    return false;
  }
}

// ============================================================================
// ROLE UTILITIES (Non-async, for use anywhere)
// ============================================================================

/**
 * 🎯 Get user's primary role from role array
 *
 * @param roles - Array of user roles
 * @returns Highest priority role
 *
 * @example
 * const primaryRole = getPrimaryRole(['COACH', 'PLAYER']);
 * // Returns 'COACH' (higher priority than PLAYER)
 */
export function getPrimaryRole(roles: UserRole[] | undefined): UserRole {
  try {
    if (!roles || roles.length === 0) {
      return 'PLAYER';
    }

    for (const role of ROLE_PRIORITY) {
      if (roles.includes(role)) {
        console.log('✅ Primary role determined:', role);
        return role as UserRole;
      }
    }

    console.log('⚠️ Using fallback role:', roles[0]);
    return roles[0];
  } catch (error) {
    console.error('❌ Error determining primary role:', error);
    return 'PLAYER';
  }
}

/**
 * ✅ Check if roles array includes a specific role (synchronous)
 *
 * @param roles - Array of user roles
 * @param requiredRole - Role to check
 * @returns True if role exists
 */
export function hasRoleSync(
  roles: UserRole[] | undefined,
  requiredRole: UserRole
): boolean {
  try {
    if (!roles || !Array.isArray(roles)) {
      return false;
    }
    return roles.includes(requiredRole);
  } catch (error) {
    console.error('❌ Error checking role:', error);
    return false;
  }
}

/**
 * ✅ Check if roles include ANY of the specified roles (synchronous)
 *
 * @param roles - User roles
 * @param requiredRoles - Roles to check
 * @returns True if any role matches
 */
export function hasAnyRoleSync(
  roles: UserRole[] | undefined,
  requiredRoles: UserRole[]
): boolean {
  try {
    if (!roles || !Array.isArray(roles) || requiredRoles.length === 0) {
      return false;
    }
    return requiredRoles.some((role) => roles.includes(role));
  } catch (error) {
    console.error('❌ Error checking any role:', error);
    return false;
  }
}

/**
 * ✅ Check if roles include ALL of the specified roles (synchronous)
 *
 * @param roles - User roles
 * @param requiredRoles - Roles to check
 * @returns True if all roles match
 */
export function hasAllRolesSync(
  roles: UserRole[] | undefined,
  requiredRoles: UserRole[]
): boolean {
  try {
    if (!roles || !Array.isArray(roles) || requiredRoles.length === 0) {
      return false;
    }
    return requiredRoles.every((role) => roles.includes(role));
  } catch (error) {
    console.error('❌ Error checking all roles:', error);
    return false;
  }
}

/**
 * 🎖️ Check if user is SuperAdmin
 *
 * @param isSuperAdmin - SuperAdmin flag
 * @returns True if SuperAdmin
 */
export function isSuperAdmin(isSuperAdmin: boolean | undefined): boolean {
  return isSuperAdmin === true;
}

/**
 * 🎯 Get all accessible roles for user (for role switcher UI)
 *
 * @param roles - User roles
 * @param isSuperAdmin - SuperAdmin status
 * @returns Array of accessible roles
 */
export function getAccessibleRoles(
  roles: UserRole[] | undefined,
  isSuperAdmin: boolean | undefined
): UserRole[] {
  const accessible: UserRole[] = ['PLAYER'];

  if (isSuperAdmin) {
    accessible.push('SUPERADMIN');
  }

  if (roles && Array.isArray(roles)) {
    roles.forEach((role) => {
      if (!accessible.includes(role)) {
        accessible.push(role);
      }
    });
  }

  return accessible;
}

/**
 * 🗺️ Get dashboard route based on primary role
 *
 * @param role - Primary role
 * @returns Dashboard route path
 */
export function getRoleDashboardRoute(role: UserRole | string): string {
  const routeMap: Record<string, string> = {
    SUPERADMIN: '/dashboard/superadmin',
    LEAGUE_ADMIN: '/dashboard/league-admin',
    CLUB_MANAGER: '/dashboard/club-manager',
    CLUB_OWNER: '/dashboard/club-owner',
    COACH: '/dashboard/coach',
    PLAYER: '/dashboard/player',
    PLAYER_PRO: '/dashboard/player-pro',
    PARENT: '/dashboard/parent',
    REFEREE: '/dashboard/referee',
    TREASURER: '/dashboard/treasurer',
    SCOUT: '/dashboard/scout',
    ANALYST: '/dashboard/analyst',
  };

  return routeMap[role as string] || '/dashboard/player';
}

// ============================================================================
// STRING & DISPLAY UTILITIES
// ============================================================================

/**
 * 📝 Capitalize first letter of string
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  try {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  } catch (error) {
    console.error('❌ Error capitalizing string:', error);
    return str;
  }
}

/**
 * 👤 Get user display name
 *
 * @param user - User object
 * @returns Full name (e.g., "John Doe")
 */
export function getUserDisplayName(user: {
  firstName?: string;
  lastName?: string;
} | null): string {
  try {
    if (!user || !user.firstName || !user.lastName) {
      return 'Unknown User';
    }
    return `${user.firstName.trim()} ${user.lastName.trim()}`.trim();
  } catch (error) {
    console.error('❌ Error getting display name:', error);
    return 'Unknown User';
  }
}

/**
 * 👤 Get user initials (for avatars)
 *
 * @param user - User object
 * @returns Initials (e.g., "JD")
 */
export function getUserInitials(user: {
  firstName?: string;
  lastName?: string;
} | null): string {
  try {
    if (!user || !user.firstName || !user.lastName) {
      return 'U';
    }
    return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
  } catch (error) {
    console.error('❌ Error getting initials:', error);
    return 'U';
  }
}

/**
 * 🏷️ Format role string for display
 *
 * @param role - Role (e.g., "CLUB_MANAGER")
 * @returns Display string (e.g., "Club Manager")
 */
export function formatRole(role: string): string {
  try {
    if (!role || typeof role !== 'string') {
      return '';
    }
    return role
      .split('_')
      .map((word) => capitalize(word))
      .join(' ');
  } catch (error) {
    console.error('❌ Error formatting role:', error);
    return role;
  }
}

/**
 * 🎨 Get Tailwind color classes for role badge
 *
 * @param role - Role string
 * @returns Object with bg and text Tailwind classes
 */
export function getRoleColor(
  role: string
): { bg: string; text: string; icon: string } {
  const colorMap: Record<
    string,
    { bg: string; text: string; icon: string }
  > = {
    SUPERADMIN: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      icon: '⭐',
    },
    LEAGUE_ADMIN: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      icon: '🏛️',
    },
    CLUB_MANAGER: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-400',
      icon: '⚙️',
    },
    CLUB_OWNER: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-700 dark:text-indigo-400',
      icon: '👑',
    },
    COACH: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      icon: '🎯',
    },
    PLAYER: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: '⚽',
    },
    PLAYER_PRO: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-400',
      icon: '🏆',
    },
    PARENT: {
      bg: 'bg-pink-100 dark:bg-pink-900/30',
      text: 'text-pink-700 dark:text-pink-400',
      icon: '👨‍👧',
    },
    REFEREE: {
      bg: 'bg-slate-100 dark:bg-slate-900/30',
      text: 'text-slate-700 dark:text-slate-400',
      icon: '🏁',
    },
    TREASURER: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-700 dark:text-cyan-400',
      icon: '💰',
    },
    SCOUT: {
      bg: 'bg-teal-100 dark:bg-teal-900/30',
      text: 'text-teal-700 dark:text-teal-400',
      icon: '🔍',
    },
    ANALYST: {
      bg: 'bg-violet-100 dark:bg-violet-900/30',
      text: 'text-violet-700 dark:text-violet-400',
      icon: '📊',
    },
  };

  return (
    colorMap[role] || {
      bg: 'bg-gray-100 dark:bg-gray-900/30',
      text: 'text-gray-700 dark:text-gray-400',
      icon: '❓',
    }
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { prisma };
export type { UserRole, UserWithRoles };
