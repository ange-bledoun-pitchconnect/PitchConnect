/**
 * SuperAdmin Upgrade Requests API
 * Handle user role upgrade requests
 * @route GET    /api/superadmin/upgrade-requests - Get all requests
 * @route POST   /api/superadmin/upgrade-requests - Create request (user-facing)
 * @route PATCH  /api/superadmin/upgrade-requests - Approve/Reject request
 * @access SuperAdmin only (except POST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

// ============================================================================
// GET - Fetch All Upgrade Requests
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // SuperAdmin check
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filters
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Fetch requests
    const requests = await prisma.upgradeRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            roles: true,
            status: true,
          },
        },
      },
    });

    // Get total count
    const total = await prisma.upgradeRequest.count({ where });

    // Format response
    const formattedRequests = requests.map((request) => ({
      id: request.id,
      user: {
        id: request.user.id,
        name: `${request.user.firstName} ${request.user.lastName}`,
        email: request.user.email,
        avatar: request.user.avatar,
        currentRoles: request.user.roles,
        status: request.user.status,
      },
      currentRole: request.currentRole,
      requestedRole: request.requestedRole,
      reason: request.reason,
      status: request.status,
      requestedAt: request.createdAt.toISOString(),
      reviewedBy: request.reviewedBy,
      reviewedAt: request.reviewedAt?.toISOString(),
      reviewNotes: request.reviewNotes,
    }));

    return NextResponse.json(
      {
        requests: formattedRequests,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Upgrade Requests GET Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create New Upgrade Request (User-Facing)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { requestedRole, reason } = body;

    // Validation
    if (!requestedRole || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: requestedRole, reason' },
        { status: 400 }
      );
    }

    if (reason.length < 20) {
      return NextResponse.json(
        { error: 'Reason must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Valid roles for upgrade
    const validRoles = ['PLAYER_PRO', 'COACH', 'CLUB_MANAGER', 'LEAGUE_ADMIN'];
    if (!validRoles.includes(requestedRole)) {
      return NextResponse.json(
        { error: 'Invalid role requested' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        roles: true,
        upgradeRequests: {
          where: { status: 'PENDING' },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has pending request
    if (user.upgradeRequests.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending upgrade request' },
        { status: 400 }
      );
    }

    // Determine current role (highest role)
    const roleHierarchy = ['PLAYER', 'PLAYER_PRO', 'COACH', 'CLUB_MANAGER', 'LEAGUE_ADMIN'];
    const currentRole = user.roles
      .map(role => roleHierarchy.indexOf(role))
      .sort((a, b) => b - a)
      .map(index => roleHierarchy[index])[0] || 'PLAYER';

    // Check if requested role is higher than current
    const currentRoleIndex = roleHierarchy.indexOf(currentRole);
    const requestedRoleIndex = roleHierarchy.indexOf(requestedRole);

    if (requestedRoleIndex <= currentRoleIndex) {
      return NextResponse.json(
        { error: 'Cannot request downgrade or same role' },
        { status: 400 }
      );
    }

    // Create upgrade request
    const upgradeRequest = await prisma.upgradeRequest.create({
      data: {
        userId: user.id,
        currentRole,
        requestedRole,
        reason,
        status: 'PENDING',
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM_ALERT',
        title: 'Upgrade Request Submitted',
        message: `Your request to upgrade to ${requestedRole} has been submitted and is pending review.`,
        link: '/dashboard/settings',
      },
    });

    return NextResponse.json(
      {
        message: 'Upgrade request submitted successfully',
        request: {
          id: upgradeRequest.id,
          requestedRole: upgradeRequest.requestedRole,
          status: upgradeRequest.status,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Upgrade Request POST Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Approve or Reject Upgrade Request
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // SuperAdmin check
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get SuperAdmin user
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Get request body
    const body = await request.json();
    const { requestId, action, reviewNotes } = body;

    // Validation
    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId, action' },
        { status: 400 }
      );
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be APPROVE or REJECT' },
        { status: 400 }
      );
    }

    // Get upgrade request
    const upgradeRequest = await prisma.upgradeRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            roles: true,
          },
        },
      },
    });

    if (!upgradeRequest) {
      return NextResponse.json(
        { error: 'Upgrade request not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (upgradeRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Request already ${upgradeRequest.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.upgradeRequest.update({
        where: { id: requestId },
        data: {
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || null,
        },
      });

      // If approved, update user role
      if (action === 'APPROVE') {
        // Add new role to user's roles array
        const updatedRoles = [...new Set([...upgradeRequest.user.roles, upgradeRequest.requestedRole])];
        
        await tx.user.update({
          where: { id: upgradeRequest.userId },
          data: {
            roles: updatedRoles,
          },
        });

        // Create notification for user
        await tx.notification.create({
          data: {
            userId: upgradeRequest.userId,
            type: 'UPGRADE_REQUEST_APPROVED',
            title: 'Upgrade Request Approved! 🎉',
            message: `Your request to upgrade to ${upgradeRequest.requestedRole} has been approved. You now have access to new features!`,
            link: '/dashboard',
          },
        });

        // Log audit trail
        await tx.auditLog.create({
          data: {
            performedBy: adminUser.id,
            affectedUser: upgradeRequest.userId,
            action: 'UPGRADE_REQUEST_APPROVED',
            entityType: 'UpgradeRequest',
            entityId: requestId,
            previousValue: {
              roles: upgradeRequest.user.roles,
              requestStatus: 'PENDING',
            },
            newValue: {
              roles: updatedRoles,
              requestStatus: 'APPROVED',
            },
            reason: reviewNotes || 'Upgrade request approved by SuperAdmin',
          },
        });
      } else {
        // If rejected, create notification
        await tx.notification.create({
          data: {
            userId: upgradeRequest.userId,
            type: 'UPGRADE_REQUEST_REJECTED',
            title: 'Upgrade Request Not Approved',
            message: `Your request to upgrade to ${upgradeRequest.requestedRole} was not approved. ${reviewNotes || 'Please contact support for more information.'}`,
            link: '/dashboard/settings',
          },
        });

        // Log audit trail
        await tx.auditLog.create({
          data: {
            performedBy: adminUser.id,
            affectedUser: upgradeRequest.userId,
            action: 'UPGRADE_REQUEST_REJECTED',
            entityType: 'UpgradeRequest',
            entityId: requestId,
            reason: reviewNotes || 'Upgrade request rejected by SuperAdmin',
          },
        });
      }

      return updatedRequest;
    });

    return NextResponse.json(
      {
        message: `Upgrade request ${action.toLowerCase()}d successfully`,
        request: {
          id: result.id,
          status: result.status,
          reviewedBy: result.reviewedBy,
          reviewedAt: result.reviewedAt,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Upgrade Request PATCH Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Export route segment config
// ============================================================================
export const dynamic = 'force-dynamic';
export const revalidate = 0;
