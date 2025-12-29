// ============================================================================
// 📹 MEDIA ACTIONS - PitchConnect v7.3.0
// ============================================================================
// Server actions for media content management
// Supports VIDEO, IMAGE, DOCUMENT, AUDIO with processing
// ============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  UploadMediaSchema,
  UpdateMediaSchema,
  MediaFiltersSchema,
  PaginationSchema,
  CreateClipSchema,
  CreateShareLinkSchema,
  BatchDeleteSchema,
  BatchUpdateVisibilitySchema,
  type UploadMediaInput,
  type UpdateMediaInput,
  type MediaFilters,
  type PaginationOptions,
  type CreateClipInput,
  type CreateShareLinkInput,
  type BatchDeleteInput,
  type BatchUpdateVisibilityInput,
} from '@/schemas/media.schema';
import type {
  MediaContentWithRelations,
  MediaContentListItem,
  PaginatedMediaResponse,
  UploadMediaResponse,
  MediaAnalytics,
  MediaStorageStats,
  MediaShareLink,
  ApiResponse,
} from '@/types/media.types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has permission to manage media for a club
 */
async function checkMediaPermission(
  userId: string,
  clubId: string,
  action: 'upload' | 'update' | 'delete' | 'view'
): Promise<boolean> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      OR: [
        { role: 'OWNER' },
        { role: 'MANAGER' },
        { role: 'MEDIA_OFFICER' },
        { role: 'VIDEO_ANALYST' },
        ...(action === 'view' || action === 'upload'
          ? [{ role: 'HEAD_COACH' }, { role: 'ASSISTANT_COACH' }]
          : []),
        ...(action === 'view' ? [{ role: 'PLAYER' }, { role: 'STAFF' }] : []),
      ],
    },
  });

  return !!membership;
}

/**
 * Generate unique filename
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').substring(0, 50);
  const sanitized = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${sanitized}_${timestamp}_${random}.${ext}`;
}

/**
 * Build where clause from filters
 */
function buildWhereClause(
  filters: MediaFilters,
  userId: string
): Prisma.MediaContentWhereInput {
  const where: Prisma.MediaContentWhereInput = {
    deletedAt: null,
  };

  // Association filters
  if (filters.clubId) where.clubId = filters.clubId;
  if (filters.teamId) where.teamId = filters.teamId;
  if (filters.matchId) where.matchId = filters.matchId;
  if (filters.trainingId) where.trainingId = filters.trainingId;
  if (filters.organisationId) where.organisationId = filters.organisationId;
  if (filters.uploadedBy) where.uploadedBy = filters.uploadedBy;

  // Type filters
  if (filters.type) {
    where.type = Array.isArray(filters.type)
      ? { in: filters.type }
      : filters.type;
  }

  if (filters.category) {
    where.category = Array.isArray(filters.category)
      ? { in: filters.category }
      : filters.category;
  }

  if (filters.visibility) {
    where.visibility = Array.isArray(filters.visibility)
      ? { in: filters.visibility }
      : filters.visibility;
  }

  if (filters.processingStatus) {
    where.processingStatus = Array.isArray(filters.processingStatus)
      ? { in: filters.processingStatus }
      : filters.processingStatus;
  }

  // Content filters
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { tags: { has: filters.search } },
    ];
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasEvery: filters.tags };
  }

  if (filters.isPublic !== undefined) {
    where.isPublic = filters.isPublic;
  }

  // Date filters
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  // Duration filters (for video/audio)
  if (filters.minDuration || filters.maxDuration) {
    where.duration = {};
    if (filters.minDuration) where.duration.gte = filters.minDuration;
    if (filters.maxDuration) where.duration.lte = filters.maxDuration;
  }

  return where;
}

// ============================================================================
// CREATE MEDIA (After Upload)
// ============================================================================

