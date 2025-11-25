// src/app/dashboard/admin/page.tsx
// SuperAdmin Overview Dashboard

'use client';


import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';


interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  pendingUpgrades: number;
  systemHealth: number;
  recentSignups: number;
  userGrowth: number;
}


interface RecentActivity {
  id: string;
  action: string;
  performerName: string;
  affectedUserName: string | null;
  timestamp: string;
}


export default function AdminOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/superadmin/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
        setActivities(data.recentActivities || []);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchStats();
  }, []);


  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };


  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);


    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-200 dark:border-gold-800 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal-600 dark:text-charcoal-400 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-2">System Overview</h1>
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Real-time insights into PitchConnect platform performance
          </p>
        </div>
        <Button
          onClick={fetchStats}
          disabled={refreshing}
          className="bg-gold-600 hover:bg-gold-700 text-charcoal-900"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Users */}
        <div className="bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="flex items-center gap-1 text-sm">
              {stats && stats.userGrowth >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-semibold">
                    {stats.userGrowth}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 font-semibold">
                    {stats?.userGrowth}%
                  </span>
                </>
              )}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-1">
            {stats?.totalUsers || 0}
          </h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 text-sm">Total Users</p>
          <p className="text-charcoal-500 dark:text-charcoal-500 text-xs mt-2">
            {stats?.recentSignups || 0} from last month
          </p>
        </div>


        {/* Active Subscriptions */}
        <div className="bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="w-8 h-8 text-green-500" />
            <div className="flex items-center gap-1 text-sm">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-semibold">8%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-1">
            {stats?.activeSubscriptions || 0}
          </h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 text-sm">Active Subscriptions</p>
          <p className="text-charcoal-500 dark:text-charcoal-500 text-xs mt-2">from last month</p>
        </div>


        {/* Monthly Revenue */}
        <div className="bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-gold-500" />
            <div className="flex items-center gap-1 text-sm">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-semibold">15%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-1">
            {formatCurrency(stats?.monthlyRevenue || 0)}
          </h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 text-sm">Monthly Revenue</p>
          <p className="text-charcoal-500 dark:text-charcoal-500 text-xs mt-2">from last month</p>
        </div>


        {/* Pending Upgrades */}
        <div className="bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-1">
            {stats?.pendingUpgrades || 0}
          </h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 text-sm">Pending Upgrades</p>
          <p className="text-charcoal-500 dark:text-charcoal-500 text-xs mt-2">requires attention</p>
        </div>


        {/* System Health */}
        <div className="bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-purple-500" />
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-1">
            {stats?.systemHealth || 0}%
          </h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 text-sm">System Health</p>
          <p className="text-green-500 text-xs mt-2 font-semibold">All systems operational</p>
        </div>
      </div>


      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Management */}
        <div className="bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-xl p-6 transition-colors">
          <Users className="w-8 h-8 text-blue-500 mb-4" />
          <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-2">User Management</h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 text-sm mb-4">
            Manage users, roles, and permissions
          </p>
          <Link href="/dashboard/admin/users">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Go to Users
            </Button>
          </Link>
        </div>


        {/* Subscriptions */}
        <div className="bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-xl p-6 transition-colors">
          <CreditCard className="w-8 h-8 text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-2">Subscriptions & Billing</h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 text-sm mb-4">
            View subscriptions and process payments
          </p>
          <Link href="/dashboard/admin/subscriptions">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              Go to Subscriptions
            </Button>
          </Link>
        </div>


        {/* View as User */}
        <div className="bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-xl p-6 transition-colors">
          <Activity className="w-8 h-8 text-purple-500 mb-4" />
          <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-2">View as User</h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 text-sm mb-4">
            Impersonate users and debug issues
          </p>
          <Link href="/dashboard/admin/impersonate">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              Go to Impersonation
            </Button>
          </Link>
        </div>
      </div>


      {/* Recent Activities */}
      <div className="bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-xl overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-charcoal-700">
          <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">Recent Activities</h2>
        </div>
        <div className="divide-y divide-neutral-200 dark:divide-charcoal-700">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-charcoal-900 dark:text-white font-medium">
                      {activity.action.replace('_', ' ')}
                    </p>
                    <p className="text-charcoal-600 dark:text-charcoal-400 text-sm">
                      {activity.performerName}
                      {activity.affectedUserName && ` → ${activity.affectedUserName}`}
                    </p>
                  </div>
                </div>
                <span className="text-charcoal-500 dark:text-charcoal-500 text-sm">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
              <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">No recent activities</p>
              <p className="text-charcoal-500 dark:text-charcoal-500 text-sm mt-1">
                Activities will appear here as actions are performed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
