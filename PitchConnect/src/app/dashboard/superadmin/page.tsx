// src/app/dashboard/superadmin/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import Spinner from '@/components/loading/Spinner';
import StatCard from '@/components/cards/StatCard';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StatsData {
  stats: {
    // User Metrics
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    suspendedUsers: number;
    userGrowth: number;
    recentSignups: number;

    // Subscription Metrics
    activeSubscriptions: number;
    totalSubscriptions: number;
    monthlyRevenue: number;
    annualRevenue: number;
    mrrGrowth: number;
    conversionRate: number;
    churnRate: number;
    pendingUpgrades: number;

    // Platform Metrics
    totalLeagues: number;
    activeLeagues: number;
    totalClubs: number;
    totalTeams: number;
    totalMatches: number;
    matchesThisMonth: number;
    totalPlayers: number;

    // System Health
    systemHealth: number;
    databaseConnections: number;
    uptime: number;
    lastUpdated: string;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    performerName: string;
    affectedUserName: string | null;
    entityType: string;
    timestamp: string;
  }>;
  summary: {
    totalDataPoints: number;
    queryTime: number;
  };
}

interface GrowthMetrics {
  mrrGrowth: number;
  revenueGrowth: number;
  userGrowth: number;
  newSignupsThisPeriod: number;
}

