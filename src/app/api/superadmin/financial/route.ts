import { verifySuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySuperAdmin(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get('startDate') || Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = new Date(searchParams.get('endDate') || Date.now());

    // Revenue metrics
    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    });

    const paymentsByStatus = await prisma.payment.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const subscriptionRevenue = await prisma.subscription.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totalRevenue: totalRevenue._sum.amount || 0,
        subscriptionRevenue: subscriptionRevenue._sum.amount || 0,
        paymentsByStatus,
      },
    });
  } catch (error) {
    console.error('❌ Financial Report Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
