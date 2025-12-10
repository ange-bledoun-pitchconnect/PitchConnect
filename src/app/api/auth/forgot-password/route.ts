// ============================================================================
// src/app/api/auth/forgot-password/route.ts
// POST - Request password reset token via email
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, validateRequired, validateEmail } from '@/lib/api/validation';
import { success, errorResponse } from '@/lib/api/responses';
import { NotFoundError } from '@/lib/api/errors';
import { logSecurityEvent, logAuthEvent } from '@/lib/api/audit';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/forgot-password
 * Request password reset token
 * Sends reset link via email to user
 * 
 * Request Body:
 *   Required:
 *     - email: string (registered email address)
 * 
 * Validation:
 *   - Email must be valid format
 *   - User must exist in system
 *   - User must be ACTIVE or suspended (not pending verification)
 * 
 * Response:
 *   - Success message (doesn't reveal if user exists for security)
 *   - Email with reset link sent if user found
 * 
 * Side Effects:
 *   - Generates password reset token
 *   - Stores token in database (1 hour validity)
 *   - Sends password reset email with link
 *   - Logs security event to audit trail
 * 
 * Status Code: 200 OK
 * 
 * Security Notes:
 *   - Always return 200 even if email doesn't exist (prevents email enumeration)
 *   - Reset token expires in 1 hour
 *   - Token is single-use (cleared after successful reset)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);

    // Validate required fields
    validateRequired(body, ['email']);

    const email = body.email.toLowerCase().trim();
    validateEmail(email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    // Always return success for security (prevents email enumeration)
    const response = {
      message: 'If an account exists with this email, a password reset link has been sent',
      email: email,
    };

    if (!user) {
      // Log suspicious activity if needed
      await logSecurityEvent(
        'SYSTEM',
        'PASSWORD_RESET_ATTEMPT_UNKNOWN_EMAIL',
        `Password reset requested for non-existent email: ${email}`,
        request.headers.get('x-forwarded-for') || undefined
      );
      return success(response);
    }

    // Check if user is in valid state for password reset
    if (user.status === 'PENDING_EMAIL_VERIFICATION') {
      await logAuthEvent(
        user.id,
        'PASSWORD_RESET_PENDING_VERIFICATION',
        'Password reset requested but account not verified',
        request.headers.get('x-forwarded-for') || undefined
      );
      return success(response);
    }

    // Generate reset token
    const salt = await bcrypt.genSalt(10);
    const resetToken = await bcrypt.hash(
      `${email}${Date.now()}${Math.random()}`,
      salt
    );
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: resetTokenExpiry,
      },
    });

    // Log password reset request
    await logSecurityEvent(
      user.id,
      'PASSWORD_RESET_REQUESTED',
      `Password reset requested for ${user.firstName} ${user.lastName}`,
      request.headers.get('x-forwarded-for') || undefined
    );

    // TODO: Send password reset email
    // await sendPasswordResetEmail(
    //   user.email,
    //   user.firstName,
    //   resetToken,
    //   resetTokenExpiry
    // );

    return success(response);
  } catch (error) {
    return errorResponse(error as Error);
  }
}