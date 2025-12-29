// ============================================================================
// 🏋️ TRAINING ACTIONS - PitchConnect v7.3.0
// ============================================================================
// Server actions for training session management
// Supports Hybrid Architecture: Club-wide OR Team-specific training
// ============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  CreateTrainingSessionSchema,
  UpdateTrainingSessionSchema,
  RecordAttendanceSchema,
  BulkAttendanceSchema,
  TrainingSessionFiltersSchema,
  PaginationSchema,
  type CreateTrainingSessionInput,
  type UpdateTrainingSessionInput,
  type RecordAttendanceInput,
  type BulkAttendanceInput,
  type TrainingSessionFilters,
  type PaginationOptions,
} from '@/schemas/training.schema';
import type {
  TrainingSessionWithRelations,
  TrainingSessionListItem,
  AttendanceSummary,
  PlayerAttendanceRecord,
  TrainingAnalytics,
  TrainingCalendarEvent,
  PaginatedResponse,
  ApiResponse,
  CreateTrainingSessionResponse,
} from '@/types/training.types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has permission to manage training for a club
 */
async function checkTrainingPermission(
  userId: string,
  clubId: string,
  action: 'create' | 'update' | 'delete' | 'view'
): Promise<boolean> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      OR: [
        { role: 'OWNER' },
        { role: 'MANAGER' },
        { role: 'HEAD_COACH' },
        { role: 'ASSISTANT_COACH' },
        ...(action === 'view' ? [{ role: 'PLAYER' }, { role: 'STAFF' }] : []),
      ],
    },
  });

  return !!membership;
}

/**
 * Get coach ID for the current user
 */
async function getCoachId(userId: string): Promise<string | null> {
  const coach = await prisma.coach.findUnique({
    where: { userId },
    select: { id: true },
  });
  return coach?.id ?? null;
}

/**
 * Build where clause from filters
 */
