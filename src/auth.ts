/**
 * 🌟 PITCHCONNECT - NextAuth v4 Configuration
 * Path: /src/auth.ts
 *
 * ============================================================================
 * AUTHENTICATION CONFIGURATION (NextAuth v4)
 * ============================================================================
 * ✅ OAuth Providers (Google, GitHub)
 * ✅ JWT Session Strategy
 * ✅ Role-Based Access Control (RBAC)
 * ✅ Comprehensive Callbacks
 * ✅ Type-safe Configuration
 */

import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define User Roles type
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

// Define Permissions type
export type PermissionName = 
  | 'manage_users' | 'manage_club' | 'manage_team' | 'manage_players'
  | 'view_analytics' | 'manage_payments' | 'view_audit_logs';

/**
 * 🔐 NextAuth v4 Configuration
 * Proper configuration for NextAuth v4.24.11
 */
export const authOptions: NextAuthOptions = {
  // ============================================================================
  // ADAPTER
  // ============================================================================
  adapter: PrismaAdapter(prisma),

  // ============================================================================
  // PROVIDERS
  // ============================================================================
  providers: [
    // Google OAuth Provider
    ...(process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    // GitHub OAuth Provider
    ...(process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET
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
  // In NextAuth v4, use session.strategy
  session: {
    strategy: 'jwt', // Use JWT strategy
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
        // Add custom fields to session
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role || 'PLAYER';
        (session.user as any).roles = token.roles || ['PLAYER'];
        (session.user as any).permissions = token.permissions || [];
        (session.user as any).clubId = token.clubId;
      }
      return session;
    },

    /**
     * 🎟️ JWT Callback
     * Called whenever JWT is created or updated.
     * In NextAuth v4 with JWT strategy, this is called on sign in.
     */
    async jwt({ token, user, account }) {
      // When user first signs in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        // ⚠️ MOCK DATA - TODO: Replace with real database calls
        // Example: const dbUser = await prisma.user.findUnique({ where: { email: user.email }});
        token.role = 'COACH' as UserRole; // Default role
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

// Export handler, sign in, sign out
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
