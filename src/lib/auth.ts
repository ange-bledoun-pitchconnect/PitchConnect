import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// ============================================================================
// NEXTAUTH CONFIGURATION
// ============================================================================

export const authOptions: NextAuthOptions = {
  providers: [
    // ========================================================================
    // Credentials Provider (Email/Password)
    // ========================================================================
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              password: true,
              isSuperAdmin: true,
              roles: true, // ✅ FIXED: Get roles array directly from User model
            },
          });

          if (!user) {
            throw new Error('Invalid email or password');
          }

          // Check if password exists before comparing
          if (!user.password) {
            throw new Error('Invalid email or password');
          }

          // Verify password with bcrypt
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            throw new Error('Invalid email or password');
          }

          // Update last login timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          // Return user object with all required fields
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            isSuperAdmin: user.isSuperAdmin,
            roles: user.roles, // ✅ FIXED: Use roles array directly
          };
        } catch (error) {
          console.error('[NextAuth] Credentials error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),

    // ========================================================================
    // Google OAuth Provider
    // ========================================================================
    GoogleProvider({
      clientId: process.env['GOOGLE_CLIENT_ID'] || '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] || '',
      allowDangerousEmailAccountLinking: true,
    }),

    // ========================================================================
    // GitHub OAuth Provider
    // ========================================================================
    GithubProvider({
      clientId: process.env['GITHUB_CLIENT_ID'] || '',
      clientSecret: process.env['GITHUB_CLIENT_SECRET'] || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  // ============================================================================
  // Pages
  // ============================================================================
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  // ============================================================================
  // Callbacks
  // ============================================================================
  callbacks: {
    /**
     * JWT Callback
     * Called whenever JWT is created or updated
     * Adds custom claims to token
     */
    async jwt({ token, user, account, trigger, session }) {
      // On first login, fetch full user data including roles
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isSuperAdmin: true,
            roles: true, // ✅ FIXED: Use roles array directly
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.name = `${dbUser.firstName} ${dbUser.lastName}`;
          token.isSuperAdmin = dbUser.isSuperAdmin;
          token.roles = dbUser.roles || []; // ✅ FIXED: Use roles array
          // Set userType to first role or PLAYER as default
          token.userType = dbUser.roles?.[0] || 'PLAYER';
        }
      }

      // For OAuth providers, ensure roles are fetched
      if (account?.provider && !user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isSuperAdmin: true,
            roles: true, // ✅ FIXED: Use roles array directly
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.isSuperAdmin = dbUser.isSuperAdmin;
          token.roles = dbUser.roles || []; // ✅ FIXED: Use roles array
          token.userType = dbUser.roles?.[0] || 'PLAYER';
        }
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    /**
     * Session Callback
     * Called whenever session is accessed
     * Returns data available to client
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.roles = (token.roles as string[]) || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).userType = token.userType;
      }
      return session;
    },

    /**
     * SignIn Callback
     * Called on sign in
     * Handles OAuth provider first logins
     */
    async signIn({ user, account, profile }) {
      // Handle OAuth provider first logins
      if (account && profile) {
        let existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          const profileData = profile as Record<string, unknown>;

          // Create new user from OAuth
          existingUser = await prisma.user.create({
            data: {
              email: user.email!,
              firstName:
                (profileData['given_name'] as string) ||
                user.name?.split(' ')[0] ||
                'User',
              lastName:
                (profileData['family_name'] as string) ||
                user.name?.split(' ')[1] ||
                '',
              password: '', // OAuth users don't have passwords
              status: 'ACTIVE',
              emailVerified: new Date(),
              roles: ['PLAYER'], // ✅ FIXED: Add default PLAYER role to array
            },
          });

          // Create player profile with all required fields
          await prisma.player.create({
            data: {
              userId: existingUser.id,
              firstName: existingUser.firstName,
              lastName: existingUser.lastName,
              dateOfBirth: new Date('2000-01-01'),
              nationality: 'Not Specified',
              position: 'MIDFIELDER',
              preferredFoot: 'RIGHT',
              status: 'ACTIVE',
            },
          });
        }
      }

      return true;
    },
  },

  // ============================================================================
  // Session Configuration
  // ============================================================================
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ============================================================================
  // JWT Secret
  // ============================================================================
  secret: process.env['NEXTAUTH_SECRET'] || 'fallback-secret-change-in-production',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user is a SuperAdmin
 * @param email - User's email address
 * @returns boolean - true if user is SuperAdmin
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        isSuperAdmin: true,
        roles: true, // ✅ FIXED: Use roles array
      },
    });

    if (!user) {
      return false;
    }

    // Check if user has isSuperAdmin flag OR has SUPERADMIN role
    const hasSuperAdminRole = user.roles?.includes('SUPERADMIN');

    return user.isSuperAdmin || hasSuperAdminRole || false;
  } catch (error) {
    console.error('isSuperAdmin check error:', error);
    return false;
  }
}

/**
 * Check if a user has a specific role
 * @param email - User's email address
 * @param role - Role to check for
 * @returns boolean - true if user has the role
 */
export async function hasRole(email: string, role: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        roles: true, // ✅ FIXED: Use roles array
      },
    });

    if (!user) {
      return false;
    }

    return user.roles?.includes(role) || false;
  } catch (error) {
    console.error('hasRole check error:', error);
    return false;
  }
}

/**
 * Get all roles for a user
 * @param email - User's email address
 * @returns string[] - Array of role names
 */
export async function getUserRoles(email: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        roles: true, // ✅ FIXED: Use roles array
      },
    });

    if (!user) {
      return [];
    }

    return user.roles || [];
  } catch (error) {
    console.error('getUserRoles error:', error);
    return [];
  }
}
