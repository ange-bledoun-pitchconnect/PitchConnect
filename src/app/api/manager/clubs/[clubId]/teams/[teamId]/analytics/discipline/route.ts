// =============================================================================
// 🟨🟥 DISCIPLINE ANALYTICS API - Enterprise-Grade Multi-Sport
// =============================================================================
// GET /api/manager/clubs/[clubId]/teams/[teamId]/analytics/discipline
// Disciplinary records with sport-specific infractions
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

// Sport-specific disciplinary event configuration
interface DisciplinaryEventConfig {
  type: MatchEventType;
  label: string;
  points: number; // For severity weighting
  color?: string; // For UI display
  suspensionThreshold?: number; // Accumulated cards before suspension
}

interface DisciplinaryIncident {
  matchId: string;
  matchDate: string;
  opponent: string;
  minute: number;
  type: string;
  reason?: string;
  isHome: boolean;
}

interface PlayerDisciplineRecord {
  playerId: string;
  userId: string;
  playerName: string;
  position: string | null;
  shirtNumber: number | null;
  photo?: string | null;
  
  // Disciplinary counts
  yellowCards: number;
  redCards: number;
  totalInfractions: number;
  disciplinaryPoints: number; // Weighted severity score
  
  // Sport-specific breakdown
  infractionBreakdown: Record<string, {
    count: number;
    label: string;
    points: number;
  }>;
  
  // Suspension tracking
  suspensionRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'SUSPENDED';
  cardsToSuspension: number | null;
  currentSuspensionMatches: number;
  
  // Context
  appearances: number;
  infractionsPerGame: number;
  
  // Recent incidents
  recentIncidents: DisciplinaryIncident[];
  lastIncidentDate: string | null;
}

interface DisciplineResponse {
  teamId: string;
  teamName: string;
  clubId: string;
  sport: Sport;
  
  // Team totals
  totalYellowCards: number;
  totalRedCards: number;
  totalInfractions: number;
  totalDisciplinaryPoints: number;
  
  // Averages
  infractionsPerMatch: number;
  
  // Sport context
  sportContext: {
    disciplinaryEvents: DisciplinaryEventConfig[];
    suspensionRules: {
      yellowsForSuspension: number;
      redSuspensionMatches: number;
    };
  };
  
  // Player records sorted by severity
  playerDiscipline: PlayerDisciplineRecord[];
  
  // Players at risk of suspension
  atRiskPlayers: Array<{
    playerId: string;
    playerName: string;
    cardsToSuspension: number;
    riskLevel: 'MEDIUM' | 'HIGH';
  }>;
  
  // Currently suspended players
  suspendedPlayers: Array<{
    playerId: string;
    playerName: string;
    matchesRemaining: number;
    reason: string;
  }>;
  
  period: string;
}

// =============================================================================
// SPORT-SPECIFIC DISCIPLINE CONFIGURATIONS
// =============================================================================

