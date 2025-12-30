// ============================================================================
// 🤝 TEAM JOIN REQUESTS API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET  /api/clubs/[clubId]/teams/[teamId]/join-requests - List join requests
// POST /api/clubs/[clubId]/teams/[teamId]/join-requests - Submit join request
// ============================================================================
// Schema: v7.7.0 | Uses: TeamJoinRequest, TeamPlayer models | RBAC: Full
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { JoinRequestStatus, Position, Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface JoinRequestListItem {
  id: string;
  status: JoinRequestStatus;
  message: string | null;
  preferredPosition: Position | null;
  preferredJerseyNumber: number | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  player: {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatar: string | null;
    dateOfBirth: string | null;
    primaryPosition: Position | null;
    secondaryPosition: Position | null;
    isVerified: boolean;
    stats: {
      totalMatches: number;
      totalGoals: number;
      totalAssists: number;
      avgRating: number | null;
    } | null;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const JOIN_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'WITHDRAWN'] as const;

const POSITIONS = [
  'GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'RIGHT_BACK', 'LEFT_WING_BACK', 'RIGHT_WING_BACK',
  'DEFENSIVE_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER',
  'ATTACKING_MIDFIELDER', 'LEFT_WINGER', 'RIGHT_WINGER', 'STRIKER', 'CENTER_FORWARD', 'SECOND_STRIKER',
  // Netball
  'GOALKEEPER_NETBALL', 'GOAL_ATTACK', 'WING_ATTACK', 'CENTER', 'WING_DEFENSE', 'GOAL_DEFENSE', 'GOAL_SHOOTER',
  // Rugby
  'PROP', 'HOOKER', 'LOCK', 'FLANKER', 'NUMBER_8', 'SCRUM_HALF', 'FLY_HALF', 'INSIDE_CENTER', 'OUTSIDE_CENTER', 'FULLBACK',
  // Basketball
  'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'POWER_FORWARD', 'CENTER_BASKETBALL',
  // Cricket
  'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'FIELDER', 'WICKET_KEEPER',
  // General
  'UTILITY', 'SUBSTITUTE'
] as const;

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(JOIN_REQUEST_STATUSES).optional(),
});

