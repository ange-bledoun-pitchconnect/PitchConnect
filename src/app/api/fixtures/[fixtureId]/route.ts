// =============================================================================
// ⚽ SINGLE FIXTURE API - Enterprise-Grade Match Management
// =============================================================================
// GET    /api/fixtures/[fixtureId] - Get fixture details
// PATCH  /api/fixtures/[fixtureId] - Update fixture
// DELETE /api/fixtures/[fixtureId] - Delete fixture (soft delete)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  MatchStatus,
  MatchType,
  CompetitionStage,
  FormationType,
  ResultApprovalStatus,
  Sport,
  AuditActionType,
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

interface RouteParams {
  params: {
    fixtureId: string;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const updateFixtureSchema = z.object({
  // Status updates
  status: z.nativeEnum(MatchStatus).optional(),
  resultApprovalStatus: z.nativeEnum(ResultApprovalStatus).optional(),
  
  // Score updates
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  homeHalftimeScore: z.number().int().min(0).optional(),
  awayHalftimeScore: z.number().int().min(0).optional(),
  homePenalties: z.number().int().min(0).optional(),
  awayPenalties: z.number().int().min(0).optional(),
  homeExtraTimeScore: z.number().int().min(0).optional(),
  awayExtraTimeScore: z.number().int().min(0).optional(),
  
  // Sport-specific score breakdowns (JSON)
  homeScoreBreakdown: z.record(z.unknown()).optional(),
  awayScoreBreakdown: z.record(z.unknown()).optional(),
  
  // Schedule updates
  kickOffTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  
  // Venue updates
  venueId: z.string().cuid().optional().nullable(),
  facilityId: z.string().cuid().optional().nullable(),
  venue: z.string().max(200).optional(),
  pitch: z.string().max(100).optional(),
  
  // Weather (outdoor sports)
  weather: z.string().max(100).optional(),
  temperature: z.number().int().min(-50).max(60).optional(),
  humidity: z.number().int().min(0).max(100).optional(),
  windSpeed: z.number().min(0).max(200).optional(),
  
  // Match details
  matchType: z.nativeEnum(MatchType).optional(),
  stage: z.nativeEnum(CompetitionStage).optional().nullable(),
  groupName: z.string().max(50).optional().nullable(),
  round: z.number().int().min(1).optional().nullable(),
  matchday: z.number().int().min(1).optional().nullable(),
  leg: z.number().int().min(1).max(2).optional().nullable(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  
  // Formations
  homeFormation: z.nativeEnum(FormationType).optional().nullable(),
  awayFormation: z.nativeEnum(FormationType).optional().nullable(),
  
  // Match stats
  attendance: z.number().int().min(0).optional(),
  actualDuration: z.number().int().min(0).optional(),
  injuryTimeFirst: z.number().int().min(0).max(30).optional(),
  injuryTimeSecond: z.number().int().min(0).max(30).optional(),
  
  // Flags
  isHighlighted: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNeutralVenue: z.boolean().optional(),
  isBroadcasted: z.boolean().optional(),
  broadcastUrl: z.string().url().optional().nullable(),
  
  // Notes and reports
  notes: z.string().max(5000).optional(),
  matchReport: z.string().max(10000).optional(),
  
  // Dispute handling
  disputeReason: z.string().max(1000).optional(),
});

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

  return NextResponse.json(response, { status: options.status || 200 });
}

/**
 * Check if user has permission to manage this specific fixture
 */
async function hasFixturePermission(
  userId: string,
  fixture: {
    createdById: string;
    homeClubId: string;
    awayClubId: string;
    competitionId: string | null;
  }
): Promise<boolean> {
  // Creator always has permission
  if (fixture.createdById === userId) return true;

  // Check if super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
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

  // Check competition creator
  if (fixture.competitionId) {
    const competition = await prisma.competition.findUnique({
      where: { id: fixture.competitionId },
      select: { createdBy: true },
    });
    if (competition?.createdBy === userId) return true;
  }

  // Check club membership for either club
  const clubMember = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId: { in: [fixture.homeClubId, fixture.awayClubId] },
      isActive: true,
      role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
    },
  });
  
  return !!clubMember;
}

