/**
 * Match Lineup API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/lineup
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/lineup
 *
 * GET: Returns lineup for a match (starting 11 and substitutes)
 * POST: Sets the lineup for a match
 *
 * Authorization: Only club owner can access
 *
 * Response (GET):
 * {
 *   players: Array<{
 *     playerId: string,
 *     playerName: string,
 *     position: string,
 *     status: string
 *   }>,
 *   substitutes: Array<{
 *     playerId: string,
 *     playerName: string
 *   }>
 * }
 *
 * Response (POST):
 * {
 *   success: boolean,
 *   message: string,
 *   starting: number,
 *   substitutes: number
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
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
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

    // Get match attendances (lineup) for this match
    const attendances = await prisma.matchAttendance.findMany({
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
      orderBy: { player: { user: { firstName: 'asc' } } },
    });

    // Separate starting lineup and substitutes
    const players = attendances
      .filter((a) => a.status === 'STARTING_LINEUP')
      .map((a) => ({
        playerId: a.player.id,
        playerName: `${a.player.user.firstName} ${a.player.user.lastName}`,
        position: a.position,
        shirtNumber: a.shirtNumber,
        status: a.status,
      }));

    const substitutes = attendances
      .filter((a) => a.status === 'SUBSTITUTE')
      .map((a) => ({
        playerId: a.player.id,
        playerName: `${a.player.user.firstName} ${a.player.user.lastName}`,
      }));

    return NextResponse.json({
      players,
      substitutes,
    });
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/lineup error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch lineup',
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
  const session = await auth();
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

    // Verify match exists and belongs to team
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
    if (!Array.isArray(body.players) || body.players.length === 0) {
      return NextResponse.json(
        { error: 'Players array is required' },
        { status: 400 }
      );
    }

    if (body.players.length !== 11) {
      return NextResponse.json(
        { error: 'Exactly 11 starting players required' },
        { status: 400 }
      );
    }

    // Verify all players exist and are in team
    const playerIds = body.players.map((p: any) => p.playerId);
    const substitutes = Array.isArray(body.substitutes) ? body.substitutes : [];
    const allPlayerIds = [...playerIds, ...substitutes];

    // Use raw query to check if players belong to team
    const playersInTeam = await prisma.$queryRaw`
      SELECT DISTINCT p.id
      FROM players p
      WHERE p.id = ANY(${allPlayerIds}::text[])
      AND EXISTS (
        SELECT 1 FROM "PlayerTeam" pt 
        WHERE pt."playerId" = p.id 
        AND pt."teamId" = ${teamId}
      )
    `;

    if (!Array.isArray(playersInTeam) || playersInTeam.length !== allPlayerIds.length) {
      return NextResponse.json(
        { error: 'Some players not found in team' },
        { status: 404 }
      );
    }

    // Clear existing attendances for this match
    await prisma.matchAttendance.deleteMany({
      where: { matchId },
    });

    // Create starting lineup attendances
    const startingAttendances = await prisma.matchAttendance.createMany({
      data: body.players.map((player: any) => ({
        matchId,
        playerId: player.playerId,
        status: 'STARTING_LINEUP',
        position: player.position || null,
        shirtNumber: player.shirtNumber || null,
      })),
    });

    // Create substitute attendances
    let substituteCount = 0;
    if (substitutes.length > 0) {
      const subs = await prisma.matchAttendance.createMany({
        data: substitutes.map((playerId: string) => ({
          matchId,
          playerId,
          status: 'SUBSTITUTE',
        })),
      });
      substituteCount = subs.count;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Lineup set successfully',
        starting: startingAttendances.count,
        substitutes: substituteCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/lineup error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to save lineup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
