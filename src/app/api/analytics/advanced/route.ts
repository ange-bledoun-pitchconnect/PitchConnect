// ============================================================================
// ENHANCED: /src/app/api/analytics/advanced/route.ts
// Advanced Analytics with Player & Team Performance Data
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/middleware/auth';
import { success, errorResponse } from '@/lib/api/responses';
import { BadRequestError } from '@/lib/api/errors';
import { logger } from '@/lib/api/logger';

/**
 * GET /api/analytics/advanced
 * Retrieve advanced analytics for league, club, or player
 * 
 * Query params:
 * - leagueId: Optional league ID
 * - clubId: Optional club ID
 * - playerId: Optional player ID
 * - timeRange: 'week' | 'month' | 'season' (default: 'season')
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;

    const leagueId = searchParams.get('leagueId');
    const clubId = searchParams.get('clubId');
    const playerId = searchParams.get('playerId');
    const timeRange = (searchParams.get('timeRange') || 'season') as
      | 'week'
      | 'month'
      | 'season';

    if (!leagueId && !clubId && !playerId) {
      return errorResponse(
        new BadRequestError('Must provide leagueId, clubId, or playerId'),
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'season':
        startDate.setMonth(0);
        break;
    }

    // Fetch matches in range
    const matches = await prisma.match.findMany({
      where: {
        fixture: leagueId ? { leagueId } : undefined,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        result: true,
        homeClub: { select: { id: true, name: true } },
        awayClub: { select: { id: true, name: true } },
        fixture: { select: { leagueId: true } },
      },
    });

    // Build analytics response
    const analytics = {
      topScorers: [] as any[],
      topAssists: [] as any[],
      topCleanSheets: [] as any[],
      bestAttack: [] as any[],
      bestDefense: [] as any[],
    };

    // Fetch player stats if leagueId provided
    if (leagueId) {
      const playerStats = await prisma.playerStatistic.findMany({
        where: {
          player: {
            club: {
              leagueId,
            },
          },
        },
        include: {
          player: { select: { id: true, firstName: true, lastName: true, position: true } },
        },
        orderBy: { goals: 'desc' },
        take: 10,
      });

      analytics.topScorers = playerStats.map((stat) => ({
        playerId: stat.player.id,
        playerName: `${stat.player.firstName} ${stat.player.lastName}`,
        position: stat.player.position,
        goals: stat.goals,
        assists: stat.assists,
        appearances: stat.appearances,
      }));
    }

    logger.info('Retrieved advanced analytics', {
      leagueId,
      clubId,
      playerId,
      timeRange,
    });

    return success(analytics);
  } catch (error) {
    logger.error('Error fetching advanced analytics:', error);
    return errorResponse(error as Error);
  }
}