export async function createMediaRecord(
  input: UploadMediaInput & {
    url: string;
    cdnUrl?: string;
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
    duration?: number;
    thumbnailUrl?: string;
  }
): Promise<ApiResponse<UploadMediaResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Validate input
    const validatedInput = UploadMediaSchema.parse(input);

    // Check permission
    if (validatedInput.clubId) {
      const hasPermission = await checkMediaPermission(
        session.user.id,
        validatedInput.clubId,
        'upload'
      );
      if (!hasPermission) {
        return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to upload media' } };
      }
    }

    // Create media record
    const media = await prisma.mediaContent.create({
      data: {
        organisationId: validatedInput.organisationId,
        clubId: validatedInput.clubId,
        teamId: validatedInput.teamId,
        matchId: validatedInput.matchId,
        trainingId: validatedInput.trainingId,
        uploadedBy: session.user.id,
        type: validatedInput.type,
        category: validatedInput.category,
        title: validatedInput.title,
        description: validatedInput.description,
        tags: validatedInput.tags,
        filename: input.filename,
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        url: input.url,
        cdnUrl: input.cdnUrl,
        width: input.width,
        height: input.height,
        duration: input.duration,
        thumbnailUrl: input.thumbnailUrl,
        visibility: validatedInput.visibility,
        isPublic: validatedInput.isPublic,
        accessRoles: validatedInput.accessRoles || [],
        startTimestamp: validatedInput.startTimestamp,
        endTimestamp: validatedInput.endTimestamp,
        parentMediaId: validatedInput.parentMediaId,
        metadata: validatedInput.metadata as Prisma.JsonValue,
        processingStatus: validatedInput.type === 'VIDEO' ? 'PENDING' : 'COMPLETED',
      },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        club: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        team: {
          select: { id: true, name: true },
        },
        match: {
          select: { id: true, kickOffTime: true, homeScore: true, awayScore: true },
        },
        training: {
          select: { id: true, name: true, startTime: true },
        },
      },
    });

    // Revalidate paths
    if (validatedInput.clubId) {
      revalidatePath(`/dashboard/clubs/${validatedInput.clubId}/media`);
    }
    if (validatedInput.teamId) {
      revalidatePath(`/dashboard/teams/${validatedInput.teamId}/media`);
    }
    if (validatedInput.matchId) {
      revalidatePath(`/dashboard/matches/${validatedInput.matchId}`);
    }

    return {
      success: true,
      data: {
        media: media as unknown as MediaContentWithRelations,
        processingQueued: validatedInput.type === 'VIDEO',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error creating media record:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create media record' },
    };
  }
}

// ============================================================================
// GET MEDIA LIST
// ============================================================================

export async function getMediaList(
  filters?: MediaFilters,
  pagination?: PaginationOptions
): Promise<ApiResponse<PaginatedMediaResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const validatedFilters = MediaFiltersSchema.parse(filters ?? {});
    const validatedPagination = PaginationSchema.parse(pagination ?? {});

    const { page, limit, sortBy, sortOrder } = validatedPagination;
    const skip = (page - 1) * limit;

    const where = buildWhereClause(validatedFilters, session.user.id);

    const orderBy: Prisma.MediaContentOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const total = await prisma.mediaContent.count({ where });

    const media = await prisma.mediaContent.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        category: true,
        title: true,
        thumbnailUrl: true,
        url: true,
        duration: true,
        processingStatus: true,
        visibility: true,
        viewCount: true,
        createdAt: true,
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        data: media as MediaContentListItem[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + media.length < total,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error fetching media list:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch media' },
    };
  }
}

// ============================================================================
// GET SINGLE MEDIA
// ============================================================================

export async function getMedia(
  mediaId: string
): Promise<ApiResponse<MediaContentWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const media = await prisma.mediaContent.findUnique({
      where: { id: mediaId, deletedAt: null },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        club: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        team: {
          select: { id: true, name: true },
        },
        match: {
          select: { id: true, kickOffTime: true, homeScore: true, awayScore: true },
        },
        training: {
          select: { id: true, name: true, startTime: true },
        },
      },
    });

    if (!media) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Media not found' } };
    }

    // Check visibility permissions
    if (media.visibility !== 'PUBLIC' && media.uploadedBy !== session.user.id) {
      if (media.clubId) {
        const hasPermission = await checkMediaPermission(
          session.user.id,
          media.clubId,
          'view'
        );
        if (!hasPermission) {
          return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to view this media' } };
        }
      }
    }

    // Increment view count
    await prisma.mediaContent.update({
      where: { id: mediaId },
      data: { viewCount: { increment: 1 } },
    });

    return {
      success: true,
      data: media as unknown as MediaContentWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error fetching media:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch media' },
    };
  }
}

