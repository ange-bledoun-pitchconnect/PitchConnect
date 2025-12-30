// =============================================================================
// 🏋️ INDIVIDUAL TRAINING SESSION API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]
// PATCH  /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]
// DELETE /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Owner, Manager, Head Coach, Assistant Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, TrainingIntensity, TrainingCategory, TrainingStatus, AttendanceStatus } from '@prisma/client';

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
    trainingId: string;
  };
}

interface AttendanceRecord {
  id: string;
  playerId: string;
  playerName: string;
  avatar: string | null;
  position: string | null;
  status: AttendanceStatus;
  arrivalTime: string | null;
  departTime: string | null;
  performanceRating: number | null;
  effortRating: number | null;
  notes: string | null;
  coachNotes: string | null;
}

interface DrillRecord {
  id: string;
  drillId: string;
  drillName: string;
  category: string;
  order: number;
  duration: number;
  intensity: string | null;
  isCompleted: boolean;
  rating: number | null;
  notes: string | null;
}

interface TrainingSessionDetail {
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
  facilityId: string | null;
  status: TrainingStatus;
  focusAreas: string[];
  equipment: string[];
  notes: string | null;
  maxParticipants: number | null;
  avgRating: number | null;
  coach: {
    id: string;
    name: string;
    avatar: string | null;
    email: string;
  };
  attendance: AttendanceRecord[];
  drills: DrillRecord[];
  attendanceSummary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  canEdit: boolean;
  canDelete: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateTrainingSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  coachId: z.string().min(1).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  intensity: z.nativeEnum(TrainingIntensity).optional(),
  category: z.nativeEnum(TrainingCategory).optional(),
  customCategory: z.string().max(100).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  facilityId: z.string().nullable().optional(),
  maxParticipants: z.number().int().min(1).max(100).nullable().optional(),
  focusAreas: z.array(z.string().max(100)).max(10).optional(),
  equipment: z.array(z.string().max(100)).max(20).optional(),
  notes: z.string().max(5000).nullable().optional(),
  status: z.nativeEnum(TrainingStatus).optional(),
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
  ClubMemberRole.PLAYER,
];

async function getPermissions(
  userId: string,
  clubId: string
): Promise<{ canView: boolean; canEdit: boolean; canDelete: boolean; role: ClubMemberRole | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    return { canView: true, canEdit: true, canDelete: true, role: ClubMemberRole.OWNER };
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
    return { canView: false, canEdit: false, canDelete: false, role: null };
  }

  const canManage = MANAGE_ROLES.includes(clubMember.role);

  return {
    canView: VIEW_ROLES.includes(clubMember.role),
    canEdit: canManage,
    canDelete: canManage,
    role: clubMember.role,
  };
}

