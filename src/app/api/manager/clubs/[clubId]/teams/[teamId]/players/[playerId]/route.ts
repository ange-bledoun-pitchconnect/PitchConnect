// src/app/api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId]/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; playerId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, playerId } = params;

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Verify access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get player
    const player = await prisma.player.findUnique({
      where: { id: playerId },
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

    if (!player || player.teamId !== teamId) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId] error:', error);
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
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, playerId } = params;
    const body = await req.json();

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Verify access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get player
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player || player.teamId !== teamId) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Handle captain assignment (only one captain per team)
    let updateData: any = {
      position: body.position !== undefined ? body.position : undefined,
      jerseyNumber: body.jerseyNumber !== undefined ? body.jerseyNumber : undefined,
      isCaptain: body.isCaptain !== undefined ? body.isCaptain : undefined,
    };

    // If making this player captain, remove captain from others
    if (body.isCaptain === true) {
      await prisma.player.updateMany({
        where: {
          teamId,
          isCaptain: true,
          id: { not: playerId },
        },
        data: {
          isCaptain: false,
        },
      });
    }

    // Update player
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
          },
        },
      },
    });

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error('PATCH /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId] error:', error);
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
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; playerId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, playerId } = params;

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Verify access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get player
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player || player.teamId !== teamId) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Delete player
    await prisma.player.delete({
      where: { id: playerId },
    });

    return NextResponse.json({
      success: true,
      message: 'Player removed from team successfully',
    });
  } catch (error) {
    console.error('DELETE /api/manager/clubs/[clubId]/teams/[teamId]/players/[playerId] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove player',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
