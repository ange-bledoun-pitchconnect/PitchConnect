// =============================================================================
// 🏆 MATCH RESULT API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/matches/[matchId]/result - Get result status
// POST /api/matches/[matchId]/result - Submit/Update/Approve result
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// 
// WORKFLOW:
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ COMPETITION MATCHES (League, Cup, Tournament):                          │
// │   Coach/Manager submits → Referee/League Admin approves → Standings     │
// │                                                                         │
// │ FRIENDLY MATCHES:                                                       │
// │   Team A submits → Team B sees pending → Team B confirms → Confirmed   │
// │   (Both clubs must approve for result to be official)                  │
// └─────────────────────────────────────────────────────────────────────────┘
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
  ResultApprovalStatus,
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

type ResultAction =
  | 'UPDATE_LIVE'      // During match - update live score
  | 'SUBMIT_FINAL'     // After match - submit final result
  | 'APPROVE'          // Referee/Admin approval
  | 'CONFIRM'          // Second team confirmation (friendlies)
  | 'REJECT'           // Reject submitted result
  | 'AMEND'            // Amend result (referee/admin)
  ;

interface ResultSubmission {
  matchId: string;
  status: ResultApprovalStatus;
  
  // Submitted scores
  homeScore: number;
  awayScore: number;
  homeHalftimeScore: number | null;
  awayHalftimeScore: number | null;
  homeExtraTimeScore: number | null;
  awayExtraTimeScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  homeScoreBreakdown: Record<string, number> | null;
  awayScoreBreakdown: Record<string, number> | null;
  
  // Submission tracking
  submittedByHomeClub: boolean;
  submittedByAwayClub: boolean;
  homeClubSubmittedAt: string | null;
  awayClubSubmittedAt: string | null;
  homeClubSubmittedBy: string | null;
  awayClubSubmittedBy: string | null;
  
  // Approval tracking
  approvedAt: string | null;
  approvedBy: {
    id: string;
    name: string;
    role: string;
  } | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  
  // Match context
  matchType: MatchType;
  requiresDualApproval: boolean;
  pendingApprovalFrom: 'HOME' | 'AWAY' | 'REFEREE' | 'LEAGUE_ADMIN' | null;
  
  notes: string | null;
}

// =============================================================================
// MULTI-SPORT SCORE BREAKDOWN CONFIGS
// =============================================================================

