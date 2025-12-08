/**
 * Match Events API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events
 *
 * GET: Returns list of events for a match (goals, cards, substitutions, etc.)
 * POST: Creates a new event in a match
 *
 * Authorization: Only club owner can access
 *
 * Response (GET):
 * Array<{
 *   id: string,
 *   matchId: string,
 *   playerId: string,
 *   type: string,
 *   minute: number,
 *   additionalInfo: string | null,
 *   player: {
 *     firstName: string,
 *     lastName: string
 *   }
 * }>
 *
 * Response (POST):
 * {
 *   id: string,
 *   matchId: string,
 *   playerId: string,
 *   type: string,
 *   minute: number,
 *   additionalInfo: string | null,
 *   player: {
 *     firstName: string,
 *     lastName: string
 *   }
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, matchId } = params;

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

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify match belongs to team
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (
      !match ||
      (match.homeTeamId !== teamId && match.awayTeamId !== teamId)
    ) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get match events
    const events = await prisma.matchEvent.findMany({
      where: { matchId },
      include: {
        player: {
          select: {
            id: true,
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
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events error:',
      error
    );
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
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, matchId } = params;
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

    // Verify team exists and belongs to club (using oldTeam per schema)
    const team = await prisma.oldTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify match belongs to team
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (
      !match ||
      (match.homeTeamId !== teamId && match.awayTeamId !== teamId)
    ) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Validate input
    if (!body.type?.trim()) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    if (!body.playerId?.trim()) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    if (body.minute === undefined || body.minute === null) {
      return NextResponse.json(
        { error: 'Minute is required' },
        { status: 400 }
      );
    }

    // Verify player exists and is in team
    const player = await prisma.player.findUnique({
      where: { id: body.playerId },
      include: {
        teams: {
          where: { teamId },
        },
      },
    });

    if (!player || player.teams.length === 0) {
      return NextResponse.json(
        { error: 'Player not found in team' },
        { status: 404 }
      );
    }

    // Create event using correct field names
    const event = await prisma.matchEvent.create({
      data: {
        matchId,
        playerId: body.playerId,
        type: body.type.trim(), // GOAL, ASSIST, YELLOW_CARD, RED_CARD, SUBSTITUTION, etc.
        minute: parseInt(body.minute, 10),
        additionalInfo: body.additionalInfo || null,
      },
      include: {
        player: {
          select: {
            id: true,
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
    console.error(
      'POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to create event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
