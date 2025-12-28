/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Email Verification API
 * Path: src/app/api/auth/verify-email/route.ts
 * ============================================================================
 * 
 * POST /api/auth/verify-email
 * 
 * Enterprise Features:
 * - Token validation with secure hash comparison
 * - Expiry validation (24 hours)
 * - Single-use token enforcement
 * - Status update (PENDING_EMAIL_VERIFICATION → ACTIVE)
 * - Comprehensive audit logging
 * - Prisma database integration
 * 
 * Schema Alignment:
 * - Uses VerificationToken model (not User fields)
 * - Updates User.emailVerified, User.status
 * - User.roles is array field, not relation
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Hash token for comparison
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // ========================================================================
    // PARSE & VALIDATE
    // ========================================================================

    const body = await request.json();
    const validation = VerifyEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid token format' },
        { status: 400 }
      );
    }

    const { token, email } = validation.data;
    const tokenHash = await hashToken(token);

    // ========================================================================
    // FIND VERIFICATION TOKEN
    // ========================================================================

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: tokenHash,
        type: 'EMAIL',
        ...(email && { identifier: email }),
      },
    });

    // Token not found
    if (!verificationToken) {
      logger.warn('Invalid verification token', { ip: clientIp });
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification link' },
        { status: 400 }
      );
    }

    // Token expired
    if (new Date() > verificationToken.expires) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      logger.warn('Expired verification token', { 
        email: verificationToken.identifier,
        ip: clientIp,
      });

      return NextResponse.json(
        { 
          success: false, 
          message: 'Verification link has expired. Please request a new one.',
          expired: true,
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // FIND USER BY EMAIL (identifier)
    // ========================================================================

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        status: true,
        roles: true,
      },
    });

    if (!user) {
      logger.warn('Verification token for non-existent user', { 
        email: verificationToken.identifier,
      });
      
      // Clean up orphan token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Already verified
    if (user.emailVerified) {
      // Clean up used token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json(
        { 
          success: true, 
          message: 'Email address is already verified',
          alreadyVerified: true,
        }
      );
    }

    // ========================================================================
    // UPDATE USER - MARK AS VERIFIED
    // ========================================================================

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        status: true,
        roles: true,
        createdAt: true,
      },
    });

    // ========================================================================
    // DELETE USED TOKEN
    // ========================================================================

    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    // ========================================================================
    // AUDIT LOG
    // ========================================================================

    logger.info('Email verified successfully', {
      userId: user.id,
      email: user.email,
      ip: clientIp,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });

    // ========================================================================
    // RESPONSE
    // ========================================================================

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now sign in.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        emailVerified: updatedUser.emailVerified,
        status: updatedUser.status,
        roles: updatedUser.roles,
      },
    });

  } catch (error) {
    logger.error('Email verification error', error as Error, {
      ip: clientIp,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });

    return NextResponse.json(
      { success: false, message: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET HANDLER - Verify via URL parameter
// ============================================================================

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const email = request.nextUrl.searchParams.get('email');

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Verification token is required' },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const mockRequest = {
    json: async () => ({ token, email }),
    headers: request.headers,
  } as NextRequest;

  return POST(mockRequest);
}