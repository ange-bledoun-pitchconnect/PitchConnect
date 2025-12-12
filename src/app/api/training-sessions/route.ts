// ============================================================================
// 🏆 NEW: src/app/api/training-sessions/route.ts
// GET - List training sessions | POST - Create training session
// VERSION: 3.0 - World-Class Enhanced
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, validateRequired, validateStringLength } from '@/lib/api/validation';
import { errorResponse } from '@/lib/api/responses';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logResourceCreated, createAuditLog } from '@/lib/api/audit';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CreateTrainingSessionRequest {
  teamId: string;
  date: string;
  time?: string;
  duration?: number;
  location: string;
  focus: string;
  description?: string;
  coachId?: string;
  maxAttendees?: number;
}

interface TrainingSessionListItem {
  id: string;
  teamId: string;
  team: {
    id: string;
    name: string;
    shortCode: string;
  };
  date: string;
  time: string | null;
  duration: number | null;
  location: string;
  focus: string;
  description: string | null;
  coach: {
    id: string;
    name: string;
    email: string;
  } | null;
  status: string;
  attendance: {
    confirmed: number;
    total: number;
    available: number;
    unavailable: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateTrainingSessionResponse {
  success: true;
  id: string;
  teamId: string;
  team: { id: string; name: string };
  date: string;
  location: string;
  focus: string;
  coach: { id: string; name: string } | null;
  status: string;
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
  filters: Record<string, any>;
  timestamp: string;
  requestId: string;
}

// ============================================================================
// GET /api/training-sessions - List Training Sessions
// ============================================================================

/**
 * GET /api/training-sessions
 * List training sessions with filtering and pagination
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 25, max: 100)
 *   - teamId: string (filter by team)
 *   - coachId: string (filter by coach)
 *   - dateFrom: ISO string
 *   - dateTo: ISO string
 *   - status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'ALL'
 *   - sortBy: 'date' | 'created' (default: 'date')
 *   - sortOrder: 'asc' | 'desc' (default: 'asc')
 * 
 * Authorization: Any authenticated user
 * 
 * Returns: 200 OK with paginated sessions
 * 
 * Features:
 *   ✅ Advanced filtering
 *   ✅ Pagination
 *   ✅ Team filtering
 *   ✅ Date range filtering
 *   ✅ Attendance tracking
 */
export async function GET(request: NextRequest): Promise<NextResponse<TrainingSessionsListResponse | { success: false; error: string; code: string; requestId: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    // 3. Extract filter parameters
    const teamId = searchParams.get('teamId');
    const coachId = searchParams.get('coachId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // 4. Build where clause
    const where: any = {};

    if (teamId) where.teamId = teamId;
    if (coachId) where.coachId = coachId;

    if (status !== 'ALL') {
      where.status = status;
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

    // 5. Get total count
    const total = await prisma.trainingSession.count({ where });
    const totalPages = Math.ceil(total / limit);

    // 6. Determine sort order
    const orderBy: any = {};
    if (sortBy === 'created') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.date = sortOrder;
    }

    // 7. Fetch training sessions
    const sessions = await prisma.trainingSession.findMany({
      where,
      include: {
        team: {
          select: { id: true, name: true, shortCode: true },
        },
        coach: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        attendances: {
          select: { status: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // 8. Format sessions
    const formattedSessions: TrainingSessionListItem[] = sessions.map((session) => {
      const confirmCount = session.attendances.filter((a) => a.status === 'CONFIRMED').length;
      const availableCount = session.attendances.filter((a) => a.status === 'AVAILABLE').length;
      const unavailableCount = session.attendances.filter((a) => a.status === 'UNAVAILABLE').length;

      return {
        id: session.id,
        teamId: session.teamId,
        team: session.team,
        date: session.date.toISOString(),
        time: session.time ? session.time.toISOString() : null,
        duration: session.duration,
        location: session.location,
        focus: session.focus,
        description: session.description,
        coach: session.coach
          ? {
              id: session.coach.id,
              name: `${session.coach.user.firstName} ${session.coach.user.lastName}`,
              email: session.coach.user.email,
            }
          : null,
        status: session.status,
        attendance: {
          confirmed: confirmCount,
          total: session.attendances.length,
          available: availableCount,
          unavailable: unavailableCount,
        },
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      };
    });

    // 9. Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'TRAININGSESSIONSVIEWED',
      resourceType: 'TrainingSession',
      details: {
        filters: {
          teamId: teamId || 'all',
          coachId: coachId || 'all',
          status: status,
        },
        pageSize: limit,
        currentPage: page,
      },
      requestId,
    });

    // 10. Build response
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
        teamId: teamId || null,
        coachId: coachId || null,
        status,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[GET /api/training-sessions]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}

// ============================================================================
// POST /api/training-sessions - Create Training Session
// ============================================================================

/**
 * POST /api/training-sessions
 * Create a new training session
 * 
 * Authorization: SUPERADMIN, COACH, CLUB_MANAGER
 * 
 * Request Body:
 *   Required:
 *     - teamId: string
 *     - date: ISO string (future date)
 *     - location: string
 *     - focus: string (e.g., "Tactical Drills", "Fitness", "Ball Control")
 *   
 *   Optional:
 *     - time: ISO string (time of session)
 *     - duration: number (minutes)
 *     - description: string
 *     - coachId: string
 *     - maxAttendees: number
 * 
 * Returns: 201 Created with session details
 * 
 * Features:
 *   ✅ Team validation
 *   ✅ Date validation
 *   ✅ Coach assignment
 *   ✅ Transaction support
 *   ✅ Comprehensive audit logging
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateTrainingSessionResponse | { success: false; error: string; code: string; requestId: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isCoach = session.user.roles?.includes('COACH');
    const isClubManager = session.user.roles?.includes('CLUB_MANAGER');

    if (!isSuperAdmin && !isCoach && !isClubManager) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only SUPERADMIN, COACH, or CLUB_MANAGER can create training sessions',
          code: 'INSUFFICIENT_PERMISSIONS',
          requestId,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Parse request body
    let body: CreateTrainingSessionRequest;
    try {
      body = await parseJsonBody(request);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Validate required fields
    validateRequired(body, ['teamId', 'date', 'location', 'focus']);
    validateStringLength(body.location, 2, 200, 'Location');
    validateStringLength(body.focus, 2, 100, 'Focus');

    // 5. Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: body.teamId },
      select: { id: true, name: true },
    });

    if (!team) {
      return NextResponse.json(
        {
          success: false,
          error: `Team "${body.teamId}" not found`,
          code: 'TEAM_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 6. Validate date
    const sessionDate = new Date(body.date);
    if (isNaN(sessionDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use ISO 8601 (YYYY-MM-DDTHH:mm:ss)',
          code: 'INVALID_DATE_FORMAT',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (sessionDate < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Training session date cannot be in the past',
          code: 'INVALID_DATE',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 7. Verify coach if provided
    if (body.coachId) {
      const coach = await prisma.coach.findUnique({
        where: { id: body.coachId },
        select: { id: true, user: { select: { firstName: true, lastName: true } } },
      });

      if (!coach) {
        return NextResponse.json(
          {
            success: false,
            error: `Coach "${body.coachId}" not found`,
            code: 'COACH_NOT_FOUND',
            requestId,
          },
          { status: 404, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    // 8. Create training session
    const trainingSession = await prisma.$transaction(async (tx) => {
      return await tx.trainingSession.create({
        data: {
          teamId: body.teamId,
          date: sessionDate,
          time: body.time ? new Date(body.time) : null,
          duration: body.duration || null,
          location: body.location.trim(),
          focus: body.focus.trim(),
          description: body.description?.trim() || null,
          coachId: body.coachId || null,
          maxAttendees: body.maxAttendees || null,
          status: 'SCHEDULED',
        },
        include: {
          team: { select: { id: true, name: true } },
          coach: {
            select: { id: true, user: { select: { firstName: true, lastName: true } } },
          },
        },
      });
    });

    // 9. Create audit log
    await logResourceCreated(
      session.user.id,
      'TrainingSession',
      trainingSession.id,
      `${team.name} - ${trainingSession.focus}`,
      {
        team: team.name,
        focus: trainingSession.focus,
        location: trainingSession.location,
        date: sessionDate.toISOString(),
        coach: trainingSession.coach
          ? `${trainingSession.coach.user.firstName} ${trainingSession.coach.user.lastName}`
          : 'Unassigned',
      },
      `Created training session: ${team.name} - ${trainingSession.focus}`
    );

    // 10. Build response
    const response: CreateTrainingSessionResponse = {
      success: true,
      id: trainingSession.id,
      teamId: trainingSession.teamId,
      team: trainingSession.team,
      date: trainingSession.date.toISOString(),
      location: trainingSession.location,
      focus: trainingSession.focus,
      coach: trainingSession.coach
        ? {
            id: trainingSession.coach.id,
            name: `${trainingSession.coach.user.firstName} ${trainingSession.coach.user.lastName}`,
          }
        : null,
      status: trainingSession.status,
      message: `Training session "${trainingSession.focus}" created successfully for ${team.name}`,
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 201,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[POST /api/training-sessions]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}
