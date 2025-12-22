/**
 * Coach Timesheets API Route (GET)
 * ============================================================================
 * Fetches all timesheets for a coach with filtering and pagination.
 * GET: Retrieve timesheets with optional filtering by period/status
 * Production-ready with comprehensive error handling.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface GetTimesheetsResponse {
  success: boolean;
  data: Array<{
    id: string;
    period: string;
    startDate: string;
    endDate: string;
    trainingHours: number;
    matchHours: number;
    adminHours: number;
    otherHours: number;
    totalHours: number;
    hourlyRate: number;
    totalAmount: number;
    status: string;
    submittedAt: string | null;
    reviewedAt: string | null;
    approvedAt: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// GET HANDLER - FETCH TIMESHEETS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ========================================================================

    const session = await auth();

    if (!session) {
      return Response.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    // Get user and verify they have a coach profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        coachProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.coachProfile) {
      return NextResponse.json(
        { error: 'User is not a coach' },
        { status: 403 }
      );
    }

    // ========================================================================
    // 2. PARSE QUERY PARAMETERS
    // ========================================================================

    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const status = searchParams.get('status') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('order') || 'desc').toLowerCase() as 'asc' | 'desc';

    const skip = (page - 1) * limit;

    // ========================================================================
    // 3. BUILD QUERY FILTER
    // ========================================================================

    const where: any = {
      coachId: user.coachProfile.id,
    };

    // Optional status filter
    if (status && ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID'].includes(status)) {
      where.status = status;
    }

    // ========================================================================
    // 4. FETCH TIMESHEETS WITH PAGINATION
    // ========================================================================

    const [timesheets, total] = await Promise.all([
      prisma.coachTimesheet.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.coachTimesheet.count({ where }),
    ]);

    // ========================================================================
    // 5. FORMAT RESPONSE
    // ========================================================================

    const response: GetTimesheetsResponse = {
      success: true,
      data: timesheets.map(ts => ({
        id: ts.id,
        period: ts.period,
        startDate: ts.startDate.toISOString(),
        endDate: ts.endDate.toISOString(),
        trainingHours: ts.trainingHours,
        matchHours: ts.matchHours,
        adminHours: ts.adminHours,
        otherHours: ts.otherHours,
        totalHours: ts.totalHours,
        hourlyRate: ts.hourlyRate,
        totalAmount: ts.totalAmount,
        status: ts.status,
        submittedAt: ts.submittedAt?.toISOString() || null,
        reviewedAt: ts.reviewedAt?.toISOString() || null,
        approvedAt: ts.approvedAt?.toISOString() || null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('🚨 Get timesheets error:', error);

    // Log structured error for monitoring
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch timesheets',
        message: process.env.NODE_ENV === 'development'
          ? error instanceof Error ? error.message : 'Unknown error'
          : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HTTP OPTIONS (for CORS preflight)
// ============================================================================

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
