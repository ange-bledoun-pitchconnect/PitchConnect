// src/app/api/standings/route.ts
// ============================================================================
// LEAGUE STANDINGS ENDPOINT
// Enhanced for PitchConnect Multi-Sport Management Platform
// ============================================================================
// GET - List league standings with comprehensive statistics and analytics
// VERSION: 4.0 - World-Class Enhanced with full type safety
// ============================================================================

'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiResponse } from '@/lib/api/responses';
import { ApiError } from '@/lib/api/errors';
import prisma from '@/lib/prisma';
import { Sport, MatchStatus } from '@prisma/client';
import { z } from 'zod';
import {
  logApiRequest,
  handleApiError,
  calculateAge,
} from '@/lib/api/helpers';

// ============================================================================
// TYPE DEFINITIONS & VALIDATION SCHEMAS
// ============================================================================

/**
 * Standings query parameters
 */
interface StandingsQuery {
  leagueId: string;
  season?: number;
  filterBy?: 'home' | 'away' | 'all';
  sortBy?: 'points' | 'goalsFor' | 'goalDifference';
  limit?: number;
}

/**
 * Team statistics in standings
 */
interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  winPercentage: number;
  averageGoalsPerMatch: number;
  streakWins: number;
  streakDraws: number;
  streakLosses: number;
}

/**
 * Recent form indicator
 */
interface RecentForm {
  last5Matches: string; // W/D/L pattern
  last10Matches: string;
  currentStreak: {
    type: 'win' | 'draw' | 'loss';
    count: number;
  };
}

/**
 * Trend analysis
 */
type TrendType = 'up' | 'down' | 'stable';

/**
 * Standing team item
 */
interface StandingTeam {
  position: number;
  positionChange?: number; // +1, -1, 0
  team: {
    id: string;
    name: string;
    shortCode: string;
    logo?: string;
  };
  club: {
    id: string;
    name: string;
    city?: string;
  };
  stats: TeamStats;
  recentForm: RecentForm;
  trend: TrendType;
  matchesPending: number;
  projectedPoints?: number; // If matches pending
}

/**
 * Top scorer information
 */
interface TopScorer {
  playerId: string;
  playerName: string;
  goals: number;
  assists: number;
  matches: number;
  team: {
    id: string;
    name: string;
  };
  averageGoalsPerMatch: number;
}

/**
 * League statistics
 */
interface LeagueStats {
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  ongoingMatches: number;
  pendingMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  averageAttendance?: number;
}

/**
 * Standings response
 */
interface StandingsResponse {
  success: true;
  data: {
    leagueId: string;
    league: {
      id: string;
      name: string;
      season: number;
      sport: Sport;
      format: string;
    };
    standings: StandingTeam[];
    topScorers: TopScorer[];
    leagueStats: LeagueStats;
    meta: {
      timestamp: string;
      requestId: string;
      lastUpdated: string;
      teamsCount: number;
    };
  };
}

/**
 * GET query validation schema
 */
const standingsQuerySchema = z.object({
  leagueId: z.string().uuid('Invalid league ID format'),
  season: z.number().int().optional(),
  filterBy: z.enum(['home', 'away', 'all']).default('all').optional(),
  sortBy: z.enum(['points', 'goalsFor', 'goalDifference']).default('points').optional(),
  limit: z.number().int().min(1).max(100).default(50).optional(),
});

type StandingsQueryInput = z.infer<typeof standingsQuerySchema>;

// ============================================================================
// GET /api/standings - Get League Standings
// ============================================================================

