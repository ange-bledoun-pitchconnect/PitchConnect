// ============================================================================
// 📋 COACH TIMESHEETS LIST API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET /api/coach/timesheets - List timesheets with filtering & pagination
// ============================================================================
// Schema: v7.7.0+ | Multi-Sport | RBAC | Audit Logging
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { TimesheetStatus, Prisma } from '@prisma/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TimesheetListItem {
  id: string;
  period: string | null;
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
  
  // Financial
  hourlyRate: number | null;
  totalCost: number | null;
  currency: string;
  
  // Status & workflow
  status: TimesheetStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  rejectionReason: string | null;
  
  // Context
  club: {
    id: string;
    name: string;
  } | null;
  team: {
    id: string;
    name: string;
  } | null;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

interface TimesheetSummary {
  totalTimesheets: number;
  byStatus: Record<TimesheetStatus, number>;
  thisMonth: {
    totalHours: number;
    totalAmount: number;
    timesheetCount: number;
  };
  thisYear: {
    totalHours: number;
    totalAmount: number;
    timesheetCount: number;
  };
  pendingApproval: number;
  pendingPayment: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `ts-list-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// GET /api/coach/timesheets - List timesheets
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. GET COACH PROFILE
    // ========================================================================

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { coach: true },
    });

    if (!user?.coach) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Coach profile not found' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    const coach = user.coach;

    // ========================================================================
    // 3. PARSE QUERY PARAMETERS
    // ========================================================================

    const searchParams = new URL(request.url).searchParams;
    
    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    
    // Filters
    const status = searchParams.get('status') as TimesheetStatus | null;
    const clubId = searchParams.get('clubId');
    const teamId = searchParams.get('teamId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'weekStartDate';
    const sortOrder = (searchParams.get('order') || 'desc').toLowerCase() as 'asc' | 'desc';
    
    // Include summary stats?
    const includeSummary = searchParams.get('includeSummary') === 'true';

    // ========================================================================
    // 4. BUILD QUERY FILTER
    // ========================================================================

    const where: Prisma.CoachTimesheetWhereInput = {
      coachId: coach.id,
    };

    // Status filter
    if (status && ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'DISPUTED', 'ARCHIVED'].includes(status)) {
      where.status = status;
    }

    // Club filter
    if (clubId) {
      where.clubId = clubId;
    }

    // Team filter
    if (teamId) {
      where.teamId = teamId;
    }

    // Date range filter
    if (dateFrom) {
      where.weekStartDate = { ...where.weekStartDate as any, gte: new Date(dateFrom) };
    }
    if (dateTo) {
      where.weekEndDate = { ...where.weekEndDate as any, lte: new Date(dateTo) };
    }

    // Year/Month filter
    if (year) {
      const yearNum = parseInt(year, 10);
      const startOfYear = new Date(yearNum, 0, 1);
      const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59);
      
      where.weekStartDate = { ...where.weekStartDate as any, gte: startOfYear };
      where.weekEndDate = { ...where.weekEndDate as any, lte: endOfYear };
      
      if (month) {
        const monthNum = parseInt(month, 10) - 1; // 0-indexed
        const startOfMonth = new Date(yearNum, monthNum, 1);
        const endOfMonth = new Date(yearNum, monthNum + 1, 0, 23, 59, 59);
        
        where.weekStartDate = { gte: startOfMonth };
        where.weekEndDate = { lte: endOfMonth };
      }
    }

    // ========================================================================
    // 5. BUILD SORT ORDER
    // ========================================================================

    const validSortFields = ['weekStartDate', 'weekEndDate', 'totalHours', 'totalCost', 'status', 'createdAt', 'submittedAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'weekStartDate';
    
    const orderBy: Prisma.CoachTimesheetOrderByWithRelationInput = {
      [orderByField]: sortOrder,
    };

    // ========================================================================
    // 6. FETCH TIMESHEETS
    // ========================================================================

    const [timesheets, total] = await Promise.all([
      prisma.coachTimesheet.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          club: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
        },
      }),
      prisma.coachTimesheet.count({ where }),
    ]);

    // ========================================================================
    // 7. CALCULATE SUMMARY (if requested)
    // ========================================================================

    let summary: TimesheetSummary | undefined;

    if (includeSummary) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

      const allTimesheets = await prisma.coachTimesheet.findMany({
        where: { coachId: coach.id },
        select: {
          status: true,
          totalHours: true,
          totalCost: true,
          weekStartDate: true,
        },
      });

      // Count by status
      const byStatus: Record<string, number> = {
        DRAFT: 0,
        SUBMITTED: 0,
        UNDER_REVIEW: 0,
        APPROVED: 0,
        REJECTED: 0,
        PAID: 0,
        DISPUTED: 0,
        ARCHIVED: 0,
      };
      allTimesheets.forEach(ts => {
        byStatus[ts.status] = (byStatus[ts.status] || 0) + 1;
      });

      // This month stats
      const thisMonthTimesheets = allTimesheets.filter(
        ts => ts.weekStartDate >= monthStart && ts.weekStartDate <= monthEnd
      );
      const thisMonth = {
        totalHours: thisMonthTimesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0),
        totalAmount: thisMonthTimesheets.reduce((sum, ts) => sum + (ts.totalCost || 0), 0),
        timesheetCount: thisMonthTimesheets.length,
      };

      // This year stats
      const thisYearTimesheets = allTimesheets.filter(
        ts => ts.weekStartDate >= yearStart && ts.weekStartDate <= yearEnd
      );
      const thisYear = {
        totalHours: thisYearTimesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0),
        totalAmount: thisYearTimesheets.reduce((sum, ts) => sum + (ts.totalCost || 0), 0),
        timesheetCount: thisYearTimesheets.length,
      };

      summary = {
        totalTimesheets: allTimesheets.length,
        byStatus: byStatus as Record<TimesheetStatus, number>,
        thisMonth,
        thisYear,
        pendingApproval: byStatus.SUBMITTED + byStatus.UNDER_REVIEW,
        pendingPayment: byStatus.APPROVED,
      };
    }

    // ========================================================================
    // 8. FORMAT RESPONSE
    // ========================================================================

    const formattedTimesheets: TimesheetListItem[] = timesheets.map(ts => {
      // Extract hours from breakdown if available
      const breakdown = ts.breakdown as any || {};
      
      return {
        id: ts.id,
        period: null, // Will be added in v7.7.1
        weekStartDate: ts.weekStartDate.toISOString(),
        weekEndDate: ts.weekEndDate.toISOString(),
        
        // Hours breakdown
        trainingHours: breakdown.trainingHours || 0,
        matchHours: breakdown.matchHours || 0,
        adminHours: breakdown.adminHours || 0,
        travelHours: breakdown.travelHours || 0,
        meetingHours: breakdown.meetingHours || 0,
        otherHours: breakdown.otherHours || 0,
        totalHours: ts.totalHours,
        
        // Financial
        hourlyRate: ts.hourlyRate,
        totalCost: ts.totalCost,
        currency: ts.currency || 'GBP',
        
        // Status & workflow
        status: ts.status,
        submittedAt: ts.submittedAt?.toISOString() || null,
        reviewedAt: null, // Will be added in v7.7.1
        approvedAt: ts.approvedAt?.toISOString() || null,
        rejectedAt: null, // Will be added in v7.7.1
        paidAt: ts.paidAt?.toISOString() || null,
        rejectionReason: ts.rejectionReason,
        
        // Context
        club: ts.club ? { id: ts.club.id, name: ts.club.name } : null,
        team: ts.team ? { id: ts.team.id, name: ts.team.name } : null,
        
        // Audit
        createdAt: ts.createdAt.toISOString(),
        updatedAt: ts.updatedAt.toISOString(),
      };
    });

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };

    console.log('[TIMESHEETS_LIST]', { 
      requestId, 
      coachId: coach.id,
      total,
      page,
      filters: { status, clubId, teamId, dateFrom, dateTo },
    });

    return NextResponse.json({
      success: true,
      data: formattedTimesheets,
      pagination,
      summary,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, { status: 200, headers: { 'X-Request-ID': requestId } });

  } catch (error) {
    console.error('[TIMESHEETS_LIST_ERROR]', { requestId, error });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch timesheets',
          details: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : String(error))
            : undefined,
        },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// HTTP OPTIONS (for CORS preflight)
// ============================================================================

export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