const SPORT_DISCIPLINE_EVENTS: Record<Sport, DisciplinaryEventConfig[]> = {
  FOOTBALL: [
    { type: 'YELLOW_CARD' as MatchEventType, label: 'Yellow Cards', points: 1, color: 'yellow', suspensionThreshold: 5 },
    { type: 'RED_CARD' as MatchEventType, label: 'Red Cards', points: 3, color: 'red' },
  ],
  FUTSAL: [
    { type: 'YELLOW_CARD' as MatchEventType, label: 'Yellow Cards', points: 1, color: 'yellow', suspensionThreshold: 5 },
    { type: 'RED_CARD' as MatchEventType, label: 'Red Cards', points: 3, color: 'red' },
  ],
  BEACH_FOOTBALL: [
    { type: 'YELLOW_CARD' as MatchEventType, label: 'Yellow Cards', points: 1, color: 'yellow', suspensionThreshold: 3 },
    { type: 'RED_CARD' as MatchEventType, label: 'Red Cards', points: 3, color: 'red' },
  ],
  RUGBY: [
    { type: 'YELLOW_CARD' as MatchEventType, label: 'Yellow Cards (Sin Bin)', points: 1, color: 'yellow' },
    { type: 'RED_CARD' as MatchEventType, label: 'Red Cards', points: 3, color: 'red' },
    { type: 'PENALTY_CONCEDED' as MatchEventType, label: 'Penalties Conceded', points: 0.5 },
  ],
  CRICKET: [
    // Cricket has demerit points system
    { type: 'WARNING' as MatchEventType, label: 'Warnings', points: 1 },
    { type: 'MISCONDUCT' as MatchEventType, label: 'Misconduct', points: 2 },
  ],
  AMERICAN_FOOTBALL: [
    { type: 'PENALTY_FLAG' as MatchEventType, label: 'Personal Fouls', points: 1 },
    { type: 'EJECTION' as MatchEventType, label: 'Ejections', points: 3 },
  ],
  BASKETBALL: [
    { type: 'FOUL' as MatchEventType, label: 'Personal Fouls', points: 0.5 },
    { type: 'TECHNICAL_FOUL' as MatchEventType, label: 'Technical Fouls', points: 2 },
    { type: 'FLAGRANT_FOUL' as MatchEventType, label: 'Flagrant Fouls', points: 3 },
    { type: 'EJECTION' as MatchEventType, label: 'Ejections', points: 3 },
  ],
  HOCKEY: [
    { type: 'GREEN_CARD' as MatchEventType, label: 'Green Cards', points: 0.5, color: 'green' },
    { type: 'YELLOW_CARD' as MatchEventType, label: 'Yellow Cards', points: 1, color: 'yellow' },
    { type: 'RED_CARD' as MatchEventType, label: 'Red Cards', points: 3, color: 'red' },
  ],
  LACROSSE: [
    { type: 'PENALTY' as MatchEventType, label: 'Penalties', points: 1 },
    { type: 'EJECTION' as MatchEventType, label: 'Ejections', points: 3 },
  ],
  NETBALL: [
    { type: 'WARNING' as MatchEventType, label: 'Warnings', points: 1 },
    { type: 'SUSPENSION' as MatchEventType, label: 'Suspensions', points: 3 },
  ],
  AUSTRALIAN_RULES: [
    { type: 'FREE_KICK_AGAINST' as MatchEventType, label: 'Free Kicks Against', points: 0.5 },
    { type: 'REPORT' as MatchEventType, label: 'Match Reports', points: 2 },
    { type: 'SEND_OFF' as MatchEventType, label: 'Send Offs', points: 3 },
  ],
  GAELIC_FOOTBALL: [
    { type: 'YELLOW_CARD' as MatchEventType, label: 'Yellow Cards', points: 1, color: 'yellow' },
    { type: 'BLACK_CARD' as MatchEventType, label: 'Black Cards', points: 2, color: 'black' },
    { type: 'RED_CARD' as MatchEventType, label: 'Red Cards', points: 3, color: 'red' },
  ],
};

