// =============================================================================
// 🏢 CLUBS API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/manager/clubs
// POST /api/manager/clubs
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Authenticated users (create), Club members (view)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, Sport, TeamType } from '@prisma/client';

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

interface ClubItem {
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
  primaryColor: string | null;
  secondaryColor: string | null;
  isVerified: boolean;
  status: string;
  
  // Stats
  teamCount: number;
  memberCount: number;
  
  // User's role in this club
  userRole: ClubMemberRole | 'OWNER';
  isOwner: boolean;
  
  createdAt: string;
}

interface ClubsListResponse {
  clubs: ClubItem[];
  summary: {
    totalOwned: number;
    totalMember: number;
    totalTeams: number;
    totalMembers: number;
  };
  sports: Sport[];
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateClubSchema = z.object({
  name: z.string().min(2).max(100),
  shortName: z.string().max(20).optional(),
  description: z.string().max(2000).optional(),
  sport: z.nativeEnum(Sport), // REQUIRED - must specify sport
  teamType: z.nativeEnum(TeamType).default(TeamType.AMATEUR),
  
  // Location
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).default('United Kingdom'),
  address: z.string().max(200).optional(),
  postcode: z.string().max(20).optional(),
  
  // Venue
  venue: z.string().max(200).optional(),
  venueCapacity: z.number().int().min(0).optional(),
  
  // Branding
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[A-Fa-f0-9]{6}$/).default('#FFD700'),
  secondaryColor: z.string().regex(/^#[A-Fa-f0-9]{6}$/).default('#FF6B35'),
  
  // Contact
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  
  // Social
  twitter: z.string().max(100).optional(),
  facebook: z.string().max(100).optional(),
  instagram: z.string().max(100).optional(),
  youtube: z.string().max(100).optional(),
  
  // Settings
  isPublic: z.boolean().default(true),
  acceptingPlayers: z.boolean().default(true),
  acceptingStaff: z.boolean().default(true),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `club_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  let slug = generateSlug(baseName);
  let counter = 0;

  while (true) {
    const testSlug = counter === 0 ? slug : `${slug}-${counter}`;
    const existing = await prisma.club.findUnique({
      where: { slug: testSlug },
      select: { id: true },
    });

    if (!existing) {
      return testSlug;
    }

    counter++;
    if (counter > 100) {
      // Fallback to random suffix
      return `${slug}-${Date.now()}`;
    }
  }
}

// =============================================================================
// GET HANDLER - List User's Clubs
// =============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const requestId = generateRequestId();

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

    const userId = session.user.id;

    // 2. Fetch owned clubs
    const ownedClubs = await prisma.club.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            teams: { where: { deletedAt: null } },
            members: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch clubs where user is a member (but not owner)
    const memberClubs = await prisma.clubMember.findMany({
      where: {
        userId,
        isActive: true,
        club: {
          deletedAt: null,
          ownerId: { not: userId },
        },
      },
      include: {
        club: {
          include: {
            _count: {
              select: {
                teams: { where: { deletedAt: null } },
                members: { where: { isActive: true } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // 4. Transform owned clubs
    const ownedClubItems: ClubItem[] = ownedClubs.map((club) => ({
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
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
      isVerified: club.isVerified,
      status: club.status,
      teamCount: club._count.teams,
      memberCount: club._count.members,
      userRole: 'OWNER' as const,
      isOwner: true,
      createdAt: club.createdAt.toISOString(),
    }));

    // 5. Transform member clubs
    const memberClubItems: ClubItem[] = memberClubs.map((membership) => ({
      id: membership.club.id,
      name: membership.club.name,
      shortName: membership.club.shortName,
      slug: membership.club.slug,
      description: membership.club.description,
      logo: membership.club.logo,
      sport: membership.club.sport,
      teamType: membership.club.teamType,
      city: membership.club.city,
      country: membership.club.country,
      primaryColor: membership.club.primaryColor,
      secondaryColor: membership.club.secondaryColor,
      isVerified: membership.club.isVerified,
      status: membership.club.status,
      teamCount: membership.club._count.teams,
      memberCount: membership.club._count.members,
      userRole: membership.role,
      isOwner: false,
      createdAt: membership.club.createdAt.toISOString(),
    }));

    // 6. Combine and calculate summary
    const allClubs = [...ownedClubItems, ...memberClubItems];
    const totalTeams = allClubs.reduce((sum, c) => sum + c.teamCount, 0);
    const totalMembers = allClubs.reduce((sum, c) => sum + c.memberCount, 0);

    // Get unique sports
    const sports = [...new Set(allClubs.map((c) => c.sport))];

    const response: ClubsListResponse = {
      clubs: allClubs,
      summary: {
        totalOwned: ownedClubItems.length,
        totalMember: memberClubItems.length,
        totalTeams,
        totalMembers,
      },
      sports,
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] List Clubs error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch clubs',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Club
// =============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  const requestId = generateRequestId();

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

    const userId = session.user.id;

    // 2. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
        requestId,
        status: 400,
      });
    }

    const validation = CreateClubSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 3. Generate unique slug
    const slug = await generateUniqueSlug(data.name);

    // 4. Create club with owner membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create club
      const club = await tx.club.create({
        data: {
          name: data.name,
          shortName: data.shortName || null,
          slug,
          description: data.description || null,
          sport: data.sport,
          teamType: data.teamType,
          
          // Location
          city: data.city || null,
          state: data.state || null,
          country: data.country,
          address: data.address || null,
          postcode: data.postcode || null,
          
          // Venue
          venue: data.venue || null,
          venueCapacity: data.venueCapacity || null,
          
          // Branding
          logo: data.logo || null,
          banner: data.banner || null,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          
          // Contact
          email: data.email || null,
          phone: data.phone || null,
          website: data.website || null,
          
          // Social
          twitter: data.twitter || null,
          facebook: data.facebook || null,
          instagram: data.instagram || null,
          youtube: data.youtube || null,
          
          // Settings
          isPublic: data.isPublic,
          acceptingPlayers: data.acceptingPlayers,
          acceptingStaff: data.acceptingStaff,
          foundedYear: data.foundedYear || null,
          
          // Ownership
          managerId: userId,
          ownerId: userId,
          status: 'ACTIVE',
        },
      });

      // Create owner as club member with OWNER role
      const membership = await tx.clubMember.create({
        data: {
          clubId: club.id,
          userId,
          role: ClubMemberRole.OWNER,
          isActive: true,
          joinedAt: new Date(),
        },
      });

      return { club, membership };
    });

    // 5. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CLUB_CREATED',
        resourceType: 'CLUB',
        resourceId: result.club.id,
        afterState: {
          name: result.club.name,
          sport: result.club.sport,
          slug: result.club.slug,
        },
      },
    });

    // 6. Return response
    return createResponse({
      club: {
        id: result.club.id,
        name: result.club.name,
        shortName: result.club.shortName,
        slug: result.club.slug,
        description: result.club.description,
        logo: result.club.logo,
        sport: result.club.sport,
        teamType: result.club.teamType,
        city: result.club.city,
        country: result.club.country,
        primaryColor: result.club.primaryColor,
        secondaryColor: result.club.secondaryColor,
        isVerified: result.club.isVerified,
        status: result.club.status,
        teamCount: 0,
        memberCount: 1,
        userRole: 'OWNER' as const,
        isOwner: true,
        createdAt: result.club.createdAt.toISOString(),
      },
      membership: {
        id: result.membership.id,
        role: result.membership.role,
      },
    }, {
      success: true,
      message: 'Club created successfully',
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Create Club error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create club',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}