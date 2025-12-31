// =============================================================================
// ⚽ INDIVIDUAL MATCH API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/matches/[matchId] - Get match details
// PATCH  /api/matches/[matchId] - Update match
// DELETE /api/matches/[matchId] - Delete match
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club members (view), Coach/Manager (edit), Owner/Manager (delete)
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

interface RouteParams {
  params: {
    matchId: string;
  };
}

interface MatchDetail {
  id: string;
  title: string | null;
  matchType: MatchType;
  status: MatchStatus;
  kickOffTime: string;
  endTime: string | null;
  duration: number | null;
  venue: string | null;
  pitch: string | null;
  isNeutralVenue: boolean;
  
  // Teams
  homeTeam: {
    id: string;
    name: string;
    logo: string | null;
    formation: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    logo: string | null;
    formation: string | null;
  };
  
  // Clubs
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
  
  // Score
  homeScore: number | null;
  awayScore: number | null;
  homeHalftimeScore: number | null;
  awayHalftimeScore: number | null;
  homeExtraTimeScore: number | null;
  awayExtraTimeScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  homeScoreBreakdown: Record<string, number> | null;
  awayScoreBreakdown: Record<string, number> | null;
  
  // Competition
  competition: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
  } | null;
  stage: CompetitionStage | null;
  groupName: string | null;
  round: number | null;
  matchday: number | null;
  leg: number | null;
  
  // Officials
  referee: {
    id: string;
    name: string;
  } | null;
  
  // Result
  resultApprovalStatus: string | null;
  matchReport: string | null;
  attendance: number | null;
  
  // Meta
  isBroadcasted: boolean;
  broadcastUrl: string | null;
  isFeatured: boolean;
  notes: string | null;
  
  // Counts
  eventCount: number;
  performanceCount: number;
  attendanceCount: number;
  
  // User context
  userPermissions: {
    canEdit: boolean;
    canDelete: boolean;
    canRecordEvents: boolean;
    canManageLineup: boolean;
    canSubmitResult: boolean;
    canApproveResult: boolean;
  };
  
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateMatchSchema = z.object({
  // Timing
  kickOffTime: z.string().optional(),
  attendanceDeadline: z.string().nullable().optional(),
  
  // Venue
  venueId: z.string().nullable().optional(),
  facilityId: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  pitch: z.string().nullable().optional(),
  isNeutralVenue: z.boolean().optional(),
  
  // Competition details
  stage: z.nativeEnum(CompetitionStage).nullable().optional(),
  groupName: z.string().nullable().optional(),
  round: z.number().nullable().optional(),
  matchday: z.number().nullable().optional(),
  leg: z.number().nullable().optional(),
  
  // Metadata
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  
  // Formations
  homeFormation: z.string().nullable().optional(),
  awayFormation: z.string().nullable().optional(),
  
  // Broadcasting
  isBroadcasted: z.boolean().optional(),
  broadcastUrl: z.string().url().nullable().optional(),
  isHighlighted: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  
  // Status (limited updates)
  status: z.nativeEnum(MatchStatus).optional(),
  
  // Referee
  refereeId: z.string().nullable().optional(),
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

const MANAGE_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

const EVENT_ROLES: ClubMemberRole[] = [
  ...MANAGE_ROLES,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
];

const VIEW_ROLES: ClubMemberRole[] = [
  ...EVENT_ROLES,
  ClubMemberRole.STAFF,
  ClubMemberRole.PLAYER,
];

interface Permissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canRecordEvents: boolean;
  canManageLineup: boolean;
  canSubmitResult: boolean;
  canApproveResult: boolean;
  role: ClubMemberRole | null;
}

async function getPermissions(
  userId: string,
  homeClubId: string,
  awayClubId: string
): Promise<Permissions> {
  // Check if super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, roles: true },
  });

  if (user?.isSuperAdmin) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canRecordEvents: true,
      canManageLineup: true,
      canSubmitResult: true,
      canApproveResult: true,
      role: ClubMemberRole.OWNER,
    };
  }

  // Check if referee (can approve results)
  const isReferee = user?.roles?.includes('REFEREE');

  // Check club membership
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId: { in: [homeClubId, awayClubId] },
      isActive: true,
    },
    select: { role: true, clubId: true },
  });

  if (!membership) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canRecordEvents: false,
      canManageLineup: false,
      canSubmitResult: false,
      canApproveResult: isReferee || false,
      role: null,
    };
  }

  const role = membership.role;

  return {
    canView: VIEW_ROLES.includes(role),
    canEdit: MANAGE_ROLES.includes(role),
    canDelete: [ClubMemberRole.OWNER, ClubMemberRole.MANAGER].includes(role),
    canRecordEvents: EVENT_ROLES.includes(role),
    canManageLineup: MANAGE_ROLES.includes(role),
    canSubmitResult: MANAGE_ROLES.includes(role),
    canApproveResult: isReferee || false,
    role,
  };
}

