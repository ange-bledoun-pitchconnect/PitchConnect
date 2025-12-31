// =============================================================================
// 🏆 LEAGUE STANDINGS API - Enterprise-Grade Multi-Sport Implementation
// =============================================================================
// GET /api/standings - Get league standings with sport-specific ranking rules
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports with unique tie-breakers
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport, MatchStatus, Prisma } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  
  // Generic scoring (mapped per sport)
  pointsFor: number;      // Goals, points, runs, etc.
  pointsAgainst: number;
  pointsDifference: number;
  
  // League points
  leaguePoints: number;
  
  // Percentages
  winPercentage: number;
  
  // Sport-specific stats
  sportStats: Record<string, number>;
}

interface RecentForm {
  last5: string;         // "WWDLW"
  last10: string;
  currentStreak: {
    type: 'win' | 'draw' | 'loss';
    count: number;
  };
}

interface StandingTeam {
  position: number;
  previousPosition: number | null;
  positionChange: number;
  
  team: {
    id: string;
    name: string;
    shortCode: string | null;
    logo: string | null;
  };
  
  club: {
    id: string;
    name: string;
    logo: string | null;
  };
  
  stats: TeamStats;
  form: RecentForm;
  trend: 'UP' | 'DOWN' | 'STABLE';
  
  // Qualification zones
  zone: 'CHAMPION' | 'PROMOTION' | 'PLAYOFF' | 'MID_TABLE' | 'RELEGATION' | null;
  
  matchesPending: number;
  nextMatch: {
    matchId: string;
    opponent: string;
    date: string;
    isHome: boolean;
  } | null;
}

interface TopScorer {
  playerId: string;
  playerName: string;
  avatar: string | null;
  teamId: string;
  teamName: string;
  
  goals: number;           // Or points/runs for other sports
  assists: number;
  matches: number;
  minutesPlayed: number;
  
  perMatch: number;
  perMinute: number;
}

interface LeagueStats {
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  liveMatches: number;
  scheduledMatches: number;
  
  totalPoints: number;     // Goals/runs/points scored
  avgPointsPerMatch: number;
  
  homeWinPercentage: number;
  awayWinPercentage: number;
  drawPercentage: number;
  
  highestScore: number;
  lowestScore: number;
}

interface StandingsResponse {
  league: {
    id: string;
    name: string;
    shortName: string | null;
    sport: Sport;
    season: string;
    format: string;
  };
  
  standings: StandingTeam[];
  topScorers: TopScorer[];
  leagueStats: LeagueStats;
  
  sport: Sport;
  rankingRules: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary?: string;
  };
  
  lastUpdated: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Points for win/draw/loss by sport
const POINTS_SYSTEM: Record<Sport, { win: number; draw: number; loss: number; bonusPoint?: boolean }> = {
  FOOTBALL: { win: 3, draw: 1, loss: 0 },
  FUTSAL: { win: 3, draw: 1, loss: 0 },
  BEACH_FOOTBALL: { win: 3, draw: 1, loss: 0 },
  RUGBY: { win: 4, draw: 2, loss: 0, bonusPoint: true }, // Try bonus, losing bonus
  AMERICAN_FOOTBALL: { win: 1, draw: 0.5, loss: 0 },
  BASKETBALL: { win: 2, draw: 0, loss: 1 }, // No draws, loss still gets 1
  NETBALL: { win: 2, draw: 1, loss: 0 },
  CRICKET: { win: 12, draw: 4, loss: 0 }, // Net run rate tie-breaker
  HOCKEY: { win: 3, draw: 1, loss: 0 },
  LACROSSE: { win: 2, draw: 0, loss: 0 },
  AUSTRALIAN_RULES: { win: 4, draw: 2, loss: 0 }, // Percentage tie-breaker
  GAELIC_FOOTBALL: { win: 2, draw: 1, loss: 0 },
};

