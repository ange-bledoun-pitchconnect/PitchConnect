// ============================================================================
// 🤝 JOIN REQUEST PROCESSING API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET   /api/clubs/[clubId]/teams/[teamId]/join-requests/[requestId] - Get request
// PATCH /api/clubs/[clubId]/teams/[teamId]/join-requests/[requestId] - Approve/Reject
// ============================================================================
// Schema: v7.7.0 | Uses: TeamJoinRequest, TeamPlayer models | RBAC: Full
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { JoinRequestStatus, Position } from '@prisma/client';

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

const processRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'CANCEL']),
  reviewNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
  position: z.enum(POSITIONS).optional(),
  jerseyNumber: z.number().min(1).max(99).optional(),
  isCaptain: z.boolean().optional(),
  isViceCaptain: z.boolean().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `join-proc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// GET /api/clubs/[clubId]/teams/[teamId]/join-requests/[requestId]
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string; requestId: string } }
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

    const { clubId, teamId, requestId: joinRequestId } = params;

    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: joinRequestId },
      include: {
        team: {
          include: {
            club: { select: { id: true, ownerId: true, managerId: true } },
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

    if (!joinRequest || joinRequest.teamId !== teamId || joinRequest.team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Join request not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    const isRequestOwner = joinRequest.player.userId === session.user.id;
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
      select: { role: true, isActive: true },
    });
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isSuperAdmin: true } });

    const isOwner = session.user.id === joinRequest.team.club.ownerId;
    const isManager = session.user.id === joinRequest.team.club.managerId;
    const hasStaffRole = membership?.isActive && ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'].includes(membership.role);
    const hasAccess = isRequestOwner || isOwner || isManager || hasStaffRole || !!user?.isSuperAdmin;

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this request' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: joinRequest.id,
        status: joinRequest.status,
        message: joinRequest.message,
        preferredPosition: joinRequest.preferredPosition,
        preferredJerseyNumber: joinRequest.preferredJerseyNumber,
        reviewNotes: hasStaffRole || isOwner || isManager ? joinRequest.reviewNotes : null,
        rejectionReason: joinRequest.rejectionReason,
        reviewedBy: joinRequest.reviewedBy,
        reviewedAt: joinRequest.reviewedAt?.toISOString(),
        expiresAt: joinRequest.expiresAt?.toISOString(),
        createdAt: joinRequest.createdAt.toISOString(),
        playerProfileSnapshot: joinRequest.playerProfileSnapshot,
        team: { id: joinRequest.team.id, name: joinRequest.team.name, ageGroup: joinRequest.team.ageGroup },
        player: {
          id: joinRequest.player.id,
          userId: joinRequest.player.userId,
          name: `${joinRequest.player.user.firstName} ${joinRequest.player.user.lastName}`.trim(),
          email: joinRequest.player.user.email,
          avatar: joinRequest.player.user.avatar,
          dateOfBirth: joinRequest.player.user.dateOfBirth?.toISOString(),
          primaryPosition: joinRequest.player.primaryPosition,
          secondaryPosition: joinRequest.player.secondaryPosition,
          isVerified: joinRequest.player.isVerified,
          stats: joinRequest.player.aggregateStats,
        },
        userAccess: { isRequestOwner, canProcess: isOwner || isManager || hasStaffRole || !!user?.isSuperAdmin },
      },
      meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime },
    }, { status: 200, headers: { 'X-Request-ID': requestId } });

  } catch (error) {
    console.error('[JOIN_REQUEST_GET_ERROR]', { requestId, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch join request' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// PATCH /api/clubs/[clubId]/teams/[teamId]/join-requests/[requestId]
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string; requestId: string } }
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

    const { clubId, teamId, requestId: joinRequestId } = params;

    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: joinRequestId },
      include: {
        team: {
          include: {
            club: { select: { id: true, name: true, ownerId: true, managerId: true } },
            players: { where: { isActive: true }, select: { playerId: true, jerseyNumber: true } },
          },
        },
        player: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });

    if (!joinRequest || joinRequest.teamId !== teamId || joinRequest.team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Join request not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: `This request has already been ${joinRequest.status.toLowerCase()}` }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validation = processRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten() }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;

    const isRequestOwner = joinRequest.player.userId === session.user.id;
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
      select: { role: true, isActive: true },
    });
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isSuperAdmin: true } });

    const isOwner = session.user.id === joinRequest.team.club.ownerId;
    const isManager = session.user.id === joinRequest.team.club.managerId;
    const hasStaffRole = membership?.isActive && ['OWNER', 'MANAGER', 'HEAD_COACH'].includes(membership.role);
    const canProcess = isOwner || isManager || hasStaffRole || !!user?.isSuperAdmin;

    if (input.action === 'CANCEL') {
      if (!isRequestOwner && !canProcess) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Only the applicant can cancel their request' }, requestId },
          { status: 403, headers: { 'X-Request-ID': requestId } }
        );
      }
    } else if (!canProcess) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to process join requests' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    const jerseyNumber = input.jerseyNumber ?? joinRequest.preferredJerseyNumber;
    if (input.action === 'APPROVE' && jerseyNumber) {
      const jerseyTaken = joinRequest.team.players.some(p => p.jerseyNumber === jerseyNumber);
      if (jerseyTaken) {
        return NextResponse.json(
          { success: false, error: { code: 'CONFLICT', message: `Jersey number ${jerseyNumber} is already taken` }, requestId },
          { status: 409, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let newStatus: JoinRequestStatus;
      let teamPlayer = null;

      if (input.action === 'APPROVE') {
        newStatus = 'APPROVED';
        teamPlayer = await tx.teamPlayer.create({
          data: {
            teamId,
            playerId: joinRequest.playerId,
            position: (input.position ?? joinRequest.preferredPosition) as Position,
            jerseyNumber,
            isCaptain: input.isCaptain ?? false,
            isViceCaptain: input.isViceCaptain ?? false,
            isActive: true,
            joinedAt: new Date(),
            joinedVia: 'JOIN_REQUEST',
            joinRequestId: joinRequest.id,
          },
        });
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'JOIN_REQUEST_APPROVED',
            resourceType: 'TeamJoinRequest',
            resourceId: joinRequest.id,
            afterState: { teamPlayerId: teamPlayer.id, teamId, playerId: joinRequest.playerId },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            requestId,
          },
        });
      } else if (input.action === 'REJECT') {
        newStatus = 'REJECTED';
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'JOIN_REQUEST_REJECTED',
            resourceType: 'TeamJoinRequest',
            resourceId: joinRequest.id,
            afterState: { teamId, playerId: joinRequest.playerId, reason: input.rejectionReason },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            requestId,
          },
        });
      } else {
        newStatus = 'CANCELLED';
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'JOIN_REQUEST_CANCELLED',
            resourceType: 'TeamJoinRequest',
            resourceId: joinRequest.id,
            afterState: { teamId, playerId: joinRequest.playerId, cancelledBy: isRequestOwner ? 'APPLICANT' : 'STAFF' },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            requestId,
          },
        });
      }

      const updatedRequest = await tx.teamJoinRequest.update({
        where: { id: joinRequest.id },
        data: {
          status: newStatus,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
          rejectionReason: input.action === 'REJECT' ? input.rejectionReason : null,
        },
      });

      return { request: updatedRequest, teamPlayer };
    });

    // Send notification (fire and forget)
    const notificationMessages = {
      APPROVE: `Your request to join ${joinRequest.team.name} has been approved! Welcome to the team.`,
      REJECT: `Your request to join ${joinRequest.team.name} has been declined. Reason: ${input.rejectionReason}`,
      CANCEL: `Your request to join ${joinRequest.team.name} has been cancelled.`,
    };

    prisma.notification.create({
      data: {
        userId: joinRequest.player.userId,
        title: input.action === 'APPROVE' ? 'Join Request Approved! 🎉' : input.action === 'REJECT' ? 'Join Request Declined' : 'Join Request Cancelled',
        message: notificationMessages[input.action],
        type: 'JOIN_REQUEST_UPDATE',
        link: input.action === 'APPROVE' ? `/dashboard/teams/${teamId}` : `/dashboard/clubs/${clubId}`,
        metadata: { teamId, requestId: joinRequest.id, action: input.action },
      },
    }).catch(() => {});

    console.log('[JOIN_REQUEST_PROCESSED]', { requestId, joinRequestId: joinRequest.id, action: input.action, teamId, playerId: joinRequest.playerId });

    return NextResponse.json({
      success: true,
      data: {
        id: result.request.id,
        status: result.request.status,
        action: input.action,
        reviewedAt: result.request.reviewedAt?.toISOString(),
        teamPlayer: result.teamPlayer ? { id: result.teamPlayer.id, position: result.teamPlayer.position, jerseyNumber: result.teamPlayer.jerseyNumber } : null,
      },
      message: input.action === 'APPROVE' 
        ? `${joinRequest.player.user.firstName} ${joinRequest.player.user.lastName} has been added to ${joinRequest.team.name}`
        : input.action === 'REJECT' ? 'Join request has been declined' : 'Join request has been cancelled',
      meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime },
    }, { status: 200, headers: { 'X-Request-ID': requestId } });

  } catch (error) {
    console.error('[JOIN_REQUEST_PROCESS_ERROR]', { requestId, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process join request' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
