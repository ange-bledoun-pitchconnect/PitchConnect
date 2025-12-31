// =============================================================================
// 🔍 BROWSE TEAMS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/player/browse-teams - Search and discover teams to join
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Access: PLAYER, PLAYER_PRO, PARENT (for child)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Sport,
  TeamStatus,
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
    pagination?: PaginationMeta;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface BrowseTeamItem {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  ageGroup: string | null;
  gender: string | null;
  
  // Club info
  club: {
    id: string;
    name: string;
    logo: string | null;
    sport: Sport;
    city: string | null;
    country: string | null;
  };
  
  // Team stats
  playerCount: number;
  maxPlayers: number | null;
  spotsAvailable: number | null;
  
  // Request status
  hasPendingRequest: boolean;
  isAlreadyMember: boolean;
  
  // Recruitment info
  acceptingJoinRequests: boolean;
  requiresApproval: boolean;
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

// Common age groups across sports
const VALID_AGE_GROUPS = [
  'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 
  'U16', 'U17', 'U18', 'U19', 'U21', 'U23', 'SENIOR', 'VETERANS', 'OPEN',
] as const;

const VALID_GENDERS = ['MALE', 'FEMALE', 'MIXED'] as const;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const BrowseTeamsFiltersSchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  
  // Sport filter (required for best UX)
  sport: z.nativeEnum(Sport).optional(),
  sports: z.string().optional(), // Comma-separated sports
  
  // Team filters
  ageGroup: z.string().optional(),
  ageGroups: z.string().optional(), // Comma-separated
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).optional(),
  
  // Location filters
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  
  // Search
  search: z.string().max(200).optional(),
  
  // Sorting
  sortBy: z.enum(['name', 'createdAt', 'playerCount', 'distance']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  
  // Parent mode - browse for specific child
  forPlayerId: z.string().cuid().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `browse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
    pagination?: PaginationMeta;
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

  if (options.pagination) {
    response.meta!.pagination = options.pagination;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

/**
 * Check if user is parent of specified player
 */
async function checkParentAccess(
  userId: string,
  playerId: string
): Promise<boolean> {
  // Check via ParentPortalAccess
  const parentAccess = await prisma.parentPortalAccess.findFirst({
    where: {
      parent: { userId },
      playerId,
      isActive: true,
    },
  });

  if (parentAccess) return true;

  // Check via PlayerFamily
  const familyLink = await prisma.playerFamily.findFirst({
    where: {
      playerId,
      parent: { userId },
    },
  });

  return !!familyLink;
}

/**
 * Parse comma-separated enum values
 */
function parseEnumList<T extends string>(
  param: string | undefined,
  validValues: readonly T[]
): T[] {
  if (!param) return [];
  return param
    .split(',')
    .map((v) => v.trim().toUpperCase() as T)
    .filter((v) => validValues.includes(v));
}

// =============================================================================
// GET HANDLER - Browse Teams
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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = BrowseTeamsFiltersSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid parameters',
          details: JSON.stringify(validation.error.errors),
        },
        requestId,
        status: 400,
      });
    }

    const filters = validation.data;

    // 3. Determine which player we're browsing for
    let targetPlayerId: string | null = null;

    if (filters.forPlayerId) {
      // Parent browsing for child
      const hasAccess = await checkParentAccess(userId, filters.forPlayerId);
      if (!hasAccess) {
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'You do not have access to browse teams for this player',
          },
          requestId,
          status: 403,
        });
      }
      targetPlayerId = filters.forPlayerId;
    } else {
      // User browsing for themselves
      const player = await prisma.player.findUnique({
        where: { userId },
        select: { id: true },
      });
      targetPlayerId = player?.id || null;
    }

    // 4. Get current team memberships and pending requests
    let currentTeamIds: string[] = [];
    let pendingRequestTeamIds: Set<string> = new Set();

    if (targetPlayerId) {
      // Get current teams
      const teamMemberships = await prisma.teamPlayer.findMany({
        where: {
          playerId: targetPlayerId,
          isActive: true,
        },
        select: { teamId: true },
      });
      currentTeamIds = teamMemberships.map((tm) => tm.teamId);

      // Get pending join requests
      const pendingRequests = await prisma.teamJoinRequest.findMany({
        where: {
          playerId: targetPlayerId,
          status: 'PENDING',
        },
        select: { teamId: true },
      });
      pendingRequestTeamIds = new Set(pendingRequests.map((r) => r.teamId));
    }

    // 5. Build where clause
    const where: Prisma.TeamWhereInput = {
      status: TeamStatus.ACTIVE,
      acceptingJoinRequests: true,
      deletedAt: null,
      // Exclude teams player is already in
      id: currentTeamIds.length > 0 ? { notIn: currentTeamIds } : undefined,
      // Club must be active
      club: {
        deletedAt: null,
        status: 'ACTIVE',
      },
    };

    // Sport filter
    if (filters.sport) {
      where.club = {
        ...where.club as Prisma.ClubWhereInput,
        sport: filters.sport,
      };
    } else if (filters.sports) {
      const sports = parseEnumList(filters.sports, Object.values(Sport));
      if (sports.length > 0) {
        where.club = {
          ...where.club as Prisma.ClubWhereInput,
          sport: { in: sports },
        };
      }
    }

    // Age group filter
    if (filters.ageGroup) {
      where.ageGroup = filters.ageGroup;
    } else if (filters.ageGroups) {
      const ageGroups = filters.ageGroups.split(',').map((a) => a.trim()).filter(Boolean);
      if (ageGroups.length > 0) {
        where.ageGroup = { in: ageGroups };
      }
    }

    // Gender filter
    if (filters.gender) {
      where.gender = filters.gender;
    }

    // Location filters
    if (filters.city) {
      where.club = {
        ...where.club as Prisma.ClubWhereInput,
        city: { contains: filters.city, mode: 'insensitive' },
      };
    }

    if (filters.country) {
      where.club = {
        ...where.club as Prisma.ClubWhereInput,
        country: { contains: filters.country, mode: 'insensitive' },
      };
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { club: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // 6. Build order by
    let orderBy: Prisma.TeamOrderByWithRelationInput = {};
    
    switch (filters.sortBy) {
      case 'name':
        orderBy = { name: filters.sortOrder };
        break;
      case 'createdAt':
        orderBy = { createdAt: filters.sortOrder };
        break;
      case 'playerCount':
        orderBy = { players: { _count: filters.sortOrder } };
        break;
      default:
        orderBy = { name: 'asc' };
    }

    // 7. Execute query
    const offset = (filters.page - 1) * filters.limit;

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          club: {
            select: {
              id: true,
              name: true,
              logo: true,
              sport: true,
              city: true,
              country: true,
            },
          },
          _count: {
            select: {
              players: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy,
        skip: offset,
        take: filters.limit,
      }),
      prisma.team.count({ where }),
    ]);

    // 8. Transform response
    const transformedTeams: BrowseTeamItem[] = teams.map((team) => {
      const playerCount = team._count.players;
      const spotsAvailable = team.maxPlayers 
        ? Math.max(0, team.maxPlayers - playerCount)
        : null;

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        logo: team.logo,
        ageGroup: team.ageGroup,
        gender: team.gender,
        
        club: {
          id: team.club.id,
          name: team.club.name,
          logo: team.club.logo,
          sport: team.club.sport,
          city: team.club.city,
          country: team.club.country,
        },
        
        playerCount,
        maxPlayers: team.maxPlayers,
        spotsAvailable,
        
        hasPendingRequest: pendingRequestTeamIds.has(team.id),
        isAlreadyMember: false, // Already filtered out
        
        acceptingJoinRequests: team.acceptingJoinRequests,
        requiresApproval: team.requiresApproval,
      };
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Browse teams completed`, {
      userId,
      targetPlayerId,
      filters: {
        sport: filters.sport,
        ageGroup: filters.ageGroup,
        city: filters.city,
        search: filters.search,
      },
      resultsCount: teams.length,
      total,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(
      {
        teams: transformedTeams,
        filters: {
          availableSports: Object.values(Sport),
          availableAgeGroups: VALID_AGE_GROUPS,
          availableGenders: VALID_GENDERS,
        },
      },
      {
        success: true,
        requestId,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasMore: offset + teams.length < total,
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] GET /api/player/browse-teams error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to browse teams',
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
