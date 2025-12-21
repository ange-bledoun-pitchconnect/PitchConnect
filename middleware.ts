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
 */

import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { config as authConfig } from './auth';

// Initialize NextAuth with config
const { auth } = NextAuth(authConfig);

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

export default auth((req) => {
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
