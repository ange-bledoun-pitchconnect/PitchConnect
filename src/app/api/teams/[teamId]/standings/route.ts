// =============================================================================
// 🏆 TEAM STANDINGS API - PitchConnect v7.9.0
// =============================================================================
// Enterprise-grade competition standings and performance analytics
// Multi-sport support | Competition model | Schema-aligned
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Sport, CompetitionType } from '@prisma/client';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface RouteParams {
  params: { teamId: string };
}

interface StandingEntry {
  position: number;
  teamId: string;
  teamName: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
  isCurrentTeam: boolean;
  metrics: {
    pointsPerMatch: string;
    winRate: string;
    goalsPerMatch: string;
    cleanSheets: number;
  };
}

interface CompetitionStandingsData {
  competitionId: string;
  competition: {
    id: string;
    name: string;
    shortName: string | null;
    type: CompetitionType;
    sport: Sport;
    season: string | null;
    logo: string | null;
  };
  group: string | null;
  totalTeams: number;
  teamStanding: {
    position: number;
    points: number;
    played: number;
    records: {
      won: number;
      drawn: number;
      lost: number;
    };
    goals: {
      for: number;
      against: number;
      difference: number;
    };
    form: string[];
    homeRecord: {
      won: number;
      drawn: number;
      lost: number;
    };
    awayRecord: {
      won: number;
      drawn: number;
      lost: number;
    };
    metrics: {
      winRate: string;
      pointsPerMatch: string;
      goalsPerMatch: string;
      goalsConcededPerMatch: string;
      cleanSheets: number;
    };
    zone: 'PROMOTION' | 'PLAYOFF' | 'SAFE' | 'RELEGATION' | null;
  };
  surrounding: StandingEntry[];
  lastUpdated: string;
}

interface StandingsResponse {
  success: true;
  data: {
    team: {
      id: string;
      name: string;
      sport: Sport;
      clubName: string;
    };
    standings: CompetitionStandingsData[];
    summary: {
      competitionsParticipating: number;
      bestPosition: number | null;
      worstPosition: number | null;
      averagePosition: string | null;
      totalPoints: number;
      totalMatches: number;
      overallRecord: {
        won: number;
        drawn: number;
        lost: number;
      };
    };
  };
  query: {
    competitionId: string | null;
    surroundingTeamsLimit: number;
    group: string | null;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
      meta: { timestamp: new Date().toISOString(), requestId },
    },
    { status, headers: { 'X-Request-ID': requestId } }
  );
}

/**
 * Determine team zone based on position in table
 */
function getTeamZone(
  position: number,
  totalTeams: number,
  competitionType: CompetitionType
): 'PROMOTION' | 'PLAYOFF' | 'SAFE' | 'RELEGATION' | null {
  if (competitionType !== 'LEAGUE') return null;
  if (totalTeams < 4) return 'SAFE';

  const promotionZone = Math.ceil(totalTeams * 0.1); // Top 10%
  const playoffZone = Math.ceil(totalTeams * 0.25); // Top 25%
  const relegationZone = Math.ceil(totalTeams * 0.15); // Bottom 15%

  if (position <= promotionZone) return 'PROMOTION';
  if (position <= playoffZone) return 'PLAYOFF';
  if (position > totalTeams - relegationZone) return 'RELEGATION';
  return 'SAFE';
}

/**
 * Format form array from match results
 */
function formatForm(formArray: string[]): string[] {
  // Take last 5 results, ensure valid values
  return formArray
    .slice(-5)
    .map((result) => {
      const upper = result.toUpperCase();
      if (['W', 'D', 'L'].includes(upper)) return upper;
      return '?';
    });
}

