/**
 * List or Create Teams API
 *
 * GET /api/manager/clubs/[clubId]/teams
 * POST /api/manager/clubs/[clubId]/teams
 *
 * GET: Retrieves all teams for a club
 * POST: Creates a new team for a club
 *
 * Authorization: Only club owner can access
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId } = params;

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

    // Get all teams for this club (using oldTeam per schema)
    const teams = await prisma.team.findMany({
      where: { clubId },
      include: {
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            players: true,
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
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId } = params;
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

    // Verify coach exists
    if (!body.coachId?.trim()) {
      return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 });
    }

    const coach = await prisma.coach.findUnique({
      where: { id: body.coachId },
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Validation
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    if (!body.category?.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    if (!body.season) {
      return NextResponse.json({ error: 'Season is required' }, { status: 400 });
    }

    // Create team (using oldTeam per schema)
    const team = await prisma.team.create({
      data: {
        clubId,
        coachId: body.coachId,
        name: body.name.trim(),
        category: body.category.trim(),
        season: body.season,
        status: 'ACTIVE',
      },
      include: {
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            players: true,
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
