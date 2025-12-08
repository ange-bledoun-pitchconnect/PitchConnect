/**
 * Team Coach API
 *
 * GET: Fetch a specific coach assigned to the team
 * DELETE: Remove a coach from a team
 *
 * Authorization: Only club owner can manage coaches
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: { ... },
 *   message?: string
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId]
 * Fetch a specific coach assigned to the team
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; coachId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { clubId, teamId, coachId } = params;

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the club owner' },
        { status: 403 }
      );
    }

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        clubId: true,
      },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json(
        { error: 'Team not found or does not belong to this club' },
        { status: 404 }
      );
    }

    // Get coach and verify belongs to this team
    const coach = await prisma.coach.findFirst({
      where: {
        id: coachId,
        teams: {
          some: {
            id: teamId,
          },
        },
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
        teams: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found in this team' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coach,
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch coach',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId]
 * Remove a coach from a team
 *
 * Authorization: Only club owner can remove coaches
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; coachId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { clubId, teamId, coachId } = params;

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the club owner' },
        { status: 403 }
      );
    }

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        clubId: true,
      },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json(
        { error: 'Team not found or does not belong to this club' },
        { status: 404 }
      );
    }

    // Verify coach exists and belongs to this team
    const coach = await prisma.coach.findFirst({
      where: {
        id: coachId,
        teams: {
          some: {
            id: teamId,
          },
        },
      },
      include: {
        teams: {
          where: { id: teamId },
        },
      },
    });

    if (!coach || coach.teams.length === 0) {
      return NextResponse.json(
        { error: 'Coach not found in this team' },
        { status: 404 }
      );
    }

    // Remove coach from team (disconnect relation)
    await prisma.coach.update({
      where: { id: coachId },
      data: {
        teams: {
          disconnect: {
            id: teamId,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Coach removed from team successfully',
      coachId,
      teamId,
    });
  } catch (error) {
    console.error(
      'DELETE /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to remove coach from team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
