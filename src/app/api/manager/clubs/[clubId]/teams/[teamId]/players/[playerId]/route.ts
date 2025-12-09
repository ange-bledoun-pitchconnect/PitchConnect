/**
 * Get, Update, or Delete Player API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId]
 * PATCH /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId]
 * DELETE /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId]
 *
 * GET: Retrieves player details including stats and achievements
 * PATCH: Updates player information (position, shirt number, etc.)
 * DELETE: Removes player from team
 *
 * Authorization: Only club owner can access
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; playerId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, playerId } = params;

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

    // Verify player exists and is in team (via PlayerTeam relation)
    const playerTeam = await prisma.$queryRaw`
      SELECT * FROM "PlayerTeam" WHERE "playerId" = ${playerId} AND "teamId" = ${teamId}
    `;

    if (!playerTeam || (Array.isArray(playerTeam) && playerTeam.length === 0)) {
      return NextResponse.json(
        { error: 'Player not found in team' },
        { status: 404 }
      );
    }

    // Get player details
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            dateOfBirth: true,
          },
        },
        stats: {
          where: { season: new Date().getFullYear() },
        },
        achievements: true,
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch player',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; playerId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, playerId } = params;
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

    // Verify player exists and is in team (via PlayerTeam relation)
    const playerTeam = await prisma.$queryRaw`
      SELECT * FROM "PlayerTeam" WHERE "playerId" = ${playerId} AND "teamId" = ${teamId}
    `;

    if (!playerTeam || (Array.isArray(playerTeam) && playerTeam.length === 0)) {
      return NextResponse.json(
        { error: 'Player not found in team' },
        { status: 404 }
      );
    }

    // Build update data - only include provided fields
    const updateData: any = {};

    if (body.position !== undefined) {
      updateData.position = body.position;
    }
    if (body.developmentNotes !== undefined) {
      updateData.developmentNotes = body.developmentNotes;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // Update player details
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        stats: {
          where: { season: new Date().getFullYear() },
        },
        achievements: true,
      },
    });

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error(
      'PATCH /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to update player',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; playerId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, playerId } = params;

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

    // Verify player exists and is in team (via PlayerTeam relation)
    const playerTeam = await prisma.$queryRaw`
      SELECT * FROM "PlayerTeam" WHERE "playerId" = ${playerId} AND "teamId" = ${teamId}
    `;

    if (!playerTeam || (Array.isArray(playerTeam) && playerTeam.length === 0)) {
      return NextResponse.json(
        { error: 'Player not found in team' },
        { status: 404 }
      );
    }

    // Remove player from team (delete PlayerTeam relation, not the player)
    await prisma.$executeRaw`
      DELETE FROM "PlayerTeam" WHERE "playerId" = ${playerId} AND "teamId" = ${teamId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Player removed from team successfully',
    });
  } catch (error) {
    console.error(
      'DELETE /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to remove player',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
