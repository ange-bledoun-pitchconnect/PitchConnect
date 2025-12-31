// =============================================================================
// 📝 JOIN REQUESTS API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/player/join-requests - List player's join requests
// POST   /api/player/join-requests - Create team join request
// DELETE /api/player/join-requests - Cancel join request (via ?id=xxx)
// =============================================================================
// Schema: v7.8.0 | Model: TeamJoinRequest | Multi-Sport: ✅
// Access: PLAYER, PLAYER_PRO, PARENT (for child)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Sport,
  Position,
  JoinRequestStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: PaginationMeta;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface JoinRequestItem {
  id: string;
  status: JoinRequestStatus;
  message: string | null;
  preferredPosition: Position | null;
  preferredJerseyNumber: number | null;
  
  team: {
    id: string;
    name: string;
    logo: string | null;
    ageGroup: string | null;
    gender: string | null;
  };
  
  club: {
    id: string;
    name: string;
    logo: string | null;
    sport: Sport;
    city: string | null;
    country: string | null;
  };
  
  // Response info (if reviewed)
  reviewedBy: {
    id: string;
    name: string;
  } | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  
  // Timestamps
  createdAt: string;
  expiresAt: string | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Request expiry in days
const REQUEST_EXPIRY_DAYS = 30;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ListRequestsFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.nativeEnum(JoinRequestStatus).optional(),
  forPlayerId: z.string().cuid().optional(), // Parent viewing child's requests
});

