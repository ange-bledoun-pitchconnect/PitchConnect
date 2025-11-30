// src/app/api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/lineup/route.ts
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

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get lineup
    const lineup = await prisma.lineup.findUnique({
      where: { matchId },
      include: {
        players: {
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
        },
      },
    });

    if (!lineup) {
      return NextResponse.json(
        { formation: '4-4-2', players: [], substitutes: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      formation: lineup.formation,
      players: lineup.players.map((lp) => ({
        playerId: lp.playerId,
        position: lp.position,
        orderInFormation: lp.orderInFormation,
      })),
      substitutes: lineup.players
        .filter((lp) => lp.isSubstitute)
        .map((lp) => lp.playerId),
    });
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/lineup error:', error);
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
    if (!body.formation) {
      return NextResponse.json({ error: 'Formation is required' }, { status: 400 });
    }

    if (!Array.isArray(body.players) || body.players.length !== 11) {
      return NextResponse.json(
        { error: 'Exactly 11 players required' },
        { status: 400 }
      );
    }

    // Get or create match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Delete existing lineup if exists
    await prisma.lineup.deleteMany({
      where: { matchId },
    });

    // Create new lineup
    const lineup = await prisma.lineup.create({
      data: {
        matchId,
        formation: body.formation,
        players: {
          create: body.players.map((player: any, index: number) => ({
            playerId: player.playerId,
            position: player.position,
            orderInFormation: index,
            isSubstitute: false,
          })),
        },
      },
    });

    // Add substitutes if provided
    if (Array.isArray(body.substitutes) && body.substitutes.length > 0) {
      await prisma.lineupPlayer.createMany({
        data: body.substitutes.map((playerId: string) => ({
          lineupId: lineup.id,
          playerId,
          position: 'SUB',
          orderInFormation: 0,
          isSubstitute: true,
        })),
      });
    }

    return NextResponse.json(lineup, { status: 201 });
  } catch (error) {
    console.error('POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/lineup error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save lineup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
