// ============================================================================
// ENHANCED: /src/app/api/players/route.ts - Player Management (List & Create)
// Comprehensive player management with filtering, pagination, and validation
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAnyRole, requirePlayerProfile } from '@/lib/api/middleware/auth';
import { success, paginated, created, errorResponse } from '@/lib/api/responses';
import { BadRequestError, NotFoundError, ConflictError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// GET /api/players - List Players with Filters
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '25'));
    const skip = (page - 1) * limit;

    // Filter parameters
    const search = url.searchParams.get('search')?.trim();
    const position = url.searchParams.get('position');
    const preferredFoot = url.searchParams.get('preferredFoot');
    const status = url.searchParams.get('status') || 'ACTIVE';
    const teamId = url.searchParams.get('teamId');
    const clubId = url.searchParams.get('clubId');
    const minHeight = url.searchParams.get('minHeight')
      ? parseFloat(url.searchParams.get('minHeight')!)
      : undefined;
    const maxHeight = url.searchParams.get('maxHeight')
      ? parseFloat(url.searchParams.get('maxHeight')!)
      : undefined;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (position) {
      where.position = position;
    }

    if (preferredFoot) {
      where.preferredFoot = preferredFoot;
    }

    if (minHeight || maxHeight) {
      where.height = {};
      if (minHeight) where.height.gte = minHeight;
      if (maxHeight) where.height.lte = maxHeight;
    }

    if (teamId) {
      where.teamMemberships = {
        some: {
          teamId,
          status: 'ACTIVE',
        },
      };
    }

    // Get total count
    const total = await prisma.player.count({ where });

    // Fetch players with relationships
    const players = await prisma.player.findMany({
      where,
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
        stats: {
          where: { season: new Date().getFullYear() },
          take: 1,
        },
        contracts: {
          where: { status: 'ACTIVE' },
        },
        injuries: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
        matchAttendance: {
          where: { match: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
          include: { match: true },
          take: 5,
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      take: limit,
    });

    logger.info(`Retrieved ${players.length} players (page ${page})`);

    return paginated(players, { page, limit, total });
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// ============================================================================
// POST /api/players - Create Player
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireAnyRole(user, ['SUPERADMIN', 'CLUB_MANAGER', 'CLUB_OWNER', 'COACH']);

    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      throw new BadRequestError('userId is required');
    }

    if (!body.firstName || !body.lastName) {
      throw new BadRequestError('firstName and lastName are required');
    }

    if (!body.position) {
      throw new BadRequestError('position is required');
    }

    if (!body.preferredFoot) {
      throw new BadRequestError('preferredFoot is required');
    }

    if (!body.dateOfBirth) {
      throw new BadRequestError('dateOfBirth is required');
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!targetUser) {
      throw new NotFoundError('User', body.userId);
    }

    // Check if player already exists for this user
    const existingPlayer = await prisma.player.findUnique({
      where: { userId: body.userId },
    });

    if (existingPlayer) {
      throw new ConflictError(`Player profile already exists for user ${body.userId}`);
    }

    // Ensure user has PLAYER role
    if (!targetUser.roles.includes('PLAYER')) {
      await prisma.user.update({
        where: { id: body.userId },
        data: {
          roles: [...targetUser.roles, 'PLAYER'],
        },
      });
    }

    // Create player
    const player = await prisma.player.create({
      data: {
        userId: body.userId,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: new Date(body.dateOfBirth),
        nationality: body.nationality || 'Unknown',
        position: body.position,
        preferredFoot: body.preferredFoot,
        secondaryPosition: body.secondaryPosition,
        height: body.height ? parseFloat(body.height) : undefined,
        weight: body.weight ? parseFloat(body.weight) : undefined,
        shirtNumber: body.shirtNumber ? parseInt(body.shirtNumber) : undefined,
        photo: body.photo,
        status: body.status || 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log audit
    await logAuditAction({
      performedById: user.id,
      action: 'USER_CREATED',
      entityType: 'Player',
      entityId: player.id,
      changes: {
        firstName: player.firstName,
        lastName: player.lastName,
        position: player.position,
      },
      details: `Created player profile for user ${body.userId}`,
    });

    logger.info(`Player created: ${player.id}`);

    return created(player);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