const CreateJoinRequestSchema = z.object({
  teamId: z.string().cuid('Invalid team ID'),
  message: z.string().max(500, 'Message must be under 500 characters').optional(),
  preferredPosition: z.nativeEnum(Position).optional(),
  preferredJerseyNumber: z.number().int().min(1).max(99).optional(),
  forPlayerId: z.string().cuid().optional(), // Parent submitting for child
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `joinreq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
    pagination?: PaginationMeta;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.error) {
    response.error = options.error;
  }

  if (options.pagination) {
    response.meta!.pagination = options.pagination;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

/**
 * Check if user has access to player (self or parent)
 */
async function checkPlayerAccess(
  userId: string,
  targetPlayerId?: string
): Promise<{ allowed: boolean; playerId: string | null; isParent: boolean }> {
  // If no target specified, get user's own player profile
  if (!targetPlayerId) {
    const player = await prisma.player.findUnique({
      where: { userId },
      select: { id: true },
    });
    return {
      allowed: !!player,
      playerId: player?.id || null,
      isParent: false,
    };
  }

  // Check if user owns this player profile
  const ownPlayer = await prisma.player.findFirst({
    where: { id: targetPlayerId, userId },
    select: { id: true },
  });

  if (ownPlayer) {
    return { allowed: true, playerId: ownPlayer.id, isParent: false };
  }

  // Check parent access
  const parentAccess = await prisma.parentPortalAccess.findFirst({
    where: {
      parent: { userId },
      playerId: targetPlayerId,
      isActive: true,
    },
  });

  if (parentAccess) {
    return { allowed: true, playerId: targetPlayerId, isParent: true };
  }

  // Check via PlayerFamily
  const familyLink = await prisma.playerFamily.findFirst({
    where: {
      playerId: targetPlayerId,
      parent: { userId },
    },
  });

  if (familyLink) {
    return { allowed: true, playerId: targetPlayerId, isParent: true };
  }

  return { allowed: false, playerId: null, isParent: false };
}

/**
 * Send notification to team managers about new join request
 */
async function notifyTeamManagers(
  teamId: string,
  clubId: string,
  playerName: string,
  requestId: string
): Promise<void> {
  try {
    // Get team managers and coaches
    const managers = await prisma.clubMember.findMany({
      where: {
        clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
      },
      select: { userId: true },
    });

    if (managers.length === 0) return;

    // Create notifications
    await prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.userId,
        type: NotificationType.JOIN_REQUEST_RECEIVED,
        title: 'New Join Request',
        message: `${playerName} has requested to join your team`,
        link: `/manager/teams/${teamId}/requests`,
        metadata: { requestId, teamId },
      })),
    });
  } catch (error) {
    console.error('Failed to send join request notifications:', error);
    // Don't throw - notifications are non-critical
  }
}

// =============================================================================
// GET HANDLER - List Join Requests
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = ListRequestsFiltersSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid parameters',
        },
        requestId,
        status: 400,
      });
    }

    const filters = validation.data;

    // 3. Check access
    const access = await checkPlayerAccess(userId, filters.forPlayerId);
    if (!access.allowed || !access.playerId) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: filters.forPlayerId 
            ? 'You do not have access to this player\'s join requests'
            : 'Player profile not found',
        },
        requestId,
        status: 403,
      });
    }

    // 4. Build where clause
    const where: Prisma.TeamJoinRequestWhereInput = {
      playerId: access.playerId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    // 5. Execute query
    const offset = (filters.page - 1) * filters.limit;

    const [requests, total] = await Promise.all([
      prisma.teamJoinRequest.findMany({
        where,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logo: true,
              ageGroup: true,
              gender: true,
              club: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  sport: true,
                  city: true,
                  country: true,
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
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: filters.limit,
      }),
      prisma.teamJoinRequest.count({ where }),
    ]);

    // 6. Transform response
    const transformedRequests: JoinRequestItem[] = requests.map((req) => ({
      id: req.id,
      status: req.status,
      message: req.message,
      preferredPosition: req.preferredPosition,
      preferredJerseyNumber: req.preferredJerseyNumber,
      
      team: {
        id: req.team.id,
        name: req.team.name,
        logo: req.team.logo,
        ageGroup: req.team.ageGroup,
        gender: req.team.gender,
      },
      
      club: {
        id: req.team.club.id,
        name: req.team.club.name,
        logo: req.team.club.logo,
        sport: req.team.club.sport,
        city: req.team.club.city,
        country: req.team.club.country,
      },
      
      reviewedBy: req.reviewedBy ? {
        id: req.reviewedBy.id,
        name: `${req.reviewedBy.firstName} ${req.reviewedBy.lastName}`,
      } : null,
      reviewedAt: req.reviewedAt?.toISOString() || null,
      rejectionReason: req.rejectionReason,
      
      createdAt: req.createdAt.toISOString(),
      expiresAt: req.expiresAt?.toISOString() || null,
    }));

    // 7. Get status counts for filters
    const statusCounts = await prisma.teamJoinRequest.groupBy({
      by: ['status'],
      where: { playerId: access.playerId },
      _count: true,
    });

    const counts = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<JoinRequestStatus, number>);

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Join requests listed`, {
      playerId: access.playerId,
      isParent: access.isParent,
      total,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(
      {
        requests: transformedRequests,
        statusCounts: counts,
      },
      {
        success: true,
        requestId,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasMore: offset + requests.length < total,
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] GET /api/player/join-requests error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch join requests',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Join Request
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid JSON in request body',
        },
        requestId,
        status: 400,
      });
    }

    const validation = CreateJoinRequestSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
          details: JSON.stringify(validation.error.errors),
        },
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 3. Check access
    const access = await checkPlayerAccess(userId, data.forPlayerId);
    if (!access.allowed || !access.playerId) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: data.forPlayerId
            ? 'You do not have access to submit requests for this player'
            : 'Player profile not found. Please complete your profile first.',
        },
        requestId,
        status: 403,
      });
    }

    // 4. Get player info for notifications
    const player = await prisma.player.findUnique({
      where: { id: access.playerId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        teamPlayers: {
          where: { isActive: true },
          select: { teamId: true },
        },
      },
    });

    if (!player) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player profile not found',
        },
        requestId,
        status: 404,
      });
    }

    // 5. Check if already a team member
    if (player.teamPlayers.some((tp) => tp.teamId === data.teamId)) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.CONFLICT,
          message: 'Already a member of this team',
        },
        requestId,
        status: 409,
      });
    }

    // 6. Check for existing pending request
    const existingRequest = await prisma.teamJoinRequest.findFirst({
      where: {
        playerId: access.playerId,
        teamId: data.teamId,
        status: JoinRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.CONFLICT,
          message: 'You already have a pending request for this team',
        },
        requestId,
        status: 409,
      });
    }

    // 7. Verify team exists and is accepting requests
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            sport: true,
          },
        },
        _count: {
          select: {
            players: { where: { isActive: true } },
          },
        },
      },
    });

    if (!team) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Team not found',
        },
        requestId,
        status: 404,
      });
    }

    if (!team.acceptingJoinRequests) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'This team is not currently accepting new players',
        },
        requestId,
        status: 400,
      });
    }

    // Check if team is full
    if (team.maxPlayers && team._count.players >= team.maxPlayers) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'This team has reached its maximum player capacity',
        },
        requestId,
        status: 400,
      });
    }

    // 8. Create join request
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REQUEST_EXPIRY_DAYS);

    const joinRequest = await prisma.teamJoinRequest.create({
      data: {
        playerId: access.playerId,
        teamId: data.teamId,
        clubId: team.clubId,
        message: data.message,
        preferredPosition: data.preferredPosition,
        preferredJerseyNumber: data.preferredJerseyNumber,
        status: JoinRequestStatus.PENDING,
        expiresAt,
        // Track who submitted (useful for parent submissions)
        submittedById: userId,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            logo: true,
            ageGroup: true,
            gender: true,
            club: {
              select: {
                id: true,
                name: true,
                logo: true,
                sport: true,
              },
            },
          },
        },
      },
    });

    // 9. Notify team managers
    const playerName = `${player.user.firstName} ${player.user.lastName}`;
    await notifyTeamManagers(
      data.teamId,
      team.clubId,
      playerName,
      joinRequest.id
    );

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'JOIN_REQUEST_CREATED',
        resourceType: 'TEAM_JOIN_REQUEST',
        resourceId: joinRequest.id,
        afterState: {
          playerId: access.playerId,
          teamId: data.teamId,
          isParentSubmission: access.isParent,
        },
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Join request created`, {
      requestId: joinRequest.id,
      playerId: access.playerId,
      teamId: data.teamId,
      isParent: access.isParent,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(
      {
        id: joinRequest.id,
        status: joinRequest.status,
        team: {
          id: joinRequest.team.id,
          name: joinRequest.team.name,
          club: joinRequest.team.club,
        },
        createdAt: joinRequest.createdAt.toISOString(),
        expiresAt: joinRequest.expiresAt?.toISOString(),
        message: 'Join request submitted successfully',
      },
      {
        success: true,
        requestId,
        status: 201,
      }
    );
  } catch (error) {
    console.error(`[${requestId}] POST /api/player/join-requests error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to create join request',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Cancel Join Request
