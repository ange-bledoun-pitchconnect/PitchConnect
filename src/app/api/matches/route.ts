/**
 * Matches API Endpoints
 * GET    /api/matches       - Get all matches with filters
 * POST   /api/matches       - Create new match
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { MatchStatus, Prisma } from '@prisma/client';

/**
 * GET /api/matches
 * Get matches with filters and detailed information
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const leagueId = searchParams.get('leagueId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeOldTeams = searchParams.get('includeOldTeams') !== 'false'; // Default true

    // Build where clause with proper typing
    const where: Prisma.MatchWhereInput = {};

    if (teamId) {
      where.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ];
    }

    if (status && Object.values(MatchStatus).includes(status as MatchStatus)) {
      where.status = status as MatchStatus;
    }

    if (leagueId) {
      where.fixture = {
        leagueId,
      };
    }

    // Fetch matches
    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
              },
            },
          },
        },
        awayTeam: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
              },
            },
          },
        },
        fixture: {
          include: {
            league: {
              select: {
                id: true,
                name: true,
                code: true,
                season: true,
              },
            },
          },
        },
        stats: true,
        events: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            minute: 'asc',
          },
        },
        playerAttendances: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            events: true,
            playerAttendances: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    // Transform matches for response
    const transformedMatches = matches.map((match) => {
      // Calculate attendance stats
      const attendance = {
        available: match.playerAttendances.filter((a) =>
          ['AVAILABLE', 'CONFIRMED', 'STARTING_LINEUP', 'SUBSTITUTE'].includes(a.status)
        ).length,
        unavailable: match.playerAttendances.filter((a) =>
          ['UNAVAILABLE', 'INJURED', 'ILL', 'SUSPENDED'].includes(a.status)
        ).length,
        pending: match.playerAttendances.filter((a) =>
          ['MAYBE', 'NOT_SELECTED'].includes(a.status) || !a.status
        ).length,
      };

      return {
        id: match.id,
        date: match.date.toISOString(),
        venue: match.venue,
        status: match.status,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        attendance: match.attendance,
        attendanceDeadline: match.attendanceDeadline?.toISOString() || null,
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          club: match.homeTeam.club,
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          club: match.awayTeam.club,
        },
        league: match.fixture?.league || null,
        stats: match.stats
          ? {
              homePossession: match.stats.homePossession,
              awayPossession: match.stats.awayPossession,
              homeShots: match.stats.homeShots,
              awayShots: match.stats.awayShots,
              homeShotsOnTarget: match.stats.homeShotsOnTarget,
              awayShotsOnTarget: match.stats.awayShotsOnTarget,
            }
          : null,
        events: match.events.map((event) => ({
          id: event.id,
          type: event.type,
          minute: event.minute,
          player: event.player
            ? `${event.player.firstName} ${event.player.lastName}`
            : null,
          additionalInfo: event.additionalInfo,
        })),
        playerAttendance: attendance,
        counts: {
          events: match._count.events,
          playersTracked: match._count.playerAttendances,
        },
      };
    });

    return NextResponse.json(
      {
        matches: transformedMatches,
        total: transformedMatches.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Matches GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch matches',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matches
 * Create new match with attendance tracking
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { homeTeamId, awayTeamId, date, venue, fixtureId, attendanceDeadline } = body;

    if (!homeTeamId || !awayTeamId || !date) {
      return NextResponse.json(
        { error: 'Home team, away team, and date are required' },
        { status: 400 }
      );
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json(
        { error: 'Home and away teams must be different' },
        { status: 400 }
      );
    }

    // Verify teams exist
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.oldTeam.findUnique({ where: { id: homeTeamId } }),
      prisma.oldTeam.findUnique({ where: { id: awayTeamId } }),
    ]);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: 'One or both teams not found' },
        { status: 404 }
      );
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        date: new Date(date),
        venue: venue || null,
        fixtureId: fixtureId || undefined,
        attendanceDeadline: attendanceDeadline ? new Date(attendanceDeadline) : null,
        status: MatchStatus.SCHEDULED,
      },
      include: {
        homeTeam: {
          include: {
            club: {
              select: {
                name: true,
              },
            },
          },
        },
        awayTeam: {
          include: {
            club: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Create attendance records for all players in both teams
    const [homePlayers, awayPlayers] = await Promise.all([
      prisma.teamPlayer.findMany({
        where: { teamId: homeTeamId },
        select: { playerId: true },
      }),
      prisma.teamPlayer.findMany({
        where: { teamId: awayTeamId },
        select: { playerId: true },
      }),
    ]);

    const allPlayers = [...homePlayers, ...awayPlayers];

    if (allPlayers.length > 0) {
      await prisma.matchAttendance.createMany({
        data: allPlayers.map((player) => ({
          matchId: match.id,
          playerId: player.playerId,
          status: 'AVAILABLE', // Default status
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(
      {
        success: true,
        matchId: match.id,
        match: {
          id: match.id,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          date: match.date.toISOString(),
          venue: match.venue,
          status: match.status,
        },
        message: 'Match created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Matches POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create match',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
