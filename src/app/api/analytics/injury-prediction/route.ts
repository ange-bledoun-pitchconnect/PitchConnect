import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { predictInjuryRisk } from '@/lib/analytics/injury-predictor';

/**
 * GET /api/analytics/injury-prediction?playerId=xxx
 * Get injury risk prediction for a player
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json(
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

    // Check if prediction already exists and is recent
    const existingPrediction = await prisma.injuryPrediction.findFirst({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
    });

    // Reuse if less than 24 hours old
    if (existingPrediction && 
        new Date().getTime() - existingPrediction.updatedAt.getTime() < 86400000) {
      return NextResponse.json({
        success: true,
        prediction: existingPrediction,
        cached: true,
      });
    }

    // Generate new prediction
    const prediction = await predictInjuryRisk(playerId);

    return NextResponse.json({
      success: true,
      prediction,
      cached: false,
    });
  } catch (error) {
    logger.error('Injury prediction error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate injury prediction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