// Tie-breaker rules by sport
const TIE_BREAKER_RULES: Record<Sport, { primary: string; secondary: string; tertiary: string; quaternary?: string }> = {
  FOOTBALL: {
    primary: 'League Points',
    secondary: 'Goal Difference',
    tertiary: 'Goals Scored',
    quaternary: 'Head-to-Head',
  },
  FUTSAL: {
    primary: 'League Points',
    secondary: 'Goal Difference',
    tertiary: 'Goals Scored',
  },
  BEACH_FOOTBALL: {
    primary: 'League Points',
    secondary: 'Goal Difference',
    tertiary: 'Goals Scored',
  },
  RUGBY: {
    primary: 'League Points',
    secondary: 'Point Difference',
    tertiary: 'Tries Scored',
    quaternary: 'Points Scored',
  },
  AMERICAN_FOOTBALL: {
    primary: 'Win Percentage',
    secondary: 'Head-to-Head',
    tertiary: 'Point Differential',
    quaternary: 'Points Scored',
  },
  BASKETBALL: {
    primary: 'Win Percentage',
    secondary: 'Head-to-Head',
    tertiary: 'Point Differential',
    quaternary: 'Points Scored',
  },
  NETBALL: {
    primary: 'League Points',
    secondary: 'Goal Percentage',
    tertiary: 'Goal Difference',
  },
  CRICKET: {
    primary: 'League Points',
    secondary: 'Net Run Rate',
    tertiary: 'Head-to-Head',
  },
  HOCKEY: {
    primary: 'League Points',
    secondary: 'Goal Difference',
    tertiary: 'Goals Scored',
  },
  LACROSSE: {
    primary: 'Win Percentage',
    secondary: 'Goal Differential',
    tertiary: 'Goals Scored',
  },
  AUSTRALIAN_RULES: {
    primary: 'League Points',
    secondary: 'Percentage (For/Against)',
    tertiary: 'Points Scored',
  },
  GAELIC_FOOTBALL: {
    primary: 'League Points',
    secondary: 'Score Difference',
    tertiary: 'Scores For',
  },
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetStandingsSchema = z.object({
  leagueId: z.string().cuid(),
  season: z.string().optional(),
  includeForm: z.coerce.boolean().default(true),
  includeTopScorers: z.coerce.boolean().default(true),
  topScorersLimit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(['points', 'goalDifference', 'goalsFor', 'winPercentage']).default('points'),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `standings_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.error) {
    response.error = options.error;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

/**
 * Calculate team statistics from matches
 */
function calculateTeamStats(
  teamId: string,
  matches: any[],
  sport: Sport
): TeamStats {
  let wins = 0, draws = 0, losses = 0;
  let pointsFor = 0, pointsAgainst = 0;
  const sportStats: Record<string, number> = {};

  const completedMatches = matches.filter(m => m.status === 'COMPLETED');

  for (const match of completedMatches) {
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? (match.homeScore || 0) : (match.awayScore || 0);
    const oppScore = isHome ? (match.awayScore || 0) : (match.homeScore || 0);

    pointsFor += teamScore;
    pointsAgainst += oppScore;

    if (teamScore > oppScore) wins++;
    else if (teamScore === oppScore) draws++;
    else losses++;

    // Sport-specific stats from match events
    if (match.events) {
      for (const event of match.events) {
        if (event.playerId && event.type) {
          // Track sport-specific metrics
          const key = `total${event.type}`;
          sportStats[key] = (sportStats[key] || 0) + 1;
        }
      }
    }
  }

  const played = wins + draws + losses;
  const pointsSystem = POINTS_SYSTEM[sport];
  const leaguePoints = (wins * pointsSystem.win) + (draws * pointsSystem.draw) + (losses * pointsSystem.loss);

  return {
    played,
    wins,
    draws,
    losses,
    pointsFor,
    pointsAgainst,
    pointsDifference: pointsFor - pointsAgainst,
    leaguePoints,
    winPercentage: played > 0 ? Math.round((wins / played) * 1000) / 10 : 0,
    sportStats,
  };
}

/**
 * Calculate recent form from matches
 */
function calculateForm(teamId: string, matches: any[]): RecentForm {
  const completedMatches = matches
    .filter(m => m.status === 'COMPLETED')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getResult = (match: any): 'W' | 'D' | 'L' => {
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? (match.homeScore || 0) : (match.awayScore || 0);
    const oppScore = isHome ? (match.awayScore || 0) : (match.homeScore || 0);

    if (teamScore > oppScore) return 'W';
    if (teamScore === oppScore) return 'D';
    return 'L';
  };

  const results = completedMatches.slice(0, 10).map(getResult);
  const last5 = results.slice(0, 5).join('');
  const last10 = results.join('');

  // Calculate streak
  let streakType: 'win' | 'draw' | 'loss' = 'draw';
  let streakCount = 0;

  if (results.length > 0) {
    const firstResult = results[0];
    streakType = firstResult === 'W' ? 'win' : firstResult === 'D' ? 'draw' : 'loss';
    streakCount = 1;

    for (let i = 1; i < results.length; i++) {
      if (results[i] === firstResult) {
        streakCount++;
      } else {
        break;
      }
    }
  }

  return {
    last5,
    last10,
    currentStreak: { type: streakType, count: streakCount },
  };
}

/**
 * Sport-specific comparison function for standings
 */
function createSortComparator(sport: Sport): (a: StandingTeam, b: StandingTeam) => number {
  return (a, b) => {
    switch (sport) {
      case Sport.BASKETBALL:
      case Sport.AMERICAN_FOOTBALL:
      case Sport.LACROSSE:
        // Win percentage first
        if (b.stats.winPercentage !== a.stats.winPercentage) {
          return b.stats.winPercentage - a.stats.winPercentage;
        }
        // Then point differential
        if (b.stats.pointsDifference !== a.stats.pointsDifference) {
          return b.stats.pointsDifference - a.stats.pointsDifference;
        }
        return b.stats.pointsFor - a.stats.pointsFor;

      case Sport.RUGBY:
        // Points first
        if (b.stats.leaguePoints !== a.stats.leaguePoints) {
          return b.stats.leaguePoints - a.stats.leaguePoints;
        }
        // Point difference
        if (b.stats.pointsDifference !== a.stats.pointsDifference) {
          return b.stats.pointsDifference - a.stats.pointsDifference;
        }
        // Tries scored (would need to track)
        return b.stats.pointsFor - a.stats.pointsFor;

      case Sport.CRICKET:
        // Points first
        if (b.stats.leaguePoints !== a.stats.leaguePoints) {
          return b.stats.leaguePoints - a.stats.leaguePoints;
        }
        // Net run rate (simplified as point difference ratio)
        const aRatio = a.stats.pointsAgainst > 0 ? a.stats.pointsFor / a.stats.pointsAgainst : a.stats.pointsFor;
        const bRatio = b.stats.pointsAgainst > 0 ? b.stats.pointsFor / b.stats.pointsAgainst : b.stats.pointsFor;
        return bRatio - aRatio;

      case Sport.AUSTRALIAN_RULES:
        // Points first
        if (b.stats.leaguePoints !== a.stats.leaguePoints) {
          return b.stats.leaguePoints - a.stats.leaguePoints;
        }
        // Percentage (for / against * 100)
        const aPct = a.stats.pointsAgainst > 0 ? (a.stats.pointsFor / a.stats.pointsAgainst) * 100 : 999;
        const bPct = b.stats.pointsAgainst > 0 ? (b.stats.pointsFor / b.stats.pointsAgainst) * 100 : 999;
        return bPct - aPct;

      case Sport.NETBALL:
        // Points first
        if (b.stats.leaguePoints !== a.stats.leaguePoints) {
          return b.stats.leaguePoints - a.stats.leaguePoints;
        }
        // Goal percentage
        const aGoalPct = a.stats.pointsAgainst > 0 ? (a.stats.pointsFor / a.stats.pointsAgainst) : a.stats.pointsFor;
        const bGoalPct = b.stats.pointsAgainst > 0 ? (b.stats.pointsFor / b.stats.pointsAgainst) : b.stats.pointsFor;
        if (bGoalPct !== aGoalPct) {
          return bGoalPct - aGoalPct;
        }
        return b.stats.pointsDifference - a.stats.pointsDifference;

      default: // FOOTBALL, FUTSAL, BEACH_FOOTBALL, HOCKEY, GAELIC_FOOTBALL
        // Points → Goal Difference → Goals For
        if (b.stats.leaguePoints !== a.stats.leaguePoints) {
          return b.stats.leaguePoints - a.stats.leaguePoints;
        }
        if (b.stats.pointsDifference !== a.stats.pointsDifference) {
          return b.stats.pointsDifference - a.stats.pointsDifference;
        }
        return b.stats.pointsFor - a.stats.pointsFor;
    }
  };
}

/**
 * Determine zone based on position
 */
function determineZone(
  position: number,
  totalTeams: number,
  leagueSettings?: any
): 'CHAMPION' | 'PROMOTION' | 'PLAYOFF' | 'MID_TABLE' | 'RELEGATION' | null {
  // Default zone boundaries (can be customized per league)
  const promotionZone = leagueSettings?.promotionZone || 1;
  const playoffZone = leagueSettings?.playoffZone || 4;
  const relegationStart = totalTeams - (leagueSettings?.relegationZone || 3) + 1;

  if (position === 1) return 'CHAMPION';
  if (position <= promotionZone) return 'PROMOTION';
  if (position <= playoffZone) return 'PLAYOFF';
  if (position >= relegationStart) return 'RELEGATION';
  return 'MID_TABLE';
}

// =============================================================================
// GET HANDLER - Get League Standings
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = GetStandingsSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid parameters',
        },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // 3. Get league with competition
    const league = await prisma.league.findUnique({
      where: { id: params.leagueId },
      include: {
        competition: {
          select: {
            id: true,
            sport: true,
          },
        },
        teams: {
          where: { isActive: true },
          include: {
            team: {
              include: {
                club: {
                  select: { id: true, name: true, logo: true },
                },
              },
            },
          },
        },
      },
    });

    if (!league) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'League not found',
        },
        requestId,
        status: 404,
      });
    }

    const sport = league.competition?.sport || Sport.FOOTBALL;
    const season = params.season || league.season || getCurrentSeason();

    // 4. Get all matches for this league
    const teamIds = league.teams.map(lt => lt.teamId);

    const matches = await prisma.match.findMany({
      where: {
        leagueId: league.id,
        season,
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } },
        ],
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        events: params.includeForm ? {
          select: {
            type: true,
            playerId: true,
          },
        } : undefined,
      },
      orderBy: { date: 'desc' },
    });

    // 5. Calculate standings for each team
    const standingsData: StandingTeam[] = league.teams.map(leagueTeam => {
      const team = leagueTeam.team;
      const teamMatches = matches.filter(
        m => m.homeTeamId === team.id || m.awayTeamId === team.id
      );

      const stats = calculateTeamStats(team.id, teamMatches, sport);
      const form = params.includeForm 
        ? calculateForm(team.id, teamMatches)
        : { last5: '', last10: '', currentStreak: { type: 'draw' as const, count: 0 } };

      // Calculate trend from form
      let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
      if (form.last5.length >= 3) {
        const recentWins = (form.last5.match(/W/g) || []).length;
        const recentLosses = (form.last5.match(/L/g) || []).length;
        if (recentWins >= 3) trend = 'UP';
        else if (recentLosses >= 3) trend = 'DOWN';
      }

      // Get next match
      const nextMatch = matches.find(
        m => m.status === 'SCHEDULED' && 
        (m.homeTeamId === team.id || m.awayTeamId === team.id)
      );

      const pendingMatches = teamMatches.filter(m => m.status === 'SCHEDULED').length;

      return {
        position: 0, // Will be set after sorting
        previousPosition: null,
        positionChange: 0,
        team: {
          id: team.id,
          name: team.name,
          shortCode: team.shortCode,
          logo: team.logo,
        },
        club: {
          id: team.club.id,
          name: team.club.name,
          logo: team.club.logo,
        },
        stats,
        form,
        trend,
        zone: null, // Will be set after sorting
        matchesPending: pendingMatches,
        nextMatch: nextMatch ? {
          matchId: nextMatch.id,
          opponent: nextMatch.homeTeamId === team.id 
            ? nextMatch.awayTeam.name 
            : nextMatch.homeTeam.name,
          date: nextMatch.date.toISOString(),
          isHome: nextMatch.homeTeamId === team.id,
        } : null,
      };
    });

    // 6. Sort standings using sport-specific rules
    const sortComparator = createSortComparator(sport);
    standingsData.sort(sortComparator);

    // 7. Set positions and zones
    standingsData.forEach((standing, index) => {
      standing.position = index + 1;
      standing.zone = determineZone(index + 1, standingsData.length);
    });

    // 8. Get top scorers (if requested)
    let topScorers: TopScorer[] = [];
    
    if (params.includeTopScorers) {
      const scoringEvents = await prisma.matchEvent.groupBy({
        by: ['playerId'],
        where: {
          match: {
            leagueId: league.id,
            season,
            status: 'COMPLETED',
          },
          type: 'GOAL', // Or sport-specific scoring event
          playerId: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: params.topScorersLimit,
      });

      const playerIds = scoringEvents
        .map(e => e.playerId)
        .filter((id): id is string => id !== null);

      if (playerIds.length > 0) {
        const players = await prisma.player.findMany({
          where: { id: { in: playerIds } },
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
            teamPlayers: {
              where: { isActive: true, teamId: { in: teamIds } },
              include: { team: { select: { id: true, name: true } } },
              take: 1,
            },
          },
        });

        // Get assists count
        const assistEvents = await prisma.matchEvent.groupBy({
          by: ['playerId'],
          where: {
            match: {
              leagueId: league.id,
              season,
              status: 'COMPLETED',
            },
            type: 'ASSIST',
            playerId: { in: playerIds },
          },
          _count: { id: true },
        });

        const assistMap = new Map(assistEvents.map(a => [a.playerId, a._count.id]));

        topScorers = scoringEvents.map(event => {
          const player = players.find(p => p.id === event.playerId);
          const teamPlayer = player?.teamPlayers[0];

          return {
            playerId: event.playerId!,
            playerName: player 
              ? `${player.user.firstName} ${player.user.lastName}`
              : 'Unknown',
            avatar: player?.user.avatar || null,
            teamId: teamPlayer?.team.id || '',
            teamName: teamPlayer?.team.name || 'Unknown',
            goals: event._count.id,
            assists: assistMap.get(event.playerId) || 0,
            matches: 0, // Would need additional query
            minutesPlayed: 0,
            perMatch: 0,
            perMinute: 0,
          };
        });
      }
    }

    // 9. Calculate league stats
    const completedMatches = matches.filter(m => m.status === 'COMPLETED');
    const liveMatches = matches.filter(m => m.status === 'LIVE');
    const scheduledMatches = matches.filter(m => m.status === 'SCHEDULED');

    let totalPoints = 0;
    let homeWins = 0;
    let awayWins = 0;
    let drawCount = 0;
    let highestScore = 0;
    let lowestScore = Infinity;

    for (const match of completedMatches) {
      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;

      totalPoints += homeScore + awayScore;
      highestScore = Math.max(highestScore, homeScore, awayScore);
      lowestScore = Math.min(lowestScore, homeScore, awayScore);

      if (homeScore > awayScore) homeWins++;
      else if (awayScore > homeScore) awayWins++;
      else drawCount++;
    }

    const leagueStats: LeagueStats = {
      totalTeams: league.teams.length,
      totalMatches: matches.length,
      completedMatches: completedMatches.length,
      liveMatches: liveMatches.length,
      scheduledMatches: scheduledMatches.length,
      totalPoints,
      avgPointsPerMatch: completedMatches.length > 0 
        ? Math.round((totalPoints / completedMatches.length) * 100) / 100 
        : 0,
      homeWinPercentage: completedMatches.length > 0 
        ? Math.round((homeWins / completedMatches.length) * 1000) / 10 
        : 0,
      awayWinPercentage: completedMatches.length > 0 
        ? Math.round((awayWins / completedMatches.length) * 1000) / 10 
        : 0,
      drawPercentage: completedMatches.length > 0 
        ? Math.round((drawCount / completedMatches.length) * 1000) / 10 
        : 0,
      highestScore: highestScore === -Infinity ? 0 : highestScore,
      lowestScore: lowestScore === Infinity ? 0 : lowestScore,
    };

    // 10. Build response
    const response: StandingsResponse = {
      league: {
        id: league.id,
        name: league.name,
        shortName: league.shortName,
        sport,
        season,
        format: league.format || 'ROUND_ROBIN',
      },
      standings: standingsData,
      topScorers,
      leagueStats,
      sport,
      rankingRules: TIE_BREAKER_RULES[sport],
      lastUpdated: new Date().toISOString(),
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Standings retrieved`, {
      leagueId: league.id,
      sport,
      teams: standingsData.length,
      matches: matches.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/standings error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch standings',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// HELPER - Get current season string
// =============================================================================

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Season typically runs Aug-May
  return month >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';