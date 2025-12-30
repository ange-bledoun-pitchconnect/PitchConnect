// =============================================================================
// 🎯 ASSISTS/PLAYMAKERS ANALYTICS API - Enterprise-Grade Multi-Sport
// =============================================================================
// GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/assists
// Top assist providers / playmakers with sport-specific assist types
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

// Sport-specific assist/playmaking event configuration
interface AssistEventConfig {
  type: MatchEventType;
  label: string;
  weight: number; // For ranking purposes
}

interface AssistDetail {
  matchId: string;
  matchDate: string;
  opponent: string;
  minute: number;
  eventType: string;
  assistedPlayerId?: string;
  assistedPlayerName?: string;
  isHome: boolean;
}

interface AssistProviderRecord {
  playerId: string;
  userId: string;
  playerName: string;
  position: string | null;
  shirtNumber: number | null;
  photo?: string | null;
  
  // Total metrics
  totalAssists: number;
  weightedAssists: number; // Sport-specific weighting
  appearances: number;
  assistsPerGame: number;
  minutesPerAssist: number | null;
  
  // Sport-specific breakdown
  assistBreakdown: Record<string, {
    count: number;
    label: string;
  }>;
  
  // Context
  homeAssists: number;
  awayAssists: number;
  lastAssistDate: string | null;
  
  // Recent assists (last 5)
  recentAssists: AssistDetail[];
}

interface AssistsResponse {
  teamId: string;
  teamName: string;
  clubId: string;
  sport: Sport;
  
  // Totals
  totalTeamAssists: number;
  assistProviderCount: number;
  
  // Sport context
  sportContext: {
    assistLabel: string; // "Assists" / "Key Passes" / "Chances Created"
    assistEvents: AssistEventConfig[];
    hasAssistTracking: boolean;
  };
  
  // Top assist providers
  topAssistProviders: AssistProviderRecord[];
  
  // Assist combinations (who assists whom most)
  topCombinations: Array<{
    assisterId: string;
    assisterName: string;
    scorerId: string;
    scorerName: string;
    count: number;
  }>;
  
  period: string;
}

// =============================================================================
// SPORT-SPECIFIC ASSIST CONFIGURATIONS
// =============================================================================

const SPORT_ASSIST_EVENTS: Record<Sport, AssistEventConfig[]> = {
  FOOTBALL: [
    { type: 'ASSIST' as MatchEventType, label: 'Assists', weight: 1 },
  ],
  FUTSAL: [
    { type: 'ASSIST' as MatchEventType, label: 'Assists', weight: 1 },
  ],
  BEACH_FOOTBALL: [
    { type: 'ASSIST' as MatchEventType, label: 'Assists', weight: 1 },
  ],
  RUGBY: [
    { type: 'ASSIST' as MatchEventType, label: 'Try Assists', weight: 1 },
    // Rugby doesn't traditionally track assists like football
  ],
  CRICKET: [
    // Cricket doesn't have traditional assists
  ],
  AMERICAN_FOOTBALL: [
    { type: 'ASSIST' as MatchEventType, label: 'TD Passes', weight: 1 },
    // Quarterback passes that result in touchdowns
  ],
  BASKETBALL: [
    { type: 'ASSIST' as MatchEventType, label: 'Assists', weight: 1 },
  ],
  HOCKEY: [
    { type: 'ASSIST' as MatchEventType, label: 'Assists', weight: 1 },
  ],
  LACROSSE: [
    { type: 'ASSIST' as MatchEventType, label: 'Assists', weight: 1 },
  ],
  NETBALL: [
    { type: 'ASSIST' as MatchEventType, label: 'Goal Assists', weight: 1 },
  ],
  AUSTRALIAN_RULES: [
    // AFL doesn't traditionally track assists
  ],
  GAELIC_FOOTBALL: [
    { type: 'ASSIST' as MatchEventType, label: 'Assists', weight: 1 },
  ],
};

const SPORT_ASSIST_LABELS: Record<Sport, string> = {
  FOOTBALL: 'Assists',
  FUTSAL: 'Assists',
  BEACH_FOOTBALL: 'Assists',
  RUGBY: 'Try Assists',
  CRICKET: 'Contributions', // Not applicable
  AMERICAN_FOOTBALL: 'TD Passes',
  BASKETBALL: 'Assists',
  HOCKEY: 'Assists',
  LACROSSE: 'Assists',
  NETBALL: 'Goal Assists',
  AUSTRALIAN_RULES: 'Clearances', // Alternative metric
  GAELIC_FOOTBALL: 'Assists',
};

