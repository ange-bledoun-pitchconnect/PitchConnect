import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leagueId } = params;

    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if team is already in league
    const existingMembership = await prisma.leagueTeam.findFirst({
      where: {
        leagueId,
        teamId,
        leftAt: null,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Team is already in this league' },
        { status: 400 }
      );
    }

    // Add team to league
    await prisma.$transaction(async (tx) => {
      // Create league team membership
      await tx.leagueTeam.create({
        data: {
          leagueId,
          teamId,
          joinedAt: new Date(),
        },
      });

      // Create initial standings entry
      await tx.standings.create({
        data: {
          leagueId,
          teamId,
          position: 0, // Will be recalculated
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Team added to league successfully',
    });
  } catch (error) {
    console.error('Add team to league error:', error);
    return NextResponse.json(
      {
        error: 'Failed to add team to league',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
