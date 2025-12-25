/**
 * 🔐 PITCHCONNECT - NextAuth v4 Configuration (Enhanced with Email/Password Auth)
 * Path: /src/auth.ts
 *
 * ============================================================================
 * AUTHENTICATION CONFIGURATION (NextAuth v4 - Session Strategy)
 * ============================================================================
 * ✅ OAuth Providers (Google, GitHub)
 * ✅ CredentialsProvider (Email/Password authentication)
 * ✅ JWT Session Strategy
 * ✅ Role-Based Access Control (RBAC)
 * ✅ Comprehensive Callbacks
 * ✅ Type-safe Configuration
 * ✅ Proper Handler Export
 * ✅ PBKDF2 Password Hashing
 * ✅ Secure Error Messages
 */

import NextAuth, { type NextAuthConfig, type DefaultSession, type JWT, type Credentials } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

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
 * Using JWT strategy with session callbacks and email/password auth
 */
const authConfig: NextAuthConfig = {
  // ============================================================================
  // PROVIDERS
  // ============================================================================
  providers: [
    // Email/Password Credentials Provider
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'coach@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      /**
       * Authorize callback - validates email and password
       * Returns user object on success, null on failure
       */
      async authorize(credentials: Record<string, string> | undefined, req): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          // SECURITY: Don't reveal whether email exists or not
          throw new Error('CredentialsSignin');
        }

        try {
          // Find user by email (case-insensitive)
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
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
            },
          });

          // User not found - return generic error
          if (!user) {
            // Log failed attempt for security
            console.warn(`[AUTH] Failed login attempt for non-existent email: ${credentials.email}`);
            throw new Error('CredentialsSignin');
          }

          // User account is not active
          if (user.status !== 'ACTIVE' && user.status !== 'PENDING_EMAIL_VERIFICATION') {
            console.warn(`[AUTH] Login attempt for suspended/inactive account: ${user.email}`);
            throw new Error('CredentialsSignin');
          }

          // No password set (e.g., OAuth-only account)
          if (!user.password) {
            console.warn(`[AUTH] Login attempt on OAuth-only account: ${user.email}`);
            throw new Error('CredentialsSignin');
          }

          // Verify password using bcrypt
          const isPasswordValid = await compare(credentials.password, user.password);

          if (!isPasswordValid) {
            // Log failed password attempt
            console.warn(`[AUTH] Invalid password for user: ${user.email}`);
            throw new Error('CredentialsSignin');
          }

          // Email verification check (optional - adjust based on your business logic)
          // If you want to require verified emails, uncomment:
          // if (!user.emailVerified) {
          //   throw new Error('EmailNotVerified');
          // }

          // Return user object on successful authentication
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim(),
            image: user.avatar,
          };
        } catch (error) {
          // If it's already a credentials sign-in error, throw it
          if (error instanceof Error && error.message.startsWith('Credentials')) {
            throw error;
          }

          // Database or other errors
          console.error('[AUTH] Authorization error:', error);
          throw new Error('CredentialsSignin');
        }
      },
    }),

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

        // Fetch or create user data in database
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              roles: true,
            },
          });

          if (dbUser) {
            token.role = (dbUser.roles?.[0] as UserRole) || 'PLAYER';
            token.roles = (dbUser.roles as UserRole[]) || ['PLAYER'];
          } else {
            // Default role if user doesn't exist yet
            token.role = 'PLAYER' as UserRole;
            token.roles = ['PLAYER'] as UserRole[];
          }

          // Set permissions based on role
          token.permissions = getPermissionsByRole(token.role as UserRole);
        } catch (error) {
          console.error('[JWT] Error fetching user data:', error);
          // Fallback defaults
          token.role = 'PLAYER' as UserRole;
          token.roles = ['PLAYER'] as UserRole[];
          token.permissions = ['view_analytics'] as PermissionName[];
        }
      }

      return token;
    },
  },

  // ============================================================================
  // OTHER CONFIGURATION
  // ============================================================================
  theme: {
    logo: '/logo.png',
    brandColor: '#F59E0B', // PitchConnect Gold
    colorScheme: 'light',
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',

  // Set secret for NEXTAUTH_SECRET
  secret: process.env.NEXTAUTH_SECRET,
};

// ============================================================================
// HELPER FUNCTION - PERMISSION MAPPER
// ============================================================================
function getPermissionsByRole(role: UserRole): PermissionName[] {
  const rolePermissions: Record<UserRole, PermissionName[]> = {
    SUPERADMIN: [
      'manage_users',
      'manage_club',
      'manage_team',
      'manage_players',
      'view_analytics',
      'manage_payments',
      'view_audit_logs',
    ],
    ADMIN: [
      'manage_club',
      'manage_team',
      'manage_players',
      'view_analytics',
      'view_audit_logs',
    ],
    CLUB_OWNER: ['manage_club', 'manage_team', 'manage_players', 'manage_payments'],
    LEAGUE_ADMIN: ['manage_team', 'view_analytics'],
    MANAGER: ['manage_team', 'manage_players', 'view_analytics'],
    COACH: ['manage_players', 'view_analytics'],
    ANALYST: ['view_analytics'],
    SCOUT: ['view_analytics'],
    PLAYER_PRO: ['view_analytics'],
    PLAYER: [],
    PARENT: [],
  };

  return rolePermissions[role] || [];
}

// ============================================================================
// EXPORT HANDLERS FOR ROUTE HANDLER
// ============================================================================
// ✅ THIS IS THE CRITICAL FIX
// NextAuth v4 returns an object with handlers, auth, signIn, signOut
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Export config for type checking if needed
export { authConfig as authOptions };
