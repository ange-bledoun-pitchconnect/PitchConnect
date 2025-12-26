/**
 * 🔐 PITCHCONNECT - NextAuth v4 API Route Handler
 * Path: src/app/api/auth/[...nextauth]/route.ts
 *
 * ============================================================================
 * NEXTAUTH ROUTE HANDLER - CRITICAL FOR AUTHENTICATION
 * ============================================================================
 * ✅ Exports GET and POST handlers from NextAuth configuration
 * ✅ Handles all authentication flows (login, oauth, logout, callbacks)
 * ✅ Manages session and JWT token operations
 * ✅ Catch-all route for dynamic NextAuth endpoints
 *
 * ARCHITECTURE:
 * - Imports handlers from @/auth (auth.ts config file)
 * - Exports both GET and POST as required by App Router
 * - NextAuth uses catch-all route [...nextauth] to handle multiple endpoints:
 *   POST /api/auth/callback/credentials
 *   POST /api/auth/signin
 *   POST /api/auth/callback/:provider
 *   GET /api/auth/session
 *   POST /api/auth/signout
 *   GET /api/auth/providers
 *   etc.
 */

import { handlers } from '@/auth';

/**
 * 🔐 CRITICAL EXPORTS
 * NextAuth requires both GET and POST handlers to be exported
 * from the catch-all route file
 */
export const { GET, POST } = handlers;
