// src/app/api/leagues/[id]/fixtures/matches/[matchId]/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowedRoles = ['LEAGUE_ADMIN', 'SUPERADMIN'];
  if (!session.user.roles?.some((role: string) => allowedRoles.includes(role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { matchId } = params;
    const body = await req.json();

    const { homeScore, awayScore, status } = body;

    // Validate scores
    if (homeScore !== undefined && (homeScore < 0 || !Number.isInteger(homeScore))) {
      return NextResponse.json({ error: 'Invalid home score' }, { status: 400 });
    }
    if (awayScore !== undefined && (awayScore < 0 || !Number.isInteger(awayScore))) {
      return NextResponse.json({ error: 'Invalid away score' }, { status: 400 });
    }

    // Update match
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: homeScore !== undefined ? homeScore : undefined,
        awayScore: awayScore !== undefined ? awayScore : undefined,
        status: status || undefined,
      },
      include: {
        fixture: true,
      },
    });

    // If match is completed, recalculate standings
    if (status === 'COMPLETED' && homeScore !== undefined && awayScore !== undefined) {
      await recalculateStandings(match.fixture.leagueId);
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('PATCH /api/leagues/[id]/fixtures/matches/[matchId] error:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowedRoles = ['LEAGUE_ADMIN', 'SUPERADMIN'];
  if (!session.user.roles?.some((role: string) => allowedRoles.includes(role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { matchId } = params;

    await prisma.match.delete({
      where: { id: matchId },
    });

    return NextResponse.json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/leagues/[id]/fixtures/matches/[matchId] error:', error);
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}

// Helper function to recalculate standings
async function recalculateStandings(leagueId: string) {
  try {
    // Trigger standings recalculation
    await fetch(`${process.env.NEXTAUTH_URL}/api/leagues/${leagueId}/standings`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Failed to recalculate standings:', error);
  }
}
