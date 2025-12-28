/**
 * ============================================================================
 * 🏆 PITCHCONNECT - NextAuth Configuration
 * Path: src/auth.ts
 * ============================================================================
 * 
 * Enterprise-grade authentication with:
 * - Credentials provider (email/password)
 * - Google OAuth provider
 * - JWT session strategy
 * - Role-based access control
 * - 2FA support
 * - Audit logging
 * 
 * Schema Alignment:
 * - UserRole: PLAYER, COACH, MANAGER, TREASURER, CLUB_OWNER, LEAGUE_ADMIN
 * - SubscriptionTier: PLAYER_FREE, PLAYER_PRO, COACH, MANAGER, LEAGUE_ADMIN
 * 
 * ============================================================================
 */

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { User, Session, Account, Profile } from 'next-auth';

// ============================================================================
// TYPES - Schema Aligned
// ============================================================================

type UserRole = 
  | 'PLAYER'
  | 'COACH'
  | 'MANAGER'
  | 'TREASURER'
  | 'CLUB_OWNER'
  | 'LEAGUE_ADMIN'
  | 'REFEREE'
  | 'SCOUT'
  | 'ANALYST';

type SubscriptionTier =
  | 'PLAYER_FREE'
  | 'PLAYER_PRO'
  | 'COACH'
  | 'MANAGER'
  | 'LEAGUE_ADMIN';

interface ExtendedUser extends User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  roles: UserRole[];
  subscriptionTier: SubscriptionTier;
  isSuperAdmin: boolean;
  twoFactorEnabled: boolean;
  emailVerified: Date | null;
  onboardingCompleted: boolean;
}

interface ExtendedJWT extends JWT {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  roles: UserRole[];
  subscriptionTier: SubscriptionTier;
  isSuperAdmin: boolean;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  onboardingCompleted: boolean;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    roles: UserRole[];
    subscriptionTier: SubscriptionTier;
    isSuperAdmin: boolean;
    twoFactorEnabled: boolean;
    emailVerified: boolean;
    onboardingCompleted: boolean;
  };
}

// ============================================================================
// MODULE AUGMENTATION
// ============================================================================

declare module 'next-auth' {
  interface Session extends ExtendedSession {}
  interface User extends ExtendedUser {}
}

declare module 'next-auth/jwt' {
  interface JWT extends ExtendedJWT {}
}

// ============================================================================
// AUTH CONFIGURATION
// ============================================================================

