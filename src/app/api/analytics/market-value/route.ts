'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiResponse } from '@/lib/api/responses';
import { ApiError } from '@/lib/api/errors';
import prisma from '@/lib/prisma';

/**
 * Market Value Analytics
 * Calculates and analyzes player market values based on performance metrics
 */

interface MarketValueRequest {
  playerId?: string;
  teamId?: string;
  sport: 'football' | 'netball' | 'rugby';
}

interface PlayerMarketValue {
  playerId: string;
  playerName: string;
  position: string;
  currentValue: number;
  projectedValue: number;
  valuation: {
    baseValue: number;
    performanceBonus: number;
    ageAdjustment: number;
    injuryHistory: number;
  };
  trend: 'up' | 'down' | 'stable';
  recommendations: string[];
  comparables: Array<{
    playerId: string;
    playerName: string;
    marketValue: number;
    similarity: number;
  }>;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<PlayerMarketValue | PlayerMarketValue[]>>> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        ApiError.unauthorized('Authentication required'),
        { status: 401 },
      );
    }

    const body: MarketValueRequest = await req.json();

    // Validation
    if (!body.sport || !['football', 'netball', 'rugby'].includes(body.sport)) {
      return NextResponse.json(
        ApiError.validation('Valid sport is required'),
        { status: 400 },
      );
    }

    // Get single player or team players
    if (body.playerId) {
      const valuation = await calculatePlayerMarketValue(
        body.playerId,
        body.sport,
        session.user.id,
      );

      if (!valuation) {
        return NextResponse.json(
          ApiError.notFound('Player not found'),
          { status: 404 },
        );
      }

      return NextResponse.json(
        ApiResponse.success(valuation, 'Player valuation calculated'),
        { status: 200 },
      );
    } else if (body.teamId) {
      const valuations = await calculateTeamMarketValues(
        body.teamId,
        body.sport,
        session.user.id,
      );

      return NextResponse.json(
        ApiResponse.success(valuations, 'Team valuations calculated'),
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        ApiError.validation('Either playerId or teamId is required'),
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Market value analysis error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        ApiError.badRequest('Invalid request body'),
        { status: 400 },
      );
    }

    return NextResponse.json(
      ApiError.internal('Market value analysis failed'),
      { status: 500 },
    );
  }
}

/**
 * Calculate market value for a single player
 */
async function calculatePlayerMarketValue(
  playerId: string,
  sport: string,
  userId: string,
): Promise<PlayerMarketValue | null> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      team: true,
      stats: {
        orderBy: { season: 'desc' },
        take: 2,
      },
      injuries: {
        where: { recoveryDate: null },
      },
      contract: {
        orderBy: { startDate: 'desc' },
        take: 1,
      },
    },
  });

  if (!player) return null;

  // Verify user access
  const hasAccess = await prisma.userTeam.findFirst({
    where: {
      userId,
      teamId: player.teamId,
    },
  });

  if (!hasAccess) return null;

  // Calculate valuation components
  const baseValue = calculateBaseValue(player, sport);
  const performanceBonus = calculatePerformanceBonus(player.stats);
  const ageAdjustment = calculateAgeAdjustment(player.dateOfBirth);
  const injuryHistory = calculateInjuryPenalty(player.injuries);

  const currentValue =
    baseValue + performanceBonus + ageAdjustment - injuryHistory;

  // Calculate trend
  const trend = calculateTrend(player.stats);

  // Get comparable players
  const comparables = await getComparablePlayers(
    player,
    sport,
  );

  return {
    playerId: player.id,
    playerName: player.firstName + ' ' + player.lastName,
    position: player.position,
    currentValue: Math.max(0, currentValue),
    projectedValue: Math.max(0, currentValue * 1.1),
    valuation: {
      baseValue,
      performanceBonus,
      ageAdjustment,
      injuryHistory,
    },
    trend,
    recommendations: generateMarketRecommendations(
      currentValue,
      trend,
      player,
    ),
    comparables,
  };
}

/**
 * Calculate market values for entire team
 */
