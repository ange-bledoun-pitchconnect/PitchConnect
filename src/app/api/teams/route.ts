// =============================================================================
// 🏟️ TEAMS API - PitchConnect v7.9.0
// =============================================================================
// Enterprise-grade teams listing and creation
// Multi-sport support | Full filtering | Schema-aligned
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, Sport, TeamType, TeamStatus, FormationType } from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface TeamListItem {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  description: string | null;
  logo: string | null;
  badge: string | null;
  type: TeamType;
  status: TeamStatus;
  sport: Sport;
  ageGroup: string | null;
  gender: string;
  colors: {
    primary: string | null;
    secondary: string | null;
  };
  maxPlayers: number;
  activePlayers: number;
  availableSlots: number;
  registrationOpen: boolean;
  isActive: boolean;
  club: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    city: string | null;
    country: string | null;
  };
  stats: {
    coachCount: number;
    competitionCount: number;
    matchesPlayed: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface TeamsListResponse {
  success: true;
  data: TeamListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    clubId: string | null;
    sport: Sport | null;
    status: TeamStatus | null;
    type: TeamType | null;
    search: string | null;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface CreateTeamResponse {
  success: true;
  data: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
    sport: Sport;
    type: TeamType;
    status: TeamStatus;
    club: {
      id: string;
      name: string;
    };
  };
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

const ListTeamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  clubId: z.string().optional(),
  sport: z.nativeEnum(Sport).optional(),
  status: z.nativeEnum(TeamStatus).optional(),
  type: z.nativeEnum(TeamType).optional(),
  ageGroup: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).optional(),
  search: z.string().min(1).max(100).optional(),
  registrationOpen: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'createdAt', 'activePlayers', 'sport']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const CreateTeamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  shortName: z.string().min(2).max(50).optional(),
  description: z.string().max(2000).optional(),
  clubId: z.string().min(1, 'Club ID is required'),
  sport: z.nativeEnum(Sport),
  type: z.nativeEnum(TeamType).default('SENIOR'),
  ageGroup: z.string().max(50).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).default('MIXED'),
  logo: z.string().url().optional(),
  badge: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  formation: z.nativeEnum(FormationType).optional(),
  maxPlayers: z.number().int().min(5).max(100).default(30),
  homeVenueId: z.string().optional(),
  registrationOpen: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  inviteOnly: z.boolean().default(false),
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

function generateSlug(name: string, clubId: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const uniqueSuffix = clubId.substring(0, 6);
  return `${baseSlug}-${uniqueSuffix}`;
}

async function canCreateTeam(
  userId: string,
  clubId: string
): Promise<{ canCreate: boolean; role: string | null }> {
  // Check if superadmin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === 'SUPERADMIN') {
    return { canCreate: true, role: 'SUPERADMIN' };
  }

  // Check club membership
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER'] },
    },
  });

  if (membership) {
    return { canCreate: true, role: membership.role };
  }

  // Check if club owner
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { ownerId: true },
  });

  if (club?.ownerId === userId) {
    return { canCreate: true, role: 'CLUB_OWNER' };
  }

  return { canCreate: false, role: null };
}

// =============================================================================
// GET /api/teams
// List teams with advanced filtering
// =============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<TeamsListResponse | ErrorResponse>> {
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
      limit: searchParams.get('limit') || '25',
      clubId: searchParams.get('clubId') || undefined,
      sport: searchParams.get('sport') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      ageGroup: searchParams.get('ageGroup') || undefined,
      gender: searchParams.get('gender') || undefined,
      search: searchParams.get('search') || undefined,
      registrationOpen: searchParams.get('registrationOpen') || undefined,
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    };

    const validatedParams = ListTeamsSchema.parse(queryParams);
    const {
      page,
      limit,
      clubId,
      sport,
      status,
      type,
      ageGroup,
      gender,
      search,
      registrationOpen,
      sortBy,
      sortOrder,
    } = validatedParams;
    const skip = (page - 1) * limit;

    // 3. Build where clause
    const where: Prisma.TeamWhereInput = {
      deletedAt: null,
    };

    if (clubId) {
      where.clubId = clubId;
    }

    if (sport) {
      where.sport = sport;
    }

    if (status) {
      where.status = status;
    } else {
      // Default: exclude archived teams
      where.status = { not: 'ARCHIVED' };
    }

    if (type) {
      where.type = type;
    }

    if (ageGroup) {
      where.ageGroup = { contains: ageGroup, mode: 'insensitive' };
    }

    if (gender) {
      where.gender = gender;
    }

    if (registrationOpen !== undefined) {
      where.registrationOpen = registrationOpen;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { club: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // 4. Get total count
    const total = await prisma.team.count({ where });

    // 5. Fetch teams
    const teams = await prisma.team.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            city: true,
            country: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        _count: {
          select: {
            coachAssignments: { where: { isActive: true } },
            competitionTeams: { where: { isActive: true, isWithdrawn: false } },
            homeMatches: { where: { status: 'COMPLETED', deletedAt: null } },
            awayMatches: { where: { status: 'COMPLETED', deletedAt: null } },
          },
        },
      },
    });

    // 6. Format response
    const formattedTeams: TeamListItem[] = teams.map((team) => ({
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      slug: team.slug,
      description: team.description,
      logo: team.logo,
      badge: team.badge,
      type: team.type,
      status: team.status,
      sport: team.sport,
      ageGroup: team.ageGroup,
      gender: team.gender,
      colors: {
        primary: team.primaryColor || team.club.primaryColor,
        secondary: team.secondaryColor || team.club.secondaryColor,
      },
      maxPlayers: team.maxPlayers,
      activePlayers: team.activePlayers,
      availableSlots: Math.max(0, team.maxPlayers - team.activePlayers),
      registrationOpen: team.registrationOpen,
      isActive: team.isActive,
      club: {
        id: team.club.id,
        name: team.club.name,
        shortName: team.club.shortName,
        logo: team.club.logo,
        city: team.club.city,
        country: team.club.country,
      },
      stats: {
        coachCount: team._count.coachAssignments,
        competitionCount: team._count.competitionTeams,
        matchesPlayed: team._count.homeMatches + team._count.awayMatches,
      },
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    }));

    // 7. Build response
    const totalPages = Math.ceil(total / limit);

    const response: TeamsListResponse = {
      success: true,
      data: formattedTeams,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        clubId: clubId || null,
        sport: sport || null,
        status: status || null,
        type: type || null,
        search: search || null,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/teams error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch teams', requestId, 500);
  }
}