function buildWhereClause(
  filters: TrainingSessionFilters,
  clubId: string
): Prisma.TrainingSessionWhereInput {
  const where: Prisma.TrainingSessionWhereInput = {
    clubId,
    deletedAt: null,
  };

  if (filters.teamId !== undefined) {
    where.teamId = filters.teamId; // null = club-wide only
  }

  if (filters.coachId) {
    where.coachId = filters.coachId;
  }

  if (filters.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status;
  }

  if (filters.category) {
    where.category = Array.isArray(filters.category)
      ? { in: filters.category }
      : filters.category;
  }

  if (filters.intensity) {
    where.intensity = Array.isArray(filters.intensity)
      ? { in: filters.intensity }
      : filters.intensity;
  }

  if (filters.startDate || filters.endDate) {
    where.startTime = {};
    if (filters.startDate) {
      where.startTime.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.startTime.lte = new Date(filters.endDate);
    }
  }

  if (filters.facilityId) {
    where.facilityId = filters.facilityId;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { location: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

// ============================================================================
// CREATE TRAINING SESSION
// ============================================================================

export async function createTrainingSession(
  input: CreateTrainingSessionInput
): Promise<ApiResponse<CreateTrainingSessionResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Validate input
    const validatedInput = CreateTrainingSessionSchema.parse(input);

    // Check permission
    const hasPermission = await checkTrainingPermission(
      session.user.id,
      validatedInput.clubId,
      'create'
    );
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to create training sessions' } };
    }

    // Check for conflicts
    const conflictingSessions = await prisma.trainingSession.findMany({
      where: {
        clubId: validatedInput.clubId,
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'POSTPONED'] },
        OR: [
          {
            // Time overlap
            AND: [
              { startTime: { lt: validatedInput.endTime } },
              { endTime: { gt: validatedInput.startTime } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        startTime: true,
        endTime: true,
        facilityId: true,
        coachId: true,
        teamId: true,
      },
    });

    const conflictWarnings: CreateTrainingSessionResponse['conflictWarnings'] = [];

    for (const existing of conflictingSessions) {
      // Coach conflict
      if (existing.coachId === validatedInput.coachId) {
        conflictWarnings.push({
          type: 'coach',
          message: `Coach already has a session at this time: ${existing.name}`,
          conflictingSessionId: existing.id,
          severity: 'warning',
        });
      }

      // Facility conflict
      if (validatedInput.facilityId && existing.facilityId === validatedInput.facilityId) {
        conflictWarnings.push({
          type: 'facility',
          message: `Facility already booked: ${existing.name}`,
          conflictingSessionId: existing.id,
          severity: 'error',
        });
      }

      // Team conflict
      if (validatedInput.teamId && existing.teamId === validatedInput.teamId) {
        conflictWarnings.push({
          type: 'team',
          message: `Team already has a session at this time: ${existing.name}`,
          conflictingSessionId: existing.id,
          severity: 'warning',
        });
      }
    }

    // If there's a facility conflict (error severity), don't create
    const hasBlockingConflict = conflictWarnings.some(w => w.severity === 'error');
    if (hasBlockingConflict) {
      return {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Cannot create session due to conflicts',
          details: { conflicts: conflictWarnings },
        },
      };
    }

    // Create the training session
    const trainingSession = await prisma.trainingSession.create({
      data: {
        clubId: validatedInput.clubId,
        teamId: validatedInput.teamId,
        coachId: validatedInput.coachId,
        name: validatedInput.name,
        description: validatedInput.description,
        startTime: validatedInput.startTime,
        endTime: validatedInput.endTime,
        intensity: validatedInput.intensity,
        category: validatedInput.category,
        customCategory: validatedInput.customCategory,
        location: validatedInput.location,
        facilityId: validatedInput.facilityId,
        maxParticipants: validatedInput.maxParticipants,
        drills: validatedInput.drills as Prisma.JsonValue,
        notes: validatedInput.notes,
        equipment: validatedInput.equipment,
        focusAreas: validatedInput.focusAreas,
        status: validatedInput.status,
      },
      include: {
        club: true,
        team: true,
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
              },
            },
          },
        },
      },
    });

    // Auto-add team players to attendance if team-specific
    if (validatedInput.teamId) {
      const teamPlayers = await prisma.teamPlayer.findMany({
        where: {
          teamId: validatedInput.teamId,
          isActive: true,
        },
        select: { playerId: true },
      });

      if (teamPlayers.length > 0) {
        await prisma.trainingAttendance.createMany({
          data: teamPlayers.map(tp => ({
            sessionId: trainingSession.id,
            playerId: tp.playerId,
            status: 'PRESENT', // Default status
          })),
          skipDuplicates: true,
        });
      }
    }

    // Revalidate paths
    revalidatePath(`/dashboard/clubs/${validatedInput.clubId}/training`);
    if (validatedInput.teamId) {
      revalidatePath(`/dashboard/teams/${validatedInput.teamId}/training`);
    }

    return {
      success: true,
      data: {
        session: trainingSession as unknown as TrainingSessionWithRelations,
        conflictWarnings: conflictWarnings.length > 0 ? conflictWarnings : undefined,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error creating training session:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database error occurred',
          details: { prismaCode: error.code },
        },
      };
    }

    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create training session' },
    };
  }
}

// ============================================================================
// GET TRAINING SESSIONS
// ============================================================================

export async function getTrainingSessions(
  clubId: string,
  filters?: TrainingSessionFilters,
  pagination?: PaginationOptions
): Promise<ApiResponse<PaginatedResponse<TrainingSessionListItem>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(session.user.id, clubId, 'view');
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to view training sessions' } };
    }

    // Parse and validate
    const validatedFilters = TrainingSessionFiltersSchema.parse(filters ?? {});
    const validatedPagination = PaginationSchema.parse(pagination ?? {});

    const { page, limit, sortBy, sortOrder } = validatedPagination;
    const skip = (page - 1) * limit;

    const where = buildWhereClause(validatedFilters, clubId);

    const orderBy: Prisma.TrainingSessionOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { startTime: 'desc' };

    // Get total count
    const total = await prisma.trainingSession.count({ where });

    // Get sessions
    const sessions = await prisma.trainingSession.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { attendance: true },
        },
      },
    });

    return {
      success: true,
      data: {
        data: sessions as unknown as TrainingSessionListItem[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + sessions.length < total,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch training sessions' },
    };
  }
}

