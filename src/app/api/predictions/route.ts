/**
 * ============================================================================
 * 🤖 PITCHCONNECT - Predictions API v7.6.0
 * Path: app/api/predictions/route.ts
 * ============================================================================
 *
 * ENDPOINTS:
 * GET    /api/predictions - List predictions with filtering
 * POST   /api/predictions - Create new prediction (AI/Admin only)
 *
 * FEATURES:
 * ✅ Schema v7.6.0 aligned (Prediction, PredictionFeedback models)
 * ✅ Role-based access control (COACH, MANAGER, ANALYST, SCOUT, ADMIN)
 * ✅ Advanced filtering by type, status, impact, sport, entity
 * ✅ Pagination support
 * ✅ Statistics aggregation
 * ✅ Soft delete support
 *
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

const ALLOWED_ROLES = ['COACH', 'MANAGER', 'ANALYST', 'SCOUT', 'ADMIN', 'SUPERADMIN'];

const PredictionTypeEnum = z.enum([
  'PERFORMANCE',
  'FORM_TREND',
  'GOALS_ASSISTS',
  'INJURY_RISK',
  'FATIGUE_LEVEL',
  'RECOVERY_TIME',
  'MARKET_VALUE',
  'TRANSFER_LIKELIHOOD',
  'CONTRACT_VALUE',
  'FORMATION',
  'LINEUP',
  'TACTICAL_MATCHUP',
  'MATCH_OUTCOME',
  'SCORE_PREDICTION',
  'POTENTIAL_RATING',
  'DEVELOPMENT_PATH',
  'TEAM_CHEMISTRY',
  'RECRUITMENT_FIT',
]);

const PredictionStatusEnum = z.enum([
  'PENDING',
  'ACTIVE',
  'VERIFIED_CORRECT',
  'VERIFIED_INCORRECT',
  'PARTIALLY_CORRECT',
  'EXPIRED',
  'INVALIDATED',
]);

const PredictionImpactEnum = z.enum([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFORMATIONAL',
]);

const SportEnum = z.enum([
  'FOOTBALL',
  'NETBALL',
  'RUGBY',
  'CRICKET',
  'AMERICAN_FOOTBALL',
  'BASKETBALL',
  'HOCKEY',
  'LACROSSE',
  'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL',
  'FUTSAL',
  'BEACH_FOOTBALL',
]);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetPredictionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: PredictionTypeEnum.optional(),
  status: PredictionStatusEnum.optional(),
  impact: PredictionImpactEnum.optional(),
  sport: SportEnum.optional(),
  entityType: z.enum(['player', 'team', 'match', 'competition']).optional(),
  entityId: z.string().optional(),
  clubId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'confidence', 'impact', 'validUntil']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const CreatePredictionSchema = z.object({
  type: PredictionTypeEnum,
  impact: PredictionImpactEnum.default('MEDIUM'),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  summary: z.string().max(500).optional(),
  confidence: z.number().min(0).max(100),
  sport: SportEnum.optional(),
  relatedEntityType: z.enum(['player', 'team', 'match', 'competition']).optional(),
  relatedEntityId: z.string().optional(),
  relatedEntityName: z.string().optional(),
  recommendedActions: z.array(z.string()).default([]),
  riskFactors: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  predictionData: z.record(z.any()).optional(),
  predictionPeriod: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  clubId: z.string().optional(),
  organisationId: z.string().optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

function hasAccess(userRoles: string[]): boolean {
  return userRoles.some((role) => ALLOWED_ROLES.includes(role));
}

function canCreate(userRoles: string[]): boolean {
  // Only admins and analysts can create predictions
  return userRoles.some((role) => ['ADMIN', 'SUPERADMIN', 'ANALYST'].includes(role));
}

// ============================================================================
// GET /api/predictions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true, clubId: true },
    });

    if (!user || !hasAccess(user.roles)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = GetPredictionsSchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      type,
      status,
      impact,
      sport,
      entityType,
      entityId,
      clubId,
      search,
      sortBy,
      sortOrder,
    } = validated.data;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    // Filter by user's club if not admin
    if (!user.roles.includes('SUPERADMIN') && !user.roles.includes('ADMIN')) {
      if (clubId) {
        where.clubId = clubId;
      } else if (user.clubId) {
        where.clubId = user.clubId;
      }
    } else if (clubId) {
      where.clubId = clubId;
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (impact) where.impact = impact;
    if (sport) where.sport = sport;
    if (entityType) where.relatedEntityType = entityType;
    if (entityId) where.relatedEntityId = entityId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { relatedEntityName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.prediction.count({ where });

    // Get predictions
    const predictions = await prisma.prediction.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        feedback: {
          select: {
            id: true,
            wasAccurate: true,
            accuracyRating: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Calculate stats
    const stats = await prisma.prediction.groupBy({
      by: ['status', 'impact'],
      where: {
        ...where,
        status: { in: ['ACTIVE', 'VERIFIED_CORRECT', 'VERIFIED_INCORRECT'] },
      },
      _count: true,
      _avg: { confidence: true },
    });

    const aggregatedStats = {
      totalActive: stats.filter((s) => s.status === 'ACTIVE').reduce((acc, s) => acc + s._count, 0),
      highImpact: stats.filter((s) => s.impact === 'HIGH' || s.impact === 'CRITICAL').reduce((acc, s) => acc + s._count, 0),
      avgConfidence: Math.round(
        stats.reduce((acc, s) => acc + (s._avg.confidence || 0), 0) / (stats.length || 1)
      ),
      verifiedCorrect: stats.filter((s) => s.status === 'VERIFIED_CORRECT').reduce((acc, s) => acc + s._count, 0),
      verifiedIncorrect: stats.filter((s) => s.status === 'VERIFIED_INCORRECT').reduce((acc, s) => acc + s._count, 0),
      accuracyRate: 0,
    };

    const totalVerified = aggregatedStats.verifiedCorrect + aggregatedStats.verifiedIncorrect;
    aggregatedStats.accuracyRate = totalVerified > 0
      ? Math.round((aggregatedStats.verifiedCorrect / totalVerified) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        stats: aggregatedStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/predictions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/predictions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true, clubId: true, primaryOrganisationId: true },
    });

    if (!user || !canCreate(user.roles)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create predictions' },
        { status: 403 }
      );
    }

    // Parse body
    const body = await request.json();
    const validated = CreatePredictionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Create prediction
    const prediction = await prisma.prediction.create({
      data: {
        type: data.type,
        status: 'ACTIVE',
        impact: data.impact,
        title: data.title,
        description: data.description,
        summary: data.summary,
        confidence: data.confidence,
        sport: data.sport,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        relatedEntityName: data.relatedEntityName,
        recommendedActions: data.recommendedActions,
        riskFactors: data.riskFactors,
        opportunities: data.opportunities,
        predictionData: data.predictionData,
        predictionPeriod: data.predictionPeriod,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        tags: data.tags,
        clubId: data.clubId || user.clubId,
        organisationId: data.organisationId || user.primaryOrganisationId,
        createdBy: user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PREDICTION_CREATED',
        resourceType: 'prediction',
        resourceId: prediction.id,
        afterState: prediction as any,
      },
    });

    return NextResponse.json({
      success: true,
      data: prediction,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/predictions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
