// =============================================================================
// 👥 TEAM PLAYERS API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/manager/clubs/[clubId]/teams/[teamId]/players - List players
// POST /api/manager/clubs/[clubId]/teams/[teamId]/players - Add player to team
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Model: Hybrid (TeamMember for membership, Player for stats)
// Permission: Club Owner, Manager, Head Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, TeamRole, Sport } from '@prisma/client';

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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RouteParams {
  params: {
    clubId: string;
    teamId: string;
  };
}

interface PlayerRecord {
  id: string; // TeamMember ID
  playerId: string; // Player ID for stats
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  position: string | null;
  shirtNumber: number | null;
  preferredFoot?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  height?: number | null;
  weight?: number | null;
  role: TeamRole;
  joinedAt: string;
  isActive: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  
  // Availability
  isAvailable: boolean;
  unavailableReason?: string;
  
  // Quick stats
  appearances: number;
  contributions: number; // Goals + assists or equivalent
}

interface PlayersResponse {
  team: {
    id: string;
    name: string;
    shortName: string | null;
  };
  players: PlayerRecord[];
  summary: {
    total: number;
    active: number;
    injured: number;
    suspended: number;
    byPosition: Record<string, number>;
  };
  sportContext: {
    sport: Sport;
    positions: string[];
  };
}

// =============================================================================
// SPORT-SPECIFIC POSITIONS
// =============================================================================

const SPORT_POSITIONS: Record<Sport, string[]> = {
  FOOTBALL: ['GK', 'RB', 'CB', 'LB', 'RWB', 'LWB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'],
  FUTSAL: ['GK', 'Fixo', 'Ala', 'Pivot'],
  BEACH_FOOTBALL: ['GK', 'DEF', 'MID', 'FWD'],
  RUGBY: ['Prop', 'Hooker', 'Lock', 'Flanker', 'Number 8', 'Scrum-half', 'Fly-half', 'Centre', 'Wing', 'Full-back'],
  CRICKET: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'],
  AMERICAN_FOOTBALL: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'],
  BASKETBALL: ['PG', 'SG', 'SF', 'PF', 'C'],
  HOCKEY: ['GK', 'DEF', 'MID', 'FWD'],
  LACROSSE: ['G', 'D', 'M', 'A'],
  NETBALL: ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'],
  AUSTRALIAN_RULES: ['FB', 'HB', 'C', 'HF', 'FF', 'R', 'Interchange'],
  GAELIC_FOOTBALL: ['GK', 'FB', 'HB', 'MF', 'HF', 'FF'],
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AddPlayerSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  position: z.string().max(50).optional(),
  shirtNumber: z.number().int().min(1).max(99).optional(),
  isCaptain: z.boolean().default(false),
  isViceCaptain: z.boolean().default(false),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: string;
    code?: string;
    requestId: string;
    status?: number;
    pagination?: ApiResponse<T>['pagination'];
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
  if (options.pagination) response.pagination = options.pagination;

  return NextResponse.json(response, { status: options.status || 200 });
}

const MANAGE_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

async function hasManagePermission(userId: string, clubId: string): Promise<boolean> {
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
      role: { in: MANAGE_ROLES },
    },
  });

  return !!clubMember;
}

// =============================================================================
// GET HANDLER - List Players
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
      select: { id: true, name: true, shortName: true, clubId: true },
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

    // 4. Parse query params
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const position = searchParams.get('position');

    // 5. Fetch team members with PLAYER role
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId,
        role: 'PLAYER',
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            dateOfBirth: true,
            nationality: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // 6. Get player profiles for these users
    const userIds = teamMembers.map((tm) => tm.userId);
    const players = await prisma.player.findMany({
      where: { userId: { in: userIds } },
    });
    const playerMap = new Map(players.map((p) => [p.userId, p]));

    // 7. Get injury status for all players
    const playerIds = players.map((p) => p.id);
    const injuries = await prisma.injury.findMany({
      where: {
        playerId: { in: playerIds },
        status: { in: ['ACTIVE', 'RECOVERING'] },
      },
      select: { playerId: true },
    });
    const injuredPlayerIds = new Set(injuries.map((i) => i.playerId));

    // 8. Get basic stats (appearances count)
    const lineupCounts = await prisma.matchLineup.groupBy({
      by: ['playerId'],
      where: {
        playerId: { in: playerIds },
        match: { status: 'COMPLETED' },
      },
      _count: { id: true },
    });
    const appearanceMap = new Map(lineupCounts.map((l) => [l.playerId, l._count.id]));

    // 9. Get contribution events (goals + assists)
    const contributionEvents = await prisma.matchEvent.groupBy({
      by: ['playerId'],
      where: {
        playerId: { in: playerIds },
        eventType: { in: ['GOAL', 'ASSIST', 'TRY', 'TOUCHDOWN', 'FIELD_GOAL', 'THREE_POINTER'] },
      },
      _count: { id: true },
    });
    const contributionMap = new Map(contributionEvents.map((e) => [e.playerId, e._count.id]));

    // 10. Build player records
    let playerRecords: PlayerRecord[] = teamMembers.map((tm) => {
      const player = playerMap.get(tm.userId);
      const isInjured = player ? injuredPlayerIds.has(player.id) : false;
      
      return {
        id: tm.id,
        playerId: player?.id || '',
        userId: tm.userId,
        name: `${tm.user.firstName} ${tm.user.lastName}`,
        firstName: tm.user.firstName,
        lastName: tm.user.lastName,
        email: tm.user.email,
        avatar: tm.user.avatar,
        position: player?.position || null,
        shirtNumber: player?.shirtNumber || null,
        preferredFoot: player?.preferredFoot || null,
        dateOfBirth: tm.user.dateOfBirth?.toISOString() || null,
        nationality: tm.user.nationality,
        height: player?.height || null,
        weight: player?.weight || null,
        role: tm.role,
        joinedAt: tm.createdAt.toISOString(),
        isActive: tm.isActive,
        isCaptain: tm.isCaptain || false,
        isViceCaptain: tm.isViceCaptain || false,
        isAvailable: !isInjured && tm.isActive,
        unavailableReason: isInjured ? 'INJURED' : undefined,
        appearances: player ? (appearanceMap.get(player.id) || 0) : 0,
        contributions: player ? (contributionMap.get(player.id) || 0) : 0,
      };
    });

    // Filter by position if requested
    if (position) {
      playerRecords = playerRecords.filter((p) => p.position === position);
    }

    // 11. Build summary
    const summary = {
      total: playerRecords.length,
      active: playerRecords.filter((p) => p.isActive).length,
      injured: playerRecords.filter((p) => p.unavailableReason === 'INJURED').length,
      suspended: playerRecords.filter((p) => p.unavailableReason === 'SUSPENDED').length,
      byPosition: {} as Record<string, number>,
    };

    for (const player of playerRecords) {
      if (player.position) {
        summary.byPosition[player.position] = (summary.byPosition[player.position] || 0) + 1;
      }
    }

    // 12. Build response
    const response: PlayersResponse = {
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
      },
      players: playerRecords,
      summary,
      sportContext: {
        sport: club.sport,
        positions: SPORT_POSITIONS[club.sport] || [],
      },
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] List Players error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch players',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Add Player to Team
// =============================================================================

