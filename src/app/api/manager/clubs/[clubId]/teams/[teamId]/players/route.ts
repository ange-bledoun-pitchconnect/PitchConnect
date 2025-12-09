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
 *   user: {id, firstName, lastName, email}
 * }>
 *
 * Request (POST):
 * {
 *   userId: string,
 *   position: string
 * }
 *
 * Response (POST):
 * {
 *   id: string,
 *   userId: string,
 *   position: string,
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

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get team players via PlayerTeam relation (raw SQL)
    const teamPlayerIds: any[] = await prisma.$queryRaw`
      SELECT DISTINCT "playerId" FROM "PlayerTeam" WHERE "teamId" = ${teamId}
    `;

    if (!teamPlayerIds || teamPlayerIds.length === 0) {
      return NextResponse.json([]);
    }

    const playerIds = teamPlayerIds.map((tp) => tp.playerId);

    // Get player details
    const players = await prisma.player.findMany({
      where: {
        id: { in: playerIds },
      },
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
      orderBy: { user: { firstName: 'asc' } },
    });

    // Transform response
    const response = players.map((player) => ({
      id: player.id,
      userId: player.userId,
      firstName: player.user.firstName,
      lastName: player.user.lastName,
      position: player.position,
      user: player.user,
    }));

    return NextResponse.json(response);
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

    // Verify team exists and belongs to club
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

    // Check if already on this team via PlayerTeam (raw SQL)
    if (existingPlayer) {
      const teamPlayer = await prisma.$queryRaw`
        SELECT * FROM "PlayerTeam" WHERE "playerId" = ${existingPlayer.id} AND "teamId" = ${teamId}
      `;

      if (teamPlayer && Array.isArray(teamPlayer) && teamPlayer.length > 0) {
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
          firstName: user.firstName || 'Unknown',
          lastName: user.lastName || 'Unknown',
          dateOfBirth: user.dateOfBirth || new Date('1990-01-01'),
          nationality: user.nationality || 'Unknown',
          position: body.position || 'MIDFIELDER',
          preferredFoot: body.preferredFoot || 'RIGHT',
          status: 'ACTIVE',
        },
      });
    }

    // Add player to team via PlayerTeam (raw SQL insert)
    await prisma.$executeRaw`
      INSERT INTO "PlayerTeam" ("playerId", "teamId", "joinedAt")
      VALUES (${player.id}, ${teamId}, NOW())
      ON CONFLICT DO NOTHING
    `;

    // Return created response
    return NextResponse.json(
      {
        id: player.id,
        userId: player.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        position: player.position,
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
