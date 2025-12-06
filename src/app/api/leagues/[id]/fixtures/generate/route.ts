/**
 * Generate Fixtures for a League
 * POST /api/leagues/[id]/fixtures/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leagueId } = context.params;

    // Get league
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    const teams = league.teams.map(lt => lt.team);
    
    if (teams.length < 2) {
      return NextResponse.json(
        { error: 'League must have at least 2 teams' },
        { status: 400 }
      );
    }

    // Generate round-robin fixtures
    const fixtures = [];
    const matchweeks: { [key: number]: any[] } = {};

    // Round-robin logic
    for (let i = 0; i < teams.length - 1; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const matchweek = i + j;
        if (!matchweeks[matchweek]) {
          matchweeks[matchweek] = [];
        }
        matchweeks[matchweek].push({
          homeTeamId: teams[i].id,
          awayTeamId: teams[j].id,
        });
      }
    }

    // Create fixtures with matches
    for (const [matchweek, matches] of Object.entries(matchweeks)) {
      const matchweekDate = new Date();
      matchweekDate.setDate(matchweekDate.getDate() + parseInt(matchweek) * 7);

      const fixture = await prisma.fixture.create({
        data: {
          leagueId,
          matchweek: parseInt(matchweek),
          season: league.season,
          status: 'UPCOMING',
          matches: {
            create: matches.map((match) => ({
              homeTeamId: match.homeTeamId,
              awayTeamId: match.awayTeamId,
              date: matchweekDate,
              status: 'SCHEDULED',
            })),
          },
        },
        include: {
          matches: true,
        },
      });

      fixtures.push(fixture);
    }

    return NextResponse.json(
      {
        message: 'Fixtures generated successfully',
        fixtureCount: fixtures.length,
        matchCount: fixtures.reduce((sum, f) => sum + f.matches.length, 0),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Fixture generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate fixtures',
        message: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Unknown error'
          : undefined,
      },
      { status: 500 }
    );
  }
}