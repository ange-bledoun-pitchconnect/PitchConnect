// src/app/api/leagues/[id]/fixtures/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const leagueId = params.id;

    // Get league info
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        code: true,
        season: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Get all fixtures with matches
    const fixtures = await prisma.fixture.findMany({
      where: { leagueId },
      include: {
        matches: {
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: {
        matchweek: 'asc',
      },
    });

    // Get team names for all matches
    const allMatches = fixtures.flatMap((f) => f.matches);
    const teamIds = Array.from(
      new Set(allMatches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))
    );

    const [newTeams, oldTeams] = await Promise.all([
      prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, name: true },
      }),
      prisma.oldTeam.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, name: true },
      }),
    ]);

    const teamMap = new Map([
      ...newTeams.map((t) => [t.id, t.name] as [string, string]),
      ...oldTeams.map((t) => [t.id, t.name] as [string, string]),
    ]);

    // Format fixtures with team names
    const formattedFixtures = fixtures.map((fixture) => ({
      id: fixture.id,
      matchweek: fixture.matchweek,
      startDate: fixture.startDate.toISOString(),
      endDate: fixture.endDate?.toISOString(),
      matches: fixture.matches.map((match) => ({
        id: match.id,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeTeamName: teamMap.get(match.homeTeamId) || `Team ${match.homeTeamId.slice(0, 8)}`,
        awayTeamName: teamMap.get(match.awayTeamId) || `Team ${match.awayTeamId.slice(0, 8)}`,
        date: match.date.toISOString(),
        time: match.time,
        venue: match.venue,
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      })),
    }));

    return NextResponse.json({
      league,
      fixtures: formattedFixtures,
    });
  } catch (error) {
    console.error('GET /api/leagues/[id]/fixtures error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

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
    const body = await req.json();

    const { matchweek, matches } = body;

    if (!matchweek || !matches || !Array.isArray(matches)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Create fixture
    const fixture = await prisma.fixture.create({
      data: {
        leagueId,
        matchweek,
        startDate: new Date(body.startDate || Date.now()),
        endDate: body.endDate ? new Date(body.endDate) : null,
        matches: {
          create: matches.map((match: any) => ({
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            date: new Date(match.date),
            time: match.time,
            venue: match.venue,
            status: 'SCHEDULED',
          })),
        },
      },
      include: {
        matches: true,
      },
    });

    return NextResponse.json(fixture, { status: 201 });
  } catch (error) {
    console.error('POST /api/leagues/[id]/fixtures error:', error);
    return NextResponse.json({ error: 'Failed to create fixture' }, { status: 500 });
  }
}
