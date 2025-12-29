// ============================================================================
// 📋 ATTENDANCE ACTIONS - PitchConnect v7.3.0
// ============================================================================
// Server actions for enhanced attendance management
// Supports INJURED, SICK, SUSPENDED statuses
// ============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import type { AttendanceStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface AttendanceRecord {
  playerId: string;
  status: AttendanceStatus;
  arrivalTime?: Date | null;
  departTime?: Date | null;
  notes?: string | null;
  injuryId?: string | null;
  performanceRating?: number | null;
  effortRating?: number | null;
  coachNotes?: string | null;
  customMetrics?: Record<string, unknown> | null;
}

interface AttendanceWithPlayer {
  id: string;
  status: AttendanceStatus;
  arrivalTime: Date | null;
  departTime: Date | null;
  notes: string | null;
  performanceRating: number | null;
  effortRating: number | null;
  coachNotes: string | null;
  player: {
    id: string;
    jerseyNumber: number | null;
    primaryPosition: string | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  };
  injury?: {
    id: string;
    type: string;
    severity: string;
  } | null;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  leftEarly: number;
  partial: number;
  injured: number;
  sick: number;
  suspended: number;
  attendanceRate: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkAttendancePermission(
  userId: string,
  sessionId: string
): Promise<{ canManage: boolean; clubId: string | null }> {
  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId, deletedAt: null },
    select: { clubId: true },
  });

  if (!session) return { canManage: false, clubId: null };

  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId: session.clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
    },
  });

  return { canManage: !!membership, clubId: session.clubId };
}

// ============================================================================
// GET SESSION ATTENDANCE
// ============================================================================

export async function getSessionAttendance(
  sessionId: string
): Promise<ApiResponse<AttendanceWithPlayer[]>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const { canManage, clubId } = await checkAttendancePermission(authSession.user.id, sessionId);
    
    // For viewing, also allow regular members
    if (!clubId) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } };
    }

    const attendance = await prisma.trainingAttendance.findMany({
      where: { sessionId },
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
        injury: {
          select: {
            id: true,
            type: true,
            severity: true,
          },
        },
      },
      orderBy: [
        { player: { user: { lastName: 'asc' } } },
        { player: { user: { firstName: 'asc' } } },
      ],
    });

    return {
      success: true,
      data: attendance as unknown as AttendanceWithPlayer[],
    };
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch attendance' },
    };
  }
}

// ============================================================================
// UPDATE SINGLE ATTENDANCE
// ============================================================================

export async function updateAttendance(
  sessionId: string,
  record: AttendanceRecord
): Promise<ApiResponse<{ updated: boolean }>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const { canManage, clubId } = await checkAttendancePermission(authSession.user.id, sessionId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to update attendance' } };
    }

    // Validate injury reference if status is INJURED
    if (record.status === 'INJURED' && record.injuryId) {
      const injury = await prisma.injury.findUnique({
        where: { id: record.injuryId },
        select: { playerId: true },
      });

      if (!injury || injury.playerId !== record.playerId) {
        return { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid injury reference' } };
      }
    }

    await prisma.trainingAttendance.upsert({
      where: {
        sessionId_playerId: {
          sessionId,
          playerId: record.playerId,
        },
      },
      update: {
        status: record.status,
        arrivalTime: record.arrivalTime,
        departTime: record.departTime,
        notes: record.notes,
        injuryId: record.injuryId,
        performanceRating: record.performanceRating,
        effortRating: record.effortRating,
        coachNotes: record.coachNotes,
        customMetrics: record.customMetrics as Prisma.JsonValue,
      },
      create: {
        sessionId,
        playerId: record.playerId,
        status: record.status,
        arrivalTime: record.arrivalTime,
        departTime: record.departTime,
        notes: record.notes,
        injuryId: record.injuryId,
        performanceRating: record.performanceRating,
        effortRating: record.effortRating,
        coachNotes: record.coachNotes,
        customMetrics: record.customMetrics as Prisma.JsonValue,
      },
    });

    // Update session attendance count
    await updateSessionAttendanceCount(sessionId);

    revalidatePath(`/dashboard/training/${sessionId}`);

    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating attendance:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update attendance' },
    };
  }
}

// ============================================================================
// BULK UPDATE ATTENDANCE
// ============================================================================

