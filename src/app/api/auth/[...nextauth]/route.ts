/**
 * NextAuth Configuration
 * Authentication with credentials and OAuth providers
 */

import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';

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
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error('Invalid email or password');
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            throw new Error('Invalid email or password');
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
          };
        } catch (error) {
          console.error('[NextAuth] Credentials error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),

    // GitHub OAuth
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // On first login, get full user data including userType
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            userType: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = `${dbUser.firstName} ${dbUser.lastName}`;
          token.userType = dbUser.userType; // Store userType in JWT
        }
      }

      // For OAuth providers, ensure userType is set
      if (account?.provider && !user) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string },
          select: {
            id: true,
            userType: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.userType = dbUser.userType;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).userType = token.userType; // Pass userType to session
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // Handle OAuth provider first logins
      if (account && profile) {
        let existingUser = await db.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Create new user from OAuth
          existingUser = await db.user.create({
            data: {
              email: user.email!,
              firstName: profile.given_name || user.name?.split(' ')[0] || 'User',
              lastName: profile.family_name || user.name?.split(' ')[1] || '',
              password: '', // OAuth users don't have passwords
              userType: 'PLAYER', // Default to PLAYER for OAuth users
              status: 'ACTIVE',
              emailVerified: new Date(),
            },
          });

          // Create player profile automatically
          await db.player.create({
            data: {
              userId: existingUser.id,
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

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export const getServerSessionWithAuth = () => getServerSession(authOptions);
