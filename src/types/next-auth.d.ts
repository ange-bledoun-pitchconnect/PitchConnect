import 'next-auth';
import { DefaultSession } from 'next-auth';

/**
 * NextAuth Type Definitions - Aligned with src/auth.ts
 * 
 * ⚠️  CRITICAL: These types MUST match the exports from src/auth.ts
 * 
 * DO NOT use 'isSuperAdmin' - use 'role', 'roles', 'permissions' instead
 */

// User role types (must match src/auth.ts UserRole type)
export type UserRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'CLUB_OWNER'
  | 'LEAGUE_ADMIN'
  | 'MANAGER'
  | 'COACH'
  | 'ANALYST'
  | 'SCOUT'
  | 'PLAYER_PRO'
  | 'PLAYER'
  | 'PARENT'
  | 'REFEREE'
  | 'TREASURER';

// Permission types (must match src/auth.ts PermissionName type)
export type PermissionName =
  | 'manage_users'
  | 'manage_club'
  | 'manage_team'
  | 'manage_players'
  | 'view_analytics'
  | 'manage_payments'
  | 'view_audit_logs'
  | 'manage_matches'
  | 'manage_trainings'
  | 'manage_league';

// User status types
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED';

// Account tier types
export type AccountTier = 'FREE' | 'PRO' | 'PREMIUM' | 'ENTERPRISE';

declare module 'next-auth' {
  /**
   * User object returned from OAuth providers and credential auth
   * Must match the return value of authorize() in src/auth.ts
   */
  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string | null;
    role: UserRole;
    roles: UserRole[];
    status: UserStatus;
    isVerified: boolean;
    tier: AccountTier;
  }

  /**
   * Session object available on client via useSession()
   * Enhanced with authentication and authorization data
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string | null;
      role: UserRole;
      roles: UserRole[];
      permissions: PermissionName[];
      status: UserStatus;
      isVerified: boolean;
      tier: AccountTier;
      clubId?: string;
      teamId?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWT token contents - stored in HTTP-only cookie
   * Refreshed periodically based on session.updateAge config
   */
  interface JWT {
    id: string;
    email: string;
    name?: string;
    image?: string | null;
    role: UserRole;
    roles: UserRole[];
    permissions: PermissionName[];
    status: UserStatus;
    isVerified: boolean;
    tier: AccountTier;
    clubId?: string;
    teamId?: string;
    // JWT token metadata
    iat?: number; // Issued at (seconds)
    exp?: number; // Expiration (seconds)
  }
}
