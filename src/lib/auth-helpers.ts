/**
 * Auth Helpers Module
 * Path: /src/lib/auth-helpers.ts
 * 
 * Core Features:
 * - Password hashing and verification with bcryptjs
 * - User retrieval with roles and related data
 * - Role management and checking utilities
 * - User display name formatting
 * - String manipulation utilities
 * 
 * Schema Aligned: Uses Prisma User, Player, Coach, Club, League models
 * Authentication: Handles password security and role-based access
 * 
 * Business Logic:
 * - Hash passwords securely for storage
 * - Verify passwords during authentication
 * - Fetch user with complete role and relation data
 * - Determine primary role from role array
 * - Check user permissions based on roles
 */

import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcryptjs';

// ============================================================================
// CONSTANTS
// ============================================================================

const HASH_ROUNDS = 12;

const ROLE_PRIORITY = [
  'SUPERADMIN',
  'LEAGUE_ADMIN',
  'CLUB_MANAGER',
  'CLUB_OWNER',
  'COACH',
  'PLAYER',
  'PLAYER_PRO',
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
};

// ============================================================================
// PRISMA CLIENT
// ============================================================================

const prisma = new PrismaClient();

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

/**
 * Hash a password using bcryptjs
 * 
 * @param password - Plain text password to hash
 * @returns Hashed password
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await hash(password, HASH_ROUNDS);
    console.log('✅ Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    console.error('❌ Password hashing failed:', error);
    throw new Error(ERROR_MESSAGES.hashFailed);
  }
}

/**
 * Verify a password against a hash
 * 
 * @param password - Plain text password to verify
 * @param hashed - Hashed password to compare against
 * @returns True if password matches, false otherwise
 * @throws Error if verification fails
 */
export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  try {
    const isValid = await compare(password, hashed);
    return isValid;
  } catch (error) {
    console.error('❌ Password verification failed:', error);
    throw new Error(ERROR_MESSAGES.verifyFailed);
  }
}

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Get user by email with roles and related data
 * Includes player profile, coach profile, club/league admin data
 * 
 * @param email - User email address
 * @returns User object with relations, or null if not found
 */
export async function getUserWithRole(email: string) {
  try {
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
        password: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        
        // Player profile relation
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
        
        // Coach profile relation
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
        
        // Club Manager relation
        clubManager: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        
        // Club Owner relation
        clubOwner: {
          select: {
            id: true,
            canManageTeams: true,
            canManageTreasury: true,
            canViewAnalytics: true,
            canManageMembers: true,
          },
        },
        
        // League Admin relation
        leagueAdmin: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        
        // Referee relation
        refereeProfile: {
          select: {
            id: true,
            licenseNumber: true,
            licenseLevel: true,
            yearsOfExperience: true,
            specialization: true,
          },
        },
        
        // Scout relation
        scoutProfile: {
          select: {
            id: true,
            specialization: true,
            region: true,
            yearsExperience: true,
          },
        },
        
        // Analyst relation
        analyticsProfile: {
          select: {
            id: true,
            specialization: true,
            tools: true,
          },
        },
        
        // Treasurer relation
        treasurerProfile: {
          select: {
            id: true,
            clubId: true,
            canViewFinancials: true,
            canApprovePayments: true,
          },
        },
        
        // Subscription info
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

    return user;
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    throw new Error(ERROR_MESSAGES.userNotFound);
  }
}

/**
 * Get user by ID with roles and related data
 * 
 * @param userId - User ID
 * @returns User object with relations, or null if not found
 */
