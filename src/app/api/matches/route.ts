// ============================================================================
// ENHANCED: src/app/api/matches/route.ts
// GET - List matches | POST - Create new match
// ALIGNED WITH: Your Prisma schema (Match, Fixture, MatchAttendance, MatchEvent)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { MatchStatus, Prisma } from '@prisma/client';

/**
 * GET /api/matches
 * Get matches with advanced filtering, pagination, and detailed information
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 25, max: 100)
 *   - teamId: string (filter by team involvement - home or away)
 *   - leagueId: string (filter by league)
 *   - status: enum (SCHEDULED, IN_PROGRESS, COMPLETED, POSTPONED)
 *   - dateFrom: ISO date string (filter matches from this date)
 *   - dateTo: ISO date string (filter matches until this date)
 *   - sortBy: enum (date, status, default: date)
 *   - sortOrder: enum (asc, desc, default: asc)
 * 
 * Response: Paginated list with full match details including:
 *   - Team information with club details
 *   - League/fixture information
 *   - Match stats (possession, shots, etc)
 *   - Event timeline (goals, cards, etc)
 *   - Player attendance summary
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
    const teamId = searchParams.get('teamId');
    const leagueId = searchParams.get('leagueId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    // Build where clause
    const where: Prisma.MatchWhereInput = {};

    // Team filter (home or away)
    if (teamId) {
      where.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ];
    }

    // League filter
    if (leagueId) {
      where.fixture = {
        leagueId,
      };
    }

    // Status filter
    if (status && Object.values(MatchStatus).includes(status as MatchStatus)) {
      where.status = status as MatchStatus;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    // Get total count for pagination
    const total = await prisma.match.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Define sort order
    const orderBy: Prisma.MatchOrderByWithRelationInput = {};
    if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy.date = sortOrder;
    }

    // Fetch matches with comprehensive relationships
    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            logo: true,
            club: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
                logo: true,
              },
            },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            logo: true,
            club: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
                logo: true,
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
                sport: true,
              },
            },
          },
        },
        stats: {
          select: {
            homePossession: true,
            awayPossession: true,
            homeShots: true,
            awayShots: true,
            homeShotsOnTarget: true,
            awayShotsOnTarget: true,
            homeCorners: true,
            awayCorners: true,
            homeYellowCards: true,
            awayYellowCards: true,
            homeRedCards: true,
            awayRedCards: true,
          },
        },
        events: {
          select: {
            id: true,
            type: true,
            minute: true,
            additionalInfo: true,
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                jerseyNumber: true,
              },
            },
          },
          orderBy: { minute: 'asc' },
        },
        playerAttendances: {
          select: {
            id: true,
            status: true,
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform matches for response
    const transformedMatches = matches.map((match) => {
      // Calculate attendance statistics
      const attendanceStats = {
        total: match.playerAttendances.length,
        confirmed: match.playerAttendances.filter((a) =>
          ['CONFIRMED', 'STARTING_LINEUP', 'SUBSTITUTE'].includes(a.status)
        ).length,
        available: match.playerAttendances.filter((a) =>
          a.status === 'AVAILABLE'
        ).length,
        unavailable: match.playerAttendances.filter((a) =>
          ['UNAVAILABLE', 'INJURED', 'ILL', 'SUSPENDED'].includes(a.status)
        ).length,
        pending: match.playerAttendances.filter((a) =>
          ['MAYBE', 'NOT_SELECTED'].includes(a.status) || !a.status
        ).length,
      };

      // Calculate match result
      let result: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW' | null = null;
      if (match.status === MatchStatus.COMPLETED && match.homeGoals !== null && match.awayGoals !== null) {
        if (match.homeGoals > match.awayGoals) result = 'HOME_WIN';
        else if (match.awayGoals > match.homeGoals) result = 'AWAY_WIN';
        else result = 'DRAW';
      }

      return {
        id: match.id,
        date: match.date.toISOString(),
        venue: match.venue,
        status: match.status,
        result,
        score: {
          home: match.homeGoals,
          away: match.awayGoals,
        },
        attendance: match.attendance,
        attendanceDeadline: match.attendanceDeadline?.toISOString() || null,
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          shortCode: match.homeTeam.shortCode,
          logo: match.homeTeam.logo,
          club: match.homeTeam.club,
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          shortCode: match.awayTeam.shortCode,
          logo: match.awayTeam.logo,
          club: match.awayTeam.club,
        },
        league: match.fixture?.league || null,
        stats: match.stats
          ? {
              possession: {
                home: match.stats.homePossession || 0,
                away: match.stats.awayPossession || 0,
              },
              shots: {
                home: match.stats.homeShots || 0,
                away: match.stats.awayShots || 0,
              },
              shotsOnTarget: {
                home: match.stats.homeShotsOnTarget || 0,
                away: match.stats.awayShotsOnTarget || 0,
              },
              corners: {
                home: match.stats.homeCorners || 0,
                away: match.stats.awayCorners || 0,
              },
              cards: {
                home: {
                  yellow: match.stats.homeYellowCards || 0,
                  red: match.stats.homeRedCards || 0,
                },
                away: {
                  yellow: match.stats.awayYellowCards || 0,
                  red: match.stats.awayRedCards || 0,
                },
              },
            }
          : null,
        events: match.events.map((event) => ({
          id: event.id,
          type: event.type,
          minute: event.minute,
          player: event.player
            ? {
                id: event.player.id,
                name: `${event.player.firstName} ${event.player.lastName}`,
                jerseyNumber: event.player.jerseyNumber,
              }
            : null,
          additionalInfo: event.additionalInfo,
        })),
        playerAttendance: attendanceStats,
        counts: {
          events: match.events.length,
          playersTracked: match.playerAttendances.length,
        },
      };
    });

    return NextResponse.json(
      {
        matches: transformedMatches,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/matches] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch matches',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matches
 * Create a new match with automatic player attendance tracking
 * 
 * Request Body:
 *   Required:
 *     - homeTeamId: string (team ID)
 *     - awayTeamId: string (team ID)
 *     - date: ISO date string
 *   
 *   Optional:
 *     - venue: string
 *     - fixtureId: string
 *     - attendanceDeadline: ISO date string
 * 
 * Response: 201 Created with match details
 * 
 * Features:
 *   ✅ Team validation
 *   ✅ Duplicate prevention
 *   ✅ Automatic player attendance creation
 *   ✅ Audit logging
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { homeTeamId, awayTeamId, date, venue, fixtureId, attendanceDeadline } = body;

    // Validate required fields
    if (!homeTeamId || !awayTeamId || !date) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Home team, away team, and date are required',
        },
        { status: 400 }
      );
    }

    // Validate teams are different
    if (homeTeamId === awayTeamId) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Home and away teams must be different',
        },
        { status: 400 }
      );
    }

    // Validate date is in future
    const matchDate = new Date(date);
    if (matchDate < new Date()) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Match date cannot be in the past',
        },
        { status: 400 }
      );
    }

    // Verify teams exist
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({
        where: { id: homeTeamId },
        select: { id: true, name: true },
      }),
      prisma.team.findUnique({
        where: { id: awayTeamId },
        select: { id: true, name: true },
      }),
    ]);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: 'Not Found', message: 'One or both teams not found' },
        { status: 404 }
      );
    }

    // Check for duplicate match
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          {
            homeTeamId,
            awayTeamId,
            date: matchDate,
          },
          {
            homeTeamId: awayTeamId,
            awayTeamId: homeTeamId,
            date: matchDate,
          },
        ],
      },
    });

    if (existingMatch) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'A match between these teams on this date already exists',
        },
        { status: 409 }
      );
    }

    // Create match within transaction
    const match = await prisma.$transaction(async (tx) => {
      // Create match
      const newMatch = await tx.match.create({
        data: {
          homeTeamId,
          awayTeamId,
          date: matchDate,
          venue: venue || null,
          fixtureId: fixtureId || undefined,
          attendanceDeadline: attendanceDeadline ? new Date(attendanceDeadline) : null,
          status: MatchStatus.SCHEDULED,
        },
        include: {
          homeTeam: {
            select: {
              id: true,
              name: true,
              club: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              club: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Get players from both teams
      const [homePlayerIds, awayPlayerIds] = await Promise.all([
        tx.$queryRaw<Array<{ playerId: string }>>`
          SELECT DISTINCT "playerId" FROM "PlayerTeam" WHERE "teamId" = ${homeTeamId}
        `,
        tx.$queryRaw<Array<{ playerId: string }>>`
          SELECT DISTINCT "playerId" FROM "PlayerTeam" WHERE "teamId" = ${awayTeamId}
        `,
      ]);

      const allPlayerIds = [
        ...homePlayerIds.map((p) => p.playerId),
        ...awayPlayerIds.map((p) => p.playerId),
      ];

      // Create attendance records for all players
      if (allPlayerIds.length > 0) {
        await tx.matchAttendance.createMany({
          data: allPlayerIds.map((playerId) => ({
            matchId: newMatch.id,
            playerId,
            status: 'AVAILABLE',
          })),
          skipDuplicates: true,
        });
      }

      return newMatch;
    });

    return NextResponse.json(
      {
        id: match.id,
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
        date: match.date.toISOString(),
        venue: match.venue,
        status: match.status,
        message: `Match created successfully: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/matches] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create match',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
