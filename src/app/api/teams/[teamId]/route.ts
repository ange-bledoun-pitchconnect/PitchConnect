// ============================================================================
// 🏆 ENHANCED: src/app/api/teams/[teamId]/route.ts
// GET - Complete team details | PATCH - Update team | DELETE - Archive team
// VERSION: 3.5 - World-Class Enhanced
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, validateStringLength } from '@/lib/api/validation';
import { errorResponse } from '@/lib/api/responses';
import { NotFoundError, ForbiddenError, BadRequestError, UnauthorizedError } from '@/lib/api/errors';
import { logResourceUpdated, createAuditLog } from '@/lib/api/audit';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  number?: number;
  isCaptain?: boolean;
  joinedAt: string;
  status: string;
  age?: number;
  nationality?: string;
}

interface TeamDetailResponse {
  success: true;
  id: string;
  name: string;
  shortCode: string;
  sport: string;
  club: {
    id: string;
    name: string;
    city: string | null;
    country: string;
  };
  manager: {
    id: string;
    name: string;
    email: string;
  };
  description: string | null;
  logo: string | null;
  colors: Record<string, any>;
  founded: number;
  status: string;
  roster: {
    total: number;
    players: TeamMember[];
    coaches: TeamMember[];
    staff: TeamMember[];
    captain: TeamMember | null;
  };
  leagues: Array<{
    id: string;
    name: string;
    season: number;
    sport: string;
  }>;
  statistics: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: string;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  };
  recentMatches: Array<{
    id: string;
    date: string;
    opponent: {
      id: string;
      name: string;
    };
    homeGoals: number;
    awayGoals: number;
    result: string;
    status: string;
  }>;
  timestamp: string;
  requestId: string;
}

interface UpdateTeamRequest {
  name?: string;
  description?: string;
  logo?: string;
  status?: string;
}

interface UpdateTeamResponse {
  success: true;
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  status: string;
  updatedAt: string;
  message: string;
  changedFields: string[];
  timestamp: string;
  requestId: string;
}

// ============================================================================
// GET /api/teams/[teamId] - Get Team Details
// ============================================================================

