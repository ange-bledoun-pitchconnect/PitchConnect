// ============================================================================
// src/app/api/analytics/players/route.ts
// Player Statistics & Performance Dashboard
// GET - List player statistics with filtering and sorting
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api/responses';

/**
 * GET /api/analytics/players
 * Get player performance statistics and analytics
 * 
 * Query Parameters:
 *   - teamId: string (filter by team)
 *   - position: enum (filter by position)
 *   - sport: enum (filter by sport)
 *   - sortBy: 'appearances' | 'goals' | 'rating' | 'name'
 *   - minAppearances: number (minimum matches played)
 *   - limit: number (default: 50, max: 200)
 * 
 * Returns: 200 OK with player analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const position = searchParams.get('position');
    const sport = searchParams.get('sport');
    const sortBy = searchParams.get('sortBy') || 'appearances';
    const minAppearances = parseInt(searchParams.get('minAppearances') || '0');
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '50'));

    // ✅ Build where clause
    let whereClause: any = {};
    if (position) whereClause.position = position;

    let playerWhere: any = {};
    if (sport) playerWhere.sport = sport;

    // Fetch players with attendance data
    const players = await prisma.player.findMany({
      where: playerWhere,
      include: {
        teams: {
          where: teamId ? { teamId } : {},
          include: {
            team: { select: { id: true, name: true, shortCode: true } },
          },
        },
        attendance: {
          select: {
            matchId: true,
            status: true,
            position: true,
            rating: true,
            goals: true,
            assists: true,
          },
        },
        _count: {
          select: {
            attendance: true,
            teams: true,
          },
        },
      },
      take: limit,
    });

    // ✅ Calculate player statistics
    const playerAnalytics = players.map((player) => {
      const attendanceRecords = player.attendance;
      const appearances = attendanceRecords.filter((a) => a.status === 'PLAYED').length;
      const totalGoals = attendanceRecords.reduce((sum, a) => sum + (a.goals || 0), 0);
      const totalAssists = attendanceRecords.reduce((sum, a) => sum + (a.assists || 0), 0);
      const avgRating =
        attendanceRecords.length > 0
          ? (attendanceRecords.reduce((sum, a) => sum + (a.rating || 0), 0) /
              attendanceRecords.length).toFixed(2)
          : '0.00';

      return {
        playerId: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        fullName: `${player.firstName} ${player.lastName}`,
        position: player.position,
        sport: player.sport,
        dateOfBirth: player.dateOfBirth,
        photo: player.photo,
        teams: player.teams.map((pt) => ({
          teamId: pt.team.id,
          teamName: pt.team.name,
          shortCode: pt.team.shortCode,
          jerseyNumber: pt.jerseyNumber,
          role: pt.role,
        })),
        statistics: {
          appearances,
          matches: player._count.attendance,
          goals: totalGoals,
          assists: totalAssists,
          goalsPerMatch: appearances > 0 ? (totalGoals / appearances).toFixed(2) : '0.00',
          avgRating: parseFloat(avgRating as string),
          appearanceRate:
            player._count.attendance > 0
              ? ((appearances / player._count.attendance) * 100).toFixed(2)
              : '0.00',
        },
        lastUpdated: new Date().toISOString(),
      };
    }).filter((p) => p.statistics.appearances >= minAppearances);

    // ✅ Sort results
    const sortedPlayers = playerAnalytics.sort((a, b) => {
      switch (sortBy) {
        case 'goals':
          return b.statistics.goals - a.statistics.goals;
        case 'rating':
          return b.statistics.avgRating - a.statistics.avgRating;
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        case 'appearances':
        default:
          return b.statistics.appearances - a.statistics.appearances;
      }
    });

    return NextResponse.json(
      {
        success: true,
        players: sortedPlayers,
        summary: {
          totalPlayers: sortedPlayers.length,
          filters: { teamId, position, sport, minAppearances },
          sortedBy: sortBy,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/analytics/players] Error:', error);
    return errorResponse(error as Error);
  }
}