// =============================================================================
// GET /api/teams/[teamId]/standings
// Get team standings in all competitions
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<StandingsResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { teamId } = params;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20);
    const group = searchParams.get('group');

    // 3. Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sport: true,
        clubId: true,
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        competitionTeams: {
          where: { isActive: true, isWithdrawn: false },
          select: { competitionId: true, group: true },
        },
      },
    });

    if (!team) {
      return createErrorResponse('TEAM_NOT_FOUND', 'Team not found', requestId, 404);
    }

    // 4. Determine which competitions to query
    let competitionsToQuery: { competitionId: string; group: string | null }[] = [];

    if (competitionId) {
      // Verify team is in this competition
      const competitionTeam = team.competitionTeams.find(
        (ct) => ct.competitionId === competitionId
      );
      if (!competitionTeam) {
        return createErrorResponse(
          'NOT_IN_COMPETITION',
          'Team is not participating in this competition',
          requestId,
          400
        );
      }
      competitionsToQuery = [{ competitionId, group: group || competitionTeam.group }];
    } else {
      // Get all competitions team is in
      competitionsToQuery = team.competitionTeams.map((ct) => ({
        competitionId: ct.competitionId,
        group: ct.group,
      }));
    }

    if (competitionsToQuery.length === 0) {
      // Team not in any competitions - return empty but valid response
      const response: StandingsResponse = {
        success: true,
        data: {
          team: {
            id: team.id,
            name: team.name,
            sport: team.sport,
            clubName: team.club.name,
          },
          standings: [],
          summary: {
            competitionsParticipating: 0,
            bestPosition: null,
            worstPosition: null,
            averagePosition: null,
            totalPoints: 0,
            totalMatches: 0,
            overallRecord: { won: 0, drawn: 0, lost: 0 },
          },
        },
        query: {
          competitionId: competitionId || null,
          surroundingTeamsLimit: limit,
          group: group || null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      return NextResponse.json(response, {
        status: 200,
        headers: { 'X-Request-ID': requestId },
      });
    }

    // 5. Fetch standings for each competition
    const standingsData: CompetitionStandingsData[] = [];
    let totalWon = 0,
      totalDrawn = 0,
      totalLost = 0,
      totalPoints = 0,
      totalMatches = 0;
    const positions: number[] = [];

    for (const { competitionId: compId, group: compGroup } of competitionsToQuery) {
      // Get competition details
      const competition = await prisma.competition.findUnique({
        where: { id: compId },
        select: {
          id: true,
          name: true,
          shortName: true,
          type: true,
          sport: true,
          logo: true,
          season: {
            select: { name: true },
          },
        },
      });

      if (!competition) continue;

      // Build where clause for standings
      const standingsWhere: any = { competitionId: compId };
      if (compGroup) {
        standingsWhere.group = compGroup;
      }

      // Get all standings for this competition/group
      const allStandings = await prisma.competitionStanding.findMany({
        where: standingsWhere,
        orderBy: { position: 'asc' },
        include: {
          // We need team names - get through CompetitionTeam relation
        },
      });

      if (allStandings.length === 0) continue;

      // Find team's standing
      const teamStanding = allStandings.find((s) => s.teamId === teamId);
      if (!teamStanding) continue;

      // Get team names for standings
      const teamIds = allStandings.map((s) => s.teamId);
      const teams = await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, name: true },
      });
      const teamNameMap = new Map(teams.map((t) => [t.id, t.name]));

      // Calculate surrounding teams
      const teamPosition = teamStanding.position;
      const startIndex = Math.max(0, teamPosition - limit - 1);
      const endIndex = Math.min(allStandings.length, teamPosition + limit);
      const surroundingStandings = allStandings.slice(startIndex, endIndex);

      // Format surrounding standings
      const formattedSurrounding: StandingEntry[] = surroundingStandings.map((standing) => ({
        position: standing.position,
        teamId: standing.teamId,
        teamName: teamNameMap.get(standing.teamId) || null,
        played: standing.played,
        won: standing.won,
        drawn: standing.drawn,
        lost: standing.lost,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        goalDifference: standing.goalDifference,
        points: standing.points,
        form: formatForm(standing.form),
        isCurrentTeam: standing.teamId === teamId,
        metrics: {
          pointsPerMatch:
            standing.played > 0 ? (standing.points / standing.played).toFixed(2) : '0.00',
          winRate:
            standing.played > 0
              ? ((standing.won / standing.played) * 100).toFixed(1)
              : '0.0',
          goalsPerMatch:
            standing.played > 0 ? (standing.goalsFor / standing.played).toFixed(2) : '0.00',
          cleanSheets: standing.cleanSheets,
        },
      }));

      // Calculate team metrics
      const played = teamStanding.played;
      const zone = getTeamZone(teamStanding.position, allStandings.length, competition.type);

      standingsData.push({
        competitionId: compId,
        competition: {
          id: competition.id,
          name: competition.name,
          shortName: competition.shortName,
          type: competition.type,
          sport: competition.sport,
          season: competition.season?.name || null,
          logo: competition.logo,
        },
        group: compGroup,
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
          form: formatForm(teamStanding.form),
          homeRecord: {
            won: teamStanding.homeWon,
            drawn: teamStanding.homeDrawn,
            lost: teamStanding.homeLost,
          },
          awayRecord: {
            won: teamStanding.awayWon,
            drawn: teamStanding.awayDrawn,
            lost: teamStanding.awayLost,
          },
          metrics: {
            winRate: played > 0 ? ((teamStanding.won / played) * 100).toFixed(1) : '0.0',
            pointsPerMatch: played > 0 ? (teamStanding.points / played).toFixed(2) : '0.00',
            goalsPerMatch: played > 0 ? (teamStanding.goalsFor / played).toFixed(2) : '0.00',
            goalsConcededPerMatch:
              played > 0 ? (teamStanding.goalsAgainst / played).toFixed(2) : '0.00',
            cleanSheets: teamStanding.cleanSheets,
          },
          zone,
        },
        surrounding: formattedSurrounding,
        lastUpdated: teamStanding.lastUpdated.toISOString(),
      });

      // Accumulate totals for summary
      totalWon += teamStanding.won;
      totalDrawn += teamStanding.drawn;
      totalLost += teamStanding.lost;
      totalPoints += teamStanding.points;
      totalMatches += teamStanding.played;
      positions.push(teamStanding.position);
    }

    // 6. Calculate summary
    const bestPosition = positions.length > 0 ? Math.min(...positions) : null;
    const worstPosition = positions.length > 0 ? Math.max(...positions) : null;
    const averagePosition =
      positions.length > 0
        ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1)
        : null;

    // 7. Build response
    const response: StandingsResponse = {
      success: true,
      data: {
        team: {
          id: team.id,
          name: team.name,
          sport: team.sport,
          clubName: team.club.name,
        },
        standings: standingsData,
        summary: {
          competitionsParticipating: standingsData.length,
          bestPosition,
          worstPosition,
          averagePosition,
          totalPoints,
          totalMatches,
          overallRecord: {
            won: totalWon,
            drawn: totalDrawn,
            lost: totalLost,
          },
        },
      },
      query: {
        competitionId: competitionId || null,
        surroundingTeamsLimit: limit,
        group: group || null,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/teams/[teamId]/standings error:`, error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve standings', requestId, 500);
  }
}
