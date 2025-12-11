// ============================================================================
// ENHANCED: /src/app/api/matches/[matchId]/route.ts - Match Details
// Get and update individual match information
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAnyRole, requireMatch } from '@/lib/api/middleware/auth';
import { success, errorResponse } from '@/lib/api/responses';
import { BadRequestError, ForbiddenError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// GET /api/matches/[matchId] - Get Match Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    await requireAuth();

    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        homeTeam: {
          include: {
            members: {
              select: {
                id: true,
                userId: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        awayTeam: {
          include: {
            members: {
              select: {
                id: true,
                userId: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        referee: { select: { id: true, licenseNumber: true } },
        events: {
          include: { player: { select: { firstName: true, lastName: true } } },
          orderBy: { minute: 'asc' },
        },
        playerAttendances: {
          include: {
            player: {
              select: { firstName: true, lastName: true, shirtNumber: true },
            },
          },
        },
        stats: true,
        fixture: { select: { matchweek: true, season: true } },
      },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    logger.info(`Retrieved match: ${params.matchId}`);

    return success(match);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// ============================================================================
// PUT /api/matches/[matchId] - Update Match
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const user = await requireAuth();
    requireAnyRole(user, ['SUPERADMIN', 'LEAGUE_ADMIN', 'REFEREE']);

    const match = await requireMatch(params.matchId);
    const body = await request.json();

    // Prepare update data
    const updateData: any = {};
    const trackedChanges: any = {};

    const allowedFields = [
      'status',
      'homeGoals',
      'awayGoals',
      'attendance',
      'venue',
      'notes',
    ];

    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined) {
        const oldValue = (match as any)[field];
        const newValue = field === 'homeGoals' || field === 'awayGoals' || field === 'attendance'
          ? parseInt(body[field])
          : body[field];

        if (oldValue !== newValue) {
          updateData[field] = newValue;
          trackedChanges[field] = { from: oldValue, to: newValue };
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError('No valid updates provided');
    }

    // Update match
    const updated = await prisma.match.update({
      where: { id: params.matchId },
      data: updateData,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    // Log audit
    await logAuditAction({
      performedById: user.id,
      action: 'MATCH_RESULT_UPDATED',
      entityType: 'Match',
      entityId: params.matchId,
      changes: trackedChanges,
      details: `Updated match details: ${Object.keys(trackedChanges).join(', ')}`,
    });

    logger.info(`Match updated: ${params.matchId}`);

    return success(updated);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
