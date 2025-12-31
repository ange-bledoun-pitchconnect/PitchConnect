// =============================================================================
// ⬆️ SUPERADMIN UPGRADE REQUESTS API - Enterprise-Grade
// =============================================================================
// GET  /api/superadmin/upgrade-requests - List upgrade requests
// POST /api/superadmin/upgrade-requests - Approve/reject requests
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Multi-sport role upgrades, audit logging, notifications
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { UpgradeRequestStatus, Prisma } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
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

interface UpgradeRequestRecord {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    currentRoles: string[];
  };
  requestedRole: string;
  reason: string | null;
  supportingDocuments: string[];
  status: string;
  reviewedBy: {
    id: string;
    email: string;
    name: string;
  } | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  ALREADY_PROCESSED: 'ALREADY_PROCESSED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

// Valid roles that can be requested
const REQUESTABLE_ROLES = ['COACH', 'MANAGER', 'LEAGUE_ADMIN', 'CLUB_ADMIN'];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  requestedRole: z.string().optional(),
  userId: z.string().cuid().optional(),
});

const ProcessRequestSchema = z.object({
  requestId: z.string().cuid(),
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().max(1000).optional(),
  grantAdditionalRoles: z.array(z.string()).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `upgrade_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
    error?: { code: string; message: string };
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

  if (options.message) {
    response.message = options.message;
  }

  if (options.error) {
    response.error = options.error;
  }

  if (options.pagination) {
    response.meta!.pagination = options.pagination;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: { 'X-Request-ID': options.requestId },
  });
}

/**
 * Verify SuperAdmin access
 */
async function verifySuperAdmin(userId: string): Promise<{ isValid: boolean; user?: any }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isSuperAdmin: true,
      roles: true,
    },
  });

  if (!user) return { isValid: false };
  const isValid = user.isSuperAdmin || user.roles.includes('SUPERADMIN');
  return { isValid, user };
}

/**
 * Send notification to user about upgrade request status
 */
async function sendUpgradeNotification(
  userId: string,
  status: 'APPROVED' | 'REJECTED',
  requestedRole: string,
  notes?: string
): Promise<void> {
  const title = status === 'APPROVED'
    ? `Role Upgrade Approved`
    : `Role Upgrade Request Update`;
  
  const message = status === 'APPROVED'
    ? `Your request to become a ${requestedRole} has been approved! You now have access to ${requestedRole} features.`
    : `Your request to become a ${requestedRole} has been reviewed. ${notes || 'Please contact support for more information.'}`;

  await prisma.notification.create({
    data: {
      userId,
      type: status === 'APPROVED' ? 'UPGRADE_REQUEST_APPROVED' : 'UPGRADE_REQUEST_REJECTED',
      title,
      message,
      priority: 'HIGH',
      actionUrl: status === 'APPROVED' ? '/dashboard' : '/settings/upgrade',
    },
  });
}

// =============================================================================
// GET HANDLER - List Upgrade Requests
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid } = await verifySuperAdmin(session.user.id);
    if (!isValid) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = GetRequestsSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Invalid parameters' },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // 4. Build where clause
    const where: Prisma.UpgradeRequestWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.requestedRole) {
      where.requestedRole = params.requestedRole;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    // 5. Fetch upgrade requests
    const offset = (params.page - 1) * params.limit;

    const [requests, total, statusCounts] = await Promise.all([
      prisma.upgradeRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              roles: true,
            },
          },
          reviewedByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: params.limit,
      }),
      prisma.upgradeRequest.count({ where }),
      prisma.upgradeRequest.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // 6. Transform requests
    const transformedRequests: UpgradeRequestRecord[] = requests.map(r => ({
      id: r.id,
      user: {
        id: r.user.id,
        email: r.user.email,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        currentRoles: r.user.roles,
      },
      requestedRole: r.requestedRole,
      reason: r.reason,
      supportingDocuments: r.supportingDocuments || [],
      status: r.status,
      reviewedBy: r.reviewedByUser ? {
        id: r.reviewedByUser.id,
        email: r.reviewedByUser.email,
        name: `${r.reviewedByUser.firstName} ${r.reviewedByUser.lastName}`.trim(),
      } : null,
      reviewedAt: r.reviewedAt?.toISOString() || null,
      reviewNotes: r.reviewNotes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    // 7. Build summary
    const summary = {
      pending: statusCounts.find(s => s.status === 'PENDING')?._count || 0,
      approved: statusCounts.find(s => s.status === 'APPROVED')?._count || 0,
      rejected: statusCounts.find(s => s.status === 'REJECTED')?._count || 0,
    };

    return createResponse({ requests: transformedRequests, summary }, {
      success: true,
      requestId,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasMore: offset + requests.length < total,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/upgrade-requests error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to fetch upgrade requests' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Process Upgrade Request
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid, user: adminUser } = await verifySuperAdmin(session.user.id);
    if (!isValid || !adminUser) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid JSON in request body' },
        requestId,
        status: 400,
      });
    }

    const validation = ProcessRequestSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Validation failed' },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // 4. Get upgrade request
    const upgradeRequest = await prisma.upgradeRequest.findUnique({
      where: { id: params.requestId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            roles: true,
          },
        },
      },
    });

    if (!upgradeRequest) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Upgrade request not found' },
        requestId,
        status: 404,
      });
    }

    if (upgradeRequest.status !== 'PENDING') {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.ALREADY_PROCESSED, message: `Request has already been ${upgradeRequest.status.toLowerCase()}` },
        requestId,
        status: 400,
      });
    }

    // 5. Process the request
    const now = new Date();
    const newStatus: UpgradeRequestStatus = params.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    if (params.action === 'APPROVE') {
      // Update user roles
      const newRoles = Array.from(new Set([
        ...upgradeRequest.user.roles,
        upgradeRequest.requestedRole,
        ...(params.grantAdditionalRoles || []),
      ]));

      await prisma.user.update({
        where: { id: upgradeRequest.userId },
        data: { roles: newRoles },
      });
    }

    // Update upgrade request
    await prisma.upgradeRequest.update({
      where: { id: params.requestId },
      data: {
        status: newStatus,
        reviewedBy: session.user.id,
        reviewedAt: now,
        reviewNotes: params.notes,
      },
    });

    // 6. Send notification to user
    await sendUpgradeNotification(
      upgradeRequest.userId,
      params.action,
      upgradeRequest.requestedRole,
      params.notes
    );

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        targetUserId: upgradeRequest.userId,
        action: params.action === 'APPROVE' ? 'UPGRADE_REQUEST_APPROVED' : 'UPGRADE_REQUEST_REJECTED',
        resourceType: 'UPGRADE_REQUEST',
        resourceId: params.requestId,
        details: JSON.stringify({
          requestedRole: upgradeRequest.requestedRole,
          notes: params.notes,
          additionalRoles: params.grantAdditionalRoles,
        }),
        severity: params.action === 'APPROVE' ? 'INFO' : 'WARNING',
      },
    });

    console.log(`[${requestId}] Upgrade request ${params.action.toLowerCase()}d`, {
      adminId: session.user.id,
      requestId: params.requestId,
      userId: upgradeRequest.userId,
      requestedRole: upgradeRequest.requestedRole,
    });

    return createResponse({
      requestId: params.requestId,
      status: newStatus,
      userId: upgradeRequest.userId,
      requestedRole: upgradeRequest.requestedRole,
      processedAt: now.toISOString(),
      processedBy: adminUser.email,
    }, {
      success: true,
      message: `Upgrade request ${params.action.toLowerCase()}ed successfully`,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/superadmin/upgrade-requests error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to process upgrade request' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';