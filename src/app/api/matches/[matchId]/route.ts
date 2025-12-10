// ============================================================================
// ENHANCED: src/app/api/matches/[matchId]/route.ts
// GET - Match details | PATCH - Update match (score, status)
// ALIGNED WITH: Your Prisma schema (Match, MatchAttendance, MatchEvent, MatchStats)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { MatchStatus } from '@prisma/client';

/**
 * GET /api/matches/[matchId]
 * Get complete match details with teams, events, attendance, and statistics
 * 
 * Path Parameters:
 *   - matchId: string (match ID)
 * 
 * Response includes:
 *   - Match core data (date, venue, status, scores)
 *   - Team information with rosters
 *   - League/fixture details
 *   - Full match stats (possession, shots, cards, etc)
 *   - Event timeline (goals, assists, cards, substitutions)
 *   - Player attendance with status breakdown
 *   - Performance metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = params;

    // Validate matchId format
    if (!matchId || typeof matchId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    // Get match with comprehensive relationships
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            logo: true,
            sport: true,
            club: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
                logo: true,
              },
            },
            players: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                jerseyNumber: true,
                photo: true,
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
            sport: true,
            club: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
                logo: true,
              },
            },
            players: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                jerseyNumber: true,
                photo: true,
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
                country: true,
              },
            },
          },
        },
        stats: {
          select: {
            id: true,
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
            homeFouls: true,
            awayFouls: true,
            homeOffside: true,
            awayOffside: true,
          },
        },
        events: {
          select: {
            id: true,
            type: true,
            minute: true,
            team: true,
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
            playerId: true,
            status: true,
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                jerseyNumber: true,
                position: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

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
      byTeam: {
        home: {
          available: match.playerAttendances
            .filter((a) => {
              const player = match.homeTeam.players.find((p) => p.id === a.playerId);
              return player && ['AVAILABLE', 'CONFIRMED', 'STARTING_LINEUP', 'SUBSTITUTE'].includes(a.status);
            })
            .length,
          unavailable: match.playerAttendances
            .filter((a) => {
              const player = match.homeTeam.players.find((p) => p.id === a.playerId);
              return player && ['UNAVAILABLE', 'INJURED', 'ILL', 'SUSPENDED'].includes(a.status);
            })
            .length,
        },
        away: {
          available: match.playerAttendances
            .filter((a) => {
              const player = match.awayTeam.players.find((p) => p.id === a.playerId);
              return player && ['AVAILABLE', 'CONFIRMED', 'STARTING_LINEUP', 'SUBSTITUTE'].includes(a.status);
            })
            .length,
          unavailable: match.playerAttendances
            .filter((a) => {
              const player = match.awayTeam.players.find((p) => p.id === a.playerId);
              return player && ['UNAVAILABLE', 'INJURED', 'ILL', 'SUSPENDED'].includes(a.status);
            })
            .length,
        },
      },
    };

    // Calculate match result
    let result: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW' | null = null;
    if (match.status === MatchStatus.COMPLETED && match.homeGoals !== null && match.awayGoals !== null) {
      if (match.homeGoals > match.awayGoals) result = 'HOME_WIN';
      else if (match.awayGoals > match.homeGoals) result = 'AWAY_WIN';
      else result = 'DRAW';
    }

    // Group events by type
    const eventsByType = {
      goals: match.events.filter((e) => e.type === 'GOAL'),
      assists: match.events.filter((e) => e.type === 'ASSIST'),
      cards: match.events.filter((e) => ['YELLOW_CARD', 'RED_CARD'].includes(e.type)),
      substitutions: match.events.filter((e) => e.type === 'SUBSTITUTION'),
      other: match.events.filter((e) => !['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'].includes(e.type)),
    };

    return NextResponse.json(
      {
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
          sport: match.homeTeam.sport,
          club: match.homeTeam.club,
          roster: match.homeTeam.players.map((p) => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            jerseyNumber: p.jerseyNumber,
            position: p.position,
            photo: p.photo,
            attendanceStatus: match.playerAttendances.find((a) => a.playerId === p.id)?.status || null,
          })),
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          shortCode: match.awayTeam.shortCode,
          logo: match.awayTeam.logo,
          sport: match.awayTeam.sport,
          club: match.awayTeam.club,
          roster: match.awayTeam.players.map((p) => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            jerseyNumber: p.jerseyNumber,
            position: p.position,
            photo: p.photo,
            attendanceStatus: match.playerAttendances.find((a) => a.playerId === p.id)?.status || null,
          })),
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
              fouls: {
                home: match.stats.homeFouls || 0,
                away: match.stats.awayFouls || 0,
              },
              offside: {
                home: match.stats.homeOffside || 0,
                away: match.stats.awayOffside || 0,
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
        events: {
          timeline: match.events.map((event) => ({
            id: event.id,
            type: event.type,
            minute: event.minute,
            team: event.team,
            player: event.player
              ? {
                  id: event.player.id,
                  name: `${event.player.firstName} ${event.player.lastName}`,
                  jerseyNumber: event.player.jerseyNumber,
                }
              : null,
            additionalInfo: event.additionalInfo,
          })),
          summary: {
            totalEvents: match.events.length,
            goals: eventsByType.goals.length,
            assists: eventsByType.assists.length,
            cards: eventsByType.cards.length,
            substitutions: eventsByType.substitutions.length,
          },
        },
        playerAttendance: attendanceStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/matches/[matchId]] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch match',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/matches/[matchId]
 * Update match status, score, and statistics
 * 
 * Request Body (all optional):
 *   - status: enum (SCHEDULED, IN_PROGRESS, COMPLETED, POSTPONED)
 *   - homeGoals: number (only for COMPLETED status)
 *   - awayGoals: number (only for COMPLETED status)
 *   - venue: string
 *   - attendance: number
 *   - stats: {
 *       homePossession, awayPossession,
 *       homeShots, awayShots,
 *       homeShotsOnTarget, awayShotsOnTarget,
 *       homeCorners, awayCorners,
 *       homeYellowCards, awayYellowCards,
 *       homeRedCards, awayRedCards,
 *       ...other stats
 *     }
 * 
 * Response: 200 OK with updated match
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = params;
    const body = await request.json();

    // Validate matchId
    if (!matchId || typeof matchId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    // Get current match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        status: true,
        homeGoals: true,
        awayGoals: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Validate score updates
    if (body.homeGoals !== undefined || body.awayGoals !== undefined) {
      const newStatus = body.status || match.status;
      if (newStatus !== MatchStatus.COMPLETED) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Scores can only be updated when match status is COMPLETED',
          },
          { status: 400 }
        );
      }

      const homeGoals = body.homeGoals;
      const awayGoals = body.awayGoals;

      if (typeof homeGoals !== 'number' || homeGoals < 0 || !Number.isInteger(homeGoals)) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Home goals must be a non-negative integer',
          },
          { status: 400 }
        );
      }

      if (typeof awayGoals !== 'number' || awayGoals < 0 || !Number.isInteger(awayGoals)) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Away goals must be a non-negative integer',
          },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};

    if (body.status && body.status !== match.status) {
      if (!Object.values(MatchStatus).includes(body.status)) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Invalid status value',
          },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (body.homeGoals !== undefined) updateData.homeGoals = body.homeGoals;
    if (body.awayGoals !== undefined) updateData.awayGoals = body.awayGoals;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.attendance !== undefined && body.attendance >= 0) {
      updateData.attendance = body.attendance;
    }

    // Update match and stats in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update match
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: updateData,
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          stats: true,
        },
      });

      // Update stats if provided
      if (body.stats) {
        const statsUpdate = {
          homePossession: body.stats.homePossession,
          awayPossession: body.stats.awayPossession,
          homeShots: body.stats.homeShots,
          awayShots: body.stats.awayShots,
          homeShotsOnTarget: body.stats.homeShotsOnTarget,
          awayShotsOnTarget: body.stats.awayShotsOnTarget,
          homeCorners: body.stats.homeCorners,
          awayCorners: body.stats.awayCorners,
          homeYellowCards: body.stats.homeYellowCards,
          awayYellowCards: body.stats.awayYellowCards,
          homeRedCards: body.stats.homeRedCards,
          awayRedCards: body.stats.awayRedCards,
          homeFouls: body.stats.homeFouls,
          awayFouls: body.stats.awayFouls,
          homeOffside: body.stats.homeOffside,
          awayOffside: body.stats.awayOffside,
        };

        // Remove undefined values
        Object.keys(statsUpdate).forEach(
          (key) =>
            (statsUpdate as any)[key] === undefined && delete (statsUpdate as any)[key]
        );

        if (Object.keys(statsUpdate).length > 0) {
          if (updatedMatch.stats) {
            await tx.matchStats.update({
              where: { id: updatedMatch.stats.id },
              data: statsUpdate,
            });
          } else {
            await tx.matchStats.create({
              data: {
                matchId: updatedMatch.id,
                ...statsUpdate,
              },
            });
          }
        }
      }

      return updatedMatch;
    });

    return NextResponse.json(
      {
        id: updated.id,
        status: updated.status,
        homeGoals: updated.homeGoals,
        awayGoals: updated.awayGoals,
        venue: updated.venue,
        attendance: updated.attendance,
        homeTeam: updated.homeTeam.name,
        awayTeam: updated.awayTeam.name,
        message: `Match updated successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/matches/[matchId]] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update match',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
