// =============================================================================
// 🏆 INDIVIDUAL TEAM API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/manager/clubs/[clubId]/teams/[teamId]
// PATCH  /api/manager/clubs/[clubId]/teams/[teamId]
// DELETE /api/manager/clubs/[clubId]/teams/[teamId]
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Model: Team with TeamPlayer relation
// Permission: Owner, Manager, Head Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, TeamStatus, Sport, Position } from '@prisma/client';

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
  };
}

interface PlayerInfo {
  id: string;
  playerId: string;
  name: string;
  avatar: string | null;
  position: Position | null;
  jerseyNumber: number | null;
  isActive: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  joinedAt: string;
}

interface CoachAssignmentInfo {
  id: string;
  coachId: string;
  coachName: string;
  assignmentType: string;
  isPrimary: boolean;
  startDate: string;
}

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  ageGroup: string | null;
  gender: string | null;
  status: TeamStatus;
  minPlayers: number | null;
  maxPlayers: number | null;
  defaultFormation: string | null;
  acceptingJoinRequests: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Club context
  clubId: string;
  clubName: string;
  clubSport: Sport;
  
  // Statistics
  playerCount: number;
  activePlayerCount: number;
  pendingJoinRequests: number;
  upcomingMatches: number;
  upcomingTraining: number;
  
  // Related data
  players: PlayerInfo[];
  coaches: CoachAssignmentInfo[];
  
  // Permissions
  canEdit: boolean;
  canDelete: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  logo: z.string().url().nullable().optional(),
  ageGroup: z.string().max(50).nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).nullable().optional(),
  status: z.nativeEnum(TeamStatus).optional(),
  minPlayers: z.number().int().min(1).max(50).nullable().optional(),
  maxPlayers: z.number().int().min(1).max(100).nullable().optional(),
  defaultFormation: z.string().nullable().optional(),
  acceptingJoinRequests: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const MANAGE_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

const VIEW_ROLES: ClubMemberRole[] = [
  ...MANAGE_ROLES,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
  ClubMemberRole.STAFF,
  ClubMemberRole.PLAYER,
];

async function getPermissions(
  userId: string,
  clubId: string
): Promise<{ canView: boolean; canEdit: boolean; canDelete: boolean; role: ClubMemberRole | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    return { canView: true, canEdit: true, canDelete: true, role: ClubMemberRole.OWNER };
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
    return { canView: false, canEdit: false, canDelete: false, role: null };
  }

  const canManage = MANAGE_ROLES.includes(clubMember.role);

  return {
    canView: VIEW_ROLES.includes(clubMember.role),
    canEdit: canManage,
    canDelete: canManage,
    role: clubMember.role,
  };
}

