/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Reset Password API
 * Path: src/app/api/auth/reset-password/route.ts
 * ============================================================================
 * 
 * POST /api/auth/reset-password
 * 
 * Enterprise Features:
 * - Token validation with secure hash comparison
 * - Password strength enforcement
 * - PBKDF2 password hashing (zero dependencies)
 * - Session invalidation on password change
 * - Prevents password reuse
 * - Comprehensive audit logging
 * - Prisma database integration
 * 
 * Schema Alignment:
 * - Uses User.passwordResetToken (hashed)
 * - Uses User.passwordResetExpiry
 * - Updates User.password, User.passwordChangedAt
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

const PASSWORD_MIN_LENGTH = 8;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ============================================================================
// CRYPTOGRAPHIC FUNCTIONS (Zero Dependencies)
// ============================================================================

function generateSalt(): string {
  const array = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${salt}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256
  );

  const newHashArray = Array.from(new Uint8Array(derivedBits));
  const newHashHex = newHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time comparison
  if (newHashHex.length !== hash.length) return false;
  let result = 0;
  for (let i = 0; i < newHashHex.length; i++) {
    result |= newHashHex.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// SESSION INVALIDATION
// ============================================================================

async function invalidateUserSessions(userId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    logger.info('User sessions invalidated', { userId });
  } catch (error) {
    logger.error('Failed to invalidate sessions', error as Error, { userId });
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Parse & validate
    const body = await request.json();
    const validation = ResetPasswordSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten();
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: errors.fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;
    const tokenHash = await hashToken(token);

    // Find user by token
    const user = await prisma.user.findFirst({
      where: { passwordResetToken: tokenHash },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        passwordResetToken: true,
        passwordResetExpiry: true,
        status: true,
      },
    });

    if (!user) {
      logger.warn('Invalid reset token', { ip: clientIp });
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    // Check expiry
    if (!user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
      logger.warn('Expired reset token', { userId: user.id });
      return NextResponse.json(
        { success: false, message: 'This reset link has expired' },
        { status: 400 }
      );
    }

    // Check account status
    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, message: 'This account is not active' },
        { status: 400 }
      );
    }

    // Prevent password reuse
    if (user.password) {
      const isSame = await verifyPassword(password, user.password);
      if (isSame) {
        return NextResponse.json(
          { success: false, message: 'New password must be different from current password' },
          { status: 400 }
        );
      }
    }

    // Hash new password & update
    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    // Invalidate sessions
    await invalidateUserSessions(user.id);

    logger.info('Password reset successful', {
      userId: user.id,
      email: user.email,
      ip: clientIp,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.',
    });

  } catch (error) {
    logger.error('Reset password error', error as Error, { ip: clientIp });
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}