// =============================================================================
// POST /api/teams
// Create a new team
// =============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateTeamResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = CreateTeamSchema.parse(body);

    // 3. Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: validatedData.clubId, deletedAt: null },
      select: {
        id: true,
        name: true,
        shortName: true,
        sport: true,
        ownerId: true,
        primaryColor: true,
        secondaryColor: true,
        maxTeams: true,
        _count: {
          select: { teams: { where: { deletedAt: null } } },
        },
      },
    });

    if (!club) {
      return createErrorResponse('CLUB_NOT_FOUND', 'Club not found', requestId, 404);
    }

    // 4. Authorization
    const { canCreate, role } = await canCreateTeam(session.user.id, validatedData.clubId);

    if (!canCreate) {
      return createErrorResponse(
        'FORBIDDEN',
        'You do not have permission to create teams for this club',
        requestId,
        403
      );
    }

    // 5. Validate sport matches club sport (if club has a primary sport)
    if (club.sport && club.sport !== validatedData.sport) {
      return createErrorResponse(
        'SPORT_MISMATCH',
        `Team sport must match club's primary sport (${club.sport})`,
        requestId,
        400
      );
    }

    // 6. Check team limit for club
    if (club.maxTeams && club._count.teams >= club.maxTeams) {
      return createErrorResponse(
        'TEAM_LIMIT_REACHED',
        `Club has reached maximum team limit of ${club.maxTeams}`,
        requestId,
        409
      );
    }

    // 7. Generate unique slug
    let slug = generateSlug(validatedData.name, validatedData.clubId);
    const existingSlug = await prisma.team.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 8. Check for duplicate name within club
    const existingTeam = await prisma.team.findFirst({
      where: {
        clubId: validatedData.clubId,
        name: { equals: validatedData.name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existingTeam) {
      return createErrorResponse(
        'DUPLICATE_NAME',
        `A team named "${validatedData.name}" already exists in this club`,
        requestId,
        409
      );
    }

    // 9. Validate venue if provided
    if (validatedData.homeVenueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: validatedData.homeVenueId },
        select: { id: true, clubId: true },
      });

      if (!venue) {
        return createErrorResponse('VENUE_NOT_FOUND', 'Home venue not found', requestId, 404);
      }

      // Venue should belong to the same club or be publicly available
      if (venue.clubId && venue.clubId !== validatedData.clubId) {
        return createErrorResponse(
          'INVALID_VENUE',
          'Home venue must belong to the same club',
          requestId,
          400
        );
      }
    }

    // 10. Create team
    const team = await prisma.team.create({
      data: {
        name: validatedData.name.trim(),
        shortName: validatedData.shortName?.trim() || null,
        slug,
        description: validatedData.description?.trim() || null,
        clubId: validatedData.clubId,
        sport: validatedData.sport,
        type: validatedData.type,
        ageGroup: validatedData.ageGroup?.trim() || null,
        gender: validatedData.gender,
        logo: validatedData.logo || null,
        badge: validatedData.badge || null,
        primaryColor: validatedData.primaryColor || club.primaryColor,
        secondaryColor: validatedData.secondaryColor || club.secondaryColor,
        formation: validatedData.formation || null,
        maxPlayers: validatedData.maxPlayers,
        homeVenueId: validatedData.homeVenueId || null,
        registrationOpen: validatedData.registrationOpen,
        requiresApproval: validatedData.requiresApproval,
        inviteOnly: validatedData.inviteOnly,
        status: 'ACTIVE',
        isActive: true,
        activePlayers: 0,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 11. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_CREATED',
        resourceType: 'Team',
        resourceId: team.id,
        details: {
          teamName: team.name,
          clubId: club.id,
          clubName: club.name,
          sport: team.sport,
          type: team.type,
          createdBy: role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 12. Build response
    const response: CreateTeamResponse = {
      success: true,
      data: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        slug: team.slug,
        sport: team.sport,
        type: team.type,
        status: team.status,
        club: {
          id: team.club.id,
          name: team.club.name,
        },
      },
      message: `Team "${team.name}" created successfully`,
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
    console.error(`[${requestId}] POST /api/teams error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to create team', requestId, 500);
  }
}
