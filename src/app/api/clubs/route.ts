// ============================================================================
// 🏢 CLUBS API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET  /api/clubs - List all clubs with filtering
// POST /api/clubs - Create a new club
// ============================================================================
// Schema: v7.7.0 | Multi-Sport: All 12 Sports | RBAC: Full
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Sport, TeamType, Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface ClubListItem {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  description: string | null;
  logo: string | null;
  sport: Sport;
  teamType: TeamType;
  city: string | null;
  country: string | null;
  isPublic: boolean;
  isVerified: boolean;
  acceptingPlayers: boolean;
  acceptingStaff: boolean;
  followerCount: number;
  teamCount: number;
  memberCount: number;
  manager: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  createdAt: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SPORTS = [
  'FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL',
  'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL'
] as const;

const TEAM_TYPES = [
  'PROFESSIONAL', 'SEMI_PROFESSIONAL', 'AMATEUR', 'ACADEMY',
  'YOUTH', 'RECREATIONAL', 'UNIVERSITY', 'SCHOOL'
] as const;

const createClubSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters').max(100),
  shortName: z.string().max(20).optional(),
  description: z.string().max(2000).optional(),
  sport: z.enum(SPORTS),
  teamType: z.enum(TEAM_TYPES).default('AMATEUR'),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).default('United Kingdom'),
  address: z.string().max(500).optional(),
  postcode: z.string().max(20).optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  logo: z.string().url().optional().or(z.literal('')),
  banner: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  venue: z.string().max(200).optional(),
  venueCapacity: z.number().positive().optional(),
  isPublic: z.boolean().default(true),
  acceptingPlayers: z.boolean().default(true),
  acceptingStaff: z.boolean().default(true),
  organisationId: z.string().cuid().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sport: z.enum(SPORTS).optional(),
  teamType: z.enum(TEAM_TYPES).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isPublic: z.string().transform(v => v === 'true').optional(),
  acceptingPlayers: z.string().transform(v => v === 'true').optional(),
  sortBy: z.enum(['name', 'createdAt', 'followerCount', 'joinedMembers']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `clubs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + Date.now().toString(36);
}

// ============================================================================
// GET /api/clubs - List Clubs with Filtering & Pagination
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
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

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: queryResult.error.flatten() },
          requestId 
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const {
      page, limit, search, sport, teamType, city, country,
      isPublic, acceptingPlayers, sortBy, sortOrder
    } = queryResult.data;

    // 3. Build where clause
    const where: Prisma.ClubWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sport) where.sport = sport;
    if (teamType) where.teamType = teamType;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (isPublic !== undefined) where.isPublic = isPublic;
    if (acceptingPlayers !== undefined) where.acceptingPlayers = acceptingPlayers;

    // 4. Execute query with counts
    const skip = (page - 1) * limit;

    const [clubs, totalCount] = await Promise.all([
      prisma.club.findMany({
        where,
        include: {
          manager: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          _count: {
            select: {
              teams: true,
              members: { where: { isActive: true, deletedAt: null } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.club.count({ where }),
    ]);

    // 5. Format response
    const formattedClubs: ClubListItem[] = clubs.map(club => ({
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      slug: club.slug,
      description: club.description,
      logo: club.logo,
      sport: club.sport,
      teamType: club.teamType,
      city: club.city,
      country: club.country,
      isPublic: club.isPublic,
      isVerified: club.isVerified,
      acceptingPlayers: club.acceptingPlayers,
      acceptingStaff: club.acceptingStaff,
      followerCount: club.followerCount,
      teamCount: club._count.teams,
      memberCount: club._count.members,
      manager: club.manager ? {
        id: club.manager.id,
        name: `${club.manager.firstName} ${club.manager.lastName}`.trim(),
        avatar: club.manager.avatar,
      } : null,
      createdAt: club.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: formattedClubs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, { 
      status: 200, 
      headers: { 'X-Request-ID': requestId } 
    });

  } catch (error) {
    console.error('[CLUBS_LIST_ERROR]', { requestId, error });
    
    return NextResponse.json(
      {
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch clubs',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// POST /api/clubs - Create New Club
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
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

    // 2. Authorization - Check roles
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true, isSuperAdmin: true, email: true, firstName: true, lastName: true },
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

    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'LEAGUE_ADMIN'];
    const hasPermission = user.isSuperAdmin || user.roles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'FORBIDDEN', message: 'You do not have permission to create clubs' },
          requestId 
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Parse and validate body
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

    const validation = createClubSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input', 
            details: validation.error.flatten() 
          },
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;

    // 4. Check for duplicate name in same country
    const existingClub = await prisma.club.findFirst({
      where: {
        name: { equals: input.name, mode: 'insensitive' },
        country: input.country,
        deletedAt: null,
      },
    });

    if (existingClub) {
      return NextResponse.json(
        {
          success: false,
          error: { 
            code: 'CONFLICT', 
            message: `A club named "${input.name}" already exists in ${input.country}` 
          },
          requestId,
        },
        { status: 409, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 5. Generate unique slug
    const slug = generateSlug(input.name);

    // 6. Create club with owner membership in transaction
    const club = await prisma.$transaction(async (tx) => {
      // Create the club
      const newClub = await tx.club.create({
        data: {
          name: input.name,
          shortName: input.shortName,
          slug,
          description: input.description,
          sport: input.sport as Sport,
          teamType: input.teamType as TeamType,
          city: input.city,
          state: input.state,
          country: input.country,
          address: input.address,
          postcode: input.postcode,
          foundedYear: input.foundedYear,
          website: input.website || null,
          email: input.email || null,
          phone: input.phone,
          logo: input.logo || null,
          banner: input.banner || null,
          primaryColor: input.primaryColor,
          secondaryColor: input.secondaryColor,
          venue: input.venue,
          venueCapacity: input.venueCapacity,
          isPublic: input.isPublic,
          acceptingPlayers: input.acceptingPlayers,
          acceptingStaff: input.acceptingStaff,
          organisationId: input.organisationId,
          managerId: user.id,
          ownerId: user.id,
          status: 'ACTIVE',
        },
        include: {
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
        },
      });

      // Create owner membership
      await tx.clubMember.create({
        data: {
          userId: user.id,
          clubId: newClub.id,
          role: 'OWNER',
          isActive: true,
          joinedAt: new Date(),
          canManageRoster: true,
          canManageMatches: true,
          canManageBilling: true,
          canManageMedia: true,
          canCreateFriendlyMatches: true,
          canManageLineups: true,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CLUB_CREATED',
          resourceType: 'Club',
          resourceId: newClub.id,
          afterState: {
            id: newClub.id,
            name: newClub.name,
            sport: newClub.sport,
            country: newClub.country,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });

      return newClub;
    });

    console.log('[CLUB_CREATED]', { requestId, clubId: club.id, clubName: club.name, userId: user.id });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: club.id,
          name: club.name,
          shortName: club.shortName,
          slug: club.slug,
          sport: club.sport,
          teamType: club.teamType,
          city: club.city,
          country: club.country,
          isPublic: club.isPublic,
          manager: club.manager ? {
            id: club.manager.id,
            name: `${club.manager.firstName} ${club.manager.lastName}`.trim(),
            email: club.manager.email,
            avatar: club.manager.avatar,
          } : null,
          createdAt: club.createdAt.toISOString(),
        },
        message: 'Club created successfully',
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      },
      { status: 201, headers: { 'X-Request-ID': requestId } }
    );

  } catch (error) {
    console.error('[CLUBS_CREATE_ERROR]', { requestId, error });
    
    return NextResponse.json(
      {
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to create club',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
