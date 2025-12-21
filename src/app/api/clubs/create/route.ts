import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a unique club code from club name
 * Example: "Arsenal FC" -> "ARS"
 */
function generateClubCode(clubName: string): string {
  const words = clubName.trim().toUpperCase().split(/\s+/);
  const code = words.map((word) => word[0]).join('').substring(0, 3);
  return code || 'CLB';
}

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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create clubs
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userRoles: {
          select: { roleName: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions properly
    const allowedRoles = ['SUPERADMIN', 'LEAGUE_ADMIN', 'CLUB_MANAGER'];
    const userRoleNames = user.userRoles.map((ur) => ur.roleName);
    const hasPermission =
      user.isSuperAdmin || userRoleNames.some((role) => allowedRoles.includes(role));

    console.log('Club creation permission check:', {
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      roles: userRoleNames,
      hasPermission,
    });

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Only managers, league admins, and superadmins can create clubs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { club, firstTeam } = body;

    console.log('Club data received:', {
      clubName: club?.name,
      clubCity: club?.city,
      hasFirstTeam: !!firstTeam,
    });

    // Validate required fields
    if (!club?.name || !club?.city) {
      return NextResponse.json(
        { error: 'Club name and city are required' },
        { status: 400 }
      );
    }

    // Create club with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the club
      const newClub = await tx.club.create({
        data: {
          name: club.name,
          code: generateClubCode(club.name),
          city: club.city,
          country: club.country || 'United Kingdom',
          foundedYear: club.foundedYear ? parseInt(club.foundedYear) : null,
          description: club.description || null,
          stadiumName: club.stadiumName || null,
          logoUrl: club.logoUrl || null,
          primaryColor: club.colors?.primary || '#FFD700',
          secondaryColor: club.colors?.secondary || '#FF6B35',
          status: 'ACTIVE',
          type: 'PROFESSIONAL',
          ownerId: user.id,
        },
      });

      console.log('Club created:', newClub.id);

      // Create club membership for owner
      await tx.clubMember.create({
        data: {
          clubId: newClub.id,
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      console.log('Club membership created for owner');

      // Create first team if requested
      let newTeam = null;
      if (firstTeam?.name) {
        newTeam = await tx.team.create({
          data: {
            name: firstTeam.name,
            code: generateTeamCode(firstTeam.name),
            clubId: newClub.id,
            ageGroup: firstTeam.ageGroup || 'SENIOR',
            category: firstTeam.category || 'FIRST_TEAM',
            status: 'ACTIVE',
          },
        });

        console.log('First team created:', newTeam.id);

        // Add owner to team
        await tx.teamMember.create({
          data: {
            teamId: newTeam.id,
            userId: user.id,
            role: 'MANAGER',
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
        });

        console.log('Team membership created for owner');
      }

      return { club: newClub, team: newTeam };
    });

    console.log('Club creation completed successfully');

    return NextResponse.json({
      success: true,
      clubId: result.club.id,
      teamId: result.team?.id,
      message: 'Club created successfully',
    });
  } catch (error) {
    console.error('Club creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create club',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
