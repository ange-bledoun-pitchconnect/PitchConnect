// =============================================================================
// 🏆 TOP SCORERS ANALYTICS API - Enterprise-Grade Multi-Sport Implementation
// =============================================================================
// GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/scorers
// Top scorers/point makers with sport-specific scoring types
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
  };
}

// Sport-specific scoring event configuration
interface ScoringEventConfig {
  type: MatchEventType;
  label: string;
  points: number; // Weight for ranking
  icon?: string;
}

interface ScorerRecord {
  playerId: string;
  userId: string;
  playerName: string;
  position: string | null;
  shirtNumber: number | null;
  photo?: string | null;
  
  // Total scoring metrics
  totalScores: number; // Weighted total
  totalEvents: number; // Raw event count
  appearances: number;
  scoresPerGame: number;
  minutesPerScore: number | null;
  
  // Sport-specific breakdown
  scoreBreakdown: Record<string, {
    count: number;
    label: string;
    points: number;
  }>;
  
  // Recent scoring
  lastScoringDate: string | null;
  scoringStreak: number; // Consecutive games with a score
  
  // Goals/scores in different contexts
  homeScores: number;
  awayScores: number;
  competitionScores: number;
  friendlyScores: number;
}

interface ScorersResponse {
  teamId: string;
  teamName: string;
  clubId: string;
  sport: Sport;
  
  // Totals
  totalTeamScores: number;
  scorerCount: number;
  
  // Sport context
  sportContext: {
    scoringLabel: string; // "Goals" / "Tries" / "Points" etc.
    scoringEvents: ScoringEventConfig[];
  };
  
  // Top scorers list
  topScorers: ScorerRecord[];
  
  // Period info
  period: string;
}

// =============================================================================
// SPORT-SPECIFIC SCORING CONFIGURATIONS
// =============================================================================

const SPORT_SCORING_EVENTS: Record<Sport, ScoringEventConfig[]> = {
  FOOTBALL: [
    { type: 'GOAL' as MatchEventType, label: 'Goals', points: 1 },
    { type: 'PENALTY_SCORED' as MatchEventType, label: 'Penalties', points: 1 },
    { type: 'OWN_GOAL' as MatchEventType, label: 'Own Goals', points: -1 },
  ],
  FUTSAL: [
    { type: 'GOAL' as MatchEventType, label: 'Goals', points: 1 },
    { type: 'PENALTY_SCORED' as MatchEventType, label: 'Penalties', points: 1 },
  ],
  BEACH_FOOTBALL: [
    { type: 'GOAL' as MatchEventType, label: 'Goals', points: 1 },
  ],
  RUGBY: [
    { type: 'TRY' as MatchEventType, label: 'Tries', points: 5 },
    { type: 'CONVERSION' as MatchEventType, label: 'Conversions', points: 2 },
    { type: 'PENALTY_KICK' as MatchEventType, label: 'Penalty Kicks', points: 3 },
    { type: 'DROP_GOAL' as MatchEventType, label: 'Drop Goals', points: 3 },
  ],
  CRICKET: [
    { type: 'BOUNDARY_FOUR' as MatchEventType, label: 'Fours', points: 4 },
    { type: 'BOUNDARY_SIX' as MatchEventType, label: 'Sixes', points: 6 },
    // Note: Runs would typically be tracked differently (in PlayerStatistics)
  ],
  AMERICAN_FOOTBALL: [
    { type: 'TOUCHDOWN' as MatchEventType, label: 'Touchdowns', points: 6 },
    { type: 'FIELD_GOAL' as MatchEventType, label: 'Field Goals', points: 3 },
    { type: 'EXTRA_POINT' as MatchEventType, label: 'Extra Points', points: 1 },
    { type: 'TWO_POINT_CONVERSION' as MatchEventType, label: '2PT Conversions', points: 2 },
    { type: 'SAFETY' as MatchEventType, label: 'Safeties', points: 2 },
  ],
  BASKETBALL: [
    { type: 'THREE_POINTER' as MatchEventType, label: '3-Pointers', points: 3 },
    { type: 'FIELD_GOAL' as MatchEventType, label: 'Field Goals', points: 2 },
    { type: 'FREE_THROW' as MatchEventType, label: 'Free Throws', points: 1 },
  ],
  HOCKEY: [
    { type: 'GOAL' as MatchEventType, label: 'Goals', points: 1 },
    { type: 'PENALTY_CORNER' as MatchEventType, label: 'Penalty Corners Converted', points: 1 },
  ],
  LACROSSE: [
    { type: 'GOAL' as MatchEventType, label: 'Goals', points: 1 },
  ],
  NETBALL: [
    { type: 'GOAL' as MatchEventType, label: 'Goals', points: 1 },
  ],
  AUSTRALIAN_RULES: [
    { type: 'GOAL' as MatchEventType, label: 'Goals', points: 6 },
    { type: 'BEHIND' as MatchEventType, label: 'Behinds', points: 1 },
  ],
  GAELIC_FOOTBALL: [
    { type: 'GOAL' as MatchEventType, label: 'Goals', points: 3 },
    { type: 'POINT' as MatchEventType, label: 'Points', points: 1 },
  ],
};

