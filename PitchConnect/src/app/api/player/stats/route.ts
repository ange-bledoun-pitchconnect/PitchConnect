import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'CURRENT_SEASON';

    // Determine date range based on period
    let dateFilter: any = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const seasonStart = new Date(currentYear, 6, 1); // July 1st

    if (period === 'CURRENT_SEASON') {
      dateFilter = { gte: seasonStart };
    } else if (period === 'LAST_30_DAYS') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: thirtyDaysAgo };
    } else if (period === 'LAST_10_MATCHES') {
      // Special handling for last 10 matches
    }

    // Get player profile
    const player = await prisma.player.findUnique({
      where: { userId: user.id },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player profile not found' },
        { status: 404 }
      );
    }

    // Get all matches for player in current season
    const matchesInPeriod = await prisma.match.findMany({
      where: {
        date: dateFilter,
        OR: [
          { homeTeamId: player.id },
          { awayTeamId: player.id },
        ],
      },
      include: {
        events: {
          where: { playerId: player.id },
        },
        playerAttendances: {
          where: { playerId: player.id },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate stats
    let totalGoals = 0;
    let totalAssists = 0;
    const totalMatches = matchesInPeriod.length;
    let totalMinutes = 0;
    let totalShots = 0;
    let shotsOnTarget = 0;
    let expectedGoals = 0;
    let tackles = 0;
    let interceptions = 0;
    const totalPasses = 0;
    const accuratePasses = 0;
    const cleanSheets = 0;
    let yellowCards = 0;
    let redCards = 0;

    const recentMatches: any[] = [];

    matchesInPeriod.slice(0, 5).forEach((match) => {
      const attendance = match.playerAttendances[0];
      if (attendance?.status !== 'PRESENT') return;

      totalMinutes += 90; // Default to full match

      // Count events
      match.events.forEach((event) => {
        if (event.type === 'GOAL') totalGoals++;
        if (event.type === 'ASSIST') totalAssists++;
        if (event.type === 'SHOT') totalShots++;
        if (event.type === 'SHOT_ON_TARGET') shotsOnTarget++;
        if (event.type === 'TACKLE') tackles++;
        if (event.type === 'INTERCEPTION') interceptions++;
        if (event.type === 'YELLOW_CARD') yellowCards++;
        if (event.type === 'RED_CARD') redCards++;
      });

      // Calculate expected goals (simplified)
      expectedGoals += shotsOnTarget > 0 ? shotsOnTarget * 0.08 : 0;

      recentMatches.push({
        matchId: match.id,
        date: match.date.toISOString(),
        opponent: match.homeTeamId === player.id
          ? match.awayTeam?.name || 'Away Team'
          : match.homeTeam?.name || 'Home Team',
        result: match.homeGoals! > match.awayGoals! ? 'WIN' : match.homeGoals! < match.awayGoals! ? 'LOSS' : 'DRAW',
        goals: match.events.filter((e) => e.type === 'GOAL').length,
        assists: match.events.filter((e) => e.type === 'ASSIST').length,
        rating: 7.2, // Placeholder - should be stored in DB
      });
    });

    // Get previous season stats for comparison
    const previousSeasonStart = new Date(currentYear - 1, 6, 1);
    const previousSeasonEnd = new Date(currentYear, 6, 1);

    const previousSeasonMatches = await prisma.match.findMany({
      where: {
        date: {
          gte: previousSeasonStart,
          lt: previousSeasonEnd,
        },
        OR: [
          { homeTeamId: player.id },
          { awayTeamId: player.id },
        ],
      },
      include: {
        events: {
          where: { playerId: player.id },
        },
      },
    });

    let prevSeasonGoals = 0;
    let prevSeasonAssists = 0;
    let prevSeasonMatches = 0;
    let prevSeasonRating = 0;

    previousSeasonMatches.forEach((match) => {
      prevSeasonMatches++;
      match.events.forEach((event) => {
        if (event.type === 'GOAL') prevSeasonGoals++;
        if (event.type === 'ASSIST') prevSeasonAssists++;
      });
      prevSeasonRating += 6.9; // Placeholder
    });

    // Calculate averages
    const passingAccuracy = totalPasses > 0 ? (accuratePasses / totalPasses) * 100 : 0;
    const averageRating =
      totalMatches > 0 ? totalGoals * 0.5 + totalAssists * 0.3 + passingAccuracy * 0.01 : 0;

    return NextResponse.json({
      stats: {
        overview: {
          totalMatches: totalMatches,
          totalGoals: totalGoals,
          totalAssists: totalAssists,
          totalMinutes: totalMinutes,
          averageRating: Math.min(averageRating, 10),
          cleanSheets: cleanSheets,
        },
        currentSeason: {
          matches: totalMatches,
          goals: totalGoals,
          assists: totalAssists,
          yellowCards: yellowCards,
          redCards: redCards,
          shots: totalShots,
          shotsOnTarget: shotsOnTarget,
          expectedGoals: Math.round(expectedGoals * 10) / 10,
          tackles: tackles,
          interceptions: interceptions,
          passingAccuracy: Math.round(passingAccuracy * 10) / 10,
        },
        previousSeason: {
          matches: prevSeasonMatches,
          goals: prevSeasonGoals,
          assists: prevSeasonAssists,
          averageRating: 6.9,
        },
        physical: {
          distancePerMatch: 10.2,
          topSpeed: 32.4,
          sprintsPerMatch: 18,
        },
        recentMatches: recentMatches,
      },
    });
  } catch (error) {
    console.error('Get player stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch player statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
