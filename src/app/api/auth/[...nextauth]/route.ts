/**
 * 🔐 NextAuth v5 Dynamic Route Handler
 * Path: /src/app/api/auth/[...nextauth]/route.ts
 *
 * ============================================================================
 * This file handles ALL NextAuth authentication endpoints:
 * - /api/auth/signin
 * - /api/auth/callback/google  
 * - /api/auth/callback/github
 * - /api/auth/signout
 * - /api/auth/session
 * - /api/auth/csrf
 * - /api/auth/providers
 *
 * The [...nextauth] catch-all route ensures all auth-related requests are
 * properly routed through NextAuth middleware.
 * ============================================================================
 */

import { handlers, auth } from '@/auth';

if (!handlers) {
  throw new Error(
    '[NextAuth] handlers not found. Check that src/auth.ts properly exports handlers from NextAuth()'
  );
}

if (!handlers.GET || !handlers.POST) {
  throw new Error(
    '[NextAuth] GET or POST handler missing. handlers object incomplete: ' +
      JSON.stringify(Object.keys(handlers))
  );
}

// Export handlers for both GET and POST requests
// NextAuth uses HTTP methods to handle different authentication flows
export const { GET, POST } = handlers;

// Optional: Export auth for middleware if needed
export { auth };