const SPORT_SCORE_BREAKDOWN: Record<Sport, string[]> = {
  FOOTBALL: ['goals'],
  RUGBY: ['tries', 'conversions', 'penalties', 'dropGoals'],
  BASKETBALL: ['twoPointers', 'threePointers', 'freeThrows'],
  CRICKET: ['runs', 'wickets', 'overs', 'extras'],
  AMERICAN_FOOTBALL: ['touchdowns', 'fieldGoals', 'safeties', 'extraPoints', 'twoPointConversions'],
  NETBALL: ['goals'],
  HOCKEY: ['goals'],
  LACROSSE: ['goals'],
  AUSTRALIAN_RULES: ['goals', 'behinds'], // Total = (goals * 6) + behinds
  GAELIC_FOOTBALL: ['goals', 'points'], // Total = (goals * 3) + points
  FUTSAL: ['goals'],
  BEACH_FOOTBALL: ['goals'],
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ResultActionSchema = z.object({
  action: z.enum(['UPDATE_LIVE', 'SUBMIT_FINAL', 'APPROVE', 'CONFIRM', 'REJECT', 'AMEND']),
  
  // Scores
  homeScore: z.number().min(0).optional(),
  awayScore: z.number().min(0).optional(),
  homeHalftimeScore: z.number().min(0).nullable().optional(),
  awayHalftimeScore: z.number().min(0).nullable().optional(),
  homeExtraTimeScore: z.number().min(0).nullable().optional(),
  awayExtraTimeScore: z.number().min(0).nullable().optional(),
  homePenalties: z.number().min(0).nullable().optional(),
  awayPenalties: z.number().min(0).nullable().optional(),
  
  // Sport-specific breakdown
  homeScoreBreakdown: z.record(z.number()).nullable().optional(),
  awayScoreBreakdown: z.record(z.number()).nullable().optional(),
  
  // Match status (for UPDATE_LIVE)
  status: z.nativeEnum(MatchStatus).optional(),
  
  // Final status (for SUBMIT_FINAL)
  finalStatus: z.enum(['FINISHED', 'ABANDONED', 'CANCELLED', 'POSTPONED', 'VOIDED']).optional(),
  
  // Additional info
  attendance: z.number().min(0).nullable().optional(),
  matchReport: z.string().max(5000).optional(),
  notes: z.string().max(1000).optional(),
  
  // For REJECT action
  rejectionReason: z.string().min(10).max(500).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `result_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const SUBMIT_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

interface UserPermissions {
  canSubmitResult: boolean;
  canApproveResult: boolean;
  canRejectResult: boolean;
  canAmendResult: boolean;
  isHomeClub: boolean;
  isAwayClub: boolean;
  isReferee: boolean;
  isLeagueAdmin: boolean;
}

async function getResultPermissions(
  userId: string,
  match: {
    homeClubId: string;
    awayClubId: string;
    competitionId: string | null;
    refereeId: string | null;
  }
): Promise<UserPermissions> {
  // Check user roles
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, roles: true },
  });

  if (user?.isSuperAdmin) {
    return {
      canSubmitResult: true,
      canApproveResult: true,
      canRejectResult: true,
      canAmendResult: true,
      isHomeClub: true,
      isAwayClub: true,
      isReferee: true,
      isLeagueAdmin: true,
    };
  }

  // Check if user is the match referee
  let isReferee = false;
  if (match.refereeId) {
    const referee = await prisma.referee.findUnique({
      where: { id: match.refereeId },
      select: { userId: true },
    });
    isReferee = referee?.userId === userId;
  }

  // Check if user is league admin
  let isLeagueAdmin = false;
  if (match.competitionId) {
    const competition = await prisma.competition.findUnique({
      where: { id: match.competitionId },
      include: {
        league: {
          include: {
            admins: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
    });
    isLeagueAdmin = (competition?.league?.admins?.length || 0) > 0;
  }

  // Check club memberships
  const memberships = await prisma.clubMember.findMany({
    where: {
      userId,
      clubId: { in: [match.homeClubId, match.awayClubId] },
      isActive: true,
    },
    select: { clubId: true, role: true },
  });

  const homeMembership = memberships.find((m) => m.clubId === match.homeClubId);
  const awayMembership = memberships.find((m) => m.clubId === match.awayClubId);

  const isHomeClub = homeMembership && SUBMIT_ROLES.includes(homeMembership.role);
  const isAwayClub = awayMembership && SUBMIT_ROLES.includes(awayMembership.role);

  return {
    canSubmitResult: !!isHomeClub || !!isAwayClub,
    canApproveResult: isReferee || isLeagueAdmin,
    canRejectResult: isReferee || isLeagueAdmin,
    canAmendResult: isReferee || isLeagueAdmin,
    isHomeClub: !!isHomeClub,
    isAwayClub: !!isAwayClub,
    isReferee,
    isLeagueAdmin,
  };
}

// =============================================================================
// GET HANDLER - Get Result Status
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

    // 2. Fetch match with result approval records
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      include: {
        homeClub: { select: { id: true, name: true, sport: true } },
        awayClub: { select: { id: true, name: true } },
        resultApprovals: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            submittedByUser: {
              select: { firstName: true, lastName: true },
            },
            approvedByUser: {
              select: { firstName: true, lastName: true },
            },
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

    // 3. Build result status
    const latestApproval = match.resultApprovals[0];
    const isFriendly = match.matchType === MatchType.FRIENDLY;
    const requiresDualApproval = isFriendly;

    // Determine pending approval source
    let pendingApprovalFrom: 'HOME' | 'AWAY' | 'REFEREE' | 'LEAGUE_ADMIN' | null = null;
    
    if (match.resultApprovalStatus === 'PENDING') {
      if (isFriendly) {
        // For friendlies, check which club hasn't confirmed
        if (latestApproval?.homeClubConfirmed && !latestApproval?.awayClubConfirmed) {
          pendingApprovalFrom = 'AWAY';
        } else if (!latestApproval?.homeClubConfirmed && latestApproval?.awayClubConfirmed) {
          pendingApprovalFrom = 'HOME';
        } else if (!latestApproval?.homeClubConfirmed && !latestApproval?.awayClubConfirmed) {
          pendingApprovalFrom = 'HOME'; // Need first submission
        }
      } else {
        // For competitions, need referee/admin approval
        pendingApprovalFrom = match.refereeId ? 'REFEREE' : 'LEAGUE_ADMIN';
      }
    }

    const result: ResultSubmission = {
      matchId: match.id,
      status: match.resultApprovalStatus as ResultApprovalStatus || 'PENDING',
      
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
      homeHalftimeScore: match.homeHalftimeScore,
      awayHalftimeScore: match.awayHalftimeScore,
      homeExtraTimeScore: match.homeExtraTimeScore,
      awayExtraTimeScore: match.awayExtraTimeScore,
      homePenalties: match.homePenalties,
      awayPenalties: match.awayPenalties,
      homeScoreBreakdown: match.homeScoreBreakdown as Record<string, number> | null,
      awayScoreBreakdown: match.awayScoreBreakdown as Record<string, number> | null,
      
      submittedByHomeClub: latestApproval?.homeClubConfirmed || false,
      submittedByAwayClub: latestApproval?.awayClubConfirmed || false,
      homeClubSubmittedAt: latestApproval?.homeClubConfirmedAt?.toISOString() || null,
      awayClubSubmittedAt: latestApproval?.awayClubConfirmedAt?.toISOString() || null,
      homeClubSubmittedBy: latestApproval?.homeClubConfirmedBy || null,
      awayClubSubmittedBy: latestApproval?.awayClubConfirmedBy || null,
      
      approvedAt: latestApproval?.approvedAt?.toISOString() || null,
      approvedBy: latestApproval?.approvedByUser ? {
        id: latestApproval.approvedBy!,
        name: `${latestApproval.approvedByUser.firstName} ${latestApproval.approvedByUser.lastName}`,
        role: latestApproval.approvedByRole || 'UNKNOWN',
      } : null,
      rejectedAt: latestApproval?.rejectedAt?.toISOString() || null,
      rejectedBy: latestApproval?.rejectedBy || null,
      rejectionReason: latestApproval?.rejectionReason || null,
      
      matchType: match.matchType,
      requiresDualApproval,
      pendingApprovalFrom,
      
      notes: latestApproval?.notes || null,
    };

    // Get user's permissions for this result
    const permissions = await getResultPermissions(session.user.id, {
      homeClubId: match.homeClubId,
      awayClubId: match.awayClubId,
      competitionId: match.competitionId,
      refereeId: match.refereeId,
    });

    return createResponse({
      result,
      permissions,
      sportScoreFields: SPORT_SCORE_BREAKDOWN[match.homeClub.sport],
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Result error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch result',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Submit/Update/Approve Result
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

    const validation = ResultActionSchema.safeParse(body);
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

    // 3. Fetch match
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      include: {
        homeClub: { select: { id: true, name: true, sport: true } },
        awayClub: { select: { id: true, name: true } },
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        competition: { select: { id: true, name: true, leagueId: true } },
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

    // 4. Get user permissions
    const permissions = await getResultPermissions(session.user.id, {
      homeClubId: match.homeClubId,
      awayClubId: match.awayClubId,
      competitionId: match.competitionId,
      refereeId: match.refereeId,
    });

    // 5. Handle action
    const action = data.action as ResultAction;

    switch (action) {
      // =====================================================================
      // UPDATE_LIVE - Update score during match
      // =====================================================================
      case 'UPDATE_LIVE': {
        if (!permissions.canSubmitResult) {
          return createResponse(null, {
            success: false,
            error: 'You do not have permission to update live scores',
            code: 'FORBIDDEN',
            requestId,
            status: 403,
          });
        }

        const updateData: Record<string, unknown> = {};
        if (data.homeScore !== undefined) updateData.homeScore = data.homeScore;
        if (data.awayScore !== undefined) updateData.awayScore = data.awayScore;
        if (data.status) updateData.status = data.status;
        if (data.homeScoreBreakdown) updateData.homeScoreBreakdown = data.homeScoreBreakdown;
        if (data.awayScoreBreakdown) updateData.awayScoreBreakdown = data.awayScoreBreakdown;

        await prisma.match.update({
          where: { id: matchId },
          data: updateData,
        });

        // TODO: Emit WebSocket event for real-time updates

        return createResponse({
          matchId,
          action: 'UPDATE_LIVE',
          homeScore: data.homeScore ?? match.homeScore,
          awayScore: data.awayScore ?? match.awayScore,
          status: data.status ?? match.status,
        }, {
          success: true,
          message: 'Live score updated',
          requestId,
        });
      }

      // =====================================================================
      // SUBMIT_FINAL - Submit final result for approval
      // =====================================================================
      case 'SUBMIT_FINAL': {
        if (!permissions.canSubmitResult) {
          return createResponse(null, {
            success: false,
            error: 'You do not have permission to submit results',
            code: 'FORBIDDEN',
            requestId,
            status: 403,
          });
        }

        if (data.homeScore === undefined || data.awayScore === undefined) {
          return createResponse(null, {
            success: false,
            error: 'Home and away scores are required',
            code: 'VALIDATION_ERROR',
            requestId,
            status: 400,
          });
        }

        const isFriendly = match.matchType === MatchType.FRIENDLY;

        // Update match with submitted scores
        await prisma.match.update({
          where: { id: matchId },
          data: {
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            homeHalftimeScore: data.homeHalftimeScore,
            awayHalftimeScore: data.awayHalftimeScore,
            homeExtraTimeScore: data.homeExtraTimeScore,
            awayExtraTimeScore: data.awayExtraTimeScore,
            homePenalties: data.homePenalties,
            awayPenalties: data.awayPenalties,
            homeScoreBreakdown: data.homeScoreBreakdown,
            awayScoreBreakdown: data.awayScoreBreakdown,
            status: data.finalStatus as MatchStatus || MatchStatus.FINISHED,
            attendance: data.attendance,
            matchReport: data.matchReport,
            notes: data.notes,
            endTime: new Date(),
            resultApprovalStatus: 'PENDING',
          },
        });

        // Create or update result approval record
        const existingApproval = await prisma.matchResultApproval.findFirst({
          where: { matchId, status: 'PENDING' },
        });

        const approvalData: Record<string, unknown> = {
          matchId,
          submittedBy: session.user.id,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          notes: data.notes,
          status: 'PENDING',
        };

        // For friendlies, track which club submitted
        if (isFriendly) {
          if (permissions.isHomeClub) {
            approvalData.homeClubConfirmed = true;
            approvalData.homeClubConfirmedAt = new Date();
            approvalData.homeClubConfirmedBy = session.user.id;
          }
          if (permissions.isAwayClub) {
            approvalData.awayClubConfirmed = true;
            approvalData.awayClubConfirmedAt = new Date();
            approvalData.awayClubConfirmedBy = session.user.id;
          }
        }

        if (existingApproval) {
          await prisma.matchResultApproval.update({
            where: { id: existingApproval.id },
            data: approvalData,
          });
        } else {
          await prisma.matchResultApproval.create({
            data: approvalData as any,
          });
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'RESULT_SUBMITTED',
            resourceType: 'MATCH',
            resourceId: matchId,
            afterState: {
              homeScore: data.homeScore,
              awayScore: data.awayScore,
              submittedBy: permissions.isHomeClub ? 'HOME' : 'AWAY',
            },
          },
        });

        return createResponse({
          matchId,
          action: 'SUBMIT_FINAL',
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          status: 'PENDING',
          requiresApproval: isFriendly ? 'OPPOSING_CLUB' : 'REFEREE_OR_ADMIN',
        }, {
          success: true,
          message: isFriendly
            ? 'Result submitted. Awaiting confirmation from opposing club.'
            : 'Result submitted. Awaiting referee/admin approval.',
          requestId,
        });
      }

      // =====================================================================
      // CONFIRM - Second team confirms (friendlies only)
      // =====================================================================
      case 'CONFIRM': {
        if (match.matchType !== MatchType.FRIENDLY) {
          return createResponse(null, {
            success: false,
            error: 'CONFIRM action is only for friendly matches',
            code: 'INVALID_ACTION',
            requestId,
            status: 400,
          });
        }

        if (!permissions.canSubmitResult) {
          return createResponse(null, {
            success: false,
            error: 'You do not have permission to confirm results',
            code: 'FORBIDDEN',
            requestId,
            status: 403,
          });
        }

        // Get pending approval
        const pendingApproval = await prisma.matchResultApproval.findFirst({
          where: { matchId, status: 'PENDING' },
        });

        if (!pendingApproval) {
          return createResponse(null, {
            success: false,
            error: 'No pending result to confirm',
            code: 'NO_PENDING_RESULT',
            requestId,
            status: 400,
          });
        }

        // Update confirmation
        const confirmData: Record<string, unknown> = {};
        let bothConfirmed = false;

        if (permissions.isHomeClub && !pendingApproval.homeClubConfirmed) {
          confirmData.homeClubConfirmed = true;
          confirmData.homeClubConfirmedAt = new Date();
          confirmData.homeClubConfirmedBy = session.user.id;
        }
        if (permissions.isAwayClub && !pendingApproval.awayClubConfirmed) {
          confirmData.awayClubConfirmed = true;
          confirmData.awayClubConfirmedAt = new Date();
          confirmData.awayClubConfirmedBy = session.user.id;
        }

        // Check if both clubs have now confirmed
        const homeConfirmed = confirmData.homeClubConfirmed || pendingApproval.homeClubConfirmed;
        const awayConfirmed = confirmData.awayClubConfirmed || pendingApproval.awayClubConfirmed;
        bothConfirmed = homeConfirmed && awayConfirmed;

        if (bothConfirmed) {
          confirmData.status = 'APPROVED';
          confirmData.approvedAt = new Date();
          confirmData.approvedByRole = 'DUAL_CONFIRMATION';
        }

        await prisma.matchResultApproval.update({
          where: { id: pendingApproval.id },
          data: confirmData,
        });

        // If both confirmed, update match status
        if (bothConfirmed) {
          await prisma.match.update({
            where: { id: matchId },
            data: { resultApprovalStatus: 'APPROVED' },
          });

          // Create audit log
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: 'RESULT_CONFIRMED',
              resourceType: 'MATCH',
              resourceId: matchId,
              afterState: {
                homeScore: pendingApproval.homeScore,
                awayScore: pendingApproval.awayScore,
                approvalType: 'DUAL_CONFIRMATION',
              },
            },
          });
        }

        return createResponse({
          matchId,
          action: 'CONFIRM',
          confirmed: true,
          bothClubsConfirmed: bothConfirmed,
          status: bothConfirmed ? 'APPROVED' : 'PENDING',
        }, {
          success: true,
          message: bothConfirmed
            ? 'Result confirmed by both clubs. Match result is now official.'
            : 'Your confirmation recorded. Awaiting confirmation from opposing club.',
          requestId,
        });
      }

      // =====================================================================
      // APPROVE - Referee/Admin approves result
      // =====================================================================
      case 'APPROVE': {
        if (!permissions.canApproveResult) {
          return createResponse(null, {
            success: false,
            error: 'Only referees and league admins can approve results',
            code: 'FORBIDDEN',
            requestId,
            status: 403,
          });
        }

        // Get pending approval
        const pendingApproval = await prisma.matchResultApproval.findFirst({
          where: { matchId, status: 'PENDING' },
        });

        if (!pendingApproval) {
          return createResponse(null, {
            success: false,
            error: 'No pending result to approve',
            code: 'NO_PENDING_RESULT',
            requestId,
            status: 400,
          });
        }

        // Approve the result
        await prisma.matchResultApproval.update({
          where: { id: pendingApproval.id },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: session.user.id,
            approvedByRole: permissions.isReferee ? 'REFEREE' : 'LEAGUE_ADMIN',
          },
        });

        // Update match
        await prisma.match.update({
          where: { id: matchId },
          data: { resultApprovalStatus: 'APPROVED' },
        });

        // Update competition standings if applicable
        if (match.competitionId) {
          await updateCompetitionStandings(
            match.competitionId,
            match.homeTeamId,
            match.awayTeamId,
            pendingApproval.homeScore,
            pendingApproval.awayScore,
            match.homeClub.sport
          );
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'RESULT_APPROVED',
            resourceType: 'MATCH',
            resourceId: matchId,
            afterState: {
              homeScore: pendingApproval.homeScore,
              awayScore: pendingApproval.awayScore,
              approvedBy: permissions.isReferee ? 'REFEREE' : 'LEAGUE_ADMIN',
            },
          },
        });

        return createResponse({
          matchId,
          action: 'APPROVE',
          homeScore: pendingApproval.homeScore,
          awayScore: pendingApproval.awayScore,
          status: 'APPROVED',
          standingsUpdated: !!match.competitionId,
        }, {
          success: true,
          message: 'Result approved. Standings have been updated.',
          requestId,
        });
      }

      // =====================================================================
      // REJECT - Reject submitted result
      // =====================================================================
      case 'REJECT': {
        if (!permissions.canRejectResult) {
          return createResponse(null, {
            success: false,
            error: 'Only referees and league admins can reject results',
            code: 'FORBIDDEN',
            requestId,
            status: 403,
          });
        }

        if (!data.rejectionReason) {
          return createResponse(null, {
            success: false,
            error: 'Rejection reason is required',
            code: 'VALIDATION_ERROR',
            requestId,
            status: 400,
          });
        }

        // Get pending approval
        const pendingApproval = await prisma.matchResultApproval.findFirst({
          where: { matchId, status: 'PENDING' },
        });

        if (!pendingApproval) {
          return createResponse(null, {
            success: false,
            error: 'No pending result to reject',
            code: 'NO_PENDING_RESULT',
            requestId,
            status: 400,
          });
        }

        // Reject the result
        await prisma.matchResultApproval.update({
          where: { id: pendingApproval.id },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectedBy: session.user.id,
            rejectionReason: data.rejectionReason,
          },
        });

        // Update match status
        await prisma.match.update({
          where: { id: matchId },
          data: { resultApprovalStatus: 'REJECTED' },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'RESULT_REJECTED',
            resourceType: 'MATCH',
            resourceId: matchId,
            afterState: {
              rejectionReason: data.rejectionReason,
            },
          },
        });

        return createResponse({
          matchId,
          action: 'REJECT',
          status: 'REJECTED',
          rejectionReason: data.rejectionReason,
        }, {
          success: true,
          message: 'Result rejected. Clubs can resubmit with corrections.',
          requestId,
        });
      }

      // =====================================================================
      // AMEND - Referee/Admin amends result
      // =====================================================================
      case 'AMEND': {
        if (!permissions.canAmendResult) {
          return createResponse(null, {
            success: false,
            error: 'Only referees and league admins can amend results',
            code: 'FORBIDDEN',
            requestId,
            status: 403,
          });
        }

        if (data.homeScore === undefined || data.awayScore === undefined) {
          return createResponse(null, {
            success: false,
            error: 'Home and away scores are required for amendment',
            code: 'VALIDATION_ERROR',
            requestId,
            status: 400,
          });
        }

        // Update match with amended scores
        const previousScores = {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        };

        await prisma.match.update({
          where: { id: matchId },
          data: {
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            homeHalftimeScore: data.homeHalftimeScore,
            awayHalftimeScore: data.awayHalftimeScore,
            homeExtraTimeScore: data.homeExtraTimeScore,
            awayExtraTimeScore: data.awayExtraTimeScore,
            homePenalties: data.homePenalties,
            awayPenalties: data.awayPenalties,
            homeScoreBreakdown: data.homeScoreBreakdown,
            awayScoreBreakdown: data.awayScoreBreakdown,
            resultApprovalStatus: 'APPROVED',
          },
        });

        // Create amendment record
        await prisma.matchResultApproval.create({
          data: {
            matchId,
            submittedBy: session.user.id,
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            notes: data.notes || 'Result amended by official',
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: session.user.id,
            approvedByRole: permissions.isReferee ? 'REFEREE' : 'LEAGUE_ADMIN',
            isAmendment: true,
            previousHomeScore: previousScores.homeScore,
            previousAwayScore: previousScores.awayScore,
          },
        });

        // Update standings if result changed
        if (match.competitionId && (
          previousScores.homeScore !== data.homeScore ||
          previousScores.awayScore !== data.awayScore
        )) {
          // Reverse old standings and apply new
          await reverseAndUpdateStandings(
            match.competitionId,
            match.homeTeamId,
            match.awayTeamId,
            previousScores.homeScore || 0,
            previousScores.awayScore || 0,
            data.homeScore,
            data.awayScore,
            match.homeClub.sport
          );
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'RESULT_AMENDED',
            resourceType: 'MATCH',
            resourceId: matchId,
            beforeState: previousScores,
            afterState: {
              homeScore: data.homeScore,
              awayScore: data.awayScore,
              amendedBy: permissions.isReferee ? 'REFEREE' : 'LEAGUE_ADMIN',
            },
          },
        });

        return createResponse({
          matchId,
          action: 'AMEND',
          previousHomeScore: previousScores.homeScore,
          previousAwayScore: previousScores.awayScore,
          newHomeScore: data.homeScore,
          newAwayScore: data.awayScore,
          status: 'APPROVED',
          standingsUpdated: !!match.competitionId,
        }, {
          success: true,
          message: 'Result amended. Standings have been updated.',
          requestId,
        });
      }

      default:
        return createResponse(null, {
          success: false,
          error: `Unknown action: ${action}`,
          code: 'INVALID_ACTION',
          requestId,
          status: 400,
        });
    }
  } catch (error) {
    console.error(`[${requestId}] Result action error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to process result action',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// HELPER: Update Competition Standings
// =============================================================================

async function updateCompetitionStandings(
  competitionId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  sport: Sport
): Promise<void> {
  // Determine winner
  const homeWin = homeScore > awayScore;
  const awayWin = awayScore > homeScore;
  const draw = homeScore === awayScore;

  // Standard points (can be made sport-specific)
  const pointsWin = 3;
  const pointsDraw = 1;
  const pointsLoss = 0;

  const homePoints = homeWin ? pointsWin : draw ? pointsDraw : pointsLoss;
  const awayPoints = awayWin ? pointsWin : draw ? pointsDraw : pointsLoss;

  // Update home team standing
  await prisma.competitionStanding.upsert({
    where: {
      competitionId_teamId: { competitionId, teamId: homeTeamId },
    },
    update: {
      played: { increment: 1 },
      won: homeWin ? { increment: 1 } : undefined,
      drawn: draw ? { increment: 1 } : undefined,
      lost: awayWin ? { increment: 1 } : undefined,
      goalsFor: { increment: homeScore },
      goalsAgainst: { increment: awayScore },
      goalDifference: { increment: homeScore - awayScore },
      points: { increment: homePoints },
    },
    create: {
      competitionId,
      teamId: homeTeamId,
      played: 1,
      won: homeWin ? 1 : 0,
      drawn: draw ? 1 : 0,
      lost: awayWin ? 1 : 0,
      goalsFor: homeScore,
      goalsAgainst: awayScore,
      goalDifference: homeScore - awayScore,
      points: homePoints,
    },
  });

  // Update away team standing
  await prisma.competitionStanding.upsert({
    where: {
      competitionId_teamId: { competitionId, teamId: awayTeamId },
    },
    update: {
      played: { increment: 1 },
      won: awayWin ? { increment: 1 } : undefined,
      drawn: draw ? { increment: 1 } : undefined,
      lost: homeWin ? { increment: 1 } : undefined,
      goalsFor: { increment: awayScore },
      goalsAgainst: { increment: homeScore },
      goalDifference: { increment: awayScore - homeScore },
      points: { increment: awayPoints },
    },
    create: {
      competitionId,
      teamId: awayTeamId,
      played: 1,
      won: awayWin ? 1 : 0,
      drawn: draw ? 1 : 0,
      lost: homeWin ? 1 : 0,
      goalsFor: awayScore,
      goalsAgainst: homeScore,
      goalDifference: awayScore - homeScore,
      points: awayPoints,
    },
  });

  // Recalculate positions
  await recalculateStandingsPositions(competitionId);
}

async function reverseAndUpdateStandings(
  competitionId: string,
  homeTeamId: string,
  awayTeamId: string,
  oldHomeScore: number,
  oldAwayScore: number,
  newHomeScore: number,
  newAwayScore: number,
  sport: Sport
): Promise<void> {
  // First reverse the old result
  const oldHomeWin = oldHomeScore > oldAwayScore;
  const oldAwayWin = oldAwayScore > oldHomeScore;
  const oldDraw = oldHomeScore === oldAwayScore;

  const pointsWin = 3;
  const pointsDraw = 1;

  // Reverse home team
  await prisma.competitionStanding.updateMany({
    where: { competitionId, teamId: homeTeamId },
    data: {
      played: { decrement: 1 },
      won: oldHomeWin ? { decrement: 1 } : undefined,
      drawn: oldDraw ? { decrement: 1 } : undefined,
      lost: oldAwayWin ? { decrement: 1 } : undefined,
      goalsFor: { decrement: oldHomeScore },
      goalsAgainst: { decrement: oldAwayScore },
      goalDifference: { decrement: oldHomeScore - oldAwayScore },
      points: { decrement: oldHomeWin ? pointsWin : oldDraw ? pointsDraw : 0 },
    },
  });

  // Reverse away team
  await prisma.competitionStanding.updateMany({
    where: { competitionId, teamId: awayTeamId },
    data: {
      played: { decrement: 1 },
      won: oldAwayWin ? { decrement: 1 } : undefined,
      drawn: oldDraw ? { decrement: 1 } : undefined,
      lost: oldHomeWin ? { decrement: 1 } : undefined,
      goalsFor: { decrement: oldAwayScore },
      goalsAgainst: { decrement: oldHomeScore },
      goalDifference: { decrement: oldAwayScore - oldHomeScore },
      points: { decrement: oldAwayWin ? pointsWin : oldDraw ? pointsDraw : 0 },
    },
  });

  // Now apply the new result
  await updateCompetitionStandings(
    competitionId,
    homeTeamId,
    awayTeamId,
    newHomeScore,
    newAwayScore,
    sport
  );
}

async function recalculateStandingsPositions(competitionId: string): Promise<void> {
  const standings = await prisma.competitionStanding.findMany({
    where: { competitionId },
    orderBy: [
      { points: 'desc' },
      { goalDifference: 'desc' },
      { goalsFor: 'desc' },
    ],
  });

  await Promise.all(
    standings.map((standing, index) =>
      prisma.competitionStanding.update({
        where: { id: standing.id },
        data: { position: index + 1 },
      })
    )
  );
}