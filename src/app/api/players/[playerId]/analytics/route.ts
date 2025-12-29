// =============================================================================
// 📊 PLAYER ANALYTICS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/players/[playerId]/analytics
// Returns comprehensive player analytics including:
// - Performance metrics
// - Form analysis
// - Attribute ratings
// - Career statistics
// - AI predictions (from PlayerAnalytic)
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

interface PlayerAnalyticsResponse {
  profile: {
    id: string;
    userId: string;
    name: string;
    avatar: string | null;
    nationality: string | null;
    dateOfBirth: string | null;
    age: number | null;
    height: number | null;
    weight: number | null;
    preferredFoot: string | null;
    primaryPosition: string | null;
    secondaryPosition: string | null;
    jerseyNumber: number | null;
    marketValue: number | null;
    isVerified: boolean;
  };
  currentSeason: {
    matches: number;
    starts: number;
    minutesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    cleanSheets: number;
    averageRating: number | null;
    goalsPerMatch: number;
    assistsPerMatch: number;
    minutesPerGoal: number | null;
  };
  career: {
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    totalMinutes: number;
    totalYellowCards: number;
    totalRedCards: number;
    totalCleanSheets: number;
    avgGoalsPerMatch: number;
    avgAssistsPerMatch: number;
    avgRating: number;
  };
  form: {
    last5Matches: Array<{
      matchId: string;
      opponent: string;
      date: string;
      minutesPlayed: number;
      goals: number;
      assists: number;
      rating: number | null;
    }>;
    formRating: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    consistency: number;
  };
  attributes: {
    // Technical
    pace: number | null;
    shooting: number | null;
    passing: number | null;
    dribbling: number | null;
    defending: number | null;
    physical: number | null;
    // Mental
    leadership: number | null;
    teamwork: number | null;
    composure: number | null;
    creativity: number | null;
    vision: number | null;
    // Overall
    overallRating: number;
  };
  predictions: {
    expectedGoals: number | null;
    expectedAssists: number | null;
    injuryRisk: number;
    developmentPotential: number;
    recommendedActions: string[];
  };
  seasonBySeasonStats: Array<{
    season: number;
    team: string | null;
    league: string | null;
    matches: number;
    goals: number;
    assists: number;
    avgRating: number | null;
  }>;
  rankings: {
    positionRank: number | null;
    leagueRank: number | null;
    clubRank: number | null;
    ageGroupRank: number | null;
  };
}

// =============================================================================
// QUERY PARAMS VALIDATION
// =============================================================================

