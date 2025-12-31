// =============================================================================
// 💰 SUPERADMIN PAYMENTS API - Enterprise-Grade with Stripe
// =============================================================================
// GET  /api/superadmin/payments - List payments with filtering
// POST /api/superadmin/payments - Process refunds & manual entries
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Stripe integration, refunds, manual entries, audit logging
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PaymentStatus, PaymentType, Prisma } from '@prisma/client';

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

interface PaymentRecord {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  amount: number;
  currency: string;
  status: string;
  paymentType: string;
  subscriptionTier: string | null;
  stripePaymentIntentId: string | null;
  stripeInvoiceId: string | null;
  invoiceUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaymentSummary {
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  refundedAmount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  averageAmount: number;
}

interface PaymentsResponse {
  payments: PaymentRecord[];
  summary: PaymentSummary;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

const VALID_STATUSES: PaymentStatus[] = [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
];

// =============================================================================
// STRIPE LAZY LOADING
// =============================================================================

let stripeInstance: any = null;

/**
 * Get Stripe instance lazily to avoid build-time errors
 */
function getStripe(): any {
  if (stripeInstance) return stripeInstance;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.warn('[Payments] Stripe API key not configured');
    return null;
  }

  try {
    const Stripe = require('stripe').default;
    stripeInstance = new Stripe(stripeKey, {
      apiVersion: '2024-11-20',
      timeout: 30000,
      maxNetworkRetries: 3,
    });
    return stripeInstance;
  } catch (error) {
    console.error('[Payments] Failed to initialize Stripe:', error);
    return null;
  }
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetPaymentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']).optional(),
  userId: z.string().cuid().optional(),
  paymentType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
});

const RefundSchema = z.object({
  action: z.literal('refund'),
  paymentId: z.string().cuid(),
  amount: z.number().positive().optional(), // Partial refund amount
  reason: z.string().min(1).max(500),
  sendEmail: z.boolean().default(true),
});

const ManualEntrySchema = z.object({
  action: z.literal('manual_entry'),
  userId: z.string().cuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('GBP'),
  paymentType: z.enum(['SUBSCRIPTION', 'ONE_TIME', 'COACH_PAYMENT', 'REFUND', 'OTHER']).default('OTHER'),
  description: z.string().max(500).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).default('COMPLETED'),
});

const PostPaymentSchema = z.discriminatedUnion('action', [
  RefundSchema,
  ManualEntrySchema,
]);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
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
      'Cache-Control': 'private, no-cache',
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

  if (!user) return { isValid: false };
  const isValid = user.isSuperAdmin || user.roles.includes('SUPERADMIN');
  return { isValid, user };
}

/**
 * Convert cents to currency units
 */
