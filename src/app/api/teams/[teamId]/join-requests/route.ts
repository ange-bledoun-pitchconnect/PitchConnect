// =============================================================================
// 🤝 TEAM JOIN REQUESTS API - PitchConnect v7.9.0
// =============================================================================
// Enterprise-grade team join request management
// Multi-sport support | Schema-aligned | Audit-ready
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, JoinRequestStatus, Position, Sport } from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface RouteParams {
  params: { teamId: string };
}

interface JoinRequestListItem {
  id: string;
  status: JoinRequestStatus;
  message: string | null;
  requestedPosition: Position | null;
  requestedJerseyNumber: number | null;
  createdAt: string;
  updatedAt: string;
  player: {
    id: string;
    primaryPosition: Position | null;
    secondaryPositions: Position[];
    dateOfBirth: string | null;
    nationality: string | null;
    overallRating: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      fullName: string;
      avatar: string | null;
      email: string;
    };
  };
  reviewedBy: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  } | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

interface JoinRequestsListResponse {
  success: true;
  data: JoinRequestListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    status: string | null;
    search: string | null;
  };
  team: {
    id: string;
    name: string;
    sport: Sport;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface CreateJoinRequestResponse {
  success: true;
  data: {
    id: string;
    teamId: string;
    teamName: string;
    status: JoinRequestStatus;
    message: string | null;
    requestedPosition: Position | null;
    requestedJerseyNumber: number | null;
    createdAt: string;
  };
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

const CreateJoinRequestSchema = z.object({
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must not exceed 1000 characters')
    .optional(),
  position: z.nativeEnum(Position).optional(),
  jerseyNumber: z
    .number()
    .int()
    .min(1, 'Jersey number must be at least 1')
    .max(99, 'Jersey number must not exceed 99')
    .optional(),
});

const ListJoinRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .string()
    .transform((val) => val.split(',').filter(Boolean))
    .optional(),
  search: z.string().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'status', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create standardized error response
 */
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

/**
 * Check if user has permission to manage join requests
 */
async function canManageJoinRequests(
  userId: string,
  clubId: string
): Promise<boolean> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: {
        in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'ADMIN'],
      },
    },
  });
  return !!membership;
}

/**
 * Get valid positions for a specific sport
 */
