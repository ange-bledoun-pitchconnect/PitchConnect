// =============================================================================
// 👤 SINGLE PLAYER API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/players/[playerId] - Get player details
// PATCH  /api/players/[playerId] - Update player
// DELETE /api/players/[playerId] - Soft delete player
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Access: PLAYER (self), COACH (team), SCOUT, ANALYST, ADMIN
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Sport,
  Position,
  PreferredFoot,
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
  };
}

interface PlayerDetailResponse {
  id: string;
  userId: string;
  
  // From User (single source of truth for names)
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string;
  avatar: string | null;
  dateOfBirth: string | null;
  age: number | null;
  nationality: string | null;
  
  // Physical attributes
  height: number | null;
  weight: number | null;
  
  // Playing attributes
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
  tertiaryPosition: Position | null;
  preferredFoot: PreferredFoot | null;
  jerseyNumber: number | null;
  
  // Ratings
  overallRating: number | null;
  formRating: number | null;
  potentialRating: number | null;
  marketValue: number | null;
  
  // Status
  isActive: boolean;
  isVerified: boolean;
  hasCompletedProfile: boolean;
  availabilityStatus: string;
  
  // Teams
  teams: Array<{
    teamPlayerId: string;
    teamId: string;
    teamName: string;
    teamLogo: string | null;
    clubId: string;
    clubName: string;
    clubLogo: string | null;
    sport: Sport;
    position: Position | null;
    jerseyNumber: number | null;
    isCaptain: boolean;
    isViceCaptain: boolean;
    role: string;
    joinedAt: string;
  }>;
  
  // Career stats
  careerStats: {
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    totalMinutes: number;
    totalYellowCards: number;
    totalRedCards: number;
    totalCleanSheets: number;
    avgRating: number;
  } | null;
  
  // Current season stats
  currentSeasonStats: {
    season: string;
    matches: number;
    goals: number;
    assists: number;
    minutes: number;
    avgRating: number | null;
  } | null;
  
  // Injuries (if authorized)
  activeInjuries: Array<{
    id: string;
    type: string;
    severity: string;
    status: string;
    startDate: string;
    estimatedReturnDate: string | null;
  }>;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Roles that can view any player
const VIEW_ALL_ROLES = ['SUPERADMIN', 'ADMIN', 'SCOUT', 'ANALYST'];

// Roles that can edit players (beyond self)
const EDIT_ROLES = ['SUPERADMIN', 'ADMIN'];

// Roles that can view medical info
const MEDICAL_ROLES = ['SUPERADMIN', 'ADMIN', 'MEDICAL_STAFF', 'PHYSIOTHERAPIST', 'HEAD_COACH'];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdatePlayerSchema = z.object({
  // Physical
  height: z.number().positive().max(300).optional().nullable(),
  weight: z.number().positive().max(500).optional().nullable(),
  
  // Playing attributes
  primaryPosition: z.nativeEnum(Position).optional().nullable(),
  secondaryPosition: z.nativeEnum(Position).optional().nullable(),
  tertiaryPosition: z.nativeEnum(Position).optional().nullable(),
  preferredFoot: z.nativeEnum(PreferredFoot).optional().nullable(),
  jerseyNumber: z.number().int().min(1).max(99).optional().nullable(),
  
  // Status
  availabilityStatus: z.enum(['AVAILABLE', 'UNAVAILABLE', 'INJURED', 'SUSPENDED']).optional(),
  isActive: z.boolean().optional(),
  
  // Ratings (admin only)
  overallRating: z.number().min(0).max(100).optional().nullable(),
  potentialRating: z.number().min(0).max(100).optional().nullable(),
  marketValue: z.number().min(0).optional().nullable(),
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
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
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

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Check user access to player
 */
async function checkPlayerAccess(
  userId: string,
  playerId: string,
  action: 'view' | 'edit' | 'delete' | 'medical'
): Promise<{ 
  allowed: boolean; 
  isSelf: boolean; 
  isAdmin: boolean;
  canViewMedical: boolean;
  reason?: string;
}> {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      roles: true,
      player: { select: { id: true } },
      clubMembers: {
        where: { isActive: true },
        select: { clubId: true, role: true },
      },
    },
  });

  if (!user) {
    return { allowed: false, isSelf: false, isAdmin: false, canViewMedical: false, reason: 'User not found' };
  }

  // Check if viewing own profile
  const isSelf = user.player?.id === playerId;

  // Check admin status
  const isAdmin = user.isSuperAdmin || user.roles.some(r => EDIT_ROLES.includes(r));
  const canViewAll = user.isSuperAdmin || user.roles.some(r => VIEW_ALL_ROLES.includes(r));
  const canViewMedical = user.isSuperAdmin || 
    user.roles.some(r => MEDICAL_ROLES.includes(r)) ||
    user.clubMembers.some(m => MEDICAL_ROLES.includes(m.role));

