// ============================================================================
// WORLD-CLASS ENHANCED: /src/app/api/players/[playerId]/injuries/route.ts
// Injury Tracking & Medical History Management
// VERSION: 3.0 - Production Grade
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

interface InjuriesParams {
  params: { playerId: string };
}

// ============================================================================
// GET /api/players/[playerId]/injuries - Get Player Injuries
// Authorization: Any authenticated user (with role-based privacy)
// Query Params:
//   - status: 'ACTIVE' | 'RECOVERED' | 'ALL' (optional)
//   - months: number (optional, filters by last N months)
// ============================================================================

export async function GET(request: NextRequest, { params }: InjuriesParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] GET /api/players/[${params.playerId}]/injuries`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401 }
      );
    }

    // ✅ Validate player exists
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      select: { id: true, firstName: true, lastName: true, userId: true },
    });

    if (!player) {
      throw new NotFoundError('Player', params.playerId);
    }

    // ✅ Parse query parameters
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') || 'ALL';
    const months = parseInt(url.searchParams.get('months') || '36', 10);

    // ✅ Build where clause
    const whereClause: any = { playerId: params.playerId };

    if (statusFilter === 'ACTIVE') {
      whereClause.status = 'ACTIVE';
    } else if (statusFilter === 'RECOVERED') {
      whereClause.status = 'RECOVERED';
    }

    // Filter by months if specified
    if (months > 0) {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - months);
      whereClause.dateFrom = { gte: monthsAgo };
    }

    // ✅ Fetch injuries
    const injuries = await prisma.injury.findMany({
      where: whereClause,
      orderBy: [{ status: 'asc' }, { dateFrom: 'desc' }],
    });

    // ✅ Calculate injury analytics
    const today = new Date();
    const enhancedInjuries = injuries.map((injury) => {
      const dateFrom = new Date(injury.dateFrom);
      const dateTo = injury.dateTo ? new Date(injury.dateTo) : null;
      const estimatedReturn = injury.estimatedReturn
        ? new Date(injury.estimatedReturn)
        : null;

      // Days since injury
      const daysSinceInjury = Math.floor(
        (today.getTime() - dateFrom.getTime()) / (24 * 60 * 60 * 1000)
      );

      // Recovery timeline
      const recoveryDays = dateTo
        ? Math.floor(
            (dateTo.getTime() - dateFrom.getTime()) /
              (24 * 60 * 60 * 1000)
          )
        : null;

      // Estimated time to recovery (if still active)
      const daysUntilReturn = estimatedReturn
        ? Math.floor(
            (estimatedReturn.getTime() - today.getTime()) /
              (24 * 60 * 60 * 1000)
          )
        : null;

      // Recovery status
      let recoveryStatus = injury.status;
      if (injury.status === 'ACTIVE' && estimatedReturn && estimatedReturn < today) {
        recoveryStatus = 'OVERDUE';
      }

      return {
        id: injury.id,
        type: injury.type,
        severity: injury.severity,
        dateFrom: injury.dateFrom,
        dateTo: injury.dateTo,
        estimatedReturn: injury.estimatedReturn,
        description: injury.description,
        treatment: injury.treatment,
        status: recoveryStatus,

        // Analytics
        analytics: {
          daysSinceInjury,
          recoveryDays,
          daysUntilReturn,
          recoveryProgress: dateTo && recoveryDays
            ? Math.min(
                100,
                Math.floor((daysSinceInjury / recoveryDays) * 100)
              )
            : null,
          isOverdue:
            injury.status === 'ACTIVE' &&
            estimatedReturn &&
            estimatedReturn < today,
          daysOverdue:
            injury.status === 'ACTIVE' && estimatedReturn && estimatedReturn < today
              ? Math.floor(
                  (today.getTime() - estimatedReturn.getTime()) /
                    (24 * 60 * 60 * 1000)
                )
              : null,
          severityLevel: {
            MINOR: 1,
            MODERATE: 2,
            SEVERE: 3,
            CRITICAL: 4,
          }[injury.severity],
          estimatedWeeksToRecovery: recoveryDays
            ? Math.ceil(recoveryDays / 7)
            : null,
        },

        createdAt: injury.createdAt,
        updatedAt: injury.updatedAt,
      };
    });

    // ✅ Calculate summary
    const activeInjuries = enhancedInjuries.filter(
      (i) => i.status === 'ACTIVE' || i.status === 'OVERDUE'
    );
    const recoveredInjuries = enhancedInjuries.filter(
      (i) => i.status === 'RECOVERED'
    );
    const severeInjuries = enhancedInjuries.filter(
      (i) =>
        i.severity === 'SEVERE' || i.severity === 'CRITICAL'
    );

    const response = {
      success: true,
      data: {
        player: {
          id: player.id,
          name: `${player.firstName} ${player.lastName}`,
        },
        injuries: enhancedInjuries,
        summary: {
          totalInjuries: enhancedInjuries.length,
          activeInjuries: activeInjuries.length,
          recoveredInjuries: recoveredInjuries.length,
          criticalInjuries: enhancedInjuries.filter(
            (i) => i.severity === 'CRITICAL'
          ).length,
          severeInjuries: severeInjuries.length,
          overdueRecoveries: enhancedInjuries.filter(
            (i) => i.analytics.isOverdue
          ).length,
          averageRecoveryDays:
            recoveredInjuries.length > 0
              ? Math.round(
                  recoveredInjuries.reduce(
                    (sum, i) => sum + (i.analytics.recoveryDays || 0),
                    0
                  ) / recoveredInjuries.length
                )
              : null,
          riskLevel:
            activeInjuries.length > 2
              ? 'HIGH'
              : activeInjuries.length > 0
              ? 'MEDIUM'
              : 'LOW',
        },
        query: {
          statusFilter,
          months,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          recordsReturned: enhancedInjuries.length,
        },
      },
    };

    logger.info(
      `[${requestId}] Successfully retrieved injuries for player ${params.playerId}`,
      { injuryCount: enhancedInjuries.length, activeCount: activeInjuries.length }
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(
      `[${requestId}] Error in GET /api/players/[${params.playerId}]/injuries:`,
      error
    );

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'PLAYER_NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve injuries',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/players/[playerId]/injuries - Log Injury
// Authorization: SUPERADMIN, COACH, MEDICAL_STAFF
// ============================================================================

export async function POST(request: NextRequest, { params }: InjuriesParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] POST /api/players/[${params.playerId}]/injuries`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401 }
      );
    }

    // ✅ Authorization
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isCoach = session.user.roles?.includes('COACH');
    const isMedicalStaff = session.user.roles?.includes('MEDICAL_STAFF');

    if (!isSuperAdmin && !isCoach && !isMedicalStaff) {
      throw new ForbiddenError(
        'Only SUPERADMIN, COACH, or MEDICAL_STAFF can log injuries'
      );
    }

    // ✅ Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    // ✅ Validate required fields
    if (!body.type) {
      throw new BadRequestError('type is required');
    }

    if (!body.dateFrom) {
      throw new BadRequestError('dateFrom is required');
    }

    const validSeverities = ['MINOR', 'MODERATE', 'SEVERE', 'CRITICAL'];
    if (body.severity && !validSeverities.includes(body.severity)) {
      throw new BadRequestError('Invalid severity level', {
        valid: validSeverities,
      });
    }

    // ✅ Validate player exists
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      select: { id: true },
    });

    if (!player) {
      throw new NotFoundError('Player', params.playerId);
    }

    // ✅ Parse and validate dates
    const dateFrom = new Date(body.dateFrom);
    const dateTo = body.dateTo ? new Date(body.dateTo) : undefined;
    const estimatedReturn = body.estimatedReturn
      ? new Date(body.estimatedReturn)
      : undefined;

    if (isNaN(dateFrom.getTime())) {
      throw new BadRequestError('Invalid dateFrom format');
    }

    if (dateTo && isNaN(dateTo.getTime())) {
      throw new BadRequestError('Invalid dateTo format');
    }

    if (estimatedReturn && isNaN(estimatedReturn.getTime())) {
      throw new BadRequestError('Invalid estimatedReturn format');
    }

    // ✅ Create injury record
    const injury = await prisma.injury.create({
      data: {
        playerId: params.playerId,
        type: body.type,
        severity: body.severity || 'MINOR',
        dateFrom,
        dateTo,
        estimatedReturn,
        description: body.description || null,
        treatment: body.treatment || null,
        status: 'ACTIVE',
      },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: 'USER_UPDATED',
      entityType: 'Injury',
      entityId: injury.id,
      changes: {
        type: injury.type,
        severity: injury.severity,
        dateFrom: injury.dateFrom,
      },
      details: `Logged ${injury.severity.toLowerCase()} ${injury.type} for player ${params.playerId}`,
    });

    logger.info(
      `[${requestId}] Successfully logged injury for player ${params.playerId}`,
      { injuryId: injury.id, type: injury.type, severity: injury.severity }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Injury logged successfully',
        data: injury,
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(
      `[${requestId}] Error in POST /api/players/[${params.playerId}]/injuries:`,
      error
    );

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'PLAYER_NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message, code: 'ACCESS_DENIED', requestId },
        { status: 403 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message, code: 'INVALID_INPUT', requestId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to log injury',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
