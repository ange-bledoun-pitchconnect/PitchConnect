// ============================================================================
// src/app/api/players/[playerId]/route.ts
// GET - Get specific player | PATCH - Update player
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/middleware';
import {
  validatePosition,
  validateRequired,
  parseJsonBody,
} from '@/lib/api/validation';
import { success, errorResponse } from '@/lib/api/responses';
import { NotFoundError, BadRequestError } from '@/lib/api/errors';
import { logResourceUpdated, logAuditAction } from '@/lib/api/audit';

// GET /api/players/[playerId] - Get specific player with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth(request);
    requireRole(user, [
      'COACH',
      'CLUB_MANAGER',
      'CLUB_OWNER',
      'LEAGUE_ADMIN',
      'SCOUT',
      'ANALYST',
      'SUPERADMIN',
    ]);

    const player = await prisma.player.findUnique({
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
            address: true,
            city: true,
            country: true,
            postalCode: true,
            roles: true,
            status: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        stats: {
          orderBy: { season: 'desc' },
          take: 10,
        },
        injuries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        achievements: {
          orderBy: { earnedAt: 'desc' },
          take: 10,
        },
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            team: {
              select: {
                id: true,
                name: true,
                sport: true,
                club: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    return success(player);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// PATCH /api/players/[playerId] - Update player details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth(request);
    requireRole(user, ['COACH', 'CLUB_MANAGER', 'CLUB_OWNER', 'SUPERADMIN']);

    const body = await parseJsonBody(request);

    // Verify player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { id: params.playerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        secondaryPosition: true,
        preferredFoot: true,
        height: true,
        weight: true,
        status: true,
      },
    });

    if (!existingPlayer) {
      throw new NotFoundError('Player not found');
    }

    const updates: Record<string, any> = {};
    const trackChanges: Record<string, any> = {};

    // Validate and collect updates
    if (body.firstName !== undefined) {
      if (body.firstName.trim().length === 0) {
        throw new BadRequestError('First name cannot be empty');
      }
      updates.firstName = body.firstName;
      trackChanges.firstName = {
        from: existingPlayer.firstName,
        to: body.firstName,
      };
    }

    if (body.lastName !== undefined) {
      if (body.lastName.trim().length === 0) {
        throw new BadRequestError('Last name cannot be empty');
      }
      updates.lastName = body.lastName;
      trackChanges.lastName = {
        from: existingPlayer.lastName,
        to: body.lastName,
      };
    }

    if (body.position !== undefined) {
      validatePosition(body.position);
      updates.position = body.position;
      trackChanges.position = {
        from: existingPlayer.position,
        to: body.position,
      };
    }

    if (body.secondaryPosition !== undefined) {
      if (body.secondaryPosition !== null) {
        validatePosition(body.secondaryPosition);
      }
      updates.secondaryPosition = body.secondaryPosition;
      trackChanges.secondaryPosition = body.secondaryPosition;
    }

    if (body.preferredFoot !== undefined) {
      if (!['LEFT', 'RIGHT', 'BOTH'].includes(body.preferredFoot)) {
        throw new BadRequestError('Invalid preferredFoot. Must be LEFT, RIGHT, or BOTH');
      }
      updates.preferredFoot = body.preferredFoot;
      trackChanges.preferredFoot = {
        from: existingPlayer.preferredFoot,
        to: body.preferredFoot,
      };
    }

    if (body.height !== undefined) {
      updates.height = body.height ? parseFloat(body.height) : null;
      trackChanges.height = {
        from: existingPlayer.height,
        to: body.height ? parseFloat(body.height) : null,
      };
    }

    if (body.weight !== undefined) {
      updates.weight = body.weight ? parseFloat(body.weight) : null;
      trackChanges.weight = {
        from: existingPlayer.weight,
        to: body.weight ? parseFloat(body.weight) : null,
      };
    }

    if (body.status !== undefined) {
      const validStatuses = ['ACTIVE', 'INJURED', 'SUSPENDED', 'INACTIVE'];
      if (!validStatuses.includes(body.status)) {
        throw new BadRequestError(
          'Invalid status. Must be ACTIVE, INJURED, SUSPENDED, or INACTIVE'
        );
      }
      updates.status = body.status;
      trackChanges.status = {
        from: existingPlayer.status,
        to: body.status,
      };
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('No valid updates provided');
    }

    // Update player
    const updated = await prisma.player.update({
      where: { id: params.playerId },
      data: updates,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        contracts: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    // Log audit
    await logResourceUpdated(
      user.id,
      'Player',
      params.playerId,
      `${updated.firstName} ${updated.lastName}`,
      trackChanges,
      `Updated player profile: ${Object.keys(trackChanges).join(', ')}`
    );

    return success(updated);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
