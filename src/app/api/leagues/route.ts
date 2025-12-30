// =============================================================================
// 🏆 LEAGUES API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/leagues - List leagues/competitions with filtering
// POST /api/leagues - Create new league/competition
// =============================================================================
// Schema: v7.8.0 | Model: Competition (League is legacy alias)
// Multi-Sport: ✅ All 12 sports supported
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Prisma,
  Sport,
  CompetitionType,
  CompetitionFormat,
  CompetitionStatus,
  AuditActionType,
} from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  pagination?: PaginationMeta;
  requestId: string;
  timestamp: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Sport-specific competition settings stored in Competition.settings JSON
 * This provides flexibility for different sports while maintaining type safety
 */
interface CompetitionSettings {
  // Points System
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  
  // Bonus Points (Rugby, Cricket)
  bonusPointsEnabled: boolean;
  bonusPointsConfig?: {
    tryBonus?: number;           // Rugby: 4+ tries
    losingBonus?: number;        // Rugby: lose by 7 or less
    battingBonus?: number;       // Cricket
    bowlingBonus?: number;       // Cricket
  };
  
  // Tiebreakers (ordered by priority)
  tiebreakers: string[];
  
  // Team Limits
  minTeams: number;
  maxTeams: number;
  squadSizeMin?: number;
  squadSizeMax?: number;
  
  // Registration
  registrationOpen: boolean;
  registrationDeadline?: string;
  entryFee?: number;
  entryCurrency?: string;
  
  // Match Rules
  matchDuration?: number;        // Sport-specific default
  extraTimeAllowed?: boolean;
  penaltyShootouts?: boolean;    // Football, Hockey
  goldenGoal?: boolean;
  silverGoal?: boolean;
  
  // Sport-Specific
  opiersPerInnings?: number;     // Cricket
  legsPerMatch?: number;         // Some formats
  setsPerMatch?: number;         // Tennis-style if needed
  
  // Display
  showGoalDifference: boolean;
  showForm: boolean;
  formMatchCount?: number;
}

// =============================================================================
// SPORT-SPECIFIC DEFAULT CONFIGURATIONS
// =============================================================================

