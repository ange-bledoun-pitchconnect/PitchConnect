import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { optimizeFormation } from '@/lib/analytics/formation-optimizer';

/**
 * POST /api/analytics/formation-optimization
 * Generate optimal formation for upcoming match
 * 
 * Body:
 * {
 *   teamId: string (required)
 *   opponentTeamId: string (optional)
 *   opponentStrengths: string[] (optional)
 *   opponentWeaknesses: string[] (optional)
 *   availablePlayers: string[] (required)
 *   injuredPlayers: string[] (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { teamId, opponentTeamId, availablePlayers, injuredPlayers = [] } = body;

    if (!teamId || !availablePlayers?.length) {
      return NextResponse.json(
        { error: 'teamId and availablePlayers are required' },
        { status: 400 }
      );
    }

    const optimization = await optimizeFormation({
      teamId,
      opponentTeamId,
      availablePlayers,
      injuredPlayers,
      ...body,
    });

    return NextResponse.json({
      success: true,
      optimization,
    });
  } catch (error) {
    logger.error('Formation optimization error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to optimize formation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
