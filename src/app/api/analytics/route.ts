// ============================================================================
// src/app/api/analytics/route.ts
// 📊 PitchConnect Enterprise Analytics - Main API Endpoint
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================
// ENDPOINTS:
// - GET /api/analytics - Health check and available endpoints
// - DELETE /api/analytics - Clear analytics cache (admin only)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logging';
import { clearAllCache, getCacheStats } from '@/lib/cache/redis';
import {
  hasAnalyticsAccess,
  getAvailableFeatures,
  getSupportedSports,
  ANALYTICS_MODEL_VERSIONS,
} from '@/lib/analytics';

// ============================================================================
// GET - Health Check & Available Endpoints
// ============================================================================

/**
 * GET /api/analytics
 * Returns health status and available analytics endpoints
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `analytics-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const session = await auth();

    if (!session?.user?.id) {
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

    const userRoles = session.user.roles || [];
    const availableFeatures = getAvailableFeatures(userRoles);
    const supportedSports = getSupportedSports();

    // Get cache stats if admin
    const cacheStats = userRoles.includes('SUPER_ADMIN') || userRoles.includes('ANALYST')
      ? getCacheStats()
      : null;

    const endpoints = [
      {
        path: '/api/analytics/advanced',
        method: 'GET',
        description: 'Multi-dimensional analytics with leaderboards and trends',
        requiredAccess: 'advanced',
        available: availableFeatures.includes('ALL') || availableFeatures.includes('advanced'),
      },
      {
        path: '/api/analytics/competitions',
        method: 'GET',
        description: 'Competition/league analytics and standings',
        requiredAccess: 'competition',
        available: availableFeatures.includes('ALL') || availableFeatures.includes('competition'),
      },
      {
        path: '/api/analytics/formation-optimization',
        method: 'POST',
        description: 'Formation analysis and squad optimization',
        requiredAccess: 'formation',
        available: availableFeatures.includes('ALL') || availableFeatures.includes('formation'),
      },
      {
        path: '/api/analytics/injury-prediction',
        method: 'GET',
        description: 'Player injury risk assessment',
        requiredAccess: 'injury',
        available: availableFeatures.includes('ALL') || availableFeatures.includes('injury'),
      },
      {
        path: '/api/analytics/market-value',
        method: 'GET',
        description: 'Player market valuation for transfers',
        requiredAccess: 'market-value',
        available: availableFeatures.includes('ALL') || availableFeatures.includes('market-value'),
      },
      {
        path: '/api/analytics/matches',
        method: 'GET',
        description: 'Match analytics and statistics',
        requiredAccess: 'matches',
        available: availableFeatures.includes('ALL') || availableFeatures.includes('matches'),
      },
      {
        path: '/api/analytics/performance-prediction',
        method: 'GET',
        description: 'Player performance forecasting',
        requiredAccess: 'performance',
        available: availableFeatures.includes('ALL') || availableFeatures.includes('performance'),
      },
      {
        path: '/api/analytics/player-comparison',
        method: 'GET',
        description: 'Head-to-head player comparison',
        requiredAccess: 'comparison',
        available: availableFeatures.includes('ALL') || availableFeatures.includes('comparison'),
      },
      {
        path: '/api/analytics/players',
        method: 'GET',
        description: 'Player analytics and aggregates',
        requiredAccess: 'player',
        available: availableFeatures.includes('ALL') || availableFeatures.includes('player'),
      },
      {
        path: '/api/analytics/teams',
        method: 'GET',
        description: 'Team performance analytics',
        requiredAccess: 'team',
        available: availableFeatures.includes('ALL') || availableFeatures.includes('team'),
      },
    ];

    return NextResponse.json({
      success: true,
      requestId,
      status: 'healthy',
      version: '2.0.0',
      modelVersions: ANALYTICS_MODEL_VERSIONS,
      supportedSports,
      user: {
        id: session.user.id,
        roles: userRoles,
        availableFeatures,
      },
      endpoints: endpoints.filter(e => e.available),
      allEndpoints: userRoles.includes('SUPER_ADMIN') ? endpoints : undefined,
      cache: cacheStats,
      meta: {
        generatedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        status: 'unhealthy',
        error: 'Internal Server Error',
        message: 'Analytics service health check failed',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Clear Analytics Cache (Admin Only)
// ============================================================================

/**
 * DELETE /api/analytics
 * Clear all analytics cache (admin only)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const requestId = `analytics-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', requestId },
        { status: 401 }
      );
    }

    const userRoles = session.user.roles || [];
    
    // Only SUPER_ADMIN can clear cache
    if (!userRoles.includes('SUPER_ADMIN')) {
      logger.warn({ requestId, userId: session.user.id }, 'Unauthorized cache clear attempt');
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Only administrators can clear analytics cache', requestId },
        { status: 403 }
      );
    }

    const statsBefore = getCacheStats();

    await clearAllCache();

    const statsAfter = getCacheStats();

    logger.info({
      requestId,
      userId: session.user.id,
      entriesCleared: statsBefore.entries,
    }, 'Analytics cache cleared');

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Analytics cache cleared successfully',
      before: statsBefore,
      after: statsAfter,
      meta: {
        clearedAt: new Date().toISOString(),
        clearedBy: session.user.id,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics',
      method: 'DELETE',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to clear analytics cache',
      },
      { status: 500 }
    );
  }
}