/**
 * 🌟 PITCHCONNECT - NextAuth API Route
 * Path: /src/app/api/auth/[...nextauth]/route.ts
 *
 * ============================================================================
 * NEXTAUTH V4 API ROUTE HANDLER
 * ============================================================================
 * ✅ Handles all NextAuth requests
 * ✅ GET/POST endpoints for signin, callback, signout
 * ✅ JWT token management
 * ✅ Session validation
 *
 * ============================================================================
 * STATUS: PRODUCTION READY ⚽🏆
 * ============================================================================
 */

import NextAuth from 'next-auth';
import authOptions from '@/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
