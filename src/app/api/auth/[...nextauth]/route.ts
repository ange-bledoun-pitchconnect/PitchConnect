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

          // FIX: Check if password exists before comparing
          if (!user.password) {
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
    async jwt({ token, user, account }) {
      if (user) {
        // On first login, get full user data including roles
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            roles: true,
            status: true,
          },
        });

        if (dbUser) {
          token['id'] = dbUser.id;
          token['email'] = dbUser.email;
          token['name'] = `${dbUser.firstName} ${dbUser.lastName}`;
          token['roles'] = dbUser.roles;
          token['userType'] = dbUser.roles?.[0] || 'PLAYER';
        }
      }

      // For OAuth providers, ensure roles are set
      if (account?.provider && !user) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string },
          select: {
            id: true,
            roles: true,
          },
        });

        if (dbUser) {
          token['id'] = dbUser.id;
          token['roles'] = dbUser.roles;
          token['userType'] = dbUser.roles?.[0] || 'PLAYER';
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token['id'];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).roles = token['roles'];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).userType = token['userType'];
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
          // Safe profile access with type assertion
          const profileData = profile as Record<string, unknown>;
          
          // Create new user from OAuth
          existingUser = await db.user.create({
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
              roles: ['PLAYER'], // Default to PLAYER role
              status: 'ACTIVE',
              emailVerified: new Date(),
            },
          });

          // Create player profile automatically with ALL required fields
          await db.player.create({
            data: {
              userId: existingUser.id,
              firstName: existingUser.firstName,
              lastName: existingUser.lastName,
              dateOfBirth: new Date('2000-01-01'), // Default - user can update
              nationality: 'Not Specified', // Default - user can update
              position: 'MIDFIELDER', // Default position
              preferredFoot: 'RIGHT', // Default preferred foot
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

  // FIX: Provide fallback for secret to satisfy TypeScript strict mode
  secret: process.env['NEXTAUTH_SECRET'] || 'fallback-secret-change-in-production',
};

// Export NextAuth handler
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export const getServerSessionWithAuth = () => getServerSession(authOptions);
