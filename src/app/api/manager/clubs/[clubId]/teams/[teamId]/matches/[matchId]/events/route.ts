/**
 * Match Events API
 *
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events
 *
 * Creates a new event record for a match (goal, card, substitution, etc.)
 *
 * Authorization: Only club owner can access
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify match exists and either homeTeamId or awayTeamId matches the team
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (
      !match ||
      (match.homeTeamId !== teamId && match.awayTeamId !== teamId)
    ) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: body.playerId },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Verify player belongs to team using a direct query on the join table
    const playerInTeam = await prisma.$queryRaw`
      SELECT * FROM "PlayerTeam" WHERE "playerId" = ${body.playerId} AND "teamId" = ${teamId}
    `;

    if (!playerInTeam || (Array.isArray(playerInTeam) && playerInTeam.length === 0)) {
      return NextResponse.json(
        { error: 'Player not found in team' },
        { status: 404 }
      );
    }

    // Verify assist player if provided
    if (body.assistedBy) {
      const assistPlayer = await prisma.player.findUnique({
        where: { id: body.assistedBy },
      });

      if (!assistPlayer) {
        return NextResponse.json({ error: 'Assist player not found' }, { status: 404 });
      }

      const assistPlayerInTeam = await prisma.$queryRaw`
        SELECT * FROM "PlayerTeam" WHERE "playerId" = ${body.assistedBy} AND "teamId" = ${teamId}
      `;

      if (!assistPlayerInTeam || (Array.isArray(assistPlayerInTeam) && assistPlayerInTeam.length === 0)) {
        return NextResponse.json(
          { error: 'Assist player not found in team' },
          { status: 404 }
        );
      }
    }

    // Create the event
    const event = await prisma.matchEvent.create({
      data: {
        type: body.type,
        minute: body.minute,
        playerId: body.playerId,
        matchId: matchId,
        assistedBy: body.assistedBy || null,
        isExtraTime: body.isExtraTime || false,
        additionalInfo: body.additionalInfo || null,
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

    return NextResponse.json({
      id: event.id,
      type: event.type,
      minute: event.minute,
      isExtraTime: event.isExtraTime,
      player: {
        firstName: event.player?.user.firstName || null,
        lastName: event.player?.user.lastName || null,
      },
      assistedBy: event.assistedBy,
      additionalInfo: event.additionalInfo,
      createdAt: event.createdAt,
    });
  } catch (error) {
    console.error('Error creating match event:', error);
    return NextResponse.json(
      { error: 'Failed to create match event' },
      { status: 500 }
    );
  }
}