// Default suspension rules per sport
const SPORT_SUSPENSION_RULES: Record<Sport, { yellowsForSuspension: number; redSuspensionMatches: number }> = {
  FOOTBALL: { yellowsForSuspension: 5, redSuspensionMatches: 1 },
  FUTSAL: { yellowsForSuspension: 5, redSuspensionMatches: 1 },
  BEACH_FOOTBALL: { yellowsForSuspension: 3, redSuspensionMatches: 1 },
  RUGBY: { yellowsForSuspension: 3, redSuspensionMatches: 1 },
  CRICKET: { yellowsForSuspension: 4, redSuspensionMatches: 1 },
  AMERICAN_FOOTBALL: { yellowsForSuspension: 2, redSuspensionMatches: 1 },
  BASKETBALL: { yellowsForSuspension: 7, redSuspensionMatches: 1 },
  HOCKEY: { yellowsForSuspension: 3, redSuspensionMatches: 1 },
  LACROSSE: { yellowsForSuspension: 3, redSuspensionMatches: 1 },
  NETBALL: { yellowsForSuspension: 3, redSuspensionMatches: 1 },
  AUSTRALIAN_RULES: { yellowsForSuspension: 3, redSuspensionMatches: 1 },
  GAELIC_FOOTBALL: { yellowsForSuspension: 3, redSuspensionMatches: 1 },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `discipline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

function calculateSuspensionRisk(
  yellowCards: number,
  redCards: number,
  threshold: number
): { risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'SUSPENDED'; cardsToSuspension: number | null } {
  // If player has a red card in recent matches, might be suspended
  if (redCards > 0) {
    return { risk: 'SUSPENDED', cardsToSuspension: null };
  }
  
  const remaining = threshold - yellowCards;
  
  if (remaining <= 0) {
    return { risk: 'SUSPENDED', cardsToSuspension: 0 };
  } else if (remaining === 1) {
    return { risk: 'HIGH', cardsToSuspension: 1 };
  } else if (remaining === 2) {
    return { risk: 'MEDIUM', cardsToSuspension: 2 };
  }
  
  return { risk: 'LOW', cardsToSuspension: remaining };
}

// =============================================================================
// GET HANDLER - Discipline Analytics
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
    const seasonId = searchParams.get('seasonId');
    const includeDetails = searchParams.get('includeDetails') !== 'false'; // Default true

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

    // 5. Get discipline config for sport
    const disciplineEvents = SPORT_DISCIPLINE_EVENTS[club.sport] || [
      { type: 'YELLOW_CARD' as MatchEventType, label: 'Yellow Cards', points: 1, color: 'yellow' },
      { type: 'RED_CARD' as MatchEventType, label: 'Red Cards', points: 3, color: 'red' },
    ];
    const disciplineEventTypes = disciplineEvents.map((e) => e.type);
    const suspensionRules = SPORT_SUSPENSION_RULES[club.sport];

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
    const playerIds = players.map((p) => p.id);

    // 7. Fetch disciplinary events
    const matchFilter: Record<string, unknown> = {
      status: MatchStatus.COMPLETED,
      deletedAt: null,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    };
    
    if (seasonId) {
      matchFilter.seasonId = seasonId;
    }

    const disciplinaryEventsData = await prisma.matchEvent.findMany({
      where: {
        playerId: { in: playerIds },
        eventType: { in: disciplineEventTypes },
        match: matchFilter,
      },
      include: {
        match: {
          select: {
            id: true,
            homeTeamId: true,
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
      },
    });

    // Build appearances map
    const playerAppearances = new Map<string, number>();
    const matchIds = new Set<string>();
    for (const lineup of lineupData) {
      playerAppearances.set(
        lineup.playerId,
        (playerAppearances.get(lineup.playerId) || 0) + 1
      );
      matchIds.add(lineup.matchId);
    }

    const totalTeamMatches = matchIds.size;

    // 9. Aggregate discipline data by player
    const playerDisciplineMap = new Map<string, {
      events: typeof disciplinaryEventsData;
      breakdown: Record<string, number>;
      yellowCards: number;
      redCards: number;
      lastDate: Date | null;
    }>();

    for (const event of disciplinaryEventsData) {
      if (!event.playerId) continue;
      
      const current = playerDisciplineMap.get(event.playerId) || {
        events: [],
        breakdown: {},
        yellowCards: 0,
        redCards: 0,
        lastDate: null,
      };

      current.events.push(event);
      current.breakdown[event.eventType] = (current.breakdown[event.eventType] || 0) + 1;

      // Track yellow/red specifically
      if (event.eventType === 'YELLOW_CARD') current.yellowCards++;
      if (event.eventType === 'RED_CARD') current.redCards++;

      // Track last incident date
      if (!current.lastDate || event.match.kickOffTime > current.lastDate) {
        current.lastDate = event.match.kickOffTime;
      }

      playerDisciplineMap.set(event.playerId, current);
    }

    // 10. Build player discipline records
    const playerDiscipline: PlayerDisciplineRecord[] = [];
    let totalYellowCards = 0;
    let totalRedCards = 0;
    let totalDisciplinaryPoints = 0;

    for (const member of teamMembers) {
      const player = playerMap.get(member.userId);
      if (!player) continue;

      const disciplineData = playerDisciplineMap.get(player.id);
      const appearances = playerAppearances.get(player.id) || 0;

      // Even players with no incidents should be included if they have appearances
      const yellowCards = disciplineData?.yellowCards || 0;
      const redCards = disciplineData?.redCards || 0;
      const totalInfractions = disciplineData?.events.length || 0;

      // Calculate weighted points
      let disciplinaryPoints = 0;
      const infractionBreakdown: PlayerDisciplineRecord['infractionBreakdown'] = {};

      for (const config of disciplineEvents) {
        const count = disciplineData?.breakdown[config.type] || 0;
        const points = count * config.points;
        disciplinaryPoints += points;
        
        if (count > 0) {
          infractionBreakdown[config.type] = {
            count,
            label: config.label,
            points,
          };
        }
      }

      // Calculate suspension risk
      const { risk, cardsToSuspension } = calculateSuspensionRisk(
        yellowCards,
        redCards,
        suspensionRules.yellowsForSuspension
      );

      // Build recent incidents
      const recentIncidents: DisciplinaryIncident[] = includeDetails && disciplineData
        ? disciplineData.events.slice(0, 5).map((e) => {
            const isHome = e.match.homeTeamId === teamId;
            const opponent = isHome ? e.match.awayTeam.name : e.match.homeTeam.name;
            
            return {
              matchId: e.matchId,
              matchDate: e.match.kickOffTime.toISOString(),
              opponent,
              minute: e.minute || 0,
              type: e.eventType,
              reason: e.description || undefined,
              isHome,
            };
          })
        : [];

      // Update totals
      totalYellowCards += yellowCards;
      totalRedCards += redCards;
      totalDisciplinaryPoints += disciplinaryPoints;

      // Only include players with incidents or at risk
      if (totalInfractions > 0 || appearances > 0) {
        playerDiscipline.push({
          playerId: player.id,
          userId: member.userId,
          playerName: `${member.user.firstName} ${member.user.lastName}`,
          position: player.position,
          shirtNumber: player.shirtNumber,
          photo: member.user.avatar,
          yellowCards,
          redCards,
          totalInfractions,
          disciplinaryPoints,
          infractionBreakdown,
          suspensionRisk: risk,
          cardsToSuspension,
          currentSuspensionMatches: 0, // Would need suspension tracking table
          appearances,
          infractionsPerGame: appearances > 0
            ? Math.round((totalInfractions / appearances) * 100) / 100
            : 0,
          recentIncidents,
          lastIncidentDate: disciplineData?.lastDate?.toISOString() || null,
        });
      }
    }

    // Sort by disciplinary points (worst offenders first)
    playerDiscipline.sort((a, b) => {
      if (b.disciplinaryPoints !== a.disciplinaryPoints) {
        return b.disciplinaryPoints - a.disciplinaryPoints;
      }
      return b.redCards - a.redCards;
    });

    // 11. Identify at-risk and suspended players
    const atRiskPlayers = playerDiscipline
      .filter((p) => p.suspensionRisk === 'MEDIUM' || p.suspensionRisk === 'HIGH')
      .map((p) => ({
        playerId: p.playerId,
        playerName: p.playerName,
        cardsToSuspension: p.cardsToSuspension || 0,
        riskLevel: p.suspensionRisk as 'MEDIUM' | 'HIGH',
      }));

    const suspendedPlayers = playerDiscipline
      .filter((p) => p.suspensionRisk === 'SUSPENDED' && p.currentSuspensionMatches > 0)
      .map((p) => ({
        playerId: p.playerId,
        playerName: p.playerName,
        matchesRemaining: p.currentSuspensionMatches,
        reason: p.redCards > 0 ? 'Red Card' : 'Yellow Card Accumulation',
      }));

    // Calculate averages
    const totalInfractions = disciplinaryEventsData.length;
    const infractionsPerMatch = totalTeamMatches > 0
      ? Math.round((totalInfractions / totalTeamMatches) * 100) / 100
      : 0;

    // 12. Build response
    const response: DisciplineResponse = {
      teamId: team.id,
      teamName: team.name,
      clubId: club.id,
      sport: club.sport,
      totalYellowCards,
      totalRedCards,
      totalInfractions,
      totalDisciplinaryPoints,
      infractionsPerMatch,
      sportContext: {
        disciplinaryEvents,
        suspensionRules,
      },
      playerDiscipline,
      atRiskPlayers,
      suspendedPlayers,
      period: seasonId ? `Season ${seasonId}` : 'All Time',
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Discipline Analytics error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch discipline analytics',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
