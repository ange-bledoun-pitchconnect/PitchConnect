/**
 * ============================================================================
 * 🔐 PITCHCONNECT - NextAuth Configuration (v4)
 * Path: src/auth.ts
 * ============================================================================
 * 
 * FIXED: 
 * - roles is a String[] scalar on User, NOT a relation - no include needed
 * - newUser redirects to dashboard, not onboarding
 * 
 * ============================================================================
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// ============================================================================
// AUTH OPTIONS
// ============================================================================

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  
  providers: [
    // Email/Password Authentication
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] Login attempt for:', credentials?.email);
        
        try {
          // Validate input
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials');
            throw new Error('Email and password are required');
          }

          // Find user - NO include needed, roles is a scalar String[]
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });

          console.log('[AUTH] User found:', !!user);

          if (!user) {
            console.log('[AUTH] No user found with email:', credentials.email);
            throw new Error('Invalid email or password');
          }

          // Check if user has a password (not OAuth-only)
          if (!user.password) {
            console.log('[AUTH] User has no password (OAuth account)');
            throw new Error('Please sign in with Google instead');
          }

          // Verify password
          console.log('[AUTH] Comparing passwords...');
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('[AUTH] Password valid:', isValidPassword);

          if (!isValidPassword) {
            console.log('[AUTH] Invalid password for:', credentials.email);
            throw new Error('Invalid email or password');
          }

          // roles is already a String[] on the user object
          const roleNames = user.roles || [];

          console.log('[AUTH] Login successful for:', credentials.email, 'Roles:', roleNames);

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : (user.displayName || user.email),
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.avatar,
            roles: roleNames,
          };
        } catch (error) {
          console.error('[AUTH] Authorization error:', error);
          throw new Error('Invalid email or password');
        }
      },
    }),

    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    // Redirect new users to dashboard (smart router handles role-based redirect)
    newUser: '/dashboard',
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.roles = (user as any).roles || [];
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token.firstName = session.firstName ?? token.firstName;
        token.lastName = session.lastName ?? token.lastName;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string | null;
        session.user.lastName = token.lastName as string | null;
        session.user.roles = (token.roles as string[]) || [];
      }
      return session;
    },

    async signIn({ user, account }) {
      console.log('[AUTH] signIn callback:', { provider: account?.provider, email: user.email });
      return true;
    },

    async redirect({ url, baseUrl }) {
      console.log('[AUTH] redirect callback:', { url, baseUrl });
      
      // If url is relative, prefix with baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // If url is on same origin, allow
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default to dashboard (smart router handles role-based redirect)
      return `${baseUrl}/dashboard`;
    },
  },

  events: {
    async signIn({ user }) {
      console.log('[AUTH] signIn event for:', user.email);
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch (e) {
        console.log('[AUTH] Could not update lastLoginAt');
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// TYPE EXTENSIONS
// ============================================================================

declare module 'next-auth' {
  interface User {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    roles?: string[];
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      roles: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    roles: string[];
  }
}