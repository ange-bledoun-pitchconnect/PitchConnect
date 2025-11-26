// src/app/api/manager/clubs/[clubId]/teams/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId } = params;

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Check if manager owns this club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all teams for this club
    const teams = await prisma.team.findMany({
      where: { clubId },
      include: {
        _count: {
          select: {
            players: true,
            coaches: true,
          },
        },
        coaches: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId } = params;
    const body = await req.json();

    // Get manager profile
    let manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      manager = await prisma.manager.create({
        data: { userId: session.user.id },
      });
    }

    // Check if manager owns this club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validation
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    if (!body.code?.trim()) {
      return NextResponse.json({ error: 'Team code is required' }, { status: 400 });
    }

    // Check if team code already exists in this club
    const existingTeam = await prisma.team.findFirst({
      where: {
        code: body.code.toUpperCase(),
        clubId,
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: 'A team with this code already exists in this club' },
        { status: 400 }
      );
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name: body.name.trim(),
        code: body.code.toUpperCase(),
        description: body.description || null,
        clubId,
        homeVenue: body.homeVenue || null,
        primaryColor: body.primaryColor || '#1f2937',
        secondaryColor: body.secondaryColor || '#f59e0b',
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: {
            players: true,
            coaches: true,
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('POST /api/manager/clubs/[clubId]/teams error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
