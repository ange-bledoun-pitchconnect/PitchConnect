/**
 * 🔐 PITCHCONNECT - NextAuth v4 Configuration (Session-Based)
 * Path: /src/auth.ts
 *
 * ============================================================================
 * AUTHENTICATION CONFIGURATION (NextAuth v4 - Session Strategy)
 * ============================================================================
 * ✅ OAuth Providers (Google, GitHub)
 * ✅ JWT Session Strategy
 * ✅ Role-Based Access Control (RBAC)
 * ✅ Comprehensive Callbacks
 * ✅ Type-safe Configuration
 * ✅ Proper Handler Export
 */

import NextAuth, { type NextAuthConfig, type DefaultSession, type JWT } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaClient } from '@prisma/client';

// ============================================================================
// DATABASE CONNECTION
// ============================================================================
const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

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
  | 'PARENT';

export type PermissionName = 
  | 'manage_users' 
  | 'manage_club' 
  | 'manage_team' 
  | 'manage_players'
  | 'view_analytics' 
  | 'manage_payments' 
  | 'view_audit_logs';

/**
 * Extend Session type for NextAuth v4
 * This allows type-safe access to custom session properties
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: DefaultSession['user'] & {
      id: string;
      role: UserRole;
      roles: UserRole[];
      permissions: PermissionName[];
      clubId?: string;
      teamId?: string;
    };
  }
  
  interface JWT {
    id?: string;
    role?: UserRole;
    roles?: UserRole[];
    permissions?: PermissionName[];
    clubId?: string;
    teamId?: string;
  }
}

/**
 * 🔐 NextAuth v4 Configuration
 * Using JWT strategy with session callbacks
 */
const authConfig: NextAuthConfig = {
  // ============================================================================
  // PROVIDERS
  // ============================================================================
  providers: [
    // Google OAuth Provider - only if credentials are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    // GitHub OAuth Provider - only if credentials are set
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

  // ============================================================================
  // SESSION CONFIGURATION
  // ============================================================================
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // update session token every 24 hours
  },

  // ============================================================================
  // JWT CONFIGURATION
  // ============================================================================
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ============================================================================
  // PAGES
  // ============================================================================
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  // ============================================================================
  // CALLBACKS
  // ============================================================================
  callbacks: {
    /**
     * 🔗 SignIn Callback
     * Called when user signs in.
     * Returning true allows sign in, false denies it.
     */
    async signIn({ user, account, profile }) {
      // Allow all users with valid email for now
      // TODO: Add email domain restrictions or database checks
      if (!user.email) {
        return false;
      }
      return true;
    },

    /**
     * 🔄 Redirect Callback
     * Called when user is redirected after sign in/out.
     */
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },

    /**
     * 🎫 Session Callback
     * Called whenever session is checked.
     * In NextAuth v4, this adds custom data to the session.
     */
    async session({ session, token }) {
      if (session.user) {
        // Add custom fields to session from JWT token
        session.user.id = token.sub || (token.id as string) || '';
        session.user.role = (token.role as UserRole) || 'PLAYER';
        session.user.roles = (token.roles as UserRole[]) || ['PLAYER'];
        session.user.permissions = (token.permissions as PermissionName[]) || [];
        session.user.clubId = token.clubId as string | undefined;
        session.user.teamId = token.teamId as string | undefined;
      }
      return session;
    },

    /**
     * 🎟️ JWT Callback
     * Called whenever JWT is created or updated.
     * In NextAuth v4 with JWT strategy, this is called on sign in and updates.
     */
    async jwt({ token, user, account }) {
      // When user first signs in, populate token with user data
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        // ⚠️ MOCK DATA - TODO: Replace with real database calls
        // Example: const dbUser = await prisma.user.findUnique({ where: { email: user.email }});
        token.role = 'COACH' as UserRole; // Default role for now
        token.roles = ['COACH', 'PLAYER'] as UserRole[];
        token.permissions = ['manage_players', 'manage_team'] as PermissionName[];
        token.clubId = 'club_123';
      }

      return token;
    },
  },

  // ============================================================================
  // OTHER CONFIGURATION
  // ============================================================================
  theme: {
    logo: '/logo.png',
    brandColor: '#00B96B', // PitchConnect Green
    colorScheme: 'light',
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',

  // Set secret for NEXTAUTH_SECRET
  secret: process.env.NEXTAUTH_SECRET,
};

// ============================================================================
// EXPORT HANDLERS FOR ROUTE HANDLER
// ============================================================================
// ✅ THIS IS THE CRITICAL FIX
// NextAuth v4 returns an object with handlers, auth, signIn, signOut
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Export config for type checking if needed
export { authConfig as authOptions };
