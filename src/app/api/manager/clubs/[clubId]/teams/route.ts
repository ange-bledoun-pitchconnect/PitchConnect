/**
 * List or Create Teams API
 *
 * GET /api/manager/clubs/[clubId]/teams
 * POST /api/manager/clubs/[clubId]/teams
 *
 * GET: Retrieves all teams for a club
 * POST: Creates a new team for a club
 *
 * Authorization: Only club owner can access
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId } = params;

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

    // Get all teams for this club
    const teams = await prisma.team.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
    });

    // Get player count for each team via raw SQL
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const playerCount: any = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM "TeamMember" WHERE "teamId" = ${team.id}
        `;
        return {
          ...team,
          playerCount: playerCount[0]?.count || 0,
        };
      })
    );

    return NextResponse.json(teamsWithCounts);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId]/teams error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId } = params;
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

    // Validation
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    if (!body.category?.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // Create team (no coachId - coaches are assigned to TrainingSession, not Team)
    const team = await prisma.team.create({
      data: {
        clubId,
        name: body.name.trim(),
        code: body.code?.trim() || body.name.trim().toUpperCase().substring(0, 3),
        category: body.category.trim(),
        ageGroup: body.ageGroup?.trim() || 'SENIOR',
        status: 'ACTIVE',
        description: body.description?.trim() || null,
      },
    });

    // Get player count via raw SQL
    const playerCount: any = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "TeamMember" WHERE "teamId" = ${team.id}
    `;

    return NextResponse.json(
      {
        ...team,
        playerCount: playerCount[0]?.count || 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/manager/clubs/[clubId]/teams error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