// ============================================================================
// UPDATE MEDIA
// ============================================================================

export async function updateMedia(
  mediaId: string,
  input: UpdateMediaInput
): Promise<ApiResponse<MediaContentWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const validatedInput = UpdateMediaSchema.parse(input);

    const existingMedia = await prisma.mediaContent.findUnique({
      where: { id: mediaId, deletedAt: null },
      select: { id: true, clubId: true, uploadedBy: true },
    });

    if (!existingMedia) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Media not found' } };
    }

    // Check permission
    const isOwner = existingMedia.uploadedBy === session.user.id;
    if (!isOwner && existingMedia.clubId) {
      const hasPermission = await checkMediaPermission(
        session.user.id,
        existingMedia.clubId,
        'update'
      );
      if (!hasPermission) {
        return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to update this media' } };
      }
    }

    const updatedMedia = await prisma.mediaContent.update({
      where: { id: mediaId },
      data: {
        ...(validatedInput.title && { title: validatedInput.title }),
        ...(validatedInput.description !== undefined && { description: validatedInput.description }),
        ...(validatedInput.category && { category: validatedInput.category }),
        ...(validatedInput.visibility && { visibility: validatedInput.visibility }),
        ...(validatedInput.tags && { tags: validatedInput.tags }),
        ...(validatedInput.accessRoles && { accessRoles: validatedInput.accessRoles }),
        ...(validatedInput.isPublic !== undefined && { isPublic: validatedInput.isPublic }),
        ...(validatedInput.startTimestamp !== undefined && { startTimestamp: validatedInput.startTimestamp }),
        ...(validatedInput.endTimestamp !== undefined && { endTimestamp: validatedInput.endTimestamp }),
        ...(validatedInput.metadata && { metadata: validatedInput.metadata as Prisma.JsonValue }),
      },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        club: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        team: {
          select: { id: true, name: true },
        },
        match: {
          select: { id: true, kickOffTime: true, homeScore: true, awayScore: true },
        },
        training: {
          select: { id: true, name: true, startTime: true },
        },
      },
    });

    if (existingMedia.clubId) {
      revalidatePath(`/dashboard/clubs/${existingMedia.clubId}/media`);
    }
    revalidatePath(`/dashboard/media/${mediaId}`);

    return {
      success: true,
      data: updatedMedia as unknown as MediaContentWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error updating media:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update media' },
    };
  }
}

// ============================================================================
// DELETE MEDIA (Soft Delete)
// ============================================================================

export async function deleteMedia(
  mediaId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const existingMedia = await prisma.mediaContent.findUnique({
      where: { id: mediaId, deletedAt: null },
      select: { id: true, clubId: true, uploadedBy: true },
    });

    if (!existingMedia) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Media not found' } };
    }

    // Check permission
    const isOwner = existingMedia.uploadedBy === session.user.id;
    if (!isOwner && existingMedia.clubId) {
      const hasPermission = await checkMediaPermission(
        session.user.id,
        existingMedia.clubId,
        'delete'
      );
      if (!hasPermission) {
        return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to delete this media' } };
      }
    }

    await prisma.mediaContent.update({
      where: { id: mediaId },
      data: { deletedAt: new Date() },
    });

    if (existingMedia.clubId) {
      revalidatePath(`/dashboard/clubs/${existingMedia.clubId}/media`);
    }

    return {
      success: true,
      data: { deleted: true },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error deleting media:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete media' },
    };
  }
}

// ============================================================================
// BATCH DELETE
// ============================================================================

