// =============================================================================
// 👤 PLAYER PERFORMANCE ANALYTICS API - Enterprise-Grade Multi-Sport
// =============================================================================
// GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/player/[playerId]
// Detailed individual player performance with match-by-match breakdown
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club Owner, Manager, Head Coach, Assistant Coach, Analyst
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Sport,
  MatchStatus,
  MatchEventType,
  ClubMemberRole,
} from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  requestId: string;
  timestamp: string;
}

interface RouteParams {
  params: {
    clubId: string;
    teamId: string;
    playerId: string;
  };
}

interface MatchPerformance {
  matchId: string;
  date: string;
  opponent: string;
  opponentLogo?: string | null;
  result: 'W' | 'D' | 'L';
  score: string;
  isHome: boolean;
  competitionName?: string;
  
  // Lineup info
  wasStarter: boolean;
  minutesPlayed: number;
  position?: string;
  shirtNumber?: number;
  rating?: number | null;
  
  // Events in this match
  events: Array<{
    type: MatchEventType;
    minute: number;
    description?: string;
  }>;
  
  // Sport-specific stats for this match
  matchStats: Record<string, number>;
}

interface PlayerSeasonStats {
  // Universal
  appearances: number;
  starts: number;
  substitutes: number;
  minutesPlayed: number;
  
  // Performance
  avgRating: number | null;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  
  // Contribution (sport-specific)
  contributions: number;
  contributionsPerGame: number;
  
  // Discipline
  yellowCards: number;
  redCards: number;
  disciplinaryPoints: number;
  
  // Sport-specific stats
  sportStats: Record<string, number>;
}

interface PlayerPerformanceResponse {
  player: {
    id: string;
    userId: string;
    name: string;
    firstName: string;
    lastName: string;
    position: string | null;
    shirtNumber: number | null;
    preferredFoot?: string | null;
    height?: number | null;
    weight?: number | null;
    photo?: string | null;
    dateOfBirth?: string | null;
    nationality?: string | null;
  };
  
  team: {
    id: string;
    name: string;
  };
  
  club: {
    id: string;
    name: string;
    sport: Sport;
  };
  
  // Overall statistics
  overallStats: PlayerSeasonStats;
  
  // Home/Away split
  homeStats: Partial<PlayerSeasonStats>;
  awayStats: Partial<PlayerSeasonStats>;
  
  // Competition split (if multiple competitions)
  competitionStats?: Array<{
    competitionId: string;
    competitionName: string;
    stats: Partial<PlayerSeasonStats>;
  }>;
  
  // Match-by-match performance (most recent first)
  matchPerformances: MatchPerformance[];
  
  // Form trend (last 5 ratings)
  formTrend: Array<{
    matchId: string;
    date: string;
    rating: number | null;
    result: 'W' | 'D' | 'L';
  }>;
  
  // Sport context
  sportContext: {
    sport: Sport;
    contributionLabel: string;
    keyStats: string[];
  };
  
  period: string;
}

// =============================================================================
// SPORT-SPECIFIC CONFIGURATIONS
// =============================================================================

const SPORT_CONTRIBUTION_EVENTS: Record<Sport, MatchEventType[]> = {
  FOOTBALL: ['GOAL', 'ASSIST'],
  FUTSAL: ['GOAL', 'ASSIST'],
  BEACH_FOOTBALL: ['GOAL', 'ASSIST'],
  RUGBY: ['TRY', 'CONVERSION', 'PENALTY_KICK', 'DROP_GOAL'],
  CRICKET: ['WICKET', 'CATCH', 'RUN_OUT', 'STUMPING'],
  AMERICAN_FOOTBALL: ['TOUCHDOWN', 'FIELD_GOAL', 'INTERCEPTION'],
  BASKETBALL: ['FIELD_GOAL', 'THREE_POINTER', 'ASSIST', 'BLOCK', 'STEAL'],
  HOCKEY: ['GOAL', 'ASSIST'],
  LACROSSE: ['GOAL', 'ASSIST'],
  NETBALL: ['GOAL', 'ASSIST', 'INTERCEPTION'],
  AUSTRALIAN_RULES: ['GOAL', 'BEHIND', 'MARK'],
  GAELIC_FOOTBALL: ['GOAL', 'POINT', 'ASSIST'],
};

const SPORT_CONTRIBUTION_LABELS: Record<Sport, string> = {
  FOOTBALL: 'Goals + Assists',
  FUTSAL: 'Goals + Assists',
  BEACH_FOOTBALL: 'Goals + Assists',
  RUGBY: 'Points',
  CRICKET: 'Wickets',
  AMERICAN_FOOTBALL: 'Touchdowns',
  BASKETBALL: 'Points',
  HOCKEY: 'Goals + Assists',
  LACROSSE: 'Goals + Assists',
  NETBALL: 'Goals',
  AUSTRALIAN_RULES: 'Goals + Behinds',
  GAELIC_FOOTBALL: 'Goals + Points',
};

