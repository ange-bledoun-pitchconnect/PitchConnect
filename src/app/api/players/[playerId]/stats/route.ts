// ============================================================================
// ENHANCED: /src/app/api/players/[playerId]/stats/route.ts - Player Statistics
// Get and create player performance statistics
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAnyRole, requireActivePlayer } from '@/lib/api/middleware/auth';
import { success, paginated, created, errorResponse } from '@/lib/api/responses';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// GET /api/players/[playerId]/stats - Get Player Statistics
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    await requireAuth();

    await requireActivePlayer(params.playerId);

    // Parse query parameters
    const url = new URL(request.url);
    const season = url.searchParams.get('season')
      ? parseInt(url.searchParams.get('season')!)
      : new Date().getFullYear();
    const teamId = url.searchParams.get('teamId');

    // Build where clause
    const where: any = {
      playerId: params.playerId,
      season,
    };

    if (teamId) {
      where.teamId = teamId;
    }

    // Get stats
    const stats = await prisma.playerStats.findMany({
      where,
      include: {
        player: {
          select: { firstName: true, lastName: true, position: true },
        },
      },
      orderBy: { season: 'desc' },
    });

    if (stats.length === 0) {
      return success({ stats: [] });
    }

    logger.info(`Retrieved stats for player ${params.playerId}, season ${season}`);

    return success(stats);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// ============================================================================
// POST /api/players/[playerId]/stats - Create/Update Player Statistics
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth();
    requireAnyRole(user, ['SUPERADMIN', 'COACH', 'ANALYST']);

    await requireActivePlayer(params.playerId);

    const body = await request.json();

    // Validate required fields
    if (!body.season) {
      throw new BadRequestError('season is required');
    }

    const season = parseInt(body.season);
    const currentYear = new Date().getFullYear();

    if (season < currentYear - 5 || season > currentYear + 1) {
      throw new BadRequestError('season must be within valid range');
    }

    // Check if stats already exist for this player/season
    const existing = await prisma.playerStats.findFirst({
      where: {
        playerId: params.playerId,
        season,
        teamId: body.teamId || null,
      },
    });

    // Prepare stats data
    const statsData = {
      appearances: body.appearances ? parseInt(body.appearances) : 0,
      goals: body.goals ? parseInt(body.goals) : 0,
      assists: body.assists ? parseInt(body.assists) : 0,
      minutesPlayed: body.minutesPlayed ? parseInt(body.minutesPlayed) : 0,
      passingAccuracy: body.passingAccuracy ? parseFloat(body.passingAccuracy) : undefined,
      passes: body.passes ? parseInt(body.passes) : undefined,
      passesCompleted: body.passesCompleted ? parseInt(body.passesCompleted) : undefined,
      tackles: body.tackles ? parseInt(body.tackles) : undefined,
      interceptions: body.interceptions ? parseInt(body.interceptions) : undefined,
      clearances: body.clearances ? parseInt(body.clearances) : undefined,
      blocks: body.blocks ? parseInt(body.blocks) : undefined,
      shotsOnTarget: body.shotsOnTarget ? parseInt(body.shotsOnTarget) : undefined,
      totalShots: body.totalShots ? parseInt(body.totalShots) : undefined,
      expectedGoals: body.expectedGoals ? parseFloat(body.expectedGoals) : undefined,
      expectedAssists: body.expectedAssists ? parseFloat(body.expectedAssists) : undefined,
      sprintDistance: body.sprintDistance ? parseFloat(body.sprintDistance) : undefined,
      topSpeed: body.topSpeed ? parseFloat(body.topSpeed) : undefined,
      acceleration: body.acceleration ? parseFloat(body.acceleration) : undefined,
      jumpHeight: body.jumpHeight ? parseFloat(body.jumpHeight) : undefined,
      dribbles: body.dribbles ? parseInt(body.dribbles) : undefined,
      foulsCommitted: body.foulsCommitted ? parseInt(body.foulsCommitted) : undefined,
      foulsDrawn: body.foulsDrawn ? parseInt(body.foulsDrawn) : undefined,
      yellowCards: body.yellowCards ? parseInt(body.yellowCards) : undefined,
      redCards: body.redCards ? parseInt(body.redCards) : undefined,
    };

    let stats;

    if (existing) {
      // Update existing stats
      stats = await prisma.playerStats.update({
        where: { id: existing.id },
        data: statsData,
      });

      logger.info(`Updated stats for player ${params.playerId}, season ${season}`);
    } else {
      // Create new stats
      stats = await prisma.playerStats.create({
        data: {
          playerId: params.playerId,
          season,
          teamId: body.teamId,
          ...statsData,
        },
      });

      logger.info(`Created stats for player ${params.playerId}, season ${season}`);
    }

    // Log audit
    await logAuditAction({
      performedById: user.id,
      action: existing ? 'USER_UPDATED' : 'USER_CREATED',
      entityType: 'PlayerStats',
      entityId: stats.id,
      changes: statsData,
      details: `${existing ? 'Updated' : 'Created'} player statistics for season ${season}`,
    });

    return created(stats);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
