// ============================================================================
// 🏆 ENHANCED: src/app/api/matches/[matchId]/route.ts
// GET - Match details | PATCH - Update match | DELETE - Cancel match
// VERSION: 3.5 - World-Class Enhanced
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, validateStringLength } from '@/lib/api/validation';
import { errorResponse } from '@/lib/api/responses';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors';
import { logResourceUpdated, createAuditLog } from '@/lib/api/audit';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TeamInfo {
  id: string;
  name: string;
  shortCode: string;
  logo: string | null;
  colors: Record<string, any>;
}

interface PlayerInfo {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  number?: number;
  isCaptain?: boolean;
}

interface MatchDetailResponse {
  success: true;
  id: string;
  status: string;
  sport: string;
  date: string;
  kickOffTime: string | null;
  venue: string | null;
  venueCity: string | null;
  attendance: number | null;
  homeTeam: TeamInfo & {
    club: { id: string; name: string; location: string };
    squad: {
      total: number;
      captain: PlayerInfo | null;
      players: PlayerInfo[];
    };
  };
  awayTeam: TeamInfo & {
    club: { id: string; name: string; location: string };
    squad: {
      total: number;
      captain: PlayerInfo | null;
      players: PlayerInfo[];
    };
  };
  score: {
    homeGoals: number | null;
    awayGoals: number | null;
    result: string;
    homeGoalsET: number | null;
    awayGoalsET: number | null;
    homePenalties: number | null;
    awayPenalties: number | null;
  };
  referee: {
    id: string;
    name: string;
    licenseNumber: string;
    licenseLevel: string;
  } | null;
  fixture: {
    id: string;
    matchweek: number;
    season: number;
    league: { id: string; name: string };
  } | null;
  events: {
    total: number;
    byType: Record<string, number>;
  };
  statistics: {
    possession: { home: number | null; away: number | null };
    shots: { home: number | null; away: number | null };
    passing: {
      home: { total: number | null; accuracy: number | null };
      away: { total: number | null; accuracy: number | null };
    };
    fouls: { home: number | null; away: number | null };
    corners: { home: number | null; away: number | null };
  };
  timestamp: string;
  requestId: string;
}

interface UpdateMatchRequest {
  status?: string;
  homeGoals?: number;
  awayGoals?: number;
  homeGoalsET?: number;
  awayGoalsET?: number;
  homePenalties?: number;
  awayPenalties?: number;
  attendance?: number;
  venue?: string;
  notes?: string;
}

interface UpdateMatchResponse {
  success: true;
  id: string;
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    homeGoals: number | null;
    awayGoals: number | null;
  };
  updatedAt: string;
  message: string;
  changedFields: string[];
  timestamp: string;
  requestId: string;
}

// ============================================================================
// GET /api/matches/[matchId] - Get Match Details
// ============================================================================

