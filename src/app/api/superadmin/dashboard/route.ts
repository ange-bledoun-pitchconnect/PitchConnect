import { verifySuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // ✅ Verify SuperAdmin access
    const session = await verifySuperAdmin(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: SuperAdmin access required' },
        { status: 401 }
      );
    }

    console.log(`📊 SuperAdmin Dashboard: ${session.user.email}`);

    // ✅ Fetch system-wide metrics
    const [totalUsers, activeSubscriptions, totalLeagues, totalMatches, recentSignups] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.league.count(),
      prisma.match.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      }),
    ]);

    const monthlyRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          activeSubscriptions,
          totalLeagues,
          totalMatches,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
        },
        recentSignups,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ SuperAdmin Dashboard Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
