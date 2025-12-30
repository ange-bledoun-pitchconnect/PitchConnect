// =============================================================================
// 🏆 TEAM ANALYTICS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics
// Comprehensive team statistics with multi-sport support
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club Owner, Manager, Head Coach, Assistant Coach
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
  message?: string;
  requestId: string;
  timestamp: string;
}

interface RouteParams {
  params: {
    clubId: string;
    teamId: string;
  };
}

// Core stats that apply to ALL sports
interface CoreTeamStatistics {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  drawRate: number;
  lossRate: number;
  cleanSheets: number;
  pointsEarned: number;
  pointsPossible: number;
  form: string; // Last 5 matches: WWDLW
}

// Sport-specific scoring stats
interface ScoringStatistics {
  // Universal
  totalScored: number;
  totalConceded: number;
  scoreDifference: number;
  scoredPerGame: number;
  concededPerGame: number;
  
  // Sport-specific breakdown (stored as JSON)
  breakdown: Record<string, number>;
}

// Player performance summary
interface PlayerPerformanceSummary {
  playerId: string;
  userId: string;
  playerName: string;
  position: string | null;
  shirtNumber: number | null;
  
  // Appearances
  appearances: number;
  startingAppearances: number;
  substituteAppearances: number;
  minutesPlayed: number;
  
  // Core metrics (sport-agnostic)
  contributions: number; // Goals + assists or equivalent
  disciplinaryPoints: number; // Yellow = 1, Red = 3
  
  // Sport-specific stats
  sportStats: Record<string, number>;
  
  // Ratings
  avgRating: number | null;
}

interface TeamAnalyticsResponse {
  team: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
  };
  club: {
    id: string;
    name: string;
    sport: Sport;
  };
  
  // Period info
  period: {
    type: 'season' | 'month' | 'custom' | 'all';
    label: string;
    from?: string;
    to?: string;
  };
  
  // Statistics
  coreStats: CoreTeamStatistics;
  scoringStats: ScoringStatistics;
  
  // Home/Away split
  homeStats: Partial<CoreTeamStatistics & ScoringStatistics>;
  awayStats: Partial<CoreTeamStatistics & ScoringStatistics>;
  
  // Player statistics
  playerStats: PlayerPerformanceSummary[];
  
  // Sport context
  sportContext: {
    sport: Sport;
    scoringLabels: {
      scored: string;
      conceded: string;
      difference: string;
    };
    eventTypes: string[];
  };
  
  // Recent form
  recentMatches: Array<{
    id: string;
    opponent: string;
    result: 'W' | 'D' | 'L';
    score: string;
    date: string;
    isHome: boolean;
  }>;
}

// =============================================================================
// SPORT-SPECIFIC CONFIGURATIONS
// =============================================================================

const SPORT_SCORING_LABELS: Record<Sport, { scored: string; conceded: string; difference: string }> = {
  FOOTBALL: { scored: 'Goals For', conceded: 'Goals Against', difference: 'Goal Difference' },
  FUTSAL: { scored: 'Goals For', conceded: 'Goals Against', difference: 'Goal Difference' },
  BEACH_FOOTBALL: { scored: 'Goals For', conceded: 'Goals Against', difference: 'Goal Difference' },
  RUGBY: { scored: 'Points For', conceded: 'Points Against', difference: 'Point Difference' },
  CRICKET: { scored: 'Runs For', conceded: 'Runs Against', difference: 'Net Run Rate' },
  AMERICAN_FOOTBALL: { scored: 'Points For', conceded: 'Points Against', difference: 'Point Differential' },
  BASKETBALL: { scored: 'Points For', conceded: 'Points Against', difference: 'Point Differential' },
  HOCKEY: { scored: 'Goals For', conceded: 'Goals Against', difference: 'Goal Difference' },
  LACROSSE: { scored: 'Goals For', conceded: 'Goals Against', difference: 'Goal Difference' },
  NETBALL: { scored: 'Goals For', conceded: 'Goals Against', difference: 'Goal Difference' },
  AUSTRALIAN_RULES: { scored: 'Points For', conceded: 'Points Against', difference: 'Percentage' },
  GAELIC_FOOTBALL: { scored: 'Scores For', conceded: 'Scores Against', difference: 'Score Difference' },
};

