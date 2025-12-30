// =============================================================================
// ⚽ MATCH DETAIL API - Enterprise-Grade Multi-Sport Implementation
// =============================================================================
// GET /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]
// Fetch detailed match information with events, lineup, and stats
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club Owner, Manager, Coach, Player (read)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Sport, MatchStatus, ClubMemberRole } from '@prisma/client';

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
    matchId: string;
  };
}

interface MatchPlayer {
  id: string;
  playerId: string;
  userId: string;
  name: string;
  position: string | null;
  shirtNumber: number | null;
  photo?: string | null;
  isStarter: boolean;
  isCaptain: boolean;
  minutesPlayed: number | null;
  rating: number | null;
  substitutedIn?: number;
  substitutedOut?: number;
}

interface MatchEvent {
  id: string;
  type: string;
  minute: number;
  additionalMinute?: number;
  period: string;
  description?: string;
  player?: {
    id: string;
    name: string;
    shirtNumber: number | null;
  };
  assistPlayer?: {
    id: string;
    name: string;
    shirtNumber: number | null;
  };
  isHomeTeam: boolean;
}

interface MatchDetailResponse {
  id: string;
  status: MatchStatus;
  matchType: string;
  
  // Teams
  homeTeam: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
  };
  
  // Score
  homeScore: number | null;
  awayScore: number | null;
  homeHalftimeScore: number | null;
  awayHalftimeScore: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  
  // Sport-specific score display
  scoreDisplay: string;
  
  // Timing
  kickOffTime: string;
  endTime?: string | null;
  
  // Venue
  venue?: string | null;
  pitch?: string | null;
  
  // Competition
  competition?: {
    id: string;
    name: string;
    logo?: string | null;
  };
  
  // Weather
  weather?: {
    condition?: string;
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
  };
  
  // Formations
  homeFormation?: string | null;
  awayFormation?: string | null;
  
  // Lineups
  homeLineup: MatchPlayer[];
  awayLineup: MatchPlayer[];
  
  // Events
  events: MatchEvent[];
  
  // Stats
  matchStats?: {
    possession?: { home: number; away: number };
    shots?: { home: number; away: number };
    shotsOnTarget?: { home: number; away: number };
    corners?: { home: number; away: number };
    fouls?: { home: number; away: number };
    yellowCards?: { home: number; away: number };
    redCards?: { home: number; away: number };
  };
  
  // Attendance
  attendance?: number | null;
  
  // Sport context
  sportContext: {
    sport: Sport;
    scoreLabel: string;
    periods: string[];
  };
  
  // Permissions
  canEdit: boolean;
  canRecordResult: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// SPORT-SPECIFIC CONFIGURATIONS
// =============================================================================

const SPORT_SCORE_LABELS: Record<Sport, string> = {
  FOOTBALL: 'Goals',
  FUTSAL: 'Goals',
  BEACH_FOOTBALL: 'Goals',
  RUGBY: 'Points',
  CRICKET: 'Runs/Wickets',
  AMERICAN_FOOTBALL: 'Points',
  BASKETBALL: 'Points',
  HOCKEY: 'Goals',
  LACROSSE: 'Goals',
  NETBALL: 'Goals',
  AUSTRALIAN_RULES: 'Points (G.B)',
  GAELIC_FOOTBALL: 'Goals-Points',
};

