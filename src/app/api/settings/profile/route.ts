import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userRoles: {
          select: {
            roleName: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth?.toISOString() || null,
        nationality: user.nationality,
        status: user.status,
        roles: user.userRoles.map((ur) => ur.roleName),
        isSuperAdmin: user.isSuperAdmin,
        createdAt: user.createdAt.toISOString(),
        emailVerified: user.emailVerified?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { firstName, lastName, phoneNumber, dateOfBirth, nationality, avatar } = body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(nationality && { nationality }),
        ...(avatar !== undefined && { avatar }),
      },
      include: {
        userRoles: {
          select: {
            roleName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        avatar: updatedUser.avatar,
        dateOfBirth: updatedUser.dateOfBirth?.toISOString() || null,
        nationality: updatedUser.nationality,
        status: updatedUser.status,
        roles: updatedUser.userRoles.map((ur) => ur.roleName),
        isSuperAdmin: updatedUser.isSuperAdmin,
        createdAt: updatedUser.createdAt.toISOString(),
        emailVerified: updatedUser.emailVerified?.toISOString() || null,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
