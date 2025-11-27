// src/app/dashboard/superadmin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface DashboardMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  mrr: number;
  churnRate: number;
  conversionRate: number;
  newSignupsToday: number;
}

interface GrowthMetrics {
  mrrGrowth: number;
  revenueGrowth: number;
  newSignupsThisPeriod: number;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [growth, setGrowth] = useState<GrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/analytics?period=month');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setMetrics(data.data.metrics);
      setGrowth(data.data.growth);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SuperAdmin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">System overview and key metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {metrics?.totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {metrics?.activeSubscriptions.toLocaleString()}
              </p>
            </div>
            <div className="text-3xl">💳</div>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue (MRR)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                £{metrics?.mrr.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
              </p>
              {growth && growth.mrrGrowth > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ↑ {growth.mrrGrowth.toFixed(1)}% growth
                </p>
              )}
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                £{(metrics?.totalRevenue ? metrics.totalRevenue / 100 : 0).toLocaleString('en-GB', {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Churn Rate */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Churn Rate (30 days)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {metrics?.churnRate.toFixed(1)}%
          </p>
          <div className="mt-4 bg-gray-200 dark:bg-charcoal-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${Math.min(metrics?.churnRate || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate (FREE → Paid)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {metrics?.conversionRate.toFixed(1)}%
          </p>
          <div className="mt-4 bg-gray-200 dark:bg-charcoal-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${metrics?.conversionRate || 0}%` }}
            />
          </div>
        </div>

        {/* New Signups Today */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">New Signups Today</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {metrics?.newSignupsToday}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {growth?.newSignupsThisPeriod} this month
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}