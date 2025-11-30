import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcryptjs';

const prisma = new PrismaClient();

// ========================================
// PASSWORD UTILITIES
// ========================================

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hashed - Hashed password to compare against
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return await compare(password, hashed);
}

// ========================================
// USER QUERIES
// ========================================

/**
 * Get user by email with roles and related data
 * @param email - User email address
 * @returns User with roles or null
 */
export async function getUserWithRole(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      roles: true, // ✅ Fixed: Use 'roles' array instead of 'userType'
      emailVerified: true,
      password: true, // ✅ Fixed: Set to true to include password for verification
      status: true,
      playerProfile: {
        select: {
          id: true,
          position: true,
        },
      },
      coachProfile: {
        select: {
          id: true,
        },
      },
      clubManager: {
        select: {
          id: true,
          clubs: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
      leagueAdmin: {
        select: {
          id: true,
          leagues: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get user's primary role
 * @param roles - Array of UserRole
 * @returns Primary role (first in priority order)
 */
export function getPrimaryRole(roles: string[]): string {
  const rolePriority = [
    'SUPERADMIN',
    'LEAGUE_ADMIN',
    'CLUB_MANAGER',
    'COACH',
    'PLAYER',
    'PARENT',
  ];

  for (const role of rolePriority) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return 'PLAYER'; // Default fallback
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Capitalize a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get user display name
 * @param user - User object with firstName and lastName
 * @returns Full name
 */
export function getUserDisplayName(user: {
  firstName: string;
  lastName: string;
}): string {
  return `${user.firstName} ${user.lastName}`;
}

/**
 * Check if user has a specific role
 * @param roles - Array of user roles
 * @param requiredRole - Role to check for
 * @returns True if user has the role
 */
export function hasRole(roles: string[], requiredRole: string): boolean {
  return roles.includes(requiredRole);
}

/**
 * Check if user has any of the specified roles
 * @param roles - Array of user roles
 * @param requiredRoles - Roles to check for
 * @returns True if user has at least one role
 */
export function hasAnyRole(roles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => roles.includes(role));
}
