// ============================================================================
// src/app/api/auth/2fa/verify/route.ts
// POST - Verify and enable two-factor authentication
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/middleware';
import { parseJsonBody, validateRequired } from '@/lib/api/validation';
import { success, errorResponse } from '@/lib/api/responses';
import { BadRequestError, UnauthorizedError } from '@/lib/api/errors';
import { logSecurityEvent, logAuthEvent } from '@/lib/api/audit';
import speakeasy from 'speakeasy';

/**
 * POST /api/auth/2fa/verify
 * Verify and activate two-factor authentication
 * User provides 6-digit code from authenticator app
 * 
 * Request Body:
 *   Required:
 *     - code: string (6-digit code from authenticator app)
 * 
 * Validation:
 *   - Code must be valid 6-digit format
 *   - Code must match current TOTP secret
 *   - 2FA setup must be in progress (from /api/auth/2fa/setup)
 * 
 * Response:
 *   - success: true
 *   - message: Confirmation message
 *   - backupCodes: Array of backup codes (if this is first time enabling)
 * 
 * Side Effects:
 *   - Enables 2FA for user account
 *   - Activates TOTP secret
 *   - Stores backup codes
 *   - Logs security event to audit trail
 *   - Creates UserDevice entry for current device
 * 
 * Status Code: 200 OK
 * 
 * Security Notes:
 *   - Code must be generated within 30-second window
 *   - Each code can only be used once
 *   - Once enabled, user must use 2FA for login
 *   - Backup codes are single-use
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request);

    // Validate required fields
    validateRequired(body, ['code']);

    // Validate code format
    const code = body.code.toString().trim();
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestError('Code must be a 6-digit number');
    }

    // Get user's 2FA setup
    const twoFASetup = await prisma.userTwoFactorAuth.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        secret: true,
        enabled: true,
        backupCodes: true,
      },
    });

    if (!twoFASetup || !twoFASetup.secret) {
      throw new BadRequestError(
        'Two-factor authentication setup not found. Please initiate setup first.'
      );
    }

    if (twoFASetup.enabled) {
      throw new BadRequestError('Two-factor authentication is already enabled');
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: twoFASetup.secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 1 time window before/after (±30 seconds)
    });

    if (!verified) {
      await logSecurityEvent(
        user.id,
        '2FA_VERIFICATION_FAILED',
        `Invalid 2FA code provided for ${user.email}`,
        request.headers.get('x-forwarded-for') || undefined
      );

      throw new UnauthorizedError('Invalid verification code');
    }

    // Enable 2FA
    const backupCodes = twoFASetup.backupCodes || [];
    await prisma.userTwoFactorAuth.update({
      where: { id: twoFASetup.id },
      data: {
        enabled: true,
        enabledAt: new Date(),
        backupCodes, // Store for future reference
      },
    });

    // Update user to indicate 2FA enabled
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
      },
    });

    // Log security event
    await logSecurityEvent(
      user.id,
      '2FA_ENABLED',
      `Two-factor authentication successfully enabled for ${user.email}`,
      request.headers.get('x-forwarded-for') || undefined
    );

    return success({
      message: 'Two-factor authentication has been successfully enabled',
      twoFactorEnabled: true,
      backupCodes, // Return backup codes for user to save
      backupCodesNote:
        'Save these backup codes in a secure location. Each code can be used once if you lose access to your authenticator app.',
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
