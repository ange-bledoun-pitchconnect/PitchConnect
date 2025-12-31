// =============================================================================
// 👤 PLAYER PROFILE API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/player/profile - Get player profile (with auto-create)
// PATCH /api/player/profile - Update player profile
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Names: Joined from User model (single source of truth)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Position,
  PreferredFoot,
  Sport,
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

interface PlayerProfileResponse {
  id: string;
  userId: string;
  
  // From User (single source of truth)
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string;
  avatar: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  
  // Player-specific
  height: number | null;
  weight: number | null;
  jerseyNumber: number | null;
  preferredFoot: PreferredFoot | null;
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
  tertiaryPosition: Position | null;
  
  // Status
  isActive: boolean;
  isVerified: boolean;
  hasCompletedProfile: boolean;
  availabilityStatus: string;
  
  // Ratings
  overallRating: number | null;
  formRating: number | null;
  
  // Teams
  teams: Array<{
    teamId: string;
    teamName: string;
    clubId: string;
    clubName: string;
    clubLogo: string | null;
    sport: Sport;
    position: Position | null;
    jerseyNumber: number | null;
    isCaptain: boolean;
    isViceCaptain: boolean;
    joinedAt: string;
  }>;
  
  // Stats summary
  stats: {
    totalTeams: number;
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
  };
  
  // Profile completeness
  profileCompleteness: {
    percentage: number;
    missingFields: string[];
  };
  
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

// Sport-specific default positions
const SPORT_DEFAULT_POSITIONS: Record<Sport, Position> = {
  FOOTBALL: 'UTILITY',
  FUTSAL: 'UTILITY',
  BEACH_FOOTBALL: 'UTILITY',
  RUGBY: 'UTILITY',
  BASKETBALL: 'UTILITY',
  CRICKET: 'ALL_ROUNDER',
  AMERICAN_FOOTBALL: 'UTILITY',
  NETBALL: 'CENTER',
  HOCKEY: 'UTILITY',
  LACROSSE: 'UTILITY',
  AUSTRALIAN_RULES: 'UTILITY',
  GAELIC_FOOTBALL: 'UTILITY',
};

// Fields required for "complete" profile
const REQUIRED_PROFILE_FIELDS = [
  'dateOfBirth',
  'nationality',
  'height',
  'primaryPosition',
  'preferredFoot',
] as const;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateProfileSchema = z.object({
  // Physical attributes
  height: z.number().positive().max(300).optional().nullable(),
  weight: z.number().positive().max(500).optional().nullable(),
  
  // Playing attributes
  jerseyNumber: z.number().int().min(1).max(99).optional().nullable(),
  preferredFoot: z.nativeEnum(PreferredFoot).optional().nullable(),
  primaryPosition: z.nativeEnum(Position).optional().nullable(),
  secondaryPosition: z.nativeEnum(Position).optional().nullable(),
  tertiaryPosition: z.nativeEnum(Position).optional().nullable(),
  
  // Status
  availabilityStatus: z.enum(['AVAILABLE', 'UNAVAILABLE', 'INJURED', 'SUSPENDED']).optional(),
  
  // User fields (will update User model)
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().max(100).optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
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

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(
  user: { dateOfBirth: Date | null; nationality: string | null },
  player: { 
    height: number | null; 
    primaryPosition: Position | null; 
    preferredFoot: PreferredFoot | null;
  }
): { percentage: number; missingFields: string[] } {
  const missingFields: string[] = [];
  
  if (!user.dateOfBirth) missingFields.push('dateOfBirth');
  if (!user.nationality) missingFields.push('nationality');
  if (!player.height) missingFields.push('height');
  if (!player.primaryPosition || player.primaryPosition === 'UTILITY') {
    missingFields.push('primaryPosition');
  }
  if (!player.preferredFoot) missingFields.push('preferredFoot');
  
  const completedFields = REQUIRED_PROFILE_FIELDS.length - missingFields.length;
  const percentage = Math.round((completedFields / REQUIRED_PROFILE_FIELDS.length) * 100);
  
  return { percentage, missingFields };
}

/**
 * Get default position based on sport
 */
function getDefaultPosition(sport?: Sport): Position {
  if (sport && SPORT_DEFAULT_POSITIONS[sport]) {
    return SPORT_DEFAULT_POSITIONS[sport];
  }
  return 'UTILITY';
}

/**
 * Create player profile with smart defaults
 */
async function createPlayerProfile(userId: string): Promise<string> {
  // Check if user has any team memberships to infer sport
  const existingMembership = await prisma.clubMember.findFirst({
    where: { userId, isActive: true },
    include: {
      club: { select: { sport: true } },
    },
  });
  
  const defaultPosition = getDefaultPosition(existingMembership?.club?.sport);
  
  const player = await prisma.player.create({
    data: {
      userId,
      primaryPosition: defaultPosition,
      isActive: true,
      isVerified: false,
      hasCompletedProfile: false,
      availabilityStatus: 'AVAILABLE',
    },
  });
  
  console.log(`✅ Auto-created player profile for user ${userId}:`, player.id);
  
  return player.id;
}

// =============================================================================
// GET HANDLER - Get Player Profile
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // 2. Get or create player profile
    let player = await prisma.player.findUnique({
      where: { userId },
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
          orderBy: { joinedAt: 'desc' },
        },
        aggregateStats: true,
      },
    });