// ============================================================================
// GET SINGLE TRAINING SESSION
// ============================================================================

export async function getTrainingSession(
  sessionId: string
): Promise<ApiResponse<TrainingSessionWithRelations>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      include: {
        club: true,
        team: true,
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
              },
            },
          },
          orderBy: {
            player: {
              user: { lastName: 'asc' },
            },
          },
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
        },
      },
    });

    if (!trainingSession) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(
      authSession.user.id,
      trainingSession.clubId,
      'view'
    );
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to view this session' } };
    }

    return {
      success: true,
      data: trainingSession as unknown as TrainingSessionWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error fetching training session:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch training session' },
    };
  }
}

// ============================================================================
// UPDATE TRAINING SESSION
// ============================================================================

export async function updateTrainingSession(
  sessionId: string,
  input: UpdateTrainingSessionInput
): Promise<ApiResponse<TrainingSessionWithRelations>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Validate input
    const validatedInput = UpdateTrainingSessionSchema.parse(input);

    // Get existing session
    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      select: { id: true, clubId: true, coachId: true },
    });

    if (!existingSession) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(
      authSession.user.id,
      existingSession.clubId,
      'update'
    );
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to update this session' } };
    }

    // Update the session
    const updatedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        ...(validatedInput.name && { name: validatedInput.name }),
        ...(validatedInput.description !== undefined && { description: validatedInput.description }),
        ...(validatedInput.startTime && { startTime: validatedInput.startTime }),
        ...(validatedInput.endTime && { endTime: validatedInput.endTime }),
        ...(validatedInput.intensity && { intensity: validatedInput.intensity }),
        ...(validatedInput.category && { category: validatedInput.category }),
        ...(validatedInput.customCategory !== undefined && { customCategory: validatedInput.customCategory }),
        ...(validatedInput.location !== undefined && { location: validatedInput.location }),
        ...(validatedInput.facilityId !== undefined && { facilityId: validatedInput.facilityId }),
        ...(validatedInput.maxParticipants !== undefined && { maxParticipants: validatedInput.maxParticipants }),
        ...(validatedInput.drills !== undefined && { drills: validatedInput.drills as Prisma.JsonValue }),
        ...(validatedInput.notes !== undefined && { notes: validatedInput.notes }),
        ...(validatedInput.equipment && { equipment: validatedInput.equipment }),
        ...(validatedInput.focusAreas && { focusAreas: validatedInput.focusAreas }),
        ...(validatedInput.status && { status: validatedInput.status }),
        ...(validatedInput.teamId !== undefined && { teamId: validatedInput.teamId }),
      },
      include: {
        club: true,
        team: true,
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
              },
            },
          },
        },
      },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/clubs/${existingSession.clubId}/training`);
    revalidatePath(`/dashboard/training/${sessionId}`);

    return {
      success: true,
      data: updatedSession as unknown as TrainingSessionWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error updating training session:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update training session' },
    };
  }
}

// ============================================================================
// DELETE TRAINING SESSION (Soft Delete)
// ============================================================================

export async function deleteTrainingSession(
  sessionId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Get existing session
    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      select: { id: true, clubId: true },
    });

    if (!existingSession) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(
      authSession.user.id,
      existingSession.clubId,
      'delete'
    );
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to delete this session' } };
    }

    // Soft delete
    await prisma.trainingSession.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/clubs/${existingSession.clubId}/training`);

    return {
      success: true,
      data: { deleted: true },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error deleting training session:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete training session' },
    };
  }
}

// ============================================================================
// RECORD ATTENDANCE
// ============================================================================

