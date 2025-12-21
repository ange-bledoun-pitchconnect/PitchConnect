/**
 * 🌟 PITCHCONNECT - NextAuth v5 Instance
 * Path: /src/auth.ts
 *
 * ============================================================================
 * FIXED: Module resolution issue
 * ============================================================================
 * ✅ Proper import path resolution
 * ✅ Works with Next.js 15.5.9
 * ✅ Compatible with app directory structure
 *
 * ============================================================================
 * STATUS: PRODUCTION READY ⚽🏆
 * ============================================================================
 */

import NextAuth from 'next-auth';
import { authConfig } from './lib/auth-config';

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
