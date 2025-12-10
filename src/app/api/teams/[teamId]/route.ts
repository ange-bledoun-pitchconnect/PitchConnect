// ============================================================================
// src/app/api/teams/[teamId]/route.ts
// GET - Team details with full roster | PATCH - Update team information
// ALIGNED WITH: Your Prisma schema (Team relationships)
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  parseJsonBody,
  validateStringLength,
  validateHexColor,
  validateUrl,
} from '@/lib/api/validation';
import { errorResponse } from '@/lib/api/responses';
import { NotFoundError, ForbiddenError } from '@/lib/api/errors';
import { logResourceUpdated } from '@/lib/api/audit';

/**
 * GET /api/teams/[teamId]
 * Get complete team information including roster and statistics
 * 
 * Returns: 200 OK with team details
 * Authorization: Any authenticated user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Fetch team with all relationships
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            logo: true,
            founded: true,
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
        players: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                photo: true,
                dateOfBirth: true,
              },
            },
          },
          orderBy: { jerseyNumber: 'asc' },
        },
        matches: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            homeGoals: true,
            awayGoals: true,
            date: true,
          },
        },
        leagues: {
          select: {
            league: {
              select: {
                id: true,
                name: true,
                season: true,
              },
            },
          },
        },
        standings: {
          select: {
            position: true,
            played: true,
            wins: true,
            draws: true,
            losses: true,
            goalsFor: true,
            goalsAgainst: true,
            points: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError(`Team '${teamId}' not found`);
    }

    // Calculate statistics
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

    team.matches.forEach((match) => {
      const isHome = match.homeTeamId === teamId;
      const teamGoals = isHome ? match.homeGoals : match.awayGoals;
      const oppositionGoals = isHome ? match.awayGoals : match.homeGoals;

      if (teamGoals > oppositionGoals) wins++;
      else if (teamGoals === oppositionGoals) draws++;
      else losses++;

      goalsFor += teamGoals;
      goalsAgainst += oppositionGoals;
    });

    // Format roster
    const roster = team.players.map((pt) => ({
      id: pt.player.id,
      firstName: pt.player.firstName,
      lastName: pt.player.lastName,
      position: pt.player.position,
      jerseyNumber: pt.jerseyNumber,
      photo: pt.player.photo,
      dateOfBirth: pt.player.dateOfBirth,
      joinDate: pt.joinDate,
      role: pt.role,
    }));

    // Format standings from relationship
    const standings = team.standings[0] || {
      position: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    };

    // Format leagues
    const leagues = team.leagues.map((tl) => ({
      id: tl.league.id,
      name: tl.league.name,
      season: tl.league.season,
      position: standings.position,
      points: standings.points,
    }));

    return NextResponse.json(
      {
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
        roster,
        statistics: {
          playerCount: roster.length,
          matchesPlayed: team.matches.length,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDifference: goalsFor - goalsAgainst,
          points: wins * 3 + draws,
        },
        standings: {
          position: standings.position,
          played: standings.played,
          wins: standings.wins,
          draws: standings.draws,
          losses: standings.losses,
          goalsFor: standings.goalsFor,
          goalsAgainst: standings.goalsAgainst,
          goalDifference: standings.goalsFor - standings.goalsAgainst,
          points: standings.points,
        },
        leagues,
        createdAt: team.createdAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/teams/[teamId]] Error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * PATCH /api/teams/[teamId]
 * Update team information
 * 
 * Request Body:
 *   Optional:
 *     - name: string (3-100 chars)
 *     - description: string
 *     - managerId: string
 *     - logo: string (URL)
 *     - colors: { primary: hex, secondary: hex }
 * 
 * Authorization: Team manager, Club owner, SUPERADMIN
 * Returns: 200 OK
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;
    const body = await parseJsonBody(request);

    // Fetch team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: { select: { id: true, ownerId: true, name: true } },
        manager: { select: { id: true } },
      },
    });

    if (!team) {
      throw new NotFoundError(`Team '${teamId}' not found`);
    }

    // Authorization check
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    const isTeamManager = session.user.id === team.managerId;
    const isClubOwner = session.user.id === team.club.ownerId;

    if (!isSuperAdmin && !isTeamManager && !isClubOwner) {
      throw new ForbiddenError(
        'You can only update teams you manage or clubs you own'
      );
    }

    // Validate optional updates
    if (body.name !== undefined) {
      validateStringLength(body.name, 3, 100, 'Team name');
    }

    if (body.colors) {
      if (body.colors.primary)
        validateHexColor(body.colors.primary, 'Primary color');
      if (body.colors.secondary)
        validateHexColor(body.colors.secondary, 'Secondary color');
    }

    if (body.logo) validateUrl(body.logo, 'Logo URL');

    // Verify manager if updating
    if (body.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: body.managerId },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!manager) {
        throw new NotFoundError('Manager not found');
      }
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: body.name !== undefined ? body.name.trim() : team.name,
        description: body.description !== undefined ? body.description : team.description,
        managerId: body.managerId || team.managerId,
        logo: body.logo !== undefined ? body.logo : team.logo,
        colors: body.colors !== undefined ? body.colors : team.colors,
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Log audit trail
    const changes: Record<string, any> = {};
    if (body.name !== undefined && body.name !== team.name) changes.name = body.name;
    if (body.description !== undefined && body.description !== team.description)
      changes.description = body.description;
    if (body.managerId && body.managerId !== team.managerId)
      changes.managerId = body.managerId;
    if (body.logo !== undefined && body.logo !== team.logo) changes.logo = body.logo;

    await logResourceUpdated(
      session.user.id,
      'Team',
      teamId,
      team.name,
      changes,
      `Updated team: ${team.name}`,
      Object.keys(changes)
    );

    return NextResponse.json(
      {
        id: updatedTeam.id,
        name: updatedTeam.name,
        description: updatedTeam.description,
        managerId: updatedTeam.managerId,
        manager: {
          id: updatedTeam.manager.id,
          name: `${updatedTeam.manager.firstName} ${updatedTeam.manager.lastName}`,
        },
        logo: updatedTeam.logo,
        colors: updatedTeam.colors,
        message: 'Team updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/teams/[teamId]] Error:', error);
    return errorResponse(error as Error);
  }
}
