// =============================================================================
// 📢 TEAM ANNOUNCEMENTS API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/manager/clubs/[clubId]/teams/[teamId]/announcements - List
// POST /api/manager/clubs/[clubId]/teams/[teamId]/announcements - Create
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ Generic (applies to all)
// Permission: Club Owner, Manager, Head Coach (read/write)
//             Assistant Coach, Player (read only)
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
  requestId: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RouteParams {
  params: {
    clubId: string;
    teamId: string;
  };
}

interface AnnouncementItem {
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
    role?: string;
  };
  readCount: number;
  isRead?: boolean; // For current user
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  priority: z.nativeEnum(AnnouncementPriority).default('NORMAL'),
  isPinned: z.boolean().default(false),
  publishAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  notifyMembers: z.boolean().default(true),
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
    requestId: string;
    status?: number;
    pagination?: ApiResponse<T>['pagination'];
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
  if (options.pagination) response.pagination = options.pagination;

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
  clubId: string
): Promise<{ canRead: boolean; canWrite: boolean; role: string | null }> {
  // Check super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  
  if (user?.isSuperAdmin) {
    return { canRead: true, canWrite: true, role: 'SUPER_ADMIN' };
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
    return { canRead: false, canWrite: false, role: null };
  }

  return {
    canRead: READ_ROLES.includes(clubMember.role),
    canWrite: WRITE_ROLES.includes(clubMember.role),
    role: clubMember.role,
  };
}

// =============================================================================
// GET HANDLER - List Announcements
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId } = params;

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
    if (!permissions.canRead) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view announcements',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found or does not belong to this club',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const priority = searchParams.get('priority') as AnnouncementPriority | null;
    const includePinned = searchParams.get('includePinned') !== 'false';
    const includeExpired = searchParams.get('includeExpired') === 'true';

    // 5. Build filter
    const where: Record<string, unknown> = {
      teamId,
    };

    if (priority) {
      where.priority = priority;
    }

    // Filter out expired unless requested
    if (!includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    // Filter unpublished (unless user can write)
    if (!permissions.canWrite) {
      where.AND = [
        {
          OR: [
            { publishAt: null },
            { publishAt: { lte: new Date() } },
          ],
        },
      ];
    }

    // 6. Get total count
    const total = await prisma.announcement.count({ where });

    // 7. Fetch announcements
    const skip = (page - 1) * limit;

    // Get pinned first if requested
    let announcements;
    if (includePinned) {
      const [pinned, regular] = await Promise.all([
        prisma.announcement.findMany({
          where: { ...where, isPinned: true },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: { reads: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.announcement.findMany({
          where: { ...where, isPinned: false },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: { reads: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);
      
      announcements = [...pinned, ...regular];
    } else {
      announcements = await prisma.announcement.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: { reads: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
    }

    // 8. Check which announcements current user has read
    const announcementIds = announcements.map((a) => a.id);
    const readRecords = await prisma.announcementRead.findMany({
      where: {
        announcementId: { in: announcementIds },
        userId: session.user.id,
      },
      select: { announcementId: true },
    });
    const readSet = new Set(readRecords.map((r) => r.announcementId));

    // 9. Transform response
    const items: AnnouncementItem[] = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      priority: a.priority,
      isPinned: a.isPinned,
      publishAt: a.publishAt?.toISOString() || null,
      expiresAt: a.expiresAt?.toISOString() || null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      author: {
        id: a.author.id,
        name: `${a.author.firstName} ${a.author.lastName}`,
        avatar: a.author.avatar,
      },
      readCount: a._count.reads,
      isRead: readSet.has(a.id),
    }));

    return createResponse(items, {
      success: true,
      requestId,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`[${requestId}] List Announcements error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch announcements',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Announcement
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId } = params;

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

    // 2. Authorization (write permission required)
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canWrite) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to create announcements',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found or does not belong to this club',
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

    const validation = CreateAnnouncementSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { title, content, priority, isPinned, publishAt, expiresAt, notifyMembers } = validation.data;

    // 5. Validate dates
    if (publishAt && expiresAt && new Date(publishAt) >= new Date(expiresAt)) {
      return createResponse(null, {
        success: false,
        error: 'Publish date must be before expiry date',
        code: 'INVALID_DATES',
        requestId,
        status: 400,
      });
    }

    // 6. Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority,
        isPinned,
        publishAt: publishAt ? new Date(publishAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        teamId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // 7. Create notifications if requested
    if (notifyMembers && (!publishAt || new Date(publishAt) <= new Date())) {
      // Get all active team members
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId, isActive: true },
        select: { userId: true },
      });

      // Create notifications (excluding author)
      const notifications = teamMembers
        .filter((m) => m.userId !== session.user.id)
        .map((m) => ({
          userId: m.userId,
          type: 'ANNOUNCEMENT' as const,
          title: `New Announcement: ${title}`,
          message: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          link: `/teams/${teamId}/announcements/${announcement.id}`,
          data: { announcementId: announcement.id, teamId },
        }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
          skipDuplicates: true,
        });
      }
    }

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'ANNOUNCEMENT',
        entityId: announcement.id,
        description: `Created announcement: ${title}`,
        metadata: {
          teamId,
          clubId,
          priority,
          isPinned,
        },
      },
    });

    // 9. Transform response
    const response: AnnouncementItem = {
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
      readCount: 0,
      isRead: false,
    };

    return createResponse(response, {
      success: true,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Create Announcement error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create announcement',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
