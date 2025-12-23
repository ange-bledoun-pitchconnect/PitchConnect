/**
 * 🌟 PITCHCONNECT - NextAuth v5 Route Handler
 * Path: src/app/api/auth/[...nextauth]/route.ts
 *
 * ============================================================================
 * NEXTAUTH ROUTE HANDLER - PRODUCTION GRADE
 * ============================================================================
 *
 * This catch-all dynamic route handles ALL NextAuth authentication flows:
 *
 * Endpoints served by this handler:
 * - POST   /api/auth/signin                   - Initiate sign in
 * - GET    /api/auth/callback/[provider]      - OAuth callback handler
 * - GET/POST /api/auth/jwt                    - JWT operations
 * - GET    /api/auth/session                  - Get current session
 * - GET    /api/auth/providers                - List auth providers
 * - GET    /api/auth/error                    - Error page redirect
 * - POST   /api/auth/signout                  - Handle sign out
 * - POST   /api/auth/_log                     - Log events (dev mode)
 *
 * ============================================================================
 * CRITICAL IMPLEMENTATION NOTES
 * ============================================================================
 *
 * 1. DYNAMIC ROUTE SYNTAX
 *    - Filename: [...nextauth] (three dots required)
 *    - Creates catch-all route for /api/auth/[...any]
 *    - Next.js converts [...param] to params.nextauth array
 *
 * 2. HANDLER EXPORT
 *    - NextAuth() returns object with { handlers, auth, signIn, signOut }
 *    - handlers = { GET, POST } functions
 *    - MUST export as: export const { GET, POST } = handlers
 *    - DO NOT rename these - NextAuth expects exact names
 *
 * 3. SINGLE INITIALIZATION
 *    - handlers created ONCE in src/auth.ts
 *    - This file ONLY re-exports them
 *    - Do NOT call NextAuth() again here
 *    - Prevents duplicate initialization errors
 *
 * 4. TIMING
 *    - Called after middleware.ts
 *    - Runs only for /api/auth/* routes
 *    - Session already validated by middleware
 *
 * ============================================================================
 * SECURITY CONSIDERATIONS
 * ============================================================================
 *
 * - All OAuth flows validated server-side
 * - JWT tokens encrypted with NEXTAUTH_SECRET
 * - CSRF protection built-in
 * - Rate limiting should be added in production
 * - All responses sanitized
 * - NO sensitive data in logs
 *
 * ============================================================================
 */

import { handlers } from '@/auth';

/**
 * GET Handler
 *
 * Handles:
 * - /api/auth/session - Fetch current session
 * - /api/auth/providers - List available providers
 * - /api/auth/error - Error page
 * - /api/auth/signin - Show login page
 */
export const GET = handlers.GET;

/**
 * POST Handler
 *
 * Handles:
 * - /api/auth/signin - Process sign in
 * - /api/auth/callback/[provider] - OAuth provider callback
 * - /api/auth/signout - Process sign out
 * - /api/auth/_log - Log events (dev only)
 */
export const POST = handlers.POST;
