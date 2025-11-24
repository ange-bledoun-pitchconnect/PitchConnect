// src/app/dashboard/admin/subscriptions/page.tsx
// SuperAdmin Subscriptions & Billing Management

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CreditCard,
  Search,
  Filter,
  MoreVertical,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Download,
  Send,
  Gift,
  Calendar,
} from 'lucide-react';

type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
type SubscriptionPlan = 'PLAYER' | 'PLAYER_PRO' | 'COACH' | 'MANAGER' | 'LEAGUE_ADMIN';

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  startDate: string;
  renewalDate: string;
  expiresAt: string;
  isTrial: boolean;
  trialEndsAt?: string;
  paymentMethod?: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
}

type TabType = 'active' | 'expiring' | 'cancelled' | 'overdue';

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // FIXED: Fetch REAL subscriptions from API
  const fetchSubscriptions = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/superadmin/subscriptions?tab=${activeTab}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptions(data.subscriptions || []);
      } else {
        console.error('Failed to fetch subscriptions:', data.error);
        setSubscriptions([]);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [activeTab]);

  // Filter subscriptions based on active tab and search
  const getFilteredSubscriptions = () => {
    let filtered = subscriptions;

    // Tab filtering
    switch (activeTab) {
      case 'expiring':
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        filtered = filtered.filter(
          (s) =>
            s.status === 'TRIAL' ||
            (new Date(s.expiresAt) <= sevenDaysFromNow && s.status === 'ACTIVE')
        );
        break;
      case 'cancelled':
        filtered = filtered.filter((s) => s.status === 'CANCELLED');
        break;
      case 'overdue':
        filtered = filtered.filter((s) => s.status === 'EXPIRED');
        break;
      case 'active':
        filtered = filtered.filter((s) => s.status === 'ACTIVE');
        break;
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Plan filtering
    if (planFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.plan === planFilter);
    }

    return filtered;
  };

  const filteredSubscriptions = getFilteredSubscriptions();

  // Get status badge color
  const getStatusBadgeColor = (status: SubscriptionStatus) => {
    const colors: Record<SubscriptionStatus, string> = {
      ACTIVE: 'bg-green-900 text-green-200 border-green-700',
      TRIAL: 'bg-blue-900 text-blue-200 border-blue-700',
      EXPIRED: 'bg-red-900 text-red-200 border-red-700',
      CANCELLED: 'bg-gray-900 text-gray-200 border-gray-700',
      PENDING: 'bg-yellow-900 text-yellow-200 border-yellow-700',
    };
    return colors[status] || 'bg-charcoal-700 text-charcoal-200';
  };

  // Get plan badge color
  const getPlanBadgeColor = (plan: SubscriptionPlan) => {
    const colors: Record<SubscriptionPlan, string> = {
      PLAYER: 'bg-blue-100 text-blue-800',
      PLAYER_PRO: 'bg-purple-100 text-purple-800',
      COACH: 'bg-gold-100 text-gold-800',
      MANAGER: 'bg-orange-100 text-orange-800',
      LEAGUE_ADMIN: 'bg-red-100 text-red-800',
    };
    return colors[plan] || 'bg-charcoal-100 text-charcoal-800';
  };

  // Get tab counts
  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'active':
        return subscriptions.filter((s) => s.status === 'ACTIVE').length;
      case 'expiring':
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return subscriptions.filter(
          (s) =>
            s.status === 'TRIAL' ||
            (new Date(s.expiresAt) <= sevenDaysFromNow && s.status === 'ACTIVE')
        ).length;
      case 'cancelled':
        return subscriptions.filter((s) => s.status === 'CANCELLED').length;
      case 'overdue':
        return subscriptions.filter((s) => s.status === 'EXPIRED').length;
      default:
        return 0;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getDaysUntil = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Subscriptions & Billing
          </h1>
          <p className="text-charcoal-400">
            Manage subscriptions, trials, and billing across all users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchSubscriptions}
            disabled={refreshing}
            variant="outline"
            className="text-charcoal-400 hover:bg-charcoal-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" className="text-charcoal-400 hover:bg-charcoal-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-gold-600 hover:bg-gold-700 text-charcoal-900">
            <Gift className="w-4 h-4 mr-2" />
            Grant Subscription
          </Button>
        </div>
      </div>

      {/* Quick Stats - REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Active Subscriptions</p>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {subscriptions.filter((s) => s.status === 'ACTIVE').length}
          </p>
          <p className="text-xs text-charcoal-500 mt-1">Currently active</p>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Expiring Soon</p>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-white">{getTabCount('expiring')}</p>
          <p className="text-xs text-charcoal-500 mt-1">Next 7 days</p>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Monthly Revenue</p>
            <TrendingUp className="w-5 h-5 text-gold-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            £
            {subscriptions
              .filter((s) => s.billingCycle === 'MONTHLY' && s.status === 'ACTIVE')
              .reduce((sum, s) => sum + s.price, 0)
              .toFixed(2)}
          </p>
          <p className="text-xs text-charcoal-500 mt-1">Recurring monthly</p>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Overdue</p>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-white">{getTabCount('overdue')}</p>
          <p className="text-xs text-charcoal-500 mt-1">Requires attention</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-charcoal-700">
        <div className="flex gap-6">
          {[
            { id: 'active', label: 'Active', icon: CheckCircle2 },
            { id: 'expiring', label: 'Expiring Soon', icon: Clock },
            { id: 'cancelled', label: 'Cancelled', icon: X },
            { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = getTabCount(tab.id as TabType);

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? 'border-gold-500 text-gold-400'
                    : 'border-transparent text-charcoal-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-gold-900 text-gold-200' : 'bg-charcoal-700 text-charcoal-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white mb-2">
              Search by User
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-charcoal-500" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-charcoal-900 border-charcoal-600 text-white"
              />
            </div>
          </div>

          {/* Plan Filter */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Filter by Plan
            </label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500"
            >
              <option value="ALL">All Plans</option>
              <option value="PLAYER">Player</option>
              <option value="PLAYER_PRO">Player Pro</option>
              <option value="COACH">Coach</option>
              <option value="MANAGER">Manager</option>
              <option value="LEAGUE_ADMIN">League Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-700 bg-charcoal-900">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Billing
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Next Billing
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Days Left
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredSubscriptions.length > 0 ? (
                filteredSubscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-charcoal-700 hover:bg-charcoal-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{sub.userName}</p>
                        <p className="text-charcoal-400 text-sm">{sub.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadgeColor(
                          sub.plan
                        )}`}
                      >
                        {sub.plan.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            sub.status === 'ACTIVE'
                              ? 'bg-green-500'
                              : sub.status === 'TRIAL'
                              ? 'bg-blue-500'
                              : sub.status === 'CANCELLED'
                              ? 'bg-gray-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <span className={`text-sm px-2 py-1 rounded border ${getStatusBadgeColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-white font-medium">
                          £{sub.price.toFixed(2)}/{sub.billingCycle.toLowerCase()}
                        </p>
                        <p className="text-charcoal-400">
                          {sub.billingCycle === 'MONTHLY' ? 'Monthly' : 'Annual'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-charcoal-300">
                        {sub.nextBillingDate
                          ? formatDate(sub.nextBillingDate)
                          : formatDate(sub.expiresAt)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-white">
                        {sub.status === 'TRIAL' && sub.trialEndsAt
                          ? `${getDaysUntil(sub.trialEndsAt)} days`
                          : sub.status === 'ACTIVE'
                          ? `${getDaysUntil(sub.expiresAt)} days`
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:bg-blue-950"
                          onClick={() => setSelectedSub(sub)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gold-400 hover:bg-gold-950"
                          onClick={fetchSubscriptions}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-charcoal-400 hover:bg-charcoal-700"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <CreditCard className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
                    <p className="text-charcoal-400 font-medium">No subscriptions found</p>
                    <p className="text-charcoal-500 text-sm mt-1">
                      {searchTerm || planFilter !== 'ALL'
                        ? 'Try adjusting your filters or search query'
                        : 'No subscription data available'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-charcoal-900 border-t border-charcoal-700 flex items-center justify-between">
          <p className="text-sm text-charcoal-400">
            Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
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
      </div>

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Subscription Details</h3>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-charcoal-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-charcoal-400 text-sm">User</p>
                <p className="text-white font-semibold">{selectedSub.userName}</p>
                <p className="text-charcoal-500 text-sm">{selectedSub.userEmail}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-charcoal-400 text-sm">Plan</p>
                  <p className="text-white font-semibold">
                    {selectedSub.plan.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-charcoal-400 text-sm">Status</p>
                  <p className="text-white font-semibold">{selectedSub.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-charcoal-400 text-sm">Start Date</p>
                  <p className="text-white">{formatDate(selectedSub.startDate)}</p>
                </div>
                <div>
                  <p className="text-charcoal-400 text-sm">Renewal Date</p>
                  <p className="text-white">{formatDate(selectedSub.renewalDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-charcoal-400 text-sm">Price</p>
                  <p className="text-white">£{selectedSub.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-charcoal-400 text-sm">Billing Cycle</p>
                  <p className="text-white">{selectedSub.billingCycle}</p>
                </div>
              </div>

              {selectedSub.paymentMethod && (
                <div>
                  <p className="text-charcoal-400 text-sm">Payment Method</p>
                  <p className="text-white font-mono">{selectedSub.paymentMethod}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-charcoal-700">
              <Button className="flex-1 bg-gold-600 hover:bg-gold-700 text-charcoal-900">
                <Gift className="w-4 h-4 mr-2" />
                Extend Trial
              </Button>
              <Button variant="outline" className="flex-1 text-charcoal-400 hover:bg-charcoal-700">
                <Send className="w-4 h-4 mr-2" />
                Send Invoice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