export async function POST(
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
    const hasPermission = await hasManagePermission(session.user.id, clubId);
    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to manage players',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
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

    // 4. Parse and validate body
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

    const validation = AddPlayerSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { userId, position, shirtNumber, isCaptain, isViceCaptain } = validation.data;

    // 5. Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      return createResponse(null, {
        success: false,
        error: 'User not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 6. Check if user is a club member with PLAYER role
    const clubMember = await prisma.clubMember.findFirst({
      where: {
        userId,
        clubId,
        isActive: true,
        role: ClubMemberRole.PLAYER,
      },
    });

    if (!clubMember) {
      return createResponse(null, {
        success: false,
        error: 'User must be a player in this club to be added to team',
        code: 'NOT_PLAYER',
        requestId,
        status: 400,
      });
    }

    // 7. Check if already in team
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (existingMember) {
      if (!existingMember.isActive) {
        // Reactivate
        const reactivated = await prisma.teamMember.update({
          where: { id: existingMember.id },
          data: { isActive: true },
        });

        return createResponse({
          id: reactivated.id,
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          reactivated: true,
        }, {
          success: true,
          requestId,
        });
      }

      return createResponse(null, {
        success: false,
        error: 'Player is already a member of this team',
        code: 'ALREADY_MEMBER',
        requestId,
        status: 400,
      });
    }

    // 8. Check shirt number availability
    if (shirtNumber) {
      const existingShirt = await prisma.player.findFirst({
        where: {
          shirtNumber,
          user: {
            teamMembers: {
              some: {
                teamId,
                isActive: true,
              },
            },
          },
        },
      });

      if (existingShirt) {
        return createResponse(null, {
          success: false,
          error: `Shirt number ${shirtNumber} is already taken`,
          code: 'SHIRT_NUMBER_TAKEN',
          requestId,
          status: 400,
        });
      }
    }

    // 9. Handle captain/vice-captain changes
    if (isCaptain || isViceCaptain) {
      // Remove existing captain/vice-captain if setting new one
      if (isCaptain) {
        await prisma.teamMember.updateMany({
          where: { teamId, isCaptain: true },
          data: { isCaptain: false },
        });
      }
      if (isViceCaptain) {
        await prisma.teamMember.updateMany({
          where: { teamId, isViceCaptain: true },
          data: { isViceCaptain: false },
        });
      }
    }

    // 10. Create or get player profile
    let player = await prisma.player.findUnique({
      where: { userId },
    });

    if (!player) {
      player = await prisma.player.create({
        data: {
          userId,
          position: position || null,
          shirtNumber: shirtNumber || null,
        },
      });
    } else if (position || shirtNumber) {
      // Update player profile with new info
      player = await prisma.player.update({
        where: { id: player.id },
        data: {
          ...(position ? { position } : {}),
          ...(shirtNumber ? { shirtNumber } : {}),
        },
      });
    }

    // 11. Create team membership
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role: 'PLAYER',
        isActive: true,
        isCaptain: isCaptain || false,
        isViceCaptain: isViceCaptain || false,
      },
    });

    // 12. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'TEAM_MEMBER',
        entityId: teamMember.id,
        description: `Added player ${user.firstName} ${user.lastName} to team ${team.name}`,
        metadata: {
          playerUserId: userId,
          teamId,
          clubId,
          position,
          shirtNumber,
        },
      },
    });

    // 13. Return response
    return createResponse({
      id: teamMember.id,
      playerId: player.id,
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.avatar,
      position: player.position,
      shirtNumber: player.shirtNumber,
      role: teamMember.role,
      isCaptain: teamMember.isCaptain,
      isViceCaptain: teamMember.isViceCaptain,
      joinedAt: teamMember.createdAt.toISOString(),
    }, {
      success: true,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Add Player error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to add player to team',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
