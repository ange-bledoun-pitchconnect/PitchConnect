// ============================================================================
// 🤝 JOIN REQUEST ACTIONS - PitchConnect v7.3.0
// ============================================================================
// Server actions for team join request workflow
// ============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import type {
  JoinRequestWithRelations,
  JoinRequestListItem,
  CreateJoinRequestInput,
  ReviewJoinRequestInput,
  JoinRequestFilters,
  PaginationOptions,
  PaginatedJoinRequestResponse,
  JoinRequestStats,
  ApiResponse,
  CreateJoinRequestResponse,
  ReviewJoinRequestResponse,
} from '@/types/join-request.types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user can manage join requests for a team
 */
async function canManageJoinRequests(
  userId: string,
  teamId: string
): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { clubId: true },
  });

  if (!team) return false;

  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId: team.clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
    },
  });

  return !!membership;
}

/**
 * Check if user is the player making the request
 */
async function isRequestOwner(
  userId: string,
  requestId: string
): Promise<boolean> {
  const request = await prisma.teamJoinRequest.findUnique({
    where: { id: requestId },
    select: {
      player: {
        select: { userId: true },
      },
    },
  });

  return request?.player.userId === userId;
}

// ============================================================================
// CREATE JOIN REQUEST
// ============================================================================

export async function createJoinRequest(
  input: CreateJoinRequestInput
): Promise<ApiResponse<CreateJoinRequestResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Get player profile
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!player) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Player profile not found. Please complete your profile first.' } };
    }

    // Verify player ID matches
    if (input.playerId !== player.id) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Cannot create request for another player' } };
    }

    // Check team exists
    const team = await prisma.team.findUnique({
      where: { id: input.teamId },
      select: {
        id: true,
        name: true,
        clubId: true,
        club: {
          select: { name: true, sport: true },
        },
      },
    });

    if (!team) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } };
    }

    // Check if already a member
    const existingMembership = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: {
          teamId: input.teamId,
          playerId: player.id,
        },
      },
    });

    if (existingMembership) {
      return { success: false, error: { code: 'CONFLICT', message: 'You are already a member of this team' } };
    }

    // Check for existing pending request
    const existingRequest = await prisma.teamJoinRequest.findFirst({
      where: {
        teamId: input.teamId,
        playerId: player.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return { success: false, error: { code: 'CONFLICT', message: 'You already have a pending request for this team' } };
    }

    // Create the join request
    const joinRequest = await prisma.teamJoinRequest.create({
      data: {
        teamId: input.teamId,
        playerId: player.id,
        message: input.message,
        position: input.position,
        experience: input.experience,
        availability: input.availability,
        references: input.references,
        metadata: input.metadata as Prisma.JsonValue,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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
                phone: true,
              },
            },
          },
        },
        team: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                sport: true,
              },
            },
          },
        },
      },
    });

    // TODO: Send notification to team managers

    // Revalidate paths
    revalidatePath(`/dashboard/teams/${input.teamId}/join-requests`);

    return {
      success: true,
      data: {
        request: joinRequest as unknown as JoinRequestWithRelations,
        notificationSent: true,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error creating join request:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create join request' },
    };
  }
}

// ============================================================================
// GET JOIN REQUESTS
// ============================================================================

export async function getJoinRequests(
  filters: JoinRequestFilters,
  pagination?: PaginationOptions
): Promise<ApiResponse<PaginatedJoinRequestResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination || {};
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TeamJoinRequestWhereInput = {};

    if (filters.teamId) {
      // Check permission
      const canManage = await canManageJoinRequests(session.user.id, filters.teamId);
      if (!canManage) {
        return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to view join requests' } };
      }
      where.teamId = filters.teamId;
    }

    if (filters.clubId) {
      where.team = { clubId: filters.clubId };
    }

    if (filters.playerId) {
      where.playerId = filters.playerId;
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.search) {
      where.OR = [
        { message: { contains: filters.search, mode: 'insensitive' } },
        { player: { user: { firstName: { contains: filters.search, mode: 'insensitive' } } } },
        { player: { user: { lastName: { contains: filters.search, mode: 'insensitive' } } } },
        { player: { user: { email: { contains: filters.search, mode: 'insensitive' } } } },
      ];
    }

    // Get total count
    const total = await prisma.teamJoinRequest.count({ where });

    // Get requests
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
        experience: true,
        createdAt: true,
        player: {
          select: {
            id: true,
            primaryPosition: true,
            dateOfBirth: true,
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
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        data: requests as JoinRequestListItem[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + requests.length < total,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch join requests' },
    };
  }
}

// ============================================================================
// GET SINGLE JOIN REQUEST
// ============================================================================

export async function getJoinRequest(
  requestId: string
): Promise<ApiResponse<JoinRequestWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const request = await prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
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
                phone: true,
              },
            },
          },
        },
        team: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                sport: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!request) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Join request not found' } };
    }

    // Check permission
    const isOwner = await isRequestOwner(session.user.id, requestId);
    const canManage = await canManageJoinRequests(session.user.id, request.teamId);

    if (!isOwner && !canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to view this request' } };
    }

    return {
      success: true,
      data: request as unknown as JoinRequestWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error fetching join request:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch join request' },
    };
  }
}

// ============================================================================
// REVIEW JOIN REQUEST (Approve/Reject)
// ============================================================================

