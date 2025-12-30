// =============================================================================
// 🏆 LIVE STANDINGS API - Real-Time League Standings
// =============================================================================
// GET /api/leagues/[leagueId]/standings/live - Get real-time standings with live match data
// =============================================================================
// Schema: v7.8.0 | Model: CompetitionStanding
// Multi-Sport: ✅ All 12 sports with sport-specific scoring
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Sport,
  MatchStatus,
  CompetitionStatus,
} from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  requestId: string;
  timestamp: string;
}

interface RouteParams {
  params: {
    leagueId: string;
  };
}

interface CompetitionSettings {
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  bonusPointsEnabled: boolean;
  bonusPointsConfig?: Record<string, number>;
  tiebreakers: string[];
  showGoalDifference: boolean;
  showForm: boolean;
  formMatchCount?: number;
}

interface LiveStandingRow {
  position: number;
  previousPosition?: number;
  movement: 'UP' | 'DOWN' | 'SAME' | 'NEW';
  
  // Team info
  team: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    club: {
      id: string;
      name: string;
      shortName: string | null;
      logo: string | null;
    } | null;
  } | null;
  
  // Core stats
  played: number;
  wins: number;
  draws: number;
  losses: number;
  
  // Scoring (labels vary by sport)
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  
  // Points
  points: number;
  
  // Live adjustments (if match in progress)
  liveAdjustment?: {
    pointsChange: number;
    goalsForChange: number;
    goalsAgainstChange: number;
    matchId: string;
    opponent: string;
    currentScore: string;
    projectedPoints: number;
  };
  
  // Form (last N matches)
  form: string | null;
  formDetails?: Array<{
    result: 'W' | 'D' | 'L';
    opponent: string;
    score: string;
    matchId: string;
  }>;
  
  // Home/Away split
  homeRecord?: { w: number; d: number; l: number; gf: number; ga: number };
  awayRecord?: { w: number; d: number; l: number; gf: number; ga: number };
  
  // Qualification zones (if configured)
  zone?: {
    type: 'CHAMPION' | 'PROMOTION' | 'PLAYOFF' | 'RELEGATION' | 'NEUTRAL';
    name?: string;
    color?: string;
  };
}

interface LiveStandingsResponse {
  leagueId: string;
  leagueName: string;
  sport: Sport;
  season: string | null;
  status: CompetitionStatus;
  
  // Scoring labels
  scoringLabels: {
    for: string;
    against: string;
    difference: string;
  };
  
  // Standings
  standings: LiveStandingRow[];
  
  // Live matches affecting standings
  liveMatches: Array<{
    id: string;
    homeTeam: { id: string; name: string; logo: string | null };
    awayTeam: { id: string; name: string; logo: string | null };
    homeScore: number;
    awayScore: number;
    minute: number | null;
    status: MatchStatus;
  }>;
  
  // Metadata
  lastUpdated: string;
  isLive: boolean;
  nextMatchTime?: string;
  
  // Configuration
  configuration: {
    pointsWin: number;
    pointsDraw: number;
    pointsLoss: number;
    bonusPointsEnabled: boolean;
    showForm: boolean;
    formMatchCount: number;
  };
}

// =============================================================================
// SPORT-SPECIFIC CONFIGURATIONS
// =============================================================================

const SPORT_SCORING_LABELS: Record<Sport, { for: string; against: string; difference: string }> = {
  FOOTBALL: { for: 'GF', against: 'GA', difference: 'GD' },
  FUTSAL: { for: 'GF', against: 'GA', difference: 'GD' },
  BEACH_FOOTBALL: { for: 'GF', against: 'GA', difference: 'GD' },
  RUGBY: { for: 'PF', against: 'PA', difference: 'PD' },
  CRICKET: { for: 'RF', against: 'RA', difference: 'NRR' },
  AMERICAN_FOOTBALL: { for: 'PF', against: 'PA', difference: 'PD' },
  BASKETBALL: { for: 'PF', against: 'PA', difference: 'PD' },
  HOCKEY: { for: 'GF', against: 'GA', difference: 'GD' },
  LACROSSE: { for: 'GF', against: 'GA', difference: 'GD' },
  NETBALL: { for: 'GF', against: 'GA', difference: 'GD' },
  AUSTRALIAN_RULES: { for: 'PF', against: 'PA', difference: '%' },
  GAELIC_FOOTBALL: { for: 'SF', against: 'SA', difference: 'SD' },
};