const createJoinRequestSchema = z.object({
  message: z.string().max(1000).optional(),
  preferredPosition: z.enum(POSITIONS).optional(),
  preferredJerseyNumber: z.number().min(1).max(99).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `join-req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// GET /api/clubs/[clubId]/teams/[teamId]/join-requests
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId, teamId } = params;

    // 2. Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          select: { id: true, ownerId: true, managerId: true },
        },
      },
    });

    if (!team || team.deletedAt || team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Authorization - only staff can view requests
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
      select: { role: true, isActive: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    const isOwner = session.user.id === team.club.ownerId;
    const isManager = session.user.id === team.club.managerId;
    const hasStaffRole = membership?.isActive && 
      ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'].includes(membership.role);
    const hasAccess = isOwner || isManager || hasStaffRole || !!user?.isSuperAdmin;

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to view join requests' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: queryResult.error.flatten() }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { page, limit, status } = queryResult.data;

    // 5. Build where clause
    const where: Prisma.TeamJoinRequestWhereInput = {
      teamId,
      ...(status ? { status } : {}),
    };

    // 6. Execute query
    const skip = (page - 1) * limit;

    const [requests, totalCount, statusCounts] = await Promise.all([
      prisma.teamJoinRequest.findMany({
        where,
        include: {
          player: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                  dateOfBirth: true,
                },
              },
              aggregateStats: {
                select: {
                  totalMatches: true,
                  totalGoals: true,
                  totalAssists: true,
                  avgRating: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.teamJoinRequest.count({ where }),
      prisma.teamJoinRequest.groupBy({
        by: ['status'],
        where: { teamId },
        _count: true,
      }),
    ]);

    // 7. Format response
    const formattedRequests: JoinRequestListItem[] = requests.map(req => ({
      id: req.id,
      status: req.status,
      message: req.message,
      preferredPosition: req.preferredPosition,
      preferredJerseyNumber: req.preferredJerseyNumber,
      reviewNotes: req.reviewNotes,
      rejectionReason: req.rejectionReason,
      reviewedAt: req.reviewedAt?.toISOString() ?? null,
      expiresAt: req.expiresAt?.toISOString() ?? null,
      createdAt: req.createdAt.toISOString(),
      player: {
        id: req.player.id,
        userId: req.player.userId,
        name: `${req.player.user.firstName} ${req.player.user.lastName}`.trim(),
        email: req.player.user.email,
        avatar: req.player.user.avatar,
        dateOfBirth: req.player.user.dateOfBirth?.toISOString() ?? null,
        primaryPosition: req.player.primaryPosition,
        secondaryPosition: req.player.secondaryPosition,
        isVerified: req.player.isVerified,
        stats: req.player.aggregateStats ? {
          totalMatches: req.player.aggregateStats.totalMatches,
          totalGoals: req.player.aggregateStats.totalGoals,
          totalAssists: req.player.aggregateStats.totalAssists,
          avgRating: req.player.aggregateStats.avgRating,
        } : null,
      },
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {} as Record<string, number>),
      team: {
        id: team.id,
        name: team.name,
        ageGroup: team.ageGroup,
        acceptingJoinRequests: team.acceptingJoinRequests,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });

  } catch (error) {
    console.error('[JOIN_REQUESTS_LIST_ERROR]', { requestId, error });
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch join requests' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// POST /api/clubs/[clubId]/teams/[teamId]/join-requests
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId, teamId } = params;

    // 2. Verify team exists and is accepting requests
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          select: { id: true, name: true, acceptingPlayers: true },
        },
        players: {
          where: { isActive: true },
          select: { playerId: true, jerseyNumber: true },
        },
      },
    });

    if (!team || team.deletedAt || team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (!team.acceptingJoinRequests) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'This team is not currently accepting join requests' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (!team.club.acceptingPlayers) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'This club is not currently accepting new players' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Get user's player profile
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, dateOfBirth: true },
        },
        aggregateStats: true,
      },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'You need a player profile to request to join a team' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Check if already a member
    const existingMembership = team.players.find(p => p.playerId === player.id);
    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'You are already a member of this team' }, requestId },
        { status: 409, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 5. Check for existing pending request
    const existingRequest = await prisma.teamJoinRequest.findFirst({
      where: {
        teamId,
        playerId: player.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'You already have a pending request to join this team' }, requestId },
        { status: 409, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 6. Parse and validate body
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine for join requests
    }

    const validation = createJoinRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten() }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;

    // 7. Validate jersey number if provided
    if (input.preferredJerseyNumber) {
      const jerseyTaken = team.players.some(p => p.jerseyNumber === input.preferredJerseyNumber);
      if (jerseyTaken) {
        return NextResponse.json(
          { success: false, error: { code: 'CONFLICT', message: `Jersey number ${input.preferredJerseyNumber} is already taken` }, requestId },
          { status: 409, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    // 8. Create player profile snapshot
    const playerProfileSnapshot = {
      name: `${player.user.firstName} ${player.user.lastName}`,
      email: player.user.email,
      dateOfBirth: player.user.dateOfBirth,
      primaryPosition: player.primaryPosition,
      secondaryPosition: player.secondaryPosition,
      preferredFoot: player.preferredFoot,
      height: player.height,
      weight: player.weight,
      nationality: player.nationality,
      isVerified: player.isVerified,
      stats: player.aggregateStats,
    };

    // 9. Create join request
    const joinRequest = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.teamJoinRequest.create({
        data: {
          teamId,
          playerId: player.id,
          message: input.message,
          preferredPosition: input.preferredPosition as Position,
          preferredJerseyNumber: input.preferredJerseyNumber,
          playerProfileSnapshot,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'JOIN_REQUEST_SUBMITTED',
          resourceType: 'TeamJoinRequest',
          resourceId: newRequest.id,
          afterState: {
            teamId,
            playerId: player.id,
            teamName: team.name,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });

      return newRequest;
    });

    // 10. Create notifications for team managers (fire and forget)
    const managers = await prisma.clubMember.findMany({
      where: {
        clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
      },
      select: { userId: true },
    });

    // Non-blocking notifications
    Promise.all(managers.map(manager =>
      prisma.notification.create({
        data: {
          userId: manager.userId,
          title: 'New Join Request',
          message: `${player.user.firstName} ${player.user.lastName} has requested to join ${team.name}`,
          type: 'JOIN_REQUEST',
          link: `/dashboard/clubs/${clubId}/teams/${teamId}/join-requests`,
          metadata: {
            teamId,
            requestId: joinRequest.id,
            playerName: `${player.user.firstName} ${player.user.lastName}`,
          },
        },
      }).catch(() => { /* Ignore notification errors */ })
    ));

    console.log('[JOIN_REQUEST_CREATED]', { 
      requestId, 
      joinRequestId: joinRequest.id, 
      teamId, 
      playerId: player.id,
      userId: session.user.id 
    });

    return NextResponse.json({
      success: true,
      data: {
        id: joinRequest.id,
        status: joinRequest.status,
        createdAt: joinRequest.createdAt.toISOString(),
        expiresAt: joinRequest.expiresAt?.toISOString(),
      },
      message: `Your request to join ${team.name} has been submitted. You will be notified when it is reviewed.`,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, {
      status: 201,
      headers: { 'X-Request-ID': requestId },
    });

  } catch (error) {
    console.error('[JOIN_REQUEST_CREATE_ERROR]', { requestId, error });
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit join request' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
