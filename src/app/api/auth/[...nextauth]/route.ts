/**
 * 🌟 PITCHCONNECT - NextAuth Route Handler
 * Path: /src/app/api/auth/[...nextauth]/route.ts
 * 
 * ============================================================================
 * NEXTAUTH V5 ROUTE HANDLER - App Router Compatibility
 * ============================================================================
 * 
 * Handles all NextAuth routes including:
 * - /api/auth/signin - Show login page
 * - /api/auth/callback/[provider] - OAuth provider callbacks
 * - /api/auth/error - Authentication error page
 * - /api/auth/providers - List available providers
 * - /api/auth/session - Get current session
 * - /api/auth/csrf - Get CSRF token
 * - /api/auth/signout - Sign out user
 * 
 * Status: ✅ Production Ready
 * ============================================================================
 */

import { handlers } from '@/auth';

/**
 * GET Handler
 * 
 * Handles GET requests for authentication flow:
 * - /api/auth/signin - Show login page
 * - /api/auth/providers - List configured providers
 * - /api/auth/session - Retrieve user session
 * - /api/auth/csrf - Get CSRF token for secure requests
 * - /api/auth/error?error=[error_code] - Display error message
 * 
 * Examples:
 * GET /api/auth/signin/google → Redirect to Google OAuth
 * GET /api/auth/session → Return current session or null
 * GET /api/auth/error?error=AccessDenied → Show access denied error
 */
export const GET = handlers.GET;

/**
 * POST Handler
 * 
 * Handles POST requests for authentication:
 * - /api/auth/signin/credentials - Email/password authentication
 * - /api/auth/callback/[provider] - OAuth provider callbacks
 * - /api/auth/signout - Sign out user and destroy session
 * - /api/auth/session - Session refresh (client-side)
 * 
 * Examples:
 * POST /api/auth/signin/credentials
 * Body: { email: "user@example.com", password: "secure_password" }
 * 
 * POST /api/auth/callback/google
 * Body: { code: "oauth_code_from_google", state: "..." }
 * 
 * POST /api/auth/signout
 * → Destroys session and invalidates JWT token
 */
export const POST = handlers.POST;

/**
 * How This Works with NextAuth
 * 
 * 1. NextAuth Core (`/src/auth.ts`) defines:
 *    - Providers (Credentials, Google, GitHub)
 *    - Callbacks (signIn, jwt, session, etc.)
 *    - Configuration (pages, session settings)
 *    - Exports handlers for GET/POST
 * 
 * 2. This Route File (`route.ts`) imports and re-exports:
 *    - handlers.GET → Handles all GET requests
 *    - handlers.POST → Handles all POST requests
 * 
 * 3. Next.js App Router recognizes:
 *    - export const GET = ... → Handles GET requests
 *    - export const POST = ... → Handles POST requests
 *    - Automatic routing via catch-all [...nextauth] segment
 * 
 * This is the standard NextAuth v5 + Next.js 15 integration pattern.
 */
