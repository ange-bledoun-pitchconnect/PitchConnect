// ============================================================================
// 🔌 MATCHES API ROUTES v7.4.0
// ============================================================================
// /api/matches - CRUD operations for matches
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { LIVE_STATUSES } from '@/types/match';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createMatchSchema = z.object({
  competitionId: z.string().nullable().optional(),
  matchType: z.enum([
    'LEAGUE', 'CUP', 'FRIENDLY', 'PLAYOFF', 'TOURNAMENT', 'QUALIFIER',
    'FINAL', 'SEMI_FINAL', 'QUARTER_FINAL', 'GROUP_STAGE',
    'TRAINING_MATCH', 'PRACTICE', 'EXHIBITION',
  ]).default('FRIENDLY'),
  
  homeTeamId: z.string().min(1, 'Home team is required'),
  awayTeamId: z.string().min(1, 'Away team is required'),
  homeClubId: z.string().min(1),
  awayClubId: z.string().min(1),
  
  kickOffTime: z.string().min(1, 'Kick-off time is required'),
  
  venueId: z.string().nullable().optional(),
  facilityId: z.string().nullable().optional(),
  venue: z.string().optional(),
  pitch: z.string().optional(),
  isNeutralVenue: z.boolean().default(false),
  
  stage: z.enum([
    'GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL',
    'SEMI_FINAL', 'THIRD_PLACE', 'FINAL', 'PRELIMINARY',
    'FIRST_ROUND', 'SECOND_ROUND', 'PLAYOFF_ROUND',
  ]).nullable().optional(),
  groupName: z.string().optional(),
  round: z.number().nullable().optional(),
  matchday: z.number().nullable().optional(),
  leg: z.number().nullable().optional(),
  
  title: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  
  homeFormation: z.string().nullable().optional(),
  awayFormation: z.string().nullable().optional(),
  
  isBroadcasted: z.boolean().default(false),
  broadcastUrl: z.string().optional(),
  isHighlighted: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  
  createdById: z.string().min(1),
  createdByCoachId: z.string().nullable().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  matchType: z.string().optional(),
  teamId: z.string().optional(),
  clubId: z.string().optional(),
  competitionId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

// ============================================================================
// GET /api/matches - List matches
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Get user's club memberships
    const memberships = await prisma.clubMember.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
      select: { clubId: true },
    });

    const clubIds = memberships.map((m) => m.clubId);

    // Build where clause
    const where: Record<string, unknown> = {
      deletedAt: null,
      OR: [
        { homeClubId: { in: clubIds } },
        { awayClubId: { in: clubIds } },
      ],
    };

    // Apply filters
    if (params.status) {
      if (params.status === 'live') {
        where.status = { in: LIVE_STATUSES };
      } else if (params.status === 'upcoming') {
        where.status = 'SCHEDULED';
        where.kickOffTime = { gte: new Date() };
      } else if (params.status === 'finished') {
        where.status = 'FINISHED';
      } else {
        where.status = params.status;
      }
    }

    if (params.matchType) {
      where.matchType = params.matchType;
    }

    if (params.teamId) {
      where.OR = [
        { homeTeamId: params.teamId },
        { awayTeamId: params.teamId },
      ];
    }

    if (params.clubId) {
      where.OR = [
        { homeClubId: params.clubId },
        { awayClubId: params.clubId },
      ];
    }

    if (params.competitionId) {
      where.competitionId = params.competitionId;
    }

    if (params.dateFrom) {
      where.kickOffTime = { ...((where.kickOffTime as object) || {}), gte: new Date(params.dateFrom) };
    }

    if (params.dateTo) {
      where.kickOffTime = { ...((where.kickOffTime as object) || {}), lte: new Date(params.dateTo) };
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { venue: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Fetch matches
    const skip = (params.page - 1) * params.pageSize;

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          homeTeam: { select: { id: true, name: true, logo: true } },
          awayTeam: { select: { id: true, name: true, logo: true } },
          homeClub: { select: { id: true, name: true, shortName: true, logo: true, sport: true } },
          awayClub: { select: { id: true, name: true, shortName: true, logo: true, sport: true } },
          competition: { select: { id: true, name: true, shortName: true, logo: true } },
        },
        orderBy: [{ status: 'asc' }, { kickOffTime: 'desc' }],
        skip,
        take: params.pageSize,
      }),
      prisma.match.count({ where }),
    ]);

    return NextResponse.json({
      matches,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/matches error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/matches - Create match
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createMatchSchema.parse(body);

    // Validate teams are different
    if (data.homeTeamId === data.awayTeamId) {
      return NextResponse.json(
        { error: 'Home and away teams must be different' },
        { status: 400 }
      );
    }

    // Check user has permission to create match for these clubs
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: { in: [data.homeClubId, data.awayClubId] },
        isActive: true,
        deletedAt: null,
        OR: [
          { role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] } },
          { canManageMatches: true },
          { canCreateFriendlyMatches: data.matchType === 'FRIENDLY' ? true : undefined },
        ],
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have permission to create matches for these clubs' },
        { status: 403 }
      );
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        ...data,
        kickOffTime: new Date(data.kickOffTime),
        status: 'SCHEDULED',
        resultApprovalStatus: 'PENDING',
        createdById: session.user.id,
      },
      include: {
        homeTeam: { select: { id: true, name: true, logo: true } },
        awayTeam: { select: { id: true, name: true, logo: true } },
        homeClub: { select: { id: true, name: true, shortName: true, logo: true, sport: true } },
        awayClub: { select: { id: true, name: true, shortName: true, logo: true, sport: true } },
        competition: { select: { id: true, name: true, shortName: true, logo: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Match',
        entityId: match.id,
        changes: { created: data },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    console.error('POST /api/matches error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}
