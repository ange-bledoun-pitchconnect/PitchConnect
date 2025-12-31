// =============================================================================
// 👤 PUBLIC PROFILE API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/profile - Get current user's public profile view
// GET /api/profile?userId=xxx - Get another user's public profile (if allowed)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Access: Authenticated users (own profile or permitted profiles)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport, Position } from '@prisma/client';

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

interface PlayerProfileSummary {
  id: string;
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
  preferredFoot: string | null;
  height: number | null;
  jerseyNumber: number | null;
  overallRating: number | null;
  isVerified: boolean;
  
  // Current teams
  teams: Array<{
    teamId: string;
    teamName: string;
    clubName: string;
    clubLogo: string | null;
    sport: Sport;
    position: Position | null;
    isCaptain: boolean;
  }>;
  
  // Stats summary
  stats: {
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
  } | null;
}

interface CoachProfileSummary {
  id: string;
  specialization: string | null;
  licenseLevel: string | null;
  experience: number | null;
  isVerified: boolean;
  
  // Current clubs
  clubs: Array<{
    clubId: string;
    clubName: string;
    clubLogo: string | null;
    sport: Sport;
    role: string;
  }>;
}

interface ParentProfileSummary {
  id: string;
  
  // Children (if viewing own profile)
  children: Array<{
    playerId: string;
    playerName: string;
    relationship: string;
  }>;
}

interface PublicProfileResponse {
  // User info
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatar: string | null;
  
  // Public demographics
  nationality: string | null;
  city: string | null;
  country: string | null;
  
  // Roles
  roles: string[];
  
  // Role-specific profiles
  playerProfile: PlayerProfileSummary | null;
  coachProfile: CoachProfileSummary | null;
  parentProfile: ParentProfileSummary | null;
  
  // Account info
  memberSince: string;
  isVerified: boolean;
  
  // Access level
  isOwnProfile: boolean;
  