const SPORT_BONUS_RULES: Record<Sport, (homeScore: number, awayScore: number, isHome: boolean) => number> = {
  RUGBY: (homeScore, awayScore, isHome) => {
    let bonus = 0;
    const teamScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;
    
    // 4+ tries bonus (approximated as 4+ scoring difference)
    // In a real system, this would check actual try count
    if (teamScore >= 28) bonus += 1; // Attacking bonus approximation
    
    // Losing by 7 or less
    if (teamScore < oppScore && oppScore - teamScore <= 7) bonus += 1;
    
    return bonus;
  },
  // Other sports can have custom bonus logic
  FOOTBALL: () => 0,
  FUTSAL: () => 0,
  BEACH_FOOTBALL: () => 0,
  CRICKET: () => 0,
  AMERICAN_FOOTBALL: () => 0,
  BASKETBALL: () => 0,
  HOCKEY: () => 0,
  LACROSSE: () => 0,
  NETBALL: () => 0,
  AUSTRALIAN_RULES: () => 0,
  GAELIC_FOOTBALL: () => 0,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `live_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
    error?: string;
    code?: string;
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    requestId: options.requestId,
    timestamp: new Date().toISOString(),
  };

  if (options.success && data !== null) {
    response.data = data;
  }
  if (options.message) response.message = options.message;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;

  return NextResponse.json(response, { status: options.status || 200 });
}

/**
 * Calculate projected points based on current live match scores
 */
function calculateLivePoints(
  currentPoints: number,
  teamId: string,
  liveMatches: Array<{
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
  }>,
  settings: CompetitionSettings,
  sport: Sport
): { points: number; goalsFor: number; goalsAgainst: number; matchId?: string } {
  let additionalPoints = 0;
  let additionalGF = 0;
  let additionalGA = 0;
  let relevantMatchId: string | undefined;

  for (const match of liveMatches) {
    const isHome = match.homeTeamId === teamId;
    const isAway = match.awayTeamId === teamId;
    
    if (!isHome && !isAway) continue;
    
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;
    
    const teamScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;
    
    additionalGF += teamScore;
    additionalGA += oppScore;
    relevantMatchId = (match as { id?: string }).id;
    
    // Calculate base points
    if (teamScore > oppScore) {
      additionalPoints += settings.pointsForWin;
    } else if (teamScore === oppScore) {
      additionalPoints += settings.pointsForDraw;
    } else {
      additionalPoints += settings.pointsForLoss;
    }
    
    // Add bonus points if enabled
    if (settings.bonusPointsEnabled) {
      const bonusCalculator = SPORT_BONUS_RULES[sport];
      additionalPoints += bonusCalculator(homeScore, awayScore, isHome);
    }
  }

  return {
    points: currentPoints + additionalPoints,
    goalsFor: additionalGF,
    goalsAgainst: additionalGA,
    matchId: relevantMatchId,
  };
}

/**
 * Determine position movement
 */
function getMovement(
  currentPosition: number,
  previousPosition: number | null
): 'UP' | 'DOWN' | 'SAME' | 'NEW' {
  if (previousPosition === null) return 'NEW';
  if (currentPosition < previousPosition) return 'UP';
  if (currentPosition > previousPosition) return 'DOWN';
  return 'SAME';
}

/**
 * Parse form string into details
 */
async function getFormDetails(
  teamId: string,
  competitionId: string,
  formMatchCount: number
): Promise<Array<{ result: 'W' | 'D' | 'L'; opponent: string; score: string; matchId: string }>> {
  const recentMatches = await prisma.match.findMany({
    where: {
      competitionId,
      status: MatchStatus.COMPLETED,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
    orderBy: { kickOffTime: 'desc' },
    take: formMatchCount,
  });

  return recentMatches.map((match) => {
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
    const oppScore = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
    const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;

    let result: 'W' | 'D' | 'L';
    if (teamScore > oppScore) result = 'W';
    else if (teamScore === oppScore) result = 'D';
    else result = 'L';

    return {
      result,
      opponent,
      score: `${teamScore}-${oppScore}`,
      matchId: match.id,
    };
  });
}

// =============================================================================
// GET HANDLER - Live Standings
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { leagueId } = params;

  try {
    // 1. Validate leagueId
    if (!leagueId || leagueId.length < 20) {
      return createResponse(null, {
        success: false,
        error: 'Invalid league ID',
        code: 'INVALID_ID',
        requestId,
        status: 400,
      });
    }

    // 2. Check for optional query params
    const { searchParams } = new URL(request.url);
    const includeForm = searchParams.get('includeForm') !== 'false';
    const includeFormDetails = searchParams.get('includeFormDetails') === 'true';
    const includeSplits = searchParams.get('includeSplits') === 'true';

    // 3. Fetch competition
    const competition = await prisma.competition.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        sport: true,
        season: true,
        status: true,
        settings: true,
        deletedAt: true,
      },
    });

    if (!competition || competition.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'League not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    const settings = (competition.settings as CompetitionSettings) || {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      bonusPointsEnabled: false,
      tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR'],
      showGoalDifference: true,
      showForm: true,
      formMatchCount: 5,
    };

    // 4. Fetch current standings
    const standings = await prisma.competitionStanding.findMany({
      where: { competitionId: leagueId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            club: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: [{ position: 'asc' }],
    });

    // 5. Fetch live matches
    const liveMatches = await prisma.match.findMany({
      where: {
        competitionId: leagueId,
        deletedAt: null,
        status: { in: [MatchStatus.LIVE, MatchStatus.HALF_TIME] },
      },
      include: {
        homeTeam: {
          select: { id: true, name: true, logo: true },
        },
        awayTeam: {
          select: { id: true, name: true, logo: true },
        },
      },
    });

    const isLive = liveMatches.length > 0;

    // 6. Find next upcoming match (if not live)
    let nextMatchTime: string | undefined;
    if (!isLive) {
      const nextMatch = await prisma.match.findFirst({
        where: {
          competitionId: leagueId,
          deletedAt: null,
          status: { in: [MatchStatus.SCHEDULED, MatchStatus.CONFIRMED] },
          kickOffTime: { gte: new Date() },
        },
        orderBy: { kickOffTime: 'asc' },
        select: { kickOffTime: true },
      });
      nextMatchTime = nextMatch?.kickOffTime.toISOString();
    }

    // 7. Get last update time
    const lastUpdate = await prisma.match.findFirst({
      where: {
        competitionId: leagueId,
        status: MatchStatus.COMPLETED,
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    // 8. Build live standings with projections
    const liveStandings: LiveStandingRow[] = await Promise.all(
      standings.map(async (standing, index) => {
        const teamId = standing.teamId;
        
        // Calculate live adjustments if matches in progress
        let liveAdjustment: LiveStandingRow['liveAdjustment'];
        
        if (isLive && teamId) {
          const teamLiveMatches = liveMatches.filter(
            (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
          );
          
          if (teamLiveMatches.length > 0) {
            const match = teamLiveMatches[0];
            const isHome = match.homeTeamId === teamId;
            const homeScore = match.homeScore ?? 0;
            const awayScore = match.awayScore ?? 0;
            const teamScore = isHome ? homeScore : awayScore;
            const oppScore = isHome ? awayScore : homeScore;
            const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;
            
            // Calculate projected points
            let projectedPointsChange = 0;
            if (teamScore > oppScore) {
              projectedPointsChange = settings.pointsForWin;
            } else if (teamScore === oppScore) {
              projectedPointsChange = settings.pointsForDraw;
            } else {
              projectedPointsChange = settings.pointsForLoss;
            }
            
            // Add bonus points
            if (settings.bonusPointsEnabled) {
              const bonusCalculator = SPORT_BONUS_RULES[competition.sport];
              projectedPointsChange += bonusCalculator(homeScore, awayScore, isHome);
            }
            
            liveAdjustment = {
              pointsChange: projectedPointsChange,
              goalsForChange: teamScore,
              goalsAgainstChange: oppScore,
              matchId: match.id,
              opponent,
              currentScore: `${homeScore}-${awayScore}`,
              projectedPoints: standing.points + projectedPointsChange,
            };
          }
        }
        
        // Get form details if requested
        let formDetails: LiveStandingRow['formDetails'];
        if (includeFormDetails && teamId && includeForm) {
          formDetails = await getFormDetails(
            teamId,
            leagueId,
            settings.formMatchCount ?? 5
          );
        }
        
        // Build home/away records if requested
        let homeRecord: LiveStandingRow['homeRecord'];
        let awayRecord: LiveStandingRow['awayRecord'];
        
        if (includeSplits) {
          homeRecord = standing.homeWins !== null ? {
            w: standing.homeWins,
            d: standing.homeDraws ?? 0,
            l: standing.homeLosses ?? 0,
            gf: standing.homeGoalsFor ?? 0,
            ga: standing.homeGoalsAgainst ?? 0,
          } : undefined;
          
          awayRecord = standing.awayWins !== null ? {
            w: standing.awayWins,
            d: standing.awayDraws ?? 0,
            l: standing.awayLosses ?? 0,
            gf: standing.awayGoalsFor ?? 0,
            ga: standing.awayGoalsAgainst ?? 0,
          } : undefined;
        }
        
        // Determine zone (simplified - could be configured per competition)
        let zone: LiveStandingRow['zone'];
        const position = standing.position || index + 1;
        const totalTeams = standings.length;
        
        if (position === 1) {
          zone = { type: 'CHAMPION', name: 'Champion', color: '#FFD700' };
        } else if (position <= Math.ceil(totalTeams * 0.1)) {
          zone = { type: 'PROMOTION', name: 'Promotion', color: '#4CAF50' };
        } else if (position >= totalTeams - Math.ceil(totalTeams * 0.1)) {
          zone = { type: 'RELEGATION', name: 'Relegation', color: '#F44336' };
        }
        
        return {
          position,
          previousPosition: standing.previousPosition,
          movement: getMovement(position, standing.previousPosition),
          
          team: standing.team,
          
          played: standing.played,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          
          goalsFor: standing.goalsFor,
          goalsAgainst: standing.goalsAgainst,
          goalDifference: standing.goalDifference,
          
          points: standing.points,
          
          liveAdjustment,
          
          form: includeForm ? standing.form : null,
          formDetails,
          
          homeRecord,
          awayRecord,
          
          zone,
        };
      })
    );

    // 9. Re-sort standings if live matches affect positions
    if (isLive) {
      liveStandings.sort((a, b) => {
        const aPoints = a.liveAdjustment?.projectedPoints ?? a.points;
        const bPoints = b.liveAdjustment?.projectedPoints ?? b.points;
        
        if (bPoints !== aPoints) return bPoints - aPoints;
        
        const aGD = a.goalDifference + (a.liveAdjustment?.goalsForChange ?? 0) - (a.liveAdjustment?.goalsAgainstChange ?? 0);
        const bGD = b.goalDifference + (b.liveAdjustment?.goalsForChange ?? 0) - (b.liveAdjustment?.goalsAgainstChange ?? 0);
        
        if (bGD !== aGD) return bGD - aGD;
        
        const aGF = a.goalsFor + (a.liveAdjustment?.goalsForChange ?? 0);
        const bGF = b.goalsFor + (b.liveAdjustment?.goalsForChange ?? 0);
        
        return bGF - aGF;
      });
      
      // Update projected positions
      liveStandings.forEach((standing, index) => {
        const projectedPosition = index + 1;
        if (projectedPosition !== standing.position) {
          standing.movement = getMovement(projectedPosition, standing.position);
        }
      });
    }

    // 10. Build response
    const response: LiveStandingsResponse = {
      leagueId: competition.id,
      leagueName: competition.name,
      sport: competition.sport,
      season: competition.season,
      status: competition.status,
      
      scoringLabels: SPORT_SCORING_LABELS[competition.sport],
      
      standings: liveStandings,
      
      liveMatches: liveMatches.map((match) => ({
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore ?? 0,
        awayScore: match.awayScore ?? 0,
        minute: match.actualDuration, // Approximation - would need live minute tracking
        status: match.status,
      })),
      
      lastUpdated: lastUpdate?.updatedAt.toISOString() ?? new Date().toISOString(),
      isLive,
      nextMatchTime,
      
      configuration: {
        pointsWin: settings.pointsForWin,
        pointsDraw: settings.pointsForDraw,
        pointsLoss: settings.pointsForLoss,
        bonusPointsEnabled: settings.bonusPointsEnabled,
        showForm: settings.showForm ?? true,
        formMatchCount: settings.formMatchCount ?? 5,
      },
    };

    return createResponse(response, {
      success: true,
      message: isLive
        ? `Live standings with ${liveMatches.length} match(es) in progress`
        : 'Current standings retrieved',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Live Standings GET error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch live standings',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
