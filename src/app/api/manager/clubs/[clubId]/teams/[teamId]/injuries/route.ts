// src/app/api/manager/clubs/[clubId]/teams/[teamId]/injuries/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;

    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const injuries = await prisma.injury.findMany({
      where: {
        player: { teamId },
        status: { in: ['ACTIVE', 'RECOVERING'] },
      },
      include: {
        player: {
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
      orderBy: { dateOccurred: 'desc' },
    });

    return NextResponse.json(
      injuries.map((injury) => ({
        id: injury.id,
        player: {
          firstName: injury.player.user.firstName,
          lastName: injury.player.user.lastName,
        },
        type: injury.type,
        severity: injury.severity,
        dateOccurred: injury.dateOccurred,
        estimatedReturnDate: injury.estimatedReturnDate,
        status: injury.status,
        notes: injury.notes,
      }))
    );
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/injuries error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch injuries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;
    const body = await req.json();

    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!body.playerId || !body.type || !body.severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const injury = await prisma.injury.create({
      data: {
        playerId: body.playerId,
        type: body.type,
        severity: body.severity,
        dateOccurred: new Date(body.dateOccurred),
        estimatedReturnDate: body.estimatedReturnDate ? new Date(body.estimatedReturnDate) : null,
        notes: body.notes,
        status: 'ACTIVE',
      },
      include: {
        player: {
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
    });

    return NextResponse.json(
      {
        id: injury.id,
        player: {
          firstName: injury.player.user.firstName,
          lastName: injury.player.user.lastName,
        },
        type: injury.type,
        severity: injury.severity,
        dateOccurred: injury.dateOccurred,
        estimatedReturnDate: injury.estimatedReturnDate,
        status: injury.status,
        notes: injury.notes,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/manager/clubs/[clubId]/teams/[teamId]/injuries error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create injury record',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