/**
 * GET /api/teams/[teamId]
 * Get complete team information including roster, leagues, and statistics
 * 
 * Path Parameters:
 *   - teamId: string (team ID)
 * 
 * Authorization: Any authenticated user
 * 
 * Returns: 200 OK with comprehensive team data
 * 
 * Response includes:
 *   - Team info (name, sport, status)
 *   - Club details
 *   - Manager information
 *   - Complete roster (players, coaches, staff)
 *   - League participation
 *   - Match statistics
 *   - Recent match results
 * 
 * Features:
 *   ✅ Complete team overview
 *   ✅ Roster with player details
 *   ✅ Aggregated statistics
 *   ✅ League membership tracking
 *   ✅ Recent match history
 *   ✅ Request tracking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
): Promise<NextResponse<TeamDetailResponse | { success: false; error: string; code: string; requestId: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await auth();

    if (!session) {
      return Response.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Validate teamId format
    if (!params.teamId || typeof params.teamId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid team ID format',
          code: 'INVALID_TEAM_ID',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Fetch team with comprehensive relationships
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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
              },
            },
          },
          where: { status: 'ACTIVE' },
          orderBy: { joinedAt: 'desc' },
        },
        leagues: {
          select: {
            id: true,
            name: true,
            season: true,
            sport: true,
          },
          take: 10,
        },
        homeMatches: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            date: true,
            homeGoals: true,
            awayGoals: true,
            awayTeam: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
        awayMatches: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            date: true,
            homeGoals: true,
            awayGoals: true,
            homeTeam: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team not found',
          code: 'TEAM_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Categorize roster members
    const players = team.members.filter((m) => !m.role || m.role === 'PLAYER');
    const coaches = team.members.filter((m) => m.role === 'COACH');
    const staff = team.members.filter((m) => m.role && !['PLAYER', 'COACH'].includes(m.role));
    const captain = team.members.find((m) => m.isCaptain);

    // 5. Format roster members
    const formatMember = (member: any): TeamMember => ({
      id: member.userId,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      fullName: `${member.user.firstName} ${member.user.lastName}`,
      avatar: member.user.avatar,
      number: member.number,
      isCaptain: member.isCaptain,
      joinedAt: member.joinedAt.toISOString(),
      status: member.status,
      age: member.user.dateOfBirth
        ? Math.floor(
            (new Date().getTime() - new Date(member.user.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : undefined,
      nationality: member.user.nationality,
    });

    // 6. Calculate match statistics
    const allMatches = [...team.homeMatches, ...team.awayMatches];
    let wins = 0,
      draws = 0,
      losses = 0,
      goalsFor = 0,
      goalsAgainst = 0;

    const recentMatches = allMatches
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((match) => {
        const isHome = 'awayTeam' in match;
        const teamGoals = isHome ? match.homeGoals : match.awayGoals;
        const oppGoals = isHome ? match.awayGoals : match.homeGoals;

        if (teamGoals > oppGoals) wins++;
        else if (teamGoals === oppGoals) draws++;
        else losses++;

        goalsFor += teamGoals;
        goalsAgainst += oppGoals;

        return {
          id: match.id,
          date: match.date.toISOString(),
          opponent: isHome ? match.awayTeam : match.homeTeam,
          homeGoals: match.homeGoals,
          awayGoals: match.awayGoals,
          result: teamGoals > oppGoals ? 'W' : teamGoals === oppGoals ? 'D' : 'L',
          status: 'COMPLETED',
        };
      });

    const matchesPlayed = wins + draws + losses;
    const points = wins * 3 + draws;

    // 7. Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'TEAMVIEWED',
      resourceType: 'Team',
      resourceId: team.id,
      details: {
        teamName: team.name,
        sport: team.sport,
      },
      requestId,
    });

    // 8. Build comprehensive response
    const response: TeamDetailResponse = {
      success: true,
      id: team.id,
      name: team.name,
      shortCode: team.shortCode,
      sport: team.sport,
      club: team.club,
      manager: {
        id: team.manager.id,
        name: `${team.manager.firstName} ${team.manager.lastName}`,
        email: team.manager.email,
      },
      description: team.description,
      logo: team.logo,
      colors: team.colors,
      founded: team.founded,
      status: team.status,
      roster: {
        total: team.members.length,
        players: players.map(formatMember),
        coaches: coaches.map(formatMember),
        staff: staff.map(formatMember),
        captain: captain ? formatMember(captain) : null,
      },
      leagues: team.leagues,
      statistics: {
        matchesPlayed,
        wins,
        draws,
        losses,
        winRate: matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(1) + '%' : 'N/A',
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
      },
      recentMatches,
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[GET /api/teams/[teamId]]', {
      teamId: params.teamId,
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}

// ============================================================================
// PATCH /api/teams/[teamId] - Update Team
// ============================================================================

/**
 * PATCH /api/teams/[teamId]
 * Update team information
 * 
 * Path Parameters:
 *   - teamId: string (team ID)
 * 
 * Authorization: Team manager, Club owner, SUPERADMIN
 * 
 * Request Body (all optional):
 *   - name: string (3-100 chars)
 *   - description: string
 *   - logo: string (URL)
 *   - status: string (ACTIVE, ARCHIVED, etc.)
 * 
 * Returns: 200 OK with updated team details
 * 
 * Features:
 *   ✅ Comprehensive input validation
 *   ✅ Change tracking
 *   ✅ Transaction support
 *   ✅ Detailed audit logging
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string } }
): Promise<NextResponse<UpdateTeamResponse | { success: false; error: string; code: string; requestId: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Validate teamId
    if (!params.teamId || typeof params.teamId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid team ID format',
          code: 'INVALID_TEAM_ID',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Parse request body
    let body: UpdateTeamRequest;
    try {
      body = await parseJsonBody(request);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Fetch current team
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        status: true,
        managerId: true,
        clubId: true,
        club: { select: { ownerId: true } },
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team not found',
          code: 'TEAM_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 5. Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isTeamManager = session.user.id === team.managerId;
    const isClubOwner = session.user.id === team.club.ownerId;

    if (!isSuperAdmin && !isTeamManager && !isClubOwner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only team manager, club owner, or admin can update teams',
          code: 'INSUFFICIENT_PERMISSIONS',
          requestId,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 6. Track changes
    const changes: Record<string, { old: any; new: any }> = {};
    const updateData: Record<string, any> = {};

    if (body.name !== undefined && body.name !== team.name) {
      validateStringLength(body.name, 3, 100, 'Team name');
      changes.name = { old: team.name, new: body.name };
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined && body.description !== team.description) {
      changes.description = { old: team.description, new: body.description };
      updateData.description = body.description?.trim() || null;
    }

    if (body.logo !== undefined && body.logo !== team.logo) {
      changes.logo = { old: team.logo ? '[REDACTED]' : null, new: body.logo ? '[REDACTED]' : null };
      updateData.logo = body.logo || null;
    }

    if (body.status !== undefined && body.status !== team.status) {
      changes.status = { old: team.status, new: body.status };
      updateData.status = body.status;
    }

    // 7. Check if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          id: team.id,
          name: team.name,
          description: team.description,
          logo: team.logo,
          status: team.status,
          updatedAt: new Date().toISOString(),
          message: 'No changes provided',
          changedFields: [],
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 200, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 8. Update team with transaction
    const updatedTeam = await prisma.$transaction(async (tx) => {
      return await tx.team.update({
        where: { id: params.teamId },
        data: updateData,
      });
    });

    // 9. Create audit log
    await logResourceUpdated(
      session.user.id,
      'Team',
      team.id,
      team.name,
      changes,
      `Updated team "${team.name}"`
    );

    // 10. Build response
    const response: UpdateTeamResponse = {
      success: true,
      id: updatedTeam.id,
      name: updatedTeam.name,
      description: updatedTeam.description,
      logo: updatedTeam.logo,
      status: updatedTeam.status,
      updatedAt: updatedTeam.updatedAt.toISOString(),
      message: `Team "${team.name}" updated successfully`,
      changedFields: Object.keys(changes),
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[PATCH /api/teams/[teamId]]', {
      teamId: params.teamId,
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'BADREQUEST',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}

// ============================================================================
// DELETE /api/teams/[teamId] - Archive Team (Soft Delete)
// ============================================================================

/**
 * DELETE /api/teams/[teamId]
 * Archive a team (soft delete)
 * 
 * Path Parameters:
 *   - teamId: string (team ID)
 * 
 * Authorization: Club owner, SUPERADMIN
 * 
 * Returns: 200 OK with archive confirmation
 * 
 * Features:
 *   ✅ Soft delete (preserves data)
 *   ✅ Status-based archival
 *   ✅ Audit logging
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
): Promise<NextResponse<{ success: boolean; message: string; requestId: string } | { success: false; error: string; code: string; requestId: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
          code: 'AUTH_REQUIRED',
          requestId,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Validate teamId
    if (!params.teamId || typeof params.teamId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid team ID format',
          code: 'INVALID_TEAM_ID',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Fetch team
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      select: {
        id: true,
        name: true,
        status: true,
        club: { select: { ownerId: true } },
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team not found',
          code: 'TEAM_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isClubOwner = session.user.id === team.club.ownerId;

    if (!isSuperAdmin && !isClubOwner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only club owner or admin can delete teams',
          code: 'INSUFFICIENT_PERMISSIONS',
          requestId,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 5. Soft delete: set status to ARCHIVED
    const archivedTeam = await prisma.team.update({
      where: { id: params.teamId },
      data: { status: 'ARCHIVED' },
    });

    // 6. Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'TEAMARCHIVED',
      resourceType: 'Team',
      resourceId: team.id,
      details: {
        teamName: team.name,
      },
      requestId,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Team "${team.name}" has been archived successfully`,
        requestId,
      },
      { status: 200, headers: { 'X-Request-ID': requestId } }
    );
  } catch (error) {
    console.error('[DELETE /api/teams/[teamId]]', {
      teamId: params.teamId,
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}
