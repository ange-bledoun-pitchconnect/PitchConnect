// =============================================================================
// 📹 MEDIA API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/media - List media content with filters
// POST   /api/media - Create media record (after upload)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Video Processing: Mux | Images: Supabase Storage
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  MediaType,
  MediaCategory,
  MediaVisibility,
  MediaProcessingStatus,
  VideoProcessingProvider,
  ClubMemberRole,
  Sport,
  Prisma,
} from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: PaginationMeta;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Sport-specific media categories
const SPORT_MEDIA_CATEGORIES: Record<Sport, MediaCategory[]> = {
  FOOTBALL: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'MATCH_ANALYSIS', 'GOAL_CLIP',
    'SAVE_CLIP', 'TRAINING_SESSION', 'TRAINING_DRILL', 'TACTICS_DOCUMENT',
  ],
  RUGBY: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'MATCH_ANALYSIS', 'INCIDENT_CLIP',
    'TRAINING_SESSION', 'TRAINING_DRILL', 'TACTICS_DOCUMENT',
  ],
  BASKETBALL: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'MATCH_ANALYSIS', 'TRAINING_SESSION',
    'TRAINING_DRILL', 'TACTICS_DOCUMENT',
  ],
  CRICKET: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'MATCH_ANALYSIS', 'TRAINING_SESSION',
    'TRAINING_DRILL', 'TACTICS_DOCUMENT',
  ],
  AMERICAN_FOOTBALL: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'MATCH_ANALYSIS', 'TRAINING_SESSION',
    'TRAINING_DRILL', 'TACTICS_DOCUMENT',
  ],
  NETBALL: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'MATCH_ANALYSIS', 'TRAINING_SESSION',
    'TRAINING_DRILL', 'TACTICS_DOCUMENT',
  ],
  HOCKEY: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'MATCH_ANALYSIS', 'GOAL_CLIP',
    'SAVE_CLIP', 'TRAINING_SESSION', 'TRAINING_DRILL',
  ],
  LACROSSE: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'MATCH_ANALYSIS', 'TRAINING_SESSION',
    'TRAINING_DRILL',
  ],
  AUSTRALIAN_RULES: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'MATCH_ANALYSIS', 'TRAINING_SESSION',
    'TRAINING_DRILL',
  ],
  GAELIC_FOOTBALL: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'MATCH_ANALYSIS', 'TRAINING_SESSION',
    'TRAINING_DRILL',
  ],
  FUTSAL: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'GOAL_CLIP', 'SAVE_CLIP',
    'TRAINING_SESSION', 'TRAINING_DRILL',
  ],
  BEACH_FOOTBALL: [
    'MATCH_HIGHLIGHT', 'MATCH_FULL', 'GOAL_CLIP', 'TRAINING_SESSION',
    'TRAINING_DRILL',
  ],
};

// Roles that can upload media
const UPLOAD_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'MEDIA_OFFICER',
  'VIDEO_ANALYST',
  'ANALYST',
];

