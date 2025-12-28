/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Two-Factor Authentication Disable API
 * Path: src/app/api/auth/2fa/disable/route.ts
 * ============================================================================
 * 
 * POST /api/auth/2fa/disable
 * 
 * Disables 2FA for user account (requires password confirmation)
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import bcrypt from 'bcryptjs';

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
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ========================================================================
    // PARSE REQUEST
    // ========================================================================

    const body = await request.json();
    const { password, code } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to disable 2FA' },
        { status: 400 }
      );
    }

    // ========================================================================
    // VERIFY PASSWORD
    // ========================================================================

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, twoFactorEnabled: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: 'Cannot disable 2FA for OAuth-only accounts' },
        { status: 400 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      logger.warn('Invalid password for 2FA disable', { userId, ip: clientIp });
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // ========================================================================
    // CHECK 2FA STATUS
    // ========================================================================

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled' },
        { status: 400 }
      );
    }

    // ========================================================================
    // DISABLE 2FA
    // ========================================================================

    await prisma.$transaction([
      // Delete 2FA record
      prisma.twoFactorAuth.delete({
        where: { userId },
      }),
      // Update user
      prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false },
      }),
    ]);

    // ========================================================================
    // AUDIT LOG
    // ========================================================================

    logger.info('2FA disabled', {
      userId,
      ip: clientIp,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });

    // ========================================================================
    // RESPONSE
    // ========================================================================

    return NextResponse.json({
      message: 'Two-factor authentication has been disabled',
      twoFactorEnabled: false,
    });

  } catch (error) {
    logger.error('2FA disable error', error as Error, {
      ip: clientIp,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });

    return NextResponse.json(
      { error: 'Failed to disable two-factor authentication' },
      { status: 500 }
    );
  }
}