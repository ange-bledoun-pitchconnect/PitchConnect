// ============================================================================
// 📊 CLUB ANALYTICS API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET /api/clubs/[clubId]/analytics - Comprehensive club analytics
// ============================================================================
// Schema: v7.7.0 | Multi-Sport: All 12 Sports | RBAC: Full
// ============================================================================
// 
// Integrates with the PitchConnect Analytics Library (/src/lib/analytics)
// Provides quick club-level summaries + links to detailed analytics
// 
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Sport, Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface ClubAnalytics {
  overview: {
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    cleanSheets: number;
    avgGoalsPerMatch: number;
    avgGoalsConcededPerMatch: number;
    points: number;
  };
  form: {
    last5: string[];
    last10: string[];
    currentStreak: {
      type: 'WIN' | 'DRAW' | 'LOSS' | 'UNBEATEN' | null;
      count: number;
    };
    homeForm: string[];
    awayForm: string[];
    formRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
  };
  homeVsAway: {
    home: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      winRate: number;
    };
    away: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      winRate: number;
    };
  };
  topPerformers: {
    topScorers: Array<{
      playerId: string;
      playerName: string;
      goals: number;
      matches: number;
      goalsPerMatch: number;
    }>;
    topAssisters: Array<{
      playerId: string;
      playerName: string;
      assists: number;
      matches: number;
      assistsPerMatch: number;
    }>;
    topRated: Array<{
      playerId: string;
      playerName: string;
      avgRating: number;
      matches: number;
    }>;
  };
  recentMatches: Array<{
    id: string;
    opponent: string;
    opponentLogo: string | null;
    isHome: boolean;
    score: string;
    result: 'W' | 'D' | 'L';
    date: string;
    competition: string | null;
    sport: Sport;
  }>;
  monthlyTrends: Array<{
    month: string;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    winRate: number;
  }>;
  sportBreakdown?: Array<{
    sport: Sport;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
  }>;
}

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  season: z.string().optional(),
  competitionId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  sport: z.enum([
    'FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL',
    'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES',
    'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL'
  ]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  includeMonthlyTrends: z.string().transform(v => v === 'true').default('true'),
  includeTopPerformers: z.string().transform(v => v === 'true').default('true'),
  topLimit: z.coerce.number().min(3).max(20).default(5),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `analytics-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getMatchResult(
  homeScore: number | null,
  awayScore: number | null,
  isHome: boolean
): 'W' | 'D' | 'L' {
  if (homeScore === null || awayScore === null) return 'D';
  
  if (homeScore === awayScore) return 'D';
  
  if (isHome) {
    return homeScore > awayScore ? 'W' : 'L';
  } else {
    return awayScore > homeScore ? 'W' : 'L';
  }
}

function calculateStreak(results: ('W' | 'D' | 'L')[]): { type: 'WIN' | 'DRAW' | 'LOSS' | 'UNBEATEN' | null; count: number } {
  if (results.length === 0) return { type: null, count: 0 };
  
  const firstResult = results[0];
  let count = 1;
  
  // Check for unbeaten streak (W or D)
  let unbeatenCount = 0;
  for (const result of results) {
    if (result === 'W' || result === 'D') {
      unbeatenCount++;
    } else {
      break;
    }
  }
  
  // Check for same-result streak
  for (let i = 1; i < results.length; i++) {
    if (results[i] === firstResult) {
      count++;
    } else {
      break;
    }
  }
  
  // Return unbeaten if it's longer and meaningful
  if (unbeatenCount > count && unbeatenCount >= 3) {
    return { type: 'UNBEATEN', count: unbeatenCount };
  }
  
  return {
    type: firstResult === 'W' ? 'WIN' : firstResult === 'D' ? 'DRAW' : 'LOSS',
    count,
  };
}

function getFormRating(results: ('W' | 'D' | 'L')[]): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL' {
  const last5 = results.slice(0, 5);
  const wins = last5.filter(r => r === 'W').length;
  
  if (wins >= 4) return 'EXCELLENT';
  if (wins >= 3) return 'GOOD';
  if (wins >= 2) return 'AVERAGE';
  if (wins >= 1) return 'POOR';
  return 'CRITICAL';
}

// ============================================================================
// GET /api/clubs/[clubId]/analytics
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId } = params;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: queryResult.error.flatten() }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { season, competitionId, teamId, sport, from, to, includeMonthlyTrends, includeTopPerformers, topLimit } = queryResult.data;

    // 3. Verify club exists and user has access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: {
          where: { userId: session.user.id, isActive: true },
          select: { role: true },
        },
        aggregateStats: true,
        teams: {
          where: { deletedAt: null },
          select: { id: true, name: true },
        },
      },
    });

    if (!club || club.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Check access for private clubs
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isSuperAdmin: true } });
    const hasAccess = club.isPublic || 
                      club.members.length > 0 || 
                      club.managerId === session.user.id || 
                      club.ownerId === session.user.id ||
                      !!user?.isSuperAdmin;

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this club\'s analytics' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Build match filter
    const matchWhere: Prisma.MatchWhereInput = {
      OR: [
        { homeClubId: clubId },
        { awayClubId: clubId },
      ],
      status: 'FINISHED',
      deletedAt: null,
    };

    if (competitionId) matchWhere.competitionId = competitionId;
    if (teamId) {
      matchWhere.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ];
    }
    if (from) matchWhere.kickOffTime = { ...matchWhere.kickOffTime as any, gte: new Date(from) };
    if (to) matchWhere.kickOffTime = { ...matchWhere.kickOffTime as any, lte: new Date(to) };

    // 5. Fetch matches
    const matches = await prisma.match.findMany({
      where: matchWhere,
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        homeClub: { select: { id: true, name: true, logo: true, sport: true } },
        awayClub: { select: { id: true, name: true, logo: true, sport: true } },
        competition: { select: { id: true, name: true, sport: true } },
      },
      orderBy: { kickOffTime: 'desc' },
    });

    // 6. Calculate statistics
    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;
    let homeWins = 0, homeDraws = 0, homeLosses = 0, homeGoalsFor = 0, homeGoalsAgainst = 0;
    let awayWins = 0, awayDraws = 0, awayLosses = 0, awayGoalsFor = 0, awayGoalsAgainst = 0;
    const results: ('W' | 'D' | 'L')[] = [];
    const homeResults: ('W' | 'D' | 'L')[] = [];
    const awayResults: ('W' | 'D' | 'L')[] = [];

    const monthlyData = new Map<string, { matches: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }>();
    const sportData = new Map<Sport, { matches: number; wins: number; draws: number; losses: number }>();

    for (const match of matches) {
      const isHome = match.homeClubId === clubId;
      const teamGoals = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
      const opponentGoals = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
      const result = getMatchResult(match.homeScore, match.awayScore, isHome);
      const matchSport = match.competition?.sport || club.sport;

      results.push(result);
      goalsFor += teamGoals;
      goalsAgainst += opponentGoals;

      if (opponentGoals === 0) cleanSheets++;

      if (result === 'W') wins++;
      else if (result === 'D') draws++;
      else losses++;

      // Home/Away split
      if (isHome) {
        homeResults.push(result);
        homeGoalsFor += teamGoals;
        homeGoalsAgainst += opponentGoals;
        if (result === 'W') homeWins++;
        else if (result === 'D') homeDraws++;
        else homeLosses++;
      } else {
        awayResults.push(result);
        awayGoalsFor += teamGoals;
        awayGoalsAgainst += opponentGoals;
        if (result === 'W') awayWins++;
        else if (result === 'D') awayDraws++;
        else awayLosses++;
      }

      // Monthly trends
      if (includeMonthlyTrends) {
        const monthKey = match.kickOffTime.toISOString().slice(0, 7);
        const monthStats = monthlyData.get(monthKey) || { matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
        monthStats.matches++;
        monthStats.goalsFor += teamGoals;
        monthStats.goalsAgainst += opponentGoals;
        if (result === 'W') monthStats.wins++;
        else if (result === 'D') monthStats.draws++;
        else monthStats.losses++;
        monthlyData.set(monthKey, monthStats);
      }

      // Sport breakdown (for multi-sport clubs)
      const sportStats = sportData.get(matchSport) || { matches: 0, wins: 0, draws: 0, losses: 0 };
      sportStats.matches++;
      if (result === 'W') sportStats.wins++;
      else if (result === 'D') sportStats.draws++;
      else sportStats.losses++;
      sportData.set(matchSport, sportStats);
    }

    const totalMatches = matches.length;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // 7. Get top performers
    let topScorers: ClubAnalytics['topPerformers']['topScorers'] = [];
    let topAssisters: ClubAnalytics['topPerformers']['topAssisters'] = [];
    let topRated: ClubAnalytics['topPerformers']['topRated'] = [];

    if (includeTopPerformers) {
      // Get team IDs for this club
      const clubTeamIds = club.teams.map(t => t.id);

      // Aggregate from player match performances
      const performances = await prisma.playerMatchPerformance.findMany({
        where: {
          teamId: { in: clubTeamIds },
          match: {
            status: 'FINISHED',
            deletedAt: null,
            ...(from ? { kickOffTime: { gte: new Date(from) } } : {}),
            ...(to ? { kickOffTime: { lte: new Date(to) } } : {}),
          },
        },
        include: {
          player: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      // Aggregate stats by player
      const playerAggregates = new Map<string, {
        goals: number;
        assists: number;
        matches: number;
        totalRating: number;
        ratingCount: number;
        name: string;
      }>();

      for (const perf of performances) {
        const existing = playerAggregates.get(perf.playerId) || {
          goals: 0,
          assists: 0,
          matches: 0,
          totalRating: 0,
          ratingCount: 0,
          name: `${perf.player.user.firstName} ${perf.player.user.lastName}`.trim(),
        };

        existing.goals += perf.goals;
        existing.assists += perf.assists;
        existing.matches++;
        if (perf.rating) {
          existing.totalRating += perf.rating;
          existing.ratingCount++;
        }

        playerAggregates.set(perf.playerId, existing);
      }

      // Sort and pick top performers
      topScorers = Array.from(playerAggregates.entries())
        .map(([id, data]) => ({
          playerId: id,
          playerName: data.name,
          goals: data.goals,
          matches: data.matches,
          goalsPerMatch: data.matches > 0 ? Math.round((data.goals / data.matches) * 100) / 100 : 0,
        }))
        .sort((a, b) => b.goals - a.goals)
        .slice(0, topLimit);

      topAssisters = Array.from(playerAggregates.entries())
        .map(([id, data]) => ({
          playerId: id,
          playerName: data.name,
          assists: data.assists,
          matches: data.matches,
          assistsPerMatch: data.matches > 0 ? Math.round((data.assists / data.matches) * 100) / 100 : 0,
        }))
        .sort((a, b) => b.assists - a.assists)
        .slice(0, topLimit);

      topRated = Array.from(playerAggregates.entries())
        .filter(([, data]) => data.ratingCount >= 3)
        .map(([id, data]) => ({
          playerId: id,
          playerName: data.name,
          avgRating: data.ratingCount > 0 ? Math.round((data.totalRating / data.ratingCount) * 10) / 10 : 0,
          matches: data.matches,
        }))
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, topLimit);
    }

    // 8. Format recent matches
    const recentMatches = matches.slice(0, 10).map((match) => {
      const isHome = match.homeClubId === clubId;
      const opponent = isHome ? match.awayClub : match.homeClub;
      const score = isHome
        ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
        : `${match.awayScore ?? 0} - ${match.homeScore ?? 0}`;

      return {
        id: match.id,
        opponent: opponent.name,
        opponentLogo: opponent.logo,
        isHome,
        score,
        result: getMatchResult(match.homeScore, match.awayScore, isHome),
        date: match.kickOffTime.toISOString(),
        competition: match.competition?.name ?? null,
        sport: match.competition?.sport || club.sport,
      };
    });

    // 9. Format monthly trends
    const monthlyTrends = includeMonthlyTrends
      ? Array.from(monthlyData.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-12)
          .map(([month, data]) => ({
            month,
            ...data,
            winRate: data.matches > 0 ? Math.round((data.wins / data.matches) * 100) : 0,
          }))
      : [];

    // 10. Sport breakdown (for multi-sport clubs)
    const sportBreakdown = sportData.size > 1
      ? Array.from(sportData.entries()).map(([sport, data]) => ({
          sport,
          ...data,
          winRate: data.matches > 0 ? Math.round((data.wins / data.matches) * 100) : 0,
        }))
      : undefined;

    // 11. Build response
    const homePlayed = homeWins + homeDraws + homeLosses;
    const awayPlayed = awayWins + awayDraws + awayLosses;

    const analytics: ClubAnalytics = {
      overview: {
        totalMatches,
        wins,
        draws,
        losses,
        winRate,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        cleanSheets,
        avgGoalsPerMatch: totalMatches > 0 ? Math.round((goalsFor / totalMatches) * 100) / 100 : 0,
        avgGoalsConcededPerMatch: totalMatches > 0 ? Math.round((goalsAgainst / totalMatches) * 100) / 100 : 0,
        points: wins * 3 + draws,
      },
      form: {
        last5: results.slice(0, 5),
        last10: results.slice(0, 10),
        currentStreak: calculateStreak(results),
        homeForm: homeResults.slice(0, 5),
        awayForm: awayResults.slice(0, 5),
        formRating: getFormRating(results),
      },
      homeVsAway: {
        home: {
          played: homePlayed,
          wins: homeWins,
          draws: homeDraws,
          losses: homeLosses,
          goalsFor: homeGoalsFor,
          goalsAgainst: homeGoalsAgainst,
          winRate: homePlayed > 0 ? Math.round((homeWins / homePlayed) * 100) : 0,
        },
        away: {
          played: awayPlayed,
          wins: awayWins,
          draws: awayDraws,
          losses: awayLosses,
          goalsFor: awayGoalsFor,
          goalsAgainst: awayGoalsAgainst,
          winRate: awayPlayed > 0 ? Math.round((awayWins / awayPlayed) * 100) : 0,
        },
      },
      topPerformers: {
        topScorers,
        topAssisters,
        topRated,
      },
      recentMatches,
      monthlyTrends,
      sportBreakdown,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        requestId,
        clubId,
        clubName: club.name,
        sport: club.sport,
        filters: { season, competitionId, teamId, sport, from, to },
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });

  } catch (error) {
    console.error('[CLUB_ANALYTICS_ERROR]', { requestId, error });

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch club analytics' },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
