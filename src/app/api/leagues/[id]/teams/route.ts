// src/app/api/leagues/[id]/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['LEAGUE_ADMIN', 'SUPERADMIN'];

// Auth verification helper
async function verifyAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  return { session };
}

// Auth + role verification helper
async function verifyAdminAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (!session.user.roles?.some((role: string) => ALLOWED_ROLES.includes(role))) {
    return { error: 'Forbidden', status: 403 };
  }

  return { session };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leagueId = params.id;

    // Verify league exists
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        code: true,
        season: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Get all teams in league
    const leagueTeams = await prisma.leagueTeam.findMany({
      where: {
        leagueId,
        leftAt: null,
      },
      select: {
        teamId: true,
        joinedAt: true,
      },
    });

    if (leagueTeams.length === 0) {
      return NextResponse.json({
        league,
        teams: [],
        totalTeams: 0,
      });
    }

    // Get team details from Team model
    const teamIds = leagueTeams.map((lt) => lt.teamId);
    const teams_data = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: {
        id: true,
        name: true,
        club: { select: { id: true, name: true } },
      },
    });

    // Create team map
    const teamMap = new Map();
    teams_data.forEach((t) =>
      teamMap.set(t.id, {
        id: t.id,
        name: t.name,
        clubId: t.club?.id,
        clubName: t.club?.name,
      })
    );

    // Format response with team details
    const teams = leagueTeams.map((lt) => {
      const teamData = teamMap.get(lt.teamId);
      return {
        teamId: lt.teamId,
        teamName: teamData?.name || 'Unknown Team',
        clubId: teamData?.clubId,
        clubName: teamData?.clubName,
        joinedAt: lt.joinedAt.toISOString(),
      };
    });

    return NextResponse.json({
      league,
      totalTeams: teams.length,
      teams,
    });
  } catch (error) {
    console.error('GET /api/leagues/[id]/teams error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch league teams',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminAuth(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const leagueId = params.id;
    const body = await req.json();
    const { teamId } = body;

    // Validation
    if (!teamId || typeof teamId !== 'string') {
      return NextResponse.json(
        { error: 'Valid team ID is required' },
        { status: 400 }
      );
    }

    // Verify league exists
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { id: true, season: true },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Check if team exists in Team model
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if team is already in league (active membership)
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
        { status: 409 }
      );
    }

    // Add team to league with initial standings in transaction
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
          position: 0,
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

    return NextResponse.json(
      {
        success: true,
        message: `Team "${team.name}" added to league successfully`,
        data: {
          teamId,
          teamName: team.name,
          leagueId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/leagues/[id]/teams error:', error);

    // Handle foreign key constraint violations
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { error: 'Team or league does not exist' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to add team to league',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminAuth(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const leagueId = params.id;
    const body = await req.json();
    const { teamId } = body;

    // Validation
    if (!teamId || typeof teamId !== 'string') {
      return NextResponse.json(
        { error: 'Valid team ID is required' },
        { status: 400 }
      );
    }

    // Verify league exists
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { id: true },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Find active membership
    const membership = await prisma.leagueTeam.findFirst({
      where: {
        leagueId,
        teamId,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Team is not in this league' },
        { status: 404 }
      );
    }

    // Remove team from league (soft delete)
    await prisma.leagueTeam.update({
      where: { id: membership.id },
      data: { leftAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Team removed from league successfully',
      data: {
        teamId,
        leagueId,
      },
    });
  } catch (error) {
    console.error('DELETE /api/leagues/[id]/teams error:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove team from league',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
