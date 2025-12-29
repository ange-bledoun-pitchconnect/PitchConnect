// ============================================================================
// 📹 MEDIA API ROUTES - PitchConnect v7.3.0
// ============================================================================
// RESTful API endpoints for media content management
// Supports VIDEO, IMAGE, DOCUMENT, AUDIO with processing
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  MediaFiltersSchema,
  PaginationSchema,
  MediaTypeSchema,
  MediaCategorySchema,
  MediaVisibilitySchema,
  parseTags,
} from '@/schemas/media.schema';

// ============================================================================
// GET /api/media - List media content
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const clubId = searchParams.get('clubId');
    const teamId = searchParams.get('teamId');
    const matchId = searchParams.get('matchId');
    const trainingId = searchParams.get('trainingId');
    const typeParam = searchParams.get('type');
    const categoryParam = searchParams.get('category');
    const visibilityParam = searchParams.get('visibility');
    const search = searchParams.get('search');
    const tagsParam = searchParams.get('tags');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.MediaContentWhereInput = {
      deletedAt: null,
    };

    // Must have at least one association filter
    if (!clubId && !teamId && !matchId && !trainingId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'At least one filter (clubId, teamId, matchId, trainingId) is required' } },
        { status: 400 }
      );
    }

    if (clubId) where.clubId = clubId;
    if (teamId) where.teamId = teamId;
    if (matchId) where.matchId = matchId;
    if (trainingId) where.trainingId = trainingId;

    // Check permission
    if (clubId) {
      const membership = await prisma.clubMember.findFirst({
        where: {
          userId: session.user.id,
          clubId,
          isActive: true,
        },
      });

      if (!membership) {
        // Can only see public media
        where.visibility = 'PUBLIC';
      }
    }

    // Type filter
    if (typeParam) {
      const types = typeParam.split(',').filter(t => {
        const result = MediaTypeSchema.safeParse(t.trim());
        return result.success;
      });
      if (types.length > 0) {
        where.type = types.length === 1 ? types[0] as any : { in: types as any };
      }
    }

    // Category filter
    if (categoryParam) {
      const categories = categoryParam.split(',').filter(c => {
        const result = MediaCategorySchema.safeParse(c.trim());
        return result.success;
      });
      if (categories.length > 0) {
        where.category = categories.length === 1 ? categories[0] as any : { in: categories as any };
      }
    }

    // Visibility filter
    if (visibilityParam) {
      const result = MediaVisibilitySchema.safeParse(visibilityParam);
      if (result.success) {
        where.visibility = result.data;
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Tags filter
    if (tagsParam) {
      const tags = parseTags(tagsParam);
      if (tags.length > 0) {
        where.tags = { hasEvery: tags };
      }
    }

    // Date filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get total count
    const total = await prisma.mediaContent.count({ where });

    // Get media
    const media = await prisma.mediaContent.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
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
        visibility: true,
        viewCount: true,
        likeCount: true,
        tags: true,
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

    return NextResponse.json({
      success: true,
      data: {
        data: media,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + media.length < total,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('GET /api/media error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch media' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/media - Create media record (after upload)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'type', 'category', 'filename', 'originalName', 'mimeType', 'sizeBytes', 'url'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: `${field} is required` } },
          { status: 400 }
        );
      }
    }

    // At least one association required
    if (!body.clubId && !body.teamId && !body.matchId && !body.trainingId && !body.organisationId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'At least one association is required' } },
        { status: 400 }
      );
    }

    // Check permission
    if (body.clubId) {
      const membership = await prisma.clubMember.findFirst({
        where: {
          userId: session.user.id,
          clubId: body.clubId,
          isActive: true,
          role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'MEDIA_OFFICER', 'VIDEO_ANALYST'] },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'No permission to upload media' } },
          { status: 403 }
        );
      }
    }

    // Create media record
    const media = await prisma.mediaContent.create({
      data: {
        organisationId: body.organisationId,
        clubId: body.clubId,
        teamId: body.teamId,
        matchId: body.matchId,
        trainingId: body.trainingId,
        uploadedBy: session.user.id,
        type: body.type,
        category: body.category,
        title: body.title,
        description: body.description,
        tags: body.tags || [],
        filename: body.filename,
        originalName: body.originalName,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        url: body.url,
        cdnUrl: body.cdnUrl,
        width: body.width,
        height: body.height,
        duration: body.duration,
        thumbnailUrl: body.thumbnailUrl,
        visibility: body.visibility || 'CLUB_ONLY',
        isPublic: body.isPublic || false,
        accessRoles: body.accessRoles || [],
        startTimestamp: body.startTimestamp,
        endTimestamp: body.endTimestamp,
        parentMediaId: body.parentMediaId,
        metadata: body.metadata,
        processingStatus: body.type === 'VIDEO' ? 'PENDING' : 'COMPLETED',
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
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: media,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/media error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create media record' } },
      { status: 500 }
    );
  }
}