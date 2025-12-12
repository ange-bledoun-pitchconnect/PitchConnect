// ============================================================================
// WORLD-CLASS ENHANCED: /src/app/api/players/[playerId]/route.ts
// Single Player Details with Comprehensive Profile Data
// VERSION: 3.0 - Production Grade
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// GET /api/players/[playerId] - Get Player Details
// Authorization: Any authenticated user (with profile privacy checks)
// ============================================================================

interface PlayerParams {
  params: { playerId: string };
}

export async function GET(request: NextRequest, { params }: PlayerParams) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info(`[${requestId}] GET /api/players/[${params.playerId}]`);

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

    // ✅ Validate player ID format
    if (!params.playerId || typeof params.playerId !== 'string') {
      throw new BadRequestError('Invalid player ID format', { playerId: params.playerId });
    }

    // ✅ Fetch player with comprehensive data (optimized with include)
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phoneNumber: true,
            dateOfBirth: true,
            nationality: true,
            status: true,
            roles: true,
          },
        },
        // ✅ Latest 5 seasons of stats
        stats: {
          orderBy: { season: 'desc' },
          take: 5,
          select: {
            id: true,
            season: true,
            teamId: true,
            appearances: true,
            goals: true,
            assists: true,
            minutesPlayed: true,
            passingAccuracy: true,
            passes: true,
            passesCompleted: true,
            tackles: true,
            interceptions: true,
            yellowCards: true,
            redCards: true,
            expectedGoals: true,
            expectedAssists: true,
          },
        },
        // ✅ Active contracts only
        contracts: {
          where: { status: { in: ['ACTIVE', 'PENDING'] } },
          orderBy: { startDate: 'desc' },
          select: {
            id: true,
            position: true,
            salary: true,
            currency: true,
            startDate: true,
            endDate: true,
            contractType: true,
            status: true,
          },
        },
        // ✅ Recent injuries (last 24 months)
        injuries: {
          where: {
            dateFrom: {
              gte: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { dateFrom: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            severity: true,
            dateFrom: true,
            dateTo: true,
            estimatedReturn: true,
            status: true,
            description: true,
          },
        },
        // ✅ Recent match attendance (last 3 months)
        matchAttendance: {
          where: {
            match: {
              date: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
              },
            },
          },
          orderBy: { match: { date: 'desc' } },
          take: 15,
          select: {
            id: true,
            status: true,
            minutesPlayed: true,
            performanceRating: true,
            match: {
              select: {
                id: true,
                date: true,
                status: true,
                homeTeam: { select: { id: true, name: true } },
                awayTeam: { select: { id: true, name: true } },
                homeGoals: true,
                awayGoals: true,
              },
            },
          },
        },
        // ✅ Achievements
        achievements: {
          include: {
            achievement: {
              select: {
                id: true,
                name: true,
                icon: true,
                points: true,
                badgeColor: true,
              },
            },
          },
          take: 10,
          orderBy: { unlockedAt: 'desc' },
        },
        // ✅ Scouting profiles (if exists)
        scoutingProfiles: {
          select: {
            id: true,
            overallRating: true,
            potential: true,
            strengths: true,
            weaknesses: true,
            comparablePlayer: true,
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // ✅ Player not found
    if (!player) {
      throw new NotFoundError('Player', params.playerId);
    }

    // ✅ Privacy check: Non-admin users can only see public profiles
    if (session.user.id !== player.userId && !session.user.roles?.includes('SUPERADMIN')) {
      const isPublic = player.user.status === 'ACTIVE';
      if (!isPublic) {
        throw new ForbiddenError('This player profile is private');
      }
    }

    // ✅ Calculate derived metrics
    const currentContract = player.contracts[0];
    const recentStats = player.stats[0];
    const activeInjuries = player.injuries.filter((inj) => inj.status === 'ACTIVE');
    const allAchievementsCount = player.achievements.length;

    // ✅ Parse age from dateOfBirth
    const age = player.user.dateOfBirth
      ? Math.floor(
          (new Date().getTime() - new Date(player.user.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : null;

    // ✅ Calculate recent performance average
    const recentMatches = player.matchAttendance.slice(0, 5);
    const avgPerformanceRating =
      recentMatches.length > 0
        ? (
            recentMatches.reduce((sum, ma) => sum + (ma.performanceRating || 0), 0) /
            recentMatches.length
          ).toFixed(1)
        : null;

    // ✅ Format comprehensive response
    const response = {
      success: true,
      data: {
        // Basic Info
        id: player.id,
        user: {
          id: player.user.id,
          email: player.user.email,
          firstName: player.user.firstName,
          lastName: player.user.lastName,
          fullName: `${player.user.firstName} ${player.user.lastName}`,
          avatar: player.user.avatar,
          phoneNumber: player.user.phoneNumber,
          nationality: player.user.nationality,
          dateOfBirth: player.user.dateOfBirth,
          age,
          status: player.user.status,
          roles: player.user.roles,
        },

        // Physical Attributes
        physicalAttributes: {
          height: player.height,
          weight: player.weight,
          preferredFoot: player.preferredFoot,
          position: player.position,
          secondaryPosition: player.secondaryPosition,
          shirtNumber: player.shirtNumber,
          photo: player.photo,
          playerType: player.playerType,
        },

        // Current Status
        status: {
          currentStatus: player.status,
          activeInjuries: activeInjuries.length,
          activeContracts: player.contracts.filter((c) => c.status === 'ACTIVE').length,
          currentContract: currentContract
            ? {
                id: currentContract.id,
                position: currentContract.position,
                salary: currentContract.salary,
                currency: currentContract.currency,
                startDate: currentContract.startDate,
                endDate: currentContract.endDate,
                daysRemaining: currentContract.endDate
                  ? Math.floor(
                      (new Date(currentContract.endDate).getTime() - new Date().getTime()) /
                        (24 * 60 * 60 * 1000)
                    )
                  : null,
                type: currentContract.contractType,
              }
            : null,
        },

        // Statistics (Latest Season)
        currentSeasonStats: recentStats
          ? {
              id: recentStats.id,
              season: recentStats.season,
              appearances: recentStats.appearances,
              goals: recentStats.goals,
              assists: recentStats.assists,
              minutesPlayed: recentStats.minutesPlayed,
              goalsPerMatch: recentStats.appearances
                ? (recentStats.goals / recentStats.appearances).toFixed(2)
                : 0,
              avgMinutesPerMatch: recentStats.appearances
                ? Math.round(recentStats.minutesPlayed / recentStats.appearances)
                : 0,
              passingStats: {
                accuracy: recentStats.passingAccuracy,
                completed: recentStats.passesCompleted,
                total: recentStats.passes,
              },
              defensiveStats: {
                tackles: recentStats.tackles,
                interceptions: recentStats.interceptions,
                yellowCards: recentStats.yellowCards,
                redCards: recentStats.redCards,
              },
              advancedStats: {
                expectedGoals: recentStats.expectedGoals,
                expectedAssists: recentStats.expectedAssists,
              },
            }
          : null,

        // Recent Performance
        recentPerformance: {
          lastMatches: player.matchAttendance.slice(0, 5).map((ma) => ({
            id: ma.id,
            date: ma.match.date,
            status: ma.match.status,
            opponent: ma.match.homeTeam.id === player.id ? ma.match.awayTeam : ma.match.homeTeam,
            attendance: ma.status,
            minutesPlayed: ma.minutesPlayed,
            performanceRating: ma.performanceRating,
            position: ma.position,
          })),
          averagePerformanceRating: avgPerformanceRating,
          matchesPlayedLastThreeMonths: player.matchAttendance.length,
        },

        // Injuries
        injuries: {
          active: activeInjuries.map((inj) => ({
            id: inj.id,
            type: inj.type,
            severity: inj.severity,
            dateFrom: inj.dateFrom,
            estimatedReturn: inj.estimatedReturn,
            daysInjured: Math.floor(
              (new Date().getTime() - new Date(inj.dateFrom).getTime()) / (24 * 60 * 60 * 1000)
            ),
            description: inj.description,
          })),
          history: player.injuries.slice(0, 10).map((inj) => ({
            id: inj.id,
            type: inj.type,
            severity: inj.severity,
            dateFrom: inj.dateFrom,
            dateTo: inj.dateTo,
            recoveryDays: inj.dateTo
              ? Math.floor(
                  (new Date(inj.dateTo).getTime() - new Date(inj.dateFrom).getTime()) /
                    (24 * 60 * 60 * 1000)
                )
              : null,
          })),
          recentInjuryCount: player.injuries.length,
        },

        // Contracts
        contracts: {
          active: player.contracts.filter((c) => c.status === 'ACTIVE'),
          all: player.contracts,
        },

        // Achievements & Recognition
        achievements: {
          total: allAchievementsCount,
          recent: player.achievements.slice(0, 10),
          totalPoints: player.achievements.reduce((sum, pa) => sum + (pa.achievement.points || 0), 0),
        },

        // Scouting Profile
        scoutingProfile: player.scoutingProfiles[0] || null,

        // Metadata
        metadata: {
          playerId: player.id,
          requestId,
          timestamp: new Date().toISOString(),
          createdAt: player.createdAt,
          updatedAt: player.updatedAt,
        },
      },
    };

    // ✅ Audit logging
    logger.info(`[${requestId}] Successfully retrieved player ${params.playerId}`);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(`[${requestId}] Error in GET /api/players/[${params.playerId}]:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
          code: 'PLAYER_NOT_FOUND',
          requestId,
        },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: error.message,
          code: 'ACCESS_DENIED',
          requestId,
        },
        { status: 403 }
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
        message: 'Failed to retrieve player details',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/players/[playerId] - Update Player Details
// Authorization: Player themselves, COACH, CLUB_MANAGER, SUPERADMIN
// ============================================================================

export async function PATCH(request: NextRequest, { params }: PlayerParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] PATCH /api/players/[${params.playerId}]`);

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

    // ✅ Fetch existing player
    const existingPlayer = await prisma.player.findUnique({
      where: { id: params.playerId },
      include: { user: true },
    });

    if (!existingPlayer) {
      throw new NotFoundError('Player', params.playerId);
    }

    // ✅ Authorization check
    const isOwnProfile = existingPlayer.userId === session.user.id;
    const isAdmin = session.user.roles?.includes('SUPERADMIN');
    const isCoach = session.user.roles?.includes('COACH');
    const isClubManager = session.user.roles?.includes('CLUB_MANAGER');

    if (!isOwnProfile && !isAdmin && !isCoach && !isClubManager) {
      throw new ForbiddenError('You do not have permission to update this player');
    }

    // ✅ Allowed update fields
    const allowedFields = [
      'position',
      'preferredFoot',
      'secondaryPosition',
      'height',
      'weight',
      'shirtNumber',
      'photo',
      'status',
      'developmentNotes',
      'playerType',
    ];

    const updateData: any = {};
    const changes: any = {};

    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined && body[field] !== null) {
        const oldValue = (existingPlayer as any)[field];
        let newValue = body[field];

        // ✅ Type coercion for numeric fields
        if (field === 'height' || field === 'weight') {
          newValue = parseFloat(newValue);
          if (isNaN(newValue)) {
            throw new BadRequestError(`${field} must be a valid number`);
          }
        } else if (field === 'shirtNumber') {
          newValue = parseInt(newValue, 10);
          if (isNaN(newValue) || newValue < 0 || newValue > 99) {
            throw new BadRequestError('Shirt number must be between 0 and 99');
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
          data: existingPlayer,
        },
        { status: 200 }
      );
    }

    // ✅ Update player
    const updatedPlayer = await prisma.player.update({
      where: { id: params.playerId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      targetUserId: existingPlayer.userId,
      action: 'USER_UPDATED',
      entityType: 'Player',
      entityId: params.playerId,
      changes,
      details: `Updated player profile: ${Object.keys(changes).join(', ')}`,
    });

    logger.info(
      `[${requestId}] Successfully updated player ${params.playerId}`,
      { changedFields: Object.keys(changes) }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Player updated successfully',
        data: updatedPlayer,
        changes,
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`[${requestId}] Error in PATCH /api/players/[${params.playerId}]:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'PLAYER_NOT_FOUND', requestId },
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
        message: 'Failed to update player',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/players/[playerId] - Archive Player (Soft Delete)
// Authorization: SUPERADMIN, CLUB_MANAGER
// ============================================================================

export async function DELETE(request: NextRequest, { params }: PlayerParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] DELETE /api/players/[${params.playerId}]`);

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

    // ✅ Authorization: Only SUPERADMIN or CLUB_MANAGER can delete
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isClubManager = session.user.roles?.includes('CLUB_MANAGER');

    if (!isSuperAdmin && !isClubManager) {
      throw new ForbiddenError('Only SUPERADMIN or CLUB_MANAGER can delete players');
    }

    // ✅ Fetch player
    const player = await prisma.player.findUnique({
      where: { id: params.playerId },
      include: { user: true },
    });

    if (!player) {
      throw new NotFoundError('Player', params.playerId);
    }

    // ✅ Soft delete: set status to ARCHIVED
    const archivedPlayer = await prisma.player.update({
      where: { id: params.playerId },
      data: { status: 'ARCHIVED' },
    });

    // ✅ Audit logging
    await logAuditAction({
      performedById: session.user.id,
      targetUserId: player.userId,
      action: 'USER_DELETED',
      entityType: 'Player',
      entityId: params.playerId,
      details: `Archived player: ${player.firstName} ${player.lastName}`,
    });

    logger.info(
      `[${requestId}] Successfully archived player ${params.playerId}`,
      {
        playerName: `${player.firstName} ${player.lastName}`,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Player archived successfully',
        data: { id: archivedPlayer.id, status: archivedPlayer.status },
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`[${requestId}] Error in DELETE /api/players/[${params.playerId}]:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'PLAYER_NOT_FOUND', requestId },
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
        message: 'Failed to archive player',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