export async function recordAttendance(
  input: RecordAttendanceInput
): Promise<ApiResponse<{ recorded: boolean }>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Validate input
    const validatedInput = RecordAttendanceSchema.parse(input);

    // Get session to check permission
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: validatedInput.sessionId, deletedAt: null },
      select: { id: true, clubId: true },
    });

    if (!trainingSession) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(
      authSession.user.id,
      trainingSession.clubId,
      'update'
    );
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to record attendance' } };
    }

    // Upsert attendance record
    await prisma.trainingAttendance.upsert({
      where: {
        sessionId_playerId: {
          sessionId: validatedInput.sessionId,
          playerId: validatedInput.playerId,
        },
      },
      update: {
        status: validatedInput.status,
        arrivalTime: validatedInput.arrivalTime,
        departTime: validatedInput.departTime,
        notes: validatedInput.notes,
        injuryId: validatedInput.injuryId,
        performanceRating: validatedInput.performanceRating,
        effortRating: validatedInput.effortRating,
        coachNotes: validatedInput.coachNotes,
        customMetrics: validatedInput.customMetrics as Prisma.JsonValue,
      },
      create: {
        sessionId: validatedInput.sessionId,
        playerId: validatedInput.playerId,
        status: validatedInput.status,
        arrivalTime: validatedInput.arrivalTime,
        departTime: validatedInput.departTime,
        notes: validatedInput.notes,
        injuryId: validatedInput.injuryId,
        performanceRating: validatedInput.performanceRating,
        effortRating: validatedInput.effortRating,
        coachNotes: validatedInput.coachNotes,
        customMetrics: validatedInput.customMetrics as Prisma.JsonValue,
      },
    });

    // Update attendance count on session
    const attendanceCount = await prisma.trainingAttendance.count({
      where: {
        sessionId: validatedInput.sessionId,
        status: { in: ['PRESENT', 'LATE', 'LEFT_EARLY', 'PARTIAL'] },
      },
    });

    await prisma.trainingSession.update({
      where: { id: validatedInput.sessionId },
      data: { attendanceCount },
    });

    // Revalidate
    revalidatePath(`/dashboard/training/${validatedInput.sessionId}`);

    return {
      success: true,
      data: { recorded: true },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error recording attendance:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to record attendance' },
    };
  }
}

// ============================================================================
// BULK RECORD ATTENDANCE
// ============================================================================

export async function bulkRecordAttendance(
  input: BulkAttendanceInput
): Promise<ApiResponse<{ recorded: number }>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Validate input
    const validatedInput = BulkAttendanceSchema.parse(input);

    // Get session to check permission
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: validatedInput.sessionId, deletedAt: null },
      select: { id: true, clubId: true },
    });

    if (!trainingSession) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(
      authSession.user.id,
      trainingSession.clubId,
      'update'
    );
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to record attendance' } };
    }

    // Bulk upsert attendance
    const results = await prisma.$transaction(
      validatedInput.attendance.map(record =>
        prisma.trainingAttendance.upsert({
          where: {
            sessionId_playerId: {
              sessionId: validatedInput.sessionId,
              playerId: record.playerId,
            },
          },
          update: {
            status: record.status,
            notes: record.notes,
          },
          create: {
            sessionId: validatedInput.sessionId,
            playerId: record.playerId,
            status: record.status,
            notes: record.notes,
          },
        })
      )
    );

    // Update attendance count
    const attendanceCount = await prisma.trainingAttendance.count({
      where: {
        sessionId: validatedInput.sessionId,
        status: { in: ['PRESENT', 'LATE', 'LEFT_EARLY', 'PARTIAL'] },
      },
    });

    await prisma.trainingSession.update({
      where: { id: validatedInput.sessionId },
      data: { attendanceCount },
    });

    // Revalidate
    revalidatePath(`/dashboard/training/${validatedInput.sessionId}`);

    return {
      success: true,
      data: { recorded: results.length },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error bulk recording attendance:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to record attendance' },
    };
  }
}

// ============================================================================
// GET ATTENDANCE SUMMARY
// ============================================================================

