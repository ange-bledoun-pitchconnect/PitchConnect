// =============================================================================
// 🏋️ TRAINING SESSIONS API - PitchConnect v7.9.0
// =============================================================================
// Enterprise-grade training session management
// Multi-sport support | Hybrid club/team sessions | Schema-aligned
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Prisma,
  Sport,
  TrainingCategory,
  TrainingIntensity,
  TrainingSessionStatus,
  TrainingSessionType,
} from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface TrainingSessionListItem {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: TrainingSessionStatus;
  type: TrainingSessionType;
  category: TrainingCategory;
  intensity: TrainingIntensity;
  location: string | null;
  sport: Sport;
  isTeamSession: boolean;
  team: {
    id: string;
    name: string;
  } | null;
  club: {
    id: string;
    name: string;
  };
  coach: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  facility: {
    id: string;
    name: string;
  } | null;
  attendance: {
    total: number;
    present: number;
    absent: number;
  };
  maxParticipants: number | null;
  createdAt: string;
}

interface SessionsListResponse {
  success: true;
  data: TrainingSessionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    clubId: string;
    teamId: string | null;
    status: TrainingSessionStatus | null;
    category: TrainingCategory | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface CreateSessionResponse {
  success: true;
  data: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: TrainingSessionStatus;
    type: TrainingSessionType;
    category: TrainingCategory;
    team: { id: string; name: string } | null;
    club: { id: string; name: string };
    coach: { id: string; name: string } | null;
    attendanceInitialized: number;
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

const ListSessionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  clubId: z.string().min(1, 'Club ID is required'),
  teamId: z.string().optional(),
  coachId: z.string().optional(),
  status: z.nativeEnum(TrainingSessionStatus).optional(),
  category: z.nativeEnum(TrainingCategory).optional(),
  intensity: z.nativeEnum(TrainingIntensity).optional(),
  type: z.nativeEnum(TrainingSessionType).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  facilityId: z.string().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['date', 'startTime', 'title', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const CreateSessionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  clubId: z.string().min(1, 'Club ID is required'),
  teamId: z.string().optional().nullable(),
  coachId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'),
  type: z.nativeEnum(TrainingSessionType).default('TEAM'),
  category: z.nativeEnum(TrainingCategory),
  customCategory: z.string().max(100).optional(),
  intensity: z.nativeEnum(TrainingIntensity).default('MEDIUM'),
  location: z.string().max(200).optional(),
  facilityId: z.string().optional(),
  maxParticipants: z.number().int().min(1).max(200).optional(),
  objectives: z.array(z.string().max(200)).max(10).default([]),
  equipment: z.array(z.string().max(100)).max(20).default([]),
  focusAreas: z.array(z.string().max(100)).max(10).default([]),
  drillIds: z.array(z.string()).max(20).default([]),
  notes: z.string().max(2000).optional(),
  autoAddTeamPlayers: z.boolean().default(true),
  sendNotifications: z.boolean().default(true),
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
 * Parse time string (HH:MM) and date string to full Date
 */
function parseDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

/**
 * Calculate duration in minutes between two times
 */
function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let duration = (endH * 60 + endM) - (startH * 60 + startM);
  
  // Handle overnight sessions
  if (duration < 0) {
    duration += 24 * 60;
  }
  
  return duration;
}

async function canManageTraining(userId: string, clubId: string): Promise<boolean> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
    },
  });
  return !!membership;
}

