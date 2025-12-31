// =============================================================================
// 📝 INDIVIDUAL MATCH EVENT API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/matches/[matchId]/events/[eventId] - Get event details
// PATCH  /api/matches/[matchId]/events/[eventId] - Update event
// DELETE /api/matches/[matchId]/events/[eventId] - Delete event
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Coach/Analyst (edit), Manager (delete)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, Sport } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  requestId: string;
  timestamp: string;
}

interface RouteParams {
  params: {
    matchId: string;
    eventId: string;
  };
}

// =============================================================================
// SCORING EVENTS (for score reversal on delete)
// =============================================================================

const SCORING_EVENTS: Record<Sport, Record<string, { home: number; away: number }>> = {
  FOOTBALL: { 'GOAL': { home: 1, away: 0 }, 'OWN_GOAL': { home: 0, away: 1 }, 'PENALTY_SCORED': { home: 1, away: 0 } },
  RUGBY: { 'TRY': { home: 5, away: 0 }, 'CONVERSION': { home: 2, away: 0 }, 'PENALTY_KICK': { home: 3, away: 0 }, 'DROP_GOAL': { home: 3, away: 0 }, 'PENALTY_TRY': { home: 7, away: 0 } },
  BASKETBALL: { 'THREE_POINTER': { home: 3, away: 0 }, 'TWO_POINTER': { home: 2, away: 0 }, 'FREE_THROW': { home: 1, away: 0 }, 'DUNK': { home: 2, away: 0 }, 'LAYUP': { home: 2, away: 0 } },
  CRICKET: { 'SIX': { home: 6, away: 0 }, 'FOUR': { home: 4, away: 0 }, 'SINGLE': { home: 1, away: 0 }, 'DOUBLE': { home: 2, away: 0 }, 'TRIPLE': { home: 3, away: 0 } },
  AMERICAN_FOOTBALL: { 'TOUCHDOWN': { home: 6, away: 0 }, 'FIELD_GOAL': { home: 3, away: 0 }, 'SAFETY': { home: 0, away: 2 }, 'EXTRA_POINT': { home: 1, away: 0 }, 'TWO_POINT_CONVERSION': { home: 2, away: 0 } },
  NETBALL: { 'GOAL': { home: 1, away: 0 } },
  HOCKEY: { 'GOAL': { home: 1, away: 0 }, 'POWER_PLAY_GOAL': { home: 1, away: 0 }, 'SHORT_HANDED_GOAL': { home: 1, away: 0 }, 'EMPTY_NET_GOAL': { home: 1, away: 0 } },
  LACROSSE: { 'GOAL': { home: 1, away: 0 }, 'MAN_UP_GOAL': { home: 1, away: 0 }, 'MAN_DOWN_GOAL': { home: 1, away: 0 } },
  AUSTRALIAN_RULES: { 'GOAL': { home: 6, away: 0 }, 'BEHIND': { home: 1, away: 0 }, 'RUSHED_BEHIND': { home: 0, away: 1 } },
  GAELIC_FOOTBALL: { 'GOAL': { home: 3, away: 0 }, 'POINT': { home: 1, away: 0 }, 'PENALTY_GOAL': { home: 3, away: 0 }, 'FREE_POINT': { home: 1, away: 0 } },
  FUTSAL: { 'GOAL': { home: 1, away: 0 }, 'OWN_GOAL': { home: 0, away: 1 }, 'PENALTY_GOAL': { home: 1, away: 0 } },
  BEACH_FOOTBALL: { 'GOAL': { home: 1, away: 0 }, 'BICYCLE_KICK_GOAL': { home: 1, away: 0 }, 'PENALTY_GOAL': { home: 1, away: 0 } },
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateEventSchema = z.object({
  minute: z.number().min(0).max(200).optional(),
  secondaryMinute: z.number().nullable().optional(),
  period: z.string().optional(),
  playerId: z.string().nullable().optional(),
  assistPlayerId: z.string().nullable().optional(),
  relatedPlayerId: z.string().nullable().optional(),
  goalType: z.string().nullable().optional(),
  cardReason: z.string().nullable().optional(),
  details: z.record(z.unknown()).nullable().optional(),
  xPosition: z.number().min(0).max(100).nullable().optional(),
  yPosition: z.number().min(0).max(100).nullable().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: string;
    code?: string;
    message?: string;
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    requestId: options.requestId,
    timestamp: new Date().toISOString(),
  };

  if (options.success && data !== null) response.data = data;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;
  if (options.message) response.message = options.message;

  return NextResponse.json(response, { status: options.status || 200 });
}

const EDIT_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
];

const DELETE_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

