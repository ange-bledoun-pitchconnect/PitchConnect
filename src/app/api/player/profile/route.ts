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

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create player profile
    let player = await prisma.player.findUnique({
      where: { userId: user.id },
    });

    // 🔧 AUTO-CREATE PLAYER PROFILE IF NOT EXISTS
    if (!player) {
      console.log('🆕 Creating player profile for user:', user.email);
      
      player = await prisma.player.create({
        data: {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth || new Date('2000-01-01'),
          nationality: user.nationality || 'Not Specified',
          position: 'MIDFIELDER',
          preferredFoot: 'RIGHT',
          status: 'ACTIVE',
        },
      });

      console.log('✅ Player profile created:', player.id);
    }

    // Get stats
    const totalTeams = await prisma.teamMember.count({
      where: {
        userId: user.id,
        role: 'PLAYER',
        status: 'ACTIVE',
      },
    });

    const stats = {
      totalTeams,
      totalMatches: 0,
      totalGoals: 0,
    };

    return NextResponse.json({
      profile: {
        id: player.id,
        userId: player.userId,
        firstName: player.firstName,
        lastName: player.lastName,
        dateOfBirth: player.dateOfBirth.toISOString(),
        nationality: player.nationality,
        position: player.position,
        preferredFoot: player.preferredFoot,
        height: player.height,
        weight: player.weight,
        jerseyNumber: player.shirtNumber, // 🔧 Map shirtNumber to jerseyNumber
        bio: player.developmentNotes, // 🔧 Map developmentNotes to bio
        status: player.status,
        stats,
      },
    });
  } catch (error) {
    console.error('❌ Get player profile error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch player profile',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
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
    const {
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      position,
      preferredFoot,
      height,
      weight,
      jerseyNumber, // Frontend sends jerseyNumber
      bio, // Frontend sends bio
    } = body;

    // Update player profile
    const updatedPlayer = await prisma.player.update({
      where: { userId: user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(nationality && { nationality }),
        ...(position && { position }),
        ...(preferredFoot && { preferredFoot }),
        ...(height !== undefined && { height }),
        ...(weight !== undefined && { weight }),
        ...(jerseyNumber !== undefined && { shirtNumber: jerseyNumber }), // 🔧 Map to shirtNumber
        ...(bio !== undefined && { developmentNotes: bio }), // 🔧 Map to developmentNotes
      },
    });

    // Get stats
    const totalTeams = await prisma.teamMember.count({
      where: {
        userId: user.id,
        role: 'PLAYER',
        status: 'ACTIVE',
      },
    });

    const stats = {
      totalTeams,
      totalMatches: 0,
      totalGoals: 0,
    };

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedPlayer.id,
        userId: updatedPlayer.userId,
        firstName: updatedPlayer.firstName,
        lastName: updatedPlayer.lastName,
        dateOfBirth: updatedPlayer.dateOfBirth.toISOString(),
        nationality: updatedPlayer.nationality,
        position: updatedPlayer.position,
        preferredFoot: updatedPlayer.preferredFoot,
        height: updatedPlayer.height,
        weight: updatedPlayer.weight,
        jerseyNumber: updatedPlayer.shirtNumber, // 🔧 Map back to jerseyNumber
        bio: updatedPlayer.developmentNotes, // 🔧 Map back to bio
        status: updatedPlayer.status,
        stats,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('❌ Update player profile error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update player profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
