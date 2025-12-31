// =============================================================================
// 📈 PLAYER STATS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/player/stats - Comprehensive player statistics
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Approach: Hybrid (aggregate stats + recent matches from events)
// Access: PLAYER, PLAYER_PRO, PARENT, COACH, SCOUT, ANALYST
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Sport,
  MatchEventType,
  MatchStatus,
  Prisma,
} from '@prisma/client';

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

// Sport-specific stat interfaces
interface BaseStats {
  totalMatches: number;
  totalMinutes: number;
  averageMinutesPerMatch: number;
  starts: number;
  substitutions: number;
}

interface FootballStats extends BaseStats {
  sport: 'FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  penaltiesScored: number;
  penaltiesMissed: number;
  ownGoals: number;
  goalsPerMatch: number;
  assistsPerMatch: number;
}

interface RugbyStats extends BaseStats {
  sport: 'RUGBY';
  tries: number;
  conversions: number;
  penaltyKicks: number;
  dropGoals: number;
  tackles: number;
  missedTackles: number;
  lineoutsWon: number;
  lineoutsLost: number;
  scrumsWon: number;
  turnoversWon: number;
  yellowCards: number;
  redCards: number;
  triesPerMatch: number;
}

interface BasketballStats extends BaseStats {
  sport: 'BASKETBALL';
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  pointsPerMatch: number;
  reboundsPerMatch: number;
}

interface CricketStats extends BaseStats {
  sport: 'CRICKET';
  // Batting
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  notOuts: number;
  highScore: number;
  battingAverage: number;
  strikeRate: number;
  // Bowling
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidens: number;
  bowlingAverage: number;
  economyRate: number;
  // Fielding
  catches: number;
  stumpings: number;
  runOuts: number;
}

interface AmericanFootballStats extends BaseStats {
  sport: 'AMERICAN_FOOTBALL';
  touchdowns: number;
  rushingYards: number;
  receivingYards: number;
  passingYards: number;
  completions: number;
  interceptions: number;
  sacks: number;
  tackles: number;
  fieldGoals: number;
  touchdownsPerMatch: number;
}

interface HockeyStats extends BaseStats {
  sport: 'HOCKEY';
  goals: number;
  assists: number;
  greenCards: number;
  yellowCards: number;
  redCards: number;
  penaltyCorners: number;
  goalsPerMatch: number;
}

interface NetballStats extends BaseStats {
  sport: 'NETBALL';
  goals: number;
  goalAttempts: number;
  assists: number;
  interceptions: number;
  rebounds: number;
  centrePassReceives: number;
  goalAccuracy: number;
}

interface LacrosseStats extends BaseStats {
  sport: 'LACROSSE';
  goals: number;
  assists: number;
  groundBalls: number;
  turnovers: number;
  faceoffsWon: number;
  saves: number; // For goalies
  goalsPerMatch: number;
}

interface AustralianRulesStats extends BaseStats {
  sport: 'AUSTRALIAN_RULES';
  goals: number;
  behinds: number;
  disposals: number;
  kicks: number;
  handballs: number;
  marks: number;
  tackles: number;
  hitouts: number;
}

interface GaelicFootballStats extends BaseStats {
  sport: 'GAELIC_FOOTBALL';
  goals: number;
  points: number;
  totalScore: number; // (goals * 3) + points
  frees: number;
  turnovers: number;
  blocks: number;
}

type SportSpecificStats = 
  | FootballStats 
  | RugbyStats 
  | BasketballStats 
  | CricketStats
  | AmericanFootballStats
  | HockeyStats
  | NetballStats
  | LacrosseStats
  | AustralianRulesStats
  | GaelicFootballStats;

interface RecentMatchPerformance {
  matchId: string;
  date: string;
  opponent: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  score: string;
  minutesPlayed: number;
  rating: number | null;
  // Sport-specific highlights
  highlights: Record<string, number>;
}

