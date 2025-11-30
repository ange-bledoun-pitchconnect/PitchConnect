import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If unauthenticated, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // 🔧 FIXED: Check isSuperAdmin flag OR roles array
  const isSuperAdmin = token.isSuperAdmin === true;
  const roles = (token.roles as string[]) || [];
  const hasSuperAdminRole = roles.includes('SUPERADMIN');

  // Allow SuperAdmin access to everything
  if (isSuperAdmin || hasSuperAdminRole) {
    return NextResponse.next();
  }

  // Block access to SuperAdmin dashboard for non-superadmins
  if (pathname.startsWith('/dashboard/superadmin')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Allow access to other dashboard routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
