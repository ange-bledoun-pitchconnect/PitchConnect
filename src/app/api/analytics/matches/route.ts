// ============================================================================
// src/app/api/analytics/matches/route.ts
// 🏟️ PitchConnect Enterprise Analytics - Match Analytics API
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================
// ENDPOINT:
// - GET /api/analytics/matches - Get match analytics with trends
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import { getOrSetCache } from '@/lib/cache/redis';
import { hasAnalyticsAccess, type MatchAnalytics } from '@/lib/analytics';
import type { Sport, MatchStatus } from '@prisma/client';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_SECONDS = 10 * 60; // 10 minutes
const CACHE_PREFIX = 'analytics:matches';

// ============================================================================
// GET - Retrieve Match Analytics
// ============================================================================

/**
 * GET /api/analytics/matches
 * Get match analytics with trends and insights
 * 
 * Query Parameters:
 *   - matchId: string - Get specific match analytics
 *   - competitionId: string - Filter by competition
 *   - teamId: string - Filter by team (home or away)
 *   - clubId: string - Filter by club
 *   - status: MatchStatus enum - Filter by status
 *   - sport: Sport enum - Filter by sport
 *   - days: number - Last N days to analyze (default: 30, max: 365)
 *   - limit: number (default: 50, max: 200)
 *   - includePlayerPerformances: boolean (default: false)
 * 
 * Returns: 200 OK with match analytics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn({ requestId }, 'Unauthorized match analytics request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', requestId },
        { status: 401 }
      );
    }

    // ========================================================================
    // AUTHORIZATION
    // ========================================================================
    const userRoles = session.user.roles || [];
    
    if (!hasAnalyticsAccess(userRoles, 'matches')) {
      logger.warn({ requestId, userId: session.user.id, roles: userRoles }, 'Forbidden match analytics access');
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'You do not have permission to access match analytics', requestId },
        { status: 403 }
      );
    }

    // ========================================================================
    // PARSE PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const competitionId = searchParams.get('competitionId');
    const teamId = searchParams.get('teamId');
    const clubId = searchParams.get('clubId');
    const status = searchParams.get('status') as MatchStatus | null;
    const sport = searchParams.get('sport') as Sport | null;
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const includePlayerPerformances = searchParams.get('includePlayerPerformances') === 'true';

    logger.info({
      requestId,
      matchId,
      competitionId,
      teamId,
      days,
      userId: session.user.id,
    }, 'Match analytics request');

    // ========================================================================
    // SINGLE MATCH ANALYTICS
    // ========================================================================
    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          homeTeam: {
            select: { id: true, name: true, shortName: true },
          },
          awayTeam: {
            select: { id: true, name: true, shortName: true },
          },
          competition: {
            select: { id: true, name: true, sport: true },
          },
          matchEvents: {
            orderBy: { minute: 'asc' },
            select: {
              id: true,
              eventType: true,
              minute: true,
              playerId: true,
              teamId: true,
            },
          },
          playerPerformances: includePlayerPerformances ? {
            include: {
              player: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          } : undefined,
        },
      });

      if (!match) {
        return NextResponse.json(
          { success: false, error: 'Not Found', message: `Match with ID ${matchId} not found`, requestId },
          { status: 404 }
        );
      }

      // Build single match analytics
      const analytics = buildMatchAnalytics(match, includePlayerPerformances);

      return NextResponse.json({
        success: true,
        requestId,
        match: analytics,
        meta: {
          generatedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          sport: match.competition?.sport || 'FOOTBALL',
        },
      });
    }

    // ========================================================================
    // MULTIPLE MATCHES ANALYTICS
    // ========================================================================
    
    // Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Build where clause
    const whereClause: any = {
      kickOffTime: { gte: dateFrom },
      deletedAt: null,
    };

    if (competitionId) whereClause.competitionId = competitionId;
    if (status) whereClause.status = status;
    if (teamId) {
      whereClause.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ];
    }
    if (clubId) {
      // Get all teams for this club
      const clubTeams = await prisma.team.findMany({
        where: { clubId },
        select: { id: true },
      });
      const teamIds = clubTeams.map(t => t.id);
      whereClause.OR = [
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ];
    }
    if (sport) {
      // Filter by competition sport
      const sportCompetitions = await prisma.competition.findMany({
        where: { sport },
        select: { id: true },
      });
      whereClause.competitionId = { in: sportCompetitions.map(c => c.id) };
    }

    // Fetch matches
    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        homeTeam: {
          select: { id: true, name: true, shortName: true },
        },
        awayTeam: {
          select: { id: true, name: true, shortName: true },
        },
        competition: {
          select: { id: true, name: true, sport: true },
        },
        matchEvents: {
          select: {
            id: true,
            eventType: true,
            minute: true,
          },
        },
        playerPerformances: includePlayerPerformances ? {
          include: {
            player: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        } : {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { kickOffTime: 'desc' },
      take: limit,
    });

    // Build analytics for each match
    const matchAnalytics = matches.map(match => buildMatchAnalytics(match, includePlayerPerformances));

    // ========================================================================
    // CALCULATE TRENDS
    // ========================================================================
    const completedMatches = matchAnalytics.filter(m => m.status === 'COMPLETED');
    
    const trends = {
      totalMatches: matchAnalytics.length,
      completedMatches: completedMatches.length,
      scheduledMatches: matchAnalytics.filter(m => m.status === 'SCHEDULED').length,
      avgGoalsPerMatch: completedMatches.length > 0
        ? Math.round(
            (completedMatches.reduce((sum, m) => sum + m.statistics.totalGoals, 0) / completedMatches.length) * 100
          ) / 100
        : 0,
      homeWinRate: completedMatches.length > 0
        ? Math.round(
            (completedMatches.filter(m => m.statistics.outcome === 'HOME_WIN').length / completedMatches.length) * 100
          )
        : 0,
      awayWinRate: completedMatches.length > 0
        ? Math.round(
            (completedMatches.filter(m => m.statistics.outcome === 'AWAY_WIN').length / completedMatches.length) * 100
          )
        : 0,
      drawRate: completedMatches.length > 0
        ? Math.round(
            (completedMatches.filter(m => m.statistics.outcome === 'DRAW').length / completedMatches.length) * 100
          )
        : 0,
      highestScoringMatch: completedMatches.length > 0
        ? completedMatches.reduce((max, m) => 
            m.statistics.totalGoals > max.statistics.totalGoals ? m : max
          )
        : null,
      avgEventsPerMatch: completedMatches.length > 0
        ? Math.round(
            completedMatches.reduce((sum, m) => sum + m.statistics.totalEvents, 0) / completedMatches.length
          )
        : 0,
    };

    return NextResponse.json({
      success: true,
      requestId,
      matches: matchAnalytics,
      trends,
      summary: {
        period: `Last ${days} days`,
        filters: { competitionId, teamId, clubId, status, sport },
      },
      meta: {
        generatedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics/matches',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to fetch match analytics',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildMatchAnalytics(match: any, includePlayerPerformances: boolean): MatchAnalytics & {
  playerPerformances?: any[];
} {
  const homeScore = match.homeScore || 0;
  const awayScore = match.awayScore || 0;
  const totalGoals = homeScore + awayScore;
  const goalDifference = homeScore - awayScore;

  // Determine outcome
  let outcome: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW' = 'DRAW';
  if (goalDifference > 0) outcome = 'HOME_WIN';
  else if (goalDifference < 0) outcome = 'AWAY_WIN';

  // Count events
  const events = match.matchEvents || [];
  const eventBreakdown = {
    goals: events.filter((e: any) => e.eventType === 'GOAL').length,
    yellowCards: events.filter((e: any) => e.eventType === 'YELLOW_CARD').length,
    redCards: events.filter((e: any) => e.eventType === 'RED_CARD').length,
    substitutions: events.filter((e: any) => e.eventType === 'SUBSTITUTION').length,
    penalties: events.filter((e: any) => e.eventType === 'PENALTY').length,
  };

  // Calculate average rating if performances available
  const performances = match.playerPerformances || [];
  const ratings = performances.map((p: any) => p.rating).filter((r: any) => r != null);
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
    : null;

  // Find MOTM and top scorer
  let motm = null;
  let topScorer = null;
  
  if (includePlayerPerformances && performances.length > 0) {
    const sortedByRating = [...performances].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    if (sortedByRating[0]?.rating) {
      motm = {
        id: sortedByRating[0].playerId,
        name: `${sortedByRating[0].player?.user?.firstName || ''} ${sortedByRating[0].player?.user?.lastName || ''}`.trim(),
        rating: sortedByRating[0].rating,
      };
    }

    const sortedByGoals = [...performances].sort((a: any, b: any) => (b.goals || 0) - (a.goals || 0));
    if (sortedByGoals[0]?.goals > 0) {
      topScorer = {
        id: sortedByGoals[0].playerId,
        name: `${sortedByGoals[0].player?.user?.firstName || ''} ${sortedByGoals[0].player?.user?.lastName || ''}`.trim(),
        goals: sortedByGoals[0].goals,
      };
    }
  }

  const result: MatchAnalytics & { playerPerformances?: any[]; avgPlayerRating?: number | null } = {
    matchId: match.id,
    date: match.kickOffTime,
    status: match.status,
    sport: match.competition?.sport || 'FOOTBALL',
    competition: match.competition ? {
      id: match.competition.id,
      name: match.competition.name,
    } : null,
    homeTeam: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      shortName: match.homeTeam.shortName,
      score: homeScore,
      outcome: outcome === 'HOME_WIN' ? 'WIN' : outcome === 'AWAY_WIN' ? 'LOSS' : 'DRAW',
    },
    awayTeam: {
      id: match.awayTeam.id,
      name: match.awayTeam.name,
      shortName: match.awayTeam.shortName,
      score: awayScore,
      outcome: outcome === 'AWAY_WIN' ? 'WIN' : outcome === 'HOME_WIN' ? 'LOSS' : 'DRAW',
    },
    statistics: {
      totalGoals,
      goalDifference,
      outcome,
      totalEvents: events.length,
    },
    eventBreakdown,
    performanceHighlights: {
      motm,
      topScorer,
    },
    avgPlayerRating: avgRating,
  };

  // Include detailed player performances if requested
  if (includePlayerPerformances) {
    result.playerPerformances = performances.map((p: any) => ({
      playerId: p.playerId,
      playerName: `${p.player?.user?.firstName || ''} ${p.player?.user?.lastName || ''}`.trim(),
      position: p.player?.primaryPosition,
      rating: p.rating,
      minutesPlayed: p.minutesPlayed,
      goals: p.goals,
      assists: p.assists,
      startedMatch: p.startedMatch,
    }));
  }

  return result;
}