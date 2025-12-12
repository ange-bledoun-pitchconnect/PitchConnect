// ============================================================================
// WORLD-CLASS NEW: /src/app/api/teams/[teamId]/roster/route.ts
// Advanced Roster Management with Filtering & Analytics
// VERSION: 3.0 - Production Grade
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError } from '@/lib/api/errors';
import { logger } from '@/lib/api/logger';

interface RosterParams {
  params: { teamId: string };
}

// ============================================================================
// GET /api/teams/[teamId]/roster - Get Team Roster with Advanced Filtering
// Query Params:
//   - role: 'PLAYER' | 'COACH' | 'STAFF' | 'ALL' (optional)
//   - status: 'ACTIVE' | 'INACTIVE' | 'ALL' (optional)
//   - sortBy: 'name' | 'number' | 'joinedAt' (optional, default: number)
//   - limit: number (optional, max 100)
// ============================================================================

export async function GET(request: NextRequest, { params }: RosterParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] GET /api/teams/[${params.teamId}]/roster`);

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

    // ✅ Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      select: { id: true, name: true, sport: true },
    });

    if (!team) {
      throw new NotFoundError('Team', params.teamId);
    }

    // ✅ Parse query parameters
    const url = new URL(request.url);
    const roleFilter = url.searchParams.get('role') || 'ALL';
    const statusFilter = url.searchParams.get('status') || 'ALL';
    const sortBy = url.searchParams.get('sortBy') || 'number';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 100);

    // ✅ Build where clause
    const whereClause: any = { teamId: params.teamId };

    if (roleFilter !== 'ALL') {
      whereClause.role = roleFilter === 'PLAYER' ? { in: ['PLAYER', null] } : roleFilter;
    }

    if (statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    // ✅ Build order by
    let orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy = { user: { firstName: 'asc' } };
        break;
      case 'joinedAt':
        orderBy = { joinedAt: 'desc' };
        break;
      case 'number':
      default:
        orderBy = { number: 'asc' };
    }

    // ✅ Fetch roster members
    const members = await prisma.teamMember.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            dateOfBirth: true,
            nationality: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy,
      take: limit,
    });

    // ✅ Enhance member data with calculated fields
    const enhancedMembers = members.map((member) => {
      const age = member.user.dateOfBirth
        ? Math.floor(
            (new Date().getTime() -
              new Date(member.user.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : null;

      const daysInTeam = Math.floor(
        (new Date().getTime() - new Date(member.joinedAt).getTime()) /
          (24 * 60 * 60 * 1000)
      );

      return {
        id: member.userId,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        fullName: `${member.user.firstName} ${member.user.lastName}`,
        avatar: member.user.avatar,
        email: member.user.email,
        phoneNumber: member.user.phoneNumber,
        number: member.number,
        isCaptain: member.isCaptain,
        role: member.role || 'PLAYER',
        status: member.status,
        nationality: member.user.nationality,
        dateOfBirth: member.user.dateOfBirth,
        age,
        joinedAt: member.joinedAt,
        daysInTeam,
        leftAt: member.leftAt,
      };
    });

    // ✅ Calculate roster statistics
    const players = enhancedMembers.filter((m) => m.role === 'PLAYER' || m.role === null);
    const coaches = enhancedMembers.filter((m) => m.role === 'COACH');
    const staff = enhancedMembers.filter((m) => !['PLAYER', 'COACH'].includes(m.role));
    const activePlayers = players.filter((p) => p.status === 'ACTIVE');
    const captain = enhancedMembers.find((m) => m.isCaptain);

    // ✅ Calculate average age
    const activePlayersWithAge = activePlayers.filter((p) => p.age !== null);
    const averageAge =
      activePlayersWithAge.length > 0
        ? (
            activePlayersWithAge.reduce((sum, p) => sum + (p.age || 0), 0) /
            activePlayersWithAge.length
          ).toFixed(1)
        : null;

    const response = {
      success: true,
      data: {
        team: {
          id: team.id,
          name: team.name,
          sport: team.sport,
        },
        roster: enhancedMembers,
        summary: {
          total: enhancedMembers.length,
          active: enhancedMembers.filter((m) => m.status === 'ACTIVE').length,
          inactive: enhancedMembers.filter((m) => m.status !== 'ACTIVE').length,
          players: players.length,
          activePlayers: activePlayers.length,
          coaches: coaches.length,
          staff: staff.length,
          captain: captain
            ? {
                id: captain.id,
                name: captain.fullName,
                number: captain.number,
              }
            : null,
          averageAge,
          nationalities: [
            ...new Set(enhancedMembers.map((m) => m.nationality).filter(Boolean)),
          ].length,
        },
        filters: {
          role: roleFilter,
          status: statusFilter,
          sortBy,
          limit,
        },
        metadata: {
          teamId: params.teamId,
          requestId,
          timestamp: new Date().toISOString(),
          recordsReturned: enhancedMembers.length,
        },
      },
    };

    logger.info(
      `[${requestId}] Successfully retrieved roster for team ${params.teamId}`,
      { memberCount: enhancedMembers.length }
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(
      `[${requestId}] Error in GET /api/teams/[${params.teamId}]/roster:`,
      error
    );

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'TEAM_NOT_FOUND', requestId },
        { status: 404 }
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
        message: 'Failed to retrieve roster',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/teams/[teamId]/roster - Add Member to Roster
// Authorization: Club owner, Team manager, SUPERADMIN
// ============================================================================

export async function POST(request: NextRequest, { params }: RosterParams) {
  const requestId = crypto.randomUUID();

  try {
    logger.info(`[${requestId}] POST /api/teams/[${params.teamId}]/roster`);

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

    // ✅ Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: { club: { select: { ownerId: true } } },
    });

    if (!team) {
      throw new NotFoundError('Team', params.teamId);
    }

    if (!isSuperAdmin && session.user.id !== team.club.ownerId) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only club owner or SUPERADMIN can add members',
          code: 'ACCESS_DENIED',
          requestId,
        },
        { status: 403 }
      );
    }

    // ✅ Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    // ✅ Validate required fields
    if (!body.userId) {
      throw new BadRequestError('userId is required');
    }

    // ✅ Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundError('User', body.userId);
    }

    // ✅ Check if already in team
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: params.teamId, userId: body.userId } },
    });

    if (existingMember) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'User is already a member of this team',
          code: 'DUPLICATE_MEMBER',
          requestId,
        },
        { status: 409 }
      );
    }

    // ✅ Create team member
    const newMember = await prisma.teamMember.create({
      data: {
        teamId: params.teamId,
        userId: body.userId,
        role: body.role || 'PLAYER',
        status: body.status || 'ACTIVE',
        number: body.number ? parseInt(body.number, 10) : null,
        isCaptain: body.isCaptain || false,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const { logAuditAction } = await import('@/lib/api/audit');
    await logAuditAction({
      performedById: session.user.id,
      action: 'USER_CREATED',
      entityType: 'TeamMember',
      entityId: newMember.id,
      changes: {
        userId: newMember.userId,
        role: newMember.role,
        number: newMember.number,
      },
      details: `Added ${newMember.user.firstName} ${newMember.user.lastName} to team ${team.name}`,
    });

    logger.info(
      `[${requestId}] Successfully added member to team ${params.teamId}`,
      { userId: body.userId, role: body.role }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Member added to team successfully',
        data: newMember,
        metadata: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(
      `[${requestId}] Error in POST /api/teams/[${params.teamId}]/roster:`,
      error
    );

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message, code: 'NOT_FOUND', requestId },
        { status: 404 }
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
        message: 'Failed to add member to roster',
        code: 'SERVER_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}
