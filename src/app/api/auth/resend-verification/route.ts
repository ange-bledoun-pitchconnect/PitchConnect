/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Resend Verification Email API
 * Path: src/app/api/auth/resend-verification/route.ts
 * ============================================================================
 * 
 * POST /api/auth/resend-verification
 * 
 * Resends email verification for users who:
 * - Didn't receive the original email
 * - Token has expired
 * 
 * Features:
 * - Rate limiting (3 requests per hour)
 * - New token generation
 * - Old token invalidation
 * - Audit logging
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

const TOKEN_EXPIRY_HOURS = 24;
const MAX_RESEND_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Rate limiter
const resendAttempts = new Map<string, { count: number; resetAt: number }>();

// ============================================================================
// VALIDATION
// ============================================================================

const ResendSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

// ============================================================================
// HELPERS
// ============================================================================

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = resendAttempts.get(email);

  if (!record || record.resetAt < now) {
    resendAttempts.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_RESEND_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

  if (process.env.NODE_ENV === 'development') {
    logger.info('Verification email (resend)', {
      email,
      firstName,
      verificationUrl,
    });
  }

  // Production: Use your email service
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    const body = await request.json();
    const validation = ResendSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Rate limiting
    if (!checkRateLimit(email)) {
      logger.warn('Resend verification rate limited', { email, ip: clientIp });
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
        status: true,
      },
    });

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account with that email exists and is unverified, a new verification email has been sent.',
    };

    if (!user) {
      logger.info('Resend for non-existent email', { email });
      return NextResponse.json(successResponse);
    }

    // Already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'This email address is already verified. You can sign in.',
        alreadyVerified: true,
      });
    }

    // Generate new token
    const token = generateToken();
    const hashedToken = await hashToken(token);
    const expiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Delete old tokens and create new one
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: { identifier: email, type: 'EMAIL' },
      }),
      prisma.verificationToken.create({
        data: {
          identifier: email,
          token: hashedToken,
          type: 'EMAIL',
          expires: expiry,
        },
      }),
    ]);

    // Send email
    await sendVerificationEmail(email, user.firstName, token);

    logger.info('Verification email resent', {
      userId: user.id,
      email,
      ip: clientIp,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });

    return NextResponse.json(successResponse);

  } catch (error) {
    logger.error('Resend verification error', error as Error, { ip: clientIp });
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}