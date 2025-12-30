// =============================================================================
// ✅ APPROVE TIMESHEET API - Enterprise-Grade Implementation
// =============================================================================
// POST /api/manager/clubs/[clubId]/timesheets/[timesheetId]/approve
// =============================================================================
// Schema: v7.8.0 | Model: CoachTimesheet
// Field Mapping: approvedAt, approvedBy, approvalNotes, status -> APPROVED
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

interface ApprovalResult {
  timesheetId: string;
  period: string;
  coachName: string;
  totalHours: number;
  totalCost: number | null;
  currency: string;
  status: TimesheetStatus;
  approvedAt: string;
  approvedBy: {
    id: string;
    name: string;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ApproveTimesheetSchema = z.object({
  approvalNotes: z.string().max(1000).optional(),
  adjustedHours: z.object({
    trainingHours: z.number().min(0).max(100).optional(),
    matchHours: z.number().min(0).max(100).optional(),
    adminHours: z.number().min(0).max(100).optional(),
    travelHours: z.number().min(0).max(100).optional(),
    meetingHours: z.number().min(0).max(100).optional(),
    otherHours: z.number().min(0).max(100).optional(),
  }).optional(),
  adjustedRate: z.number().min(0).max(1000).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `ts_approve_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
// POST HANDLER - Approve Timesheet
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
        error: 'You do not have permission to approve timesheets',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Get approver info
    const approver = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!approver) {
      return createResponse(null, {
        success: false,
        error: 'Approver not found',
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

    // 5. Validate status - must be SUBMITTED to approve
    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      return createResponse(null, {
        success: false,
        error: `Cannot approve timesheet with status ${timesheet.status}. Only SUBMITTED timesheets can be approved.`,
        code: 'INVALID_STATUS',
        requestId,
        status: 400,
      });
    }

    // 6. Parse and validate body (optional adjustments)
    let body = {};
    try {
      const rawBody = await request.text();
      if (rawBody) {
        body = JSON.parse(rawBody);
      }
    } catch {
      // No body or invalid JSON - that's okay for simple approval
    }

    const validation = ApproveTimesheetSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { approvalNotes, adjustedHours, adjustedRate } = validation.data;

    // 7. Calculate adjusted values if provided
    const updateData: Record<string, unknown> = {
      status: TimesheetStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: session.user.id,
      approvalNotes: approvalNotes || null,
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    };

    // Apply hour adjustments if provided
    if (adjustedHours) {
      if (adjustedHours.trainingHours !== undefined) updateData.trainingHours = adjustedHours.trainingHours;
      if (adjustedHours.matchHours !== undefined) updateData.matchHours = adjustedHours.matchHours;
      if (adjustedHours.adminHours !== undefined) updateData.adminHours = adjustedHours.adminHours;
      if (adjustedHours.travelHours !== undefined) updateData.travelHours = adjustedHours.travelHours;
      if (adjustedHours.meetingHours !== undefined) updateData.meetingHours = adjustedHours.meetingHours;
      if (adjustedHours.otherHours !== undefined) updateData.otherHours = adjustedHours.otherHours;

      // Recalculate total hours
      const newTotalHours = (
        (adjustedHours.trainingHours ?? timesheet.trainingHours) +
        (adjustedHours.matchHours ?? timesheet.matchHours) +
        (adjustedHours.adminHours ?? timesheet.adminHours) +
        (adjustedHours.travelHours ?? timesheet.travelHours) +
        (adjustedHours.meetingHours ?? timesheet.meetingHours) +
        (adjustedHours.otherHours ?? timesheet.otherHours)
      );
      updateData.totalHours = newTotalHours;
    }

    // Apply rate adjustment if provided
    if (adjustedRate !== undefined) {
      updateData.hourlyRate = adjustedRate;
    }

    // Recalculate total cost
    const finalHourlyRate = (adjustedRate ?? timesheet.hourlyRate) || 0;
    const finalTotalHours = (updateData.totalHours as number) ?? timesheet.totalHours;
    updateData.totalCost = finalHourlyRate * finalTotalHours;
    updateData.hourlyCost = finalHourlyRate;

    // 8. Update timesheet
    const updatedTimesheet = await prisma.coachTimesheet.update({
      where: { id: timesheetId },
      data: updateData,
    });

    // 9. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPENSE_APPROVED', // Using existing audit action
        resourceType: 'COACH_TIMESHEET',
        resourceId: timesheetId,
        beforeState: {
          status: timesheet.status,
          totalHours: timesheet.totalHours,
          totalCost: timesheet.totalCost,
        },
        afterState: {
          status: TimesheetStatus.APPROVED,
          totalHours: updateData.totalHours ?? timesheet.totalHours,
          totalCost: updateData.totalCost,
          approvedBy: session.user.id,
        },
      },
    });

    // 10. Build response
    const result: ApprovalResult = {
      timesheetId: updatedTimesheet.id,
      period: updatedTimesheet.period,
      coachName: `${timesheet.coach.user.firstName} ${timesheet.coach.user.lastName}`,
      totalHours: updatedTimesheet.totalHours,
      totalCost: updatedTimesheet.totalCost,
      currency: updatedTimesheet.currency,
      status: updatedTimesheet.status,
      approvedAt: updatedTimesheet.approvedAt!.toISOString(),
      approvedBy: {
        id: approver.id,
        name: `${approver.firstName} ${approver.lastName}`,
      },
    };

    return createResponse(result, {
      success: true,
      message: 'Timesheet approved successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Approve Timesheet error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to approve timesheet',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}