/**
 * GET /api/standings
 * Get league standings with comprehensive statistics and rankings
 *
 * Query Parameters:
 *   - leagueId: string (required, UUID format)
 *   - season: number (optional, filter by season)
 *   - filterBy: 'home' | 'away' | 'all' (optional, default: 'all')
 *   - sortBy: 'points' | 'goalsFor' | 'goalDifference' (optional, default: 'points')
 *   - limit: number (optional, max: 100)
 *
 * Authorization: Any authenticated user
 *
 * Returns: 200 OK with standings, statistics, and rankings
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<StandingsResponse | { success: false; error: any }>> {
  const requestId = crypto.randomUUID();

  try {
    // ========== AUTHENTICATION ==========
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        ApiError.unauthorized('Authentication required'),
        { status: 401 },
      );
    }

    logApiRequest('GET', '/api/standings', requestId, {
      userId: session.user.id,
    });

    // ========== PARSE & VALIDATE QUERY ==========
    const { searchParams } = new URL(req.url);

    const leagueId = searchParams.get('leagueId');
    const season = searchParams.get('season')
      ? parseInt(searchParams.get('season')!, 10)
      : undefined;
    const filterBy = (searchParams.get('filterBy') || 'all') as 'home' | 'away' | 'all';
    const sortBy = (searchParams.get('sortBy') || 'points') as 'points' | 'goalsFor' | 'goalDifference';
    const limit = searchParams.get('limit')
      ? Math.min(100, parseInt(searchParams.get('limit')!, 10))
      : 50;

    const queryValidation = standingsQuerySchema.safeParse({
      leagueId,
      season,
      filterBy,
      sortBy,
      limit,
    });

    if (!queryValidation.success) {
      const errors = queryValidation.error.flatten();
      return NextResponse.json(
        ApiError.validation('Invalid query parameters', {
          fieldErrors: errors.fieldErrors,
        }),
        { status: 400 },
      );
    }

    const query = queryValidation.data;

    // ========== FETCH LEAGUE ==========
    const league = await prisma.league.findUnique({
      where: { id: query.leagueId },
      include: {
        teams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                shortCode: true,
                logoUrl: true,
                club: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json(
        ApiError.notFound(`League with ID ${query.leagueId}`),
        { status: 404 },
      );
    }

    // ========== CALCULATE STANDINGS ==========
    const standingsData = await Promise.all(
      league.teams.map(async (leagueTeam) => {
        const teamId = leagueTeam.team.id;

        // Fetch matches based on filter
        const matchesWhere: any = {
          leagueId: query.leagueId,
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
          status: 'COMPLETED',
        };

        // Apply home/away filter
        if (query.filterBy === 'home') {
          matchesWhere.homeTeamId = teamId;
        } else if (query.filterBy === 'away') {
          matchesWhere.awayTeamId = teamId;
        }

        const allMatches = await prisma.match.findMany({
          where: matchesWhere,
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            homeGoals: true,
            awayGoals: true,
            status: true,
            scheduledDate: true,
            attendance: true,
          },
          orderBy: { scheduledDate: 'desc' },
        });

        // Calculate statistics
        let wins = 0,
          draws = 0,
          losses = 0,
          goalsFor = 0,
          goalsAgainst = 0;

        allMatches.forEach((match) => {
          const isHome = match.homeTeamId === teamId;
          const teamGoals = isHome ? match.homeGoals : match.awayGoals;
          const oppGoals = isHome ? match.awayGoals : match.homeGoals;

          if (teamGoals! > oppGoals!) wins++;
          else if (teamGoals === oppGoals) draws++;
          else losses++;

          goalsFor += teamGoals || 0;
          goalsAgainst += oppGoals || 0;
        });

        const played = wins + draws + losses;
        const points = wins * 3 + draws;
        const goalDifference = goalsFor - goalsAgainst;

        // Calculate streaks
        let streakWins = 0,
          streakDraws = 0,
          streakLosses = 0;
        for (const match of allMatches) {
          const isHome = match.homeTeamId === teamId;
          const teamGoals = isHome ? match.homeGoals : match.awayGoals;
          const oppGoals = isHome ? match.awayGoals : match.homeGoals;

          if (teamGoals! > oppGoals!) {
            if (streakWins === 0 && streakDraws === 0 && streakLosses === 0) {
              streakWins++;
            } else if (streakWins > 0) {
              streakWins++;
            } else {
              break;
            }
          } else if (teamGoals === oppGoals) {
            if (streakDraws === 0 && streakWins === 0 && streakLosses === 0) {
              streakDraws++;
            } else if (streakDraws > 0) {
              streakDraws++;
            } else {
              break;
            }
          } else {
            if (streakLosses === 0 && streakWins === 0 && streakDraws === 0) {
              streakLosses++;
            } else if (streakLosses > 0) {
              streakLosses++;
            } else {
              break;
            }
          }
        }

        // Calculate recent form
        const last5Form = allMatches
          .slice(0, 5)
          .map((match) => {
            const isHome = match.homeTeamId === teamId;
            const teamGoals = isHome ? match.homeGoals : match.awayGoals;
            const oppGoals = isHome ? match.awayGoals : match.homeGoals;
            return teamGoals! > oppGoals! ? 'W' : teamGoals === oppGoals ? 'D' : 'L';
          })
          .join('');

        const last10Form = allMatches
          .slice(0, 10)
          .map((match) => {
            const isHome = match.homeTeamId === teamId;
            const teamGoals = isHome ? match.homeGoals : match.awayGoals;
            const oppGoals = isHome ? match.awayGoals : match.homeGoals;
            return teamGoals! > oppGoals! ? 'W' : teamGoals === oppGoals ? 'D' : 'L';
          })
          .join('');

        // Determine current streak
        const currentStreakType = streakWins > 0 ? 'win' : streakDraws > 0 ? 'draw' : 'loss';
        const currentStreakCount = streakWins > 0 ? streakWins : streakDraws > 0 ? streakDraws : streakLosses;

        // Fetch pending matches
        const pendingMatches = await prisma.match.count({
          where: {
            leagueId: query.leagueId,
            OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
            status: 'SCHEDULED',
          },
        });

        // Trend calculation
        const recentWins = (last5Form.match(/W/g) || []).length;
        let trend: TrendType = 'stable';
        if (recentWins >= 3) trend = 'up';
        else if (recentWins === 0 && last5Form.length > 0) trend = 'down';

        return {
          teamId,
          team: leagueTeam.team,
          points,
          played,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDifference,
          last5Form,
          last10Form,
          streakWins,
          streakDraws,
          streakLosses,
          currentStreakType,
          currentStreakCount,
          trend,
          pendingMatches,
          allMatches,
        };
      }),
    );

    // ========== SORT STANDINGS ==========
    const sorted = standingsData.sort((a, b) => {
      if (sortBy === 'goalsFor') {
        return b.goalsFor - a.goalsFor;
      } else if (sortBy === 'goalDifference') {
        return b.goalDifference - a.goalDifference;
      }
      // Default: sort by points
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // ========== FORMAT STANDINGS ==========
    const standings: StandingTeam[] = sorted.map((data, index) => ({
      position: index + 1,
      team: {
        id: data.team.id,
        name: data.team.name,
        shortCode: data.team.shortCode,
        logo: data.team.logoUrl,
      },
      club: {
        id: data.team.club.id,
        name: data.team.club.name,
        city: data.team.club.city,
      },
      stats: {
        played: data.played,
        wins: data.wins,
        draws: data.draws,
        losses: data.losses,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        goalDifference: data.goalDifference,
        points: data.points,
        winPercentage: data.played > 0 ? Math.round((data.wins / data.played) * 100) : 0,
        averageGoalsPerMatch: data.played > 0 ? parseFloat((data.goalsFor / data.played).toFixed(2)) : 0,
        streakWins: data.streakWins,
        streakDraws: data.streakDraws,
        streakLosses: data.streakLosses,
      },
      recentForm: {
        last5Matches: data.last5Form,
        last10Matches: data.last10Form,
        currentStreak: {
          type: data.currentStreakType as 'win' | 'draw' | 'loss',
          count: data.currentStreakCount,
        },
      },
      trend: data.trend,
      matchesPending: data.pendingMatches,
    }));

    // ========== FETCH TOP SCORERS ==========
    const topScorers = await prisma.playerStatistics.findMany({
      where: {
        leagueId: query.leagueId,
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            teamMemberships: {
              where: { status: 'ACTIVE' },
              include: {
                team: {
                  select: { id: true, name: true },
                },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ goals: 'desc' }, { assists: 'desc' }],
      take: 5,
    });

    const formattedTopScorers: TopScorer[] = topScorers.map((scorer) => ({
      playerId: scorer.player.id,
      playerName: `${scorer.player.firstName} ${scorer.player.lastName}`,
      goals: scorer.goals,
      assists: scorer.assists,
      matches: scorer.appearances,
      team: {
        id: scorer.player.teamMemberships[0]?.team.id || '',
        name: scorer.player.teamMemberships[0]?.team.name || 'Unknown',
      },
      averageGoalsPerMatch:
        scorer.appearances > 0
          ? parseFloat((scorer.goals / scorer.appearances).toFixed(2))
          : 0,
    }));

    // ========== CALCULATE LEAGUE STATS ==========
    const allMatches = await prisma.match.findMany({
      where: { leagueId: query.leagueId },
      select: {
        status: true,
        homeGoals: true,
        awayGoals: true,
        attendance: true,
      },
    });

    const completedMatches = allMatches.filter((m) => m.status === 'COMPLETED');
    const ongoingMatches = allMatches.filter((m) => m.status === 'IN_PROGRESS');
    const pendingMatches = allMatches.filter((m) => m.status === 'SCHEDULED');

    const totalGoals = completedMatches.reduce(
      (sum, m) => sum + (m.homeGoals || 0) + (m.awayGoals || 0),
      0,
    );

    const leagueStats: LeagueStats = {
      totalTeams: league.teams.length,
      totalMatches: allMatches.length,
      completedMatches: completedMatches.length,
      ongoingMatches: ongoingMatches.length,
      pendingMatches: pendingMatches.length,
      totalGoals,
      averageGoalsPerMatch:
        completedMatches.length > 0
          ? parseFloat((totalGoals / completedMatches.length).toFixed(2))
          : 0,
      averageAttendance:
        completedMatches.length > 0
          ? Math.round(
              completedMatches.reduce((sum, m) => sum + (m.attendance || 0), 0) /
                completedMatches.length,
            )
          : undefined,
    };

    // ========== BUILD RESPONSE ==========
    const response: StandingsResponse = {
      success: true,
      data: {
        leagueId: league.id,
        league: {
          id: league.id,
          name: league.name,
          season: league.season,
          sport: league.sport,
          format: league.format,
        },
        standings: standings.slice(0, limit),
        topScorers: formattedTopScorers,
        leagueStats,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          lastUpdated: new Date().toISOString(),
          teamsCount: league.teams.length,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(`[${requestId}] GET /api/standings error:`, error);
    return handleApiError(error, 'Failed to fetch standings', requestId);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate trend based on recent form
 */
function calculateTrend(recentForm: string): TrendType {
  if (recentForm.length === 0) return 'stable';

  const wins = (recentForm.match(/W/g) || []).length;
  const totalMatches = recentForm.length;

  if (wins >= Math.ceil(totalMatches * 0.6)) return 'up';
  if (wins <= Math.floor(totalMatches * 0.2)) return 'down';
  return 'stable';
}

/**
 * Calculate projected points if matches are pending
 */
function calculateProjectedPoints(
  currentPoints: number,
  pendingMatches: number,
  averagePointsPerMatch: number,
): number {
  return currentPoints + Math.floor(pendingMatches * averagePointsPerMatch);
}

/**
 * Format team position with change indicator
 */
function formatPositionChange(
  currentPosition: number,
  previousPosition?: number,
): string {
  if (!previousPosition) return currentPosition.toString();

  const change = previousPosition - currentPosition;
  if (change > 0) return `${currentPosition} ↑`;
  if (change < 0) return `${currentPosition} ↓`;
  return currentPosition.toString();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  GET,
};
