// src/app/api/leagues/[id]/fixtures/generate/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowedRoles = ['LEAGUE_ADMIN', 'SUPERADMIN'];
  if (!session.user.roles?.some((role: string) => allowedRoles.includes(role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const leagueId = params.id;

    // Check if fixtures already exist
    const existingFixtures = await prisma.fixture.count({
      where: { leagueId },
    });

    if (existingFixtures > 0) {
      return NextResponse.json(
        { error: 'Fixtures already exist for this league' },
        { status: 400 }
      );
    }

    // Get all teams in the league
    const leagueTeams = await prisma.leagueTeam.findMany({
      where: {
        leagueId,
        leftAt: null,
      },
      select: {
        teamId: true,
      },
    });

    if (leagueTeams.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 teams to generate fixtures' },
        { status: 400 }
      );
    }

    const teamIds = leagueTeams.map((lt) => lt.teamId);

    // Generate round-robin fixtures
    const fixtures = generateRoundRobin(teamIds);

    // Create fixtures in database
    const startDate = new Date();
    let totalMatches = 0;

    for (let i = 0; i < fixtures.length; i++) {
      const matchweek = i + 1;
      const matchweekDate = new Date(startDate);
      matchweekDate.setDate(startDate.getDate() + i * 7); // 1 week between matchweeks

      await prisma.fixture.create({
        data: {
          leagueId,
          matchweek,
          startDate: matchweekDate,
          endDate: new Date(matchweekDate.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days later
          matches: {
            create: fixtures[i].map((match) => ({
              homeTeamId: match.home,
              awayTeamId: match.away,
              date: matchweekDate,
              status: 'SCHEDULED',
            })),
          },
        },
      });

      totalMatches += fixtures[i].length;
    }

    return NextResponse.json({
      success: true,
      message: 'Fixtures generated successfully',
      matchweeks: fixtures.length,
      totalMatches,
    });
  } catch (error) {
    console.error('POST /api/leagues/[id]/fixtures/generate error:', error);
    return NextResponse.json({ error: 'Failed to generate fixtures' }, { status: 500 });
  }
}

// Round-robin algorithm
function generateRoundRobin(teams: string[]): Array<Array<{ home: string; away: string }>> {
  const numTeams = teams.length;
  const isOdd = numTeams % 2 !== 0;

  // Add a "bye" team if odd number of teams
  const teamsWithBye = isOdd ? [...teams, 'BYE'] : [...teams];
  const totalTeams = teamsWithBye.length;
  const numRounds = totalTeams - 1;
  const matchesPerRound = totalTeams / 2;

  const fixtures: Array<Array<{ home: string; away: string }>> = [];

  for (let round = 0; round < numRounds; round++) {
    const roundMatches: Array<{ home: string; away: string }> = [];

    for (let match = 0; match < matchesPerRound; match++) {
      const home = (round + match) % (totalTeams - 1);
      const away = (totalTeams - 1 - match + round) % (totalTeams - 1);

      let homeTeam: number;
      let awayTeam: number;

      if (match === 0) {
        homeTeam = totalTeams - 1;
        awayTeam = away;
      } else {
        homeTeam = home;
        awayTeam = away;
      }

      // Skip matches with BYE
      if (
        teamsWithBye[homeTeam] !== 'BYE' &&
        teamsWithBye[awayTeam] !== 'BYE'
      ) {
        roundMatches.push({
          home: teamsWithBye[homeTeam],
          away: teamsWithBye[awayTeam],
        });
      }
    }

    if (roundMatches.length > 0) {
      fixtures.push(roundMatches);
    }
  }

  return fixtures;
}
