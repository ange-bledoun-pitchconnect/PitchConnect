import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected dashboard routes by user type
const dashboardRoutes = [
  '/dashboard/player',
  '/dashboard/coach',
  '/dashboard/manager',
  '/dashboard/league-admin',
  '/dashboard/superadmin'
];

export async function middleware(req: NextRequest) {
  // Only protect dashboard routes
  if (!dashboardRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const dashboardPath = req.nextUrl.pathname;

  // If unauthenticated, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Route-based role restriction logic (customize as needed)
  const userType = token.userType;
  if (
    (dashboardPath.startsWith('/dashboard/player') && userType !== 'PLAYER') ||
    (dashboardPath.startsWith('/dashboard/coach') && userType !== 'COACH') ||
    (dashboardPath.startsWith('/dashboard/manager') && userType !== 'MANAGER') ||
    (dashboardPath.startsWith('/dashboard/league-admin') && userType !== 'LEAGUE_ADMIN') ||
    (dashboardPath.startsWith('/dashboard/superadmin') && userType !== 'SUPERADMIN')
  ) {
    // Send to that user's appropriate dashboard
    const redirect = '/dashboard';
    return NextResponse.redirect(new URL(redirect, req.url));
  }

  // Default: allow through
  return NextResponse.next();
}

// Specify path matchers
export const config = {
  matcher: ['/dashboard/:path*']
};