// =============================================================================

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;

    // 2. Get request ID from query params
    const { searchParams } = new URL(request.url);
    const joinRequestId = searchParams.get('id');
    const forPlayerId = searchParams.get('forPlayerId');

    if (!joinRequestId) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Request ID is required (?id=xxx)',
        },
        requestId,
        status: 400,
      });
    }

    // 3. Find the join request
    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: joinRequestId },
      select: {
        id: true,
        playerId: true,
        status: true,
        team: {
          select: { name: true },
        },
      },
    });

    if (!joinRequest) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Join request not found',
        },
        requestId,
        status: 404,
      });
    }

    // 4. Check access
    const access = await checkPlayerAccess(userId, forPlayerId || undefined);
    if (!access.allowed || access.playerId !== joinRequest.playerId) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'You can only cancel your own join requests',
        },
        requestId,
        status: 403,
      });
    }

    // 5. Can only cancel pending requests
    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: `Cannot cancel a request with status: ${joinRequest.status}`,
        },
        requestId,
        status: 400,
      });
    }

    // 6. Update status to cancelled
    await prisma.teamJoinRequest.update({
      where: { id: joinRequestId },
      data: {
        status: JoinRequestStatus.CANCELLED,
        reviewedAt: new Date(),
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'JOIN_REQUEST_CANCELLED',
        resourceType: 'TEAM_JOIN_REQUEST',
        resourceId: joinRequestId,
        afterState: {
          playerId: joinRequest.playerId,
          cancelledBy: access.isParent ? 'PARENT' : 'PLAYER',
        },
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Join request cancelled`, {
      joinRequestId,
      playerId: joinRequest.playerId,
      isParent: access.isParent,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(
      {
        id: joinRequestId,
        cancelled: true,
        teamName: joinRequest.team.name,
        timestamp: new Date().toISOString(),
      },
      {
        success: true,
        requestId,
      }
    );
  } catch (error) {
    console.error(`[${requestId}] DELETE /api/player/join-requests error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to cancel join request',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';