// ============================================================================
// FILE: src/app/api/auth/[...nextauth].ts
// ============================================================================
// Complete NextAuth Configuration

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { verifyPassword, sanitizeEmail } from '@/lib/auth';
import type { JWT } from 'next-auth/jwt';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update once per day
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const email = sanitizeEmail(credentials.email);
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            userRoles: true,
            subscription: true,
          },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        if (!user.password) {
          throw new Error('This account uses social login');
        }

        const passwordValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!passwordValid) {
          throw new Error('Invalid password');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.roles?.[0] || 'PLAYER',
          roles: user.roles || [],
          isSuperAdmin: user.isSuperAdmin,
          subscriptionTier: user.subscription?.tier || 'FREE',
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role || 'PLAYER';
        token.roles = (user as any).roles || [];
        token.isSuperAdmin = (user as any).isSuperAdmin || false;
        token.subscriptionTier = (user as any).subscriptionTier || 'FREE';
        token.status = (user as any).status || 'ACTIVE';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.roles = token.roles;
        session.user.isSuperAdmin = token.isSuperAdmin;
        session.user.subscriptionTier = token.subscriptionTier;
        session.user.status = token.status;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };