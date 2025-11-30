import NextAuth, { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// ============================================================================
// NextAuth Route Handler
// Centralized authentication configuration for all API routes
// ============================================================================

// ✅ RE-EXPORT authOptions so other files can import it from this route
// This prevents circular dependency issues and centralizes auth configuration
export { authOptions };

// Export NextAuth handler
const handler = NextAuth(authOptions);

// Export as GET and POST handlers
export { handler as GET, handler as POST };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get server session with auth options
 * Use this in server components and API routes to access the current session
 *
 * @example
 * const session = await getServerSessionWithAuth();
 * if (!session) {
 *   throw new Error('Unauthorized');
 * }
 */
export const getServerSessionWithAuth = () => getServerSession(authOptions);

/**
 * Check if user is authenticated
 * @example
 * if (!await isAuthenticated()) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export const isAuthenticated = async () => {
  const session = await getServerSessionWithAuth();
  return !!session;
};

/**
 * Get current user from session
 * @example
 * const user = await getCurrentUser();
 * console.log(user?.email);
 */
export const getCurrentUser = async () => {
  const session = await getServerSessionWithAuth();
  return session?.user || null;
};

/**
 * Check if current user is SuperAdmin
 * @example
 * if (!await isSuperAdmin()) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 */
export const isSuperAdmin = async () => {
  const session = await getServerSessionWithAuth();
  return session?.user?.isSuperAdmin === true;
};

/**
 * Check if current user has specific role
 * @example
 * if (!await hasRole('COACH')) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 */
export const hasRole = async (role: string) => {
  const session = await getServerSessionWithAuth();
  return session?.user?.roles?.includes(role) ?? false;
};

/**
 * Require authentication
 * Middleware for API routes that require authentication
 *
 * @example
 * export async function GET(request: Request) {
 *   const session = await requireAuth();
 *   // session is guaranteed to exist here
 * }
 */
export const requireAuth = async () => {
  const session = await getServerSessionWithAuth();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
};

/**
 * Require SuperAdmin role
 * Middleware for API routes that require SuperAdmin access
 *
 * @example
 * export async function POST(request: Request) {
 *   const session = await requireSuperAdmin();
 *   // session is guaranteed to be SuperAdmin here
 * }
 */
export const requireSuperAdmin = async () => {
  const session = await getServerSessionWithAuth();
  if (!session?.user?.isSuperAdmin) {
    throw new Error('SuperAdmin access required');
  }
  return session;
};

/**
 * Require specific role
 * Middleware for API routes that require specific roles
 *
 * @example
 * export async function POST(request: Request) {
 *   const session = await requireRole('COACH');
 *   // session is guaranteed to have COACH role here
 * }
 */
export const requireRole = async (requiredRole: string) => {
  const session = await getServerSessionWithAuth();
  if (!session?.user?.roles?.includes(requiredRole)) {
    throw new Error(`${requiredRole} role required`);
  }
  return session;
};

/**
 * Require any of the specified roles
 * Middleware for API routes that require multiple role options
 *
 * @example
 * export async function POST(request: Request) {
 *   const session = await requireAnyRole(['COACH', 'CLUB_MANAGER']);
 *   // session is guaranteed to have one of these roles
 * }
 */
export const requireAnyRole = async (roles: string[]) => {
  const session = await getServerSessionWithAuth();
  const hasRequiredRole = session?.user?.roles?.some((role) => roles.includes(role));
  if (!hasRequiredRole) {
    throw new Error(`One of these roles required: ${roles.join(', ')}`);
  }
  return session;
};