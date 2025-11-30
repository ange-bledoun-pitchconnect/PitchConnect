import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = params;
    const body = await request.json();
    const { homeGoals, awayGoals, status } = body;

    if (homeGoals === undefined || awayGoals === undefined) {
      return NextResponse.json(
        { error: 'Home goals and away goals are required' },
        { status: 400 }
      );
    }

    // Get match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        fixture: {
          include: {
            league: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const wasFinished = match.status === 'FINISHED';
    const isNowFinished = status === 'FINISHED';

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeGoals: parseInt(homeGoals.toString()),
        awayGoals: parseInt(awayGoals.toString()),
        status: status || 'FINISHED',
      },
    });

    // If match is now finished and has a league, update standings
    if (isNowFinished && match.fixture?.leagueId) {
      await updateLeagueStandings(
        match.fixture.leagueId,
        match.homeTeamId,
        match.awayTeamId,
        parseInt(homeGoals.toString()),
        parseInt(awayGoals.toString()),
        match.fixture.league.pointsWin,
        match.fixture.league.pointsDraw,
        match.fixture.league.pointsLoss,
        wasFinished,
        match.homeGoals || 0,
        match.awayGoals || 0
      );
    }

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      message: 'Match result recorded successfully',
    });
  } catch (error) {
    console.error('Record result error:', error);
    return NextResponse.json(
      {
        error: 'Failed to record result',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Update league standings based on match result
 */
async function updateLeagueStandings(
  leagueId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeGoals: number,
  awayGoals: number,
  pointsWin: number,
  pointsDraw: number,
  pointsLoss: number,
  wasFinished: boolean,
  oldHomeGoals: number,
  oldAwayGoals: number
) {
  // If match was already finished, reverse old standings first
  if (wasFinished) {
    await reverseMatchStandings(
      leagueId,
      homeTeamId,
      awayTeamId,
      oldHomeGoals,
      oldAwayGoals,
      pointsWin,
      pointsDraw,
      pointsLoss
    );
  }

  // Get or create standings for both teams
  const [homeStanding, awayStanding] = await Promise.all([
    prisma.standings.upsert({
      where: {
        leagueId_teamId: {
          leagueId,
          teamId: homeTeamId,
        },
      },
      create: {
        leagueId,
        teamId: homeTeamId,
        position: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
      update: {},
    }),
    prisma.standings.upsert({
      where: {
        leagueId_teamId: {
          leagueId,
          teamId: awayTeamId,
        },
      },
      create: {
        leagueId,
        teamId: awayTeamId,
        position: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
      update: {},
    }),
  ]);

  // Calculate points
  let homePoints = 0;
  let awayPoints = 0;
  let homeWon = 0;
  let homeDrawn = 0;
  let homeLost = 0;
  let awayWon = 0;
  let awayDrawn = 0;
  let awayLost = 0;

  if (homeGoals > awayGoals) {
    // Home win
    homePoints = pointsWin;
    awayPoints = pointsLoss;
    homeWon = 1;
    awayLost = 1;
  } else if (homeGoals < awayGoals) {
    // Away win
    homePoints = pointsLoss;
    awayPoints = pointsWin;
    homeLost = 1;
    awayWon = 1;
  } else {
    // Draw
    homePoints = pointsDraw;
    awayPoints = pointsDraw;
    homeDrawn = 1;
    awayDrawn = 1;
  }

  // Update home team standings
  await prisma.standings.update({
    where: { id: homeStanding.id },
    data: {
      played: { increment: 1 },
      won: { increment: homeWon },
      drawn: { increment: homeDrawn },
      lost: { increment: homeLost },
      goalsFor: { increment: homeGoals },
      goalsAgainst: { increment: awayGoals },
      goalDifference: { increment: homeGoals - awayGoals },
      points: { increment: homePoints },
    },
  });

  // Update away team standings
  await prisma.standings.update({
    where: { id: awayStanding.id },
    data: {
      played: { increment: 1 },
      won: { increment: awayWon },
      drawn: { increment: awayDrawn },
      lost: { increment: awayLost },
      goalsFor: { increment: awayGoals },
      goalsAgainst: { increment: homeGoals },
      goalDifference: { increment: awayGoals - homeGoals },
      points: { increment: awayPoints },
    },
  });

  // Recalculate positions
  await recalculateStandingsPositions(leagueId);
}

/**
 * Reverse match standings (when updating already finished match)
 */
async function reverseMatchStandings(
  leagueId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeGoals: number,
  awayGoals: number,
  pointsWin: number,
  pointsDraw: number,
  pointsLoss: number
) {
  const [homeStanding, awayStanding] = await Promise.all([
    prisma.standings.findUnique({
      where: {
        leagueId_teamId: {
          leagueId,
          teamId: homeTeamId,
        },
      },
    }),
    prisma.standings.findUnique({
      where: {
        leagueId_teamId: {
          leagueId,
          teamId: awayTeamId,
        },
      },
    }),
  ]);

  if (!homeStanding || !awayStanding) return;

  // Calculate what to reverse
  let homePoints = 0;
  let awayPoints = 0;
  let homeWon = 0;
  let homeDrawn = 0;
  let homeLost = 0;
  let awayWon = 0;
  let awayDrawn = 0;
  let awayLost = 0;

  if (homeGoals > awayGoals) {
    homePoints = pointsWin;
    awayPoints = pointsLoss;
    homeWon = 1;
    awayLost = 1;
  } else if (homeGoals < awayGoals) {
    homePoints = pointsLoss;
    awayPoints = pointsWin;
    homeLost = 1;
    awayWon = 1;
  } else {
    homePoints = pointsDraw;
    awayPoints = pointsDraw;
    homeDrawn = 1;
    awayDrawn = 1;
  }

  // Reverse home team standings
  await prisma.standings.update({
    where: { id: homeStanding.id },
    data: {
      played: { decrement: 1 },
      won: { decrement: homeWon },
      drawn: { decrement: homeDrawn },
      lost: { decrement: homeLost },
      goalsFor: { decrement: homeGoals },
      goalsAgainst: { decrement: awayGoals },
      goalDifference: { decrement: homeGoals - awayGoals },
      points: { decrement: homePoints },
    },
  });

  // Reverse away team standings
  await prisma.standings.update({
    where: { id: awayStanding.id },
    data: {
      played: { decrement: 1 },
      won: { decrement: awayWon },
      drawn: { decrement: awayDrawn },
      lost: { decrement: awayLost },
      goalsFor: { decrement: awayGoals },
      goalsAgainst: { decrement: homeGoals },
      goalDifference: { decrement: awayGoals - homeGoals },
      points: { decrement: awayPoints },
    },
  });
}

/**
 * Recalculate standings positions based on points
 */
async function recalculateStandingsPositions(leagueId: string) {
  const standings = await prisma.standings.findMany({
    where: { leagueId },
    orderBy: [
      { points: 'desc' },
      { goalDifference: 'desc' },
      { goalsFor: 'desc' },
    ],
  });

  // Update positions
  await Promise.all(
    standings.map((standing, index) =>
      prisma.standings.update({
        where: { id: standing.id },
        data: { position: index + 1 },
      })
    )
  );
}