export async function getUserByIdWithRole(userId: string) {
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
        
        // Player profile
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
        
        // Coach profile
        coachProfile: {
          select: {
            id: true,
            coachType: true,
            yearsExperience: true,
          },
        },
        
        // Club Manager relation
        clubManager: {
          select: {
            id: true,
          },
        },
        
        // League Admin relation
        leagueAdmin: {
          select: {
            id: true,
          },
        },
        
        // Subscription
        subscription: {
          select: {
            tier: true,
            status: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error('❌ Error fetching user by ID:', error);
    throw new Error(`User with ID ${userId} not found`);
  }
}

/**
 * Check if user email exists
 * 
 * @param email - User email
 * @returns True if user exists
 */
export async function userExists(email: string): Promise<boolean> {
  try {
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
// ROLE UTILITIES
// ============================================================================

/**
 * Get user's primary role based on priority order
 * 
 * @param roles - Array of user roles
 * @returns Primary role string
 */
export function getPrimaryRole(roles: string[]): string {
  try {
    if (!roles || roles.length === 0) {
      return 'PLAYER';
    }

    for (const role of ROLE_PRIORITY) {
      if (roles.includes(role)) {
        console.log('✅ Primary role determined:', role);
        return role;
      }
    }

    // Fallback to first role if no priority match
    console.log('⚠️ Using fallback role:', roles[0]);
    return roles[0];
  } catch (error) {
    console.error('❌ Error determining primary role:', error);
    return 'PLAYER';
  }
}

/**
 * Check if user has a specific role
 * 
 * @param roles - Array of user roles
 * @param requiredRole - Role to check for
 * @returns True if user has the role
 */
export function hasRole(roles: string[] | undefined, requiredRole: string): boolean {
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
 * Check if user has any of the specified roles
 * 
 * @param roles - Array of user roles
 * @param requiredRoles - Array of roles to check for
 * @returns True if user has at least one of the required roles
 */
export function hasAnyRole(
  roles: string[] | undefined,
  requiredRoles: string[]
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
 * Check if user has all of the specified roles
 * 
 * @param roles - Array of user roles
 * @param requiredRoles - Array of roles to check for
 * @returns True if user has all of the required roles
 */
export function hasAllRoles(
  roles: string[] | undefined,
  requiredRoles: string[]
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
 * Check if user is a SuperAdmin
 * 
 * @param isSuperAdmin - SuperAdmin flag from user
 * @returns True if user is a SuperAdmin
 */
export function isSuperAdmin(isSuperAdmin: boolean | undefined): boolean {
  return isSuperAdmin === true;
}

/**
 * Get all accessible roles for a user (for role switching)
 * 
 * @param roles - Array of user roles
 * @param isSuperAdmin - SuperAdmin flag
 * @returns Array of accessible role keys
 */
export function getAccessibleRoles(
  roles: string[] | undefined,
  isSuperAdmin: boolean | undefined
): string[] {
  const accessible = ['PLAYER']; // Everyone can see player dashboard

  if (isSuperAdmin) {
    accessible.push('SUPERADMIN');
  }

  if (roles && Array.isArray(roles)) {
    const roleSet = new Set(roles);
    if (roleSet.has('LEAGUE_ADMIN')) accessible.push('LEAGUE_ADMIN');
    if (roleSet.has('CLUB_MANAGER')) accessible.push('CLUB_MANAGER');
    if (roleSet.has('CLUB_OWNER')) accessible.push('CLUB_OWNER');
    if (roleSet.has('COACH')) accessible.push('COACH');
    if (roleSet.has('REFEREE')) accessible.push('REFEREE');
    if (roleSet.has('SCOUT')) accessible.push('SCOUT');
    if (roleSet.has('TREASURER')) accessible.push('TREASURER');
  }

  return accessible;
}

/**
 * Get dashboard route for primary role
 * 
 * @param role - Primary role
 * @returns Dashboard route path
 */
export function getRoleDashboardRoute(role: string): string {
  const routeMap: Record<string, string> = {
    SUPERADMIN: '/dashboard/superadmin',
    LEAGUE_ADMIN: '/dashboard/league-admin',
    CLUB_MANAGER: '/dashboard/manager',
    CLUB_OWNER: '/dashboard/manager',
    COACH: '/dashboard/coach',
    PLAYER: '/dashboard/player',
    PLAYER_PRO: '/dashboard/player',
    REFEREE: '/dashboard/referee',
    SCOUT: '/dashboard/scout',
    TREASURER: '/dashboard/treasurer',
  };
  
  return routeMap[role] || '/dashboard/player';
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Capitalize first letter of a string
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
 * Get user display name from firstName and lastName
 * 
 * @param user - User object with firstName and lastName
 * @returns Full name string
 */
export function getUserDisplayName(user: {
  firstName: string;
  lastName: string;
}): string {
  try {
    if (!user || !user.firstName || !user.lastName) {
      return 'Unknown User';
    }
    return `${user.firstName.trim()} ${user.lastName.trim()}`;
  } catch (error) {
    console.error('❌ Error getting display name:', error);
    return 'Unknown User';
  }
}

/**
 * Get user initials from firstName and lastName
 * 
 * @param user - User object with firstName and lastName
 * @returns Initials (e.g., "JD" for John Doe)
 */
export function getUserInitials(user: {
  firstName: string;
  lastName: string;
}): string {
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
 * Format role string for display
 * 
 * @param role - Role string (e.g., "CLUB_MANAGER")
 * @returns Formatted display string (e.g., "Club Manager")
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
 * Get role color for UI badges
 * 
 * @param role - Role string
 * @returns Tailwind color classes
 */
export function getRoleColor(role: string): { bg: string; text: string } {
  const colorMap: Record<string, { bg: string; text: string }> = {
    SUPERADMIN: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    LEAGUE_ADMIN: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
    CLUB_MANAGER: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
    CLUB_OWNER: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
    COACH: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    PLAYER: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
    PLAYER_PRO: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
    REFEREE: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
    SCOUT: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400' },
    TREASURER: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
  };

  return colorMap[role] || { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400' };
}

// ============================================================================
// EXPORT PRISMA CLIENT
// ============================================================================

export { prisma };
