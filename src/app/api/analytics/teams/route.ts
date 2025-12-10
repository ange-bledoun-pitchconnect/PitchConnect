// ============================================================================
// src/app/api/analytics/teams/route.ts
// Team Performance Analytics & Statistics
// GET - List team analytics with filtering and aggregation
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, validateStringLength } from '@/lib/api/validation';
import { errorResponse } from '@/lib/api/responses';

/**
 * GET /api/analytics/teams
 * Get comprehensive team performance analytics
 * 
 * Query Parameters:
 *   - clubId: string (filter by club)
 *   - season: string (YYYY-YYYY format)
 *   - sport: enum (filter by sport)
 *   - sortBy: 'wins' | 'points' | 'goalDiff' | 'winRate'
 *   - limit: number (default: 25, max: 100)
 * 
 * Returns: 200 OK with team analytics
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
    const clubId = searchParams.get('clubId');
    const season = searchParams.get('season');
    const sport = searchParams.get('sport');
    const sortBy = searchParams.get('sortBy') || 'points';
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '25'));

    // ✅ Build analytics query
    let whereClause: any = {};
    if (clubId) whereClause.clubId = clubId;
    if (sport) whereClause.sport = sport;

    // Fetch teams with match data
    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        club: { select: { id: true, name: true, city: true } },
        matches: {
          where: { status: 'COMPLETED' },
          select: {
            homeTeamId: true,
            awayTeamId: true,
            homeGoals: true,
            awayGoals: true,
            date: true,
          },
        },
        standings: true,
        _count: { select: { players: true, leagues: true } },
      },
      take: limit,
    });

    // ✅ Calculate comprehensive statistics
    const analyticsData = teams.map((team) => {
      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
      let homeWins = 0, awayWins = 0;

      team.matches.forEach((match) => {
        const isHome = match.homeTeamId === team.id;
        const teamGoals = isHome ? match.homeGoals : match.awayGoals;
        const oppoGoals = isHome ? match.awayGoals : match.homeGoals;

        if (teamGoals > oppoGoals) {
          wins++;
          if (isHome) homeWins++;
          else awayWins++;
        } else if (teamGoals === oppoGoals) draws++;
        else losses++;

        goalsFor += teamGoals;
        goalsAgainst += oppoGoals;
      });

      const played = wins + draws + losses;
      const points = wins * 3 + draws;
      const winRate = played > 0 ? ((wins / played) * 100).toFixed(2) : '0.00';
      const goalAverage = played > 0 ? (goalsFor / played).toFixed(2) : '0.00';

      return {
        teamId: team.id,
        teamName: team.name,
        shortCode: team.shortCode,
        club: team.club,
        stats: {
          played,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDifference: goalsFor - goalsAgainst,
          points,
          winRate: `${winRate}%`,
          goalAverage: parseFloat(goalAverage as string),
          homeWins,
          awayWins,
        },
        standing: team.standings[0] || null,
        squad: {
          playerCount: team._count.players,
          leagueCount: team._count.leagues,
        },
        lastUpdated: new Date().toISOString(),
      };
    });

    // ✅ Sort results
    const sortedData = analyticsData.sort((a, b) => {
      switch (sortBy) {
        case 'wins':
          return b.stats.wins - a.stats.wins;
        case 'goalDiff':
          return b.stats.goalDifference - a.stats.goalDifference;
        case 'winRate':
          return parseFloat(b.stats.winRate) - parseFloat(a.stats.winRate);
        case 'points':
        default:
          return b.stats.points - a.stats.points;
      }
    });

    return NextResponse.json(
      {
        success: true,
        analytics: sortedData,
        summary: {
          totalTeams: sortedData.length,
          filters: { clubId, season, sport },
          sortedBy: sortBy,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/analytics/teams] Error:', error);
    return errorResponse(error as Error);
  }
}
