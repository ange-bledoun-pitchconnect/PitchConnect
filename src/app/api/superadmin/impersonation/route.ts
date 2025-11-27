// src/app/api/superadmin/impersonation/route.ts
/**
 * SuperAdmin Impersonation API
 * GET  - Get impersonation sessions
 * POST - Start/end impersonation
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkSuperAdminSession, createAuditLog } from '@/lib/superadmin-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const sessions = await prisma.impersonationSession.findMany({
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(
      {
        success: true,
        data: sessions.map((session) => ({
          id: session.id,
          adminId: session.adminId,
          targetUserId: session.targetUserId,
          adminUser: session.admin,
          targetUser: session.targetUser,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          status: session.endedAt ? 'ENDED' : 'ACTIVE',
        })),
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] Impersonation GET error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch impersonation sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();
    const body = await request.json();
    const { action, targetUserId, reason = '', sessionId } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    // ACTION: START IMPERSONATION
    if (action === 'start') {
      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'targetUserId is required' },
          { status: 400 }
        );
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'Target user not found' },
          { status: 404 }
        );
      }

      // Get client IP
      const ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'UNKNOWN';

      const userAgent = request.headers.get('user-agent') || 'UNKNOWN';

      const session = await prisma.impersonationSession.create({
        data: {
          adminId: admin.id,
          targetUserId,
          ipAddress,
          userAgent,
          reason,
        },
      });

      await createAuditLog(admin.id, targetUserId, 'USER_IMPERSONATED', {
        sessionId: session.id,
        reason,
        ipAddress,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Impersonation started',
          data: {
            sessionId: session.id,
            targetUserId: session.targetUserId,
          },
        },
        { status: 201 }
      );
    }

    // ACTION: END IMPERSONATION
    else if (action === 'end') {
      if (!sessionId) {
        return NextResponse.json(
          { success: false, error: 'sessionId is required' },
          { status: 400 }
        );
      }

      const session = await prisma.impersonationSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }

      if (session.adminId !== admin.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: You can only end your own sessions' },
          { status: 403 }
        );
      }

      const duration = Math.floor(
        (Date.now() - session.startedAt.getTime()) / 1000 / 60
      ); // in minutes

      await prisma.impersonationSession.update({
        where: { id: sessionId },
        data: { endedAt: new Date() },
      });

      await createAuditLog(admin.id, session.targetUserId, 'IMPERSONATION_ENDED', {
        sessionId,
        durationMinutes: duration,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Impersonation ended',
          data: { sessionId, durationMinutes: duration },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[SuperAdmin] Impersonation POST error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process impersonation' },
      { status: 500 }
    );
  }
}