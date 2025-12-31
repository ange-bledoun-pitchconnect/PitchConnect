// =============================================================================
// 🏋️ TRAINING SESSION BY ID API - PitchConnect v7.9.0
// =============================================================================
// Enterprise-grade individual training session management
// GET, PATCH, DELETE operations | Full attendance | Schema-aligned
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
  TrainingAttendanceStatus,
} from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface RouteParams {
  params: { sessionId: string };
}

interface AttendanceRecord {
  id: string;
  playerId: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatar: string | null;
    position: string | null;
    jerseyNumber: number | null;
  };
  status: TrainingAttendanceStatus;
  arrivalTime: string | null;
  departureTime: string | null;
  notes: string | null;
  performanceRating: number | null;
  effortRating: number | null;
}

interface DrillInfo {
  id: string;
  drillId: string;
  name: string;
  duration: number;
  category: string;
  intensity: string;
  order: number;
  completed: boolean;
  notes: string | null;
}

interface SessionDetailResponse {
  success: true;
  data: {
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
    customCategory: string | null;
    intensity: TrainingIntensity;
    location: string | null;
    objectives: string[];
    equipment: string[];
    focusAreas: string[];
    notes: string | null;
    sport: Sport;
    maxParticipants: number | null;
    club: {
      id: string;
      name: string;
      logo: string | null;
    };
    team: {
      id: string;
      name: string;
      logo: string | null;
    } | null;
    coach: {
      id: string;
      userId: string;
      firstName: string;
      lastName: string;
      fullName: string;
      avatar: string | null;
      email: string;
    } | null;
    facility: {
      id: string;
      name: string;
      address: string | null;
      capacity: number | null;
    } | null;
    attendance: {
      summary: {
        total: number;
        present: number;
        late: number;
        absent: number;
        excused: number;
        injured: number;
        attendanceRate: string;
      };
      records: AttendanceRecord[];
    };
    drills: DrillInfo[];
    media: {
      id: string;
      title: string;
      type: string;
      url: string;
      thumbnailUrl: string | null;
    }[];
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: string;
      name: string;
    } | null;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface UpdateSessionResponse {
  success: true;
  data: {
    id: string;
    title: string;
    status: TrainingSessionStatus;
    updatedAt: string;
  };
  message: string;
  changedFields: string[];
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface DeleteSessionResponse {
  success: true;
  data: {
    id: string;
    title: string;
    deletedAt: string;
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

const UpdateSessionSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.nativeEnum(TrainingSessionStatus).optional(),
  type: z.nativeEnum(TrainingSessionType).optional(),
  category: z.nativeEnum(TrainingCategory).optional(),
  customCategory: z.string().max(100).optional().nullable(),
  intensity: z.nativeEnum(TrainingIntensity).optional(),
  location: z.string().max(200).optional().nullable(),
  facilityId: z.string().optional().nullable(),
  maxParticipants: z.number().int().min(1).max(200).optional().nullable(),
  objectives: z.array(z.string().max(200)).max(10).optional(),
  equipment: z.array(z.string().max(100)).max(20).optional(),
  focusAreas: z.array(z.string().max(100)).max(10).optional(),
  notes: z.string().max(2000).optional().nullable(),
  coachId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
});

const StatusActionSchema = z.object({
  action: z.enum(['start', 'complete', 'cancel', 'postpone']),
  reason: z.string().max(500).optional(),
  rescheduleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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

function parseDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let duration = (endH * 60 + endM) - (startH * 60 + startM);
  if (duration < 0) duration += 24 * 60;
  return duration;
}

async function canManageSession(
  userId: string,
  clubId: string,
  coachId?: string | null
): Promise<{ canManage: boolean; role: string }> {
  // Check if user is the coach
  if (coachId) {
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      select: { userId: true },
    });
    if (coach?.userId === userId) {
      return { canManage: true, role: 'COACH' };
    }
  }

  // Check club membership
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
    },
  });

  if (membership) {
    return { canManage: true, role: membership.role };
  }

  return { canManage: false, role: 'NONE' };
}