const SPORT_DEFAULT_SETTINGS: Record<Sport, Partial<CompetitionSettings>> = {
  FOOTBALL: {
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    bonusPointsEnabled: false,
    tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD', 'AWAY_GOALS'],
    matchDuration: 90,
    extraTimeAllowed: true,
    penaltyShootouts: true,
    showGoalDifference: true,
    showForm: true,
    formMatchCount: 5,
  },
  FUTSAL: {
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    bonusPointsEnabled: false,
    tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD'],
    matchDuration: 40,
    extraTimeAllowed: true,
    penaltyShootouts: true,
    showGoalDifference: true,
    showForm: true,
  },
  BEACH_FOOTBALL: {
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    bonusPointsEnabled: false,
    tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR'],
    matchDuration: 36,
    extraTimeAllowed: true,
    penaltyShootouts: true,
    showGoalDifference: true,
    showForm: true,
  },
  RUGBY: {
    pointsForWin: 4,
    pointsForDraw: 2,
    pointsForLoss: 0,
    bonusPointsEnabled: true,
    bonusPointsConfig: {
      tryBonus: 1,      // 4+ tries
      losingBonus: 1,   // Lose by 7 or less
    },
    tiebreakers: ['POINTS_DIFFERENCE', 'TRIES_SCORED', 'HEAD_TO_HEAD'],
    matchDuration: 80,
    showGoalDifference: true,
    showForm: true,
  },
  CRICKET: {
    pointsForWin: 2,
    pointsForDraw: 1,
    pointsForLoss: 0,
    bonusPointsEnabled: true,
    bonusPointsConfig: {
      battingBonus: 1,
      bowlingBonus: 1,
    },
    tiebreakers: ['NET_RUN_RATE', 'HEAD_TO_HEAD', 'WINS'],
    opiersPerInnings: 50,
    showGoalDifference: false,
    showForm: true,
  },
  AMERICAN_FOOTBALL: {
    pointsForWin: 1,
    pointsForDraw: 0,
    pointsForLoss: 0,
    bonusPointsEnabled: false,
    tiebreakers: ['HEAD_TO_HEAD', 'DIVISION_RECORD', 'CONFERENCE_RECORD', 'POINT_DIFFERENTIAL'],
    matchDuration: 60,
    showGoalDifference: true,
    showForm: true,
  },
  BASKETBALL: {
    pointsForWin: 2,
    pointsForDraw: 0, // No draws in basketball
    pointsForLoss: 1,
    bonusPointsEnabled: false,
    tiebreakers: ['HEAD_TO_HEAD', 'POINT_DIFFERENTIAL', 'POINTS_FOR'],
    matchDuration: 48,
    extraTimeAllowed: true,
    showGoalDifference: true,
    showForm: true,
  },
  HOCKEY: {
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    bonusPointsEnabled: false,
    tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD'],
    matchDuration: 70,
    extraTimeAllowed: true,
    penaltyShootouts: true,
    showGoalDifference: true,
    showForm: true,
  },
  LACROSSE: {
    pointsForWin: 2,
    pointsForDraw: 1,
    pointsForLoss: 0,
    bonusPointsEnabled: false,
    tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD'],
    matchDuration: 60,
    showGoalDifference: true,
    showForm: true,
  },
  NETBALL: {
    pointsForWin: 2,
    pointsForDraw: 1,
    pointsForLoss: 0,
    bonusPointsEnabled: false,
    tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD'],
    matchDuration: 60,
    showGoalDifference: true,
    showForm: true,
  },
  AUSTRALIAN_RULES: {
    pointsForWin: 4,
    pointsForDraw: 2,
    pointsForLoss: 0,
    bonusPointsEnabled: false,
    tiebreakers: ['PERCENTAGE', 'POINTS_FOR', 'HEAD_TO_HEAD'],
    matchDuration: 80,
    showGoalDifference: false, // Uses percentage
    showForm: true,
  },
  GAELIC_FOOTBALL: {
    pointsForWin: 2,
    pointsForDraw: 1,
    pointsForLoss: 0,
    bonusPointsEnabled: false,
    tiebreakers: ['SCORE_DIFFERENCE', 'SCORES_FOR', 'HEAD_TO_HEAD'],
    matchDuration: 70,
    showGoalDifference: true,
    showForm: true,
  },
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  // Filters
  sport: z.nativeEnum(Sport).optional(),
  type: z.nativeEnum(CompetitionType).optional(),
  format: z.nativeEnum(CompetitionFormat).optional(),
  status: z.nativeEnum(CompetitionStatus).optional(),
  season: z.string().optional(),
  country: z.string().max(100).optional(),
  
  // Search
  search: z.string().max(200).optional(),
  
  // Ownership
  clubId: z.string().cuid().optional(),
  organisationId: z.string().cuid().optional(),
  createdBy: z.string().cuid().optional(),
  
  // Sorting
  sortBy: z.enum(['name', 'startDate', 'createdAt', 'totalTeams']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Flags
  includeArchived: z.coerce.boolean().default(false),
  registrationOpen: z.coerce.boolean().optional(),
});

