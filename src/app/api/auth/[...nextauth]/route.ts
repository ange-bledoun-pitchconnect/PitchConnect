/**
 * NextAuth Configuration & Route Handler
 * Authentication with credentials and OAuth providers
 */

import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import { getServerSession } from 'next-auth/next';
import NextAuth from 'next-auth';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials Provider (Email/Password)
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
            include: {
              userRoles: {
                select: { roleName: true },
              },
            },
          });

          if (!user) {
            throw new Error('Invalid email or password');
          }

          // Check if password exists before comparing
          if (!user.password) {
            throw new Error('Invalid email or password');
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            throw new Error('Invalid email or password');
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            isSuperAdmin: user.isSuperAdmin,
            roles: user.userRoles.map((ur) => ur.roleName),
          };
        } catch (error) {
          console.error('[NextAuth] Credentials error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env['GOOGLE_CLIENT_ID'] || '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] || '',
      allowDangerousEmailAccountLinking: true,
    }),

    // GitHub OAuth
    GithubProvider({
      clientId: process.env['GITHUB_CLIENT_ID'] || '',
      clientSecret: process.env['GITHUB_CLIENT_SECRET'] || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // 🔧 FIXED: On first login, get full user data including userRoles
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isSuperAdmin: true,
            userRoles: {
              select: { roleName: true },
            },
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = `${dbUser.firstName} ${dbUser.lastName}`;
          token.isSuperAdmin = dbUser.isSuperAdmin;
          token.roles = dbUser.userRoles.map((ur) => ur.roleName);
          // Set userType to first role or PLAYER as default
          token.userType = dbUser.userRoles[0]?.roleName || 'PLAYER';
        }
      }

      // 🔧 FIXED: For OAuth providers, ensure roles are fetched
      if (account?.provider && !user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: {
            id: true,
            isSuperAdmin: true,
            userRoles: {
              select: { roleName: true },
            },
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.isSuperAdmin = dbUser.isSuperAdmin;
          token.roles = dbUser.userRoles.map((ur) => ur.roleName);
          token.userType = dbUser.userRoles[0]?.roleName || 'PLAYER';
        }
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.roles = (token.roles as string[]) || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).userType = token.userType;
      }
      return session;
    },

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
            },
          });

          // 🔧 FIXED: Add default PLAYER role using UserRole_User table
          await prisma.userRole_User.create({
            data: {
              userId: existingUser.id,
              roleName: 'PLAYER',
            },
          });

          // Create player profile with ALL required fields
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

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env['NEXTAUTH_SECRET'] || 'fallback-secret-change-in-production',
};

// Export NextAuth handler
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export const getServerSessionWithAuth = () => getServerSession(authOptions);