export async function batchDeleteMedia(
  input: BatchDeleteInput
): Promise<ApiResponse<{ deleted: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const validatedInput = BatchDeleteSchema.parse(input);

    // Get all media to check permissions
    const mediaItems = await prisma.mediaContent.findMany({
      where: {
        id: { in: validatedInput.mediaIds },
        deletedAt: null,
      },
      select: { id: true, clubId: true, uploadedBy: true },
    });

    // Filter to only items user can delete
    const deletableIds: string[] = [];
    for (const media of mediaItems) {
      const isOwner = media.uploadedBy === session.user.id;
      if (isOwner) {
        deletableIds.push(media.id);
      } else if (media.clubId) {
        const hasPermission = await checkMediaPermission(
          session.user.id,
          media.clubId,
          'delete'
        );
        if (hasPermission) {
          deletableIds.push(media.id);
        }
      }
    }

    if (deletableIds.length === 0) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to delete any of the selected media' } };
    }

    await prisma.mediaContent.updateMany({
      where: { id: { in: deletableIds } },
      data: { deletedAt: new Date() },
    });

    return {
      success: true,
      data: { deleted: deletableIds.length },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error batch deleting media:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete media' },
    };
  }
}

// ============================================================================
// BATCH UPDATE VISIBILITY
// ============================================================================

export async function batchUpdateVisibility(
  input: BatchUpdateVisibilityInput
): Promise<ApiResponse<{ updated: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const validatedInput = BatchUpdateVisibilitySchema.parse(input);

    // Get all media to check permissions
    const mediaItems = await prisma.mediaContent.findMany({
      where: {
        id: { in: validatedInput.mediaIds },
        deletedAt: null,
      },
      select: { id: true, clubId: true, uploadedBy: true },
    });

    // Filter to only items user can update
    const updatableIds: string[] = [];
    for (const media of mediaItems) {
      const isOwner = media.uploadedBy === session.user.id;
      if (isOwner) {
        updatableIds.push(media.id);
      } else if (media.clubId) {
        const hasPermission = await checkMediaPermission(
          session.user.id,
          media.clubId,
          'update'
        );
        if (hasPermission) {
          updatableIds.push(media.id);
        }
      }
    }

    if (updatableIds.length === 0) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to update any of the selected media' } };
    }

    await prisma.mediaContent.updateMany({
      where: { id: { in: updatableIds } },
      data: {
        visibility: validatedInput.visibility,
        isPublic: validatedInput.visibility === 'PUBLIC',
      },
    });

    return {
      success: true,
      data: { updated: updatableIds.length },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error batch updating visibility:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update visibility' },
    };
  }
}

// ============================================================================
// CREATE VIDEO CLIP
// ============================================================================

export async function createVideoClip(
  input: CreateClipInput
): Promise<ApiResponse<MediaContentWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const validatedInput = CreateClipSchema.parse(input);

    // Get source media
    const sourceMedia = await prisma.mediaContent.findUnique({
      where: { id: validatedInput.sourceMediaId, deletedAt: null },
      select: {
        id: true,
        type: true,
        clubId: true,
        teamId: true,
        matchId: true,
        trainingId: true,
        url: true,
        duration: true,
        visibility: true,
      },
    });

    if (!sourceMedia) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Source media not found' } };
    }

    if (sourceMedia.type !== 'VIDEO') {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Source must be a video' } };
    }

    if (sourceMedia.duration && validatedInput.endTimestamp > sourceMedia.duration) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'End timestamp exceeds video duration' } };
    }

    // Check permission
    if (sourceMedia.clubId) {
      const hasPermission = await checkMediaPermission(
        session.user.id,
        sourceMedia.clubId,
        'upload'
      );
      if (!hasPermission) {
        return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to create clips' } };
      }
    }

    // Create clip record (actual clip processing would be handled by a job queue)
    const clipDuration = validatedInput.endTimestamp - validatedInput.startTimestamp;

    const clip = await prisma.mediaContent.create({
      data: {
        clubId: sourceMedia.clubId,
        teamId: sourceMedia.teamId,
        matchId: sourceMedia.matchId,
        trainingId: sourceMedia.trainingId,
        uploadedBy: session.user.id,
        type: 'VIDEO',
        category: validatedInput.category || 'MATCH_HIGHLIGHT',
        title: validatedInput.title,
        description: validatedInput.description,
        tags: validatedInput.tags || [],
        filename: `clip_${Date.now()}.mp4`,
        originalName: validatedInput.title,
        mimeType: 'video/mp4',
        sizeBytes: 0, // Will be updated after processing
        url: sourceMedia.url, // Temporary, will be updated
        duration: clipDuration,
        startTimestamp: validatedInput.startTimestamp,
        endTimestamp: validatedInput.endTimestamp,
        parentMediaId: sourceMedia.id,
        visibility: sourceMedia.visibility,
        processingStatus: 'PENDING',
      },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        club: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        team: {
          select: { id: true, name: true },
        },
        match: {
          select: { id: true, kickOffTime: true, homeScore: true, awayScore: true },
        },
        training: {
          select: { id: true, name: true, startTime: true },
        },
      },
    });

    // TODO: Queue clip processing job

    return {
      success: true,
      data: clip as unknown as MediaContentWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error creating video clip:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create clip' },
    };
  }
}