// =============================================================================
// GET HANDLER - Get Event Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { matchId, eventId } = params;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Fetch event
    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId, matchId },
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
        match: {
          select: {
            homeClub: { select: { sport: true } },
          },
        },
      },
    });

    if (!event) {
      return createResponse(null, {
        success: false,
        error: 'Event not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    return createResponse({
      id: event.id,
      matchId: event.matchId,
      eventType: event.eventType,
      minute: event.minute,
      secondaryMinute: event.secondaryMinute,
      period: event.period,
      teamSide: event.teamSide,
      player: event.player ? {
        id: event.player.id,
        name: `${event.player.user.firstName} ${event.player.user.lastName}`,
        avatar: event.player.user.avatar,
      } : null,
      assistPlayer: event.assistPlayer ? {
        id: event.assistPlayer.id,
        name: `${event.assistPlayer.user.firstName} ${event.assistPlayer.user.lastName}`,
      } : null,
      relatedPlayer: event.relatedPlayer ? {
        id: event.relatedPlayer.id,
        name: `${event.relatedPlayer.user.firstName} ${event.relatedPlayer.user.lastName}`,
      } : null,
      goalType: event.goalType,
      cardReason: event.cardReason,
      details: event.details,
      xPosition: event.xPosition,
      yPosition: event.yPosition,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Event error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch event',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Event
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { matchId, eventId } = params;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Fetch event with match info
    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId, matchId },
      include: {
        match: {
          select: {
            homeClubId: true,
            awayClubId: true,
          },
        },
      },
    });

    if (!event) {
      return createResponse(null, {
        success: false,
        error: 'Event not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 3. Authorization
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: { in: [event.match.homeClubId, event.match.awayClubId] },
        isActive: true,
        role: { in: EDIT_ROLES },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!membership && !user?.isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to edit this event',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 4. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
        requestId,
        status: 400,
      });
    }

    const validation = UpdateEventSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const updates = validation.data;

    // 5. Update event
    const updatedEvent = await prisma.matchEvent.update({
      where: { id: eventId },
      data: updates,
      include: {
        player: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // 6. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MATCH_EVENT_UPDATED',
        resourceType: 'MATCH_EVENT',
        resourceId: eventId,
        beforeState: {
          minute: event.minute,
          playerId: event.playerId,
        },
        afterState: updates,
      },
    });

    return createResponse({
      id: updatedEvent.id,
      eventType: updatedEvent.eventType,
      minute: updatedEvent.minute,
      player: updatedEvent.player ? {
        id: updatedEvent.player.id,
        name: `${updatedEvent.player.user.firstName} ${updatedEvent.player.user.lastName}`,
      } : null,
      updated: true,
    }, {
      success: true,
      message: 'Event updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Update Event error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update event',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Delete Event
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { matchId, eventId } = params;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Fetch event with match info
    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId, matchId },
      include: {
        match: {
          select: {
            homeClubId: true,
            awayClubId: true,
            homeTeamId: true,
            awayTeamId: true,
            homeClub: { select: { sport: true } },
          },
        },
      },
    });

    if (!event) {
      return createResponse(null, {
        success: false,
        error: 'Event not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 3. Authorization (more restrictive for delete)
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: { in: [event.match.homeClubId, event.match.awayClubId] },
        isActive: true,
        role: { in: DELETE_ROLES },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!membership && !user?.isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to delete this event',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    const sport = event.match.homeClub.sport;

    // 4. Delete event and reverse any score changes
    await prisma.$transaction(async (tx) => {
      // Reverse score if it was a scoring event
      const scoringEvent = SCORING_EVENTS[sport]?.[event.eventType];
      if (scoringEvent) {
        const isHome = event.teamSide === 'home';
        const homeDecrement = isHome ? scoringEvent.home : scoringEvent.away;
        const awayDecrement = isHome ? scoringEvent.away : scoringEvent.home;

        await tx.match.update({
          where: { id: matchId },
          data: {
            homeScore: { decrement: homeDecrement },
            awayScore: { decrement: awayDecrement },
          },
        });
      }

      // Reverse player performance updates for cards
      if (event.playerId) {
        const cardEvents = ['YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW'];
        if (cardEvents.includes(event.eventType)) {
          const performance = await tx.playerMatchPerformance.findUnique({
            where: {
              matchId_playerId: { matchId, playerId: event.playerId },
            },
          });

          if (performance) {
            const updateData: Record<string, unknown> = {};

            if (event.eventType === 'YELLOW_CARD') {
              updateData.yellowCards = { decrement: 1 };
            }
            if (event.eventType === 'RED_CARD') {
              updateData.redCard = false;
            }
            if (event.eventType === 'SECOND_YELLOW') {
              updateData.yellowCards = { decrement: 1 };
              updateData.redCard = false;
              updateData.secondYellow = false;
            }

            await tx.playerMatchPerformance.update({
              where: { matchId_playerId: { matchId, playerId: event.playerId } },
              data: updateData,
            });
          }
        }

        // Reverse goals/assists
        if (scoringEvent && scoringEvent.home > 0) {
          await tx.playerMatchPerformance.updateMany({
            where: { matchId, playerId: event.playerId },
            data: { goals: { decrement: 1 } },
          });
        }
      }

      if (event.assistPlayerId && scoringEvent && scoringEvent.home > 0) {
        await tx.playerMatchPerformance.updateMany({
          where: { matchId, playerId: event.assistPlayerId },
          data: { assists: { decrement: 1 } },
        });
      }

      // Delete the event
      await tx.matchEvent.delete({
        where: { id: eventId },
      });
    });

    // 5. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MATCH_EVENT_DELETED',
        resourceType: 'MATCH_EVENT',
        resourceId: eventId,
        beforeState: {
          eventType: event.eventType,
          minute: event.minute,
          teamSide: event.teamSide,
          playerId: event.playerId,
        },
      },
    });

    return createResponse(null, {
      success: true,
      message: 'Event deleted and related stats reversed',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Delete Event error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete event',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}