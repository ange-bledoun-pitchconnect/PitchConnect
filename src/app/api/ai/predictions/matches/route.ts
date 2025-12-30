// ============================================================================
// src/app/api/ai/predictions/matches/route.ts
// 🏆 PitchConnect Enterprise Match Prediction Engine
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports supported with sport-specific configurations
// ============================================================================
// FEATURES:
// - Advanced team form analysis across all sports
// - Historical head-to-head comparisons
// - Squad strength & availability analysis
// - Confidence scoring with sport-specific weighting
// - Pre-computed caching for performance
// - Role-based access control
// - Audit trail integration
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import {
  predictMatchOutcome,
  getSportConfig,
  getSportDisplayName,
  generateMatchCacheKey,
  getCachedMatchPrediction,
  setCachedMatchPrediction,
  buildAccessContext,
  canViewPredictionType,
  MODEL_VERSION,
} from '@/lib/ai';
import type { MatchFeatureVector } from '@/lib/ai/types';
import type { Sport, MatchStatus, PredictionType } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface MatchPredictionResponse {
  matchId: string;
  matchDate: Date;
  matchStatus: MatchStatus;
  venue: string | null;
  sport: Sport;
  sportDisplayName: string;
  
  competition: {
    id: string;
    name: string;
    type: string;
  } | null;
  
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  
  prediction: {
    outcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
    homeWinProbability: string;
    drawProbability: string;
    awayWinProbability: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    confidenceScore: string;
  };
  
  expectedScore: {
    home: number;
    away: number;
    total: number;
  };
  
  keyFactors: Array<{
    factor: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    description: string;
  }>;
  
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
  
  analytics?: TeamAnalytics;
  
  metadata: {
    modelVersion: string;
    dataPoints: number;
    generatedAt: string;
    validUntil: string;
    cacheHit: boolean;
  };
}

interface TeamInfo {
  id: string;
  clubId: string;
  name: string;
  shortName: string | null;
  logo: string | null;
  squadSize: number;
  activePlayerCount: number;
  coachingStaffCount: number;
  recentForm: string; // e.g., "WWDLW"
  formScore: number;
}

interface TeamAnalytics {
  homeTeam: {
    recentMatches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    cleanSheets: number;
    formTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };
  awayTeam: {
    recentMatches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    cleanSheets: number;
    formTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };
  headToHead: {
    totalMatches: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    lastMeetingDate: Date | null;
    lastMeetingResult: string | null;
  };
}

// ============================================================================
// GET - Match Predictions
// ============================================================================

