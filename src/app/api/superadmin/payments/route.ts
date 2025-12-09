/**
 * SuperAdmin Payments API
 * Path: /src/app/api/superadmin/payments/route.ts
 * 
 * Core Features:
 * - List all payments with advanced filtering
 * - Process refunds via Stripe
 * - Create manual payment entries
 * - Payment analytics and summaries
 * 
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
// STRIPE INITIALIZATION (Lazy Loading)
// ============================================================================

/**
 * Get Stripe instance lazily
 * Only initializes when needed, avoiding build-time errors
 */
function getStripeInstance() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeKey) {
    console.warn('[SuperAdmin] Stripe API key not configured');
    return null;
  }

  try {
    const Stripe = require('stripe').default;
    return new Stripe(stripeKey, {
      apiVersion: '2024-11-20' as any,
    });
  } catch (error) {
    console.error('[SuperAdmin] Failed to initialize Stripe:', error);
    return null;
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface PaymentSummary {
  totalAmount: number;
  completedCount: number;
  failedCount: number;
  refundedCount: number;
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
  subscriptionTier?: string;
  stripePaymentIntentId: string | null;
  stripeInvoiceId: string | null;
  invoiceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ============================================================================
// GET HANDLER - List Payments
// ============================================================================

/**
 * GET /api/superadmin/payments
 * List all payments with advanced filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Verify SuperAdmin session
    const admin = await checkSuperAdminSession();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status) {
      const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED', 'CANCELLED'];
      if (validStatuses.includes(status)) {
        filter.status = status;
      }
    }
    if (userId) filter.userId = userId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.lte = new Date(dateTo);
    }

    // Fetch payments with related data
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where: filter,
        include: {
          subscription: { select: { tier: true } },
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

    // Log access to audit trail
    await createAuditLog(
      admin.id,
      null,
      'DATA_EXPORTED',
      {
        action: 'payments_list_accessed',
        filters: { status, userId },
        resultCount: payments.length,
        page,
        limit,
      }
    );

    // Calculate summary
    const summary: PaymentSummary = {
      totalAmount: payments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0
      ),
      completedCount: payments.filter((p) => p.status === 'COMPLETED').length,
      failedCount: payments.filter((p) => p.status === 'FAILED').length,
      refundedCount: payments.filter((p) => p.status === 'REFUNDED').length,
    };

    return NextResponse.json(
      {
        success: true,
        data: payments.map((payment): PaymentResponse => ({
          id: payment.id,
          userId: payment.userId,
          user: payment.user,
          amount: parseFloat(payment.amount.toString()),
          currency: payment.currency,
          status: payment.status,
          subscriptionTier: payment.subscription?.tier,
          stripePaymentIntentId: payment.stripePaymentIntentId,
          stripeInvoiceId: payment.stripeInvoiceId,
          invoiceUrl: payment.invoiceUrl,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        } as PaginationInfo,
        summary,
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] Payments GET error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER - Process Refunds & Manual Entries
// ============================================================================

/**
 * POST /api/superadmin/payments
 * Process refunds or create manual payment entries
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required (refund or manual_entry)' },
        { status: 400 }
      );
    }

    // ========================================================================
    // ACTION: REFUND
    // ========================================================================
    if (action === 'refund') {
      const { paymentId, amount, reason, sendEmail = true } = body;

      // Validate inputs
      if (!paymentId || !reason) {
        return NextResponse.json(
          { success: false, error: 'paymentId and reason are required' },
          { status: 400 }
        );
      }

      // Fetch payment
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
          { success: false, error: 'Payment not found' },
          { status: 404 }
        );
      }

      // Validate payment status
      if (payment.status !== 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Only completed payments can be refunded' },
          { status: 400 }
        );
      }

      // Check if Stripe ID exists
      if (!payment.stripePaymentIntentId) {
        // Handle non-Stripe refund (manual entry)
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'REFUNDED',
            updatedAt: new Date(),
          },
        });

        await createAuditLog(
          admin.id,
          payment.userId,
          'PAYMENT_REFUNDED',
          {
            paymentId,
            amount: amount || payment.amount.toString(),
            reason,
            refundType: 'manual_refund',
            sendEmail,
          }
        );

        return NextResponse.json(
          {
            success: true,
            message: 'Refund processed successfully (manual)',
            data: {
              paymentId,
              amount: (amount || parseFloat(payment.amount.toString())) / 100,
              currency: payment.currency.toUpperCase(),
              status: 'REFUNDED',
            },
            timestamp: new Date(),
          },
          { status: 200 }
        );
      }

      // Process Stripe refund
      const stripe = getStripeInstance();
      if (!stripe) {
        return NextResponse.json(
          { success: false, error: 'Stripe not configured' },
          { status: 400 }
        );
      }

      try {
        const refund = await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: amount ? Math.round(amount) : undefined,
          reason: 'requested_by_customer',
          metadata: {
            admin_id: admin.id,
            reason,
            timestamp: new Date().toISOString(),
          },
        });

        // Update payment status
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'REFUNDED',
            updatedAt: new Date(),
          },
        });

        // Log to audit trail
        await createAuditLog(
          admin.id,
          payment.userId,
          'PAYMENT_REFUNDED',
          {
            paymentId,
            amount: amount || payment.amount.toString(),
            reason,
            stripeRefundId: refund.id,
            refundType: 'stripe_refund',
            sendEmail,
          }
        );

        return NextResponse.json(
          {
            success: true,
            message: 'Refund processed successfully via Stripe',
            data: {
              refundId: refund.id,
              paymentId,
              amount: (amount || parseFloat(payment.amount.toString())) / 100,
              currency: payment.currency.toUpperCase(),
              stripeRefundId: refund.id,
              status: 'REFUNDED',
            },
            timestamp: new Date(),
          },
          { status: 200 }
        );
      } catch (stripeError) {
        console.error('[SuperAdmin] Stripe refund error:', stripeError);
        return NextResponse.json(
          {
            success: false,
            error:
              stripeError instanceof Error
                ? stripeError.message
                : 'Stripe refund failed',
          },
          { status: 400 }
        );
      }
    }

    // ========================================================================
    // ACTION: MANUAL ENTRY
    // ========================================================================
    else if (action === 'manual_entry') {
      const {
        userId,
        amount,
        currency = 'GBP',
        paymentType = 'SUBSCRIPTION',
        description,
        status = 'COMPLETED',
      } = body;

      // Validate inputs
      if (!userId || !amount) {
        return NextResponse.json(
          { success: false, error: 'userId and amount are required' },
          { status: 400 }
        );
      }

      if (amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Amount must be greater than 0' },
          { status: 400 }
        );
      }

      // Verify user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Create payment entry
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: Math.round(amount * 100),
          currency: currency.toUpperCase(),
          status,
          paymentType: paymentType as any,
        },
      });

      // Log to audit trail
      await createAuditLog(
        admin.id,
        userId,
        'PAYMENT_REFUNDED',
        {
          action: 'manual_payment_entry',
          paymentId: payment.id,
          amount,
          currency,
          paymentType,
          description,
          status,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Manual payment entry created successfully',
          data: {
            id: payment.id,
            userId,
            amount,
            currency,
            paymentType,
            status,
            createdAt: payment.createdAt,
          },
        },
        { status: 201 }
      );
    }

    // Invalid action
    else {
      return NextResponse.json(
        { success: false, error: 'Invalid action (refund or manual_entry)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[SuperAdmin] Payments POST error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
