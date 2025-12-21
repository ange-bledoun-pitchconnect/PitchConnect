/**
 * 🌟 PITCHCONNECT - NextAuth API Route Handler
 * Path: /src/app/api/auth/[...nextauth]/route.ts
 *
 * ============================================================================
 * NEXTAUTH V5 API ROUTE - React 19 Compatible
 * ============================================================================
 * ✅ Handles all authentication requests (sign-in, callback, sign-out)
 * ✅ GET endpoint: OAuth callbacks, session checks, sign-out
 * ✅ POST endpoint: Sign-in requests, JWT creation
 * ✅ JWT token management & refresh
 * ✅ Session validation & provider integration
 * ✅ React 19 RC compatible
 * ✅ Next.js 15.5.9 optimized
 *
 * ============================================================================
 * NEXTAUTH V5 PATTERN (NOT V4)
 * ============================================================================
 * The key difference from v4:
 * - v4: const handler = NextAuth(authOptions); export { handler as GET, handler as POST };
 * - v5: const { GET, POST } = handlers; export { GET, POST };
 *
 * ============================================================================
 * STATUS: PRODUCTION READY ⚽🏆
 * ============================================================================
 */

import { handlers } from '@/auth';

/**
 * NextAuth v5 exports named GET and POST handlers directly
 * These handle all authentication flows:
 * 
 * GET requests:
 * - /api/auth/callback/{provider} - OAuth provider callbacks
 * - /api/auth/signin - Sign-in page
 * - /api/auth/signout - Sign-out page  
 * - /api/auth/error - Error page
 * - /api/auth/session - Get current session
 * 
 * POST requests:
 * - /api/auth/signin/{provider} - Initiate sign-in
 * - /api/auth/callback/{provider} - Handle OAuth callbacks
 * - /api/auth/signout - Sign-out user
 */
export const { GET, POST } = handlers;
