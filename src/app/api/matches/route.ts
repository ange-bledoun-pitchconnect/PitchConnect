/**
 * Matches API Endpoints
 * GET    /api/matches       - Get all matches
 * POST   /api/matches       - Create new match
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { MatchStatus, Prisma } from '@prisma/client';

/**
 * GET /api/matches
 * Get matches with filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Use Prisma types for proper type safety
    const where: Prisma.MatchWhereInput = {};
    if (teamId) {
      where.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ];
    }
    if (status && Object.values(MatchStatus).includes(status as MatchStatus)) {
      where.status = status as MatchStatus;
    }

    const matches = await db.match.findMany({
      where,
      include: {
        homeTeam: { include: { club: true } },
        awayTeam: { include: { club: true } },
        stats: true,
        events: true,
      },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json(matches, { status: 200 });
  } catch (error) {
    console.error('[API] Matches GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matches
 * Create new match
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { homeTeamId, awayTeamId, date, venue, fixtureId } = body;

    if (!homeTeamId || !awayTeamId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const match = await db.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        date: new Date(date),
        venue: venue || 'TBD',
        fixtureId: fixtureId || undefined,
        status: MatchStatus.SCHEDULED,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('[API] Matches POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