async function calculateTeamMarketValues(
  teamId: string,
  sport: string,
  userId: string,
): Promise<PlayerMarketValue[]> {
  // Verify access
  const hasAccess = await prisma.userTeam.findFirst({
    where: {
      userId,
      teamId,
    },
  });

  if (!hasAccess) return [];

  const players = await prisma.player.findMany({
    where: { teamId },
    include: {
      stats: {
        orderBy: { season: 'desc' },
        take: 2,
      },
      injuries: {
        where: { recoveryDate: null },
      },
    },
  });

  const valuations: PlayerMarketValue[] = [];

  for (const player of players) {
    const baseValue = calculateBaseValue(player, sport);
    const performanceBonus = calculatePerformanceBonus(player.stats);
    const ageAdjustment = calculateAgeAdjustment(player.dateOfBirth);
    const injuryHistory = calculateInjuryPenalty(player.injuries);

    const currentValue =
      baseValue + performanceBonus + ageAdjustment - injuryHistory;
    const trend = calculateTrend(player.stats);

    valuations.push({
      playerId: player.id,
      playerName: player.firstName + ' ' + player.lastName,
      position: player.position,
      currentValue: Math.max(0, currentValue),
      projectedValue: Math.max(0, currentValue * 1.1),
      valuation: {
        baseValue,
        performanceBonus,
        ageAdjustment,
        injuryHistory,
      },
      trend,
      recommendations: generateMarketRecommendations(
        currentValue,
        trend,
        player,
      ),
      comparables: [],
    });
  }

  return valuations.sort((a, b) => b.currentValue - a.currentValue);
}

// Utility calculation functions
function calculateBaseValue(player: any, sport: string): number {
  // Base value depends on position and sport
  const positionMultipliers: Record<string, number> = {
    // Football
    'Goalkeeper': 50000,
    'Defender': 100000,
    'Midfielder': 150000,
    'Forward': 200000,
    // Netball
    'Goal Shooter': 120000,
    'Wing Attack': 100000,
    'Centre': 110000,
    'Wing Defence': 90000,
    'Goal Defence': 100000,
    'Goalkeeper': 80000,
    'Attacker': 110000,
  };

  return positionMultipliers[player.position] || 100000;
}

function calculatePerformanceBonus(stats: any[]): number {
  if (!stats || stats.length === 0) return 0;

  const recentStats = stats;
  const bonus =
    ((recentStats?.rating || 0) / 10) * 100000 +
    ((recentStats?.appearances || 0) * 5000);

  return bonus;
}

function calculateAgeAdjustment(dateOfBirth: Date): number {
  const age =
    (new Date().getFullYear() - new Date(dateOfBirth).getFullYear());

  if (age < 24) return 50000; // Young player premium
  if (age > 32) return -30000; // Older player discount
  return 0;
}

function calculateInjuryPenalty(injuries: any[]): number {
  return Math.min(injuries.length * 25000, 100000);
}

function calculateTrend(stats: any[]): 'up' | 'down' | 'stable' {
  if (stats.length < 2) return 'stable';

  const recent = stats;
  const previous = stats;

  if (!recent || !previous) return 'stable';

  if (recent.rating > previous.rating) return 'up';
  if (recent.rating < previous.rating) return 'down';
  return 'stable';
}

function generateMarketRecommendations(
  currentValue: number,
  trend: string,
  player: any,
): string[] {
  const recommendations: string[] = [];

  if (trend === 'up' && currentValue > 150000) {
    recommendations.push('Consider negotiating contract renewal');
  }
  if (trend === 'down') {
    recommendations.push('Focus on performance improvement');
  }
  if (player.injuries?.length > 0) {
    recommendations.push('Monitor injury recovery progress');
  }

  return recommendations;
}

async function getComparablePlayers(
  player: any,
  sport: string,
): Promise<PlayerMarketValue['comparables']> {
  // Get similar players by position and stats
  const comparables = await prisma.player.findMany({
    where: {
      position: player.position,
      sport,
      id: { not: player.id },
    },
    take: 3,
    include: {
      stats: {
        orderBy: { season: 'desc' },
        take: 1,
      },
    },
  });

  return comparables.map((comp) => ({
    playerId: comp.id,
    playerName: comp.firstName + ' ' + comp.lastName,
    marketValue: 100000, // Simplified
    similarity: 0.85,
  }));
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<{ status: string; message: string }>>> {
  return NextResponse.json(
    ApiResponse.success(
      { status: 'available', message: 'Market value analysis endpoint active' },
      'OK',
    ),
    { status: 200 },
  );
}
