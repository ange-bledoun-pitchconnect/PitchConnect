// src/app/api/leagues/[id]/fixtures/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['LEAGUE_ADMIN', 'SUPERADMIN'];

// Auth verification helper
async function verifyAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  return { session };
}

// Auth + role verification helper
async function verifyAdminAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (!session.user.roles?.some((role: string) => ALLOWED_ROLES.includes(role))) {
    return { error: 'Forbidden', status: 403 };
  }

  return { session };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(_req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            date: true,
            venue: true,
            status: true,
            homeGoals: true,
            awayGoals: true,
            createdAt: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: {
        matchweek: 'asc',
      },
    });

    if (fixtures.length === 0) {
      return NextResponse.json({
        league,
        fixtures: [],
      });
    }

    // Get team names for all matches
    const allMatches = fixtures.flatMap((f) => f.matches);
    const teamIds = Array.from(
      new Set(allMatches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))
    );

    // Query teams (single source)
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true },
    });

    // Create unified team map
    const teamMap = new Map<string, string>();
    teams.forEach((t) => teamMap.set(t.id, t.name));

    // Format fixtures with calculated date ranges
    const formattedFixtures = fixtures.map((fixture) => {
      // Calculate date range from matches
      const matchDates = fixture.matches
        .map((m) => new Date(m.date).getTime())
        .sort((a, b) => a - b);

      const startDate = matchDates.length > 0 ? new Date(matchDates[0]) : null;
      const endDate = matchDates.length > 0 ? new Date(matchDates[matchDates.length - 1]) : null;

      // Calculate fixture status
      const now = new Date();
      let fixtureStatus = 'UPCOMING';
      
      if (endDate && endDate < now) {
        fixtureStatus = 'COMPLETED';
      } else if (startDate && startDate <= now && endDate && endDate >= now) {
        fixtureStatus = 'ACTIVE';
      }

      return {
        id: fixture.id,
        matchweek: fixture.matchweek,
        season: fixture.season,
        status: fixtureStatus,
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
        matchCount: fixture.matches.length,
        matches: fixture.matches.map((match) => ({
          id: match.id,
          homeTeam: {
            id: match.homeTeamId,
            name: teamMap.get(match.homeTeamId) || `Unknown Team`,
          },
          awayTeam: {
            id: match.awayTeamId,
            name: teamMap.get(match.awayTeamId) || `Unknown Team`,
          },
          date: match.date.toISOString(),
          venue: match.venue || 'TBD',
          status: match.status,
          result: {
            homeGoals: match.homeGoals,
            awayGoals: match.awayGoals,
          },
        })),
      };
    });

    return NextResponse.json({
      league,
      totalFixtures: formattedFixtures.length,
      fixtures: formattedFixtures,
    });
  } catch (error) {
    console.error('GET /api/leagues/[id]/fixtures error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch fixtures',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminAuth(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const leagueId = params.id;
    const body = await req.json();

    const { matchweek, matches } = body;

    // Validation
    if (!matchweek || typeof matchweek !== 'number' || matchweek < 1) {
      return NextResponse.json(
        { error: 'Invalid matchweek - must be a positive number' },
        { status: 400 }
      );
    }

    if (!Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json(
        { error: 'At least one match is required' },
        { status: 400 }
      );
    }

    // Validate each match
    for (const match of matches) {
      if (!match.homeTeamId || !match.awayTeamId || !match.date) {
        return NextResponse.json(
          { error: 'Each match must have homeTeamId, awayTeamId, and date' },
          { status: 400 }
        );
      }
    }

    // Verify league exists and get season
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { id: true, season: true },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Check for duplicate fixture (same matchweek and season)
    const existingFixture = await prisma.fixture.findFirst({
      where: {
        leagueId,
        matchweek,
        season: league.season,
      },
    });

    if (existingFixture) {
      return NextResponse.json(
        { error: `Fixture already exists for matchweek ${matchweek}` },
        { status: 409 }
      );
    }

    // Verify all teams exist
    const teamIds = Array.from(
      new Set(matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))
    );

    const teamsCount = await prisma.team.count({ where: { id: { in: teamIds } } });

    if (teamsCount < teamIds.length) {
      return NextResponse.json(
        { error: 'One or more teams do not exist' },
        { status: 400 }
      );
    }

    // Create fixture with matches
    const fixture = await prisma.fixture.create({
      data: {
        leagueId,
        matchweek,
        season: league.season,
        status: 'UPCOMING',
        matches: {
          create: matches.map((match: any) => ({
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            date: new Date(match.date),
            venue: match.venue || null,
            status: 'SCHEDULED',
          })),
        },
      },
      include: {
        matches: {
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            date: true,
            venue: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Fixture created successfully',
        fixture: {
          id: fixture.id,
          matchweek: fixture.matchweek,
          season: fixture.season,
          matchCount: fixture.matches.length,
          matches: fixture.matches,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/leagues/[id]/fixtures error:', error);

    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { error: 'Invalid team ID - teams do not exist' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create fixture',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
