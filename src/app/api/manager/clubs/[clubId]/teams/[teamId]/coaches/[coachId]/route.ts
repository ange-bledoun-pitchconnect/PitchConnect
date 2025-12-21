/**
 * ============================================================================
 * GET COACH BY ID - Club Team Coach Details Route
 * ============================================================================
 *
 * @file src/app/api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId]/route.ts
 * @description Retrieve coach details for a specific team
 * @version 1.0.0 (Production-Ready)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface CoachDetailsResponse {
  success: boolean;
  coach: {
    id: string;
    userId: string;
    name: string;
    email: string;
    coachType: string;
    bio: string | null;
    yearsExperience: number | null;
    qualifications: string[];
    specializations: string[];
    certifications: string[];
    hourlyRate: number | null;
    currency: string;
    trainingSessions: number;
    timesheets: {
      total: number;
      approved: number;
      pending: number;
    };
  };
}

interface ErrorResponse {
  success: boolean;
  error: string;
  code: string;
}

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const MANAGER_ROLES = ['CLUB_MANAGER', 'CLUB_OWNER', 'TREASURER'] as const;

/**
 * Validate manager access to club
 */
async function validateClubAccess(email: string, clubId: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      roles: true,
    },
  });

  if (!user) {
    return { isValid: false, error: 'User not found', user: null };
  }

  const hasManagerRole = user.roles.some((role) =>
    MANAGER_ROLES.includes(role as typeof MANAGER_ROLES[number])
  );

  if (!hasManagerRole) {
    return { isValid: false, error: 'Manager role required', user: null };
  }

  // Optional: Verify user is actually part of the club
  const clubMember = await prisma.clubMember.findUnique({
    where: {
      clubId_userId: {
        clubId,
        userId: user.id,
      },
    },
  });

  if (!clubMember) {
    return {
      isValid: false,
      error: 'Not a member of this club',
      user: null,
    };
  }

  return { isValid: true, error: null, user };
}

/**
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId]
 *
 * Retrieve coach details (Manager only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string; coachId: string } }
): Promise<NextResponse<CoachDetailsResponse | ErrorResponse>> {
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
    // 2. VALIDATE MANAGER AUTHORIZATION
    // ========================================================================
    const { isValid: isAuthorized, error: authError } = await validateClubAccess(
      session.user.email,
      params.clubId
    );

    if (!isAuthorized) {
      console.warn('Manager authorization failed', {
        requestId,
        email: session.user.email,
        clubId: params.clubId,
        error: authError,
      });

      return NextResponse.json(
        {
          success: false,
          error: authError || 'Unauthorized',
          code: ERROR_CODES.FORBIDDEN,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { coachId, teamId } = params;

    // ========================================================================
    // 3. VERIFY COACH EXISTS AND GET DETAILS
    // ========================================================================
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        trainingSessions: {
          where: {
            teamId,
          },
          select: {
            id: true,
          },
        },
        timesheets: {
          select: {
            id: true,
            status: true,
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
    // 4. VERIFY TEAM EXISTS AND BELONGS TO CLUB
    // ========================================================================
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { clubId: true },
    });

    if (!team || team.clubId !== params.clubId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team not found or does not belong to this club',
          code: ERROR_CODES.NOT_FOUND,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 5. CALCULATE STATS
    // ========================================================================
    const approvedTimesheets = coach.timesheets.filter(
      (t) => t.status === 'APPROVED'
    ).length;
    const pendingTimesheets = coach.timesheets.filter(
      (t) => t.status === 'SUBMITTED'
    ).length;

    // ========================================================================
    // 6. RETURN RESPONSE
    // ========================================================================
    const duration = performance.now() - startTime;
    const coachName = `${coach.user?.firstName || ''} ${coach.user?.lastName || ''}`.trim();

    console.log('Coach details retrieved', {
      requestId,
      coachId,
      teamId,
      clubId: params.clubId,
      duration: `${Math.round(duration)}ms`,
    });

    const response: CoachDetailsResponse = {
      success: true,
      coach: {
        id: coach.id,
        userId: coach.userId,
        name: coachName,
        email: coach.user?.email || '',
        coachType: coach.coachType,
        bio: coach.bio,
        yearsExperience: coach.yearsExperience,
        qualifications: coach.qualifications,
        specializations: coach.specializations,
        certifications: coach.certifications,
        hourlyRate: coach.hourlyRate,
        currency: coach.currency,
        trainingSessions: coach.trainingSessions.length,
        timesheets: {
          total: coach.timesheets.length,
          approved: approvedTimesheets,
          pending: pendingTimesheets,
        },
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('Coach details error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve coach details',
        code: ERROR_CODES.INTERNAL_ERROR,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