const SPORT_EVENT_TYPES: Record<Sport, MatchEventType[]> = {
  FOOTBALL: ['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'PENALTY_SCORED', 'PENALTY_MISSED', 'OWN_GOAL'],
  FUTSAL: ['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'PENALTY_SCORED'],
  BEACH_FOOTBALL: ['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'],
  RUGBY: ['TRY', 'CONVERSION', 'PENALTY_KICK', 'DROP_GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'],
  CRICKET: ['WICKET', 'CATCH', 'RUN_OUT', 'STUMPING', 'BOUNDARY_FOUR', 'BOUNDARY_SIX'],
  AMERICAN_FOOTBALL: ['TOUCHDOWN', 'FIELD_GOAL', 'EXTRA_POINT', 'TWO_POINT_CONVERSION', 'SAFETY', 'INTERCEPTION', 'FUMBLE'],
  BASKETBALL: ['FIELD_GOAL', 'THREE_POINTER', 'FREE_THROW', 'REBOUND', 'ASSIST', 'BLOCK', 'STEAL', 'TURNOVER'],
  HOCKEY: ['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'PENALTY_CORNER', 'SUBSTITUTION'],
  LACROSSE: ['GOAL', 'ASSIST', 'GROUND_BALL', 'SAVE', 'TURNOVER'],
  NETBALL: ['GOAL', 'ASSIST', 'INTERCEPTION', 'REBOUND'],
  AUSTRALIAN_RULES: ['GOAL', 'BEHIND', 'MARK', 'TACKLE', 'HANDBALL'],
  GAELIC_FOOTBALL: ['GOAL', 'POINT', 'ASSIST', 'YELLOW_CARD', 'RED_CARD'],
};

// Contribution event types per sport (what counts as positive contribution)
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
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
  if (options.message) response.message = options.message;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;

  return NextResponse.json(response, { status: options.status || 200 });
}

function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100;
}

function calculateAverage(sum: number, count: number, decimals: number = 2): number {
  if (count === 0) return 0;
  return Math.round((sum / count) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Check if user has permission to view team analytics
 */
async function hasAnalyticsPermission(
  userId: string,
  clubId: string
): Promise<boolean> {
  // Check super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (user?.isSuperAdmin) return true;

  // Check club membership with appropriate role
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

/**
 * Get match result from team's perspective
 */
function getMatchResult(
  teamId: string,
  match: { homeTeamId: string; awayTeamId: string; homeScore: number | null; awayScore: number | null }
): 'W' | 'D' | 'L' | null {
  if (match.homeScore === null || match.awayScore === null) return null;
  
  const isHome = match.homeTeamId === teamId;
  const teamScore = isHome ? match.homeScore : match.awayScore;
  const oppScore = isHome ? match.awayScore : match.homeScore;
  
  if (teamScore > oppScore) return 'W';
  if (teamScore === oppScore) return 'D';
  return 'L';
}

/**
 * Build form string from recent matches
 */
function buildFormString(results: ('W' | 'D' | 'L' | null)[], maxLength: number = 5): string {
  return results
    .filter((r): r is 'W' | 'D' | 'L' => r !== null)
    .slice(0, maxLength)
    .join('');
}

// =============================================================================
// GET HANDLER - Team Analytics
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId } = params;

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

    // 2. Validate IDs
    if (!clubId || !teamId) {
      return createResponse(null, {
        success: false,
        error: 'Club ID and Team ID are required',
        code: 'INVALID_PARAMS',
        requestId,
        status: 400,
      });
    }

    // 3. Authorization
    const hasPermission = await hasAnalyticsPermission(session.user.id, clubId);
    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view this team\'s analytics',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const periodType = (searchParams.get('period') || 'all') as 'season' | 'month' | 'custom' | 'all';
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // 5. Fetch club and team
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
      select: { id: true, name: true, shortName: true, logo: true, clubId: true },
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

    // 6. Build date filter
    let dateFilter: { gte?: Date; lte?: Date } = {};
    let periodLabel = 'All Time';

    if (periodType === 'season') {
      const currentYear = new Date().getFullYear();
      const seasonStart = new Date(currentYear, 7, 1); // August 1
      if (new Date() < seasonStart) {
        seasonStart.setFullYear(currentYear - 1);
      }
      dateFilter = { gte: seasonStart };
      periodLabel = `${seasonStart.getFullYear()}/${seasonStart.getFullYear() + 1} Season`;
    } else if (periodType === 'month') {
      const now = new Date();
      dateFilter = {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
      periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else if (periodType === 'custom' && fromDate) {
      dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      periodLabel = `${fromDate}${toDate ? ` to ${toDate}` : ' onwards'}`;
    }

    // 7. Fetch completed matches
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: MatchStatus.COMPLETED,
        deletedAt: null,
        ...(Object.keys(dateFilter).length > 0 ? { kickOffTime: dateFilter } : {}),
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
      orderBy: { kickOffTime: 'desc' },
    });

    // 8. Calculate core statistics
    let wins = 0, draws = 0, losses = 0;
    let homeWins = 0, homeDraws = 0, homeLosses = 0;
    let awayWins = 0, awayDraws = 0, awayLosses = 0;
    let totalScored = 0, totalConceded = 0;
    let homeScored = 0, homeConceded = 0;
    let awayScored = 0, awayConceded = 0;
    let cleanSheets = 0;
    const formResults: ('W' | 'D' | 'L')[] = [];
    const recentMatches: TeamAnalyticsResponse['recentMatches'] = [];

    for (const match of matches) {
      if (match.homeScore === null || match.awayScore === null) continue;

      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;
      const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;

      totalScored += teamScore;
      totalConceded += oppScore;

      if (oppScore === 0) cleanSheets++;

      let result: 'W' | 'D' | 'L';
      if (teamScore > oppScore) {
        result = 'W';
        wins++;
        if (isHome) homeWins++; else awayWins++;
      } else if (teamScore === oppScore) {
        result = 'D';
        draws++;
        if (isHome) homeDraws++; else awayDraws++;
      } else {
        result = 'L';
        losses++;
        if (isHome) homeLosses++; else awayLosses++;
      }

      if (isHome) {
        homeScored += teamScore;
        homeConceded += oppScore;
      } else {
        awayScored += teamScore;
        awayConceded += oppScore;
      }

      if (formResults.length < 5) {
        formResults.push(result);
      }

      if (recentMatches.length < 10) {
        recentMatches.push({
          id: match.id,
          opponent,
          result,
          score: `${teamScore}-${oppScore}`,
          date: match.kickOffTime.toISOString(),
          isHome,
        });
      }
    }

    const totalMatches = wins + draws + losses;
    const homeMatches = homeWins + homeDraws + homeLosses;
    const awayMatches = awayWins + awayDraws + awayLosses;

    // Calculate points (default 3-1-0 system)
    const pointsEarned = wins * 3 + draws * 1;
    const pointsPossible = totalMatches * 3;

    // 9. Fetch team members for player stats
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get player profiles for these users
    const userIds = teamMembers.map((tm) => tm.userId);
    const players = await prisma.player.findMany({
      where: { userId: { in: userIds } },
      select: {
        id: true,
        userId: true,
        position: true,
        shirtNumber: true,
      },
    });

    const playerMap = new Map(players.map((p) => [p.userId, p]));
    const playerIds = players.map((p) => p.id);

    // 10. Fetch match lineups for appearance data
    const lineups = await prisma.matchLineup.findMany({
      where: {
        playerId: { in: playerIds },
        match: {
          status: MatchStatus.COMPLETED,
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
          ...(Object.keys(dateFilter).length > 0 ? { kickOffTime: dateFilter } : {}),
        },
      },
      include: {
        match: { select: { id: true } },
      },
    });

    // 11. Fetch match events
    const events = await prisma.matchEvent.findMany({
      where: {
        playerId: { in: playerIds },
        match: {
          status: MatchStatus.COMPLETED,
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
          ...(Object.keys(dateFilter).length > 0 ? { kickOffTime: dateFilter } : {}),
        },
      },
      select: {
        playerId: true,
        eventType: true,
      },
    });

    // 12. Build player statistics
    const playerStatsMap = new Map<string, PlayerPerformanceSummary>();

    for (const member of teamMembers) {
      const player = playerMap.get(member.userId);
      if (!player) continue;

      const playerLineups = lineups.filter((l) => l.playerId === player.id);
      const playerEvents = events.filter((e) => e.playerId === player.id);

      // Count event types
      const eventCounts: Record<string, number> = {};
      let contributions = 0;
      let disciplinaryPoints = 0;

      for (const event of playerEvents) {
        eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
        
        // Count contributions
        if (SPORT_CONTRIBUTION_EVENTS[club.sport]?.includes(event.eventType as MatchEventType)) {
          contributions++;
        }
        
        // Count disciplinary
        if (event.eventType === 'YELLOW_CARD') disciplinaryPoints += 1;
        if (event.eventType === 'RED_CARD') disciplinaryPoints += 3;
      }

      const startingApps = playerLineups.filter((l) => l.isStarter).length;
      const subApps = playerLineups.filter((l) => !l.isStarter && l.minutesPlayed && l.minutesPlayed > 0).length;
      const totalMinutes = playerLineups.reduce((sum, l) => sum + (l.minutesPlayed || 0), 0);
      const ratings = playerLineups.filter((l) => l.rating !== null).map((l) => l.rating as number);

      playerStatsMap.set(player.id, {
        playerId: player.id,
        userId: member.userId,
        playerName: `${member.user.firstName} ${member.user.lastName}`,
        position: player.position,
        shirtNumber: player.shirtNumber,
        appearances: playerLineups.length,
        startingAppearances: startingApps,
        substituteAppearances: subApps,
        minutesPlayed: totalMinutes,
        contributions,
        disciplinaryPoints,
        sportStats: eventCounts,
        avgRating: ratings.length > 0 ? calculateAverage(ratings.reduce((a, b) => a + b, 0), ratings.length) : null,
      });
    }

    // Sort by contributions (descending)
    const playerStats = Array.from(playerStatsMap.values()).sort(
      (a, b) => b.contributions - a.contributions
    );

    // 13. Build response
    const response: TeamAnalyticsResponse = {
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
      },
      club: {
        id: club.id,
        name: club.name,
        sport: club.sport,
      },
      period: {
        type: periodType,
        label: periodLabel,
        from: dateFilter.gte?.toISOString(),
        to: dateFilter.lte?.toISOString(),
      },
      coreStats: {
        totalMatches,
        wins,
        draws,
        losses,
        winRate: calculatePercentage(wins, totalMatches),
        drawRate: calculatePercentage(draws, totalMatches),
        lossRate: calculatePercentage(losses, totalMatches),
        cleanSheets,
        pointsEarned,
        pointsPossible,
        form: buildFormString(formResults),
      },
      scoringStats: {
        totalScored,
        totalConceded,
        scoreDifference: totalScored - totalConceded,
        scoredPerGame: calculateAverage(totalScored, totalMatches),
        concededPerGame: calculateAverage(totalConceded, totalMatches),
        breakdown: {}, // Could be enhanced with sport-specific breakdowns
      },
      homeStats: {
        totalMatches: homeMatches,
        wins: homeWins,
        draws: homeDraws,
        losses: homeLosses,
        winRate: calculatePercentage(homeWins, homeMatches),
        totalScored: homeScored,
        totalConceded: homeConceded,
        scoreDifference: homeScored - homeConceded,
      },
      awayStats: {
        totalMatches: awayMatches,
        wins: awayWins,
        draws: awayDraws,
        losses: awayLosses,
        winRate: calculatePercentage(awayWins, awayMatches),
        totalScored: awayScored,
        totalConceded: awayConceded,
        scoreDifference: awayScored - awayConceded,
      },
      playerStats,
      sportContext: {
        sport: club.sport,
        scoringLabels: SPORT_SCORING_LABELS[club.sport],
        eventTypes: SPORT_EVENT_TYPES[club.sport] || [],
      },
      recentMatches,
    };

    return createResponse(response, {
      success: true,
      message: `Analytics for ${team.name}`,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Team Analytics error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch team analytics',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// Export utility functions for testing
export { calculatePercentage, calculateAverage };
