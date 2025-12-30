// ============================================================================
// 📝 COACH TIMESHEET CREATE API - PitchConnect Enterprise v2.0.0
// ============================================================================
// POST /api/coach/timesheets/create - Create new timesheet
// GET  /api/coach/timesheets/create - Get timesheet form configuration
// ============================================================================
// Schema: v7.7.0+ | Multi-Sport | RBAC | Audit Logging
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { TimesheetStatus } from '@prisma/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TimesheetBreakdownItem {
  date: string;
  type: 'training' | 'match' | 'admin' | 'travel' | 'meeting' | 'other';
  hours: number;
  description: string;
  teamId?: string;
  matchId?: string;
  sessionId?: string;
}

interface CreateTimesheetResponse {
  success: boolean;
  timesheetId: string;
  message: string;
  timesheet: {
    id: string;
    period: string;
    weekStartDate: string;
    weekEndDate: string;
    totalHours: number;
    totalCost: number;
    currency: string;
    status: TimesheetStatus;
    breakdown: {
      trainingHours: number;
      matchHours: number;
      adminHours: number;
      travelHours: number;
      meetingHours: number;
      otherHours: number;
    };
  };
}

interface TimesheetFormConfig {
  activityTypes: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  statuses: Array<{
    value: TimesheetStatus;
    label: string;
    canEdit: boolean;
  }>;
  rates: {
    hourlyRate: number | null;
    dailyRate: number | null;
    currency: string;
  };
  clubs: Array<{
    id: string;
    name: string;
  }>;
  teams: Array<{
    id: string;
    name: string;
    clubId: string;
  }>;
  recentSessions: Array<{
    id: string;
    name: string;
    date: string;
    teamName: string;
    durationMinutes: number;
  }>;
  recentMatches: Array<{
    id: string;
    date: string;
    teams: string;
    durationMinutes: number;
  }>;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const breakdownItemSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['training', 'match', 'admin', 'travel', 'meeting', 'other']),
  hours: z.number().min(0).max(24),
  description: z.string().max(500),
  teamId: z.string().cuid().optional(),
  matchId: z.string().cuid().optional(),
  sessionId: z.string().cuid().optional(),
});

