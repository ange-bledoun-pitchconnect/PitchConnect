// ============================================================================
// src/app/api/auth/verify-email/route.ts
// POST - Verify user email address with token
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, validateRequired } from '@/lib/api/validation';
import { success, errorResponse } from '@/lib/api/responses';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/lib/api/errors';
import { logAuthEvent } from '@/lib/api/audit';

/**
 * POST /api/auth/verify-email
 * Verify user email address using verification token
 * 
 * Request Body:
 *   Required:
 *     - email: string (email to verify)
 *     - token: string (verification token from email)
 * 
 * Validation:
 *   - Token must match stored verification token
 *   - Token must not be expired (24 hour validity)
 *   - User must exist
 *   - Email must match registered email
 * 
 * Response:
 *   - Updated user object
 *   - emailVerified: true
 *   - status: ACTIVE
 * 
 * Side Effects:
 *   - Updates user emailVerified flag to true
 *   - Updates user status to ACTIVE
 *   - Clears verification token
 *   - Logs verification event to audit trail
 * 
 * Status Code: 200 OK
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);

    // Validate required fields
    validateRequired(body, ['email', 'token']);

    const email = body.email.toLowerCase().trim();

    // Find user with verification token
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        emailVerificationToken: true,
        emailVerificationTokenExpiry: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if already verified
    if (user.emailVerified) {
      throw new BadRequestError('Email address is already verified');
    }

    // Check if token exists and hasn't expired
    if (!user.emailVerificationToken) {
      throw new BadRequestError(
        'No verification token found. Please request a new verification email.'
      );
    }

    if (!user.emailVerificationTokenExpiry || user.emailVerificationTokenExpiry < new Date()) {
      throw new UnauthorizedError(
        'Verification token has expired. Please request a new verification email.'
      );
    }

    // Verify token matches (in production, use bcrypt.compare)
    // For now, using direct comparison for simplicity
    if (user.emailVerificationToken !== body.token) {
      throw new UnauthorizedError('Invalid verification token');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        roles: {
          select: { role: true },
        },
      },
    });

    // Log verification event
    await logAuthEvent(
      user.id,
      'EMAIL_VERIFIED',
      `Email verified for ${user.firstName} ${user.lastName}`,
      request.headers.get('x-forwarded-for') || undefined
    );

    return success(updatedUser);
  } catch (error) {
    return errorResponse(error as Error);
  }
}