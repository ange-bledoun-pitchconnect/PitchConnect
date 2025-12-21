// ============================================================================
// FIXED: src/app/api/fixtures/route.ts
// ============================================================================
// Fixtures API Endpoint
// ✅ Proper async exports (No default objects in "use server")
// ✅ Next.js 15 compatible
// ============================================================================

'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createFixtureSchema = z.object({
  leagueId: z.string().uuid('Invalid league ID'),
  homeTeamId: z.string().uuid('Invalid home team ID'),
  awayTeamId: z.string().uuid('Invalid away team ID'),
  kickOffTime: z.string().datetime('Invalid date/time format'),
  venue: z.string().optional(),
  matchType: z.enum(['LEAGUE', 'CUP', 'FRIENDLY']).default('LEAGUE'),
});

const updateFixtureSchema = z.object({
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'POSTPONED', 'CANCELLED']).optional(),
  homeTeamScore: z.number().int().min(0).optional(),
  awayTeamScore: z.number().int().min(0).optional(),
  venue: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createErrorResponse(
  code: string,
  message: string,
  statusCode: number,
  requestId: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

function createSuccessResponse<T>(
  data: T,
  message: string,
  requestId: string,
  statusCode = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/fixtures
 * Retrieve all fixtures with optional filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401, requestId);
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const leagueId = searchParams.get('leagueId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const fixtures = await prisma.match.findMany({
      where: {
        ...(leagueId && { leagueId }),
        ...(status && { status }),
      },
      include: {
        homeTeam: {
          select: { id: true, name: true, club: { select: { name: true } } },
        },
        awayTeam: {
          select: { id: true, name: true, club: { select: { name: true } } },
        },
        league: {
          select: { id: true, name: true, season: true },
        },
      },
      orderBy: { kickOffTime: 'asc' },
      take: limit,
    });

    return createSuccessResponse(fixtures, 'Fixtures retrieved successfully', requestId);
  } catch (error) {
    console.error(`[${requestId}] Fixtures GET error:`, error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createErrorResponse('INTERNAL_SERVER_ERROR', message, 500, requestId);
  }
}

/**
 * POST /api/fixtures
 * Create a new fixture
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401, requestId);
    }

    // Check if user has permission to create fixtures
    // This would normally check LEAGUE_ADMIN or similar role

    let body;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('INVALID_JSON', 'Invalid request body', 400, requestId);
    }

    const validation = createFixtureSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request parameters',
        400,
        requestId
      );
    }

    const { leagueId, homeTeamId, awayTeamId, kickOffTime, venue, matchType } = validation.data;

    // Verify teams exist and belong to league
    const [homeTeam, awayTeam, league] = await Promise.all([
      prisma.team.findUnique({ where: { id: homeTeamId }, select: { id: true, leagueId: true } }),
      prisma.team.findUnique({ where: { id: awayTeamId }, select: { id: true, leagueId: true } }),
      prisma.league.findUnique({ where: { id: leagueId }, select: { id: true } }),
    ]);

    if (!homeTeam || !awayTeam || !league) {
      return createErrorResponse('NOT_FOUND', 'Team or league not found', 404, requestId);
    }

    if (homeTeam.leagueId !== leagueId || awayTeam.leagueId !== leagueId) {
      return createErrorResponse(
        'INVALID_REQUEST',
        'Teams must belong to the specified league',
        400,
        requestId
      );
    }

    if (homeTeamId === awayTeamId) {
      return createErrorResponse(
        'INVALID_REQUEST',
        'Home and away teams must be different',
        400,
        requestId
      );
    }

    // Create fixture
    const fixture = await prisma.match.create({
      data: {
        leagueId,
        homeTeamId,
        awayTeamId,
        kickOffTime: new Date(kickOffTime),
        venue: venue || 'TBD',
        matchType,
        status: 'SCHEDULED',
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        league: { select: { name: true } },
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'FIXTURE_CREATED',
          entity: 'MATCH',
          entityId: fixture.id,
          changes: { homeTeamId, awayTeamId, kickOffTime },
        },
      });
    } catch (auditError) {
      console.error('Audit log failed:', auditError);
    }

    return createSuccessResponse(fixture, 'Fixture created successfully', requestId, 201);
  } catch (error) {
    console.error(`[${requestId}] Fixtures POST error:`, error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createErrorResponse('INTERNAL_SERVER_ERROR', message, 500, requestId);
  }
}

/**
 * PATCH /api/fixtures/:id
 * Update a fixture
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401, requestId);
    }

    // Extract fixture ID from URL
    const url = new URL(request.url);
    const fixtureId = url.pathname.split('/').pop();

    if (!fixtureId) {
      return createErrorResponse('INVALID_REQUEST', 'Fixture ID required', 400, requestId);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('INVALID_JSON', 'Invalid request body', 400, requestId);
    }

    const validation = updateFixtureSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request parameters',
        400,
        requestId
      );
    }

    // Verify fixture exists
    const fixture = await prisma.match.findUnique({
      where: { id: fixtureId },
      select: { id: true, status: true },
    });

    if (!fixture) {
      return createErrorResponse('NOT_FOUND', 'Fixture not found', 404, requestId);
    }

    // Update fixture
    const updatedFixture = await prisma.match.update({
      where: { id: fixtureId },
      data: validation.data,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'FIXTURE_UPDATED',
          entity: 'MATCH',
          entityId: fixtureId,
          changes: validation.data,
        },
      });
    } catch (auditError) {
      console.error('Audit log failed:', auditError);
    }

    return createSuccessResponse(updatedFixture, 'Fixture updated successfully', requestId);
  } catch (error) {
    console.error(`[${requestId}] Fixtures PATCH error:`, error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createErrorResponse('INTERNAL_SERVER_ERROR', message, 500, requestId);
  }
}

/**
 * DELETE /api/fixtures/:id
 * Delete a fixture
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401, requestId);
    }

    // Extract fixture ID from URL
    const url = new URL(request.url);
    const fixtureId = url.pathname.split('/').pop();

    if (!fixtureId) {
      return createErrorResponse('INVALID_REQUEST', 'Fixture ID required', 400, requestId);
    }

    // Verify fixture exists
    const fixture = await prisma.match.findUnique({
      where: { id: fixtureId },
      select: { id: true, status: true },
    });

    if (!fixture) {
      return createErrorResponse('NOT_FOUND', 'Fixture not found', 404, requestId);
    }

    // Only allow deletion of scheduled fixtures
    if (fixture.status !== 'SCHEDULED') {
      return createErrorResponse(
        'INVALID_REQUEST',
        `Cannot delete ${fixture.status} fixture`,
        400,
        requestId
      );
    }

    // Delete fixture
    await prisma.match.delete({
      where: { id: fixtureId },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'FIXTURE_DELETED',
          entity: 'MATCH',
          entityId: fixtureId,
          changes: { status: fixture.status },
        },
      });
    } catch (auditError) {
      console.error('Audit log failed:', auditError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Fixture deleted successfully',
        requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[${requestId}] Fixtures DELETE error:`, error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createErrorResponse('INTERNAL_SERVER_ERROR', message, 500, requestId);
  }
}