interface SeasonStats {
  season: string;
  stats: SportSpecificStats;
}

interface PlayerStatsResponse {
  playerId: string;
  playerName: string;
  sport: Sport;
  
  // Aggregate stats (from PlayerAggregateStats)
  career: SportSpecificStats;
  
  // Current season (from PlayerStatistic or calculated)
  currentSeason: SportSpecificStats;
  
  // Previous season for comparison
  previousSeason: SportSpecificStats | null;
  
  // Recent form (last 5 matches from MatchEvents)
  recentForm: {
    matches: RecentMatchPerformance[];
    formRating: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };
  
  // Season history
  seasonHistory: SeasonStats[];
  
  // Physical stats (if available)
  physical: {
    averageDistancePerMatch: number | null;
    topSpeed: number | null;
    sprintsPerMatch: number | null;
  };
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

// Map of event types to stat categories by sport
const EVENT_TO_STAT_MAP: Record<Sport, Record<string, string>> = {
  FOOTBALL: {
    GOAL: 'goals',
    ASSIST: 'assists',
    YELLOW_CARD: 'yellowCards',
    RED_CARD: 'redCards',
    OWN_GOAL: 'ownGoals',
    PENALTY_SCORED: 'penaltiesScored',
    PENALTY_MISSED: 'penaltiesMissed',
  },
  FUTSAL: {
    GOAL: 'goals',
    ASSIST: 'assists',
    YELLOW_CARD: 'yellowCards',
    RED_CARD: 'redCards',
  },
  BEACH_FOOTBALL: {
    GOAL: 'goals',
    ASSIST: 'assists',
    YELLOW_CARD: 'yellowCards',
    RED_CARD: 'redCards',
  },
  RUGBY: {
    TRY: 'tries',
    CONVERSION: 'conversions',
    PENALTY_KICK: 'penaltyKicks',
    DROP_GOAL: 'dropGoals',
    YELLOW_CARD: 'yellowCards',
    RED_CARD: 'redCards',
  },
  BASKETBALL: {
    POINT: 'points',
    REBOUND: 'rebounds',
    ASSIST: 'assists',
    STEAL: 'steals',
    BLOCK: 'blocks',
    FOUL: 'fouls',
  },
  CRICKET: {
    RUN: 'runsScored',
    WICKET: 'wickets',
    CATCH: 'catches',
    FOUR: 'fours',
    SIX: 'sixes',
  },
  AMERICAN_FOOTBALL: {
    TOUCHDOWN: 'touchdowns',
    SACK: 'sacks',
    INTERCEPTION: 'interceptions',
    FIELD_GOAL: 'fieldGoals',
  },
  HOCKEY: {
    GOAL: 'goals',
    ASSIST: 'assists',
    GREEN_CARD: 'greenCards',
    YELLOW_CARD: 'yellowCards',
    RED_CARD: 'redCards',
  },
  NETBALL: {
    GOAL: 'goals',
    ASSIST: 'assists',
    INTERCEPTION: 'interceptions',
  },
  LACROSSE: {
    GOAL: 'goals',
    ASSIST: 'assists',
    SAVE: 'saves',
  },
  AUSTRALIAN_RULES: {
    GOAL: 'goals',
    BEHIND: 'behinds',
    MARK: 'marks',
    TACKLE: 'tackles',
  },
  GAELIC_FOOTBALL: {
    GOAL: 'goals',
    POINT: 'points',
    BLOCK: 'blocks',
  },
};

// Current season calculation
const CURRENT_SEASON_START_MONTH = 6; // July (0-indexed)

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const StatsFiltersSchema = z.object({
  forPlayerId: z.string().cuid().optional(),
  period: z.enum(['CURRENT_SEASON', 'LAST_30_DAYS', 'LAST_10_MATCHES', 'ALL_TIME']).default('CURRENT_SEASON'),
  teamId: z.string().cuid().optional(),
  includeSeasonHistory: z.coerce.boolean().default(false),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `stats_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

/**
 * Check if user has access to player stats
 */
async function checkStatsAccess(
  userId: string,
  targetPlayerId?: string
): Promise<{ 
  allowed: boolean; 
  playerId: string | null; 
  accessType: 'SELF' | 'PARENT' | 'COACH' | 'SCOUT' | null;
}> {
  // Self access
  if (!targetPlayerId) {
    const player = await prisma.player.findUnique({
      where: { userId },
      select: { id: true },
    });
    return {
      allowed: !!player,
      playerId: player?.id || null,
      accessType: player ? 'SELF' : null,
    };
  }

  // Check own player
  const ownPlayer = await prisma.player.findFirst({
    where: { id: targetPlayerId, userId },
    select: { id: true },
  });

  if (ownPlayer) {
    return { allowed: true, playerId: ownPlayer.id, accessType: 'SELF' };
  }

  // Check parent access
  const parentAccess = await prisma.parentPortalAccess.findFirst({
    where: {
      parent: { userId },
      playerId: targetPlayerId,
      isActive: true,
    },
  });

  if (parentAccess) {
    return { allowed: true, playerId: targetPlayerId, accessType: 'PARENT' };
  }

  // Check coach/staff access
  const staffAccess = await prisma.clubMember.findFirst({
    where: {
      userId,
      isActive: true,
      role: { in: ['HEAD_COACH', 'ASSISTANT_COACH', 'MANAGER', 'OWNER', 'ANALYST', 'SCOUT'] },
      club: {
        teams: {
          some: {
            players: {
              some: { playerId: targetPlayerId, isActive: true },
            },
          },
        },
      },
    },
  });

  if (staffAccess) {
    const accessType = ['SCOUT'].includes(staffAccess.role) ? 'SCOUT' : 'COACH';
    return { allowed: true, playerId: targetPlayerId, accessType };
  }

  return { allowed: false, playerId: null, accessType: null };
}

/**
 * Get current season dates
 */
function getSeasonDates(year?: number): { start: Date; end: Date; label: string } {
  const now = new Date();
  const currentYear = year || now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Season runs July to June
  let seasonStartYear = currentYear;
  if (currentMonth < CURRENT_SEASON_START_MONTH) {
    seasonStartYear = currentYear - 1;
  }
  
  return {
    start: new Date(seasonStartYear, CURRENT_SEASON_START_MONTH, 1),
    end: new Date(seasonStartYear + 1, CURRENT_SEASON_START_MONTH, 1),
    label: `${seasonStartYear}/${seasonStartYear + 1}`,
  };
}

/**
 * Create empty stats object for a sport
 */
function createEmptyStats(sport: Sport): SportSpecificStats {
  const base: BaseStats = {
    totalMatches: 0,
    totalMinutes: 0,
    averageMinutesPerMatch: 0,
    starts: 0,
    substitutions: 0,
  };

  switch (sport) {
    case 'FOOTBALL':
    case 'FUTSAL':
    case 'BEACH_FOOTBALL':
      return {
        ...base,
        sport,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        cleanSheets: 0,
        penaltiesScored: 0,
        penaltiesMissed: 0,
        ownGoals: 0,
        goalsPerMatch: 0,
        assistsPerMatch: 0,
      } as FootballStats;

    case 'RUGBY':
      return {
        ...base,
        sport,
        tries: 0,
        conversions: 0,
        penaltyKicks: 0,
        dropGoals: 0,
        tackles: 0,
        missedTackles: 0,
        lineoutsWon: 0,
        lineoutsLost: 0,
        scrumsWon: 0,
        turnoversWon: 0,
        yellowCards: 0,
        redCards: 0,
        triesPerMatch: 0,
      } as RugbyStats;

    case 'BASKETBALL':
      return {
        ...base,
        sport,
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        pointsPerMatch: 0,
        reboundsPerMatch: 0,
      } as BasketballStats;

    case 'CRICKET':
      return {
        ...base,
        sport,
        runsScored: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        notOuts: 0,
        highScore: 0,
        battingAverage: 0,
        strikeRate: 0,
        wickets: 0,
        oversBowled: 0,
        runsConceded: 0,
        maidens: 0,
        bowlingAverage: 0,
        economyRate: 0,
        catches: 0,
        stumpings: 0,
        runOuts: 0,
      } as CricketStats;

    case 'AMERICAN_FOOTBALL':
      return {
        ...base,
        sport,
        touchdowns: 0,
        rushingYards: 0,
        receivingYards: 0,
        passingYards: 0,
        completions: 0,
        interceptions: 0,
        sacks: 0,
        tackles: 0,
        fieldGoals: 0,
        touchdownsPerMatch: 0,
      } as AmericanFootballStats;

    case 'HOCKEY':
      return {
        ...base,
        sport,
        goals: 0,
        assists: 0,
        greenCards: 0,
        yellowCards: 0,
        redCards: 0,
        penaltyCorners: 0,
        goalsPerMatch: 0,
      } as HockeyStats;

    case 'NETBALL':
      return {
        ...base,
        sport,
        goals: 0,
        goalAttempts: 0,
        assists: 0,
        interceptions: 0,
        rebounds: 0,
        centrePassReceives: 0,
        goalAccuracy: 0,
      } as NetballStats;

    case 'LACROSSE':
      return {
        ...base,
        sport,
        goals: 0,
        assists: 0,
        groundBalls: 0,
        turnovers: 0,
        faceoffsWon: 0,
        saves: 0,
        goalsPerMatch: 0,
      } as LacrosseStats;

    case 'AUSTRALIAN_RULES':
      return {
        ...base,
        sport,
        goals: 0,
        behinds: 0,
        disposals: 0,
        kicks: 0,
        handballs: 0,
        marks: 0,
        tackles: 0,
        hitouts: 0,
      } as AustralianRulesStats;

    case 'GAELIC_FOOTBALL':
      return {
        ...base,
        sport,
        goals: 0,
        points: 0,
        totalScore: 0,
        frees: 0,
        turnovers: 0,
        blocks: 0,
      } as GaelicFootballStats;

    default:
      return {
        ...base,
        sport: 'FOOTBALL',
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        cleanSheets: 0,
        penaltiesScored: 0,
        penaltiesMissed: 0,
        ownGoals: 0,
        goalsPerMatch: 0,
        assistsPerMatch: 0,
      } as FootballStats;
  }
}

/**
 * Calculate per-match averages
 */
function calculateAverages(stats: SportSpecificStats): SportSpecificStats {
  const matches = stats.totalMatches || 1;
  
  if ('goals' in stats && 'assists' in stats) {
    (stats as FootballStats).goalsPerMatch = Math.round((stats.goals / matches) * 100) / 100;
    (stats as FootballStats).assistsPerMatch = Math.round((stats.assists / matches) * 100) / 100;
  }
  
  if ('tries' in stats) {
    (stats as RugbyStats).triesPerMatch = Math.round((stats.tries / matches) * 100) / 100;
  }
  
  if ('points' in stats && 'rebounds' in stats) {
    (stats as BasketballStats).pointsPerMatch = Math.round((stats.points / matches) * 100) / 100;
    (stats as BasketballStats).reboundsPerMatch = Math.round((stats.rebounds / matches) * 100) / 100;
  }
  
  if ('touchdowns' in stats) {
    (stats as AmericanFootballStats).touchdownsPerMatch = Math.round((stats.touchdowns / matches) * 100) / 100;
  }
  
  stats.averageMinutesPerMatch = Math.round(stats.totalMinutes / matches);
  
  return stats;
}

/**
 * Determine form trend from recent ratings
 */
function calculateFormTrend(ratings: number[]): 'IMPROVING' | 'STABLE' | 'DECLINING' {
  if (ratings.length < 3) return 'STABLE';
  
  const recent = ratings.slice(-3);
  const older = ratings.slice(0, -3);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((a, b) => a + b, 0) / older.length 
    : recentAvg;
  
  const diff = recentAvg - olderAvg;
  
  if (diff > 0.3) return 'IMPROVING';
  if (diff < -0.3) return 'DECLINING';
  return 'STABLE';
}

// =============================================================================
// GET HANDLER - Player Stats
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

    const userId = session.user.id;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = StatsFiltersSchema.safeParse(rawParams);
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

    const filters = validation.data;

    // 3. Check access
    const access = await checkStatsAccess(userId, filters.forPlayerId);
    if (!access.allowed || !access.playerId) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Access denied to this player\'s statistics',
        },
        requestId,
        status: 403,
      });
    }

    const playerId = access.playerId;

    // 4. Get player info with primary sport
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        teamPlayers: {
          where: { isActive: true },
          include: {
            team: {
              include: {
                club: { select: { sport: true } },
              },
            },
          },
          take: 1,
        },
        aggregateStats: true,
        statistics: {
          orderBy: { season: 'desc' },
          take: 5,
        },
      },
    });

    if (!player || !player.user) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player not found',
        },
        requestId,
        status: 404,
      });
    }

    // Determine primary sport
    const sport = player.teamPlayers[0]?.team.club.sport || Sport.FOOTBALL;

    // 5. Get season dates
    const currentSeason = getSeasonDates();
    const previousSeason = getSeasonDates(currentSeason.start.getFullYear() - 1);

    // 6. Get recent match performances (last 10)
    const recentPerformances = await prisma.playerMatchPerformance.findMany({
      where: {
        playerId,
        match: {
          status: MatchStatus.COMPLETED,
          ...(filters.teamId && {
            OR: [
              { homeTeamId: filters.teamId },
              { awayTeamId: filters.teamId },
            ],
          }),
        },
      },
      include: {
        match: {
          include: {
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } },
            events: {
              where: { playerId },
            },
          },
        },
      },
      orderBy: { match: { date: 'desc' } },
      take: 10,
    });

    // 7. Build career stats from aggregate
    let careerStats = createEmptyStats(sport);
    
    if (player.aggregateStats) {
      const agg = player.aggregateStats;
      careerStats.totalMatches = agg.totalMatches;
      careerStats.totalMinutes = agg.totalMinutes;
      careerStats.starts = agg.starts;
      careerStats.substitutions = agg.substitutions;
      
      // Map aggregate fields to sport-specific stats
      if ('goals' in careerStats) {
        (careerStats as FootballStats).goals = agg.totalGoals;
        (careerStats as FootballStats).assists = agg.totalAssists;
        (careerStats as FootballStats).yellowCards = agg.yellowCards;
        (careerStats as FootballStats).redCards = agg.redCards;
        (careerStats as FootballStats).cleanSheets = agg.cleanSheets;
      }
    }
    
    careerStats = calculateAverages(careerStats);

    // 8. Build current season stats
    let currentSeasonStats = createEmptyStats(sport);
    
    const currentSeasonStat = player.statistics.find(
      (s) => s.season === currentSeason.label
    );
    
    if (currentSeasonStat) {
      currentSeasonStats.totalMatches = currentSeasonStat.matches;
      currentSeasonStats.totalMinutes = currentSeasonStat.minutes;
      currentSeasonStats.starts = currentSeasonStat.starts;
      currentSeasonStats.substitutions = currentSeasonStat.substitutes;
      
      if ('goals' in currentSeasonStats) {
        (currentSeasonStats as FootballStats).goals = currentSeasonStat.goals;
        (currentSeasonStats as FootballStats).assists = currentSeasonStat.assists;
        (currentSeasonStats as FootballStats).yellowCards = currentSeasonStat.yellowCards;
        (currentSeasonStats as FootballStats).redCards = currentSeasonStat.redCards;
        (currentSeasonStats as FootballStats).cleanSheets = currentSeasonStat.cleanSheets;
      }
    }
    
    currentSeasonStats = calculateAverages(currentSeasonStats);

    // 9. Build previous season stats
    let previousSeasonStats: SportSpecificStats | null = null;
    
    const previousSeasonStat = player.statistics.find(
      (s) => s.season === previousSeason.label
    );
    
    if (previousSeasonStat) {
      previousSeasonStats = createEmptyStats(sport);
      previousSeasonStats.totalMatches = previousSeasonStat.matches;
      previousSeasonStats.totalMinutes = previousSeasonStat.minutes;
      previousSeasonStats.starts = previousSeasonStat.starts;
      
      if ('goals' in previousSeasonStats) {
        (previousSeasonStats as FootballStats).goals = previousSeasonStat.goals;
        (previousSeasonStats as FootballStats).assists = previousSeasonStat.assists;
      }
      
      previousSeasonStats = calculateAverages(previousSeasonStats);
    }

    // 10. Build recent form from match events
    const eventMap = EVENT_TO_STAT_MAP[sport] || EVENT_TO_STAT_MAP.FOOTBALL;
    const ratings: number[] = [];
    
    const recentMatches: RecentMatchPerformance[] = recentPerformances.slice(0, 5).map((perf) => {
      const match = perf.match;
      const isHome = match.homeTeam.id === filters.teamId || 
        player.teamPlayers.some((tp) => tp.teamId === match.homeTeam.id);
      
      const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;
      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;
      
      let result: 'WIN' | 'LOSS' | 'DRAW';
      if (homeScore === awayScore) {
        result = 'DRAW';
      } else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) {
        result = 'WIN';
      } else {
        result = 'LOSS';
      }
      
      // Count events
      const highlights: Record<string, number> = {};
      match.events.forEach((event) => {
        const statKey = eventMap[event.type];
        if (statKey) {
          highlights[statKey] = (highlights[statKey] || 0) + 1;
        }
      });
      
      if (perf.rating) {
        ratings.push(perf.rating);
      }
      
      return {
        matchId: match.id,
        date: match.date.toISOString(),
        opponent,
        result,
        score: `${homeScore}-${awayScore}`,
        minutesPlayed: perf.minutesPlayed || 0,
        rating: perf.rating,
        highlights,
      };
    });

    const formRating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : player.formRating || 0;

    // 11. Build season history (if requested)
    const seasonHistory: SeasonStats[] = filters.includeSeasonHistory
      ? player.statistics.map((stat) => {
          const seasonStats = createEmptyStats(sport);
          seasonStats.totalMatches = stat.matches;
          seasonStats.totalMinutes = stat.minutes;
          
          if ('goals' in seasonStats) {
            (seasonStats as FootballStats).goals = stat.goals;
            (seasonStats as FootballStats).assists = stat.assists;
          }
          
          return {
            season: stat.season,
            stats: calculateAverages(seasonStats),
          };
        })
      : [];

    // 12. Build response
    const response: PlayerStatsResponse = {
      playerId: player.id,
      playerName: `${player.user.firstName} ${player.user.lastName}`,
      sport,
      
      career: careerStats,
      currentSeason: currentSeasonStats,
      previousSeason: previousSeasonStats,
      
      recentForm: {
        matches: recentMatches,
        formRating,
        trend: calculateFormTrend(ratings),
      },
      
      seasonHistory,
      
      physical: {
        averageDistancePerMatch: player.aggregateStats?.averageDistancePerMatch || null,
        topSpeed: null,
        sprintsPerMatch: null,
      },
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player stats fetched`, {
      playerId,
      sport,
      accessType: access.accessType,
      careerMatches: careerStats.totalMatches,
      recentMatchesCount: recentMatches.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/player/stats error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch player statistics',
        details: error instanceof Error ? error.message : undefined,
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';
