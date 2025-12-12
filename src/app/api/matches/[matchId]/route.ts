// ============================================================================
// WORLD-CLASS ENHANCED: /src/app/api/matches/[matchId]/route.ts
// Match Details with Comprehensive Statistics & Analysis
// VERSION: 3.0 - Production Grade
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

interface MatchParams {
  params: { matchId: string };
}

// ============================================================================
// GET /api/matches/[matchId] - Get Complete Match Details
// Authorization: Any authenticated user
// ============================================================================

export async function GET(request: NextRequest, { params }: MatchParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] GET /api/matches/[${params.matchId}]`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401 }
      );
    }

    // ✅ Fetch match with comprehensive data
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        // Teams with comprehensive info
        homeTeam: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
            colors: true,
            members: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                userId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
                number: true,
                isCaptain: true,
              },
            },
            club: { select: { id: true, name: true, city: true, country: true } },
          },
        },

        awayTeam: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
            colors: true,
            members: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                userId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
                number: true,
                isCaptain: true,
              },
            },
            club: { select: { id: true, name: true, city: true, country: true } },
          },
        },

        // Referee
        referee: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
            licenseNumber: true,
            licenseLevel: true,
          },
        },

        // Fixture & League
        fixture: {
          select: {
            id: true,
            matchweek: true,
            season: true,
            league: { select: { id: true, name: true, sport: true } },
          },
        },

        // Match events (goals, cards, substitutions)
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
          orderBy: { minute: 'asc' },
        },

        // Player attendance
        playerAttendances: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { status: 'asc' },
        },

        // Statistics
        stats: true,
      },
    });

    // ✅ Match not found
    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    // ✅ Calculate derived statistics
    const homeGoals = match.homeGoals || 0;
    const awayGoals = match.awayGoals || 0;

    let result = 'PENDING';
    if (match.status === 'FINISHED') {
      if (homeGoals > awayGoals) result = 'HOME_WIN';
      else if (awayGoals > homeGoals) result = 'AWAY_WIN';
      else result = 'DRAW';
    }

    // ✅ Count events by type
    const eventCounts: any = {};
    for (const event of match.events) {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    }

    // ✅ Build response
    const response = {
      success: true,
      data: {
        // Basic match info
        id: match.id,
        status: match.status,
        sport: match.sport,
        date: match.date,
        kickOffTime: match.kickOffTime,
        venue: match.venue,
        venueCity: match.venueCity,
        attendance: match.attendance,

        // Teams
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          code: match.homeTeam.code,
          logo: match.homeTeam.logoUrl,
          colors: match.homeTeam.colors,
          club: {
            id: match.homeTeam.club.id,
            name: match.homeTeam.club.name,
            location: `${match.homeTeam.club.city}, ${match.homeTeam.club.country}`,
          },
          squad: {
            total: match.homeTeam.members.length,
            captain: match.homeTeam.members.find((m) => m.isCaptain) || null,
            players: match.homeTeam.members.map((m) => ({
              id: m.userId,
              firstName: m.user.firstName,
              lastName: m.user.lastName,
              fullName: `${m.user.firstName} ${m.user.lastName}`,
              avatar: m.user.avatar,
              number: m.number,
              isCaptain: m.isCaptain,
            })),
          },
        },

        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          code: match.awayTeam.code,
          logo: match.awayTeam.logoUrl,
          colors: match.awayTeam.colors,
          club: {
            id: match.awayTeam.club.id,
            name: match.awayTeam.club.name,
            location: `${match.awayTeam.club.city}, ${match.awayTeam.club.country}`,
          },
          squad: {
            total: match.awayTeam.members.length,
            captain: match.awayTeam.members.find((m) => m.isCaptain) || null,
            players: match.awayTeam.members.map((m) => ({
              id: m.userId,
              firstName: m.user.firstName,
              lastName: m.user.lastName,
              fullName: `${m.user.firstName} ${m.user.lastName}`,
              avatar: m.user.avatar,
              number: m.number,
              isCaptain: m.isCaptain,
            })),
          },
        },

        // Score
        score: {
          homeGoals,
          awayGoals,
          result,
          homeGoalsET: match.homeGoalsET,
          awayGoalsET: match.awayGoalsET,
          homePenalties: match.homePenalties,
          awayPenalties: match.awayPenalties,
          goalsDistribution: {
            home: match.events
              .filter((e) => e.type === 'GOAL' && e.team === 'HOME')
              .map((e) => ({
                minute: e.minute,
                isExtraTime: e.isExtraTime,
                player: e.player
                  ? `${e.player.firstName} ${e.player.lastName}`
                  : 'Unknown',
              })),
            away: match.events
              .filter((e) => e.type === 'GOAL' && e.team === 'AWAY')
              .map((e) => ({
                minute: e.minute,
                isExtraTime: e.isExtraTime,
                player: e.player
                  ? `${e.player.firstName} ${e.player.lastName}`
                  : 'Unknown',
              })),
          },
        },

        // Referee
        referee: match.referee
          ? {
              id: match.referee.id,
              name: `${match.referee.user.firstName} ${match.referee.user.lastName}`,
              licenseNumber: match.referee.licenseNumber,
              licenseLevel: match.referee.licenseLevel,
            }
          : null,

        // Fixture
        fixture: match.fixture
          ? {
              id: match.fixture.id,
              matchweek: match.fixture.matchweek,
              season: match.fixture.season,
              league: {
                id: match.fixture.league.id,
                name: match.fixture.league.name,
                sport: match.fixture.league.sport,
              },
            }
          : null,

        // Match events
        events: {
          total: match.events.length,
          byType: eventCounts,
          list: match.events.map((e) => ({
            id: e.id,
            type: e.type,
            minute: e.minute,
            isExtraTime: e.isExtraTime,
            team: e.team,
            player: e.player
              ? {
                  id: e.playerId,
                  name: `${e.player.firstName} ${e.player.lastName}`,
                }
              : null,
            additionalInfo: e.additionalInfo,
            createdAt: e.createdAt,
          })),
        },

        // Player attendance
        attendance: {
          total: match.playerAttendances.length,
          confirmed: match.playerAttendances.filter(
            (pa) => pa.status === 'CONFIRMED'
          ).length,
          available: match.playerAttendances.filter(
            (pa) => pa.status === 'AVAILABLE'
          ).length,
          unavailable: match.playerAttendances.filter(
            (pa) => pa.status === 'UNAVAILABLE'
          ).length,
          details: match.playerAttendances.map((pa) => ({
            playerId: pa.playerId,
            playerName: `${pa.player.firstName} ${pa.player.lastName}`,
            status: pa.status,
            minutesPlayed: pa.minutesPlayed,
            performanceRating: pa.performanceRating,
            position: pa.position,
            shirtNumber: pa.shirtNumber,
          })),
        },

        // Statistics
        statistics: {
          possession: {
            home: match.stats?.homePossession,
            away: match.stats?.awayPossession,
          },
          shots: {
            home: match.stats?.homeShots,
            away: match.stats?.awayShots,
            onTarget: {
              home: match.stats?.homeShotsOnTarget,
              away: match.stats?.awayShotsOnTarget,
            },
          },
          passing: {
            home: {
              total: match.stats?.homePasses,
              accuracy: match.stats?.homePassAccuracy,
            },
            away: {
              total: match.stats?.awayPasses,
              accuracy: match.stats?.awayPassAccuracy,
            },
          },
          fouls: {
            home: match.stats?.homeFouls,
            away: match.stats?.awayFouls,
          },
          corners: {
            home: match.stats?.homeCorners,
            away: match.stats?.awayCorners,
          },
          offsides: {
            home: match.stats?.homeOffsides,
            away: match.stats?.awayOffsides,
          },
        },

        // Additional info
        highlights: match.highlights,
        notes: match.notes,

        // Metadata
        metadata: {
          matchId: match.id,
          requestId,
          timestamp: new Date().toISOString(),
          createdAt: match.createdAt,
          updatedAt: match.updatedAt,
        },
      },
    };

    logger.info(`[${requestId}] Successfully retrieved match ${params.matchId}`);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(`[${requestId}] Error in GET /api/matches/[${params.matchId}]:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
          code: 'MATCH_NOT_FOUND',
          requestId,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve match details',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/matches/[matchId] - Update Match Details & Score