function getValidPositionsForSport(sport: Sport): Position[] {
  const positionsBySport: Record<Sport, Position[]> = {
    FOOTBALL: [
      'GOALKEEPER', 'RIGHT_BACK', 'LEFT_BACK', 'CENTER_BACK', 'SWEEPER',
      'DEFENSIVE_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'ATTACKING_MIDFIELDER',
      'RIGHT_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_WINGER', 'LEFT_WINGER',
      'STRIKER', 'CENTER_FORWARD', 'SECOND_STRIKER',
    ],
    RUGBY: [
      'LOOSEHEAD_PROP', 'HOOKER', 'TIGHTHEAD_PROP', 'LOCK', 'BLINDSIDE_FLANKER',
      'OPENSIDE_FLANKER', 'NUMBER_EIGHT', 'SCRUM_HALF', 'FLY_HALF',
      'INSIDE_CENTER', 'OUTSIDE_CENTER', 'LEFT_WING', 'RIGHT_WING', 'FULLBACK',
    ],
    BASKETBALL: [
      'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'POWER_FORWARD', 'CENTER',
    ],
    NETBALL: [
      'GOAL_SHOOTER', 'GOAL_ATTACK', 'WING_ATTACK', 'CENTER',
      'WING_DEFENSE', 'GOAL_DEFENSE', 'GOAL_KEEPER',
    ],
    CRICKET: [
      'OPENING_BATSMAN', 'TOP_ORDER_BATSMAN', 'MIDDLE_ORDER_BATSMAN',
      'WICKET_KEEPER', 'ALL_ROUNDER', 'FAST_BOWLER', 'MEDIUM_PACER',
      'SPIN_BOWLER', 'FIELDER',
    ],
    AMERICAN_FOOTBALL: [
      'QUARTERBACK', 'RUNNING_BACK', 'FULLBACK', 'WIDE_RECEIVER', 'TIGHT_END',
      'OFFENSIVE_TACKLE', 'OFFENSIVE_GUARD', 'CENTER', 'DEFENSIVE_END',
      'DEFENSIVE_TACKLE', 'LINEBACKER', 'CORNERBACK', 'SAFETY', 'KICKER', 'PUNTER',
    ],
    HOCKEY: [
      'GOALKEEPER', 'LEFT_DEFENSE', 'RIGHT_DEFENSE', 'LEFT_WING',
      'CENTER', 'RIGHT_WING',
    ],
    LACROSSE: [
      'GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER',
    ],
    AUSTRALIAN_RULES: [
      'FULL_BACK', 'BACK_POCKET', 'CENTER_HALF_BACK', 'HALF_BACK_FLANK',
      'WING', 'CENTER', 'HALF_FORWARD_FLANK', 'CENTER_HALF_FORWARD',
      'FORWARD_POCKET', 'FULL_FORWARD', 'RUCKMAN', 'RUCK_ROVER', 'ROVER',
    ],
    GAELIC_FOOTBALL: [
      'GOALKEEPER', 'CORNER_BACK', 'FULL_BACK', 'HALF_BACK',
      'MIDFIELDER', 'HALF_FORWARD', 'CORNER_FORWARD', 'FULL_FORWARD',
    ],
    FUTSAL: [
      'GOALKEEPER', 'DEFENDER', 'WINGER', 'PIVOT',
    ],
    BEACH_FOOTBALL: [
      'GOALKEEPER', 'DEFENDER', 'WINGER', 'PIVOT',
    ],
  };

  return positionsBySport[sport] || [];
}

