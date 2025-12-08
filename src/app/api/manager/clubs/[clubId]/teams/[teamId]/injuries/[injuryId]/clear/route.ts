/**
 * Clear Player Injury API
 *
 * PATCH /api/manager/clubs/[clubId]/teams/[teamId]/injuries/[injuryId]/clear
 *
 * Marks a player injury as cleared/recovered. Sets the injury status to CLEARED
 * and records the clearance date.
 *
 * Authorization: Only club owner can access
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; injuryId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, injuryId } = params;

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

    // Get injury and verify it belongs to a player in this team
    const injury = await prisma.injury.findUnique({
      where: { id: injuryId },
      include: {
        player: {
          include: {
            teams: {
              where: { teamId },
            },
          },
        },
      },
    });

    if (!injury) {
      return NextResponse.json({ error: 'Injury not found' }, { status: 404 });
    }

    // Verify player is in this team
    if (!injury.player || injury.player.teams.length === 0) {
      return NextResponse.json(
        { error: 'Player not found in this team' },
        { status: 404 }
      );
    }

    // Update injury status to CLEARED (assuming dateTo is the recovery date)
    const clearedInjury = await prisma.injury.update({
      where: { id: injuryId },
      data: {
        status: 'RECOVERED',
        dateTo: new Date(),
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Injury cleared successfully',
      injury: clearedInjury,
    });
  } catch (error) {
    console.error(
      'PATCH /api/manager/clubs/[clubId]/teams/[teamId]/injuries/[injuryId]/clear error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to clear injury',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
