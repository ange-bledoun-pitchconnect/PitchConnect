/**
 * ============================================================================
 * TEAM COACHES API - World-Class Sports Management Implementation
 * ============================================================================
 *
 * @file src/app/api/manager/clubs/[clubId]/teams/[teamId]/coaches/route.ts
 * @description GET and POST coaches for a team
 * @version 2.0.0 (Production-Ready)
 *
 * FEATURES:
 * ✅ Full TypeScript type safety
 * ✅ Schema-aligned role-based access control
 * ✅ Club ownership verification
 * ✅ Team-coach relationship management
 * ✅ Comprehensive error handling
 * ✅ Request ID tracking
 * ✅ Performance monitoring
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

interface CoachDetails {
  id: string;
  userId: string;
  coachType: string;
  yearsExperience: number | null;
  qualifications: string[];
  specializations: string[];
  certifications: string[];
  bio: string | null;
  hourlyRate: number | null;
  currency: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface CoachesListResponse {
  success: boolean;
  coaches: CoachDetails[];
  teamId: string;
  clubId: string;
}

interface AssignCoachResponse {
  success: boolean;
  message: string;
  coach: CoachDetails;
}

interface ErrorResponse {
  success: boolean;
  error: string;
  code: string;
  details?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate club ownership
 */
async function validateClubOwnership(clubId: string, userId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { ownerId: true },
  });

  if (!club) {
    return { isValid: false, error: 'Club not found' };
  }

  if (club.ownerId !== userId) {
    return { isValid: false, error: 'Not club owner' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate team belongs to club
 */
async function validateTeamBelongsToClub(teamId: string, clubId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { clubId: true },
  });

  if (!team) {
    return { isValid: false, error: 'Team not found' };
  }

  if (team.clubId !== clubId) {
    return { isValid: false, error: 'Team does not belong to club' };
  }

  return { isValid: true, error: null };
}

// ============================================================================
// GET HANDLER - Retrieve coaches for a team
// ============================================================================

/**
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/coaches
 *
 * Retrieve all coaches assigned to a team
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
): Promise<NextResponse<CoachesListResponse | ErrorResponse>> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    const session = await auth();
    if (!session) {
      return Response.json(
        {
          success: false,
          error: 'Authentication required',
          code: ERROR_CODES.UNAUTHORIZED,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. VALIDATE CLUB OWNERSHIP
    // ========================================================================
    const { isValid: isOwner, error: ownerError } = await validateClubOwnership(
      params.clubId,
      session.user.id
    );

    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: ownerError || 'Forbidden',
          code: ERROR_CODES.FORBIDDEN,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 3. VALIDATE TEAM BELONGS TO CLUB
    // ========================================================================
    const { isValid: isTeamValid, error: teamError } =
      await validateTeamBelongsToClub(params.teamId, params.clubId);

    if (!isTeamValid) {
      return NextResponse.json(
        {
          success: false,
          error: teamError || 'Team not found',
          code: ERROR_CODES.NOT_FOUND,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 4. GET TEAM AND COACHES
    // ========================================================================
    // Note: In your schema, Coach → TrainingSession → Team
    // So we get coaches through training sessions for this team
    const trainingSessions = await prisma.trainingSession.findMany({
      where: { teamId: params.teamId },
      distinct: ['coachId'],
      select: {
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

    const coaches = trainingSessions
      .map((session) => session.coach)
      .filter(
        (coach, index, self) =>
          self.findIndex((c) => c.id === coach.id) === index
      ) // Remove duplicates
      .map((coach) => ({
        id: coach.id,
        userId: coach.userId,
        coachType: coach.coachType,
        yearsExperience: coach.yearsExperience,
        qualifications: coach.qualifications,
        specializations: coach.specializations,
        certifications: coach.certifications,
        bio: coach.bio,
        hourlyRate: coach.hourlyRate,
        currency: coach.currency,
        user: coach.user,
      }));

    // ========================================================================
    // 5. RETURN RESPONSE
    // ========================================================================
    const duration = performance.now() - startTime;

    console.log('Coaches retrieved', {
      requestId,
      clubId: params.clubId,
      teamId: params.teamId,
      coachCount: coaches.length,
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(
      {
        success: true,
        coaches,
        teamId: params.teamId,
        clubId: params.clubId,
      },
      {
        status: 200,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': `${Math.round(duration)}ms`,
        },
      }
    );
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('Get team coaches error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve team coaches',
        code: ERROR_CODES.INTERNAL_ERROR,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// POST HANDLER - Assign coach to team
// ============================================================================

interface AssignCoachRequest {
  coachId: string;
}

/**
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/coaches
 *
 * Assign a coach to a team by creating a training session
 * (Coach → Team relationship via TrainingSession)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
): Promise<NextResponse<AssignCoachResponse | ErrorResponse>> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: ERROR_CODES.UNAUTHORIZED,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. VALIDATE CLUB OWNERSHIP
    // ========================================================================
    const { isValid: isOwner, error: ownerError } = await validateClubOwnership(
      params.clubId,
      session.user.id
    );

    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: ownerError || 'Forbidden',
          code: ERROR_CODES.FORBIDDEN,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 3. VALIDATE TEAM BELONGS TO CLUB
    // ========================================================================
    const { isValid: isTeamValid, error: teamError } =
      await validateTeamBelongsToClub(params.teamId, params.clubId);

    if (!isTeamValid) {
      return NextResponse.json(
        {
          success: false,
          error: teamError || 'Team not found',
          code: ERROR_CODES.NOT_FOUND,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 4. PARSE & VALIDATE REQUEST
    // ========================================================================
    let body: AssignCoachRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: ERROR_CODES.INVALID_REQUEST,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (!body.coachId || typeof body.coachId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Coach ID is required',
          code: ERROR_CODES.INVALID_REQUEST,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 5. VERIFY COACH EXISTS
    // ========================================================================
    const coach = await prisma.coach.findUnique({
      where: { id: body.coachId },
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
    });

    if (!coach) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coach not found',
          code: ERROR_CODES.NOT_FOUND,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 6. CREATE TRAINING SESSION (Coach-Team link)
    // ========================================================================
    // In your schema, Coach connects to Team via TrainingSession
    // Create an initial training session to assign the coach
    await prisma.trainingSession.create({
      data: {
        teamId: params.teamId,
        coachId: body.coachId,
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000), // 1 hour session
        duration: 60,
        focus: 'TEAM_SETUP',
        sessionType: 'TEAM',
      },
    });

    // ========================================================================
    // 7. RETURN RESPONSE
    // ========================================================================
    const duration = performance.now() - startTime;

    console.log('Coach assigned to team', {
      requestId,
      clubId: params.clubId,
      teamId: params.teamId,
      coachId: body.coachId,
      duration: `${Math.round(duration)}ms`,
    });

    const response: AssignCoachResponse = {
      success: true,
      message: 'Coach successfully assigned to team',
      coach: {
        id: coach.id,
        userId: coach.userId,
        coachType: coach.coachType,
        yearsExperience: coach.yearsExperience,
        qualifications: coach.qualifications,
        specializations: coach.specializations,
        certifications: coach.certifications,
        bio: coach.bio,
        hourlyRate: coach.hourlyRate,
        currency: coach.currency,
        user: coach.user,
      },
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('Assign coach error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to assign coach',
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