// ============================================================================
// MAIN COMPONENT - SuperAdmin Dashboard
// ============================================================================

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<StatsData | null>(null);
  const [growth, setGrowth] = useState<GrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ============================================================================
  // FETCH STATS WITH ERROR HANDLING
  // ============================================================================

  const fetchStats = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const response = await fetch('/api/superadmin/stats', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch stats`);
      }

      const statsData: StatsData = await response.json();
      setData(statsData);

      // Calculate growth metrics
      const growthData: GrowthMetrics = {
        mrrGrowth: statsData.stats.mrrGrowth || 0,
        revenueGrowth:
          statsData.stats.monthlyRevenue > 0
            ? ((statsData.stats.annualRevenue - statsData.stats.monthlyRevenue) /
                statsData.stats.monthlyRevenue) *
              100
            : 0,
        userGrowth: statsData.stats.userGrowth || 0,
        newSignupsThisPeriod: statsData.stats.recentSignups || 0,
      };
      setGrowth(growthData);
      toast.success('Analytics updated successfully', {
        position: 'bottom-right',
        duration: 2000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`, {
        position: 'bottom-right',
        duration: 3000,
      });
      console.error('Error fetching analytics:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ============================================================================
  // AUTH CHECK & INITIAL STATS FETCH
  // ============================================================================

  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('🔐 Not authenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      if (!session.user.isSuperAdmin) {
        console.log('❌ User is not SuperAdmin, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }
      console.log('✅ SuperAdmin authenticated, fetching stats');
      fetchStats();
      setLoading(false);
    }
  }, [status, session, router, fetchStats]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (status === 'loading' || (loading && !data)) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Spinner />
            <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">
              Loading SuperAdmin Dashboard...
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ============================================================================
  // PERMISSION CHECK
  // ============================================================================

  if (!session?.user?.isSuperAdmin) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
              Access Denied
            </h1>
            <p className="text-charcoal-600 dark:text-charcoal-400">
              You do not have permission to access this page. Only SuperAdmins can view this dashboard.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ============================================================================
  // MAIN RENDER - Dashboard Content
  // ============================================================================

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* ========== HEADER ========== */}
        <div className="flex justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white">
              SuperAdmin Dashboard
            </h1>
            <p className="text-charcoal-600 dark:text-charcoal-400 mt-2">
              System Overview & Real-time Metrics
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
              isRefreshing
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white shadow-lg hover:shadow-xl'
            }`}
            aria-busy={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* ========== ERROR STATE ========== */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-300 font-semibold">⚠️ Error loading analytics</p>
              <p className="text-red-700 dark:text-red-200 text-sm mt-1">{error}</p>
              <button
                onClick={fetchStats}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* ========== KEY METRICS GRID (TOP 4) ========== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={data.stats.totalUsers.toLocaleString()}
                icon={<Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
                subtitle={`${data.stats.activeUsers.toLocaleString()} active`}
                trend={{
                  value: data.stats.userGrowth,
                  isPositive: data.stats.userGrowth >= 0,
                }}
              />
              <StatCard
                title="Active Subscriptions"
                value={data.stats.activeSubscriptions.toLocaleString()}
                icon={<CreditCard className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
                subtitle={`${data.stats.totalSubscriptions.toLocaleString()} total`}
              />
              <StatCard
                title="Monthly Revenue (MRR)"
                value={`£${data.stats.monthlyRevenue.toLocaleString('en-GB', {
                  maximumFractionDigits: 0,
                })}`}
                icon={<TrendingUp className="w-8 h-8 text-gold-600 dark:text-gold-400" />}
                subtitle={`${data.stats.mrrGrowth > 0 ? '↑' : '↓'} ${Math.abs(
                  data.stats.mrrGrowth
                ).toFixed(1)}% ${data.stats.mrrGrowth > 0 ? 'growth' : 'decline'}`}
                trend={{
                  value: data.stats.mrrGrowth,
                  isPositive: data.stats.mrrGrowth >= 0,
                }}
              />
              <StatCard
                title="Annual Revenue"
                value={`£${(data.stats.annualRevenue / 100).toLocaleString('en-GB', {
                  maximumFractionDigits: 0,
                })}`}
                icon="💰"
                subtitle="Lifetime total"
              />
            </div>

            {/* ========== SECONDARY METRICS GRID ========== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Conversion Rate */}
              <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-charcoal-700 hover:shadow-md transition">
                <h3 className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400 mb-4">
                  Conversion Rate (FREE → PAID)
                </h3>
                <div className="flex items-end justify-between mb-4">
                  <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
                    {data.stats.conversionRate.toFixed(1)}%
                  </p>
                  {data.stats.conversionRate > 0 && (
                    <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-charcoal-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(data.stats.conversionRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Churn Rate */}
              <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-charcoal-700 hover:shadow-md transition">
                <h3 className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400 mb-4">
                  Churn Rate (30 days)
                </h3>
                <div className="flex items-end justify-between mb-4">
                  <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
                    {data.stats.churnRate.toFixed(1)}%
                  </p>
                  {data.stats.churnRate > 0 && (
                    <ArrowDownRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-charcoal-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      data.stats.churnRate > 5
                        ? 'bg-gradient-to-r from-red-500 to-orange-600'
                        : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    }`}
                    style={{ width: `${Math.min(data.stats.churnRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* New Signups */}
              <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-charcoal-700 hover:shadow-md transition">
                <h3 className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400 mb-4">
                  New Signups This Month
                </h3>
                <p className="text-3xl font-bold text-charcoal-900 dark:text-white mb-4">
                  {data.stats.recentSignups.toLocaleString()}
                </p>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                  ⏱️ Avg per day: {(data.stats.recentSignups / 30).toFixed(1)}
                </p>
              </div>
            </div>

            {/* ========== PLATFORM METRICS ========== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Leagues"
                value={data.stats.totalLeagues.toLocaleString()}
                icon="🏆"
                subtitle={`${data.stats.activeLeagues.toLocaleString()} active`}
              />
              <StatCard
                title="Clubs & Teams"
                value={`${data.stats.totalClubs.toLocaleString()} / ${data.stats.totalTeams.toLocaleString()}`}
                icon="⚽"
                subtitle="Clubs / Teams"
              />
              <StatCard
                title="Matches"
                value={data.stats.totalMatches.toLocaleString()}
                icon="📅"
                subtitle={`${data.stats.matchesThisMonth.toLocaleString()} this month`}
              />
              <StatCard
                title="Players"
                value={data.stats.totalPlayers.toLocaleString()}
                icon="🎯"
                subtitle="Active players"
              />
            </div>

            {/* ========== USER BREAKDOWN ========== */}
            <Card className="p-6 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-6">
                User Status Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Active Users */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 hover:shadow-md transition">
                  <p className="text-green-600 dark:text-green-400 text-sm font-semibold flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" /> ACTIVE
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                    {data.stats.activeUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                    {((data.stats.activeUsers / (data.stats.totalUsers || 1)) * 100).toFixed(1)}% of total
                  </p>
                </div>

                {/* Inactive Users */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">INACTIVE</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-300">
                    {data.stats.inactiveUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-400 mt-2">
                    {((data.stats.inactiveUsers / (data.stats.totalUsers || 1)) * 100).toFixed(1)}% of total
                  </p>
                </div>

                {/* Suspended Users */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700 hover:shadow-md transition">
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" /> SUSPENDED
                  </p>
                  <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-300">
                    {data.stats.suspendedUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                    {((data.stats.suspendedUsers / (data.stats.totalUsers || 1)) * 100).toFixed(1)}% of total
                  </p>
                </div>

                {/* Recent Signups */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition">
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold mb-2">🆕 RECENT (30d)</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                    {data.stats.recentSignups.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">New signups</p>
                </div>
              </div>
            </Card>

            {/* ========== SYSTEM HEALTH ========== */}
            <Card className="p-6 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-6">System Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Overall Health */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                      Overall Health
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        data.stats.systemHealth >= 90
                          ? 'text-green-600 dark:text-green-400'
                          : data.stats.systemHealth >= 70
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {data.stats.systemHealth}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-charcoal-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        data.stats.systemHealth >= 90
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : data.stats.systemHealth >= 70
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                          : 'bg-gradient-to-r from-red-500 to-orange-600'
                      }`}
                      style={{ width: `${data.stats.systemHealth}%` }}
                    />
                  </div>
                </div>

                {/* Database Connections */}
                <div>
                  <p className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Database Connections
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {data.stats.databaseConnections}
                  </p>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-2">Active connections</p>
                </div>

                {/* Query Time */}
                <div>
                  <p className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Query Time
                  </p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {data.summary.queryTime}ms
                  </p>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-2">Last update</p>
                </div>
              </div>
            </Card>

            {/* ========== RECENT ACTIVITIES ========== */}
            <Card className="p-6 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-6">Recent Activities</h2>
              {data.recentActivities.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-charcoal-700 border-b border-neutral-200 dark:border-charcoal-600">
                        <th className="text-left py-3 px-4 font-semibold text-charcoal-700 dark:text-charcoal-300">
                          Action
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-charcoal-700 dark:text-charcoal-300">
                          Performed By
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-charcoal-700 dark:text-charcoal-300">
                          Affected User
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-charcoal-700 dark:text-charcoal-300">
                          Entity
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-charcoal-700 dark:text-charcoal-300">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-charcoal-700">
                      {data.recentActivities.slice(0, 10).map((activity) => (
                        <tr
                          key={activity.id}
                          className="hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition"
                        >
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-semibold">
                              {activity.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-charcoal-700 dark:text-charcoal-300 font-medium">
                            {activity.performerName}
                          </td>
                          <td className="py-3 px-4 text-charcoal-700 dark:text-charcoal-300">
                            {activity.affectedUserName || '—'}
                          </td>
                          <td className="py-3 px-4 text-charcoal-600 dark:text-charcoal-400 text-xs uppercase tracking-wide">
                            {activity.entityType}
                          </td>
                          <td className="py-3 px-4 text-charcoal-600 dark:text-charcoal-400 text-xs whitespace-nowrap">
                            {new Date(activity.timestamp).toLocaleString('en-GB', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-charcoal-600 dark:text-charcoal-400">
                  No recent activities
                </p>
              )}
            </Card>

            {/* ========== QUICK ACTIONS (FIXED) ========== */}
            <Card className="p-6 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  // ⚠️ FIXED: Points to /dashboard/superadmin/users
                  onClick={() => router.push('/dashboard/superadmin/users')}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-left transition border border-blue-200 dark:border-blue-700 hover:shadow-md group"
                >
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 group-hover:text-blue-700 dark:group-hover:text-blue-200">
                    👥 Manage Users
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">View and manage all users</p>
                </button>
                <button
                  // ⚠️ FIXED: Points to /dashboard/superadmin/system
                  onClick={() => router.push('/dashboard/superadmin/system')}
                  className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg text-left transition border border-green-200 dark:border-green-700 hover:shadow-md group"
                >
                  <h3 className="font-semibold text-green-900 dark:text-green-300 group-hover:text-green-700 dark:group-hover:text-green-200">
                    ⚙️ System Settings
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">Configure system settings</p>
                </button>
                <button
                  // ⚠️ This was already correct, but confirmed
                  onClick={() => router.push('/dashboard/superadmin/audit-logs')}
                  className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg text-left transition border border-purple-200 dark:border-purple-700 hover:shadow-md group"
                >
                  <h3 className="font-semibold text-purple-900 dark:text-purple-300 group-hover:text-purple-700 dark:group-hover:text-purple-200">
                    📋 Audit Logs
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-400">View system audit logs</p>
                </button>
              </div>
            </Card>

            {/* ========== FOOTER INFO ========== */}
            <div className="text-xs text-charcoal-600 dark:text-charcoal-400 text-center pt-6 border-t border-neutral-200 dark:border-charcoal-700">
              <p className="font-medium">
                Last updated:{' '}
                <time dateTime={data.stats.lastUpdated}>
                  {new Date(data.stats.lastUpdated).toLocaleString('en-GB')}
                </time>
              </p>
              <p className="mt-2">
                Data points: <span className="font-semibold">{data.summary.totalDataPoints.toLocaleString()}</span>
                {' | '}
                Query time: <span className="font-semibold">{data.summary.queryTime}ms</span>
              </p>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