// Authorization: SUPERADMIN, LEAGUE_ADMIN, REFEREE
// ============================================================================

export async function PATCH(request: NextRequest, { params }: MatchParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] PATCH /api/matches/[${params.matchId}]`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401 }
      );
    }

    // ✅ Authorization
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN');
    const isReferee = session.user.roles?.includes('REFEREE');

    if (!isSuperAdmin && !isLeagueAdmin && !isReferee) {
      throw new ForbiddenError('Only SUPERADMIN, LEAGUE_ADMIN, or REFEREE can update matches');
    }

    // ✅ Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    // ✅ Fetch existing match
    const existingMatch = await prisma.match.findUnique({
      where: { id: params.matchId },
      select: {
        id: true,
        status: true,
        homeGoals: true,
        awayGoals: true,
        attendance: true,
        venue: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    if (!existingMatch) {
      throw new NotFoundError('Match', params.matchId);
    }

    // ✅ Only allow score updates when match is LIVE or FINISHED
    if (
      (body.homeGoals !== undefined || body.awayGoals !== undefined) &&
      !['LIVE', 'FINISHED', 'HALFTIME'].includes(existingMatch.status)
    ) {
      throw new BadRequestError('Can only update score for LIVE or FINISHED matches');
    }

    // ✅ Define allowed fields
    const allowedFields = [
      'status',
      'homeGoals',
      'awayGoals',
      'homeGoalsET',
      'awayGoalsET',
      'homePenalties',
      'awayPenalties',
      'attendance',
      'venue',
      'notes',
      'highlights',
    ];

    const updateData: any = {};
    const changes: any = {};

    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined && body[field] !== null) {
        const oldValue = (existingMatch as any)[field];

        // Type coercion for numeric fields
        let newValue = body[field];
        if (
          [
            'homeGoals',
            'awayGoals',
            'homeGoalsET',
            'awayGoalsET',
            'homePenalties',
            'awayPenalties',
            'attendance',
          ].includes(field)
        ) {
          newValue = parseInt(newValue, 10);
          if (isNaN(newValue) || newValue < 0) {
            throw new BadRequestError(`${field} must be a positive number`);
          }
        }

        if (oldValue !== newValue) {
          updateData[field] = newValue;
          changes[field] = { from: oldValue, to: newValue };
        }
      }
    }

    // ✅ Check if there are actual changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No changes were made',
          data: existingMatch,
        },
        { status: 200 }
      );
    }

    // ✅ Update match
    const updatedMatch = await prisma.match.update({
      where: { id: params.matchId },
      data: updateData,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: 'MATCH_RESULT_UPDATED',
      entityType: 'Match',
      entityId: params.matchId,
      changes,
      details: `Updated match ${existingMatch.homeTeam.name} vs ${existingMatch.awayTeam.name}. Changed: ${Object.keys(changes).join(', ')}`,
    });

    logger.info(
      `[${requestId}] Successfully updated match ${params.matchId}`,
      { changedFields: Object.keys(changes) }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Match updated successfully',
        data: updatedMatch,
        changes,
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`[${requestId}] Error in PATCH /api/matches/[${params.matchId}]:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'MATCH_NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message, code: 'ACCESS_DENIED', requestId },
        { status: 403 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message, code: 'INVALID_INPUT', requestId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to update match',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/matches/[matchId] - Cancel Match
// Authorization: SUPERADMIN, LEAGUE_ADMIN
// ============================================================================

export async function DELETE(request: NextRequest, { params }: MatchParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] DELETE /api/matches/[${params.matchId}]`);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401 }
      );
    }

    // ✅ Authorization
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN');

    if (!isSuperAdmin && !isLeagueAdmin) {
      throw new ForbiddenError('Only SUPERADMIN or LEAGUE_ADMIN can cancel matches');
    }

    // ✅ Fetch match
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      select: {
        id: true,
        status: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    // ✅ Can only cancel scheduled or postponed matches
    if (!['SCHEDULED', 'POSTPONED'].includes(match.status)) {
      throw new BadRequestError('Can only cancel SCHEDULED or POSTPONED matches');
    }

    // ✅ Update match status
    const cancelledMatch = await prisma.match.update({
      where: { id: params.matchId },
      data: { status: 'CANCELLED' },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: 'USER_DELETED',
      entityType: 'Match',
      entityId: params.matchId,
      details: `Cancelled match: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
    });

    logger.info(`[${requestId}] Successfully cancelled match ${params.matchId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Match cancelled successfully',
        data: { id: cancelledMatch.id, status: cancelledMatch.status },
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`[${requestId}] Error in DELETE /api/matches/[${params.matchId}]:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'MATCH_NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message, code: 'ACCESS_DENIED', requestId },
        { status: 403 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message, code: 'INVALID_INPUT', requestId },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to cancel match',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
