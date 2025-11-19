/**
 * Auth Utilities
 * Helper functions for authentication
 */

import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if user is SuperAdmin
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { isSuperAdmin: true, roles: true },
    });
    return user?.isSuperAdmin === true || user?.roles.includes('SUPERADMIN');
  } catch (error) {
    console.error('Error checking SuperAdmin status:', error);
    return false;
  }
}

/**
 * Require SuperAdmin access (for API routes)
 */
export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Unauthorized: No session');
  }

  const isAdmin = await isSuperAdmin(session.user.email);
  
  if (!isAdmin) {
    throw new Error('Forbidden: SuperAdmin access required');
  }

  return session;
}

/**
 * Get current user with SuperAdmin status
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      roles: true,
      isSuperAdmin: true,
      status: true,
    },
  });

  return user;
}
