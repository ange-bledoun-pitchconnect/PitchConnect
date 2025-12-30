// ============================================================================
// src/app/api/analytics/players/route.ts
// 👤 PitchConnect Enterprise Analytics - Player Analytics API
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================
// ENDPOINT:
// - GET /api/analytics/players - Get player analytics with aggregates
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import { getOrSetCache } from '@/lib/cache/redis';
import {
  hasAnalyticsAccess,
  getKeyMetricsForSport,
  type PlayerAnalytics,
} from '@/lib/analytics';
import type { Sport, Position } from '@prisma/client';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes
const CACHE_PREFIX = 'analytics:players';

// ============================================================================
// GET - Retrieve Player Analytics
// ============================================================================

/**
 * GET /api/analytics/players
 * Get comprehensive player analytics
 * 
 * Query Parameters:
 *   - playerId: string - Get specific player analytics
 *   - teamId: string - Filter by team
 *   - clubId: string - Filter by club
 *   - competitionId: string - Filter by competition (via team)
 *   - sport: Sport enum - Filter by sport
 *   - position: Position enum - Filter by position
 *   - season: string - Filter by season
 *   - minAppearances: number - Minimum appearances filter
 *   - sort: 'rating' | 'goals' | 'assists' | 'minutes' | 'form' (default: 'rating')
 *   - sortOrder: 'asc' | 'desc' (default: 'desc')
 *   - limit: number (default: 50, max: 200)
 *   - offset: number (default: 0)
 * 
 * Returns: 200 OK with player analytics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn({ requestId }, 'Unauthorized player analytics request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', requestId },
        { status: 401 }
      );
    }

    // ========================================================================
    // AUTHORIZATION
    // ========================================================================
    const userRoles = session.user.roles || [];
    
    if (!hasAnalyticsAccess(userRoles, 'player')) {
      logger.warn({ requestId, userId: session.user.id, roles: userRoles }, 'Forbidden player analytics access');
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'You do not have permission to access player analytics', requestId },
        { status: 403 }
      );
    }

    // ========================================================================
    // PARSE PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const teamId = searchParams.get('teamId');
    const clubId = searchParams.get('clubId');
    const competitionId = searchParams.get('competitionId');
    const sport = searchParams.get('sport') as Sport | null;
    const position = searchParams.get('position') as Position | null;
    const season = searchParams.get('season');
    const minAppearances = parseInt(searchParams.get('minAppearances') || '0');
    const sort = searchParams.get('sort') || 'rating';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    logger.info({
      requestId,
      playerId,
      teamId,
      clubId,
      sport,
      position,
      userId: session.user.id,
    }, 'Player analytics request');

    // ========================================================================
    // SINGLE PLAYER ANALYTICS
    // ========================================================================
    if (playerId) {
      const analytics = await generatePlayerAnalytics(playerId, season);

      if (!analytics) {
        return NextResponse.json(
          { success: false, error: 'Not Found', message: `Player with ID ${playerId} not found`, requestId },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        requestId,
        player: analytics,
        meta: {
          generatedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          sport: analytics.sport,
        },
      });
    }

    // ========================================================================
    // MULTIPLE PLAYERS ANALYTICS
    // ========================================================================
    
    // Build team filter
    let teamIds: string[] = [];
    
    if (teamId) {
      teamIds = [teamId];
    } else if (clubId) {
      const clubTeams = await prisma.team.findMany({
        where: { clubId },
        select: { id: true },
      });
      teamIds = clubTeams.map(t => t.id);
    } else if (competitionId) {
      const competitionTeams = await prisma.competitionTeam.findMany({
        where: { competitionId },
        select: { teamId: true },
      });
      teamIds = competitionTeams.map(t => t.teamId);
    }

    // Build player where clause
    const playerWhereClause: any = {
      deletedAt: null,
    };

    if (teamIds.length > 0) {
      playerWhereClause.teamPlayers = {
        some: {
          teamId: { in: teamIds },
          isActive: true,
        },
      };
    }

    if (position) {
      playerWhereClause.OR = [
        { primaryPosition: position },
        { secondaryPosition: position },
      ];
    }

    if (sport) {
      playerWhereClause.teamPlayers = {
        ...playerWhereClause.teamPlayers,
        some: {
          ...playerWhereClause.teamPlayers?.some,
          team: {
            club: {
              sport,
            },
          },
        },
      };
    }

    // Fetch players
    const players = await prisma.player.findMany({
      where: playerWhereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
        teamPlayers: {
          where: { isActive: true },
          include: {
            team: {
              include: {
                club: {
                  select: {
                    id: true,
                    name: true,
                    sport: true,
                  },
                },
              },
            },
          },
          take: 1,
        },
        matchPerformances: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            rating: true,
            goals: true,
            assists: true,
            minutesPlayed: true,
            startedMatch: true,
            createdAt: true,
          },
        },
        statistics: {
          where: season ? { season } : undefined,
          orderBy: { season: 'desc' },
          take: 1,
        },
        injuries: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
      skip: offset,
      take: limit,
    });

    // Build analytics for each player
    let playerAnalytics = players.map(player => buildPlayerAnalyticsFromData(player));

    // Filter by minimum appearances
    if (minAppearances > 0) {
      playerAnalytics = playerAnalytics.filter(p => p.stats.appearances >= minAppearances);
    }

    // Sort results
    playerAnalytics.sort((a, b) => {
      let valueA: number;
      let valueB: number;

      switch (sort) {
        case 'goals':
          valueA = a.stats.goals;
          valueB = b.stats.goals;
          break;
        case 'assists':
          valueA = a.stats.assists;
          valueB = b.stats.assists;
          break;
        case 'minutes':
          valueA = a.stats.minutesPlayed;
          valueB = b.stats.minutesPlayed;
          break;
        case 'form':
          valueA = a.ratings.form;
          valueB = b.ratings.form;
          break;
        case 'rating':
        default:
          valueA = a.ratings.overall;
          valueB = b.ratings.overall;
      }

      return sortOrder === 'desc' ? valueB - valueA : valueA - valueB;
    });

    // ========================================================================
    // CALCULATE AGGREGATES
    // ========================================================================
    const aggregates = {
      totalPlayers: playerAnalytics.length,
      averageRating: playerAnalytics.length > 0
        ? Math.round(
            (playerAnalytics.reduce((sum, p) => sum + p.ratings.overall, 0) / playerAnalytics.length) * 10
          ) / 10
        : 0,
      topScorers: [...playerAnalytics]
        .sort((a, b) => b.stats.goals - a.stats.goals)
        .slice(0, 5)
        .map(p => ({
          playerId: p.playerId,
          name: p.playerName,
          goals: p.stats.goals,
        })),
      topAssisters: [...playerAnalytics]
        .sort((a, b) => b.stats.assists - a.stats.assists)
        .slice(0, 5)
        .map(p => ({
          playerId: p.playerId,
          name: p.playerName,
          assists: p.stats.assists,
        })),
      topRated: [...playerAnalytics]
        .sort((a, b) => b.ratings.overall - a.ratings.overall)
        .slice(0, 5)
        .map(p => ({
          playerId: p.playerId,
          name: p.playerName,
          rating: p.ratings.overall,
        })),
      positionDistribution: playerAnalytics.reduce((acc, p) => {
        const pos = p.position || 'UNKNOWN';
        acc[pos] = (acc[pos] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      healthStatus: {
        available: playerAnalytics.filter(p => p.health.activeInjuries === 0).length,
        injured: playerAnalytics.filter(p => p.health.activeInjuries > 0).length,
        highRisk: playerAnalytics.filter(p => p.health.injuryRisk === 'HIGH' || p.health.injuryRisk === 'CRITICAL').length,
      },
      formDistribution: {
        excellent: playerAnalytics.filter(p => p.performance.form === 'EXCELLENT').length,
        good: playerAnalytics.filter(p => p.performance.form === 'GOOD').length,
        average: playerAnalytics.filter(p => p.performance.form === 'AVERAGE').length,
        poor: playerAnalytics.filter(p => p.performance.form === 'POOR').length,
        critical: playerAnalytics.filter(p => p.performance.form === 'CRITICAL').length,
      },
    };

    // ========================================================================
    // PAGINATION
    // ========================================================================
    const totalCount = await prisma.player.count({ where: playerWhereClause });
    const pagination = {
      total: totalCount,
      limit,
      offset,
      pages: Math.ceil(totalCount / limit),
      currentPage: Math.floor(offset / limit) + 1,
      hasMore: offset + playerAnalytics.length < totalCount,
    };

    return NextResponse.json({
      success: true,
      requestId,
      players: playerAnalytics,
      aggregates,
      pagination,
      meta: {
        generatedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        filters: { teamId, clubId, competitionId, sport, position, minAppearances },
        sortedBy: sort,
        sortOrder,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics/players',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to fetch player analytics',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function generatePlayerAnalytics(playerId: string, season?: string | null): Promise<PlayerAnalytics | null> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          dateOfBirth: true,
        },
      },
      teamPlayers: {
        where: { isActive: true },
        include: {
          team: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  sport: true,
                },
              },
            },
          },
        },
        take: 1,
      },
      matchPerformances: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          rating: true,
          goals: true,
          assists: true,
          minutesPlayed: true,
          startedMatch: true,
          createdAt: true,
        },
      },
      statistics: {
        where: season ? { season } : undefined,
        orderBy: { season: 'desc' },
        take: 1,
      },
      injuries: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (!player) return null;

  return buildPlayerAnalyticsFromData(player);
}

function buildPlayerAnalyticsFromData(player: any): PlayerAnalytics {
  const performances = player.matchPerformances || [];
  const stats = player.statistics[0];
  const team = player.teamPlayers[0]?.team;
  const sport = team?.club.sport || 'FOOTBALL';

  // Calculate ratings
  const ratings = performances.map((p: any) => p.rating).filter((r: any) => r != null);
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
    : 6.0;

  // Recent form (last 5)
  const recentRatings = ratings.slice(0, 5);
  const formRating = recentRatings.length > 0
    ? Math.round((recentRatings.reduce((a: number, b: number) => a + b, 0) / recentRatings.length) * 10) / 10
    : avgRating;

  // Determine form level
  let form: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL' = 'AVERAGE';
  if (formRating >= 8.0) form = 'EXCELLENT';
  else if (formRating >= 7.0) form = 'GOOD';
  else if (formRating >= 6.0) form = 'AVERAGE';
  else if (formRating >= 5.0) form = 'POOR';
  else form = 'CRITICAL';

  // Determine trend
  let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
  if (ratings.length >= 5) {
    const recentAvg = recentRatings.reduce((a: number, b: number) => a + b, 0) / recentRatings.length;
    const olderRatings = ratings.slice(5, 10);
    if (olderRatings.length >= 3) {
      const olderAvg = olderRatings.reduce((a: number, b: number) => a + b, 0) / olderRatings.length;
      if (recentAvg > olderAvg + 0.3) trend = 'IMPROVING';
      else if (recentAvg < olderAvg - 0.3) trend = 'DECLINING';
    }
  }

  // Calculate consistency
  let consistency = 50;
  if (ratings.length > 1) {
    const variance = ratings.reduce((sum: number, r: number) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length;
    consistency = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance) * 20)));
  }

  // Peak rating
  const peakRating = ratings.length > 0 ? Math.max(...ratings) : 0;

  // Calculate fatigue level based on recent minutes
  const recentMinutes = performances.slice(0, 5).reduce((sum: number, p: any) => sum + (p.minutesPlayed || 0), 0);
  let fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (recentMinutes > 400) fatigueLevel = 'HIGH';
  else if (recentMinutes > 300) fatigueLevel = 'MEDIUM';

  // Determine injury risk
  const injuryCount = player.injuries?.length || 0;
  let injuryRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (injuryCount > 0) injuryRisk = 'CRITICAL';
  else if (fatigueLevel === 'HIGH') injuryRisk = 'HIGH';
  else if (fatigueLevel === 'MEDIUM') injuryRisk = 'MEDIUM';

  return {
    playerId: player.id,
    playerName: `${player.user.firstName} ${player.user.lastName}`,
    position: player.primaryPosition,
    secondaryPosition: player.secondaryPosition,
    sport,
    team: team ? {
      id: team.id,
      name: team.name,
      clubId: team.club.id,
      clubName: team.club.name,
    } : null,
    stats: {
      season: stats?.season || new Date().getFullYear().toString(),
      appearances: stats?.appearances || performances.length,
      starts: performances.filter((p: any) => p.startedMatch).length,
      minutesPlayed: stats?.minutesPlayed || performances.reduce((sum: number, p: any) => sum + (p.minutesPlayed || 0), 0),
      goals: stats?.goals || performances.reduce((sum: number, p: any) => sum + (p.goals || 0), 0),
      assists: stats?.assists || performances.reduce((sum: number, p: any) => sum + (p.assists || 0), 0),
      yellowCards: stats?.yellowCards || 0,
      redCards: stats?.redCards || 0,
    },
    ratings: {
      overall: player.overallRating || avgRating,
      form: formRating,
      potential: player.potentialRating || avgRating + 0.5,
      consistency,
    },
    performance: {
      form,
      trend,
      peakRating,
      avgRating,
    },
    health: {
      availabilityStatus: injuryCount > 0 ? 'INJURED' : 'AVAILABLE',
      activeInjuries: injuryCount,
      injuryRisk,
      fatigueLevel,
    },
    sportSpecificStats: {},
  };
}