const SPORT_PERIODS: Record<Sport, string[]> = {
  FOOTBALL: ['First Half', 'Second Half', 'Extra Time 1', 'Extra Time 2', 'Penalties'],
  FUTSAL: ['First Half', 'Second Half', 'Extra Time', 'Penalties'],
  BEACH_FOOTBALL: ['Period 1', 'Period 2', 'Period 3', 'Extra Time', 'Penalties'],
  RUGBY: ['First Half', 'Second Half', 'Extra Time'],
  CRICKET: ['Innings 1', 'Innings 2', 'Super Over'],
  AMERICAN_FOOTBALL: ['Q1', 'Q2', 'Q3', 'Q4', 'Overtime'],
  BASKETBALL: ['Q1', 'Q2', 'Q3', 'Q4', 'Overtime'],
  HOCKEY: ['Q1', 'Q2', 'Q3', 'Q4', 'Shootout'],
  LACROSSE: ['Q1', 'Q2', 'Q3', 'Q4', 'Overtime'],
  NETBALL: ['Q1', 'Q2', 'Q3', 'Q4', 'Extra Time'],
  AUSTRALIAN_RULES: ['Q1', 'Q2', 'Q3', 'Q4', 'Extra Time'],
  GAELIC_FOOTBALL: ['First Half', 'Second Half', 'Extra Time'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `match_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const EDIT_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

async function getPermissions(
  userId: string,
  clubId: string
): Promise<{ canView: boolean; canEdit: boolean; canRecordResult: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  
  if (user?.isSuperAdmin) {
    return { canView: true, canEdit: true, canRecordResult: true };
  }

  const clubMember = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
    },
    select: { role: true },
  });

  if (!clubMember) {
    return { canView: false, canEdit: false, canRecordResult: false };
  }

  const hasEditRole = EDIT_ROLES.includes(clubMember.role);

  return {
    canView: true,
    canEdit: hasEditRole,
    canRecordResult: hasEditRole,
  };
}

function formatScoreDisplay(
  sport: Sport,
  homeScore: number | null,
  awayScore: number | null
): string {
  if (homeScore === null || awayScore === null) return 'vs';
  
  switch (sport) {
    case 'AUSTRALIAN_RULES':
      // Would need goals/behinds breakdown for proper display
      return `${homeScore} - ${awayScore}`;
    case 'GAELIC_FOOTBALL':
      // Would need goals/points breakdown for proper display
      return `${homeScore} - ${awayScore}`;
    default:
      return `${homeScore} - ${awayScore}`;
  }
}

// =============================================================================
// GET HANDLER - Match Detail
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, matchId } = params;

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

    // 2. Verify club and get sport
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, sport: true },
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

    // 3. Authorization
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canView) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view this match',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 4. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Fetch match with all related data
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
          },
        },
        competition: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        lineup: {
          include: {
            player: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { isStarter: 'desc' },
            { position: 'asc' },
          ],
        },
        events: {
          orderBy: [
            { minute: 'asc' },
            { createdAt: 'asc' },
          ],
          include: {
            player: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            relatedPlayer: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!match) {
      return createResponse(null, {
        success: false,
        error: 'Match not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // Verify team is in this match
    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Match not found for this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 6. Build lineup arrays
    const homeLineup: MatchPlayer[] = [];
    const awayLineup: MatchPlayer[] = [];

    for (const lineup of match.lineup) {
      const player: MatchPlayer = {
        id: lineup.id,
        playerId: lineup.playerId,
        userId: lineup.player.userId,
        name: `${lineup.player.user.firstName} ${lineup.player.user.lastName}`,
        position: lineup.position,
        shirtNumber: lineup.shirtNumber,
        photo: lineup.player.user.avatar,
        isStarter: lineup.isStarter,
        isCaptain: lineup.isCaptain,
        minutesPlayed: lineup.minutesPlayed,
        rating: lineup.rating,
      };

      if (lineup.teamId === match.homeTeamId) {
        homeLineup.push(player);
      } else {
        awayLineup.push(player);
      }
    }

    // 7. Build events array with player info
    const events: MatchEvent[] = match.events.map((event) => ({
      id: event.id,
      type: event.eventType,
      minute: event.minute || 0,
      additionalMinute: event.additionalMinute || undefined,
      period: event.period || 'First Half',
      description: event.description || undefined,
      player: event.player ? {
        id: event.player.id,
        name: `${event.player.user.firstName} ${event.player.user.lastName}`,
        shirtNumber: event.player.shirtNumber,
      } : undefined,
      assistPlayer: event.relatedPlayer ? {
        id: event.relatedPlayer.id,
        name: `${event.relatedPlayer.user.firstName} ${event.relatedPlayer.user.lastName}`,
        shirtNumber: event.relatedPlayer.shirtNumber,
      } : undefined,
      isHomeTeam: event.teamId === match.homeTeamId,
    }));

    // 8. Calculate match stats from events
    const matchStats = {
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
    };

    for (const event of match.events) {
      const isHome = event.teamId === match.homeTeamId;
      if (event.eventType === 'YELLOW_CARD') {
        if (isHome) matchStats.yellowCards.home++;
        else matchStats.yellowCards.away++;
      }
      if (event.eventType === 'RED_CARD') {
        if (isHome) matchStats.redCards.home++;
        else matchStats.redCards.away++;
      }
    }

    // 9. Build response
    const response: MatchDetailResponse = {
      id: match.id,
      status: match.status,
      matchType: match.matchType,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeHalftimeScore: match.homeHalftimeScore,
      awayHalftimeScore: match.awayHalftimeScore,
      homePenaltyScore: match.homePenaltyScore,
      awayPenaltyScore: match.awayPenaltyScore,
      scoreDisplay: formatScoreDisplay(club.sport, match.homeScore, match.awayScore),
      kickOffTime: match.kickOffTime.toISOString(),
      endTime: match.endTime?.toISOString() || null,
      venue: match.venue,
      pitch: match.pitch,
      competition: match.competition || undefined,
      weather: match.weather || match.temperature ? {
        condition: match.weather || undefined,
        temperature: match.temperature || undefined,
        humidity: match.humidity || undefined,
        windSpeed: match.windSpeed || undefined,
      } : undefined,
      homeFormation: match.homeFormation,
      awayFormation: match.awayFormation,
      homeLineup,
      awayLineup,
      events,
      matchStats,
      attendance: match.attendance,
      sportContext: {
        sport: club.sport,
        scoreLabel: SPORT_SCORE_LABELS[club.sport],
        periods: SPORT_PERIODS[club.sport],
      },
      canEdit: permissions.canEdit,
      canRecordResult: permissions.canRecordResult && match.status !== 'COMPLETED',
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Match error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch match details',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
