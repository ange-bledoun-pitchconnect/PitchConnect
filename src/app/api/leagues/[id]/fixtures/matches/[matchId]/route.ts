// src/app/api/leagues/[id]/fixtures/matches/[matchId]/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['LEAGUE_ADMIN', 'SUPERADMIN'];

// Auth check helper
async function verifyAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (!session.user.roles?.some((role: string) => ALLOWED_ROLES.includes(role))) {
    return { error: 'Forbidden', status: 403 };
  }

  return { session };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const auth = await verifyAuth(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { matchId } = params;
    const body = await req.json();
    const { homeGoals, awayGoals, status } = body;

    // Validate match exists
    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Validate scores
    if (homeGoals !== undefined) {
      if (!Number.isInteger(homeGoals) || homeGoals < 0) {
        return NextResponse.json(
          { error: 'Invalid home score - must be non-negative integer' },
          { status: 400 }
        );
      }
    }

    if (awayGoals !== undefined) {
      if (!Number.isInteger(awayGoals) || awayGoals < 0) {
        return NextResponse.json(
          { error: 'Invalid away score - must be non-negative integer' },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    const validStatuses = ['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update data dynamically
    const updateData: Record<string, any> = {};
    if (homeGoals !== undefined) updateData.homeGoals = homeGoals;
    if (awayGoals !== undefined) updateData.awayGoals = awayGoals;
    if (status) updateData.status = status;

    // Update match
    const match = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        fixture: {
          select: {
            leagueId: true,
          },
        },
      },
    });

    // If match is completed, recalculate standings
    if (status === 'FINISHED' && homeGoals !== undefined && awayGoals !== undefined) {
      if (match.fixture?.leagueId) {
        try {
          await recalculateStandings(match.fixture.leagueId);
        } catch (error) {
          console.error('Failed to recalculate standings:', error);
          // Don't fail the request if standings recalc fails
        }
      } else {
        console.warn(`Match ${matchId} completed but has no associated fixture`);
      }
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('PATCH /api/leagues/[id]/fixtures/matches/[matchId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update match', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const auth = await verifyAuth(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { matchId } = params;

    // Verify match exists first
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, status: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Prevent deletion of completed/live matches
    if (['LIVE', 'FINISHED'].includes(match.status)) {
      return NextResponse.json(
        { error: `Cannot delete match with status: ${match.status}` },
        { status: 400 }
      );
    }

    await prisma.match.delete({
      where: { id: matchId },
    });

    console.log(`Match ${matchId} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'Match deleted successfully',
      id: matchId,
    });
  } catch (error) {
    console.error('DELETE /api/leagues/[id]/fixtures/matches/[matchId] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete match', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to recalculate standings
async function recalculateStandings(leagueId: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/leagues/${leagueId}/standings`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Standings recalculation failed: ${response.status} ${response.statusText}`
    );
  }
}
