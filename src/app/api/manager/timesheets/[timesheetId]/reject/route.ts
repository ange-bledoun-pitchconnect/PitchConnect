// =============================================================================
// ❌ REJECT TIMESHEET API - Enterprise-Grade Implementation
// =============================================================================
// POST /api/manager/clubs/[clubId]/timesheets/[timesheetId]/reject
// =============================================================================
// Schema: v7.8.0 | Model: CoachTimesheet
// Field Mapping: rejectedAt, rejectedBy, rejectionReason, status -> REJECTED
// Permission: Owner, Manager, Treasurer
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, TimesheetStatus } from '@prisma/client';

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
    timesheetId: string;
  };
}

interface RejectionResult {
  timesheetId: string;
  period: string;
  coachName: string;
  coachEmail: string;
  totalHours: number;
  status: TimesheetStatus;
  rejectedAt: string;
  rejectedBy: {
    id: string;
    name: string;
  };
  rejectionReason: string;
  canResubmit: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const RejectTimesheetSchema = z.object({
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(1000),
  notifyCoach: z.boolean().default(true),
  allowResubmission: z.boolean().default(true),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `ts_reject_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const APPROVER_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.TREASURER,
];

async function hasApproverPermission(userId: string, clubId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) return true;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { ownerId: true },
  });

  if (club?.ownerId === userId) return true;

  const clubMember = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: APPROVER_ROLES },
    },
  });

  return !!clubMember;
}

// =============================================================================
// POST HANDLER - Reject Timesheet
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, timesheetId } = params;

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
    const hasPermission = await hasApproverPermission(session.user.id, clubId);
    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to reject timesheets',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Get rejecter info
    const rejecter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!rejecter) {
      return createResponse(null, {
        success: false,
        error: 'User not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Fetch timesheet
    const timesheet = await prisma.coachTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!timesheet || timesheet.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Timesheet not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Validate status - must be SUBMITTED or UNDER_REVIEW to reject
    const rejectableStatuses = [TimesheetStatus.SUBMITTED, TimesheetStatus.UNDER_REVIEW];
    if (!rejectableStatuses.includes(timesheet.status)) {
      return createResponse(null, {
        success: false,
        error: `Cannot reject timesheet with status ${timesheet.status}. Only SUBMITTED or UNDER_REVIEW timesheets can be rejected.`,
        code: 'INVALID_STATUS',
        requestId,
        status: 400,
      });
    }

    // 6. Parse and validate body
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

    const validation = RejectTimesheetSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { rejectionReason, allowResubmission } = validation.data;

    // 7. Update timesheet
    const updatedTimesheet = await prisma.coachTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: TimesheetStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: session.user.id,
        rejectionReason,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        reviewNotes: rejectionReason,
      },
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPENSE_REJECTED', // Using existing audit action
        resourceType: 'COACH_TIMESHEET',
        resourceId: timesheetId,
        beforeState: {
          status: timesheet.status,
          totalHours: timesheet.totalHours,
        },
        afterState: {
          status: TimesheetStatus.REJECTED,
          rejectionReason,
          rejectedBy: session.user.id,
        },
      },
    });

    // 9. Create notification for coach (optional)
    try {
      await prisma.notification.create({
        data: {
          userId: timesheet.coach.user.id,
          title: 'Timesheet Rejected',
          message: `Your timesheet for ${timesheet.period} has been rejected. Reason: ${rejectionReason}`,
          type: 'TIMESHEET_REJECTED',
          link: `/coach/timesheets/${timesheetId}`,
          metadata: {
            timesheetId,
            period: timesheet.period,
            rejectedBy: `${rejecter.firstName} ${rejecter.lastName}`,
          },
        },
      });
    } catch (notificationError) {
      // Log but don't fail the request
      console.error(`[${requestId}] Failed to create notification:`, notificationError);
    }

    // 10. Build response
    const result: RejectionResult = {
      timesheetId: updatedTimesheet.id,
      period: updatedTimesheet.period,
      coachName: `${timesheet.coach.user.firstName} ${timesheet.coach.user.lastName}`,
      coachEmail: timesheet.coach.user.email,
      totalHours: updatedTimesheet.totalHours,
      status: updatedTimesheet.status,
      rejectedAt: updatedTimesheet.rejectedAt!.toISOString(),
      rejectedBy: {
        id: rejecter.id,
        name: `${rejecter.firstName} ${rejecter.lastName}`,
      },
      rejectionReason,
      canResubmit: allowResubmission,
    };

    return createResponse(result, {
      success: true,
      message: 'Timesheet rejected. The coach has been notified.',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Reject Timesheet error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to reject timesheet',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}