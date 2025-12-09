/**
 * Training Sessions List API Endpoints
 * GET    /api/training/sessions  - Get all training sessions with filters
 * 
 * Schema-Aligned: TrainingSession, Drill, SessionDrill, TrainingAttendance models
 * - Proper AttendanceStatus enum: PRESENT, ABSENT, EXCUSED, LATE, LEFT_EARLY
 * - Complete session listing with filtering and pagination
 * - Accurate attendance statistics based on actual status values
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AttendanceStatus, TrainingCategory } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface SessionDrillResponse {
  id: string;
  name: string;
  duration: number;
  category: TrainingCategory;
  order: number;
}

interface AttendanceStats {
  present: number;
  absent: number;
  excused: number;
  late: number;
  leftEarly: number;
  total: number;
}

interface TrainingSessionListResponse {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string | null;
  focus: string;
  notes: string | null;
  sessionType: string;
  team: {
    id: string;
    name: string;
    club: {
      id: string;
      name: string;
    };
  };
  coach?: {
    id: string;
    name: string;
  };
  drills: SessionDrillResponse[];
  attendance: AttendanceStats;
  drillCount: number;
  attendanceCount: number;
  createdAt: string;
}

interface ListSessionsResponse {
  success: boolean;
  data: TrainingSessionListResponse[];
  pagination: {
    total: number;
    limit: number;
    returned: number;
  };
  filters: {
    teamId?: string | null;
    sessionType?: string | null;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculate attendance statistics from array of attendance records
 */
function calculateAttendanceStats(
  attendanceRecords: Array<{ status: AttendanceStatus }>
): AttendanceStats {
  return {
    present: attendanceRecords.filter((a) => a.status === 'PRESENT').length,
    absent: attendanceRecords.filter((a) => a.status === 'ABSENT').length,
    excused: attendanceRecords.filter((a) => a.status === 'EXCUSED').length,
    late: attendanceRecords.filter((a) => a.status === 'LATE').length,
    leftEarly: attendanceRecords.filter((a) => a.status === 'LEFT_EARLY').length,
    total: attendanceRecords.length,
  };
}

// ============================================================================
// GET /api/training/sessions
// ============================================================================

/**
 * Retrieve all training sessions with optional filtering
 * 
 * Query parameters:
 * - teamId: Filter by team ID
 * - sessionType: Filter by session type (TEAM, INDIVIDUAL, GROUP)
 * - limit: Results per page (default 50, max 200)
 * - page: Page number for pagination (default 1)
 * 
 * Returns: Array of TrainingSession objects with drills and attendance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ========================================================================
    // PARSE QUERY PARAMETERS
    // ========================================================================

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const sessionType = searchParams.get('sessionType');
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      200
    );

    // Validate page and limit
    const page = Math.max(1, pageParam);
    const limit = Math.max(1, limitParam);
    const skip = (page - 1) * limit;

    // ========================================================================
    // BUILD WHERE CLAUSE
    // ========================================================================

    const where: any = {};

    if (teamId && teamId.length > 0) {
      where.teamId = teamId;
    }

    if (sessionType) {
      const validSessionTypes = ['TEAM', 'INDIVIDUAL', 'GROUP'];
      if (validSessionTypes.includes(sessionType)) {
        where.sessionType = sessionType;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid session type',
            validTypes: validSessionTypes,
          },
          { status: 400 }
        );
      }
    }

    // ========================================================================
    // FETCH TRAINING SESSIONS
    // ========================================================================

    const [sessions, total] = await Promise.all([
      prisma.trainingSession.findMany({
        where,
        include: {
          team: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          coach: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          drills: {
            include: {
              drill: {
                select: {
                  id: true,
                  name: true,
                  duration: true,
                  intensity: true,
                  category: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          attendance: {
            select: {
              status: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.trainingSession.count({ where }),
    ]);

    // ========================================================================
    // TRANSFORM RESPONSE
    // ========================================================================

    const transformedSessions: TrainingSessionListResponse[] = sessions.map(
      (sess) => {
        const attendanceStats = calculateAttendanceStats(sess.attendance);

        const formattedSession: TrainingSessionListResponse = {
          id: sess.id,
          date: sess.date.toISOString(),
          startTime: sess.startTime.toISOString(),
          endTime: sess.endTime.toISOString(),
          duration: sess.duration,
          location: sess.location,
          focus: sess.focus,
          notes: sess.notes,
          sessionType: sess.sessionType,
          team: {
            id: sess.team.id,
            name: sess.team.name,
            club: {
              id: sess.team.club.id,
              name: sess.team.club.name,
            },
          },
          drills: sess.drills.map((d) => ({
            id: d.drill.id,
            name: d.drill.name,
            duration: d.durationOverride || d.drill.duration,
            category: d.drill.category,
            order: d.order,
          })),
          attendance: attendanceStats,
          drillCount: sess.drills.length,
          attendanceCount: sess.attendance.length,
          createdAt: sess.createdAt.toISOString(),
        };

        // Add coach if available
        if (sess.coach) {
          formattedSession.coach = {
            id: sess.coach.user.id,
            name: `${sess.coach.user.firstName} ${sess.coach.user.lastName}`.trim(),
          };
        }

        return formattedSession;
      }
    );

    // ========================================================================
    // BUILD RESPONSE
    // ========================================================================

    const response: ListSessionsResponse = {
      success: true,
      data: transformedSessions,
      pagination: {
        total,
        limit,
        returned: transformedSessions.length,
      },
      filters: {
        teamId: teamId || null,
        sessionType: sessionType || null,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('❌ Get training sessions error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch training sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
