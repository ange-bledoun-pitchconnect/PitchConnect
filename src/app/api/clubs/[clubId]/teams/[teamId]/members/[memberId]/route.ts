// ============================================================================
// 👤 TEAM MEMBER MANAGEMENT API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET    /api/clubs/[clubId]/teams/[teamId]/members/[memberId] - Get member
// PATCH  /api/clubs/[clubId]/teams/[teamId]/members/[memberId] - Update member
// DELETE /api/clubs/[clubId]/teams/[teamId]/members/[memberId] - Remove member
// ============================================================================
// Schema: v7.7.0 | Uses: TeamPlayer model | RBAC: Full
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Position, Prisma } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const POSITIONS = [
  'GOALKEEPER', 'LEFT_BACK', 'CENTER_BACK', 'RIGHT_BACK', 'LEFT_WING_BACK', 'RIGHT_WING_BACK',
  'DEFENSIVE_MIDFIELDER', 'CENTRAL_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER',
  'ATTACKING_MIDFIELDER', 'LEFT_WINGER', 'RIGHT_WINGER', 'STRIKER', 'CENTER_FORWARD', 'SECOND_STRIKER',
  'GOALKEEPER_NETBALL', 'GOAL_ATTACK', 'WING_ATTACK', 'CENTER', 'WING_DEFENSE', 'GOAL_DEFENSE', 'GOAL_SHOOTER',
  'PROP', 'HOOKER', 'LOCK', 'FLANKER', 'NUMBER_8', 'SCRUM_HALF', 'FLY_HALF', 'INSIDE_CENTER', 'OUTSIDE_CENTER', 'FULLBACK',
  'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'POWER_FORWARD', 'CENTER_BASKETBALL',
  'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'FIELDER', 'WICKET_KEEPER',
  'UTILITY', 'SUBSTITUTE'
] as const;

