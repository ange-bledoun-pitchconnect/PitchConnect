// ============================================================================
// src/app/api/analytics/teams/route.ts
// 🏆 PitchConnect Enterprise Analytics - Team Analytics API
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported
// ============================================================================
// ENDPOINT:
// - GET /api/analytics/teams - Get team performance analytics
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import { getOrSetCache } from '@/lib/cache/redis';
import { hasAnalyticsAccess, type TeamAnalytics } from '@/lib/analytics';
import type { Sport } from '@prisma/client';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_SECONDS = 15 * 60; // 15 minutes
const CACHE_PREFIX = 'analytics:teams';

// ============================================================================
// GET - Retrieve Team Analytics
// ============================================================================

/**
 * GET /api/analytics/teams
 * Get comprehensive team performance analytics
 * 
 * Query Parameters:
 *   - teamId: string - Get specific team analytics
 *   - clubId: string - Filter by club
 *   - competitionId: string - Filter by competition
 *   - sport: Sport enum - Filter by sport
 *   - season: string - Filter by season (YYYY or YYYY-YYYY)
 *   - sortBy: 'wins' | 'points' | 'goalDiff' | 'winRate' | 'rating' (default: 'points')
 *   - limit: number (default: 25, max: 100)
 * 
 * Returns: 200 OK with team analytics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `team-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn({ requestId }, 'Unauthorized team analytics request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', requestId },
        { status: 401 }
      );
    }

    // ========================================================================
    // AUTHORIZATION
    // ========================================================================
    const userRoles = session.user.roles || [];
    
    if (!hasAnalyticsAccess(userRoles, 'team')) {
      logger.warn({ requestId, userId: session.user.id, roles: userRoles }, 'Forbidden team analytics access');
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'You do not have permission to access team analytics', requestId },
        { status: 403 }
      );
    }

    // ========================================================================
    // PARSE PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const clubId = searchParams.get('clubId');
    const competitionId = searchParams.get('competitionId');
    const sport = searchParams.get('sport') as Sport | null;
    const season = searchParams.get('season');
    const sortBy = searchParams.get('sortBy') || 'points';
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);

    logger.info({
      requestId,
      teamId,
      clubId,
      competitionId,
      sport,
      userId: session.user.id,
    }, 'Team analytics request');

    // ========================================================================
    // SINGLE TEAM ANALYTICS
    // ========================================================================
    if (teamId) {
      const cacheKey = `${CACHE_PREFIX}:${teamId}`;
      
      const analytics = await getOrSetCache<TeamAnalytics>(
        cacheKey,
        async () => generateTeamAnalytics(teamId),
        CACHE_TTL_SECONDS
      );

      if (!analytics) {
        return NextResponse.json(
          { success: false, error: 'Not Found', message: `Team with ID ${teamId} not found`, requestId },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        requestId,
        team: analytics,
        meta: {
          generatedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          sport: analytics.sport,
        },
      });
    }

    // ========================================================================
    // MULTIPLE TEAMS ANALYTICS
    // ========================================================================
    
    // Build where clause
    const whereClause: any = {
      deletedAt: null,
    };

    if (clubId) whereClause.clubId = clubId;
    if (sport) whereClause.club = { sport };
    if (competitionId) {
      whereClause.competitionTeams = {
        some: { competitionId },
      };
    }

    // Fetch teams with match data
    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            sport: true,
          },
        },
        homeMatches: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            homeScore: true,
            awayScore: true,
            kickOffTime: true,
          },
          orderBy: { kickOffTime: 'desc' },
          take: 20,
        },
        awayMatches: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            homeScore: true,
            awayScore: true,
            kickOffTime: true,
          },
          orderBy: { kickOffTime: 'desc' },
          take: 20,
        },
        players: {
          where: { isActive: true },
          include: {
            player: {
              select: {
                id: true,
                overallRating: true,
                formRating: true,
              },
            },
          },
        },
        competitionStandings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            competition: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            players: true,
            homeMatches: true,
            awayMatches: true,
          },
        },
      },
      take: limit,
    });

    // Build analytics for each team
    const teamAnalytics = teams.map(team => buildTeamAnalyticsFromData(team));

    // ========================================================================
    // SORT RESULTS
    // ========================================================================
    teamAnalytics.sort((a, b) => {
      switch (sortBy) {
        case 'wins':
          return b.performance.wins - a.performance.wins;
        case 'goalDiff':
          return b.performance.goalDifference - a.performance.goalDifference;
        case 'winRate':
          return b.performance.winRate - a.performance.winRate;
        case 'rating':
          return b.squad.averageRating - a.squad.averageRating;
        case 'points':
        default:
          return b.performance.points - a.performance.points;
      }
    });

    // ========================================================================
    // CALCULATE SUMMARY
    // ========================================================================
    const summary = {
      totalTeams: teamAnalytics.length,
      totalPlayers: teamAnalytics.reduce((sum, t) => sum + t.squad.totalPlayers, 0),
      totalMatches: teamAnalytics.reduce((sum, t) => sum + t.performance.played, 0),
      avgWinRate: teamAnalytics.length > 0
        ? Math.round(
            (teamAnalytics.reduce((sum, t) => sum + t.performance.winRate, 0) / teamAnalytics.length) * 100
          ) / 100
        : 0,
      avgGoalsScored: teamAnalytics.length > 0
        ? Math.round(
            (teamAnalytics.reduce((sum, t) => sum + t.performance.avgGoalsScored, 0) / teamAnalytics.length) * 100
          ) / 100
        : 0,
      topTeam: teamAnalytics[0] ? {
        id: teamAnalytics[0].teamId,
        name: teamAnalytics[0].teamName,
        points: teamAnalytics[0].performance.points,
      } : null,
    };

    return NextResponse.json({
      success: true,
      requestId,
      teams: teamAnalytics,
      summary,
      meta: {
        generatedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        filters: { clubId, competitionId, sport, season },
        sortedBy: sortBy,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/analytics/teams',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to fetch team analytics',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function generateTeamAnalytics(teamId: string): Promise<TeamAnalytics | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          city: true,
          sport: true,
        },
      },
      homeMatches: {
        where: { status: 'COMPLETED' },
        select: {
          id: true,
          homeScore: true,
          awayScore: true,
          kickOffTime: true,
        },
        orderBy: { kickOffTime: 'desc' },
        take: 30,
      },
      awayMatches: {
        where: { status: 'COMPLETED' },
        select: {
          id: true,
          homeScore: true,
          awayScore: true,
          kickOffTime: true,
        },
        orderBy: { kickOffTime: 'desc' },
        take: 30,
      },
      players: {
        where: { isActive: true },
        include: {
          player: {
            include: {
              user: { select: { firstName: true, lastName: true, dateOfBirth: true } },
              injuries: { where: { status: 'ACTIVE' }, take: 1 },
              statistics: { orderBy: { season: 'desc' }, take: 1 },
            },
          },
        },
      },
      competitionStandings: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          competition: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!team) return null;

  return buildTeamAnalyticsFromData(team);
}

function buildTeamAnalyticsFromData(team: any): TeamAnalytics {
  const homeMatches = team.homeMatches || [];
  const awayMatches = team.awayMatches || [];
  const allMatches = [...homeMatches, ...awayMatches].sort(
    (a: any, b: any) => new Date(b.kickOffTime).getTime() - new Date(a.kickOffTime).getTime()
  );

  // Calculate performance stats
  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  let homeWins = 0, awayWins = 0;
  const recentResults: string[] = [];

  for (const match of homeMatches) {
    const homeGoals = match.homeScore || 0;
    const awayGoals = match.awayScore || 0;
    goalsFor += homeGoals;
    goalsAgainst += awayGoals;

    if (homeGoals > awayGoals) {
      wins++;
      homeWins++;
      if (recentResults.length < 5) recentResults.push('W');
    } else if (homeGoals < awayGoals) {
      losses++;
      if (recentResults.length < 5) recentResults.push('L');
    } else {
      draws++;
      if (recentResults.length < 5) recentResults.push('D');
    }
  }

  for (const match of awayMatches) {
    const homeGoals = match.homeScore || 0;
    const awayGoals = match.awayScore || 0;
    goalsFor += awayGoals;
    goalsAgainst += homeGoals;

    if (awayGoals > homeGoals) {
      wins++;
      awayWins++;
      if (recentResults.length < 5) recentResults.push('W');
    } else if (awayGoals < homeGoals) {
      losses++;
      if (recentResults.length < 5) recentResults.push('L');
    } else {
      draws++;
      if (recentResults.length < 5) recentResults.push('D');
    }
  }

  const played = wins + draws + losses;
  const points = wins * 3 + draws;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;
  const avgGoalsScored = played > 0 ? Math.round((goalsFor / played) * 100) / 100 : 0;
  const avgGoalsConceded = played > 0 ? Math.round((goalsAgainst / played) * 100) / 100 : 0;

  // Determine form
  const recentWins = recentResults.filter(r => r === 'W').length;
  let formLevel: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL' = 'AVERAGE';
  if (recentWins >= 4) formLevel = 'EXCELLENT';
  else if (recentWins >= 3) formLevel = 'GOOD';
  else if (recentWins >= 2) formLevel = 'AVERAGE';
  else if (recentWins >= 1) formLevel = 'POOR';
  else formLevel = 'CRITICAL';

  // Form trend
  let formTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
  if (recentResults.length >= 5) {
    const recent3 = recentResults.slice(0, 3).filter(r => r === 'W').length;
    const older3 = recentResults.slice(2, 5).filter(r => r === 'W').length;
    if (recent3 > older3) formTrend = 'IMPROVING';
    else if (recent3 < older3) formTrend = 'DECLINING';
  }

  // Calculate home/away form
  const homeForm = homeMatches.slice(0, 5).map((m: any) => {
    if ((m.homeScore || 0) > (m.awayScore || 0)) return 'W';
    if ((m.homeScore || 0) < (m.awayScore || 0)) return 'L';
    return 'D';
  }).join('');

  const awayForm = awayMatches.slice(0, 5).map((m: any) => {
    if ((m.awayScore || 0) > (m.homeScore || 0)) return 'W';
    if ((m.awayScore || 0) < (m.homeScore || 0)) return 'L';
    return 'D';
  }).join('');

  // Squad stats
  const players = team.players || [];
  const playerData = players.map((tp: any) => tp.player);
  
  const playerRatings = playerData
    .map((p: any) => p.overallRating || p.formRating)
    .filter((r: any) => r != null) as number[];

  const averageRating = playerRatings.length > 0
    ? Math.round((playerRatings.reduce((a: number, b: number) => a + b, 0) / playerRatings.length) * 10) / 10
    : 0;

  // Calculate average age
  const ages = playerData
    .filter((p: any) => p.user?.dateOfBirth)
    .map((p: any) => {
      const dob = new Date(p.user.dateOfBirth);
      return Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365));
    });
  
  const averageAge = ages.length > 0
    ? Math.round((ages.reduce((a: number, b: number) => a + b, 0) / ages.length) * 10) / 10
    : 0;

  // Find top scorer and assister
  let topScorer: { id: string; name: string; goals: number } | null = null;
  let topAssister: { id: string; name: string; assists: number } | null = null;

  for (const tp of players) {
    const stats = tp.player.statistics?.[0];
    if (stats) {
      if (!topScorer || (stats.goals || 0) > topScorer.goals) {
        topScorer = {
          id: tp.player.id,
          name: `${tp.player.user.firstName} ${tp.player.user.lastName}`,
          goals: stats.goals || 0,
        };
      }
      if (!topAssister || (stats.assists || 0) > topAssister.assists) {
        topAssister = {
          id: tp.player.id,
          name: `${tp.player.user.firstName} ${tp.player.user.lastName}`,
          assists: stats.assists || 0,
        };
      }
    }
  }

  const injuredCount = playerData.filter((p: any) => p.injuries?.length > 0).length;

  // Standing info
  const standing = team.competitionStandings?.[0];

  return {
    teamId: team.id,
    teamName: team.name,
    clubId: team.club.id,
    clubName: team.club.name,
    sport: team.club.sport,
    performance: {
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points,
      winRate,
      avgGoalsScored,
      avgGoalsConceded,
    },
    form: {
      current: formLevel,
      recentResults: recentResults.join(''),
      trend: formTrend,
      homeForm,
      awayForm,
    },
    squad: {
      totalPlayers: players.length,
      averageAge,
      averageRating,
      injuredCount,
      topScorer,
      topAssister,
    },
    standings: standing ? {
      position: standing.position,
      pointsFromTop: standing.position > 1 ? null : 0, // Would need to calculate
      pointsFromSafety: null, // Would need competition context
      competitionId: standing.competition.id,
      competitionName: standing.competition.name,
    } : null,
    sportSpecificStats: {},
  };
}