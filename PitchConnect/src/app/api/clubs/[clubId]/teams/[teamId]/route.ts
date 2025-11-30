import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clubId, teamId } = params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch team with members
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify team belongs to club
    if (team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team does not belong to this club' }, { status: 400 });
    }

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        clubId: team.clubId,
        ageGroup: team.ageGroup,
        category: team.category,
        status: team.status,
        members: team.members.map((member) => ({
          id: member.id,
          role: member.role,
          status: member.status,
          joinedAt: member.joinedAt.toISOString(),
          user: member.user,
        })),
        _count: team._count,
      },
    });
  } catch (error) {
    console.error('Get team error:', error);
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
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, ageGroup, category, status } = body;

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name }),
        ...(ageGroup && { ageGroup }),
        ...(category && { category }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({
      success: true,
      team: updatedTeam,
      message: 'Team updated successfully',
    });
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
