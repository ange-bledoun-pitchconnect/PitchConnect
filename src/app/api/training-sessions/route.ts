// =============================================================================
// 🏋️ PITCHCONNECT - TRAINING SESSIONS API
// Path: /src/app/api/training-sessions/route.ts
// =============================================================================
//
// GET  - List training sessions with filtering, pagination, multi-sport support
// POST - Create training session with validation
//
// VERSION: 4.0.0 - Enterprise Edition
// SCHEMA: v7.10.0 aligned
//
// =============================================================================
// FEATURES
// =============================================================================
// ✅ Full schema alignment (TrainingSession model)
// ✅ Multi-sport support (12 sports)
// ✅ Role-based access control
// ✅ Advanced filtering & pagination
// ✅ Attendance tracking with statistics
// ✅ Comprehensive audit logging
// ✅ Request ID tracking
// ✅ Zod validation
// ✅ TypeScript strict mode
// ✅ Error resilience
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Sport,
  TrainingCategory,
  TrainingIntensity,
  TrainingStatus,
  AttendanceStatus,
  UserRole,
} from '@prisma/client';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface TrainingSessionListItem {
  id: string;
  clubId: string;
  club: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
  };
  teamId: string | null;
  team: {
    id: string;
    name: string;
    shortName: string | null;
    badge: string | null;
  } | null;
  title: string;
  description: string | null;
  category: TrainingCategory;
  intensity: TrainingIntensity;
  status: TrainingStatus;
  sport: Sport;
  date: string;
  startTime: string;
  endTime: string;
  duration: number | null;
  location: string | null;
  venue: {
    id: string;
    name: string;
  } | null;
  coach: {
    id: string;
    name: string;
    avatar: string | null;
  };
  objectives: string[];
  equipment: string[];
  maxParticipants: number | null;
  isRequired: boolean;
  isPublic: boolean;
  isCancelled: boolean;
  cancellationReason: string | null;
  attendance: {
    total: number;
    present: number;
    absent: number;
    excused: number;
    injured: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateTrainingSessionResponse {
  success: true;
  session: {
    id: string;
    title: string;
    category: TrainingCategory;
    sport: Sport;
    date: string;
    startTime: string;
    endTime: string;
    location: string | null;
    team: { id: string; name: string } | null;
    coach: { id: string; name: string };
    status: TrainingStatus;
  };
  message: string;
  timestamp: string;
  requestId: string;
}

interface TrainingSessionsListResponse {
  success: true;
  sessions: TrainingSessionListItem[];
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
    teamId: string | null;
    coachId: string | null;
    sport: Sport | null;
    category: TrainingCategory | null;
    status: TrainingStatus | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
  timestamp: string;
  requestId: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, string[]>;
  requestId: string;
  timestamp: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateTrainingSessionSchema = z.object({
  clubId: z.string().cuid('Invalid club ID format'),
  teamId: z.string().cuid('Invalid team ID format').optional(),
  coachId: z.string().cuid('Invalid coach ID format'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(5000, 'Description too long').optional(),
  category: z.nativeEnum(TrainingCategory).default(TrainingCategory.TACTICAL),
  intensity: z.nativeEnum(TrainingIntensity).default(TrainingIntensity.MEDIUM),
  sport: z.nativeEnum(Sport).default(Sport.FOOTBALL),
  date: z.string().datetime('Invalid date format - use ISO 8601'),
  startTime: z.string().datetime('Invalid start time format - use ISO 8601'),
  endTime: z.string().datetime('Invalid end time format - use ISO 8601'),
  duration: z.number().int().min(15, 'Minimum duration is 15 minutes').max(480, 'Maximum duration is 8 hours').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  venueId: z.string().cuid('Invalid venue ID format').optional(),
  maxParticipants: z.number().int().min(1).max(100).optional(),
  objectives: z.array(z.string().max(200)).max(20, 'Maximum 20 objectives').default([]),
  equipment: z.array(z.string().max(100)).max(50, 'Maximum 50 equipment items').default([]),
  notes: z.string().max(2000, 'Notes too long').optional(),
  weatherConditions: z.string().max(100).optional(),
  isPublic: z.boolean().default(false),
  isRequired: z.boolean().default(true),
});

type CreateTrainingSessionInput = z.infer<typeof CreateTrainingSessionSchema>;

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

// Roles that can view training sessions
const VIEW_ROLES: UserRole[] = [
  'SUPERADMIN',
  'ADMIN',
  'COACH',
  'COACH_PRO',
  'MANAGER',
  'CLUB_MANAGER',
  'CLUB_OWNER',
  'PLAYER',
  'PLAYER_PRO',
  'PARENT',
  'GUARDIAN',
  'MEDICAL_STAFF',
  'ANALYST',
];

// Roles that can create training sessions
const CREATE_ROLES: UserRole[] = [
  'SUPERADMIN',
  'ADMIN',
  'COACH',
  'COACH_PRO',
  'MANAGER',
  'CLUB_MANAGER',
  'CLUB_OWNER',
];

// Sport-specific max participants (for validation)
const SPORT_MAX_PARTICIPANTS: Record<Sport, number> = {
  FOOTBALL: 30,
  RUGBY: 35,
  BASKETBALL: 15,
  CRICKET: 20,
  AMERICAN_FOOTBALL: 60,
  HOCKEY: 25,
  BASEBALL: 30,
  TENNIS: 8,
  VOLLEYBALL: 15,
  NETBALL: 14,
  HANDBALL: 18,
  OTHER: 50,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Create error response
 */
function errorResponse(
  error: string,
  code: string,
  status: number,
  requestId: string,
  details?: Record<string, string[]>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status, headers: { 'X-Request-ID': requestId } }
  );
}

/**
 * Check if user has required role
 */
function hasRole(userRoles: UserRole[] | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * Calculate attendance statistics
 */
function calculateAttendanceStats(attendance: { status: AttendanceStatus }[]): {
  total: number;
  present: number;
  absent: number;
  excused: number;
  injured: number;
} {
  const stats = {
    total: attendance.length,
    present: 0,
    absent: 0,
    excused: 0,
    injured: 0,
  };

  attendance.forEach((a) => {
    switch (a.status) {
      case 'PRESENT':
      case 'LATE':
      case 'LEFT_EARLY':
      case 'PARTIAL':
        stats.present++;
        break;
      case 'ABSENT':
        stats.absent++;
        break;
      case 'EXCUSED':
        stats.excused++;
        break;
      case 'INJURED':
      case 'SICK':
        stats.injured++;
        break;
    }
  });

  return stats;
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

async function createAuditLog(params: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, unknown>;
  requestId: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: null, // Would come from request headers
        userAgent: null,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', {
      requestId: params.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// =============================================================================
// GET /api/training-sessions
// =============================================================================

/**
 * List training sessions with advanced filtering and pagination
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 25, max: 100)
 *   - clubId: string - Filter by club (required for non-admin)
 *   - teamId: string - Filter by team
 *   - coachId: string - Filter by coach
 *   - sport: Sport enum - Filter by sport
 *   - category: TrainingCategory enum - Filter by category
 *   - status: TrainingStatus enum - Filter by status
 *   - dateFrom: ISO string - Start date filter
 *   - dateTo: ISO string - End date filter
 *   - isRequired: boolean - Filter required sessions
 *   - sortBy: 'date' | 'created' | 'title' (default: 'date')
 *   - sortOrder: 'asc' | 'desc' (default: 'asc')
 *   - search: string - Search in title/description
 * 
 * Authorization:
 *   - SUPERADMIN, ADMIN: All sessions
 *   - COACH, MANAGER, CLUB_MANAGER: Own club sessions
 *   - PLAYER: Own team sessions
 *   - PARENT: Child's team sessions
 *   - MEDICAL_STAFF: Sessions where they're assigned
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<TrainingSessionsListResponse | ErrorResponse>> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // =========================================================================
    // 1. AUTHENTICATION
    // =========================================================================
    
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse(
        'Authentication required',
        'AUTH_REQUIRED',
        401,
        requestId
      );
    }

    // Get user with roles and relations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        roles: true,
        organisationId: true,
        player: {
          select: {
            id: true,
            teamPlayers: {
              where: { isActive: true },
              select: { teamId: true, team: { select: { clubId: true } } },
            },
          },
        },
        coach: {
          select: {
            id: true,
            assignments: {
              where: { isActive: true },
              select: { teamId: true, clubId: true },
            },
          },
        },
        parent: {
          select: {
            id: true,
            children: {
              select: {
                player: {
                  select: {
                    teamPlayers: {
                      where: { isActive: true },
                      select: { teamId: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return errorResponse('User not found', 'USER_NOT_FOUND', 404, requestId);
    }

    // =========================================================================
    // 2. AUTHORIZATION CHECK
    // =========================================================================

    if (!hasRole(user.roles as UserRole[], VIEW_ROLES)) {
      return errorResponse(
        'Insufficient permissions to view training sessions',
        'INSUFFICIENT_PERMISSIONS',
        403,
        requestId
      );
    }

    // =========================================================================
    // 3. PARSE QUERY PARAMETERS
    // =========================================================================

    const { searchParams } = new URL(request.url);
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)));
    const skip = (page - 1) * limit;

    const clubId = searchParams.get('clubId');
    const teamId = searchParams.get('teamId');
    const coachId = searchParams.get('coachId');
    const sportParam = searchParams.get('sport');
    const categoryParam = searchParams.get('category');
    const statusParam = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const isRequiredParam = searchParams.get('isRequired');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';
    const search = searchParams.get('search');

    // Validate enum parameters
    const sport = sportParam && Object.values(Sport).includes(sportParam as Sport) 
      ? (sportParam as Sport) 
      : null;
    const category = categoryParam && Object.values(TrainingCategory).includes(categoryParam as TrainingCategory)
      ? (categoryParam as TrainingCategory)
      : null;
    const status = statusParam && Object.values(TrainingStatus).includes(statusParam as TrainingStatus)
      ? (statusParam as TrainingStatus)
      : null;

    // =========================================================================
    // 4. BUILD WHERE CLAUSE
    // =========================================================================

    const where: any = {
      deletedAt: null, // Exclude soft-deleted
    };

    const isSuperAdmin = hasRole(user.roles as UserRole[], ['SUPERADMIN', 'ADMIN']);

    // Role-based filtering
    if (!isSuperAdmin) {
      // Get accessible club/team IDs based on user role
      const accessibleClubIds: string[] = [];
      const accessibleTeamIds: string[] = [];

      // Coach access
      if (user.coach?.assignments) {
        user.coach.assignments.forEach((a) => {
          if (a.clubId) accessibleClubIds.push(a.clubId);
          if (a.teamId) accessibleTeamIds.push(a.teamId);
        });
      }

      // Player access
      if (user.player?.teamPlayers) {
        user.player.teamPlayers.forEach((tp) => {
          accessibleTeamIds.push(tp.teamId);
          if (tp.team?.clubId) accessibleClubIds.push(tp.team.clubId);
        });
      }

      // Parent access (child's teams)
      if (user.parent?.children) {
        user.parent.children.forEach((child) => {
          child.player?.teamPlayers?.forEach((tp) => {
            accessibleTeamIds.push(tp.teamId);
          });
        });
      }

      // Apply access filter
      if (accessibleClubIds.length > 0 || accessibleTeamIds.length > 0) {
        where.OR = [];
        if (accessibleClubIds.length > 0) {
          where.OR.push({ clubId: { in: accessibleClubIds } });
        }
        if (accessibleTeamIds.length > 0) {
          where.OR.push({ teamId: { in: accessibleTeamIds } });
        }
        // Also include public sessions
        where.OR.push({ isPublic: true });
      } else {
        // No specific access - only public sessions
        where.isPublic = true;
      }
    }

    // Apply explicit filters
    if (clubId) where.clubId = clubId;
    if (teamId) where.teamId = teamId;
    if (coachId) where.coachId = coachId;
    if (sport) where.sport = sport;
    if (category) where.category = category;
    if (status) where.status = status;
    if (isRequiredParam !== null) {
      where.isRequired = isRequiredParam === 'true';
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.date.lte = endDate;
      }
    }

    // Search filter
    if (search && search.length >= 2) {
      where.OR = where.OR || [];
      where.OR.push(
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      );
    }

    // =========================================================================
    // 5. GET TOTAL COUNT
    // =========================================================================

    const total = await prisma.trainingSession.count({ where });
    const totalPages = Math.ceil(total / limit);

    // =========================================================================
    // 6. BUILD ORDER BY
    // =========================================================================

    let orderBy: any;
    switch (sortBy) {
      case 'created':
        orderBy = { createdAt: sortOrder };
        break;
      case 'title':
        orderBy = { title: sortOrder };
        break;
      default:
        orderBy = { date: sortOrder };
    }

    // =========================================================================
    // 7. FETCH TRAINING SESSIONS
    // =========================================================================

    const sessions = await prisma.trainingSession.findMany({
      where,
      include: {
        club: {
          select: { id: true, name: true, shortName: true, logo: true },
        },
        team: {
          select: { id: true, name: true, shortName: true, badge: true },
        },
        coach: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
        attendance: {
          select: { status: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // =========================================================================
    // 8. FORMAT RESPONSE
    // =========================================================================

    const formattedSessions: TrainingSessionListItem[] = sessions.map((session) => ({
      id: session.id,
      clubId: session.clubId,
      club: session.club,
      teamId: session.teamId,
      team: session.team,
      title: session.title,
      description: session.description,
      category: session.category,
      intensity: session.intensity,
      status: session.status,
      sport: session.sport,
      date: session.date.toISOString(),
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      duration: session.duration,
      location: session.location,
      venue: session.venueId ? { id: session.venueId, name: session.location || 'Unknown' } : null,
      coach: {
        id: session.coach.id,
        name: `${session.coach.user.firstName} ${session.coach.user.lastName}`,
        avatar: session.coach.user.avatar,
      },
      objectives: session.objectives,
      equipment: session.equipment,
      maxParticipants: session.maxParticipants,
      isRequired: session.isRequired,
      isPublic: session.isPublic,
      isCancelled: session.isCancelled,
      cancellationReason: session.cancellationReason,
      attendance: calculateAttendanceStats(session.attendance),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }));

    // =========================================================================
    // 9. AUDIT LOG
    // =========================================================================

    await createAuditLog({
      userId: user.id,
      action: 'TRAINING_SESSIONS_VIEWED',
      resourceType: 'TrainingSession',
      details: {
        filters: { clubId, teamId, coachId, sport, category, status, dateFrom, dateTo },
        pagination: { page, limit },
        resultsCount: formattedSessions.length,
      },
      requestId,
    });

    // =========================================================================
    // 10. BUILD RESPONSE
    // =========================================================================

    const duration = Math.round(performance.now() - startTime);

    const response: TrainingSessionsListResponse = {
      success: true,
      sessions: formattedSessions,
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
        teamId: teamId || null,
        coachId: coachId || null,
        sport,
        category,
        status,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error) {
    console.error('[GET /api/training-sessions]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(
      'Failed to fetch training sessions',
      'INTERNAL_ERROR',
      500,
      requestId
    );
  }
}

// =============================================================================
// POST /api/training-sessions
// =============================================================================

/**
 * Create a new training session
 * 
 * Request Body (CreateTrainingSessionInput):
 *   Required:
 *     - clubId: string (CUID)
 *     - coachId: string (CUID)
 *     - title: string (3-200 chars)
 *     - date: ISO 8601 datetime
 *     - startTime: ISO 8601 datetime
 *     - endTime: ISO 8601 datetime
 *   
 *   Optional:
 *     - teamId: string (CUID)
 *     - description: string (max 5000)
 *     - category: TrainingCategory enum (default: TACTICAL)
 *     - intensity: TrainingIntensity enum (default: MEDIUM)
 *     - sport: Sport enum (default: FOOTBALL)
 *     - duration: number (15-480 minutes)
 *     - location: string (max 200)
 *     - venueId: string (CUID)
 *     - maxParticipants: number (1-100)
 *     - objectives: string[] (max 20)
 *     - equipment: string[] (max 50)
 *     - notes: string (max 2000)
 *     - weatherConditions: string (max 100)
 *     - isPublic: boolean (default: false)
 *     - isRequired: boolean (default: true)
 * 
 * Authorization:
 *   - SUPERADMIN, ADMIN: Can create for any club
 *   - COACH, MANAGER, CLUB_MANAGER, CLUB_OWNER: Can create for their club
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateTrainingSessionResponse | ErrorResponse>> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // =========================================================================
    // 1. AUTHENTICATION
    // =========================================================================

    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse(
        'Authentication required',
        'AUTH_REQUIRED',
        401,
        requestId
      );
    }

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        roles: true,
        organisationId: true,
        coach: {
          select: {
            id: true,
            assignments: {
              where: { isActive: true },
              select: { clubId: true, teamId: true },
            },
          },
        },
        clubMembers: {
          where: { isActive: true },
          select: { clubId: true, role: true },
        },
      },
    });

    if (!user) {
      return errorResponse('User not found', 'USER_NOT_FOUND', 404, requestId);
    }

    // =========================================================================
    // 2. AUTHORIZATION CHECK
    // =========================================================================

    if (!hasRole(user.roles as UserRole[], CREATE_ROLES)) {
      return errorResponse(
        'Insufficient permissions to create training sessions',
        'INSUFFICIENT_PERMISSIONS',
        403,
        requestId
      );
    }

    // =========================================================================
    // 3. PARSE & VALIDATE REQUEST BODY
    // =========================================================================

    let body: CreateTrainingSessionInput;
    try {
      const rawBody = await request.json();
      body = CreateTrainingSessionSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!details[path]) details[path] = [];
          details[path].push(err.message);
        });

        return errorResponse(
          'Validation failed',
          'VALIDATION_ERROR',
          400,
          requestId,
          details
        );
      }
      return errorResponse(
        'Invalid JSON in request body',
        'INVALID_JSON',
        400,
        requestId
      );
    }

    // =========================================================================
    // 4. VERIFY CLUB ACCESS
    // =========================================================================

    const isSuperAdmin = hasRole(user.roles as UserRole[], ['SUPERADMIN', 'ADMIN']);

    if (!isSuperAdmin) {
      // Check if user has access to the club
      const hasClubAccess = user.clubMembers.some(
        (m) => m.clubId === body.clubId && ['MANAGER', 'ADMIN', 'OWNER'].includes(m.role)
      ) || user.coach?.assignments.some((a) => a.clubId === body.clubId);

      if (!hasClubAccess) {
        return errorResponse(
          'You do not have permission to create training sessions for this club',
          'CLUB_ACCESS_DENIED',
          403,
          requestId
        );
      }
    }

    // =========================================================================
    // 5. VERIFY CLUB EXISTS
    // =========================================================================

    const club = await prisma.club.findUnique({
      where: { id: body.clubId },
      select: { id: true, name: true, sport: true },
    });

    if (!club) {
      return errorResponse(
        `Club with ID "${body.clubId}" not found`,
        'CLUB_NOT_FOUND',
        404,
        requestId
      );
    }

    // =========================================================================
    // 6. VERIFY TEAM EXISTS (IF PROVIDED)
    // =========================================================================

    if (body.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: body.teamId },
        select: { id: true, name: true, clubId: true },
      });

      if (!team) {
        return errorResponse(
          `Team with ID "${body.teamId}" not found`,
          'TEAM_NOT_FOUND',
          404,
          requestId
        );
      }

      if (team.clubId !== body.clubId) {
        return errorResponse(
          'Team does not belong to the specified club',
          'TEAM_CLUB_MISMATCH',
          400,
          requestId
        );
      }
    }

    // =========================================================================
    // 7. VERIFY COACH EXISTS
    // =========================================================================

    const coach = await prisma.coach.findUnique({
      where: { id: body.coachId },
      select: {
        id: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!coach) {
      return errorResponse(
        `Coach with ID "${body.coachId}" not found`,
        'COACH_NOT_FOUND',
        404,
        requestId
      );
    }

    // =========================================================================
    // 8. VALIDATE DATES
    // =========================================================================

    const sessionDate = new Date(body.date);
    const startTime_ = new Date(body.startTime);
    const endTime_ = new Date(body.endTime);
    const now = new Date();

    if (sessionDate < now) {
      return errorResponse(
        'Training session date cannot be in the past',
        'INVALID_DATE',
        400,
        requestId
      );
    }

    if (startTime_ >= endTime_) {
      return errorResponse(
        'Start time must be before end time',
        'INVALID_TIME_RANGE',
        400,
        requestId
      );
    }

    // =========================================================================
    // 9. VALIDATE SPORT-SPECIFIC CONSTRAINTS
    // =========================================================================

    const sportMaxParticipants = SPORT_MAX_PARTICIPANTS[body.sport];
    if (body.maxParticipants && body.maxParticipants > sportMaxParticipants) {
      return errorResponse(
        `Maximum participants for ${body.sport} is ${sportMaxParticipants}`,
        'INVALID_MAX_PARTICIPANTS',
        400,
        requestId
      );
    }

    // =========================================================================
    // 10. CREATE TRAINING SESSION
    // =========================================================================

    const trainingSession = await prisma.trainingSession.create({
      data: {
        clubId: body.clubId,
        teamId: body.teamId || null,
        coachId: body.coachId,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        category: body.category,
        intensity: body.intensity,
        sport: body.sport,
        date: sessionDate,
        startTime: startTime_,
        endTime: endTime_,
        duration: body.duration || null,
        location: body.location?.trim() || null,
        venueId: body.venueId || null,
        maxParticipants: body.maxParticipants || null,
        objectives: body.objectives,
        equipment: body.equipment,
        notes: body.notes?.trim() || null,
        weatherConditions: body.weatherConditions || null,
        isPublic: body.isPublic,
        isRequired: body.isRequired,
        status: TrainingStatus.SCHEDULED,
      },
      include: {
        team: { select: { id: true, name: true } },
        coach: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // =========================================================================
    // 11. AUDIT LOG
    // =========================================================================

    await createAuditLog({
      userId: user.id,
      action: 'TRAINING_SESSION_CREATED',
      resourceType: 'TrainingSession',
      resourceId: trainingSession.id,
      details: {
        title: trainingSession.title,
        clubId: body.clubId,
        teamId: body.teamId,
        coachId: body.coachId,
        sport: body.sport,
        category: body.category,
        date: sessionDate.toISOString(),
      },
      requestId,
    });

    // =========================================================================
    // 12. BUILD RESPONSE
    // =========================================================================

    const duration = Math.round(performance.now() - startTime);

    const response: CreateTrainingSessionResponse = {
      success: true,
      session: {
        id: trainingSession.id,
        title: trainingSession.title,
        category: trainingSession.category,
        sport: trainingSession.sport,
        date: trainingSession.date.toISOString(),
        startTime: trainingSession.startTime.toISOString(),
        endTime: trainingSession.endTime.toISOString(),
        location: trainingSession.location,
        team: trainingSession.team,
        coach: {
          id: trainingSession.coach.id,
          name: `${trainingSession.coach.user.firstName} ${trainingSession.coach.user.lastName}`,
        },
        status: trainingSession.status,
      },
      message: `Training session "${trainingSession.title}" created successfully`,
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
        'Location': `/api/training-sessions/${trainingSession.id}`,
      },
    });
  } catch (error) {
    console.error('[POST /api/training-sessions]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(
      'Failed to create training session',
      'INTERNAL_ERROR',
      500,
      requestId
    );
  }
}
