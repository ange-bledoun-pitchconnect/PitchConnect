// ============================================================================
// 🔌 MATCH EVENTS API ROUTE v7.4.0
// ============================================================================
// /api/matches/[matchId]/events - CRUD for match events
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createEventSchema = z.object({
  eventType: z.string().min(1),
  minute: z.number().min(0).max(200),
  secondaryMinute: z.number().nullable().optional(),
  period: z.string().optional(),
  teamSide: z.enum(['home', 'away']),
  playerId: z.string().nullable().optional(),
  assistPlayerId: z.string().nullable().optional(),
  relatedPlayerId: z.string().nullable().optional(),
  goalType: z.string().nullable().optional(),
  cardReason: z.string().nullable().optional(),
  details: z.string().optional(),
  xPosition: z.number().nullable().optional(),
  yPosition: z.number().nullable().optional(),
});

// ============================================================================
// GET /api/matches/[matchId]/events
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const events = await prisma.matchEvent.findMany({
      where: { matchId: params.matchId },
      include: {
        player: {
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
        assistPlayer: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        relatedPlayer: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ minute: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('GET /api/matches/[matchId]/events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/matches/[matchId]/events
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

    // Verify match exists
    const match = await prisma.match.findUnique({
      where: { id: params.matchId, deletedAt: null },
      select: { homeClubId: true, awayClubId: true, homeTeamId: true, awayTeamId: true },
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
        { error: 'You do not have permission to record events for this match' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createEventSchema.parse(body);

    // Create event
    const event = await prisma.matchEvent.create({
      data: {
        matchId: params.matchId,
        eventType: data.eventType as any,
        minute: data.minute,
        secondaryMinute: data.secondaryMinute,
        period: data.period,
        teamSide: data.teamSide,
        playerId: data.playerId,
        assistPlayerId: data.assistPlayerId,
        relatedPlayerId: data.relatedPlayerId,
        goalType: data.goalType,
        cardReason: data.cardReason,
        details: data.details ? { note: data.details } : null,
        xPosition: data.xPosition,
        yPosition: data.yPosition,
      },
      include: {
        player: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        assistPlayer: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Update match score if scoring event
    const scoringEvents = ['GOAL', 'PENALTY_SCORED', 'TRY', 'TOUCHDOWN', 'THREE_POINTER', 'TWO_POINTER'];
    if (scoringEvents.includes(data.eventType)) {
      const field = data.teamSide === 'home' ? 'homeScore' : 'awayScore';
      await prisma.match.update({
        where: { id: params.matchId },
        data: { [field]: { increment: 1 } },
      });
    }

    // Update cards
    if (data.eventType === 'YELLOW_CARD' || data.eventType === 'SECOND_YELLOW') {
      if (data.playerId) {
        await prisma.playerMatchPerformance.upsert({
          where: {
            matchId_playerId: { matchId: params.matchId, playerId: data.playerId },
          },
          update: { yellowCards: { increment: 1 } },
          create: {
            matchId: params.matchId,
            playerId: data.playerId,
            teamId: data.teamSide === 'home' ? match.homeTeamId : match.awayTeamId,
            yellowCards: 1,
            minutesPlayed: 0,
            startedMatch: false,
            goals: 0,
            assists: 0,
            redCard: false,
            secondYellow: data.eventType === 'SECOND_YELLOW',
          },
        });
      }
    }

    if (data.eventType === 'RED_CARD' || data.eventType === 'SECOND_YELLOW') {
      if (data.playerId) {
        await prisma.playerMatchPerformance.upsert({
          where: {
            matchId_playerId: { matchId: params.matchId, playerId: data.playerId },
          },
          update: { 
            redCard: true,
            secondYellow: data.eventType === 'SECOND_YELLOW',
          },
          create: {
            matchId: params.matchId,
            playerId: data.playerId,
            teamId: data.teamSide === 'home' ? match.homeTeamId : match.awayTeamId,
            yellowCards: 0,
            minutesPlayed: 0,
            startedMatch: false,
            goals: 0,
            assists: 0,
            redCard: true,
            secondYellow: data.eventType === 'SECOND_YELLOW',
          },
        });
      }
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('POST /api/matches/[matchId]/events error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
