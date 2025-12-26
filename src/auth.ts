/**
 * 🔐 PITCHCONNECT - NextAuth v4 Configuration (Enhanced with Email/Password Auth)
 * Path: /src/auth.ts
 *
 * ============================================================================
 * AUTHENTICATION CONFIGURATION (NextAuth v4 - JWT Session Strategy)
 * ============================================================================
 * ✅ CredentialsProvider (Email/Password authentication)
 * ✅ OAuth Providers (Google, GitHub)
 * ✅ JWT Session Strategy with RBAC
 * ✅ Real Database Integration (Prisma)
 * ✅ Role-Based Access Control (RBAC)
 * ✅ Comprehensive Callbacks & Security Logging
 * ✅ Type-safe Configuration
 * ✅ Proper Handler Exports
 */


import NextAuth, { 
  type NextAuthConfig, 
  type DefaultSession, 
  type JWT 
} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { compare } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';


// ============================================================================
// DATABASE CONNECTION
// ============================================================================
const prisma = new PrismaClient();


// ============================================================================
// TYPE DEFINITIONS
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
 * Extend NextAuth Session type
 * Allows type-safe access to custom user properties
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
      status: 'ACTIVE' | 'PENDING_EMAIL_VERIFICATION' | 'SUSPENDED' | 'INACTIVE';
    };
  }
  
  interface JWT {
    id?: string;
    role?: UserRole;
    roles?: UserRole[];
    permissions?: PermissionName[];
    clubId?: string;
    teamId?: string;
    status?: 'ACTIVE' | 'PENDING_EMAIL_VERIFICATION' | 'SUSPENDED' | 'INACTIVE';
  }
}


/**
 * 🔐 NEXTAUTH V4 CONFIGURATION
 * Using JWT session strategy with comprehensive authentication
 */