export async function getAttendanceSummary(
  sessionId: string
): Promise<ApiResponse<AttendanceSummary>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      select: { id: true, clubId: true },
    });

    if (!trainingSession) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(
      authSession.user.id,
      trainingSession.clubId,
      'view'
    );
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission' } };
    }

    // Get attendance stats
    const attendance = await prisma.trainingAttendance.groupBy({
      by: ['status'],
      where: { sessionId },
      _count: { status: true },
    });

    const statusCounts: Record<string, number> = {};
    let total = 0;

    for (const record of attendance) {
      statusCounts[record.status] = record._count.status;
      total += record._count.status;
    }

    const present = (statusCounts['PRESENT'] || 0) +
      (statusCounts['LATE'] || 0) +
      (statusCounts['LEFT_EARLY'] || 0) +
      (statusCounts['PARTIAL'] || 0);

    const summary: AttendanceSummary = {
      sessionId,
      total,
      present,
      absent: statusCounts['ABSENT'] || 0,
      excused: statusCounts['EXCUSED'] || 0,
      late: statusCounts['LATE'] || 0,
      injured: statusCounts['INJURED'] || 0,
      sick: statusCounts['SICK'] || 0,
      suspended: statusCounts['SUSPENDED'] || 0,
      attendanceRate: total > 0 ? (present / total) * 100 : 0,
    };

    return {
      success: true,
      data: summary,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error getting attendance summary:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get attendance summary' },
    };
  }
}

// ============================================================================
// GET PLAYER ATTENDANCE RECORDS
// ============================================================================

export async function getPlayerAttendanceRecords(
  clubId: string,
  playerId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<ApiResponse<PlayerAttendanceRecord[]>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(authSession.user.id, clubId, 'view');
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission' } };
    }

    const where: Prisma.TrainingAttendanceWhereInput = {
      session: {
        clubId,
        deletedAt: null,
        ...(startDate && { startTime: { gte: startDate } }),
        ...(endDate && { startTime: { lte: endDate } }),
      },
      ...(playerId && { playerId }),
    };

    const attendanceRecords = await prisma.trainingAttendance.findMany({
      where,
      include: {
        player: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        session: {
          select: { startTime: true },
        },
      },
      orderBy: { session: { startTime: 'desc' } },
    });

    // Aggregate by player
    const playerMap = new Map<string, PlayerAttendanceRecord>();

    for (const record of attendanceRecords) {
      const pid = record.playerId;
      const playerName = `${record.player.user.firstName} ${record.player.user.lastName}`;

      if (!playerMap.has(pid)) {
        playerMap.set(pid, {
          playerId: pid,
          playerName,
          totalSessions: 0,
          attended: 0,
          missed: 0,
          excused: 0,
          injured: 0,
          attendanceRate: 0,
          lastAttended: null,
          streak: 0,
        });
      }

      const playerRecord = playerMap.get(pid)!;
      playerRecord.totalSessions++;

      const presentStatuses = ['PRESENT', 'LATE', 'LEFT_EARLY', 'PARTIAL'];
      if (presentStatuses.includes(record.status)) {
        playerRecord.attended++;
        if (!playerRecord.lastAttended) {
          playerRecord.lastAttended = record.session.startTime;
        }
      } else if (record.status === 'ABSENT') {
        playerRecord.missed++;
      } else if (record.status === 'EXCUSED') {
        playerRecord.excused++;
      } else if (record.status === 'INJURED' || record.status === 'SICK') {
        playerRecord.injured++;
      }
    }

    // Calculate rates and streaks
    const records: PlayerAttendanceRecord[] = [];
    for (const [, record] of playerMap) {
      record.attendanceRate =
        record.totalSessions > 0
          ? (record.attended / record.totalSessions) * 100
          : 0;
      records.push(record);
    }

    // Sort by attendance rate descending
    records.sort((a, b) => b.attendanceRate - a.attendanceRate);

    return {
      success: true,
      data: records,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error getting player attendance records:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get attendance records' },
    };
  }
}

// ============================================================================
// GET TRAINING CALENDAR
// ============================================================================

