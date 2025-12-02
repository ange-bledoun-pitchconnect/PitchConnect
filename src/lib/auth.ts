// lib/auth.ts

import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getServerSession } from 'next-auth'; // ✅ ADD THIS IMPORT
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

// ============================================================================
// AUTH OPTIONS - Configure NextAuth settings
// ============================================================================

export const authOptions: NextAuthOptions = {
  // ====== PROVIDERS ======
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('User not found');
        }

        if (!user.password) {
          throw new Error('User has no password set');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles || [],
          isSuperAdmin: user.isSuperAdmin,
          avatar: user.avatar,
        };
      },
    }),
  ],

  // ====== CALLBACKS ======
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.isSuperAdmin = user.isSuperAdmin;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.avatar = user.avatar;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.avatar = token.avatar as string | null;
      }
      return session;
    },
  },

  // ====== PAGES ======
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  // ====== SESSION CONFIG ======
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // ====== JWT CONFIG ======
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ====== SECRET ======
  secret: process.env.NEXTAUTH_SECRET,

  // ====== DEBUG ======
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// HELPER FUNCTIONS - Middleware utilities for API routes
// ============================================================================

/**
 * Verify if user is SuperAdmin in API routes
 */
export async function verifySuperAdmin(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isSuperAdmin) {
    return null;
  }
  
  return session;
}

/**
 * Verify if user has specific role
 */
export async function verifyRole(request: Request, requiredRole: string) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user?.roles as string[]) || [];
  
  if (!roles.includes(requiredRole) && !session?.user?.isSuperAdmin) {
    return null;
  }
  
  return session;
}

// ============================================================================
// TYPE EXTENSIONS - Extend NextAuth types with custom fields
// ============================================================================

declare module 'next-auth' {
  interface User {
    id: string;
    roles: string[];
    isSuperAdmin: boolean;
    firstName: string;
    lastName: string;
    avatar: string | null;
  }

  interface Session {
    user: User & {
      email: string;
      name: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    roles: string[];
    isSuperAdmin: boolean;
    firstName: string;
    lastName: string;
    avatar: string | null;
  }
}
