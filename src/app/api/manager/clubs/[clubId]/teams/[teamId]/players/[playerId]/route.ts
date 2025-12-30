// =============================================================================
// 👤 INDIVIDUAL PLAYER API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId]
// PATCH  /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId]
// DELETE /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId]
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club Owner, Manager, Head Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, Sport } from '@prisma/client';

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
    playerId: string; // This is the TeamMember ID
  };
}

interface PlayerDetail {
  id: string;
  playerId: string;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  position: string | null;
  shirtNumber: number | null;
  preferredFoot?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  nationality?: string | null;
  height?: number | null;
  weight?: number | null;
  bio?: string | null;
  
  // Team role
  role: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  joinedAt: string;
  isActive: boolean;
  
  // Availability
  isAvailable: boolean;
  currentInjury?: {
    id: string;
    type: string;
    severity: string;
    expectedReturn?: string | null;
  };
  
  // Season stats
  seasonStats: {
    appearances: number;
    starts: number;
    minutesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
  
  // Recent matches (last 5)
  recentMatches: Array<{
    matchId: string;
    date: string;
    opponent: string;
    result: string;
    minutesPlayed: number;
    rating?: number | null;
  }>;
  
  // Permissions
  canEdit: boolean;
  canRemove: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdatePlayerSchema = z.object({
  position: z.string().max(50).optional(),
  shirtNumber: z.number().int().min(1).max(99).nullable().optional(),
  preferredFoot: z.enum(['LEFT', 'RIGHT', 'BOTH']).nullable().optional(),
  height: z.number().int().min(100).max(250).nullable().optional(),
  weight: z.number().int().min(30).max(200).nullable().optional(),
  isCaptain: z.boolean().optional(),
  isViceCaptain: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const MANAGE_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

async function getPermissions(
  userId: string,
  clubId: string
): Promise<{ canView: boolean; canEdit: boolean; canRemove: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  
  if (user?.isSuperAdmin) {
    return { canView: true, canEdit: true, canRemove: true };
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
    return { canView: false, canEdit: false, canRemove: false };
  }

  const hasManageRole = MANAGE_ROLES.includes(clubMember.role);

  return {
    canView: true,
    canEdit: hasManageRole,
    canRemove: hasManageRole,
  };
}

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

// =============================================================================
// GET HANDLER - Fetch Player Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, playerId } = params;

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

    // 2. Get permissions
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canView) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view this player',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Fetch team member (player)
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phone: true,
            dateOfBirth: true,
            nationality: true,
            bio: true,
          },
        },
      },
    });

    if (!teamMember || teamMember.teamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Player not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Get player profile
    const player = await prisma.player.findUnique({
      where: { userId: teamMember.userId },
    });

    // 6. Get current injury
    const currentInjury = player ? await prisma.injury.findFirst({
      where: {
        playerId: player.id,
        status: { in: ['ACTIVE', 'RECOVERING'] },
      },
      select: {
        id: true,
        type: true,
        severity: true,
        expectedReturn: true,
      },
      orderBy: { dateOccurred: 'desc' },
    }) : null;

    // 7. Get season stats from lineup data
    const lineupData = player ? await prisma.matchLineup.findMany({
      where: {
        playerId: player.id,
        match: { status: 'COMPLETED' },
      },
      select: {
        isStarter: true,
        minutesPlayed: true,
        matchId: true,
      },
    }) : [];

    // 8. Get event stats
    const eventCounts = player ? await prisma.matchEvent.groupBy({
      by: ['eventType'],
      where: {
        playerId: player.id,
        match: { status: 'COMPLETED' },
      },
      _count: { id: true },
    }) : [];

    const eventMap = new Map(eventCounts.map((e) => [e.eventType, e._count.id]));

    const seasonStats = {
      appearances: lineupData.length,
      starts: lineupData.filter((l) => l.isStarter).length,
      minutesPlayed: lineupData.reduce((sum, l) => sum + (l.minutesPlayed || 0), 0),
      goals: (eventMap.get('GOAL') || 0) + (eventMap.get('PENALTY_SCORED') || 0),
      assists: eventMap.get('ASSIST') || 0,
      yellowCards: eventMap.get('YELLOW_CARD') || 0,
      redCards: eventMap.get('RED_CARD') || 0,
    };

    // 9. Get recent matches
    const recentLineups = player ? await prisma.matchLineup.findMany({
      where: {
        playerId: player.id,
        match: { status: 'COMPLETED' },
      },
      include: {
        match: {
          select: {
            id: true,
            kickOffTime: true,
            homeTeamId: true,
            awayTeamId: true,
            homeScore: true,
            awayScore: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
      orderBy: { match: { kickOffTime: 'desc' } },
      take: 5,
    }) : [];

    const recentMatches = recentLineups.map((l) => {
      const isHome = l.match.homeTeamId === teamId;
      const opponent = isHome ? l.match.awayTeam.name : l.match.homeTeam.name;
      const teamScore = isHome ? l.match.homeScore : l.match.awayScore;
      const oppScore = isHome ? l.match.awayScore : l.match.homeScore;
      
      let result = 'D';
      if (teamScore !== null && oppScore !== null) {
        if (teamScore > oppScore) result = 'W';
        else if (teamScore < oppScore) result = 'L';
      }

      return {
        matchId: l.match.id,
        date: l.match.kickOffTime.toISOString(),
        opponent,
        result: `${result} ${teamScore ?? 0}-${oppScore ?? 0}`,
        minutesPlayed: l.minutesPlayed || 0,
        rating: l.rating,
      };
    });

    // 10. Build response
    const response: PlayerDetail = {
      id: teamMember.id,
      playerId: player?.id || '',
      userId: teamMember.userId,
      name: `${teamMember.user.firstName} ${teamMember.user.lastName}`,
      firstName: teamMember.user.firstName,
      lastName: teamMember.user.lastName,
      email: teamMember.user.email,
      avatar: teamMember.user.avatar,
      phone: teamMember.user.phone,
      position: player?.position || null,
      shirtNumber: player?.shirtNumber || null,
      preferredFoot: player?.preferredFoot || null,
      dateOfBirth: teamMember.user.dateOfBirth?.toISOString() || null,
      age: teamMember.user.dateOfBirth ? calculateAge(teamMember.user.dateOfBirth) : null,
      nationality: teamMember.user.nationality,
      height: player?.height || null,
      weight: player?.weight || null,
      bio: teamMember.user.bio,
      role: teamMember.role,
      isCaptain: teamMember.isCaptain || false,
      isViceCaptain: teamMember.isViceCaptain || false,
      joinedAt: teamMember.createdAt.toISOString(),
      isActive: teamMember.isActive,
      isAvailable: !currentInjury && teamMember.isActive,
      currentInjury: currentInjury ? {
        id: currentInjury.id,
        type: currentInjury.type,
        severity: currentInjury.severity,
        expectedReturn: currentInjury.expectedReturn?.toISOString() || null,
      } : undefined,
      seasonStats,
      recentMatches,
      canEdit: permissions.canEdit,
      canRemove: permissions.canRemove,
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Player error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch player details',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Player
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, playerId } = params;

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
        error: 'You do not have permission to edit players',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Fetch team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!teamMember || teamMember.teamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Player not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Parse and validate body
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

    const validation = UpdatePlayerSchema.safeParse(body);
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

    // 6. Check shirt number availability
    if (updates.shirtNumber !== undefined && updates.shirtNumber !== null) {
      const existingShirt = await prisma.player.findFirst({
        where: {
          shirtNumber: updates.shirtNumber,
          userId: { not: teamMember.userId },
          user: {
            teamMembers: {
              some: {
                teamId,
                isActive: true,
              },
            },
          },
        },
      });

      if (existingShirt) {
        return createResponse(null, {
          success: false,
          error: `Shirt number ${updates.shirtNumber} is already taken`,
          code: 'SHIRT_NUMBER_TAKEN',
          requestId,
          status: 400,
        });
      }
    }

    // 7. Handle captain/vice-captain changes
    if (updates.isCaptain === true) {
      await prisma.teamMember.updateMany({
        where: { teamId, isCaptain: true, id: { not: playerId } },
        data: { isCaptain: false },
      });
    }
    if (updates.isViceCaptain === true) {
      await prisma.teamMember.updateMany({
        where: { teamId, isViceCaptain: true, id: { not: playerId } },
        data: { isViceCaptain: false },
      });
    }

    // 8. Update team member
    const teamMemberUpdates: Record<string, unknown> = {};
    if (updates.isCaptain !== undefined) teamMemberUpdates.isCaptain = updates.isCaptain;
    if (updates.isViceCaptain !== undefined) teamMemberUpdates.isViceCaptain = updates.isViceCaptain;
    if (updates.isActive !== undefined) teamMemberUpdates.isActive = updates.isActive;

    if (Object.keys(teamMemberUpdates).length > 0) {
      await prisma.teamMember.update({
        where: { id: playerId },
        data: teamMemberUpdates,
      });
    }

    // 9. Update player profile
    const playerUpdates: Record<string, unknown> = {};
    if (updates.position !== undefined) playerUpdates.position = updates.position;
    if (updates.shirtNumber !== undefined) playerUpdates.shirtNumber = updates.shirtNumber;
    if (updates.preferredFoot !== undefined) playerUpdates.preferredFoot = updates.preferredFoot;
    if (updates.height !== undefined) playerUpdates.height = updates.height;
    if (updates.weight !== undefined) playerUpdates.weight = updates.weight;

    if (Object.keys(playerUpdates).length > 0) {
      await prisma.player.upsert({
        where: { userId: teamMember.userId },
        create: {
          userId: teamMember.userId,
          ...playerUpdates,
        },
        update: playerUpdates,
      });
    }

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'TEAM_MEMBER',
        entityId: playerId,
        description: `Updated player ${teamMember.user.firstName} ${teamMember.user.lastName}`,
        metadata: {
          changes: Object.keys(updates),
          teamId,
          clubId,
        },
      },
    });

    return createResponse({
      id: playerId,
      updated: true,
      changes: Object.keys(updates),
    }, {
      success: true,
      message: 'Player updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Update Player error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update player',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Remove Player from Team
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, playerId } = params;

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
    if (!permissions.canRemove) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to remove players',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Fetch team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!teamMember || teamMember.teamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Player not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Check for match history
    const player = await prisma.player.findUnique({
      where: { userId: teamMember.userId },
    });

    let hasHistory = false;
    if (player) {
      const lineupCount = await prisma.matchLineup.count({
        where: { playerId: player.id, teamId },
      });
      hasHistory = lineupCount > 0;
    }

    // 6. Soft delete (mark as inactive) if has history, otherwise hard delete
    if (hasHistory) {
      await prisma.teamMember.update({
        where: { id: playerId },
        data: { isActive: false },
      });
    } else {
      await prisma.teamMember.delete({
        where: { id: playerId },
      });
    }

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'TEAM_MEMBER',
        entityId: playerId,
        description: `Removed player ${teamMember.user.firstName} ${teamMember.user.lastName} from team ${team.name}`,
        metadata: {
          playerUserId: teamMember.userId,
          teamId,
          clubId,
          softDelete: hasHistory,
        },
      },
    });

    return createResponse(null, {
      success: true,
      message: 'Player removed from team successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Remove Player error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to remove player',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
