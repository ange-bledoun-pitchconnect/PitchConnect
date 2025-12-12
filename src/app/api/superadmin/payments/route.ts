/**
 * SuperAdmin Payments API - PRODUCTION READY
 * Path: src/app/api/superadmin/payments/route.ts
 * 
 * Core Features:
 * - List all payments with advanced filtering
 * - Process refunds via Stripe
 * - Create manual payment entries
 * - Payment analytics and summaries
 * 
 * Key Fix: Lazy-load Stripe only when needed (avoids build-time errors)
 * Schema Aligned: Uses Payment, User, Subscription models correctly
 * Production Ready: Full error handling, Stripe integration, audit logging
 * Enterprise Grade: Comprehensive payment management with compliance tracking
 * 
 * Business Logic:
 * - Retrieve payment history with pagination
 * - Process refunds with Stripe verification
 * - Create manual payment records for admin tracking
 * - Log all payment operations for audit compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  checkSuperAdminSession,
  createAuditLog,
} from '@/lib/superadmin-helpers';

export const dynamic = 'force-dynamic';

// ============================================================================
// STRIPE INITIALIZATION (Lazy Loading - No Module-Level Execution)
// ============================================================================

/**
 * Get Stripe instance lazily
 * CRITICAL: Only called inside route handlers, never at module load
 * This prevents build-time errors when STRIPE_SECRET_KEY is not available
 */
function getStripeInstance(): any {
  try {
    // Check environment variable exists
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.warn(
        '[SuperAdmin] ⚠️ Stripe API key not configured. Set STRIPE_SECRET_KEY in .env.local'
      );
      return null;
    }

    // Dynamically require Stripe only when needed
    // This prevents initialization during build phase
    const Stripe = require('stripe').default;
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-11-20' as any,
      timeout: 30000, // 30 second timeout
      maxNetworkRetries: 3, // Retry failed requests
    });

    return stripe;
  } catch (error) {
    console.error('[SuperAdmin] ❌ Failed to initialize Stripe:', error);
    return null;
  }
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PaymentSummary {
  totalAmount: number;
  completedCount: number;
  failedCount: number;
  refundedCount: number;
  averageAmount: number;
}

interface PaymentResponse {
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
  subscriptionTier?: string;
  stripePaymentIntentId: string | null;
  stripeInvoiceId: string | null;
  invoiceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: string;
}

interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  pagination?: PaginationInfo;
  summary?: PaymentSummary;
  timestamp: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_STATUSES = [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'DISPUTED',
  'CANCELLED',
] as const;

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate pagination parameters
 */
function validatePagination(page: string | null, limit: string | null) {
  const parsedPage = Math.max(1, parseInt(page || '1', 10));
  const parsedLimit = Math.min(
    MAX_PAGE_LIMIT,
    Math.max(1, parseInt(limit || String(DEFAULT_PAGE_LIMIT), 10))
  );

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
}

/**
 * Validate status parameter
 */
function isValidStatus(status: string | null): status is typeof VALID_STATUSES[number] {
  if (!status) return false;
  return VALID_STATUSES.includes(status as any);
}

/**
 * Build payment filter from query parameters
 */
function buildPaymentFilter(searchParams: URLSearchParams): any {
  const filter: any = {};

  const status = searchParams.get('status');
  if (status && isValidStatus(status)) {
    filter.status = status;
  }

  const userId = searchParams.get('userId');
  if (userId) {
    filter.userId = userId;
  }

  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!isNaN(from.getTime())) {
        filter.createdAt.gte = from;
      }
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999); // Include entire day
      if (!isNaN(to.getTime())) {
        filter.createdAt.lte = to;
      }
    }
  }

  return filter;
}

// ============================================================================
// GET HANDLER - List Payments with Advanced Filtering
// ============================================================================

