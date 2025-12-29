// =============================================================================
// 🤝 TEAM JOIN REQUESTS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/clubs/[clubId]/teams/[teamId]/join-requests - List requests
// POST /api/clubs/[clubId]/teams/[teamId]/join-requests - Submit request
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const joinRequestSchema = z.object({
  message: z.string().max(1000).optional(),
  preferredPosition: z.string().optional(),
  preferredJerseyNumber: z.number().min(1).max(99).optional(),
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'WITHDRAWN']).optional(),
});

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reviewNotes: z.string().max(500).optional(),
  rejectionReason: z.string().max(500).optional(),
  position: z.string().optional(),
  jerseyNumber: z.number().min(1).max(99).optional(),
});

// =============================================================================
// GET HANDLER - List Join Requests
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to view join requests' },
        { status: 401 }
      );
    }

    const { clubId, teamId } = params;

    // 2. Verify team exists and user has access
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                isActive: true,
                role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
              },
            },
          },
        },
      },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json(
        { error: 'Not found', message: 'Team not found' },
        { status: 404 }
      );
    }

    const hasAccess = 
      team.club.managerId === session.user.id ||
      team.club.ownerId === session.user.id ||
      team.club.members.length > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to view join requests' },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
      status: searchParams.get('status'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, status } = queryResult.data;
    const skip = (page - 1) * limit;

    // 4. Build where clause
    const where: Prisma.TeamJoinRequestWhereInput = {
      teamId,
      ...(status ? { status } : {}),
    };

    // 5. Fetch requests
    const [requests, total] = await Promise.all([
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
    ]);

    // 6. Get status counts
    const statusCounts = await prisma.teamJoinRequest.groupBy({
      by: ['status'],
      where: { teamId },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: requests.map(req => ({
        id: req.id,
        status: req.status,
        message: req.message,
        preferredPosition: req.preferredPosition,
        preferredJerseyNumber: req.preferredJerseyNumber,
        reviewNotes: req.reviewNotes,
        rejectionReason: req.rejectionReason,
        reviewedAt: req.reviewedAt?.toISOString(),
        createdAt: req.createdAt.toISOString(),
        expiresAt: req.expiresAt?.toISOString(),
        player: {
          id: req.player.id,
          userId: req.player.userId,
          name: `${req.player.user.firstName} ${req.player.user.lastName}`,
          email: req.player.user.email,
          avatar: req.player.user.avatar,
          dateOfBirth: req.player.user.dateOfBirth?.toISOString(),
          primaryPosition: req.player.primaryPosition,
          secondaryPosition: req.player.secondaryPosition,
          preferredFoot: req.player.preferredFoot,
          height: req.player.height,
          weight: req.player.weight,
          isVerified: req.player.isVerified,
          stats: req.player.aggregateStats,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
    });

  } catch (error) {
    console.error('[JOIN_REQUESTS_LIST_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch join requests' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST HANDLER - Submit Join Request
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to request to join a team' },
        { status: 401 }
      );
    }

    const { clubId, teamId } = params;

    // 2. Verify team exists and is accepting requests
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            acceptingPlayers: true,
          },
        },
        players: {
          where: { isActive: true },
          select: { playerId: true, jerseyNumber: true },
        },
      },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json(
        { error: 'Not found', message: 'Team not found' },
        { status: 404 }
      );
    }

    if (!team.acceptingJoinRequests) {
      return NextResponse.json(
        { error: 'Bad request', message: 'This team is not currently accepting join requests' },
        { status: 400 }
      );
    }

    if (!team.club.acceptingPlayers) {
      return NextResponse.json(
        { error: 'Bad request', message: 'This club is not currently accepting new players' },
        { status: 400 }
      );
    }

    // 3. Get user's player profile
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            dateOfBirth: true,
          },
        },
        aggregateStats: true,
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Bad request', message: 'You need a player profile to request to join a team' },
        { status: 400 }
      );
    }

    // 4. Check if player is already on this team
    const existingMembership = team.players.find(p => p.playerId === player.id);
    if (existingMembership) {
      return NextResponse.json(
        { error: 'Conflict', message: 'You are already a member of this team' },
        { status: 409 }
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
        { error: 'Conflict', message: 'You already have a pending request to join this team' },
        { status: 409 }
      );
    }

    // 6. Parse and validate body
    const body = await request.json();
    const parseResult = joinRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 7. Validate jersey number if provided
    if (data.preferredJerseyNumber) {
      const jerseyTaken = team.players.some(p => p.jerseyNumber === data.preferredJerseyNumber);
      if (jerseyTaken) {
        return NextResponse.json(
          { error: 'Conflict', message: `Jersey number ${data.preferredJerseyNumber} is already taken` },
          { status: 409 }
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
    const joinRequest = await prisma.teamJoinRequest.create({
      data: {
        teamId,
        playerId: player.id,
        message: data.message,
        preferredPosition: data.preferredPosition as any,
        preferredJerseyNumber: data.preferredJerseyNumber,
        playerProfileSnapshot,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // 10. Notify team managers (fire and forget)
    const managers = await prisma.clubMember.findMany({
      where: {
        clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
      },
      select: { userId: true },
    });

    for (const manager of managers) {
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
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        id: joinRequest.id,
        status: joinRequest.status,
        createdAt: joinRequest.createdAt.toISOString(),
        expiresAt: joinRequest.expiresAt?.toISOString(),
      },
      message: `Your request to join ${team.name} has been submitted. You will be notified when it is reviewed.`,
    }, { status: 201 });

  } catch (error) {
    console.error('[JOIN_REQUEST_CREATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to submit join request' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH HANDLER - Review Join Request
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to review join requests' },
        { status: 401 }
      );
    }

    const { clubId, teamId } = params;

    // 2. Parse request body
    const body = await request.json();
    const { requestId, ...reviewData } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Request ID is required' },
        { status: 400 }
      );
    }

    const parseResult = reviewSchema.safeParse(reviewData);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { action, reviewNotes, rejectionReason, position, jerseyNumber } = parseResult.data;

    // 3. Verify team and permissions
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                isActive: true,
                role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
              },
            },
          },
        },
        players: {
          where: { isActive: true },
          select: { jerseyNumber: true },
        },
      },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json(
        { error: 'Not found', message: 'Team not found' },
        { status: 404 }
      );
    }

    const hasPermission = 
      team.club.managerId === session.user.id ||
      team.club.ownerId === session.user.id ||
      team.club.members.length > 0;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to review join requests' },
        { status: 403 }
      );
    }

    // 4. Get the join request
    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        player: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!joinRequest || joinRequest.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Not found', message: 'Join request not found' },
        { status: 404 }
      );
    }

    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Bad request', message: 'This request has already been reviewed' },
        { status: 400 }
      );
    }

    // 5. Process the action
    if (action === 'APPROVE') {
      // Validate jersey number if provided
      if (jerseyNumber && team.players.some(p => p.jerseyNumber === jerseyNumber)) {
        return NextResponse.json(
          { error: 'Conflict', message: `Jersey number ${jerseyNumber} is already taken` },
          { status: 409 }
        );
      }

      // Create team membership
      await prisma.$transaction([
        prisma.teamJoinRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            reviewNotes,
          },
        }),
        prisma.teamPlayer.create({
          data: {
            teamId,
            playerId: joinRequest.playerId,
            position: (position ?? joinRequest.preferredPosition) as any,
            jerseyNumber: jerseyNumber ?? joinRequest.preferredJerseyNumber,
            joinedVia: 'JOIN_REQUEST',
            joinRequestId: requestId,
          },
        }),
      ]);

      // Notify player
      await prisma.notification.create({
        data: {
          userId: joinRequest.player.userId,
          title: 'Join Request Approved! 🎉',
          message: `Your request to join ${team.name} has been approved. Welcome to the team!`,
          type: 'JOIN_REQUEST_APPROVED',
          link: `/dashboard/player/teams`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${joinRequest.player.user.firstName} ${joinRequest.player.user.lastName} has been added to ${team.name}`,
      });

    } else {
      // Reject
      await prisma.teamJoinRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          reviewNotes,
          rejectionReason,
        },
      });

      // Notify player
      await prisma.notification.create({
        data: {
          userId: joinRequest.player.userId,
          title: 'Join Request Update',
          message: `Your request to join ${team.name} was not approved at this time.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
          type: 'JOIN_REQUEST_REJECTED',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Join request has been rejected',
      });
    }

  } catch (error) {
    console.error('[JOIN_REQUEST_REVIEW_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to review join request' },
      { status: 500 }
    );
  }
}