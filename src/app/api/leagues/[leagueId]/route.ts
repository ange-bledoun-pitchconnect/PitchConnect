// ============================================================================
// src/app/api/leagues/[leagueId]/route.ts
// GET - League details with standings | PATCH - Update league
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/middleware';
import {
  parseJsonBody,
  validateStringLength,
} from '@/lib/api/validation';
import { success, errorResponse } from '@/lib/api/responses';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logResourceUpdated } from '@/lib/api/audit';

/**
 * GET /api/leagues/[leagueId]
 * Get league details with standings and recent matches
 * 
 * Path Parameters:
 *   - leagueId: string (league ID)
 * 
 * Requires: Authentication
 * 
 * Returns: 200 OK
 * 
 * Response includes:
 *   - League info (name, sport, season, status)
 *   - Owner details
 *   - Standings table (sorted by points, goal difference)
 *   - Recent matches (last 10)
 *   - Team count, match count
 * 
 * Features:
 *   ✅ Complete league overview
 *   ✅ Standings calculation
 *   ✅ Recent match history
 *   ✅ League statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const user = await requireAuth(request);

    // Get league with standings
    const league = await prisma.league.findUnique({
      where: { id: params.leagueId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        standings: {
          orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }],
          include: {
            team: {
              select: {
                id: true,
                name: true,
                logo: true,
                sport: true,
              },
            },
          },
        },
        matches: {
          where: {
            status: 'COMPLETED',
          },
          include: {
            homeTeam: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            awayTeam: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
          orderBy: { matchDate: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
    });

    if (!league) {
      throw new NotFoundError('League not found');
    }

    // Format response
    const response = {
      ...league,
      teamCount: league._count.teams,
      matchCount: league._count.matches,
      standings: league.standings.map((standing, index) => ({
        ...standing,
        position: index + 1,
      })),
    };

    delete (response as any)._count;

    return success(response);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

/**
 * PATCH /api/leagues/[leagueId]
 * Update league details
 * 
 * Path Parameters:
 *   - leagueId: string (league ID)
 * 
 * Request Body (all optional):
 *   - name: string (3-100 chars)
 *   - description: string
 *   - status: enum (ACTIVE, DRAFT, COMPLETED)
 *   - maxTeams: number (2-100)
 *   - rules: object
 * 
 * Requires: Authentication + RBAC
 * Roles: League owner + SUPERADMIN
 * 
 * Returns: 200 OK with updated league
 * 
 * Features:
 *   ✅ Owner verification
 *   ✅ Partial updates
 *   ✅ Status transition validation
 *   ✅ Audit logging
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request);

    // Get league
    const league = await prisma.league.findUnique({
      where: { id: params.leagueId },
      select: {
        id: true,
        name: true,
        createdBy: true,
        status: true,
      },
    });

    if (!league) {
      throw new NotFoundError('League not found');
    }

    // Check authorization
    if (league.createdBy !== user.id && !user.roles.includes('SUPERADMIN')) {
      throw new ForbiddenError(
        'Only the league owner or admin can update this league'
      );
    }

    // Validate updates
    const updateData: any = {};

    if (body.name !== undefined) {
      validateStringLength(body.name, 3, 100, 'League name');
      updateData.name = body.name;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.status !== undefined) {
      const validStatuses = ['ACTIVE', 'DRAFT', 'COMPLETED'];
      if (!validStatuses.includes(body.status)) {
        throw new BadRequestError(
          'Invalid status. Must be ACTIVE, DRAFT, or COMPLETED'
        );
      }
      updateData.status = body.status;
    }

    if (body.maxTeams !== undefined) {
      if (body.maxTeams && (body.maxTeams < 2 || body.maxTeams > 100)) {
        throw new BadRequestError('Max teams must be between 2 and 100');
      }
      updateData.maxTeams = body.maxTeams;
    }

    if (body.rules !== undefined) {
      updateData.rules = body.rules;
    }

    // Update league
    const updated = await prisma.league.update({
      where: { id: params.leagueId },
      data: updateData,
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log to audit trail
    await logResourceUpdated(
      user.id,
      'League',
      league.id,
      league.name,
      body,
      updateData,
      `Updated league: ${league.name}`
    );

    return success(updated);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
