// =============================================================================
// 🏃 TEAM ROSTER API - PitchConnect v7.9.0
// =============================================================================
// Enterprise-grade player roster management
// Multi-sport support | Position-based filtering | Schema-aligned
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, Position, Sport } from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface RouteParams {
  params: { teamId: string };
}

type PlayerStatus = 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'ON_LOAN' | 'INACTIVE' | 'PENDING';

interface RosterPlayer {
  id: string;
  playerId: string;
  jerseyNumber: number | null;
  position: Position | null;
  isActive: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  status: string;
  joinedAt: string;
  leftAt: string | null;
  notes: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatar: string | null;
    email: string;
    dateOfBirth: string | null;
    age: number | null;
    nationality: string | null;
    preferredFoot: string | null;
    height: number | null;
    weight: number | null;
    primaryPosition: Position | null;
    secondaryPositions: Position[];
    overallRating: number | null;
    marketValue: number | null;
    wages: number | null;
    contractEndDate: string | null;
    isInjured: boolean;
    injuryDetails: {
      type: string;
      expectedReturn: string | null;
    } | null;
  };
}

interface RosterListResponse {
  success: true;
  data: {
    roster: RosterPlayer[];
    summary: {
      total: number;
      active: number;
      injured: number;
      suspended: number;
      onLoan: number;
      byPosition: Record<string, number>;
      averageAge: number | null;
      averageRating: number | null;
      captains: {
        captain: RosterPlayer | null;
        viceCaptain: RosterPlayer | null;
      };
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    positions: Position[] | null;
    status: string | null;
    search: string | null;
  };
  team: {
    id: string;
    name: string;
    sport: Sport;
    maxPlayers: number;
    activePlayers: number;
    availableSlots: number;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface AddPlayerRequest {
  playerId: string;
  position?: Position;
  jerseyNumber?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  notes?: string;
}

interface AddPlayerResponse {
  success: true;
  data: RosterPlayer;
  message: string;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ListRosterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  positions: z
    .string()
    .transform((val) => val.split(',').filter(Boolean) as Position[])
    .optional(),
  status: z.enum(['ACTIVE', 'INJURED', 'SUSPENDED', 'ON_LOAN', 'INACTIVE', 'PENDING']).optional(),
  search: z.string().min(1).max(100).optional(),
  sortBy: z
    .enum(['jerseyNumber', 'position', 'joinedAt', 'lastName', 'overallRating'])
    .default('jerseyNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includeInactive: z.coerce.boolean().default(false),
});

const AddPlayerSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  position: z.nativeEnum(Position).optional(),
  jerseyNumber: z
    .number()
    .int()
    .min(1, 'Jersey number must be at least 1')
    .max(99, 'Jersey number must not exceed 99')
    .optional(),
  isCaptain: z.boolean().default(false),
  isViceCaptain: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
      meta: { timestamp: new Date().toISOString(), requestId },
    },
    { status, headers: { 'X-Request-ID': requestId } }
  );
}

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getPositionGroup(position: Position | null, sport: Sport): string {
  if (!position) return 'Unassigned';

  const positionGroups: Record<Sport, Record<string, Position[]>> = {
    FOOTBALL: {
      Goalkeepers: ['GOALKEEPER'],
      Defenders: ['RIGHT_BACK', 'LEFT_BACK', 'CENTER_BACK', 'SWEEPER'],
      Midfielders: [
        'DEFENSIVE_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'ATTACKING_MIDFIELDER',
        'RIGHT_MIDFIELDER', 'LEFT_MIDFIELDER',
      ],
      Wingers: ['RIGHT_WINGER', 'LEFT_WINGER'],
      Forwards: ['STRIKER', 'CENTER_FORWARD', 'SECOND_STRIKER'],
    },
    RUGBY: {
      Forwards: [
        'LOOSEHEAD_PROP', 'HOOKER', 'TIGHTHEAD_PROP', 'LOCK',
        'BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER', 'NUMBER_EIGHT',
      ],
      Backs: [
        'SCRUM_HALF', 'FLY_HALF', 'INSIDE_CENTER', 'OUTSIDE_CENTER',
        'LEFT_WING', 'RIGHT_WING', 'FULLBACK',
      ],
    },
    BASKETBALL: {
      Guards: ['POINT_GUARD', 'SHOOTING_GUARD'],
      Forwards: ['SMALL_FORWARD', 'POWER_FORWARD'],
      Centers: ['CENTER'],
    },
    NETBALL: {
      Shooters: ['GOAL_SHOOTER', 'GOAL_ATTACK'],
      Center: ['WING_ATTACK', 'CENTER', 'WING_DEFENSE'],
      Defenders: ['GOAL_DEFENSE', 'GOAL_KEEPER'],
    },
    CRICKET: {
      Batsmen: ['OPENING_BATSMAN', 'TOP_ORDER_BATSMAN', 'MIDDLE_ORDER_BATSMAN'],
      Bowlers: ['FAST_BOWLER', 'MEDIUM_PACER', 'SPIN_BOWLER'],
      Specialists: ['WICKET_KEEPER', 'ALL_ROUNDER', 'FIELDER'],
    },
    AMERICAN_FOOTBALL: {
      Offense: [
        'QUARTERBACK', 'RUNNING_BACK', 'FULLBACK', 'WIDE_RECEIVER',
        'TIGHT_END', 'OFFENSIVE_TACKLE', 'OFFENSIVE_GUARD', 'CENTER',
      ],
      Defense: [
        'DEFENSIVE_END', 'DEFENSIVE_TACKLE', 'LINEBACKER', 'CORNERBACK', 'SAFETY',
      ],
      'Special Teams': ['KICKER', 'PUNTER'],
    },
    HOCKEY: {
      Goalies: ['GOALKEEPER'],
      Defense: ['LEFT_DEFENSE', 'RIGHT_DEFENSE'],
      Forwards: ['LEFT_WING', 'CENTER', 'RIGHT_WING'],
    },
    LACROSSE: {
      Goalies: ['GOALKEEPER'],
      Defense: ['DEFENDER'],
      Midfield: ['MIDFIELDER'],
      Attack: ['ATTACKER'],
    },
    AUSTRALIAN_RULES: {
      Backs: ['FULL_BACK', 'BACK_POCKET', 'CENTER_HALF_BACK', 'HALF_BACK_FLANK'],
      Midfield: ['WING', 'CENTER', 'RUCKMAN', 'RUCK_ROVER', 'ROVER'],
      Forwards: ['HALF_FORWARD_FLANK', 'CENTER_HALF_FORWARD', 'FORWARD_POCKET', 'FULL_FORWARD'],
    },
    GAELIC_FOOTBALL: {
      Backs: ['GOALKEEPER', 'CORNER_BACK', 'FULL_BACK', 'HALF_BACK'],
      Midfield: ['MIDFIELDER'],
      Forwards: ['HALF_FORWARD', 'CORNER_FORWARD', 'FULL_FORWARD'],
    },
    FUTSAL: {
      Goalies: ['GOALKEEPER'],
      Outfield: ['DEFENDER', 'WINGER', 'PIVOT'],
    },
    BEACH_FOOTBALL: {
      Goalies: ['GOALKEEPER'],
      Outfield: ['DEFENDER', 'WINGER', 'PIVOT'],
    },
  };

  const groups = positionGroups[sport];
  if (!groups) return 'Other';

  for (const [groupName, positions] of Object.entries(groups)) {
    if (positions.includes(position)) {
      return groupName;
    }
  }

  return 'Other';
}