// =============================================================================
// GET /api/teams/[teamId]/join-requests
// List all join requests for a team
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<JoinRequestsListResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        requestId,
        401
      );
    }

    const { teamId } = params;

    // 2. Validate team exists and get details
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sport: true,
        clubId: true,
        club: {
          select: {
            id: true,
            name: true,
            managerId: true,
            ownerId: true,
          },
        },
      },
    });

    if (!team) {
      return createErrorResponse(
        'TEAM_NOT_FOUND',
        'Team not found or has been deleted',
        requestId,
        404
      );
    }

    // 3. Authorization - must be club staff to view join requests
    const hasPermission = await canManageJoinRequests(
      session.user.id,
      team.clubId
    );

    if (!hasPermission) {
      return createErrorResponse(
        'FORBIDDEN',
        'You do not have permission to view join requests for this team',
        requestId,
        403
      );
    }

    // 4. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validatedParams = ListJoinRequestsSchema.parse(queryParams);
    const { page, limit, status, search, sortBy, sortOrder } = validatedParams;
    const skip = (page - 1) * limit;

    // 5. Build where clause
    const where: Prisma.TeamJoinRequestWhereInput = { teamId };

    if (status && status.length > 0) {
      const validStatuses = status.filter((s) =>
        Object.values(JoinRequestStatus).includes(s as JoinRequestStatus)
      ) as JoinRequestStatus[];
      
      if (validStatuses.length === 1) {
        where.status = validStatuses[0];
      } else if (validStatuses.length > 1) {
        where.status = { in: validStatuses };
      }
    }

    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        {
          player: {
            user: { firstName: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          player: {
            user: { lastName: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          player: {
            user: { email: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    // 6. Get total count
    const total = await prisma.teamJoinRequest.count({ where });

    // 7. Fetch join requests with relations
    const requests = await prisma.teamJoinRequest.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        message: true,
        position: true,
        jerseyNum: true,
        createdAt: true,
        updatedAt: true,
        reviewedAt: true,
        reviewNotes: true,
        player: {
          select: {
            id: true,
            primaryPosition: true,
            secondaryPositions: true,
            dateOfBirth: true,
            nationality: true,
            overallRating: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 8. Format response data
    const formattedRequests: JoinRequestListItem[] = requests.map((req) => ({
      id: req.id,
      status: req.status,
      message: req.message,
      requestedPosition: req.position,
      requestedJerseyNumber: req.jerseyNum,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      player: {
        id: req.player.id,
        primaryPosition: req.player.primaryPosition,
        secondaryPositions: req.player.secondaryPositions,
        dateOfBirth: req.player.dateOfBirth?.toISOString() || null,
        nationality: req.player.nationality,
        overallRating: req.player.overallRating,
        user: {
          id: req.player.user.id,
          firstName: req.player.user.firstName,
          lastName: req.player.user.lastName,
          fullName: `${req.player.user.firstName} ${req.player.user.lastName}`,
          avatar: req.player.user.avatar,
          email: req.player.user.email,
        },
      },
      reviewedBy: req.reviewedBy
        ? {
            id: req.reviewedBy.id,
            firstName: req.reviewedBy.firstName,
            lastName: req.reviewedBy.lastName,
            fullName: `${req.reviewedBy.firstName} ${req.reviewedBy.lastName}`,
          }
        : null,
      reviewedAt: req.reviewedAt?.toISOString() || null,
      reviewNotes: req.reviewNotes,
    }));

    // 9. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'JOIN_REQUESTS_VIEWED',
        resourceType: 'TeamJoinRequest',
        resourceId: teamId,
        details: {
          teamName: team.name,
          filtersApplied: { status: status || 'all', search: search || 'none' },
          resultsCount: formattedRequests.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 10. Build response
    const totalPages = Math.ceil(total / limit);

    const response: JoinRequestsListResponse = {
      success: true,
      data: formattedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        status: status?.join(',') || null,
        search: search || null,
      },
      team: {
        id: team.id,
        name: team.name,
        sport: team.sport,
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
    console.error(`[${requestId}] GET /api/teams/[teamId]/join-requests error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        requestId,
        400,
        { errors: error.flatten().fieldErrors }
      );
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch join requests',
      requestId,
      500
    );
  }
}

// =============================================================================
// POST /api/teams/[teamId]/join-requests
// Create a new join request to a team
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<CreateJoinRequestResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        requestId,
        401
      );
    }

    const { teamId } = params;

    // 2. Validate team exists and is accepting requests
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        sport: true,
        clubId: true,
        registrationOpen: true,
        inviteOnly: true,
        maxPlayers: true,
        activePlayers: true,
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!team) {
      return createErrorResponse(
        'TEAM_NOT_FOUND',
        'Team not found or is not active',
        requestId,
        404
      );
    }

    // 3. Check if team is accepting join requests
    if (team.inviteOnly) {
      return createErrorResponse(
        'INVITE_ONLY',
        'This team is invite-only and not accepting join requests',
        requestId,
        403
      );
    }

    if (!team.registrationOpen) {
      return createErrorResponse(
        'REGISTRATION_CLOSED',
        'This team is not currently accepting new members',
        requestId,
        403
      );
    }

    // 4. Check if team is at capacity
    if (team.activePlayers >= team.maxPlayers) {
      return createErrorResponse(
        'TEAM_FULL',
        `This team has reached its maximum capacity of ${team.maxPlayers} players`,
        requestId,
        409
      );
    }

    // 5. Get player profile for current user
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true, primaryPosition: true },
    });

    if (!player) {
      return createErrorResponse(
        'PLAYER_PROFILE_REQUIRED',
        'You must have a player profile to request to join a team. Please complete your player profile first.',
        requestId,
        400
      );
    }

    // 6. Check if already a team member
    const existingMembership = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: { teamId, playerId: player.id },
      },
    });

    if (existingMembership) {
      return createErrorResponse(
        'ALREADY_MEMBER',
        'You are already a member of this team',
        requestId,
        409
      );
    }

    // 7. Check for existing pending request
    const existingRequest = await prisma.teamJoinRequest.findFirst({
      where: {
        teamId,
        playerId: player.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return createErrorResponse(
        'REQUEST_EXISTS',
        'You already have a pending join request for this team',
        requestId,
        409
      );
    }

    // 8. Check for recent rejected request (cooldown period)
    const recentRejection = await prisma.teamJoinRequest.findFirst({
      where: {
        teamId,
        playerId: player.id,
        status: 'REJECTED',
        reviewedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
    });

    if (recentRejection) {
      return createErrorResponse(
        'COOLDOWN_PERIOD',
        'Your previous request was rejected. Please wait 30 days before submitting a new request.',
        requestId,
        429
      );
    }

    // 9. Parse and validate request body
    const body = await request.json();
    const validatedData = CreateJoinRequestSchema.parse(body);

    // 10. Validate position is valid for team's sport
    if (validatedData.position) {
      const validPositions = getValidPositionsForSport(team.sport);
      if (!validPositions.includes(validatedData.position)) {
        return createErrorResponse(
          'INVALID_POSITION',
          `Invalid position for ${team.sport}. Valid positions are: ${validPositions.join(', ')}`,
          requestId,
          400
        );
      }
    }

    // 11. Check if jersey number is available
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
          `Jersey number ${validatedData.jerseyNumber} is already taken`,
          requestId,
          409
        );
      }
    }

    // 12. Create join request
    const joinRequest = await prisma.teamJoinRequest.create({
      data: {
        teamId,
        playerId: player.id,
        status: 'PENDING',
        message: validatedData.message || null,
        position: validatedData.position || null,
        jerseyNum: validatedData.jerseyNumber || null,
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
        player: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // 13. Create notification for team managers
    const clubManagers = await prisma.clubMember.findMany({
      where: {
        clubId: team.clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
      },
      select: { userId: true },
    });

    if (clubManagers.length > 0) {
      await prisma.notification.createMany({
        data: clubManagers.map((manager) => ({
          userId: manager.userId,
          type: 'TEAM_JOIN_REQUEST',
          title: 'New Join Request',
          message: `${joinRequest.player.user.firstName} ${joinRequest.player.user.lastName} has requested to join ${team.name}`,
          data: {
            requestId: joinRequest.id,
            teamId: team.id,
            playerId: player.id,
            playerName: `${joinRequest.player.user.firstName} ${joinRequest.player.user.lastName}`,
          },
          link: `/teams/${team.id}/join-requests/${joinRequest.id}`,
        })),
      });
    }

    // 14. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'JOIN_REQUEST_CREATED',
        resourceType: 'TeamJoinRequest',
        resourceId: joinRequest.id,
        details: {
          teamId: team.id,
          teamName: team.name,
          playerId: player.id,
          requestedPosition: validatedData.position || null,
          requestedJerseyNumber: validatedData.jerseyNumber || null,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 15. Build response
    const response: CreateJoinRequestResponse = {
      success: true,
      data: {
        id: joinRequest.id,
        teamId: joinRequest.teamId,
        teamName: joinRequest.team.name,
        status: joinRequest.status,
        message: joinRequest.message,
        requestedPosition: joinRequest.position,
        requestedJerseyNumber: joinRequest.jerseyNum,
        createdAt: joinRequest.createdAt.toISOString(),
      },
      message: `Your request to join ${team.name} has been submitted successfully. You will be notified when it is reviewed.`,
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
    console.error(`[${requestId}] POST /api/teams/[teamId]/join-requests error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request data',
        requestId,
        400,
        { errors: error.flatten().fieldErrors }
      );
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to create join request',
      requestId,
      500
    );
  }
}
