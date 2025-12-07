// src/app/api/leagues/[id]/standings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['LEAGUE_ADMIN', 'SUPERADMIN'];
const RECENT_FORM_MATCHES = 5;

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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const leagueId = params.id;

    // Get league info with configuration
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        code: true,
        season: true,
        format: true,
        pointsWin: true,
        pointsDraw: true,
        pointsLoss: true,
        configuration: {
          select: {
            bonusPointsEnabled: true,
            bonusPointsForGoals: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Get standings with team info
    const standings = await prisma.standings.findMany({
      where: { leagueId },
      orderBy: [
        { points: 'desc' },
        { goalDifference: 'desc' },
        { goalsFor: 'desc' },
      ],
    });

    if (standings.length === 0) {
      return NextResponse.json({
        league: {
          id: league.id,
          name: league.name,
          code: league.code,
          season: league.season,
        },
        standings: [],
      });
    }

    // Get team names from both Team and OldTeam models
    const teamIds = standings.map((s) => s.teamId);
    
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

    // Combine team maps
    const teamMap = new Map<string, string>();
    newTeams.forEach((t) => teamMap.set(t.id, t.name));
    oldTeams.forEach((t) => teamMap.set(t.id, t.name));

    // Get recent matches for form calculation (matches with FINISHED status)
    const recentMatches = await prisma.match.findMany({
      where: {
        fixtureId: {
          in: await prisma.fixture
            .findMany({
              where: { leagueId },
              select: { id: true },
            })
            .then((fixtures) => fixtures.map((f) => f.id)),
        },
        status: 'FINISHED',
        homeGoals: { not: null },
        awayGoals: { not: null },
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeGoals: true,
        awayGoals: true,
        date: true,
      },
    });

    // Calculate form for each team (last N matches)
    const calculateForm = (teamId: string): string[] => {
      const teamMatches = recentMatches
        .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
        .slice(0, RECENT_FORM_MATCHES);

      return teamMatches.map((match) => {
        const isHome = match.homeTeamId === teamId;
        const teamScore = isHome ? match.homeGoals : match.awayGoals;
        const opponentScore = isHome ? match.awayGoals : match.homeGoals;

        if (teamScore === null || opponentScore === null) return 'N';
        if (teamScore > opponentScore) return 'W';
        if (teamScore < opponentScore) return 'L';
        return 'D';
      });
    };

    // Update positions and prepare response
    const standingsWithDetails = await Promise.all(
      standings.map(async (s, index) => {
        const newPosition = index + 1;
        
        // Update position if changed
        if (s.position !== newPosition) {
          await prisma.standings.update({
            where: { id: s.id },
            data: { position: newPosition },
          });
        }

        // Get team form
        const form = calculateForm(s.teamId);

        return {
          id: s.id,
          position: newPosition,
          teamId: s.teamId,
          teamName: teamMap.get(s.teamId) || 'Unknown Team',
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDifference: s.goalDifference,
          points: s.points,
          form: form,
        };
      })
    );

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        code: league.code,
        season: league.season,
        format: league.format,
        pointsWin: league.pointsWin,
        pointsDraw: league.pointsDraw,
        pointsLoss: league.pointsLoss,
      },
      totalTeams: standingsWithDetails.length,
      standings: standingsWithDetails,
    });
  } catch (error) {
    console.error('GET /api/leagues/[id]/standings error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch standings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Recalculate all standings for a league
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

    // Get league configuration
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        pointsWin: true,
        pointsDraw: true,
        pointsLoss: true,
        configuration: {
          select: {
            bonusPointsEnabled: true,
            bonusPointsForGoals: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Get all finished matches for this league with valid scores
    const matches = await prisma.match.findMany({
      where: {
        fixture: {
          leagueId,
        },
        status: 'FINISHED',
        homeGoals: { not: null },
        awayGoals: { not: null },
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeGoals: true,
        awayGoals: true,
      },
    });

    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed matches found for standings calculation',
        teamsUpdated: 0,
      });
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

    const teamIds = leagueTeams.map((lt) => lt.teamId);

    if (teamIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No teams found in league',
        teamsUpdated: 0,
      });
    }

    // Calculate standings for each team
    const standingsData = teamIds.map((teamId) => {
      const teamMatches = matches.filter(
        (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
      );

      let played = 0;
      let won = 0;
      let drawn = 0;
      let lost = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      teamMatches.forEach((match) => {
        const isHome = match.homeTeamId === teamId;
        const teamScore = isHome ? match.homeGoals! : match.awayGoals!;
        const opponentScore = isHome ? match.awayGoals! : match.homeGoals!;

        played++;
        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) {
          won++;
        } else if (teamScore < opponentScore) {
          lost++;
        } else {
          drawn++;
        }
      });

      const goalDifference = goalsFor - goalsAgainst;
      const points =
        won * league.pointsWin +
        drawn * league.pointsDraw +
        lost * league.pointsLoss;

      return {
        teamId,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points,
      };
    });

    // Sort by points, then goal difference, then goals for (tiebreakers)
    standingsData.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Update or create standings
    await Promise.all(
      standingsData.map(async (data, index) => {
        const position = index + 1;

        await prisma.standings.upsert({
          where: {
            leagueId_teamId: {
              leagueId,
              teamId: data.teamId,
            },
          },
          update: {
            position,
            played: data.played,
            won: data.won,
            drawn: data.drawn,
            lost: data.lost,
            goalsFor: data.goalsFor,
            goalsAgainst: data.goalsAgainst,
            goalDifference: data.goalDifference,
            points: data.points,
          },
          create: {
            leagueId,
            teamId: data.teamId,
            position,
            played: data.played,
            won: data.won,
            drawn: data.drawn,
            lost: data.lost,
            goalsFor: data.goalsFor,
            goalsAgainst: data.goalsAgainst,
            goalDifference: data.goalDifference,
            points: data.points,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Standings recalculated successfully',
      leagueId,
      teamsUpdated: standingsData.length,
      matchesProcessed: matches.length,
    });
  } catch (error) {
    console.error('POST /api/leagues/[id]/standings error:', error);
    return NextResponse.json(
      {
        error: 'Failed to recalculate standings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
