import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { comparePlayersDetailed } from '@/lib/analytics/player-comparator';

/**
 * GET /api/analytics/player-comparison?player1Id=xxx&player2Id=yyy
 * Compare two players in detail
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
    const player1Id = searchParams.get('player1Id');
    const player2Id = searchParams.get('player2Id');

    if (!player1Id || !player2Id) {
      return NextResponse.json(
        { error: 'player1Id and player2Id are required' },
        { status: 400 }
      );
    }

    const comparison = await comparePlayersDetailed(player1Id, player2Id);

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error) {
    logger.error('Player comparison error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to compare players',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
