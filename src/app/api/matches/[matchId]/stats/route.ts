// ============================================================================
// 🔌 MATCH STATS API ROUTE v7.4.0
// ============================================================================
// /api/matches/[matchId]/stats - Get match statistics
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================================================
// GET /api/matches/[matchId]/stats
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: params.matchId, deletedAt: null },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        events: {
          select: {
            eventType: true,
            teamSide: true,
          },
        },
        playerPerformances: {
          select: {
            teamId: true,
            passes: true,
            passesComplete: true,
            shots: true,
            shotsOnTarget: true,
            tackles: true,
            fouls: true,
            yellowCards: true,
            redCard: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Aggregate stats from events
    const homeStats = {
      possession: 50,
      shots: 0,
      shotsOnTarget: 0,
      corners: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      offsides: 0,
      passes: 0,
      passAccuracy: 0,
    };

    const awayStats = {
      possession: 50,
      shots: 0,
      shotsOnTarget: 0,
      corners: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      offsides: 0,
      passes: 0,
      passAccuracy: 0,
    };

    // Count events
    match.events.forEach((event) => {
      const target = event.teamSide === 'home' ? homeStats : awayStats;

      switch (event.eventType) {
        case 'YELLOW_CARD':
        case 'SECOND_YELLOW':
          target.yellowCards++;
          break;
        case 'RED_CARD':
          target.redCards++;
          break;
        case 'CORNER':
          target.corners++;
          break;
        case 'FOUL':
          target.fouls++;
          break;
        case 'OFFSIDE':
          target.offsides++;
          break;
      }
    });

    // Aggregate from player performances
    match.playerPerformances.forEach((perf) => {
      const isHome = perf.teamId === match.homeTeamId;
      const target = isHome ? homeStats : awayStats;

      target.shots += perf.shots || 0;
      target.shotsOnTarget += perf.shotsOnTarget || 0;
      target.passes += perf.passes || 0;
      target.fouls += perf.fouls || 0;
      target.yellowCards += perf.yellowCards || 0;
      if (perf.redCard) target.redCards++;
    });

    // Calculate pass accuracy
    if (homeStats.passes > 0) {
      const homeComplete = match.playerPerformances
        .filter((p) => p.teamId === match.homeTeamId)
        .reduce((sum, p) => sum + (p.passesComplete || 0), 0);
      homeStats.passAccuracy = Math.round((homeComplete / homeStats.passes) * 100);
    }

    if (awayStats.passes > 0) {
      const awayComplete = match.playerPerformances
        .filter((p) => p.teamId === match.awayTeamId)
        .reduce((sum, p) => sum + (p.passesComplete || 0), 0);
      awayStats.passAccuracy = Math.round((awayComplete / awayStats.passes) * 100);
    }

    return NextResponse.json({
      stats: {
        home: homeStats,
        away: awayStats,
      },
    });
  } catch (error) {
    console.error('GET /api/matches/[matchId]/stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
