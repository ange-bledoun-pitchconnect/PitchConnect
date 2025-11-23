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
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  pendingUpgrades: number;
  systemHealth: number;
}

export default function AdminOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        // TODO: Replace with actual API call
        setStats({
          totalUsers: 1234,
          activeSubscriptions: 456,
          monthlyRevenue: 15680.50,
          pendingUpgrades: 23,
          systemHealth: 98,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    change?: { value: number; positive: boolean };
    icon: any;
    color: string;
  }) => (
    <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6 hover:border-gold-500 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-charcoal-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {change.positive ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-semibold ${
                  change.positive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {Math.abs(change.value)}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
        <p className="text-charcoal-400">
          Real-time insights into PitchConnect platform performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          change={{ value: 12, positive: true }}
          icon={Users}
          color="bg-blue-900"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          change={{ value: 8, positive: true }}
          icon={CreditCard}
          color="bg-green-900"
        />
        <StatCard
          title="Monthly Revenue"
          value={`£${(stats?.monthlyRevenue || 0).toLocaleString('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          change={{ value: 15, positive: true }}
          icon={TrendingUp}
          color="bg-gold-900"
        />
        <StatCard
          title="Pending Upgrades"
          value={stats?.pendingUpgrades || 0}
          icon={Clock}
          color="bg-orange-900"
        />
        <StatCard
          title="System Health"
          value={`${stats?.systemHealth || 0}%`}
          icon={Activity}
          color="bg-purple-900"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">User Management</h3>
              <p className="text-charcoal-400 text-sm mt-1">
                Manage users, roles, and permissions
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <Link href="/dashboard/admin/users">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Go to Users
            </Button>
          </Link>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Subscriptions & Billing
              </h3>
              <p className="text-charcoal-400 text-sm mt-1">
                View subscriptions and process payments
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-green-500" />
          </div>
          <Link href="/dashboard/admin/subscriptions">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              Go to Subscriptions
            </Button>
          </Link>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">View as User</h3>
              <p className="text-charcoal-400 text-sm mt-1">
                Impersonate users and debug issues
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
          <Link href="/dashboard/admin/impersonate">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              Go to Impersonation
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {[
            {
              action: 'New user registration',
              user: 'John Smith',
              time: '5 minutes ago',
              icon: CheckCircle2,
              color: 'text-green-500',
            },
            {
              action: 'Subscription upgraded',
              user: 'Sarah Johnson',
              time: '12 minutes ago',
              icon: TrendingUp,
              color: 'text-blue-500',
            },
            {
              action: 'Payment failed',
              user: 'Mike Brown',
              time: '1 hour ago',
              icon: AlertCircle,
              color: 'text-red-500',
            },
            {
              action: 'User suspended',
              user: 'Alex Davis',
              time: '2 hours ago',
              icon: AlertCircle,
              color: 'text-orange-500',
            },
          ].map((activity, idx) => {
            const Icon = activity.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-charcoal-700 transition-colors"
              >
                <Icon className={`w-5 h-5 ${activity.color}`} />
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-charcoal-400 text-sm">{activity.user}</p>
                </div>
                <span className="text-charcoal-500 text-sm">{activity.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}