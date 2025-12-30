// =============================================================================
// 📋 TRAINING ATTENDANCE API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]/attendance
// POST /api/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]/attendance
// =============================================================================
// Schema: v7.8.0 | Model: TrainingAttendance
// Field Mapping: sessionId (not trainingSessionId), playerId (Player.id)
// Permission: Owner, Manager, Head Coach, Assistant Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, AttendanceStatus, TrainingStatus } from '@prisma/client';

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
  shirtNumber: number | null;
  status: AttendanceStatus;
  arrivalTime: string | null;
  departTime: string | null;
  performanceRating: number | null;
  effortRating: number | null;
  notes: string | null;
  coachNotes: string | null;
  customMetrics: Record<string, unknown> | null;
}

interface AttendanceResponse {
  sessionId: string;
  sessionName: string;
  sessionDate: string;
  attendance: AttendanceRecord[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    injured: number;
    attendanceRate: number;
    avgPerformanceRating: number | null;
    avgEffortRating: number | null;
  };
  availablePlayers: Array<{
    playerId: string;
    playerName: string;
    position: string | null;
    shirtNumber: number | null;
    hasRecord: boolean;
  }>;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AttendanceRecordSchema = z.object({
  playerId: z.string().min(1),
  status: z.nativeEnum(AttendanceStatus),
  arrivalTime: z.string().datetime().optional().nullable(),
  departTime: z.string().datetime().optional().nullable(),
  performanceRating: z.number().min(1).max(10).optional().nullable(),
  effortRating: z.number().min(1).max(10).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  coachNotes: z.string().max(1000).optional().nullable(),
  customMetrics: z.record(z.unknown()).optional().nullable(),
});

const BulkAttendanceSchema = z.object({
  attendance: z.array(AttendanceRecordSchema).min(1).max(100),
  replaceExisting: z.boolean().default(false),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `attend_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
  ClubMemberRole.PERFORMANCE_COACH,
];

const VIEW_ROLES: ClubMemberRole[] = [
  ...MANAGE_ROLES,
  ClubMemberRole.ANALYST,
  ClubMemberRole.STAFF,
];

async function getPermissions(
  userId: string,
  clubId: string
): Promise<{ canView: boolean; canManage: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    return { canView: true, canManage: true };
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
    return { canView: false, canManage: false };
  }

  return {
    canView: VIEW_ROLES.includes(clubMember.role),
    canManage: MANAGE_ROLES.includes(clubMember.role),
  };
}

// =============================================================================
// GET HANDLER - Fetch Training Attendance
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
        error: 'You do not have permission to view attendance',
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

    // 4. Fetch training session
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: trainingId },
      select: {
        id: true,
        name: true,
        teamId: true,
        startTime: true,
        deletedAt: true,
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

    // 5. Fetch attendance records (using correct field: sessionId)
    const attendanceRecords = await prisma.trainingAttendance.findMany({
      where: { sessionId: trainingId },
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
    });

    // 6. Get all team players for comparison
    const teamPlayers = await prisma.teamPlayer.findMany({
      where: {
        teamId,
        isActive: true,
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // 7. Build attendance list
    const recordedPlayerIds = new Set(attendanceRecords.map((a) => a.playerId));

    const attendance: AttendanceRecord[] = attendanceRecords.map((a) => ({
      id: a.id,
      playerId: a.playerId,
      playerName: `${a.player.user.firstName} ${a.player.user.lastName}`,
      avatar: a.player.user.avatar,
      position: a.player.primaryPosition,
      shirtNumber: a.player.jerseyNumber,
      status: a.status,
      arrivalTime: a.arrivalTime?.toISOString() || null,
      departTime: a.departTime?.toISOString() || null,
      performanceRating: a.performanceRating,
      effortRating: a.effortRating,
      notes: a.notes,
      coachNotes: a.coachNotes,
      customMetrics: a.customMetrics as Record<string, unknown> | null,
    }));

    // 8. Calculate summary stats
    const present = attendanceRecords.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const absent = attendanceRecords.filter((a) => a.status === AttendanceStatus.ABSENT).length;
    const late = attendanceRecords.filter((a) => a.status === AttendanceStatus.LATE).length;
    const excused = attendanceRecords.filter((a) => a.status === AttendanceStatus.EXCUSED).length;
    const injured = attendanceRecords.filter((a) => a.status === AttendanceStatus.INJURED).length;

    const performanceRatings = attendanceRecords
      .filter((a) => a.performanceRating !== null)
      .map((a) => a.performanceRating as number);

    const effortRatings = attendanceRecords
      .filter((a) => a.effortRating !== null)
      .map((a) => a.effortRating as number);

    const avgPerformanceRating = performanceRatings.length > 0
      ? Math.round((performanceRatings.reduce((a, b) => a + b, 0) / performanceRatings.length) * 10) / 10
      : null;

    const avgEffortRating = effortRatings.length > 0
      ? Math.round((effortRatings.reduce((a, b) => a + b, 0) / effortRatings.length) * 10) / 10
      : null;

    const total = attendanceRecords.length;
    const attendanceRate = total > 0
      ? Math.round(((present + late) / total) * 100)
      : 0;

    // 9. Build available players list
    const availablePlayers = teamPlayers.map((tp) => ({
      playerId: tp.playerId,
      playerName: `${tp.player.user.firstName} ${tp.player.user.lastName}`,
      position: tp.position,
      shirtNumber: tp.jerseyNumber,
      hasRecord: recordedPlayerIds.has(tp.playerId),
    }));

    // 10. Build response
    const response: AttendanceResponse = {
      sessionId: trainingSession.id,
      sessionName: trainingSession.name,
      sessionDate: trainingSession.startTime.toISOString(),
      attendance,
      summary: {
        total,
        present,
        absent,
        late,
        excused,
        injured,
        attendanceRate,
        avgPerformanceRating,
        avgEffortRating,
      },
      availablePlayers,
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Training Attendance error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch attendance records',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Save Training Attendance (Bulk Upsert)
// =============================================================================

export async function POST(
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
    if (!permissions.canManage) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to manage attendance',
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

    // 4. Fetch training session
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: trainingId },
      select: {
        id: true,
        teamId: true,
        status: true,
        deletedAt: true,
        name: true,
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

    const validation = BulkAttendanceSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { attendance, replaceExisting } = validation.data;

    // 6. Validate all player IDs exist and are on the team
    const playerIds = attendance.map((a) => a.playerId);
    const teamPlayers = await prisma.teamPlayer.findMany({
      where: {
        teamId,
        playerId: { in: playerIds },
      },
      select: { playerId: true },
    });

    const validPlayerIds = new Set(teamPlayers.map((tp) => tp.playerId));
    const invalidPlayers = playerIds.filter((id) => !validPlayerIds.has(id));

    if (invalidPlayers.length > 0) {
      return createResponse(null, {
        success: false,
        error: `Invalid player IDs: ${invalidPlayers.join(', ')}. Players must be on this team.`,
        code: 'INVALID_PLAYERS',
        requestId,
        status: 400,
      });
    }

    // 7. Process attendance records using transaction
    const results = await prisma.$transaction(async (tx) => {
      // If replaceExisting, delete all existing records first
      if (replaceExisting) {
        await tx.trainingAttendance.deleteMany({
          where: { sessionId: trainingId },
        });
      }

      // Upsert each attendance record
      const upsertedRecords = await Promise.all(
        attendance.map(async (record) => {
          return tx.trainingAttendance.upsert({
            where: {
              sessionId_playerId: {
                sessionId: trainingId,
                playerId: record.playerId,
              },
            },
            create: {
              sessionId: trainingId,
              playerId: record.playerId,
              status: record.status,
              arrivalTime: record.arrivalTime ? new Date(record.arrivalTime) : null,
              departTime: record.departTime ? new Date(record.departTime) : null,
              performanceRating: record.performanceRating ?? null,
              effortRating: record.effortRating ?? null,
              notes: record.notes ?? null,
              coachNotes: record.coachNotes ?? null,
              customMetrics: record.customMetrics ?? null,
            },
            update: {
              status: record.status,
              arrivalTime: record.arrivalTime ? new Date(record.arrivalTime) : null,
              departTime: record.departTime ? new Date(record.departTime) : null,
              performanceRating: record.performanceRating ?? null,
              effortRating: record.effortRating ?? null,
              notes: record.notes ?? null,
              coachNotes: record.coachNotes ?? null,
              customMetrics: record.customMetrics ?? null,
            },
            include: {
              player: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          });
        })
      );

      // Update session attendance count
      const totalAttendance = await tx.trainingAttendance.count({
        where: { sessionId: trainingId },
      });

      // Calculate average rating
      const ratings = await tx.trainingAttendance.aggregate({
        where: {
          sessionId: trainingId,
          performanceRating: { not: null },
        },
        _avg: { performanceRating: true },
      });

      await tx.trainingSession.update({
        where: { id: trainingId },
        data: {
          attendanceCount: totalAttendance,
          avgRating: ratings._avg.performanceRating,
        },
      });

      return upsertedRecords;
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRAINING_UPDATED',
        resourceType: 'TRAINING_ATTENDANCE',
        resourceId: trainingId,
        afterState: {
          recordsUpdated: results.length,
          replaceExisting,
        },
      },
    });

    // 9. Build response
    const savedRecords: AttendanceRecord[] = results.map((r) => ({
      id: r.id,
      playerId: r.playerId,
      playerName: `${r.player.user.firstName} ${r.player.user.lastName}`,
      avatar: null,
      position: r.player.primaryPosition,
      shirtNumber: r.player.jerseyNumber,
      status: r.status,
      arrivalTime: r.arrivalTime?.toISOString() || null,
      departTime: r.departTime?.toISOString() || null,
      performanceRating: r.performanceRating,
      effortRating: r.effortRating,
      notes: r.notes,
      coachNotes: r.coachNotes,
      customMetrics: r.customMetrics as Record<string, unknown> | null,
    }));

    return createResponse({
      sessionId: trainingId,
      recordsSaved: results.length,
      attendance: savedRecords,
    }, {
      success: true,
      message: `Successfully saved ${results.length} attendance records`,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Save Training Attendance error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to save attendance records',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}