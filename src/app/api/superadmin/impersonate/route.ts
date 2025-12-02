import { verifySuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySuperAdmin(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Missing required field: targetUserId' },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    console.log(`🎭 SuperAdmin ${session.user.email} impersonating ${targetUser.email}`);

    // Log impersonation for audit trail
    await prisma.auditLog.create({
      data: {
        action: 'IMPERSONATE_USER',
        userId: session.user.id,
        targetId: targetUserId,
        metadata: {
          superAdminEmail: session.user.email,
          targetUserEmail: targetUser.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        impersonatingUser: {
          id: targetUser.id,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          roles: targetUser.roles,
        },
      },
    });
  } catch (error) {
    console.error('❌ Impersonate User Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