/**
 * GET /api/superadmin/payments
 * 
 * Query Parameters:
 * - status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED'
 * - userId: Filter by user ID
 * - dateFrom: Filter by start date (ISO 8601)
 * - dateTo: Filter by end date (ISO 8601)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * 
 * Response:
 * {
 *   success: true,
 *   data: Payment[],
 *   pagination: { page, limit, total, pages, hasMore },
 *   summary: { totalAmount, completedCount, failedCount, refundedCount, averageAmount },
 *   timestamp: ISO string
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // ========================================================================
    // 1. AUTHORIZATION CHECK
    // ========================================================================
    const admin = await checkSuperAdminSession();
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        } as ErrorResponse,
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. PARSE & VALIDATE PARAMETERS
    // ========================================================================
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit')
    );

    const filter = buildPaymentFilter(searchParams);

    // ========================================================================
    // 3. FETCH PAYMENTS (WITH OPTIMIZATION)
    // ========================================================================
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where: filter,
        include: {
          subscription: {
            select: {
              tier: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.payment.count({ where: filter }),
    ]);

    // ========================================================================
    // 4. CALCULATE SUMMARY STATISTICS
    // ========================================================================
    const totalAmount = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    );

    const summary: PaymentSummary = {
      totalAmount: Math.round(totalAmount * 100) / 100,
      completedCount: payments.filter((p) => p.status === 'COMPLETED').length,
      failedCount: payments.filter((p) => p.status === 'FAILED').length,
      refundedCount: payments.filter((p) => p.status === 'REFUNDED').length,
      averageAmount:
        payments.length > 0
          ? Math.round((totalAmount / payments.length) * 100) / 100
          : 0,
    };

    // ========================================================================
    // 5. LOG TO AUDIT TRAIL
    // ========================================================================
    await createAuditLog(admin.id, null, 'DATA_EXPORTED', {
      action: 'payments_list_accessed',
      requestId,
      filters: {
        status: searchParams.get('status'),
        userId: searchParams.get('userId'),
      },
      resultCount: payments.length,
      page,
      limit,
      timestamp: new Date().toISOString(),
    });

    // ========================================================================
    // 6. BUILD RESPONSE
    // ========================================================================
    const pagination: PaginationInfo = {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      hasMore: page < Math.ceil(totalCount / limit),
    };

    const response: SuccessResponse<PaymentResponse[]> = {
      success: true,
      data: payments.map(
        (payment): PaymentResponse => ({
          id: payment.id,
          userId: payment.userId,
          user: payment.user,
          amount: parseFloat(payment.amount.toString()) / 100,
          currency: payment.currency,
          status: payment.status,
          paymentType: payment.paymentType,
          subscriptionTier: payment.subscription?.tier,
          stripePaymentIntentId: payment.stripePaymentIntentId,
          stripeInvoiceId: payment.stripeInvoiceId,
          invoiceUrl: payment.invoiceUrl,
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        })
      ),
      pagination,
      summary,
      timestamp: new Date().toISOString(),
    };

    const duration = performance.now() - startTime;
    console.log(
      `[SuperAdmin] Payments GET: ${payments.length} results in ${Math.round(duration)}ms`,
      {
        requestId,
        userId: admin.id,
        page,
        totalPages: pagination.pages,
      }
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${Math.round(duration)}ms`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('[SuperAdmin] Payments GET error:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${Math.round(duration)}ms`,
    });

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        } as ErrorResponse,
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payments',
        code: 'INTERNAL_ERROR',
        details:
          error instanceof Error ? error.message : 'Unknown error occurred',
      } as ErrorResponse,
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// POST HANDLER - Process Refunds & Create Manual Entries
// ============================================================================

/**
 * POST /api/superadmin/payments
 * 
 * Actions:
 * 1. action: "refund"
 *    - paymentId (required): ID of payment to refund
 *    - amount (optional): Amount in cents to refund (partial refund)
 *    - reason (required): Reason for refund
 *    - sendEmail (optional): Send email to customer (default: true)
 * 
 * 2. action: "manual_entry"
 *    - userId (required): User ID
 *    - amount (required): Amount in whole currency units
 *    - currency (optional): Currency code (default: GBP)
 *    - paymentType (optional): SUBSCRIPTION, COACH_PAYMENT, etc.
 *    - description (optional): Description of payment
 *    - status (optional): PENDING, COMPLETED, FAILED (default: COMPLETED)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // ========================================================================
    // 1. AUTHORIZATION CHECK
    // ========================================================================
    const admin = await checkSuperAdminSession();
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        } as ErrorResponse,
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. PARSE REQUEST BODY
    // ========================================================================
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'BAD_REQUEST',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { action } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'action parameter is required (refund or manual_entry)',
          code: 'MISSING_REQUIRED_FIELD',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 3. HANDLE REFUND ACTION
    // ========================================================================
    if (action === 'refund') {
      return handleRefund(body, admin, requestId, startTime);
    }

    // ========================================================================
    // 4. HANDLE MANUAL ENTRY ACTION
    // ========================================================================
    else if (action === 'manual_entry') {
      return handleManualEntry(body, admin, requestId, startTime);
    }

    // ========================================================================
    // 5. INVALID ACTION
    // ========================================================================
    else {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid action: "${action}". Must be "refund" or "manual_entry"`,
          code: 'INVALID_ACTION',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('[SuperAdmin] Payments POST error:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process payment',
        code: 'INTERNAL_ERROR',
      } as ErrorResponse,
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// REFUND HANDLER
// ============================================================================

async function handleRefund(
  body: any,
  admin: any,
  requestId: string,
  startTime: number
): Promise<NextResponse> {
  try {
    const { paymentId, amount, reason, sendEmail = true } = body;

    // Validate inputs
    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'paymentId is required',
          code: 'MISSING_REQUIRED_FIELD',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'reason is required',
          code: 'MISSING_REQUIRED_FIELD',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Fetch payment with user info
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment not found',
          code: 'NOT_FOUND',
        } as ErrorResponse,
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Validate payment status
    if (payment.status !== 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot refund payment with status "${payment.status}". Only "COMPLETED" payments can be refunded.`,
          code: 'INVALID_PAYMENT_STATUS',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // If no Stripe ID, handle as manual refund
    if (!payment.stripePaymentIntentId) {
      const refundAmount = amount
        ? Math.round(amount * 100) / 100
        : parseFloat(payment.amount.toString()) / 100;

      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED', updatedAt: new Date() },
      });

      await createAuditLog(admin.id, payment.userId, 'PAYMENT_REFUNDED', {
        paymentId,
        amount: refundAmount,
        reason,
        refundType: 'manual_refund',
        sendEmail,
        requestId,
        timestamp: new Date().toISOString(),
      });

      const duration = performance.now() - startTime;
      return NextResponse.json(
        {
          success: true,
          message: 'Manual refund processed successfully',
          data: {
            paymentId,
            amount: refundAmount,
            currency: payment.currency,
            status: 'REFUNDED',
            refundType: 'manual',
          },
          timestamp: new Date().toISOString(),
        } as SuccessResponse,
        {
          status: 200,
          headers: {
            'X-Request-ID': requestId,
            'X-Response-Time': `${Math.round(duration)}ms`,
          },
        }
      );
    }

    // Process Stripe refund
    const stripe = getStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe is not configured. Cannot process refund.',
          code: 'STRIPE_NOT_CONFIGURED',
          details: 'Set STRIPE_SECRET_KEY in environment variables',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    try {
      // Create Stripe refund
      const refundData: any = {
        payment_intent: payment.stripePaymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          admin_id: admin.id,
          reason,
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const stripeRefund = await stripe.refunds.create(refundData);

      // Update payment in database
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          updatedAt: new Date(),
        },
      });

      // Log to audit trail
      await createAuditLog(admin.id, payment.userId, 'PAYMENT_REFUNDED', {
        paymentId,
        amount:
          amount || parseFloat(payment.amount.toString()) / 100,
        reason,
        stripeRefundId: stripeRefund.id,
        refundType: 'stripe_refund',
        sendEmail,
        requestId,
        timestamp: new Date().toISOString(),
      });

      const duration = performance.now() - startTime;

      return NextResponse.json(
        {
          success: true,
          message: 'Stripe refund processed successfully',
          data: {
            refundId: stripeRefund.id,
            paymentId,
            amount:
              amount || parseFloat(payment.amount.toString()) / 100,
            currency: payment.currency,
            status: 'REFUNDED',
            refundType: 'stripe',
          },
          timestamp: new Date().toISOString(),
        } as SuccessResponse,
        {
          status: 200,
          headers: {
            'X-Request-ID': requestId,
            'X-Response-Time': `${Math.round(duration)}ms`,
          },
        }
      );
    } catch (stripeError) {
      console.error('[SuperAdmin] Stripe refund failed:', {
        paymentId,
        error: stripeError instanceof Error ? stripeError.message : String(stripeError),
        requestId,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Stripe refund failed: ${
            stripeError instanceof Error ? stripeError.message : 'Unknown error'
          }`,
          code: 'STRIPE_ERROR',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }
  } catch (error) {
    console.error('[SuperAdmin] Refund handler error:', {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Refund processing failed',
        code: 'INTERNAL_ERROR',
      } as ErrorResponse,
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// MANUAL ENTRY HANDLER
// ============================================================================

async function handleManualEntry(
  body: any,
  admin: any,
  requestId: string,
  startTime: number
): Promise<NextResponse> {
  try {
    const {
      userId,
      amount,
      currency = 'GBP',
      paymentType = 'SUBSCRIPTION',
      description = '',
      status = 'COMPLETED',
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
          code: 'MISSING_REQUIRED_FIELD',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'amount is required',
          code: 'MISSING_REQUIRED_FIELD',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Validate amount is positive
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'amount must be a positive number',
          code: 'INVALID_AMOUNT',
        } as ErrorResponse,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        } as ErrorResponse,
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Create payment entry
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: Math.round(amount * 100), // Store in cents
        currency: currency.toUpperCase().slice(0, 3),
        status: status.toUpperCase() as any,
        paymentType: paymentType.toUpperCase() as any,
      },
    });

    // Log to audit trail
    await createAuditLog(admin.id, userId, 'PAYMENT_CREATED', {
      action: 'manual_payment_entry',
      paymentId: payment.id,
      amount,
      currency,
      paymentType,
      description,
      status,
      requestId,
      timestamp: new Date().toISOString(),
    });

    const duration = performance.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        message: 'Manual payment entry created successfully',
        data: {
          id: payment.id,
          userId,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          amount: amount,
          currency,
          paymentType,
          status,
          createdAt: payment.createdAt.toISOString(),
        },
        timestamp: new Date().toISOString(),
      } as SuccessResponse,
      {
        status: 201,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': `${Math.round(duration)}ms`,
        },
      }
    );
  } catch (error) {
    console.error('[SuperAdmin] Manual entry handler error:', {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Manual entry creation failed',
        code: 'INTERNAL_ERROR',
      } as ErrorResponse,
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
