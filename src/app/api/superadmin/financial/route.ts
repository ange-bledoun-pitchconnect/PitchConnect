// src/app/api/superadmin/financial/route.ts
// SuperAdmin Financial Reports API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

// ============================================================================
// GET - Fetch Financial Reports
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // SuperAdmin check
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date ranges
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Unix epoch
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch financial data
    const [
      totalRevenue,
      monthlyRevenue,
      annualRevenue,
      activeSubscriptions,
      newSubscriptions,
      cancelledSubscriptions,
      payments,
    ] = await Promise.all([
      // Total revenue (all time active subscriptions)
      prisma.subscription.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { price: true },
      }),

      // Monthly revenue (active subscriptions with monthly billing)
      prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          interval: 'MONTHLY',
        },
        _sum: { price: true },
      }),

      // Annual revenue (active subscriptions with annual billing)
      prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          interval: 'ANNUAL',
        },
        _sum: { price: true },
      }),

      // Active subscriptions count
      prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),

      // New subscriptions this month
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),

      // Cancelled subscriptions this month
      prisma.subscription.count({
        where: {
          status: 'CANCELLED',
          canceledAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),

      // Recent payments (from audit logs or payment records)
      prisma.auditLog.findMany({
        where: {
          action: {
            in: ['SUBSCRIPTION_GRANTED', 'SUBSCRIPTION_EXTENDED', 'SUBSCRIPTION_CHANGED'],
          },
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Calculate derived metrics
    const totalActiveRevenue = (totalRevenue._sum.price || 0);
    const monthlyRevenueTotal = (monthlyRevenue._sum.price || 0);
    const annualRevenueTotal = (annualRevenue._sum.price || 0);

    // Calculate churn rate
    const churnRate =
      activeSubscriptions > 0
        ? ((cancelledSubscriptions / activeSubscriptions) * 100).toFixed(2)
        : 0;

    // Calculate ARPU (Average Revenue Per User)
    const arpu =
      activeSubscriptions > 0
        ? ((monthlyRevenueTotal / activeSubscriptions)).toFixed(2)
        : 0;

    // Calculate LTV (simplified: ARPU * 12 months)
    const ltv = (parseFloat(arpu.toString()) * 12).toFixed(2);

    // Payment success rate (simplified - would need actual payment data)
    const paymentSuccessRate = 96.8; // Mock for now

    // Get revenue data by month (last 5 months)
    const revenueData = [];
    for (let i = 4; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthRevenue = await prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: monthDate,
            lte: monthEnd,
          },
        },
        _sum: { price: true },
      });

      const monthSubs = await prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: monthDate,
            lte: monthEnd,
          },
        },
      });

      revenueData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue._sum.price || 0,
        subscriptions: monthSubs,
      });
    }

    // Format payment data
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      userName: payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : 'Unknown',
      userEmail: payment.user?.email || 'unknown@example.com',
      amount: 9.99, // Would come from actual payment data
      status: 'SUCCESS', // Would come from actual payment data
      date: payment.createdAt.toISOString(),
      method: 'card_****1234', // Would come from actual payment data
    }));

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalRevenue: totalActiveRevenue,
          monthlyRevenue: monthlyRevenueTotal,
          annualRevenue: annualRevenueTotal,
          activeSubscriptions,
          newSubscriptionsThisMonth: newSubscriptions,
          churnRate: parseFloat(churnRate.toString()),
          averageRevenuePerUser: parseFloat(arpu.toString()),
          lifetimeValue: parseFloat(ltv.toString()),
          paymentSuccessRate,
          pendingPayouts: 0, // Would come from payout tracking
        },
        revenueData,
        payments: formattedPayments.slice(0, 10), // Last 10 payments
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Financial GET Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Export route segment config
// ============================================================================
export const dynamic = 'force-dynamic';
export const revalidate = 0;