// =============================================================================
// 🎭 SUPERADMIN IMPERSONATION API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/superadmin/impersonation - List impersonation sessions
// POST /api/superadmin/impersonation - Start or end impersonation
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Full audit trail, session management, security logging
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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

interface ImpersonationSession {
  id: string;
  
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  
  targetUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
  
  status: 'ACTIVE' | 'ENDED';
  reason: string | null;
  
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  
  ipAddress: string | null;
  userAgent: string | null;
}

interface SessionsListResponse {
  sessions: ImpersonationSession[];
  activeCount: number;
}

interface StartImpersonationResponse {
  sessionId: string;
  targetUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
  startedAt: string;
  expiresAt: string;
}

interface EndImpersonationResponse {
  sessionId: string;
  endedAt: string;
  durationMinutes: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const MAX_SESSION_DURATION_HOURS = 24;
const DEFAULT_PAGE_LIMIT = 50;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetSessionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_LIMIT),
  status: z.enum(['ACTIVE', 'ENDED', 'ALL']).default('ALL'),
  adminId: z.string().cuid().optional(),
});

const ImpersonationActionSchema = z.object({
  action: z.enum(['start', 'end']),
  
  // For starting impersonation
  targetUserId: z.string().cuid().optional(),
  reason: z.string().max(500).optional(),
  
  // For ending impersonation
  sessionId: z.string().cuid().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `impersonate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
    headers: {
      'X-Request-ID': options.requestId,
    },
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

  if (!user) {
    return { isValid: false };
  }

  const isValid = user.isSuperAdmin || user.roles.includes('SUPERADMIN');
  return { isValid, user };
}

/**
 * Get client IP address
 */
function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * Calculate session duration in minutes
 */
function calculateDuration(startedAt: Date, endedAt: Date | null): number | null {
  if (!endedAt) return null;
  return Math.round((endedAt.getTime() - startedAt.getTime()) / (1000 * 60));
}

// =============================================================================
// GET HANDLER - List Impersonation Sessions
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

    // 2. Verify SuperAdmin access
    const { isValid } = await verifySuperAdmin(session.user.id);
    if (!isValid) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'SuperAdmin access required',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = GetSessionsSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid parameters',
        },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // 4. Build where clause
    const where: any = {};

    if (params.status === 'ACTIVE') {
      where.endedAt = null;
    } else if (params.status === 'ENDED') {
      where.endedAt = { not: null };
    }

    if (params.adminId) {
      where.adminId = params.adminId;
    }

    // 5. Fetch sessions
    const offset = (params.page - 1) * params.limit;

    const [sessions, total, activeCount] = await Promise.all([
      prisma.impersonationSession.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              roles: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip: offset,
        take: params.limit,
      }),
      prisma.impersonationSession.count({ where }),
      prisma.impersonationSession.count({ where: { endedAt: null } }),
    ]);

    // 6. Transform sessions
    const transformedSessions: ImpersonationSession[] = sessions.map(s => ({
      id: s.id,
      admin: {
        id: s.admin.id,
        email: s.admin.email,
        firstName: s.admin.firstName,
        lastName: s.admin.lastName,
      },
      targetUser: {
        id: s.targetUser.id,
        email: s.targetUser.email,
        firstName: s.targetUser.firstName,
        lastName: s.targetUser.lastName,
        roles: s.targetUser.roles,
      },
      status: s.endedAt ? 'ENDED' : 'ACTIVE',
      reason: s.reason,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt?.toISOString() || null,
      durationMinutes: calculateDuration(s.startedAt, s.endedAt),
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
    }));

    // 7. Build response
    const response: SessionsListResponse = {
      sessions: transformedSessions,
      activeCount,
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Impersonation sessions listed`, {
      adminId: session.user.id,
      total,
      activeCount,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasMore: offset + sessions.length < total,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/impersonation error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch impersonation sessions',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Start or End Impersonation
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || null;

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

    // 2. Verify SuperAdmin access
    const { isValid, user: adminUser } = await verifySuperAdmin(session.user.id);
    if (!isValid || !adminUser) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'SuperAdmin access required',
        },
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
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid JSON in request body',
        },
        requestId,
        status: 400,
      });
    }

    const validation = ImpersonationActionSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
        },
        requestId,
        status: 400,
      });
    }

    const { action, targetUserId, reason, sessionId } = validation.data;

    // ==========================================================================
    // ACTION: START IMPERSONATION
    // ==========================================================================
    if (action === 'start') {
      if (!targetUserId) {
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'targetUserId is required for start action',
          },
          requestId,
          status: 400,
        });
      }

      // Check target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roles: true,
          isSuperAdmin: true,
          deletedAt: true,
        },
      });

      if (!targetUser || targetUser.deletedAt) {
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Target user not found',
          },
          requestId,
          status: 404,
        });
      }

      // Prevent self-impersonation
      if (targetUserId === session.user.id) {
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Cannot impersonate yourself',
          },
          requestId,
          status: 400,
        });
      }

      // Check for existing active session
      const existingSession = await prisma.impersonationSession.findFirst({
        where: {
          adminId: session.user.id,
          endedAt: null,
        },
      });

      if (existingSession) {
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.CONFLICT,
            message: 'You already have an active impersonation session. End it first.',
          },
          requestId,
          status: 409,
        });
      }

      // Create impersonation session
      const now = new Date();
      const expiresAt = new Date(now.getTime() + MAX_SESSION_DURATION_HOURS * 60 * 60 * 1000);

      const newSession = await prisma.impersonationSession.create({
        data: {
          adminId: session.user.id,
          targetUserId,
          reason: reason || null,
          startedAt: now,
          ipAddress: clientIp,
          userAgent,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          targetUserId,
          action: 'USER_IMPERSONATED',
          resourceType: 'USER',
          resourceId: targetUserId,
          details: JSON.stringify({
            sessionId: newSession.id,
            reason: reason || 'No reason provided',
            expiresAt: expiresAt.toISOString(),
          }),
          ipAddress: clientIp,
          userAgent,
          severity: 'CRITICAL',
        },
      });

      const response: StartImpersonationResponse = {
        sessionId: newSession.id,
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          roles: targetUser.roles,
        },
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      console.log(`[${requestId}] 🎭 Impersonation started`, {
        adminId: session.user.id,
        adminEmail: adminUser.email,
        targetUserId,
        targetEmail: targetUser.email,
        sessionId: newSession.id,
        reason: reason || 'No reason provided',
      });

      return createResponse(response, {
        success: true,
        message: `Now impersonating ${targetUser.firstName} ${targetUser.lastName}`,
        requestId,
        status: 201,
      });
    }

    // ==========================================================================
    // ACTION: END IMPERSONATION
    // ==========================================================================
    if (action === 'end') {
      if (!sessionId) {
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'sessionId is required for end action',
          },
          requestId,
          status: 400,
        });
      }

      // Find session
      const impersonationSession = await prisma.impersonationSession.findUnique({
        where: { id: sessionId },
        include: {
          targetUser: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });

      if (!impersonationSession) {
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Impersonation session not found',
          },
          requestId,
          status: 404,
        });
      }

      // Verify ownership (only the admin who started can end)
      if (impersonationSession.adminId !== session.user.id) {
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'You can only end your own impersonation sessions',
          },
          requestId,
          status: 403,
        });
      }

      // Check if already ended
      if (impersonationSession.endedAt) {
        return createResponse(null, {
          success: false,
          error: {
            code: ERROR_CODES.CONFLICT,
            message: 'This impersonation session has already ended',
          },
          requestId,
          status: 409,
        });
      }

      // End session
      const now = new Date();
      const durationMinutes = Math.round(
        (now.getTime() - impersonationSession.startedAt.getTime()) / (1000 * 60)
      );

      await prisma.impersonationSession.update({
        where: { id: sessionId },
        data: { endedAt: now },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          targetUserId: impersonationSession.targetUserId,
          action: 'IMPERSONATION_ENDED',
          resourceType: 'USER',
          resourceId: impersonationSession.targetUserId,
          details: JSON.stringify({
            sessionId,
            durationMinutes,
          }),
          ipAddress: clientIp,
          userAgent,
          severity: 'INFO',
        },
      });

      const response: EndImpersonationResponse = {
        sessionId,
        endedAt: now.toISOString(),
        durationMinutes,
      };

      console.log(`[${requestId}] 🎭 Impersonation ended`, {
        adminId: session.user.id,
        sessionId,
        durationMinutes,
      });

      return createResponse(response, {
        success: true,
        message: 'Impersonation session ended',
        requestId,
      });
    }

    // Should never reach here due to zod validation
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid action',
      },
      requestId,
      status: 400,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/superadmin/impersonation error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Impersonation operation failed',
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