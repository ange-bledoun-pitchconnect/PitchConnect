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

export default function FinancialReportsPage() {
  const { data: session } = useSession();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [payments, setPayments] = useState<PaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/superadmin/financial?range=${timeRange}`);
        const data = await response.json();
        setStats(data.stats || mockStats);
        setRevenueData(data.revenueData || mockRevenueData);
        setPayments(data.payments || mockPayments);
      } catch (error) {
        console.error('Failed to fetch financial data:', error);
        setStats(mockStats);
        setRevenueData(mockRevenueData);
        setPayments(mockPayments);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [timeRange]);

  // Mock data for development
  const mockStats: FinancialStats = {
    totalRevenue: 125680.5,
    monthlyRevenue: 15420.0,
    annualRevenue: 185040.0,
    activeSubscriptions: 1245,
    newSubscriptionsThisMonth: 87,
    churnRate: 3.2,
    averageRevenuePerUser: 12.38,
    lifetimeValue: 148.56,
    paymentSuccessRate: 96.8,
    pendingPayouts: 4250.0,
  };

  const mockRevenueData: RevenueData[] = [
    { month: 'Jan', revenue: 12500, subscriptions: 1100 },
    { month: 'Feb', revenue: 13200, subscriptions: 1150 },
    { month: 'Mar', revenue: 14100, subscriptions: 1180 },
    { month: 'Apr', revenue: 14800, subscriptions: 1200 },
    { month: 'May', revenue: 15420, subscriptions: 1245 },
  ];

  const mockPayments: PaymentStatus[] = [
    {
      id: 'pay-1',
      userName: 'John Smith',
      userEmail: 'john@example.com',
      amount: 9.99,
      status: 'SUCCESS',
      date: '2025-11-23T14:30:00Z',
      method: 'card_****1234',
    },
    {
      id: 'pay-2',
      userName: 'Sarah Johnson',
      userEmail: 'sarah@example.com',
      amount: 4.99,
      status: 'FAILED',
      date: '2025-11-23T12:15:00Z',
      method: 'card_****5678',
    },
    {
      id: 'pay-3',
      userName: 'Mike Brown',
      userEmail: 'mike@example.com',
      amount: 19.99,
      status: 'PENDING',
      date: '2025-11-23T10:00:00Z',
      method: 'bank_transfer',
    },
  ];

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
          <Button variant="outline" className="text-charcoal-700 hover:bg-charcoal-700">
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
            {stats ? formatCurrency(stats.totalRevenue) : '—'}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-sm font-semibold">+12.5%</span>
            <span className="text-charcoal-500 text-sm">vs last month</span>
          </div>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Monthly Revenue</p>
            <TrendingUp className="w-5 h-5 text-gold-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats ? formatCurrency(stats.monthlyRevenue) : '—'}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-sm font-semibold">+8.3%</span>
            <span className="text-charcoal-500 text-sm">vs last month</span>
          </div>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Active Subscriptions</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats ? stats.activeSubscriptions.toLocaleString() : '—'}
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
            {stats ? `${stats.churnRate}%` : '—'}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowDownRight className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-sm font-semibold">-0.5%</span>
            <span className="text-charcoal-500 text-sm">vs last month</span>
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
                {stats ? formatCurrency(stats.averageRevenuePerUser) : '—'}
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
                {stats ? formatCurrency(stats.lifetimeValue) : '—'}
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
                {stats ? `${stats.paymentSuccessRate}%` : '—'}
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
            <span className="text-charcoal-400 text-sm">Showing: Monthly Revenue</span>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="space-y-4">
          {revenueData.map((data, index) => {
            const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));
            const widthPercentage = (data.revenue / maxRevenue) * 100;

            return (
              <div key={index} className="flex items-center gap-4">
                <span className="text-charcoal-400 text-sm w-12">{data.month}</span>
                <div className="flex-1 bg-charcoal-900 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-gold-600 to-gold-500 h-full rounded-full flex items-center justify-end px-4 transition-all duration-500"
                    style={{ width: `${widthPercentage}%` }}
                  >
                    <span className="text-white text-sm font-semibold">
                      {formatCurrency(data.revenue)}
                    </span>
                  </div>
                </div>
                <span className="text-charcoal-400 text-sm w-20">
                  {data.subscriptions} subs
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-charcoal-700">
          <h2 className="text-xl font-bold text-white">Recent Payments</h2>
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
              {payments.map((payment) => (
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
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-charcoal-900 border-t border-charcoal-700 flex items-center justify-between">
          <p className="text-sm text-charcoal-400">
            Showing {payments.length} of {payments.length} payments
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled className="text-charcoal-700">
              Previous
            </Button>
            <Button size="sm" variant="outline" className="text-charcoal-700 hover:bg-charcoal-700">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}