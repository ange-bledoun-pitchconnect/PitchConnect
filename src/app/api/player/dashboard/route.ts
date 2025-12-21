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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        shirtNumber: true,
        preferredFoot: true,
        nationality: true,
        dateOfBirth: true,
        height: true,
        weight: true,
        developmentNotes: true, // 🔧 FIXED: Using developmentNotes instead of bio
        status: true,
      },
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
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          shirtNumber: true,
          preferredFoot: true,
          nationality: true,
          dateOfBirth: true,
          height: true,
          weight: true,
          developmentNotes: true,
          status: true,
        },
      });

      console.log('✅ Player profile created:', player.id);
    }

    // Get player's teams
    const teams = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        team: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
                logoUrl: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // Get pending join requests
    const pendingRequests = await prisma.joinRequest.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
      include: {
        team: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate stats
    const stats = {
      totalTeams: teams.length,
      totalMatches: 0,
      totalGoals: 0,
      pendingRequests: pendingRequests.length,
    };

    return NextResponse.json({
      player: {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        position: player.position,
        jerseyNumber: player.shirtNumber, // 🔧 Map shirtNumber to jerseyNumber
        preferredFoot: player.preferredFoot,
        nationality: player.nationality,
        dateOfBirth: player.dateOfBirth.toISOString(),
        height: player.height,
        weight: player.weight,
        bio: player.developmentNotes, // 🔧 Map developmentNotes to bio
        status: player.status,
        teams: teams.map((tm) => ({
          id: tm.id,
          role: tm.role,
          joinedAt: tm.joinedAt.toISOString(),
          team: {
            id: tm.team.id,
            name: tm.team.name,
            ageGroup: tm.team.ageGroup,
            category: tm.team.category,
            club: tm.team.club,
            _count: tm.team._count,
          },
        })),
        pendingRequests: pendingRequests.map((req) => ({
          id: req.id,
          status: req.status,
          createdAt: req.createdAt.toISOString(),
          team: {
            id: req.team.id,
            name: req.team.name,
            ageGroup: req.team.ageGroup,
            category: req.team.category,
            club: req.team.club,
          },
        })),
        stats,
      },
    });
  } catch (error) {
    console.error('❌ Player dashboard error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch player dashboard',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      },
      { status: 500 }
    );
  }
}
