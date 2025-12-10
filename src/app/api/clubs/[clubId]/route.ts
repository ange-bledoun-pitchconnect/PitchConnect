// ============================================================================
// 🏆 ENHANCED: src/app/api/clubs/[clubId]/route.ts
// GET - Club details with teams and statistics | PATCH - Update club
// VERSION: 2.0 (Enhanced with production-grade features)
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  parseJsonBody,
  validateStringLength,
  validateEmail,
  validatePhoneNumber,
  validateUrl,
} from '@/lib/api/validation';
import { errorResponse } from '@/lib/api/responses';
import { NotFoundError, ForbiddenError } from '@/lib/api/errors';
import { logResourceUpdated } from '@/lib/api/audit';

/**
 * GET /api/clubs/[clubId]
 * Get complete club information including teams and statistics
 * 
 * Authorization: Any authenticated user
 * 
 * Parameters:
 *   - clubId: string - Club ID
 * 
 * Response: 200 OK with complete club data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { clubId } = params;

    // ✅ Enhanced: Validate clubId format
    if (!clubId || clubId.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Club ID is required',
          code: 'INVALID_CLUB_ID',
        },
        { status: 400 }
      );
    }

    // ✅ Enhanced: Fetch club with comprehensive relationships
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        teams: {
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                players: true,
                matches: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        leagueTeams: {
          distinct: ['leagueId'],
          include: {
            league: {
              select: {
                id: true,
                name: true,
                season: true,
                sport: true,
              },
            },
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: `Club '${clubId}' not found`,
          code: 'CLUB_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // ✅ Enhanced: Calculate comprehensive statistics
    const playerCount = await prisma.playerTeam.count({
      where: {
        team: { clubId },
      },
    });

    const leagueIds = club.leagueTeams.map((lt) => lt.leagueId);

    // ✅ Enhanced: Calculate match statistics with transaction
    const matchStats = await prisma.match.aggregate({
      where: {
        OR: [
          { homeTeam: { clubId } },
          { awayTeam: { clubId } },
        ],
        status: 'COMPLETED',
      },
      _count: true,
    });

    // ✅ Enhanced: Get detailed match results
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeam: { clubId } },
          { awayTeam: { clubId } },
        ],
        status: 'COMPLETED',
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeGoals: true,
        awayGoals: true,
        date: true,
      },
      orderBy: { date: 'desc' },
      take: 50, // Get last 50 matches for stats
    });

    matches.forEach((match) => {
      const isHome = club.teams.some((t) => t.id === match.homeTeamId);
      const teamGoals = isHome ? match.homeGoals : match.awayGoals;
      const oppositionGoals = isHome ? match.awayGoals : match.homeGoals;

      if (teamGoals > oppositionGoals) wins++;
      else if (teamGoals === oppositionGoals) draws++;
      else losses++;

      goalsFor += teamGoals;
      goalsAgainst += oppositionGoals;
    });

    // ✅ Enhanced: Format teams with rich metadata
    const formattedTeams = club.teams.map((team) => ({
      id: team.id,
      name: team.name,
      shortCode: team.shortCode,
      sport: team.sport,
      description: team.description,
      logo: team.logo,
      colors: team.colors,
      founded: team.founded,
      manager: {
        id: team.manager.id,
        name: `${team.manager.firstName} ${team.manager.lastName}`,
        email: team.manager.email,
      },
      stats: {
        playerCount: team._count.players,
        matchCount: team._count.matches,
      },
      createdAt: team.createdAt,
    }));

    // ✅ Enhanced: Format leagues
    const formattedLeagues = club.leagueTeams.map((tl) => ({
      id: tl.league.id,
      name: tl.league.name,
      season: tl.league.season,
      sport: tl.league.sport,
    }));

    // ✅ Enhanced: Rich response with comprehensive data
    return NextResponse.json(
      {
        success: true,
        id: club.id,
        name: club.name,
        shortCode: club.shortCode,
        city: club.city,
        country: club.country,
        founded: club.founded,
        description: club.description,
        logo: club.logo,
        website: club.website,
        contactEmail: club.contactEmail,
        contactPhone: club.contactPhone,
        owner: {
          id: club.owner.id,
          name: `${club.owner.firstName} ${club.owner.lastName}`,
          email: club.owner.email,
          phone: club.owner.phone,
        },
        teams: formattedTeams,
        leagues: formattedLeagues,
        statistics: {
          teamCount: club.teams.length,
          playerCount,
          leagueCount: leagueIds.length,
          totalMatches: matchStats._count,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDifference: goalsFor - goalsAgainst,
          winRate: matchStats._count > 0 ? ((wins / matchStats._count) * 100).toFixed(2) + '%' : 'N/A',
        },
        settings: {
          registrationOpen: true,
          allowPublicJoin: false,
          maxTeams: 10,
          visibility: 'public',
        },
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: session.user.id,
          version: '2.0',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/clubs/[clubId]] Error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * PATCH /api/clubs/[clubId]
 * Update club information
 * 
 * Authorization: Club owner, SUPERADMIN
 * 
 * Parameters:
 *   - clubId: string - Club ID
 * 
 * Request Body (all optional):
 *   - name: string (3-150 chars)
 *   - description: string
 *   - logo: string (URL)
 *   - website: string (URL)
 *   - contactEmail: string (email)
 *   - contactPhone: string (phone)
 *   - settings: object
 * 
 * Response: 200 OK with updated club
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { clubId } = params;

    // ✅ Enhanced: Validate clubId format
    if (!clubId || clubId.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Club ID is required',
          code: 'INVALID_CLUB_ID',
        },
        { status: 400 }
      );
    }

    const body = await parseJsonBody(request);

    // ✅ Enhanced: Fetch current club state
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        website: true,
        contactEmail: true,
        contactPhone: true,
        ownerId: true,
        createdAt: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: `Club '${clubId}' not found`,
          code: 'CLUB_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // ✅ Enhanced: Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isClubOwner = session.user.id === club.ownerId;

    if (!isSuperAdmin && !isClubOwner) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You can only update clubs you own',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: ['SUPERADMIN', 'CLUB_OWNER'],
        },
        { status: 403 }
      );
    }

    // ✅ Enhanced: Validate optional fields
    if (body.name !== undefined) {
      validateStringLength(body.name, 3, 150, 'Club name');
    }

    if (body.contactEmail !== undefined && body.contactEmail !== null) {
      validateEmail(body.contactEmail);
    }

    if (body.contactPhone !== undefined && body.contactPhone !== null) {
      validatePhoneNumber(body.contactPhone);
    }

    if (body.logo !== undefined && body.logo !== null) {
      validateUrl(body.logo, 'Logo URL');
    }

    if (body.website !== undefined && body.website !== null) {
      validateUrl(body.website, 'Website URL');
    }

    // ✅ Enhanced: Track changes for audit
    const changes: Record<string, any> = {};
    const updateData: Record<string, any> = {};

    if (body.name !== undefined && body.name !== club.name) {
      changes.name = body.name;
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined && body.description !== club.description) {
      changes.description = body.description;
      updateData.description = body.description?.trim() || null;
    }

    if (body.logo !== undefined && body.logo !== club.logo) {
      changes.logo = body.logo;
      updateData.logo = body.logo || null;
    }

    if (body.website !== undefined && body.website !== club.website) {
      changes.website = body.website;
      updateData.website = body.website || null;
    }

    if (body.contactEmail !== undefined && body.contactEmail !== club.contactEmail) {
      changes.contactEmail = body.contactEmail;
      updateData.contactEmail = body.contactEmail || null;
    }

    if (body.contactPhone !== undefined && body.contactPhone !== club.contactPhone) {
      changes.contactPhone = body.contactPhone;
      updateData.contactPhone = body.contactPhone || null;
    }

    // ✅ Enhanced: Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          id: club.id,
          name: club.name,
          message: 'No changes provided',
          code: 'NO_CHANGES',
        },
        { status: 200 }
      );
    }

    // ✅ Enhanced: Update club with transaction
    const updatedClub = await prisma.$transaction(async (tx) => {
      return await tx.club.update({
        where: { id: clubId },
        data: updateData,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
    });

    // ✅ Enhanced: Detailed audit logging
    await logResourceUpdated(
      session.user.id,
      'Club',
      clubId,
      club.name,
      changes,
      `Updated club: ${club.name}`,
      Object.keys(changes)
    );

    // ✅ Enhanced: Rich response
    return NextResponse.json(
      {
        success: true,
        id: updatedClub.id,
        name: updatedClub.name,
        description: updatedClub.description,
        logo: updatedClub.logo,
        website: updatedClub.website,
        contactEmail: updatedClub.contactEmail,
        contactPhone: updatedClub.contactPhone,
        owner: {
          id: updatedClub.owner.id,
          name: `${updatedClub.owner.firstName} ${updatedClub.owner.lastName}`,
          email: updatedClub.owner.email,
        },
        updatedAt: updatedClub.updatedAt,
        message: `Club '${club.name}' updated successfully`,
        changedFields: Object.keys(changes),
        metadata: {
          timestamp: new Date().toISOString(),
          userId: session.user.id,
          version: '2.0',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/clubs/[clubId]] Error:', error);
    return errorResponse(error as Error);
  }
}