export async function reviewJoinRequest(
  input: ReviewJoinRequestInput
): Promise<ApiResponse<ReviewJoinRequestResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Get the request
    const existingRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: input.requestId },
      select: {
        id: true,
        teamId: true,
        playerId: true,
        status: true,
      },
    });

    if (!existingRequest) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Join request not found' } };
    }

    if (existingRequest.status !== 'PENDING') {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Request has already been reviewed' } };
    }

    // Check permission
    const canManage = await canManageJoinRequests(session.user.id, existingRequest.teamId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to review this request' } };
    }

    // Update the request
    const updatedRequest = await prisma.teamJoinRequest.update({
      where: { id: input.requestId },
      data: {
        status: input.status,
        reviewNotes: input.reviewNotes,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
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
                phone: true,
              },
            },
          },
        },
        team: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                sport: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    let teamPlayerCreated = false;

    // If approved, add player to team
    if (input.status === 'APPROVED') {
      await prisma.teamPlayer.create({
        data: {
          teamId: existingRequest.teamId,
          playerId: existingRequest.playerId,
          jerseyNumber: input.jerseyNumber,
          squadRole: input.role,
          isActive: true,
          joinedAt: new Date(),
        },
      });
      teamPlayerCreated = true;
    }

    // TODO: Send notification to player

    // Revalidate paths
    revalidatePath(`/dashboard/teams/${existingRequest.teamId}/join-requests`);
    revalidatePath(`/dashboard/teams/${existingRequest.teamId}/players`);

    return {
      success: true,
      data: {
        request: updatedRequest as unknown as JoinRequestWithRelations,
        teamPlayerCreated,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error reviewing join request:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to review join request' },
    };
  }
}

// ============================================================================
// WITHDRAW JOIN REQUEST
// ============================================================================

export async function withdrawJoinRequest(
  requestId: string,
  reason?: string
): Promise<ApiResponse<{ withdrawn: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Get the request
    const existingRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        teamId: true,
        status: true,
        player: {
          select: { userId: true },
        },
      },
    });

    if (!existingRequest) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Join request not found' } };
    }

    // Check ownership
    if (existingRequest.player.userId !== session.user.id) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Cannot withdraw another player\'s request' } };
    }

    if (existingRequest.status !== 'PENDING') {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Can only withdraw pending requests' } };
    }

    // Update status to withdrawn
    await prisma.teamJoinRequest.update({
      where: { id: requestId },
      data: {
        status: 'WITHDRAWN',
        reviewNotes: reason ? `Withdrawn: ${reason}` : 'Withdrawn by player',
        reviewedAt: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/teams/${existingRequest.teamId}/join-requests`);

    return {
      success: true,
      data: { withdrawn: true },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error withdrawing join request:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to withdraw request' },
    };
  }
}

// ============================================================================
// GET JOIN REQUEST STATS
// ============================================================================

export async function getJoinRequestStats(
  teamId: string
): Promise<ApiResponse<JoinRequestStats>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Check permission
    const canManage = await canManageJoinRequests(session.user.id, teamId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission' } };
    }

    // Get counts by status
    const statusCounts = await prisma.teamJoinRequest.groupBy({
      by: ['status'],
      where: { teamId },
      _count: { status: true },
    });

    const counts: Record<string, number> = {};
    let total = 0;
    for (const sc of statusCounts) {
      counts[sc.status] = sc._count.status;
      total += sc._count.status;
    }

    // Calculate average response time for reviewed requests
    const reviewedRequests = await prisma.teamJoinRequest.findMany({
      where: {
        teamId,
        status: { in: ['APPROVED', 'REJECTED'] },
        reviewedAt: { not: null },
      },
      select: {
        createdAt: true,
        reviewedAt: true,
      },
    });

    let avgResponseTime = 0;
    if (reviewedRequests.length > 0) {
      const totalTime = reviewedRequests.reduce((sum, r) => {
        if (r.reviewedAt) {
          return sum + (r.reviewedAt.getTime() - r.createdAt.getTime());
        }
        return sum;
      }, 0);
      avgResponseTime = totalTime / reviewedRequests.length / (1000 * 60 * 60); // Convert to hours
    }

    const approved = counts['APPROVED'] || 0;
    const rejected = counts['REJECTED'] || 0;
    const reviewed = approved + rejected;

    const stats: JoinRequestStats = {
      total,
      pending: counts['PENDING'] || 0,
      approved,
      rejected,
      withdrawn: counts['WITHDRAWN'] || 0,
      expired: counts['EXPIRED'] || 0,
      averageResponseTime: Math.round(avgResponseTime * 10) / 10,
      approvalRate: reviewed > 0 ? (approved / reviewed) * 100 : 0,
    };

    return {
      success: true,
      data: stats,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error getting join request stats:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get stats' },
    };
  }
}

// ============================================================================
// GET MY JOIN REQUESTS (for players)
// ============================================================================

export async function getMyJoinRequests(
  pagination?: PaginationOptions
): Promise<ApiResponse<PaginatedJoinRequestResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!player) {
      return {
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false },
        },
        meta: { timestamp: new Date().toISOString() },
      };
    }

    return getJoinRequests({ playerId: player.id }, pagination);
  } catch (error) {
    console.error('Error getting my join requests:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch join requests' },
    };
  }
}

// ============================================================================
// EXPIRE OLD REQUESTS (Cron Job)
// ============================================================================

export async function expireOldRequests(): Promise<ApiResponse<{ expired: number }>> {
  try {
    const result = await prisma.teamJoinRequest.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
        reviewNotes: 'Request expired automatically',
        reviewedAt: new Date(),
      },
    });

    return {
      success: true,
      data: { expired: result.count },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error expiring old requests:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to expire requests' },
    };
  }
}