export async function bulkUpdateAttendance(
  sessionId: string,
  records: AttendanceRecord[]
): Promise<ApiResponse<{ updated: number }>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const { canManage, clubId } = await checkAttendancePermission(authSession.user.id, sessionId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to update attendance' } };
    }

    // Perform bulk upsert in transaction
    const results = await prisma.$transaction(
      records.map((record) =>
        prisma.trainingAttendance.upsert({
          where: {
            sessionId_playerId: {
              sessionId,
              playerId: record.playerId,
            },
          },
          update: {
            status: record.status,
            arrivalTime: record.arrivalTime,
            departTime: record.departTime,
            notes: record.notes,
            injuryId: record.injuryId,
            performanceRating: record.performanceRating,
            effortRating: record.effortRating,
            coachNotes: record.coachNotes,
            customMetrics: record.customMetrics as Prisma.JsonValue,
          },
          create: {
            sessionId,
            playerId: record.playerId,
            status: record.status,
            arrivalTime: record.arrivalTime,
            departTime: record.departTime,
            notes: record.notes,
            injuryId: record.injuryId,
            performanceRating: record.performanceRating,
            effortRating: record.effortRating,
            coachNotes: record.coachNotes,
            customMetrics: record.customMetrics as Prisma.JsonValue,
          },
        })
      )
    );

    // Update session attendance count
    await updateSessionAttendanceCount(sessionId);

    revalidatePath(`/dashboard/training/${sessionId}`);

    return { success: true, data: { updated: results.length } };
  } catch (error) {
    console.error('Error bulk updating attendance:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update attendance' },
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

    const attendance = await prisma.trainingAttendance.groupBy({
      by: ['status'],
      where: { sessionId },
      _count: { status: true },
    });

    const counts: Record<string, number> = {};
    let total = 0;

    for (const record of attendance) {
      counts[record.status] = record._count.status;
      total += record._count.status;
    }

    const present =
      (counts['PRESENT'] || 0) +
      (counts['LATE'] || 0) +
      (counts['LEFT_EARLY'] || 0) +
      (counts['PARTIAL'] || 0);

    const summary: AttendanceSummary = {
      total,
      present,
      absent: counts['ABSENT'] || 0,
      excused: counts['EXCUSED'] || 0,
      late: counts['LATE'] || 0,
      leftEarly: counts['LEFT_EARLY'] || 0,
      partial: counts['PARTIAL'] || 0,
      injured: counts['INJURED'] || 0,
      sick: counts['SICK'] || 0,
      suspended: counts['SUSPENDED'] || 0,
      attendanceRate: total > 0 ? (present / total) * 100 : 0,
    };

    return { success: true, data: summary };
  } catch (error) {
    console.error('Error getting attendance summary:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get summary' },
    };
  }
}

// ============================================================================
// GET PLAYER ATTENDANCE HISTORY
// ============================================================================

export async function getPlayerAttendanceHistory(
  playerId: string,
  clubId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<ApiResponse<{
  records: Array<{
    sessionId: string;
    sessionName: string;
    sessionDate: Date;
    status: AttendanceStatus;
    performanceRating: number | null;
    effortRating: number | null;
  }>;
  stats: {
    total: number;
    attended: number;
    missed: number;
    injured: number;
    attendanceRate: number;
    averagePerformance: number | null;
    averageEffort: number | null;
  };
}>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const where: Prisma.TrainingAttendanceWhereInput = {
      playerId,
      session: {
        clubId,
        deletedAt: null,
        ...(options?.startDate && { startTime: { gte: options.startDate } }),
        ...(options?.endDate && { startTime: { lte: options.endDate } }),
      },
    };

    const records = await prisma.trainingAttendance.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            name: true,
            startTime: true,
          },
        },
      },
      orderBy: { session: { startTime: 'desc' } },
      take: options?.limit || 50,
    });

    // Calculate stats
    const presentStatuses: AttendanceStatus[] = ['PRESENT', 'LATE', 'LEFT_EARLY', 'PARTIAL'];
    let total = records.length;
    let attended = 0;
    let missed = 0;
    let injured = 0;
    let totalPerformance = 0;
    let performanceCount = 0;
    let totalEffort = 0;
    let effortCount = 0;

    for (const record of records) {
      if (presentStatuses.includes(record.status)) {
        attended++;
      } else if (record.status === 'ABSENT') {
        missed++;
      } else if (record.status === 'INJURED' || record.status === 'SICK') {
        injured++;
      }

      if (record.performanceRating) {
        totalPerformance += record.performanceRating;
        performanceCount++;
      }
      if (record.effortRating) {
        totalEffort += record.effortRating;
        effortCount++;
      }
    }

    return {
      success: true,
      data: {
        records: records.map((r) => ({
          sessionId: r.session.id,
          sessionName: r.session.name,
          sessionDate: r.session.startTime,
          status: r.status,
          performanceRating: r.performanceRating,
          effortRating: r.effortRating,
        })),
        stats: {
          total,
          attended,
          missed,
          injured,
          attendanceRate: total > 0 ? (attended / total) * 100 : 0,
          averagePerformance: performanceCount > 0 ? totalPerformance / performanceCount : null,
          averageEffort: effortCount > 0 ? totalEffort / effortCount : null,
        },
      },
    };
  } catch (error) {
    console.error('Error getting player attendance history:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get history' },
    };
  }
}

// ============================================================================
// MARK ALL PRESENT
// ============================================================================

export async function markAllPresent(
  sessionId: string,
  playerIds: string[]
): Promise<ApiResponse<{ marked: number }>> {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const { canManage } = await checkAttendancePermission(authSession.user.id, sessionId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission' } };
    }

    const results = await prisma.$transaction(
      playerIds.map((playerId) =>
        prisma.trainingAttendance.upsert({
          where: {
            sessionId_playerId: { sessionId, playerId },
          },
          update: { status: 'PRESENT' },
          create: { sessionId, playerId, status: 'PRESENT' },
        })
      )
    );

    await updateSessionAttendanceCount(sessionId);
    revalidatePath(`/dashboard/training/${sessionId}`);

    return { success: true, data: { marked: results.length } };
  } catch (error) {
    console.error('Error marking all present:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to mark attendance' },
    };
  }
}

// ============================================================================
// HELPER: Update Session Attendance Count
// ============================================================================

async function updateSessionAttendanceCount(sessionId: string): Promise<void> {
  const count = await prisma.trainingAttendance.count({
    where: {
      sessionId,
      status: { in: ['PRESENT', 'LATE', 'LEFT_EARLY', 'PARTIAL'] },
    },
  });

  await prisma.trainingSession.update({
    where: { id: sessionId },
    data: { attendanceCount: count },
  });
}