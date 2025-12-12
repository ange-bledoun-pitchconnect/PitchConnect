// ============================================================================
// WORLD-CLASS NEW: /src/app/api/teams/[teamId]/members/route.ts
// Team Member Management (Add, Update, Remove)
// VERSION: 3.0 - Production Grade
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

interface MembersParams {
  params: { teamId: string };
}

// ============================================================================
// PATCH /api/teams/[teamId]/members - Update Member Details
// Body:
//   - userId: string (required)
//   - number: number | null (optional)
//   - role: string (optional)
//   - isCaptain: boolean (optional)
//   - status: string (optional)
// ============================================================================

export async function PATCH(request: NextRequest, { params }: MembersParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] PATCH /api/teams/[${params.teamId}]/members`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401 }
      );
    }

    // ✅ Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    // ✅ Validate required userId
    if (!body.userId) {
      throw new BadRequestError('userId is required');
    }

    // ✅ Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: { club: { select: { ownerId: true } } },
    });

    if (!team) {
      throw new NotFoundError('Team', params.teamId);
    }

    if (!isSuperAdmin && session.user.id !== team.club.ownerId) {
      throw new ForbiddenError('Only club owner or SUPERADMIN can update team members');
    }

    // ✅ Find existing member
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: params.teamId, userId: body.userId } },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!existingMember) {
      throw new NotFoundError('Team member', body.userId);
    }

    // ✅ If setting new captain, unset previous captain
    if (body.isCaptain === true) {
      await prisma.teamMember.updateMany({
        where: { teamId: params.teamId, isCaptain: true },
        data: { isCaptain: false },
      });
    }

    // ✅ Prepare update data
    const updateData: any = {};
    const changes: any = {};

    if (body.number !== undefined) {
      const newNumber = body.number ? parseInt(body.number, 10) : null;
      if (newNumber !== null && (newNumber < 1 || newNumber > 99)) {
        throw new BadRequestError('Jersey number must be between 1 and 99');
      }
      if (newNumber !== existingMember.number) {
        updateData.number = newNumber;
        changes.number = { from: existingMember.number, to: newNumber };
      }
    }

    if (body.role !== undefined && body.role !== existingMember.role) {
      updateData.role = body.role;
      changes.role = { from: existingMember.role, to: body.role };
    }

    if (body.isCaptain !== undefined && body.isCaptain !== existingMember.isCaptain) {
      updateData.isCaptain = body.isCaptain;
      changes.isCaptain = { from: existingMember.isCaptain, to: body.isCaptain };
    }

    if (body.status !== undefined && body.status !== existingMember.status) {
      updateData.status = body.status;
      changes.status = { from: existingMember.status, to: body.status };
    }

    // ✅ If no changes, return 200 with no action
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No changes were made',
          data: existingMember,
        },
        { status: 200 }
      );
    }

    // ✅ Update member
    const updatedMember = await prisma.teamMember.update({
      where: { teamId_userId: { teamId: params.teamId, userId: body.userId } },
      data: updateData,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: 'USER_UPDATED',
      entityType: 'TeamMember',
      entityId: updatedMember.id,
      changes,
      details: `Updated ${updatedMember.user.firstName} ${updatedMember.user.lastName} in team. Changed: ${Object.keys(changes).join(', ')}`,
    });

    logger.info(
      `[${requestId}] Successfully updated team member ${body.userId}`,
      { changedFields: Object.keys(changes) }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Team member updated successfully',
        data: updatedMember,
        changes,
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      `[${requestId}] Error in PATCH /api/teams/[${params.teamId}]/members:`,
      error
    );

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message, code: 'ACCESS_DENIED', requestId },
        { status: 403 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message, code: 'INVALID_INPUT', requestId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to update team member',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/teams/[teamId]/members - Remove Member from Team
// Query Params:
//   - userId: string (required)
// ============================================================================

export async function DELETE(request: NextRequest, { params }: MembersParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] DELETE /api/teams/[${params.teamId}]/members`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401 }
      );
    }

    // ✅ Parse query parameter
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      throw new BadRequestError('userId query parameter is required');
    }

    // ✅ Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: { club: { select: { ownerId: true } } },
    });

    if (!team) {
      throw new NotFoundError('Team', params.teamId);
    }

    if (!isSuperAdmin && session.user.id !== team.club.ownerId) {
      throw new ForbiddenError('Only club owner or SUPERADMIN can remove members');
    }

    // ✅ Find member
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: params.teamId, userId } },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!member) {
      throw new NotFoundError('Team member', userId);
    }

    // ✅ Delete member (soft delete: set leftAt)
    const removedMember = await prisma.teamMember.update({
      where: { teamId_userId: { teamId: params.teamId, userId } },
      data: { leftAt: new Date(), status: 'INACTIVE' },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: 'USER_DELETED',
      entityType: 'TeamMember',
      entityId: member.id,
      details: `Removed ${member.user.firstName} ${member.user.lastName} from team`,
    });

    logger.info(`[${requestId}] Successfully removed member ${userId} from team`);

    return NextResponse.json(
      {
        success: true,
        message: 'Team member removed successfully',
        data: { id: removedMember.id, userId, leftAt: removedMember.leftAt },
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      `[${requestId}] Error in DELETE /api/teams/[${params.teamId}]/members:`,
      error
    );

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message, code: 'ACCESS_DENIED', requestId },
        { status: 403 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message, code: 'INVALID_INPUT', requestId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to remove team member',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
