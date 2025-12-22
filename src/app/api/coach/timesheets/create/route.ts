/**
 * Coach Timesheet Creation API Route
 * ============================================================================
 * Creates a new timesheet entry for a coach.
 * Handles timesheet validation, calculation of total hours and amounts.
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

interface CreateTimesheetRequest {
  startDate: string;
  endDate: string;
  trainingHours?: number;
  matchHours?: number;
  adminHours?: number;
  otherHours?: number;
  hourlyRate: number;
  period: string; // e.g., "2025-01", "Week 1"
}

interface CreateTimesheetResponse {
  success: boolean;
  timesheetId: string;
  message: string;
  timesheet?: {
    id: string;
    period: string;
    startDate: string;
    endDate: string;
    totalHours: number;
    totalAmount: number;
    status: string;
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
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
    // 2. PARSE & VALIDATE REQUEST BODY
    // ========================================================================

    const body: CreateTimesheetRequest = await request.json();
    const {
      startDate,
      endDate,
      trainingHours = 0,
      matchHours = 0,
      adminHours = 0,
      otherHours = 0,
      hourlyRate,
      period,
    } = body;

    // Validate required fields
    if (!startDate || !endDate || !hourlyRate || !period) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['startDate', 'endDate', 'hourlyRate', 'period'],
        },
        { status: 400 }
      );
    }

    // Validate hourly rate
    if (hourlyRate <= 0) {
      return NextResponse.json(
        { error: 'Hourly rate must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    // Validate hours
    const allHours = [trainingHours, matchHours, adminHours, otherHours];
    if (allHours.some(h => h < 0)) {
      return NextResponse.json(
        { error: 'Hours cannot be negative' },
        { status: 400 }
      );
    }

    const totalHours = trainingHours + matchHours + adminHours + otherHours;
    if (totalHours <= 0) {
      return NextResponse.json(
        { error: 'Total hours must be greater than 0' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. CHECK FOR EXISTING TIMESHEET IN SAME PERIOD
    // ========================================================================

    const existingTimesheet = await prisma.coachTimesheet.findFirst({
      where: {
        coachId: user.coachProfile.id,
        period: period,
        status: {
          notIn: ['REJECTED'],
        },
      },
    });

    if (existingTimesheet) {
      return NextResponse.json(
        {
          error: `Timesheet already exists for period: ${period}`,
          existingTimesheetId: existingTimesheet.id,
        },
        { status: 409 }
      );
    }

    // ========================================================================
    // 4. CALCULATE TOTALS
    // ========================================================================

    const totalAmount = totalHours * hourlyRate;

    // ========================================================================
    // 5. CREATE TIMESHEET
    // ========================================================================

    const timesheet = await prisma.coachTimesheet.create({
      data: {
        coachId: user.coachProfile.id,
        period: period,
        startDate: start,
        endDate: end,
        trainingHours: trainingHours,
        matchHours: matchHours,
        adminHours: adminHours,
        otherHours: otherHours,
        totalHours: totalHours,
        hourlyRate: hourlyRate,
        totalAmount: totalAmount,
        status: 'DRAFT',
      },
    });

    // ========================================================================
    // 6. RETURN SUCCESS RESPONSE
    // ========================================================================

    const response: CreateTimesheetResponse = {
      success: true,
      timesheetId: timesheet.id,
      message: 'Timesheet created successfully',
      timesheet: {
        id: timesheet.id,
        period: timesheet.period,
        startDate: timesheet.startDate.toISOString(),
        endDate: timesheet.endDate.toISOString(),
        totalHours: timesheet.totalHours,
        totalAmount: timesheet.totalAmount,
        status: timesheet.status,
      },
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('🚨 Create timesheet error:', error);

    // Log structured error for monitoring
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to create timesheet',
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
