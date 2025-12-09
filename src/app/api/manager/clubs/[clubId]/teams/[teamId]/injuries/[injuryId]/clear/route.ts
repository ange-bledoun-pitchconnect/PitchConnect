/**
 * ============================================================================
 * CLEAR PLAYER INJURY ROUTE - World-Class Sports Management Implementation
 * ============================================================================
 *
 * @file src/app/api/manager/clubs/[clubId]/teams/[teamId]/injuries/[injuryId]/clear/route.ts
 * @description Mark a player injury as cleared/recovered
 * @version 2.0.0 (Production-Ready)
 *
 * FEATURES:
 * ✅ Full TypeScript type safety
 * ✅ Schema-aligned role-based access control
 * ✅ Club ownership verification
 * ✅ Team-injury-player relationship validation
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

interface InjuryDetails {
  id: string;
  playerId: string;
  type: string;
  severity: string;
  dateFrom: string;
  dateTo: string | null;
  estimatedReturn: string | null;
  status: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface ClearInjuryResponse {
  success: boolean;
  message: string;
  injury: InjuryDetails;
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

/**
 * Validate player belongs to team
 */
async function validatePlayerInTeam(playerId: string, teamId: string) {
  const teamMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: playerId,
      },
    },
  });

  if (!teamMember) {
    return { isValid: false, error: 'Player not in team' };
  }

  return { isValid: true, error: null };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * PATCH /api/manager/clubs/[clubId]/teams/[teamId]/injuries/[injuryId]/clear
 *
 * Mark a player injury as cleared/recovered (Club Owner only)
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { clubId: string; teamId: string; injuryId: string } }
): Promise<NextResponse<ClearInjuryResponse | ErrorResponse>> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    const session = await getServerSession(authOptions);
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
    // 4. GET AND VALIDATE INJURY
    // ========================================================================
    const injury = await prisma.injury.findUnique({
      where: { id: params.injuryId },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
          },
        },
      },
    });

    if (!injury) {
      return NextResponse.json(
        {
          success: false,
          error: 'Injury not found',
          code: ERROR_CODES.NOT_FOUND,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 5. VALIDATE PLAYER BELONGS TO TEAM
    // ========================================================================
    const { isValid: isPlayerValid, error: playerError } =
      await validatePlayerInTeam(injury.player.userId, params.teamId);

    if (!isPlayerValid) {
      return NextResponse.json(
        {
          success: false,
          error: playerError || 'Player not found in team',
          code: ERROR_CODES.NOT_FOUND,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 6. UPDATE INJURY STATUS TO RECOVERED
    // ========================================================================
    const clearedInjury = await prisma.injury.update({
      where: { id: params.injuryId },
      data: {
        status: 'RECOVERED',
        dateTo: new Date(),
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // ========================================================================
    // 7. RETURN RESPONSE
    // ========================================================================
    const duration = performance.now() - startTime;

    console.log('Injury cleared', {
      requestId,
      clubId: params.clubId,
      teamId: params.teamId,
      injuryId: params.injuryId,
      playerId: injury.player.id,
      playerName: `${injury.player.firstName} ${injury.player.lastName}`,
      duration: `${Math.round(duration)}ms`,
    });

    const response: ClearInjuryResponse = {
      success: true,
      message: 'Injury cleared successfully',
      injury: {
        id: clearedInjury.id,
        playerId: clearedInjury.playerId,
        type: clearedInjury.type,
        severity: clearedInjury.severity,
        dateFrom: clearedInjury.dateFrom.toISOString(),
        dateTo: clearedInjury.dateTo?.toISOString() || null,
        estimatedReturn: clearedInjury.estimatedReturn?.toISOString() || null,
        status: clearedInjury.status,
        player: {
          id: clearedInjury.player.id,
          firstName: clearedInjury.player.firstName,
          lastName: clearedInjury.player.lastName,
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
    console.error('Clear injury error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear injury',
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
