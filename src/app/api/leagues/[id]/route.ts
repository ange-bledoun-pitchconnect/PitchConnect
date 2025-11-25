// src/app/api/leagues/[id]/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET single league by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const league = await prisma.league.findUnique({
      where: { id: params.id },
      include: {
        admin: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        teams: {
          where: {
            leftAt: null, // Only active teams
          },
          include: {
            team: {
              include: {
                club: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    country: true,
                  },
                },
              },
            },
          },
        },
        fixtures: {
          include: {
            matches: {
              orderBy: {
                date: 'asc',
              },
            },
          },
          orderBy: {
            matchweek: 'asc',
          },
        },
        standings: {
          orderBy: { position: 'asc' },
        },
        configuration: true,
        seasons: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            teams: true,
            fixtures: true,
            standings: true,
            invitations: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Check authorization: SuperAdmin or League Admin who owns this league
    const isSuperAdmin = session.user.isSuperAdmin || session.user.roles?.includes('SUPERADMIN');
    const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN');
    
    if (!isSuperAdmin) {
      if (!isLeagueAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Verify this user is the admin of this league
      if (league.admin.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(league);
  } catch (error) {
    console.error('GET /api/leagues/[id] error:', error);
    return NextResponse.json(
      { error: 'Server error', details: `${error}` },
      { status: 500 }
    );
  }
}

// PATCH update league
export async function PATCH(
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
    // Check if league exists and user has permission
    const existingLeague = await prisma.league.findUnique({
      where: { id: params.id },
      include: {
        admin: true,
      },
    });

    if (!existingLeague) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Check authorization
    const isSuperAdmin = session.user.isSuperAdmin || session.user.roles?.includes('SUPERADMIN');
    const isOwner = existingLeague.admin.userId === session.user.id;

    if (!isSuperAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // Prepare update data (only include fields that are present in body)
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.sport !== undefined) updateData.sport = body.sport;
    if (body.season !== undefined) updateData.season = body.season;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.format !== undefined) updateData.format = body.format;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.pointsWin !== undefined) updateData.pointsWin = body.pointsWin;
    if (body.pointsDraw !== undefined) updateData.pointsDraw = body.pointsDraw;
    if (body.pointsLoss !== undefined) updateData.pointsLoss = body.pointsLoss;

    // Update league
    const updatedLeague = await prisma.league.update({
      where: { id: params.id },
      data: updateData,
      include: {
        configuration: true,
        _count: {
          select: { teams: true, fixtures: true, standings: true },
        },
      },
    });

    return NextResponse.json(updatedLeague);
  } catch (error) {
    console.error('PATCH /api/leagues/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update league', details: `${error}` },
      { status: 500 }
    );
  }
}

// DELETE league
export async function DELETE(
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
    // Check if league exists and user has permission
    const existingLeague = await prisma.league.findUnique({
      where: { id: params.id },
      include: {
        admin: true,
        _count: {
          select: {
            teams: true,
            fixtures: true,
            standings: true,
          },
        },
      },
    });

    if (!existingLeague) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Check authorization
    const isSuperAdmin = session.user.isSuperAdmin || session.user.roles?.includes('SUPERADMIN');
    const isOwner = existingLeague.admin.userId === session.user.id;

    if (!isSuperAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Warn if league has teams
    if (existingLeague._count.teams > 0) {
      console.warn(`Deleting league ${params.id} with ${existingLeague._count.teams} teams`);
    }

    // Delete league (cascades will handle related records)
    await prisma.league.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'League deleted successfully',
      deletedCounts: existingLeague._count,
    });
  } catch (error) {
    console.error('DELETE /api/leagues/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete league', details: `${error}` },
      { status: 500 }
    );
  }
}
