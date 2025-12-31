// =============================================================================
// 🔐 SUPERADMIN 2FA API - Enterprise-Grade Two-Factor Authentication
// =============================================================================
// GET    /api/superadmin/settings/2fa - Get 2FA status
// POST   /api/superadmin/settings/2fa - Setup/verify/use 2FA
// DELETE /api/superadmin/settings/2fa - Disable 2FA
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: TOTP setup, QR code generation, backup codes, security logging
// =============================================================================
// Required packages: npm install speakeasy qrcode
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

// =============================================================================
// LAZY LOAD DEPENDENCIES
// =============================================================================

let speakeasy: any = null;
let QRCode: any = null;

function getSpeakeasy() {
  if (!speakeasy) {
    try {
      speakeasy = require('speakeasy');
    } catch {
      console.error('[2FA] speakeasy package not installed. Run: npm install speakeasy');
      return null;
    }
  }
  return speakeasy;
}

function getQRCode() {
  if (!QRCode) {
    try {
      QRCode = require('qrcode');
    } catch {
      console.error('[2FA] qrcode package not installed. Run: npm install qrcode');
      return null;
    }
  }
  return QRCode;
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface TwoFactorStatus {
  isEnabled: boolean;
  isVerified: boolean;
  enabledAt: string | null;
  backupCodesRemaining: number;
  lastUsedAt: string | null;
}

interface SetupResponse {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  backupCodes: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  ALREADY_ENABLED: 'ALREADY_ENABLED',
  NOT_ENABLED: 'NOT_ENABLED',
  INVALID_CODE: 'INVALID_CODE',
  LOCKED: 'LOCKED',
  DEPENDENCY_MISSING: 'DEPENDENCY_MISSING',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const APP_NAME = process.env.APP_NAME || 'PitchConnect';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const BACKUP_CODES_COUNT = 10;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const SetupSchema = z.object({
  action: z.literal('setup'),
});

const VerifySchema = z.object({
  action: z.literal('verify'),
  token: z.string().length(6).regex(/^\d{6}$/, 'Token must be 6 digits'),
});

const ValidateSchema = z.object({
  action: z.literal('validate'),
  token: z.string().min(6).max(20), // 6-digit TOTP or backup code
});

const RegenerateBackupSchema = z.object({
  action: z.literal('regenerate_backup'),
  currentToken: z.string().length(6).regex(/^\d{6}$/, 'Token must be 6 digits'),
});

const PostSchema = z.discriminatedUnion('action', [
  SetupSchema,
  VerifySchema,
  ValidateSchema,
  RegenerateBackupSchema,
]);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `2fa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
    error?: { code: string; message: string };
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.message) {
    response.message = options.message;
  }

  if (options.error) {
    response.error = options.error;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: { 'X-Request-ID': options.requestId },
  });
}

/**
 * Verify SuperAdmin access
 */
async function verifySuperAdmin(userId: string): Promise<{ isValid: boolean; user?: any }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isSuperAdmin: true,
      roles: true,
    },
  });

  if (!user) return { isValid: false };
  const isValid = user.isSuperAdmin || user.roles.includes('SUPERADMIN');
  return { isValid, user };
}

/**
 * Encrypt secret for storage
 */
function encryptSecret(secret: string): string {
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex').slice(0, 32), iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt secret from storage
 */
function decryptSecret(encryptedSecret: string): string {
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  const [ivHex, encrypted] = encryptedSecret.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex').slice(0, 32), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number = BACKUP_CODES_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Format: XXXX-XXXX (8 alphanumeric characters)
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

/**
 * Hash backup code for storage
 */
function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.replace('-', '').toUpperCase()).digest('hex');
}

/**
 * Get client IP
 */
function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

// =============================================================================
// GET HANDLER - 2FA Status
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid } = await verifySuperAdmin(session.user.id);
    if (!isValid) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Get 2FA status
    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    const status: TwoFactorStatus = {
      isEnabled: twoFactor?.isEnabled || false,
      isVerified: twoFactor?.isVerified || false,
      enabledAt: twoFactor?.enabledAt?.toISOString() || null,
      backupCodesRemaining: twoFactor 
        ? (BACKUP_CODES_COUNT - (twoFactor.backupCodesUsed || 0))
        : 0,
      lastUsedAt: twoFactor?.lastUsedAt?.toISOString() || null,
    };

    return createResponse(status, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/settings/2fa error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to get 2FA status' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Setup/Verify/Validate 2FA
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const clientIp = getClientIp(request);

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid, user: adminUser } = await verifySuperAdmin(session.user.id);
    if (!isValid || !adminUser) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid JSON in request body' },
        requestId,
        status: 400,
      });
    }

    const validation = PostSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Validation failed' },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // ==========================================================================
    // SETUP ACTION - Generate new 2FA secret
    // ==========================================================================
    if (params.action === 'setup') {
      const sp = getSpeakeasy();
      const qr = getQRCode();

      if (!sp || !qr) {
        return createResponse(null, {
          success: false,
          error: { 
            code: ERROR_CODES.DEPENDENCY_MISSING, 
            message: '2FA dependencies not installed. Run: npm install speakeasy qrcode' 
          },
          requestId,
          status: 500,
        });
      }

      // Check if already enabled
      const existing = await prisma.twoFactorAuth.findUnique({
        where: { userId: session.user.id },
      });

      if (existing?.isEnabled && existing?.isVerified) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.ALREADY_ENABLED, message: '2FA is already enabled. Disable it first to re-setup.' },
          requestId,
          status: 400,
        });
      }

      // Generate new secret
      const secret = sp.generateSecret({
        name: `${APP_NAME} (${adminUser.email})`,
        issuer: APP_NAME,
        length: 32,
      });

      // Generate QR code
      const otpauthUrl = secret.otpauth_url;
      const qrCode = await qr.toDataURL(otpauthUrl);

      // Generate backup codes
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = backupCodes.map(hashBackupCode);

      // Store encrypted secret (not verified yet)
      await prisma.twoFactorAuth.upsert({
        where: { userId: session.user.id },
        update: {
          secret: encryptSecret(secret.base32),
          backupCodes: hashedBackupCodes,
          backupCodesUsed: 0,
          isEnabled: false,
          isVerified: false,
          failedAttempts: 0,
          lockedUntil: null,
        },
        create: {
          userId: session.user.id,
          secret: encryptSecret(secret.base32),
          backupCodes: hashedBackupCodes,
          backupCodesUsed: 0,
          isEnabled: false,
          isVerified: false,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: '2FA_SETUP_INITIATED',
          resourceType: 'USER',
          resourceId: session.user.id,
          ipAddress: clientIp,
          severity: 'INFO',
        },
      });

      const response: SetupResponse = {
        secret: secret.base32,
        qrCode,
        manualEntryKey: secret.base32,
        backupCodes, // Only shown once!
      };

      return createResponse(response, {
        success: true,
        message: 'Scan the QR code with your authenticator app, then verify with a token',
        requestId,
      });
    }

    // ==========================================================================
    // VERIFY ACTION - Verify setup with first token
    // ==========================================================================
    if (params.action === 'verify') {
      const sp = getSpeakeasy();
      if (!sp) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.DEPENDENCY_MISSING, message: 'speakeasy package not installed' },
          requestId,
          status: 500,
        });
      }

      const twoFactor = await prisma.twoFactorAuth.findUnique({
        where: { userId: session.user.id },
      });

      if (!twoFactor) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'No 2FA setup found. Run setup first.' },
          requestId,
          status: 404,
        });
      }

      if (twoFactor.isEnabled && twoFactor.isVerified) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.ALREADY_ENABLED, message: '2FA is already verified and enabled' },
          requestId,
          status: 400,
        });
      }

      // Verify token
      const secret = decryptSecret(twoFactor.secret);
      const verified = sp.totp.verify({
        secret,
        encoding: 'base32',
        token: params.token,
        window: 1, // Allow 1 step before/after
      });

      if (!verified) {
        await prisma.twoFactorAuth.update({
          where: { userId: session.user.id },
          data: { failedAttempts: { increment: 1 } },
        });

        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.INVALID_CODE, message: 'Invalid verification code' },
          requestId,
          status: 400,
        });
      }

      // Enable 2FA
      await prisma.twoFactorAuth.update({
        where: { userId: session.user.id },
        data: {
          isEnabled: true,
          isVerified: true,
          enabledAt: new Date(),
          failedAttempts: 0,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: '2FA_ENABLED',
          resourceType: 'USER',
          resourceId: session.user.id,
          ipAddress: clientIp,
          severity: 'CRITICAL',
        },
      });

      return createResponse({ enabled: true }, {
        success: true,
        message: '2FA has been enabled successfully',
        requestId,
      });
    }

    // ==========================================================================
    // VALIDATE ACTION - Validate token during login
    // ==========================================================================
    if (params.action === 'validate') {
      const sp = getSpeakeasy();
      if (!sp) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.DEPENDENCY_MISSING, message: 'speakeasy package not installed' },
          requestId,
          status: 500,
        });
      }

      const twoFactor = await prisma.twoFactorAuth.findUnique({
        where: { userId: session.user.id },
      });

      if (!twoFactor?.isEnabled || !twoFactor?.isVerified) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.NOT_ENABLED, message: '2FA is not enabled' },
          requestId,
          status: 400,
        });
      }

      // Check lockout
      if (twoFactor.lockedUntil && twoFactor.lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((twoFactor.lockedUntil.getTime() - Date.now()) / 60000);
        return createResponse(null, {
          success: false,
          error: { 
            code: ERROR_CODES.LOCKED, 
            message: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minutes.` 
          },
          requestId,
          status: 429,
        });
      }

      const token = params.token.replace('-', '').toUpperCase();
      let isValid = false;

      // Try TOTP first (6 digits)
      if (token.length === 6 && /^\d{6}$/.test(token)) {
        const secret = decryptSecret(twoFactor.secret);
        isValid = sp.totp.verify({
          secret,
          encoding: 'base32',
          token,
          window: 1,
        });
      }

      // Try backup code (8 chars)
      if (!isValid && token.length === 8) {
        const hashedToken = hashBackupCode(token);
        const codeIndex = twoFactor.backupCodes.indexOf(hashedToken);
        
        if (codeIndex !== -1) {
          isValid = true;
          // Remove used backup code
          const updatedCodes = [...twoFactor.backupCodes];
          updatedCodes.splice(codeIndex, 1);
          
          await prisma.twoFactorAuth.update({
            where: { userId: session.user.id },
            data: {
              backupCodes: updatedCodes,
              backupCodesUsed: { increment: 1 },
            },
          });
        }
      }

      if (!isValid) {
        const newFailedAttempts = twoFactor.failedAttempts + 1;
        const updates: any = { failedAttempts: newFailedAttempts };

        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
          updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000);
        }

        await prisma.twoFactorAuth.update({
          where: { userId: session.user.id },
          data: updates,
        });

        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: '2FA_VALIDATION_FAILED',
            resourceType: 'USER',
            resourceId: session.user.id,
            ipAddress: clientIp,
            details: JSON.stringify({ failedAttempts: newFailedAttempts }),
            severity: 'WARNING',
          },
        });

        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.INVALID_CODE, message: 'Invalid verification code' },
          requestId,
          status: 400,
        });
      }

      // Success - reset failed attempts
      await prisma.twoFactorAuth.update({
        where: { userId: session.user.id },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
          lastUsedAt: new Date(),
        },
      });

      return createResponse({ validated: true }, {
        success: true,
        message: '2FA validation successful',
        requestId,
      });
    }

    // ==========================================================================
    // REGENERATE BACKUP CODES ACTION
    // ==========================================================================
    if (params.action === 'regenerate_backup') {
      const sp = getSpeakeasy();
      if (!sp) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.DEPENDENCY_MISSING, message: 'speakeasy package not installed' },
          requestId,
          status: 500,
        });
      }

      const twoFactor = await prisma.twoFactorAuth.findUnique({
        where: { userId: session.user.id },
      });

      if (!twoFactor?.isEnabled || !twoFactor?.isVerified) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.NOT_ENABLED, message: '2FA must be enabled to regenerate backup codes' },
          requestId,
          status: 400,
        });
      }

      // Verify current token first
      const secret = decryptSecret(twoFactor.secret);
      const verified = sp.totp.verify({
        secret,
        encoding: 'base32',
        token: params.currentToken,
        window: 1,
      });

      if (!verified) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.INVALID_CODE, message: 'Invalid verification code' },
          requestId,
          status: 400,
        });
      }

      // Generate new backup codes
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = backupCodes.map(hashBackupCode);

      await prisma.twoFactorAuth.update({
        where: { userId: session.user.id },
        data: {
          backupCodes: hashedBackupCodes,
          backupCodesUsed: 0,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: '2FA_BACKUP_CODES_REGENERATED',
          resourceType: 'USER',
          resourceId: session.user.id,
          ipAddress: clientIp,
          severity: 'WARNING',
        },
      });

      return createResponse({ backupCodes }, {
        success: true,
        message: 'New backup codes generated. Store them safely!',
        requestId,
      });
    }

    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid action' },
      requestId,
      status: 400,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/superadmin/settings/2fa error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to process 2FA request' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Disable 2FA
