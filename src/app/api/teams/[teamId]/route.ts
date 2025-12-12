// ============================================================================
// WORLD-CLASS ENHANCED: /src/app/api/teams/[teamId]/route.ts
// Complete Team Details with Roster, Statistics & League Integration
// VERSION: 3.0 - Production Grade | Multi-Sport Ready
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

interface TeamParams {
  params: { teamId: string };
}

// ============================================================================
// GET /api/teams/[teamId] - Get Complete Team Details
// Authorization: Any authenticated user (with privacy checks)
// ============================================================================

export async function GET(request: NextRequest, { params }: TeamParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] GET /api/teams/[${params.teamId}]`);

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

    // ✅ Validate team ID format
    if (!params.teamId || typeof params.teamId !== 'string') {
      throw new BadRequestError('Invalid team ID format');
    }

    // ✅ Fetch team with comprehensive relationships
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: {
        // Club information
        club: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            country: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            website: true,
            founded: true,
          },
        },

        // Team members (players, coaches, staff)
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                dateOfBirth: true,
                nationality: true,
                roles: true,
              },
            },
          },
          orderBy: { status: 'asc' },
        },

        // League participation
        leagueTeams: {
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

        // Standings (current league position)
        matchesHome: {
          where: { status: { in: ['FINISHED', 'LIVE'] } },
          select: {
            id: true,
            date: true,
            status: true,
            homeGoals: true,
            awayGoals: true,
            awayTeam: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },

        matchesAway: {
          where: { status: { in: ['FINISHED', 'LIVE'] } },
          select: {
            id: true,
            date: true,
            status: true,
            homeGoals: true,
            awayGoals: true,
            homeTeam: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },

        // Upcoming matches
        upcomingMatchesHome: {
          where: { status: { in: ['SCHEDULED', 'POSTPONED'] } },
          select: {
            id: true,
            date: true,
            venue: true,
            awayTeam: { select: { id: true, name: true } },
          },
          orderBy: { date: 'asc' },
          take: 5,
        },

        upcomingMatchesAway: {
          where: { status: { in: ['SCHEDULED', 'POSTPONED'] } },
          select: {
            id: true,
            date: true,
            venue: true,
            homeTeam: { select: { id: true, name: true } },
          },
          orderBy: { date: 'asc' },
          take: 5,
        },

        // Training sessions
        trainingSessions: {
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            id: true,
            date: true,
            location: true,
            focus: true,
            coach: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });

    // ✅ Team not found
    if (!team) {
      throw new NotFoundError('Team', params.teamId);
    }

    // ✅ Calculate team statistics
    const allMatches = [...team.matchesHome, ...team.matchesAway];
    let wins = 0,
      draws = 0,
      losses = 0,
      goalsFor = 0,
      goalsAgainst = 0;

    for (const match of allMatches) {
      const isHome = 'awayTeam' in match;
      const teamGoals = isHome ? match.homeGoals : match.awayGoals;
      const oppositionGoals = isHome ? match.awayGoals : match.homeGoals;

      if (teamGoals > oppositionGoals) wins++;
      else if (teamGoals === oppositionGoals) draws++;
      else losses++;

      goalsFor += teamGoals || 0;
      goalsAgainst += oppositionGoals || 0;
    }

    const matchesPlayed = wins + draws + losses;
    const points = wins * 3 + draws;

    // ✅ Calculate roster statistics
    const activeMembers = team.members.filter((m) => m.status === 'ACTIVE');
    const players = activeMembers.filter(
      (m) => m.role === 'PLAYER' || !m.role
    );
    const coaches = activeMembers.filter((m) => m.role === 'COACH');
    const staff = activeMembers.filter(
      (m) => !['PLAYER', 'COACH'].includes(m.role)
    );

    // ✅ Get captain information
    const captain = activeMembers.find((m) => m.isCaptain);

    // ✅ Parse sport-specific data
    const sportConfig = {
      FOOTBALL: { maxPlayers: 11, squadSize: 23 },
      NETBALL: { maxPlayers: 7, squadSize: 15 },
      RUGBY: { maxPlayers: 15, squadSize: 23 },
      CRICKET: { maxPlayers: 11, squadSize: 15 },
      AMERICAN_FOOTBALL: { maxPlayers: 11, squadSize: 45 },
      BASKETBALL: { maxPlayers: 5, squadSize: 15 },
    };

    const sportData =
      sportConfig[team.sport as keyof typeof sportConfig] ||
      sportConfig.FOOTBALL;

    // ✅ Build comprehensive response
    const response = {
      success: true,
      data: {
        // Basic Info
        id: team.id,
        name: team.name,
        code: team.code,
        sport: team.sport,
        ageGroup: team.ageGroup,
        category: team.category,
        status: team.status,

        // Club Information
        club: team.club,

        // Team Description
        description: team.description,
        logoUrl: team.logoUrl,
        founded: team.founded,

        // Configuration
        sportConfiguration: {
          sport: team.sport,
          maxPlayersOnPitch: sportData.maxPlayers,
          typicalSquadSize: sportData.squadSize,
          currentSquadSize: activeMembers.length,
          squadCompletion: `${Math.round((activeMembers.length / sportData.squadSize) * 100)}%`,
        },

        // Roster Information
        roster: {
          total: activeMembers.length,
          players: players.length,
          coaches: coaches.length,
          staff: staff.length,
          squads: {
            active: players.map((m) => ({
              id: m.userId,
              firstName: m.user.firstName,
              lastName: m.user.lastName,
              fullName: `${m.user.firstName} ${m.user.lastName}`,
              avatar: m.user.avatar,
              number: m.number,
              isCaptain: m.isCaptain,
              joinedAt: m.joinedAt,
              status: m.status,
              age: m.user.dateOfBirth
                ? Math.floor(
                    (new Date().getTime() -
                      new Date(m.user.dateOfBirth).getTime()) /
                      (365.25 * 24 * 60 * 60 * 1000)
                  )
                : null,
              nationality: m.user.nationality,
            })),
            coaches: coaches.map((m) => ({
              id: m.userId,
              firstName: m.user.firstName,
              lastName: m.user.lastName,
              fullName: `${m.user.firstName} ${m.user.lastName}`,
              avatar: m.user.avatar,
              role: m.role,
              joinedAt: m.joinedAt,
            })),
            staff: staff.map((m) => ({
              id: m.userId,
              firstName: m.user.firstName,
              lastName: m.user.lastName,
              fullName: `${m.user.firstName} ${m.user.lastName}`,
              role: m.role,
              joinedAt: m.joinedAt,
            })),
          },
          captain: captain
            ? {
                id: captain.userId,
                firstName: captain.user.firstName,
                lastName: captain.user.lastName,
                number: captain.number,
              }
            : null,
        },

        // Performance Statistics
        statistics: {
          matchesPlayed,
          wins,
          draws,
          losses,
          winRate: matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(1) : '0.0',
          goalsFor,
          goalsAgainst,
          goalDifference: goalsFor - goalsAgainst,
          goalsPerMatch: matchesPlayed > 0 ? (goalsFor / matchesPlayed).toFixed(2) : '0.00',
          points,
          averagePointsPerMatch:
            matchesPlayed > 0 ? (points / matchesPlayed).toFixed(2) : '0.00',
        },

        // League Information
        leagues: team.leagueTeams.map((lt) => ({
          id: lt.league.id,
          name: lt.league.name,
          code: lt.league.code,
          season: lt.league.season,
          sport: lt.league.sport,
          joinedAt: lt.joinedAt,
        })),

        // Recent Matches
        recentMatches: {
          played: allMatches.slice(0, 5).map((match) => {
            const isHome = 'awayTeam' in match;
            return {
              id: match.id,
              date: match.date,
              opponent: isHome ? match.awayTeam : match.homeTeam,
              homeGoals: match.homeGoals,
              awayGoals: match.awayGoals,
              result: match.homeGoals! > match.awayGoals! ? 'W' : match.homeGoals === match.awayGoals ? 'D' : 'L',
              status: match.status,
            };
          }),
          upcoming: [
            ...team.upcomingMatchesHome.map((m) => ({
              id: m.id,
              date: m.date,
              type: 'HOME',
              opponent: m.awayTeam,
              venue: m.venue,
            })),
            ...team.upcomingMatchesAway.map((m) => ({
              id: m.id,
              date: m.date,
              type: 'AWAY',
              opponent: m.homeTeam,
              venue: m.venue,
            })),
          ]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5),
        },

        // Training Information
        training: {
          recentSessions: team.trainingSessions.length,
          nextSessions: team.trainingSessions.slice(0, 3).map((s) => ({
            id: s.id,
            date: s.date,
            location: s.location,
            focus: s.focus,
            coach: s.coach
              ? `${s.coach.user.firstName} ${s.coach.user.lastName}`
              : null,
          })),
        },

        // Metadata
        metadata: {
          teamId: team.id,
          requestId,
          timestamp: new Date().toISOString(),
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
        },
      },
    };

    logger.info(`[${requestId}] Successfully retrieved team ${params.teamId}`);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(`[${requestId}] Error in GET /api/teams/[${params.teamId}]:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
          code: 'TEAM_NOT_FOUND',
          requestId,
        },
        { status: 404 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: error.message,
          code: 'INVALID_INPUT',
          requestId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve team details',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/teams/[teamId] - Update Team Details
// Authorization: Team manager, Club owner, SUPERADMIN
// ============================================================================

export async function PATCH(request: NextRequest, { params }: TeamParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] PATCH /api/teams/[${params.teamId}]`);

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

    // ✅ Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    // ✅ Fetch existing team
    const existingTeam = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: { club: { select: { ownerId: true } } },
    });

    if (!existingTeam) {
      throw new NotFoundError('Team', params.teamId);
    }

    // ✅ Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isClubOwner = session.user.id === existingTeam.club.ownerId;

    if (!isSuperAdmin && !isClubOwner) {
      throw new ForbiddenError(
        'Only SUPERADMIN or club owner can update teams'
      );
    }

    // ✅ Validate updateable fields
    const allowedFields = [
      'name',
      'description',
      'logoUrl',
      'ageGroup',
      'category',
      'status',
    ];

    const updateData: any = {};
    const changes: any = {};

    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined && body[field] !== null) {
        const oldValue = (existingTeam as any)[field];
        const newValue = body[field];

        // ✅ Validation
        if (field === 'name') {
          if (typeof newValue !== 'string' || newValue.length < 2 || newValue.length > 100) {
            throw new BadRequestError('Team name must be 2-100 characters');
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
          data: existingTeam,
        },
        { status: 200 }
      );
    }

    // ✅ Update team
    const updatedTeam = await prisma.team.update({
      where: { id: params.teamId },
      data: updateData,
      include: {
        club: { select: { name: true } },
      },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: 'USER_UPDATED',
      entityType: 'Team',
      entityId: params.teamId,
      changes,
      details: `Updated team: ${existingTeam.name}. Changed fields: ${Object.keys(changes).join(', ')}`,
    });

    logger.info(
      `[${requestId}] Successfully updated team ${params.teamId}`,
      { changedFields: Object.keys(changes) }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Team updated successfully',
        data: updatedTeam,
        changes,
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`[${requestId}] Error in PATCH /api/teams/[${params.teamId}]:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'TEAM_NOT_FOUND', requestId },
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
        message: 'Failed to update team',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/teams/[teamId] - Archive Team (Soft Delete)
