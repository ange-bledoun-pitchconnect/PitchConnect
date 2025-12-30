// =============================================================================
// ⚽ FIXTURES API - Enterprise-Grade Match Scheduling
// =============================================================================
// GET  /api/fixtures - List fixtures/matches with filtering
// POST /api/fixtures - Create new fixture/match
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ | Alias for Match scheduling
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma, MatchType, MatchStatus, Sport, CompetitionStage, FormationType } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  pagination?: PaginationMeta;
  requestId: string;
  timestamp: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  competitionId: z.string().cuid().optional(),
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  sport: z.nativeEnum(Sport).optional(),
  status: z.nativeEnum(MatchStatus).optional(),
  matchType: z.nativeEnum(MatchType).optional(),
  stage: z.nativeEnum(CompetitionStage).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  upcoming: z.coerce.boolean().optional(),
  sortBy: z.enum(['kickOffTime', 'createdAt', 'status']).default('kickOffTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const createFixtureSchema = z.object({
  // Required fields
  homeTeamId: z.string().cuid('Invalid home team ID'),
  awayTeamId: z.string().cuid('Invalid away team ID'),
  homeClubId: z.string().cuid('Invalid home club ID'),
  awayClubId: z.string().cuid('Invalid away club ID'),
  kickOffTime: z.string().datetime('Invalid kickoff date/time'),
  
  // Optional competition context
  competitionId: z.string().cuid().optional(),
  stage: z.nativeEnum(CompetitionStage).optional(),
  groupName: z.string().max(50).optional(),
  round: z.number().int().min(1).optional(),
  matchday: z.number().int().min(1).optional(),
  leg: z.number().int().min(1).max(2).optional(),
  
  // Match details
  matchType: z.nativeEnum(MatchType).default(MatchType.LEAGUE),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  
  // Venue information
  venueId: z.string().cuid().optional(),
  facilityId: z.string().cuid().optional(),
  venue: z.string().max(200).optional(),
  pitch: z.string().max(100).optional(),
  
  // Formations (optional pre-set)
  homeFormation: z.nativeEnum(FormationType).optional(),
  awayFormation: z.nativeEnum(FormationType).optional(),
  
  // Broadcast
  isBroadcasted: z.boolean().default(false),
  broadcastUrl: z.string().url().optional(),
  
  // Flags
  isHighlighted: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isNeutralVenue: z.boolean().default(false),
  
  // Notes
  notes: z.string().max(5000).optional(),
}).refine(
  (data) => data.homeTeamId !== data.awayTeamId,
  { message: 'Home and away teams must be different', path: ['awayTeamId'] }
).refine(
  (data) => data.homeClubId !== data.awayClubId || data.matchType === MatchType.FRIENDLY,
  { message: 'Home and away clubs must be different (except for friendlies)', path: ['awayClubId'] }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `fix_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
    error?: string;
    code?: string;
    pagination?: PaginationMeta;
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    requestId: options.requestId,
    timestamp: new Date().toISOString(),
  };

  if (options.success && data !== null) {
    response.data = data;
  }
  if (options.message) response.message = options.message;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;
  if (options.pagination) response.pagination = options.pagination;

  return NextResponse.json(response, { status: options.status || 200 });
}

/**
 * Check if user has permission to manage fixtures for a competition/club
 */
async function hasFixtureManagementPermission(
  userId: string,
  competitionId?: string,
  clubId?: string
): Promise<boolean> {
  // Check if user is super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, roles: true },
  });

  if (user?.isSuperAdmin) return true;

  // Check organisation-level permissions
  const orgMembership = await prisma.organisationMember.findFirst({
    where: {
      userId,
      role: { in: ['OWNER', 'ADMIN', 'LEAGUE_MANAGER'] },
    },
  });

  if (orgMembership) return true;

  // Check if user created the competition
  if (competitionId) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { createdBy: true, clubId: true },
    });

    if (competition?.createdBy === userId) return true;
    
    // Check club membership for competition's club
    if (competition?.clubId) {
      const clubMember = await prisma.clubMember.findFirst({
        where: {
          userId,
          clubId: competition.clubId,
          isActive: true,
          role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
        },
      });
      if (clubMember) return true;
    }
  }

  // Check club membership
  if (clubId) {
    const clubMember = await prisma.clubMember.findFirst({
      where: {
        userId,
        clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
      },
    });
    if (clubMember) return true;
  }

  return false;
}

/**
 * Get sport-specific scoring display
 */
function formatScoreDisplay(
  homeScore: number | null,
  awayScore: number | null,
  sport: Sport,
  extras?: {
    homeHalftimeScore?: number | null;
    awayHalftimeScore?: number | null;
    homePenalties?: number | null;
    awayPenalties?: number | null;
    homeScoreBreakdown?: Prisma.JsonValue;
    awayScoreBreakdown?: Prisma.JsonValue;
  }
): string {
  if (homeScore === null || awayScore === null) {
    return 'vs';
  }

  let scoreDisplay = `${homeScore} - ${awayScore}`;

  // Add penalties if applicable
  if (extras?.homePenalties !== null && extras?.awayPenalties !== null) {
    scoreDisplay += ` (${extras.homePenalties}-${extras.awayPenalties} pens)`;
  }

  // Sport-specific formatting
  switch (sport) {
    case Sport.CRICKET:
      // Could show overs, wickets from breakdown
      break;
    case Sport.RUGBY:
    case Sport.AMERICAN_FOOTBALL:
      // Could show try/touchdown breakdown
      break;
    case Sport.BASKETBALL:
      // Could show quarter scores
      break;
  }

  return scoreDisplay;
}

// =============================================================================
// GET HANDLER - List Fixtures
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      competitionId: searchParams.get('competitionId'),
      clubId: searchParams.get('clubId'),
      teamId: searchParams.get('teamId'),
      sport: searchParams.get('sport'),
      status: searchParams.get('status'),
      matchType: searchParams.get('matchType'),
      stage: searchParams.get('stage'),
      fromDate: searchParams.get('fromDate'),
      toDate: searchParams.get('toDate'),
      upcoming: searchParams.get('upcoming'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    if (!queryResult.success) {
      return createResponse(null, {
        success: false,
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const {
      page,
      limit,
      competitionId,
      clubId,
      teamId,
      sport,
      status,
      matchType,
      stage,
      fromDate,
      toDate,
      upcoming,
      sortBy,
      sortOrder,
    } = queryResult.data;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.MatchWhereInput = {
      deletedAt: null,
    };

    if (competitionId) {
      where.competitionId = competitionId;
    }

    if (clubId) {
      where.OR = [{ homeClubId: clubId }, { awayClubId: clubId }];
    }

    if (teamId) {
      where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }

    if (sport) {
      where.competition = { sport };
    }

    if (status) {
      where.status = status;
    }

    if (matchType) {
      where.matchType = matchType;
    }

    if (stage) {
      where.stage = stage;
    }

    // Date filtering
    if (fromDate || toDate || upcoming) {
      where.kickOffTime = {};
      
      if (upcoming) {
        where.kickOffTime.gte = new Date();
      } else {
        if (fromDate) {
          where.kickOffTime.gte = new Date(fromDate);
        }
        if (toDate) {
          where.kickOffTime.lte = new Date(toDate);
        }
      }
    }

    // Build orderBy
    const orderBy: Prisma.MatchOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Execute query with count
    const [fixtures, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          homeTeam: {
            select: {
              id: true,
              name: true,
              logo: true,
              club: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                  logo: true,
                  sport: true,
                },
              },
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              logo: true,
              club: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                  logo: true,
                  sport: true,
                },
              },
            },
          },
          competition: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logo: true,
              sport: true,
              type: true,
            },
          },
          venueRelation: {
            select: {
              id: true,
              name: true,
              city: true,
              country: true,
            },
          },
          _count: {
            select: {
              events: true,
              squads: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.match.count({ where }),
    ]);

    // Format response
    const formattedFixtures = fixtures.map((fixture) => {
      const matchSport = fixture.competition?.sport || fixture.homeTeam.club.sport;
      
      return {
        id: fixture.id,
        matchType: fixture.matchType,
        status: fixture.status,
        stage: fixture.stage,
        groupName: fixture.groupName,
        round: fixture.round,
        matchday: fixture.matchday,
        leg: fixture.leg,
        title: fixture.title,
        description: fixture.description,
        kickOffTime: fixture.kickOffTime.toISOString(),
        endTime: fixture.endTime?.toISOString(),
        
        // Teams
        homeTeam: {
          id: fixture.homeTeam.id,
          name: fixture.homeTeam.name,
          logo: fixture.homeTeam.logo,
          club: fixture.homeTeam.club,
        },
        awayTeam: {
          id: fixture.awayTeam.id,
          name: fixture.awayTeam.name,
          logo: fixture.awayTeam.logo,
          club: fixture.awayTeam.club,
        },
        
        // Scores
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
        scoreDisplay: formatScoreDisplay(
          fixture.homeScore,
          fixture.awayScore,
          matchSport,
          {
            homeHalftimeScore: fixture.homeHalftimeScore,
            awayHalftimeScore: fixture.awayHalftimeScore,
            homePenalties: fixture.homePenalties,
            awayPenalties: fixture.awayPenalties,
          }
        ),
        homeHalftimeScore: fixture.homeHalftimeScore,
        awayHalftimeScore: fixture.awayHalftimeScore,
        
        // Competition context
        competition: fixture.competition,
        sport: matchSport,
        
        // Venue
        venue: fixture.venueRelation || {
          name: fixture.venue,
          pitch: fixture.pitch,
        },
        
        // Formations
        homeFormation: fixture.homeFormation,
        awayFormation: fixture.awayFormation,
        
        // Flags
        isHighlighted: fixture.isHighlighted,
        isFeatured: fixture.isFeatured,
        isNeutralVenue: fixture.isNeutralVenue,
        isBroadcasted: fixture.isBroadcasted,
        broadcastUrl: fixture.broadcastUrl,
        
        // Weather (for outdoor sports)
        weather: fixture.weather,
        temperature: fixture.temperature,
        
        // Approval status
        resultApprovalStatus: fixture.resultApprovalStatus,
        
        // Stats
        eventCount: fixture._count.events,
        squadCount: fixture._count.squads,
        attendance: fixture.attendance,
        
        // Timestamps
        createdAt: fixture.createdAt.toISOString(),
        updatedAt: fixture.updatedAt.toISOString(),
      };
    });

    return createResponse(formattedFixtures, {
      success: true,
      message: `Retrieved ${formattedFixtures.length} fixtures`,
      requestId,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Fixtures GET error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch fixtures',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Fixture
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

    // 2. Parse request body
    let body: unknown;
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

    // 3. Validate request body
    const validation = createFixtureSchema.safeParse(body);
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

    // 4. Verify teams exist and get their clubs
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({
        where: { id: data.homeTeamId },
        include: {
          club: {
            select: { id: true, name: true, sport: true },
          },
        },
      }),
      prisma.team.findUnique({
        where: { id: data.awayTeamId },
        include: {
          club: {
            select: { id: true, name: true, sport: true },
          },
        },
      }),
    ]);

    if (!homeTeam || !awayTeam) {
      return createResponse(null, {
        success: false,
        error: 'One or both teams not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Verify clubs match provided IDs
    if (homeTeam.clubId !== data.homeClubId || awayTeam.clubId !== data.awayClubId) {
      return createResponse(null, {
        success: false,
        error: 'Team and club IDs do not match',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    // 6. Verify sports match if competition is provided
    let competition = null;
    if (data.competitionId) {
      competition = await prisma.competition.findUnique({
        where: { id: data.competitionId },
        select: { id: true, sport: true, createdBy: true, clubId: true },
      });

      if (!competition) {
        return createResponse(null, {
          success: false,
          error: 'Competition not found',
          code: 'NOT_FOUND',
          requestId,
          status: 404,
        });
      }

      // Verify sport matches
      if (competition.sport !== homeTeam.club.sport) {
        return createResponse(null, {
          success: false,
          error: `Competition sport (${competition.sport}) does not match team sport (${homeTeam.club.sport})`,
          code: 'SPORT_MISMATCH',
          requestId,
          status: 400,
        });
      }
    }

    // 7. Check permission
    const hasPermission = await hasFixtureManagementPermission(
      session.user.id,
      data.competitionId,
      data.homeClubId
    );

    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to create fixtures',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 8. Check for scheduling conflicts (same team, same time)
    const conflictingMatch = await prisma.match.findFirst({
      where: {
        deletedAt: null,
        kickOffTime: new Date(data.kickOffTime),
        OR: [
          { homeTeamId: data.homeTeamId },
          { awayTeamId: data.homeTeamId },
          { homeTeamId: data.awayTeamId },
          { awayTeamId: data.awayTeamId },
        ],
      },
    });

    if (conflictingMatch) {
      return createResponse(null, {
        success: false,
        error: 'A team already has a fixture scheduled at this time',
        code: 'SCHEDULING_CONFLICT',
        requestId,
        status: 409,
      });
    }

    // 9. Create the fixture
    const fixture = await prisma.match.create({
      data: {
        competitionId: data.competitionId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        homeClubId: data.homeClubId,
        awayClubId: data.awayClubId,
        matchType: data.matchType,
        stage: data.stage,
        groupName: data.groupName,
        round: data.round,
        matchday: data.matchday,
        leg: data.leg,
        title: data.title,
        description: data.description,
        kickOffTime: new Date(data.kickOffTime),
        status: MatchStatus.SCHEDULED,
        venueId: data.venueId,
        facilityId: data.facilityId,
        venue: data.venue,
        pitch: data.pitch,
        homeFormation: data.homeFormation,
        awayFormation: data.awayFormation,
        isHighlighted: data.isHighlighted,
        isFeatured: data.isFeatured,
        isNeutralVenue: data.isNeutralVenue,
        isBroadcasted: data.isBroadcasted,
        broadcastUrl: data.broadcastUrl,
        notes: data.notes,
        createdById: session.user.id,
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            club: { select: { name: true, sport: true } },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            club: { select: { name: true } },
          },
        },
        competition: {
          select: { id: true, name: true, sport: true },
        },
      },
    });

    // 10. Update competition match count if applicable
    if (data.competitionId) {
      await prisma.competition.update({
        where: { id: data.competitionId },
        data: {
          totalMatches: { increment: 1 },
        },
      }).catch(() => {}); // Non-critical
    }

    // 11. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MATCH_CREATED',
        resourceType: 'MATCH',
        resourceId: fixture.id,
        afterState: {
          homeTeam: fixture.homeTeam.name,
          awayTeam: fixture.awayTeam.name,
          kickOffTime: fixture.kickOffTime.toISOString(),
          matchType: fixture.matchType,
        },
      },
    }).catch((err) => {
      console.error(`[${requestId}] Audit log failed:`, err);
    });

    // 12. Format response
    const response = {
      id: fixture.id,
      matchType: fixture.matchType,
      status: fixture.status,
      kickOffTime: fixture.kickOffTime.toISOString(),
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      competition: fixture.competition,
      sport: fixture.competition?.sport || fixture.homeTeam.club.sport,
      venue: fixture.venue,
      createdAt: fixture.createdAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      message: `Fixture created: ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Fixtures POST error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create fixture',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