  // Self can always view/edit own profile
  if (isSelf && action !== 'delete') {
    return { allowed: true, isSelf: true, isAdmin, canViewMedical: true };
  }

  // Admin actions
  if (action === 'delete' && !isAdmin) {
    return { allowed: false, isSelf, isAdmin, canViewMedical, reason: 'Only admins can delete players' };
  }

  if (action === 'edit' && !isAdmin && !isSelf) {
    // Check if coach of player's team
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        teamPlayers: {
          where: { isActive: true },
          select: { team: { select: { clubId: true } } },
        },
      },
    });

    const playerClubIds = player?.teamPlayers.map(tp => tp.team.clubId) || [];
    const isCoach = user.clubMembers.some(
      m => playerClubIds.includes(m.clubId) && ['HEAD_COACH', 'ASSISTANT_COACH', 'MANAGER'].includes(m.role)
    );

    if (!isCoach) {
      return { allowed: false, isSelf, isAdmin, canViewMedical, reason: 'Access denied' };
    }
  }

  // View access
  if (action === 'view') {
    if (canViewAll) {
      return { allowed: true, isSelf, isAdmin, canViewMedical };
    }

    // Check if in same club
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        teamPlayers: {
          where: { isActive: true },
          select: { team: { select: { clubId: true } } },
        },
      },
    });

    const playerClubIds = player?.teamPlayers.map(tp => tp.team.clubId) || [];
    const inSameClub = user.clubMembers.some(m => playerClubIds.includes(m.clubId));

    if (inSameClub) {
      return { allowed: true, isSelf, isAdmin, canViewMedical };
    }

    return { allowed: false, isSelf, isAdmin, canViewMedical, reason: 'Access denied' };
  }

  return { allowed: true, isSelf, isAdmin, canViewMedical };
}

// =============================================================================
// ROUTE CONTEXT
// =============================================================================

interface RouteContext {
  params: Promise<{ playerId: string }>;
}

