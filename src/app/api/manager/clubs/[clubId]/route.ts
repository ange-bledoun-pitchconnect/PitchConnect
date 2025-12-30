// =============================================================================
// 🏢 INDIVIDUAL CLUB API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/manager/clubs/[clubId]
// PATCH  /api/manager/clubs/[clubId]
// DELETE /api/manager/clubs/[clubId]
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club members (view), Owner/Manager (edit/delete)
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

interface RouteParams {
  params: {
    clubId: string;
  };
}

interface ClubDetail {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  sport: Sport;
  teamType: TeamType;
  foundedYear: number | null;
  
  // Location
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  postcode: string | null;
  venue: string | null;
  venueCapacity: number | null;
  
  // Contact
  email: string | null;
  phone: string | null;
  website: string | null;
  
  // Social
  twitter: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  
  // Branding
  primaryColor: string | null;
  secondaryColor: string | null;
  
  // Settings
  isVerified: boolean;
  isPublic: boolean;
  acceptingPlayers: boolean;
  acceptingStaff: boolean;
  status: string;
  
  // Stats
  teamCount: number;
  memberCount: number;
  followerCount: number;
  
  // Ownership
  owner: { id: string; name: string; avatar: string | null } | null;
  manager: { id: string; name: string; avatar: string | null };
  
  // User context
  userRole: ClubMemberRole | 'OWNER' | null;
  canEdit: boolean;
  canDelete: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateClubSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  shortName: z.string().max(20).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  teamType: z.nativeEnum(TeamType).optional(),
  
  // Location
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  postcode: z.string().max(20).nullable().optional(),
  venue: z.string().max(200).nullable().optional(),
  venueCapacity: z.number().int().min(0).nullable().optional(),
  
  // Branding
  logo: z.string().url().nullable().optional(),
  banner: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[A-Fa-f0-9]{6}$/).nullable().optional(),
  secondaryColor: z.string().regex(/^#[A-Fa-f0-9]{6}$/).nullable().optional(),
  
  // Contact
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  website: z.string().url().nullable().optional(),
  
  // Social
  twitter: z.string().max(100).nullable().optional(),
  facebook: z.string().max(100).nullable().optional(),
  instagram: z.string().max(100).nullable().optional(),
  youtube: z.string().max(100).nullable().optional(),
  tiktok: z.string().max(100).nullable().optional(),
  
  // Settings
  isPublic: z.boolean().optional(),
  acceptingPlayers: z.boolean().optional(),
  acceptingStaff: z.boolean().optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).nullable().optional(),
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

const MANAGE_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
];

const VIEW_ROLES: ClubMemberRole[] = [
  ...MANAGE_ROLES,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
  ClubMemberRole.STAFF,
  ClubMemberRole.PLAYER,
  ClubMemberRole.TREASURER,
];

async function getPermissions(
  userId: string,
  clubId: string
): Promise<{ canView: boolean; canEdit: boolean; canDelete: boolean; role: ClubMemberRole | 'OWNER' | null; isOwner: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    return { canView: true, canEdit: true, canDelete: true, role: 'OWNER', isOwner: true };
  }

  // Check if user is the club owner
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { ownerId: true },
  });

  if (club?.ownerId === userId) {
    return { canView: true, canEdit: true, canDelete: true, role: 'OWNER', isOwner: true };
  }

  // Check club membership
  const clubMember = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
    },
    select: { role: true },
  });

  if (!clubMember) {
    return { canView: false, canEdit: false, canDelete: false, role: null, isOwner: false };
  }

  return {
    canView: VIEW_ROLES.includes(clubMember.role),
    canEdit: MANAGE_ROLES.includes(clubMember.role),
    canDelete: clubMember.role === ClubMemberRole.OWNER,
    role: clubMember.role,
    isOwner: false,
  };
}

// =============================================================================
// GET HANDLER - Fetch Club Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId } = params;

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

    // 2. Authorization
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canView) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view this club',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Fetch club with full details
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            teams: { where: { deletedAt: null } },
            members: { where: { isActive: true } },
          },
        },
      },
    });

    if (!club || club.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Club not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Build response
    const response: ClubDetail = {
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      slug: club.slug,
      description: club.description,
      logo: club.logo,
      banner: club.banner,
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
      
      email: club.email,
      phone: club.phone,
      website: club.website,
      
      twitter: club.twitter,
      facebook: club.facebook,
      instagram: club.instagram,
      youtube: club.youtube,
      tiktok: club.tiktok,
      
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
      
      isVerified: club.isVerified,
      isPublic: club.isPublic,
      acceptingPlayers: club.acceptingPlayers,
      acceptingStaff: club.acceptingStaff,
      status: club.status,
      
      teamCount: club._count.teams,
      memberCount: club._count.members,
      followerCount: club.followerCount,
      
      owner: club.owner ? {
        id: club.owner.id,
        name: `${club.owner.firstName} ${club.owner.lastName}`,
        avatar: club.owner.avatar,
      } : null,
      manager: {
        id: club.manager.id,
        name: `${club.manager.firstName} ${club.manager.lastName}`,
        avatar: club.manager.avatar,
      },
      
      userRole: permissions.role,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
      
      createdAt: club.createdAt.toISOString(),
      updatedAt: club.updatedAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Club error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch club',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Club
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId } = params;

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

    // 2. Authorization
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canEdit) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to edit this club',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify club exists
    const existingClub = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, status: true, deletedAt: true },
    });

    if (!existingClub || existingClub.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Club not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Parse and validate body
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

    const validation = UpdateClubSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const updates = validation.data;

    // 5. Build update data
    const updateData: Record<string, unknown> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // 6. Update club
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        sport: true,
        status: true,
        updatedAt: true,
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CLUB_UPDATED',
        resourceType: 'CLUB',
        resourceId: clubId,
        beforeState: { name: existingClub.name },
        afterState: updateData,
        changes: Object.keys(updates),
      },
    });

    return createResponse({
      id: updatedClub.id,
      name: updatedClub.name,
      slug: updatedClub.slug,
      sport: updatedClub.sport,
      status: updatedClub.status,
      updated: true,
      changes: Object.keys(updates),
    }, {
      success: true,
      message: 'Club updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Update Club error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update club',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Delete Club
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId } = params;

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

    // 2. Authorization - only owner can delete
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canDelete) {
      return createResponse(null, {
        success: false,
        error: 'Only the club owner can delete this club',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Fetch club with counts
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
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
      return createResponse(null, {
        success: false,
        error: 'Club not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Check for active teams
    if (club._count.teams > 0) {
      return createResponse(null, {
        success: false,
        error: `Cannot delete club with ${club._count.teams} active team(s). Delete or archive all teams first.`,
        code: 'CLUB_HAS_TEAMS',
        requestId,
        status: 400,
      });
    }

    // 5. Soft delete club
    await prisma.club.update({
      where: { id: clubId },
      data: {
        deletedAt: new Date(),
        deletedBy: session.user.id,
        status: 'DELETED',
      },
    });

    // 6. Deactivate all memberships
    await prisma.clubMember.updateMany({
      where: { clubId },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CLUB_DELETED',
        resourceType: 'CLUB',
        resourceId: clubId,
        beforeState: { name: club.name },
        afterState: { deletedAt: new Date() },
      },
    });

    return createResponse(null, {
      success: true,
      message: 'Club deleted successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Delete Club error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete club',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}