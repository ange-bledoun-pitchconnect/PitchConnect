// ============================================================================
// FILE 1: src/app/api/players/[playerId]/stats/route.ts
// GET /api/players/[playerId]/stats
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/api/logger';

interface StatsParams {
  params: { playerId: string };
}

export async function GET(request: NextRequest, { params }: StatsParams): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    logger.info(`[${requestId}] GET /api/players/${params.playerId}/stats - Start`);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Get season from query params
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') ? parseInt(searchParams.get('season')!) : new Date().getFullYear();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Fetch player stats
    const stats = await prisma.playerSeason.findMany({
      where: {
        playerId: params.playerId,
        season: season === 0 ? undefined : season,
      },
      select: {
        id: true,
        season: true,
        appearances: true,
        goals: true,
        assists: true,
        minutesPlayed: true,
        passingAccuracy: true,
        tackles: true,
        interceptions: true,
        yellowCards: true,
        redCards: true,
        expectedGoals: true,
        expectedAssists: true,
        averageRating: true,
        marketValue: true,
        team: { select: { id: true, name: true } },
      },
      orderBy: { season: 'desc' },
      take: limit,
    });

    if (stats.length === 0) {
      // Return empty stats for new players
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: 'No statistics found for this player',
          timestamp: new Date().toISOString(),
        },
        { status: 200, headers: { 'X-Request-ID': requestId, 'Cache-Control': 'max-age=3600' } }
      );
    }

    // Calculate career totals
    const careerTotals = {
      totalAppearances: stats.reduce((sum, s) => sum + s.appearances, 0),
      totalGoals: stats.reduce((sum, s) => sum + s.goals, 0),
      totalAssists: stats.reduce((sum, s) => sum + s.assists, 0),
      totalMinutes: stats.reduce((sum, s) => sum + s.minutesPlayed, 0),
      averageRating: (stats.reduce((sum, s) => sum + (s.averageRating || 0), 0) / stats.length).toFixed(2),
    };

    const duration = performance.now() - startTime;
    logger.info(`[${requestId}] GET /api/players/${params.playerId}/stats - Success`, {
      duration: Math.round(duration),
      seasons: stats.length,
    });

    return NextResponse.json(
      {
        success: true,
        data: stats,
        careerTotals,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'X-Request-ID': requestId, 'X-Response-Time': `${Math.round(duration)}ms` } }
    );
  } catch (error) {
    logger.error(`[${requestId}] GET /api/players/${params.playerId}/stats - Error`, {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch player statistics', code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