  // Club memberships
  clubMemberships: Array<{
    clubId: string;
    clubName: string;
    clubLogo: string | null;
    sport: Sport;
    role: string;
    joinedAt: string;
  }>;
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

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetProfileSchema = z.object({
  userId: z.string().cuid().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `pubprofile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
      'Cache-Control': 'private, max-age=60',
    },
  });
}

/**
 * Check if user can view another user's profile
 */
async function canViewProfile(
  viewerId: string,
  targetUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Can always view own profile
  if (viewerId === targetUserId) {
    return { allowed: true };
  }

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: {
      isSuperAdmin: true,
      roles: true,
      clubMembers: {
        where: { isActive: true },
        select: { clubId: true },
      },
    },
  });

  if (!viewer) {
    return { allowed: false, reason: 'Viewer not found' };
  }

  // Admins can view any profile
  if (viewer.isSuperAdmin || viewer.roles.some(r => ['ADMIN', 'SCOUT'].includes(r))) {
    return { allowed: true };
  }

  // Check if in same club
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      clubMembers: {
        where: { isActive: true },
        select: { clubId: true },
      },
      player: {
        select: {
          teamPlayers: {
            where: { isActive: true },
            select: { team: { select: { clubId: true } } },
          },
        },
      },
    },
  });

  if (!targetUser) {
    return { allowed: false, reason: 'User not found' };
  }

  // Get all club IDs for target user
  const targetClubIds = new Set([
    ...targetUser.clubMembers.map(m => m.clubId),
    ...(targetUser.player?.teamPlayers.map(tp => tp.team.clubId) || []),
  ]);

  const viewerClubIds = viewer.clubMembers.map(m => m.clubId);
  const sharedClub = viewerClubIds.some(id => targetClubIds.has(id));

  if (sharedClub) {
    return { allowed: true };
  }

  // Check parent access
  const parentAccess = await prisma.parentPortalAccess.findFirst({
    where: {
      parent: { userId: viewerId },
      player: { userId: targetUserId },
      isActive: true,
    },
  });

  if (parentAccess) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Access denied to this profile' };
}

// =============================================================================
// GET HANDLER - Get Public Profile
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

    const viewerId = session.user.id;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = GetProfileSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid parameters',
        },
        requestId,
        status: 400,
      });
    }

    const targetUserId = validation.data.userId || viewerId;
    const isOwnProfile = targetUserId === viewerId;

    // 3. Check access
    if (!isOwnProfile) {
      const access = await canViewProfile(viewerId, targetUserId);
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
    }

    // 4. Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        nationality: true,
        city: true,
        country: true,
        roles: true,
        emailVerified: true,
        createdAt: true,
        
        // Player profile
        player: {
          select: {
            id: true,
            primaryPosition: true,
            secondaryPosition: true,
            preferredFoot: true,
            height: true,
            jerseyNumber: true,
            overallRating: true,
            isVerified: true,
            teamPlayers: {
              where: { isActive: true },
              select: {
                teamId: true,
                position: true,
                isCaptain: true,
                team: {
                  select: {
                    name: true,
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
            aggregateStats: {
              select: {
                totalMatches: true,
                totalGoals: true,
                totalAssists: true,
              },
            },
          },
        },
        
        // Coach profile
        coach: {
          select: {
            id: true,
            specialization: true,
            licenseLevel: true,
            experience: true,
            isVerified: true,
            clubMembers: {
              where: { isActive: true },
              select: {
                role: true,
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
        
        // Parent profile (only for own profile)
        ...(isOwnProfile && {
          parent: {
            select: {
              id: true,
              parentPortalAccess: {
                where: { isActive: true },
                select: {
                  relationship: true,
                  player: {
                    select: {
                      id: true,
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        
        // Club memberships
        clubMembers: {
          where: { isActive: true },
          select: {
            role: true,
            joinedAt: true,
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
    });

    if (!user) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found',
        },
        requestId,
        status: 404,
      });
    }

    // 5. Build player profile summary
    let playerProfile: PlayerProfileSummary | null = null;
    if (user.player) {
      playerProfile = {
        id: user.player.id,
        primaryPosition: user.player.primaryPosition,
        secondaryPosition: user.player.secondaryPosition,
        preferredFoot: user.player.preferredFoot,
        height: user.player.height,
        jerseyNumber: user.player.jerseyNumber,
        overallRating: user.player.overallRating,
        isVerified: user.player.isVerified,
        
        teams: user.player.teamPlayers.map(tp => ({
          teamId: tp.teamId,
          teamName: tp.team.name,
          clubName: tp.team.club.name,
          clubLogo: tp.team.club.logo,
          sport: tp.team.club.sport,
          position: tp.position,
          isCaptain: tp.isCaptain,
        })),
        
        stats: user.player.aggregateStats ? {
          totalMatches: user.player.aggregateStats.totalMatches,
          totalGoals: user.player.aggregateStats.totalGoals,
          totalAssists: user.player.aggregateStats.totalAssists,
        } : null,
      };
    }

    // 6. Build coach profile summary
    let coachProfile: CoachProfileSummary | null = null;
    if (user.coach) {
      coachProfile = {
        id: user.coach.id,
        specialization: user.coach.specialization,
        licenseLevel: user.coach.licenseLevel,
        experience: user.coach.experience,
        isVerified: user.coach.isVerified,
        
        clubs: user.coach.clubMembers.map(cm => ({
          clubId: cm.club.id,
          clubName: cm.club.name,
          clubLogo: cm.club.logo,
          sport: cm.club.sport,
          role: cm.role,
        })),
      };
    }

    // 7. Build parent profile summary (own profile only)
    let parentProfile: ParentProfileSummary | null = null;
    if (isOwnProfile && user.parent) {
      parentProfile = {
        id: user.parent.id,
        children: user.parent.parentPortalAccess.map(ppa => ({
          playerId: ppa.player.id,
          playerName: `${ppa.player.user.firstName} ${ppa.player.user.lastName}`,
          relationship: ppa.relationship,
        })),
      };
    }

    // 8. Build club memberships
    const clubMemberships = user.clubMembers.map(cm => ({
      clubId: cm.club.id,
      clubName: cm.club.name,
      clubLogo: cm.club.logo,
      sport: cm.club.sport,
      role: cm.role,
      joinedAt: cm.joinedAt.toISOString(),
    }));

    // 9. Build response
    const response: PublicProfileResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatar: user.avatar,
      
      nationality: user.nationality,
      city: user.city,
      country: user.country,
      
      roles: user.roles,
      
      playerProfile,
      coachProfile,
      parentProfile,
      
      memberSince: user.createdAt.toISOString(),
      isVerified: !!user.emailVerified,
      
      isOwnProfile,
      
      clubMemberships,
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Public profile fetched`, {
      viewerId,
      targetUserId,
      isOwnProfile,
      hasPlayerProfile: !!playerProfile,
      hasCoachProfile: !!coachProfile,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/profile error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch profile',
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