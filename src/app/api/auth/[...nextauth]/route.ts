/**
 * ============================================================================
 * 🔐 PITCHCONNECT - NextAuth API Route (v4)
 * Path: src/app/api/auth/[...nextauth]/route.ts
 * ============================================================================
 * 
 * This route handler processes all NextAuth authentication requests.
 * It handles sign in, sign out, callbacks, and session management.
 * 
 * ============================================================================
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/auth';

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Export GET and POST handlers for Next.js App Router
export { handler as GET, handler as POST };

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';