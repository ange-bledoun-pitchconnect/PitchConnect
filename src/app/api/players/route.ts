/**
 * Players API Endpoints
 * GET    /api/players       - Get all players (with filters)
 * POST   /api/players       - Create new player
 * GET    /api/players/:id   - Get single player
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

/**
 * GET /api/players
 * Get all players with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const leagueId = searchParams.get('leagueId');
    const position = searchParams.get('position');

    const where: any = {};
    if (teamId) {
      where.teams = {
        some: { teamId },
      };
    }
    if (position) {
      where.position = position;
    }

    const players = await db.player.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        teams: {
          include: { team: true },
        },
        stats: true,
      },
      take: 50,
    });

    return NextResponse.json(players, { status: 200 });
  } catch (error) {
    console.error('[API] Players GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players
 * Create new player
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      position,
      preferredFoot,
      height,
      weight,
    } = body;

    // Validation
    if (!firstName || !lastName || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create player
    const player = await db.player.create({
      data: {
        userId: (session.user as any).id,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        nationality,
        position,
        preferredFoot,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('[API] Players POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
