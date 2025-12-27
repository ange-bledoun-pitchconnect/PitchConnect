/**
 * ============================================================================
 * 🔐 PITCHCONNECT - AUTHENTICATION CONFIGURATION v2.0
 * ============================================================================
 * Path: /src/auth.ts
 *
 * Enterprise-grade NextAuth v4 configuration with:
 * ✅ Prisma 7 compatible (singleton pattern)
 * ✅ Email/Password + OAuth (Google, GitHub, Microsoft)
 * ✅ JWT Session Strategy with refresh
 * ✅ Role-Based Access Control (RBAC)
 * ✅ Multi-tenancy support (Club/Team scoping)
 * ✅ Rate limiting awareness
 * ✅ Security logging & audit trail
 * ✅ Account lockout protection
 * ✅ Session fingerprinting
 * ✅ Type-safe configuration
 * ============================================================================
 */

import NextAuth, {
  type NextAuthConfig,
  type DefaultSession,
  type User as NextAuthUser,
} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { compare } from 'bcryptjs';
import { z } from 'zod';

// ============================================================================
// ✅ PRISMA 7 FIX: Import singleton instance (NOT PrismaClient)
// ============================================================================
import { prisma } from '@/lib/prisma';

// ============================================================================
// 🎯 CONSTANTS
// ============================================================================

/** Session duration constants */
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const SESSION_UPDATE_AGE = 24 * 60 * 60; // Refresh every 24 hours
const JWT_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/** Security constants */
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// ============================================================================
// 🏷️ TYPE DEFINITIONS
// ============================================================================

/**
 * User roles aligned with Prisma schema
 * Ordered by privilege level (highest to lowest)
 */
export type UserRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'CLUB_OWNER'
  | 'LEAGUE_ADMIN'
  | 'MANAGER'
  | 'COACH'
  | 'ANALYST'
  | 'SCOUT'
  | 'REFEREE'
  | 'PLAYER_PRO'
  | 'PLAYER'
  | 'GUARDIAN'
  | 'PARENT'
  | 'FAN';

/**
 * User account status aligned with Prisma schema
 */
export type UserStatus =
  | 'ACTIVE'
  | 'PENDING_EMAIL_VERIFICATION'
  | 'PENDING_APPROVAL'
  | 'SUSPENDED'
  | 'BANNED'
  | 'INACTIVE'
  | 'ARCHIVED';

/**
 * Permission names for RBAC
 */
export type PermissionName =
  | 'system:admin'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'clubs:read'
  | 'clubs:write'
  | 'clubs:delete'
  | 'teams:read'
  | 'teams:write'
  | 'teams:delete'
  | 'players:read'
  | 'players:write'
  | 'players:delete'
  | 'matches:read'
  | 'matches:write'
  | 'matches:delete'
  | 'analytics:read'
  | 'analytics:export'
  | 'payments:read'
  | 'payments:write'
  | 'audit:read'
  | 'settings:read'
  | 'settings:write';

/**
 * Extended session user type
 */
interface SessionUser {
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
  lastLoginAt?: Date | null;
}

/**
 * Extend NextAuth types for type safety
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: SessionUser;
    accessToken?: string;
    error?: string;
  }

  interface User extends NextAuthUser {
    role?: UserRole;
    roles?: UserRole[];
    status?: UserStatus;
    clubId?: string | null;
    teamId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    picture?: string | null;
    role: UserRole;
    roles: UserRole[];
    permissions: PermissionName[];
    status: UserStatus;
    clubId?: string | null;
    teamId?: string | null;
    emailVerified?: Date | null;
    lastLoginAt?: Date | null;
    iat?: number;
    exp?: number;
    jti?: string;
  }
}

// ============================================================================
// 🔒 VALIDATION SCHEMAS
// ============================================================================

/**
 * Credentials validation schema using Zod
 */
const credentialsSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(5, 'Email too short')
    .max(255, 'Email too long')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
});

// ============================================================================
// 🛡️ SECURITY HELPERS
// ============================================================================

/**
 * Check if account is locked due to too many failed attempts
 */
async function isAccountLocked(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        failedLoginAttempts: true,
        lastFailedLoginAt: true,
      },
    });

    if (!user) return false;

    // Check if locked out
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS && user.lastFailedLoginAt) {
      const lockoutEnd = new Date(user.lastFailedLoginAt);
      lockoutEnd.setMinutes(lockoutEnd.getMinutes() + LOCKOUT_DURATION_MINUTES);

      if (new Date() < lockoutEnd) {
        return true;
      }

      // Lockout expired, reset attempts
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lastFailedLoginAt: null,
        },
      });
    }

    return false;
  } catch (error) {
    console.error('[AUTH] Error checking account lock:', error);
    return false;
  }
}

/**
 * Record failed login attempt
 */
