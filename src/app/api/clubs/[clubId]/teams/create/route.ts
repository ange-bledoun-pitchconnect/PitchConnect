import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a unique team code from team name
 * Example: "Arsenal U21" -> "AU21"
 */
function generateTeamCode(teamName: string): string {
  const words = teamName.trim().toUpperCase().split(/\s+/);
  const code = words.map((word) => word[0]).join('').substring(0, 10);
  return code || 'TEAM';
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clubId } = params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission (club owner or member with appropriate role)
    const clubMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: user.id,
        },
      },
    });

    const isOwner = clubMembership?.role === 'OWNER';
    const isManager = clubMembership?.role === 'MANAGER';

    if (!isOwner && !isManager && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only club owners and managers can create teams' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, ageGroup, category } = body;

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Create team with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the team
      const newTeam = await tx.team.create({
        data: {
          name,
          code: generateTeamCode(name),
          clubId,
          ageGroup: ageGroup || 'SENIOR',
          category: category || 'FIRST_TEAM',
          status: 'ACTIVE',
        },
      });

      // Add creator as team manager
      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: user.id,
          role: 'MANAGER',
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      return newTeam;
    });

    return NextResponse.json({
      success: true,
      teamId: result.id,
      message: 'Team created successfully',
    });
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
