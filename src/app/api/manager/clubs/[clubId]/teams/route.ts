// =============================================================================
// 🏆 TEAMS API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/manager/clubs/[clubId]/teams
// POST /api/manager/clubs/[clubId]/teams
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Model: Team with TeamPlayer relation (NOT PlayerTeam)
// Permission: Owner, Manager, Head Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, TeamStatus, Sport } from '@prisma/client';

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
  };
}

interface TeamItem {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  ageGroup: string | null;
  gender: string | null;
  status: TeamStatus;
  playerCount: number;
  activePlayerCount: number;
  upcomingMatches: number;
  upcomingTraining: number;
  defaultFormation: string | null;
  acceptingJoinRequests: boolean;
  createdAt: string;
}

interface TeamsListResponse {
  teams: TeamItem[];
  summary: {
    total: number;
    active: number;
    inactive: number;
    totalPlayers: number;
  };
  clubSport: Sport;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  logo: z.string().url().optional(),
  ageGroup: z.string().max(50).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).optional(),
  minPlayers: z.number().int().min(1).max(50).optional(),
  maxPlayers: z.number().int().min(1).max(100).optional(),
  defaultFormation: z.string().optional(),
  acceptingJoinRequests: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const MANAGE_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

const VIEW_ROLES: ClubMemberRole[] = [
  ...MANAGE_ROLES,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
  ClubMemberRole.STAFF,
];

async function getPermissions(
  userId: string,
  clubId: string
): Promise<{ canView: boolean; canCreate: boolean; role: ClubMemberRole | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    return { canView: true, canCreate: true, role: ClubMemberRole.OWNER };
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
    return { canView: false, canCreate: false, role: null };
  }

  return {
    canView: VIEW_ROLES.includes(clubMember.role),
    canCreate: MANAGE_ROLES.includes(clubMember.role),
    role: clubMember.role,
  };
}

// =============================================================================
// GET HANDLER - List Teams
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId } = params;

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
    if (!permissions.canView) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view teams',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
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

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TeamStatus | null;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // 5. Build where clause
    const where: Record<string, unknown> = {
      clubId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    } else if (!includeInactive) {
      where.status = TeamStatus.ACTIVE;
    }

    // 6. Fetch teams with player counts using Prisma (NOT raw SQL)
    const teams = await prisma.team.findMany({
      where,
      include: {
        players: {
          select: {
            id: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            homeMatches: {
              where: {
                status: 'SCHEDULED',
                kickOffTime: { gte: new Date() },
              },
            },
            trainingSessions: {
              where: {
                status: 'SCHEDULED',
                startTime: { gte: new Date() },
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 7. Transform response
    const teamItems: TeamItem[] = teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      logo: team.logo,
      ageGroup: team.ageGroup,
      gender: team.gender,
      status: team.status,
      playerCount: team.players.length,
      activePlayerCount: team.players.filter((p) => p.isActive).length,
      upcomingMatches: team._count.homeMatches,
      upcomingTraining: team._count.trainingSessions,
      defaultFormation: team.defaultFormation,
      acceptingJoinRequests: team.acceptingJoinRequests,
      createdAt: team.createdAt.toISOString(),
    }));

    // 8. Calculate summary
    const totalPlayers = teams.reduce((sum, t) => sum + t.players.length, 0);
    const activeTeams = teams.filter((t) => t.status === TeamStatus.ACTIVE).length;
    const inactiveTeams = teams.filter((t) => t.status !== TeamStatus.ACTIVE).length;

    const response: TeamsListResponse = {
      teams: teamItems,
      summary: {
        total: teams.length,
        active: activeTeams,
        inactive: inactiveTeams,
        totalPlayers,
      },
      clubSport: club.sport,
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] List Teams error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch teams',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Team
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId } = params;

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
    if (!permissions.canCreate) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to create teams',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, sport: true },
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

    // 4. Parse and validate body
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

    const validation = CreateTeamSchema.safeParse(body);
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

    // 5. Validate min/max players
    if (data.minPlayers && data.maxPlayers && data.minPlayers > data.maxPlayers) {
      return createResponse(null, {
        success: false,
        error: 'Minimum players cannot exceed maximum players',
        code: 'INVALID_PLAYER_LIMITS',
        requestId,
        status: 400,
      });
    }

    // 6. Check for duplicate team name in club
    const existingTeam = await prisma.team.findFirst({
      where: {
        clubId,
        name: data.name,
        deletedAt: null,
      },
    });

    if (existingTeam) {
      return createResponse(null, {
        success: false,
        error: `A team named "${data.name}" already exists in this club`,
        code: 'DUPLICATE_TEAM_NAME',
        requestId,
        status: 409,
      });
    }

    // 7. Create team
    const team = await prisma.team.create({
      data: {
        clubId,
        name: data.name,
        description: data.description || null,
        logo: data.logo || null,
        ageGroup: data.ageGroup || null,
        gender: data.gender || null,
        minPlayers: data.minPlayers || null,
        maxPlayers: data.maxPlayers || null,
        defaultFormation: data.defaultFormation || null,
        acceptingJoinRequests: data.acceptingJoinRequests,
        requiresApproval: data.requiresApproval,
        status: TeamStatus.ACTIVE,
      },
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_CREATED',
        resourceType: 'TEAM',
        resourceId: team.id,
        afterState: {
          name: team.name,
          clubId: team.clubId,
          sport: club.sport,
        },
      },
    });

    // 9. Return response
    return createResponse({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        logo: team.logo,
        ageGroup: team.ageGroup,
        gender: team.gender,
        status: team.status,
        playerCount: 0,
        activePlayerCount: 0,
        upcomingMatches: 0,
        upcomingTraining: 0,
        defaultFormation: team.defaultFormation,
        acceptingJoinRequests: team.acceptingJoinRequests,
        createdAt: team.createdAt.toISOString(),
      },
      clubSport: club.sport,
    }, {
      success: true,
      message: 'Team created successfully',
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Create Team error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create team',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}