const createLeagueSchema = z.object({
  // Required fields
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  sport: z.nativeEnum(Sport),
  type: z.nativeEnum(CompetitionType).default(CompetitionType.LEAGUE),
  
  // Optional identification
  shortName: z.string().max(50).optional(),
  slug: z.string().max(100).optional(), // Auto-generated if not provided
  
  // Context
  organisationId: z.string().cuid().optional(),
  clubId: z.string().cuid().optional(),
  season: z.string().max(50).optional(), // e.g., "2024-25" or "2024"
  
  // Details
  description: z.string().max(5000).optional(),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  
  // Format
  format: z.nativeEnum(CompetitionFormat).default(CompetitionFormat.ROUND_ROBIN),
  
  // Location
  country: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  
  // Dates
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  registrationDeadline: z.string().datetime().optional(),
  
  // Team Limits
  minTeams: z.number().int().min(2).default(2),
  maxTeams: z.number().int().min(2).max(256).default(20),
  
  // Visibility
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).default('PUBLIC'),
  
  // Settings overrides (will be merged with sport defaults)
  settings: z.object({
    pointsForWin: z.number().int().min(0).optional(),
    pointsForDraw: z.number().int().min(0).optional(),
    pointsForLoss: z.number().int().min(0).optional(),
    bonusPointsEnabled: z.boolean().optional(),
    bonusPointsConfig: z.record(z.number()).optional(),
    tiebreakers: z.array(z.string()).optional(),
    registrationOpen: z.boolean().optional(),
    entryFee: z.number().min(0).optional(),
    entryCurrency: z.string().length(3).optional(),
  }).optional(),
  
  // Rules (free-form text/JSON for competition rules)
  rules: z.record(z.unknown()).optional(),
  
  // Initial status
  status: z.nativeEnum(CompetitionStatus).default(CompetitionStatus.DRAFT),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `league_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
    error?: string;
    code?: string;
    pagination?: PaginationMeta;
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    requestId: options.requestId,
    timestamp: new Date().toISOString(),
  };

  if (options.success && data !== null) {
    response.data = data;
  }
  if (options.message) response.message = options.message;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;
  if (options.pagination) response.pagination = options.pagination;

  return NextResponse.json(response, { status: options.status || 200 });
}

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string, existingSlugs: string[]): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);

  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Check if user can create competitions
 */
async function hasLeagueCreationPermission(
  userId: string,
  organisationId?: string,
  clubId?: string
): Promise<boolean> {
  // Check super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, roles: true },
  });
  
  if (user?.isSuperAdmin) return true;
  if (user?.roles?.includes('LEAGUE_ADMIN')) return true;

  // Check organisation role
  if (organisationId) {
    const orgMember = await prisma.organisationMember.findFirst({
      where: {
        userId,
        organisationId,
        role: { in: ['OWNER', 'ADMIN', 'LEAGUE_MANAGER'] },
      },
    });
    if (orgMember) return true;
  }

  // Check club role
  if (clubId) {
    const clubMember = await prisma.clubMember.findFirst({
      where: {
        userId,
        clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    });
    if (clubMember) return true;
  }

  return false;
}

/**
 * Build competition settings by merging sport defaults with overrides
 */
function buildCompetitionSettings(
  sport: Sport,
  overrides?: Partial<CompetitionSettings>
): CompetitionSettings {
  const sportDefaults = SPORT_DEFAULT_SETTINGS[sport];
  
  const baseSettings: CompetitionSettings = {
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    bonusPointsEnabled: false,
    tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD'],
    minTeams: 2,
    maxTeams: 20,
    registrationOpen: true,
    showGoalDifference: true,
    showForm: true,
    formMatchCount: 5,
  };

  return {
    ...baseSettings,
    ...sportDefaults,
    ...overrides,
  };
}

// =============================================================================
// GET HANDLER - List Leagues/Competitions
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sport: searchParams.get('sport'),
      type: searchParams.get('type'),
      format: searchParams.get('format'),
      status: searchParams.get('status'),
      season: searchParams.get('season'),
      country: searchParams.get('country'),
      search: searchParams.get('search'),
      clubId: searchParams.get('clubId'),
      organisationId: searchParams.get('organisationId'),
      createdBy: searchParams.get('createdBy'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      includeArchived: searchParams.get('includeArchived'),
      registrationOpen: searchParams.get('registrationOpen'),
    });

    if (!queryResult.success) {
      return createResponse(null, {
        success: false,
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const {
      page,
      limit,
      sport,
      type,
      format,
      status,
      season,
      country,
      search,
      clubId,
      organisationId,
      createdBy,
      sortBy,
      sortOrder,
      includeArchived,
      registrationOpen,
    } = queryResult.data;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CompetitionWhereInput = {
      deletedAt: null,
    };

    // Filters
    if (sport) where.sport = sport;
    if (type) where.type = type;
    if (format) where.format = format;
    if (status) where.status = status;
    if (season) where.season = season;
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (clubId) where.clubId = clubId;
    if (organisationId) where.organisationId = organisationId;
    if (createdBy) where.createdBy = createdBy;

    // Archive filter
    if (!includeArchived) {
      where.status = { not: CompetitionStatus.ARCHIVED };
    }

    // Registration filter (check settings JSON)
    if (registrationOpen !== undefined) {
      where.settings = {
        path: ['registrationOpen'],
        equals: registrationOpen,
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.CompetitionOrderByWithRelationInput = {
      [sortBy === 'totalTeams' ? 'totalTeams' : sortBy]: sortOrder,
    };

    // Execute queries
    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        include: {
          club: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logo: true,
              sport: true,
            },
          },
          organisation: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              teams: true,
              matches: true,
              standings: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.competition.count({ where }),
    ]);

    // Format response
    const formattedLeagues = competitions.map((comp) => {
      const settings = (comp.settings as CompetitionSettings) || {};
      
      return {
        id: comp.id,
        name: comp.name,
        shortName: comp.shortName,
        slug: comp.slug,
        sport: comp.sport,
        type: comp.type,
        format: comp.format,
        status: comp.status,
        season: comp.season,
        country: comp.country,
        region: comp.region,
        description: comp.description,
        logo: comp.logo,
        
        // Legacy alias support
        code: comp.slug, // For legacy compatibility
        visibility: settings.registrationOpen ? 'PUBLIC' : 'PRIVATE',
        
        // Ownership
        club: comp.club,
        organisation: comp.organisation,
        admin: comp.creator
          ? {
              id: comp.creator.id,
              name: `${comp.creator.firstName} ${comp.creator.lastName}`,
              email: comp.creator.email,
            }
          : null,
        
        // Configuration (from settings JSON)
        configuration: {
          pointsWin: settings.pointsForWin ?? 3,
          pointsDraw: settings.pointsForDraw ?? 1,
          pointsLoss: settings.pointsForLoss ?? 0,
          minTeams: settings.minTeams ?? 2,
          maxTeams: settings.maxTeams ?? 20,
          bonusPointsEnabled: settings.bonusPointsEnabled ?? false,
          registrationOpen: settings.registrationOpen ?? true,
          tiebreakers: settings.tiebreakers ?? [],
        },
        
        // Statistics
        stats: {
          teamCount: comp._count.teams,
          matchCount: comp._count.matches,
          completedMatches: comp.completedMatches,
          totalGoals: comp.totalGoals,
          standingCount: comp._count.standings,
        },
        
        // Dates
        startDate: comp.startDate?.toISOString(),
        endDate: comp.endDate?.toISOString(),
        createdAt: comp.createdAt.toISOString(),
        updatedAt: comp.updatedAt.toISOString(),
      };
    });

    return createResponse(
      {
        leagues: formattedLeagues,
        sportDefaults: SPORT_DEFAULT_SETTINGS,
      },
      {
        success: true,
        message: `Retrieved ${formattedLeagues.length} leagues`,
        requestId,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Leagues GET error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch leagues',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create League/Competition
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

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

    // 2. Parse request body
    let body: unknown;
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

    // 3. Validate request body
    const validation = createLeagueSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 4. Check permissions
    const hasPermission = await hasLeagueCreationPermission(
      session.user.id,
      data.organisationId,
      data.clubId
    );

    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to create leagues',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 5. Validate organisation/club exists if provided
    if (data.organisationId) {
      const org = await prisma.organisation.findUnique({
        where: { id: data.organisationId },
        select: { id: true },
      });
      if (!org) {
        return createResponse(null, {
          success: false,
          error: 'Organisation not found',
          code: 'NOT_FOUND',
          requestId,
          status: 404,
        });
      }
    }

    if (data.clubId) {
      const club = await prisma.club.findUnique({
        where: { id: data.clubId },
        select: { id: true, sport: true },
      });
      if (!club) {
        return createResponse(null, {
          success: false,
          error: 'Club not found',
          code: 'NOT_FOUND',
          requestId,
          status: 404,
        });
      }
      // Validate sport matches club sport
      if (club.sport !== data.sport) {
        return createResponse(null, {
          success: false,
          error: `Club sport (${club.sport}) does not match league sport (${data.sport})`,
          code: 'SPORT_MISMATCH',
          requestId,
          status: 400,
        });
      }
    }

    // 6. Generate slug if not provided
    let slug = data.slug;
    if (!slug) {
      const existingComps = await prisma.competition.findMany({
        where: data.organisationId
          ? { organisationId: data.organisationId }
          : data.clubId
            ? { clubId: data.clubId }
            : {},
        select: { slug: true },
      });
      slug = generateSlug(data.name, existingComps.map((c) => c.slug));
    } else {
      // Check slug uniqueness
      const existingSlug = await prisma.competition.findFirst({
        where: { slug },
        select: { id: true },
      });
      if (existingSlug) {
        return createResponse(null, {
          success: false,
          error: 'Slug already in use',
          code: 'DUPLICATE_SLUG',
          requestId,
          status: 409,
        });
      }
    }

    // 7. Build settings with sport defaults
    const settings = buildCompetitionSettings(data.sport, {
      ...data.settings,
      minTeams: data.minTeams,
      maxTeams: data.maxTeams,
      registrationOpen: data.settings?.registrationOpen ?? true,
    });

    // 8. Create competition
    const competition = await prisma.competition.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        slug,
        sport: data.sport,
        type: data.type,
        format: data.format,
        status: data.status,
        season: data.season || new Date().getFullYear().toString(),
        country: data.country,
        region: data.region,
        description: data.description,
        logo: data.logo,
        banner: data.banner,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        organisationId: data.organisationId,
        clubId: data.clubId,
        createdBy: session.user.id,
        settings: settings as unknown as Prisma.JsonObject,
        rules: data.rules as Prisma.JsonObject || null,
        totalTeams: 0,
        totalMatches: 0,
        completedMatches: 0,
        totalGoals: 0,
      },
      include: {
        club: {
          select: { id: true, name: true, logo: true },
        },
        organisation: {
          select: { id: true, name: true, logo: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // 9. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'COMPETITION_CREATED' as AuditActionType,
        resourceType: 'COMPETITION',
        resourceId: competition.id,
        afterState: {
          name: competition.name,
          sport: competition.sport,
          type: competition.type,
          format: competition.format,
        },
      },
    }).catch((err) => {
      console.error(`[${requestId}] Audit log failed:`, err);
    });

    // 10. Format response
    const response = {
      id: competition.id,
      name: competition.name,
      shortName: competition.shortName,
      slug: competition.slug,
      code: competition.slug, // Legacy alias
      sport: competition.sport,
      type: competition.type,
      format: competition.format,
      status: competition.status,
      season: competition.season,
      country: competition.country,
      visibility: settings.registrationOpen ? 'PUBLIC' : 'PRIVATE',
      
      club: competition.club,
      organisation: competition.organisation,
      admin: competition.creator
        ? {
            id: competition.creator.id,
            name: `${competition.creator.firstName} ${competition.creator.lastName}`,
          }
        : null,
      
      configuration: {
        pointsWin: settings.pointsForWin,
        pointsDraw: settings.pointsForDraw,
        pointsLoss: settings.pointsForLoss,
        minTeams: settings.minTeams,
        maxTeams: settings.maxTeams,
        bonusPointsEnabled: settings.bonusPointsEnabled,
        registrationOpen: settings.registrationOpen,
        tiebreakers: settings.tiebreakers,
      },
      
      sportDefaults: SPORT_DEFAULT_SETTINGS[competition.sport],
      
      createdAt: competition.createdAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      message: `League "${competition.name}" created successfully`,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Leagues POST error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create league',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
