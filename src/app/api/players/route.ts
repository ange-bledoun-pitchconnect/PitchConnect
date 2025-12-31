// =============================================================================
// 👥 PLAYERS LIST API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/players - List/search players with advanced filtering
// POST /api/players - Create new player (Admin only)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Access: Varies by endpoint
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

interface PlayerListItem {
  id: string;
  userId: string;
  
  // From User
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatar: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  age: number | null;
  
  // Player info
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
  preferredFoot: PreferredFoot | null;
  height: number | null;
  weight: number | null;
  jerseyNumber: number | null;
  
  // Ratings
  overallRating: number | null;
  formRating: number | null;
  marketValue: number | null;
  
  // Status
  isActive: boolean;
  isVerified: boolean;
  availabilityStatus: string;
  
  // Current team(s)
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
  }>;
  
  // Stats summary
  stats: {
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
  } | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Roles that can see all players
const VIEW_ALL_ROLES = [
  'SUPERADMIN',
  'ADMIN',
  'SCOUT',
  'ANALYST',
];

// Roles that can create players
const CREATE_ROLES = [
  'SUPERADMIN',
  'ADMIN',
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ListPlayersFiltersSchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  // Sport filter
  sport: z.nativeEnum(Sport).optional(),
  sports: z.string().optional(), // Comma-separated
  
  // Club/Team filters
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  
  // Player attributes
  position: z.nativeEnum(Position).optional(),
  positions: z.string().optional(), // Comma-separated
  preferredFoot: z.nativeEnum(PreferredFoot).optional(),
  nationality: z.string().optional(),
  
  // Age range
  minAge: z.coerce.number().int().min(0).max(100).optional(),
  maxAge: z.coerce.number().int().min(0).max(100).optional(),
  
  // Rating range
  minRating: z.coerce.number().min(0).max(100).optional(),
  maxRating: z.coerce.number().min(0).max(100).optional(),
  
  // Status filters
  isActive: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
  availabilityStatus: z.string().optional(),
  
  // Search
  search: z.string().max(200).optional(),
  
  // Sorting
  sortBy: z.enum([
    'name', 
    'rating', 
    'age', 
    'position', 
    'matches', 
    'goals', 
    'assists',
    'createdAt',
  ]).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  
  // Include flags
  includeStats: z.coerce.boolean().default(true),
});