// =============================================================================
// GET HANDLER - Fetch Team Details
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
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canView) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view this team',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Fetch team with all related data
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            sport: true,
          },
        },
        players: {
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
            { isCaptain: 'desc' },
            { isViceCaptain: 'desc' },
            { joinedAt: 'asc' },
          ],
        },
        coachAssignments: {
          where: { isActive: true },
          include: {
            coach: {
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
          orderBy: { isPrimary: 'desc' },
        },
        joinRequests: {
          where: { status: 'PENDING' },
          select: { id: true },
        },
        _count: {
          select: {
            homeMatches: {
              where: {
                status: 'SCHEDULED',
                kickOffTime: { gte: new Date() },
              },
            },
            trainingSessions: {
              where: {
                status: 'SCHEDULED',
                startTime: { gte: new Date() },
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!team || team.clubId !== clubId || team.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Transform players
    const players: PlayerInfo[] = team.players.map((tp) => ({
      id: tp.id,
      playerId: tp.playerId,
      name: `${tp.player.user.firstName} ${tp.player.user.lastName}`,
      avatar: tp.player.user.avatar,
      position: tp.position,
      jerseyNumber: tp.jerseyNumber,
      isActive: tp.isActive,
      isCaptain: tp.isCaptain,
      isViceCaptain: tp.isViceCaptain,
      joinedAt: tp.joinedAt.toISOString(),
    }));

    // 5. Transform coach assignments
    const coaches: CoachAssignmentInfo[] = team.coachAssignments.map((ca) => ({
      id: ca.id,
      coachId: ca.coachId,
      coachName: `${ca.coach.user.firstName} ${ca.coach.user.lastName}`,
      assignmentType: ca.assignmentType,
      isPrimary: ca.isPrimary,
      startDate: ca.startDate.toISOString(),
    }));

    // 6. Build response
    const response: TeamDetail = {
      id: team.id,
      name: team.name,
      description: team.description,
      logo: team.logo,
      ageGroup: team.ageGroup,
      gender: team.gender,
      status: team.status,
      minPlayers: team.minPlayers,
      maxPlayers: team.maxPlayers,
      defaultFormation: team.defaultFormation,
      acceptingJoinRequests: team.acceptingJoinRequests,
      requiresApproval: team.requiresApproval,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      
      clubId: team.club.id,
      clubName: team.club.name,
      clubSport: team.club.sport,
      
      playerCount: team.players.length,
      activePlayerCount: team.players.filter((p) => p.isActive).length,
      pendingJoinRequests: team.joinRequests.length,
      upcomingMatches: team._count.homeMatches,
      upcomingTraining: team._count.trainingSessions,
      
      players,
      coaches,
      
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Team error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch team',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Team
// =============================================================================

export async function PATCH(
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
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canEdit) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to edit teams',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        clubId: true,
        name: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!existingTeam || existingTeam.clubId !== clubId || existingTeam.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
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

    const validation = UpdateTeamSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const updates = validation.data;

    // 5. Validate min/max players
    if (updates.minPlayers !== undefined && updates.maxPlayers !== undefined) {
      if (updates.minPlayers > updates.maxPlayers) {
        return createResponse(null, {
          success: false,
          error: 'Minimum players cannot exceed maximum players',
          code: 'INVALID_PLAYER_LIMITS',
          requestId,
          status: 400,
        });
      }
    }

    // 6. Check for duplicate name if changing
    if (updates.name && updates.name !== existingTeam.name) {
      const duplicateTeam = await prisma.team.findFirst({
        where: {
          clubId,
          name: updates.name,
          id: { not: teamId },
          deletedAt: null,
        },
      });

      if (duplicateTeam) {
        return createResponse(null, {
          success: false,
          error: `A team named "${updates.name}" already exists in this club`,
          code: 'DUPLICATE_TEAM_NAME',
          requestId,
          status: 409,
        });
      }
    }

    // 7. Build update data
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.logo !== undefined) updateData.logo = updates.logo;
    if (updates.ageGroup !== undefined) updateData.ageGroup = updates.ageGroup;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.minPlayers !== undefined) updateData.minPlayers = updates.minPlayers;
    if (updates.maxPlayers !== undefined) updateData.maxPlayers = updates.maxPlayers;
    if (updates.defaultFormation !== undefined) updateData.defaultFormation = updates.defaultFormation;
    if (updates.acceptingJoinRequests !== undefined) updateData.acceptingJoinRequests = updates.acceptingJoinRequests;
    if (updates.requiresApproval !== undefined) updateData.requiresApproval = updates.requiresApproval;

    // 8. Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
      include: {
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    // 9. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_UPDATED',
        resourceType: 'TEAM',
        resourceId: teamId,
        beforeState: {
          name: existingTeam.name,
          status: existingTeam.status,
        },
        afterState: updateData,
        changes: Object.keys(updates),
      },
    });

    return createResponse({
      id: updatedTeam.id,
      name: updatedTeam.name,
      status: updatedTeam.status,
      playerCount: updatedTeam._count.players,
      updated: true,
      changes: Object.keys(updates),
    }, {
      success: true,
      message: 'Team updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Update Team error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update team',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Delete Team
// =============================================================================

export async function DELETE(
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
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canDelete) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to delete teams',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Fetch team with counts
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        clubId: true,
        name: true,
        deletedAt: true,
        _count: {
          select: {
            players: { where: { isActive: true } },
            homeMatches: true,
            trainingSessions: true,
          },
        },
      },
    });

    if (!team || team.clubId !== clubId || team.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Check for active players
    if (team._count.players > 0) {
      return createResponse(null, {
        success: false,
        error: `Cannot delete team with ${team._count.players} active player(s). Remove all players first or set team to inactive.`,
        code: 'TEAM_HAS_PLAYERS',
        requestId,
        status: 400,
      });
    }

    // 5. Determine delete strategy
    const hasHistory = team._count.homeMatches > 0 || team._count.trainingSessions > 0;

    if (hasHistory) {
      // Soft delete - keep for historical records
      await prisma.team.update({
        where: { id: teamId },
        data: {
          deletedAt: new Date(),
          deletedBy: session.user.id,
          status: TeamStatus.ARCHIVED,
        },
      });
    } else {
      // Hard delete - no history
      await prisma.team.delete({
        where: { id: teamId },
      });
    }

    // 6. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_DELETED',
        resourceType: 'TEAM',
        resourceId: teamId,
        beforeState: {
          name: team.name,
        },
        afterState: {
          deletedAt: new Date(),
          softDelete: hasHistory,
        },
      },
    });

    return createResponse(null, {
      success: true,
      message: hasHistory
        ? 'Team archived successfully (has match/training history)'
        : 'Team deleted successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Delete Team error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete team',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}