// Roles that can view all club media (not just public)
const VIEW_ALL_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'ANALYST',
  'VIDEO_ANALYST',
  'MEDIA_OFFICER',
  'STAFF',
  'PLAYER',
  'SCOUT',
  'MEDICAL_STAFF',
  'PHYSIOTHERAPIST',
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const MediaFiltersSchema = z.object({
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  matchId: z.string().cuid().optional(),
  trainingId: z.string().cuid().optional(),
  organisationId: z.string().cuid().optional(),
  type: z.nativeEnum(MediaType).optional(),
  types: z.string().optional(), // Comma-separated MediaType values
  category: z.nativeEnum(MediaCategory).optional(),
  categories: z.string().optional(), // Comma-separated categories
  visibility: z.nativeEnum(MediaVisibility).optional(),
  sport: z.nativeEnum(Sport).optional(),
  search: z.string().max(200).optional(),
  tags: z.string().optional(), // Comma-separated tags
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  uploadedBy: z.string().cuid().optional(),
  processingStatus: z.nativeEnum(MediaProcessingStatus).optional(),
});

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'title', 'viewCount', 'likeCount', 'sizeBytes']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const CreateMediaSchema = z.object({
  // Required fields
  title: z.string().min(1).max(200),
  type: z.nativeEnum(MediaType),
  category: z.nativeEnum(MediaCategory),
  filename: z.string().min(1).max(500),
  originalName: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
  url: z.string().url(),

  // Association (at least one required)
  organisationId: z.string().cuid().optional(),
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  matchId: z.string().cuid().optional(),
  trainingId: z.string().cuid().optional(),

  // Optional fields
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  cdnUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  visibility: z.nativeEnum(MediaVisibility).default('CLUB_ONLY'),
  isPublic: z.boolean().default(false),
  accessRoles: z.array(z.nativeEnum(ClubMemberRole)).optional(),
  startTimestamp: z.number().int().optional(),
  endTimestamp: z.number().int().optional(),
  parentMediaId: z.string().cuid().optional(),
  metadata: z.record(z.unknown()).optional(),

  // Video processing (for Mux integration)
  processingProvider: z.nativeEnum(VideoProcessingProvider).optional(),
  muxAssetId: z.string().optional(),
  muxPlaybackId: z.string().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
    pagination?: PaginationMeta;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.error) {
    response.error = options.error;
  }

  if (options.pagination) {
    response.meta!.pagination = options.pagination;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

function parseTags(tagsParam: string | null): string[] {
  if (!tagsParam) return [];
  return tagsParam
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= 50);
}

function parseEnumList<T extends string>(
  param: string | null,
  validValues: readonly T[]
): T[] {
  if (!param) return [];
  return param
    .split(',')
    .map((v) => v.trim().toUpperCase() as T)
    .filter((v) => validValues.includes(v));
}

async function getUserClubMembership(
  userId: string,
  clubId: string
): Promise<{ role: ClubMemberRole; isActive: boolean } | null> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
    },
    select: {
      role: true,
      isActive: true,
    },
  });

  return membership;
}

async function checkUserPermissions(
  userId: string,
  clubId: string | null,
  action: 'view' | 'upload'
): Promise<{ allowed: boolean; role: ClubMemberRole | null; isOwner: boolean }> {
  // Check if user is super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    return { allowed: true, role: null, isOwner: true };
  }

  if (!clubId) {
    return { allowed: false, role: null, isOwner: false };
  }

  // Check if user is club owner
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { ownerId: true },
  });

  if (club?.ownerId === userId) {
    return { allowed: true, role: 'OWNER', isOwner: true };
  }

  // Check club membership
  const membership = await getUserClubMembership(userId, clubId);

  if (!membership) {
    return { allowed: false, role: null, isOwner: false };
  }

  const allowedRoles = action === 'upload' ? UPLOAD_ROLES : VIEW_ALL_ROLES;

  return {
    allowed: allowedRoles.includes(membership.role),
    role: membership.role,
    isOwner: false,
  };
}

