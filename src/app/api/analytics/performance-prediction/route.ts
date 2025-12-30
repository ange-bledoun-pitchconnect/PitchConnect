// ============================================================================
// src/app/api/analytics/performance-prediction/route.ts
// 📈 PitchConnect Enterprise Analytics - Performance Prediction API
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================
// ENDPOINTS:
// - GET /api/analytics/performance-prediction?playerId=xxx - Get prediction
// - GET /api/analytics/performance-prediction?teamId=xxx - Get team predictions
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import {
  predictPlayerPerformance,
  predictTeamPerformance,
  hasAnalyticsAccess,
  type PerformancePrediction,
  type TimeHorizon,
} from '@/lib/analytics';

// ============================================================================
// TYPES
// ============================================================================

interface PerformancePredictionResponse {
  success: boolean;
  requestId: string;
  prediction?: PerformancePrediction;
  predictions?: PerformancePrediction[];
  meta: {
    generatedAt: string;
    processingTimeMs: number;
    sport?: string;
    timeHorizon: TimeHorizon;
    modelVersion: string;
  };
}

// Valid time horizons
const VALID_HORIZONS: TimeHorizon[] = ['NEXT_MATCH', 'NEXT_WEEK', 'NEXT_MONTH', 'SEASON'];

// ============================================================================
// GET - Retrieve Performance Predictions
// ============================================================================

/**
 * GET /api/analytics/performance-prediction
 * 
 * Query Parameters:
 * - playerId: string - Get prediction for specific player
 * - teamId: string - Get predictions for all players in team
 * - timeHorizon: 'NEXT_MATCH' | 'NEXT_WEEK' | 'NEXT_MONTH' | 'SEASON' (default: 'NEXT_MATCH')
 * - formFilter: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL' - Filter by form
 * - sortBy: 'rating' | 'form' | 'consistency' (default: 'rating')
 * - limit: number (default: 50, max: 100)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `perf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn({ requestId }, 'Unauthorized performance prediction request');
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
    
    if (!hasAnalyticsAccess(userRoles, 'performance')) {
      logger.warn({ requestId, userId: session.user.id, roles: userRoles }, 'Forbidden performance prediction access');
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to access performance predictions',
          requestId,
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // PARSE PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const teamId = searchParams.get('teamId');
    const timeHorizonParam = searchParams.get('timeHorizon') || 'NEXT_MATCH';
    const formFilter = searchParams.get('formFilter');
    const sortBy = searchParams.get('sortBy') || 'rating';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Validate time horizon
    if (!VALID_HORIZONS.includes(timeHorizonParam as TimeHorizon)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: `Invalid timeHorizon. Must be one of: ${VALID_HORIZONS.join(', ')}`,
          requestId,
        },
        { status: 400 }
      );
    }

    const timeHorizon = timeHorizonParam as TimeHorizon;

    // Validate - must provide playerId or teamId
    if (!playerId && !teamId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Either playerId or teamId parameter is required',
          requestId,
        },
        { status: 400 }
      );
    }

    logger.info({
      requestId,
      playerId,
      teamId,
      timeHorizon,
      userId: session.user.id,
    }, 'Performance prediction request');

    // ========================================================================
    // SINGLE PLAYER PREDICTION
    // ========================================================================
    if (playerId) {
      // Check if player exists
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          teamPlayers: {
            where: { isActive: true },
            select: {
              team: {
                select: {
                  club: {
                    select: {
                      sport: true,
                    },
                  },
                },
              },
            },
            take: 1,
          },
        },
      });

      if (!player) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not Found',
            message: `Player with ID ${playerId} not found`,
            requestId,
          },
          { status: 404 }
        );
      }

      // Generate prediction
      const prediction = await predictPlayerPerformance(playerId, timeHorizon);

      const sport = player.teamPlayers[0]?.team.club.sport || 'FOOTBALL';

      return NextResponse.json({
        success: true,
        requestId,
        prediction,
        meta: {
          generatedAt: prediction.metadata.generatedAt.toISOString(),
          processingTimeMs: Date.now() - startTime,
          sport,
          timeHorizon,
          modelVersion: prediction.metadata.modelVersion,
        },
      } as PerformancePredictionResponse);
    }

    // ========================================================================
    // TEAM PREDICTIONS
    // ========================================================================
    if (teamId) {
      // Verify team exists and get sport
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
          club: {
            select: {
              sport: true,
            },
          },
        },
      });

      if (!team) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not Found',
            message: `Team with ID ${teamId} not found`,
            requestId,
          },
          { status: 404 }
        );
      }

      // Get all team predictions
      let predictions = await predictTeamPerformance(teamId, timeHorizon);

      // Apply form filter
      if (formFilter) {
        predictions = predictions.filter(p => p.form.current === formFilter);
      }

      // Sort predictions
      switch (sortBy) {
        case 'form':
          const formOrder = { EXCELLENT: 0, GOOD: 1, AVERAGE: 2, POOR: 3, CRITICAL: 4 };
          predictions.sort((a, b) => formOrder[a.form.current] - formOrder[b.form.current]);
          break;
        case 'consistency':
          predictions.sort((a, b) => b.form.consistency - a.form.consistency);
          break;
        case 'rating':
        default:
          predictions.sort((a, b) => b.predictions.expectedRating - a.predictions.expectedRating);
      }

      // Apply limit
      predictions = predictions.slice(0, limit);

      // Calculate team summary
      const summary = {
        teamName: team.name,
        totalPlayers: predictions.length,
        formDistribution: {
          EXCELLENT: predictions.filter(p => p.form.current === 'EXCELLENT').length,
          GOOD: predictions.filter(p => p.form.current === 'GOOD').length,
          AVERAGE: predictions.filter(p => p.form.current === 'AVERAGE').length,
          POOR: predictions.filter(p => p.form.current === 'POOR').length,
          CRITICAL: predictions.filter(p => p.form.current === 'CRITICAL').length,
        },
        trendDistribution: {
          IMPROVING: predictions.filter(p => p.form.trend === 'IMPROVING').length,
          STABLE: predictions.filter(p => p.form.trend === 'STABLE').length,
          DECLINING: predictions.filter(p => p.form.trend === 'DECLINING').length,
        },
        averageExpectedRating: predictions.length > 0
          ? Math.round(
              predictions.reduce((sum, p) => sum + p.predictions.expectedRating, 0) / predictions.length * 10
            ) / 10
          : 0,
        topPerformers: predictions.slice(0, 5).map(p => ({
          id: p.playerId,
          name: p.playerName,
          expectedRating: p.predictions.expectedRating,
          form: p.form.current,
          trend: p.form.trend,
        })),
      };

      return NextResponse.json({
        success: true,
        requestId,
        predictions,
        summary,
        meta: {
          generatedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          sport: team.club.sport,
          timeHorizon,
          modelVersion: predictions[0]?.metadata.modelVersion || '2.0.0-performance',
        },
      });
    }

    // Should not reach here
    return NextResponse.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Invalid request',
        requestId,
      },
      { status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics/performance-prediction',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to generate performance prediction',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}