// ============================================================================
// src/app/api/analytics/injury-prediction/route.ts
// 🏥 PitchConnect Enterprise Analytics - Injury Risk Prediction API
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================
// ENDPOINTS:
// - GET /api/analytics/injury-prediction?playerId=xxx - Get injury risk
// - GET /api/analytics/injury-prediction?teamId=xxx - Get team injury risks
// - POST /api/analytics/injury-prediction - Generate new prediction
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import {
  predictInjuryRisk,
  predictTeamInjuryRisks,
  hasAnalyticsAccess,
  type InjuryRiskAssessment,
} from '@/lib/analytics';

// ============================================================================
// TYPES
// ============================================================================

interface InjuryPredictionResponse {
  success: boolean;
  requestId: string;
  prediction?: InjuryRiskAssessment;
  predictions?: InjuryRiskAssessment[];
  cached?: boolean;
  meta: {
    generatedAt: string;
    processingTimeMs: number;
    sport?: string;
    modelVersion: string;
  };
}

// ============================================================================
// GET - Retrieve Injury Predictions
// ============================================================================

/**
 * GET /api/analytics/injury-prediction
 * 
 * Query Parameters:
 * - playerId: string - Get prediction for specific player
 * - teamId: string - Get predictions for all players in team
 * - includeRecommendations: boolean - Include recommendations (default: true)
 * - riskLevelFilter: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' - Filter by risk level
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `injury-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn({ requestId }, 'Unauthorized injury prediction request');
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
    
    if (!hasAnalyticsAccess(userRoles, 'injury')) {
      logger.warn({ requestId, userId: session.user.id, roles: userRoles }, 'Forbidden injury prediction access');
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to access injury predictions',
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
    const riskLevelFilter = searchParams.get('riskLevelFilter');
    const includeRecommendations = searchParams.get('includeRecommendations') !== 'false';

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
      userId: session.user.id,
    }, 'Injury prediction request');

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

      // Check for cached/recent prediction
      const recentPrediction = await prisma.prediction.findFirst({
        where: {
          relatedEntityId: playerId,
          relatedEntityType: 'PLAYER',
          type: 'INJURY_RISK',
          validUntil: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      let prediction: InjuryRiskAssessment;
      let cached = false;

      if (recentPrediction && recentPrediction.predictionData) {
        // Use cached prediction
        prediction = recentPrediction.predictionData as unknown as InjuryRiskAssessment;
        cached = true;
        logger.debug({ playerId, requestId }, 'Using cached injury prediction');
      } else {
        // Generate new prediction
        prediction = await predictInjuryRisk(playerId);
      }

      // Optionally strip recommendations
      if (!includeRecommendations) {
        prediction = { ...prediction, recommendations: [] };
      }

      const sport = player.teamPlayers[0]?.team.club.sport || 'FOOTBALL';

      return NextResponse.json({
        success: true,
        requestId,
        prediction,
        cached,
        meta: {
          generatedAt: prediction.metadata.generatedAt.toISOString(),
          processingTimeMs: Date.now() - startTime,
          sport,
          modelVersion: prediction.metadata.modelVersion,
        },
      } as InjuryPredictionResponse);
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

      // Get all team injury predictions
      let predictions = await predictTeamInjuryRisks(teamId);

      // Apply risk level filter
      if (riskLevelFilter) {
        predictions = predictions.filter(p => p.riskLevel === riskLevelFilter);
      }

      // Optionally strip recommendations
      if (!includeRecommendations) {
        predictions = predictions.map(p => ({ ...p, recommendations: [] }));
      }

      // Calculate team summary
      const summary = {
        teamName: team.name,
        totalPlayers: predictions.length,
        riskDistribution: {
          CRITICAL: predictions.filter(p => p.riskLevel === 'CRITICAL').length,
          HIGH: predictions.filter(p => p.riskLevel === 'HIGH').length,
          MEDIUM: predictions.filter(p => p.riskLevel === 'MEDIUM').length,
          LOW: predictions.filter(p => p.riskLevel === 'LOW').length,
        },
        averageRiskScore: predictions.length > 0
          ? Math.round(predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length)
          : 0,
        highRiskPlayers: predictions
          .filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL')
          .map(p => ({
            id: p.playerId,
            name: p.playerName,
            riskLevel: p.riskLevel,
            riskScore: p.riskScore,
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
          modelVersion: predictions[0]?.metadata.modelVersion || '2.0.0-injury',
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
      endpoint: '/api/analytics/injury-prediction',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to generate injury prediction',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Generate New Prediction
// ============================================================================

/**
 * POST /api/analytics/injury-prediction
 * Force generation of new injury prediction
 * 
 * Body:
 * - playerId: string (required)
 * - forceRefresh: boolean (default: true)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `injury-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // Authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', requestId },
        { status: 401 }
      );
    }

    // Authorization - need higher permissions to force generate
    const userRoles = session.user.roles || [];
    const canGenerate = userRoles.some(r => 
      ['SUPER_ADMIN', 'MANAGER', 'HEAD_COACH', 'MEDICAL_STAFF', 'ANALYST'].includes(r)
    );

    if (!canGenerate) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions to generate predictions', requestId },
        { status: 403 }
      );
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Invalid JSON body', requestId },
        { status: 400 }
      );
    }

    const { playerId, forceRefresh = true } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'playerId is required', requestId },
        { status: 400 }
      );
    }

    // Verify player exists
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
                  select: { sport: true },
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
        { success: false, error: 'Not Found', message: `Player ${playerId} not found`, requestId },
        { status: 404 }
      );
    }

    logger.info({ requestId, playerId, userId: session.user.id }, 'Generating injury prediction');

    // Generate prediction
    const prediction = await predictInjuryRisk(playerId, forceRefresh);

    const sport = player.teamPlayers[0]?.team.club.sport || 'FOOTBALL';

    return NextResponse.json({
      success: true,
      requestId,
      prediction,
      cached: false,
      meta: {
        generatedAt: prediction.metadata.generatedAt.toISOString(),
        processingTimeMs: Date.now() - startTime,
        sport,
        modelVersion: prediction.metadata.modelVersion,
      },
    } as InjuryPredictionResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics/injury-prediction',
      method: 'POST',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to generate injury prediction',
      },
      { status: 500 }
    );
  }
}