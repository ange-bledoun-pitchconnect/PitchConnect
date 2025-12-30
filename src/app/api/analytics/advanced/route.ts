// ============================================================================
// src/app/api/analytics/advanced/route.ts
// 📊 PitchConnect Enterprise Analytics - Advanced Analytics API
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================
// ENDPOINT:
// - GET /api/analytics/advanced - Multi-dimensional analytics
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import { getOrSetCache } from '@/lib/cache/redis';
import {
  hasAnalyticsAccess,
  getSportMetricConfig,
  type AdvancedAnalytics,
  type LeaderboardEntry,
  type TeamRankingEntry,
  type TrendData,
  type AnalyticsInsight,
} from '@/lib/analytics';
import type { Sport } from '@prisma/client';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_SECONDS = 30 * 60; // 30 minutes
const CACHE_PREFIX = 'analytics:advanced';

// ============================================================================
// GET - Retrieve Advanced Analytics
// ============================================================================

/**
 * GET /api/analytics/advanced
 * 
 * Query Parameters:
 * - competitionId: string - Filter by competition
 * - clubId: string - Filter by club
 * - teamId: string - Filter by team
 * - playerId: string - Filter by player (for player-specific deep dive)
 * - timeRange: 'week' | 'month' | 'quarter' | 'season' | 'year' (default: 'season')
 * - sport: Sport enum - Filter by sport
 * - includeInsights: boolean - Include AI-generated insights (default: true)
 * - leaderboardLimit: number - Top N for leaderboards (default: 10, max: 50)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `adv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn({ requestId }, 'Unauthorized advanced analytics request');
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
    
    if (!hasAnalyticsAccess(userRoles, 'advanced')) {
      logger.warn({ requestId, userId: session.user.id, roles: userRoles }, 'Forbidden advanced analytics access');
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to access advanced analytics',
          requestId,
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // PARSE PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');
    const clubId = searchParams.get('clubId');
    const teamId = searchParams.get('teamId');
    const playerId = searchParams.get('playerId');
    const timeRange = searchParams.get('timeRange') || 'season';
    const sportParam = searchParams.get('sport');
    const includeInsights = searchParams.get('includeInsights') !== 'false';
    const leaderboardLimit = Math.min(parseInt(searchParams.get('leaderboardLimit') || '10'), 50);

    // Must provide at least one scope
    if (!competitionId && !clubId && !teamId && !playerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Must provide competitionId, clubId, teamId, or playerId',
          requestId,
        },
        { status: 400 }
      );
    }

    // Validate time range
    const validTimeRanges = ['week', 'month', 'quarter', 'season', 'year'];
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: `Invalid timeRange. Must be one of: ${validTimeRanges.join(', ')}`,
          requestId,
        },
        { status: 400 }
      );
    }

    logger.info({
      requestId,
      competitionId,
      clubId,
      teamId,
      playerId,
      timeRange,
      userId: session.user.id,
    }, 'Advanced analytics request');

    // ========================================================================
    // CALCULATE DATE RANGE
    // ========================================================================
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'season':
      default:
        // Current season - start from August or January
        const currentMonth = endDate.getMonth();
        if (currentMonth >= 7) { // Aug-Dec
          startDate.setMonth(7, 1); // August 1
        } else { // Jan-Jul
          startDate.setFullYear(endDate.getFullYear() - 1);
          startDate.setMonth(7, 1);
        }
        break;
    }

    // ========================================================================
    // BUILD CACHE KEY & CHECK CACHE
    // ========================================================================
    const cacheKey = `${CACHE_PREFIX}:${competitionId || clubId || teamId || playerId}:${timeRange}`;
    
    const cached = await getOrSetCache<AdvancedAnalytics>(
      cacheKey,
      async () => generateAdvancedAnalytics({
        competitionId,
        clubId,
        teamId,
        playerId,
        startDate,
        endDate,
        sport: sportParam as Sport | null,
        leaderboardLimit,
        includeInsights,
      }),
      CACHE_TTL_SECONDS
    );

    return NextResponse.json({
      success: true,
      requestId,
      analytics: cached,
      meta: {
        generatedAt: cached.metadata.generatedAt.toISOString(),
        processingTimeMs: Date.now() - startTime,
        sport: cached.sport,
        timeRange,
        modelVersion: cached.metadata.modelVersion,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics/advanced',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to generate advanced analytics',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// ANALYTICS GENERATION
// ============================================================================

interface AnalyticsParams {
  competitionId: string | null;
  clubId: string | null;
  teamId: string | null;
  playerId: string | null;
  startDate: Date;
  endDate: Date;
  sport: Sport | null;
  leaderboardLimit: number;
  includeInsights: boolean;
}

async function generateAdvancedAnalytics(params: AnalyticsParams): Promise<AdvancedAnalytics> {
  const {
    competitionId,
    clubId,
    teamId,
    playerId,
    startDate,
    endDate,
    sport,
    leaderboardLimit,
    includeInsights,
  } = params;

  // Determine scope
  let scopeType: 'COMPETITION' | 'CLUB' | 'TEAM' | 'PLAYER' = 'COMPETITION';
  let scopeId = '';
  let scopeName = '';
  let determinedSport: Sport = 'FOOTBALL';

  if (playerId) {
    scopeType = 'PLAYER';
    scopeId = playerId;
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        teamPlayers: {
          where: { isActive: true },
          include: { team: { include: { club: { select: { sport: true } } } } },
          take: 1,
        },
      },
    });
    scopeName = player ? `${player.user.firstName} ${player.user.lastName}` : 'Unknown';
    determinedSport = player?.teamPlayers[0]?.team.club.sport || 'FOOTBALL';
  } else if (teamId) {
    scopeType = 'TEAM';
    scopeId = teamId;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { club: { select: { name: true, sport: true } } },
    });
    scopeName = team?.name || 'Unknown';
    determinedSport = team?.club.sport || 'FOOTBALL';
  } else if (clubId) {
    scopeType = 'CLUB';
    scopeId = clubId;
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { name: true, sport: true },
    });
    scopeName = club?.name || 'Unknown';
    determinedSport = club?.sport || 'FOOTBALL';
  } else if (competitionId) {
    scopeType = 'COMPETITION';
    scopeId = competitionId;
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { name: true, sport: true },
    });
    scopeName = competition?.name || 'Unknown';
    determinedSport = competition?.sport || 'FOOTBALL';
  }

  // Use provided sport or determined sport
  const finalSport = sport || determinedSport;

  // Build team IDs filter
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

  // ========================================================================
  // FETCH MATCH DATA
  // ========================================================================
  const matches = await prisma.match.findMany({
    where: {
      kickOffTime: { gte: startDate, lte: endDate },
      OR: teamIds.length > 0 ? [
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ] : undefined,
    },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      playerPerformances: {
        include: {
          player: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              teamPlayers: {
                where: { isActive: true },
                select: { team: { select: { name: true } } },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { kickOffTime: 'desc' },
  });

  // ========================================================================
  // CALCULATE LEADERBOARDS
  // ========================================================================
  const playerStats = new Map<string, {
    playerId: string;
    name: string;
    teamName: string;
    position: string;
    goals: number;
    assists: number;
    appearances: number;
    totalRating: number;
    ratings: number[];
  }>();

  for (const match of matches) {
    for (const perf of match.playerPerformances) {
      const playerId = perf.playerId;
      const existing = playerStats.get(playerId) || {
        playerId,
        name: `${perf.player.user.firstName} ${perf.player.user.lastName}`,
        teamName: perf.player.teamPlayers[0]?.team.name || 'Unknown',
        position: perf.player.primaryPosition || 'Unknown',
        goals: 0,
        assists: 0,
        appearances: 0,
        totalRating: 0,
        ratings: [],
      };

      existing.goals += perf.goals || 0;
      existing.assists += perf.assists || 0;
      existing.appearances += 1;
      if (perf.rating) {
        existing.totalRating += perf.rating;
        existing.ratings.push(perf.rating);
      }

      playerStats.set(playerId, existing);
    }
  }

  // Build leaderboards
  const statsArray = Array.from(playerStats.values());

  const topScorers: LeaderboardEntry[] = statsArray
    .filter(s => s.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, leaderboardLimit)
    .map(s => ({
      playerId: s.playerId,
      playerName: s.name,
      teamName: s.teamName,
      position: s.position,
      value: s.goals,
      appearances: s.appearances,
      trend: determineTrend(s.ratings),
    }));

  const topAssisters: LeaderboardEntry[] = statsArray
    .filter(s => s.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, leaderboardLimit)
    .map(s => ({
      playerId: s.playerId,
      playerName: s.name,
      teamName: s.teamName,
      position: s.position,
      value: s.assists,
      appearances: s.appearances,
      trend: determineTrend(s.ratings),
    }));

  const topRated: LeaderboardEntry[] = statsArray
    .filter(s => s.ratings.length >= 3)
    .map(s => ({
      ...s,
      avgRating: s.totalRating / s.ratings.length,
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, leaderboardLimit)
    .map(s => ({
      playerId: s.playerId,
      playerName: s.name,
      teamName: s.teamName,
      position: s.position,
      value: Math.round(s.avgRating * 10) / 10,
      appearances: s.appearances,
      trend: determineTrend(s.ratings),
    }));

  // ========================================================================
  // CALCULATE TEAM RANKINGS
  // ========================================================================
  const teamRankings: TeamRankingEntry[] = [];
  const teamStatsMap = new Map<string, {
    teamId: string;
    teamName: string;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  }>();

  for (const match of matches) {
    if (match.homeScore === null || match.awayScore === null) continue;

    // Home team
    const homeStats = teamStatsMap.get(match.homeTeamId) || {
      teamId: match.homeTeamId,
      teamName: match.homeTeam.name,
      wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0,
    };
    homeStats.goalsFor += match.homeScore;
    homeStats.goalsAgainst += match.awayScore;
    if (match.homeScore > match.awayScore) homeStats.wins++;
    else if (match.homeScore < match.awayScore) homeStats.losses++;
    else homeStats.draws++;
    teamStatsMap.set(match.homeTeamId, homeStats);

    // Away team
    const awayStats = teamStatsMap.get(match.awayTeamId) || {
      teamId: match.awayTeamId,
      teamName: match.awayTeam.name,
      wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0,
    };
    awayStats.goalsFor += match.awayScore;
    awayStats.goalsAgainst += match.homeScore;
    if (match.awayScore > match.homeScore) awayStats.wins++;
    else if (match.awayScore < match.homeScore) awayStats.losses++;
    else awayStats.draws++;
    teamStatsMap.set(match.awayTeamId, awayStats);
  }

  // Convert to rankings
  const sportConfig = getSportMetricConfig(finalSport);
  const teamsArray = Array.from(teamStatsMap.values())
    .map(t => ({
      ...t,
      points: t.wins * 3 + t.draws * 1, // Simplified - use sport config in production
    }))
    .sort((a, b) => b.points - a.points);

  teamsArray.forEach((t, index) => {
    teamRankings.push({
      teamId: t.teamId,
      teamName: t.teamName,
      rank: index + 1,
      score: t.points,
      wins: t.wins,
      draws: t.draws,
      losses: t.losses,
    });
  });

  // ========================================================================
  // CALCULATE TRENDS
  // ========================================================================
  const trends = calculateTrends(matches, finalSport);

  // ========================================================================
  // GENERATE INSIGHTS
  // ========================================================================
  const insights: AnalyticsInsight[] = includeInsights
    ? generateInsights(topScorers, topRated, teamRankings, matches.length)
    : [];

  return {
    scope: {
      type: scopeType,
      id: scopeId,
      name: scopeName,
    },
    timeRange: {
      start: startDate,
      end: endDate,
      label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    },
    sport: finalSport,
    topScorers,
    topAssisters,
    topRated,
    teamRankings: teamRankings.slice(0, leaderboardLimit),
    trends,
    insights,
    metadata: {
      modelVersion: '2.0.0-advanced',
      generatedAt: new Date(),
      matchesAnalyzed: matches.length,
      playersAnalyzed: playerStats.size,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineTrend(ratings: number[]): 'UP' | 'DOWN' | 'STABLE' {
  if (ratings.length < 3) return 'STABLE';

  const recent = ratings.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const older = ratings.slice(3, 6).reduce((a, b) => a + b, 0) / Math.min(3, ratings.slice(3, 6).length || 1);

  if (recent > older + 0.3) return 'UP';
  if (recent < older - 0.3) return 'DOWN';
  return 'STABLE';
}

function calculateTrends(matches: any[], sport: Sport): AdvancedAnalytics['trends'] {
  // Group matches by week/month for trend analysis
  const goalsPerMatch: TrendData[] = [];
  const winRates: TrendData[] = [];
  const averageRatings: TrendData[] = [];

  // Simplified - group by month
  const monthlyData = new Map<string, {
    goals: number;
    matches: number;
    wins: number;
    ratings: number[];
  }>();

  for (const match of matches) {
    const monthKey = `${match.kickOffTime.getFullYear()}-${String(match.kickOffTime.getMonth() + 1).padStart(2, '0')}`;
    
    const data = monthlyData.get(monthKey) || {
      goals: 0,
      matches: 0,
      wins: 0,
      ratings: [],
    };

    data.matches++;
    data.goals += (match.homeScore || 0) + (match.awayScore || 0);

    for (const perf of match.playerPerformances) {
      if (perf.rating) data.ratings.push(perf.rating);
    }

    monthlyData.set(monthKey, data);
  }

  const sortedMonths = Array.from(monthlyData.keys()).sort();
  let prevGoalsPerMatch = 0;

  for (const month of sortedMonths) {
    const data = monthlyData.get(month)!;
    const gpm = data.matches > 0 ? data.goals / data.matches : 0;
    
    goalsPerMatch.push({
      period: month,
      value: Math.round(gpm * 10) / 10,
      change: Math.round((gpm - prevGoalsPerMatch) * 10) / 10,
    });

    prevGoalsPerMatch = gpm;

    const avgRating = data.ratings.length > 0
      ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
      : 0;

    averageRatings.push({
      period: month,
      value: Math.round(avgRating * 10) / 10,
      change: 0,
    });
  }

  return {
    goalsPerMatch,
    winRates,
    averageRatings,
  };
}

function generateInsights(
  topScorers: LeaderboardEntry[],
  topRated: LeaderboardEntry[],
  teamRankings: TeamRankingEntry[],
  matchCount: number
): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  // Top scorer insight
  if (topScorers.length > 0) {
    const top = topScorers[0];
    insights.push({
      type: 'POSITIVE',
      category: 'Scoring',
      message: `${top.playerName} leads scoring with ${top.value} goals in ${top.appearances} appearances`,
      importance: 'HIGH',
    });
  }

  // Top rated insight
  if (topRated.length > 0) {
    const top = topRated[0];
    insights.push({
      type: 'POSITIVE',
      category: 'Performance',
      message: `${top.playerName} has the highest average rating (${top.value}) this period`,
      importance: 'MEDIUM',
    });
  }

  // Team dominance
  if (teamRankings.length > 0 && teamRankings[0].wins > 5) {
    insights.push({
      type: 'POSITIVE',
      category: 'Competition',
      message: `${teamRankings[0].teamName} is dominating with ${teamRankings[0].wins} wins`,
      importance: 'HIGH',
    });
  }

  // Match volume
  insights.push({
    type: 'NEUTRAL',
    category: 'Activity',
    message: `${matchCount} matches analyzed in this period`,
    importance: 'LOW',
  });

  return insights;
}