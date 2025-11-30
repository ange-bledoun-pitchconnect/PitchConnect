// src/app/api/leagues/[id]/teams/[teamId]/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; teamId: string } }
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
    // Verify league exists and user is admin
    const league = await prisma.league.findUnique({
      where: { id: params.id },
      include: {
        admin: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Check if user is admin of this league
    const isSuperAdmin = session.user.isSuperAdmin || session.user.roles?.includes('SUPERADMIN');
    if (!isSuperAdmin && league.admin.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the LeagueTeam entry
    const leagueTeam = await prisma.leagueTeam.findFirst({
      where: {
        leagueId: params.id,
        teamId: params.teamId,
        leftAt: null,
      },
    });

    if (!leagueTeam) {
      return NextResponse.json({ error: 'Team not in league' }, { status: 404 });
    }

    // Mark team as left (soft delete)
    await prisma.leagueTeam.update({
      where: { id: leagueTeam.id },
      data: {
        leftAt: new Date(),
      },
    });

    // Also delete any standings entries
    await prisma.standings.deleteMany({
      where: {
        leagueId: params.id,
        teamId: params.teamId,
      },
    });

    return NextResponse.json({ message: 'Team removed from league successfully' });
  } catch (error) {
    console.error('DELETE /api/leagues/[id]/teams/[teamId] error:', error);
    return NextResponse.json({ error: 'Failed to remove team' }, { status: 500 });
  }
}
