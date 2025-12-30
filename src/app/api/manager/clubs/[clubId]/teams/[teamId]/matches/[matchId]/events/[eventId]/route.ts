// =============================================================================
// ⚡ DELETE MATCH EVENT API - Enterprise-Grade Implementation
// =============================================================================
// DELETE /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events/[eventId]
// Remove a match event and adjust score if needed
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club Owner, Manager, Head Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Sport, ClubMemberRole, MatchEventType } from '@prisma/client';

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
    clubId: string;
    teamId: string;
    matchId: string;
    eventId: string;
  };
}

// =============================================================================
// SPORT-SPECIFIC SCORING EVENTS
// =============================================================================

const SCORING_EVENTS: Record<Sport, { event: MatchEventType; points: number }[]> = {
  FOOTBALL: [{ event: 'GOAL', points: 1 }, { event: 'OWN_GOAL', points: 1 }, { event: 'PENALTY_SCORED', points: 1 }],
  FUTSAL: [{ event: 'GOAL', points: 1 }, { event: 'OWN_GOAL', points: 1 }, { event: 'PENALTY_SCORED', points: 1 }],
  BEACH_FOOTBALL: [{ event: 'GOAL', points: 1 }, { event: 'OWN_GOAL', points: 1 }],
  RUGBY: [{ event: 'TRY', points: 5 }, { event: 'CONVERSION', points: 2 }, { event: 'PENALTY_KICK', points: 3 }, { event: 'DROP_GOAL', points: 3 }],
  CRICKET: [],
  AMERICAN_FOOTBALL: [{ event: 'TOUCHDOWN', points: 6 }, { event: 'FIELD_GOAL', points: 3 }, { event: 'EXTRA_POINT', points: 1 }, { event: 'TWO_POINT_CONVERSION', points: 2 }, { event: 'SAFETY', points: 2 }],
  BASKETBALL: [{ event: 'FIELD_GOAL', points: 2 }, { event: 'THREE_POINTER', points: 3 }, { event: 'FREE_THROW', points: 1 }],
  HOCKEY: [{ event: 'GOAL', points: 1 }],
  LACROSSE: [{ event: 'GOAL', points: 1 }],
  NETBALL: [{ event: 'GOAL', points: 1 }],
  AUSTRALIAN_RULES: [{ event: 'GOAL', points: 6 }, { event: 'BEHIND', points: 1 }],
  GAELIC_FOOTBALL: [{ event: 'GOAL', points: 3 }, { event: 'POINT', points: 1 }],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `event_del_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const EDIT_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

async function hasEditPermission(userId: string, clubId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (user?.isSuperAdmin) return true;

  const clubMember = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: EDIT_ROLES },
    },
  });

  return !!clubMember;
}

// =============================================================================
// DELETE HANDLER - Remove Match Event
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, matchId, eventId } = params;

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

    // 2. Authorization
    const canEdit = await hasEditPermission(session.user.id, clubId);
    if (!canEdit) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to delete match events',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Get club sport
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { sport: true },
    });

    if (!club) {
      return createResponse(null, {
        success: false,
        error: 'Club not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Fetch match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        status: true,
      },
    });

    if (!match) {
      return createResponse(null, {
        success: false,
        error: 'Match not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Match not found for this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Fetch event
    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId },
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
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

    if (event.matchId !== matchId) {
      return createResponse(null, {
        success: false,
        error: 'Event not found for this match',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 6. Check if this is a scoring event and adjust score
    const sportScoringEvents = SCORING_EVENTS[club.sport] || [];
    const scoringEvent = sportScoringEvents.find((s) => s.event === event.eventType);

    if (scoringEvent) {
      const isHomeEvent = event.teamId === match.homeTeamId;
      const currentHomeScore = match.homeScore || 0;
      const currentAwayScore = match.awayScore || 0;

      // Subtract points from the team that scored
      const newHomeScore = isHomeEvent 
        ? Math.max(0, currentHomeScore - scoringEvent.points)
        : currentHomeScore;
      const newAwayScore = !isHomeEvent 
        ? Math.max(0, currentAwayScore - scoringEvent.points)
        : currentAwayScore;

      await prisma.match.update({
        where: { id: matchId },
        data: {
          homeScore: newHomeScore,
          awayScore: newAwayScore,
        },
      });
    }

    // 7. Delete the event
    await prisma.matchEvent.delete({
      where: { id: eventId },
    });

    // 8. Create audit log
    const playerName = event.player 
      ? `${event.player.user.firstName} ${event.player.user.lastName}`
      : 'Unknown';

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'MATCH_EVENT',
        entityId: eventId,
        description: `Deleted ${event.eventType} at ${event.minute}' by ${playerName}`,
        metadata: {
          matchId,
          eventType: event.eventType,
          minute: event.minute,
          playerId: event.playerId,
          scoreAdjusted: !!scoringEvent,
        },
      },
    });

    return createResponse({
      deletedEventId: eventId,
      eventType: event.eventType,
      scoreAdjusted: !!scoringEvent,
    }, {
      success: true,
      message: `${event.eventType} event deleted successfully`,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Delete Event error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete match event',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
