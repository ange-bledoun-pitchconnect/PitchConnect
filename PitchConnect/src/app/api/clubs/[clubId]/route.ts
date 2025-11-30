import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clubId } = params;

    // Fetch club with related data
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        teams: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Fetch owner separately
    const owner = await prisma.user.findUnique({
      where: { id: club.ownerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Check if user has access to this club
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        // FIXED: Just get userRoles without nested include
        userRoles: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isMember = club.members.some((member) => member.userId === user.id);
    const isOwner = club.ownerId === user.id;

    // FIXED: Check if user is superadmin or league admin using roleName
    const isSuperAdmin = user.userRoles.some(
      (userRole) => userRole.roleName === 'SUPERADMIN'
    );
    const isLeagueAdmin = user.userRoles.some(
      (userRole) => userRole.roleName === 'LEAGUE_ADMIN'
    );

    if (!isMember && !isOwner && !isSuperAdmin && !isLeagueAdmin) {
      return NextResponse.json(
        { error: 'You do not have access to this club' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      club: {
        id: club.id,
        name: club.name,
        city: club.city,
        country: club.country,
        foundedYear: club.foundedYear,
        description: club.description,
        stadiumName: club.stadiumName,
        logoUrl: club.logoUrl,
        primaryColor: club.primaryColor,
        secondaryColor: club.secondaryColor,
        status: club.status,
        owner: owner,
        teams: club.teams,
        members: club.members,
        stats: {
          totalTeams: club._count.teams,
        },
      },
      userRole: isOwner ? 'OWNER' : isMember ? 'MEMBER' : 'ADMIN',
    });
  } catch (error) {
    console.error('Fetch club error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club' },
      { status: 500 }
    );
  }
}