// =============================================================================

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const clientIp = getClientIp(request);

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid } = await verifySuperAdmin(session.user.id);
    if (!isValid) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Get body for token verification
    let body: { token?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Token optional for now
    }

    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    if (!twoFactor?.isEnabled) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.NOT_ENABLED, message: '2FA is not enabled' },
        requestId,
        status: 400,
      });
    }

    // Verify token if provided (recommended)
    if (body.token) {
      const sp = getSpeakeasy();
      if (sp) {
        const secret = decryptSecret(twoFactor.secret);
        const verified = sp.totp.verify({
          secret,
          encoding: 'base32',
          token: body.token,
          window: 1,
        });

        if (!verified) {
          return createResponse(null, {
            success: false,
            error: { code: ERROR_CODES.INVALID_CODE, message: 'Invalid verification code' },
            requestId,
            status: 400,
          });
        }
      }
    }

    // Disable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId: session.user.id },
      data: {
        isEnabled: false,
        disabledAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: '2FA_DISABLED',
        resourceType: 'USER',
        resourceId: session.user.id,
        ipAddress: clientIp,
        severity: 'CRITICAL',
      },
    });

    return createResponse({ disabled: true }, {
      success: true,
      message: '2FA has been disabled',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] DELETE /api/superadmin/settings/2fa error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to disable 2FA' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';