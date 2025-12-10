import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function predictPlayerPerformance(
  playerId: string,
  timeHorizon: 'NEXT_MATCH' | 'NEXT_WEEK' | 'NEXT_MONTH' = 'NEXT_MATCH'
) {
  try {
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: {
        stats: { orderBy: { season: 'desc' }, take: 2 },
        matchAttendance: {
          include: { match: true },
          orderBy: { match: { date: 'desc' } },
          take: 10,
        },
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Base metrics from recent form
    let performanceRating = 6.5; // Default 0-10 scale
    let goals = 0.15;
    let assists = 0.08;
    let passAccuracy = 85;

    // Get recent match ratings
    if (player.matchAttendance.length > 0) {
      const recentRatings = player.matchAttendance
        .slice(0, 5)
        .map(m => m.performanceRating || 7)
        .filter(r => r > 0);

      if (recentRatings.length > 0) {
        const avgRating = recentRatings.reduce((a, b) => a + b) / recentRatings.length;
        performanceRating = avgRating;
      }
    }

    // Trend analysis
    let performanceTrend: 'IMPROVING' | 'DECLINING' | 'STABLE' = 'STABLE';
    if (player.matchAttendance.length >= 5) {
      const recent = player.matchAttendance.slice(0, 3).map(m => m.performanceRating || 0);
      const older = player.matchAttendance.slice(3, 6).map(m => m.performanceRating || 0);

      const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b) / older.length;

      if (recentAvg > olderAvg + 0.5) performanceTrend = 'IMPROVING';
      else if (recentAvg < olderAvg - 0.5) performanceTrend = 'DECLINING';
    }

    // Predicted performance (slight regression to mean)
    let predictedRating = performanceRating;
    if (performanceTrend === 'IMPROVING') predictedRating += 0.3;
    else if (performanceTrend === 'DECLINING') predictedRating -= 0.3;

    predictedRating = Math.min(10, Math.max(1, predictedRating)); // Clamp 1-10

    // Get seasonal stats
    const seasonStats = player.stats;
    if (seasonStats) {
      goals = seasonStats.appearances > 0 ? seasonStats.goals / seasonStats.appearances : 0;
      assists = seasonStats.appearances > 0 ? seasonStats.assists / seasonStats.appearances : 0;
      passAccuracy = seasonStats.passAccuracy || 85;
    }

    // Predict metrics based on trend
    const trendMultiplier = performanceTrend === 'IMPROVING' ? 1.1 : performanceTrend === 'DECLINING' ? 0.9 : 1.0;
    const predictedGoals = Math.round(goals * trendMultiplier * 100) / 100;
    const predictedAssists = Math.round(assists * trendMultiplier * 100) / 100;

    const prediction = await prisma.performancePrediction.create({
      data: {
        playerId: player.id,
        recentFormRating: performanceRating,
        consistencyScore: 0.75,
        predictedPerformanceRating: predictedRating,
        predictedGoals,
        predictedAssists,
        predictedPassAccuracy: passAccuracy,
        performanceTrend,
        trendStrength: 0.65,
        playingTimeRecommendation: performanceTrend === 'DECLINING' ? 'REDUCED' : 'FULL',
        supportStrategies: [
          'Maintain current tactical role',
          'Focus on key strengths',
          'Increase supportive play from teammates',
        ],
        focusAreas: ['Finishing', 'Decision-making', 'Positioning'],
        accuracy: 'MEDIUM',
        timeHorizon,
      },
    });

    logger.info('Performance prediction generated', {
      playerId: player.id,
      predictedRating,
      trend: performanceTrend,
    });

    return prediction;
  } catch (error) {
    logger.error('Performance prediction error', { error, playerId });
    throw error;
  }
}