// =============================================================================
// GET HANDLER - List Media Content
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawFilters = Object.fromEntries(searchParams.entries());

    // Parse and validate filters
    const filtersResult = MediaFiltersSchema.safeParse(rawFilters);
    const paginationResult = PaginationSchema.safeParse(rawFilters);

    if (!filtersResult.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid filter parameters',
          details: filtersResult.error.errors[0]?.message,
        },
        requestId,
        status: 400,
      });
    }

    const filters = filtersResult.data;
    const pagination = paginationResult.success
      ? paginationResult.data
      : { page: 1, limit: 20, sortBy: 'createdAt' as const, sortOrder: 'desc' as const };

    // 3. Require at least one association filter
    if (
      !filters.clubId &&
      !filters.teamId &&
      !filters.matchId &&
      !filters.trainingId &&
      !filters.organisationId
    ) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.BAD_REQUEST,
          message: 'At least one filter (clubId, teamId, matchId, trainingId, organisationId) is required',
        },
        requestId,
        status: 400,
      });
    }

    // 4. Check permissions
    const clubIdToCheck = filters.clubId || null;
    const permissions = await checkUserPermissions(userId, clubIdToCheck, 'view');

    // 5. Build where clause
    const where: Prisma.MediaContentWhereInput = {
      deletedAt: null,
    };

    // Association filters
    if (filters.clubId) where.clubId = filters.clubId;
    if (filters.teamId) where.teamId = filters.teamId;
    if (filters.matchId) where.matchId = filters.matchId;
    if (filters.trainingId) where.trainingId = filters.trainingId;
    if (filters.organisationId) where.organisationId = filters.organisationId;

    // Visibility filter based on permissions
    if (!permissions.allowed) {
      // Non-members can only see public media
      where.visibility = MediaVisibility.PUBLIC;
    } else if (filters.visibility) {
      where.visibility = filters.visibility;
    }

    // Type filter (single or multiple)
    if (filters.type) {
      where.type = filters.type;
    } else if (filters.types) {
      const types = parseEnumList(filters.types, Object.values(MediaType));
      if (types.length > 0) {
        where.type = { in: types };
      }
    }

    // Category filter (single or multiple)
    if (filters.category) {
      where.category = filters.category;
    } else if (filters.categories) {
      const categories = parseEnumList(filters.categories, Object.values(MediaCategory));
      if (categories.length > 0) {
        where.category = { in: categories };
      }
    }

    // Processing status filter
    if (filters.processingStatus) {
      where.processingStatus = filters.processingStatus;
    }

    // Uploader filter
    if (filters.uploadedBy) {
      where.uploadedBy = filters.uploadedBy;
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Tags filter
    if (filters.tags) {
      const tags = parseTags(filters.tags);
      if (tags.length > 0) {
        where.tags = { hasEvery: tags };
      }
    }

    // Date filters
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // 6. Execute queries
    const skip = (pagination.page - 1) * pagination.limit;

    const [media, total] = await Promise.all([
      prisma.mediaContent.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip,
        take: pagination.limit,
        select: {
          id: true,
          type: true,
          category: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          url: true,
          cdnUrl: true,
          duration: true,
          width: true,
          height: true,
          sizeBytes: true,
          processingStatus: true,
          processingProvider: true,
          visibility: true,
          viewCount: true,
          likeCount: true,
          downloadCount: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          clubId: true,
          teamId: true,
          matchId: true,
          trainingId: true,
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
              sport: true,
              logo: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.mediaContent.count({ where }),
    ]);

    // 7. Transform response
    const transformedMedia = media.map((item) => ({
      id: item.id,
      type: item.type,
      category: item.category,
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      url: item.url,
      cdnUrl: item.cdnUrl,
      duration: item.duration,
      dimensions: item.width && item.height ? { width: item.width, height: item.height } : null,
      sizeBytes: item.sizeBytes,
      sizeMb: Math.round((item.sizeBytes / 1024 / 1024) * 100) / 100,
      processingStatus: item.processingStatus,
      processingProvider: item.processingProvider,
      visibility: item.visibility,
      stats: {
        views: item.viewCount,
        likes: item.likeCount,
        downloads: item.downloadCount,
      },
      tags: item.tags,
      associations: {
        clubId: item.clubId,
        teamId: item.teamId,
        matchId: item.matchId,
        trainingId: item.trainingId,
      },
      uploader: item.uploader
        ? {
            id: item.uploader.id,
            name: `${item.uploader.firstName} ${item.uploader.lastName}`,
            avatar: item.uploader.avatar,
          }
        : null,
      club: item.club
        ? {
            id: item.club.id,
            name: item.club.name,
            sport: item.club.sport,
            logo: item.club.logo,
          }
        : null,
      team: item.team ? { id: item.team.id, name: item.team.name } : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Media list fetched`, {
      userId,
      count: media.length,
      total,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(
      { items: transformedMedia },
      {
        success: true,
        requestId,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
          hasMore: skip + media.length < total,
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] GET /api/media error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch media',
        details: error instanceof Error ? error.message : undefined,
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Media Record
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid JSON in request body',
        },
        requestId,
        status: 400,
      });
    }

    const validation = CreateMediaSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
          details: JSON.stringify(validation.error.errors),
        },
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 3. Require at least one association
    if (
      !data.organisationId &&
      !data.clubId &&
      !data.teamId &&
      !data.matchId &&
      !data.trainingId
    ) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'At least one association (organisationId, clubId, teamId, matchId, trainingId) is required',
        },
        requestId,
        status: 400,
      });
    }

    // 4. Check upload permissions
    const clubIdToCheck = data.clubId || null;
    const permissions = await checkUserPermissions(userId, clubIdToCheck, 'upload');

    if (!permissions.allowed) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'You do not have permission to upload media to this club',
        },
        requestId,
        status: 403,
      });
    }

    // 5. Determine processing status
    const isVideo = data.type === MediaType.VIDEO;
    const processingStatus = isVideo
      ? MediaProcessingStatus.PENDING
      : MediaProcessingStatus.COMPLETED;

    // 6. Create media record
    const media = await prisma.mediaContent.create({
      data: {
        organisationId: data.organisationId,
        clubId: data.clubId,
        teamId: data.teamId,
        matchId: data.matchId,
        trainingId: data.trainingId,
        uploadedBy: userId,
        type: data.type,
        category: data.category,
        title: data.title,
        description: data.description,
        tags: data.tags || [],
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        url: data.url,
        cdnUrl: data.cdnUrl,
        width: data.width,
        height: data.height,
        duration: data.duration,
        thumbnailUrl: data.thumbnailUrl,
        visibility: data.visibility,
        isPublic: data.visibility === MediaVisibility.PUBLIC,
        accessRoles: data.accessRoles || [],
        startTimestamp: data.startTimestamp,
        endTimestamp: data.endTimestamp,
        parentMediaId: data.parentMediaId,
        metadata: data.metadata || {},
        processingStatus,
        processingProvider: isVideo
          ? (data.processingProvider || VideoProcessingProvider.MUX)
          : null,
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            sport: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MEDIA_UPLOADED',
        resourceType: 'MEDIA_CONTENT',
        resourceId: media.id,
        afterState: {
          type: media.type,
          category: media.category,
          title: media.title,
          sizeBytes: media.sizeBytes,
          clubId: media.clubId,
        },
      },
    });

    // 8. If video, trigger Mux processing (placeholder)
    if (isVideo && data.processingProvider === VideoProcessingProvider.MUX) {
      // TODO: Trigger Mux asset creation
      // await triggerMuxProcessing(media.id, data.url);
      console.log(`[${requestId}] Video uploaded, Mux processing to be triggered`, {
        mediaId: media.id,
      });
    }

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Media created`, {
      mediaId: media.id,
      type: media.type,
      category: media.category,
      userId,
      duration: `${Math.round(duration)}ms`,
    });

    // 9. Transform response
    const response = {
      id: media.id,
      type: media.type,
      category: media.category,
      title: media.title,
      description: media.description,
      url: media.url,
      cdnUrl: media.cdnUrl,
      thumbnailUrl: media.thumbnailUrl,
      duration: media.duration,
      dimensions: media.width && media.height ? { width: media.width, height: media.height } : null,
      sizeBytes: media.sizeBytes,
      processingStatus: media.processingStatus,
      processingProvider: media.processingProvider,
      visibility: media.visibility,
      tags: media.tags,
      uploader: media.uploader
        ? {
            id: media.uploader.id,
            name: `${media.uploader.firstName} ${media.uploader.lastName}`,
            avatar: media.uploader.avatar,
          }
        : null,
      club: media.club
        ? {
            id: media.club.id,
            name: media.club.name,
            slug: media.club.slug,
            logo: media.club.logo,
            sport: media.club.sport,
          }
        : null,
      team: media.team ? { id: media.team.id, name: media.team.name } : null,
      createdAt: media.createdAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/media error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to create media record',
        details: error instanceof Error ? error.message : undefined,
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';
