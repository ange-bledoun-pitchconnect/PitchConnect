/**
 * ============================================================================
 * src/app/api/superadmin/users/[userId]/route.ts
 * Individual User Management API
 * - GET: Fetch single user details
 * - PATCH: Update user (roles, status, SuperAdmin)
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

// GET - Fetch single user details
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = params;

    console.log(`\n👤 Fetching user: ${userId}`);

    // Fetch user with subscription (FIXED: removed userRoles since it doesn't exist)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          select: {
            tier: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`✅ User found: ${user.email}`);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality,
        roles: user.roles || [], // FIXED: use roles array directly from User model
        status: user.status,
        isSuperAdmin: user.isSuperAdmin,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString() || null,
        subscription: user.subscription
          ? {
              tier: user.subscription.tier,
              status: user.subscription.status,
              currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH - Update user (roles, status, SuperAdmin, info)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      roles,
      status,
      isSuperAdmin: makeSuperAdmin,
    } = body;

    console.log(`\n✏️ Updating user: ${userId}`);
    console.log('📝 Changes:', body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (roles !== undefined) updateData.roles = roles; // FIXED: roles is array field in User model
    if (status !== undefined) updateData.status = status;
    if (makeSuperAdmin !== undefined) updateData.isSuperAdmin = makeSuperAdmin;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        subscription: {
          select: {
            tier: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    // Create audit log
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (adminUser) {
      await prisma.auditLog.create({
        data: {
          action: 'USER_UPDATED',
          performedBy: adminUser.id,
          affectedUser: userId,
          details: JSON.stringify({
            changes: body,
            timestamp: new Date().toISOString(),
          }),
        },
      }).catch((err) => {
        console.error('Failed to create audit log:', err);
      });
    }

    console.log(`✅ User updated successfully: ${updatedUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        avatar: updatedUser.avatar,
        dateOfBirth: updatedUser.dateOfBirth,
        nationality: updatedUser.nationality,
        roles: updatedUser.roles || [], // FIXED: use roles array directly
        status: updatedUser.status,
        isSuperAdmin: updatedUser.isSuperAdmin,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
        lastLogin: updatedUser.lastLogin?.toISOString() || null,
        subscription: updatedUser.subscription
          ? {
              tier: updatedUser.subscription.tier,
              status: updatedUser.subscription.status,
              currentPeriodEnd: updatedUser.subscription.currentPeriodEnd?.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
