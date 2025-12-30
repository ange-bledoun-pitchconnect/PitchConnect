// =============================================================================
// 🏋️ TRAINING SESSIONS API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/manager/clubs/[clubId]/teams/[teamId]/training
// POST /api/manager/clubs/[clubId]/teams/[teamId]/training
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Owner, Manager, Head Coach, Assistant Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, TrainingIntensity, TrainingCategory, TrainingStatus, Sport } from '@prisma/client';

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
    teamId: string;
  };
}

interface TrainingSessionItem {
  id: string;
  name: string;
  description: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  intensity: TrainingIntensity;
  category: TrainingCategory;
  customCategory: string | null;
  location: string | null;
  status: TrainingStatus;
  focusAreas: string[];
  equipment: string[];
  maxParticipants: number | null;
  attendanceCount: number;
  avgRating: number | null;
  coach: {
    id: string;
    name: string;
    avatar: string | null;
  };
  drillCount: number;
}

interface TrainingListResponse {
  sessions: TrainingSessionItem[];
  summary: {
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    thisWeek: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// =============================================================================
// SPORT-SPECIFIC TRAINING CATEGORIES
// =============================================================================

const SPORT_TRAINING_FOCUS: Record<Sport, string[]> = {
  FOOTBALL: ['Passing', 'Shooting', 'Defending', 'Set Pieces', 'Possession', 'Transitions', 'Pressing', 'Build-up Play', 'Counter Attack', 'Goalkeeper Training'],
  RUGBY: ['Scrummaging', 'Lineouts', 'Rucking', 'Mauling', 'Tackling', 'Breakdown', 'Backs Moves', 'Kicking', 'Defense Patterns', 'Contact Skills'],
  BASKETBALL: ['Shooting', 'Ball Handling', 'Pick and Roll', 'Fast Break', 'Zone Defense', 'Man-to-Man', 'Free Throws', 'Post Moves', 'Rebounding', 'Court Vision'],
  CRICKET: ['Batting Technique', 'Bowling', 'Fielding', 'Catching', 'Wicket Keeping', 'Net Practice', 'Match Simulation', 'Slip Catching', 'Running Between Wickets'],
  AMERICAN_FOOTBALL: ['Blocking', 'Route Running', 'Coverage', 'Special Teams', 'Quarterback Drills', 'Tackling', 'Ball Security', 'Red Zone', 'Two-Minute Drill'],
  NETBALL: ['Footwork', 'Shooting', 'Interceptions', 'Court Movement', 'Circle Work', 'Center Pass', 'Defense', 'Attack Patterns', 'Timing Runs'],
  HOCKEY: ['Stick Handling', 'Passing', 'Shooting', 'Power Play', 'Penalty Kill', 'Face-offs', 'Defensive Zone', 'Breakouts', 'Goaltending'],
  LACROSSE: ['Stick Skills', 'Ground Balls', 'Dodging', 'Shooting', 'Face-offs', 'Clearing', 'Riding', 'Man-Up', 'Man-Down'],
  AUSTRALIAN_RULES: ['Kicking', 'Handballing', 'Marking', 'Tackling', 'Rucking', 'Forward Line', 'Back Line', 'Clearances', 'Stoppages'],
  GAELIC_FOOTBALL: ['Kicking', 'Hand Passing', 'Solo Running', 'Tackling', 'High Catching', 'Free Taking', 'Kickouts', 'Support Play'],
  FUTSAL: ['Ball Control', 'Quick Passing', 'Rotation', 'Press', 'Set Plays', 'Goalkeeper Distribution', 'Power Play', '1v1 Skills'],
  BEACH_FOOTBALL: ['Sand Movement', 'Overhead Kicks', 'Volleys', 'Quick Combinations', 'Set Pieces', 'Goalkeeper Skills'],
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateTrainingSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  coachId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  intensity: z.nativeEnum(TrainingIntensity).default(TrainingIntensity.MEDIUM),
  category: z.nativeEnum(TrainingCategory),
  customCategory: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  facilityId: z.string().optional(),
  maxParticipants: z.number().int().min(1).max(100).optional(),
  focusAreas: z.array(z.string().max(100)).max(10).default([]),
  equipment: z.array(z.string().max(100)).max(20).default([]),
  notes: z.string().max(5000).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `train_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
  ClubMemberRole.ASSISTANT_COACH,
];

const VIEW_ROLES: ClubMemberRole[] = [
  ...MANAGE_ROLES,
  ClubMemberRole.ANALYST,
  ClubMemberRole.PERFORMANCE_COACH,
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

function calculateDurationMinutes(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

// =============================================================================
// GET HANDLER - List Training Sessions
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId } = params;

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
        error: 'You do not have permission to view training sessions',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true, name: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') as TrainingStatus | null;
    const category = searchParams.get('category') as TrainingCategory | null;
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const skip = (page - 1) * limit;

    // 5. Build where clause
    const where: Record<string, unknown> = {
      teamId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (category) where.category = category;
    if (fromDate || toDate) {
      where.startTime = {};
      if (fromDate) (where.startTime as Record<string, Date>).gte = new Date(fromDate);
      if (toDate) (where.startTime as Record<string, Date>).lte = new Date(toDate);
    }

    // 6. Fetch sessions with pagination
    const [sessions, total] = await Promise.all([
      prisma.trainingSession.findMany({
        where,
        include: {
          coach: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              attendance: true,
              sessionDrills: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      prisma.trainingSession.count({ where }),
    ]);

    // 7. Calculate summary stats
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const [upcoming, completed, cancelled, thisWeek] = await Promise.all([
      prisma.trainingSession.count({
        where: { teamId, deletedAt: null, status: TrainingStatus.SCHEDULED, startTime: { gte: now } },
      }),
      prisma.trainingSession.count({
        where: { teamId, deletedAt: null, status: TrainingStatus.COMPLETED },
      }),
      prisma.trainingSession.count({
        where: { teamId, deletedAt: null, status: TrainingStatus.CANCELLED },
      }),
      prisma.trainingSession.count({
        where: {
          teamId,
          deletedAt: null,
          startTime: { gte: weekStart, lt: weekEnd },
        },
      }),
    ]);

    // 8. Transform response
    const sessionItems: TrainingSessionItem[] = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      durationMinutes: calculateDurationMinutes(s.startTime, s.endTime),
      intensity: s.intensity,
      category: s.category,
      customCategory: s.customCategory,
      location: s.location,
      status: s.status,
      focusAreas: s.focusAreas,
      equipment: s.equipment,
      maxParticipants: s.maxParticipants,
      attendanceCount: s._count.attendance,
      avgRating: s.avgRating,
      coach: {
        id: s.coachId,
        name: `${s.coach.user.firstName} ${s.coach.user.lastName}`,
        avatar: s.coach.user.avatar,
      },
      drillCount: s._count.sessionDrills,
    }));

    const response: TrainingListResponse = {
      sessions: sessionItems,
      summary: {
        total,
        upcoming,
        completed,
        cancelled,
        thisWeek,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] List Training Sessions error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch training sessions',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Training Session
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId } = params;

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
        error: 'You do not have permission to create training sessions',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team and club
    const [team, club] = await Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, clubId: true, name: true },
      }),
      prisma.club.findUnique({
        where: { id: clubId },
        select: { id: true, sport: true },
      }),
    ]);

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

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

    const validation = CreateTrainingSchema.safeParse(body);
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

    // 5. Validate times
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      return createResponse(null, {
        success: false,
        error: 'End time must be after start time',
        code: 'INVALID_TIMES',
        requestId,
        status: 400,
      });
    }

    const durationMinutes = calculateDurationMinutes(startTime, endTime);
    if (durationMinutes < 15 || durationMinutes > 480) {
      return createResponse(null, {
        success: false,
        error: 'Training duration must be between 15 minutes and 8 hours',
        code: 'INVALID_DURATION',
        requestId,
        status: 400,
      });
    }

    // 6. Verify coach exists
    const coach = await prisma.coach.findUnique({
      where: { id: data.coachId },
      select: { id: true, userId: true },
    });

    if (!coach) {
      return createResponse(null, {
        success: false,
        error: 'Coach not found',
        code: 'COACH_NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 7. Check for scheduling conflicts (same coach)
    const conflictingSession = await prisma.trainingSession.findFirst({
      where: {
        coachId: data.coachId,
        deletedAt: null,
        status: { not: TrainingStatus.CANCELLED },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
      select: { id: true, name: true, startTime: true },
    });

    if (conflictingSession) {
      return createResponse(null, {
        success: false,
        error: `Coach has a conflicting session: "${conflictingSession.name}" at ${conflictingSession.startTime.toISOString()}`,
        code: 'SCHEDULE_CONFLICT',
        requestId,
        status: 409,
      });
    }

    // 8. Create training session
    const trainingSession = await prisma.trainingSession.create({
      data: {
        clubId,
        teamId,
        coachId: data.coachId,
        name: data.name,
        description: data.description || null,
        startTime,
        endTime,
        intensity: data.intensity,
        category: data.category,
        customCategory: data.customCategory || null,
        location: data.location || null,
        facilityId: data.facilityId || null,
        maxParticipants: data.maxParticipants || null,
        focusAreas: data.focusAreas,
        equipment: data.equipment,
        notes: data.notes || null,
        status: TrainingStatus.SCHEDULED,
      },
      include: {
        coach: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // 9. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRAINING_CREATED',
        resourceType: 'TRAINING_SESSION',
        resourceId: trainingSession.id,
        afterState: {
          name: trainingSession.name,
          startTime: trainingSession.startTime,
          coachId: trainingSession.coachId,
        },
      },
    });

    // 10. Return response with sport-specific focus suggestions
    const sportFocusAreas = club.sport ? SPORT_TRAINING_FOCUS[club.sport] : [];

    return createResponse({
      session: {
        id: trainingSession.id,
        name: trainingSession.name,
        description: trainingSession.description,
        startTime: trainingSession.startTime.toISOString(),
        endTime: trainingSession.endTime.toISOString(),
        durationMinutes,
        intensity: trainingSession.intensity,
        category: trainingSession.category,
        customCategory: trainingSession.customCategory,
        location: trainingSession.location,
        status: trainingSession.status,
        focusAreas: trainingSession.focusAreas,
        equipment: trainingSession.equipment,
        maxParticipants: trainingSession.maxParticipants,
        coach: {
          id: trainingSession.coachId,
          name: `${trainingSession.coach.user.firstName} ${trainingSession.coach.user.lastName}`,
          avatar: trainingSession.coach.user.avatar,
        },
      },
      sportFocusSuggestions: sportFocusAreas,
    }, {
      success: true,
      message: 'Training session created successfully',
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Create Training Session error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create training session',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}