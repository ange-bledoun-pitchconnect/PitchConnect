/**
 * Get, Update, or Delete Team API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]
 * PATCH /api/manager/clubs/[clubId]/teams/[teamId]
 * DELETE /api/manager/clubs/[clubId]/teams/[teamId]
 *
 * GET: Retrieves team details including players and coaches
 * PATCH: Updates team information
 * DELETE: Deletes a team (only if no players)
 *
 * Authorization: Only club owner can access
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

    // Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get player count via raw SQL
    const playerCount: any = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "PlayerTeam" WHERE "teamId" = ${teamId}
    `;

    // Get team players via raw SQL
    const teamPlayerIds: any[] = await prisma.$queryRaw`
      SELECT DISTINCT "playerId" FROM "PlayerTeam" WHERE "teamId" = ${teamId}
    `;

    let players: any[] = [];
    if (teamPlayerIds && teamPlayerIds.length > 0) {
      const playerIds = teamPlayerIds.map((tp) => tp.playerId);
      players = await prisma.player.findMany({
        where: { id: { in: playerIds } },
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
    }

    return NextResponse.json({
      ...team,
      playerCount: playerCount[0]?.count || 0,
      players,
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Build update data - only include provided fields
    const updateData: any = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.category !== undefined) {
      updateData.category = body.category;
    }
    if (body.season !== undefined) {
      updateData.season = body.season;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
    });

    // Get player count via raw SQL
    const playerCount: any = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "PlayerTeam" WHERE "teamId" = ${teamId}
    `;

    return NextResponse.json({
      ...updatedTeam,
      playerCount: playerCount[0]?.count || 0,
    });
  } catch (error) {
    console.error(
      'PATCH /api/manager/clubs/[clubId]/teams/[teamId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to update team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get player count via raw SQL
    const playerCount: any = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "PlayerTeam" WHERE "teamId" = ${teamId}
    `;

    // Check if team has players
    if (playerCount[0]?.count > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete team with existing players. Remove all players first.',
          playerCount: playerCount[0]?.count,
        },
        { status: 400 }
      );
    }

    // Delete team
    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error(
      'DELETE /api/manager/clubs/[clubId]/teams/[teamId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to delete team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