function centsToUnits(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Convert currency units to cents
 */
function unitsToCents(units: number): number {
  return Math.round(units * 100);
}

// =============================================================================
// GET HANDLER - List Payments
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

    const validation = GetPaymentsSchema.safeParse(rawParams);
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
    const where: Prisma.PaymentWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.paymentType) {
      where.paymentType = params.paymentType as PaymentType;
    }

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) {
        where.createdAt.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        const dateTo = new Date(params.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        where.createdAt.lte = dateTo;
      }
    }

    if (params.minAmount !== undefined || params.maxAmount !== undefined) {
      where.amount = {};
      if (params.minAmount !== undefined) {
        where.amount.gte = unitsToCents(params.minAmount);
      }
      if (params.maxAmount !== undefined) {
        where.amount.lte = unitsToCents(params.maxAmount);
      }
    }

    // 5. Fetch payments
    const offset = (params.page - 1) * params.limit;

    const [payments, total, aggregates] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          subscription: {
            select: { tier: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: params.limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({
        by: ['status'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // 6. Calculate summary
    const summary: PaymentSummary = {
      totalAmount: 0,
      completedAmount: 0,
      pendingAmount: 0,
      refundedAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
      refundedCount: 0,
      averageAmount: 0,
    };

    aggregates.forEach(agg => {
      const amount = centsToUnits(agg._sum.amount || 0);
      summary.totalAmount += amount;

      switch (agg.status) {
        case 'COMPLETED':
          summary.completedAmount = amount;
          summary.completedCount = agg._count;
          break;
        case 'PENDING':
          summary.pendingAmount = amount;
          summary.pendingCount = agg._count;
          break;
        case 'FAILED':
          summary.failedCount = agg._count;
          break;
        case 'REFUNDED':
          summary.refundedAmount = amount;
          summary.refundedCount = agg._count;
          break;
      }
    });

    summary.averageAmount = total > 0 ? Math.round((summary.totalAmount / total) * 100) / 100 : 0;

    // 7. Transform payments
    const transformedPayments: PaymentRecord[] = payments.map(p => ({
      id: p.id,
      userId: p.userId,
      user: {
        id: p.user.id,
        email: p.user.email,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
      },
      amount: centsToUnits(p.amount),
      currency: p.currency,
      status: p.status,
      paymentType: p.paymentType,
      subscriptionTier: p.subscription?.tier || null,
      stripePaymentIntentId: p.stripePaymentIntentId,
      stripeInvoiceId: p.stripeInvoiceId,
      invoiceUrl: p.invoiceUrl,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DATA_EXPORTED',
        resourceType: 'PAYMENT',
        resourceId: 'payments_list',
        details: JSON.stringify({
          filters: { status: params.status, userId: params.userId },
          resultCount: transformedPayments.length,
          page: params.page,
        }),
        severity: 'INFO',
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Payments listed`, {
      adminId: session.user.id,
      total,
      returned: transformedPayments.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse<PaymentsResponse>({ payments: transformedPayments, summary }, {
      success: true,
      requestId,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasMore: offset + payments.length < total,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/payments error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to fetch payments' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Refunds & Manual Entries
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

    const validation = PostPaymentSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Validation failed' },
        requestId,
        status: 400,
      });
    }

    const params = validation.data;

    // ==========================================================================
    // REFUND ACTION
    // ==========================================================================
    if (params.action === 'refund') {
      const payment = await prisma.payment.findUnique({
        where: { id: params.paymentId },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (!payment) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Payment not found' },
          requestId,
          status: 404,
        });
      }

      if (payment.status !== 'COMPLETED') {
        return createResponse(null, {
          success: false,
          error: { 
            code: ERROR_CODES.VALIDATION_ERROR, 
            message: `Cannot refund payment with status "${payment.status}". Only COMPLETED payments can be refunded.` 
          },
          requestId,
          status: 400,
        });
      }

      const refundAmountCents = params.amount 
        ? unitsToCents(params.amount) 
        : payment.amount;
      
      const refundAmountUnits = centsToUnits(refundAmountCents);

      // Process Stripe refund if applicable
      if (payment.stripePaymentIntentId) {
        const stripe = getStripe();
        if (!stripe) {
          return createResponse(null, {
            success: false,
            error: { 
              code: ERROR_CODES.STRIPE_ERROR, 
              message: 'Stripe is not configured',
              details: 'Set STRIPE_SECRET_KEY in environment variables',
            },
            requestId,
            status: 400,
          });
        }

        try {
          const stripeRefund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            amount: refundAmountCents,
            reason: 'requested_by_customer',
            metadata: {
              admin_id: session.user.id,
              admin_email: adminUser.email,
              reason: params.reason,
              request_id: requestId,
            },
          });

          // Update payment status
          await prisma.payment.update({
            where: { id: params.paymentId },
            data: { 
              status: 'REFUNDED',
              updatedAt: new Date(),
            },
          });

          // Create audit log
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              targetUserId: payment.userId,
              action: 'PAYMENT_REFUNDED',
              resourceType: 'PAYMENT',
              resourceId: payment.id,
              details: JSON.stringify({
                amount: refundAmountUnits,
                currency: payment.currency,
                reason: params.reason,
                stripeRefundId: stripeRefund.id,
                refundType: 'stripe',
              }),
              severity: 'WARNING',
            },
          });

          const duration = performance.now() - startTime;

          return createResponse({
            refundId: stripeRefund.id,
            paymentId: payment.id,
            amount: refundAmountUnits,
            currency: payment.currency,
            status: 'REFUNDED',
            refundType: 'stripe',
          }, {
            success: true,
            message: 'Stripe refund processed successfully',
            requestId,
          });
        } catch (stripeError: any) {
          console.error(`[${requestId}] Stripe refund failed:`, stripeError);
          return createResponse(null, {
            success: false,
            error: { 
              code: ERROR_CODES.STRIPE_ERROR, 
              message: `Stripe refund failed: ${stripeError.message}`,
            },
            requestId,
            status: 400,
          });
        }
      }

      // Manual refund (no Stripe)
      await prisma.payment.update({
        where: { id: params.paymentId },
        data: { 
          status: 'REFUNDED',
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          targetUserId: payment.userId,
          action: 'PAYMENT_REFUNDED',
          resourceType: 'PAYMENT',
          resourceId: payment.id,
          details: JSON.stringify({
            amount: refundAmountUnits,
            currency: payment.currency,
            reason: params.reason,
            refundType: 'manual',
          }),
          severity: 'WARNING',
        },
      });

      return createResponse({
        paymentId: payment.id,
        amount: refundAmountUnits,
        currency: payment.currency,
        status: 'REFUNDED',
        refundType: 'manual',
      }, {
        success: true,
        message: 'Manual refund processed successfully',
        requestId,
      });
    }

    // ==========================================================================
    // MANUAL ENTRY ACTION
    // ==========================================================================
    if (params.action === 'manual_entry') {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!user) {
        return createResponse(null, {
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' },
          requestId,
          status: 404,
        });
      }

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          userId: params.userId,
          amount: unitsToCents(params.amount),
          currency: params.currency.toUpperCase(),
          status: params.status,
          paymentType: params.paymentType,
          description: params.description || `Manual entry by ${adminUser.email}`,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          targetUserId: params.userId,
          action: 'PAYMENT_CREATED',
          resourceType: 'PAYMENT',
          resourceId: payment.id,
          details: JSON.stringify({
            amount: params.amount,
            currency: params.currency,
            paymentType: params.paymentType,
            status: params.status,
            description: params.description,
            entryType: 'manual',
          }),
          severity: 'INFO',
        },
      });

      const duration = performance.now() - startTime;

      return createResponse({
        id: payment.id,
        userId: params.userId,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        amount: params.amount,
        currency: params.currency,
        paymentType: params.paymentType,
        status: params.status,
        createdAt: payment.createdAt.toISOString(),
      }, {
        success: true,
        message: 'Manual payment entry created successfully',
        requestId,
        status: 201,
      });
    }

    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid action' },
      requestId,
      status: 400,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/superadmin/payments error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to process payment' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';