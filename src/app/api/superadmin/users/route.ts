// =============================================================================
// 👥 SUPERADMIN USERS LIST API - Enterprise-Grade
// =============================================================================
// GET  /api/superadmin/users - List all users with filtering
// POST /api/superadmin/users - Create new user (admin creation)
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Advanced filtering, search, pagination, bulk export
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { UserStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';

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

interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  status: string;
  isSuperAdmin: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  subscription: {
    tier: string;
    status: string;
  } | null;
  createdAt: string;
}

interface UsersSummary {
  total: number;
  active: number;
  suspended: number;
  banned: number;
  pendingVerification: number;
  byRole: Record<string, number>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  
  // Filters
  search: z.string().max(200).optional(),
  role: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION', 'DEACTIVATED']).optional(),
  isSuperAdmin: z.enum(['true', 'false']).optional(),
  subscriptionTier: z.string().optional(),
  emailVerified: z.enum(['true', 'false']).optional(),
  
  // Date filters
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  lastLoginAfter: z.string().optional(),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'lastLoginAt', 'email', 'firstName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Include soft-deleted
  includeDeleted: z.enum(['true', 'false']).default('false'),
});

const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  roles: z.array(z.string()).default(['PLAYER']),
  status: z.enum(['ACTIVE', 'PENDING_VERIFICATION']).default('ACTIVE'),
  sendWelcomeEmail: z.boolean().default(true),
  temporaryPassword: z.boolean().default(true),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `users_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
 * Generate temporary password
 */
function generateTemporaryPassword(): string {
  return crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
}

// =============================================================================
// GET HANDLER - List Users
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

    const validation = GetUsersSchema.safeParse(rawParams);
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
    const where: Prisma.UserWhereInput = {};

    // Soft delete filter
    if (params.includeDeleted !== 'true') {
      where.deletedAt = null;
    }

    // Search
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (params.role) {
      where.roles = { has: params.role };
    }

    // Status filter
    if (params.status) {
      where.status = params.status;
    }

    // SuperAdmin filter
    if (params.isSuperAdmin !== undefined) {
      where.isSuperAdmin = params.isSuperAdmin === 'true';
    }

    // Email verified filter
    if (params.emailVerified !== undefined) {
      if (params.emailVerified === 'true') {
        where.emailVerified = { not: null };
      } else {
        where.emailVerified = null;
      }
    }

    // Date filters
    if (params.createdAfter || params.createdBefore) {
      where.createdAt = {};
      if (params.createdAfter) {
        where.createdAt.gte = new Date(params.createdAfter);
      }
      if (params.createdBefore) {
        where.createdAt.lte = new Date(params.createdBefore);
      }
    }

    if (params.lastLoginAfter) {
      where.lastLoginAt = { gte: new Date(params.lastLoginAfter) };
    }

    // Subscription tier filter
    if (params.subscriptionTier) {
      where.subscription = { tier: params.subscriptionTier as any };
    }

    // 5. Build orderBy
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [params.sortBy]: params.sortOrder,
    };

    // 6. Fetch users
    const offset = (params.page - 1) * params.limit;

    const [users, total, statusCounts, roleCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roles: true,
          status: true,
          isSuperAdmin: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          subscription: {
            select: { tier: true, status: true },
          },
        },
        orderBy,
        skip: offset,
        take: params.limit,
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        select: { roles: true },
      }),
    ]);

    // 7. Transform users
    const transformedUsers: UserListItem[] = users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      roles: u.roles,
      status: u.status,
      isSuperAdmin: u.isSuperAdmin,
      emailVerified: !!u.emailVerified,
      lastLoginAt: u.lastLoginAt?.toISOString() || null,
      subscription: u.subscription ? {
        tier: u.subscription.tier,
        status: u.subscription.status,
      } : null,
      createdAt: u.createdAt.toISOString(),
    }));

    // 8. Build summary
    const roleCountMap: Record<string, number> = {};
    roleCounts.forEach(user => {
      user.roles.forEach(role => {
        roleCountMap[role] = (roleCountMap[role] || 0) + 1;
      });
    });

    const summary: UsersSummary = {
      total: await prisma.user.count({ where: { deletedAt: null } }),
      active: statusCounts.find(s => s.status === 'ACTIVE')?._count || 0,
      suspended: statusCounts.find(s => s.status === 'SUSPENDED')?._count || 0,
      banned: statusCounts.find(s => s.status === 'BANNED')?._count || 0,
      pendingVerification: statusCounts.find(s => s.status === 'PENDING_VERIFICATION')?._count || 0,
      byRole: roleCountMap,
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Users listed`, {
      adminId: session.user.id,
      total,
      returned: transformedUsers.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse({ users: transformedUsers, summary }, {
      success: true,
      requestId,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasMore: offset + users.length < total,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/users error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to fetch users' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create User
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

    const validation = CreateUserSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Validation failed' },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // 4. Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: params.email.toLowerCase() },
    });

    if (existingUser) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.DUPLICATE_EMAIL, message: 'User with this email already exists' },
        requestId,
        status: 409,
      });
    }

    // 5. Generate temporary password if needed
    const temporaryPassword = params.temporaryPassword ? generateTemporaryPassword() : null;

    // 6. Create user
    const user = await prisma.user.create({
      data: {
        email: params.email.toLowerCase(),
        firstName: params.firstName,
        lastName: params.lastName,
        roles: params.roles,
        status: params.status,
        isSuperAdmin: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        status: true,
        createdAt: true,
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        targetUserId: user.id,
        action: 'USER_CREATED',
        resourceType: 'USER',
        resourceId: user.id,
        details: JSON.stringify({
          email: user.email,
          roles: user.roles,
          createdBy: adminUser.email,
          sendWelcomeEmail: params.sendWelcomeEmail,
        }),
        severity: 'INFO',
      },
    });

    // 8. TODO: Send welcome email if requested
    if (params.sendWelcomeEmail) {
      console.log(`[${requestId}] Would send welcome email to ${user.email}`);
    }

    console.log(`[${requestId}] User created`, {
      adminId: session.user.id,
      newUserId: user.id,
      email: user.email,
    });

    return createResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
      temporaryPassword: temporaryPassword,
    }, {
      success: true,
      message: 'User created successfully',
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/superadmin/users error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to create user' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';