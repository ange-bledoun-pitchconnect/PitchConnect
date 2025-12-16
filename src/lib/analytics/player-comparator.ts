// ============================================================================
// FILE 2: src/lib/analytics/player-comparator.ts
// ============================================================================

import { prisma } from '@/lib/prisma';

export interface PlayerComparison {
  playerId: string;
  comparisonPlayerId: string;
  comparison: {
    rating: number;
    goals: number;
    assists: number;
    minutesPlayed: number;
    passingAccuracy: number;
    tackles: number;
    interceptions: number;
    yellowCards: number;
    redCards: number;
  };
  difference: {
    ratingDiff: number;
    goalsDiff: number;
    assistsDiff: number;
    minutesDiff: number;
  };
}

export async function comparePlayerStats(
  playerId: string,
  comparisonPlayerId: string,
  season?: number
): Promise<PlayerComparison> {
  const currentYear = new Date().getFullYear();
  const targetSeason = season || currentYear;

  const [player, comparisonPlayer] = await Promise.all([
    prisma.player.findUnique({
      where: { id: playerId },
      include: {
        statistics: {
          where: { season: targetSeason },
          orderBy: { season: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.player.findUnique({
      where: { id: comparisonPlayerId },
      include: {
        statistics: {
          where: { season: targetSeason },
          orderBy: { season: 'desc' },
          take: 1,
        },
      },
    }),
  ]);

  if (!player || !comparisonPlayer) {
    throw new Error('One or both players not found');
  }

  const playerStats = player.statistics[0];
  const comparisonStats = comparisonPlayer.statistics[0];

  const comparison = {
    playerId,
    comparisonPlayerId,
    comparison: {
      rating: playerStats?.goals || 0,
      goals: playerStats?.goals || 0,
      assists: playerStats?.assists || 0,
      minutesPlayed: playerStats?.minutesPlayed || 0,
      passingAccuracy: 0,
      tackles: 0,
      interceptions: 0,
      yellowCards: playerStats?.yellowCards || 0,
      redCards: playerStats?.redCards || 0,
    },
    difference: {
      ratingDiff: (playerStats?.goals || 0) - (comparisonStats?.goals || 0),
      goalsDiff: (playerStats?.goals || 0) - (comparisonStats?.goals || 0),
      assistsDiff: (playerStats?.assists || 0) - (comparisonStats?.assists || 0),
      minutesDiff: (playerStats?.minutesPlayed || 0) - (comparisonStats?.minutesPlayed || 0),
    },
  };

  return comparison;
}

export async function findSimilarPlayers(
  playerId: string,
  limit: number = 5
): Promise<any[]> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      analytics: true,
      statistics: {
        orderBy: { season: 'desc' },
        take: 1,
      },
    },
  });

  if (!player) {
    throw new Error('Player not found');
  }

  // Get players with similar analytics
  const similarPlayers = await prisma.player.findMany({
    where: {
      id: { not: playerId },
      analytics: {
        isNot: null,
      },
    },
    include: {
      analytics: true,
      statistics: {
        orderBy: { season: 'desc' },
        take: 1,
      },
    },
    take: limit,
  });

  return similarPlayers;
}
