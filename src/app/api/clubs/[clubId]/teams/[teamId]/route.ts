// ============================================================================
// 🏆 TEAM DETAILS API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET    /api/clubs/[clubId]/teams/[teamId] - Get team details
// PATCH  /api/clubs/[clubId]/teams/[teamId] - Update team
// DELETE /api/clubs/[clubId]/teams/[teamId] - Delete team
// ============================================================================
// Schema: v7.7.0 | Multi-Sport: All 12 Sports | RBAC: Full
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { TeamStatus, FormationType, Position, Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

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
  defaultFormation: FormationType | null;
  acceptingJoinRequests: boolean;
  requiresApproval: boolean;
  club: {
    id: string;
    name: string;
    sport: string;
    logo: string | null;
  };
  players: Array<{
    id: string;
    playerId: string;
    playerName: string;
    position: Position | null;
    jerseyNumber: number | null;
    isCaptain: boolean;
    isViceCaptain: boolean;
    isActive: boolean;
    joinedAt: string;
    avatar: string | null;
  }>;
  statistics: {
    playerCount: number;
    activePlayerCount: number;
    pendingJoinRequests: number;
    matchesPlayed: number;
    upcomingMatches: number;
  };
  userAccess: {
    isMember: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManagePlayers: boolean;
    canApproveRequests: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TEAM_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED', 'DISSOLVED'] as const;

const FORMATIONS = [
  'FOUR_FOUR_TWO', 'FOUR_THREE_THREE', 'THREE_FIVE_TWO', 'FIVE_THREE_TWO',
  'FIVE_FOUR_ONE', 'THREE_FOUR_THREE', 'FOUR_TWO_THREE_ONE', 'FOUR_ONE_FOUR_ONE',
  'THREE_THREE_FOUR', 'FIVE_TWO_THREE', 'TWO_THREE_FIVE', 'FOUR_ONE_TWO_THREE',
  'FOUR_FOUR_ONE_ONE', 'FOUR_THREE_TWO_ONE', 'FOUR_FIVE_ONE',
  'ONE_THREE_ONE', 'TWO_THREE', 'TWO_ONE_TWO', 'THREE_TWO', 'ONE_TWO_TWO',
  'I_FORMATION', 'SHOTGUN', 'PISTOL', 'SPREAD', 'SINGLE_BACK', 'PRO_SET', 'WILDCAT',
  'PODS', 'DIAMOND', 'FLAT_LINE', 'CUSTOM'
] as const;

const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  logo: z.string().url().optional().nullable().or(z.literal('')),
  ageGroup: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).optional().nullable(),
  status: z.enum(TEAM_STATUSES).optional(),
  minPlayers: z.number().min(1).max(100).optional().nullable(),
  maxPlayers: z.number().min(1).max(100).optional().nullable(),
  defaultFormation: z.enum(FORMATIONS).optional().nullable(),
  acceptingJoinRequests: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `team-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// GET /api/clubs/[clubId]/teams/[teamId]
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

    // 2. Fetch team with all relationships
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          select: { 
            id: true, 
            name: true, 
            sport: true, 
            logo: true,
            ownerId: true,
            managerId: true,
            isPublic: true,
          },
        },
        players: {
          where: { isActive: true },
          include: {
            player: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, avatar: true },
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
        _count: {
          select: {
            players: true,
            joinRequests: { where: { status: 'PENDING' } },
            homeMatches: { where: { status: 'FINISHED', deletedAt: null } },
            awayMatches: { where: { status: 'FINISHED', deletedAt: null } },
          },
        },
      },
    });

    if (!team || team.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Verify team belongs to the specified club
    if (team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found in this club' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Check user access
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
    const isMember = isOwner || isManager || hasStaffRole || user?.isSuperAdmin;

    // Check privacy
    if (!team.club.isPublic && !isMember) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'This team belongs to a private club' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Count upcoming matches
    const upcomingMatches = await prisma.match.count({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: 'SCHEDULED',
        kickOffTime: { gte: new Date() },
        deletedAt: null,
      },
    });

    // 5. Format response
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
      club: {
        id: team.club.id,
        name: team.club.name,
        sport: team.club.sport,
        logo: team.club.logo,
      },
      players: team.players.map(tp => ({
        id: tp.id,
        playerId: tp.playerId,
        playerName: `${tp.player.user.firstName} ${tp.player.user.lastName}`.trim(),
        position: tp.position,
        jerseyNumber: tp.jerseyNumber,
        isCaptain: tp.isCaptain,
        isViceCaptain: tp.isViceCaptain,
        isActive: tp.isActive,
        joinedAt: tp.joinedAt.toISOString(),
        avatar: tp.player.user.avatar,
      })),
      statistics: {
        playerCount: team._count.players,
        activePlayerCount: team.players.length,
        pendingJoinRequests: team._count.joinRequests,
        matchesPlayed: team._count.homeMatches + team._count.awayMatches,
        upcomingMatches,
      },
      userAccess: {
        isMember,
        canEdit: isOwner || isManager || hasStaffRole || !!user?.isSuperAdmin,
        canDelete: isOwner || isManager || !!user?.isSuperAdmin,
        canManagePlayers: isOwner || isManager || hasStaffRole || !!user?.isSuperAdmin,
        canApproveRequests: isOwner || isManager || hasStaffRole || !!user?.isSuperAdmin,
      },
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
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
    console.error('[TEAM_GET_ERROR]', { requestId, error });
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch team' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// PATCH /api/clubs/[clubId]/teams/[teamId]
// ============================================================================

export async function PATCH(
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

    // 2. Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        clubId: true,
        deletedAt: true,
        club: {
          select: { ownerId: true, managerId: true },
        },
      },
    });

    if (!team || team.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found in this club' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Authorization
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
      ['OWNER', 'MANAGER', 'HEAD_COACH'].includes(membership.role);
    const canEdit = isOwner || isManager || hasStaffRole || !!user?.isSuperAdmin;

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to edit this team' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validation = updateTeamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten() },
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;

    // 5. Check for duplicate name if changing
    if (input.name && input.name !== team.name) {
      const existingTeam = await prisma.team.findFirst({
        where: {
          clubId,
          name: { equals: input.name, mode: 'insensitive' },
          id: { not: teamId },
          deletedAt: null,
        },
      });

      if (existingTeam) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'CONFLICT', message: `A team named "${input.name}" already exists in this club` },
            requestId,
          },
          { status: 409, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    // 6. Validate min/max players
    if (input.minPlayers && input.maxPlayers && input.minPlayers > input.maxPlayers) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Minimum players cannot exceed maximum players' },
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 7. Build update data
    const updateData: Prisma.TeamUpdateInput = {};
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        (updateData as any)[key] = value === '' ? null : value;
      }
    });

    // 8. Update team
    const updatedTeam = await prisma.$transaction(async (tx) => {
      const updated = await tx.team.update({
        where: { id: teamId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'TEAM_UPDATED',
          resourceType: 'Team',
          resourceId: teamId,
          beforeState: { name: team.name },
          afterState: updateData,
          changes: Object.keys(updateData),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });

      return updated;
    });

    console.log('[TEAM_UPDATED]', { requestId, teamId, userId: session.user.id, changes: Object.keys(updateData) });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        status: updatedTeam.status,
        updatedAt: updatedTeam.updatedAt.toISOString(),
      },
      message: 'Team updated successfully',
      changedFields: Object.keys(updateData),
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
    console.error('[TEAM_UPDATE_ERROR]', { requestId, error });
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update team' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// DELETE /api/clubs/[clubId]/teams/[teamId]
// ============================================================================

export async function DELETE(
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

    // 2. Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        clubId: true,
        deletedAt: true,
        club: {
          select: { ownerId: true, managerId: true },
        },
        _count: {
          select: {
            players: { where: { isActive: true } },
          },
        },
      },
    });

    if (!team || team.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found in this club' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Authorization - only owner/manager/super admin
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
      select: { role: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    const isOwner = session.user.id === team.club.ownerId;
    const isManager = session.user.id === team.club.managerId;
    const canDelete = isOwner || isManager || membership?.role === 'OWNER' || !!user?.isSuperAdmin;

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only club owners and managers can delete teams' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Check for active players
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (!force && team._count.players > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRECONDITION_FAILED',
            message: 'Team has active players. Use ?force=true to delete anyway.',
            details: { activePlayers: team._count.players },
          },
          requestId,
        },
        { status: 412, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 5. Soft delete
    await prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id: teamId },
        data: {
          deletedAt: new Date(),
          deletedBy: session.user.id,
          status: 'DISSOLVED',
        },
      });

      // Deactivate all players
      await tx.teamPlayer.updateMany({
        where: { teamId, isActive: true },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      // Cancel pending join requests
      await tx.teamJoinRequest.updateMany({
        where: { teamId, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'TEAM_DELETED',
          resourceType: 'Team',
          resourceId: teamId,
          beforeState: { name: team.name, id: team.id },
          afterState: { deletedAt: new Date().toISOString() },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });
    });

    console.log('[TEAM_DELETED]', { requestId, teamId, teamName: team.name, userId: session.user.id });

    return NextResponse.json({
      success: true,
      message: `Team "${team.name}" has been deleted`,
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
    console.error('[TEAM_DELETE_ERROR]', { requestId, error });
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete team' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
