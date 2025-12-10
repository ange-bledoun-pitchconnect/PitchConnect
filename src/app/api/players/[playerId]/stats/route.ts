// ============================================================================
// src/app/api/players/[playerId]/stats/route.ts
// GET - Retrieve player match statistics | POST - Record player performance
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/middleware';
import {
  parsePaginationParams,
  parseJsonBody,
  validateRequired,
} from '@/lib/api/validation';
import { paginated, success, errorResponse } from '@/lib/api/responses';
import { NotFoundError, BadRequestError } from '@/lib/api/errors';
import { logResourceCreated } from '@/lib/api/audit';

/**
 * GET /api/players/[playerId]/stats
 * Retrieve player match statistics with pagination
 * 
 * Query Parameters:
 *   - page (default: 1)
 *   - limit (default: 25, max: 100)
 *   - season (optional: filter by season)
 * 
 * Requires: Authentication + RBAC
 * Roles: COACH, CLUB_MANAGER, CLUB_OWNER, LEAGUE_ADMIN, ANALYST, SUPERADMIN
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
      'ANALYST',
      'SUPERADMIN',
    ]);

    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    const season = searchParams.get('season');

    // Build where clause
    const where: any = { playerId: params.playerId };
    if (season) {
      where.season = season;
    }

    // Query statistics with match details
    const [total, stats] = await Promise.all([
      prisma.playerStats.count({ where }),
      prisma.playerStats.findMany({
        where,
        include: {
          match: {
            select: {
              id: true,
              date: true,
              status: true,
              homeTeam: {
                select: {
                  id: true,
                  name: true,
                  sport: true,
                },
              },
              awayTeam: {
                select: {
                  id: true,
                  name: true,
                  sport: true,
                },
              },
            },
          },
        },
        orderBy: [{ season: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return paginated(stats, { page, limit, total });
  } catch (error) {
    return errorResponse(error as Error);
  }
}

/**
 * POST /api/players/[playerId]/stats
 * Record player performance statistics for a specific match
 * 
 * Request Body:
 *   Required:
 *     - matchId: string (ID of the match)
 *     - season: string (e.g., "2024-2025")
 *     - minutesPlayed: number (0-120)
 *   
 *   Optional:
 *     - goals: number
 *     - assists: number
 *     - passes: number
 *     - passAccuracy: number (0-100)
 *     - tackles: number
 *     - interceptions: number
 *     - fouls: number
 *     - yellowCards: number
 *     - redCards: number
 *     - shots: number
 *     - shotsOnTarget: number
 *     - rating: number (1-10)
 *     - notes: string
 * 
 * Requires: Authentication + RBAC
 * Roles: COACH, CLUB_MANAGER, CLUB_OWNER, SUPERADMIN
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth(request);
    requireRole(user, ['COACH', 'CLUB_MANAGER', 'CLUB_OWNER', 'SUPERADMIN']);

    const body = await parseJsonBody(request);

    // Validate required fields
    validateRequired(body, ['matchId', 'season', 'minutesPlayed']);

    // Validate minutes played
    const minutesPlayed = parseInt(body.minutesPlayed);
    if (isNaN(minutesPlayed) || minutesPlayed < 0 || minutesPlayed > 120) {
      throw new BadRequestError('Minutes played must be between 0 and 120');
    }

    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userId: true,
      },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Verify match exists
    const match = await prisma.match.findUnique({
      where: { id: body.matchId },
      select: {
        id: true,
        date: true,
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
    });

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Check if stats already exist for this player in this match
    const existingStats = await prisma.playerStats.findFirst({
      where: {
        playerId: params.playerId,
        matchId: body.matchId,
      },
    });

    if (existingStats) {
      throw new BadRequestError(
        'Statistics already recorded for this player in this match. Use PATCH to update.'
      );
    }

    // Validate optional numeric fields
    const stats = await prisma.playerStats.create({
      data: {
        playerId: params.playerId,
        matchId: body.matchId,
        season: body.season,
        minutesPlayed,
        goals: body.goals ? Math.max(0, parseInt(body.goals)) : 0,
        assists: body.assists ? Math.max(0, parseInt(body.assists)) : 0,
        passes: body.passes ? Math.max(0, parseInt(body.passes)) : 0,
        passAccuracy: body.passAccuracy
          ? Math.min(100, Math.max(0, parseFloat(body.passAccuracy)))
          : null,
        tackles: body.tackles ? Math.max(0, parseInt(body.tackles)) : 0,
        interceptions: body.interceptions
          ? Math.max(0, parseInt(body.interceptions))
          : 0,
        fouls: body.fouls ? Math.max(0, parseInt(body.fouls)) : 0,
        yellowCards: body.yellowCards
          ? Math.max(0, parseInt(body.yellowCards))
          : 0,
        redCards: body.redCards ? Math.max(0, parseInt(body.redCards)) : 0,
        shots: body.shots ? Math.max(0, parseInt(body.shots)) : 0,
        shotsOnTarget: body.shotsOnTarget
          ? Math.max(0, parseInt(body.shotsOnTarget))
          : 0,
        rating: body.rating
          ? Math.min(10, Math.max(1, parseFloat(body.rating)))
          : null,
        notes: body.notes || null,
      },
      include: {
        match: {
          select: {
            id: true,
            date: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
    });

    // Log to audit trail
    await logResourceCreated(
      user.id,
      'PlayerStats',
      stats.id,
      `${player.firstName} ${player.lastName} vs ${
        match.homeTeam.name === player.firstName
          ? match.awayTeam.name
          : match.homeTeam.name
      }`,
      {
        minutesPlayed: stats.minutesPlayed,
        goals: stats.goals,
        assists: stats.assists,
        passes: stats.passes,
        passAccuracy: stats.passAccuracy,
        rating: stats.rating,
      },
      `Recorded performance statistics for ${player.firstName} ${player.lastName} in match on ${match.date.toDateString()}`
    );

    return success(stats, 201);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
