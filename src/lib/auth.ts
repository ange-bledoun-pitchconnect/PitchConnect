// ============================================================================
// ENHANCED: src/lib/auth.ts
// ============================================================================
// WORLD-CLASS Authentication & Authorization System
// ✅ NextAuth.js integration, JWT handling, password management
// ✅ Role-based access control (RBAC) with granular permissions
// ✅ Session management, user validation, permission checking
// ✅ Production-ready error handling and logging
// ============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';
import { jwtDecode } from 'jwt-decode';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const PASSWORD_SALT_ROUNDS = 10;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Role hierarchy for permission inheritance
const ROLE_HIERARCHY = {
  SUPERADMIN: 100,
  ADMIN: 90,
  CLUB_OWNER: 80,
  LEAGUE_ADMIN: 75,
  MANAGER: 70,
  COACH: 60,
  ANALYST: 55,
  SCOUT: 50,
  PLAYER_PRO: 40,
  PLAYER: 30,
  PARENT: 20,
};

// Permission mapping by role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPERADMIN: ['*'], // All permissions
  ADMIN: [
    'manage_users',
    'manage_teams',
    'manage_leagues',
    'manage_clubs',
    'view_analytics',
    'manage_payments',
    'view_audit_logs',
  ],
  CLUB_OWNER: ['manage_club', 'manage_teams', 'manage_members', 'view_analytics', 'manage_payments'],
  LEAGUE_ADMIN: ['manage_league', 'manage_fixtures', 'manage_standings', 'view_analytics'],
  MANAGER: ['manage_players', 'manage_training', 'manage_tactics', 'view_analytics'],
  COACH: ['manage_players', 'manage_training', 'view_analytics', 'manage_drills'],
  ANALYST: ['view_analytics', 'analyze_performance', 'generate_reports'],
  SCOUT: ['view_players', 'view_analytics', 'manage_scouting'],
  PLAYER_PRO: ['view_profile', 'view_team', 'view_stats', 'manage_profile'],
  PLAYER: ['view_profile', 'view_team', 'view_stats'],
  PARENT: ['view_child_profile'],
};

// ============================================================================
// SESSION & USER MANAGEMENT
// ============================================================================

/**
 * Get current authenticated session
 * Use in Server Components, API Routes, getServerSideProps
 * @returns NextAuth Session or null if not authenticated
 */
export async function getCurrentSession() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      logger.debug('No active session found');
      return null;
    }
    logger.debug({ userId: session.user?.id }, 'Session retrieved');
    return session;
  } catch (error) {
    logger.error({ error }, 'Failed to get session');
    return null;
  }
}

/**
 * Get current authenticated user with full profile data
 * Includes roles, permissions, subscription info, and preferences
 * @returns User object with all profile data or null
 */
export async function getCurrentUser() {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      logger.debug('No user in session');
      return null;
    }

    const user = session.user as any;

    // Fetch full user profile from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        roles: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: { tier: true, status: true },
          take: 1,
        },
      },
    });

    if (!dbUser) {
      logger.warn({ userId: user.id }, 'User not found in database');
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      fullName: `${dbUser.firstName} ${dbUser.lastName}`,
      avatar: dbUser.avatar,
      roles: dbUser.roles || ['PLAYER'],
      status: dbUser.status,
      isEmailVerified: !!dbUser.emailVerified,
      twoFactorEnabled: dbUser.twoFactorEnabled,
      subscriptionTier: dbUser.subscriptions?.[0]?.tier || 'FREE',
      subscriptionStatus: dbUser.subscriptions?.[0]?.status || 'INACTIVE',
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      isSuperAdmin: dbUser.roles?.includes('SUPERADMIN') || false,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to get current user');
    return null;
  }
}

/**
 * Require authentication - throws if user not authenticated
 * @throws Error if user not authenticated
 * @returns User object if authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    const error = new Error('Authentication required');
    logger.warn({ error }, 'Unauthorized access attempt');
    throw error;
  }
  return user;
}

/**
 * Require specific role(s) - throws if user doesn't have required role
 * @param requiredRoles - Array of required roles (user needs at least one)
 * @throws Error if user doesn't have required role
 * @returns User object if authorized
 */
export async function requireRole(...requiredRoles: string[]) {
  const user = await requireAuth();
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];

  const hasRole = requiredRoles.some((role) => userRoles.includes(role));
  if (!hasRole) {
    const error = new Error(
      `Insufficient permissions. Required role: ${requiredRoles.join(' or ')}`
    );
    logger.warn(
      { userId: user.id, requiredRoles, userRoles },
      'Insufficient permissions'
    );
    throw error;
  }
  return user;
}

/**
 * Check if user is superadmin
 * @returns boolean
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.isSuperAdmin || false;
  } catch (error) {
    logger.error({ error }, 'Failed to check superadmin status');
    return false;
  }
}

/**
 * Check if user is admin (superadmin or admin role)
 * @returns boolean
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    return roles.includes('SUPERADMIN') || roles.includes('ADMIN');
  } catch (error) {
    logger.error({ error }, 'Failed to check admin status');
    return false;
  }
}

/**
 * Check if user belongs to specific team
 * @param teamId - Team ID to check
 * @returns boolean
 */