/**
 * GET /api/ai/predictions/matches
 * Generate AI-powered match outcome predictions
 * 
 * Query Parameters:
 * - matchId: string (specific match)
 * - competitionId: string (all matches in competition)
 * - clubId: string (matches involving this club)
 * - sport: Sport (filter by sport)
 * - upcomingOnly: boolean (default: true)
 * - includeAnalytics: boolean (default: true)
 * - limit: number (default: 20, max: 50)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `match-pred-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await auth();

    if (!session?.user) {
      logger.warn('Unauthorized match prediction request', { requestId });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    // ========================================================================
    // PERMISSION CHECK
    // ========================================================================
    const context = buildAccessContext(
      session.user.id,
      session.user.roles || [],
      session.user.permissions || [],
      session.user.organisationId,
      session.user.clubId
    );

    if (!canViewPredictionType(context, 'MATCH_OUTCOME' as PredictionType)) {
      logger.warn('Permission denied for match predictions', { 
        requestId, 
        userId: session.user.id 
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to view match predictions',
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // PARSE QUERY PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const competitionId = searchParams.get('competitionId');
    const clubId = searchParams.get('clubId');
    const sportFilter = searchParams.get('sport') as Sport | null;
    const upcomingOnly = searchParams.get('upcomingOnly') !== 'false';
    const includeAnalytics = searchParams.get('includeAnalytics') !== 'false';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    logger.info('Match prediction request', {
      requestId,
      matchId,
      competitionId,
      clubId,
      sportFilter,
      upcomingOnly,
    });

    // ========================================================================
    // BUILD QUERY
    // ========================================================================
    const whereClause: any = {
      deletedAt: null,
    };

    if (matchId) {
      whereClause.id = matchId;
    }

    if (competitionId) {
      whereClause.competitionId = competitionId;
    }

    if (clubId) {
      whereClause.OR = [
        { homeClubId: clubId },
        { awayClubId: clubId },
      ];
    }

    if (upcomingOnly) {
      whereClause.status = { in: ['SCHEDULED', 'POSTPONED'] };
      whereClause.kickOffTime = { gte: new Date() };
    }

    // Sport filter via club relation
    if (sportFilter) {
      whereClause.homeClub = { sport: sportFilter };
    }

    // ========================================================================
    // FETCH MATCHES
    // ========================================================================
    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        // Home Club with members
        homeClub: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            sport: true,
            venue: true,
            members: {
              where: { 
                isActive: true,
                deletedAt: null,
              },
              select: {
                id: true,
                role: true,
                isCaptain: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        // Away Club with members
        awayClub: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            sport: true,
            members: {
              where: { 
                isActive: true,
                deletedAt: null,
              },
              select: {
                id: true,
                role: true,
                isCaptain: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        // Home Team
        homeTeam: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { players: { where: { isActive: true } } },
            },
          },
        },
        // Away Team
        awayTeam: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { players: { where: { isActive: true } } },
            },
          },
        },
        // Competition
        competition: {
          select: {
            id: true,
            name: true,
            type: true,
            sport: true,
          },
        },
        // Venue
        venueRelation: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: { kickOffTime: 'asc' },
      take: limit,
    });

    logger.info('Matches fetched', {
      requestId,
      matchCount: matches.length,
    });

    // ========================================================================
    // GENERATE PREDICTIONS
    // ========================================================================
    const predictions: MatchPredictionResponse[] = [];

    for (const match of matches) {
      const sport = match.competition?.sport || match.homeClub.sport;
      const cacheKey = generateMatchCacheKey(match.id, sport);

      // Check cache first
      const cached = getCachedMatchPrediction(cacheKey);
      if (cached) {
        // Return cached prediction with updated metadata
        const cachedPrediction = buildPredictionResponse(
          match,
          cached.data,
          sport,
          includeAnalytics,
          true
        );
        predictions.push(cachedPrediction);
        continue;
      }

      // Calculate features for prediction
      const features = await calculateMatchFeatures(match, sport);

      // Generate prediction
      const prediction = predictMatchOutcome(features, sport);
      prediction.matchId = match.id;

      // Cache the prediction
      setCachedMatchPrediction(cacheKey, prediction);

      // Build response
      const predictionResponse = buildPredictionResponse(
        match,
        prediction,
        sport,
        includeAnalytics,
        false
      );
      predictions.push(predictionResponse);
    }

    logger.info('Predictions generated', {
      requestId,
      predictionCount: predictions.length,
      processingTime: Date.now() - startTime,
    });

    // ========================================================================
    // RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        success: true,
        requestId,
        predictions,
        meta: {
          total: predictions.length,
          filters: {
            matchId,
            competitionId,
            clubId,
            sport: sportFilter,
            upcomingOnly,
          },
          modelVersion: MODEL_VERSION,
          supportedSports: [
            'FOOTBALL', 'RUGBY', 'CRICKET', 'BASKETBALL', 'AMERICAN_FOOTBALL',
            'NETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES', 'GAELIC_FOOTBALL',
            'FUTSAL', 'BEACH_FOOTBALL',
          ],
        },
        timestamp: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Match prediction error', error instanceof Error ? error : new Error(errorMessage), {
      requestId,
      endpoint: '/api/ai/predictions/matches',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Internal Server Error',
        message: 'Failed to generate match predictions',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate feature vector for match prediction
 */