// =============================================================================
// GET /api/training/[sessionId]
// Get detailed training session information
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SessionDetailResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { sessionId } = params;

    // 2. Fetch training session with all relations
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            logo: true,
            sport: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            logo: true,
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
                email: true,
              },
            },
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            capacity: true,
          },
        },
        attendance: {
          include: {
            player: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
                teams: {
                  where: { isActive: true },
                  select: {
                    position: true,
                    jerseyNumber: true,
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: {
            player: { user: { lastName: 'asc' } },
          },
        },
        drills: {
          include: {
            drill: {
              select: {
                id: true,
                name: true,
                duration: true,
                category: true,
                intensity: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        media: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            type: true,
            url: true,
            thumbnailUrl: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!trainingSession) {
      return createErrorResponse('SESSION_NOT_FOUND', 'Training session not found', requestId, 404);
    }

    // 3. Verify club membership
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: trainingSession.clubId,
        isActive: true,
      },
    });

    if (!membership) {
      return createErrorResponse('FORBIDDEN', 'Not a member of this club', requestId, 403);
    }

    // 4. Format attendance records
    const attendanceRecords: AttendanceRecord[] = trainingSession.attendance.map((a) => {
      const teamInfo = a.player.teams[0];
      return {
        id: a.id,
        playerId: a.playerId,
        player: {
          id: a.player.id,
          firstName: a.player.user.firstName,
          lastName: a.player.user.lastName,
          fullName: `${a.player.user.firstName} ${a.player.user.lastName}`,
          avatar: a.player.user.avatar,
          position: teamInfo?.position || null,
          jerseyNumber: teamInfo?.jerseyNumber || null,
        },
        status: a.status,
        arrivalTime: a.arrivalTime?.toISOString() || null,
        departureTime: a.departureTime?.toISOString() || null,
        notes: a.notes,
        performanceRating: a.performanceRating,
        effortRating: a.effortRating,
      };
    });

    // 5. Calculate attendance summary
    const presentStatuses: TrainingAttendanceStatus[] = ['PRESENT', 'LATE', 'PARTIAL'];
    const present = attendanceRecords.filter((a) => presentStatuses.includes(a.status)).length;
    const late = attendanceRecords.filter((a) => a.status === 'LATE').length;
    const absent = attendanceRecords.filter((a) => ['ABSENT', 'NO_SHOW'].includes(a.status)).length;
    const excused = attendanceRecords.filter((a) => a.status === 'EXCUSED').length;
    const injured = attendanceRecords.filter((a) => a.status === 'INJURED').length;
    const total = attendanceRecords.length;
    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

    // 6. Format drills
    const drills: DrillInfo[] = trainingSession.drills.map((sd) => ({
      id: sd.id,
      drillId: sd.drillId,
      name: sd.drill.name,
      duration: sd.drill.duration,
      category: sd.drill.category,
      intensity: sd.drill.intensity,
      order: sd.order,
      completed: sd.completed,
      notes: sd.notes,
    }));

    // 7. Build response
    const response: SessionDetailResponse = {
      success: true,
      data: {
        id: trainingSession.id,
        title: trainingSession.title,
        description: trainingSession.description,
        date: trainingSession.date.toISOString().split('T')[0],
        startTime: trainingSession.startTime.toISOString().split('T')[1].substring(0, 5),
        endTime: trainingSession.endTime.toISOString().split('T')[1].substring(0, 5),
        duration: trainingSession.duration,
        status: trainingSession.status,
        type: trainingSession.type,
        category: trainingSession.category,
        customCategory: trainingSession.customCategory,
        intensity: trainingSession.intensity,
        location: trainingSession.location,
        objectives: trainingSession.objectives,
        equipment: trainingSession.equipment,
        focusAreas: trainingSession.focusAreas,
        notes: trainingSession.notes,
        sport: trainingSession.club.sport,
        maxParticipants: trainingSession.maxParticipants,
        club: {
          id: trainingSession.club.id,
          name: trainingSession.club.name,
          logo: trainingSession.club.logo,
        },
        team: trainingSession.team
          ? {
              id: trainingSession.team.id,
              name: trainingSession.team.name,
              logo: trainingSession.team.logo,
            }
          : null,
        coach: trainingSession.coach
          ? {
              id: trainingSession.coach.id,
              userId: trainingSession.coach.userId,
              firstName: trainingSession.coach.user.firstName,
              lastName: trainingSession.coach.user.lastName,
              fullName: `${trainingSession.coach.user.firstName} ${trainingSession.coach.user.lastName}`,
              avatar: trainingSession.coach.user.avatar,
              email: trainingSession.coach.user.email,
            }
          : null,
        facility: trainingSession.facility
          ? {
              id: trainingSession.facility.id,
              name: trainingSession.facility.name,
              address: trainingSession.facility.address,
              capacity: trainingSession.facility.capacity,
            }
          : null,
        attendance: {
          summary: {
            total,
            present,
            late,
            absent,
            excused,
            injured,
            attendanceRate,
          },
          records: attendanceRecords,
        },
        drills,
        media: trainingSession.media.map((m) => ({
          id: m.id,
          title: m.title,
          type: m.type,
          url: m.url,
          thumbnailUrl: m.thumbnailUrl,
        })),
        createdAt: trainingSession.createdAt.toISOString(),
        updatedAt: trainingSession.updatedAt.toISOString(),
        createdBy: trainingSession.createdBy
          ? {
              id: trainingSession.createdBy.id,
              name: `${trainingSession.createdBy.firstName} ${trainingSession.createdBy.lastName}`,
            }
          : null,
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
    console.error(`[${requestId}] GET /api/training/[sessionId] error:`, error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch training session', requestId, 500);
  }
}

// =============================================================================
// PATCH /api/training/[sessionId]
// Update training session
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UpdateSessionResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { sessionId } = params;

    // 2. Fetch existing session
    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        startTime: true,
        endTime: true,
        duration: true,
        status: true,
        type: true,
        category: true,
        customCategory: true,
        intensity: true,
        location: true,
        facilityId: true,
        maxParticipants: true,
        objectives: true,
        equipment: true,
        focusAreas: true,
        notes: true,
        coachId: true,
        teamId: true,
        clubId: true,
      },
    });

    if (!existingSession) {
      return createErrorResponse('SESSION_NOT_FOUND', 'Training session not found', requestId, 404);
    }

    // 3. Authorization
    const { canManage, role } = await canManageSession(
      session.user.id,
      existingSession.clubId,
      existingSession.coachId
    );

    if (!canManage) {
      return createErrorResponse(
        'FORBIDDEN',
        'You do not have permission to update this session',
        requestId,
        403
      );
    }

    // 4. Parse request body
    const body = await request.json();

    // 5. Check if this is a status action
    if (body.action) {
      const actionData = StatusActionSchema.parse(body);
      
      let newStatus: TrainingSessionStatus;
      let additionalData: Prisma.TrainingSessionUpdateInput = {};

      switch (actionData.action) {
        case 'start':
          if (existingSession.status !== 'SCHEDULED') {
            return createErrorResponse(
              'INVALID_STATUS_TRANSITION',
              'Can only start scheduled sessions',
              requestId,
              400
            );
          }
          newStatus = 'IN_PROGRESS';
          additionalData.actualStartTime = new Date();
          break;

        case 'complete':
          if (!['SCHEDULED', 'IN_PROGRESS'].includes(existingSession.status)) {
            return createErrorResponse(
              'INVALID_STATUS_TRANSITION',
              'Can only complete scheduled or in-progress sessions',
              requestId,
              400
            );
          }
          newStatus = 'COMPLETED';
          additionalData.actualEndTime = new Date();
          break;

        case 'cancel':
          if (['COMPLETED', 'CANCELLED'].includes(existingSession.status)) {
            return createErrorResponse(
              'INVALID_STATUS_TRANSITION',
              'Cannot cancel completed or already cancelled sessions',
              requestId,
              400
            );
          }
          newStatus = 'CANCELLED';
          if (actionData.reason) {
            additionalData.notes = `CANCELLED: ${actionData.reason}${existingSession.notes ? `\n\nPrevious notes: ${existingSession.notes}` : ''}`;
          }
          break;

        case 'postpone':
          if (['COMPLETED', 'CANCELLED', 'POSTPONED'].includes(existingSession.status)) {
            return createErrorResponse(
              'INVALID_STATUS_TRANSITION',
              'Cannot postpone completed, cancelled, or already postponed sessions',
              requestId,
              400
            );
          }
          newStatus = 'POSTPONED';
          if (actionData.reason) {
            additionalData.notes = `POSTPONED: ${actionData.reason}${existingSession.notes ? `\n\nPrevious notes: ${existingSession.notes}` : ''}`;
          }
          break;

        default:
          return createErrorResponse('INVALID_ACTION', 'Unknown action', requestId, 400);
      }

      const updatedSession = await prisma.trainingSession.update({
        where: { id: sessionId },
        data: {
          status: newStatus,
          ...additionalData,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `TRAINING_SESSION_${actionData.action.toUpperCase()}`,
          resourceType: 'TrainingSession',
          resourceId: sessionId,
          details: {
            previousStatus: existingSession.status,
            newStatus,
            reason: actionData.reason || null,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            id: updatedSession.id,
            title: updatedSession.title,
            status: updatedSession.status,
            updatedAt: updatedSession.updatedAt.toISOString(),
          },
          message: `Session ${actionData.action}ed successfully`,
          changedFields: ['status'],
          meta: { timestamp: new Date().toISOString(), requestId },
        },
        { status: 200, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 6. Regular update - validate data
    const validatedData = UpdateSessionSchema.parse(body);

    // 7. Track changes
    const changes: Record<string, { old: any; new: any }> = {};
    const updateData: Prisma.TrainingSessionUpdateInput = {};

    // Process each field
    if (validatedData.title !== undefined && validatedData.title !== existingSession.title) {
      changes.title = { old: existingSession.title, new: validatedData.title };
      updateData.title = validatedData.title.trim();
    }

    if (validatedData.description !== undefined && validatedData.description !== existingSession.description) {
      changes.description = { old: '[REDACTED]', new: '[REDACTED]' };
      updateData.description = validatedData.description?.trim() || null;
    }

    if (validatedData.status !== undefined && validatedData.status !== existingSession.status) {
      changes.status = { old: existingSession.status, new: validatedData.status };
      updateData.status = validatedData.status;
    }

    if (validatedData.type !== undefined && validatedData.type !== existingSession.type) {
      changes.type = { old: existingSession.type, new: validatedData.type };
      updateData.type = validatedData.type;
    }

    if (validatedData.category !== undefined && validatedData.category !== existingSession.category) {
      changes.category = { old: existingSession.category, new: validatedData.category };
      updateData.category = validatedData.category;
    }

    if (validatedData.customCategory !== undefined && validatedData.customCategory !== existingSession.customCategory) {
      changes.customCategory = { old: existingSession.customCategory, new: validatedData.customCategory };
      updateData.customCategory = validatedData.customCategory?.trim() || null;
    }

    if (validatedData.intensity !== undefined && validatedData.intensity !== existingSession.intensity) {
      changes.intensity = { old: existingSession.intensity, new: validatedData.intensity };
      updateData.intensity = validatedData.intensity;
    }

    if (validatedData.location !== undefined && validatedData.location !== existingSession.location) {
      changes.location = { old: existingSession.location, new: validatedData.location };
      updateData.location = validatedData.location?.trim() || null;
    }

    if (validatedData.facilityId !== undefined && validatedData.facilityId !== existingSession.facilityId) {
      changes.facilityId = { old: existingSession.facilityId, new: validatedData.facilityId };
      updateData.facilityId = validatedData.facilityId || null;
    }

    if (validatedData.maxParticipants !== undefined && validatedData.maxParticipants !== existingSession.maxParticipants) {
      changes.maxParticipants = { old: existingSession.maxParticipants, new: validatedData.maxParticipants };
      updateData.maxParticipants = validatedData.maxParticipants || null;
    }

    if (validatedData.notes !== undefined && validatedData.notes !== existingSession.notes) {
      changes.notes = { old: '[REDACTED]', new: '[REDACTED]' };
      updateData.notes = validatedData.notes?.trim() || null;
    }

    if (validatedData.coachId !== undefined && validatedData.coachId !== existingSession.coachId) {
      changes.coachId = { old: existingSession.coachId, new: validatedData.coachId };
      updateData.coachId = validatedData.coachId || null;
    }

    if (validatedData.teamId !== undefined && validatedData.teamId !== existingSession.teamId) {
      changes.teamId = { old: existingSession.teamId, new: validatedData.teamId };
      updateData.teamId = validatedData.teamId || null;
    }

    // Handle date/time updates
    const currentDate = existingSession.date.toISOString().split('T')[0];
    const currentStartTime = existingSession.startTime.toISOString().split('T')[1].substring(0, 5);
    const currentEndTime = existingSession.endTime.toISOString().split('T')[1].substring(0, 5);

    const newDate = validatedData.date || currentDate;
    const newStartTime = validatedData.startTime || currentStartTime;
    const newEndTime = validatedData.endTime || currentEndTime;

    if (validatedData.date || validatedData.startTime || validatedData.endTime) {
      const duration = calculateDuration(newStartTime, newEndTime);
      
      if (duration <= 0 || duration > 480) {
        return createErrorResponse(
          'INVALID_TIME_RANGE',
          'Session duration must be between 1 minute and 8 hours',
          requestId,
          400
        );
      }

      if (validatedData.date) {
        updateData.date = new Date(validatedData.date);
        changes.date = { old: currentDate, new: validatedData.date };
      }
      if (validatedData.startTime) {
        updateData.startTime = parseDateTime(newDate, newStartTime);
        changes.startTime = { old: currentStartTime, new: newStartTime };
      }
      if (validatedData.endTime) {
        updateData.endTime = parseDateTime(newDate, newEndTime);
        changes.endTime = { old: currentEndTime, new: newEndTime };
      }
      updateData.duration = duration;
    }

    // Handle array fields
    if (validatedData.objectives !== undefined) {
      updateData.objectives = validatedData.objectives;
      changes.objectives = { old: '[ARRAY]', new: '[ARRAY]' };
    }
    if (validatedData.equipment !== undefined) {
      updateData.equipment = validatedData.equipment;
      changes.equipment = { old: '[ARRAY]', new: '[ARRAY]' };
    }
    if (validatedData.focusAreas !== undefined) {
      updateData.focusAreas = validatedData.focusAreas;
      changes.focusAreas = { old: '[ARRAY]', new: '[ARRAY]' };
    }

    // 8. Check if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            id: existingSession.id,
            title: existingSession.title,
            status: existingSession.status,
            updatedAt: new Date().toISOString(),
          },
          message: 'No changes provided',
          changedFields: [],
          meta: { timestamp: new Date().toISOString(), requestId },
        },
        { status: 200, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 9. Update session
    const updatedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRAINING_SESSION_UPDATED',
        resourceType: 'TrainingSession',
        resourceId: sessionId,
        details: {
          changes,
          updatedBy: role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 11. Build response
    const response: UpdateSessionResponse = {
      success: true,
      data: {
        id: updatedSession.id,
        title: updatedSession.title,
        status: updatedSession.status,
        updatedAt: updatedSession.updatedAt.toISOString(),
      },
      message: `Training session "${updatedSession.title}" updated successfully`,
      changedFields: Object.keys(changes),
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
    console.error(`[${requestId}] PATCH /api/training/[sessionId] error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to update training session', requestId, 500);
  }
}

// =============================================================================
// DELETE /api/training/[sessionId]
// Delete (soft delete) training session
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<DeleteSessionResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { sessionId } = params;

    // 2. Fetch existing session
    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      select: {
        id: true,
        title: true,
        status: true,
        clubId: true,
        coachId: true,
        teamId: true,
      },
    });

    if (!existingSession) {
      return createErrorResponse('SESSION_NOT_FOUND', 'Training session not found', requestId, 404);
    }

    // 3. Authorization - only managers, owners, head coach can delete
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: existingSession.clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
      },
    });

    if (!membership) {
      return createErrorResponse(
        'FORBIDDEN',
        'You do not have permission to delete this session',
        requestId,
        403
      );
    }

    // 4. Soft delete session
    const deletedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() },
    });

    // 5. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRAINING_SESSION_DELETED',
        resourceType: 'TrainingSession',
        resourceId: sessionId,
        details: {
          title: existingSession.title,
          status: existingSession.status,
          deletedBy: membership.role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 6. Build response
    const response: DeleteSessionResponse = {
      success: true,
      data: {
        id: deletedSession.id,
        title: deletedSession.title,
        deletedAt: deletedSession.deletedAt?.toISOString() || new Date().toISOString(),
      },
      message: `Training session "${existingSession.title}" has been deleted`,
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
    console.error(`[${requestId}] DELETE /api/training/[sessionId] error:`, error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to delete training session', requestId, 500);
  }
}