/**
 * GET /api/matches/[matchId]
 * Get complete match information including squads, statistics, and events
 * 
 * Path Parameters:
 *   - matchId: string (match ID)
 * 
 * Authorization: Any authenticated user
 * 
 * Returns: 200 OK with comprehensive match data
 * 
 * Response includes:
 *   - Match info (date, venue, status)
 *   - Team squads with player details
 *   - Match score and result
 *   - Referee information
 *   - Match statistics
 *   - Match events
 * 
 * Features:
 *   ✅ Complete team rosters
 *   ✅ Player information with numbers
 *   ✅ Comprehensive statistics
 *   ✅ Event tracking
 *   ✅ Request tracking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
): Promise<NextResponse<MatchDetailResponse | { success: false; error: string; code: string; requestId: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

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

    // 2. Validate matchId
    if (!params.matchId || typeof params.matchId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid match ID format',
          code: 'INVALID_MATCH_ID',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Fetch match with comprehensive data
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            logo: true,
            colors: true,
            members: {
              where: { status: 'ACTIVE' },
              select: {
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
              orderBy: { number: 'asc' },
            },
            club: { select: { id: true, name: true, city: true, country: true } },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            logo: true,
            colors: true,
            members: {
              where: { status: 'ACTIVE' },
              select: {
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
              orderBy: { number: 'asc' },
            },
            club: { select: { id: true, name: true, city: true, country: true } },
          },
        },
        referee: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
            licenseNumber: true,
            licenseLevel: true,
          },
        },
        fixture: {
          select: {
            id: true,
            matchweek: true,
            season: true,
            league: { select: { id: true, name: true } },
          },
        },
        events: {
          select: {
            type: true,
          },
          orderBy: { minute: 'asc' },
        },
        stats: {
          select: {
            homePossession: true,
            awayPossession: true,
            homeShots: true,
            awayShots: true,
            homePasses: true,
            homePassAccuracy: true,
            awayPasses: true,
            awayPassAccuracy: true,
            homeFouls: true,
            awayFouls: true,
            homeCorners: true,
            awayCorners: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: 'Match not found',
          code: 'MATCH_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Calculate match result
    const homeGoals = match.homeGoals || 0;
    const awayGoals = match.awayGoals || 0;
    let result = 'PENDING';

    if (match.status === 'FINISHED') {
      if (homeGoals > awayGoals) result = 'HOME_WIN';
      else if (awayGoals > homeGoals) result = 'AWAY_WIN';
      else result = 'DRAW';
    }

    // 5. Count events by type
    const eventCounts: Record<string, number> = {};
    match.events.forEach((event) => {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    });

    // 6. Format team data
    const formatTeamInfo = (team: any) => ({
      id: team.id,
      name: team.name,
      shortCode: team.shortCode,
      logo: team.logo,
      colors: team.colors,
      club: {
        id: team.club.id,
        name: team.club.name,
        location: `${team.club.city || 'Unknown'}, ${team.club.country}`,
      },
      squad: {
        total: team.members.length,
        captain: team.members.find((m: any) => m.isCaptain)
          ? {
              id: team.members.find((m: any) => m.isCaptain)!.userId,
              firstName: team.members.find((m: any) => m.isCaptain)!.user.firstName,
              lastName: team.members.find((m: any) => m.isCaptain)!.user.lastName,
              fullName: `${team.members.find((m: any) => m.isCaptain)!.user.firstName} ${
                team.members.find((m: any) => m.isCaptain)!.user.lastName
              }`,
              avatar: team.members.find((m: any) => m.isCaptain)!.user.avatar,
              isCaptain: true,
            }
          : null,
        players: team.members.map((m: any) => ({
          id: m.userId,
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          fullName: `${m.user.firstName} ${m.user.lastName}`,
          avatar: m.user.avatar,
          number: m.number,
          isCaptain: m.isCaptain,
        })),
      },
    });

    // 7. Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'MATCHVIEWED',
      resourceType: 'Match',
      resourceId: match.id,
      details: {
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
      },
      requestId,
    });

    // 8. Build response
    const response: MatchDetailResponse = {
      success: true,
      id: match.id,
      status: match.status,
      sport: match.sport,
      date: match.date.toISOString(),
      kickOffTime: match.kickOffTime?.toISOString() || null,
      venue: match.venue,
      venueCity: match.venueCity,
      attendance: match.attendance,
      homeTeam: formatTeamInfo(match.homeTeam),
      awayTeam: formatTeamInfo(match.awayTeam),
      score: {
        homeGoals,
        awayGoals,
        result,
        homeGoalsET: match.homeGoalsET,
        awayGoalsET: match.awayGoalsET,
        homePenalties: match.homePenalties,
        awayPenalties: match.awayPenalties,
      },
      referee: match.referee
        ? {
            id: match.referee.id,
            name: `${match.referee.user.firstName} ${match.referee.user.lastName}`,
            licenseNumber: match.referee.licenseNumber,
            licenseLevel: match.referee.licenseLevel,
          }
        : null,
      fixture: match.fixture
        ? {
            id: match.fixture.id,
            matchweek: match.fixture.matchweek,
            season: match.fixture.season,
            league: match.fixture.league,
          }
        : null,
      events: {
        total: match.events.length,
        byType: eventCounts,
      },
      statistics: {
        possession: {
          home: match.stats?.homePossession,
          away: match.stats?.awayPossession,
        },
        shots: {
          home: match.stats?.homeShots,
          away: match.stats?.awayShots,
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
      },
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[GET /api/matches/[matchId]]', {
      matchId: params.matchId,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}

// ============================================================================
// PATCH /api/matches/[matchId] - Update Match
// ============================================================================

/**
 * PATCH /api/matches/[matchId]
 * Update match details and score
 * 
 * Authorization: SUPERADMIN, LEAGUE_ADMIN, REFEREE
 * 
 * Request Body (all optional):
 *   - status: string (SCHEDULED, LIVE, FINISHED, CANCELLED)
 *   - homeGoals: number
 *   - awayGoals: number
 *   - homeGoalsET: number
 *   - awayGoalsET: number
 *   - homePenalties: number
 *   - awayPenalties: number
 *   - attendance: number
 *   - venue: string
 *   - notes: string
 * 
 * Returns: 200 OK with updated match
 * 
 * Features:
 *   ✅ Score updates only for LIVE/FINISHED matches
 *   ✅ Change tracking
 *   ✅ Transaction support
 *   ✅ Comprehensive audit logging
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { matchId: string } }
): Promise<NextResponse<UpdateMatchResponse | { success: false; error: string; code: string; requestId: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

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

    // 2. Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN');
    const isReferee = session.user.roles?.includes('REFEREE');

    if (!isSuperAdmin && !isLeagueAdmin && !isReferee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only SUPERADMIN, LEAGUE_ADMIN, or REFEREE can update matches',
          code: 'INSUFFICIENT_PERMISSIONS',
          requestId,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Validate matchId
    if (!params.matchId || typeof params.matchId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid match ID format',
          code: 'INVALID_MATCH_ID',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Parse request body
    let body: UpdateMatchRequest;
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

    // 5. Fetch current match
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      select: {
        id: true,
        status: true,
        homeGoals: true,
        awayGoals: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: 'Match not found',
          code: 'MATCH_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 6. Validate score updates only for LIVE/FINISHED matches
    if ((body.homeGoals !== undefined || body.awayGoals !== undefined) && !['LIVE', 'FINISHED', 'HALFTIME'].includes(match.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Can only update score for LIVE, HALFTIME, or FINISHED matches',
          code: 'INVALID_MATCH_STATUS',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 7. Track changes
    const allowedFields = ['status', 'homeGoals', 'awayGoals', 'homeGoalsET', 'awayGoalsET', 'homePenalties', 'awayPenalties', 'attendance', 'venue', 'notes'];
    const changes: Record<string, { old: any; new: any }> = {};
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (field in body && body[field as keyof UpdateMatchRequest] !== undefined) {
        const oldValue = (match as any)[field];
        let newValue = (body as any)[field];

        // Type coercion for numeric fields
        if (['homeGoals', 'awayGoals', 'homeGoalsET', 'awayGoalsET', 'homePenalties', 'awayPenalties', 'attendance'].includes(field)) {
          newValue = parseInt(newValue, 10);
          if (isNaN(newValue) || newValue < 0) {
            return NextResponse.json(
              {
                success: false,
                error: `${field} must be a positive number`,
                code: 'INVALID_INPUT',
                requestId,
              },
              { status: 400, headers: { 'X-Request-ID': requestId } }
            );
          }
        }

        if (oldValue !== newValue) {
          changes[field] = { old: oldValue, new: newValue };
          updateData[field] = newValue;
        }
      }
    }

    // 8. Check if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          id: match.id,
          status: match.status,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          score: { homeGoals: match.homeGoals, awayGoals: match.awayGoals },
          updatedAt: new Date().toISOString(),
          message: 'No changes provided',
          changedFields: [],
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 200, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 9. Update match with transaction
    const updatedMatch = await prisma.$transaction(async (tx) => {
      return await tx.match.update({
        where: { id: params.matchId },
        data: updateData,
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      });
    });

    // 10. Create audit log
    await logResourceUpdated(
      session.user.id,
      'Match',
      match.id,
      `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      changes,
      `Updated match score/details`
    );

    // 11. Build response
    const response: UpdateMatchResponse = {
      success: true,
      id: updatedMatch.id,
      status: updatedMatch.status,
      homeTeam: updatedMatch.homeTeam,
      awayTeam: updatedMatch.awayTeam,
      score: {
        homeGoals: updatedMatch.homeGoals,
        awayGoals: updatedMatch.awayGoals,
      },
      updatedAt: updatedMatch.updatedAt.toISOString(),
      message: `Match updated successfully`,
      changedFields: Object.keys(changes),
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error('[PATCH /api/matches/[matchId]]', {
      matchId: params.matchId,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}

// ============================================================================
// DELETE /api/matches/[matchId] - Cancel Match
// ============================================================================

/**
 * DELETE /api/matches/[matchId]
 * Cancel a match (soft delete via status change)
 * 
 * Authorization: SUPERADMIN, LEAGUE_ADMIN
 * 
 * Returns: 200 OK with cancellation confirmation
 * 
 * Features:
 *   ✅ Status-based cancellation
 *   ✅ Only SCHEDULED/POSTPONED matches can be cancelled
 *   ✅ Audit logging
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { matchId: string } }
): Promise<NextResponse<{ success: boolean; message: string; requestId: string } | { success: false; error: string; code: string; requestId: string }>> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

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

    // 2. Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN');

    if (!isSuperAdmin && !isLeagueAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only SUPERADMIN or LEAGUE_ADMIN can cancel matches',
          code: 'INSUFFICIENT_PERMISSIONS',
          requestId,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Validate matchId
    if (!params.matchId || typeof params.matchId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid match ID format',
          code: 'INVALID_MATCH_ID',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Fetch match
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
      return NextResponse.json(
        {
          success: false,
          error: 'Match not found',
          code: 'MATCH_NOT_FOUND',
          requestId,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 5. Verify match can be cancelled
    if (!['SCHEDULED', 'POSTPONED'].includes(match.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Can only cancel SCHEDULED or POSTPONED matches. Current status: ${match.status}`,
          code: 'INVALID_MATCH_STATUS',
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 6. Cancel match
    const cancelledMatch = await prisma.match.update({
      where: { id: params.matchId },
      data: { status: 'CANCELLED' },
    });

    // 7. Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'MATCHCANCELLED',
      resourceType: 'Match',
      resourceId: match.id,
      details: {
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        previousStatus: match.status,
      },
      requestId,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Match "${match.homeTeam.name} vs ${match.awayTeam.name}" has been cancelled successfully`,
        requestId,
      },
      { status: 200, headers: { 'X-Request-ID': requestId } }
    );
  } catch (error) {
    console.error('[DELETE /api/matches/[matchId]]', {
      matchId: params.matchId,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return errorResponse(error as Error, {
      headers: { 'X-Request-ID': requestId },
    });
  }
}
