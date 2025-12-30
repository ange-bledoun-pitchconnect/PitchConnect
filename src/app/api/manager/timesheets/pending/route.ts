// =============================================================================
// 📋 PENDING TIMESHEETS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/manager/clubs/[clubId]/timesheets/pending
// =============================================================================
// Schema: v7.8.0 | Model: CoachTimesheet
// Field Mapping: weekStartDate, weekEndDate, totalCost (NOT startDate/endDate/totalAmount)
// Permission: Owner, Manager, Treasurer
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
  };
}

interface TimesheetItem {
  id: string;
  period: string;
  weekStartDate: string;
  weekEndDate: string;
  
  // Hours breakdown
  trainingHours: number;
  matchHours: number;
  adminHours: number;
  travelHours: number;
  meetingHours: number;
  otherHours: number;
  totalHours: number;
  
  // Cost
  hourlyRate: number | null;
  totalCost: number | null;
  currency: string;
  
  // Coach info
  coach: {
    id: string;
    name: string;
    avatar: string | null;
    email: string;
    coachType: string;
  };
  
  // Team info (optional)
  team: {
    id: string;
    name: string;
  } | null;
  
  // Submission details
  status: TimesheetStatus;
  submittedAt: string | null;
  submittedNotes: string | null;
  description: string | null;
  
  // Age of submission
  daysWaiting: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface PendingTimesheetsResponse {
  timesheets: TimesheetItem[];
  summary: {
    total: number;
    totalHours: number;
    totalCost: number;
    avgWaitDays: number;
    highPriority: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `ts_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

  // Check if user is club owner
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { ownerId: true },
  });

  if (club?.ownerId === userId) return true;

  // Check club membership
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

function calculateDaysWaiting(submittedAt: Date | null): number {
  if (!submittedAt) return 0;
  const now = new Date();
  const diff = now.getTime() - submittedAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getPriority(daysWaiting: number, totalCost: number | null): 'HIGH' | 'MEDIUM' | 'LOW' {
  // High priority: waiting > 7 days OR high value (> £500)
  if (daysWaiting > 7) return 'HIGH';
  if (totalCost && totalCost > 500) return 'HIGH';
  
  // Medium priority: waiting 3-7 days OR medium value (£200-500)
  if (daysWaiting >= 3) return 'MEDIUM';
  if (totalCost && totalCost > 200) return 'MEDIUM';
  
  return 'LOW';
}

// =============================================================================
// GET HANDLER - List Pending Timesheets
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId } = params;

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
        error: 'You do not have permission to view pending timesheets',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true },
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

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const coachId = searchParams.get('coachId');
    const teamId = searchParams.get('teamId');
    const skip = (page - 1) * limit;

    // 5. Build where clause - filter for SUBMITTED status (pending approval)
    const where: Record<string, unknown> = {
      clubId,
      status: TimesheetStatus.SUBMITTED, // Only timesheets awaiting approval
    };

    if (coachId) where.coachId = coachId;
    if (teamId) where.teamId = teamId;

    // 6. Fetch pending timesheets
    const [timesheets, total] = await Promise.all([
      prisma.coachTimesheet.findMany({
        where,
        include: {
          coach: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { submittedAt: 'asc' }, // Oldest first (FIFO)
        ],
        skip,
        take: limit,
      }),
      prisma.coachTimesheet.count({ where }),
    ]);

    // 7. Transform timesheets
    const timesheetItems: TimesheetItem[] = timesheets.map((ts) => {
      const daysWaiting = calculateDaysWaiting(ts.submittedAt);
      const priority = getPriority(daysWaiting, ts.totalCost);

      return {
        id: ts.id,
        period: ts.period,
        weekStartDate: ts.weekStartDate.toISOString(),
        weekEndDate: ts.weekEndDate.toISOString(),
        
        trainingHours: ts.trainingHours,
        matchHours: ts.matchHours,
        adminHours: ts.adminHours,
        travelHours: ts.travelHours,
        meetingHours: ts.meetingHours,
        otherHours: ts.otherHours,
        totalHours: ts.totalHours,
        
        hourlyRate: ts.hourlyRate,
        totalCost: ts.totalCost,
        currency: ts.currency,
        
        coach: {
          id: ts.coachId,
          name: `${ts.coach.user.firstName} ${ts.coach.user.lastName}`,
          avatar: ts.coach.user.avatar,
          email: ts.coach.user.email,
          coachType: ts.coach.coachType,
        },
        
        team: ts.team ? {
          id: ts.team.id,
          name: ts.team.name,
        } : null,
        
        status: ts.status,
        submittedAt: ts.submittedAt?.toISOString() || null,
        submittedNotes: ts.submittedNotes,
        description: ts.description,
        
        daysWaiting,
        priority,
      };
    });

    // 8. Calculate summary stats
    const totalHours = timesheetItems.reduce((sum, ts) => sum + ts.totalHours, 0);
    const totalCost = timesheetItems.reduce((sum, ts) => sum + (ts.totalCost || 0), 0);
    const avgWaitDays = timesheetItems.length > 0
      ? Math.round(timesheetItems.reduce((sum, ts) => sum + ts.daysWaiting, 0) / timesheetItems.length)
      : 0;
    const highPriority = timesheetItems.filter((ts) => ts.priority === 'HIGH').length;

    // 9. Build response
    const response: PendingTimesheetsResponse = {
      timesheets: timesheetItems,
      summary: {
        total,
        totalHours: Math.round(totalHours * 10) / 10,
        totalCost: Math.round(totalCost * 100) / 100,
        avgWaitDays,
        highPriority,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] List Pending Timesheets error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch pending timesheets',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}