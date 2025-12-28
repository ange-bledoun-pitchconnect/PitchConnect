/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Two-Factor Authentication Verify API
 * Path: src/app/api/auth/2fa/verify/route.ts
 * ============================================================================
 * 
 * POST /api/auth/2fa/verify
 * 
 * Enterprise Features:
 * - TOTP verification with time window tolerance
 * - Backup code verification
 * - Rate limiting (5 attempts per 15 min)
 * - Audit logging
 * - Prisma database integration
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';

// ============================================================================
// CONSTANTS
// ============================================================================

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// In-memory rate limiter (use Redis in production)
const attemptTracker = new Map<string, { count: number; resetAt: number }>();

// ============================================================================
// TOTP IMPLEMENTATION
// ============================================================================

function decodeBase32(input: string): Uint8Array {
  const upper = input.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < upper.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(upper[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >> bits) & 255);
    }
  }

  return new Uint8Array(output);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

async function generateTOTP(secret: string, time?: number): Promise<string> {
  const timestamp = Math.floor((time || Date.now()) / 1000 / TOTP_PERIOD);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, 0, false);
  view.setUint32(4, timestamp, false);

  const secretBytes = decodeBase32(secret);
  const hmac = await hmacSha1(secretBytes, new Uint8Array(buffer));

  const offset = hmac[19] & 0x0f;
  const value =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(value % Math.pow(10, TOTP_DIGITS)).padStart(TOTP_DIGITS, '0');
}

async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const now = Date.now();
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const testTime = now + i * TOTP_PERIOD * 1000;
    const testCode = await generateTOTP(secret, testTime);
    if (testCode === code) return true;
  }
  return false;
}

// ============================================================================
// BACKUP CODE VERIFICATION
// ============================================================================

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyBackupCode(
  userId: string,
  code: string,
  storedHashes: string[]
): Promise<{ valid: boolean; remainingCodes: string[] }> {
  const codeHash = await hashCode(code.toUpperCase());
  const index = storedHashes.indexOf(codeHash);
  
  if (index === -1) {
    return { valid: false, remainingCodes: storedHashes };
  }
  
  // Remove used code
  const remainingCodes = [...storedHashes];
  remainingCodes.splice(index, 1);
  
  return { valid: true, remainingCodes };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = attemptTracker.get(userId);

  if (!record || record.resetAt < now) {
    attemptTracker.set(userId, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

function resetRateLimit(userId: string): void {
  attemptTracker.delete(userId);
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ========================================================================
    // RATE LIMITING
    // ========================================================================

    const rateLimit = checkRateLimit(userId);
    
    if (!rateLimit.allowed) {
      logger.warn('2FA verification rate limited', { userId, ip: clientIp });
      return NextResponse.json(
        { error: 'Too many attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // ========================================================================
    // PARSE REQUEST
    // ========================================================================

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // ========================================================================
    // GET 2FA RECORD
    // ========================================================================

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
      select: {
        secret: true,
        enabled: true,
        backupCodes: true,
      },
    });

    if (!twoFactorAuth || !twoFactorAuth.secret) {
      return NextResponse.json(
        { error: 'Two-factor authentication not set up' },
        { status: 400 }
      );
    }

    // ========================================================================
    // VERIFY CODE
    // ========================================================================

    let isValid = false;
    let usedBackupCode = false;
    let remainingBackupCodes = twoFactorAuth.backupCodes;

    // Try TOTP verification first (6-digit codes)
    if (/^\d{6}$/.test(cleanCode)) {
      isValid = await verifyTOTP(twoFactorAuth.secret, cleanCode);
    }

    // Try backup code verification (8-character hex)
    if (!isValid && /^[A-F0-9]{8}$/.test(cleanCode)) {
      const backupResult = await verifyBackupCode(
        userId,
        cleanCode,
        twoFactorAuth.backupCodes
      );
      
      if (backupResult.valid) {
        isValid = true;
        usedBackupCode = true;
        remainingBackupCodes = backupResult.remainingCodes;
      }
    }

    // ========================================================================
    // HANDLE INVALID CODE
    // ========================================================================

    if (!isValid) {
      logger.warn('Invalid 2FA code', {
        userId,
        attemptsRemaining: rateLimit.remaining,
        ip: clientIp,
      });

      return NextResponse.json(
        {
          error: 'Invalid verification code',
          attemptsRemaining: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    // ========================================================================
    // ENABLE 2FA (if not already enabled)
    // ========================================================================

    const wasEnabled = twoFactorAuth.enabled;

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        enabled: true,
        lastUsedAt: new Date(),
        backupCodes: remainingBackupCodes,
        updatedAt: new Date(),
      },
    });

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Reset rate limit on success
    resetRateLimit(userId);

    // ========================================================================
    // AUDIT LOG
    // ========================================================================

    logger.info('2FA verification successful', {
      userId,
      wasEnabled,
      usedBackupCode,
      backupCodesRemaining: remainingBackupCodes.length,
      ip: clientIp,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });

    // ========================================================================
    // RESPONSE
    // ========================================================================

    const response: any = {
      message: wasEnabled 
        ? 'Two-factor authentication verified'
        : 'Two-factor authentication has been enabled',
      twoFactorEnabled: true,
    };

    if (usedBackupCode) {
      response.warning = 'You used a backup code. Consider generating new backup codes.';
      response.backupCodesRemaining = remainingBackupCodes.length;
    }

    if (!wasEnabled) {
      response.backupCodesNote = 'Save your backup codes in a secure location. Each code can only be used once.';
    }

    return NextResponse.json(response);

  } catch (error) {
    logger.error('2FA verification error', error as Error, {
      ip: clientIp,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });

    return NextResponse.json(
      { error: 'Failed to verify two-factor authentication' },
      { status: 500 }
    );
  }
}