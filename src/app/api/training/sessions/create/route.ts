/**
 * Create Training Session API Endpoint
 * POST   /api/training/sessions/create  - Create new training session
 * 
 * Schema-Aligned: TrainingSession, Drill, SessionDrill, TrainingAttendance models
 * - Team has 'members' (TeamMember), not 'players'
 * - Uses correct field relationships from Prisma schema
 * - Proper TrainingSession creation with automatic attendance tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

interface CreateSessionRequest {
  teamId: string;
  coachId?: string;
  date: string; // ISO 8601 datetime
  startTime: string; // ISO 8601 datetime
  endTime: string; // ISO 8601 datetime
  duration: number; // minutes
  location?: string;
  focus: string;
  notes?: string;
  sessionType?: string;
  drills?: string[]; // Array of drill IDs
}

interface CreateSessionResponse {
  success: boolean;
  data?: {
    id: string;
    teamId: string;
    date: string;
    duration: number;
    focus: string;
    drillCount: number;
    attendanceCount: number;
  };
  message: string;
  details?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validate ISO 8601 datetime string
 */
function isValidDateTime(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validate duration is positive integer
 */
function isValidDuration(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 480; // Max 8 hours
}

// ============================================================================
// POST /api/training/sessions/create
// ============================================================================

/**
 * Create a new training session with drills and automatic attendance tracking
 * 
 * Request body:
 * - teamId (required): ID of team for session
 * - coachId (optional): ID of coach leading session (required if not current user)
 * - date (required): Session date (ISO 8601)
 * - startTime (required): Session start time (ISO 8601)
 * - endTime (required): Session end time (ISO 8601)
 * - duration (required): Duration in minutes
 * - location (optional): Training location
 * - focus (required): Training focus/objective
 * - notes (optional): Additional notes
 * - sessionType (optional): TEAM, INDIVIDUAL, or GROUP
 * - drills (optional): Array of drill IDs to include
 * 
 * Returns: Created TrainingSession details
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          details: 'No valid session found',
        },
        { status: 401 }
      );
    }

    // ========================================================================
    // GET AUTHENTICATED USER
    // ========================================================================

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        coachProfile: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
          details: 'Could not find user in database',
        },
        { status: 404 }
      );
    }

    // ========================================================================
    // PARSE AND VALIDATE REQUEST BODY
    // ========================================================================

    const body: CreateSessionRequest = await request.json();
    const {
      teamId,
      coachId,
      date,
      startTime,
      endTime,
      duration,
      location,
      focus,
      notes,
      sessionType,
      drills,
    } = body;

    // Required field validation
    if (!teamId || !date || !startTime || !endTime || !duration || !focus) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields',
          details:
            'Required: teamId, date, startTime, endTime, duration, focus',
        },
        { status: 400 }
      );
    }

    // Validate datetime formats
    if (!isValidDateTime(date) || !isValidDateTime(startTime) || !isValidDateTime(endTime)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid datetime format',
          details: 'All dates must be valid ISO 8601 format',
        },
        { status: 400 }
      );
    }

    // Validate duration
    if (!isValidDuration(duration)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid duration',
          details: 'Duration must be between 1 and 480 minutes',
        },
        { status: 400 }
      );
    }

    // Validate focus length
    const trimmedFocus = focus.toString().trim();
    if (trimmedFocus.length < 3 || trimmedFocus.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid focus',
          details: 'Focus must be between 3 and 200 characters',
        },
        { status: 400 }
      );
    }

    // Validate session type if provided
    if (sessionType) {
      const validSessionTypes = ['TEAM', 'INDIVIDUAL', 'GROUP'];
      if (!validSessionTypes.includes(sessionType)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid session type',
            details: `Must be one of: ${validSessionTypes.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // ========================================================================
    // VERIFY TEAM EXISTS
    // ========================================================================

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            userId: true,
          },
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          success: false,
          message: 'Team not found',
          details: `No team found with ID: ${teamId}`,
        },
        { status: 404 }
      );
    }

    // ========================================================================
    // VERIFY COACH (if provided)
    // ========================================================================

    let finalCoachId = coachId;

    if (coachId) {
      const coach = await prisma.coach.findUnique({
        where: { id: coachId },
      });

      if (!coach) {
        return NextResponse.json(
          {
            success: false,
            message: 'Coach not found',
            details: `No coach found with ID: ${coachId}`,
          },
          { status: 404 }
        );
      }

      finalCoachId = coach.id;
    } else if (user.coachProfile) {
      // Use current user as coach if they are a coach
      finalCoachId = user.coachProfile.id;
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Coach required',
          details:
            'Current user is not a coach. Please provide a valid coachId.',
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // VALIDATE DRILLS (if provided)
    // ========================================================================

    let validDrillIds: string[] = [];

    if (drills && Array.isArray(drills) && drills.length > 0) {
      // Get all drills in one query
      const existingDrills = await prisma.drill.findMany({
        where: {
          id: {
            in: drills,
          },
        },
        select: { id: true },
      });

      const existingDrillIds = existingDrills.map((d) => d.id);
      const invalidDrillIds = drills.filter((id) => !existingDrillIds.includes(id));

      if (invalidDrillIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid drills',
            details: `Drills not found: ${invalidDrillIds.join(', ')}`,
          },
          { status: 404 }
        );
      }

      validDrillIds = existingDrillIds;
    }

    // ========================================================================
    // CREATE TRAINING SESSION
    // ========================================================================

    const trainingSession = await prisma.trainingSession.create({
      data: {
        teamId,
        coachId: finalCoachId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
        location: location ? location.toString().trim() : null,
        focus: trimmedFocus,
        notes: notes ? notes.toString().trim() : null,
        sessionType: sessionType || 'TEAM',
      },
    });

    // ========================================================================
    // ADD DRILLS TO SESSION
    // ========================================================================

    let drillCount = 0;

    if (validDrillIds.length > 0) {
      await prisma.sessionDrill.createMany({
        data: validDrillIds.map((drillId, index) => ({
          trainingSessionId: trainingSession.id,
          drillId,
          order: index + 1,
        })),
        skipDuplicates: true,
      });

      drillCount = validDrillIds.length;
    }

    // ========================================================================
    // CREATE ATTENDANCE RECORDS FOR TEAM MEMBERS
    // ========================================================================

    let attendanceCount = 0;

    if (team.members.length > 0) {
      // Get player IDs from team members
      const teamMemberIds = team.members.map((m) => m.userId);

      // Fetch player records for these users
      const players = await prisma.player.findMany({
        where: {
          userId: {
            in: teamMemberIds,
          },
        },
        select: { id: true },
      });

      if (players.length > 0) {
        const result = await prisma.trainingAttendance.createMany({
          data: players.map((player) => ({
            trainingSessionId: trainingSession.id,
            playerId: player.id,
            status: 'PRESENT', // Default status, can be changed later
          })),
          skipDuplicates: true,
        });

        attendanceCount = result.count;
      }
    }

    // ========================================================================
    // RESPOND WITH SUCCESS
    // ========================================================================

    console.log(
      `✅ Created training session: ${trainingSession.id} for team ${team.name}`
    );

    const response: CreateSessionResponse = {
      success: true,
      data: {
        id: trainingSession.id,
        teamId: trainingSession.teamId,
        date: trainingSession.date.toISOString(),
        duration: trainingSession.duration,
        focus: trainingSession.focus,
        drillCount,
        attendanceCount,
      },
      message: 'Training session created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('❌ Create training session error:', error);

    let errorMessage = 'Failed to create training session';
    let errorDetails = 'Unknown error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || error.message;
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
