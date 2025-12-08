/**
 * Get Match Details API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]
 *
 * Retrieves full details of a match including teams, events, and lineup.
 *
 * Authorization: Only club owner can access
 *
 * Response:
 * {
 *   id: string,
 *   homeTeamId: string,
 *   awayTeamId: string,
 *   homeGoals: number,
 *   awayGoals: number,
 *   status: string,
 *   date: Date,
 *   homeTeam: {
 *     id: string,
 *     name: string
 *   },
 *   awayTeam: {
 *     id: string,
 *     name: string
 *   },
 *   events: Array<{...}>,
 *   playerAttendances: Array<{...}>
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

    // Get match with full details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        events: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { minute: 'asc' },
        },
        playerAttendances: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
              },
            },
          },
          orderBy: { player: { firstName: 'asc' } },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify team is part of match
    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Transform response to include separated starting lineup and substitutes
    const startingLineup = match.playerAttendances.filter(
      (a) => a.status === 'STARTING_LINEUP'
    );
    const substitutes = match.playerAttendances.filter(
      (a) => a.status === 'SUBSTITUTE'
    );

    return NextResponse.json({
      ...match,
      lineup: {
        starting: startingLineup,
        substitutes,
      },
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId] error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch match',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
