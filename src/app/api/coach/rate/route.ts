// ============================================================================
// 💰 COACH RATE API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET  /api/coach/rate - Get coach's current rates
// POST /api/coach/rate - Create/Update rate (with schema v7.7.1 CoachRate)
// ============================================================================
// Schema: v7.7.0+ | Multi-Sport | RBAC | Audit Logging
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Sport } from '@prisma/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CoachRateResponse {
  coachId: string;
  defaultRate: {
    hourlyRate: number | null;
    dailyRate: number | null;
    currency: string;
  };
  activityRates: {
    training: number | null;
    match: number | null;
    travel: number | null;
    admin: number | null;
  };
  sportSpecificRates?: Array<{
    sport: Sport;
    hourlyRate: number;
    currency: string;
  }>;
  clubRates?: Array<{
    clubId: string;
    clubName: string;
    hourlyRate: number;
    currency: string;
    effectiveFrom: string;
  }>;
  contractInfo?: {
    contractType: string | null;
    isOpenToOpportunities: boolean;
    expectedSalary: number | null;
    expectedSalaryCurrency: string;
    noticePeriod: string | null;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SPORTS = [
  'FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL',
  'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES', 
  'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL'
] as const;

const CURRENCIES = ['GBP', 'USD', 'EUR', 'AUD', 'CAD', 'NZD', 'ZAR', 'INR'] as const;

const updateRateSchema = z.object({
  hourlyRate: z.number().min(0).max(10000).optional(),
  dailyRate: z.number().min(0).max(50000).optional(),
  currency: z.enum(CURRENCIES).optional(),
  trainingRate: z.number().min(0).max(10000).optional(),
  matchRate: z.number().min(0).max(10000).optional(),
  travelRate: z.number().min(0).max(10000).optional(),
  adminRate: z.number().min(0).max(10000).optional(),
  // For club-specific rate
  clubId: z.string().cuid().optional(),
  sport: z.enum(SPORTS).optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional().nullable(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `coach-rate-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// GET /api/coach/rate
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
        { 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          requestId 
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. GET USER WITH COACH PROFILE
    // ========================================================================

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        coach: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'User not found' },
          requestId 
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (!user.coach) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'FORBIDDEN', message: 'Coach profile not found' },
          requestId 
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    const coach = user.coach;

    // ========================================================================
    // 3. GET CLUB-SPECIFIC RATES (if CoachRate model exists)
    // ========================================================================

    let clubRates: Array<{
      clubId: string;
      clubName: string;
      hourlyRate: number;
      currency: string;
      effectiveFrom: string;
    }> = [];

    // Try to fetch from CoachRate model (if it exists in schema v7.7.1+)
    try {
      const coachRates = await (prisma as any).coachRate?.findMany({
        where: { 
          coachId: coach.id, 
          isActive: true,
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } },
          ],
        },
        include: {
          club: { select: { id: true, name: true } },
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (coachRates) {
        clubRates = coachRates.map((rate: any) => ({
          clubId: rate.clubId,
          clubName: rate.club?.name || 'Unknown',
          hourlyRate: rate.amount,
          currency: rate.currency,
          effectiveFrom: rate.effectiveFrom.toISOString(),
        }));
      }
    } catch {
      // CoachRate model doesn't exist yet - that's OK
    }

    // ========================================================================
    // 4. GET RATES FROM CLUB MEMBERSHIPS (Fallback/Override)
    // ========================================================================

    const clubMemberships = await prisma.clubMember.findMany({
      where: {
        coachId: coach.id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        club: { select: { id: true, name: true } },
      },
    });

    // Add club membership salary info if available
    for (const membership of clubMemberships) {
      if (membership.salary && !clubRates.find(r => r.clubId === membership.clubId)) {
        clubRates.push({
          clubId: membership.clubId,
          clubName: membership.club.name,
          hourlyRate: membership.salary,
          currency: membership.currency || 'GBP',
          effectiveFrom: membership.joinedAt.toISOString(),
        });
      }
    }

    // ========================================================================
    // 5. BUILD RESPONSE
    // ========================================================================

    const response: CoachRateResponse = {
      coachId: coach.id,
      defaultRate: {
        hourlyRate: coach.hourlyRate,
        dailyRate: coach.dailyRate,
        currency: coach.currency || 'GBP',
      },
      activityRates: {
        training: coach.hourlyRate, // Default to hourly rate
        match: coach.hourlyRate ? coach.hourlyRate * 1.5 : null, // 1.5x for matches (suggested)
        travel: coach.hourlyRate ? coach.hourlyRate * 0.5 : null, // 0.5x for travel (suggested)
        admin: coach.hourlyRate, // Same as hourly for admin
      },
      clubRates: clubRates.length > 0 ? clubRates : undefined,
      contractInfo: {
        contractType: coach.contractType,
        isOpenToOpportunities: coach.isOpenToOpportunities,
        expectedSalary: coach.expectedSalary,
        expectedSalaryCurrency: coach.expectedSalaryCurrency || 'GBP',
        noticePeriod: coach.noticePeriod,
      },
    };

    console.log('[COACH_RATE_GET]', { requestId, coachId: coach.id });

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });

  } catch (error) {
    console.error('[COACH_RATE_GET_ERROR]', { requestId, error });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch coach rate',
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
// POST /api/coach/rate - Update coach rate
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
        { 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          requestId 
        },
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
        { 
          success: false, 
          error: { code: 'FORBIDDEN', message: 'Coach profile not found' },
          requestId 
        },
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
        { 
          success: false, 
          error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' },
          requestId 
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validation = updateRateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input',
            details: validation.error.flatten(),
          },
          requestId 
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;

    // ========================================================================
    // 4. UPDATE COACH PROFILE RATES
    // ========================================================================

    const updateData: any = {};

    if (input.hourlyRate !== undefined) updateData.hourlyRate = input.hourlyRate;
    if (input.dailyRate !== undefined) updateData.dailyRate = input.dailyRate;
    if (input.currency !== undefined) updateData.currency = input.currency;

    const updatedCoach = await prisma.coach.update({
      where: { id: coach.id },
      data: updateData,
    });

    // ========================================================================
    // 5. CREATE CLUB-SPECIFIC RATE (if clubId provided and model exists)
    // ========================================================================

    if (input.clubId) {
      try {
        // Verify coach has access to this club
        const membership = await prisma.clubMember.findUnique({
          where: { userId_clubId: { userId: user.id, clubId: input.clubId } },
        });

        if (!membership) {
          return NextResponse.json(
            { 
              success: false, 
              error: { code: 'FORBIDDEN', message: 'You are not a member of this club' },
              requestId 
            },
            { status: 403, headers: { 'X-Request-ID': requestId } }
          );
        }

        // Try to create/update in CoachRate model (v7.7.1+)
        await (prisma as any).coachRate?.upsert({
          where: {
            coachId_clubId_effectiveFrom: {
              coachId: coach.id,
              clubId: input.clubId,
              effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
            },
          },
          create: {
            coachId: coach.id,
            clubId: input.clubId,
            rateType: 'HOURLY',
            amount: input.hourlyRate || coach.hourlyRate || 0,
            currency: input.currency || coach.currency || 'GBP',
            sport: input.sport as any,
            trainingRate: input.trainingRate,
            matchRate: input.matchRate,
            travelRate: input.travelRate,
            adminRate: input.adminRate,
            effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
            effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
            isActive: true,
          },
          update: {
            amount: input.hourlyRate,
            currency: input.currency,
            sport: input.sport as any,
            trainingRate: input.trainingRate,
            matchRate: input.matchRate,
            travelRate: input.travelRate,
            adminRate: input.adminRate,
            effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
          },
        });
      } catch {
        // CoachRate model doesn't exist - update club membership instead
        await prisma.clubMember.update({
          where: { userId_clubId: { userId: user.id, clubId: input.clubId } },
          data: {
            salary: input.hourlyRate,
            currency: input.currency || 'GBP',
          },
        });
      }
    }

    // ========================================================================
    // 6. AUDIT LOG
    // ========================================================================

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_UPDATED',
        resourceType: 'Coach',
        resourceId: coach.id,
        beforeState: { hourlyRate: coach.hourlyRate, dailyRate: coach.dailyRate },
        afterState: updateData,
        changes: Object.keys(updateData),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        requestId,
      },
    });

    console.log('[COACH_RATE_UPDATED]', { 
      requestId, 
      coachId: coach.id,
      changes: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      data: {
        coachId: coach.id,
        hourlyRate: updatedCoach.hourlyRate,
        dailyRate: updatedCoach.dailyRate,
        currency: updatedCoach.currency,
      },
      message: 'Coach rate updated successfully',
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });

  } catch (error) {
    console.error('[COACH_RATE_UPDATE_ERROR]', { requestId, error });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update coach rate',
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
