/**
 * Record Match Result API
 *
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/result
 *
 * Records the final result of a match (score and winner).
 * Updates match status to FINISHED and updates league standings if applicable.
 *
 * Authorization: Only club owner can access
 *
 * Request Body:
 * {
 *   homeGoals: number,
 *   awayGoals: number
 * }
 *
 * Response:
 * {
 *   id: string,
 *   homeTeamId: string,
 *   awayTeamId: string,
 *   homeGoals: number,
 *   awayGoals: number,
 *   status: string,
 *   date: Date
 * }
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; matchId: string } }
) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, matchId } = params;
    const body = await req.json();

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Validate input
    if (body.homeGoals === undefined || body.homeGoals === null) {
      return NextResponse.json(
        { error: 'Home goals is required' },
        { status: 400 }
      );
    }

    if (body.awayGoals === undefined || body.awayGoals === null) {
      return NextResponse.json(
        { error: 'Away goals is required' },
        { status: 400 }
      );
    }

    // Validate scores are non-negative
    if (body.homeGoals < 0 || body.awayGoals < 0) {
      return NextResponse.json(
        { error: 'Goals cannot be negative' },
        { status: 400 }
      );
    }

    // Get match with fixture details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        fixture: {
          select: {
            id: true,
            leagueId: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify team is part of match
    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      return NextResponse.json(
        { error: 'Team not part of this match' },
        { status: 403 }
      );
    }

    // Check match hasn't already been completed
    if (match.status === 'FINISHED') {
      return NextResponse.json(
        { error: 'Match result already recorded' },
        { status: 400 }
      );
    }

    // Update match with result using correct field names
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeGoals: body.homeGoals,
        awayGoals: body.awayGoals,
        status: 'FINISHED',
      },
    });

    // Update standings if part of league fixture
    if (match.fixture && match.fixture.leagueId) {
      const homePoints =
        body.homeGoals > body.awayGoals
          ? 3
          : body.homeGoals === body.awayGoals
            ? 1
            : 0;
      const awayPoints =
        body.awayGoals > body.homeGoals
          ? 3
          : body.awayGoals === body.homeGoals
            ? 1
            : 0;

      const leagueId = match.fixture.leagueId;

      // Update or create standings for home team
      await prisma.standings.upsert({
        where: {
          leagueId_teamId: {
            leagueId,
            teamId: match.homeTeamId,
          },
        },
        update: {
          played: { increment: 1 },
          won:
            homePoints === 3
              ? { increment: 1 }
              : undefined,
          drawn:
            homePoints === 1
              ? { increment: 1 }
              : undefined,
          lost:
            homePoints === 0
              ? { increment: 1 }
              : undefined,
          goalsFor: { increment: body.homeGoals },
          goalsAgainst: { increment: body.awayGoals },
          goalDifference: {
            increment: body.homeGoals - body.awayGoals,
          },
          points: { increment: homePoints },
        },
        create: {
          leagueId,
          teamId: match.homeTeamId,
          position: 0,
          played: 1,
          won: homePoints === 3 ? 1 : 0,
          drawn: homePoints === 1 ? 1 : 0,
          lost: homePoints === 0 ? 1 : 0,
          goalsFor: body.homeGoals,
          goalsAgainst: body.awayGoals,
          goalDifference: body.homeGoals - body.awayGoals,
          points: homePoints,
        },
      });

      // Update or create standings for away team
      await prisma.standings.upsert({
        where: {
          leagueId_teamId: {
            leagueId,
            teamId: match.awayTeamId,
          },
        },
        update: {
          played: { increment: 1 },
          won:
            awayPoints === 3
              ? { increment: 1 }
              : undefined,
          drawn:
            awayPoints === 1
              ? { increment: 1 }
              : undefined,
          lost:
            awayPoints === 0
              ? { increment: 1 }
              : undefined,
          goalsFor: { increment: body.awayGoals },
          goalsAgainst: { increment: body.homeGoals },
          goalDifference: {
            increment: body.awayGoals - body.homeGoals,
          },
          points: { increment: awayPoints },
        },
        create: {
          leagueId,
          teamId: match.awayTeamId,
          position: 0,
          played: 1,
          won: awayPoints === 3 ? 1 : 0,
          drawn: awayPoints === 1 ? 1 : 0,
          lost: awayPoints === 0 ? 1 : 0,
          goalsFor: body.awayGoals,
          goalsAgainst: body.homeGoals,
          goalDifference: body.awayGoals - body.homeGoals,
          points: awayPoints,
        },
      });
    }

    return NextResponse.json(updatedMatch, { status: 200 });
  } catch (error) {
    console.error(
      'POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/result error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to record result',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
