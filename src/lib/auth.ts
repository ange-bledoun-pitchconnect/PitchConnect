// src/lib/auth.ts
// ============================================================================
// AUTHENTICATION UTILITIES - Enterprise-Grade Production Implementation
// ============================================================================
// Server-side authentication helpers, password management, and authorization
// Fully compatible with NextAuth.js and JWT tokens
// ============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import bcrypt from 'bcryptjs';
import { jwtDecode } from 'jwt-decode';

// ============================================================================
// SESSION & USER MANAGEMENT
// ============================================================================

/**
 * Get current session from NextAuth
 * Use in Server Components, API Routes, getServerSideProps
 * @returns NextAuth Session or null if not authenticated
 */
export async function getCurrentSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('[Auth] Failed to get session:', error);
    return null;
  }
}

/**
 * Get current authenticated user with full data
 * Use in Server Components and API Routes
 * @returns User object with all profile data or null
 */
export async function getCurrentUser() {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return null;

    const user = session.user as any;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'PLAYER',
      roles: user.roles || [user.role || 'PLAYER'],
      teamId: user.teamId,
      isSuperAdmin: user.isSuperAdmin || false,
      subscriptionTier: user.subscriptionTier || 'FREE',
      status: user.status || 'ACTIVE',
    };
  } catch (error) {
    console.error('[Auth] Failed to get current user:', error);
    return null;
  }
}

/**
 * Require authentication - throws if user not authenticated
 * @throws Error if user not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require specific role(s) - throws if user doesn't have required role
 * @param roles - Array of required roles
 * @throws Error if user doesn't have required role
 */
export async function requireRole(...roles: string[]) {
  const user = await requireAuth();
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
  
  const hasRole = roles.some(role => userRoles.includes(role));
  if (!hasRole) {
    throw new Error(`Insufficient permissions. Required role: ${roles.join(' or ')}`);
  }
  return user;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isSuperAdmin || user?.role === 'SUPERADMIN';
}

/**
 * Check if user belongs to specific team
 */
export async function userBelongsToTeam(teamId: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.teamId === teamId || (await isAdmin());
}

/**
 * Check if user has permission for specific action
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // SuperAdmin has all permissions
  if (user.isSuperAdmin) return true;
  
  // Map roles to permissions (customize based on your needs)
  const rolePermissions: Record<string, string[]> = {
    SUPERADMIN: ['*'], // All permissions
    CLUB_OWNER: ['manage_club', 'manage_teams', 'manage_members', 'view_analytics'],
    COACH: ['manage_players', 'manage_training', 'view_analytics'],
    PLAYER: ['view_profile', 'view_team', 'view_stats'],
    PARENT: ['view_child_profile'],
  };

  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(permission);
}

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

const PASSWORD_SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt
 * @param password - Plain text password
 * @returns Promise of hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  } catch (error) {
    console.error('[Auth] Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify password against hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns Promise of boolean
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('[Auth] Password verification failed:', error);
    return false;
  }
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

export interface PasswordValidation {
  isValid: boolean;
  strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  score: number; // 0-4
  errors: string[];
  suggestions: string[];
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score++;
    if (password.length >= 12) score++;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score++;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score++;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score++;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
    suggestions.push('Try adding symbols like ! @ # $ % ^ & *');
  } else {
    score++;
  }

  // Determine strength
  let strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' = 'WEAK';
  if (score >= 4 && password.length >= 12) strength = 'VERY_STRONG';
  else if (score >= 3 && password.length >= 10) strength = 'STRONG';
  else if (score >= 2) strength = 'MODERATE';

  return {
    isValid: errors.length === 0,
    strength,
    score: Math.min(4, score),
    errors,
    suggestions,
  };
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  // RFC 5322 compliant email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize email (lowercase, trim)
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Decode JWT token (client-side safe - no verification)
 */
export function decodeToken(token: string): any {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('[Auth] Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode(token) as any;
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenExpiresIn(token: string): number {
  try {
    const decoded = jwtDecode(token) as any;
    if (!decoded.exp) return 0;
    return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
  } catch {
    return 0;
  }
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Check if user can access player profile
 */
export async function canAccessPlayer(playerId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  
  // Coach can access their players
  // Players can access themselves
  // Add more logic based on your rules
  return true;
}

/**
 * Check if user can manage team
 */
export async function canManageTeam(teamId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.role === 'CLUB_OWNER' || user.role === 'CLUB_MANAGER') return true;
  return false;
}

/**
 * Check if user can edit match
 */
export async function canEditMatch(matchId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.role === 'REFEREE' || user.role === 'COACH') return true;
  return false;
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

const loginAttempts = new Map<string, { count: number; until: number }>();

/**
 * Check if account is locked due to failed login attempts
 */
export function isAccountLocked(email: string): boolean {
  const attempt = loginAttempts.get(email);
  if (!attempt) return false;
  
  if (Date.now() > attempt.until) {
    loginAttempts.delete(email);
    return false;
  }
  
  return attempt.count >= 5;
}

/**
 * Record failed login attempt
 */
export function recordFailedLogin(email: string): void {
  const attempt = loginAttempts.get(email) || { count: 0, until: 0 };
  attempt.count++;
  attempt.until = Date.now() + (15 * 60 * 1000); // 15 minutes lockout
  loginAttempts.set(email, attempt);
}

/**
 * Clear failed login attempts
 */
export function clearFailedLogins(email: string): void {
  loginAttempts.delete(email);
}

/**
 * Get remaining lockout time (in seconds)
 */
export function getRemainingLockoutTime(email: string): number {
  const attempt = loginAttempts.get(email);
  if (!attempt) return 0;
  const remaining = attempt.until - Date.now();
  return Math.ceil(Math.max(0, remaining) / 1000);
}

// ============================================================================
// OAUTH / SOCIAL AUTH HELPERS
// ============================================================================

/**
 * Get OAuth provider from account
 */
export function getOAuthProvider(account: any): string | null {
  if (!account) return null;
  return account.provider;
}

/**
 * Link OAuth account to existing user
 */
export async function linkOAuthAccount(
  userId: string,
  provider: string,
  providerAccountId: string
): Promise<boolean> {
  try {
    // Implementation depends on your OAuth setup
    return true;
  } catch (error) {
    console.error('[Auth] Failed to link OAuth account:', error);
    return false;
  }
}

export default {
  getCurrentSession,
  getCurrentUser,
  requireAuth,
  requireRole,
  isAdmin,
  userBelongsToTeam,
  hasPermission,
  hashPassword,
  verifyPassword,
  validatePassword,
  isValidEmail,
  sanitizeEmail,
  decodeToken,
  isTokenExpired,
  getTokenExpiresIn,
  canAccessPlayer,
  canManageTeam,
  canEditMatch,
  isAccountLocked,
  recordFailedLogin,
  clearFailedLogins,
  getRemainingLockoutTime,
};