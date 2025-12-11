// ============================================================================
// ENHANCED: /src/app/api/players/[playerId]/route.ts - Player Details
// Get, update, and delete individual player profiles
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAnyRole, requireActivePlayer } from '@/lib/api/middleware/auth';
import { success, errorResponse, noContent } from '@/lib/api/responses';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// GET /api/players/[playerId] - Get Player Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    await requireAuth();

    const player = await requireActivePlayer(params.playerId);

    // Fetch comprehensive player data
    const playerData = await prisma.player.findUnique({
      where: { id: params.playerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phoneNumber: true,
            dateOfBirth: true,
            nationality: true,
          },
        },
        stats: {
          orderBy: { season: 'desc' },
          take: 5,
        },
        contracts: {
          orderBy: { startDate: 'desc' },
        },
        injuries: {
          orderBy: { dateFrom: 'desc' },
        },
        matchAttendance: {
          where: { match: { date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } },
          include: {
            match: {
              select: {
                id: true,
                date: true,
                homeTeam: { select: { name: true } },
                awayTeam: { select: { name: true } },
                status: true,
              },
            },
          },
          take: 10,
        },
        achievements: {
          include: { achievement: true },
          take: 10,
        },
      },
    });

    logger.info(`Retrieved player: ${params.playerId}`);

    return success(playerData);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// ============================================================================
// PUT /api/players/[playerId] - Update Player
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      include: { user: true },
    });

    if (!player) {
      throw new NotFoundError('Player', params.playerId);
    }

    // Authorization: Only the player themselves, club staff, or admins can update
    const isOwnProfile = player.userId === user.id;
    const hasPermission = user.roles.includes('SUPERADMIN') ||
      user.roles.includes('CLUB_MANAGER') ||
      user.roles.includes('COACH');

    if (!isOwnProfile && !hasPermission) {
      throw new ForbiddenError('You can only update your own player profile');
    }

    // Prepare update data
    const updateData: any = {};
    const trackedChanges: any = {};

    const allowedFields = [
      'firstName',
      'lastName',
      'nationality',
      'position',
      'preferredFoot',
      'secondaryPosition',
      'height',
      'weight',
      'shirtNumber',
      'photo',
      'status',
      'dateOfBirth',
    ];

    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined) {
        const oldValue = (player as any)[field];
        const newValue = field === 'dateOfBirth' ? new Date(body[field]) : body[field];

        if (field === 'height' || field === 'weight') {
          updateData[field] = parseFloat(body[field]);
        } else if (field === 'shirtNumber') {
          updateData[field] = body[field] ? parseInt(body[field]) : null;
        } else {
          updateData[field] = newValue;
        }

        if (oldValue !== updateData[field]) {
          trackedChanges[field] = { from: oldValue, to: updateData[field] };
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError('No valid updates provided');
    }

    // Update player
    const updated = await prisma.player.update({
      where: { id: params.playerId },
      data: updateData,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    // Log audit
    await logAuditAction({
      performedById: user.id,
      targetUserId: player.userId,
      action: 'USER_UPDATED',
      entityType: 'Player',
      entityId: params.playerId,
      changes: trackedChanges,
      details: `Updated player profile: ${Object.keys(trackedChanges).join(', ')}`,
    });

    logger.info(`Player updated: ${params.playerId}`);

    return success(updated);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// ============================================================================
// DELETE /api/players/[playerId] - Delete Player
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth();
    requireAnyRole(user, ['SUPERADMIN', 'CLUB_MANAGER']);

    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
    });

    if (!player) {
      throw new NotFoundError('Player', params.playerId);
    }

    // Soft delete by setting status to ARCHIVED
    await prisma.player.update({
      where: { id: params.playerId },
      data: { status: 'ARCHIVED' },
    });

    // Log audit
    await logAuditAction({
      performedById: user.id,
      targetUserId: player.userId,
      action: 'USER_DELETED',
      entityType: 'Player',
      entityId: params.playerId,
      details: `Archived player profile`,
    });

    logger.info(`Player deleted: ${params.playerId}`);

    return noContent();
  } catch (error) {
    return errorResponse(error as Error);
  }
}
