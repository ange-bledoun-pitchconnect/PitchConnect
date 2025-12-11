// ============================================================================
// ENHANCED: /src/app/api/leagues/[leagueId]/standings/live/route.ts
// Real-time league standings with live match integration
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/middleware/auth';
import { success, errorResponse } from '@/lib/api/responses';
import { NotFoundError, BadRequestError } from '@/lib/api/errors';
import { logger } from '@/lib/api/logger';

/**
 * GET /api/leagues/[leagueId]/standings/live
 * Get real-time league standings with live match data
 * Auto-updates when matches are in progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } },
) {
  try {
    const user = await requireAuth();

    // Validate league exists
    const league = await prisma.league.findUnique({
      where: { id: params.leagueId },
      select: {
        id: true,
        name: true,
        status: true,
        season: true,
        pointsWin: true,
        pointsDraw: true,
        pointsLoss: true,
      },
    });

    if (!league) {
      return errorResponse(new NotFoundError('League'), 404);
    }

    // Get all standings
    const standings = await prisma.standing.findMany({
      where: { leagueId: params.leagueId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    // Get live/recent matches to determine if standings are updating
    const recentMatches = await prisma.match.findMany({
      where: {
        fixture: { leagueId: params.leagueId },
        status: { in: ['LIVE', 'COMPLETED'] },
      },
      select: { id: true, status: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1,
    });

    const lastUpdate = recentMatches?.updatedAt
      ? new Date(recentMatches.updatedAt)
      : new Date();

    logger.info(`Retrieved live standings for league ${params.leagueId}`, {
      standingsCount: standings.length,
      liveMatches: recentMatches.length,
    });

    return success({
      standings,
      leagueId: params.leagueId,
      leagueName: league.name,
      season: league.season,
      status: league.status,
      lastUpdated: lastUpdate.toISOString(),
      isLive: recentMatches.some((m) => m.status === 'LIVE'),
    });
  } catch (error) {
    logger.error('Error fetching live standings:', error);
    return errorResponse(error as Error);
  }
}