// ============================================================================
// GET STORAGE STATS
// ============================================================================

export async function getStorageStats(
  clubId: string
): Promise<ApiResponse<MediaStorageStats>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const hasPermission = await checkMediaPermission(session.user.id, clubId, 'view');
    if (!hasPermission) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission' } };
    }

    // Get counts by type
    const byType = await prisma.mediaContent.groupBy({
      by: ['type'],
      where: { clubId, deletedAt: null },
      _count: { id: true },
      _sum: { sizeBytes: true },
    });

    // Get counts by category
    const byCategory = await prisma.mediaContent.groupBy({
      by: ['category'],
      where: { clubId, deletedAt: null },
      _count: { id: true },
      _sum: { sizeBytes: true },
    });

    // Get totals
    const totals = await prisma.mediaContent.aggregate({
      where: { clubId, deletedAt: null },
      _count: { id: true },
      _sum: { sizeBytes: true },
    });

    // Get quota (from club or organisation settings)
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        organisation: {
          select: { maxStorageMb: true },
        },
      },
    });

    const totalQuota = (club?.organisation?.maxStorageMb || 5120) * 1024 * 1024; // Convert MB to bytes
    const usedQuota = totals._sum.sizeBytes || 0;

    const stats: MediaStorageStats = {
      totalFiles: totals._count.id || 0,
      totalSize: usedQuota,
      byType: byType.map(t => ({
        type: t.type,
        count: t._count.id,
        size: t._sum.sizeBytes || 0,
      })),
      byCategory: byCategory.map(c => ({
        category: c.category,
        count: c._count.id,
        size: c._sum.sizeBytes || 0,
      })),
      usedQuota,
      totalQuota,
      quotaPercentage: (usedQuota / totalQuota) * 100,
    };

    return {
      success: true,
      data: stats,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get storage stats' },
    };
  }
}

// ============================================================================
// UPDATE PROCESSING STATUS (Called by processing webhook)
// ============================================================================

export async function updateProcessingStatus(
  mediaId: string,
  status: 'PROCESSING' | 'TRANSCODING' | 'COMPLETED' | 'FAILED',
  output?: {
    url?: string;
    thumbnailUrl?: string;
    duration?: number;
    width?: number;
    height?: number;
    qualityVariants?: unknown;
    error?: string;
  }
): Promise<ApiResponse<{ updated: boolean }>> {
  try {
    const updateData: Prisma.MediaContentUpdateInput = {
      processingStatus: status,
      processedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
    };

    if (output) {
      if (output.url) updateData.url = output.url;
      if (output.thumbnailUrl) updateData.thumbnailUrl = output.thumbnailUrl;
      if (output.duration) updateData.duration = output.duration;
      if (output.width) updateData.width = output.width;
      if (output.height) updateData.height = output.height;
      if (output.qualityVariants) updateData.qualityVariants = output.qualityVariants as Prisma.JsonValue;
      if (output.error) updateData.processingError = output.error;
    }

    await prisma.mediaContent.update({
      where: { id: mediaId },
      data: updateData,
    });

    return {
      success: true,
      data: { updated: true },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error updating processing status:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' },
    };
  }
}