// Sports that track assists
const SPORTS_WITH_ASSISTS = new Set<Sport>([
  'FOOTBALL',
  'FUTSAL',
  'BEACH_FOOTBALL',
  'BASKETBALL',
  'HOCKEY',
  'LACROSSE',
  'NETBALL',
  'GAELIC_FOOTBALL',
]);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `assists_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
// GET HANDLER - Top Assist Providers
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
    const includeDetails = searchParams.get('includeDetails') === 'true';

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

    // 5. Check if sport tracks assists
    const hasAssistTracking = SPORTS_WITH_ASSISTS.has(club.sport);
    const assistEvents = SPORT_ASSIST_EVENTS[club.sport] || [];
    const assistEventTypes = assistEvents.map((e) => e.type);

    // If sport doesn't track assists, return empty but informative response
    if (!hasAssistTracking || assistEventTypes.length === 0) {
      return createResponse<AssistsResponse>({
        teamId: team.id,
        teamName: team.name,
        clubId: club.id,
        sport: club.sport,
        totalTeamAssists: 0,
        assistProviderCount: 0,
        sportContext: {
          assistLabel: SPORT_ASSIST_LABELS[club.sport],
          assistEvents: [],
          hasAssistTracking: false,
        },
        topAssistProviders: [],
        topCombinations: [],
        period: seasonId ? `Season ${seasonId}` : 'All Time',
      }, {
        success: true,
        requestId,
      });
    }

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
    const playerIdToUserMap = new Map(players.map((p) => [p.id, p.userId]));
    const playerIds = players.map((p) => p.id);

    // Build user lookup for names
    const userLookup = new Map(teamMembers.map((m) => [
      m.userId,
      `${m.user.firstName} ${m.user.lastName}`,
    ]));

    // 7. Fetch assist events
    const matchFilter: Record<string, unknown> = {
      status: MatchStatus.COMPLETED,
      deletedAt: null,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    };
    
    if (seasonId) {
      matchFilter.seasonId = seasonId;
    }

    const assistEventsData = await prisma.matchEvent.findMany({
      where: {
        playerId: { in: playerIds },
        eventType: { in: assistEventTypes },
        match: matchFilter,
      },
      include: {
        match: {
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            kickOffTime: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
      orderBy: { match: { kickOffTime: 'desc' } },
    });

    // 8. Fetch lineup data for appearances
    const lineupData = await prisma.matchLineup.findMany({
      where: {
        playerId: { in: playerIds },
        match: matchFilter,
      },
      select: {
        playerId: true,
        matchId: true,
        minutesPlayed: true,
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

    // 9. Aggregate assist data by player
    const playerAssistMap = new Map<string, {
      assists: typeof assistEventsData;
      breakdown: Record<string, number>;
      homeAssists: number;
      awayAssists: number;
      lastDate: Date | null;
      combinations: Map<string, number>; // scorerId -> count
    }>();

    for (const event of assistEventsData) {
      if (!event.playerId) continue;
      
      const current = playerAssistMap.get(event.playerId) || {
        assists: [],
        breakdown: {},
        homeAssists: 0,
        awayAssists: 0,
        lastDate: null,
        combinations: new Map(),
      };

      current.assists.push(event);
      current.breakdown[event.eventType] = (current.breakdown[event.eventType] || 0) + 1;

      // Home/Away context
      const isHome = event.match.homeTeamId === teamId;
      if (isHome) current.homeAssists++;
      else current.awayAssists++;

      // Track last assist date
      if (!current.lastDate || event.match.kickOffTime > current.lastDate) {
        current.lastDate = event.match.kickOffTime;
      }

      // Track assist combinations (if we have relatedPlayerId)
      if (event.relatedPlayerId) {
        const count = current.combinations.get(event.relatedPlayerId) || 0;
        current.combinations.set(event.relatedPlayerId, count + 1);
      }

      playerAssistMap.set(event.playerId, current);
    }

    // 10. Build assist provider records
    const assistProviders: AssistProviderRecord[] = [];

    for (const member of teamMembers) {
      const player = playerMap.get(member.userId);
      if (!player) continue;

      const assistData = playerAssistMap.get(player.id);
      const appearanceData = playerAppearances.get(player.id);

      if (!assistData || assistData.assists.length === 0) continue;

      // Calculate weighted total
      let weightedTotal = 0;
      const assistBreakdown: AssistProviderRecord['assistBreakdown'] = {};

      for (const config of assistEvents) {
        const count = assistData.breakdown[config.type] || 0;
        weightedTotal += count * config.weight;
        
        if (count > 0) {
          assistBreakdown[config.type] = {
            count,
            label: config.label,
          };
        }
      }

      const appearances = appearanceData?.total || 1;
      const minutes = appearanceData?.minutes || 0;

      // Build recent assists if requested
      const recentAssists: AssistDetail[] = includeDetails
        ? assistData.assists.slice(0, 5).map((a) => {
            const isHome = a.match.homeTeamId === teamId;
            const opponent = isHome ? a.match.awayTeam.name : a.match.homeTeam.name;
            
            // Get scorer name if available
            let assistedPlayerName: string | undefined;
            if (a.relatedPlayerId) {
              const scorerUserId = playerIdToUserMap.get(a.relatedPlayerId);
              if (scorerUserId) {
                assistedPlayerName = userLookup.get(scorerUserId);
              }
            }

            return {
              matchId: a.matchId,
              matchDate: a.match.kickOffTime.toISOString(),
              opponent,
              minute: a.minute || 0,
              eventType: a.eventType,
              assistedPlayerId: a.relatedPlayerId || undefined,
              assistedPlayerName,
              isHome,
            };
          })
        : [];

      assistProviders.push({
        playerId: player.id,
        userId: member.userId,
        playerName: `${member.user.firstName} ${member.user.lastName}`,
        position: player.position,
        shirtNumber: player.shirtNumber,
        photo: member.user.avatar,
        totalAssists: assistData.assists.length,
        weightedAssists: weightedTotal,
        appearances,
        assistsPerGame: Math.round((assistData.assists.length / appearances) * 100) / 100,
        minutesPerAssist: minutes > 0 && assistData.assists.length > 0
          ? Math.round(minutes / assistData.assists.length)
          : null,
        assistBreakdown,
        homeAssists: assistData.homeAssists,
        awayAssists: assistData.awayAssists,
        lastAssistDate: assistData.lastDate?.toISOString() || null,
        recentAssists,
      });
    }

    // Sort by total assists (descending), then by assists per game
    assistProviders.sort((a, b) => {
      if (b.totalAssists !== a.totalAssists) return b.totalAssists - a.totalAssists;
      return b.assistsPerGame - a.assistsPerGame;
    });

    // Apply limit
    const topAssistProviders = assistProviders.slice(0, limit);

    // 11. Build top combinations
    const allCombinations: Array<{ assisterId: string; scorerId: string; count: number }> = [];
    
    for (const [assisterId, data] of playerAssistMap) {
      for (const [scorerId, count] of data.combinations) {
        allCombinations.push({ assisterId, scorerId, count });
      }
    }

    // Sort and get top 10 combinations
    allCombinations.sort((a, b) => b.count - a.count);
    const topCombinations = allCombinations.slice(0, 10).map((combo) => {
      const assisterUserId = playerIdToUserMap.get(combo.assisterId);
      const scorerUserId = playerIdToUserMap.get(combo.scorerId);
      
      return {
        assisterId: combo.assisterId,
        assisterName: assisterUserId ? userLookup.get(assisterUserId) || 'Unknown' : 'Unknown',
        scorerId: combo.scorerId,
        scorerName: scorerUserId ? userLookup.get(scorerUserId) || 'Unknown' : 'Unknown',
        count: combo.count,
      };
    });

    // Calculate team total
    const totalTeamAssists = assistProviders.reduce((sum, p) => sum + p.totalAssists, 0);

    // 12. Build response
    const response: AssistsResponse = {
      teamId: team.id,
      teamName: team.name,
      clubId: club.id,
      sport: club.sport,
      totalTeamAssists,
      assistProviderCount: assistProviders.length,
      sportContext: {
        assistLabel: SPORT_ASSIST_LABELS[club.sport],
        assistEvents,
        hasAssistTracking: true,
      },
      topAssistProviders,
      topCombinations,
      period: seasonId ? `Season ${seasonId}` : 'All Time',
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Assists Analytics error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch assists analytics',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
