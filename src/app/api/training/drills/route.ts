// =============================================================================
// 🏋️ TRAINING DRILLS API - PitchConnect v7.9.0
// =============================================================================
// Enterprise-grade training drill library management
// Multi-sport support | DrillCategory enum | Schema-aligned
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Prisma,
  Sport,
  DrillCategory,
  DrillDifficulty,
  TrainingIntensity,
} from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface DrillResponse {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  duration: number;
  intensity: TrainingIntensity;
  minPlayers: number;
  maxPlayers: number;
  difficulty: DrillDifficulty;
  category: DrillCategory;
  sport: Sport;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  equipment: string[];
  objectives: string[];
  instructions: string | null;
  variations: string[];
  coachingPoints: string[];
  isPublic: boolean;
  isFeatured: boolean;
  usageCount: number;
  rating: number | null;
  createdBy: {
    id: string;
    name: string;
  } | null;
  club: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface DrillsListResponse {
  success: true;
  data: DrillResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    category: DrillCategory | null;
    intensity: TrainingIntensity | null;
    difficulty: DrillDifficulty | null;
    sport: Sport | null;
    search: string | null;
  };
  meta: {
    timestamp: string;
    requestId: string;
    availableCategories: { value: DrillCategory; label: string; sport: Sport | null }[];
  };
}

interface CreateDrillResponse {
  success: true;
  data: DrillResponse;
  message: string;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ListDrillsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.nativeEnum(DrillCategory).optional(),
  intensity: z.nativeEnum(TrainingIntensity).optional(),
  difficulty: z.nativeEnum(DrillDifficulty).optional(),
  sport: z.nativeEnum(Sport).optional(),
  search: z.string().min(1).max(100).optional(),
  clubId: z.string().optional(),
  includePublic: z.coerce.boolean().default(true),
  sortBy: z.enum(['name', 'createdAt', 'usageCount', 'rating', 'duration']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const CreateDrillSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(10).max(2000).optional(),
  shortDescription: z.string().max(200).optional(),
  duration: z.number().int().min(1).max(180, 'Duration cannot exceed 180 minutes'),
  intensity: z.nativeEnum(TrainingIntensity),
  minPlayers: z.number().int().min(1).max(50).default(1),
  maxPlayers: z.number().int().min(1).max(100).default(30),
  difficulty: z.nativeEnum(DrillDifficulty),
  category: z.nativeEnum(DrillCategory),
  sport: z.nativeEnum(Sport),
  videoUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  equipment: z.array(z.string().max(100)).max(20).default([]),
  objectives: z.array(z.string().max(200)).max(10).default([]),
  instructions: z.string().max(5000).optional(),
  variations: z.array(z.string().max(500)).max(10).default([]),
  coachingPoints: z.array(z.string().max(200)).max(10).default([]),
  isPublic: z.boolean().default(false),
  clubId: z.string().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
      meta: { timestamp: new Date().toISOString(), requestId },
    },
    { status, headers: { 'X-Request-ID': requestId } }
  );
}

/**
 * Get drill categories available for a sport
 */
