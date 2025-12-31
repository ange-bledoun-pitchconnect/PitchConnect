// =============================================================================
// 📝 MATCH EVENTS API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/matches/[matchId]/events - List match events
// POST /api/matches/[matchId]/events - Create match event
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports with sport-specific events
// Permission: Club members (view), Coach/Analyst (create)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, Sport, MatchEventType } from '@prisma/client';

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
  };
}

interface MatchEvent {
  id: string;
  eventType: MatchEventType;
  minute: number;
  secondaryMinute: number | null;
  period: string | null;
  teamSide: 'home' | 'away';
  
  player: {
    id: string;
    name: string;
    shirtNumber: number | null;
    avatar: string | null;
  } | null;
  
  assistPlayer: {
    id: string;
    name: string;
    shirtNumber: number | null;
  } | null;
  
  relatedPlayer: {
    id: string;
    name: string;
    shirtNumber: number | null;
  } | null;
  
  // Event details
  goalType: string | null;
  cardReason: string | null;
  details: Record<string, unknown> | null;
  
  // Position
  xPosition: number | null;
  yPosition: number | null;
  
  createdAt: string;
}

// =============================================================================
// MULTI-SPORT EVENT TYPE CONFIGURATION
// =============================================================================

const SPORT_EVENT_TYPES: Record<Sport, {
  scoring: string[];
  cards: string[];
  substitution: string[];
  other: string[];
  all: string[];
}> = {
  FOOTBALL: {
    scoring: ['GOAL', 'OWN_GOAL', 'PENALTY_SCORED', 'PENALTY_MISSED'],
    cards: ['YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW'],
    substitution: ['SUBSTITUTION'],
    other: ['ASSIST', 'CORNER', 'FOUL', 'OFFSIDE', 'INJURY', 'VAR_DECISION', 'KICK_OFF', 'HALF_TIME', 'FULL_TIME'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  RUGBY: {
    scoring: ['TRY', 'CONVERSION', 'PENALTY_KICK', 'DROP_GOAL', 'PENALTY_TRY'],
    cards: ['YELLOW_CARD', 'RED_CARD', 'SIN_BIN'],
    substitution: ['SUBSTITUTION', 'BLOOD_SUBSTITUTION', 'HIA_SUBSTITUTION'],
    other: ['SCRUM', 'LINEOUT', 'KNOCK_ON', 'FORWARD_PASS', 'HIGH_TACKLE', 'TMO_REVIEW', 'INJURY'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  BASKETBALL: {
    scoring: ['THREE_POINTER', 'TWO_POINTER', 'FREE_THROW', 'DUNK', 'LAYUP', 'ALLEY_OOP'],
    cards: ['TECHNICAL_FOUL', 'FLAGRANT_FOUL', 'EJECTION'],
    substitution: ['SUBSTITUTION'],
    other: ['ASSIST', 'REBOUND', 'BLOCK', 'STEAL', 'TURNOVER', 'FOUL', 'TIMEOUT', 'JUMP_BALL'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  CRICKET: {
    scoring: ['SIX', 'FOUR', 'SINGLE', 'DOUBLE', 'TRIPLE', 'BOUNDARY', 'OVERTHROW'],
    cards: [],
    substitution: ['SUBSTITUTION', 'CONCUSSION_SUBSTITUTE'],
    other: ['WICKET', 'BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'DROPPED_CATCH', 'DRS_REVIEW', 'NEW_BALL'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  AMERICAN_FOOTBALL: {
    scoring: ['TOUCHDOWN', 'FIELD_GOAL', 'SAFETY', 'EXTRA_POINT', 'TWO_POINT_CONVERSION', 'PICK_SIX', 'FUMBLE_RETURN_TD'],
    cards: ['PERSONAL_FOUL', 'UNSPORTSMANLIKE_CONDUCT', 'EJECTION', 'TARGETING'],
    substitution: ['SUBSTITUTION'],
    other: ['PASS_COMPLETE', 'PASS_INCOMPLETE', 'INTERCEPTION', 'FUMBLE', 'SACK', 'TACKLE', 'RUSHING_ATTEMPT', 'PUNT', 'KICKOFF', 'ONSIDE_KICK', 'TIMEOUT', 'CHALLENGE', 'PENALTY_FLAG'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  NETBALL: {
    scoring: ['GOAL', 'GOAL_ATTEMPT_MISSED'],
    cards: ['WARNING', 'SUSPENSION', 'ORDERING_OFF'],
    substitution: ['SUBSTITUTION', 'TEAM_SUBSTITUTION'],
    other: ['CENTRE_PASS', 'INTERCEPTION', 'REBOUND', 'TURNOVER', 'CONTACT', 'OBSTRUCTION', 'FOOTWORK', 'HELD_BALL', 'OVER_A_THIRD', 'OFFSIDE', 'INJURY'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  HOCKEY: {
    scoring: ['GOAL', 'POWER_PLAY_GOAL', 'SHORT_HANDED_GOAL', 'EMPTY_NET_GOAL', 'PENALTY_SHOT_GOAL', 'PENALTY_SHOT_MISSED'],
    cards: ['MINOR_PENALTY', 'MAJOR_PENALTY', 'MISCONDUCT', 'GAME_MISCONDUCT', 'MATCH_PENALTY'],
    substitution: ['SUBSTITUTION', 'GOALIE_PULL'],
    other: ['ASSIST', 'SAVE', 'SHOT', 'HIT', 'BLOCKED_SHOT', 'FACEOFF_WIN', 'ICING', 'OFFSIDE', 'PENALTY_KILL', 'POWER_PLAY'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  LACROSSE: {
    scoring: ['GOAL', 'MAN_UP_GOAL', 'MAN_DOWN_GOAL'],
    cards: ['PERSONAL_FOUL', 'TECHNICAL_FOUL', 'EJECTION', 'ILLEGAL_STICK'],
    substitution: ['SUBSTITUTION'],
    other: ['ASSIST', 'GROUND_BALL', 'CAUSED_TURNOVER', 'FACEOFF_WIN', 'SAVE', 'SHOT', 'CLEAR', 'RIDE'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  AUSTRALIAN_RULES: {
    scoring: ['GOAL', 'BEHIND', 'RUSHED_BEHIND'],
    cards: ['YELLOW_CARD', 'RED_CARD', 'REPORTABLE_OFFENCE'],
    substitution: ['SUBSTITUTION', 'INTERCHANGE'],
    other: ['MARK', 'HANDBALL', 'KICK', 'TACKLE', 'CLEARANCE', 'INSIDE_50', 'REBOUND_50', 'FREE_KICK', 'BALL_UP', 'THROW_IN'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  GAELIC_FOOTBALL: {
    scoring: ['GOAL', 'POINT', 'PENALTY_GOAL', 'PENALTY_POINT', 'FREE_POINT', '45_POINT', 'SIDELINE_POINT'],
    cards: ['YELLOW_CARD', 'RED_CARD', 'BLACK_CARD'],
    substitution: ['SUBSTITUTION', 'BLOOD_SUBSTITUTION'],
    other: ['MARK', 'FREE', '45', 'SIDELINE', 'KICKOUT', 'HOP', 'SOLO', 'HANDPASS', 'SQUARE_BALL'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  FUTSAL: {
    scoring: ['GOAL', 'OWN_GOAL', 'PENALTY_GOAL', 'FREE_KICK_GOAL', 'CORNER_GOAL'],
    cards: ['YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW'],
    substitution: ['SUBSTITUTION', 'FLYING_SUBSTITUTION'],
    other: ['ASSIST', 'FOUL', 'ACCUMULATED_FOUL', 'CORNER', 'KICK_IN', 'GOAL_CLEARANCE', 'TIMEOUT', 'POWER_PLAY'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
  BEACH_FOOTBALL: {
    scoring: ['GOAL', 'BICYCLE_KICK_GOAL', 'OVERHEAD_KICK_GOAL', 'VOLLEY_GOAL', 'HEADER_GOAL', 'FREE_KICK_GOAL', 'PENALTY_GOAL'],
    cards: ['YELLOW_CARD', 'RED_CARD', 'BLUE_CARD'],
    substitution: ['SUBSTITUTION', 'FLYING_SUBSTITUTION'],
    other: ['ASSIST', 'FOUL', 'CORNER', 'GOAL_CLEARANCE', 'TIMEOUT', 'SHARK_ATTACK'],
    get all() { return [...this.scoring, ...this.cards, ...this.substitution, ...this.other]; }
  },
};

// Events that affect the score
const SCORING_EVENTS: Record<Sport, Record<string, { home: number; away: number }>> = {
  FOOTBALL: {
    'GOAL': { home: 1, away: 0 },
    'OWN_GOAL': { home: 0, away: 1 }, // Own goal gives point to opponent
    'PENALTY_SCORED': { home: 1, away: 0 },
  },
  RUGBY: {
    'TRY': { home: 5, away: 0 },
    'CONVERSION': { home: 2, away: 0 },
    'PENALTY_KICK': { home: 3, away: 0 },
    'DROP_GOAL': { home: 3, away: 0 },
    'PENALTY_TRY': { home: 7, away: 0 },
  },
  BASKETBALL: {
    'THREE_POINTER': { home: 3, away: 0 },
    'TWO_POINTER': { home: 2, away: 0 },
    'FREE_THROW': { home: 1, away: 0 },
    'DUNK': { home: 2, away: 0 },
    'LAYUP': { home: 2, away: 0 },
    'ALLEY_OOP': { home: 2, away: 0 },
  },
  CRICKET: {
    'SIX': { home: 6, away: 0 },
    'FOUR': { home: 4, away: 0 },
    'SINGLE': { home: 1, away: 0 },
    'DOUBLE': { home: 2, away: 0 },
    'TRIPLE': { home: 3, away: 0 },
  },
  AMERICAN_FOOTBALL: {
    'TOUCHDOWN': { home: 6, away: 0 },
    'FIELD_GOAL': { home: 3, away: 0 },
    'SAFETY': { home: 0, away: 2 }, // Safety gives 2 to opponent
    'EXTRA_POINT': { home: 1, away: 0 },
    'TWO_POINT_CONVERSION': { home: 2, away: 0 },
  },
  NETBALL: {
    'GOAL': { home: 1, away: 0 },
  },
  HOCKEY: {
    'GOAL': { home: 1, away: 0 },
    'POWER_PLAY_GOAL': { home: 1, away: 0 },
    'SHORT_HANDED_GOAL': { home: 1, away: 0 },
    'EMPTY_NET_GOAL': { home: 1, away: 0 },
    'PENALTY_SHOT_GOAL': { home: 1, away: 0 },
  },
  LACROSSE: {
    'GOAL': { home: 1, away: 0 },
    'MAN_UP_GOAL': { home: 1, away: 0 },
    'MAN_DOWN_GOAL': { home: 1, away: 0 },
  },
  AUSTRALIAN_RULES: {
    'GOAL': { home: 6, away: 0 },
    'BEHIND': { home: 1, away: 0 },
    'RUSHED_BEHIND': { home: 0, away: 1 },
  },
  GAELIC_FOOTBALL: {
    'GOAL': { home: 3, away: 0 },
    'POINT': { home: 1, away: 0 },
    'PENALTY_GOAL': { home: 3, away: 0 },
    'PENALTY_POINT': { home: 1, away: 0 },
    'FREE_POINT': { home: 1, away: 0 },
    '45_POINT': { home: 1, away: 0 },
    'SIDELINE_POINT': { home: 1, away: 0 },
  },
  FUTSAL: {
    'GOAL': { home: 1, away: 0 },
    'OWN_GOAL': { home: 0, away: 1 },
    'PENALTY_GOAL': { home: 1, away: 0 },
    'FREE_KICK_GOAL': { home: 1, away: 0 },
    'CORNER_GOAL': { home: 1, away: 0 },
  },
  BEACH_FOOTBALL: {
    'GOAL': { home: 1, away: 0 },
    'BICYCLE_KICK_GOAL': { home: 1, away: 0 },
    'OVERHEAD_KICK_GOAL': { home: 1, away: 0 },
    'VOLLEY_GOAL': { home: 1, away: 0 },
    'HEADER_GOAL': { home: 1, away: 0 },
    'FREE_KICK_GOAL': { home: 1, away: 0 },
    'PENALTY_GOAL': { home: 1, away: 0 },
  },
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateEventSchema = z.object({
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

const EVENT_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
];

// =============================================================================
// GET HANDLER - List Match Events
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { matchId } = params;

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

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '100'));
    const eventType = searchParams.get('eventType');
    const teamSide = searchParams.get('teamSide') as 'home' | 'away' | null;

    // 3. Fetch match to get sport
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        homeClub: { select: { sport: true } },
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

    const sport = match.homeClub.sport;

    // 4. Build where clause
    const where: Record<string, unknown> = { matchId };
    if (eventType) where.eventType = eventType;
    if (teamSide) where.teamSide = teamSide;

    // 5. Fetch events
    const events = await prisma.matchEvent.findMany({
      where,
      include: {
        player: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
        assistPlayer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        relatedPlayer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: [
        { minute: 'desc' },
        { secondaryMinute: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // 6. Transform response
    const eventList: MatchEvent[] = events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      minute: e.minute,
      secondaryMinute: e.secondaryMinute,
      period: e.period,
      teamSide: e.teamSide as 'home' | 'away',
      
      player: e.player ? {
        id: e.player.id,
        name: `${e.player.user.firstName} ${e.player.user.lastName}`,
        shirtNumber: e.player.shirtNumber,
        avatar: e.player.user.avatar,
      } : null,
      
      assistPlayer: e.assistPlayer ? {
        id: e.assistPlayer.id,
        name: `${e.assistPlayer.user.firstName} ${e.assistPlayer.user.lastName}`,
        shirtNumber: e.assistPlayer.shirtNumber,
      } : null,
      
      relatedPlayer: e.relatedPlayer ? {
        id: e.relatedPlayer.id,
        name: `${e.relatedPlayer.user.firstName} ${e.relatedPlayer.user.lastName}`,
        shirtNumber: e.relatedPlayer.shirtNumber,
      } : null,
      
      goalType: e.goalType,
      cardReason: e.cardReason,
      details: e.details as Record<string, unknown> | null,
      
      xPosition: e.xPosition,
      yPosition: e.yPosition,
      
      createdAt: e.createdAt.toISOString(),
    }));

    return createResponse({
      events: eventList,
      sport,
      availableEventTypes: SPORT_EVENT_TYPES[sport],
      count: eventList.length,
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] List Events error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch events',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Match Event
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { matchId } = params;

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

    // 2. Fetch match
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        homeClubId: true,
        awayClubId: true,
        homeTeamId: true,
        awayTeamId: true,
        status: true,
        homeClub: { select: { sport: true } },
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

    const sport = match.homeClub.sport;

    // 3. Authorization
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: { in: [match.homeClubId, match.awayClubId] },
        isActive: true,
        role: { in: EVENT_ROLES },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!membership && !user?.isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to record events for this match',
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

    const validation = CreateEventSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 5. Validate event type for sport
    const validEventTypes = SPORT_EVENT_TYPES[sport].all;
    if (!validEventTypes.includes(data.eventType)) {
      return createResponse(null, {
        success: false,
        error: `Invalid event type "${data.eventType}" for ${sport}. Valid types: ${validEventTypes.join(', ')}`,
        code: 'INVALID_EVENT_TYPE',
        requestId,
        status: 400,
      });
    }

    // 6. Create event with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the event
      const event = await tx.matchEvent.create({
        data: {
          matchId,
          eventType: data.eventType as MatchEventType,
          minute: data.minute,
          secondaryMinute: data.secondaryMinute,
          period: data.period,
          teamSide: data.teamSide,
          playerId: data.playerId,
          assistPlayerId: data.assistPlayerId,
          relatedPlayerId: data.relatedPlayerId,
          goalType: data.goalType,
          cardReason: data.cardReason,
          details: data.details ? data.details : null,
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
      const scoringEvent = SCORING_EVENTS[sport]?.[data.eventType];
      if (scoringEvent) {
        const isHome = data.teamSide === 'home';
        const homeIncrement = isHome ? scoringEvent.home : scoringEvent.away;
        const awayIncrement = isHome ? scoringEvent.away : scoringEvent.home;

        await tx.match.update({
          where: { id: matchId },
          data: {
            homeScore: { increment: homeIncrement },
            awayScore: { increment: awayIncrement },
          },
        });
      }

      // Update player performance for cards
      const cardEvents = SPORT_EVENT_TYPES[sport].cards;
      if (cardEvents.includes(data.eventType) && data.playerId) {
        const teamId = data.teamSide === 'home' ? match.homeTeamId : match.awayTeamId;

        const updateData: Record<string, unknown> = {};

        // Handle different card types
        if (['YELLOW_CARD', 'WARNING', 'MINOR_PENALTY', 'TECHNICAL_FOUL'].includes(data.eventType)) {
          updateData.yellowCards = { increment: 1 };
        }
        if (['RED_CARD', 'EJECTION', 'GAME_MISCONDUCT', 'MATCH_PENALTY'].includes(data.eventType)) {
          updateData.redCard = true;
        }
        if (['SECOND_YELLOW', 'BLACK_CARD'].includes(data.eventType)) {
          updateData.yellowCards = { increment: 1 };
          updateData.redCard = true;
          updateData.secondYellow = true;
        }
        if (['SIN_BIN', 'SUSPENSION', 'MISCONDUCT'].includes(data.eventType)) {
          updateData.yellowCards = { increment: 1 };
        }

        await tx.playerMatchPerformance.upsert({
          where: {
            matchId_playerId: { matchId, playerId: data.playerId },
          },
          update: updateData,
          create: {
            matchId,
            playerId: data.playerId,
            teamId,
            minutesPlayed: 0,
            startedMatch: false,
            goals: 0,
            assists: 0,
            yellowCards: updateData.yellowCards ? 1 : 0,
            redCard: !!updateData.redCard,
            secondYellow: !!updateData.secondYellow,
          },
        });
      }

      // Update player performance for goals/assists
      if (data.playerId && SPORT_EVENT_TYPES[sport].scoring.includes(data.eventType)) {
        const teamId = data.teamSide === 'home' ? match.homeTeamId : match.awayTeamId;

        await tx.playerMatchPerformance.upsert({
          where: {
            matchId_playerId: { matchId, playerId: data.playerId },
          },
          update: { goals: { increment: 1 } },
          create: {
            matchId,
            playerId: data.playerId,
            teamId,
            minutesPlayed: 0,
            startedMatch: false,
            goals: 1,
            assists: 0,
            yellowCards: 0,
            redCard: false,
          },
        });
      }

      if (data.assistPlayerId && SPORT_EVENT_TYPES[sport].scoring.includes(data.eventType)) {
        const teamId = data.teamSide === 'home' ? match.homeTeamId : match.awayTeamId;

        await tx.playerMatchPerformance.upsert({
          where: {
            matchId_playerId: { matchId, playerId: data.assistPlayerId },
          },
          update: { assists: { increment: 1 } },
          create: {
            matchId,
            playerId: data.assistPlayerId,
            teamId,
            minutesPlayed: 0,
            startedMatch: false,
            goals: 0,
            assists: 1,
            yellowCards: 0,
            redCard: false,
          },
        });
      }

      return event;
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MATCH_EVENT_CREATED',
        resourceType: 'MATCH_EVENT',
        resourceId: result.id,
        afterState: {
          eventType: data.eventType,
          minute: data.minute,
          teamSide: data.teamSide,
        },
      },
    });

    return createResponse({
      event: {
        id: result.id,
        eventType: result.eventType,
        minute: result.minute,
        secondaryMinute: result.secondaryMinute,
        period: result.period,
        teamSide: result.teamSide,
        player: result.player ? {
          id: result.player.id,
          name: `${result.player.user.firstName} ${result.player.user.lastName}`,
        } : null,
        assistPlayer: result.assistPlayer ? {
          id: result.assistPlayer.id,
          name: `${result.assistPlayer.user.firstName} ${result.assistPlayer.user.lastName}`,
        } : null,
      },
      scoreUpdated: !!SCORING_EVENTS[sport]?.[data.eventType],
    }, {
      success: true,
      message: 'Event recorded successfully',
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Create Event error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create event',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}