const querySchema = z.object({
  season: z.string().optional(),
  includeHistory: z.string().transform(val => val === 'true').optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

function calculateTrend(ratings: (number | null)[]): 'UP' | 'DOWN' | 'STABLE' {
  const validRatings = ratings.filter((r): r is number => r !== null);
  if (validRatings.length < 2) return 'STABLE';
  
  const recentAvg = validRatings.slice(0, Math.ceil(validRatings.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(validRatings.length / 2);
  const olderAvg = validRatings.slice(Math.ceil(validRatings.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(validRatings.length / 2);
  
  const diff = recentAvg - olderAvg;
  if (diff > 0.3) return 'UP';
  if (diff < -0.3) return 'DOWN';
  return 'STABLE';
}

function calculateConsistency(ratings: (number | null)[]): number {
  const validRatings = ratings.filter((r): r is number => r !== null);
  if (validRatings.length < 2) return 100;
  
  const mean = validRatings.reduce((a, b) => a + b, 0) / validRatings.length;
  const variance = validRatings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / validRatings.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation = higher consistency
  // Map stdDev (0-2) to consistency (100-0)
  const consistency = Math.max(0, Math.min(100, 100 - (stdDev * 50)));
  return Math.round(consistency);
}

// =============================================================================
// GET HANDLER
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to access player analytics' },
        { status: 401 }
      );
    }

    const { playerId } = params;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      season: searchParams.get('season'),
      includeHistory: searchParams.get('includeHistory'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { season, includeHistory } = queryResult.data;
    const currentYear = new Date().getFullYear();
    const targetSeason = season ? parseInt(season) : currentYear;

    // 3. Fetch player with all related data
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            nationality: true,
            dateOfBirth: true,
          },
        },
        analytics: true,
        insights: true,
        aggregateStats: true,
        statistics: {
          orderBy: { season: 'desc' },
          take: includeHistory ? undefined : 1,
        },
        teamPlayers: {
          where: { isActive: true },
          include: {
            team: {
              include: {
                club: { select: { id: true, name: true } },
              },
            },
          },
        },
        matchAttendance: {
          where: {
            match: { status: 'FINISHED' },
          },
          include: {
            match: {
              include: {
                homeTeam: { select: { id: true, name: true } },
                awayTeam: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { match: { kickOffTime: 'desc' } },
          take: 10,
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Not found', message: 'Player not found' },
        { status: 404 }
      );
    }

    // 4. Check access permissions
    // Users can view their own analytics, or if they're in the same club, or if they're scouts/analysts
    const isOwnProfile = player.userId === session.user.id;
    const userClubMemberships = await prisma.clubMember.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { clubId: true, role: true },
    });
    
    const playerClubIds = player.teamPlayers.map(tp => tp.team.clubId);
    const sharedClub = userClubMemberships.some(m => playerClubIds.includes(m.clubId));
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });
    
    const isScoutOrAnalyst = user?.roles.some(r => ['SCOUT', 'ANALYST', 'COACH', 'MANAGER', 'CLUB_OWNER'].includes(r));

    if (!isOwnProfile && !sharedClub && !isScoutOrAnalyst) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this player\'s analytics' },
        { status: 403 }
      );
    }

    // 5. Get current season stats
    const currentSeasonStats = player.statistics.find(s => s.season === targetSeason) || {
      matches: 0,
      starts: 0,
      minutesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      cleanSheets: 0,
      averageRating: null,
    };

    // 6. Calculate form from recent matches
    const recentMatches = player.matchAttendance.slice(0, 5).map(ma => {
      const isHome = ma.match.homeClubId === player.teamPlayers[0]?.team.clubId;
      const opponent = isHome ? ma.match.awayTeam.name : ma.match.homeTeam.name;
      
      return {
        matchId: ma.matchId,
        opponent,
        date: ma.match.kickOffTime.toISOString(),
        minutesPlayed: ma.minutesPlayed ?? 0,
        goals: ma.goals,
        assists: ma.assists,
        rating: ma.rating,
      };
    });

    const recentRatings = recentMatches.map(m => m.rating);
    const formRating = player.analytics?.formRating ?? 
      (recentRatings.filter(r => r !== null).length > 0 
        ? recentRatings.filter((r): r is number => r !== null).reduce((a, b) => a + b, 0) / recentRatings.filter(r => r !== null).length 
        : 0);

    // 7. Build response
    const response: PlayerAnalyticsResponse = {
      profile: {
        id: player.id,
        userId: player.userId,
        name: `${player.user.firstName} ${player.user.lastName}`,
        avatar: player.user.avatar,
        nationality: player.nationality ?? player.user.nationality,
        dateOfBirth: player.dateOfBirth?.toISOString() ?? player.user.dateOfBirth?.toISOString() ?? null,
        age: calculateAge(player.dateOfBirth ?? player.user.dateOfBirth),
        height: player.height,
        weight: player.weight,
        preferredFoot: player.preferredFoot,
        primaryPosition: player.primaryPosition,
        secondaryPosition: player.secondaryPosition,
        jerseyNumber: player.jerseyNumber,
        marketValue: player.marketValue,
        isVerified: player.isVerified,
      },
      currentSeason: {
        matches: currentSeasonStats.matches,
        starts: currentSeasonStats.starts,
        minutesPlayed: currentSeasonStats.minutesPlayed,
        goals: currentSeasonStats.goals,
        assists: currentSeasonStats.assists,
        yellowCards: currentSeasonStats.yellowCards,
        redCards: currentSeasonStats.redCards,
        cleanSheets: currentSeasonStats.cleanSheets,
        averageRating: currentSeasonStats.averageRating,
        goalsPerMatch: currentSeasonStats.matches > 0 
          ? Math.round((currentSeasonStats.goals / currentSeasonStats.matches) * 100) / 100 
          : 0,
        assistsPerMatch: currentSeasonStats.matches > 0 
          ? Math.round((currentSeasonStats.assists / currentSeasonStats.matches) * 100) / 100 
          : 0,
        minutesPerGoal: currentSeasonStats.goals > 0 
          ? Math.round(currentSeasonStats.minutesPlayed / currentSeasonStats.goals) 
          : null,
      },
      career: {
        totalMatches: player.aggregateStats?.totalMatches ?? 0,
        totalGoals: player.aggregateStats?.totalGoals ?? 0,
        totalAssists: player.aggregateStats?.totalAssists ?? 0,
        totalMinutes: player.aggregateStats?.totalMinutes ?? 0,
        totalYellowCards: player.aggregateStats?.totalYellowCards ?? 0,
        totalRedCards: player.aggregateStats?.totalRedCards ?? 0,
        totalCleanSheets: player.aggregateStats?.totalCleanSheets ?? 0,
        avgGoalsPerMatch: player.aggregateStats?.avgGoalsPerMatch ?? 0,
        avgAssistsPerMatch: player.aggregateStats?.avgAssistsPerMatch ?? 0,
        avgRating: player.aggregateStats?.avgRating ?? 0,
      },
      form: {
        last5Matches: recentMatches,
        formRating: Math.round(formRating * 10) / 10,
        trend: calculateTrend(recentRatings),
        consistency: calculateConsistency(recentRatings),
      },
      attributes: {
        pace: player.insights?.pace ?? null,
        shooting: player.insights?.shooting ?? null,
        passing: player.insights?.passing ?? null,
        dribbling: player.insights?.dribbling ?? null,
        defending: player.insights?.defending ?? null,
        physical: player.insights?.physical ?? null,
        leadership: player.insights?.leadership ?? null,
        teamwork: player.insights?.teamwork ?? null,
        composure: player.insights?.composure ?? null,
        creativity: player.insights?.creativity ?? null,
        vision: player.insights?.vision ?? null,
        overallRating: player.analytics?.overallRating ?? player.overallRating ?? 0,
      },
      predictions: {
        expectedGoals: player.analytics?.expectedGoals ?? null,
        expectedAssists: player.analytics?.expectedAssists ?? null,
        injuryRisk: player.analytics?.injuryRisk ?? 0,
        developmentPotential: player.analytics?.developmentPotential ?? 0,
        recommendedActions: [
          ...(player.analytics?.developmentAreas ?? []),
          ...(player.insights?.developmentAreas ?? []),
        ].slice(0, 5),
      },
      seasonBySeasonStats: player.statistics.map(stat => ({
        season: stat.season,
        team: stat.teamId ?? null,
        league: stat.leagueId ?? null,
        matches: stat.matches,
        goals: stat.goals,
        assists: stat.assists,
        avgRating: stat.averageRating,
      })),
      rankings: {
        positionRank: player.analytics?.positionRank ?? null,
        leagueRank: player.analytics?.leagueRank ?? null,
        clubRank: player.aggregateStats?.clubRank ?? null,
        ageGroupRank: player.analytics?.ageGroupRank ?? null,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        playerId,
        generatedAt: new Date().toISOString(),
        season: targetSeason,
      },
    });

  } catch (error) {
    console.error('[PLAYER_ANALYTICS_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch player analytics' },
      { status: 500 }
    );
  }
}