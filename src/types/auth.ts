// ============================================================================
// 🔐 AUTHENTICATION TYPES - PitchConnect v7.5.0
// Path: src/types/auth.ts
// ============================================================================
//
// Standalone authentication type definitions.
// Re-exports and extends NextAuth types for convenience.
//
// IMPORTANT: This file re-exports types from next-auth.d.ts
// Any changes to roles/permissions should be made there first.
//
// ============================================================================

import type { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT as NextAuthJWT } from 'next-auth/jwt';

// ============================================================================
// RE-EXPORT CORE TYPES FROM NEXT-AUTH.D.TS
// ============================================================================

export type {
  UserRole,
  PermissionName,
  UserStatus,
  AccountTier,
} from './next-auth.d';

export {
  ROLE_HIERARCHY,
  ADMIN_ROLES,
  CLUB_MANAGEMENT_ROLES,
  COACHING_ROLES,
  MEDICAL_ROLES,
  PLAYER_ROLES,
  FAMILY_ROLES,
  STAFF_ROLES,
  isValidRole,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  getHighestRole,
  isHigherRole,
} from './next-auth.d';

// ============================================================================
// EXTENDED AUTH TYPES
// ============================================================================

/**
 * Authentication credentials for login
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  totpCode?: string;
}

/**
 * Registration data for new users
 */
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date | string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
  referralCode?: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Password change (authenticated)
 */
export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Email verification
 */
export interface EmailVerification {
  token: string;
}

/**
 * Two-factor authentication setup
 */
export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

/**
 * Two-factor verification
 */
export interface TwoFactorVerify {
  code: string;
  trustDevice?: boolean;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * Extended session user with all PitchConnect fields
 */
export interface SessionUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  image?: string | null;
  avatar?: string | null;
  
  // Role & Permissions
  role: import('./next-auth.d').UserRole;
  roles: import('./next-auth.d').UserRole[];
  permissions: import('./next-auth.d').PermissionName[];
  
  // Account Status
  status: import('./next-auth.d').UserStatus;
  isVerified: boolean;
  
  // Subscription
  tier: import('./next-auth.d').AccountTier;
  
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
 * Complete session object
 */
export interface AuthSession {
  user: SessionUser;
  expires: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Authentication state for client-side hooks
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AuthSession | null;
  error: string | null;
}

// ============================================================================
// TOKEN TYPES
// ============================================================================

/**
 * Access token payload
 */
export interface AccessTokenPayload {
  sub: string;          // User ID
  email: string;
  role: import('./next-auth.d').UserRole;
  roles: import('./next-auth.d').UserRole[];
  permissions: import('./next-auth.d').PermissionName[];
  iat: number;          // Issued at
  exp: number;          // Expiration
  jti: string;          // JWT ID
}

/**
 * Refresh token payload
 */
export interface RefreshTokenPayload {
  sub: string;          // User ID
  jti: string;          // JWT ID
  iat: number;          // Issued at
  exp: number;          // Expiration
}

/**
 * Token pair response
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;    // Seconds until access token expires
  tokenType: 'Bearer';
}

// ============================================================================
// AUTHORIZATION TYPES
// ============================================================================

/**
 * Authorization check result
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  requiredRole?: import('./next-auth.d').UserRole;
  requiredPermission?: import('./next-auth.d').PermissionName;
  userRole?: import('./next-auth.d').UserRole;
}

/**
 * Resource authorization context
 */
export interface AuthorizationContext {
  userId: string;
  userRoles: import('./next-auth.d').UserRole[];
  userPermissions: import('./next-auth.d').PermissionName[];
  resourceType: string;
  resourceId?: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  clubId?: string;
  teamId?: string;
  organisationId?: string;
}

/**
 * Route protection configuration
 */
export interface RouteProtection {
  path: string;
  requiredRoles?: import('./next-auth.d').UserRole[];
  requiredPermissions?: import('./next-auth.d').PermissionName[];
  requireAuth?: boolean;
  requireVerified?: boolean;
  redirectTo?: string;
}

// ============================================================================
// OAUTH TYPES
// ============================================================================

/**
 * OAuth provider types
 */
export type OAuthProvider = 
  | 'google'
  | 'apple'
  | 'microsoft'
  | 'facebook'
  | 'github';

/**
 * OAuth account link
 */
export interface OAuthAccountLink {
  provider: OAuthProvider;
  providerAccountId: string;
  linkedAt: Date;
  email?: string;
}

/**
 * OAuth profile from provider
 */
export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  emailVerified?: boolean;
}

// ============================================================================
// SECURITY TYPES
// ============================================================================

/**
 * Login attempt record
 */
export interface LoginAttempt {
  id: string;
  userId?: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
}

/**
 * Active session record
 */
export interface ActiveSession {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  location?: string;
  lastActive: Date;
  createdAt: Date;
  isCurrent: boolean;
}

/**
 * Security event types
 */
export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_changed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'email_verified'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'session_revoked'
  | 'account_locked'
  | 'account_unlocked'
  | 'suspicious_activity';

/**
 * Security event record
 */
export interface SecurityEvent {
  id: string;
  userId: string;
  type: SecurityEventType;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// API AUTHENTICATION TYPES
// ============================================================================

/**
 * API key for programmatic access
 */
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;      // First 8 chars for identification
  permissions: import('./next-auth.d').PermissionName[];
  rateLimit: number;      // Requests per minute
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

/**
 * API key creation response
 */
export interface ApiKeyCreated extends ApiKey {
  key: string;            // Full key (only shown once)
}

// ============================================================================
// INVITATION TYPES
// ============================================================================

/**
 * User invitation
 */
export interface UserInvitation {
  id: string;
  email: string;
  role: import('./next-auth.d').UserRole;
  invitedBy: string;
  clubId?: string;
  teamId?: string;
  organisationId?: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

/**
 * Invitation acceptance data
 */
export interface InvitationAcceptance {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Authentication error codes
 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_locked'
  | 'account_disabled'
  | 'email_not_verified'
  | 'token_expired'
  | 'token_invalid'
  | 'session_expired'
  | 'insufficient_permissions'
  | 'rate_limited'
  | '2fa_required'
  | '2fa_invalid'
  | 'password_too_weak'
  | 'email_already_exists'
  | 'invitation_expired'
  | 'invitation_invalid';

/**
 * Authentication error
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Authentication response wrapper
 */
export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: AuthError;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Login response
 */
export interface LoginResponse {
  user: SessionUser;
  tokens: TokenPair;
  requiresTwoFactor?: boolean;
}

/**
 * Registration response
 */
export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  requiresVerification: boolean;
  message: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * User with required session fields
 */
export type AuthenticatedUser = RequireFields<
  SessionUser,
  'id' | 'email' | 'role' | 'roles' | 'permissions' | 'status'
>;

/**
 * Minimal user for public display
 */
export interface PublicUserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string | null;
  role: import('./next-auth.d').UserRole;
}