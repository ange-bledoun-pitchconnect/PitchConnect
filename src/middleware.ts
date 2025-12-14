// ============================================================================
// FILE: src/middleware.ts
// ============================================================================
// NextAuth Middleware - Route Protection

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/players',
  '/teams',
  '/matches',
  '/training',
  '/analytics',
  '/api/players',
  '/api/teams',
  '/api/matches',
  '/api/training',
];

// Routes accessible only to authenticated users
const authRoutes = ['/auth/login', '/auth/register', '/auth/reset-password'];

// Routes accessible only to unauthenticated users
const publicRoutes = ['/', '/about', '/pricing', '/contact'];

export const middleware = withAuth(
  function onSuccess(request: NextRequest) {
    const token = request.nextauth.token;
    const pathname = request.nextUrl.pathname;

    // Redirect authenticated users away from auth pages
    if (authRoutes.some(route => pathname.startsWith(route)) && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Check if route is protected
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          return !!token;
        }

        // Public and auth routes are always allowed
        return true;
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/login',
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
