// src/app/api/manager/clubs/[clubId]/route.ts
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

    // Get club with teams and counts
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        teams: {
          include: {
            _count: {
              select: {
                players: true,
                coaches: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
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

    // Check authorization (only manager of this club can view)
    if (club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(club);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch club',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Get club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check authorization
    if (club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update club
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: {
        name: body.name || undefined,
        description: body.description !== undefined ? body.description : undefined,
        country: body.country || undefined,
        city: body.city !== undefined ? body.city : undefined,
        foundedYear: body.foundedYear !== undefined ? body.foundedYear : undefined,
        homeVenue: body.homeVenue !== undefined ? body.homeVenue : undefined,
        primaryColor: body.primaryColor || undefined,
        secondaryColor: body.secondaryColor || undefined,
        website: body.website !== undefined ? body.website : undefined,
        email: body.email !== undefined ? body.email : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        status: body.status || undefined,
      },
      include: {
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    return NextResponse.json(updatedClub);
  } catch (error) {
    console.error('PATCH /api/manager/clubs/[clubId] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update club',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        teams: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check authorization
    if (club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if club has teams
    if (club.teams.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete club with existing teams. Delete all teams first.' },
        { status: 400 }
      );
    }

    // Delete club
    await prisma.club.delete({
      where: { id: clubId },
    });

    return NextResponse.json({
      success: true,
      message: 'Club deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/manager/clubs/[clubId] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete club',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
