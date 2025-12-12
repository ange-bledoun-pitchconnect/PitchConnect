// ============================================================================
// WORLD-CLASS ENHANCED: /src/app/api/players/[playerId]/contracts/route.ts
// Player Contract Management with Comprehensive Analysis
// VERSION: 3.0 - Production Grade
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

interface ContractsParams {
  params: { playerId: string };
}

// ============================================================================
// GET /api/players/[playerId]/contracts - Get Player Contracts
// Authorization: Any authenticated user (with privacy checks)
// Query Params:
//   - status: 'ACTIVE' | 'INACTIVE' | 'ALL' (optional, defaults to ALL)
//   - limit: number (optional, defaults to 10)
// ============================================================================

export async function GET(request: NextRequest, { params }: ContractsParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] GET /api/players/[${params.playerId}]/contracts`);

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
      select: { id: true, userId: true, firstName: true, lastName: true },
    });

    if (!player) {
      throw new NotFoundError('Player', params.playerId);
    }

    // ✅ Parse query parameters
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') || 'ALL';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);

    // ✅ Build where clause
    const whereClause: any = { playerId: params.playerId };

    if (statusFilter === 'ACTIVE') {
      whereClause.status = { in: ['ACTIVE', 'PENDING'] };
    } else if (statusFilter === 'INACTIVE') {
      whereClause.status = { in: ['EXPIRED', 'TERMINATED', 'CANCELLED'] };
    }

    // ✅ Fetch contracts
    const contracts = await prisma.contract.findMany({
      where: whereClause,
      orderBy: { startDate: 'desc' },
      take: limit,
    });

    // ✅ Calculate contract analytics for each
    const today = new Date();
    const enhancedContracts = contracts.map((contract) => {
      const startDate = new Date(contract.startDate);
      const endDate = contract.endDate ? new Date(contract.endDate) : null;

      // Calculate days remaining
      const daysRemaining = endDate
        ? Math.floor((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      // Contract status derived from dates
      let contractStatus = contract.status;
      if (endDate && endDate < today) {
        contractStatus = 'EXPIRED';
      } else if (startDate > today) {
        contractStatus = 'PENDING';
      }

      // Contract duration
      const durationMonths = endDate
        ? Math.floor(
            (endDate.getTime() - startDate.getTime()) /
              (30 * 24 * 60 * 60 * 1000)
          )
        : null;

      // Contract progress (%)
      const progress = endDate
        ? Math.floor(
            ((today.getTime() - startDate.getTime()) /
              (endDate.getTime() - startDate.getTime())) *
              100
          )
        : 0;

      return {
        id: contract.id,
        position: contract.position,
        salary: contract.salary,
        currency: contract.currency,
        startDate: contract.startDate,
        endDate: contract.endDate,
        contractType: contract.contractType,
        status: contractStatus,
        documentUrl: contract.documentUrl,
        extensionOption: contract.extensionOption,
        extensionDate: contract.extensionDate,

        // Calculated fields
        analytics: {
          daysRemaining,
          monthsRemaining: durationMonths
            ? Math.floor(daysRemaining! / 30)
            : null,
          yearsRemaining: durationMonths
            ? (durationMonths / 12).toFixed(1)
            : null,
          durationMonths,
          progress: `${progress}%`,
          isExpiringSoon: daysRemaining ? daysRemaining <= 180 : false,
          expiresIn: daysRemaining ? `${daysRemaining} days` : 'Expired',
          salaryPerMonth: contract.salary
            ? (contract.salary / 12).toFixed(2)
            : null,
          salaryPerWeek: contract.salary
            ? (contract.salary / 52).toFixed(2)
            : null,
        },

        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
      };
    });

    // ✅ Calculate summary analytics
    const activeContracts = enhancedContracts.filter(
      (c) => c.status === 'ACTIVE' || c.status === 'PENDING'
    );
    const totalSalary = activeContracts.reduce(
      (sum, c) => sum + (c.salary || 0),
      0
    );
    const expiringContractCount = enhancedContracts.filter(
      (c) => (c.analytics.daysRemaining || 365) <= 180
    ).length;

    const response = {
      success: true,
      data: {
        player: {
          id: player.id,
          name: `${player.firstName} ${player.lastName}`,
        },
        contracts: enhancedContracts,
        summary: {
          totalContracts: enhancedContracts.length,
          activeContracts: activeContracts.length,
          inactiveContracts: enhancedContracts.filter(
            (c) => c.status !== 'ACTIVE' && c.status !== 'PENDING'
          ).length,
          currentContract: activeContracts[0] || null,
          totalCommittedSalary: totalSalary,
          currency: activeContracts.length > 0 ? activeContracts[0].currency : 'GBP',
          contractsExpiringIn6Months: expiringContractCount,
        },
        query: {
          statusFilter,
          limit,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          recordsReturned: enhancedContracts.length,
        },
      },
    };

    logger.info(
      `[${requestId}] Successfully retrieved contracts for player ${params.playerId}`,
      { contractCount: enhancedContracts.length }
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(
      `[${requestId}] Error in GET /api/players/[${params.playerId}]/contracts:`,
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
        message: 'Failed to retrieve contracts',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/players/[playerId]/contracts - Create Contract
// Authorization: SUPERADMIN, CLUB_MANAGER, CLUB_OWNER
// ============================================================================

export async function POST(request: NextRequest, { params }: ContractsParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] POST /api/players/[${params.playerId}]/contracts`);

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
    const isClubManager = session.user.roles?.includes('CLUB_MANAGER');
    const isClubOwner = session.user.roles?.includes('CLUB_OWNER');

    if (!isSuperAdmin && !isClubManager && !isClubOwner) {
      throw new ForbiddenError(
        'Only SUPERADMIN, CLUB_MANAGER, or CLUB_OWNER can create contracts'
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
    if (!body.position) {
      throw new BadRequestError('position is required');
    }

    if (!body.startDate) {
      throw new BadRequestError('startDate is required');
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
    const startDate = new Date(body.startDate);
    const endDate = body.endDate ? new Date(body.endDate) : null;

    if (isNaN(startDate.getTime())) {
      throw new BadRequestError('Invalid startDate format');
    }

    if (endDate && isNaN(endDate.getTime())) {
      throw new BadRequestError('Invalid endDate format');
    }

    if (endDate && endDate < startDate) {
      throw new BadRequestError('endDate cannot be before startDate');
    }

    // ✅ Validate salary if provided
    if (body.salary) {
      const salary = parseFloat(body.salary);
      if (isNaN(salary) || salary < 0) {
        throw new BadRequestError('salary must be a positive number');
      }
    }

    // ✅ Create contract
    const contract = await prisma.contract.create({
      data: {
        playerId: params.playerId,
        position: body.position,
        salary: body.salary ? parseFloat(body.salary) : undefined,
        currency: body.currency || 'GBP',
        startDate,
        endDate,
        contractType: body.contractType || 'PROFESSIONAL',
        status: body.status || 'ACTIVE',
        documentUrl: body.documentUrl || null,
        extensionOption: body.extensionOption || false,
        extensionDate: body.extensionDate ? new Date(body.extensionDate) : null,
      },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: 'USER_CREATED',
      entityType: 'Contract',
      entityId: contract.id,
      changes: {
        position: contract.position,
        salary: contract.salary,
        startDate: contract.startDate,
        endDate: contract.endDate,
      },
      details: `Created contract for player ${params.playerId}`,
    });

    logger.info(
      `[${requestId}] Successfully created contract for player ${params.playerId}`,
      { contractId: contract.id }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Contract created successfully',
        data: contract,
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(
      `[${requestId}] Error in POST /api/players/[${params.playerId}]/contracts:`,
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
        message: 'Failed to create contract',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