export async function getTrainingCalendar(
  clubId: string,
  startDate: Date,
  endDate: Date,
  teamId?: string | null,
  coachId?: string
): Promise<ApiResponse<TrainingCalendarEvent[]>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(authSession.user.id, clubId, 'view');
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission' } };
    }

    const where: Prisma.TrainingSessionWhereInput = {
      clubId,
      deletedAt: null,
      startTime: { gte: startDate, lte: endDate },
      ...(teamId !== undefined && { teamId }),
      ...(coachId && { coachId }),
    };

    const sessions = await prisma.trainingSession.findMany({
      where,
      include: {
        coach: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        team: { select: { id: true, name: true } },
        _count: { select: { attendance: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    const calendarEvents: TrainingCalendarEvent[] = sessions.map(session => ({
      id: session.id,
      title: session.name,
      start: session.startTime,
      end: session.endTime,
      status: session.status as TrainingCalendarEvent['status'],
      category: session.category as TrainingCalendarEvent['category'],
      customCategory: session.customCategory,
      intensity: session.intensity as TrainingCalendarEvent['intensity'],
      location: session.location,
      coach: {
        id: session.coach.id,
        name: `${session.coach.user.firstName} ${session.coach.user.lastName}`,
      },
      team: session.team ? { id: session.team.id, name: session.team.name } : null,
      attendeeCount: session._count.attendance,
      maxParticipants: session.maxParticipants,
      color: getIntensityColor(session.intensity),
    }));

    return {
      success: true,
      data: calendarEvents,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error getting training calendar:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get training calendar' },
    };
  }
}

/**
 * Get color based on training intensity
 */
function getIntensityColor(intensity: string): string {
  const colors: Record<string, string> = {
    RECOVERY: '#10B981', // Green
    LOW: '#3B82F6', // Blue
    MEDIUM: '#F59E0B', // Amber
    HIGH: '#EF4444', // Red
    MAXIMUM: '#7C3AED', // Purple
    COMPETITIVE: '#EC4899', // Pink
  };
  return colors[intensity] || '#6B7280'; // Gray default
}

// ============================================================================
// CANCEL TRAINING SESSION
// ============================================================================

export async function cancelTrainingSession(
  sessionId: string,
  reason?: string
): Promise<ApiResponse<TrainingSessionWithRelations>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      select: { id: true, clubId: true, status: true },
    });

    if (!existingSession) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } };
    }

    if (existingSession.status === 'CANCELLED') {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Session is already cancelled' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(
      authSession.user.id,
      existingSession.clubId,
      'update'
    );
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to cancel this session' } };
    }

    const updatedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELLED',
        notes: reason
          ? `CANCELLED: ${reason}${existingSession.status ? `\n\nOriginal notes: ${existingSession.status}` : ''}`
          : undefined,
      },
      include: {
        club: true,
        team: true,
        coach: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
            },
          },
        },
        attendance: {
          include: {
            player: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/clubs/${existingSession.clubId}/training`);
    revalidatePath(`/dashboard/training/${sessionId}`);

    return {
      success: true,
      data: updatedSession as unknown as TrainingSessionWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error cancelling training session:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel training session' },
    };
  }
}

// ============================================================================
// DUPLICATE TRAINING SESSION
// ============================================================================

export async function duplicateTrainingSession(
  sessionId: string,
  newStartTime: Date
): Promise<ApiResponse<TrainingSessionWithRelations>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const originalSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
    });

    if (!originalSession) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } };
    }

    // Check permission
    const hasPermission = await checkTrainingPermission(
      authSession.user.id,
      originalSession.clubId,
      'create'
    );
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to create sessions' } };
    }

    // Calculate new end time based on original duration
    const durationMs = originalSession.endTime.getTime() - originalSession.startTime.getTime();
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    const duplicatedSession = await prisma.trainingSession.create({
      data: {
        clubId: originalSession.clubId,
        teamId: originalSession.teamId,
        coachId: originalSession.coachId,
        name: `${originalSession.name} (Copy)`,
        description: originalSession.description,
        startTime: newStartTime,
        endTime: newEndTime,
        intensity: originalSession.intensity,
        category: originalSession.category,
        customCategory: originalSession.customCategory,
        location: originalSession.location,
        facilityId: originalSession.facilityId,
        maxParticipants: originalSession.maxParticipants,
        drills: originalSession.drills,
        notes: originalSession.notes,
        equipment: originalSession.equipment,
        focusAreas: originalSession.focusAreas,
        status: 'SCHEDULED',
      },
      include: {
        club: true,
        team: true,
        coach: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
            },
          },
        },
        attendance: {
          include: {
            player: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/clubs/${originalSession.clubId}/training`);

    return {
      success: true,
      data: duplicatedSession as unknown as TrainingSessionWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error duplicating training session:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to duplicate training session' },
    };
  }
}