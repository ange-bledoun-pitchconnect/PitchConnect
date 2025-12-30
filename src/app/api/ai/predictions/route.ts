// ============================================================================
// src/app/api/ai/predictions/route.ts
// 🤖 PitchConnect Enterprise AI - Predictions Gateway API
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// PURPOSE: Central gateway for AI predictions, health checks, and cache stats
// ============================================================================
// ENDPOINTS:
// - GET  /api/ai/predictions       → Health check + system status
// - POST /api/ai/predictions       → Generate & store prediction
// - DELETE /api/ai/predictions     → Clear prediction cache (admin only)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import {
  getCacheStats,
  clearAllCache,
  buildAccessContext,
  canCreatePredictions,
  MODEL_VERSION,
  getSupportedSports,
} from '@/lib/ai';
import type { 
  PredictionType, 
  PredictionStatus, 
  PredictionImpact,
  Sport,
} from '@prisma/client';

// ============================================================================
// GET - Health Check & System Status
// ============================================================================

/**
 * GET /api/ai/predictions
 * Returns AI engine health status, cache statistics, and supported features
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `ai-health-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // Authentication (optional for health check)
    const session = await auth();

    // Get cache statistics
    const cacheStats = getCacheStats();

    // Get supported sports
    const supportedSports = getSupportedSports();

    // Get prediction counts from database (if authenticated)
    let predictionStats = null;
    if (session?.user) {
      const [totalPredictions, activePredictions, verifiedPredictions] = await Promise.all([
        prisma.prediction.count(),
        prisma.prediction.count({ where: { status: 'ACTIVE' } }),
        prisma.prediction.count({ 
          where: { 
            status: { in: ['VERIFIED_CORRECT', 'VERIFIED_INCORRECT', 'PARTIALLY_CORRECT'] } 
          } 
        }),
      ]);

      predictionStats = {
        total: totalPredictions,
        active: activePredictions,
        verified: verifiedPredictions,
        pendingVerification: totalPredictions - verifiedPredictions,
      };
    }

    // Build response
    const response = {
      success: true,
      requestId,
      status: 'healthy',
      engine: {
        name: 'PitchConnect AI Prediction Engine',
        version: MODEL_VERSION,
        status: 'operational',
        capabilities: [
          'Match outcome predictions',
          'Player performance forecasting',
          'Team analytics & projections',
          'Injury risk assessment',
          'Strategic recommendations',
        ],
        supportedSports,
        predictionTypes: [
          'MATCH_OUTCOME',
          'SCORE_PREDICTION',
          'PLAYER_PERFORMANCE',
          'FORM_TREND',
          'GOALS_ASSISTS',
          'INJURY_RISK',
          'FATIGUE_LEVEL',
          'RECOVERY_TIME',
          'LINEUP',
          'TACTICAL_MATCHUP',
          'TEAM_CHEMISTRY',
          'POTENTIAL_RATING',
          'DEVELOPMENT_PATH',
        ],
      },
      cache: {
        status: 'operational',
        hitRate: `${cacheStats.hitRate}%`,
        totalEntries: cacheStats.sizes.total,
        breakdown: cacheStats.sizes,
        stats: {
          hits: cacheStats.stats.hits,
          misses: cacheStats.stats.misses,
          evictions: cacheStats.stats.evictions,
        },
        lastCleanup: cacheStats.stats.lastCleanup.toISOString(),
      },
      ...(predictionStats && { predictions: predictionStats }),
      endpoints: {
        matches: '/api/ai/predictions/matches',
        players: '/api/ai/predictions/players',
        teams: '/api/ai/predictions/teams',
        recommendations: '/api/ai/recommendations',
      },
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
    };

    logger.info('AI health check completed', { requestId, processingTime: Date.now() - startTime });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('AI health check failed', error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/ai/predictions',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// ============================================================================
// POST - Generate & Store Prediction
// ============================================================================

/**
 * POST /api/ai/predictions
 * Generate a new prediction and store it in the database
 * 
 * Request Body:
 * {
 *   type: PredictionType,
 *   entityType: 'match' | 'player' | 'team',
 *   entityId: string,
 *   sport?: Sport,
 *   organisationId?: string,
 *   clubId?: string,
 *   options?: {
 *     storeResult?: boolean,
 *     validityHours?: number,
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `ai-pred-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user) {
      logger.warn('Unauthorized prediction request', { requestId });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized', 
          message: 'Authentication required to generate predictions' 
        },
        { status: 401 }
      );
    }

    // ========================================================================
    // REQUEST VALIDATION
    // ========================================================================
    const body = await request.json();
    const { 
      type, 
      entityType, 
      entityId, 
      sport,
      organisationId,
      clubId,
      options = {} 
    } = body;

    // Validate required fields
    if (!type || !entityType || !entityId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Missing required fields: type, entityType, entityId',
        },
        { status: 400 }
      );
    }

    // Validate prediction type
    const validTypes: PredictionType[] = [
      'MATCH_OUTCOME', 'SCORE_PREDICTION', 'PLAYER_PERFORMANCE', 'FORM_TREND',
      'GOALS_ASSISTS', 'INJURY_RISK', 'FATIGUE_LEVEL', 'RECOVERY_TIME',
      'MARKET_VALUE', 'TRANSFER_LIKELIHOOD', 'CONTRACT_VALUE', 'FORMATION',
      'LINEUP', 'TACTICAL_MATCHUP', 'POTENTIAL_RATING', 'DEVELOPMENT_PATH',
      'TEAM_CHEMISTRY', 'RECRUITMENT_FIT', 'PERFORMANCE',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: `Invalid prediction type. Valid types: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // PERMISSION CHECK
    // ========================================================================
    const context = buildAccessContext(
      session.user.id,
      session.user.roles || [],
      session.user.permissions || [],
      organisationId,
      clubId
    );

    if (!canCreatePredictions(context)) {
      logger.warn('Permission denied for prediction creation', { 
        requestId, 
        userId: session.user.id,
        roles: session.user.roles,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to generate predictions',
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // ENTITY VALIDATION
    // ========================================================================
    let entity: any = null;
    let entityName = '';
    let detectedSport: Sport = sport || 'FOOTBALL';

    switch (entityType) {
      case 'match':
        entity = await prisma.match.findUnique({
          where: { id: entityId },
          include: {
            homeClub: { select: { id: true, name: true, sport: true } },
            awayClub: { select: { id: true, name: true } },
            competition: { select: { sport: true } },
          },
        });
        if (entity) {
          entityName = `${entity.homeClub.name} vs ${entity.awayClub.name}`;
          detectedSport = entity.competition?.sport || entity.homeClub.sport;
        }
        break;

      case 'player':
        entity = await prisma.player.findUnique({
          where: { id: entityId },
          include: {
            user: { select: { firstName: true, lastName: true } },
            teamPlayers: {
              where: { isActive: true },
              include: {
                team: {
                  include: { club: { select: { sport: true } } },
                },
              },
              take: 1,
            },
          },
        });
        if (entity) {
          entityName = `${entity.user.firstName} ${entity.user.lastName}`;
          detectedSport = entity.teamPlayers[0]?.team.club.sport || 'FOOTBALL';
        }
        break;

      case 'team':
        entity = await prisma.team.findUnique({
          where: { id: entityId },
          include: {
            club: { select: { id: true, name: true, sport: true } },
          },
        });
        if (entity) {
          entityName = entity.name;
          detectedSport = entity.club.sport;
        }
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Bad Request',
            message: 'Invalid entityType. Must be: match, player, or team',
          },
          { status: 400 }
        );
    }

    if (!entity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: `${entityType} with ID ${entityId} not found`,
        },
        { status: 404 }
      );
    }

    // ========================================================================
    // GENERATE PREDICTION (Placeholder - actual prediction logic in specific routes)
    // ========================================================================
    const validityHours = options.validityHours || 24;
    const validUntil = new Date(Date.now() + validityHours * 60 * 60 * 1000);

    // Determine impact level based on type
    let impact: PredictionImpact = 'MEDIUM';
    if (['INJURY_RISK', 'MATCH_OUTCOME', 'TACTICAL_MATCHUP'].includes(type)) {
      impact = 'HIGH';
    } else if (['DEVELOPMENT_PATH', 'POTENTIAL_RATING'].includes(type)) {
      impact = 'LOW';
    }

    // Create prediction record
    const prediction = await prisma.prediction.create({
      data: {
        type: type as PredictionType,
        status: 'PENDING' as PredictionStatus,
        impact,
        title: `${type.replace(/_/g, ' ')} Prediction`,
        description: `AI-generated ${type.toLowerCase().replace(/_/g, ' ')} prediction for ${entityName}`,
        confidence: 0.75, // Placeholder - actual confidence from prediction engine
        relatedEntityType: entityType,
        relatedEntityId: entityId,
        relatedEntityName: entityName,
        sport: detectedSport,
        modelVersion: MODEL_VERSION,
        modelName: 'PitchConnect Enterprise AI',
        dataSourcesUsed: ['historical_performance', 'form_analysis', 'squad_data'],
        validFrom: new Date(),
        validUntil,
        createdBy: session.user.id,
        organisationId,
        clubId,
        predictionData: {
          requestId,
          generatedAt: new Date().toISOString(),
          entityType,
          options,
        },
        recommendedActions: [],
        riskFactors: [],
        opportunities: [],
        tags: [entityType, detectedSport.toLowerCase(), type.toLowerCase()],
        isPublic: false,
      },
    });

    logger.info('Prediction created', {
      requestId,
      predictionId: prediction.id,
      type,
      entityType,
      entityId,
      processingTime: Date.now() - startTime,
    });

    // ========================================================================
    // RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        success: true,
        requestId,
        prediction: {
          id: prediction.id,
          type: prediction.type,
          status: prediction.status,
          title: prediction.title,
          entity: {
            type: entityType,
            id: entityId,
            name: entityName,
          },
          sport: detectedSport,
          confidence: prediction.confidence,
          validUntil: prediction.validUntil,
          createdAt: prediction.createdAt,
        },
        message: `Prediction generated successfully. Access detailed results at /api/ai/predictions/${entityType}s?${entityType}Id=${entityId}`,
        links: {
          detail: `/api/ai/predictions/${entityType}s?${entityType}Id=${entityId}`,
          feedback: `/api/ai/predictions/${prediction.id}/feedback`,
        },
        processingTime: `${Date.now() - startTime}ms`,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Prediction generation failed', error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/ai/predictions',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to generate prediction',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Clear Prediction Cache (Admin Only)
// ============================================================================

/**
 * DELETE /api/ai/predictions
 * Clear all prediction caches (admin only)
 */
export async function DELETE(request: NextRequest) {
  const requestId = `ai-cache-clear-${Date.now()}`;

  try {
    // Authentication required
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Admin only
    const isAdmin = session.user.roles?.includes('SUPER_ADMIN') || 
                    session.user.permissions?.includes('PREDICTIONS_MANAGE');

    if (!isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden',
          message: 'Only administrators can clear the prediction cache',
        },
        { status: 403 }
      );
    }

    // Clear cache
    clearAllCache();

    logger.info('Prediction cache cleared', {
      requestId,
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: 'Prediction cache cleared successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Cache clear failed', error instanceof Error ? error : new Error(errorMessage), {
      requestId,
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to clear cache',
      },
      { status: 500 }
    );
  }
}