// ============================================================================
// src/app/api/players/[playerId]/contracts/route.ts
// GET - Retrieve player contracts and team assignments
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/middleware';
import { parsePaginationParams } from '@/lib/api/validation';
import { paginated, errorResponse } from '@/lib/api/responses';
import { NotFoundError } from '@/lib/api/errors';

/**
 * GET /api/players/[playerId]/contracts
 * Retrieve all player contracts including active, expired, and pending
 * Shows team assignments, contract terms, and financial details
 * 
 * Query Parameters:
 *   - page (default: 1)
 *   - limit (default: 25, max: 100)
 *   - status (optional: ACTIVE, EXPIRED, PENDING, TERMINATED)
 * 
 * Response includes:
 *   - Contract ID and status
 *   - Team and club information
 *   - Contract dates (start, end)
 *   - Salary information
 *   - Jersey number and position
 *   - Contract terms and conditions
 * 
 * Requires: Authentication + RBAC
 * Roles: COACH, CLUB_MANAGER, CLUB_OWNER, LEAGUE_ADMIN, SUPERADMIN
 * 
 * Note: Salary information is only shown to authorized users
 * (CLUB_MANAGER, CLUB_OWNER, SUPERADMIN) with proper access
 * 
 * Use Cases:
 *   - View all player team assignments
 *   - Check contract expiration dates
 *   - Monitor contract status
 *   - Review financial commitments
 *   - Track player career history
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
      'SUPERADMIN',
    ]);

    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    const status = searchParams.get('status');

    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        preferredFoot: true,
      },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Build where clause for filtering
    const where: any = { playerId: params.playerId };
    if (status) {
      where.status = status;
    }

    // Determine if user can see salary info
    const canViewSalary = user.roles.includes('CLUB_MANAGER') ||
      user.roles.includes('CLUB_OWNER') ||
      user.roles.includes('SUPERADMIN');

    // Query contracts with pagination
    const [total, contracts] = await Promise.all([
      prisma.playerContract.count({ where }),
      prisma.playerContract.findMany({
        where,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              sport: true,
              maxPlayersOnCourt: true,
              club: {
                select: {
                  id: true,
                  name: true,
                  country: true,
                  foundedYear: true,
                },
              },
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Format contracts with conditional salary visibility
    const formattedContracts = contracts.map((contract) => ({
      id: contract.id,
      team: contract.team,
      status: contract.status,
      startDate: contract.startDate,
      endDate: contract.endDate,
      jerseyNumber: contract.jerseyNumber,
      positionInTeam: contract.positionInTeam,
      contract_type: contract.contractType,
      // Only include salary if user has permission
      ...(canViewSalary && {
        salary: contract.salary,
        salary_currency: contract.salaryCurrency,
        salary_period: contract.salaryPeriod,
      }),
      terms: contract.terms,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    }));

    // Calculate contract statistics
    const contractStats = {
      total,
      byStatus: contracts.reduce(
        (acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      active: contracts.filter((c) => c.status === 'ACTIVE').length,
      expired: contracts.filter((c) => c.status === 'EXPIRED').length,
      pending: contracts.filter((c) => c.status === 'PENDING').length,
      expiringWithin90Days: contracts.filter((c) => {
        if (c.status !== 'ACTIVE') return false;
        const daysUntilExpiry = Math.floor(
          (c.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
      }).length,
    };

    const response = {
      player: {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`,
        position: player.position,
        preferredFoot: player.preferredFoot,
      },
      contracts: formattedContracts,
      statistics: contractStats,
    };

    return paginated(response, { page, limit, total });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