const createTimesheetSchema = z.object({
  period: z.string().min(1).max(50), // e.g., "2025-01", "Week 1 Jan 2025"
  weekStartDate: z.string().datetime(),
  weekEndDate: z.string().datetime(),
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  
  // Hours breakdown (simple method)
  trainingHours: z.number().min(0).max(100).optional().default(0),
  matchHours: z.number().min(0).max(100).optional().default(0),
  adminHours: z.number().min(0).max(100).optional().default(0),
  travelHours: z.number().min(0).max(100).optional().default(0),
  meetingHours: z.number().min(0).max(100).optional().default(0),
  otherHours: z.number().min(0).max(100).optional().default(0),
  
  // Detailed breakdown (advanced method)
  breakdown: z.array(breakdownItemSchema).optional(),
  
  // Rates
  hourlyRate: z.number().min(0).max(10000).optional(),
  currency: z.enum(['GBP', 'USD', 'EUR', 'AUD', 'CAD', 'NZD']).optional().default('GBP'),
  
  // Notes
  description: z.string().max(2000).optional(),
  attachments: z.array(z.string().url()).max(10).optional(),
  
  // Submit immediately?
  submitImmediately: z.boolean().optional().default(false),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `ts-create-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generatePeriodFromDates(start: Date, end: Date): string {
  const year = start.getFullYear();
  const month = start.getMonth() + 1;
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  if (startDay <= 7) return `${year}-${String(month).padStart(2, '0')}-W1`;
  if (startDay <= 14) return `${year}-${String(month).padStart(2, '0')}-W2`;
  if (startDay <= 21) return `${year}-${String(month).padStart(2, '0')}-W3`;
  return `${year}-${String(month).padStart(2, '0')}-W4`;
}

// ============================================================================
// GET /api/coach/timesheets/create - Get form configuration
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

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

    // Get clubs and teams
    const memberships = await prisma.clubMember.findMany({
      where: {
        userId: user.id,
        isActive: true,
        deletedAt: null,
        role: { in: ['HEAD_COACH', 'ASSISTANT_COACH', 'GOALKEEPER_COACH', 'PERFORMANCE_COACH'] },
      },
      include: {
        club: {
          include: {
            teams: {
              where: { deletedAt: null, status: 'ACTIVE' },
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Get recent training sessions
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentSessions = await prisma.trainingSession.findMany({
      where: {
        coachId: coach.id,
        startTime: { gte: twoWeeksAgo },
        deletedAt: null,
      },
      include: {
        team: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    // Get recent matches
    const clubIds = memberships.map(m => m.clubId);
    const recentMatches = await prisma.match.findMany({
      where: {
        homeClubId: { in: clubIds },
        kickOffTime: { gte: twoWeeksAgo, lte: now },
        deletedAt: null,
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
      orderBy: { kickOffTime: 'desc' },
      take: 10,
    });

    const config: TimesheetFormConfig = {
      activityTypes: [
        { value: 'training', label: 'Training Session', description: 'Coaching training sessions' },
        { value: 'match', label: 'Match Day', description: 'Match day duties and preparation' },
        { value: 'admin', label: 'Admin Work', description: 'Planning, paperwork, reports' },
        { value: 'travel', label: 'Travel', description: 'Travel to/from venues' },
        { value: 'meeting', label: 'Meetings', description: 'Staff meetings, parent meetings, reviews' },
        { value: 'other', label: 'Other', description: 'Other coaching activities' },
      ],
      statuses: [
        { value: 'DRAFT', label: 'Draft', canEdit: true },
        { value: 'SUBMITTED', label: 'Submitted', canEdit: false },
        { value: 'UNDER_REVIEW', label: 'Under Review', canEdit: false },
        { value: 'APPROVED', label: 'Approved', canEdit: false },
        { value: 'REJECTED', label: 'Rejected', canEdit: true },
        { value: 'PAID', label: 'Paid', canEdit: false },
      ],
      rates: {
        hourlyRate: coach.hourlyRate,
        dailyRate: coach.dailyRate,
        currency: coach.currency || 'GBP',
      },
      clubs: memberships.map(m => ({
        id: m.club.id,
        name: m.club.name,
      })),
      teams: memberships.flatMap(m => 
        m.club.teams.map(t => ({
          id: t.id,
          name: t.name,
          clubId: m.club.id,
        }))
      ),
      recentSessions: recentSessions.map(s => ({
        id: s.id,
        name: s.name,
        date: s.startTime.toISOString(),
        teamName: s.team?.name || 'All Teams',
        durationMinutes: Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000),
      })),
      recentMatches: recentMatches.map(m => ({
        id: m.id,
        date: m.kickOffTime.toISOString(),
        teams: `${m.homeTeam?.name || 'TBD'} vs ${m.awayTeam?.name || 'TBD'}`,
        durationMinutes: m.actualDuration || 120,
      })),
    };

    return NextResponse.json({
      success: true,
      data: config,
      meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime },
    }, { status: 200, headers: { 'X-Request-ID': requestId } });

  } catch (error) {
    console.error('[TIMESHEET_CONFIG_ERROR]', { requestId, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load timesheet configuration' }, requestId },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// POST /api/coach/timesheets/create - Create new timesheet
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
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
    // 3. PARSE & VALIDATE BODY
    // ========================================================================

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validation = createTimesheetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten() }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;
    const weekStart = new Date(input.weekStartDate);
    const weekEnd = new Date(input.weekEndDate);

    // Validate date range
    if (weekStart >= weekEnd) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Start date must be before end date' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 4. CHECK FOR DUPLICATE TIMESHEET
    // ========================================================================

    const existingTimesheet = await prisma.coachTimesheet.findFirst({
      where: {
        coachId: coach.id,
        OR: [
          { weekStartDate: weekStart },
          {
            AND: [
              { weekStartDate: { lte: weekEnd } },
              { weekEndDate: { gte: weekStart } },
            ],
          },
        ],
        status: { notIn: ['REJECTED'] },
      },
    });

    if (existingTimesheet) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'CONFLICT', 
            message: `A timesheet already exists for this period (${existingTimesheet.id})`,
          }, 
          requestId 
        },
        { status: 409, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 5. CALCULATE TOTALS
    // ========================================================================

    // Calculate hours from breakdown if provided
    let trainingHours = input.trainingHours;
    let matchHours = input.matchHours;
    let adminHours = input.adminHours;
    let travelHours = input.travelHours;
    let meetingHours = input.meetingHours;
    let otherHours = input.otherHours;

    if (input.breakdown && input.breakdown.length > 0) {
      trainingHours = input.breakdown.filter(i => i.type === 'training').reduce((sum, i) => sum + i.hours, 0);
      matchHours = input.breakdown.filter(i => i.type === 'match').reduce((sum, i) => sum + i.hours, 0);
      adminHours = input.breakdown.filter(i => i.type === 'admin').reduce((sum, i) => sum + i.hours, 0);
      travelHours = input.breakdown.filter(i => i.type === 'travel').reduce((sum, i) => sum + i.hours, 0);
      meetingHours = input.breakdown.filter(i => i.type === 'meeting').reduce((sum, i) => sum + i.hours, 0);
      otherHours = input.breakdown.filter(i => i.type === 'other').reduce((sum, i) => sum + i.hours, 0);
    }

    const totalHours = trainingHours + matchHours + adminHours + travelHours + meetingHours + otherHours;

    if (totalHours <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Total hours must be greater than 0' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const hourlyRate = input.hourlyRate ?? coach.hourlyRate ?? 0;
    const totalCost = totalHours * hourlyRate;
    const currency = input.currency || coach.currency || 'GBP';

    // ========================================================================
    // 6. CREATE TIMESHEET
    // ========================================================================

    const status: TimesheetStatus = input.submitImmediately ? 'SUBMITTED' : 'DRAFT';

    const timesheet = await prisma.coachTimesheet.create({
      data: {
        coachId: coach.id,
        clubId: input.clubId,
        teamId: input.teamId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        totalHours,
        hourlyRate,
        totalCost,
        currency,
        description: input.description,
        attachments: input.attachments || [],
        breakdown: input.breakdown ? { items: input.breakdown } : {
          trainingHours,
          matchHours,
          adminHours,
          travelHours,
          meetingHours,
          otherHours,
        },
        status,
        submittedAt: input.submitImmediately ? new Date() : null,
      },
    });

    // ========================================================================
    // 7. AUDIT LOG
    // ========================================================================

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TRAINING_CREATED',
        resourceType: 'CoachTimesheet',
        resourceId: timesheet.id,
        afterState: {
          period: input.period,
          totalHours,
          totalCost,
          status,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        requestId,
      },
    });

    // ========================================================================
    // 8. SEND NOTIFICATION IF SUBMITTED
    // ========================================================================

    if (input.submitImmediately && input.clubId) {
      // Find club managers to notify
      const clubManagers = await prisma.clubMember.findMany({
        where: {
          clubId: input.clubId,
          role: { in: ['OWNER', 'MANAGER', 'TREASURER'] },
          isActive: true,
        },
        select: { userId: true },
      });

      // Create notifications (fire and forget)
      Promise.all(
        clubManagers.map(manager =>
          prisma.notification.create({
            data: {
              userId: manager.userId,
              title: 'Timesheet Submitted',
              message: `${user.firstName} ${user.lastName} has submitted a timesheet for review (${totalHours} hours)`,
              type: 'TIMESHEET_SUBMITTED',
              link: `/dashboard/timesheets/${timesheet.id}`,
              metadata: { timesheetId: timesheet.id, coachId: coach.id },
            },
          })
        )
      ).catch(() => { /* Ignore notification errors */ });
    }

    console.log('[TIMESHEET_CREATED]', { 
      requestId, 
      timesheetId: timesheet.id, 
      coachId: coach.id,
      totalHours,
      status,
    });

    // ========================================================================
    // 9. RETURN RESPONSE
    // ========================================================================

    const response: CreateTimesheetResponse = {
      success: true,
      timesheetId: timesheet.id,
      message: input.submitImmediately 
        ? 'Timesheet created and submitted for approval'
        : 'Timesheet created as draft',
      timesheet: {
        id: timesheet.id,
        period: input.period,
        weekStartDate: timesheet.weekStartDate.toISOString(),
        weekEndDate: timesheet.weekEndDate.toISOString(),
        totalHours: timesheet.totalHours,
        totalCost: timesheet.totalCost || 0,
        currency: timesheet.currency || 'GBP',
        status: timesheet.status,
        breakdown: {
          trainingHours,
          matchHours,
          adminHours,
          travelHours,
          meetingHours,
          otherHours,
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, { status: 201, headers: { 'X-Request-ID': requestId } });

  } catch (error) {
    console.error('[TIMESHEET_CREATE_ERROR]', { requestId, error });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create timesheet',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
