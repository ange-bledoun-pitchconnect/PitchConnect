/**
 * Teams API Endpoints
 * GET    /api/teams       - Get all teams
 * POST   /api/teams       - Create new team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

/**
 * GET /api/teams
 * Get all teams with pagination
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const teams = await db.team.findMany({
      where: clubId ? { clubId } : {},
      include: {
        club: true,
        coach: { include: { user: true } },
        players: {
          include: {
            player: {
              include: { user: true },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await db.team.count({
      where: clubId ? { clubId } : {},
    });

    return NextResponse.json(
      {
        data: teams,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Teams GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams
 * Create new team
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clubId, name, category, season, coachId } = body;

    if (!clubId || !name || !category || !coachId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const team = await db.team.create({
      data: {
        clubId,
        name,
        category,
        season: season || new Date().getFullYear(),
        coachId,
        status: 'ACTIVE',
      },
      include: {
        club: true,
        coach: true,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('[API] Teams POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