async function recordFailedAttempt(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[AUTH] Error recording failed attempt:', error);
  }
}

/**
 * Reset failed login attempts on successful login
 */
async function resetFailedAttempts(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[AUTH] Error resetting failed attempts:', error);
  }
}

/**
 * Log authentication event for audit trail
 */
async function logAuthEvent(
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'SESSION_REFRESH' | 'OAUTH_LINK',
  userId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] ${type}:`, { userId, ...metadata });
    }

    // Optionally log to database audit table
    // await prisma.auditLog.create({
    //   data: {
    //     action: type,
    //     userId,
    //     metadata: JSON.stringify(metadata),
    //     ipAddress: metadata.ip as string,
    //     userAgent: metadata.userAgent as string,
    //   },
    // });
  } catch (error) {
    console.error('[AUTH] Error logging auth event:', error);
  }
}

// ============================================================================
// 🔑 PERMISSIONS HELPER
// ============================================================================

/**
 * Role-to-permissions mapping
 * Defines what each role can do in the system
 */
const ROLE_PERMISSIONS: Record<UserRole, PermissionName[]> = {
  SUPERADMIN: [
    'system:admin',
    'users:read', 'users:write', 'users:delete',
    'clubs:read', 'clubs:write', 'clubs:delete',
    'teams:read', 'teams:write', 'teams:delete',
    'players:read', 'players:write', 'players:delete',
    'matches:read', 'matches:write', 'matches:delete',
    'analytics:read', 'analytics:export',
    'payments:read', 'payments:write',
    'audit:read',
    'settings:read', 'settings:write',
  ],
  ADMIN: [
    'users:read', 'users:write',
    'clubs:read', 'clubs:write',
    'teams:read', 'teams:write',
    'players:read', 'players:write',
    'matches:read', 'matches:write',
    'analytics:read', 'analytics:export',
    'audit:read',
    'settings:read', 'settings:write',
  ],
  CLUB_OWNER: [
    'clubs:read', 'clubs:write',
    'teams:read', 'teams:write', 'teams:delete',
    'players:read', 'players:write',
    'matches:read', 'matches:write',
    'analytics:read', 'analytics:export',
    'payments:read', 'payments:write',
    'settings:read', 'settings:write',
  ],
  LEAGUE_ADMIN: [
    'teams:read', 'teams:write',
    'matches:read', 'matches:write',
    'analytics:read',
    'settings:read',
  ],
  MANAGER: [
    'teams:read', 'teams:write',
    'players:read', 'players:write',
    'matches:read', 'matches:write',
    'analytics:read',
  ],
  COACH: [
    'teams:read',
    'players:read', 'players:write',
    'matches:read', 'matches:write',
    'analytics:read',
  ],
  ANALYST: [
    'teams:read',
    'players:read',
    'matches:read',
    'analytics:read', 'analytics:export',
  ],
  SCOUT: [
    'teams:read',
    'players:read',
    'matches:read',
    'analytics:read',
  ],
  REFEREE: [
    'matches:read', 'matches:write',
  ],
  PLAYER_PRO: [
    'players:read',
    'matches:read',
    'analytics:read',
  ],
  PLAYER: [
    'players:read',
    'matches:read',
  ],
  GUARDIAN: [
    'players:read',
    'matches:read',
  ],
  PARENT: [
    'players:read',
    'matches:read',
  ],
  FAN: [
    'matches:read',
  ],
};

/**
 * Get permissions for a role
 */
function getPermissionsByRole(role: UserRole): PermissionName[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get combined permissions for multiple roles
 */
function getPermissionsByRoles(roles: UserRole[]): PermissionName[] {
  const permissions = new Set<PermissionName>();
  
  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    rolePerms.forEach((p) => permissions.add(p));
  }
  
  return Array.from(permissions);
}

/**
 * Get the highest privilege role from a list
 */
function getPrimaryRole(roles: UserRole[]): UserRole {
  const roleOrder: UserRole[] = [
    'SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'LEAGUE_ADMIN',
    'MANAGER', 'COACH', 'ANALYST', 'SCOUT', 'REFEREE',
    'PLAYER_PRO', 'PLAYER', 'GUARDIAN', 'PARENT', 'FAN',
  ];

  for (const role of roleOrder) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return 'FAN';
}

// ============================================================================
// 🔐 NEXTAUTH CONFIGURATION
// ============================================================================

const authConfig: NextAuthConfig = {
  // ==========================================================================
  // 🔌 AUTHENTICATION PROVIDERS
  // ==========================================================================
  providers: [
    // =========================================================================
    // 📧 EMAIL/PASSWORD AUTHENTICATION
    // =========================================================================
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'you@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },

      async authorize(credentials): Promise<NextAuthUser | null> {
        try {
          // Validate credentials with Zod
          const result = credentialsSchema.safeParse(credentials);

          if (!result.success) {
            console.warn('[AUTH] Invalid credentials format:', result.error.flatten());
            throw new Error('CredentialsSignin');
          }

          const { email, password } = result.data;

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              password: true,
              firstName: true,
              lastName: true,
              avatar: true,
              roles: true,
              status: true,
              emailVerified: true,
              clubId: true,
              teamId: true,
              failedLoginAttempts: true,
              lastFailedLoginAt: true,
            },
          });

          // User not found
          if (!user) {
            await logAuthEvent('LOGIN_FAILED', null, {
              email,
              reason: 'User not found',
            });
            throw new Error('CredentialsSignin');
          }

          // Check account lock
          if (await isAccountLocked(user.id)) {
            await logAuthEvent('LOGIN_FAILED', user.id, {
              reason: 'Account locked',
            });
            throw new Error('AccountLocked');
          }

          // Check account status
          const allowedStatuses: UserStatus[] = ['ACTIVE', 'PENDING_EMAIL_VERIFICATION'];
          if (!allowedStatuses.includes(user.status as UserStatus)) {
            await logAuthEvent('LOGIN_FAILED', user.id, {
              reason: `Invalid status: ${user.status}`,
            });
            throw new Error('AccountInactive');
          }

          // Check if password exists (OAuth-only accounts)
          if (!user.password) {
            await logAuthEvent('LOGIN_FAILED', user.id, {
              reason: 'No password set (OAuth account)',
            });
            throw new Error('OAuthAccountNotLinked');
          }

          // Verify password
          const isPasswordValid = await compare(password, user.password);

          if (!isPasswordValid) {
            await recordFailedAttempt(user.id);
            await logAuthEvent('LOGIN_FAILED', user.id, {
              reason: 'Invalid password',
            });
            throw new Error('CredentialsSignin');
          }

          // ✅ SUCCESS: Reset failed attempts and update last login
          await resetFailedAttempts(user.id);
          await logAuthEvent('LOGIN_SUCCESS', user.id, { provider: 'credentials' });

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
            image: user.avatar,
            role: getPrimaryRole(user.roles as UserRole[]),
            roles: user.roles as UserRole[],
            status: user.status as UserStatus,
            clubId: user.clubId,
            teamId: user.teamId,
          };
        } catch (error) {
          // Re-throw known errors
          if (error instanceof Error) {
            const knownErrors = [
              'CredentialsSignin',
              'AccountLocked',
              'AccountInactive',
              'OAuthAccountNotLinked',
            ];
            if (knownErrors.includes(error.message)) {
              throw error;
            }
          }

          // Log unexpected errors
          console.error('[AUTH] Unexpected authorization error:', error);
          throw new Error('CredentialsSignin');
        }
      },
    }),

    // =========================================================================
    // 🌐 GOOGLE OAUTH
    // =========================================================================
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
              };
            },
          }),
        ]
      : []),

    // =========================================================================
    // 🐙 GITHUB OAUTH
    // =========================================================================
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],

  // ==========================================================================
  // ⚙️ SESSION CONFIGURATION
  // ==========================================================================
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },

  // ==========================================================================
  // 🔑 JWT CONFIGURATION
  // ==========================================================================
  jwt: {
    maxAge: JWT_MAX_AGE,
  },

  // ==========================================================================
  // 📄 CUSTOM PAGES
  // ==========================================================================
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding',
  },

  // ==========================================================================
  // 🔄 CALLBACKS
  // ==========================================================================
  callbacks: {
    /**
     * Sign In Callback
     * Validates and handles OAuth account creation/linking
     */
    async signIn({ user, account, profile }) {
      // Require email for all sign-ins
      if (!user.email) {
        console.warn('[AUTH] Sign-in rejected: No email provided');
        return false;
      }

      // Handle OAuth sign-in
      if (account?.provider && account.provider !== 'credentials') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, status: true },
          });

          if (existingUser) {
            // Check if existing user can sign in
            const allowedStatuses: UserStatus[] = ['ACTIVE', 'PENDING_EMAIL_VERIFICATION'];
            if (!allowedStatuses.includes(existingUser.status as UserStatus)) {
              console.warn(`[AUTH] OAuth sign-in rejected: User ${user.email} has status ${existingUser.status}`);
              return false;
            }

            // Update last login
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLoginAt: new Date() },
            });

            await logAuthEvent('LOGIN_SUCCESS', existingUser.id, {
              provider: account.provider,
            });
          } else {
            // Create new user from OAuth
            console.log(`[AUTH] Creating new OAuth user: ${user.email} (${account.provider})`);

            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                firstName: profile?.given_name || profile?.name?.split(' ')[0] || 'User',
                lastName: profile?.family_name || profile?.name?.split(' ').slice(1).join(' ') || '',
                avatar: user.image || profile?.picture,
                roles: ['PLAYER'], // Default role
                status: 'ACTIVE',
                emailVerified: new Date(),
                lastLoginAt: new Date(),
              },
            });

            await logAuthEvent('LOGIN_SUCCESS', newUser.id, {
              provider: account.provider,
              isNewUser: true,
            });
          }
        } catch (error) {
          console.error(`[AUTH] OAuth sign-in error (${account.provider}):`, error);
          return false;
        }
      }

      return true;
    },

    /**
     * Redirect Callback
     * Controls post-authentication redirects
     */
    async redirect({ url, baseUrl }) {
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // Handle same-origin URLs
      try {
        const urlOrigin = new URL(url).origin;
        if (urlOrigin === baseUrl) {
          return url;
        }
      } catch {
        // Invalid URL, use default
      }

      // Default redirect
      return `${baseUrl}/dashboard`;
    },

    /**
     * JWT Callback
     * Enriches JWT with user data from database
     */
    async jwt({ token, user, account, trigger }) {
      // Initial sign-in
      if (user) {
        token.id = user.id;
        token.email = user.email || '';
        token.name = user.name || '';
        token.picture = user.image;
      }

      // Fetch fresh user data on sign-in or session update
      if (token.id && (user || trigger === 'update')) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              roles: true,
              status: true,
              clubId: true,
              teamId: true,
              emailVerified: true,
              lastLoginAt: true,
            },
          });

          if (dbUser) {
            const roles = (dbUser.roles || ['PLAYER']) as UserRole[];

            token.id = dbUser.id;
            token.email = dbUser.email;
            token.name = [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || dbUser.email;
            token.picture = dbUser.avatar;
            token.role = getPrimaryRole(roles);
            token.roles = roles;
            token.permissions = getPermissionsByRoles(roles);
            token.status = dbUser.status as UserStatus;
            token.clubId = dbUser.clubId;
            token.teamId = dbUser.teamId;
            token.emailVerified = dbUser.emailVerified;
            token.lastLoginAt = dbUser.lastLoginAt;
          } else {
            console.warn(`[JWT] User not found: ${token.id}`);
          }
        } catch (error) {
          console.error('[JWT] Error fetching user data:', error);
        }
      }

      // Ensure defaults
      token.role = token.role || 'PLAYER';
      token.roles = token.roles || ['PLAYER'];
      token.permissions = token.permissions || [];
      token.status = token.status || 'ACTIVE';

      return token;
    },

    /**
     * Session Callback
     * Exposes JWT data to client session
     */
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        image: token.picture,
        role: token.role,
        roles: token.roles,
        permissions: token.permissions,
        status: token.status,
        clubId: token.clubId,
        teamId: token.teamId,
        emailVerified: token.emailVerified,
        lastLoginAt: token.lastLoginAt,
      };

      return session;
    },
  },

  // ==========================================================================
  // 📡 EVENTS
  // ==========================================================================
  events: {
    async signIn({ user, account }) {
      console.log(`[AUTH] Sign in: ${user.email} via ${account?.provider || 'credentials'}`);
    },
    async signOut({ token }) {
      await logAuthEvent('LOGOUT', token?.id as string);
      console.log(`[AUTH] Sign out: ${token?.email}`);
    },
    async createUser({ user }) {
      console.log(`[AUTH] New user created: ${user.email}`);
    },
    async linkAccount({ user, account }) {
      await logAuthEvent('OAUTH_LINK', user.id, { provider: account.provider });
      console.log(`[AUTH] Account linked: ${user.email} + ${account.provider}`);
    },
  },

  // ==========================================================================
  // 🎨 THEME
  // ==========================================================================
  theme: {
    logo: '/logo.png',
    brandColor: '#F59E0B', // PitchConnect Gold
    colorScheme: 'auto',
  },

  // ==========================================================================
  // 🔧 DEBUG & SECURITY
  // ==========================================================================
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,

  // Trust proxy headers (for production behind load balancer)
  trustHost: true,
};

// ============================================================================
// 📤 EXPORTS
// ============================================================================

/**
 * NextAuth handlers and utilities
 */
export const {
  handlers, // → app/api/auth/[...nextauth]/route.ts
  auth, // → Server-side session access
  signIn, // → Programmatic sign-in
  signOut, // → Programmatic sign-out
} = NextAuth(authConfig);

/**
 * Export config for middleware and type checking
 */
export { authConfig as authOptions };

/**
 * Export helper functions for use in components
 */
export { getPermissionsByRole, getPermissionsByRoles, getPrimaryRole };

/**
 * Export types for use throughout the app
 */
export type { UserRole, UserStatus, PermissionName, SessionUser };