function getCategoriesForSport(sport?: Sport): { value: DrillCategory; label: string; sport: Sport | null }[] {
  // Generic categories available for all sports
  const genericCategories: { value: DrillCategory; label: string; sport: Sport | null }[] = [
    { value: 'WARMUP', label: 'Warm Up', sport: null },
    { value: 'COOLDOWN', label: 'Cool Down', sport: null },
    { value: 'CONDITIONING', label: 'Conditioning', sport: null },
    { value: 'STRENGTH_POWER', label: 'Strength & Power', sport: null },
    { value: 'SPEED_AGILITY', label: 'Speed & Agility', sport: null },
    { value: 'FLEXIBILITY', label: 'Flexibility', sport: null },
    { value: 'RECOVERY', label: 'Recovery', sport: null },
    { value: 'TEAM_BUILDING', label: 'Team Building', sport: null },
    { value: 'TACTICAL', label: 'Tactical', sport: null },
    { value: 'MENTAL', label: 'Mental Training', sport: null },
  ];

  const sportSpecificCategories: Record<Sport, { value: DrillCategory; label: string }[]> = {
    FOOTBALL: [
      { value: 'PASSING', label: 'Passing' },
      { value: 'SHOOTING', label: 'Shooting' },
      { value: 'DEFENDING', label: 'Defending' },
      { value: 'POSSESSION', label: 'Possession' },
      { value: 'DRIBBLING', label: 'Dribbling' },
      { value: 'CROSSING', label: 'Crossing' },
      { value: 'HEADING', label: 'Heading' },
      { value: 'SET_PIECES', label: 'Set Pieces' },
      { value: 'GOALKEEPING', label: 'Goalkeeping' },
      { value: 'SMALL_SIDED_GAMES', label: 'Small-Sided Games' },
    ],
    RUGBY: [
      { value: 'PASSING', label: 'Passing' },
      { value: 'TACKLING', label: 'Tackling' },
      { value: 'SCRUMMAGING', label: 'Scrummaging' },
      { value: 'LINEOUT', label: 'Lineout' },
      { value: 'RUCKING', label: 'Rucking' },
      { value: 'MAULING', label: 'Mauling' },
      { value: 'KICKING', label: 'Kicking' },
      { value: 'EVASION', label: 'Evasion' },
      { value: 'CONTACT', label: 'Contact Skills' },
    ],
    BASKETBALL: [
      { value: 'SHOOTING', label: 'Shooting' },
      { value: 'DRIBBLING', label: 'Ball Handling' },
      { value: 'PASSING', label: 'Passing' },
      { value: 'DEFENDING', label: 'Defense' },
      { value: 'REBOUNDING', label: 'Rebounding' },
      { value: 'FREE_THROWS', label: 'Free Throws' },
      { value: 'PICK_AND_ROLL', label: 'Pick and Roll' },
      { value: 'ZONE_DEFENSE', label: 'Zone Defense' },
      { value: 'FAST_BREAK', label: 'Fast Break' },
    ],
    NETBALL: [
      { value: 'PASSING', label: 'Passing' },
      { value: 'SHOOTING', label: 'Shooting' },
      { value: 'DEFENDING', label: 'Defending' },
      { value: 'FOOTWORK', label: 'Footwork' },
      { value: 'MOVEMENT', label: 'Movement Patterns' },
      { value: 'CENTER_PASS', label: 'Center Pass' },
    ],
    CRICKET: [
      { value: 'BATTING_TECHNIQUE', label: 'Batting Technique' },
      { value: 'BOWLING_TECHNIQUE', label: 'Bowling Technique' },
      { value: 'WICKET_KEEPING', label: 'Wicket Keeping' },
      { value: 'FIELDING', label: 'Fielding' },
      { value: 'CATCHING', label: 'Catching' },
      { value: 'THROWING', label: 'Throwing' },
      { value: 'NET_PRACTICE', label: 'Net Practice' },
    ],
    AMERICAN_FOOTBALL: [
      { value: 'PASSING', label: 'Passing' },
      { value: 'RUSHING', label: 'Rushing' },
      { value: 'BLOCKING', label: 'Blocking' },
      { value: 'TACKLING', label: 'Tackling' },
      { value: 'ROUTE_RUNNING', label: 'Route Running' },
      { value: 'SPECIAL_TEAMS', label: 'Special Teams' },
      { value: 'COVERAGE', label: 'Coverage' },
    ],
    HOCKEY: [
      { value: 'STICK_HANDLING', label: 'Stick Handling' },
      { value: 'PASSING', label: 'Passing' },
      { value: 'SHOOTING', label: 'Shooting' },
      { value: 'DEFENDING', label: 'Defending' },
      { value: 'GOALKEEPING', label: 'Goalkeeping' },
      { value: 'FACE_OFFS', label: 'Face-Offs' },
    ],
    LACROSSE: [
      { value: 'PASSING', label: 'Passing' },
      { value: 'SHOOTING', label: 'Shooting' },
      { value: 'DEFENDING', label: 'Defending' },
      { value: 'GROUND_BALLS', label: 'Ground Balls' },
      { value: 'CRADLING', label: 'Cradling' },
    ],
    AUSTRALIAN_RULES: [
      { value: 'KICKING', label: 'Kicking' },
      { value: 'MARKING', label: 'Marking' },
      { value: 'HANDBALLING', label: 'Handballing' },
      { value: 'TACKLING', label: 'Tackling' },
      { value: 'RUCKING', label: 'Rucking' },
    ],
    GAELIC_FOOTBALL: [
      { value: 'KICKING', label: 'Kicking' },
      { value: 'CATCHING', label: 'Catching' },
      { value: 'SOLOING', label: 'Soloing' },
      { value: 'TACKLING', label: 'Tackling' },
      { value: 'FREE_TAKING', label: 'Free Taking' },
    ],
    FUTSAL: [
      { value: 'PASSING', label: 'Passing' },
      { value: 'SHOOTING', label: 'Shooting' },
      { value: 'DRIBBLING', label: 'Dribbling' },
      { value: 'DEFENDING', label: 'Defending' },
      { value: 'GOALKEEPING', label: 'Goalkeeping' },
    ],
    BEACH_FOOTBALL: [
      { value: 'PASSING', label: 'Passing' },
      { value: 'SHOOTING', label: 'Shooting' },
      { value: 'DRIBBLING', label: 'Dribbling' },
      { value: 'DEFENDING', label: 'Defending' },
      { value: 'GOALKEEPING', label: 'Goalkeeping' },
    ],
  };

  if (sport) {
    const sportCats = sportSpecificCategories[sport] || [];
    return [
      ...genericCategories,
      ...sportCats.map((c) => ({ ...c, sport })),
    ];
  }

  // Return all categories if no sport specified
  const allSportCats = Object.entries(sportSpecificCategories).flatMap(([s, cats]) =>
    cats.map((c) => ({ ...c, sport: s as Sport }))
  );

  return [...genericCategories, ...allSportCats];
}

