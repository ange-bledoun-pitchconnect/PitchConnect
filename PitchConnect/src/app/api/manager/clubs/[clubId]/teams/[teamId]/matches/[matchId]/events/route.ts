// src/app/api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, matchId } = params;

    // Verify access
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

    // Get match events
    const events = await prisma.matchEvent.findMany({
      where: { matchId },
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
      orderBy: { minute: 'asc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch events',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, matchId } = params;
    const body = await req.json();

    // Verify access
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

    // Validation
    if (!body.eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 });
    }

    if (!body.playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    if (body.minute === undefined || body.minute === null) {
      return NextResponse.json({ error: 'Minute is required' }, { status: 400 });
    }

    // Verify player is in team
    const player = await prisma.player.findUnique({
      where: { id: body.playerId },
    });

    if (!player || player.teamId !== teamId) {
      return NextResponse.json({ error: 'Player not found in team' }, { status: 404 });
    }

    // Create event
    const event = await prisma.matchEvent.create({
      data: {
        matchId,
        playerId: body.playerId,
        eventType: body.eventType, // GOAL, ASSIST, YELLOW_CARD, RED_CARD, SUBSTITUTION_ON, SUBSTITUTION_OFF, OWN_GOAL
        minute: body.minute,
        note: body.note || null,
        substitutedPlayerId: body.substitutedPlayerId || null,
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

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
