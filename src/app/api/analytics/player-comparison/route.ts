// ============================================================================
// src/app/api/analytics/player-comparison/route.ts
// ⚖️ PitchConnect Enterprise Analytics - Player Comparison API
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================
// ENDPOINT:
// - GET /api/analytics/player-comparison?player1Id=xxx&player2Id=yyy
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import {
  comparePlayerStats,
  hasAnalyticsAccess,
  type PlayerComparison,
} from '@/lib/analytics';

// ============================================================================
// TYPES
// ============================================================================

interface ComparisonResponse {
  success: boolean;
  requestId: string;
  comparison: PlayerComparison;
  meta: {
    generatedAt: string;
    processingTimeMs: number;
    sport: string;
    modelVersion: string;
  };
}

// ============================================================================
// GET - Compare Two Players
// ============================================================================

/**
 * GET /api/analytics/player-comparison
 * 
 * Query Parameters:
 * - player1Id: string (required) - First player ID
 * - player2Id: string (required) - Second player ID
 * - includeStrengths: boolean - Include detailed strengths analysis (default: true)
 * - includeValueComparison: boolean - Include market value comparison (default: true)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn({ requestId }, 'Unauthorized player comparison request');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          requestId,
        },
        { status: 401 }
      );
    }

    // ========================================================================
    // AUTHORIZATION
    // ========================================================================
    const userRoles = session.user.roles || [];
    
    if (!hasAnalyticsAccess(userRoles, 'comparison')) {
      logger.warn({ requestId, userId: session.user.id, roles: userRoles }, 'Forbidden comparison access');
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to access player comparisons',
          requestId,
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // PARSE PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const player1Id = searchParams.get('player1Id');
    const player2Id = searchParams.get('player2Id');
    const includeStrengths = searchParams.get('includeStrengths') !== 'false';
    const includeValueComparison = searchParams.get('includeValueComparison') !== 'false';

    // Validate required parameters
    if (!player1Id || !player2Id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Both player1Id and player2Id parameters are required',
          requestId,
        },
        { status: 400 }
      );
    }

    // Cannot compare player to themselves
    if (player1Id === player2Id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Cannot compare a player to themselves',
          requestId,
        },
        { status: 400 }
      );
    }

    logger.info({
      requestId,
      player1Id,
      player2Id,
      userId: session.user.id,
    }, 'Player comparison request');

    // ========================================================================
    // VALIDATE PLAYERS EXIST
    // ========================================================================
    const [player1, player2] = await Promise.all([
      prisma.player.findUnique({
        where: { id: player1Id },
        select: {
          id: true,
          user: {
            select: { firstName: true, lastName: true },
          },
          teamPlayers: {
            where: { isActive: true },
            select: {
              team: {
                select: {
                  club: {
                    select: { sport: true },
                  },
                },
              },
            },
            take: 1,
          },
        },
      }),
      prisma.player.findUnique({
        where: { id: player2Id },
        select: {
          id: true,
          user: {
            select: { firstName: true, lastName: true },
          },
          teamPlayers: {
            where: { isActive: true },
            select: {
              team: {
                select: {
                  club: {
                    select: { sport: true },
                  },
                },
              },
            },
            take: 1,
          },
        },
      }),
    ]);

    if (!player1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: `Player 1 with ID ${player1Id} not found`,
          requestId,
        },
        { status: 404 }
      );
    }

    if (!player2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: `Player 2 with ID ${player2Id} not found`,
          requestId,
        },
        { status: 404 }
      );
    }

    // ========================================================================
    // GENERATE COMPARISON
    // ========================================================================
    let comparison = await comparePlayerStats(player1Id, player2Id);

    // Optionally strip detailed analyses
    if (!includeStrengths) {
      comparison = {
        ...comparison,
        strengthsComparison: {
          player1Advantages: [],
          player2Advantages: [],
          sharedStrengths: [],
        },
      };
    }

    if (!includeValueComparison) {
      comparison = {
        ...comparison,
        valueComparison: {
          player1Value: 0,
          player2Value: 0,
          valueDifference: 0,
          betterValue: 'EQUAL',
        },
      };
    }

    // Determine sport (prefer player1's sport)
    const sport = player1.teamPlayers[0]?.team.club.sport || 
                  player2.teamPlayers[0]?.team.club.sport || 
                  'FOOTBALL';

    return NextResponse.json({
      success: true,
      requestId,
      comparison,
      meta: {
        generatedAt: comparison.metadata.generatedAt.toISOString(),
        processingTimeMs: Date.now() - startTime,
        sport,
        modelVersion: comparison.metadata.modelVersion,
      },
    } as ComparisonResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics/player-comparison',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to generate player comparison',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}