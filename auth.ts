/**
 * 🌟 PITCHCONNECT - NextAuth v5 Configuration
 * Path: /auth.ts
 *
 * ============================================================================
 * AUTHENTICATION CONFIGURATION
 * ============================================================================
 * ✅ OAuth Providers (Google, GitHub)
 * ✅ JWT Session Strategy (Edge-compatible)
 * ✅ Role-Based Access Control (RBAC) Data Sync
 * ✅ Comprehensive Callbacks
 * ✅ Type-safe Configuration
 */

import NextAuth from 'next-auth';
import { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import type { NextAuthConfig } from 'next-auth';

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

// Extend built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      roles: UserRole[];
      permissions: PermissionName[];
      clubId?: string;
      teamId?: string;
    } & DefaultSession['user'];
  }
}

// Extend built-in JWT types
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    roles: UserRole[];
    permissions: PermissionName[];
    clubId?: string;
    teamId?: string;
  }
}

/**
 * 🔐 Main Authentication Configuration
 */
export const config = {
  theme: {
    logo: '/logo.png', // Add your logo path
    brandColor: '#00B96B', // PitchConnect Green
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    /**
     * 🎟️ JWT Callback
     * Called whenever a JSON Web Token is created or updated.
     * This is where we persist user role/data into the token.
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign in - populate token with user data
        token.id = user.id as string;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        // ⚠️ MOCK DATA - REPLACE WITH REAL DB CALLS LATER
        // Example: const dbUser = await db.user.findUnique({ where: { email: user.email }})
        token.role = 'COACH'; // Default role for now
        token.roles = ['COACH', 'PLAYER'];
        token.permissions = ['manage_players', 'manage_team'];
        token.clubId = 'club_123';
      }

      // Handle session updates (e.g. when user updates profile)
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    /**
     * 🎫 Session Callback
     * Called whenever a session is checked.
     * Passes data from the JWT token to the client.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.roles = token.roles;
        session.user.permissions = token.permissions;
        session.user.clubId = token.clubId;
        session.user.teamId = token.teamId;
      }
      return session;
    },

    /**
     * 🛡️ SignIn Callback
     * Control who can sign in.
     */
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      return true;
    },
  },
  pages: {
    signIn: '/auth/login', // Custom login page
    error: '/auth/error',   // Custom error page
    verifyRequest: '/auth/verify', // Email verification page
  },
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;

// Export NextAuth handler
export const { handlers, auth, signIn, signOut } = NextAuth(config);
