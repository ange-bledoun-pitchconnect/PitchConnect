// ============================================================================
// ENHANCED: /src/app/api/players/[playerId]/contracts/route.ts - Contract Management
// Manage player contracts with salary and duration tracking
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAnyRole, requireActivePlayer } from '@/lib/api/middleware/auth';
import { success, created, errorResponse } from '@/lib/api/responses';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// GET /api/players/[playerId]/contracts - Get Player Contracts
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    await requireAuth();

    await requireActivePlayer(params.playerId);

    const contracts = await prisma.contract.findMany({
      where: { playerId: params.playerId },
      orderBy: { startDate: 'desc' },
    });

    logger.info(`Retrieved ${contracts.length} contracts for player ${params.playerId}`);

    return success(contracts);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// ============================================================================
// POST /api/players/[playerId]/contracts - Create Contract
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth();
    requireAnyRole(user, ['SUPERADMIN', 'CLUB_MANAGER', 'CLUB_OWNER']);

    await requireActivePlayer(params.playerId);

    const body = await request.json();

    // Validate required fields
    if (!body.position) {
      throw new BadRequestError('position is required');
    }

    if (!body.startDate) {
      throw new BadRequestError('startDate is required');
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        playerId: params.playerId,
        position: body.position,
        salary: body.salary ? parseFloat(body.salary) : undefined,
        currency: body.currency || 'GBP',
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        contractType: body.contractType || 'PROFESSIONAL',
        status: body.status || 'ACTIVE',
        documentUrl: body.documentUrl,
        extensionOption: body.extensionOption || false,
        extensionDate: body.extensionDate ? new Date(body.extensionDate) : undefined,
      },
    });

    // Log audit
    await logAuditAction({
      performedById: user.id,
      action: 'USER_CREATED',
      entityType: 'Contract',
      entityId: contract.id,
      changes: {
        position: contract.position,
        startDate: contract.startDate,
        endDate: contract.endDate,
        salary: contract.salary,
      },
      details: `Created contract for player ${params.playerId}`,
    });

    logger.info(`Contract created for player ${params.playerId}`);

    return created(contract);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