// =============================================================================
// GET HANDLER - Get Player Details
// =============================================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
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
    const { playerId } = await context.params;

    // 2. Check access
    const access = await checkPlayerAccess(userId, playerId, 'view');
    if (!access.allowed) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: access.reason || 'Access denied',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Get current season
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentSeason = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;

    // 4. Fetch player with all related data
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            dateOfBirth: true,
            nationality: true,
          },
        },
        teamPlayers: {
          where: { isActive: true },
          include: {
            team: {
              include: {
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
        },
        aggregateStats: true,
        statistics: {
          where: { season: currentSeason },
          take: 1,
        },
        injuries: access.canViewMedical ? {
          where: {
            status: { in: ['ACTIVE', 'RECOVERING'] },
          },
          orderBy: { startDate: 'desc' },
          take: 5,
        } : undefined,
      },
    });

    if (!player) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player not found',
        },
        requestId,
        status: 404,
      });
    }

    // 5. Build response
    const currentSeasonStat = player.statistics[0];

    const response: PlayerDetailResponse = {
      id: player.id,
      userId: player.userId,
      
      firstName: player.user.firstName,
      lastName: player.user.lastName,
      displayName: player.user.displayName,
      email: access.isSelf || access.isAdmin ? player.user.email : '[hidden]',
      avatar: player.user.avatar,
      dateOfBirth: player.user.dateOfBirth?.toISOString() || null,
      age: calculateAge(player.user.dateOfBirth),
      nationality: player.user.nationality,
      
      height: player.height,
      weight: player.weight,
      
      primaryPosition: player.primaryPosition,
      secondaryPosition: player.secondaryPosition,
      tertiaryPosition: player.tertiaryPosition,
      preferredFoot: player.preferredFoot,
      jerseyNumber: player.jerseyNumber,
      
      overallRating: player.overallRating,
      formRating: player.formRating,
      potentialRating: player.potentialRating,
      marketValue: player.marketValue,
      
      isActive: player.isActive,
      isVerified: player.isVerified,
      hasCompletedProfile: player.hasCompletedProfile,
      availabilityStatus: player.availabilityStatus,
      
      teams: player.teamPlayers.map((tp) => ({
        teamPlayerId: tp.id,
        teamId: tp.team.id,
        teamName: tp.team.name,
        teamLogo: tp.team.logo,
        clubId: tp.team.club.id,
        clubName: tp.team.club.name,
        clubLogo: tp.team.club.logo,
        sport: tp.team.club.sport,
        position: tp.position,
        jerseyNumber: tp.jerseyNumber,
        isCaptain: tp.isCaptain,
        isViceCaptain: tp.isViceCaptain,
        role: tp.role,
        joinedAt: tp.joinedAt.toISOString(),
      })),
      
      careerStats: player.aggregateStats ? {
        totalMatches: player.aggregateStats.totalMatches,
        totalGoals: player.aggregateStats.totalGoals,
        totalAssists: player.aggregateStats.totalAssists,
        totalMinutes: player.aggregateStats.totalMinutes,
        totalYellowCards: player.aggregateStats.yellowCards,
        totalRedCards: player.aggregateStats.redCards,
        totalCleanSheets: player.aggregateStats.cleanSheets,
        avgRating: player.aggregateStats.avgRating || 0,
      } : null,
      
      currentSeasonStats: currentSeasonStat ? {
        season: currentSeasonStat.season,
        matches: currentSeasonStat.matches,
        goals: currentSeasonStat.goals,
        assists: currentSeasonStat.assists,
        minutes: currentSeasonStat.minutes,
        avgRating: currentSeasonStat.avgRating,
      } : null,
      
      activeInjuries: access.canViewMedical && player.injuries ? player.injuries.map((inj) => ({
        id: inj.id,
        type: inj.type,
        severity: inj.severity,
        status: inj.status,
        startDate: inj.startDate.toISOString(),
        estimatedReturnDate: inj.estimatedReturnDate?.toISOString() || null,
      })) : [],
      
      createdAt: player.createdAt.toISOString(),
      updatedAt: player.updatedAt.toISOString(),
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player fetched`, {
      playerId,
      userId,
      isSelf: access.isSelf,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/players/[id] error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch player',
      },
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
  context: RouteContext
): Promise<NextResponse> {
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
    const { playerId } = await context.params;

    // 2. Check access
    const access = await checkPlayerAccess(userId, playerId, 'edit');
    if (!access.allowed) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: access.reason || 'Access denied',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Parse and validate body
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

    const validation = UpdatePlayerSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
        },
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 4. Restrict certain fields to admins
    const adminOnlyFields = ['overallRating', 'potentialRating', 'marketValue', 'isActive'];
    const hasAdminFields = adminOnlyFields.some(f => data[f as keyof typeof data] !== undefined);

    if (hasAdminFields && !access.isAdmin) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Only admins can modify rating and status fields',
        },
        requestId,
        status: 403,
      });
    }

    // 5. Get current player for audit log
    const currentPlayer = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!currentPlayer) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player not found',
        },
        requestId,
        status: 404,
      });
    }

    // 6. Build update data
    const updateData: Prisma.PlayerUpdateInput = {};

    if (data.height !== undefined) updateData.height = data.height;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.primaryPosition !== undefined) updateData.primaryPosition = data.primaryPosition;
    if (data.secondaryPosition !== undefined) updateData.secondaryPosition = data.secondaryPosition;
    if (data.tertiaryPosition !== undefined) updateData.tertiaryPosition = data.tertiaryPosition;
    if (data.preferredFoot !== undefined) updateData.preferredFoot = data.preferredFoot;
    if (data.jerseyNumber !== undefined) updateData.jerseyNumber = data.jerseyNumber;
    if (data.availabilityStatus !== undefined) updateData.availabilityStatus = data.availabilityStatus;

    // Admin-only fields
    if (access.isAdmin) {
      if (data.overallRating !== undefined) updateData.overallRating = data.overallRating;
      if (data.potentialRating !== undefined) updateData.potentialRating = data.potentialRating;
      if (data.marketValue !== undefined) updateData.marketValue = data.marketValue;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
    }

    // 7. Update player
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: updateData,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_UPDATED',
        resourceType: 'PLAYER',
        resourceId: playerId,
        beforeState: currentPlayer as unknown as Prisma.JsonObject,
        changes: Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined),
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player updated`, {
      playerId,
      userId,
      fieldsUpdated: Object.keys(updateData).length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse({
      id: updatedPlayer.id,
      name: `${updatedPlayer.user.firstName} ${updatedPlayer.user.lastName}`,
      updated: true,
      updatedAt: updatedPlayer.updatedAt.toISOString(),
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] PATCH /api/players/[id] error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to update player',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Soft Delete Player
// =============================================================================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
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
    const { playerId } = await context.params;

    // 2. Check access
    const access = await checkPlayerAccess(userId, playerId, 'delete');
    if (!access.allowed) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: access.reason || 'Only admins can delete players',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!player) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player not found',
        },
        requestId,
        status: 404,
      });
    }

    // 4. Soft delete
    await prisma.player.update({
      where: { id: playerId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // 5. Deactivate team memberships
    await prisma.teamPlayer.updateMany({
      where: { playerId },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    // 6. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_DELETED',
        resourceType: 'PLAYER',
        resourceId: playerId,
        afterState: {
          deletedBy: userId,
          playerName: `${player.user.firstName} ${player.user.lastName}`,
        },
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player deleted`, {
      playerId,
      userId,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse({
      id: playerId,
      deleted: true,
      timestamp: new Date().toISOString(),
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] DELETE /api/players/[id] error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to delete player',
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