const SPORT_SCORING_LABELS: Record<Sport, string> = {
  FOOTBALL: 'Goals',
  FUTSAL: 'Goals',
  BEACH_FOOTBALL: 'Goals',
  RUGBY: 'Points',
  CRICKET: 'Runs',
  AMERICAN_FOOTBALL: 'Points',
  BASKETBALL: 'Points',
  HOCKEY: 'Goals',
  LACROSSE: 'Goals',
  NETBALL: 'Goals',
  AUSTRALIAN_RULES: 'Points',
  GAELIC_FOOTBALL: 'Scores',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `scorers_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

// =============================================================================
// GET HANDLER - Top Scorers
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

    // 2. Authorization
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

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const seasonId = searchParams.get('seasonId');

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

    // 5. Get scoring event types for this sport
    const scoringEvents = SPORT_SCORING_EVENTS[club.sport] || [
      { type: 'GOAL' as MatchEventType, label: 'Goals', points: 1 },
    ];
    const scoringEventTypes = scoringEvents.map((e) => e.type);

    // 6. Get team members
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    const userIds = teamMembers.map((tm) => tm.userId);
    
    // Get player profiles
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
    const playerUserMap = new Map(players.map((p) => [p.id, p.userId]));
    const playerIds = players.map((p) => p.id);

    // 7. Fetch all scoring events for team players
    const matchFilter: Record<string, unknown> = {
      status: MatchStatus.COMPLETED,
      deletedAt: null,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    };
    
    if (seasonId) {
      matchFilter.seasonId = seasonId;
    }

    const scoringEventsData = await prisma.matchEvent.findMany({
      where: {
        playerId: { in: playerIds },
        eventType: { in: scoringEventTypes },
        match: matchFilter,
      },
      include: {
        match: {
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            kickOffTime: true,
            matchType: true,
          },
        },
      },
      orderBy: { match: { kickOffTime: 'desc' } },
    });

    // 8. Fetch lineup data for appearances and minutes
    const lineupData = await prisma.matchLineup.findMany({
      where: {
        playerId: { in: playerIds },
        match: matchFilter,
      },
      include: {
        match: { select: { id: true } },
      },
    });

    // Build appearances map
    const playerAppearances = new Map<string, { total: number; minutes: number; matchIds: Set<string> }>();
    for (const lineup of lineupData) {
      const current = playerAppearances.get(lineup.playerId) || { total: 0, minutes: 0, matchIds: new Set() };
      if (!current.matchIds.has(lineup.matchId)) {
        current.total++;
        current.matchIds.add(lineup.matchId);
      }
      current.minutes += lineup.minutesPlayed || 0;
      playerAppearances.set(lineup.playerId, current);
    }

    // 9. Aggregate scoring data by player
    const playerScoringMap = new Map<string, {
      events: typeof scoringEventsData;
      breakdown: Record<string, number>;
      homeScores: number;
      awayScores: number;
      compScores: number;
      friendlyScores: number;
      lastDate: Date | null;
      scoringMatches: Set<string>;
    }>();

    for (const event of scoringEventsData) {
      if (!event.playerId) continue;
      
      const current = playerScoringMap.get(event.playerId) || {
        events: [],
        breakdown: {},
        homeScores: 0,
        awayScores: 0,
        compScores: 0,
        friendlyScores: 0,
        lastDate: null,
        scoringMatches: new Set(),
      };

      current.events.push(event);
      current.breakdown[event.eventType] = (current.breakdown[event.eventType] || 0) + 1;
      current.scoringMatches.add(event.matchId);

      // Home/Away context
      const isHome = event.match.homeTeamId === teamId;
      if (isHome) current.homeScores++;
      else current.awayScores++;

      // Competition/Friendly context
      if (event.match.matchType === 'FRIENDLY') {
        current.friendlyScores++;
      } else {
        current.compScores++;
      }

      // Track last scoring date
      if (!current.lastDate || event.match.kickOffTime > current.lastDate) {
        current.lastDate = event.match.kickOffTime;
      }

      playerScoringMap.set(event.playerId, current);
    }

    // 10. Calculate scoring streaks
    const calculateStreak = (playerId: string): number => {
      const data = playerScoringMap.get(playerId);
      if (!data) return 0;
      
      const appearances = playerAppearances.get(playerId);
      if (!appearances) return 0;

      // Get recent matches in order
      const recentMatches = Array.from(appearances.matchIds).slice(0, 10);
      let streak = 0;
      
      for (const matchId of recentMatches) {
        if (data.scoringMatches.has(matchId)) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    };

    // 11. Build scorer records
    const scorerRecords: ScorerRecord[] = [];

    for (const member of teamMembers) {
      const player = playerMap.get(member.userId);
      if (!player) continue;

      const scoringData = playerScoringMap.get(player.id);
      const appearanceData = playerAppearances.get(player.id);

      if (!scoringData || scoringData.events.length === 0) continue;

      // Calculate weighted total score
      let totalScore = 0;
      const scoreBreakdown: ScorerRecord['scoreBreakdown'] = {};

      for (const config of scoringEvents) {
        const count = scoringData.breakdown[config.type] || 0;
        const points = count * config.points;
        totalScore += points;
        
        if (count > 0) {
          scoreBreakdown[config.type] = {
            count,
            label: config.label,
            points,
          };
        }
      }

      const appearances = appearanceData?.total || 1;
      const minutes = appearanceData?.minutes || 0;

      scorerRecords.push({
        playerId: player.id,
        userId: member.userId,
        playerName: `${member.user.firstName} ${member.user.lastName}`,
        position: player.position,
        shirtNumber: player.shirtNumber,
        photo: member.user.avatar,
        totalScores: totalScore,
        totalEvents: scoringData.events.length,
        appearances,
        scoresPerGame: Math.round((scoringData.events.length / appearances) * 100) / 100,
        minutesPerScore: minutes > 0 && scoringData.events.length > 0
          ? Math.round(minutes / scoringData.events.length)
          : null,
        scoreBreakdown,
        lastScoringDate: scoringData.lastDate?.toISOString() || null,
        scoringStreak: calculateStreak(player.id),
        homeScores: scoringData.homeScores,
        awayScores: scoringData.awayScores,
        competitionScores: scoringData.compScores,
        friendlyScores: scoringData.friendlyScores,
      });
    }

    // Sort by total scores (descending), then by scores per game
    scorerRecords.sort((a, b) => {
      if (b.totalScores !== a.totalScores) return b.totalScores - a.totalScores;
      return b.scoresPerGame - a.scoresPerGame;
    });

    // Apply limit
    const topScorers = scorerRecords.slice(0, limit);

    // Calculate team total
    const totalTeamScores = scorerRecords.reduce((sum, s) => sum + s.totalScores, 0);

    // 12. Build response
    const response: ScorersResponse = {
      teamId: team.id,
      teamName: team.name,
      clubId: club.id,
      sport: club.sport,
      totalTeamScores,
      scorerCount: scorerRecords.length,
      sportContext: {
        scoringLabel: SPORT_SCORING_LABELS[club.sport],
        scoringEvents,
      },
      topScorers,
      period: seasonId ? `Season ${seasonId}` : 'All Time',
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Top Scorers error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch top scorers',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