// =============================================================================
// GET /api/training/drills
// List training drills with filters
// =============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<DrillsListResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      category: searchParams.get('category') || undefined,
      intensity: searchParams.get('intensity') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      sport: searchParams.get('sport') || undefined,
      search: searchParams.get('search') || undefined,
      clubId: searchParams.get('clubId') || undefined,
      includePublic: searchParams.get('includePublic') || 'true',
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    };

    const validatedParams = ListDrillsSchema.parse(queryParams);
    const {
      page,
      limit,
      category,
      intensity,
      difficulty,
      sport,
      search,
      clubId,
      includePublic,
      sortBy,
      sortOrder,
    } = validatedParams;
    const skip = (page - 1) * limit;

    // 3. Build where clause
    const where: Prisma.TrainingDrillWhereInput = {
      deletedAt: null,
    };

    // Access control: show public drills or drills from user's clubs
    if (clubId) {
      where.OR = [
        { clubId },
        ...(includePublic ? [{ isPublic: true }] : []),
      ];
    } else if (includePublic) {
      // Get user's clubs
      const userClubs = await prisma.clubMember.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { clubId: true },
      });
      const clubIds = userClubs.map((c) => c.clubId);

      where.OR = [
        { isPublic: true },
        { createdById: session.user.id },
        ...(clubIds.length > 0 ? [{ clubId: { in: clubIds } }] : []),
      ];
    }

    if (category) {
      where.category = category;
    }

    if (intensity) {
      where.intensity = intensity;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (sport) {
      where.sport = sport;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { shortDescription: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // 4. Get total count
    const total = await prisma.trainingDrill.count({ where });

    // 5. Fetch drills
    const drills = await prisma.trainingDrill.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 6. Format response
    const formattedDrills: DrillResponse[] = drills.map((drill) => ({
      id: drill.id,
      name: drill.name,
      description: drill.description,
      shortDescription: drill.shortDescription,
      duration: drill.duration,
      intensity: drill.intensity,
      minPlayers: drill.minPlayers,
      maxPlayers: drill.maxPlayers,
      difficulty: drill.difficulty,
      category: drill.category,
      sport: drill.sport,
      videoUrl: drill.videoUrl,
      thumbnailUrl: drill.thumbnailUrl,
      equipment: drill.equipment,
      objectives: drill.objectives,
      instructions: drill.instructions,
      variations: drill.variations,
      coachingPoints: drill.coachingPoints,
      isPublic: drill.isPublic,
      isFeatured: drill.isFeatured,
      usageCount: drill.usageCount,
      rating: drill.rating,
      createdBy: drill.createdBy
        ? {
            id: drill.createdBy.id,
            name: `${drill.createdBy.firstName} ${drill.createdBy.lastName}`,
          }
        : null,
      club: drill.club
        ? {
            id: drill.club.id,
            name: drill.club.name,
          }
        : null,
      createdAt: drill.createdAt.toISOString(),
      updatedAt: drill.updatedAt.toISOString(),
    }));

    // 7. Build response
    const totalPages = Math.ceil(total / limit);
    const availableCategories = getCategoriesForSport(sport);

    const response: DrillsListResponse = {
      success: true,
      data: formattedDrills,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        category: category || null,
        intensity: intensity || null,
        difficulty: difficulty || null,
        sport: sport || null,
        search: search || null,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        availableCategories,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/training/drills error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch drills', requestId, 500);
  }
}

// =============================================================================
// POST /api/training/drills
// Create a new training drill
// =============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateDrillResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = CreateDrillSchema.parse(body);

    // 3. Validate min/max players
    if (validatedData.maxPlayers < validatedData.minPlayers) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Maximum players cannot be less than minimum players',
        requestId,
        400
      );
    }

    // 4. If clubId provided, verify user is a member
    if (validatedData.clubId) {
      const membership = await prisma.clubMember.findFirst({
        where: {
          userId: session.user.id,
          clubId: validatedData.clubId,
          isActive: true,
          role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
        },
      });

      if (!membership) {
        return createErrorResponse(
          'FORBIDDEN',
          'You do not have permission to create drills for this club',
          requestId,
          403
        );
      }
    }

    // 5. Validate category is appropriate for sport
    const validCategories = getCategoriesForSport(validatedData.sport);
    const categoryValid = validCategories.some((c) => c.value === validatedData.category);

    if (!categoryValid) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Category "${validatedData.category}" is not valid for sport "${validatedData.sport}"`,
        requestId,
        400,
        {
          validCategories: validCategories.map((c) => c.value),
        }
      );
    }

    // 6. Create drill
    const drill = await prisma.trainingDrill.create({
      data: {
        name: validatedData.name.trim(),
        description: validatedData.description?.trim() || null,
        shortDescription: validatedData.shortDescription?.trim() || null,
        duration: validatedData.duration,
        intensity: validatedData.intensity,
        minPlayers: validatedData.minPlayers,
        maxPlayers: validatedData.maxPlayers,
        difficulty: validatedData.difficulty,
        category: validatedData.category,
        sport: validatedData.sport,
        videoUrl: validatedData.videoUrl || null,
        thumbnailUrl: validatedData.thumbnailUrl || null,
        equipment: validatedData.equipment,
        objectives: validatedData.objectives,
        instructions: validatedData.instructions?.trim() || null,
        variations: validatedData.variations,
        coachingPoints: validatedData.coachingPoints,
        isPublic: validatedData.isPublic,
        createdById: session.user.id,
        clubId: validatedData.clubId || null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DRILL_CREATED',
        resourceType: 'TrainingDrill',
        resourceId: drill.id,
        details: {
          drillName: drill.name,
          category: drill.category,
          sport: drill.sport,
          difficulty: drill.difficulty,
          isPublic: drill.isPublic,
          clubId: drill.clubId,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 8. Format response
    const formattedDrill: DrillResponse = {
      id: drill.id,
      name: drill.name,
      description: drill.description,
      shortDescription: drill.shortDescription,
      duration: drill.duration,
      intensity: drill.intensity,
      minPlayers: drill.minPlayers,
      maxPlayers: drill.maxPlayers,
      difficulty: drill.difficulty,
      category: drill.category,
      sport: drill.sport,
      videoUrl: drill.videoUrl,
      thumbnailUrl: drill.thumbnailUrl,
      equipment: drill.equipment,
      objectives: drill.objectives,
      instructions: drill.instructions,
      variations: drill.variations,
      coachingPoints: drill.coachingPoints,
      isPublic: drill.isPublic,
      isFeatured: drill.isFeatured,
      usageCount: drill.usageCount,
      rating: drill.rating,
      createdBy: drill.createdBy
        ? {
            id: drill.createdBy.id,
            name: `${drill.createdBy.firstName} ${drill.createdBy.lastName}`,
          }
        : null,
      club: drill.club
        ? {
            id: drill.club.id,
            name: drill.club.name,
          }
        : null,
      createdAt: drill.createdAt.toISOString(),
      updatedAt: drill.updatedAt.toISOString(),
    };

    const response: CreateDrillResponse = {
      success: true,
      data: formattedDrill,
      message: `Drill "${drill.name}" created successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(response, {
      status: 201,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/training/drills error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to create drill', requestId, 500);
  }
}