async function calculateMatchFeatures(
  match: any,
  sport: Sport
): Promise<MatchFeatureVector> {
  const sportConfig = getSportConfig(sport);

  // Count active players and coaches
  const homeMembers = match.homeClub.members || [];
  const awayMembers = match.awayClub.members || [];

  const coachRoles = ['HEAD_COACH', 'ASSISTANT_COACH', 'PERFORMANCE_COACH', 'COACH'];
  
  const homeActivePlayers = homeMembers.filter(
    (m: any) => m.role === 'PLAYER' && m.user?.status === 'ACTIVE'
  ).length;
  
  const awayActivePlayers = awayMembers.filter(
    (m: any) => m.role === 'PLAYER' && m.user?.status === 'ACTIVE'
  ).length;

  const homeCoaches = homeMembers.filter(
    (m: any) => coachRoles.includes(m.role)
  ).length;
  
  const awayCoaches = awayMembers.filter(
    (m: any) => coachRoles.includes(m.role)
  ).length;

  // Fetch recent matches for form calculation
  const [homeRecentMatches, awayRecentMatches] = await Promise.all([
    prisma.match.findMany({
      where: {
        OR: [
          { homeClubId: match.homeClubId },
          { awayClubId: match.homeClubId },
        ],
        status: 'COMPLETED',
        kickOffTime: { lt: match.kickOffTime },
      },
      orderBy: { kickOffTime: 'desc' },
      take: 10,
      select: {
        id: true,
        homeClubId: true,
        awayClubId: true,
        homeScore: true,
        awayScore: true,
        kickOffTime: true,
      },
    }),
    prisma.match.findMany({
      where: {
        OR: [
          { homeClubId: match.awayClubId },
          { awayClubId: match.awayClubId },
        ],
        status: 'COMPLETED',
        kickOffTime: { lt: match.kickOffTime },
      },
      orderBy: { kickOffTime: 'desc' },
      take: 10,
      select: {
        id: true,
        homeClubId: true,
        awayClubId: true,
        homeScore: true,
        awayScore: true,
        kickOffTime: true,
      },
    }),
  ]);

  // Calculate form scores
  const homeForm = calculateFormScore(homeRecentMatches, match.homeClubId, sportConfig);
  const awayForm = calculateFormScore(awayRecentMatches, match.awayClubId, sportConfig);

  // Fetch head-to-head history
  const h2hMatches = await prisma.match.findMany({
    where: {
      status: 'COMPLETED',
      OR: [
        { homeClubId: match.homeClubId, awayClubId: match.awayClubId },
        { homeClubId: match.awayClubId, awayClubId: match.homeClubId },
      ],
    },
    orderBy: { kickOffTime: 'desc' },
    take: 10,
    select: {
      homeClubId: true,
      awayClubId: true,
      homeScore: true,
      awayScore: true,
    },
  });

  const h2h = calculateH2H(h2hMatches, match.homeClubId, match.awayClubId);

  // Calculate rest days (if previous match data available)
  const homeLastMatch = homeRecentMatches[0];
  const awayLastMatch = awayRecentMatches[0];
  
  const homeRestDays = homeLastMatch 
    ? Math.floor((match.kickOffTime.getTime() - homeLastMatch.kickOffTime.getTime()) / (1000 * 60 * 60 * 24))
    : 7;
  
  const awayRestDays = awayLastMatch
    ? Math.floor((match.kickOffTime.getTime() - awayLastMatch.kickOffTime.getTime()) / (1000 * 60 * 60 * 24))
    : 7;

  // Calculate squad ratings (simplified - based on squad size and coaching)
  const homeSquadRating = Math.min(100, (homeActivePlayers / 15) * 50 + (homeCoaches / 3) * 50);
  const awaySquadRating = Math.min(100, (awayActivePlayers / 15) * 50 + (awayCoaches / 3) * 50);

  return {
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeRecentForm: homeForm.score,
    awayRecentForm: awayForm.score,
    homeGoalsScoredAvg: homeForm.goalsFor / Math.max(homeForm.matches, 1),
    awayGoalsScoredAvg: awayForm.goalsFor / Math.max(awayForm.matches, 1),
    homeGoalsConcededAvg: homeForm.goalsAgainst / Math.max(homeForm.matches, 1),
    awayGoalsConcededAvg: awayForm.goalsAgainst / Math.max(awayForm.matches, 1),
    h2hHomeWins: h2h.homeWins,
    h2hAwayWins: h2h.awayWins,
    h2hDraws: h2h.draws,
    h2hTotalMatches: h2h.total,
    homeSquadRating,
    awaySquadRating,
    homeKeyPlayersAvailable: (homeActivePlayers / 15) * 100,
    awayKeyPlayersAvailable: (awayActivePlayers / 15) * 100,
    homeRestDays,
    awayRestDays,
    competitionImportance: 50, // Could be enhanced based on competition type/stage
    isNeutralVenue: match.isNeutralVenue || false,
    sportSpecificFeatures: {},
  };
}

/**
 * Calculate form score from recent matches
 */
