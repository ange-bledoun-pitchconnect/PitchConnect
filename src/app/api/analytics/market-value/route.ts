// ============================================================================
// src/app/api/analytics/market-value/route.ts
// 💰 PitchConnect Enterprise Analytics - Market Value API
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================
// ENDPOINTS:
// - GET /api/analytics/market-value?playerId=xxx - Get player valuation
// - GET /api/analytics/market-value?teamId=xxx - Get team valuations
// - POST /api/analytics/market-value - Generate new valuation
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import {
  calculatePlayerMarketValue,
  calculateTeamMarketValues,
  calculateTeamTotalValue,
  hasAnalyticsAccess,
  type MarketValueAssessment,
} from '@/lib/analytics';

// ============================================================================
// TYPES
// ============================================================================

interface MarketValueResponse {
  success: boolean;
  requestId: string;
  valuation?: MarketValueAssessment;
  valuations?: MarketValueAssessment[];
  teamSummary?: {
    totalValue: number;
    playerCount: number;
    avgValue: number;
    highestValue: { playerId: string; name: string; value: number } | null;
    valueByPosition: Record<string, { count: number; totalValue: number; avgValue: number }>;
  };
  meta: {
    generatedAt: string;
    processingTimeMs: number;
    sport?: string;
    modelVersion: string;
    currency: string;
  };
}

// ============================================================================
// GET - Retrieve Market Valuations
// ============================================================================

