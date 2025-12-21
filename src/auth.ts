/**
 * 🌟 PITCHCONNECT - NextAuth v5 Auth Instance
 * Path: /src/auth.ts
 */

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth';

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