/**
 * Get sport-specific match duration
 */
function getDefaultMatchDuration(sport: Sport): number {
  const durations: Record<Sport, number> = {
    FOOTBALL: 90,
    FUTSAL: 40,
    BEACH_FOOTBALL: 36,
    RUGBY: 80,
    CRICKET: 0, // Variable
    AMERICAN_FOOTBALL: 60,
    BASKETBALL: 48,
    HOCKEY: 70,
    LACROSSE: 60,
    NETBALL: 60,
    AUSTRALIAN_RULES: 80,
    GAELIC_FOOTBALL: 70,
  };
  return durations[sport] || 90;
}

/**
 * Validate status transition
 */
function isValidStatusTransition(
  currentStatus: MatchStatus,
  newStatus: MatchStatus
): boolean {
  const validTransitions: Record<MatchStatus, MatchStatus[]> = {
    SCHEDULED: [
      MatchStatus.CONFIRMED,
      MatchStatus.POSTPONED,
      MatchStatus.CANCELLED,
      MatchStatus.LIVE,
    ],
    CONFIRMED: [
      MatchStatus.LIVE,
      MatchStatus.POSTPONED,
      MatchStatus.CANCELLED,
      MatchStatus.SCHEDULED,
    ],
    POSTPONED: [
      MatchStatus.SCHEDULED,
      MatchStatus.CANCELLED,
      MatchStatus.CONFIRMED,
    ],
    LIVE: [
      MatchStatus.HALF_TIME,
      MatchStatus.COMPLETED,
      MatchStatus.FULL_TIME,
      MatchStatus.ABANDONED,
      MatchStatus.SUSPENDED,
    ],
    HALF_TIME: [MatchStatus.LIVE, MatchStatus.ABANDONED, MatchStatus.SUSPENDED],
    FULL_TIME: [MatchStatus.COMPLETED],
    COMPLETED: [], // Terminal state
    ABANDONED: [MatchStatus.SCHEDULED], // Can be rescheduled
    SUSPENDED: [MatchStatus.LIVE, MatchStatus.CANCELLED, MatchStatus.SCHEDULED],
    CANCELLED: [], // Terminal state
    DELAYED: [MatchStatus.LIVE, MatchStatus.CANCELLED, MatchStatus.POSTPONED],
    WALKOVER: [], // Terminal state
    FORFEIT: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}

// =============================================================================
// GET HANDLER - Get Fixture Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { fixtureId } = params;

  try {
    // Validate fixtureId format
    if (!fixtureId || fixtureId.length < 20) {
      return createResponse(null, {
        success: false,
        error: 'Invalid fixture ID',
        code: 'INVALID_ID',
        requestId,
        status: 400,
      });
    }

    // Fetch fixture with all related data
    const fixture = await prisma.match.findUnique({
      where: { id: fixtureId },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            logo: true,
            ageGroup: true,
            club: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
                sport: true,
                city: true,
                country: true,
              },
            },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            logo: true,
            ageGroup: true,
            club: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
                sport: true,
                city: true,
                country: true,
              },
            },
          },
        },
        competition: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
            logo: true,
            sport: true,
            type: true,
            format: true,
          },
        },
        venueRelation: {
          select: {
            id: true,
            name: true,
            shortName: true,
            city: true,
            country: true,
            address: true,
            capacity: true,
            surface: true,
          },
        },
        facilityRelation: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        events: {
          orderBy: { minute: 'asc' },
          take: 50,
          select: {
            id: true,
            eventType: true,
            minute: true,
            secondaryMinute: true,
            teamSide: true,
            player: {
              select: {
                id: true,
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
            assistPlayer: {
              select: {
                id: true,
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
            details: true,
          },
        },
        officials: {
          include: {
            referee: {
              select: {
                id: true,
                licenseNumber: true,
                licenseLevel: true,
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            events: true,
            squads: true,
            playerAttendance: true,
            playerPerformances: true,
            mediaContent: true,
          },
        },
      },
    });

    if (!fixture || fixture.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Fixture not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // Get match sport
    const sport = fixture.competition?.sport || fixture.homeTeam.club.sport;

    // Get standings context if in a competition
    let standingsContext = null;
    if (fixture.competitionId) {
      const [homeStanding, awayStanding] = await Promise.all([
        prisma.competitionStanding.findFirst({
          where: {
            competitionId: fixture.competitionId,
            teamId: fixture.homeTeamId,
          },
          select: { position: true, points: true, played: true, form: true },
        }),
        prisma.competitionStanding.findFirst({
          where: {
            competitionId: fixture.competitionId,
            teamId: fixture.awayTeamId,
          },
          select: { position: true, points: true, played: true, form: true },
        }),
      ]);

      standingsContext = {
        homeTeam: homeStanding,
        awayTeam: awayStanding,
      };
    }

    // Get head-to-head stats
    const h2hMatches = await prisma.match.findMany({
      where: {
        deletedAt: null,
        status: MatchStatus.COMPLETED,
        OR: [
          { homeTeamId: fixture.homeTeamId, awayTeamId: fixture.awayTeamId },
          { homeTeamId: fixture.awayTeamId, awayTeamId: fixture.homeTeamId },
        ],
        NOT: { id: fixtureId },
      },
      orderBy: { kickOffTime: 'desc' },
      take: 10,
      select: {
        id: true,
        kickOffTime: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    });

    const h2hStats = {
      totalMatches: h2hMatches.length,
      homeWins: h2hMatches.filter(
        (m) =>
          (m.homeTeamId === fixture.homeTeamId && (m.homeScore ?? 0) > (m.awayScore ?? 0)) ||
          (m.awayTeamId === fixture.homeTeamId && (m.awayScore ?? 0) > (m.homeScore ?? 0))
      ).length,
      awayWins: h2hMatches.filter(
        (m) =>
          (m.homeTeamId === fixture.awayTeamId && (m.homeScore ?? 0) > (m.awayScore ?? 0)) ||
          (m.awayTeamId === fixture.awayTeamId && (m.awayScore ?? 0) > (m.homeScore ?? 0))
      ).length,
      draws: h2hMatches.filter((m) => m.homeScore === m.awayScore).length,
      recentMatches: h2hMatches.slice(0, 5).map((m) => ({
        id: m.id,
        date: m.kickOffTime.toISOString(),
        homeTeamId: m.homeTeamId,
        score: `${m.homeScore ?? '-'} - ${m.awayScore ?? '-'}`,
      })),
    };

    // Format response
    const response = {
      id: fixture.id,
      
      // Match identification
      matchType: fixture.matchType,
      status: fixture.status,
      resultApprovalStatus: fixture.resultApprovalStatus,
      
      // Competition context
      competition: fixture.competition,
      stage: fixture.stage,
      groupName: fixture.groupName,
      round: fixture.round,
      matchday: fixture.matchday,
      leg: fixture.leg,
      
      // Match info
      title: fixture.title,
      description: fixture.description,
      sport,
      
      // Teams
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      
      // Scores
      scores: {
        home: fixture.homeScore,
        away: fixture.awayScore,
        homeHalftime: fixture.homeHalftimeScore,
        awayHalftime: fixture.awayHalftimeScore,
        homePenalties: fixture.homePenalties,
        awayPenalties: fixture.awayPenalties,
        homeExtraTime: fixture.homeExtraTimeScore,
        awayExtraTime: fixture.awayExtraTimeScore,
        homeBreakdown: fixture.homeScoreBreakdown,
        awayBreakdown: fixture.awayScoreBreakdown,
      },
      
      // Schedule
      kickOffTime: fixture.kickOffTime.toISOString(),
      endTime: fixture.endTime?.toISOString(),
      actualDuration: fixture.actualDuration,
      defaultDuration: getDefaultMatchDuration(sport),
      injuryTimeFirst: fixture.injuryTimeFirst,
      injuryTimeSecond: fixture.injuryTimeSecond,
      
      // Venue
      venue: fixture.venueRelation || {
        name: fixture.venue,
        pitch: fixture.pitch,
      },
      facility: fixture.facilityRelation,
      isNeutralVenue: fixture.isNeutralVenue,
      
      // Weather (outdoor sports)
      weather: {
        condition: fixture.weather,
        temperature: fixture.temperature,
        humidity: fixture.humidity,
        windSpeed: fixture.windSpeed,
      },
      
      // Formations
      formations: {
        home: fixture.homeFormation,
        away: fixture.awayFormation,
      },
      
      // Attendance
      attendance: fixture.attendance,
      capacity: fixture.venueRelation?.capacity,
      
      // Flags
      isHighlighted: fixture.isHighlighted,
      isFeatured: fixture.isFeatured,
      isBroadcasted: fixture.isBroadcasted,
      broadcastUrl: fixture.broadcastUrl,
      
      // Match events
      events: fixture.events.map((event) => ({
        id: event.id,
        type: event.eventType,
        minute: event.minute,
        additionalMinute: event.secondaryMinute,
        teamSide: event.teamSide,
        player: event.player
          ? {
              id: event.player.id,
              name: `${event.player.user.firstName} ${event.player.user.lastName}`,
            }
          : null,
        assistPlayer: event.assistPlayer
          ? {
              id: event.assistPlayer.id,
              name: `${event.assistPlayer.user.firstName} ${event.assistPlayer.user.lastName}`,
            }
          : null,
        details: event.details,
      })),
      
      // Officials
      officials: fixture.officials.map((official) => ({
        role: official.role,
        referee: {
          id: official.referee.id,
          name: `${official.referee.user.firstName} ${official.referee.user.lastName}`,
          licenseLevel: official.referee.licenseLevel,
        },
      })),
      
      // Notes
      notes: fixture.notes,
      matchReport: fixture.matchReport,
      disputeReason: fixture.disputeReason,
      
      // Statistics context
      standingsContext,
      headToHead: h2hStats,
      
      // Counts
      counts: fixture._count,
      
      // Metadata
      createdBy: fixture.creator
        ? {
            id: fixture.creator.id,
            name: `${fixture.creator.firstName} ${fixture.creator.lastName}`,
          }
        : null,
      createdAt: fixture.createdAt.toISOString(),
      updatedAt: fixture.updatedAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      message: 'Fixture retrieved successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Fixture GET error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch fixture',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Fixture
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { fixtureId } = params;

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

    // 2. Validate fixtureId
    if (!fixtureId || fixtureId.length < 20) {
      return createResponse(null, {
        success: false,
        error: 'Invalid fixture ID',
        code: 'INVALID_ID',
        requestId,
        status: 400,
      });
    }

    // 3. Fetch existing fixture
    const existingFixture = await prisma.match.findUnique({
      where: { id: fixtureId },
      select: {
        id: true,
        status: true,
        createdById: true,
        homeClubId: true,
        awayClubId: true,
        competitionId: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        deletedAt: true,
      },
    });

    if (!existingFixture || existingFixture.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Fixture not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Check permissions
    const hasPermission = await hasFixturePermission(session.user.id, {
      createdById: existingFixture.createdById,
      homeClubId: existingFixture.homeClubId,
      awayClubId: existingFixture.awayClubId,
      competitionId: existingFixture.competitionId,
    });

    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to update this fixture',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 5. Parse and validate request body
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

    const validation = updateFixtureSchema.safeParse(body);
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

    // 6. Validate status transition if status is being changed
    if (data.status && data.status !== existingFixture.status) {
      if (!isValidStatusTransition(existingFixture.status, data.status)) {
        return createResponse(null, {
          success: false,
          error: `Invalid status transition from ${existingFixture.status} to ${data.status}`,
          code: 'INVALID_STATUS_TRANSITION',
          requestId,
          status: 400,
        });
      }
    }

    // 7. Build update data
    const updateData: Record<string, unknown> = {};
    
    // Copy over all valid fields from data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'kickOffTime' || key === 'endTime') {
          updateData[key] = value ? new Date(value as string) : null;
        } else {
          updateData[key] = value;
        }
      }
    });

    // 8. Update the fixture
    const updatedFixture = await prisma.match.update({
      where: { id: fixtureId },
      data: updateData,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        competition: { select: { id: true, name: true, sport: true } },
      },
    });

    // 9. Update competition stats if match completed
    if (
      data.status === MatchStatus.COMPLETED &&
      existingFixture.status !== MatchStatus.COMPLETED &&
      updatedFixture.competitionId
    ) {
      await prisma.competition.update({
        where: { id: updatedFixture.competitionId },
        data: {
          completedMatches: { increment: 1 },
          totalGoals: {
            increment: (updatedFixture.homeScore ?? 0) + (updatedFixture.awayScore ?? 0),
          },
        },
      }).catch(() => {}); // Non-critical
    }

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MATCH_UPDATED' as AuditActionType,
        resourceType: 'MATCH',
        resourceId: fixtureId,
        beforeState: {
          status: existingFixture.status,
          homeScore: existingFixture.homeScore,
          awayScore: existingFixture.awayScore,
        },
        afterState: updateData,
        changes: Object.keys(updateData),
      },
    }).catch((err) => {
      console.error(`[${requestId}] Audit log failed:`, err);
    });

    // 11. Format response
    const response = {
      id: updatedFixture.id,
      status: updatedFixture.status,
      homeTeam: updatedFixture.homeTeam.name,
      awayTeam: updatedFixture.awayTeam.name,
      homeScore: updatedFixture.homeScore,
      awayScore: updatedFixture.awayScore,
      kickOffTime: updatedFixture.kickOffTime.toISOString(),
      resultApprovalStatus: updatedFixture.resultApprovalStatus,
      competition: updatedFixture.competition,
      updatedAt: updatedFixture.updatedAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      message: 'Fixture updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Fixture PATCH error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update fixture',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Soft Delete Fixture
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { fixtureId } = params;

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

    // 2. Validate fixtureId
    if (!fixtureId || fixtureId.length < 20) {
      return createResponse(null, {
        success: false,
        error: 'Invalid fixture ID',
        code: 'INVALID_ID',
        requestId,
        status: 400,
      });
    }

    // 3. Fetch existing fixture
    const existingFixture = await prisma.match.findUnique({
      where: { id: fixtureId },
      select: {
        id: true,
        status: true,
        createdById: true,
        homeClubId: true,
        awayClubId: true,
        competitionId: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        kickOffTime: true,
        deletedAt: true,
      },
    });

    if (!existingFixture || existingFixture.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Fixture not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Check permissions
    const hasPermission = await hasFixturePermission(session.user.id, {
      createdById: existingFixture.createdById,
      homeClubId: existingFixture.homeClubId,
      awayClubId: existingFixture.awayClubId,
      competitionId: existingFixture.competitionId,
    });

    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to delete this fixture',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 5. Validate deletion is allowed
    const nonDeletableStatuses: MatchStatus[] = [
      MatchStatus.LIVE,
      MatchStatus.HALF_TIME,
      MatchStatus.COMPLETED,
      MatchStatus.FULL_TIME,
    ];

    if (nonDeletableStatuses.includes(existingFixture.status)) {
      return createResponse(null, {
        success: false,
        error: `Cannot delete a fixture with status: ${existingFixture.status}`,
        code: 'INVALID_OPERATION',
        requestId,
        status: 400,
      });
    }

    // 6. Soft delete the fixture
    await prisma.match.update({
      where: { id: fixtureId },
      data: {
        deletedAt: new Date(),
        deletedBy: session.user.id,
        status: MatchStatus.CANCELLED,
      },
    });

    // 7. Update competition stats if applicable
    if (existingFixture.competitionId) {
      await prisma.competition.update({
        where: { id: existingFixture.competitionId },
        data: {
          totalMatches: { decrement: 1 },
        },
      }).catch(() => {}); // Non-critical
    }

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MATCH_DELETED' as AuditActionType,
        resourceType: 'MATCH',
        resourceId: fixtureId,
        beforeState: {
          status: existingFixture.status,
          homeTeam: existingFixture.homeTeam.name,
          awayTeam: existingFixture.awayTeam.name,
          kickOffTime: existingFixture.kickOffTime.toISOString(),
        },
      },
    }).catch((err) => {
      console.error(`[${requestId}] Audit log failed:`, err);
    });

    return createResponse(null, {
      success: true,
      message: `Fixture deleted: ${existingFixture.homeTeam.name} vs ${existingFixture.awayTeam.name}`,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Fixture DELETE error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete fixture',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
