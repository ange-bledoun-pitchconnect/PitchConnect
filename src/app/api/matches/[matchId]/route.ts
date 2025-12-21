// MATCH DETAIL ROUTES - GET & PATCH
// Path: src/app/api/matches/[matchId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// TYPES
// ============================================================================

interface MatchParams {
  params: {
    matchId: string;
  };
}

interface MatchDetailResponse {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    logo?: string;
    captain?: { id: string; firstName: string; lastName: string };
  };
  awayTeam: {
    id: string;
    name: string;
    logo?: string;
    captain?: { id: string; firstName: string; lastName: string };
  };
  league: {
    id: string;
    name: string;
  };
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
  date: string;
  sport: string;
  matchType: string;
  venue?: {
    id: string;
    name: string;
    city?: string;
    capacity?: number;
  };
  attendance?: number;
  duration?: number;
  referee?: { id: string; firstName: string; lastName: string };
  linesmen?: Array<{ id: string; firstName: string; lastName: string }>;
  homeLineup?: Array<{
    player: { id: string; firstName: string; lastName: string; shirtNumber?: number };
    position: string;
    status: 'PLAYING' | 'SUBSTITUTE' | 'BENCH';
  }>;
  awayLineup?: Array<{
    player: { id: string; firstName: string; lastName: string; shirtNumber?: number };
    position: string;
    status: 'PLAYING' | 'SUBSTITUTE' | 'BENCH';
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateMatchPayload {
  homeGoals?: number;
  awayGoals?: number;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  attendance?: number;
  duration?: number;
  refereeId?: string;
  notes?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

// ============================================================================
// GET HANDLER: Get Match Details
// ============================================================================

/**
 * GET /api/matches/[matchId]
 * Returns complete match details including lineups, referee, and teams
 */
export async function GET(request: NextRequest, { params }: MatchParams): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    logger.info(`[${requestId}] GET /api/matches/${params.matchId} - Start`);

    // 1. AUTHORIZATION
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' } as ErrorResponse,
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. VALIDATE MATCH ID
    if (!params.matchId || typeof params.matchId !== 'string') {
      throw new BadRequestError('Invalid match ID format');
    }

    // 3. FETCH MATCH WITH FULL DETAILS
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            logo: true,
            captain: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            logo: true,
            captain: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        league: {
          select: {
            id: true,
            name: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
            capacity: true,
          },
        },
        referee: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        linesmen: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        homeLineup: {
          select: {
            id: true,
            player: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                shirtNumber: true,
              },
            },
            position: true,
            status: true,
          },
        },
        awayLineup: {
          select: {
            id: true,
            player: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                shirtNumber: true,
              },
            },
            position: true,
            status: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    // 4. LOG AUDIT
    await logAuditAction(session.user.id, null, 'DATA_VIEWED', {
      action: 'match_detail_viewed',
      matchId: params.matchId,
      requestId,
    });

    // 5. FORMAT RESPONSE
    const response: SuccessResponse<MatchDetailResponse> = {
      success: true,
      data: {
        id: match.id,
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          logo: match.homeTeam.logo || undefined,
          captain: match.homeTeam.captain
            ? {
                id: match.homeTeam.captain.id,
                firstName: match.homeTeam.captain.user.firstName,
                lastName: match.homeTeam.captain.user.lastName,
              }
            : undefined,
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          logo: match.awayTeam.logo || undefined,
          captain: match.awayTeam.captain
            ? {
                id: match.awayTeam.captain.id,
                firstName: match.awayTeam.captain.user.firstName,
                lastName: match.awayTeam.captain.user.lastName,
              }
            : undefined,
        },
        league: match.league,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        status: match.status,
        date: match.date.toISOString(),
        sport: match.sport,
        matchType: match.matchType,
        venue: match.venue ? { ...match.venue } : undefined,
        attendance: match.attendance || undefined,
        duration: match.duration || undefined,
        referee: match.referee
          ? {
              id: match.referee.id,
              firstName: match.referee.user.firstName,
              lastName: match.referee.user.lastName,
            }
          : undefined,
        linesmen: match.linesmen?.map((l) => ({
          id: l.id,
          firstName: l.user.firstName,
          lastName: l.user.lastName,
        })),
        homeLineup: match.homeLineup?.map((l) => ({
          player: {
            id: l.player.id,
            firstName: l.player.user.firstName,
            lastName: l.player.user.lastName,
            shirtNumber: l.player.shirtNumber || undefined,
          },
          position: l.position,
          status: l.status as any,
        })),
        awayLineup: match.awayLineup?.map((l) => ({
          player: {
            id: l.player.id,
            firstName: l.player.user.firstName,
            lastName: l.player.user.lastName,
            shirtNumber: l.player.shirtNumber || undefined,
          },
          position: l.position,
          status: l.status as any,
        })),
        notes: match.notes || undefined,
        createdAt: match.createdAt.toISOString(),
        updatedAt: match.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    const duration = performance.now() - startTime;
    logger.info(`[${requestId}] GET /api/matches/${params.matchId} - Success`, {
      duration: Math.round(duration),
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;

    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      logger.warn(`[${requestId}] GET /api/matches/${params.matchId} - Error`, {
        error: error.message,
      });
      return NextResponse.json(
        { success: false, error: error.message, code: error instanceof NotFoundError ? 'NOT_FOUND' : 'BAD_REQUEST' } as ErrorResponse,
        { status: error instanceof NotFoundError ? 404 : 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    logger.error(`[${requestId}] GET /api/matches/${params.matchId} - Error`, {
      error: error instanceof Error ? error.message : String(error),
      duration: Math.round(duration),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch match details', code: 'INTERNAL_ERROR' } as ErrorResponse,
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// PATCH HANDLER: Update Match (Score, Status, etc)
// ============================================================================

/**
 * PATCH /api/matches/[matchId]
 * Update match details:
 * - homeGoals/awayGoals: Update score
 * - status: Change match status (SCHEDULED -> IN_PROGRESS -> COMPLETED)
 * - attendance: Record attendance
 * - duration: Match duration in minutes
 * - refereeId: Assign referee
 * - notes: Additional notes
 */
export async function PATCH(request: NextRequest, { params }: MatchParams): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    logger.info(`[${requestId}] PATCH /api/matches/${params.matchId} - Start`);

    // 1. AUTHORIZATION
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' } as ErrorResponse,
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Check authorization (must be MANAGER, REFEREE, or SUPER_ADMIN)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles?.some((r) => ['MANAGER', 'REFEREE', 'SUPER_ADMIN'].includes(r))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', code: 'FORBIDDEN' } as ErrorResponse,
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. VALIDATE MATCH ID & PARSE BODY
    if (!params.matchId || typeof params.matchId !== 'string') {
      throw new BadRequestError('Invalid match ID format');
    }

    let body: UpdateMatchPayload;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    // 3. FETCH MATCH
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      select: { id: true, status: true, homeGoals: true, awayGoals: true },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    // 4. VALIDATE UPDATE PAYLOAD
    const updateData: any = {};

    if (body.homeGoals !== undefined) {
      if (typeof body.homeGoals !== 'number' || body.homeGoals < 0) {
        throw new BadRequestError('homeGoals must be a non-negative number');
      }
      updateData.homeGoals = body.homeGoals;
    }

    if (body.awayGoals !== undefined) {
      if (typeof body.awayGoals !== 'number' || body.awayGoals < 0) {
        throw new BadRequestError('awayGoals must be a non-negative number');
      }
      updateData.awayGoals = body.awayGoals;
    }

    if (body.status) {
      const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(body.status)) {
        throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      updateData.status = body.status;
    }

    if (body.attendance !== undefined) {
      if (typeof body.attendance !== 'number' || body.attendance < 0) {
        throw new BadRequestError('attendance must be a non-negative number');
      }
      updateData.attendance = body.attendance;
    }

    if (body.duration !== undefined) {
      if (typeof body.duration !== 'number' || body.duration < 0) {
        throw new BadRequestError('duration must be a non-negative number');
      }
      updateData.duration = body.duration;
    }

    if (body.refereeId) {
      const referee = await prisma.referee.findUnique({ where: { id: body.refereeId } });
      if (!referee) {
        throw new NotFoundError('Referee', body.refereeId);
      }
      updateData.refereeId = body.refereeId;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    // 5. UPDATE MATCH
    const updatedMatch = await prisma.match.update({
      where: { id: params.matchId },
      data: updateData,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    // 6. LOG AUDIT
    await logAuditAction(session.user.id, null, 'MATCH_UPDATED', {
      matchId: params.matchId,
      changes: Object.keys(updateData),
      homeGoals: updatedMatch.homeGoals,
      awayGoals: updatedMatch.awayGoals,
      status: updatedMatch.status,
      requestId,
    });

    // 7. RETURN RESPONSE
    const response: SuccessResponse<any> = {
      success: true,
      data: {
        id: updatedMatch.id,
        homeGoals: updatedMatch.homeGoals,
        awayGoals: updatedMatch.awayGoals,
        status: updatedMatch.status,
        attendance: updatedMatch.attendance,
        duration: updatedMatch.duration,
        updatedAt: updatedMatch.updatedAt.toISOString(),
      },
      message: 'Match updated successfully',
      timestamp: new Date().toISOString(),
    };

    const duration = performance.now() - startTime;
    logger.info(`[${requestId}] PATCH /api/matches/${params.matchId} - Success`, {
      matchId: params.matchId,
      duration: Math.round(duration),
      changes: Object.keys(updateData),
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      logger.warn(`[${requestId}] PATCH /api/matches/${params.matchId} - Validation Error`, {
        error: error.message,
      });
      return NextResponse.json(
        { success: false, error: error.message, code: error instanceof NotFoundError ? 'NOT_FOUND' : 'BAD_REQUEST' } as ErrorResponse,
        { status: error instanceof NotFoundError ? 404 : 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    logger.error(`[${requestId}] PATCH /api/matches/${params.matchId} - Error`, {
      error: error instanceof Error ? error.message : String(error),
      duration: Math.round(duration),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to update match', code: 'INTERNAL_ERROR' } as ErrorResponse,
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}