export const authConfig: NextAuthConfig = {
  // Prisma adapter for database sessions
  adapter: PrismaAdapter(prisma),

  // Use JWT strategy for sessions (stateless, scalable)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  // Custom pages
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/onboarding',
  },

  // Authentication providers
  providers: [
    // ========================================================================
    // GOOGLE OAUTH PROVIDER
    // ========================================================================
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
          email: profile.email,
          name: profile.name,
          firstName: profile.given_name,
          lastName: profile.family_name,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
          roles: ['PLAYER'] as UserRole[],
          subscriptionTier: 'PLAYER_FREE' as SubscriptionTier,
          isSuperAdmin: false,
          twoFactorEnabled: false,
          onboardingCompleted: false,
        };
      },
    }),

    // ========================================================================
    // CREDENTIALS PROVIDER (Email/Password)
    // ========================================================================
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials exist
          if (!credentials?.email || !credentials?.password) {
            logger.warn('Login attempt with missing credentials');
            throw new Error('CredentialsSignin');
          }

          const email = (credentials.email as string).toLowerCase().trim();
          const password = credentials.password as string;

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              firstName: true,
              lastName: true,
              image: true,
              roles: true,
              subscriptionTier: true,
              isSuperAdmin: true,
              twoFactorEnabled: true,
              emailVerified: true,
              onboardingCompleted: true,
              isActive: true,
              status: true,
            },
          });

          // User not found
          if (!user) {
            logger.warn('Login attempt for non-existent user', { email });
            throw new Error('CredentialsSignin');
          }

          // Account disabled
          if (!user.isActive || user.status === 'BANNED' || user.status === 'SUSPENDED') {
            logger.warn('Login attempt for disabled account', { email, status: user.status });
            throw new Error('AccessDenied');
          }

          // No password set (OAuth user)
          if (!user.password) {
            logger.warn('Login attempt for OAuth-only account', { email });
            throw new Error('OAuthAccountNotLinked');
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            logger.warn('Invalid password attempt', { email });
            throw new Error('CredentialsSignin');
          }

          // Check 2FA if enabled
          if (user.twoFactorEnabled) {
            const twoFactorCode = credentials.twoFactorCode as string | undefined;
            
            if (!twoFactorCode) {
              // Return partial auth - client should prompt for 2FA code
              throw new Error('TwoFactorRequired');
            }

            // Verify 2FA code (implement verification logic)
            const isValid2FA = await verify2FACode(user.id, twoFactorCode);
            if (!isValid2FA) {
              logger.warn('Invalid 2FA code', { email });
              throw new Error('InvalidTwoFactorCode');
            }
          }

          // Check email verification if required
          if (!user.emailVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
            logger.warn('Login attempt with unverified email', { email });
            throw new Error('EmailNotVerified');
          }

          // Log successful login
          logger.info('User logged in successfully', { 
            userId: user.id, 
            email: user.email,
            roles: user.roles,
          });

          // Update last login timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          // Return user object (password excluded)
          return {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            roles: user.roles as UserRole[],
            subscriptionTier: user.subscriptionTier as SubscriptionTier,
            isSuperAdmin: user.isSuperAdmin,
            twoFactorEnabled: user.twoFactorEnabled,
            emailVerified: user.emailVerified,
            onboardingCompleted: user.onboardingCompleted,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'CredentialsSignin';
          logger.error('Authorization error', error as Error);
          throw new Error(message);
        }
      },
    }),
  ],

  // ============================================================================
  // CALLBACKS
  // ============================================================================
  callbacks: {
    /**
     * Sign In Callback
     * Called after successful authentication
     */
    async signIn({ user, account, profile }) {
      try {
        // Handle OAuth sign in
        if (account?.provider === 'google') {
          const email = user.email?.toLowerCase();
          
          if (!email) {
            logger.warn('OAuth sign in without email');
            return false;
          }

          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, isActive: true, status: true },
          });

          // Block disabled accounts
          if (existingUser && (!existingUser.isActive || existingUser.status === 'BANNED')) {
            logger.warn('OAuth sign in blocked - account disabled', { email });
            return '/auth/error?error=AccessDenied';
          }

          logger.info('OAuth sign in successful', { 
            provider: account.provider, 
            email,
          });
        }

        return true;
      } catch (error) {
        logger.error('Sign in callback error', error as Error);
        return false;
      }
    },

    /**
     * JWT Callback
     * Called when JWT is created or updated
     */
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.name = user.name!;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.image = user.image;
        token.roles = user.roles || ['PLAYER'];
        token.subscriptionTier = user.subscriptionTier || 'PLAYER_FREE';
        token.isSuperAdmin = user.isSuperAdmin || false;
        token.twoFactorEnabled = user.twoFactorEnabled || false;
        token.emailVerified = !!user.emailVerified;
        token.onboardingCompleted = user.onboardingCompleted || false;
      }

      // Session update triggered (e.g., after profile update)
      if (trigger === 'update' && session) {
        return {
          ...token,
          ...session,
        };
      }

      // Refresh user data from database periodically
      if (token.id && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              roles: true,
              subscriptionTier: true,
              isSuperAdmin: true,
              twoFactorEnabled: true,
              onboardingCompleted: true,
              isActive: true,
            },
          });

          if (dbUser && dbUser.isActive) {
            token.roles = dbUser.roles as UserRole[];
            token.subscriptionTier = dbUser.subscriptionTier as SubscriptionTier;
            token.isSuperAdmin = dbUser.isSuperAdmin;
            token.twoFactorEnabled = dbUser.twoFactorEnabled;
            token.onboardingCompleted = dbUser.onboardingCompleted;
          }
        } catch (error) {
          logger.error('JWT refresh error', error as Error);
        }
      }

      return token;
    },

    /**
     * Session Callback
     * Called when session is checked
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.image = token.image as string;
        session.user.roles = token.roles as UserRole[];
        session.user.subscriptionTier = token.subscriptionTier as SubscriptionTier;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.emailVerified = token.emailVerified as boolean;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      }

      return session;
    },

    /**
     * Redirect Callback
     * Controls redirects after sign in/out
     */
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Allow same-origin URLs
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  // ============================================================================
  // EVENTS
  // ============================================================================
  events: {
    async signIn({ user, account, isNewUser }) {
      logger.info('Sign in event', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },

    async signOut({ token }) {
      logger.info('Sign out event', {
        userId: token?.id,
        email: token?.email,
      });
    },

    async createUser({ user }) {
      logger.info('User created', {
        userId: user.id,
        email: user.email,
      });
    },

    async linkAccount({ user, account }) {
      logger.info('Account linked', {
        userId: user.id,
        provider: account.provider,
      });
    },
  },

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// 2FA VERIFICATION HELPER
// ============================================================================

async function verify2FACode(userId: string, code: string): Promise<boolean> {
  try {
    const twoFactorRecord = await prisma.twoFactorAuth.findUnique({
      where: { userId },
      select: { secret: true, enabled: true },
    });

    if (!twoFactorRecord || !twoFactorRecord.enabled || !twoFactorRecord.secret) {
      return false;
    }

    // Verify TOTP code
    const isValid = await verifyTOTP(twoFactorRecord.secret, code);
    
    if (isValid) {
      // Update last used timestamp
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { lastUsedAt: new Date() },
      });
    }

    return isValid;
  } catch (error) {
    logger.error('2FA verification error', error as Error);
    return false;
  }
}

// ============================================================================
// TOTP VERIFICATION (copied from 2FA routes for standalone use)
// ============================================================================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;

function decodeBase32(input: string): Uint8Array {
  const upper = input.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < upper.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(upper[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >> bits) & 255);
    }
  }

  return new Uint8Array(output);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

async function generateTOTP(secret: string, time?: number): Promise<string> {
  const timestamp = Math.floor((time || Date.now()) / 1000 / TOTP_PERIOD);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, 0, false);
  view.setUint32(4, timestamp, false);

  const secretBytes = decodeBase32(secret);
  const hmac = await hmacSha1(secretBytes, new Uint8Array(buffer));

  const offset = hmac[19] & 0x0f;
  const value =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(value % Math.pow(10, TOTP_DIGITS)).padStart(TOTP_DIGITS, '0');
}

async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const now = Date.now();
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const testTime = now + i * TOTP_PERIOD * 1000;
    const testCode = await generateTOTP(secret, testTime);
    if (testCode === code) return true;
  }
  return false;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

export { authConfig as authOptions };

export type { ExtendedUser, ExtendedSession, ExtendedJWT, UserRole, SubscriptionTier };