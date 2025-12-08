/**
 * ============================================================================
 * SUPERADMIN IMPERSONATE ROUTE - World-Class Audit & Security
 * ============================================================================
 *
 * @file src/app/api/superadmin/impersonate/route.ts
 * @description SuperAdmin user impersonation with comprehensive audit logging
 * @version 2.0.0 (Production-Ready)
 *
 * FEATURES:
 * ✅ Full TypeScript type safety
 * ✅ Schema-aligned field names & audit logging
 * ✅ Comprehensive authorization checks
 * ✅ Request validation & error handling
 * ✅ IP address & user agent tracking
 * ✅ Impersonation session creation
 * ✅ Detailed audit trail
 * ✅ Request ID tracking
 * ✅ Performance monitoring
 * ✅ JSDoc documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

interface ImpersonateRequest {
  targetUserId: string;
  reason?: string;
}

interface ImpersonateResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    impersonatingUser: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      roles: string[];
    };
    impersonatedAt: string;
    expiresAt: string;
  };
}

interface ErrorResponse {
  success: boolean;
  error: string;
  code: string;
  details?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const IMPERSONATION_SESSION_DURATION_HOURS = 24;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  return ip;
}

/**
 * Get user agent from request
 */
function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Validate request body
 */
function validateRequest(body: unknown): {
  isValid: boolean;
  data?: ImpersonateRequest;
  error?: string;
} {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: 'Invalid request body',
    };
  }

  const { targetUserId, reason } = body as Record<string, unknown>;

  if (!targetUserId || typeof targetUserId !== 'string') {
    return {
      isValid: false,
      error: 'targetUserId is required and must be a string',
    };
  }

  if (targetUserId.trim().length === 0) {
    return {
      isValid: false,
      error: 'targetUserId cannot be empty',
    };
  }

  if (reason && typeof reason !== 'string') {
    return {
      isValid: false,
      error: 'reason must be a string',
    };
  }

  return {
    isValid: true,
    data: {
      targetUserId: targetUserId.trim(),
      reason: reason ? (reason as string).trim() : undefined,
    },
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * POST /api/superadmin/impersonate
 *
 * SuperAdmin impersonates a user for support/debugging (With audit logging)
 *
 * Request body:
 * {
 *   "targetUserId": "user-id",
 *   "reason": "optional reason for impersonation"
 * }
 *
 * @param request NextRequest
 * @returns ImpersonateResponse on success, ErrorResponse on failure
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ImpersonateResponse | ErrorResponse>> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();
  const clientIp = getClientIp(request);
  const userAgent = getUserAgent(request);

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.warn('Unauthorized impersonate attempt - no session', { requestId, clientIp });
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: ERROR_CODES.UNAUTHORIZED,
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. VALIDATE SUPERADMIN ACCESS
    // ========================================================================

    const superAdmin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuperAdmin: true,
        roles: true,
      },
    });

    if (!superAdmin || (!superAdmin.isSuperAdmin && !superAdmin.roles.includes('SUPERADMIN'))) {
      console.warn('SuperAdmin authorization failed for impersonate', {
        requestId,
        email: session.user.email,
        clientIp,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'SuperAdmin access required',
          code: ERROR_CODES.FORBIDDEN,
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 3. PARSE & VALIDATE REQUEST BODY
    // ========================================================================

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.warn('Invalid JSON in impersonate request', { requestId });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: ERROR_CODES.INVALID_REQUEST,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { isValid, data: validatedData, error: validationError } = validateRequest(requestBody);

    if (!isValid || !validatedData) {
      console.warn('Request validation failed', {
        requestId,
        error: validationError,
      });
      return NextResponse.json(
        {
          success: false,
          error: validationError || 'Invalid request',
          code: ERROR_CODES.INVALID_REQUEST,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 4. VERIFY TARGET USER EXISTS
    // ========================================================================

    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.targetUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
      },
    });

    if (!targetUser) {
      console.warn('Target user not found for impersonation', {
        requestId,
        targetUserId: validatedData.targetUserId,
        superAdminId: superAdmin.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Target user not found',
          code: ERROR_CODES.NOT_FOUND,
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 5. PREVENT SELF-IMPERSONATION
    // ========================================================================

    if (superAdmin.id === targetUser.id) {
      console.warn('Self-impersonation attempt', {
        requestId,
        superAdminId: superAdmin.id,
        clientIp,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot impersonate yourself',
          code: ERROR_CODES.INVALID_REQUEST,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 6. CREATE IMPERSONATION SESSION & AUDIT LOG
    // ========================================================================

    const impersonatedAt = new Date();
    const expiresAt = new Date(impersonatedAt);
    expiresAt.setHours(expiresAt.getHours() + IMPERSONATION_SESSION_DURATION_HOURS);

    const [impersonationSession, auditLog] = await Promise.all([
      // Create impersonation session
      prisma.impersonationSession.create({
        data: {
          adminId: superAdmin.id,
          targetUserId: targetUser.id,
          startedAt: impersonatedAt,
          ipAddress: clientIp,
          userAgent: userAgent,
          reason: validatedData.reason,
        },
        select: {
          id: true,
          startedAt: true,
        },
      }),

      // Create audit log
      prisma.auditLog.create({
        data: {
          performedById: superAdmin.id,
          targetUserId: targetUser.id,
          action: 'USER_IMPERSONATED',
          entityType: 'USER',
          entityId: targetUser.id,
          details: JSON.stringify({
            reason: validatedData.reason || 'No reason provided',
            impersonationDuration: `${IMPERSONATION_SESSION_DURATION_HOURS} hours`,
          }),
          ipAddress: clientIp,
          userAgent: userAgent,
          severity: 'CRITICAL',
        },
        select: {
          id: true,
        },
      }),
    ]);

    // ========================================================================
    // 7. BUILD RESPONSE
    // ========================================================================

    const superAdminName = `${superAdmin.firstName || ''} ${superAdmin.lastName || ''}`.trim();
    const targetUserName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim();

    const response: ImpersonateResponse = {
      success: true,
      message: `SuperAdmin ${superAdminName} is now impersonating ${targetUserName}`,
      data: {
        sessionId: impersonationSession.id,
        impersonatingUser: {
          id: targetUser.id,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          roles: targetUser.roles,
        },
        impersonatedAt: impersonatedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
    };

    // ========================================================================
    // 8. LOG & RESPOND
    // ========================================================================

    const duration = performance.now() - startTime;

    console.log('🎭 Impersonation session created successfully', {
      requestId,
      superAdminId: superAdmin.id,
      superAdminEmail: superAdmin.email,
      superAdminName,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      targetUserName,
      sessionId: impersonationSession.id,
      auditLogId: auditLog.id,
      reason: validatedData.reason || 'No reason provided',
      clientIp,
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;

    console.error('Impersonation error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      clientIp,
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create impersonation session',
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
