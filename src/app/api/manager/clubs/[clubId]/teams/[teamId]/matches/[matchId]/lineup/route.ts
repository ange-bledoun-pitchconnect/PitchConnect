// =============================================================================
// 📋 MATCH LINEUP API - Enterprise-Grade Multi-Sport Implementation
// =============================================================================
// GET  /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/lineup
// POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/lineup
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club Owner, Manager, Head Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport, ClubMemberRole, MatchStatus } from '@prisma/client';

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
    matchId: string;
  };
}

interface LineupPlayer {
  id: string;
  playerId: string;
  userId: string;
  name: string;
  position: string | null;
  shirtNumber: number | null;
  photo?: string | null;
  isStarter: boolean;
  isCaptain: boolean;
  isAvailable: boolean;
  unavailableReason?: string;
}

interface LineupResponse {
  matchId: string;
  teamId: string;
  formation: string | null;
  isSubmitted: boolean;
  
  // Players in lineup
  starters: LineupPlayer[];
  substitutes: LineupPlayer[];
  
  // Available players not in lineup
  availablePlayers: LineupPlayer[];
  
  // Unavailable players
  unavailablePlayers: Array<{
    playerId: string;
    name: string;
    reason: string; // INJURED, SUSPENDED, etc.
  }>;
  
  // Sport context
  sportContext: {
    sport: Sport;
    maxStarters: number;
    maxSubstitutes: number;
    positions: string[];
    commonFormations: string[];
  };
  
  canEdit: boolean;
}

// =============================================================================
// SPORT-SPECIFIC CONFIGURATIONS
// =============================================================================