function calculateDurationMinutes(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

// =============================================================================
// GET HANDLER - Fetch Training Session Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, trainingId } = params;

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
        error: 'You do not have permission to view this training session',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true },
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

    // 4. Fetch training session with full details
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: trainingId },
      include: {
        coach: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        attendance: {
          include: {
            player: {
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
          orderBy: { createdAt: 'asc' },
        },
        sessionDrills: {
          include: {
            drill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!trainingSession || trainingSession.teamId !== teamId || trainingSession.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Training session not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Calculate attendance summary
    const attendanceSummary = {
      total: trainingSession.attendance.length,
      present: trainingSession.attendance.filter((a) => a.status === AttendanceStatus.PRESENT).length,
      absent: trainingSession.attendance.filter((a) => a.status === AttendanceStatus.ABSENT).length,
      late: trainingSession.attendance.filter((a) => a.status === AttendanceStatus.LATE).length,
      excused: trainingSession.attendance.filter((a) => a.status === AttendanceStatus.EXCUSED).length,
    };

    // 6. Transform response
    const attendanceRecords: AttendanceRecord[] = trainingSession.attendance.map((a) => ({
      id: a.id,
      playerId: a.playerId,
      playerName: `${a.player.user.firstName} ${a.player.user.lastName}`,
      avatar: a.player.user.avatar,
      position: a.player.primaryPosition,
      status: a.status,
      arrivalTime: a.arrivalTime?.toISOString() || null,
      departTime: a.departTime?.toISOString() || null,
      performanceRating: a.performanceRating,
      effortRating: a.effortRating,
      notes: a.notes,
      coachNotes: a.coachNotes,
    }));

    const drillRecords: DrillRecord[] = trainingSession.sessionDrills.map((d) => ({
      id: d.id,
      drillId: d.drillId,
      drillName: d.drill.name,
      category: d.drill.category,
      order: d.order,
      duration: d.duration,
      intensity: d.intensity,
      isCompleted: d.isCompleted,
      rating: d.rating,
      notes: d.notes,
    }));

    const response: TrainingSessionDetail = {
      id: trainingSession.id,
      name: trainingSession.name,
      description: trainingSession.description,
      startTime: trainingSession.startTime.toISOString(),
      endTime: trainingSession.endTime.toISOString(),
      durationMinutes: calculateDurationMinutes(trainingSession.startTime, trainingSession.endTime),
      intensity: trainingSession.intensity,
      category: trainingSession.category,
      customCategory: trainingSession.customCategory,
      location: trainingSession.location,
      facilityId: trainingSession.facilityId,
      status: trainingSession.status,
      focusAreas: trainingSession.focusAreas,
      equipment: trainingSession.equipment,
      notes: trainingSession.notes,
      maxParticipants: trainingSession.maxParticipants,
      avgRating: trainingSession.avgRating,
      coach: {
        id: trainingSession.coachId,
        name: `${trainingSession.coach.user.firstName} ${trainingSession.coach.user.lastName}`,
        avatar: trainingSession.coach.user.avatar,
        email: trainingSession.coach.user.email,
      },
      attendance: attendanceRecords,
      drills: drillRecords,
      attendanceSummary,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Training Session error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch training session',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Training Session
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, trainingId } = params;

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
    if (!permissions.canEdit) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to edit training sessions',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team and training session
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true },
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

    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: trainingId },
      select: {
        id: true,
        teamId: true,
        deletedAt: true,
        status: true,
        startTime: true,
        endTime: true,
        coachId: true,
        name: true,
      },
    });

    if (!existingSession || existingSession.teamId !== teamId || existingSession.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Training session not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Cannot edit completed sessions
    if (existingSession.status === TrainingStatus.COMPLETED) {
      return createResponse(null, {
        success: false,
        error: 'Cannot edit a completed training session',
        code: 'SESSION_COMPLETED',
        requestId,
        status: 400,
      });
    }

    // 5. Parse and validate body
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

    const validation = UpdateTrainingSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const updates = validation.data;

    // 6. Validate times if provided
    let startTime = existingSession.startTime;
    let endTime = existingSession.endTime;

    if (updates.startTime) startTime = new Date(updates.startTime);
    if (updates.endTime) endTime = new Date(updates.endTime);

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

    // 7. Check coach availability if changing coach or times
    const coachId = updates.coachId || existingSession.coachId;
    if (updates.coachId || updates.startTime || updates.endTime) {
      const conflictingSession = await prisma.trainingSession.findFirst({
        where: {
          id: { not: trainingId },
          coachId,
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
          error: `Coach has a conflicting session: "${conflictingSession.name}"`,
          code: 'SCHEDULE_CONFLICT',
          requestId,
          status: 409,
        });
      }
    }

    // 8. Build update data
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.coachId !== undefined) updateData.coachId = updates.coachId;
    if (updates.startTime !== undefined) updateData.startTime = startTime;
    if (updates.endTime !== undefined) updateData.endTime = endTime;
    if (updates.intensity !== undefined) updateData.intensity = updates.intensity;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.customCategory !== undefined) updateData.customCategory = updates.customCategory;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.facilityId !== undefined) updateData.facilityId = updates.facilityId;
    if (updates.maxParticipants !== undefined) updateData.maxParticipants = updates.maxParticipants;
    if (updates.focusAreas !== undefined) updateData.focusAreas = updates.focusAreas;
    if (updates.equipment !== undefined) updateData.equipment = updates.equipment;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.status !== undefined) updateData.status = updates.status;

    // 9. Update training session
    const updatedSession = await prisma.trainingSession.update({
      where: { id: trainingId },
      data: updateData,
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

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRAINING_UPDATED',
        resourceType: 'TRAINING_SESSION',
        resourceId: trainingId,
        beforeState: {
          name: existingSession.name,
          startTime: existingSession.startTime,
          coachId: existingSession.coachId,
        },
        afterState: updateData,
        changes: Object.keys(updates),
      },
    });

    return createResponse({
      id: updatedSession.id,
      name: updatedSession.name,
      startTime: updatedSession.startTime.toISOString(),
      endTime: updatedSession.endTime.toISOString(),
      durationMinutes: calculateDurationMinutes(updatedSession.startTime, updatedSession.endTime),
      status: updatedSession.status,
      coach: {
        id: updatedSession.coachId,
        name: `${updatedSession.coach.user.firstName} ${updatedSession.coach.user.lastName}`,
      },
      updated: true,
      changes: Object.keys(updates),
    }, {
      success: true,
      message: 'Training session updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Update Training Session error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update training session',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Delete Training Session
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, trainingId } = params;

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
    if (!permissions.canDelete) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to delete training sessions',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true },
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

    // 4. Fetch training session
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: trainingId },
      select: {
        id: true,
        teamId: true,
        name: true,
        startTime: true,
        status: true,
        deletedAt: true,
        _count: {
          select: { attendance: true },
        },
      },
    });

    if (!trainingSession || trainingSession.teamId !== teamId || trainingSession.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Training session not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Check if session has attendance records (soft delete if so)
    const hasAttendance = trainingSession._count.attendance > 0;

    if (hasAttendance) {
      // Soft delete
      await prisma.trainingSession.update({
        where: { id: trainingId },
        data: { deletedAt: new Date() },
      });
    } else {
      // Hard delete
      await prisma.trainingSession.delete({
        where: { id: trainingId },
      });
    }

    // 6. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRAINING_CANCELLED',
        resourceType: 'TRAINING_SESSION',
        resourceId: trainingId,
        beforeState: {
          name: trainingSession.name,
          startTime: trainingSession.startTime,
          status: trainingSession.status,
        },
        afterState: {
          deletedAt: new Date(),
          softDelete: hasAttendance,
        },
      },
    });

    return createResponse(null, {
      success: true,
      message: hasAttendance
        ? 'Training session archived (has attendance records)'
        : 'Training session deleted successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Delete Training Session error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete training session',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}