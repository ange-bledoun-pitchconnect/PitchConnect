/**
 * Delete Match Event API
 *
 * DELETE /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events/[eventId]
 *
 * Deletes a match event (goal, card, substitution, etc.) from a match.
 * Only the club owner can delete events.
 *
 * Authorization: Only club owner can access
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string
 * }
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      clubId: string;
      teamId: string;
      matchId: string;
      eventId: string;
    };
  }
) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, matchId, eventId } = params;

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
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify match exists and belongs to one of the team's matches
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (
      !match ||
      (match.homeTeamId !== teamId && match.awayTeamId !== teamId)
    ) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get and verify event exists and belongs to this match
    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.matchId !== matchId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete the event
    await prisma.matchEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error(
      'DELETE /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events/[eventId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to delete event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
