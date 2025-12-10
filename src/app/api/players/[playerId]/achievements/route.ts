// ============================================================================
// src/app/api/players/[playerId]/achievements/route.ts
// GET - Retrieve player achievements and badges
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/middleware';
import { parsePaginationParams } from '@/lib/api/validation';
import { paginated, errorResponse } from '@/lib/api/responses';
import { NotFoundError } from '@/lib/api/errors';

/**
 * GET /api/players/[playerId]/achievements
 * Retrieve player achievements, badges, and milestones
 * Supports pagination and sorting
 * 
 * Query Parameters:
 *   - page (default: 1)
 *   - limit (default: 25, max: 100)
 * 
 * Response includes:
 *   - Achievement metadata (name, description, icon, rarity)
 *   - Earned date
 *   - Progress tracking if applicable
 * 
 * Requires: Authentication + RBAC
 * Roles: COACH, CLUB_MANAGER, CLUB_OWNER, LEAGUE_ADMIN, ANALYST, SUPERADMIN
 * 
 * Use Cases:
 *   - Display player achievements on profile
 *   - Show achievements in coaching interface
 *   - Track player milestones and progress
 *   - Motivational tracking for player development
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

    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Query achievements with pagination
    const [total, achievements] = await Promise.all([
      prisma.playerAchievement.count({
        where: { playerId: params.playerId },
      }),
      prisma.playerAchievement.findMany({
        where: { playerId: params.playerId },
        include: {
          achievement: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
              category: true,
              rarity: true,
              points: true,
              unlockedCount: true,
            },
          },
        },
        orderBy: { earnedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Calculate achievement statistics
    const achievementStats = {
      total,
      byRarity: achievements.reduce(
        (acc, a) => {
          const rarity = a.achievement.rarity || 'COMMON';
          acc[rarity] = (acc[rarity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      byCategory: achievements.reduce(
        (acc, a) => {
          const category = a.achievement.category || 'Other';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      totalPoints: achievements.reduce((sum, a) => sum + (a.achievement.points || 0), 0),
    };

    // Format response with metadata
    const response = {
      player: {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`,
      },
      achievements,
      statistics: achievementStats,
    };

    return paginated(response, { page, limit, total });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
