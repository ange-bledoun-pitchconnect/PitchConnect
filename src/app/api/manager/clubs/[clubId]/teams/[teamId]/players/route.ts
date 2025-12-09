/**
 * List or Add Player to Team API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/players
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/players
 *
 * GET: Retrieves all players in a team
 * POST: Adds a new player to a team
 *
 * Authorization: Only club owner can access
 *
 * Response (GET):
 * Array<{
 *   id: string,
 *   userId: string,
 *   firstName: string,
 *   lastName: string,
 *   position: string,
 *   shirtNumber: number,
 *   isCaptain: boolean,
 *   user: {id, firstName, lastName, email}
 * }>
 *
 * Request (POST):
 * {
 *   userId: string,
 *   position: string,
 *   shirtNumber: number,
 *   isCaptain: boolean
 * }
 *
 * Response (POST):
 * {
 *   id: string,
 *   userId: string,
 *   position: string,
 *   shirtNumber: number,
 *   isCaptain: boolean,
 *   user: {id, firstName, lastName, email}
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get team players via TeamPlayer relation
    const teamPlayers = await prisma.teamPlayer.findMany({
      where: { teamId },
      include: {
        player: {
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
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Transform response to include captain status from TeamPlayer
    const players = teamPlayers.map((tp) => ({
      id: tp.player.id,
      userId: tp.player.userId,
      firstName: tp.player.firstName,
      lastName: tp.player.lastName,
      position: tp.player.position,
      shirtNumber: tp.player.shirtNumber,
      isCaptain: tp.isCaptain,
      joinedAt: tp.joinedAt,
      user: tp.player.user,
    }));

    return NextResponse.json(players);
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/players error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch players',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;
    const body = await req.json();

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Validation
    if (!body.userId?.trim()) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if player already exists
    const existingPlayer = await prisma.player.findUnique({
      where: { userId: body.userId },
    });

    // Check if already on this team via TeamPlayer
    if (existingPlayer) {
      const teamPlayer = await prisma.teamPlayer.findUnique({
        where: {
          teamId_playerId: {
            teamId,
            playerId: existingPlayer.id,
          },
        },
      });

      if (teamPlayer) {
        return NextResponse.json(
          { error: 'Player already added to this team' },
          { status: 400 }
        );
      }
    }

    // Create or get player
    let player = existingPlayer;
    if (!player) {
      player = await prisma.player.create({
        data: {
          userId: body.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth || new Date('1990-01-01'),
          nationality: user.nationality || 'Unknown',
          position: body.position || 'MIDFIELDER',
          preferredFoot: body.preferredFoot || 'RIGHT',
        },
      });
    }

    // Add player to team via TeamPlayer
    const teamPlayer = await prisma.teamPlayer.create({
      data: {
        teamId,
        playerId: player.id,
        joinedAt: new Date(),
        isCaptain: body.isCaptain || false,
      },
    });

    // Return created response
    return NextResponse.json(
      {
        id: player.id,
        userId: player.userId,
        firstName: player.firstName,
        lastName: player.lastName,
        position: player.position,
        shirtNumber: player.shirtNumber,
        isCaptain: teamPlayer.isCaptain,
        joinedAt: teamPlayer.joinedAt,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'POST /api/manager/clubs/[clubId]/teams/[teamId]/players error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to add player',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
