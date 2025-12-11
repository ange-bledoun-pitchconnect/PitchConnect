// ============================================================================
// ENHANCED: /src/app/api/players/[playerId]/injuries/route.ts - Injury Management
// Track and manage player injuries with severity and recovery timeline
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAnyRole, requireActivePlayer } from '@/lib/api/middleware/auth';
import { success, created, errorResponse } from '@/lib/api/responses';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// GET /api/players/[playerId]/injuries - Get Player Injuries
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    await requireAuth();

    await requireActivePlayer(params.playerId);

    // Get all injuries, with active ones first
    const injuries = await prisma.injury.findMany({
      where: { playerId: params.playerId },
      orderBy: [
        { status: 'asc' },
        { dateFrom: 'desc' },
      ],
    });

    logger.info(`Retrieved ${injuries.length} injuries for player ${params.playerId}`);

    return success(injuries);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// ============================================================================
// POST /api/players/[playerId]/injuries - Log Injury
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth();
    requireAnyRole(user, ['SUPERADMIN', 'COACH', 'MEDICAL_STAFF']);

    await requireActivePlayer(params.playerId);

    const body = await request.json();

    // Validate required fields
    if (!body.type) {
      throw new BadRequestError('type is required');
    }

    if (!body.dateFrom) {
      throw new BadRequestError('dateFrom is required');
    }

    if (!['MINOR', 'MODERATE', 'SEVERE', 'CRITICAL'].includes(body.severity || 'MINOR')) {
      throw new BadRequestError('Invalid severity level');
    }

    // Create injury
    const injury = await prisma.injury.create({
      data: {
        playerId: params.playerId,
        type: body.type,
        severity: body.severity || 'MINOR',
        dateFrom: new Date(body.dateFrom),
        dateTo: body.dateTo ? new Date(body.dateTo) : undefined,
        estimatedReturn: body.estimatedReturn ? new Date(body.estimatedReturn) : undefined,
        description: body.description,
        treatment: body.treatment,
        status: 'ACTIVE',
      },
    });

    // Log audit
    await logAuditAction({
      performedById: user.id,
      action: 'USER_UPDATED',
      entityType: 'Injury',
      entityId: injury.id,
      changes: {
        type: injury.type,
        severity: injury.severity,
        dateFrom: injury.dateFrom,
      },
      details: `Logged ${injury.severity.toLowerCase()} injury for player ${params.playerId}`,
    });

    logger.info(`Injury logged for player ${params.playerId}: ${injury.type}`);

    return created(injury);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
