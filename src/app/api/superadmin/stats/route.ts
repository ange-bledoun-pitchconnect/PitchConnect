import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    stats: {
      totalUsers: 1250,
      activeUsers: 980,
      inactiveUsers: 200,
      suspendedUsers: 70,
      userGrowth: 12.5,
      recentSignups: 45,
      activeSubscriptions: 320,
      totalSubscriptions: 425,
      monthlyRevenue: 15000,
      annualRevenue: 180000,
      mrrGrowth: 8.3,
      conversionRate: 15.2,
      churnRate: 2.1,
      pendingUpgrades: 12,
      totalLeagues: 45,
      activeLeagues: 38,
      totalClubs: 189,
      totalTeams: 567,
      totalMatches: 2341,
      matchesThisMonth: 234,
      totalPlayers: 8945,
      systemHealth: 94,
      databaseConnections: 12,
      uptime: 99.8,
      lastUpdated: new Date().toISOString(),
    },
    recentActivities: [
      {
        id: '1',
        action: 'USER_CREATED',
        performerName: 'Admin',
        affectedUserName: 'John Doe',
        entityType: 'USER',
        timestamp: new Date().toISOString(),
      },
    ],
    summary: {
      totalDataPoints: 2400,
      queryTime: 245,
    },
  });
}
