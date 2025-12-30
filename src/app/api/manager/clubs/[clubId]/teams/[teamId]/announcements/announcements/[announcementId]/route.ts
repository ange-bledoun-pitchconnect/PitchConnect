// =============================================================================
// 📢 INDIVIDUAL ANNOUNCEMENT API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/manager/clubs/[clubId]/teams/[teamId]/announcements/[announcementId]
// PATCH  /api/manager/clubs/[clubId]/teams/[teamId]/announcements/[announcementId]
// DELETE /api/manager/clubs/[clubId]/teams/[teamId]/announcements/[announcementId]
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ Generic (applies to all)
// Permission: Club Owner, Manager, Head Coach (full access)
//             Others (read only)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, AnnouncementPriority } from '@prisma/client';

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
    teamId: string;
    announcementId: string;
  };
}

interface AnnouncementDetail {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  publishAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  team: {
    id: string;
    name: string;
  };
  readCount: number;
  isRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  priority: z.nativeEnum(AnnouncementPriority).optional(),
  isPinned: z.boolean().optional(),
  publishAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `announce_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const WRITE_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

const READ_ROLES = [
  ...WRITE_ROLES,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
  ClubMemberRole.PLAYER,
];

async function getPermissions(
  userId: string,
  clubId: string,
  authorId?: string
): Promise<{ canRead: boolean; canWrite: boolean; canDelete: boolean; role: string | null }> {
  // Check super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  
  if (user?.isSuperAdmin) {
    return { canRead: true, canWrite: true, canDelete: true, role: 'SUPER_ADMIN' };
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
    return { canRead: false, canWrite: false, canDelete: false, role: null };
  }

  const hasWriteRole = WRITE_ROLES.includes(clubMember.role);
  const isAuthor = authorId === userId;

  return {
    canRead: READ_ROLES.includes(clubMember.role),
    canWrite: hasWriteRole || isAuthor, // Author can always edit their own
    canDelete: hasWriteRole || isAuthor, // Author can always delete their own
    role: clubMember.role,
  };
}

// =============================================================================
// GET HANDLER - Fetch Single Announcement
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, announcementId } = params;

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

    // 2. Fetch announcement first (need author for permission check)
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            clubId: true,
          },
        },
        _count: {
          select: { reads: true },
        },
      },
    });

    if (!announcement) {
      return createResponse(null, {
        success: false,
        error: 'Announcement not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // Verify team association
    if (announcement.teamId !== teamId || announcement.team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Announcement not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 3. Authorization
    const permissions = await getPermissions(session.user.id, clubId, announcement.authorId);
    if (!permissions.canRead) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view this announcement',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 4. Check if unpublished
    if (announcement.publishAt && announcement.publishAt > new Date() && !permissions.canWrite) {
      return createResponse(null, {
        success: false,
        error: 'This announcement is not yet published',
        code: 'NOT_PUBLISHED',
        requestId,
        status: 403,
      });
    }

    // 5. Check if user has read this announcement
    const readRecord = await prisma.announcementRead.findUnique({
      where: {
        announcementId_userId: {
          announcementId,
          userId: session.user.id,
        },
      },
    });

    // 6. Mark as read if not already
    if (!readRecord) {
      await prisma.announcementRead.create({
        data: {
          announcementId,
          userId: session.user.id,
        },
      });
    }

    // 7. Transform response
    const response: AnnouncementDetail = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      isPinned: announcement.isPinned,
      publishAt: announcement.publishAt?.toISOString() || null,
      expiresAt: announcement.expiresAt?.toISOString() || null,
      createdAt: announcement.createdAt.toISOString(),
      updatedAt: announcement.updatedAt.toISOString(),
      author: {
        id: announcement.author.id,
        name: `${announcement.author.firstName} ${announcement.author.lastName}`,
        avatar: announcement.author.avatar,
      },
      team: {
        id: announcement.team.id,
        name: announcement.team.name,
      },
      readCount: announcement._count.reads + (readRecord ? 0 : 1), // Include current read
      isRead: true, // We just marked it read
      canEdit: permissions.canWrite,
      canDelete: permissions.canDelete,
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Announcement error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch announcement',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Announcement
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, announcementId } = params;

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

    // 2. Fetch announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        team: {
          select: { clubId: true },
        },
      },
    });

    if (!announcement) {
      return createResponse(null, {
        success: false,
        error: 'Announcement not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    if (announcement.teamId !== teamId || announcement.team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Announcement not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 3. Authorization
    const permissions = await getPermissions(session.user.id, clubId, announcement.authorId);
    if (!permissions.canWrite) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to edit this announcement',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
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

    const validation = UpdateAnnouncementSchema.safeParse(body);
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

    // 5. Validate dates if both provided
    const newPublishAt = updates.publishAt !== undefined ? updates.publishAt : announcement.publishAt?.toISOString();
    const newExpiresAt = updates.expiresAt !== undefined ? updates.expiresAt : announcement.expiresAt?.toISOString();

    if (newPublishAt && newExpiresAt && new Date(newPublishAt) >= new Date(newExpiresAt)) {
      return createResponse(null, {
        success: false,
        error: 'Publish date must be before expiry date',
        code: 'INVALID_DATES',
        requestId,
        status: 400,
      });
    }

    // 6. Build update data
    const updateData: Record<string, unknown> = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.isPinned !== undefined) updateData.isPinned = updates.isPinned;
    if (updates.publishAt !== undefined) {
      updateData.publishAt = updates.publishAt ? new Date(updates.publishAt) : null;
    }
    if (updates.expiresAt !== undefined) {
      updateData.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
    }

    // 7. Update announcement
    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { reads: true },
        },
      },
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'ANNOUNCEMENT',
        entityId: announcementId,
        description: `Updated announcement: ${updated.title}`,
        metadata: {
          changes: Object.keys(updateData),
          teamId,
          clubId,
        },
      },
    });

    // 9. Transform response
    const response: AnnouncementDetail = {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      priority: updated.priority,
      isPinned: updated.isPinned,
      publishAt: updated.publishAt?.toISOString() || null,
      expiresAt: updated.expiresAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      author: {
        id: updated.author.id,
        name: `${updated.author.firstName} ${updated.author.lastName}`,
        avatar: updated.author.avatar,
      },
      team: {
        id: updated.team.id,
        name: updated.team.name,
      },
      readCount: updated._count.reads,
      isRead: true,
      canEdit: true,
      canDelete: true,
    };

    return createResponse(response, {
      success: true,
      message: 'Announcement updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Update Announcement error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update announcement',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Delete Announcement
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, announcementId } = params;

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

    // 2. Fetch announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        team: {
          select: { clubId: true },
        },
      },
    });

    if (!announcement) {
      return createResponse(null, {
        success: false,
        error: 'Announcement not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    if (announcement.teamId !== teamId || announcement.team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Announcement not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 3. Authorization
    const permissions = await getPermissions(session.user.id, clubId, announcement.authorId);
    if (!permissions.canDelete) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to delete this announcement',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 4. Delete announcement and related records (cascade should handle reads)
    await prisma.$transaction([
      // Delete read records first
      prisma.announcementRead.deleteMany({
        where: { announcementId },
      }),
      // Delete the announcement
      prisma.announcement.delete({
        where: { id: announcementId },
      }),
    ]);

    // 5. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'ANNOUNCEMENT',
        entityId: announcementId,
        description: `Deleted announcement: ${announcement.title}`,
        metadata: {
          teamId,
          clubId,
          title: announcement.title,
        },
      },
    });

    return createResponse(null, {
      success: true,
      message: 'Announcement deleted successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Delete Announcement error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete announcement',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
