// =============================================================================
// ⚽ MATCHES API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/matches - List matches with filters
// POST /api/matches - Create new match
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club members (view), Coach/Manager (create)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  ClubMemberRole,
  Sport,
  MatchStatus,
  MatchType,
  CompetitionStage,
} from '@prisma/client';

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

interface MatchListItem {
  id: string;
  matchType: MatchType;
  status: MatchStatus;
  kickOffTime: string;
  venue: string | null;
  
  homeTeam: {
    id: string;
    name: string;
    logo: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    logo: string | null;
  };
  homeClub: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    sport: Sport;
  };
  awayClub: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
  };
  
  homeScore: number | null;
  awayScore: number | null;
  
  competition: {
    id: string;
    name: string;
    shortName: string | null;
  } | null;
  
  isLive: boolean;
  resultApprovalStatus: string | null;
}

// =============================================================================
// MULTI-SPORT CONFIGURATION
// =============================================================================

const SPORT_MATCH_CONFIG: Record<Sport, {
  defaultDuration: number; // minutes
  periods: number;
  periodNames: string[];
  hasExtraTime: boolean;
  hasPenalties: boolean;
  scoreTypes: string[];
}> = {
  FOOTBALL: {
    defaultDuration: 90,
    periods: 2,
    periodNames: ['First Half', 'Second Half'],
    hasExtraTime: true,
    hasPenalties: true,
    scoreTypes: ['goals'],
  },
  RUGBY: {
    defaultDuration: 80,
    periods: 2,
    periodNames: ['First Half', 'Second Half'],
    hasExtraTime: true,
    hasPenalties: false,
    scoreTypes: ['tries', 'conversions', 'penalties', 'dropGoals'],
  },
  BASKETBALL: {
    defaultDuration: 48,
    periods: 4,
    periodNames: ['Q1', 'Q2', 'Q3', 'Q4'],
    hasExtraTime: true,
    hasPenalties: false,
    scoreTypes: ['points'],
  },
  CRICKET: {
    defaultDuration: 0, // Variable
    periods: 2,
    periodNames: ['First Innings', 'Second Innings'],
    hasExtraTime: false,
    hasPenalties: false,
    scoreTypes: ['runs', 'wickets', 'overs'],
  },
  AMERICAN_FOOTBALL: {
    defaultDuration: 60,
    periods: 4,
    periodNames: ['Q1', 'Q2', 'Q3', 'Q4'],
    hasExtraTime: true,
    hasPenalties: false,
    scoreTypes: ['touchdowns', 'fieldGoals', 'safeties', 'extraPoints', 'twoPointConversions'],
  },
  NETBALL: {
    defaultDuration: 60,
    periods: 4,
    periodNames: ['Q1', 'Q2', 'Q3', 'Q4'],
    hasExtraTime: true,
    hasPenalties: false,
    scoreTypes: ['goals'],
  },
  HOCKEY: {
    defaultDuration: 60,
    periods: 3,
    periodNames: ['Period 1', 'Period 2', 'Period 3'],
    hasExtraTime: true,
    hasPenalties: true,
    scoreTypes: ['goals'],
  },
  LACROSSE: {
    defaultDuration: 60,
    periods: 4,
    periodNames: ['Q1', 'Q2', 'Q3', 'Q4'],
    hasExtraTime: true,
    hasPenalties: false,
    scoreTypes: ['goals'],
  },
  AUSTRALIAN_RULES: {
    defaultDuration: 80,
    periods: 4,
    periodNames: ['Q1', 'Q2', 'Q3', 'Q4'],
    hasExtraTime: true,
    hasPenalties: false,
    scoreTypes: ['goals', 'behinds'],
  },
  GAELIC_FOOTBALL: {
    defaultDuration: 70,
    periods: 2,
    periodNames: ['First Half', 'Second Half'],
    hasExtraTime: true,
    hasPenalties: false,
    scoreTypes: ['goals', 'points'],
  },
  FUTSAL: {
    defaultDuration: 40,
    periods: 2,
    periodNames: ['First Half', 'Second Half'],
    hasExtraTime: true,
    hasPenalties: true,
    scoreTypes: ['goals'],
  },
  BEACH_FOOTBALL: {
    defaultDuration: 36,
    periods: 3,
    periodNames: ['Period 1', 'Period 2', 'Period 3'],
    hasExtraTime: true,
    hasPenalties: true,
    scoreTypes: ['goals'],
  },
};

