// src/app/api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/result/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, matchId } = params;
    const body = await req.json();

    // Verify access
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Validation
    if (body.homeScore === undefined || body.homeScore === null) {
      return NextResponse.json({ error: 'Home score is required' }, { status: 400 });
    }

    if (body.awayScore === undefined || body.awayScore === null) {
      return NextResponse.json({ error: 'Away score is required' }, { status: 400 });
    }

    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify team is part of match
    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      return NextResponse.json({ error: 'Team not part of this match' }, { status: 403 });
    }

    // Update match with result
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: body.homeScore,
        awayScore: body.awayScore,
        status: 'COMPLETED',
        result: body.homeScore > body.awayScore ? 'HOME_WIN' : body.awayScore > body.homeScore ? 'AWAY_WIN' : 'DRAW',
      },
    });

    // Update standings if part of fixture
    if (match.fixtureId) {
      const homePoints = 
        body.homeScore > body.awayScore ? 3 : body.homeScore === body.awayScore ? 1 : 0;
      const awayPoints = 
        body.awayScore > body.homeScore ? 3 : body.awayScore === body.homeScore ? 1 : 0;

      // Update or create standings
      await Promise.all([
        prisma.standing.upsert({
          where: {
            fixtureId_teamId: {
              fixtureId: match.fixtureId,
              teamId: match.homeTeamId,
            },
          },
          update: {
            points: { increment: homePoints },
            goalsFor: { increment: body.homeScore },
            goalsAgainst: { increment: body.awayScore },
            matches: { increment: 1 },
            wins: homePoints === 3 ? { increment: 1 } : undefined,
            draws: homePoints === 1 ? { increment: 1 } : undefined,
            losses: homePoints === 0 ? { increment: 1 } : undefined,
          },
          create: {
            fixtureId: match.fixtureId,
            teamId: match.homeTeamId,
            points: homePoints,
            matches: 1,
            wins: homePoints === 3 ? 1 : 0,
            draws: homePoints === 1 ? 1 : 0,
            losses: homePoints === 0 ? 1 : 0,
            goalsFor: body.homeScore,
            goalsAgainst: body.awayScore,
          },
        }),
        prisma.standing.upsert({
          where: {
            fixtureId_teamId: {
              fixtureId: match.fixtureId,
              teamId: match.awayTeamId,
            },
          },
          update: {
            points: { increment: awayPoints },
            goalsFor: { increment: body.awayScore },
            goalsAgainst: { increment: body.homeScore },
            matches: { increment: 1 },
            wins: awayPoints === 3 ? { increment: 1 } : undefined,
            draws: awayPoints === 1 ? { increment: 1 } : undefined,
            losses: awayPoints === 0 ? { increment: 1 } : undefined,
          },
          create: {
            fixtureId: match.fixtureId,
            teamId: match.awayTeamId,
            points: awayPoints,
            matches: 1,
            wins: awayPoints === 3 ? 1 : 0,
            draws: awayPoints === 1 ? 1 : 0,
            losses: awayPoints === 0 ? 1 : 0,
            goalsFor: body.awayScore,
            goalsAgainst: body.homeScore,
          },
        }),
      ]);
    }

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/result error:', error);
    return NextResponse.json(
      {
        error: 'Failed to record result',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
