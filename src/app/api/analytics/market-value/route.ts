import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { analyzeMarketValue } from '@/lib/analytics/market-value-analyzer';

/**
 * GET /api/analytics/market-value?playerId=xxx
 * Analyze player market value
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeMarketValue(playerId);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    logger.error('Market value analysis error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze market value',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
