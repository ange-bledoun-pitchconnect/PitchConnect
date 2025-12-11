import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { matches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const liveStatsSchema = z.object({
  possession: z.number().min(0).max(100),
  shots: z.number().min(0),
  shotsOnTarget: z.number().min(0).optional(),
  passes: z.number().min(0).optional(),
  passAccuracy: z.number().min(0).max(100).optional(),
  fouls: z.number().min(0).optional(),
  yellowCards: z.number().min(0).optional(),
  redCards: z.number().min(0).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, params.matchId))
      .limit(1)
      .then((result) => result);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        matchId: match.id,
        stats: match.liveStats || {},
      },
    });
  } catch (error) {
    console.error('Get live stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get live stats' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const stats = liveStatsSchema.parse(body);

    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, params.matchId))
      .limit(1)
      .then((result) => result);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    await db
      .update(matches)
      .set({ liveStats: stats })
      .where(eq(matches.id, params.matchId));

    return NextResponse.json({
      data: { stats, matchId: params.matchId },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Update live stats error:', error);
    return NextResponse.json(
      { error: 'Failed to update live stats' },
      { status: 500 },
    );
  }
}
