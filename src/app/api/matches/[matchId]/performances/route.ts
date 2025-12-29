// ============================================================================
// 🔌 MATCH PERFORMANCES API ROUTE v7.4.0
// ============================================================================
// /api/matches/[matchId]/performances - Player match performances
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const performanceSchema = z.object({
  playerId: z.string().min(1),
  teamId: z.string().min(1),
  minutesPlayed: z.number().min(0).max(200).default(0),
  startedMatch: z.boolean().default(false),
  substituteOn: z.number().nullable().optional(),
  substituteOff: z.number().nullable().optional(),
  goals: z.number().min(0).default(0),
  assists: z.number().min(0).default(0),
  yellowCards: z.number().min(0).max(2).default(0),
  redCard: z.boolean().default(false),
  secondYellow: z.boolean().default(false),
  passes: z.number().min(0).default(0),
  passesComplete: z.number().min(0).default(0),
  shots: z.number().min(0).default(0),
  shotsOnTarget: z.number().min(0).default(0),
  tackles: z.number().min(0).default(0),
  interceptions: z.number().min(0).default(0),
  saves: z.number().min(0).default(0),
  rating: z.number().min(0).max(10).nullable().optional(),
  coachRating: z.number().min(0).max(10).nullable().optional(),
  coachNotes: z.string().nullable().optional(),
  sportSpecificStats: z.record(z.unknown()).nullable().optional(),
});

// ============================================================================
// GET /api/matches/[matchId]/performances
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    const where: Record<string, unknown> = {
      matchId: params.matchId,
    };

    if (teamId) {
      where.teamId = teamId;
    }

    const performances = await prisma.playerMatchPerformance.findMany({
      where,
      include: {
        player: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
      orderBy: [
        { startedMatch: 'desc' },
        { minutesPlayed: 'desc' },
        { rating: 'desc' },
      ],
    });

    return NextResponse.json({ performances });
  } catch (error) {
    console.error('GET /api/matches/[matchId]/performances error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performances' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/matches/[matchId]/performances
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get match
    const match = await prisma.match.findUnique({
      where: { id: params.matchId, deletedAt: null },
      select: {
        homeClubId: true,
        awayClubId: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: { in: [match.homeClubId, match.awayClubId] },
        isActive: true,
        deletedAt: null,
        OR: [
          { role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'ANALYST'] } },
          { canManageMatches: true },
        ],
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have permission to record performances' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = performanceSchema.parse(body);

    // Upsert performance
    const performance = await prisma.playerMatchPerformance.upsert({
      where: {
        matchId_playerId: {
          matchId: params.matchId,
          playerId: data.playerId,
        },
      },
      update: data,
      create: {
        matchId: params.matchId,
        ...data,
      },
      include: {
        player: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json({ performance }, { status: 201 });
  } catch (error) {
    console.error('POST /api/matches/[matchId]/performances error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record performance' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/matches/[matchId]/performances (Bulk update)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get match
    const match = await prisma.match.findUnique({
      where: { id: params.matchId, deletedAt: null },
      select: { homeClubId: true, awayClubId: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: { in: [match.homeClubId, match.awayClubId] },
        isActive: true,
        deletedAt: null,
        OR: [
          { role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] } },
          { canManageMatches: true },
        ],
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have permission to update performances' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const performances = z.array(performanceSchema).parse(body.performances);

    // Bulk upsert
    const results = await Promise.all(
      performances.map((data) =>
        prisma.playerMatchPerformance.upsert({
          where: {
            matchId_playerId: {
              matchId: params.matchId,
              playerId: data.playerId,
            },
          },
          update: data,
          create: {
            matchId: params.matchId,
            ...data,
          },
        })
      )
    );

    return NextResponse.json({ performances: results });
  } catch (error) {
    console.error('PUT /api/matches/[matchId]/performances error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update performances' },
      { status: 500 }
    );
  }
}