const SPORT_LINEUP_CONFIG: Record<Sport, {
  maxStarters: number;
  maxSubstitutes: number;
  positions: string[];
  commonFormations: string[];
}> = {
  FOOTBALL: {
    maxStarters: 11,
    maxSubstitutes: 7,
    positions: ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'],
    commonFormations: ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1'],
  },
  FUTSAL: {
    maxStarters: 5,
    maxSubstitutes: 7,
    positions: ['GK', 'Fixo', 'Ala', 'Pivot'],
    commonFormations: ['1-2-2', '2-2', '3-1', '1-1-2-1'],
  },
  BEACH_FOOTBALL: {
    maxStarters: 5,
    maxSubstitutes: 3,
    positions: ['GK', 'DEF', 'MID', 'FWD'],
    commonFormations: ['1-2-2', '2-2'],
  },
  RUGBY: {
    maxStarters: 15,
    maxSubstitutes: 8,
    positions: ['Loosehead Prop', 'Hooker', 'Tighthead Prop', 'Lock', 'Blindside Flanker', 'Openside Flanker', 'Number 8', 'Scrum-half', 'Fly-half', 'Inside Centre', 'Outside Centre', 'Wing', 'Full-back'],
    commonFormations: ['Standard XV'],
  },
  CRICKET: {
    maxStarters: 11,
    maxSubstitutes: 1, // Only for fielding
    positions: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'],
    commonFormations: ['Standard XI'],
  },
  AMERICAN_FOOTBALL: {
    maxStarters: 11, // Per side (offense/defense)
    maxSubstitutes: 42,
    positions: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'],
    commonFormations: ['Standard'],
  },
  BASKETBALL: {
    maxStarters: 5,
    maxSubstitutes: 7,
    positions: ['PG', 'SG', 'SF', 'PF', 'C'],
    commonFormations: ['Standard'],
  },
  HOCKEY: {
    maxStarters: 11,
    maxSubstitutes: 5,
    positions: ['GK', 'DEF', 'MID', 'FWD'],
    commonFormations: ['4-3-3', '3-3-3-1', '5-3-2'],
  },
  LACROSSE: {
    maxStarters: 10,
    maxSubstitutes: 4,
    positions: ['G', 'D', 'M', 'A'],
    commonFormations: ['1-3-3-3'],
  },
  NETBALL: {
    maxStarters: 7,
    maxSubstitutes: 5,
    positions: ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'],
    commonFormations: ['Standard'],
  },
  AUSTRALIAN_RULES: {
    maxStarters: 18,
    maxSubstitutes: 4,
    positions: ['FB', 'HB', 'C', 'HF', 'FF', 'R', 'Interchange'],
    commonFormations: ['Standard'],
  },
  GAELIC_FOOTBALL: {
    maxStarters: 15,
    maxSubstitutes: 6,
    positions: ['GK', 'FB', 'HB', 'MF', 'HF', 'FF'],
    commonFormations: ['Standard XV'],
  },
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const LineupPlayerSchema = z.object({
  playerId: z.string().min(1),
  position: z.string().max(50).optional(),
  shirtNumber: z.number().int().min(1).max(99).optional(),
  isStarter: z.boolean(),
  isCaptain: z.boolean().default(false),
});

const SubmitLineupSchema = z.object({
  formation: z.string().max(20).optional(),
  players: z.array(LineupPlayerSchema).min(1),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `lineup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: string;
    code?: string;
    message?: string;
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
  if (options.message) response.message = options.message;

  return NextResponse.json(response, { status: options.status || 200 });
}

const EDIT_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

async function hasEditPermission(userId: string, clubId: string): Promise<boolean> {
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
      role: { in: EDIT_ROLES },
    },
  });

  return !!clubMember;
}

// =============================================================================
// GET HANDLER - Fetch Lineup
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

    // 3. Verify team belongs to club
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

    // 4. Fetch match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        homeFormation: true,
        awayFormation: true,
        status: true,
        kickOffTime: true,
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

    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Match not found for this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    const isHomeTeam = match.homeTeamId === teamId;
    const formation = isHomeTeam ? match.homeFormation : match.awayFormation;

    // 5. Fetch existing lineup for this team
    const existingLineup = await prisma.matchLineup.findMany({
      where: {
        matchId,
        teamId,
      },
      include: {
        player: {
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
        },
      },
    });

    // 6. Get all team players
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId,
        isActive: true,
        role: 'PLAYER',
      },
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
    const players = await prisma.player.findMany({
      where: { userId: { in: userIds } },
    });
    const playerMap = new Map(players.map((p) => [p.userId, p]));

    // 7. Get injured and suspended players
    const injuredPlayers = await prisma.injury.findMany({
      where: {
        playerId: { in: players.map((p) => p.id) },
        status: { in: ['ACTIVE', 'RECOVERING'] },
      },
      select: { playerId: true },
    });
    const injuredSet = new Set(injuredPlayers.map((i) => i.playerId));

    // Get suspended players (would need suspension tracking)
    const suspendedSet = new Set<string>(); // Placeholder

    // 8. Build lineup arrays
    const lineupPlayerIds = new Set(existingLineup.map((l) => l.playerId));
    const starters: LineupPlayer[] = [];
    const substitutes: LineupPlayer[] = [];
    const availablePlayers: LineupPlayer[] = [];
    const unavailablePlayers: { playerId: string; name: string; reason: string }[] = [];

    // Process existing lineup
    for (const entry of existingLineup) {
      const player: LineupPlayer = {
        id: entry.id,
        playerId: entry.playerId,
        userId: entry.player.userId,
        name: `${entry.player.user.firstName} ${entry.player.user.lastName}`,
        position: entry.position,
        shirtNumber: entry.shirtNumber,
        photo: entry.player.user.avatar,
        isStarter: entry.isStarter,
        isCaptain: entry.isCaptain,
        isAvailable: true,
      };

      if (entry.isStarter) {
        starters.push(player);
      } else {
        substitutes.push(player);
      }
    }

    // Process remaining players
    for (const member of teamMembers) {
      const player = playerMap.get(member.userId);
      if (!player) continue;
      if (lineupPlayerIds.has(player.id)) continue;

      const isInjured = injuredSet.has(player.id);
      const isSuspended = suspendedSet.has(player.id);

      if (isInjured || isSuspended) {
        unavailablePlayers.push({
          playerId: player.id,
          name: `${member.user.firstName} ${member.user.lastName}`,
          reason: isInjured ? 'INJURED' : 'SUSPENDED',
        });
      } else {
        availablePlayers.push({
          id: '',
          playerId: player.id,
          userId: member.userId,
          name: `${member.user.firstName} ${member.user.lastName}`,
          position: player.position,
          shirtNumber: player.shirtNumber,
          photo: member.user.avatar,
          isStarter: false,
          isCaptain: false,
          isAvailable: true,
        });
      }
    }

    // 9. Check edit permission
    const canEdit = await hasEditPermission(session.user.id, clubId);
    const matchEditable = !['COMPLETED', 'ABANDONED', 'CANCELLED'].includes(match.status);

    // 10. Get sport config
    const sportConfig = SPORT_LINEUP_CONFIG[club.sport];

    // 11. Build response
    const response: LineupResponse = {
      matchId,
      teamId,
      formation,
      isSubmitted: existingLineup.length > 0,
      starters,
      substitutes,
      availablePlayers,
      unavailablePlayers,
      sportContext: {
        sport: club.sport,
        ...sportConfig,
      },
      canEdit: canEdit && matchEditable,
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Lineup error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch lineup',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Submit/Update Lineup
// =============================================================================

export async function POST(
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

    // 2. Authorization
    const canEdit = await hasEditPermission(session.user.id, clubId);
    if (!canEdit) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to manage lineups',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify club
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

    // 4. Verify team and match
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

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        status: true,
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

    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Match not found for this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    if (['COMPLETED', 'ABANDONED', 'CANCELLED'].includes(match.status)) {
      return createResponse(null, {
        success: false,
        error: 'Cannot modify lineup for a completed match',
        code: 'MATCH_COMPLETED',
        requestId,
        status: 400,
      });
    }

    // 5. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
        requestId,
        status: 400,
      });
    }

    const validation = SubmitLineupSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { formation, players } = validation.data;
    const sportConfig = SPORT_LINEUP_CONFIG[club.sport];

    // 6. Validate starter count
    const starters = players.filter((p) => p.isStarter);
    const subs = players.filter((p) => !p.isStarter);

    if (starters.length > sportConfig.maxStarters) {
      return createResponse(null, {
        success: false,
        error: `Maximum ${sportConfig.maxStarters} starters allowed for ${club.sport}`,
        code: 'TOO_MANY_STARTERS',
        requestId,
        status: 400,
      });
    }

    if (subs.length > sportConfig.maxSubstitutes) {
      return createResponse(null, {
        success: false,
        error: `Maximum ${sportConfig.maxSubstitutes} substitutes allowed for ${club.sport}`,
        code: 'TOO_MANY_SUBS',
        requestId,
        status: 400,
      });
    }

    // 7. Validate exactly one captain
    const captains = players.filter((p) => p.isCaptain);
    if (captains.length > 1) {
      return createResponse(null, {
        success: false,
        error: 'Only one captain allowed',
        code: 'MULTIPLE_CAPTAINS',
        requestId,
        status: 400,
      });
    }

    // 8. Verify all players exist
    const playerIds = players.map((p) => p.playerId);
    const existingPlayers = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true },
    });

    if (existingPlayers.length !== playerIds.length) {
      return createResponse(null, {
        success: false,
        error: 'One or more players not found',
        code: 'PLAYER_NOT_FOUND',
        requestId,
        status: 400,
      });
    }

    // 9. Transaction: Delete existing lineup and create new one
    const isHomeTeam = match.homeTeamId === teamId;

    await prisma.$transaction(async (tx) => {
      // Delete existing lineup for this team
      await tx.matchLineup.deleteMany({
        where: { matchId, teamId },
      });

      // Create new lineup entries
      await tx.matchLineup.createMany({
        data: players.map((p) => ({
          matchId,
          teamId,
          playerId: p.playerId,
          position: p.position || null,
          shirtNumber: p.shirtNumber || null,
          isStarter: p.isStarter,
          isCaptain: p.isCaptain,
        })),
      });

      // Update match formation
      if (formation) {
        await tx.match.update({
          where: { id: matchId },
          data: isHomeTeam
            ? { homeFormation: formation }
            : { awayFormation: formation },
        });
      }
    });

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'MATCH_LINEUP',
        entityId: matchId,
        description: `Submitted lineup for match ${matchId} (${starters.length} starters, ${subs.length} subs)`,
        metadata: {
          teamId,
          matchId,
          formation,
          startersCount: starters.length,
          subsCount: subs.length,
        },
      },
    });

    return createResponse({
      matchId,
      teamId,
      formation,
      startersCount: starters.length,
      substitutesCount: subs.length,
      totalPlayers: players.length,
    }, {
      success: true,
      message: 'Lineup submitted successfully',
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Submit Lineup error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to submit lineup',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