// =============================================================================
// GET HANDLER - Get Match Details
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

    // 2. Fetch match with full details
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      include: {
        homeTeam: {
          select: { id: true, name: true, logo: true },
        },
        awayTeam: {
          select: { id: true, name: true, logo: true },
        },
        homeClub: {
          select: { id: true, name: true, shortName: true, logo: true, sport: true },
        },
        awayClub: {
          select: { id: true, name: true, shortName: true, logo: true },
        },
        competition: {
          select: { id: true, name: true, shortName: true, logo: true },
        },
        referee: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: {
            events: true,
            playerPerformances: true,
            attendances: true,
          },
        },
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

    // 3. Authorization
    const permissions = await getPermissions(
      session.user.id,
      match.homeClubId,
      match.awayClubId
    );

    if (!permissions.canView) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view this match',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 4. Build response
    const response: MatchDetail = {
      id: match.id,
      title: match.title,
      matchType: match.matchType,
      status: match.status,
      kickOffTime: match.kickOffTime.toISOString(),
      endTime: match.endTime?.toISOString() || null,
      duration: match.duration,
      venue: match.venue,
      pitch: match.pitch,
      isNeutralVenue: match.isNeutralVenue,
      
      homeTeam: {
        ...match.homeTeam,
        formation: match.homeFormation,
      },
      awayTeam: {
        ...match.awayTeam,
        formation: match.awayFormation,
      },
      
      homeClub: match.homeClub,
      awayClub: match.awayClub,
      
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeHalftimeScore: match.homeHalftimeScore,
      awayHalftimeScore: match.awayHalftimeScore,
      homeExtraTimeScore: match.homeExtraTimeScore,
      awayExtraTimeScore: match.awayExtraTimeScore,
      homePenalties: match.homePenalties,
      awayPenalties: match.awayPenalties,
      homeScoreBreakdown: match.homeScoreBreakdown as Record<string, number> | null,
      awayScoreBreakdown: match.awayScoreBreakdown as Record<string, number> | null,
      
      competition: match.competition,
      stage: match.stage,
      groupName: match.groupName,
      round: match.round,
      matchday: match.matchday,
      leg: match.leg,
      
      referee: match.referee ? {
        id: match.referee.id,
        name: `${match.referee.user.firstName} ${match.referee.user.lastName}`,
      } : null,
      
      resultApprovalStatus: match.resultApprovalStatus,
      matchReport: match.matchReport,
      attendance: match.attendance,
      
      isBroadcasted: match.isBroadcasted,
      broadcastUrl: match.broadcastUrl,
      isFeatured: match.isFeatured,
      notes: match.notes,
      
      eventCount: match._count.events,
      performanceCount: match._count.playerPerformances,
      attendanceCount: match._count.attendances,
      
      userPermissions: {
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete,
        canRecordEvents: permissions.canRecordEvents,
        canManageLineup: permissions.canManageLineup,
        canSubmitResult: permissions.canSubmitResult,
        canApproveResult: permissions.canApproveResult,
      },
      
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Match error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch match',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Match
// =============================================================================

export async function PATCH(
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
        status: true,
        kickOffTime: true,
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

    // 3. Authorization
    const permissions = await getPermissions(
      session.user.id,
      match.homeClubId,
      match.awayClubId
    );

    if (!permissions.canEdit) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to edit this match',
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

    const validation = UpdateMatchSchema.safeParse(body);
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

    // 5. Build update data
    const updateData: Record<string, unknown> = {};

    if (updates.kickOffTime) {
      updateData.kickOffTime = new Date(updates.kickOffTime);
    }
    if (updates.attendanceDeadline !== undefined) {
      updateData.attendanceDeadline = updates.attendanceDeadline
        ? new Date(updates.attendanceDeadline)
        : null;
    }

    // Copy other fields
    const directFields = [
      'venueId', 'facilityId', 'venue', 'pitch', 'isNeutralVenue',
      'stage', 'groupName', 'round', 'matchday', 'leg',
      'title', 'description', 'notes',
      'homeFormation', 'awayFormation',
      'isBroadcasted', 'broadcastUrl', 'isHighlighted', 'isFeatured',
      'status', 'refereeId',
    ];

    directFields.forEach((field) => {
      if ((updates as Record<string, unknown>)[field] !== undefined) {
        updateData[field] = (updates as Record<string, unknown>)[field];
      }
    });

    // 6. Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        kickOffTime: true,
        venue: true,
        updatedAt: true,
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MATCH_UPDATED',
        resourceType: 'MATCH',
        resourceId: matchId,
        beforeState: {
          status: match.status,
          kickOffTime: match.kickOffTime,
        },
        afterState: updateData,
        changes: Object.keys(updates),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return createResponse({
      id: updatedMatch.id,
      title: updatedMatch.title,
      status: updatedMatch.status,
      kickOffTime: updatedMatch.kickOffTime.toISOString(),
      venue: updatedMatch.venue,
      updated: true,
      changes: Object.keys(updates),
    }, {
      success: true,
      message: 'Match updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Update Match error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update match',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Delete Match
// =============================================================================

export async function DELETE(
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
        title: true,
        homeClubId: true,
        awayClubId: true,
        status: true,
        _count: {
          select: {
            events: true,
            playerPerformances: true,
          },
        },
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

    // 3. Authorization
    const permissions = await getPermissions(
      session.user.id,
      match.homeClubId,
      match.awayClubId
    );

    if (!permissions.canDelete) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to delete this match',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 4. Check if match can be deleted
    if (match.status === MatchStatus.FINISHED) {
      return createResponse(null, {
        success: false,
        error: 'Cannot delete a finished match. Consider archiving instead.',
        code: 'MATCH_FINISHED',
        requestId,
        status: 400,
      });
    }

    // 5. Soft delete if has data, hard delete if not
    const hasData = match._count.events > 0 || match._count.playerPerformances > 0;

    if (hasData) {
      // Soft delete
      await prisma.match.update({
        where: { id: matchId },
        data: {
          deletedAt: new Date(),
          deletedBy: session.user.id,
        },
      });
    } else {
      // Hard delete - also remove attendance records
      await prisma.$transaction([
        prisma.matchAttendance.deleteMany({ where: { matchId } }),
        prisma.match.delete({ where: { id: matchId } }),
      ]);
    }

    // 6. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MATCH_DELETED',
        resourceType: 'MATCH',
        resourceId: matchId,
        beforeState: {
          title: match.title,
          status: match.status,
        },
        afterState: {
          deletedAt: new Date(),
          deleteType: hasData ? 'soft' : 'hard',
        },
      },
    });

    return createResponse(null, {
      success: true,
      message: hasData
        ? 'Match archived successfully'
        : 'Match deleted successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Delete Match error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete match',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}