    // 3. Auto-create if not exists
    if (!player) {
      console.log(`🆕 Creating player profile for user: ${userId}`);
      
      const playerId = await createPlayerProfile(userId);
      
      // Re-fetch with all relations
      player = await prisma.player.findUnique({
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
        },
      });
    }

    if (!player || !player.user) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to create player profile',
        },
        requestId,
        status: 500,
      });
    }

    // 4. Calculate profile completeness
    const completeness = calculateProfileCompleteness(player.user, player);

    // 5. Update hasCompletedProfile if needed
    const isComplete = completeness.percentage === 100;
    if (player.hasCompletedProfile !== isComplete) {
      await prisma.player.update({
        where: { id: player.id },
        data: { hasCompletedProfile: isComplete },
      });
    }

    // 6. Build response
    const response: PlayerProfileResponse = {
      id: player.id,
      userId: player.userId,
      
      // From User
      firstName: player.user.firstName,
      lastName: player.user.lastName,
      displayName: player.user.displayName,
      email: player.user.email,
      avatar: player.user.avatar,
      dateOfBirth: player.user.dateOfBirth?.toISOString() || null,
      nationality: player.user.nationality,
      
      // Player-specific
      height: player.height,
      weight: player.weight,
      jerseyNumber: player.jerseyNumber,
      preferredFoot: player.preferredFoot,
      primaryPosition: player.primaryPosition,
      secondaryPosition: player.secondaryPosition,
      tertiaryPosition: player.tertiaryPosition,
      
      // Status
      isActive: player.isActive,
      isVerified: player.isVerified,
      hasCompletedProfile: isComplete,
      availabilityStatus: player.availabilityStatus,
      
      // Ratings
      overallRating: player.overallRating,
      formRating: player.formRating,
      
      // Teams
      teams: player.teamPlayers.map((tp) => ({
        teamId: tp.team.id,
        teamName: tp.team.name,
        clubId: tp.team.club.id,
        clubName: tp.team.club.name,
        clubLogo: tp.team.club.logo,
        sport: tp.team.club.sport,
        position: tp.position,
        jerseyNumber: tp.jerseyNumber,
        isCaptain: tp.isCaptain,
        isViceCaptain: tp.isViceCaptain,
        joinedAt: tp.joinedAt.toISOString(),
      })),
      
      // Stats summary
      stats: {
        totalTeams: player.teamPlayers.length,
        totalMatches: player.aggregateStats?.totalMatches || 0,
        totalGoals: player.aggregateStats?.totalGoals || 0,
        totalAssists: player.aggregateStats?.totalAssists || 0,
      },
      
      // Completeness
      profileCompleteness: completeness,
      
      createdAt: player.createdAt.toISOString(),
      updatedAt: player.updatedAt.toISOString(),
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player profile fetched`, {
      playerId: player.id,
      userId,
      completeness: completeness.percentage,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/player/profile error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch player profile',
        details: error instanceof Error ? error.message : undefined,
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Player Profile
// =============================================================================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
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

    // 2. Parse and validate body
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

    const validation = UpdateProfileSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
          details: JSON.stringify(validation.error.errors),
        },
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 3. Verify player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!existingPlayer) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player profile not found. Please refresh the page.',
        },
        requestId,
        status: 404,
      });
    }

    // 4. Separate User and Player updates
    const userUpdates: Prisma.UserUpdateInput = {};
    const playerUpdates: Prisma.PlayerUpdateInput = {};

    // User fields
    if (data.firstName !== undefined) userUpdates.firstName = data.firstName;
    if (data.lastName !== undefined) userUpdates.lastName = data.lastName;
    if (data.displayName !== undefined) userUpdates.displayName = data.displayName;
    if (data.dateOfBirth !== undefined) {
      userUpdates.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (data.nationality !== undefined) userUpdates.nationality = data.nationality;

    // Player fields
    if (data.height !== undefined) playerUpdates.height = data.height;
    if (data.weight !== undefined) playerUpdates.weight = data.weight;
    if (data.jerseyNumber !== undefined) playerUpdates.jerseyNumber = data.jerseyNumber;
    if (data.preferredFoot !== undefined) playerUpdates.preferredFoot = data.preferredFoot;
    if (data.primaryPosition !== undefined) playerUpdates.primaryPosition = data.primaryPosition;
    if (data.secondaryPosition !== undefined) playerUpdates.secondaryPosition = data.secondaryPosition;
    if (data.tertiaryPosition !== undefined) playerUpdates.tertiaryPosition = data.tertiaryPosition;
    if (data.availabilityStatus !== undefined) playerUpdates.availabilityStatus = data.availabilityStatus;

    // 5. Execute updates in transaction
    const [updatedUser, updatedPlayer] = await prisma.$transaction([
      // Update User if needed
      Object.keys(userUpdates).length > 0
        ? prisma.user.update({
            where: { id: userId },
            data: userUpdates,
          })
        : prisma.user.findUnique({ where: { id: userId } }),
      
      // Update Player
      prisma.player.update({
        where: { userId },
        data: {
          ...playerUpdates,
          updatedAt: new Date(),
        },
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
        },
      }),
    ]);

    if (!updatedPlayer || !updatedPlayer.user) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to update profile',
        },
        requestId,
        status: 500,
      });
    }

    // 6. Calculate new completeness
    const completeness = calculateProfileCompleteness(updatedPlayer.user, updatedPlayer);
    const isComplete = completeness.percentage === 100;

    // Update hasCompletedProfile if changed
    if (updatedPlayer.hasCompletedProfile !== isComplete) {
      await prisma.player.update({
        where: { id: updatedPlayer.id },
        data: { hasCompletedProfile: isComplete },
      });
    }

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_UPDATED',
        resourceType: 'PLAYER',
        resourceId: updatedPlayer.id,
        changes: Object.keys({ ...userUpdates, ...playerUpdates }),
      },
    });

    // 8. Build response
    const response: PlayerProfileResponse = {
      id: updatedPlayer.id,
      userId: updatedPlayer.userId,
      
      firstName: updatedPlayer.user.firstName,
      lastName: updatedPlayer.user.lastName,
      displayName: updatedPlayer.user.displayName,
      email: updatedPlayer.user.email,
      avatar: updatedPlayer.user.avatar,
      dateOfBirth: updatedPlayer.user.dateOfBirth?.toISOString() || null,
      nationality: updatedPlayer.user.nationality,
      
      height: updatedPlayer.height,
      weight: updatedPlayer.weight,
      jerseyNumber: updatedPlayer.jerseyNumber,
      preferredFoot: updatedPlayer.preferredFoot,
      primaryPosition: updatedPlayer.primaryPosition,
      secondaryPosition: updatedPlayer.secondaryPosition,
      tertiaryPosition: updatedPlayer.tertiaryPosition,
      
      isActive: updatedPlayer.isActive,
      isVerified: updatedPlayer.isVerified,
      hasCompletedProfile: isComplete,
      availabilityStatus: updatedPlayer.availabilityStatus,
      
      overallRating: updatedPlayer.overallRating,
      formRating: updatedPlayer.formRating,
      
      teams: updatedPlayer.teamPlayers.map((tp) => ({
        teamId: tp.team.id,
        teamName: tp.team.name,
        clubId: tp.team.club.id,
        clubName: tp.team.club.name,
        clubLogo: tp.team.club.logo,
        sport: tp.team.club.sport,
        position: tp.position,
        jerseyNumber: tp.jerseyNumber,
        isCaptain: tp.isCaptain,
        isViceCaptain: tp.isViceCaptain,
        joinedAt: tp.joinedAt.toISOString(),
      })),
      
      stats: {
        totalTeams: updatedPlayer.teamPlayers.length,
        totalMatches: updatedPlayer.aggregateStats?.totalMatches || 0,
        totalGoals: updatedPlayer.aggregateStats?.totalGoals || 0,
        totalAssists: updatedPlayer.aggregateStats?.totalAssists || 0,
      },
      
      profileCompleteness: completeness,
      
      createdAt: updatedPlayer.createdAt.toISOString(),
      updatedAt: updatedPlayer.updatedAt.toISOString(),
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player profile updated`, {
      playerId: updatedPlayer.id,
      userId,
      fieldsUpdated: Object.keys({ ...userUpdates, ...playerUpdates }).length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] PATCH /api/player/profile error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to update player profile',
        details: error instanceof Error ? error.message : undefined,
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
