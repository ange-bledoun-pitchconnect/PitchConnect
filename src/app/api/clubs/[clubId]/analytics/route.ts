// =============================================================================
// 📊 CLUB ANALYTICS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/clubs/[clubId]/analytics
// Returns comprehensive club analytics including:
// - Team performance metrics
// - Match statistics
// - Player performance summaries
// - Form analysis
// - Comparison data
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// =============================================================================
// TYPES
// =============================================================================

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
  };
  homeVsAway: {
    home: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
    };
    away: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
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
    topAssists: Array<{
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
  }>;
  monthlyTrends: Array<{
    month: string;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  }>;
}

// =============================================================================
// QUERY PARAMS VALIDATION
// =============================================================================

const querySchema = z.object({
  season: z.string().optional(),
  leagueId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getResult(
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

// =============================================================================
// GET HANDLER
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to access analytics' },
        { status: 401 }
      );
    }

    const { clubId } = params;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      season: searchParams.get('season'),
      leagueId: searchParams.get('leagueId'),
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { season, leagueId, from, to } = queryResult.data;

    // 3. Verify club exists and user has access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: {
          where: { userId: session.user.id, isActive: true },
        },
        aggregateStats: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Not found', message: 'Club not found' },
        { status: 404 }
      );
    }

    // Check if user has access (is member, manager, or owner)
    const hasAccess =
      club.members.length > 0 ||
      club.managerId === session.user.id ||
      club.ownerId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this club\'s analytics' },
        { status: 403 }
      );
    }

    // 4. Build date filter
    const dateFilter: { kickOffTime?: { gte?: Date; lte?: Date } } = {};
    if (from) {
      dateFilter.kickOffTime = { ...dateFilter.kickOffTime, gte: new Date(from) };
    }
    if (to) {
      dateFilter.kickOffTime = { ...dateFilter.kickOffTime, lte: new Date(to) };
    }

    // 5. Fetch matches
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeClubId: clubId }, { awayClubId: clubId }],
        status: 'FINISHED',
        ...(leagueId ? { leagueId } : {}),
        ...dateFilter,
      },
      include: {
        homeTeam: { select: { id: true, name: true, logo: true } },
        awayTeam: { select: { id: true, name: true, logo: true } },
        league: { select: { name: true } },
      },
      orderBy: { kickOffTime: 'desc' },
    });

    // 6. Calculate overview statistics
    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;
    let homeWins = 0, homeDraws = 0, homeLosses = 0, homeGoalsFor = 0, homeGoalsAgainst = 0;
    let awayWins = 0, awayDraws = 0, awayLosses = 0, awayGoalsFor = 0, awayGoalsAgainst = 0;
    const results: ('W' | 'D' | 'L')[] = [];
    const homeResults: ('W' | 'D' | 'L')[] = [];
    const awayResults: ('W' | 'D' | 'L')[] = [];

    const monthlyData: Map<string, { matches: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }> = new Map();

    for (const match of matches) {
      const isHome = match.homeClubId === clubId;
      const teamGoals = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
      const opponentGoals = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
      const result = getResult(match.homeScore, match.awayScore, isHome);

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
      const monthKey = match.kickOffTime.toISOString().slice(0, 7); // YYYY-MM
      const monthData = monthlyData.get(monthKey) || { matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
      monthData.matches++;
      monthData.goalsFor += teamGoals;
      monthData.goalsAgainst += opponentGoals;
      if (result === 'W') monthData.wins++;
      else if (result === 'D') monthData.draws++;
      else monthData.losses++;
      monthlyData.set(monthKey, monthData);
    }

    const totalMatches = matches.length;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // 7. Fetch top performers from player statistics
    const playerStats = await prisma.playerStatistic.findMany({
      where: {
        player: {
          teamPlayers: {
            some: {
              team: { clubId },
              isActive: true,
            },
          },
        },
        ...(season ? { season: parseInt(season) } : {}),
      },
      include: {
        player: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Aggregate player stats
    const playerAggregates = new Map<string, { goals: number; assists: number; matches: number; totalRating: number; ratingCount: number; name: string }>();
    
    for (const stat of playerStats) {
      const existing = playerAggregates.get(stat.playerId) || {
        goals: 0,
        assists: 0,
        matches: 0,
        totalRating: 0,
        ratingCount: 0,
        name: `${stat.player.user.firstName} ${stat.player.user.lastName}`,
      };
      
      existing.goals += stat.goals;
      existing.assists += stat.assists;
      existing.matches += stat.matches;
      if (stat.averageRating) {
        existing.totalRating += stat.averageRating * stat.matches;
        existing.ratingCount += stat.matches;
      }
      
      playerAggregates.set(stat.playerId, existing);
    }

    const topScorers = Array.from(playerAggregates.entries())
      .map(([id, data]) => ({
        playerId: id,
        playerName: data.name,
        goals: data.goals,
        matches: data.matches,
        goalsPerMatch: data.matches > 0 ? Math.round((data.goals / data.matches) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);

    const topAssists = Array.from(playerAggregates.entries())
      .map(([id, data]) => ({
        playerId: id,
        playerName: data.name,
        assists: data.assists,
        matches: data.matches,
        assistsPerMatch: data.matches > 0 ? Math.round((data.assists / data.matches) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 5);

    const topRated = Array.from(playerAggregates.entries())
      .filter(([, data]) => data.ratingCount >= 3) // Minimum 3 rated matches
      .map(([id, data]) => ({
        playerId: id,
        playerName: data.name,
        avgRating: data.ratingCount > 0 ? Math.round((data.totalRating / data.ratingCount) * 10) / 10 : 0,
        matches: data.matches,
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    // 8. Format recent matches
    const recentMatches = matches.slice(0, 10).map((match) => {
      const isHome = match.homeClubId === clubId;
      const opponent = isHome ? match.awayTeam : match.homeTeam;
      const score = isHome
        ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
        : `${match.awayScore ?? 0} - ${match.homeScore ?? 0}`;
      
      return {
        id: match.id,
        opponent: opponent.name,
        opponentLogo: opponent.logo,
        isHome,
        score,
        result: getResult(match.homeScore, match.awayScore, isHome),
        date: match.kickOffTime.toISOString(),
        competition: match.league?.name ?? null,
      };
    });

    // 9. Format monthly trends
    const monthlyTrends = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12) // Last 12 months
      .map(([month, data]) => ({
        month,
        ...data,
      }));

    // 10. Build response
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
      },
      form: {
        last5: results.slice(0, 5),
        last10: results.slice(0, 10),
        currentStreak: calculateStreak(results),
        homeForm: homeResults.slice(0, 5),
        awayForm: awayResults.slice(0, 5),
      },
      homeVsAway: {
        home: {
          played: homeWins + homeDraws + homeLosses,
          wins: homeWins,
          draws: homeDraws,
          losses: homeLosses,
          goalsFor: homeGoalsFor,
          goalsAgainst: homeGoalsAgainst,
        },
        away: {
          played: awayWins + awayDraws + awayLosses,
          wins: awayWins,
          draws: awayDraws,
          losses: awayLosses,
          goalsFor: awayGoalsFor,
          goalsAgainst: awayGoalsAgainst,
        },
      },
      topPerformers: {
        topScorers,
        topAssists,
        topRated,
      },
      recentMatches,
      monthlyTrends,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        clubId,
        clubName: club.name,
        generatedAt: new Date().toISOString(),
        filters: { season, leagueId, from, to },
      },
    });

  } catch (error) {
    console.error('[CLUB_ANALYTICS_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch club analytics' },
      { status: 500 }
    );
  }
}