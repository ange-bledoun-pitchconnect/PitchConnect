/**
 * 🌟 PITCHCONNECT - NextAuth v5 Configuration
 * Path: /src/auth.ts (CORRECT LOCATION)
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

import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

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
 * NextAuth v5 with App Router
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // ============================================================================
  // PROVIDERS
  // ============================================================================
  providers: [
    // Google OAuth Provider
    ...(process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
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
          GitHub({
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
  // NextAuth v5 uses JWT by default
  // No need to specify strategy - it's implicit
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // update session token every 24 hours
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
     * 🎟️ JWT Callback
     * Called whenever a JSON Web Token is created or updated.
     * Runs on the server-side.
     */
    async jwt({ token, user, trigger, session }) {
      // When user first signs in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        // ⚠️ MOCK DATA - TODO: Replace with real database calls
        // Example: const dbUser = await db.user.findUnique({ where: { email: user.email }});
        token.role = 'COACH' as UserRole; // Default role
        token.roles = ['COACH', 'PLAYER'] as UserRole[];
        token.permissions = ['manage_players', 'manage_team'] as PermissionName[];
        token.clubId = 'club_123';
      }

      // Handle session updates (e.g., user updates profile)
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    /**
     * 🎫 Session Callback
     * Called whenever a session is checked.
     * Runs on the server-side.
     * Passes data from JWT to the session object.
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
     * Control whether a user is allowed to sign in.
     * Return true to allow, false to deny.
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
     * 🔗 Redirect Callback
     * Control where users are redirected after sign in/out
     */
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // ============================================================================
  // OTHER CONFIGURATION
  // ============================================================================
  theme: {
    logo: '/logo.png',
    brandColor: '#00B96B', // PitchConnect Green
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
});
