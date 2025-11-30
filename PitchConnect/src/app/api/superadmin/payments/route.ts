// src/app/api/superadmin/payments/route.ts
/**
 * SuperAdmin Payments API
 * GET  - List all payments with filtering
 * POST - Process refunds, manual payment entries
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  checkSuperAdminSession,
  createAuditLog,
} from '@/lib/superadmin-helpers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20' as any,
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.lte = new Date(dateTo);
    }

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

    await createAuditLog(
      admin.id,
      null,
      'DATA_EXPORTED',
      {
        action: 'payments_list_accessed',
        filters: { status, userId },
        resultCount: payments.length,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: payments.map((payment) => ({
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
        },
        summary: {
          totalAmount: payments.reduce(
            (sum, p) => sum + parseFloat(p.amount.toString()),
            0
          ),
          completedCount: payments.filter((p) => p.status === 'COMPLETED')
            .length,
          failedCount: payments.filter((p) => p.status === 'FAILED').length,
          refundedCount: payments.filter((p) => p.status === 'REFUNDED')
            .length,
        },
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

export async function POST(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    if (action === 'refund') {
      const { paymentId, amount, reason, sendEmail = true } = body;

      if (!paymentId) {
        return NextResponse.json(
          { success: false, error: 'paymentId is required' },
          { status: 400 }
        );
      }

      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'reason is required' },
          { status: 400 }
        );
      }

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

      if (payment.status !== 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Only completed payments can be refunded' },
          { status: 400 }
        );
      }

      if (!payment.stripePaymentIntentId) {
        return NextResponse.json(
          { success: false, error: 'Payment has no Stripe Payment Intent ID' },
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
            stripeRefundId: refund.id,
            sendEmail,
          }
        );

        return NextResponse.json(
          {
            success: true,
            message: 'Refund processed successfully',
            data: {
              refundId: refund.id,
              paymentId,
              amount: (amount || payment.amount) / 100,
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

    else if (action === 'manual_entry') {
      const {
        userId,
        amount,
        currency = 'gbp',
        description,
        status = 'COMPLETED',
      } = body;

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

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: Math.round(amount * 100),
          currency,
          status,
        },
      });

      await createAuditLog(
        admin.id,
        userId,
        'PAYMENT_REFUNDED',
        {
          action: 'manual_payment_entry',
          paymentId: payment.id,
          amount: amount,
          currency,
          description,
          status,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Payment entry created',
          data: {
            id: payment.id,
            userId,
            amount,
            currency,
            status,
            createdAt: payment.createdAt,
          },
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
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