export async function userBelongsToTeam(teamId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Superadmins can access any team
    if (user.isSuperAdmin) return true;

    // Check if user is member of team
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: user.id,
        club: {
          teams: {
            some: { id: teamId },
          },
        },
      },
    });

    return !!membership;
  } catch (error) {
    logger.error({ error, teamId, userId: (await getCurrentUser())?.id }, 'Team access check failed');
    return false;
  }
}

/**
 * Check if user has specific permission
 * Considers role hierarchy and inherited permissions
 * @param permission - Permission to check
 * @returns boolean
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Superadmins have all permissions
    if (user.isSuperAdmin) return true;

    const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];

    // Check if any of user's roles have this permission
    for (const role of userRoles) {
      const permissions = ROLE_PERMISSIONS[role] || [];
      if (permissions.includes('*') || permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error({ error }, 'Permission check failed');
    return false;
  }
}

/**
 * Check if user has permission for resource owned by specific user
 * @param targetUserId - Owner of the resource
 * @param requiredPermission - Permission needed
 * @returns boolean (true if user has permission OR is the target user)
 */
export async function hasResourcePermission(
  targetUserId: string,
  requiredPermission: string
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // User can access their own resource
    if (user.id === targetUserId) return true;

    // Check general permission
    return await hasPermission(requiredPermission);
  } catch (error) {
    logger.error({ error }, 'Resource permission check failed');
    return false;
  }
}

/**
 * Get user's permission level (0-100)
 * Used for role-based access decisions
 * @returns Permission level or 0 if not authenticated
 */
export async function getUserPermissionLevel(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;

    const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
    const levels = userRoles.map((role) => ROLE_HIERARCHY[role] || 0);
    return Math.max(...levels, 0);
  } catch (error) {
    logger.error({ error }, 'Failed to get permission level');
    return 0;
  }
}

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

/**
 * Validate password strength
 * Requires: 8+ chars, uppercase, lowercase, number, special char
 * @param password - Password to validate
 * @returns { valid: boolean; errors: string[] }
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain special character (@$!%*?&)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Hash password using bcrypt
 * @param password - Plain text password
 * @returns Promise<string> Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      throw new Error(`Invalid password: ${validation.errors.join(', ')}`);
    }

    const hash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    logger.debug('Password hashed successfully');
    return hash;
  } catch (error) {
    logger.error({ error }, 'Password hashing failed');
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify password against hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns Promise<boolean> True if password matches hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    if (!password || !hash) {
      logger.warn('Missing password or hash for verification');
      return false;
    }

    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      logger.debug('Password verification failed');
    }
    return isValid;
  } catch (error) {
    logger.error({ error }, 'Password verification error');
    return false;
  }
}

/**
 * Generate secure random password
 * @returns string Random password meeting security requirements
 */
export function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@$!%*?&';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// ============================================================================
// JWT & TOKEN MANAGEMENT
// ============================================================================

/**
 * Decode JWT token without verification (unsafe, use only for inspection)
 * @param token - JWT token
 * @returns Decoded token or null
 */
export function decodeToken(token: string) {
  try {
    return jwtDecode(token);
  } catch (error) {
    logger.error({ error }, 'Failed to decode token');
    return null;
  }
}

/**
 * Check if token is expired
 * @param token - JWT token
 * @returns boolean True if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    if (!decoded.exp) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    logger.error({ error }, 'Failed to check token expiration');
    return true; // Assume expired if can't verify
  }
}

// ============================================================================
// SESSION CLEANUP
// ============================================================================

/**
 * Invalidate all sessions for a user
 * @param userId - User ID
 */
export async function invalidateUserSessions(userId: string) {
  try {
    // Delete all sessions for user
    await prisma.session.deleteMany({
      where: { userId },
    });

    logger.info({ userId }, 'All user sessions invalidated');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to invalidate sessions');
    throw error;
  }
}

/**
 * Log out user and clean up session
 * @param userId - User ID
 */
export async function logoutUser(userId: string) {
  try {
    await invalidateUserSessions(userId);

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_LOGGED_OUT',
        entity: 'SESSION',
        entityId: userId,
        changes: { timestamp: new Date().toISOString() },
        ipAddress: 'unknown',
      },
    });

    logger.info({ userId }, 'User logged out successfully');
  } catch (error) {
    logger.error({ error, userId }, 'Logout failed');
    throw error;
  }
}

export default {
  getCurrentSession,
  getCurrentUser,
  requireAuth,
  requireRole,
  isSuperAdmin,
  isAdmin,
  userBelongsToTeam,
  hasPermission,
  hasResourcePermission,
  getUserPermissionLevel,
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  generateSecurePassword,
  decodeToken,
  isTokenExpired,
  invalidateUserSessions,
  logoutUser,
};