const SPORT_KEY_STATS: Record<Sport, string[]> = {
  FOOTBALL: ['Goals', 'Assists', 'Yellow Cards', 'Red Cards', 'Minutes'],
  FUTSAL: ['Goals', 'Assists', 'Yellow Cards', 'Red Cards', 'Minutes'],
  BEACH_FOOTBALL: ['Goals', 'Assists', 'Yellow Cards', 'Minutes'],
  RUGBY: ['Tries', 'Conversions', 'Penalties', 'Drop Goals', 'Minutes'],
  CRICKET: ['Runs', 'Wickets', 'Catches', 'Strike Rate'],
  AMERICAN_FOOTBALL: ['Touchdowns', 'Passing Yards', 'Rushing Yards', 'Interceptions'],
  BASKETBALL: ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks'],
  HOCKEY: ['Goals', 'Assists', 'Yellow Cards', 'Minutes'],
  LACROSSE: ['Goals', 'Assists', 'Ground Balls', 'Saves'],
  NETBALL: ['Goals', 'Goal Assists', 'Interceptions', 'Rebounds'],
  AUSTRALIAN_RULES: ['Goals', 'Behinds', 'Marks', 'Tackles', 'Disposals'],
  GAELIC_FOOTBALL: ['Goals', 'Points', 'Assists', 'Yellow Cards'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `player_perf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: string;
    code?: string;
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    requestId: options.requestId,
    timestamp: new Date().toISOString(),
  };

  if (options.success && data !== null) response.data = data;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;

  return NextResponse.json(response, { status: options.status || 200 });
}

async function hasAnalyticsPermission(userId: string, clubId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (user?.isSuperAdmin) return true;

  const clubMember = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: {
        in: [
          ClubMemberRole.OWNER,
          ClubMemberRole.MANAGER,
          ClubMemberRole.HEAD_COACH,
          ClubMemberRole.ASSISTANT_COACH,
          ClubMemberRole.ANALYST,
        ],
      },
    },
  });

  return !!clubMember;
}

function getMatchResult(
  teamId: string,
  match: { homeTeamId: string; awayTeamId: string; homeScore: number | null; awayScore: number | null }
): 'W' | 'D' | 'L' {
  if (match.homeScore === null || match.awayScore === null) return 'D';
  
  const isHome = match.homeTeamId === teamId;
  const teamScore = isHome ? match.homeScore : match.awayScore;
  const oppScore = isHome ? match.awayScore : match.homeScore;
  
  if (teamScore > oppScore) return 'W';
  if (teamScore === oppScore) return 'D';
  return 'L';
}

// =============================================================================
// GET HANDLER - Player Performance Analytics
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, playerId } = params;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Authorization
    const hasPermission = await hasAnalyticsPermission(session.user.id, clubId);
    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view this player\'s analytics',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const matchLimit = Math.min(parseInt(searchParams.get('matchLimit') || '20'), 50);

    // 4. Fetch club and verify team
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, sport: true },
    });

    if (!club) {
      return createResponse(null, {
        success: false,
        error: 'Club not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found or does not belong to this club',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Fetch player
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            dateOfBirth: true,
            nationality: true,
          },
        },
      },
    });

    if (!player) {
      return createResponse(null, {
        success: false,
        error: 'Player not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 6. Verify player is in team via TeamMember
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: player.userId,
      },
    });

    if (!teamMember) {
      return createResponse(null, {
        success: false,
        error: 'Player not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 7. Build match filter
    const matchFilter: Record<string, unknown> = {
      status: MatchStatus.COMPLETED,
      deletedAt: null,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    };
    
    if (seasonId) {
      matchFilter.seasonId = seasonId;
    }

    // 8. Fetch player's match lineups
    const lineups = await prisma.matchLineup.findMany({
      where: {
        playerId,
        match: matchFilter,
      },
      include: {
        match: {
          include: {
            homeTeam: { select: { id: true, name: true, logo: true } },
            awayTeam: { select: { id: true, name: true, logo: true } },
            competition: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { match: { kickOffTime: 'desc' } },
    });

    // 9. Fetch all events for this player
    const events = await prisma.matchEvent.findMany({
      where: {
        playerId,
        match: matchFilter,
      },
      orderBy: { minute: 'asc' },
    });

    // Group events by match
    const eventsByMatch = new Map<string, typeof events>();
    for (const event of events) {
      const matchEvents = eventsByMatch.get(event.matchId) || [];
      matchEvents.push(event);
      eventsByMatch.set(event.matchId, matchEvents);
    }

    // 10. Get contribution event types for this sport
    const contributionEvents = SPORT_CONTRIBUTION_EVENTS[club.sport] || ['GOAL', 'ASSIST'];

    // 11. Build match performances and aggregate stats
    const matchPerformances: MatchPerformance[] = [];
    let totalMinutes = 0;
    let totalRatings = 0;
    let ratingCount = 0;
    let starts = 0;
    let subs = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let homeApps = 0;
    let homeWins = 0;
    let awayApps = 0;
    let awayWins = 0;
    let contributions = 0;
    let yellowCards = 0;
    let redCards = 0;
    const sportStats: Record<string, number> = {};
    const formTrend: PlayerPerformanceResponse['formTrend'] = [];

    for (const lineup of lineups) {
      const match = lineup.match;
      const isHome = match.homeTeamId === teamId;
      const opponent = isHome ? match.awayTeam : match.homeTeam;
      const result = getMatchResult(teamId, match);
      const matchEvents = eventsByMatch.get(match.id) || [];

      // Aggregate stats
      totalMinutes += lineup.minutesPlayed || 0;
      if (lineup.isStarter) starts++; else if (lineup.minutesPlayed && lineup.minutesPlayed > 0) subs++;
      
      if (lineup.rating !== null) {
        totalRatings += lineup.rating;
        ratingCount++;
      }

      if (result === 'W') wins++;
      else if (result === 'D') draws++;
      else losses++;

      if (isHome) {
        homeApps++;
        if (result === 'W') homeWins++;
      } else {
        awayApps++;
        if (result === 'W') awayWins++;
      }

      // Count event types
      const matchStats: Record<string, number> = {};
      for (const event of matchEvents) {
        // Global counts
        sportStats[event.eventType] = (sportStats[event.eventType] || 0) + 1;
        // Match-level counts
        matchStats[event.eventType] = (matchStats[event.eventType] || 0) + 1;
        
        // Contributions
        if (contributionEvents.includes(event.eventType as MatchEventType)) {
          contributions++;
        }
        
        // Discipline
        if (event.eventType === 'YELLOW_CARD') yellowCards++;
        if (event.eventType === 'RED_CARD') redCards++;
      }

      // Build match performance object
      if (matchPerformances.length < matchLimit) {
        matchPerformances.push({
          matchId: match.id,
          date: match.kickOffTime.toISOString(),
          opponent: opponent.name,
          opponentLogo: opponent.logo,
          result,
          score: `${match.homeScore ?? 0}-${match.awayScore ?? 0}`,
          isHome,
          competitionName: match.competition?.name,
          wasStarter: lineup.isStarter,
          minutesPlayed: lineup.minutesPlayed || 0,
          position: lineup.position || undefined,
          shirtNumber: lineup.shirtNumber || undefined,
          rating: lineup.rating,
          events: matchEvents.map((e) => ({
            type: e.eventType as MatchEventType,
            minute: e.minute || 0,
            description: e.description || undefined,
          })),
          matchStats,
        });
      }

      // Form trend (last 5)
      if (formTrend.length < 5) {
        formTrend.push({
          matchId: match.id,
          date: match.kickOffTime.toISOString(),
          rating: lineup.rating,
          result,
        });
      }
    }

    const totalAppearances = lineups.length;
    const avgRating = ratingCount > 0 ? Math.round((totalRatings / ratingCount) * 10) / 10 : null;

    // 12. Build overall stats
    const overallStats: PlayerSeasonStats = {
      appearances: totalAppearances,
      starts,
      substitutes: subs,
      minutesPlayed: totalMinutes,
      avgRating,
      wins,
      draws,
      losses,
      winRate: totalAppearances > 0 ? Math.round((wins / totalAppearances) * 100) : 0,
      contributions,
      contributionsPerGame: totalAppearances > 0
        ? Math.round((contributions / totalAppearances) * 100) / 100
        : 0,
      yellowCards,
      redCards,
      disciplinaryPoints: yellowCards + (redCards * 3),
      sportStats,
    };

    // 13. Build home/away splits
    const homeStats: Partial<PlayerSeasonStats> = {
      appearances: homeApps,
      wins: homeWins,
      winRate: homeApps > 0 ? Math.round((homeWins / homeApps) * 100) : 0,
    };

    const awayStats: Partial<PlayerSeasonStats> = {
      appearances: awayApps,
      wins: awayWins,
      winRate: awayApps > 0 ? Math.round((awayWins / awayApps) * 100) : 0,
    };

    // 14. Build response
    const response: PlayerPerformanceResponse = {
      player: {
        id: player.id,
        userId: player.userId,
        name: `${player.user.firstName} ${player.user.lastName}`,
        firstName: player.user.firstName,
        lastName: player.user.lastName,
        position: player.position,
        shirtNumber: player.shirtNumber,
        preferredFoot: player.preferredFoot,
        height: player.height,
        weight: player.weight,
        photo: player.user.avatar,
        dateOfBirth: player.user.dateOfBirth?.toISOString() || null,
        nationality: player.user.nationality,
      },
      team: {
        id: team.id,
        name: team.name,
      },
      club: {
        id: club.id,
        name: club.name,
        sport: club.sport,
      },
      overallStats,
      homeStats,
      awayStats,
      matchPerformances,
      formTrend,
      sportContext: {
        sport: club.sport,
        contributionLabel: SPORT_CONTRIBUTION_LABELS[club.sport],
        keyStats: SPORT_KEY_STATS[club.sport],
      },
      period: seasonId ? `Season ${seasonId}` : 'All Time',
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Player Performance error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch player performance analytics',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
