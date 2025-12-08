/**
 * Team Injuries API
 *
 * GET /api/manager/clubs/[clubId]/teams/[teamId]/injuries
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/injuries
 *
 * GET: Returns list of active injuries for the team
 * POST: Creates a new injury record for a player
 *
 * Authorization: Only club owner can access
 *
 * Response (GET):
 * Array<{
 *   id: string,
 *   player: {
 *     firstName: string,
 *     lastName: string
 *   },
 *   type: string,
 *   severity: string,
 *   dateFrom: Date,
 *   dateTo: Date | null,
 *   status: string,
 *   description: string | null
 * }>
 *
 * Response (POST):
 * {
 *   id: string,
 *   player: {
 *     firstName: string,
 *     lastName: string
 *   },
 *   type: string,
 *   severity: string,
 *   dateFrom: Date,
 *   dateTo: Date | null,
 *   status: string,
 *   description: string | null
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;

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

    // Get active and chronic injuries for players in this team
    const injuries = await prisma.injury.findMany({
      where: {
        player: {
          teams: {
            some: {
              teamId,
            },
          },
        },
        status: { in: ['ACTIVE', 'CHRONIC'] },
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
      orderBy: { dateFrom: 'desc' },
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
        dateFrom: injury.dateFrom,
        dateTo: injury.dateTo,
        status: injury.status,
        description: injury.description,
      }))
    );
  } catch (error) {
    console.error(
      'GET /api/manager/clubs/[clubId]/teams/[teamId]/injuries error:',
      error
    );
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
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;
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

    // Validate required fields
    if (!body.playerId?.trim()) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    if (!body.type?.trim()) {
      return NextResponse.json(
        { error: 'Injury type is required' },
        { status: 400 }
      );
    }

    if (!body.severity?.trim()) {
      return NextResponse.json(
        { error: 'Severity is required' },
        { status: 400 }
      );
    }

    if (!body.dateFrom) {
      return NextResponse.json(
        { error: 'Injury date is required' },
        { status: 400 }
      );
    }

    // Verify player exists and belongs to this team
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
        { error: 'Player not found in this team' },
        { status: 404 }
      );
    }

    // Create injury record using correct schema fields
    const injury = await prisma.injury.create({
      data: {
        playerId: body.playerId,
        type: body.type.trim(),
        severity: body.severity.trim(),
        dateFrom: new Date(body.dateFrom),
        dateTo: body.dateTo ? new Date(body.dateTo) : null,
        treatment: body.treatment || null,
        status: 'ACTIVE',
        description: body.description || null,
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
        dateFrom: injury.dateFrom,
        dateTo: injury.dateTo,
        status: injury.status,
        description: injury.description,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'POST /api/manager/clubs/[clubId]/teams/[teamId]/injuries error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to create injury record',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
