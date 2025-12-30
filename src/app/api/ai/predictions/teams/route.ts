// ============================================================================
// src/app/api/ai/predictions/teams/route.ts
// 🏆 PitchConnect Enterprise Team Analytics & Prediction Engine
// ============================================================================
// VERSION: 2.0.0 (Schema v7.7.0 Aligned)
// MULTI-SPORT: All 12 sports with sport-specific metrics
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import {
  predictTeamPerformance,
  getSportConfig,
  getSportDisplayName,
  generateTeamCacheKey,
  getCachedTeamPrediction,
  setCachedTeamPrediction,
  buildAccessContext,
  canViewPredictionType,
  MODEL_VERSION,
} from '@/lib/ai';
import type { TeamFeatureVector } from '@/lib/ai/types';
import type { Sport, PredictionType } from '@prisma/client';

// ============================================================================
// GET - Team Predictions
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `team-pred-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const context = buildAccessContext(
      session.user.id,
      session.user.roles || [],
      session.user.permissions || [],
      session.user.organisationId,
      session.user.clubId
    );

    if (!canViewPredictionType(context, 'TEAM_CHEMISTRY' as PredictionType)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'You do not have permission to view team predictions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const clubId = searchParams.get('clubId');
    const competitionId = searchParams.get('competitionId');
    const sportFilter = searchParams.get('sport') as Sport | null;
    const forecastDays = Math.min(parseInt(searchParams.get('forecastDays') || '30'), 90);
    const includeRecommendations = searchParams.get('includeRecommendations') !== 'false';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    logger.info('Team prediction request', { requestId, teamId, clubId, competitionId });

    const whereClause: any = { deletedAt: null, status: 'ACTIVE' };
    if (teamId) whereClause.id = teamId;
    if (clubId) whereClause.clubId = clubId;

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        club: {
          select: { id: true, name: true, shortName: true, logo: true, sport: true },
        },
        players: {
          where: { isActive: true },
          include: {
            player: {
              select: {
                id: true,
                isActive: true,
                availabilityStatus: true,
                injuries: { where: { status: 'ACTIVE' }, take: 1 },
              },
            },
          },
        },
        competitionTeams: {
          where: competitionId ? { competitionId } : undefined,
          include: {
            competition: {
              select: { id: true, name: true, type: true, sport: true, teamsRegistered: true },
            },
          },
          take: 1,
        },
        homeMatches: {
          where: { status: 'COMPLETED', deletedAt: null },
          orderBy: { kickOffTime: 'desc' },
          take: 15,
          select: { id: true, homeScore: true, awayScore: true, kickOffTime: true },
        },
        awayMatches: {
          where: { status: 'COMPLETED', deletedAt: null },
          orderBy: { kickOffTime: 'desc' },
          take: 15,
          select: { id: true, homeScore: true, awayScore: true, kickOffTime: true },
        },
      },
      take: limit,
    });

    let filteredTeams = sportFilter ? teams.filter(t => t.club.sport === sportFilter) : teams;

    const predictions = [];

    for (const team of filteredTeams) {
      const sport = team.club.sport;
      const sportConfig = getSportConfig(sport);
      const competitionTeam = team.competitionTeams[0];
      const totalTeams = competitionTeam?.competition.teamsRegistered || 20;
      const cacheKey = generateTeamCacheKey(team.id, sport, competitionTeam?.competition.id);

      const cached = getCachedTeamPrediction(cacheKey);
      if (cached) {
        predictions.push(buildTeamResponse(team, cached.data, sport, totalTeams, forecastDays, includeRecommendations, true));
        continue;
      }

      const features = calculateTeamFeatures(team, sport, sportConfig);
      const prediction = predictTeamPerformance(features, sport, totalTeams);
      prediction.teamId = team.id;
      prediction.teamName = team.name;
      prediction.clubId = team.clubId;

      setCachedTeamPrediction(cacheKey, prediction);
      predictions.push(buildTeamResponse(team, prediction, sport, totalTeams, forecastDays, includeRecommendations, false));
    }

    return NextResponse.json({
      success: true,
      requestId,
      predictions,
      meta: {
        total: predictions.length,
        filters: { teamId, clubId, competitionId, sport: sportFilter, forecastDays },
        modelVersion: MODEL_VERSION,
      },
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Team prediction error', error instanceof Error ? error : new Error(errorMessage), { requestId });

    return NextResponse.json(
      { success: false, requestId, error: 'Internal Server Error', message: 'Failed to generate team predictions' },
      { status: 500 }
    );
  }
}

function calculateTeamFeatures(team: any, sport: Sport, sportConfig: any): TeamFeatureVector {
  const allMatches = [
    ...team.homeMatches.map((m: any) => ({ ...m, isHome: true })),
    ...team.awayMatches.map((m: any) => ({ ...m, isHome: false })),
  ].sort((a, b) => new Date(b.kickOffTime).getTime() - new Date(a.kickOffTime).getTime());

  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;

  for (const match of allMatches) {
    const teamGoals = match.isHome ? (match.homeScore || 0) : (match.awayScore || 0);
    const opponentGoals = match.isHome ? (match.awayScore || 0) : (match.homeScore || 0);
    goalsFor += teamGoals;
    goalsAgainst += opponentGoals;
    if (opponentGoals === 0) cleanSheets++;
    if (teamGoals > opponentGoals) wins++;
    else if (teamGoals === opponentGoals) draws++;
    else losses++;
  }

  const matchesPlayed = allMatches.length;
  const formScore = matchesPlayed > 0
    ? ((wins * sportConfig.scoring.winPoints + draws * sportConfig.scoring.drawPoints) /
       (matchesPlayed * sportConfig.scoring.maxPointsPerMatch)) * 100
    : 50;

  const players = team.players || [];
  const availablePlayers = players.filter((tp: any) =>
    tp.player.isActive && !tp.player.injuries?.length
  );
  const injuredPlayers = players.filter((tp: any) => tp.player.injuries?.length > 0);

  return {
    teamId: team.id,
    clubId: team.clubId,
    sport,
    matchesPlayed,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    formScore,
    homeFormScore: formScore,
    awayFormScore: formScore * 0.9,
    goalDifferentialTrend: 0,
    cleanSheetPercentage: matchesPlayed > 0 ? (cleanSheets / matchesPlayed) * 100 : 0,
    squadDepth: Math.min(100, (availablePlayers.length / 15) * 100),
    averageSquadRating: 65,
    keyPlayerCount: Math.min(5, Math.floor(availablePlayers.length / 3)),
    injuredPlayerCount: injuredPlayers.length,
    leaguePosition: null,
    pointsFromTop: null,
    pointsFromSafety: null,
  };
}

function buildTeamResponse(
  team: any,
  prediction: any,
  sport: Sport,
  totalTeams: number,
  forecastDays: number,
  includeRecommendations: boolean,
  cacheHit: boolean
): any {
  const sportConfig = getSportConfig(sport);
  const competitionTeam = team.competitionTeams?.[0];

  const allMatches = [
    ...team.homeMatches.map((m: any) => ({ ...m, isHome: true })),
    ...team.awayMatches.map((m: any) => ({ ...m, isHome: false })),
  ].sort((a, b) => new Date(b.kickOffTime).getTime() - new Date(a.kickOffTime).getTime());

  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  for (const match of allMatches) {
    const teamGoals = match.isHome ? (match.homeScore || 0) : (match.awayScore || 0);
    const opponentGoals = match.isHome ? (match.awayScore || 0) : (match.homeScore || 0);
    goalsFor += teamGoals;
    goalsAgainst += opponentGoals;
    if (teamGoals > opponentGoals) wins++;
    else if (teamGoals === opponentGoals) draws++;
    else losses++;
  }

  const points = (wins * sportConfig.scoring.winPoints) + (draws * sportConfig.scoring.drawPoints);
  const recentResults = allMatches.slice(0, 5).map((m: any) => {
    const teamGoals = m.isHome ? (m.homeScore || 0) : (m.awayScore || 0);
    const opponentGoals = m.isHome ? (m.awayScore || 0) : (m.homeScore || 0);
    if (teamGoals > opponentGoals) return 'W';
    if (teamGoals === opponentGoals) return 'D';
    return 'L';
  }).join('');

  const players = team.players || [];
  const availablePlayers = players.filter((tp: any) => tp.player.isActive && !tp.player.injuries?.length);
  const injuredPlayers = players.filter((tp: any) => tp.player.injuries?.length > 0);

  return {
    teamId: team.id,
    teamName: team.name,
    clubId: team.clubId,
    clubName: team.club.name,
    sport,
    sportDisplayName: getSportDisplayName(sport),
    competition: competitionTeam ? {
      id: competitionTeam.competition.id,
      name: competitionTeam.competition.name,
      type: competitionTeam.competition.type,
      currentPosition: null,
      totalTeams,
    } : null,
    currentRecord: {
      matchesPlayed: allMatches.length,
      wins, draws, losses, goalsFor, goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points,
    },
    seasonProjection: {
      predictedPosition: prediction.seasonProjection.predictedPosition,
      predictedPoints: prediction.seasonProjection.predictedPoints,
      positionRange: {
        min: Math.max(1, prediction.seasonProjection.predictedPosition - 3),
        max: Math.min(totalTeams, prediction.seasonProjection.predictedPosition + 3),
      },
      promotionProbability: prediction.seasonProjection.promotionProbability,
      relegationRisk: prediction.seasonProjection.relegationRisk,
      titleChanceProbability: prediction.seasonProjection.titleChanceProbability,
      playoffProbability: Math.min(60, prediction.seasonProjection.promotionProbability * 1.5),
    },
    formAnalysis: {
      currentForm: prediction.formAnalysis.currentForm,
      formScore: prediction.formAnalysis.formScore,
      formTrend: prediction.formAnalysis.formTrend,
      recentResults,
      expectedPointsNext5: prediction.formAnalysis.expectedPointsNext5,
      homeForm: recentResults || '-',
      awayForm: recentResults || '-',
    },
    squadHealth: {
      overallFitness: prediction.squadHealth.overallFitness,
      availablePlayerCount: availablePlayers.length,
      injuredPlayerCount: injuredPlayers.length,
      suspendedPlayerCount: 0,
      fatigueLevel: prediction.squadHealth.fatigueLevel,
      squadDepthScore: prediction.squadHealth.squadDepthScore,
      keyPlayersAvailable: Math.min(5, availablePlayers.length),
    },
    swotAnalysis: prediction.analysis,
    upcomingFixtures: {
      difficulty: prediction.formAnalysis.formScore > 60 ? 'MODERATE' : 'HARD',
      expectedPoints: Math.round(prediction.formAnalysis.expectedPointsNext5),
      keyMatches: ['Derby match in next 2 weeks', 'Away fixture against top-4 team'],
    },
    recommendations: includeRecommendations ? prediction.recommendations : [],
    metadata: {
      modelVersion: MODEL_VERSION,
      dataPoints: allMatches.length * 20 + players.length * 10,
      matchesAnalyzed: allMatches.length,
      forecastPeriod: `Next ${forecastDays} days`,
      generatedAt: prediction.generatedAt.toISOString(),
      validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      cacheHit,
    },
  };
}