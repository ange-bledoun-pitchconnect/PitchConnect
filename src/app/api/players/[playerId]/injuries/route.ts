// ============================================================================
// src/app/api/players/[playerId]/injuries/route.ts
// GET - Retrieve player injuries | POST - Record new player injury
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/middleware';
import {
  parsePaginationParams,
  parseJsonBody,
  validateRequired,
  validateDateFormat,
} from '@/lib/api/validation';
import { paginated, success, errorResponse } from '@/lib/api/responses';
import { NotFoundError, BadRequestError } from '@/lib/api/errors';
import { logResourceCreated, logSecurityEvent } from '@/lib/api/audit';

/**
 * GET /api/players/[playerId]/injuries
 * Retrieve player injury history with medical details
 * Tracks active injuries, recovery, and return-to-play status
 * 
 * Query Parameters:
 *   - page (default: 1)
 *   - limit (default: 25, max: 100)
 *   - status (optional: ACTIVE, RECOVERED, ARCHIVED)
 * 
 * Response includes:
 *   - Injury type and severity (MILD, MODERATE, SEVERE, CRITICAL)
 *   - Date of injury and expected return date
 *   - Medical notes and treatment details
 *   - Recovery progress and timeline
 *   - Medical staff notes
 * 
 * Requires: Authentication + RBAC
 * Roles: COACH, CLUB_MANAGER, CLUB_OWNER, LEAGUE_ADMIN, MEDICAL_STAFF, SUPERADMIN
 * 
 * Use Cases:
 *   - Monitor player fitness and availability
 *   - Track injury recovery progress
 *   - Plan team roster and substitutions
 *   - Manage player workload
 *   - Maintain medical records for compliance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth(request);
    requireRole(user, [
      'COACH',
      'CLUB_MANAGER',
      'CLUB_OWNER',
      'LEAGUE_ADMIN',
      'MEDICAL_STAFF',
      'SUPERADMIN',
    ]);

    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    const status = searchParams.get('status') || 'ACTIVE';

    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Build where clause
    const where: any = { playerId: params.playerId };
    if (status) {
      where.status = status;
    }

    // Query injuries with medical staff details
    const [total, injuries] = await Promise.all([
      prisma.playerInjury.count({ where }),
      prisma.playerInjury.findMany({
        where,
        include: {
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { dateOfInjury: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Calculate injury statistics
    const injuryStats = {
      total,
      bySeverity: injuries.reduce(
        (acc, inj) => {
          acc[inj.severity] = (acc[inj.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      byStatus: injuries.reduce(
        (acc, inj) => {
          acc[inj.status] = (acc[inj.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      critical: injuries.filter((i) => i.severity === 'CRITICAL').length,
      avgRecoveryDays: Math.round(
        injuries.reduce((sum, inj) => {
          if (inj.expectedReturnDate && inj.dateOfInjury) {
            const days = Math.floor(
              (inj.expectedReturnDate.getTime() - inj.dateOfInjury.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }
          return sum;
        }, 0) / Math.max(injuries.length, 1)
      ),
    };

    const response = {
      player: {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`,
        status: player.status,
      },
      injuries,
      statistics: injuryStats,
    };

    return paginated(response, { page, limit, total });
  } catch (error) {
    return errorResponse(error as Error);
  }
}

/**
 * POST /api/players/[playerId]/injuries
 * Record a new player injury
 * Automatically updates player status if severe
 * Triggers alerts if critical
 * 
 * Request Body:
 *   Required:
 *     - dateOfInjury: ISO 8601 date string
 *     - injuryType: string (e.g., "Muscle Strain", "Fracture", "Sprain")
 *     - severity: enum (MILD, MODERATE, SEVERE, CRITICAL)
 *   
 *   Optional:
 *     - description: string (detailed description)
 *     - expectedReturnDate: ISO 8601 date string
 *     - location: string (e.g., "Right hamstring", "Left ankle")
 *     - treatment: string (treatment protocol)
 *     - notes: string (medical notes)
 * 
 * Requires: Authentication + RBAC
 * Roles: COACH, CLUB_MANAGER, CLUB_OWNER, MEDICAL_STAFF, SUPERADMIN
 * 
 * Side Effects:
 *   - Updates player status to INJURED if severity is SEVERE or CRITICAL
 *   - Logs security event for CRITICAL injuries
 *   - Creates audit trail entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth(request);
    requireRole(user, [
      'COACH',
      'CLUB_MANAGER',
      'CLUB_OWNER',
      'MEDICAL_STAFF',
      'SUPERADMIN',
    ]);

    const body = await parseJsonBody(request);

    // Validate required fields
    validateRequired(body, ['dateOfInjury', 'injuryType', 'severity']);

    // Validate severity
    const validSeverities = ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'];
    if (!validSeverities.includes(body.severity)) {
      throw new BadRequestError(
        'Invalid severity. Must be MILD, MODERATE, SEVERE, or CRITICAL'
      );
    }

    // Validate and parse dates
    const injuryDate = validateDateFormat(body.dateOfInjury);
    const expectedReturnDate = body.expectedReturnDate
      ? validateDateFormat(body.expectedReturnDate)
      : null;

    // Validate date logic
    if (injuryDate > new Date()) {
      throw new BadRequestError('Injury date cannot be in the future');
    }

    if (expectedReturnDate && expectedReturnDate <= injuryDate) {
      throw new BadRequestError('Expected return date must be after injury date');
    }

    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Create injury record in transaction
    const injury = await prisma.$transaction(async (tx) => {
      // Create injury
      const newInjury = await tx.playerInjury.create({
        data: {
          playerId: params.playerId,
          dateOfInjury: injuryDate,
          injuryType: body.injuryType,
          severity: body.severity,
          description: body.description || null,
          expectedReturnDate,
          location: body.location || null,
          treatment: body.treatment || null,
          notes: body.notes || null,
          recordedById: user.id,
          status: 'ACTIVE',
        },
        include: {
          recordedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update player status if severe
      if (body.severity === 'SEVERE' || body.severity === 'CRITICAL') {
        await tx.player.update({
          where: { id: params.playerId },
          data: { status: 'INJURED' },
        });
      }

      return newInjury;
    });

    // Log to audit trail
    await logResourceCreated(
      user.id,
      'Injury',
      injury.id,
      `${player.firstName} ${player.lastName} - ${body.injuryType}`,
      {
        severity: body.severity,
        dateOfInjury: injuryDate,
        expectedReturnDate,
        location: body.location,
      },
      `Recorded ${body.severity.toLowerCase()} injury for ${player.firstName} ${player.lastName}: ${body.injuryType}`
    );

    // Log critical injuries as security events
    if (body.severity === 'CRITICAL') {
      await logSecurityEvent(
        user.id,
        'CRITICAL_INJURY_REPORTED',
        `CRITICAL injury recorded for player ${player.firstName} ${player.lastName}. Type: ${body.injuryType}. Medical attention required immediately.`,
        request.headers.get('x-forwarded-for') || undefined
      );
    }

    return success(injury, 201);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
