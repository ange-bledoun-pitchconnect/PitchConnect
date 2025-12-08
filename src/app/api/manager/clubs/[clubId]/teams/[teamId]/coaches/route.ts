/**
 * Team Coaches API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/coaches
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/coaches
 *
 * GET: Returns coach for the team
 * POST: Assigns a coach to the team
 *
 * Authorization: Only club owner can access
 *
 * Response (GET):
 * {
 *   id: string,
 *   userId: string,
 *   yearsExperience: number,
 *   qualifications: string[],
 *   specializations: string[],
 *   user: {
 *     id: string,
 *     firstName: string,
 *     lastName: string,
 *     email: string
 *   }
 * }
 *
 * Response (POST):
 * {
 *   id: string,
 *   userId: string,
 *   yearsExperience: number,
 *   qualifications: string[],
 *   specializations: string[],
 *   user: {
 *     id: string,
 *     firstName: string,
 *     lastName: string,
 *     email: string
 *   }
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
    // OldTeam has a single coachId, so get team with coach included
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
      include: {
        coach: {
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
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Return coach if assigned
    if (team.coach) {
      return NextResponse.json(team.coach);
    }

    return NextResponse.json(
      { error: 'No coach assigned to this team' },
      { status: 404 }
    );
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/coaches error:',
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
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Validate input
    if (!body.userId?.trim()) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if team already has a coach assigned
    // OldTeam has coachId field (singular), not a coaches array
    if (team.coachId) {
      return NextResponse.json(
        { error: 'Team already has a coach assigned. Remove current coach first.' },
        { status: 409 }
      );
    }

    // Check if coach profile exists for this user
    let coach = await prisma.coach.findUnique({
      where: { userId: body.userId },
    });

    // If coach doesn't exist, create one
    if (!coach) {
      coach = await prisma.coach.create({
        data: {
          userId: body.userId,
          yearsExperience: body.yearsExperience || 0,
          qualifications: body.qualifications || [],
          specializations: body.specializations || [],
          bio: body.bio || null,
        },
      });
    }

    // Assign coach to team using coachId field
    const updatedTeam = await prisma.oldTeam.update({
      where: { id: teamId },
      data: {
        coachId: coach.id,
      },
      include: {
        coach: {
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
    });

    return NextResponse.json(updatedTeam.coach, { status: 201 });
  } catch (error) {
    console.error(
      'POST /api/manager/clubs/[clubId]/teams/[teamId]/coaches error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to add coach',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
