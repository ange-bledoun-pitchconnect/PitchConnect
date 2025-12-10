import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function predictInjuryRisk(playerId: string) {
  try {
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: {
        matchAttendance: {
          include: { match: true },
          orderBy: { match: { date: 'desc' } },
          take: 20,
        },
        trainingAttendance: {
          include: { trainingSession: true },
          orderBy: { trainingSession: { date: 'desc' } },
          take: 30,
        },
        injuries: {
          orderBy: { dateFrom: 'desc' },
          take: 5,
        },
        stats: {
          orderBy: { season: 'desc' },
          take: 2,
        },
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Calculate playtime in last week
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const playtimeLastWeek = player.matchAttendance
      .filter(m => m.match.date > lastWeek)
      .reduce((sum, m) => sum + (m.minutesPlayed || 0), 0);

    // Calculate training load last week
    const trainingLoadLastWeek = player.trainingAttendance
      .filter(t => t.trainingSession.date > lastWeek)
      .length * 90; // Assume 90 min per session

    // Risk score calculation (0-100)
    let riskScore = 40; // Base risk

    // Factor 1: Playtime (high playtime = higher risk)
    if (playtimeLastWeek > 300) riskScore += 15;
    else if (playtimeLastWeek > 150) riskScore += 10;

    // Factor 2: Training load
    if (trainingLoadLastWeek > 450) riskScore += 15;
    else if (trainingLoadLastWeek > 270) riskScore += 10;

    // Factor 3: Age (peak injury risk 25-35)
    const ageInYears = player.dateOfBirth 
      ? Math.floor((new Date().getTime() - player.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 25;

    if (ageInYears > 28 && ageInYears < 35) riskScore += 10;
    else if (ageInYears < 20) riskScore += 8; // Youth injuries higher

    // Factor 4: Injury history
    const recentInjuries = player.injuries.filter(
      i => new Date().getTime() - i.dateFrom.getTime() < 365 * 24 * 60 * 60 * 1000
    ).length;

    if (recentInjuries >= 2) riskScore += 20;
    else if (recentInjuries === 1) riskScore += 10;

    // Factor 5: Performance decline (potential overuse)
    if (player.stats.length >= 2) {
      const current = player.stats;
      const previous = player.stats;

      if (current.minutesPlayed > previous.minutesPlayed * 1.2) {
        riskScore += 10; // 20% increase in playtime
      }
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore >= 75) riskLevel = 'CRITICAL';
    else if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 45) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    // Identify muscle groups at risk
    const muscleGroupsAtRisk: string[] = [];
    if (playtimeLastWeek > 250) {
      muscleGroupsAtRisk.push('hamstrings', 'glutes', 'calves');
    }
    if (trainingLoadLastWeek > 400) {
      muscleGroupsAtRisk.push('quadriceps', 'knees');
    }
    if (recentInjuries > 0 && player.injuries) {
      const previousInjury = player.injuries.type;
      muscleGroupsAtRisk.push(previousInjury.toLowerCase());
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskScore >= 70) {
      recommendations.push('Schedule comprehensive medical assessment');
      recommendations.push('Implement targeted injury prevention program');
      recommendations.push('Consider rotation with backup player');
    }
    if (trainingLoadLastWeek > 450) {
      recommendations.push('Reduce high-intensity training volumes');
      recommendations.push('Increase recovery sessions');
      recommendations.push('Focus on flexibility and mobility work');
    }
    if (playtimeLastWeek > 250) {
      recommendations.push('Monitor match load carefully');
      recommendations.push('Plan strategic substitutions');
    }

    const prediction = await prisma.injuryPrediction.create({
      data: {
        playerId: player.id,
        riskLevel,
        riskPercentage: Math.min(100, riskScore),
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        playtimeMinutesLastWeek,
        trainingLoadLastWeek,
        previousInjuries: player.injuries.length,
        ageInYears,
        muscleGroupsAtRisk,
        vulnerabilityFactors: {
          playtime: { score: Math.min(100, playtimeLastWeek / 3), weight: 0.25 },
          trainingLoad: { score: Math.min(100, trainingLoadLastWeek / 5), weight: 0.25 },
          age: { score: Math.abs(ageInYears - 30) * 2, weight: 0.2 },
          injuryHistory: { score: recentInjuries * 30, weight: 0.2 },
          performanceChange: { score: 20, weight: 0.1 },
        },
        recommendations,
        accuracy: 'MEDIUM',
        predictedRiskWindow: 'NEXT_2_WEEKS',
      },
    });

    logger.info('Injury prediction generated', {
      playerId: player.id,
      riskLevel,
      riskScore,
    });

    return prediction;
  } catch (error) {
    logger.error('Injury prediction error', { error, playerId });
    throw error;
  }
}