const LIVE_STATUSES: MatchStatus[] = [
  MatchStatus.FIRST_HALF,
  MatchStatus.HALF_TIME,
  MatchStatus.SECOND_HALF,
  MatchStatus.EXTRA_TIME_FIRST_HALF,
  MatchStatus.EXTRA_TIME_HALF_TIME,
  MatchStatus.EXTRA_TIME_SECOND_HALF,
  MatchStatus.PENALTIES,
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  matchType: z.nativeEnum(MatchType).optional(),
  teamId: z.string().optional(),
  clubId: z.string().optional(),
  competitionId: z.string().optional(),
  sport: z.nativeEnum(Sport).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

const CreateMatchSchema = z.object({
  // Required
  homeTeamId: z.string().min(1, 'Home team is required'),
  awayTeamId: z.string().min(1, 'Away team is required'),
  homeClubId: z.string().min(1, 'Home club is required'),
  awayClubId: z.string().min(1, 'Away club is required'),
  kickOffTime: z.string().min(1, 'Kick-off time is required'),
  
  // Match context
  matchType: z.nativeEnum(MatchType).default(MatchType.FRIENDLY),
  competitionId: z.string().nullable().optional(),
  
  // Venue
  venueId: z.string().nullable().optional(),
  facilityId: z.string().nullable().optional(),
  venue: z.string().optional(),
  pitch: z.string().optional(),
  isNeutralVenue: z.boolean().default(false),
  
  // Competition details
  stage: z.nativeEnum(CompetitionStage).nullable().optional(),
  groupName: z.string().optional(),
  round: z.number().nullable().optional(),
  matchday: z.number().nullable().optional(),
  leg: z.number().nullable().optional(),
  
  // Metadata
  title: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  
  // Formations (sport-specific)
  homeFormation: z.string().nullable().optional(),
  awayFormation: z.string().nullable().optional(),
  
  // Broadcasting
  isBroadcasted: z.boolean().default(false),
  broadcastUrl: z.string().url().optional(),
  isHighlighted: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  
  // Attendance deadline
  attendanceDeadline: z.string().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `match_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const CREATE_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
];

// =============================================================================
// GET HANDLER - List Matches
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validation = QuerySchema.safeParse(queryObj);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const params = validation.data;
    const skip = (params.page - 1) * params.limit;

    // 3. Get user's club memberships for access control
    const memberships = await prisma.clubMember.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: { clubId: true },
    });

    const userClubIds = memberships.map((m) => m.clubId);

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    // 4. Build where clause
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // Access control: Only show matches from user's clubs (unless super admin)
    if (!user?.isSuperAdmin && userClubIds.length > 0) {
      where.OR = [
        { homeClubId: { in: userClubIds } },
        { awayClubId: { in: userClubIds } },
      ];
    }

    // Apply filters
    if (params.status) {
      if (params.status === 'live') {
        where.status = { in: LIVE_STATUSES };
      } else if (params.status === 'upcoming') {
        where.status = MatchStatus.SCHEDULED;
        where.kickOffTime = { gte: new Date() };
      } else if (params.status === 'finished') {
        where.status = MatchStatus.FINISHED;
      } else {
        where.status = params.status as MatchStatus;
      }
    }

    if (params.matchType) {
      where.matchType = params.matchType;
    }

    if (params.teamId) {
      where.OR = [
        { homeTeamId: params.teamId },
        { awayTeamId: params.teamId },
      ];
    }

    if (params.clubId) {
      where.OR = [
        { homeClubId: params.clubId },
        { awayClubId: params.clubId },
      ];
    }

    if (params.competitionId) {
      where.competitionId = params.competitionId;
    }

    if (params.sport) {
      where.homeClub = { sport: params.sport };
    }

    if (params.dateFrom) {
      where.kickOffTime = {
        ...((where.kickOffTime as object) || {}),
        gte: new Date(params.dateFrom),
      };
    }

    if (params.dateTo) {
      where.kickOffTime = {
        ...((where.kickOffTime as object) || {}),
        lte: new Date(params.dateTo),
      };
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { venue: { contains: params.search, mode: 'insensitive' } },
        { homeTeam: { name: { contains: params.search, mode: 'insensitive' } } },
        { awayTeam: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    // 5. Fetch matches with pagination
    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          homeTeam: { select: { id: true, name: true, logo: true } },
          awayTeam: { select: { id: true, name: true, logo: true } },
          homeClub: {
            select: { id: true, name: true, shortName: true, logo: true, sport: true },
          },
          awayClub: {
            select: { id: true, name: true, shortName: true, logo: true },
          },
          competition: {
            select: { id: true, name: true, shortName: true },
          },
        },
        orderBy: [
          { kickOffTime: 'desc' },
        ],
        skip,
        take: params.limit,
      }),
      prisma.match.count({ where }),
    ]);

    // 6. Transform response
    const matchList: MatchListItem[] = matches.map((m) => ({
      id: m.id,
      matchType: m.matchType,
      status: m.status,
      kickOffTime: m.kickOffTime.toISOString(),
      venue: m.venue,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeClub: m.homeClub,
      awayClub: m.awayClub,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      competition: m.competition,
      isLive: LIVE_STATUSES.includes(m.status),
      resultApprovalStatus: m.resultApprovalStatus,
    }));

    return createResponse({
      matches: matchList,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      },
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] List Matches error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch matches',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Match
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

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

    // 2. Parse and validate body
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

    const validation = CreateMatchSchema.safeParse(body);
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

    // 3. Validate teams are different
    if (data.homeTeamId === data.awayTeamId) {
      return createResponse(null, {
        success: false,
        error: 'Home and away teams must be different',
        code: 'SAME_TEAM_ERROR',
        requestId,
        status: 400,
      });
    }

    // 4. Authorization - check user has permission for at least one club
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: { in: [data.homeClubId, data.awayClubId] },
        isActive: true,
        role: { in: CREATE_ROLES },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!membership && !user?.isSuperAdmin) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to create matches for these clubs',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 5. Verify teams exist and belong to clubs
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({
        where: { id: data.homeTeamId },
        select: { id: true, clubId: true, name: true },
      }),
      prisma.team.findUnique({
        where: { id: data.awayTeamId },
        select: { id: true, clubId: true, name: true },
      }),
    ]);

    if (!homeTeam || homeTeam.clubId !== data.homeClubId) {
      return createResponse(null, {
        success: false,
        error: 'Home team not found or does not belong to specified club',
        code: 'TEAM_NOT_FOUND',
        requestId,
        status: 400,
      });
    }

    if (!awayTeam || awayTeam.clubId !== data.awayClubId) {
      return createResponse(null, {
        success: false,
        error: 'Away team not found or does not belong to specified club',
        code: 'TEAM_NOT_FOUND',
        requestId,
        status: 400,
      });
    }

    // 6. Get sport from home club for config
    const homeClub = await prisma.club.findUnique({
      where: { id: data.homeClubId },
      select: { sport: true },
    });

    const sport = homeClub?.sport || Sport.FOOTBALL;
    const sportConfig = SPORT_MATCH_CONFIG[sport];

    // 7. Create match with transaction
    const match = await prisma.$transaction(async (tx) => {
      // Create the match
      const newMatch = await tx.match.create({
        data: {
          // Teams & Clubs
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          homeClubId: data.homeClubId,
          awayClubId: data.awayClubId,
          
          // Timing
          kickOffTime: new Date(data.kickOffTime),
          duration: sportConfig.defaultDuration,
          
          // Match context
          matchType: data.matchType,
          competitionId: data.competitionId,
          
          // Venue
          venueId: data.venueId,
          facilityId: data.facilityId,
          venue: data.venue,
          pitch: data.pitch,
          isNeutralVenue: data.isNeutralVenue,
          
          // Competition details
          stage: data.stage,
          groupName: data.groupName,
          round: data.round,
          matchday: data.matchday,
          leg: data.leg,
          
          // Metadata
          title: data.title || `${homeTeam.name} vs ${awayTeam.name}`,
          description: data.description,
          notes: data.notes,
          
          // Formations
          homeFormation: data.homeFormation,
          awayFormation: data.awayFormation,
          
          // Broadcasting
          isBroadcasted: data.isBroadcasted,
          broadcastUrl: data.broadcastUrl,
          isHighlighted: data.isHighlighted,
          isFeatured: data.isFeatured,
          
          // Attendance
          attendanceDeadline: data.attendanceDeadline
            ? new Date(data.attendanceDeadline)
            : null,
          
          // Status
          status: MatchStatus.SCHEDULED,
          resultApprovalStatus: 'PENDING',
          
          // Creator
          createdById: session.user.id,
        },
        include: {
          homeTeam: { select: { id: true, name: true, logo: true } },
          awayTeam: { select: { id: true, name: true, logo: true } },
          homeClub: {
            select: { id: true, name: true, shortName: true, logo: true, sport: true },
          },
          awayClub: {
            select: { id: true, name: true, shortName: true, logo: true },
          },
          competition: {
            select: { id: true, name: true, shortName: true },
          },
        },
      });

      // Get players from both teams using TeamPlayer (correct model)
      const [homePlayers, awayPlayers] = await Promise.all([
        tx.teamPlayer.findMany({
          where: { teamId: data.homeTeamId, isActive: true },
          select: { playerId: true },
        }),
        tx.teamPlayer.findMany({
          where: { teamId: data.awayTeamId, isActive: true },
          select: { playerId: true },
        }),
      ]);

      // Create attendance records for all players
      const allPlayerIds = [
        ...homePlayers.map((p) => p.playerId),
        ...awayPlayers.map((p) => p.playerId),
      ];

      if (allPlayerIds.length > 0) {
        await tx.matchAttendance.createMany({
          data: allPlayerIds.map((playerId) => ({
            matchId: newMatch.id,
            playerId,
            status: 'PENDING',
          })),
          skipDuplicates: true,
        });
      }

      return newMatch;
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MATCH_CREATED',
        resourceType: 'MATCH',
        resourceId: match.id,
        afterState: {
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          kickOffTime: match.kickOffTime,
          matchType: match.matchType,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return createResponse({
      match: {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeClub: match.homeClub,
        awayClub: match.awayClub,
        kickOffTime: match.kickOffTime.toISOString(),
        status: match.status,
        matchType: match.matchType,
        venue: match.venue,
        competition: match.competition,
      },
      sportConfig: {
        sport,
        ...sportConfig,
      },
    }, {
      success: true,
      message: 'Match created successfully',
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Create Match error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create match',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}