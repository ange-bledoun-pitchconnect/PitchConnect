// ============================================================================
// src/app/api/analytics/leagues/route.ts
// League Analytics & Dashboard
// GET - Get league performance data and trends
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api/responses';

/**
 * GET /api/analytics/leagues
 * Get comprehensive league analytics and insights
 * 
 * Query Parameters:
 *   - sport: enum (filter by sport)
 *   - season: string (YYYY-YYYY format)
 *   - sortBy: 'teams' | 'matches' | 'avgGoals' | 'attendance'
 *   - limit: number (default: 25, max: 100)
 * 
 * Returns: 200 OK with league analytics
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
    const sport = searchParams.get('sport');
    const season = searchParams.get('season');
    const sortBy = searchParams.get('sortBy') || 'teams';
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '25'));

    // ✅ Build where clause
    let whereClause: any = {};
    if (sport) whereClause.sport = sport;
    if (season) whereClause.season = season;

    // Fetch leagues with related data
    const leagues = await prisma.league.findMany({
      where: whereClause,
      include: {
        teams: {
          select: {
            id: true,
            teamId: true,
            position: true,
            points: true,
            wins: true,
            draws: true,
            losses: true,
            played: true,
            goalsFor: true,
            goalsAgainst: true,
          },
        },
        matches: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            homeGoals: true,
            awayGoals: true,
            attendance: true,
            date: true,
          },
        },
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
      take: limit,
    });

    // ✅ Calculate league statistics
    const leagueAnalytics = leagues.map((league) => {
      const totalMatches = league._count.matches;
      const totalGoals = league.matches.reduce(
        (sum, m) => sum + m.homeGoals + m.awayGoals,
        0
      );
      const totalAttendance = league.matches.reduce(
        (sum, m) => sum + (m.attendance || 0),
        0
      );

      const avgGoalsPerMatch = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : '0.00';
      const avgAttendancePerMatch = totalMatches > 0
        ? (totalAttendance / totalMatches).toFixed(0)
        : '0';

      // Find top performers
      const standings = [...league.teams].sort((a, b) => b.points - a.points);
      const topTeam = standings[0];
      const topScorer = standings.reduce((max, t) =>
        (t.goalsFor || 0) > (max.goalsFor || 0) ? t : max
      );

      return {
        leagueId: league.id,
        leagueName: league.name,
        sport: league.sport,
        season: league.season,
        statistics: {
          totalTeams: league._count.teams,
          totalMatches,
          completedMatches: totalMatches,
          totalGoals,
          totalAttendance,
          avgGoalsPerMatch: parseFloat(avgGoalsPerMatch as string),
          avgAttendancePerMatch: parseInt(avgAttendancePerMatch as string),
          goalsRange: {
            min: Math.min(...league.matches.map((m) => m.homeGoals + m.awayGoals)),
            max: Math.max(...league.matches.map((m) => m.homeGoals + m.awayGoals)),
          },
        },
        topPerformers: {
          leader: topTeam ? {
            teamId: topTeam.teamId,
            position: topTeam.position,
            points: topTeam.points,
            wins: topTeam.wins,
            draws: topTeam.draws,
            losses: topTeam.losses,
          } : null,
          topScorer: topScorer ? {
            teamId: topScorer.teamId,
            goals: topScorer.goalsFor,
            goalsAgainst: topScorer.goalsAgainst,
          } : null,
        },
        standings: standings.slice(0, 5).map((t) => ({
          position: t.position,
          teamId: t.teamId,
          played: t.played,
          wins: t.wins,
          draws: t.draws,
          losses: t.losses,
          goalsFor: t.goalsFor,
          goalsAgainst: t.goalsAgainst,
          goalDifference: (t.goalsFor || 0) - (t.goalsAgainst || 0),
          points: t.points,
        })),
        recentMatches: league.matches.slice(0, 5).map((m) => ({
          matchId: m.id,
          homeGoals: m.homeGoals,
          awayGoals: m.awayGoals,
          attendance: m.attendance,
          date: m.date,
          totalGoals: m.homeGoals + m.awayGoals,
        })),
        lastUpdated: new Date().toISOString(),
      };
    });

    // ✅ Sort results
    const sortedLeagues = leagueAnalytics.sort((a, b) => {
      switch (sortBy) {
        case 'matches':
          return b.statistics.totalMatches - a.statistics.totalMatches;
        case 'avgGoals':
          return (
            b.statistics.avgGoalsPerMatch - a.statistics.avgGoalsPerMatch
          );
        case 'attendance':
          return (
            b.statistics.avgAttendancePerMatch - a.statistics.avgAttendancePerMatch
          );
        case 'teams':
        default:
          return b.statistics.totalTeams - a.statistics.totalTeams;
      }
    });

    // ✅ Calculate global trends
    const globalTrends = {
      totalLeagues: sortedLeagues.length,
      totalTeamsAcrossLeagues: sortedLeagues.reduce(
        (sum, l) => sum + l.statistics.totalTeams,
        0
      ),
      combinedMatches: sortedLeagues.reduce(
        (sum, l) => sum + l.statistics.totalMatches,
        0
      ),
      combinedGoals: sortedLeagues.reduce(
        (sum, l) => sum + l.statistics.totalGoals,
        0
      ),
      averageGoalsAcrossLeagues: (
        sortedLeagues.reduce((sum, l) => sum + l.statistics.totalGoals, 0) /
        Math.max(1, sortedLeagues.reduce((sum, l) => sum + l.statistics.totalMatches, 0))
      ).toFixed(2),
    };

    return NextResponse.json(
      {
        success: true,
        leagues: sortedLeagues,
        trends: globalTrends,
        summary: {
          period: 'Current Season',
          filters: { sport, season },
          sortedBy: sortBy,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/analytics/leagues] Error:', error);
    return errorResponse(error as Error);
  }
}