const CreatePlayerSchema = z.object({
  userId: z.string().cuid(),
  primaryPosition: z.nativeEnum(Position).optional(),
  secondaryPosition: z.nativeEnum(Position).optional(),
  tertiaryPosition: z.nativeEnum(Position).optional(),
  preferredFoot: z.nativeEnum(PreferredFoot).optional(),
  height: z.number().positive().max(300).optional(),
  weight: z.number().positive().max(500).optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `players_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

function parseEnumList<T extends string>(
  param: string | undefined,
  validValues: T[]
): T[] {
  if (!param) return [];
  return param
    .split(',')
    .map((v) => v.trim() as T)
    .filter((v) => validValues.includes(v));
}

// =============================================================================
// GET HANDLER - List Players
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

    const validation = ListPlayersFiltersSchema.safeParse(rawParams);
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

    const filters = validation.data;

    // 3. Check user permissions for scope
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isSuperAdmin: true,
        roles: true,
        clubMembers: {
          where: { isActive: true },
          select: { clubId: true, role: true },
        },
      },
    });

    const canViewAll = user?.isSuperAdmin || 
      user?.roles.some(r => VIEW_ALL_ROLES.includes(r));

    // 4. Build where clause
    const where: Prisma.PlayerWhereInput = {
      deletedAt: null,
    };

    // If not admin, limit to players in user's clubs
    if (!canViewAll && !filters.clubId && !filters.teamId) {
      const userClubIds = user?.clubMembers.map(m => m.clubId) || [];
      if (userClubIds.length > 0) {
        where.teamPlayers = {
          some: {
            isActive: true,
            team: {
              clubId: { in: userClubIds },
            },
          },
        };
      }
    }

    // Sport filter
    if (filters.sport) {
      where.teamPlayers = {
        some: {
          isActive: true,
          team: {
            club: { sport: filters.sport },
          },
        },
      };
    } else if (filters.sports) {
      const sports = parseEnumList(filters.sports, Object.values(Sport));
      if (sports.length > 0) {
        where.teamPlayers = {
          some: {
            isActive: true,
            team: {
              club: { sport: { in: sports } },
            },
          },
        };
      }
    }

    // Club filter
    if (filters.clubId) {
      where.teamPlayers = {
        some: {
          isActive: true,
          team: { clubId: filters.clubId },
        },
      };
    }

    // Team filter
    if (filters.teamId) {
      where.teamPlayers = {
        some: {
          isActive: true,
          teamId: filters.teamId,
        },
      };
    }

    // Position filter
    if (filters.position) {
      where.OR = [
        { primaryPosition: filters.position },
        { secondaryPosition: filters.position },
        { tertiaryPosition: filters.position },
      ];
    } else if (filters.positions) {
      const positions = parseEnumList(filters.positions, Object.values(Position));
      if (positions.length > 0) {
        where.OR = [
          { primaryPosition: { in: positions } },
          { secondaryPosition: { in: positions } },
          { tertiaryPosition: { in: positions } },
        ];
      }
    }

    // Preferred foot filter
    if (filters.preferredFoot) {
      where.preferredFoot = filters.preferredFoot;
    }

    // Nationality filter (via User)
    if (filters.nationality) {
      where.user = {
        nationality: { contains: filters.nationality, mode: 'insensitive' },
      };
    }

    // Age range filter
    if (filters.minAge !== undefined || filters.maxAge !== undefined) {
      const now = new Date();
      if (filters.maxAge !== undefined) {
        const minDate = new Date(now.getFullYear() - filters.maxAge - 1, now.getMonth(), now.getDate());
        where.user = {
          ...where.user as Prisma.UserWhereInput,
          dateOfBirth: { gte: minDate },
        };
      }
      if (filters.minAge !== undefined) {
        const maxDate = new Date(now.getFullYear() - filters.minAge, now.getMonth(), now.getDate());
        where.user = {
          ...where.user as Prisma.UserWhereInput,
          dateOfBirth: { 
            ...((where.user as Prisma.UserWhereInput)?.dateOfBirth as object),
            lte: maxDate,
          },
        };
      }
    }

    // Rating range filter
    if (filters.minRating !== undefined) {
      where.overallRating = { gte: filters.minRating };
    }
    if (filters.maxRating !== undefined) {
      where.overallRating = {
        ...where.overallRating as Prisma.FloatNullableFilter,
        lte: filters.maxRating,
      };
    }

    // Status filters
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }
    if (filters.availabilityStatus) {
      where.availabilityStatus = filters.availabilityStatus;
    }

    // Search filter
    if (filters.search) {
      where.user = {
        ...where.user as Prisma.UserWhereInput,
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { displayName: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    // 5. Build order by
    let orderBy: Prisma.PlayerOrderByWithRelationInput = {};
    
    switch (filters.sortBy) {
      case 'name':
        orderBy = { user: { lastName: filters.sortOrder } };
        break;
      case 'rating':
        orderBy = { overallRating: filters.sortOrder };
        break;
      case 'age':
        orderBy = { user: { dateOfBirth: filters.sortOrder === 'asc' ? 'desc' : 'asc' } };
        break;
      case 'position':
        orderBy = { primaryPosition: filters.sortOrder };
        break;
      case 'createdAt':
        orderBy = { createdAt: filters.sortOrder };
        break;
      default:
        orderBy = { user: { lastName: 'asc' } };
    }

    // 6. Execute query
    const offset = (filters.page - 1) * filters.limit;

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatar: true,
              nationality: true,
              dateOfBirth: true,
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
            take: 3, // Limit teams per player
          },
          ...(filters.includeStats && {
            aggregateStats: {
              select: {
                totalMatches: true,
                totalGoals: true,
                totalAssists: true,
              },
            },
          }),
        },
        orderBy,
        skip: offset,
        take: filters.limit,
      }),
      prisma.player.count({ where }),
    ]);

    // 7. Transform response
    const transformedPlayers: PlayerListItem[] = players.map((player) => ({
      id: player.id,
      userId: player.userId,
      
      firstName: player.user.firstName,
      lastName: player.user.lastName,
      displayName: player.user.displayName,
      avatar: player.user.avatar,
      nationality: player.user.nationality,
      dateOfBirth: player.user.dateOfBirth?.toISOString() || null,
      age: calculateAge(player.user.dateOfBirth),
      
      primaryPosition: player.primaryPosition,
      secondaryPosition: player.secondaryPosition,
      preferredFoot: player.preferredFoot,
      height: player.height,
      weight: player.weight,
      jerseyNumber: player.jerseyNumber,
      
      overallRating: player.overallRating,
      formRating: player.formRating,
      marketValue: player.marketValue,
      
      isActive: player.isActive,
      isVerified: player.isVerified,
      availabilityStatus: player.availabilityStatus,
      
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
      })),
      
      stats: filters.includeStats && player.aggregateStats ? {
        totalMatches: player.aggregateStats.totalMatches,
        totalGoals: player.aggregateStats.totalGoals,
        totalAssists: player.aggregateStats.totalAssists,
      } : null,
    }));

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Players listed`, {
      userId,
      total,
      returned: transformedPlayers.length,
      filters: {
        sport: filters.sport,
        position: filters.position,
        clubId: filters.clubId,
      },
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(
      {
        players: transformedPlayers,
      },
      {
        success: true,
        requestId,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasMore: offset + transformedPlayers.length < total,
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] GET /api/players error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch players',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Player (Admin Only)
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    const adminUserId = session.user.id;

    // 2. Check admin permissions
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { isSuperAdmin: true, roles: true },
    });

    const canCreate = adminUser?.isSuperAdmin || 
      adminUser?.roles.some(r => CREATE_ROLES.includes(r));

    if (!canCreate) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Only administrators can create player profiles',
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

    const validation = CreatePlayerSchema.safeParse(body);
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

    // 4. Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!targetUser) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'User not found',
        },
        requestId,
        status: 400,
      });
    }

    // 5. Check if player already exists
    const existingPlayer = await prisma.player.findUnique({
      where: { userId: data.userId },
    });

    if (existingPlayer) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Player profile already exists for this user',
        },
        requestId,
        status: 409,
      });
    }

    // 6. Create player
    const player = await prisma.player.create({
      data: {
        userId: data.userId,
        primaryPosition: data.primaryPosition || 'UTILITY',
        secondaryPosition: data.secondaryPosition,
        tertiaryPosition: data.tertiaryPosition,
        preferredFoot: data.preferredFoot,
        height: data.height,
        weight: data.weight,
        jerseyNumber: data.jerseyNumber,
        isActive: true,
        isVerified: false,
        hasCompletedProfile: false,
        availabilityStatus: 'AVAILABLE',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PLAYER_CREATED',
        resourceType: 'PLAYER',
        resourceId: player.id,
        afterState: {
          playerId: player.id,
          userId: data.userId,
          createdBy: adminUserId,
        },
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player created`, {
      playerId: player.id,
      userId: data.userId,
      createdBy: adminUserId,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(
      {
        id: player.id,
        userId: player.userId,
        name: `${player.user.firstName} ${player.user.lastName}`,
        primaryPosition: player.primaryPosition,
        createdAt: player.createdAt.toISOString(),
      },
      {
        success: true,
        requestId,
        status: 201,
      }
    );
  } catch (error) {
    console.error(`[${requestId}] POST /api/players error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to create player',
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