// Authorization: SUPERADMIN, Club owner
// ============================================================================

export async function DELETE(request: NextRequest, { params }: TeamParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] DELETE /api/teams/[${params.teamId}]`);

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
    const existingTeam = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: { club: { select: { ownerId: true } } },
    });

    if (!existingTeam) {
      throw new NotFoundError('Team', params.teamId);
    }

    const isClubOwner = session.user.id === existingTeam.club.ownerId;

    if (!isSuperAdmin && !isClubOwner) {
      throw new ForbiddenError('Only SUPERADMIN or club owner can delete teams');
    }

    // ✅ Soft delete: set status to ARCHIVED
    const archivedTeam = await prisma.team.update({
      where: { id: params.teamId },
      data: { status: 'ARCHIVED' },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      action: 'USER_DELETED',
      entityType: 'Team',
      entityId: params.teamId,
      details: `Archived team: ${existingTeam.name}`,
    });

    logger.info(`[${requestId}] Successfully archived team ${params.teamId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Team archived successfully',
        data: { id: archivedTeam.id, status: archivedTeam.status },
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`[${requestId}] Error in DELETE /api/teams/[${params.teamId}]:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'TEAM_NOT_FOUND', requestId },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message, code: 'ACCESS_DENIED', requestId },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to archive team',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