const updateMemberSchema = z.object({
  position: z.enum(POSITIONS).optional().nullable(),
  jerseyNumber: z.number().min(1).max(99).optional().nullable(),
  isCaptain: z.boolean().optional(),
  isViceCaptain: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

function generateRequestId(): string {
  return `member-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// GET /api/clubs/[clubId]/teams/[teamId]/members/[memberId]
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string; memberId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId, teamId, memberId } = params;

    const teamPlayer = await prisma.teamPlayer.findUnique({
      where: { id: memberId },
      include: {
        team: {
          include: {
            club: { select: { id: true, isPublic: true, ownerId: true, managerId: true } },
          },
        },
        player: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, dateOfBirth: true } },
            aggregateStats: true,
          },
        },
      },
    });

    if (!teamPlayer || teamPlayer.teamId !== teamId || teamPlayer.team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team member not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Check privacy
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
      select: { role: true, isActive: true },
    });
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isSuperAdmin: true } });
    const isMember = membership?.isActive || 
                     session.user.id === teamPlayer.team.club.ownerId || 
                     session.user.id === teamPlayer.team.club.managerId ||
                     !!user?.isSuperAdmin;

    if (!teamPlayer.team.club.isPublic && !isMember) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied to private club' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: teamPlayer.id,
        playerId: teamPlayer.playerId,
        teamId: teamPlayer.teamId,
        position: teamPlayer.position,
        jerseyNumber: teamPlayer.jerseyNumber,
        isCaptain: teamPlayer.isCaptain,
        isViceCaptain: teamPlayer.isViceCaptain,
        isActive: teamPlayer.isActive,
        joinedAt: teamPlayer.joinedAt.toISOString(),
        leftAt: teamPlayer.leftAt?.toISOString(),
        joinedVia: teamPlayer.joinedVia,
        player: {
          id: teamPlayer.player.id,
          userId: teamPlayer.player.userId,
          name: `${teamPlayer.player.user.firstName} ${teamPlayer.player.user.lastName}`.trim(),
          email: teamPlayer.player.user.email,
          avatar: teamPlayer.player.user.avatar,
          dateOfBirth: teamPlayer.player.user.dateOfBirth?.toISOString(),
          primaryPosition: teamPlayer.player.primaryPosition,
          secondaryPosition: teamPlayer.player.secondaryPosition,
          isVerified: teamPlayer.player.isVerified,
          stats: teamPlayer.player.aggregateStats,
        },
        team: {
          id: teamPlayer.team.id,
          name: teamPlayer.team.name,
          ageGroup: teamPlayer.team.ageGroup,
        },
      },
      meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime },
    }, { status: 200, headers: { 'X-Request-ID': requestId } });

  } catch (error) {
    console.error('[MEMBER_GET_ERROR]', { requestId, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch team member' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// PATCH /api/clubs/[clubId]/teams/[teamId]/members/[memberId]
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string; memberId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId, teamId, memberId } = params;

    const teamPlayer = await prisma.teamPlayer.findUnique({
      where: { id: memberId },
      include: {
        team: {
          include: {
            club: { select: { id: true, ownerId: true, managerId: true } },
            players: { where: { isActive: true }, select: { id: true, jerseyNumber: true } },
          },
        },
        player: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!teamPlayer || teamPlayer.teamId !== teamId || teamPlayer.team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team member not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Authorization
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
      select: { role: true, isActive: true },
    });
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isSuperAdmin: true } });

    const isOwner = session.user.id === teamPlayer.team.club.ownerId;
    const isManager = session.user.id === teamPlayer.team.club.managerId;
    const hasStaffRole = membership?.isActive && ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'].includes(membership.role);
    const canEdit = isOwner || isManager || hasStaffRole || !!user?.isSuperAdmin;

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to edit team members' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validation = updateMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten() }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;

    // Validate jersey number uniqueness
    if (input.jerseyNumber !== undefined && input.jerseyNumber !== null) {
      const jerseyTaken = teamPlayer.team.players.some(
        p => p.jerseyNumber === input.jerseyNumber && p.id !== memberId
      );
      if (jerseyTaken) {
        return NextResponse.json(
          { success: false, error: { code: 'CONFLICT', message: `Jersey number ${input.jerseyNumber} is already taken` }, requestId },
          { status: 409, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    // Build update data
    const updateData: Prisma.TeamPlayerUpdateInput = {};
    if (input.position !== undefined) updateData.position = input.position as Position;
    if (input.jerseyNumber !== undefined) updateData.jerseyNumber = input.jerseyNumber;
    if (input.isCaptain !== undefined) updateData.isCaptain = input.isCaptain;
    if (input.isViceCaptain !== undefined) updateData.isViceCaptain = input.isViceCaptain;
    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive;
      if (!input.isActive) updateData.leftAt = new Date();
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If making this player captain, remove captain from others
      if (input.isCaptain === true) {
        await tx.teamPlayer.updateMany({
          where: { teamId, isCaptain: true, id: { not: memberId } },
          data: { isCaptain: false },
        });
      }
      // If making vice captain, remove from others
      if (input.isViceCaptain === true) {
        await tx.teamPlayer.updateMany({
          where: { teamId, isViceCaptain: true, id: { not: memberId } },
          data: { isViceCaptain: false },
        });
      }

      const result = await tx.teamPlayer.update({
        where: { id: memberId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'TEAM_UPDATED',
          resourceType: 'TeamPlayer',
          resourceId: memberId,
          beforeState: { position: teamPlayer.position, jerseyNumber: teamPlayer.jerseyNumber },
          afterState: updateData,
          changes: Object.keys(updateData),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });

      return result;
    });

    const playerName = `${teamPlayer.player.user.firstName} ${teamPlayer.player.user.lastName}`.trim();
    console.log('[TEAM_MEMBER_UPDATED]', { requestId, memberId, teamId, changes: Object.keys(updateData), updatedBy: session.user.id });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        position: updated.position,
        jerseyNumber: updated.jerseyNumber,
        isCaptain: updated.isCaptain,
        isViceCaptain: updated.isViceCaptain,
        isActive: updated.isActive,
      },
      message: `${playerName}'s details have been updated`,
      changedFields: Object.keys(updateData),
      meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime },
    }, { status: 200, headers: { 'X-Request-ID': requestId } });

  } catch (error) {
    console.error('[MEMBER_UPDATE_ERROR]', { requestId, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update team member' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// DELETE /api/clubs/[clubId]/teams/[teamId]/members/[memberId]
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string; memberId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId, teamId, memberId } = params;

    const teamPlayer = await prisma.teamPlayer.findUnique({
      where: { id: memberId },
      include: {
        team: {
          include: {
            club: { select: { id: true, name: true, ownerId: true, managerId: true } },
          },
        },
        player: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!teamPlayer || teamPlayer.teamId !== teamId || teamPlayer.team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team member not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Authorization
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
      select: { role: true, isActive: true },
    });
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isSuperAdmin: true } });

    const isOwner = session.user.id === teamPlayer.team.club.ownerId;
    const isManager = session.user.id === teamPlayer.team.club.managerId;
    const hasStaffRole = membership?.isActive && ['OWNER', 'MANAGER', 'HEAD_COACH'].includes(membership.role);
    const isSelf = teamPlayer.player.userId === session.user.id;
    const canRemove = isOwner || isManager || hasStaffRole || isSelf || !!user?.isSuperAdmin;

    if (!canRemove) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to remove team members' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    const playerName = `${teamPlayer.player.user.firstName} ${teamPlayer.player.user.lastName}`.trim();

    await prisma.$transaction(async (tx) => {
      // Soft delete - mark as inactive
      await tx.teamPlayer.update({
        where: { id: memberId },
        data: { isActive: false, leftAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'TEAM_UPDATED',
          resourceType: 'TeamPlayer',
          resourceId: memberId,
          afterState: { action: 'MEMBER_REMOVED', playerId: teamPlayer.playerId, playerName },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });

      // Notify the removed player (unless they removed themselves)
      if (!isSelf) {
        await tx.notification.create({
          data: {
            userId: teamPlayer.player.userId,
            title: 'Removed from Team',
            message: `You have been removed from ${teamPlayer.team.name}`,
            type: 'TEAM_MEMBER_REMOVED',
            link: `/dashboard/clubs/${clubId}`,
            metadata: { teamId, teamName: teamPlayer.team.name },
          },
        });
      }
    });

    console.log('[TEAM_MEMBER_REMOVED]', { requestId, memberId, teamId, playerId: teamPlayer.playerId, removedBy: session.user.id });

    return NextResponse.json({
      success: true,
      message: isSelf ? `You have left ${teamPlayer.team.name}` : `${playerName} has been removed from ${teamPlayer.team.name}`,
      meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime },
    }, { status: 200, headers: { 'X-Request-ID': requestId } });

  } catch (error) {
    console.error('[MEMBER_REMOVE_ERROR]', { requestId, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove team member' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
