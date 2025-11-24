// src/app/dashboard/admin/financial/page.tsx
// SuperAdmin Financial Reports & Analytics

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  CreditCard,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  paymentSuccessRate: number;
  pendingPayouts: number;
  growthRate?: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
}

interface PaymentStatus {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
  date: string;
  method: string;
}

interface FinancialResponse {
  success: boolean;
  stats: FinancialStats;
  revenueData: RevenueData[];
  payments: PaymentStatus[];
  metadata?: {
    range: string;
    startDate: string;
    endDate: string;
    generatedAt: string;
  };
}

export default function FinancialReportsPage() {
  const { data: session } = useSession();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [payments, setPayments] = useState<PaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch financial data
  const fetchFinancialData = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/superadmin/financial?range=${timeRange}`);
      const data: FinancialResponse = await response.json();

      if (response.ok && data.success) {
        setStats(data.stats || null);
        setRevenueData(data.revenueData || []);
        setPayments(data.payments || []);
      } else {
        throw new Error(data.error || 'Failed to fetch financial data');
      }
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load financial data');
      setStats(null);
      setRevenueData([]);
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getPaymentStatusColor = (status: PaymentStatus['status']) => {
    const colors = {
      SUCCESS: 'bg-green-900 text-green-200 border-green-700',
      FAILED: 'bg-red-900 text-red-200 border-red-700',
      PENDING: 'bg-yellow-900 text-yellow-200 border-yellow-700',
      REFUNDED: 'bg-gray-900 text-gray-200 border-gray-700',
    };
    return colors[status];
  };

  const getPaymentStatusIcon = (status: PaymentStatus['status']) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-charcoal-700 rounded animate-pulse"></div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-charcoal-700 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-charcoal-700 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-charcoal-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
              <div className="h-24 bg-charcoal-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Financial Reports</h1>
            <p className="text-charcoal-400">Revenue analytics and payment tracking</p>
          </div>
          <Button onClick={fetchFinancialData} className="bg-blue-600 hover:bg-blue-700 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <div className="bg-red-950 border border-red-700 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-200 font-semibold mb-1">Failed to Load Financial Data</h3>
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-red-400 text-xs mt-2">
              Please check your connection and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Financial Reports</h1>
          <p className="text-charcoal-400">
            Revenue analytics, payment tracking, and financial insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-4 py-2 bg-charcoal-800 border border-charcoal-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>

          <Button
            onClick={fetchFinancialData}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button variant="outline" className="text-charcoal-400 hover:bg-charcoal-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats ? formatCurrency(stats.totalRevenue) : '---'}
          </p>
          {stats?.growthRate !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {stats.growthRate >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-semibold ${
                  stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {formatPercentage(stats.growthRate)}
              </span>
              <span className="text-charcoal-500 text-sm">growth</span>
            </div>
          )}
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Monthly Revenue</p>
            <TrendingUp className="w-5 h-5 text-gold-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats ? formatCurrency(stats.monthlyRevenue) : '---'}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-charcoal-500 text-sm">Recurring monthly</span>
          </div>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Active Subscriptions</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats ? stats.activeSubscriptions.toLocaleString() : '---'}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-blue-500 text-sm font-semibold">
              +{stats?.newSubscriptionsThisMonth || 0}
            </span>
            <span className="text-charcoal-500 text-sm">this month</span>
          </div>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Churn Rate</p>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats ? `${stats.churnRate.toFixed(1)}%` : '---'}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-charcoal-500 text-sm">Cancellation rate</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-charcoal-400 text-sm mb-1">Avg Revenue Per User</p>
              <p className="text-2xl font-bold text-white">
                {stats ? formatCurrency(stats.averageRevenuePerUser) : '---'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-950 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-charcoal-400 text-sm mb-1">Customer Lifetime Value</p>
              <p className="text-2xl font-bold text-white">
                {stats ? formatCurrency(stats.lifetimeValue) : '---'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-950 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-charcoal-400 text-sm mb-1">Payment Success Rate</p>
              <p className="text-2xl font-bold text-white">
                {stats ? `${stats.paymentSuccessRate.toFixed(1)}%` : '---'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-950 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Revenue Trend</h2>
          <div className="flex items-center gap-2">
            <span className="text-charcoal-400 text-sm">
              {revenueData.length} months
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-4">
          {revenueData.length > 0 ? (
            revenueData.map((data, index) => {
              const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));
              const widthPercentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;

              return (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-charcoal-400 text-sm w-12 text-right">{data.month}</span>
                  <div className="flex-1 bg-charcoal-900 rounded-full h-10 relative overflow-hidden">
                    {widthPercentage > 0 && (
                      <div
                        className="bg-gradient-to-r from-gold-600 to-gold-500 h-full rounded-full flex items-center justify-end px-4 transition-all duration-500"
                        style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                      >
                        {widthPercentage > 15 && (
                          <span className="text-white text-sm font-semibold">
                            {formatCurrency(data.revenue)}
                          </span>
                        )}
                      </div>
                    )}
                    {widthPercentage <= 15 && widthPercentage > 0 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-300 text-sm font-semibold">
                        {formatCurrency(data.revenue)}
                      </span>
                    )}
                  </div>
                  <span className="text-charcoal-400 text-sm w-24 text-right">
                    {data.subscriptions} subs
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
              <p className="text-charcoal-400">No revenue data available for this period</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-charcoal-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent Payments</h2>
            <span className="text-charcoal-400 text-sm">
              Last {payments.length} transactions
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-700 bg-charcoal-900">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Method</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Date</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-charcoal-700 hover:bg-charcoal-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{payment.userName}</p>
                        <p className="text-charcoal-400 text-sm">{payment.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-semibold">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPaymentStatusIcon(payment.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-charcoal-300 font-mono text-sm">
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-charcoal-400 text-sm">
                        {formatDate(payment.date)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:bg-blue-950"
                          title="View receipt"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <CreditCard className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
                    <p className="text-charcoal-400 font-medium">No payments found</p>
                    <p className="text-charcoal-500 text-sm mt-1">
                      No payment activity in the selected period
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {payments.length > 0 && (
          <div className="px-6 py-4 bg-charcoal-900 border-t border-charcoal-700 flex items-center justify-between">
            <p className="text-sm text-charcoal-400">
              Showing {payments.length} recent payments
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled className="text-charcoal-400">
                Previous
              </Button>
              <Button size="sm" variant="outline" className="text-charcoal-400 hover:bg-charcoal-700">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