/**
 * GET /api/analytics/market-value
 * 
 * Query Parameters:
 * - playerId: string - Get valuation for specific player
 * - teamId: string - Get valuations for all players in team
 * - includeComparables: boolean - Include comparable players (default: true)
 * - includeProjections: boolean - Include future projections (default: true)
 * - sortBy: 'value' | 'trend' | 'change' (default: 'value')
 * - limit: number (default: 50, max: 100)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `mv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn({ requestId }, 'Unauthorized market value request');
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
    
    if (!hasAnalyticsAccess(userRoles, 'market-value')) {
      logger.warn({ requestId, userId: session.user.id, roles: userRoles }, 'Forbidden market value access');
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to access market valuations',
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
    const includeComparables = searchParams.get('includeComparables') !== 'false';
    const includeProjections = searchParams.get('includeProjections') !== 'false';
    const sortBy = searchParams.get('sortBy') || 'value';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

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
    }, 'Market value request');

    // ========================================================================
    // SINGLE PLAYER VALUATION
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

      // Generate valuation
      let valuation = await calculatePlayerMarketValue(playerId);

      // Optionally strip data
      if (!includeComparables) {
        valuation = { ...valuation, comparables: [] };
      }

      if (!includeProjections) {
        valuation = {
          ...valuation,
          valuation: {
            ...valuation.valuation,
            projectedValue6Months: 0,
            projectedValue12Months: 0,
          },
        };
      }

      const sport = player.teamPlayers[0]?.team.club.sport || 'FOOTBALL';

      return NextResponse.json({
        success: true,
        requestId,
        valuation,
        meta: {
          generatedAt: valuation.metadata.generatedAt.toISOString(),
          processingTimeMs: Date.now() - startTime,
          sport,
          modelVersion: valuation.metadata.modelVersion,
          currency: 'GBP', // Could be configurable
        },
      } as MarketValueResponse);
    }

    // ========================================================================
    // TEAM VALUATIONS
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

      // Get all team valuations
      let valuations = await calculateTeamMarketValues(teamId);

      // Sort valuations
      switch (sortBy) {
        case 'trend':
          const trendOrder = { RISING: 0, STABLE: 1, DECLINING: 2 };
          valuations.sort((a, b) => trendOrder[a.trend] - trendOrder[b.trend]);
          break;
        case 'change':
          valuations.sort((a, b) => b.valuation.valueChangePercent - a.valuation.valueChangePercent);
          break;
        case 'value':
        default:
          valuations.sort((a, b) => b.valuation.currentValue - a.valuation.currentValue);
      }

      // Apply limit
      valuations = valuations.slice(0, limit);

      // Optionally strip data
      if (!includeComparables) {
        valuations = valuations.map(v => ({ ...v, comparables: [] }));
      }

      if (!includeProjections) {
        valuations = valuations.map(v => ({
          ...v,
          valuation: {
            ...v.valuation,
            projectedValue6Months: 0,
            projectedValue12Months: 0,
          },
        }));
      }

      // Get team totals
      const teamTotal = await calculateTeamTotalValue(teamId);

      // Calculate value by position
      const valueByPosition: Record<string, { count: number; totalValue: number; avgValue: number }> = {};
      for (const v of valuations) {
        const pos = v.position || 'UNKNOWN';
        if (!valueByPosition[pos]) {
          valueByPosition[pos] = { count: 0, totalValue: 0, avgValue: 0 };
        }
        valueByPosition[pos].count++;
        valueByPosition[pos].totalValue += v.valuation.currentValue;
      }
      
      // Calculate averages
      for (const pos of Object.keys(valueByPosition)) {
        valueByPosition[pos].avgValue = Math.round(
          valueByPosition[pos].totalValue / valueByPosition[pos].count
        );
      }

      // Build team summary
      const teamSummary = {
        teamName: team.name,
        totalValue: teamTotal.totalValue,
        playerCount: teamTotal.playerCount,
        avgValue: teamTotal.avgValue,
        highestValue: teamTotal.highestValue,
        valueByPosition,
        trendDistribution: {
          RISING: valuations.filter(v => v.trend === 'RISING').length,
          STABLE: valuations.filter(v => v.trend === 'STABLE').length,
          DECLINING: valuations.filter(v => v.trend === 'DECLINING').length,
        },
      };

      return NextResponse.json({
        success: true,
        requestId,
        valuations,
        teamSummary,
        meta: {
          generatedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          sport: team.club.sport,
          modelVersion: valuations[0]?.metadata.modelVersion || '2.0.0-market-value',
          currency: 'GBP',
        },
      } as MarketValueResponse);
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
      endpoint: '/api/analytics/market-value',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to calculate market valuation',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Generate New Valuation
// ============================================================================

/**
 * POST /api/analytics/market-value
 * Force generation of new market valuation
 * 
 * Body:
 * - playerId: string (required for single player)
 * - teamId: string (required for team)
 * - forceRefresh: boolean (default: true)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `mv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

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
      ['SUPER_ADMIN', 'MANAGER', 'CLUB_OWNER', 'SCOUT', 'ANALYST'].includes(r)
    );

    if (!canGenerate) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions', requestId },
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

    const { playerId, teamId, forceRefresh = true } = body;

    if (!playerId && !teamId) {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Either playerId or teamId is required', requestId },
        { status: 400 }
      );
    }

    logger.info({ requestId, playerId, teamId, userId: session.user.id }, 'Generating market valuation');

    // Single player
    if (playerId) {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          teamPlayers: {
            where: { isActive: true },
            select: { team: { select: { club: { select: { sport: true } } } } },
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

      const valuation = await calculatePlayerMarketValue(playerId, forceRefresh);
      const sport = player.teamPlayers[0]?.team.club.sport || 'FOOTBALL';

      return NextResponse.json({
        success: true,
        requestId,
        valuation,
        meta: {
          generatedAt: valuation.metadata.generatedAt.toISOString(),
          processingTimeMs: Date.now() - startTime,
          sport,
          modelVersion: valuation.metadata.modelVersion,
          currency: 'GBP',
        },
      } as MarketValueResponse);
    }

    // Team valuations
    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, name: true, club: { select: { sport: true } } },
      });

      if (!team) {
        return NextResponse.json(
          { success: false, error: 'Not Found', message: `Team ${teamId} not found`, requestId },
          { status: 404 }
        );
      }

      const valuations = await calculateTeamMarketValues(teamId);
      const teamTotal = await calculateTeamTotalValue(teamId);

      return NextResponse.json({
        success: true,
        requestId,
        valuations,
        teamSummary: {
          teamName: team.name,
          totalValue: teamTotal.totalValue,
          playerCount: teamTotal.playerCount,
          avgValue: teamTotal.avgValue,
          highestValue: teamTotal.highestValue,
          valueByPosition: {},
        },
        meta: {
          generatedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          sport: team.club.sport,
          modelVersion: valuations[0]?.metadata.modelVersion || '2.0.0-market-value',
          currency: 'GBP',
        },
      } as MarketValueResponse);
    }

    return NextResponse.json(
      { success: false, error: 'Bad Request', message: 'Invalid request', requestId },
      { status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics/market-value',
      method: 'POST',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to generate market valuation',
      },
      { status: 500 }
    );
  }
}