async function canManageRoster(userId: string, clubId: string): Promise<boolean> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
    },
  });
  return !!membership;
}

// =============================================================================
// GET /api/teams/[teamId]/roster
// List all players in team roster
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<RosterListResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { teamId } = params;

    // 2. Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sport: true,
        clubId: true,
        maxPlayers: true,
        activePlayers: true,
        club: {
          select: {
            id: true,
            name: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    if (!team) {
      return createErrorResponse('TEAM_NOT_FOUND', 'Team not found', requestId, 404);
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      positions: searchParams.get('positions') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'jerseyNumber',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      includeInactive: searchParams.get('includeInactive') || 'false',
    };

    const validatedParams = ListRosterSchema.parse(queryParams);
    const { page, limit, positions, status, search, sortBy, sortOrder, includeInactive } =
      validatedParams;
    const skip = (page - 1) * limit;

    // 4. Build where clause
    const where: Prisma.TeamPlayerWhereInput = { teamId };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (positions && positions.length > 0) {
      // Validate positions exist in Position enum
      const validPositions = positions.filter((p) =>
        Object.values(Position).includes(p)
      );
      if (validPositions.length > 0) {
        where.position = { in: validPositions };
      }
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.player = {
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    // 5. Get total count
    const total = await prisma.teamPlayer.count({ where });

    // 6. Build orderBy based on sortBy field
    let orderBy: Prisma.TeamPlayerOrderByWithRelationInput;
    switch (sortBy) {
      case 'lastName':
        orderBy = { player: { user: { lastName: sortOrder } } };
        break;
      case 'overallRating':
        orderBy = { player: { overallRating: sortOrder } };
        break;
      case 'position':
        orderBy = { position: sortOrder };
        break;
      case 'joinedAt':
        orderBy = { joinedAt: sortOrder };
        break;
      default:
        orderBy = { jerseyNumber: sortOrder };
    }

    // 7. Fetch roster with relations
    const rosterEntries = await prisma.teamPlayer.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        player: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
                dateOfBirth: true,
                nationality: true,
              },
            },
            injuries: {
              where: {
                recoveryDate: { gte: new Date() },
                status: { in: ['ACTIVE', 'RECOVERING'] },
              },
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                type: true,
                recoveryDate: true,
                status: true,
              },
            },
            contracts: {
              where: {
                status: 'ACTIVE',
                endDate: { gte: new Date() },
              },
              take: 1,
              orderBy: { endDate: 'desc' },
              select: {
                endDate: true,
                salary: true,
              },
            },
          },
        },
      },
    });

    // 8. Format roster data
    const formattedRoster: RosterPlayer[] = rosterEntries.map((entry) => {
      const activeInjury = entry.player.injuries[0];
      const activeContract = entry.player.contracts[0];

      return {
        id: entry.id,
        playerId: entry.playerId,
        jerseyNumber: entry.jerseyNumber,
        position: entry.position,
        isActive: entry.isActive,
        isCaptain: entry.isCaptain,
        isViceCaptain: entry.isViceCaptain,
        status: entry.status,
        joinedAt: entry.joinedAt.toISOString(),
        leftAt: entry.leftAt?.toISOString() || null,
        notes: entry.notes,
        player: {
          id: entry.player.id,
          firstName: entry.player.user.firstName,
          lastName: entry.player.user.lastName,
          fullName: `${entry.player.user.firstName} ${entry.player.user.lastName}`,
          avatar: entry.player.user.avatar,
          email: entry.player.user.email,
          dateOfBirth: entry.player.user.dateOfBirth?.toISOString() || null,
          age: calculateAge(entry.player.user.dateOfBirth),
          nationality: entry.player.user.nationality,
          preferredFoot: entry.player.preferredFoot,
          height: entry.player.height,
          weight: entry.player.weight,
          primaryPosition: entry.player.primaryPosition,
          secondaryPositions: entry.player.secondaryPositions,
          overallRating: entry.player.overallRating,
          marketValue: entry.player.marketValue,
          wages: activeContract?.salary || null,
          contractEndDate: activeContract?.endDate?.toISOString() || null,
          isInjured: !!activeInjury,
          injuryDetails: activeInjury
            ? {
                type: activeInjury.type,
                expectedReturn: activeInjury.recoveryDate?.toISOString() || null,
              }
            : null,
        },
      };
    });

    // 9. Calculate summary statistics
    const allActivePlayers = await prisma.teamPlayer.findMany({
      where: { teamId, isActive: true },
      include: {
        player: {
          select: {
            overallRating: true,
            user: { select: { dateOfBirth: true } },
          },
        },
      },
    });

    const statusCounts = {
      active: allActivePlayers.filter((p) => p.status === 'ACTIVE').length,
      injured: allActivePlayers.filter((p) => p.status === 'INJURED').length,
      suspended: allActivePlayers.filter((p) => p.status === 'SUSPENDED').length,
      onLoan: allActivePlayers.filter((p) => p.status === 'ON_LOAN').length,
    };

    // Count by position group
    const byPosition: Record<string, number> = {};
    allActivePlayers.forEach((p) => {
      const group = getPositionGroup(p.position, team.sport);
      byPosition[group] = (byPosition[group] || 0) + 1;
    });

    // Calculate average age
    const ages = allActivePlayers
      .map((p) => calculateAge(p.player.user.dateOfBirth))
      .filter((age): age is number => age !== null);
    const averageAge = ages.length > 0 ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 : null;

    // Calculate average rating
    const ratings = allActivePlayers
      .map((p) => p.player.overallRating)
      .filter((r): r is number => r !== null);
    const averageRating =
      ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

    // Find captain and vice-captain
    const captain = formattedRoster.find((p) => p.isCaptain) || null;
    const viceCaptain = formattedRoster.find((p) => p.isViceCaptain) || null;

    // 10. Build response
    const totalPages = Math.ceil(total / limit);

    const response: RosterListResponse = {
      success: true,
      data: {
        roster: formattedRoster,
        summary: {
          total: allActivePlayers.length,
          active: statusCounts.active,
          injured: statusCounts.injured,
          suspended: statusCounts.suspended,
          onLoan: statusCounts.onLoan,
          byPosition,
          averageAge,
          averageRating,
          captains: { captain, viceCaptain },
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        positions: positions || null,
        status: status || null,
        search: search || null,
      },
      team: {
        id: team.id,
        name: team.name,
        sport: team.sport,
        maxPlayers: team.maxPlayers,
        activePlayers: team.activePlayers,
        availableSlots: team.maxPlayers - team.activePlayers,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/teams/[teamId]/roster error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch roster', requestId, 500);
  }
}

// =============================================================================
// POST /api/teams/[teamId]/roster
// Add a player to the team roster
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AddPlayerResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { teamId } = params;

    // 2. Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        sport: true,
        clubId: true,
        maxPlayers: true,
        activePlayers: true,
      },
    });

    if (!team) {
      return createErrorResponse('TEAM_NOT_FOUND', 'Team not found or inactive', requestId, 404);
    }

    // 3. Authorization
    const hasPermission = await canManageRoster(session.user.id, team.clubId);
    if (!hasPermission) {
      return createErrorResponse(
        'FORBIDDEN',
        'You do not have permission to manage this team roster',
        requestId,
        403
      );
    }

    // 4. Check team capacity
    if (team.activePlayers >= team.maxPlayers) {
      return createErrorResponse(
        'TEAM_FULL',
        `Team has reached maximum capacity of ${team.maxPlayers} players`,
        requestId,
        409
      );
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const validatedData = AddPlayerSchema.parse(body);

    // 6. Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: validatedData.playerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            dateOfBirth: true,
            nationality: true,
          },
        },
      },
    });

    if (!player) {
      return createErrorResponse('PLAYER_NOT_FOUND', 'Player not found', requestId, 404);
    }

    // 7. Check if player is already on this team
    const existingEntry = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: { teamId, playerId: validatedData.playerId },
      },
    });

    if (existingEntry) {
      if (existingEntry.isActive) {
        return createErrorResponse('ALREADY_ON_ROSTER', 'Player is already on this team', requestId, 409);
      }
      // Reactivate if previously removed
      const reactivated = await prisma.teamPlayer.update({
        where: { id: existingEntry.id },
        data: {
          isActive: true,
          position: validatedData.position || existingEntry.position,
          jerseyNumber: validatedData.jerseyNumber || existingEntry.jerseyNumber,
          isCaptain: validatedData.isCaptain,
          isViceCaptain: validatedData.isViceCaptain,
          notes: validatedData.notes,
          status: 'ACTIVE',
          leftAt: null,
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
                  email: true,
                  dateOfBirth: true,
                  nationality: true,
                },
              },
            },
          },
        },
      });

      // Update team active player count
      await prisma.team.update({
        where: { id: teamId },
        data: { activePlayers: { increment: 1 } },
      });

      return NextResponse.json(
        {
          success: true,
          data: formatRosterPlayer(reactivated, team.sport),
          message: `${player.user.firstName} ${player.user.lastName} has been reactivated on the roster`,
          meta: { timestamp: new Date().toISOString(), requestId },
        },
        { status: 200, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 8. Validate jersey number availability
    if (validatedData.jerseyNumber) {
      const jerseyTaken = await prisma.teamPlayer.findFirst({
        where: {
          teamId,
          jerseyNumber: validatedData.jerseyNumber,
          isActive: true,
        },
      });

      if (jerseyTaken) {
        return createErrorResponse(
          'JERSEY_NUMBER_TAKEN',
          `Jersey number ${validatedData.jerseyNumber} is already assigned`,
          requestId,
          409
        );
      }
    }

    // 9. Handle captain/vice-captain assignment
    if (validatedData.isCaptain) {
      await prisma.teamPlayer.updateMany({
        where: { teamId, isCaptain: true },
        data: { isCaptain: false },
      });
    }

    if (validatedData.isViceCaptain) {
      await prisma.teamPlayer.updateMany({
        where: { teamId, isViceCaptain: true },
        data: { isViceCaptain: false },
      });
    }

    // 10. Create roster entry
    const rosterEntry = await prisma.$transaction(async (tx) => {
      const entry = await tx.teamPlayer.create({
        data: {
          teamId,
          playerId: validatedData.playerId,
          position: validatedData.position || null,
          jerseyNumber: validatedData.jerseyNumber || null,
          isCaptain: validatedData.isCaptain,
          isViceCaptain: validatedData.isViceCaptain,
          notes: validatedData.notes || null,
          isActive: true,
          status: 'ACTIVE',
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
                  email: true,
                  dateOfBirth: true,
                  nationality: true,
                },
              },
            },
          },
        },
      });

      // Update team active player count
      await tx.team.update({
        where: { id: teamId },
        data: { activePlayers: { increment: 1 } },
      });

      return entry;
    });

    // 11. Approve any pending join request
    await prisma.teamJoinRequest.updateMany({
      where: {
        teamId,
        playerId: validatedData.playerId,
        status: 'PENDING',
      },
      data: {
        status: 'APPROVED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: 'Automatically approved - player added to roster',
      },
    });

    // 12. Create notification for player
    await prisma.notification.create({
      data: {
        userId: player.user.id,
        type: 'TEAM_JOINED',
        title: 'Added to Team',
        message: `You have been added to ${team.name}${validatedData.jerseyNumber ? ` with jersey number ${validatedData.jerseyNumber}` : ''}`,
        data: {
          teamId: team.id,
          teamName: team.name,
          position: validatedData.position || null,
          jerseyNumber: validatedData.jerseyNumber || null,
        },
        link: `/teams/${team.id}`,
      },
    });

    // 13. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PLAYER_ADDED_TO_ROSTER',
        resourceType: 'TeamPlayer',
        resourceId: rosterEntry.id,
        details: {
          teamId: team.id,
          teamName: team.name,
          playerId: player.id,
          playerName: `${player.user.firstName} ${player.user.lastName}`,
          position: validatedData.position || null,
          jerseyNumber: validatedData.jerseyNumber || null,
          isCaptain: validatedData.isCaptain,
          isViceCaptain: validatedData.isViceCaptain,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 14. Build response
    const response: AddPlayerResponse = {
      success: true,
      data: formatRosterPlayer(rosterEntry, team.sport),
      message: `${player.user.firstName} ${player.user.lastName} has been added to ${team.name}`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(response, {
      status: 201,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/teams/[teamId]/roster error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to add player to roster', requestId, 500);
  }
}

// =============================================================================
// HELPER: Format roster player response
// =============================================================================

function formatRosterPlayer(entry: any, sport: Sport): RosterPlayer {
  return {
    id: entry.id,
    playerId: entry.playerId,
    jerseyNumber: entry.jerseyNumber,
    position: entry.position,
    isActive: entry.isActive,
    isCaptain: entry.isCaptain,
    isViceCaptain: entry.isViceCaptain,
    status: entry.status,
    joinedAt: entry.joinedAt.toISOString(),
    leftAt: entry.leftAt?.toISOString() || null,
    notes: entry.notes,
    player: {
      id: entry.player.id,
      firstName: entry.player.user.firstName,
      lastName: entry.player.user.lastName,
      fullName: `${entry.player.user.firstName} ${entry.player.user.lastName}`,
      avatar: entry.player.user.avatar,
      email: entry.player.user.email,
      dateOfBirth: entry.player.user.dateOfBirth?.toISOString() || null,
      age: calculateAge(entry.player.user.dateOfBirth),
      nationality: entry.player.user.nationality,
      preferredFoot: entry.player.preferredFoot || null,
      height: entry.player.height || null,
      weight: entry.player.weight || null,
      primaryPosition: entry.player.primaryPosition || null,
      secondaryPositions: entry.player.secondaryPositions || [],
      overallRating: entry.player.overallRating || null,
      marketValue: entry.player.marketValue || null,
      wages: null,
      contractEndDate: null,
      isInjured: false,
      injuryDetails: null,
    },
  };
}
