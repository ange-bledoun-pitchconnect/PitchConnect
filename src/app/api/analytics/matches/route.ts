// ============================================================================
// src/app/api/analytics/matches/route.ts
// Match Analytics & Performance Insights
// GET - Get match statistics and trends
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api/responses';

/**
 * GET /api/analytics/matches
 * Get match analytics with trends and insights
 * 
 * Query Parameters:
 *   - leagueId: string (filter by league)
 *   - teamId: string (filter by team)
 *   - status: enum (filter by status)
 *   - season: string (YYYY-YYYY format)
 *   - limit: number (default: 50, max: 200)
 *   - days: number (last N days to analyze)
 * 
 * Returns: 200 OK with match analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const season = searchParams.get('season');
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '50'));
    const days = parseInt(searchParams.get('days') || '30');

    // ✅ Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    let whereClause: any = {
      date: { gte: dateFrom },
    };

    if (leagueId) whereClause.leagueId = leagueId;
    if (status) whereClause.status = status;
    if (teamId) {
      whereClause.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ];
    }

    // Fetch matches with detailed data
    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        league: { select: { id: true, name: true, season: true } },
        homeTeam: { select: { id: true, name: true, shortCode: true } },
        awayTeam: { select: { id: true, name: true, shortCode: true } },
        events: {
          select: {
            id: true,
            type: true,
            minute: true,
            playerId: true,
            teamId: true,
          },
        },
        attendance: {
          select: {
            playerId: true,
            status: true,
            rating: true,
          },
        },
        _count: { select: { attendance: true, events: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });

    // ✅ Calculate match statistics
    const matchAnalytics = matches.map((match) => {
      const totalGoals = match.homeGoals + match.awayGoals;
      const goalDiff = match.homeGoals - match.awayGoals;
      const totalEvents = match._count.events;
      const totalAttendance = match._count.attendance;

      // Average player rating
      const avgRating =
        match.attendance.length > 0
          ? (match.attendance.reduce((sum, a) => sum + (a.rating || 0), 0) /
              match.attendance.length).toFixed(2)
          : '0.00';

      // Determine outcome
      let outcome = 'DRAW';
      let homeOutcome = 'DRAW';
      let awayOutcome = 'DRAW';
      
      if (goalDiff > 0) {
        outcome = 'HOME_WIN';
        homeOutcome = 'WIN';
        awayOutcome = 'LOSS';
      } else if (goalDiff < 0) {
        outcome = 'AWAY_WIN';
        homeOutcome = 'LOSS';
        awayOutcome = 'WIN';
      }

      return {
        matchId: match.id,
        date: match.date,
        status: match.status,
        league: match.league,
        homeTeam: {
          ...match.homeTeam,
          goals: match.homeGoals,
          outcome: homeOutcome,
        },
        awayTeam: {
          ...match.awayTeam,
          goals: match.awayGoals,
          outcome: awayOutcome,
        },
        statistics: {
          totalGoals,
          goalDifference: goalDiff,
          outcome,
          totalEvents,
          totalAttendance,
          avgPlayerRating: parseFloat(avgRating as string),
          homeGoals: match.homeGoals,
          awayGoals: match.awayGoals,
        },
        eventBreakdown: {
          goals: match.events.filter((e) => e.type === 'GOAL').length,
          cards: match.events.filter((e) => ['YELLOW_CARD', 'RED_CARD'].includes(e.type))
            .length,
          substitutions: match.events.filter((e) => e.type === 'SUBSTITUTION').length,
        },
        lastUpdated: new Date().toISOString(),
      };
    });

    // ✅ Calculate trends
    const trends = {
      totalMatches: matchAnalytics.length,
      completedMatches: matchAnalytics.filter((m) => m.status === 'COMPLETED').length,
      avgGoalsPerMatch: matchAnalytics.length > 0
        ? (matchAnalytics.reduce((sum, m) => sum + m.statistics.totalGoals, 0) /
            matchAnalytics.length).toFixed(2)
        : '0.00',
      avgAttendance: matchAnalytics.length > 0
        ? (matchAnalytics.reduce((sum, m) => sum + m.statistics.totalAttendance, 0) /
            matchAnalytics.length).toFixed(0)
        : '0',
      highestGoalMatch: matchAnalytics.reduce((max, m) =>
        m.statistics.totalGoals > max.statistics.totalGoals ? m : max
      ) || null,
    };

    return NextResponse.json(
      {
        success: true,
        matches: matchAnalytics,
        trends,
        summary: {
          period: `Last ${days} days`,
          filters: { leagueId, teamId, status, season },
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/analytics/matches] Error:', error);
    return errorResponse(error as Error);
  }
}