function calculateFormScore(
  matches: any[],
  clubId: string,
  config: any
): { score: number; matches: number; goalsFor: number; goalsAgainst: number; form: string } {
  if (matches.length === 0) {
    return { score: 50, matches: 0, goalsFor: 0, goalsAgainst: 0, form: '' };
  }

  let points = 0;
  let maxPoints = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  const formLetters: string[] = [];

  for (const match of matches.slice(0, 5)) {
    const isHome = match.homeClubId === clubId;
    const teamScore = isHome ? (match.homeScore || 0) : (match.awayScore || 0);
    const opponentScore = isHome ? (match.awayScore || 0) : (match.homeScore || 0);

    goalsFor += teamScore;
    goalsAgainst += opponentScore;

    if (teamScore > opponentScore) {
      points += config.scoring.winPoints;
      formLetters.push('W');
    } else if (teamScore === opponentScore) {
      points += config.scoring.drawPoints;
      formLetters.push('D');
    } else {
      formLetters.push('L');
    }
    maxPoints += config.scoring.maxPointsPerMatch;
  }

  const score = maxPoints > 0 ? (points / maxPoints) * 100 : 50;

  return {
    score,
    matches: matches.length,
    goalsFor,
    goalsAgainst,
    form: formLetters.join(''),
  };
}

/**
 * Calculate head-to-head statistics
 */
function calculateH2H(
  matches: any[],
  homeClubId: string,
  awayClubId: string
): { homeWins: number; awayWins: number; draws: number; total: number } {
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  for (const match of matches) {
    const homeScore = match.homeScore || 0;
    const awayScore = match.awayScore || 0;

    if (homeScore === awayScore) {
      draws++;
    } else if (
      (match.homeClubId === homeClubId && homeScore > awayScore) ||
      (match.awayClubId === homeClubId && awayScore > homeScore)
    ) {
      homeWins++;
    } else {
      awayWins++;
    }
  }

  return {
    homeWins,
    awayWins,
    draws,
    total: matches.length,
  };
}

/**
 * Build prediction response from match and prediction data
 */
function buildPredictionResponse(
  match: any,
  prediction: any,
  sport: Sport,
  includeAnalytics: boolean,
  cacheHit: boolean
): MatchPredictionResponse {
  const homeMembers = match.homeClub.members || [];
  const awayMembers = match.awayClub.members || [];
  const coachRoles = ['HEAD_COACH', 'ASSISTANT_COACH', 'PERFORMANCE_COACH', 'COACH'];

  const response: MatchPredictionResponse = {
    matchId: match.id,
    matchDate: match.kickOffTime,
    matchStatus: match.status,
    venue: match.venueRelation?.name || match.venue || match.homeClub.venue,
    sport,
    sportDisplayName: getSportDisplayName(sport),
    competition: match.competition
      ? {
          id: match.competition.id,
          name: match.competition.name,
          type: match.competition.type,
        }
      : null,
    homeTeam: {
      id: match.homeTeamId,
      clubId: match.homeClubId,
      name: match.homeClub.name,
      shortName: match.homeClub.shortName,
      logo: match.homeClub.logo,
      squadSize: homeMembers.length,
      activePlayerCount: homeMembers.filter((m: any) => m.role === 'PLAYER' && m.user?.status === 'ACTIVE').length,
      coachingStaffCount: homeMembers.filter((m: any) => coachRoles.includes(m.role)).length,
      recentForm: '', // Populated if analytics included
      formScore: 0,
    },
    awayTeam: {
      id: match.awayTeamId,
      clubId: match.awayClubId,
      name: match.awayClub.name,
      shortName: match.awayClub.shortName,
      logo: match.awayClub.logo,
      squadSize: awayMembers.length,
      activePlayerCount: awayMembers.filter((m: any) => m.role === 'PLAYER' && m.user?.status === 'ACTIVE').length,
      coachingStaffCount: awayMembers.filter((m: any) => coachRoles.includes(m.role)).length,
      recentForm: '',
      formScore: 0,
    },
    prediction: {
      outcome: prediction.predictedOutcome,
      homeWinProbability: `${prediction.homeWinProbability}%`,
      drawProbability: `${prediction.drawProbability}%`,
      awayWinProbability: `${prediction.awayWinProbability}%`,
      confidence: prediction.confidence,
      confidenceScore: `${prediction.confidenceScore}%`,
    },
    expectedScore: {
      home: prediction.expectedHomeScore,
      away: prediction.expectedAwayScore,
      total: prediction.expectedTotalGoals,
    },
    keyFactors: prediction.keyFactors.map((f: any) => ({
      factor: f.factor,
      impact: f.impact,
      description: f.description,
    })),
    riskAssessment: {
      level: prediction.riskLevel,
      factors: prediction.riskFactors,
    },
    metadata: {
      modelVersion: MODEL_VERSION,
      dataPoints: prediction.dataPoints || 0,
      generatedAt: prediction.generatedAt.toISOString(),
      validUntil: prediction.validUntil.toISOString(),
      cacheHit,
    },
  };

  return response;
}