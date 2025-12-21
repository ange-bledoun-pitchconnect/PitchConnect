/**
 * Training Session Detail API Endpoints
 * GET    /api/training/sessions/[sessionId]  - Get training session details
 * PATCH  /api/training/sessions/[sessionId]  - Update training session
 * DELETE /api/training/sessions/[sessionId]  - Delete training session
 * 
 * Schema-Aligned: TrainingSession, Drill, SessionDrill, TrainingAttendance models
 * - Proper AttendanceStatus enum: PRESENT, ABSENT, EXCUSED, LATE, LEFT_EARLY
 * - Full session details with drills and attendance tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AttendanceStatus, TrainingIntensity, TrainingCategory } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface SessionDrillResponse {
  id: string;
  name: string;
  duration: number;
  category: TrainingCategory;
  intensity: string;
  order: number;
  durationOverride?: number | null;
}

interface AttendanceStats {
  present: number;
  absent: number;
  excused: number;
  late: number;
  leftEarly: number;
  total: number;
}

interface TrainingSessionResponse {
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
      name: string;
    };
  };
  coach: {
    id: string;
    name: string;
    email: string;
  };
  drills: SessionDrillResponse[];
  attendance: AttendanceStats;
  counts: {
    drills: number;
    attendees: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validate attendance status
 */
function isValidAttendanceStatus(value: string): value is AttendanceStatus {
  return ['PRESENT', 'ABSENT', 'EXCUSED', 'LATE', 'LEFT_EARLY'].includes(value);
}

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
// GET /api/training/sessions/[sessionId]
// ============================================================================

/**
 * Retrieve detailed training session information including drills and attendance
 * 
 * Parameters:
 * - sessionId: Training session ID
 * 
 * Returns: Complete TrainingSession with related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;

    // Validate sessionId format
    if (!sessionId || sessionId.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Fetch training session with all relations
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
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
                email: true,
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
    });

    if (!trainingSession) {
      return NextResponse.json(
        { success: false, error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Calculate attendance statistics
    const attendanceStats = calculateAttendanceStats(trainingSession.attendance);

    // Format drills
    const formattedDrills: SessionDrillResponse[] = trainingSession.drills.map((sd) => ({
      id: sd.drill.id,
      name: sd.drill.name,
      duration: sd.durationOverride || sd.drill.duration,
      intensity: sd.drill.intensity,
      category: sd.drill.category,
      order: sd.order,
      durationOverride: sd.durationOverride,
    }));

    // Format response
    const response: TrainingSessionResponse = {
      id: trainingSession.id,
      date: trainingSession.date.toISOString(),
      startTime: trainingSession.startTime.toISOString(),
      endTime: trainingSession.endTime.toISOString(),
      duration: trainingSession.duration,
      location: trainingSession.location,
      focus: trainingSession.focus,
      notes: trainingSession.notes,
      sessionType: trainingSession.sessionType,
      team: {
        id: trainingSession.team.id,
        name: trainingSession.team.name,
        club: {
          name: trainingSession.team.club.name,
        },
      },
      coach: {
        id: trainingSession.coach.user.id,
        name: `${trainingSession.coach.user.firstName} ${trainingSession.coach.user.lastName}`.trim(),
        email: trainingSession.coach.user.email,
      },
      drills: formattedDrills,
      attendance: attendanceStats,
      counts: {
        drills: formattedDrills.length,
        attendees: trainingSession.attendance.length,
      },
      createdAt: trainingSession.createdAt.toISOString(),
      updatedAt: trainingSession.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Get training session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/training/sessions/[sessionId]
// ============================================================================

/**
 * Update training session details
 * 
 * Parameters:
 * - sessionId: Training session ID
 * 
 * Request body (all optional):
 * - focus: Training focus/objective
 * - notes: Additional notes
 * - location: Training location
 * - sessionType: Type of session (TEAM, INDIVIDUAL, GROUP)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    const body = await request.json();
    const { focus, notes, location, sessionType } = body;

    // Validate sessionId
    if (!sessionId || sessionId.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Check if session exists
    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {};

    if (focus !== undefined && focus !== null) {
      updateData.focus = focus.toString().trim();
    }

    if (notes !== undefined) {
      updateData.notes = notes ? notes.toString().trim() : null;
    }

    if (location !== undefined) {
      updateData.location = location ? location.toString().trim() : null;
    }

    if (sessionType !== undefined) {
      const validSessionTypes = ['TEAM', 'INDIVIDUAL', 'GROUP'];
      if (!validSessionTypes.includes(sessionType)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid session type',
            validTypes: validSessionTypes,
          },
          { status: 400 }
        );
      }
      updateData.sessionType = sessionType;
    }

    // Check if there are updates to make
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields provided to update' },
        { status: 400 }
      );
    }

    // Update session
    const updatedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        team: true,
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`✅ Updated training session: ${updatedSession.id}`);

    return NextResponse.json(
      {
        success: true,
        data: updatedSession,
        message: 'Training session updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Update training session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/training/sessions/[sessionId]
// ============================================================================

/**
 * Delete a training session
 * 
 * Parameters:
 * - sessionId: Training session ID
 * 
 * Note: This will cascade delete related records (drills, attendance)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;

    // Validate sessionId
    if (!sessionId || sessionId.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Check if session exists
    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        date: true,
        team: { select: { name: true } },
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Delete session (cascades to SessionDrill and TrainingAttendance)
    await prisma.trainingSession.delete({
      where: { id: sessionId },
    });

    console.log(`✅ Deleted training session: ${sessionId} (${existingSession.team.name})`);

    return NextResponse.json(
      {
        success: true,
        message: 'Training session deleted successfully',
        deletedSession: {
          id: existingSession.id,
          date: existingSession.date.toISOString(),
          team: existingSession.team.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Delete training session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete training session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