const authConfig: NextAuthConfig = {
  // ============================================================================
  // PROVIDERS
  // ============================================================================
  providers: [
    // 🔐 EMAIL/PASSWORD AUTHENTICATION
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email', 
          placeholder: 'coach@pitchconnect.com' 
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        },
      },
      /**
       * Authorize function validates email and password
       * Returns user object on success, null/throws on failure
       * 
       * SECURITY:
       * - Uses generic error messages (don't reveal if email exists)
       * - Logs failed attempts for security monitoring
       * - Checks account status (ACTIVE required)
       * - Verifies password with bcryptjs
       */
      async authorize(credentials: Record<string, string> | undefined): Promise<any> {
        // Validate inputs
        if (!credentials?.email || !credentials?.password) {
          console.warn('[AUTH] Sign-in attempt with missing email or password');
          // Generic error - don't reveal what's missing
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


          // User not found - use generic error for security
          if (!user) {
            console.warn(
              `[AUTH] Failed login attempt: user not found (${credentials.email})`
            );
            throw new Error('CredentialsSignin');
          }


          // Check account status
          if (user.status !== 'ACTIVE' && user.status !== 'PENDING_EMAIL_VERIFICATION') {
            console.warn(
              `[AUTH] Login attempt on inactive account: ${user.email} (status: ${user.status})`
            );
            throw new Error('CredentialsSignin');
          }


          // Check if password is set (OAuth-only accounts won't have one)
          if (!user.password) {
            console.warn(
              `[AUTH] Login attempt on OAuth-only account: ${user.email}`
            );
            throw new Error('CredentialsSignin');
          }


          // Verify password using bcryptjs
          const isPasswordValid = await compare(
            credentials.password, 
            user.password
          );


          if (!isPasswordValid) {
            console.warn(
              `[AUTH] Invalid password for user: ${user.email}`
            );
            throw new Error('CredentialsSignin');
          }


          // ✅ PASSWORD CORRECT - Check email verification if required
          // Uncomment if you want to enforce email verification:
          // if (!user.emailVerified) {
          //   console.warn(`[AUTH] Sign-in attempt by unverified user: ${user.email}`);
          //   throw new Error('EmailNotVerified');
          // }


          // ✅ AUTHENTICATION SUCCESSFUL
          console.log(`[AUTH] Successful login: ${user.email}`);
          
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim() || user.email,
            image: user.avatar,
          };
        } catch (error) {
          // Re-throw NextAuth errors
          if (error instanceof Error && error.message.startsWith('Credentials')) {
            throw error;
          }


          // Log unexpected errors
          console.error('[AUTH] Authorization error:', error);
          throw new Error('CredentialsSignin');
        }
      },
    }),


    // 🌐 GOOGLE OAUTH
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),


    // 🐙 GITHUB OAUTH
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
    updateAge: 24 * 60 * 60, // Refresh token every 24 hours
  },


  // ============================================================================
  // JWT CONFIGURATION
  // ============================================================================
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },


  // ============================================================================
  // PAGE REDIRECTS
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
     * 🔗 SIGNIN CALLBACK
     * Runs when user attempts to sign in
     * Return true to allow, false to deny
     * 
     * Use for:
     * - Email domain restrictions
     * - Account linking checks
     * - OAuth profile validation
     */
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.warn('[AUTH] Sign-in attempted without email');
        return false;
      }


      // OAuth sign-in flow
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });


          if (!existingUser) {
            // Create new user from OAuth profile
            console.log(
              `[AUTH] Creating new ${account.provider} user: ${user.email}`
            );
            
            await prisma.user.create({
              data: {
                email: user.email,
                firstName: profile?.given_name || profile?.name?.split(' ')[0] || 'User',
                lastName: profile?.family_name || profile?.name?.split(' ').slice(1).join(' ') || '',
                avatar: profile?.picture || user.image,
                roles: ['PLAYER'], // Default role for new OAuth users
                status: 'ACTIVE',
                emailVerified: new Date(), // OAuth emails are verified
              },
            });
          }
        } catch (error) {
          console.error(`[AUTH] Error processing ${account.provider} sign-in:`, error);
          return false;
        }
      }


      return true;
    },


    /**
     * 🔄 REDIRECT CALLBACK
     * Controls where user is redirected after sign in/out
     */
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to home page
      return baseUrl;
    },


    /**
     * 🎫 SESSION CALLBACK
     * Enriches session with data from JWT token
     * Called when useSession() is invoked in client components
     */
    async session({ session, token }) {
      if (session.user) {
        // Copy JWT claims to session
        session.user.id = token.id as string || token.sub || '';
        session.user.role = (token.role as UserRole) || 'PLAYER';
        session.user.roles = (token.roles as UserRole[]) || ['PLAYER'];
        session.user.permissions = (token.permissions as PermissionName[]) || [];
        session.user.clubId = token.clubId as string | undefined;
        session.user.teamId = token.teamId as string | undefined;
        session.user.status = (token.status as any) || 'ACTIVE';
      }
      return session;
    },


    /**
     * 🎟️ JWT CALLBACK
     * Creates or updates JWT token
     * Called on sign-in and session updates
     * 
     * This is where we fetch real database data
     */
    async jwt({ token, user, account }) {
      // First sign-in: populate from user object
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }


      // Fetch user data from database (for both OAuth and Credentials)
      if (token.id || token.sub) {
        try {
          const userId = token.id || token.sub;
          
          const dbUser = await prisma.user.findUnique({
            where: { id: userId as string },
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
            },
          });


          if (dbUser) {
            // Update token with database data
            token.email = dbUser.email;
            token.name = `${dbUser.firstName} ${dbUser.lastName}`.trim() || dbUser.email;
            token.picture = dbUser.avatar;
            token.status = dbUser.status;
            
            // Role & Permissions
            token.role = (dbUser.roles?.[0] as UserRole) || 'PLAYER';
            token.roles = (dbUser.roles as UserRole[]) || ['PLAYER'];
            token.permissions = getPermissionsByRole(token.role as UserRole);
            
            // Club & Team
            token.clubId = dbUser.clubId;
            token.teamId = dbUser.teamId;


            console.log(`[JWT] Token refreshed for user: ${dbUser.email}`);
          } else {
            console.warn(`[JWT] User not found for token refresh: ${userId}`);
          }
        } catch (error) {
          console.error('[JWT] Error fetching user data:', error);
          // Fallback defaults
          token.role = 'PLAYER' as UserRole;
          token.roles = ['PLAYER'] as UserRole[];
          token.permissions = [];
        }
      }


      return token;
    },
  },


  // ============================================================================
  // THEME CONFIGURATION
  // ============================================================================
  theme: {
    logo: '/logo.png',
    brandColor: '#F59E0B', // PitchConnect Gold
    colorScheme: 'light',
  },


  // ============================================================================
  // DEBUG & SECURITY
  // ============================================================================
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};


// ============================================================================
// HELPER FUNCTION: PERMISSIONS BY ROLE
// ============================================================================
/**
 * Maps each role to their allowed permissions
 * Used for frontend authorization checks
 * 
 * Backend should also validate permissions on API endpoints
 */
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
    CLUB_OWNER: [
      'manage_club',
      'manage_team',
      'manage_players',
      'manage_payments',
    ],
    LEAGUE_ADMIN: [
      'manage_team',
      'view_analytics',
    ],
    MANAGER: [
      'manage_team',
      'manage_players',
      'view_analytics',
    ],
    COACH: [
      'manage_players',
      'view_analytics',
    ],
    ANALYST: [
      'view_analytics',
    ],
    SCOUT: [
      'view_analytics',
    ],
    PLAYER_PRO: [
      'view_analytics',
    ],
    PLAYER: [],
    PARENT: [],
  };


  return rolePermissions[role] || [];
}


// ============================================================================
// EXPORTS FOR NEXTAUTH HANDLERS
// ============================================================================
/**
 * 🔐 CRITICAL EXPORTS
 * NextAuth v4 returns these from NextAuth(config)
 * 
 * - handlers: GET/POST handlers for API route
 * - auth: ServerSession function for server components
 * - signIn: Function to trigger sign-in
 * - signOut: Function to trigger sign-out
 */
export const { 
  handlers,  // Used in [...nextauth]/route.ts
  auth,      // Used in layout.tsx for getServerSession
  signIn,    // Used in client components for sign-in
  signOut    // Used in client components for sign-out
} = NextAuth(authConfig);


// Export config for type checking and reference
export { authConfig as authOptions };
