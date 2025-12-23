/**
 * 🌟 PITCHCONNECT - Lightweight Route Middleware
 * Path: /src/middleware.ts
 *
 * ============================================================================
 * MIDDLEWARE FEATURES (EDGE RUNTIME COMPATIBLE)
 * ============================================================================
 * ✅ Fast path matching (no auth import)
 * ✅ Public route whitelist
 * ✅ Protected route basic enforcement
 * ✅ Lightweight for Edge Runtime
 * ✅ Session checking via client-side methods
 *
 * NOTE: For session validation, use useSession() hook client-side
 * or check session in API routes/server actions (not in middleware)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/features',
  '/faq',
  '/terms',
  '/privacy',
  '/blog',
];

const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/error',
  '/auth/callback',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

function isApiRoute(path: string): boolean {
  return path.startsWith('/api/');
}

// ============================================================================
// MIDDLEWARE LOGIC (EDGE COMPATIBLE)
// ============================================================================

/**
 * Lightweight Middleware for Route Matching
 *
 * IMPORTANT: This middleware is Edge Runtime compatible and therefore:
 * - Does NOT perform session validation
 * - Session validation happens client-side (useSession hook)
 * - Or server-side (API routes, Server Actions)
 *
 * This middleware focuses on:
 * 1. Public routes → Allow through
 * 2. API routes → Allow through (validation in route handler)
 * 3. Auth routes → Allow through
 * 4. Protected routes → Basic redirect (actual session check client-side)
 */
export function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  // 1. Allow all API routes (validation happens in route handlers)
  if (isApiRoute(path)) {
    return NextResponse.next();
  }

  // 2. Allow public routes
  if (isPublicRoute(path)) {
    return NextResponse.next();
  }

  // 3. Allow auth routes
  if (isAuthRoute(path)) {
    return NextResponse.next();
  }

  // 4. For protected routes, we can't check session in Edge Runtime
  // Instead, we use a lightweight approach:
  // - Check for NextAuth session cookie
  // - If missing, redirect to login
  // - Client-side useSession hook provides fallback validation

  const sessionCookie = req.cookies.get('next-auth.session-token') || 
                       req.cookies.get('__Secure-next-auth.session-token');

  if (!sessionCookie) {
    // No session found, redirect to login
    let callbackUrl = path;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // 5. Add Security Headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
}

// ============================================================================
// MATCHER CONFIGURATION
// ============================================================================

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
