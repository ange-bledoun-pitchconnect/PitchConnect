// ============================================================================
// 🏢 CLUB DETAILS API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET    /api/clubs/[clubId] - Get club details with teams, stats
// PATCH  /api/clubs/[clubId] - Update club information
// DELETE /api/clubs/[clubId] - Soft delete club
// ============================================================================
// Schema: v7.7.0 | Multi-Sport: All 12 Sports | RBAC: Full
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Sport, TeamType, Prisma, ClubMemberRole } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface ClubDetail {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  sport: Sport;
  teamType: TeamType;
  foundedYear: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  postcode: string | null;
  venue: string | null;
  venueCapacity: number | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  isPublic: boolean;
  isVerified: boolean;
  acceptingPlayers: boolean;
  acceptingStaff: boolean;
  followerCount: number;
  status: string;
  manager: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  teams: Array<{
    id: string;
    name: string;
    ageGroup: string | null;
    gender: string | null;
    status: string;
    playerCount: number;
  }>;
  statistics: {
    teamCount: number;
    memberCount: number;
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    winRate: number | null;
    cleanSheets: number;
  };
  userAccess: {
    isMember: boolean;
    role: ClubMemberRole | null;
    canEdit: boolean;
    canDelete: boolean;
    canManageTeams: boolean;
    canManageMembers: boolean;
  };
  socialLinks: {
    twitter: string | null;
    facebook: string | null;
    instagram: string | null;
    youtube: string | null;
    tiktok: string | null;
  };
  createdAt: string;
  updatedAt: string;
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

const updateClubSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  shortName: z.string().max(20).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  sport: z.enum(SPORTS).optional(),
  teamType: z.enum(TEAM_TYPES).optional(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional(),
  address: z.string().max(500).optional().nullable(),
  postcode: z.string().max(20).optional().nullable(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable(),
  logo: z.string().url().optional().nullable().or(z.literal('')),
  banner: z.string().url().optional().nullable().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  venue: z.string().max(200).optional().nullable(),
  venueCapacity: z.number().positive().optional().nullable(),
  isPublic: z.boolean().optional(),
  acceptingPlayers: z.boolean().optional(),
  acceptingStaff: z.boolean().optional(),
  twitter: z.string().max(255).optional().nullable(),
  facebook: z.string().max(255).optional().nullable(),
  instagram: z.string().max(255).optional().nullable(),
  youtube: z.string().max(255).optional().nullable(),
  tiktok: z.string().max(255).optional().nullable(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `club-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

async function checkClubAccess(
  userId: string, 
  clubId: string, 
  ownerId: string | null, 
  managerId: string
): Promise<{ isMember: boolean; role: ClubMemberRole | null; membership: any }> {
  const membership = await prisma.clubMember.findUnique({
    where: {
      userId_clubId: { userId, clubId },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  return {
    isMember: !!membership?.isActive || userId === ownerId || userId === managerId || !!user?.isSuperAdmin,
    role: membership?.role || null,
    membership,
  };
}

// ============================================================================
// GET /api/clubs/[clubId] - Get Club Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId } = params;

    // 2. Fetch club with relationships
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        teams: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: { players: { where: { isActive: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        members: {
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        },
        aggregateStats: true,
      },
    });

    if (!club || club.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Check access
    const access = await checkClubAccess(session.user.id, clubId, club.ownerId, club.managerId);

    // 4. Privacy check for non-members on private clubs
    if (!club.isPublic && !access.isMember) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'This club is private' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 5. Determine user permissions
    const isOwnerOrManager = session.user.id === club.ownerId || session.user.id === club.managerId;
    const user = await prisma.user.findUnique({ 
      where: { id: session.user.id }, 
      select: { isSuperAdmin: true } 
    });
    
    const canEdit = isOwnerOrManager || 
                    !!user?.isSuperAdmin || 
                    access.role === 'OWNER' || 
                    access.role === 'MANAGER';
    const canDelete = session.user.id === club.ownerId || !!user?.isSuperAdmin || access.role === 'OWNER';
    const canManageTeams = canEdit || access.role === 'HEAD_COACH';
    const canManageMembers = canEdit;

    // 6. Format response
    const stats = club.aggregateStats;
    const totalMatches = (stats?.totalMatches || 0);
    
    const response: ClubDetail = {
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      slug: club.slug,
      description: club.description,
      logo: club.logo,
      banner: club.banner,
      website: club.website,
      email: club.email,
      phone: club.phone,
      sport: club.sport,
      teamType: club.teamType,
      foundedYear: club.foundedYear,
      city: club.city,
      state: club.state,
      country: club.country,
      address: club.address,
      postcode: club.postcode,
      venue: club.venue,
      venueCapacity: club.venueCapacity,
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
      isPublic: club.isPublic,
      isVerified: club.isVerified,
      acceptingPlayers: club.acceptingPlayers,
      acceptingStaff: club.acceptingStaff,
      followerCount: club.followerCount,
      status: club.status,
      manager: club.manager ? {
        id: club.manager.id,
        name: `${club.manager.firstName} ${club.manager.lastName}`.trim(),
        email: club.manager.email,
        avatar: club.manager.avatar,
      } : null,
      owner: club.owner ? {
        id: club.owner.id,
        name: `${club.owner.firstName} ${club.owner.lastName}`.trim(),
        email: club.owner.email,
      } : null,
      teams: club.teams.map(team => ({
        id: team.id,
        name: team.name,
        ageGroup: team.ageGroup,
        gender: team.gender,
        status: team.status,
        playerCount: team._count.players,
      })),
      statistics: {
        teamCount: club.teams.length,
        memberCount: club.members.length,
        totalMatches: stats?.totalMatches || 0,
        wins: stats?.totalWins || 0,
        draws: stats?.totalDraws || 0,
        losses: stats?.totalLosses || 0,
        goalsFor: stats?.totalGoalsFor || 0,
        goalsAgainst: stats?.totalGoalsAgainst || 0,
        goalDifference: (stats?.totalGoalsFor || 0) - (stats?.totalGoalsAgainst || 0),
        winRate: totalMatches > 0 ? Math.round(((stats?.totalWins || 0) / totalMatches) * 100) : null,
        cleanSheets: stats?.cleanSheets || 0,
      },
      userAccess: {
        isMember: access.isMember,
        role: access.role,
        canEdit,
        canDelete,
        canManageTeams,
        canManageMembers,
      },
      socialLinks: {
        twitter: club.twitter,
        facebook: club.facebook,
        instagram: club.instagram,
        youtube: club.youtube,
        tiktok: club.tiktok,
      },
      createdAt: club.createdAt.toISOString(),
      updatedAt: club.updatedAt.toISOString(),
    };

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
    console.error('[CLUB_GET_ERROR]', { requestId, error });
    
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch club details' },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// PATCH /api/clubs/[clubId] - Update Club
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId } = params;

    // 2. Get club and verify exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        managerId: true,
        country: true,
        deletedAt: true,
      },
    });

    if (!club || club.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Authorization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    const access = await checkClubAccess(session.user.id, clubId, club.ownerId, club.managerId);
    
    const canEdit = session.user.id === club.ownerId || 
                    session.user.id === club.managerId ||
                    !!user?.isSuperAdmin || 
                    access.role === 'OWNER' || 
                    access.role === 'MANAGER';

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to edit this club' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validation = updateClubSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten() },
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;

    // 5. Check for duplicate name if changing
    if (input.name && input.name !== club.name) {
      const existingClub = await prisma.club.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          country: input.country || club.country,
          id: { not: clubId },
          deletedAt: null,
        },
      });

      if (existingClub) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'CONFLICT', message: `A club named "${input.name}" already exists in this country` },
            requestId,
          },
          { status: 409, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    // 6. Build update data and track changes
    const updateData: Prisma.ClubUpdateInput = {};
    const changes: Record<string, { old: any; new: any }> = {};

    // Only include fields that are present in the request
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        (updateData as any)[key] = value === '' ? null : value;
      }
    });

    // 7. Update club
    const updatedClub = await prisma.$transaction(async (tx) => {
      const updated = await tx.club.update({
        where: { id: clubId },
        data: updateData,
        include: {
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CLUB_UPDATED',
          resourceType: 'Club',
          resourceId: clubId,
          beforeState: { name: club.name },
          afterState: updateData,
          changes: Object.keys(updateData),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });

      return updated;
    });

    console.log('[CLUB_UPDATED]', { requestId, clubId, userId: session.user.id, changes: Object.keys(updateData) });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedClub.id,
        name: updatedClub.name,
        shortName: updatedClub.shortName,
        slug: updatedClub.slug,
        sport: updatedClub.sport,
        updatedAt: updatedClub.updatedAt.toISOString(),
      },
      message: 'Club updated successfully',
      changedFields: Object.keys(updateData),
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
    console.error('[CLUB_UPDATE_ERROR]', { requestId, error });
    
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update club' },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// DELETE /api/clubs/[clubId] - Soft Delete Club
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clubId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId } = params;

    // 2. Get club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        deletedAt: true,
        _count: {
          select: {
            teams: { where: { deletedAt: null } },
            members: { where: { isActive: true } },
          },
        },
      },
    });

    if (!club || club.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Authorization - only owner or super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
    });

    const canDelete = session.user.id === club.ownerId || 
                      !!user?.isSuperAdmin || 
                      membership?.role === 'OWNER';

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the club owner can delete the club' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Check for active teams/members (optional - could cascade)
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (!force && (club._count.teams > 0 || club._count.members > 0)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRECONDITION_FAILED',
            message: 'Club has active teams or members. Use ?force=true to delete anyway.',
            details: {
              activeTeams: club._count.teams,
              activeMembers: club._count.members,
            },
          },
          requestId,
        },
        { status: 412, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 5. Soft delete club and related data
    await prisma.$transaction(async (tx) => {
      // Soft delete club
      await tx.club.update({
        where: { id: clubId },
        data: {
          deletedAt: new Date(),
          deletedBy: session.user.id,
          status: 'DELETED',
        },
      });

      // Soft delete teams
      await tx.team.updateMany({
        where: { clubId, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletedBy: session.user.id,
        },
      });

      // Deactivate memberships
      await tx.clubMember.updateMany({
        where: { clubId, isActive: true },
        data: {
          isActive: false,
          leftAt: new Date(),
          deletedAt: new Date(),
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CLUB_DELETED',
          resourceType: 'Club',
          resourceId: clubId,
          beforeState: { name: club.name, id: club.id },
          afterState: { deletedAt: new Date().toISOString() },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });
    });

    console.log('[CLUB_DELETED]', { requestId, clubId, clubName: club.name, userId: session.user.id });

    return NextResponse.json({
      success: true,
      message: `Club "${club.name}" has been deleted`,
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
    console.error('[CLUB_DELETE_ERROR]', { requestId, error });
    
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete club' },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
