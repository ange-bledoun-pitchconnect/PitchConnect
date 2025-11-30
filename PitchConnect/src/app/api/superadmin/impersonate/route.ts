/**
 * ============================================================================
 * Nsrc/app/api/superadmin/impersonate/route.ts
 * SuperAdmin User Impersonation API
 * Allows SuperAdmin to view system as another user
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    console.log('\n💰 ===== FETCHING FINANCIAL DATA =====');
    console.log('📊 Range:', range);

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
        startDate = new Date(0);
        break;
    }

    // 1. TOTAL REVENUE (from all completed payments)
    // FIXED: Changed SUCCESS → COMPLETED
    const allPayments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
      },
      select: {
        amount: true,
        createdAt: true,
      },
    }).catch(() => []);

    const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
    console.log('✅ Total Revenue:', totalRevenue);

    // 2. REVENUE IN SELECTED RANGE
    // FIXED: Changed SUCCESS → COMPLETED
    const rangePayments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    }).catch(() => []);

    const rangeRevenue = rangePayments.reduce((sum, payment) => sum + payment.amount, 0);
    console.log('✅ Range Revenue:', rangeRevenue);

    // 3. ACTIVE SUBSCRIPTIONS
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
      },
    }).catch(() => 0);

    console.log('✅ Active Subscriptions:', activeSubscriptions);

    // 4. MONTHLY REVENUE (from active subscriptions)
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        monthlyPrice: true,
        customPrice: true,
      },
    }).catch(() => []);

    const monthlyRevenue = subscriptions.reduce(
      (sum, sub) => sum + (sub.monthlyPrice || sub.customPrice || 0),
      0
    );
    console.log('✅ Monthly Revenue:', monthlyRevenue);

    // 5. ANNUAL REVENUE (estimate)
    const annualRevenue = monthlyRevenue * 12;

    // 6. NEW SUBSCRIPTIONS THIS MONTH
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newSubscriptionsThisMonth = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: firstOfMonth,
        },
      },
    }).catch(() => 0);

    console.log('✅ New Subscriptions This Month:', newSubscriptionsThisMonth);

    // 7. CHURN RATE (simple calculation)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const subscriptionsLastMonth = await prisma.subscription.count({
      where: {
        createdAt: {
          lt: lastMonth,
        },
      },
    }).catch(() => 0);

    const cancelledThisMonth = await prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        cancelledAt: {
          gte: firstOfMonth,
        },
      },
    }).catch(() => 0);

    const churnRate = subscriptionsLastMonth > 0 
      ? (cancelledThisMonth / subscriptionsLastMonth) * 100 
      : 0;

    console.log('✅ Churn Rate:', churnRate);

    // 8. AVERAGE REVENUE PER USER
    const totalUsers = await prisma.user.count().catch(() => 1);
    const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

    // 9. LIFETIME VALUE (simple estimate)
    const lifetimeValue = averageRevenuePerUser * 12;

    // 10. PAYMENT SUCCESS RATE
    const allPaymentsCount = await prisma.payment.count().catch(() => 1);
    const successfulPaymentsCount = allPayments.length;
    const paymentSuccessRate = allPaymentsCount > 0 
      ? (successfulPaymentsCount / allPaymentsCount) * 100 
      : 100;

    console.log('✅ Payment Success Rate:', paymentSuccessRate);

    // 11. MONTHLY GROWTH
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // FIXED: Changed SUCCESS → COMPLETED
    const lastMonthRevenue = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: previousMonth,
          lte: previousMonthEnd,
        },
      },
      select: {
        amount: true,
      },
    }).catch(() => []);

    const lastMonthTotal = lastMonthRevenue.reduce((sum, p) => sum + p.amount, 0);
    const thisMonthRevenue = rangePayments
      .filter(p => p.createdAt >= firstOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyGrowth = lastMonthTotal > 0 
      ? ((thisMonthRevenue - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    console.log('✅ Monthly Growth:', monthlyGrowth);

    // 12. REVENUE DATA BY MONTH (last 6 months)
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      // FIXED: Changed SUCCESS → COMPLETED
      const monthPayments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          amount: true,
        },
      }).catch(() => []);

      const monthSubs = await prisma.subscription.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }).catch(() => 0);

      revenueData.push({
        month: monthStart.toLocaleDateString('en-GB', { month: 'short' }),
        revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
        subscriptions: monthSubs,
      });
    }

    console.log('✅ Revenue Data (6 months):', revenueData.length);

    // 13. RECENT PAYMENTS
    const recentPayments = await prisma.payment.findMany({
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }).catch(() => []);

    const payments = recentPayments.map((payment) => ({
      id: payment.id,
      userName: payment.user 
        ? `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() || 'Unknown'
        : 'Unknown',
      userEmail: payment.user?.email || 'unknown@example.com',
      amount: payment.amount,
      status: payment.status,
      date: payment.createdAt.toISOString(),
      method: payment.paymentMethod || 'CARD',
    }));

    console.log('✅ Recent Payments:', payments.length);
    console.log('===== FINANCIAL DATA COMPLETE =====\n');

    return NextResponse.json(
      {
        stats: {
          totalRevenue,
          monthlyRevenue,
          annualRevenue,
          activeSubscriptions,
          newSubscriptionsThisMonth,
          churnRate: Math.round(churnRate * 10) / 10,
          averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
          lifetimeValue: Math.round(lifetimeValue * 100) / 100,
          paymentSuccessRate: Math.round(paymentSuccessRate * 10) / 10,
          pendingPayouts: 0,
          monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        },
        revenueData,
        payments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Financial API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
