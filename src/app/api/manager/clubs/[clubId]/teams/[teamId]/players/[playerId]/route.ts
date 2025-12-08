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

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify player exists and is in team (via TeamPlayer relation)
    const teamPlayer = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId,
        },
      },
    });

    if (!teamPlayer) {
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
        teams: {
          where: { teamId },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...player,
      isCaptain: teamPlayer.isCaptain,
    });
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

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify player exists and is in team (via TeamPlayer relation)
    const teamPlayer = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId,
        },
      },
    });

    if (!teamPlayer) {
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
    if (body.shirtNumber !== undefined) {
      updateData.shirtNumber = body.shirtNumber;
    }
    if (body.developmentNotes !== undefined) {
      updateData.developmentNotes = body.developmentNotes;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // Handle captain assignment (only one captain per team)
    if (body.isCaptain === true) {
      // Remove captain status from all other players in team
      await prisma.teamPlayer.updateMany({
        where: {
          teamId,
          playerId: { not: playerId },
          isCaptain: true,
        },
        data: {
          isCaptain: false,
        },
      });

      // Set this player as captain
      await prisma.teamPlayer.update({
        where: {
          teamId_playerId: {
            teamId,
            playerId,
          },
        },
        data: {
          isCaptain: true,
        },
      });
    } else if (body.isCaptain === false) {
      // Remove captain status from this player
      await prisma.teamPlayer.update({
        where: {
          teamId_playerId: {
            teamId,
            playerId,
          },
        },
        data: {
          isCaptain: false,
        },
      });
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
        teams: {
          where: { teamId },
        },
      },
    });

    // Get updated TeamPlayer for captain status
    const updatedTeamPlayer = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId,
        },
      },
    });

    return NextResponse.json({
      ...updatedPlayer,
      isCaptain: updatedTeamPlayer?.isCaptain,
    });
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

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify player exists and is in team (via TeamPlayer relation)
    const teamPlayer = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId,
        },
      },
    });

    if (!teamPlayer) {
      return NextResponse.json(
        { error: 'Player not found in team' },
        { status: 404 }
      );
    }

    // Remove player from team (delete TeamPlayer relation, not the player)
    await prisma.teamPlayer.delete({
      where: {
        teamId_playerId: {
          teamId,
          playerId,
        },
      },
    });

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
