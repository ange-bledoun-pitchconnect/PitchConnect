// src/app/api/leagues/[id]/invitations/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invitations = await prisma.leagueInvitation.findMany({
      where: {
        leagueId: params.id,
        status: 'PENDING',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedInvitations = invitations.map((inv) => ({
      id: inv.id,
      teamId: inv.teamId,
      teamName: inv.team.name,
      status: inv.status,
      message: inv.message,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt?.toISOString(),
    }));

    return NextResponse.json(formattedInvitations);
  } catch (error) {
    console.error('GET /api/leagues/[id]/invitations error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    const body = await req.json();
    const { teamId, message } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Verify league exists
    const league = await prisma.league.findUnique({
      where: { id: params.id },
      include: {
        configuration: true,
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

    // Check if registration is open
    if (!league.configuration?.registrationOpen) {
      return NextResponse.json({ error: 'Registration is closed' }, { status: 400 });
    }

    // Check if team already in league
    const existingTeam = await prisma.leagueTeam.findFirst({
      where: {
        leagueId: params.id,
        teamId,
        leftAt: null,
      },
    });

    if (existingTeam) {
      return NextResponse.json({ error: 'Team already in league' }, { status: 400 });
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.leagueInvitation.findFirst({
      where: {
        leagueId: params.id,
        teamId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already sent' }, { status: 400 });
    }

    // Check max teams limit
    if (league.configuration?.maxTeams) {
      const currentTeamCount = await prisma.leagueTeam.count({
        where: {
          leagueId: params.id,
          leftAt: null,
        },
      });

      if (currentTeamCount >= league.configuration.maxTeams) {
        return NextResponse.json({ error: 'League is full' }, { status: 400 });
      }
    }

    // Get LeagueAdmin ID
    const leagueAdmin = await prisma.leagueAdmin.findUnique({
      where: { userId: session.user.id },
    });

    if (!leagueAdmin) {
      return NextResponse.json({ error: 'League admin profile not found' }, { status: 404 });
    }

    // Create invitation
    const invitation = await prisma.leagueInvitation.create({
      data: {
        leagueId: params.id,
        teamId,
        invitedBy: leagueAdmin.id,
        message: message || null,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        team: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: invitation.id,
      teamId: invitation.teamId,
      teamName: invitation.team.name,
      status: invitation.status,
      createdAt: invitation.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/leagues/[id]/invitations error:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
