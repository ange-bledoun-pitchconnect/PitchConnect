/**
 * 🌟 PITCHCONNECT - Enterprise NextAuth v5 Middleware
 * Path: /middleware.ts
 *
 * ============================================================================
 * MIDDLEWARE FEATURES
 * ============================================================================
 * ✅ NextAuth v5 compatible
 * ✅ Role-based access control (RBAC)
 * ✅ Protected route verification
 * ✅ Public route whitelist
 * ✅ Security headers injection
 * ✅ Proper auth initialization (no duplicates)
 */

import { auth } from '@/auth';
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
  '/api/auth', // Important for NextAuth endpoints
];

const ADMIN_ROUTES = ['/admin'];
const CLUB_OWNER_ROUTES = ['/club'];
const COACH_ROUTES = ['/coaching'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isPublicRoute(path: string) {
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

function isAuthRoute(path: string) {
  return AUTH_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

// ============================================================================
// MIDDLEWARE LOGIC
// ============================================================================

/**
 * Auth Middleware
 *
 * Features:
 * 1. Public routes - pass through without session check
 * 2. Auth routes - redirect to dashboard if already logged in
 * 3. Protected routes - require valid session
 * 4. Role-based access - enforce permissions
 * 5. Security headers - inject best-practice headers
 *
 * Flow:
 * Request -> Middleware -> auth() wrapper -> route handler
 * auth() automatically validates JWT and injects req.auth
 */
export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const path = nextUrl.pathname;

  // 1. Allow public routes
  if (isPublicRoute(path)) {
    return NextResponse.next();
  }

  // 2. Allow auth routes (login/register) - Redirect if already logged in
  if (isAuthRoute(path)) {
    if (isLoggedIn) {
      // Redirect logged-in users to dashboard
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    return NextResponse.next();
  }

  // 3. Protected Routes (Default behavior: require login)
  if (!isLoggedIn) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    
    // Redirect to login with callback URL
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // 4. Role-Based Access Control
  
  // Admin Routes
  if (path.startsWith('/admin') && userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Club Routes
  if (path.startsWith('/club') && !['SUPERADMIN', 'ADMIN', 'CLUB_OWNER'].includes(userRole || '')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Coach Routes
  if (path.startsWith('/coaching') && !['SUPERADMIN', 'ADMIN', 'MANAGER', 'COACH'].includes(userRole || '')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // 5. Add Security Headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
});

// ============================================================================
// MATCHER CONFIGURATION
// ============================================================================

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
