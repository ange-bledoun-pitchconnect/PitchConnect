// ============================================================================
// ➕ ADD TEAM MEMBER API - PitchConnect Enterprise v2.0.0
// ============================================================================
// POST /api/clubs/[clubId]/teams/[teamId]/members/add - Add player to team
// ============================================================================
// Schema: v7.7.0 | Uses: TeamPlayer model | RBAC: Full
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Position } from '@prisma/client';

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

const addMemberSchema = z.object({
  playerId: z.string().cuid(),
  position: z.enum(POSITIONS).optional(),
  jerseyNumber: z.number().min(1).max(99).optional(),
  isCaptain: z.boolean().default(false),
  isViceCaptain: z.boolean().default(false),
});

const addMultipleMembersSchema = z.object({
  players: z.array(addMemberSchema).min(1).max(50),
});

function generateRequestId(): string {
  return `add-member-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
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

    const { clubId, teamId } = params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: { select: { id: true, name: true, ownerId: true, managerId: true } },
        players: { where: { isActive: true }, select: { playerId: true, jerseyNumber: true } },
      },
    });

    if (!team || team.deletedAt || team.clubId !== clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
      select: { role: true, isActive: true },
    });
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isSuperAdmin: true } });

    const isOwner = session.user.id === team.club.ownerId;
    const isManager = session.user.id === team.club.managerId;
    const hasStaffRole = membership?.isActive && ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'].includes(membership.role);
    const canAddMembers = isOwner || isManager || hasStaffRole || !!user?.isSuperAdmin;

    if (!canAddMembers) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to add team members' }, requestId },
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

    const isBulk = Array.isArray(body.players);
    const validation = isBulk ? addMultipleMembersSchema.safeParse(body) : addMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten() }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const playersToAdd = isBulk 
      ? (validation.data as { players: z.infer<typeof addMemberSchema>[] }).players
      : [validation.data as z.infer<typeof addMemberSchema>];

    const existingPlayerIds = new Set(team.players.map(p => p.playerId));
    const usedJerseyNumbers = new Set(team.players.map(p => p.jerseyNumber).filter(Boolean));
    const errors: string[] = [];
    const playerIds = playersToAdd.map(p => p.playerId);

    const uniquePlayerIds = new Set(playerIds);
    if (uniquePlayerIds.size !== playerIds.length) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Duplicate player IDs in request' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    const foundPlayerIds = new Set(players.map(p => p.id));

    for (const playerData of playersToAdd) {
      if (!foundPlayerIds.has(playerData.playerId)) {
        errors.push(`Player ${playerData.playerId} not found`);
      } else if (existingPlayerIds.has(playerData.playerId)) {
        const player = players.find(p => p.id === playerData.playerId);
        errors.push(`${player?.user.firstName} ${player?.user.lastName} is already a team member`);
      } else if (playerData.jerseyNumber && usedJerseyNumbers.has(playerData.jerseyNumber)) {
        errors.push(`Jersey number ${playerData.jerseyNumber} is already taken`);
      } else if (playerData.jerseyNumber) {
        usedJerseyNumbers.add(playerData.jerseyNumber);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdMembers = [];
      for (const playerData of playersToAdd) {
        const player = players.find(p => p.id === playerData.playerId)!;
        const teamPlayer = await tx.teamPlayer.create({
          data: {
            teamId,
            playerId: playerData.playerId,
            position: playerData.position as Position,
            jerseyNumber: playerData.jerseyNumber,
            isCaptain: playerData.isCaptain,
            isViceCaptain: playerData.isViceCaptain,
            isActive: true,
            joinedAt: new Date(),
            joinedVia: 'DIRECT_ADD',
          },
        });
        createdMembers.push({
          id: teamPlayer.id,
          playerId: teamPlayer.playerId,
          playerName: `${player.user.firstName} ${player.user.lastName}`.trim(),
          position: teamPlayer.position,
          jerseyNumber: teamPlayer.jerseyNumber,
          isCaptain: teamPlayer.isCaptain,
          isViceCaptain: teamPlayer.isViceCaptain,
        });
        await tx.notification.create({
          data: {
            userId: player.userId,
            title: 'Added to Team',
            message: `You have been added to ${team.name}`,
            type: 'TEAM_MEMBER_ADDED',
            link: `/dashboard/teams/${teamId}`,
            metadata: { teamId, teamName: team.name },
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'TEAM_UPDATED',
          resourceType: 'Team',
          resourceId: teamId,
          afterState: { action: 'MEMBERS_ADDED', count: createdMembers.length, playerIds: createdMembers.map(m => m.playerId) },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });
      return createdMembers;
    });

    console.log('[TEAM_MEMBERS_ADDED]', { requestId, teamId, count: result.length, addedBy: session.user.id });

    return NextResponse.json({
      success: true,
      data: { added: result, count: result.length },
      message: result.length === 1 ? `${result[0].playerName} has been added to ${team.name}` : `${result.length} players have been added to ${team.name}`,
      meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime },
    }, { status: 201, headers: { 'X-Request-ID': requestId } });

  } catch (error) {
    console.error('[ADD_TEAM_MEMBER_ERROR]', { requestId, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add team member(s)' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
