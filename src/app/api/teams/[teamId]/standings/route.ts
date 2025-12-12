// ============================================================================
// WORLD-CLASS NEW: /src/app/api/teams/[teamId]/standings/route.ts
// Team League Standings & Performance Analytics
// VERSION: 3.0 - Production Grade
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError } from '@/lib/api/errors';
import { logger } from '@/lib/api/logger';

interface StandingsParams {
  params: { teamId: string };
}

// ============================================================================
// GET /api/teams/[teamId]/standings - Get Team League Standings
// Query Params:
//   - leagueId: string (optional, if multi-league)
//   - limit: number (optional, surrounding teams, default: 10)
// ============================================================================

export async function GET(request: NextRequest, { params }: StandingsParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] GET /api/teams/[${params.teamId}]/standings`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401 }
      );
    }

    // ✅ Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      select: { id: true, name: true, leagueTeams: { select: { leagueId: true } } },
    });

    if (!team) {
      throw new NotFoundError('Team', params.teamId);
    }

    // ✅ Parse query parameters
    const url = new URL(request.url);
    const leagueId = url.searchParams.get('leagueId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 20);

    // ✅ Determine which league(s) to fetch standings for
    let leaguesToQuery: string[] = [];

    if (leagueId) {
      // Verify team is in this league
      const leagueTeam = team.leagueTeams.find((lt) => lt.leagueId === leagueId);
      if (!leagueTeam) {
        throw new BadRequestError('Team is not a member of this league');
      }
      leaguesToQuery = [leagueId];
    } else {
      // Get all leagues team is in
      leaguesToQuery = team.leagueTeams.map((lt) => lt.leagueId);
    }

    // ✅ Fetch standings for each league
    const standingsData: any[] = [];

    for (const lId of leaguesToQuery) {
      // Get all standings for this league
      const allStandings = await prisma.standings.findMany({
        where: { leagueId: lId },
        include: {
          league: { select: { id: true, name: true, season: true } },
        },
        orderBy: { position: 'asc' },
      });

      if (allStandings.length === 0) continue;

      // Find team's position
      const teamStanding = allStandings.find((s) => s.teamId === params.teamId);

      if (teamStanding) {
        // Get surrounding teams
        const teamPosition = teamStanding.position;
        const startPos = Math.max(0, teamPosition - limit);
        const endPos = Math.min(allStandings.length, teamPosition + limit + 1);
        const surroundingStandings = allStandings.slice(startPos, endPos);

        // Format standings
        const formattedStandings = surroundingStandings.map((standing) => ({
          position: standing.position,
          teamId: standing.teamId,
          played: standing.played,
          won: standing.won,
          drawn: standing.drawn,
          lost: standing.lost,
          goalsFor: standing.goalsFor,
          goalsAgainst: standing.goalsAgainst,
          goalDifference: standing.goalDifference,
          points: standing.points,
          form: standing.form,
          isTeam: standing.teamId === params.teamId,
          pointsPerMatch: standing.played > 0 ? (standing.points / standing.played).toFixed(2) : '0.00',
          winRate:
            standing.played > 0
              ? ((standing.won / standing.played) * 100).toFixed(1)
              : '0.0',
        }));

        standingsData.push({
          leagueId: lId,
          league: allStandings[0].league,
          totalTeams: allStandings.length,
          teamStanding: {
            position: teamStanding.position,
            points: teamStanding.points,
            played: teamStanding.played,
            records: {
              won: teamStanding.won,
              drawn: teamStanding.drawn,
              lost: teamStanding.lost,
            },
            goals: {
              for: teamStanding.goalsFor,
              against: teamStanding.goalsAgainst,
              difference: teamStanding.goalDifference,
            },
            form: teamStanding.form,
            metrics: {
              winRate:
                teamStanding.played > 0
                  ? ((teamStanding.won / teamStanding.played) * 100).toFixed(1)
                  : '0.0',
              pointsPerMatch:
                teamStanding.played > 0
                  ? (teamStanding.points / teamStanding.played).toFixed(2)
                  : '0.00',
              goalsPerMatch:
                teamStanding.played > 0
                  ? (teamStanding.goalsFor / teamStanding.played).toFixed(2)
                  : '0.00',
            },
          },
          surrounding: formattedStandings,
        });
      }
    }

    // ✅ Build response
    const response = {
      success: true,
      data: {
        team: {
          id: team.id,
          name: team.name,
        },
        standings: standingsData,
        summary: {
          leaguesParticipating: leaguesToQuery.length,
          averagePosition:
            standingsData.length > 0
              ? (
                  standingsData.reduce((sum, s) => sum + s.teamStanding.position, 0) /
                  standingsData.length
                ).toFixed(1)
              : null,
          averagePoints:
            standingsData.length > 0
              ? (
                  standingsData.reduce((sum, s) => sum + s.teamStanding.points, 0) /
                  standingsData.length
                ).toFixed(0)
              : 0,
        },
        query: {
          leagueId: leagueId || 'all',
          surroundingTeamsLimit: limit,
        },
        metadata: {
          teamId: params.teamId,
          requestId,
          timestamp: new Date().toISOString(),
          leaguesReturned: standingsData.length,
        },
      },
    };

    logger.info(
      `[${requestId}] Successfully retrieved standings for team ${params.teamId}`,
      { leaguesCount: standingsData.length }
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(
      `[${requestId}] Error in GET /api/teams/[${params.teamId}]/standings:`,
      error
    );

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'TEAM_NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message, code: 'INVALID_INPUT', requestId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve standings',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
