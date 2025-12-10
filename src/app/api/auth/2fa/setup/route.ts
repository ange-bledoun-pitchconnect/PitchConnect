// ============================================================================
// src/app/api/auth/2fa/setup/route.ts
// POST - Initialize two-factor authentication setup
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/middleware';
import { success, errorResponse } from '@/lib/api/responses';
import { BadRequestError } from '@/lib/api/errors';
import { logSecurityEvent } from '@/lib/api/audit';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * POST /api/auth/2fa/setup
 * Initialize two-factor authentication (TOTP) setup
 * Generates secret and QR code for authentication app
 * 
 * Request:
 *   - No body required
 *   - Requires authentication (user must be logged in)
 * 
 * Response:
 *   - secret: Base32 encoded secret for backup
 *   - qrCode: Data URL of QR code image
 *   - manualEntry: Instructions for manual entry
 *   - backupCodes: Array of backup codes (8 codes, 8 chars each)
 * 
 * Usage:
 *   1. User calls this endpoint
 *   2. User scans QR code with authenticator app (Google Authenticator, Authy, etc)
 *   3. User gets 6-digit code from app
 *   4. User calls /api/auth/2fa/verify with the code
 *   5. 2FA is now enabled
 * 
 * Side Effects:
 *   - Generates 2FA secret (not yet active)
 *   - Creates temporary 2FA setup record in database
 *   - Logs security event to audit trail
 * 
 * Status Code: 200 OK
 * 
 * Security Notes:
 *   - Secret not activated until verified via /api/auth/2fa/verify
 *   - Must generate new backup codes
 *   - User should store backup codes in secure location
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Check if 2FA already enabled
    const existingTwoFA = await prisma.userTwoFactorAuth.findUnique({
      where: { userId: user.id },
      select: { enabled: true },
    });

    if (existingTwoFA?.enabled) {
      throw new BadRequestError('Two-factor authentication is already enabled for this account');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `PitchConnect (${user.email})`,
      issuer: 'PitchConnect',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes (8 codes, 8 characters each)
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
      backupCodes.push(code);
    }

    // Store temporary 2FA setup (not yet enabled)
    await prisma.userTwoFactorAuth.upsert({
      where: { userId: user.id },
      update: {
        secret: secret.base32,
        enabled: false,
        backupCodes,
      },
      create: {
        userId: user.id,
        secret: secret.base32,
        enabled: false,
        backupCodes,
      },
    });

    // Log security event
    await logSecurityEvent(
      user.id,
      '2FA_SETUP_INITIATED',
      `Two-factor authentication setup initiated for ${user.email}`,
      request.headers.get('x-forwarded-for') || undefined
    );

    return success({
      message: 'Two-factor authentication setup initiated',
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntry: {
        key: secret.base32,
        issuer: 'PitchConnect',
        account: user.email,
      },
      backupCodes,
      instructions: [
        '1. Scan the QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc)',
        '2. Or manually enter the key in your authenticator app',
        '3. Enter the 6-digit code from your app to verify setup',
        '4. Save your backup codes in a secure location - you can use these if you lose access to your authenticator app',
      ],
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