// =============================================================================
// GET /api/training
// List training sessions with filtering
// =============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<SessionsListResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const clubIdParam = searchParams.get('clubId');
    if (!clubIdParam) {
      return createErrorResponse('BAD_REQUEST', 'clubId is required', requestId, 400);
    }

    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      clubId: clubIdParam,
      teamId: searchParams.get('teamId') || undefined,
      coachId: searchParams.get('coachId') || undefined,
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      intensity: searchParams.get('intensity') || undefined,
      type: searchParams.get('type') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      facilityId: searchParams.get('facilityId') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'date',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validatedParams = ListSessionsSchema.parse(queryParams);
    const {
      page,
      limit,
      clubId,
      teamId,
      coachId,
      status,
      category,
      intensity,
      type,
      dateFrom,
      dateTo,
      facilityId,
      search,
      sortBy,
      sortOrder,
    } = validatedParams;
    const skip = (page - 1) * limit;

    // 3. Verify club membership
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId,
        isActive: true,
      },
    });

    if (!membership) {
      return createErrorResponse('FORBIDDEN', 'Not a member of this club', requestId, 403);
    }

    // 4. Build where clause
    const where: Prisma.TrainingSessionWhereInput = {
      clubId,
      deletedAt: null,
    };

    if (teamId) {
      // Filter by specific team or club-wide (teamId = null)
      where.teamId = teamId === 'null' ? null : teamId;
    }

    if (coachId) {
      where.coachId = coachId;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (intensity) {
      where.intensity = intensity;
    }

    if (type) {
      where.type = type;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 5. Get total count
    const total = await prisma.trainingSession.count({ where });

    // 6. Fetch sessions
    const sessions = await prisma.trainingSession.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            sport: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        attendance: {
          select: {
            status: true,
          },
        },
      },
    });

    // 7. Format response
    const formattedSessions: TrainingSessionListItem[] = sessions.map((s) => {
      const presentCount = s.attendance.filter((a) =>
        ['PRESENT', 'LATE', 'PARTIAL'].includes(a.status)
      ).length;
      const absentCount = s.attendance.filter((a) =>
        ['ABSENT', 'NO_SHOW'].includes(a.status)
      ).length;

      return {
        id: s.id,
        title: s.title,
        description: s.description,
        date: s.date.toISOString().split('T')[0],
        startTime: s.startTime.toISOString().split('T')[1].substring(0, 5),
        endTime: s.endTime.toISOString().split('T')[1].substring(0, 5),
        duration: s.duration,
        status: s.status,
        type: s.type,
        category: s.category,
        intensity: s.intensity,
        location: s.location,
        sport: s.club.sport,
        isTeamSession: !!s.teamId,
        team: s.team
          ? {
              id: s.team.id,
              name: s.team.name,
            }
          : null,
        club: {
          id: s.club.id,
          name: s.club.name,
        },
        coach: s.coach
          ? {
              id: s.coach.id,
              name: `${s.coach.user.firstName} ${s.coach.user.lastName}`,
              avatar: s.coach.user.avatar,
            }
          : null,
        facility: s.facility
          ? {
              id: s.facility.id,
              name: s.facility.name,
            }
          : null,
        attendance: {
          total: s.attendance.length,
          present: presentCount,
          absent: absentCount,
        },
        maxParticipants: s.maxParticipants,
        createdAt: s.createdAt.toISOString(),
      };
    });

    // 8. Build response
    const totalPages = Math.ceil(total / limit);

    const response: SessionsListResponse = {
      success: true,
      data: formattedSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        clubId,
        teamId: teamId || null,
        status: status || null,
        category: category || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
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
    console.error(`[${requestId}] GET /api/training error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch training sessions', requestId, 500);
  }
}

// =============================================================================
// POST /api/training
// Create a new training session
// =============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateSessionResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = CreateSessionSchema.parse(body);

    // 3. Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: validatedData.clubId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sport: true,
      },
    });

    if (!club) {
      return createErrorResponse('CLUB_NOT_FOUND', 'Club not found', requestId, 404);
    }

    // 4. Authorization
    const hasPermission = await canManageTraining(session.user.id, validatedData.clubId);
    if (!hasPermission) {
      return createErrorResponse(
        'FORBIDDEN',
        'You do not have permission to create training sessions',
        requestId,
        403
      );
    }

    // 5. Validate team if provided
    let team = null;
    if (validatedData.teamId) {
      team = await prisma.team.findUnique({
        where: { id: validatedData.teamId, clubId: validatedData.clubId, deletedAt: null },
        select: { id: true, name: true, activePlayers: true },
      });

      if (!team) {
        return createErrorResponse('TEAM_NOT_FOUND', 'Team not found or not in this club', requestId, 404);
      }
    }

    // 6. Validate coach if provided
    let coach = null;
    if (validatedData.coachId) {
      coach = await prisma.coach.findUnique({
        where: { id: validatedData.coachId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!coach) {
        return createErrorResponse('COACH_NOT_FOUND', 'Coach not found', requestId, 404);
      }
    }

    // 7. Validate times
    const duration = calculateDuration(validatedData.startTime, validatedData.endTime);
    if (duration <= 0 || duration > 480) {
      return createErrorResponse(
        'INVALID_TIME_RANGE',
        'Session duration must be between 1 minute and 8 hours',
        requestId,
        400
      );
    }

    // 8. Parse date and times to Date objects
    const sessionDate = new Date(validatedData.date);
    const startDateTime = parseDateTime(validatedData.date, validatedData.startTime);
    const endDateTime = parseDateTime(validatedData.date, validatedData.endTime);

    // 9. Check for facility conflicts if facilityId provided
    if (validatedData.facilityId) {
      const facility = await prisma.facility.findUnique({
        where: { id: validatedData.facilityId },
      });

      if (!facility) {
        return createErrorResponse('FACILITY_NOT_FOUND', 'Facility not found', requestId, 404);
      }

      const conflictingSession = await prisma.trainingSession.findFirst({
        where: {
          facilityId: validatedData.facilityId,
          deletedAt: null,
          status: { notIn: ['CANCELLED', 'POSTPONED'] },
          date: sessionDate,
          OR: [
            {
              AND: [
                { startTime: { lte: startDateTime } },
                { endTime: { gt: startDateTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endDateTime } },
                { endTime: { gte: endDateTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startDateTime } },
                { endTime: { lte: endDateTime } },
              ],
            },
          ],
        },
        select: { id: true, title: true },
      });

      if (conflictingSession) {
        return createErrorResponse(
          'FACILITY_CONFLICT',
          `Facility is already booked for "${conflictingSession.title}" at this time`,
          requestId,
          409,
          { conflictingSessionId: conflictingSession.id }
        );
      }
    }

    // 10. Validate drills if provided
    if (validatedData.drillIds.length > 0) {
      const drills = await prisma.trainingDrill.findMany({
        where: { id: { in: validatedData.drillIds }, deletedAt: null },
        select: { id: true },
      });

      const foundIds = drills.map((d) => d.id);
      const missingIds = validatedData.drillIds.filter((id) => !foundIds.includes(id));

      if (missingIds.length > 0) {
        return createErrorResponse(
          'DRILLS_NOT_FOUND',
          `Some drills were not found: ${missingIds.join(', ')}`,
          requestId,
          404
        );
      }
    }

    // 11. Create training session with transaction
    const trainingSession = await prisma.$transaction(async (tx) => {
      // Create the session
      const newSession = await tx.trainingSession.create({
        data: {
          title: validatedData.title.trim(),
          description: validatedData.description?.trim() || null,
          clubId: validatedData.clubId,
          teamId: validatedData.teamId || null,
          coachId: validatedData.coachId || null,
          date: sessionDate,
          startTime: startDateTime,
          endTime: endDateTime,
          duration,
          status: 'SCHEDULED',
          type: validatedData.type,
          category: validatedData.category,
          customCategory: validatedData.customCategory?.trim() || null,
          intensity: validatedData.intensity,
          location: validatedData.location?.trim() || null,
          facilityId: validatedData.facilityId || null,
          maxParticipants: validatedData.maxParticipants || null,
          objectives: validatedData.objectives,
          equipment: validatedData.equipment,
          focusAreas: validatedData.focusAreas,
          notes: validatedData.notes?.trim() || null,
        },
        include: {
          club: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          coach: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      });

      // Link drills if provided
      if (validatedData.drillIds.length > 0) {
        await tx.trainingSessionDrill.createMany({
          data: validatedData.drillIds.map((drillId, index) => ({
            sessionId: newSession.id,
            drillId,
            order: index + 1,
          })),
        });
      }

      return newSession;
    });

    // 12. Auto-add team players if team-specific and enabled
    let attendanceCount = 0;
    if (validatedData.teamId && validatedData.autoAddTeamPlayers) {
      const teamPlayers = await prisma.teamPlayer.findMany({
        where: { teamId: validatedData.teamId, isActive: true },
        select: { playerId: true },
      });

      if (teamPlayers.length > 0) {
        const result = await prisma.trainingAttendance.createMany({
          data: teamPlayers.map((tp) => ({
            sessionId: trainingSession.id,
            playerId: tp.playerId,
            status: 'SCHEDULED',
          })),
          skipDuplicates: true,
        });
        attendanceCount = result.count;
      }
    }

    // 13. Send notifications if enabled
    if (validatedData.sendNotifications && validatedData.teamId) {
      const teamPlayers = await prisma.teamPlayer.findMany({
        where: { teamId: validatedData.teamId, isActive: true },
        include: {
          player: {
            select: { userId: true },
          },
        },
      });

      const userIds = teamPlayers.map((tp) => tp.player.userId);

      if (userIds.length > 0) {
        await prisma.notification.createMany({
          data: userIds.map((userId) => ({
            userId,
            type: 'TRAINING_SCHEDULED',
            title: 'Training Session Scheduled',
            message: `${trainingSession.title} - ${validatedData.date} at ${validatedData.startTime}`,
            data: {
              sessionId: trainingSession.id,
              date: validatedData.date,
              startTime: validatedData.startTime,
              location: validatedData.location || null,
            },
            link: `/training/${trainingSession.id}`,
          })),
        });
      }
    }

    // 14. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRAINING_SESSION_CREATED',
        resourceType: 'TrainingSession',
        resourceId: trainingSession.id,
        details: {
          title: trainingSession.title,
          clubName: club.name,
          teamName: team?.name || null,
          date: validatedData.date,
          startTime: validatedData.startTime,
          duration,
          attendanceInitialized: attendanceCount,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 15. Build response
    const response: CreateSessionResponse = {
      success: true,
      data: {
        id: trainingSession.id,
        title: trainingSession.title,
        date: validatedData.date,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        status: trainingSession.status,
        type: trainingSession.type,
        category: trainingSession.category,
        team: trainingSession.team
          ? { id: trainingSession.team.id, name: trainingSession.team.name }
          : null,
        club: { id: trainingSession.club.id, name: trainingSession.club.name },
        coach: trainingSession.coach
          ? {
              id: trainingSession.coach.id,
              name: `${trainingSession.coach.user.firstName} ${trainingSession.coach.user.lastName}`,
            }
          : null,
        attendanceInitialized: attendanceCount,
      },
      message: `Training session "${trainingSession.title}" created successfully`,
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
    console.error(`[${requestId}] POST /api/training error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to create training session', requestId, 500);
  }
}
