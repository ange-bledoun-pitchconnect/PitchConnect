import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { predictPlayerPerformance } from '@/lib/analytics/performance-predictor';

/**
 * GET /api/analytics/performance-prediction?playerId=xxx&timeHorizon=NEXT_MATCH
 * Predict player performance for upcoming period
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
    const timeHorizon = searchParams.get('timeHorizon') || 'NEXT_MATCH';

    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId is required' },
        { status: 400 }
      );
    }

    const prediction = await predictPlayerPerformance(playerId, timeHorizon as any);

    return NextResponse.json({
      success: true,
      prediction,
    });
  } catch (error) {
    logger.error('Performance prediction error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate performance prediction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
