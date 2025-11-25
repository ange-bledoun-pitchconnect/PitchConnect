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
  Edit,
  Pause,
  Play,
  Trash2,
  Plus,
  DollarSign,
  Award,
} from 'lucide-react';

type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | 'PAUSED';
type SubscriptionPlan = 'FREE' | 'PLAYER' | 'PLAYER_PRO' | 'COACH' | 'CLUB_MANAGER' | 'LEAGUE_ADMIN';

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
  isFree?: boolean;
  isCustomPrice?: boolean;
  isTrial: boolean;
  isAdminGranted?: boolean;
  trialEndsAt?: string;
  paymentMethod?: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  features?: string[];
}

interface Stats {
  total: number;
  free: number;
  paid: number;
  active: number;
  trial: number;
  cancelled: number;
  byTier: Record<string, number>;
  revenue: {
    monthly: number;
    annual: number;
  };
}

interface Pricing {
  [key: string]: {
    monthly: number;
    annual: number;
    features: string[];
  };
}

type TabType = 'all' | 'free' | 'paid' | 'active' | 'expiring' | 'cancelled' | 'overdue';

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Grant subscription form state
  const [grantForm, setGrantForm] = useState({
    userId: '',
    tier: 'PLAYER_PRO',
    duration: 1,
    customPrice: '',
    reason: '',
  });

  // Fetch subscriptions from API
  const fetchSubscriptions = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/superadmin/subscriptions?tab=${activeTab}`);
      const data = await response.json();

      if (response.ok) {
        setSubscriptions(data.subscriptions || []);
        setStats(data.stats || null);
        setPricing(data.pricing || null);
        console.log('✅ Loaded', data.subscriptions?.length, 'subscriptions');
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

  // Filter subscriptions
  const getFilteredSubscriptions = () => {
    let filtered = subscriptions;

    // Tab filtering
    switch (activeTab) {
      case 'all':
        // Show everything
        break;
      case 'free':
        filtered = filtered.filter((s) => s.isFree);
        break;
      case 'paid':
        filtered = filtered.filter((s) => !s.isFree);
        break;
      case 'active':
        filtered = filtered.filter((s) => s.status === 'ACTIVE' && !s.isFree);
        break;
      case 'expiring':
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        filtered = filtered.filter(
          (s) =>
            !s.isFree &&
            (s.status === 'TRIAL' ||
              (new Date(s.expiresAt) <= sevenDaysFromNow && s.status === 'ACTIVE'))
        );
        break;
      case 'cancelled':
        filtered = filtered.filter((s) => s.status === 'CANCELLED');
        break;
      case 'overdue':
        filtered = filtered.filter((s) => s.status === 'EXPIRED');
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

  // Get tab counts
  const getTabCount = (tab: TabType) => {
    if (!stats) return 0;

    switch (tab) {
      case 'all':
        return stats.total;
      case 'free':
        return stats.free;
      case 'paid':
        return stats.paid;
      case 'active':
        return stats.active;
      case 'expiring':
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return subscriptions.filter(
          (s) =>
            !s.isFree &&
            (s.status === 'TRIAL' ||
              (new Date(s.expiresAt) <= sevenDaysFromNow && s.status === 'ACTIVE'))
        ).length;
      case 'cancelled':
        return stats.cancelled;
      case 'overdue':
        return subscriptions.filter((s) => s.status === 'EXPIRED').length;
      default:
        return 0;
    }
  };

  // Subscription actions
  const handleGrantSubscription = async () => {
    if (!grantForm.userId || !grantForm.tier) {
      alert('Please fill in all required fields');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/superadmin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: grantForm.userId,
          tier: grantForm.tier,
          duration: grantForm.duration,
          customPrice: grantForm.customPrice ? parseFloat(grantForm.customPrice) : undefined,
          reason: grantForm.reason || `${grantForm.tier} subscription granted`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Subscription granted successfully!');
        setShowGrantModal(false);
        setGrantForm({ userId: '', tier: 'PLAYER_PRO', duration: 1, customPrice: '', reason: '' });
        fetchSubscriptions();
      } else {
        alert(`❌ Error: ${data.error || 'Failed to grant subscription'}`);
      }
    } catch (error) {
      console.error('Grant error:', error);
      alert('❌ Failed to grant subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendSubscription = async (sub: Subscription) => {
    const months = prompt('Extend subscription by how many months?', '1');
    if (!months) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/superadmin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: sub.id,
          action: 'EXTEND',
          data: { months: parseInt(months) },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Subscription extended by ${months} month(s)`);
        fetchSubscriptions();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Failed to extend subscription');
    } finally {
      setActionLoading(false);
      setActionMenuOpen(null);
    }
  };

  const handleChangeTier = async (sub: Subscription) => {
    const newTier = prompt(
      'Change tier to:\nFREE, PLAYER, PLAYER_PRO, COACH, CLUB_MANAGER, LEAGUE_ADMIN',
      sub.plan
    );
    if (!newTier) return;

    const validTiers = ['FREE', 'PLAYER', 'PLAYER_PRO', 'COACH', 'CLUB_MANAGER', 'LEAGUE_ADMIN'];
    if (!validTiers.includes(newTier.toUpperCase())) {
      alert('Invalid tier');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/superadmin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: sub.id,
          action: 'CHANGE_TIER',
          data: { tier: newTier.toUpperCase() },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Tier changed to ${newTier}`);
        fetchSubscriptions();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Failed to change tier');
    } finally {
      setActionLoading(false);
      setActionMenuOpen(null);
    }
  };

  const handleUpdatePrice = async (sub: Subscription) => {
    const newPrice = prompt('Enter new monthly price (£):', sub.price.toString());
    if (!newPrice) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/superadmin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: sub.id,
          action: 'UPDATE_PRICE',
          data: { price: parseFloat(newPrice) },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Price updated to £${newPrice}`);
        fetchSubscriptions();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Failed to update price');
    } finally {
      setActionLoading(false);
      setActionMenuOpen(null);
    }
  };

  const handlePauseResume = async (sub: Subscription) => {
    const action = sub.status === 'PAUSED' ? 'RESUME' : 'PAUSE';
    if (!confirm(`${action} this subscription?`)) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/superadmin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: sub.id,
          action: action,
          data: { reason: `${action.toLowerCase()}d by admin` },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Subscription ${action.toLowerCase()}d`);
        fetchSubscriptions();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Failed to ${action.toLowerCase()} subscription`);
    } finally {
      setActionLoading(false);
      setActionMenuOpen(null);
    }
  };

  const handleRevokeSubscription = async (sub: Subscription) => {
    const reason = prompt('Reason for revoking subscription:', 'Revoked by admin');
    if (!reason) return;

    if (!confirm(`⚠️ Revoke subscription for ${sub.userName}?`)) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/superadmin/subscriptions?subscriptionId=${sub.id}&reason=${encodeURIComponent(reason)}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (response.ok) {
        alert('✅ Subscription revoked');
        fetchSubscriptions();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Failed to revoke subscription');
    } finally {
      setActionLoading(false);
      setActionMenuOpen(null);
    }
  };

  // Helper functions
  const getStatusBadgeColor = (status: SubscriptionStatus) => {
    const colors: Record<SubscriptionStatus, string> = {
      ACTIVE: 'bg-green-900 text-green-200 border-green-700',
      TRIAL: 'bg-blue-900 text-blue-200 border-blue-700',
      EXPIRED: 'bg-red-900 text-red-200 border-red-700',
      CANCELLED: 'bg-gray-900 text-gray-200 border-gray-700',
      PENDING: 'bg-yellow-900 text-yellow-200 border-yellow-700',
      PAUSED: 'bg-orange-900 text-orange-200 border-orange-700',
    };
    return colors[status] || 'bg-charcoal-700 text-charcoal-200';
  };

  const getPlanBadgeColor = (plan: SubscriptionPlan) => {
    const colors: Record<SubscriptionPlan, string> = {
      FREE: 'bg-gray-900 text-gray-300 border border-gray-600',
      PLAYER: 'bg-blue-900 text-blue-200 border border-blue-700',
      PLAYER_PRO: 'bg-purple-900 text-purple-200 border border-purple-700',
      COACH: 'bg-yellow-900 text-yellow-200 border border-yellow-700',
      CLUB_MANAGER: 'bg-orange-900 text-orange-200 border border-orange-700',
      LEAGUE_ADMIN: 'bg-red-900 text-red-200 border border-red-700',
    };
    return colors[plan] || 'bg-charcoal-700 text-charcoal-200';
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
          <h1 className="text-3xl font-bold text-white mb-2">Subscriptions & Billing</h1>
          <p className="text-charcoal-400">
            Manage all user subscriptions across 6 tiers (FREE through LEAGUE_ADMIN)
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
          <Button
            onClick={() => setShowGrantModal(true)}
            className="bg-gold-600 hover:bg-gold-700 text-charcoal-900"
          >
            <Gift className="w-4 h-4 mr-2" />
            Grant Subscription
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Total Users</p>
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
          <p className="text-xs text-charcoal-500 mt-1">All tiers</p>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Free Users</p>
            <Gift className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-3xl font-bold text-white">{stats?.free || 0}</p>
          <p className="text-xs text-charcoal-500 mt-1">£0.00 tier</p>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Paid Subscriptions</p>
            <CreditCard className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white">{stats?.paid || 0}</p>
          <p className="text-xs text-charcoal-500 mt-1">Active customers</p>
        </div>

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-charcoal-400 text-sm">Monthly Revenue</p>
            <TrendingUp className="w-5 h-5 text-gold-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            £{stats?.revenue?.monthly?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-charcoal-500 mt-1">Excluding free users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-charcoal-700">
        <div className="flex gap-6">
          {[
            { id: 'all', label: 'All Users', icon: CheckCircle2 },
            { id: 'free', label: 'Free', icon: Gift },
            { id: 'paid', label: 'Paid', icon: CreditCard },
            { id: 'active', label: 'Active', icon: CheckCircle2 },
            { id: 'expiring', label: 'Expiring Soon', icon: Clock },
            { id: 'cancelled', label: 'Cancelled', icon: X },
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white mb-2">Search by User</label>
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

          <div>
            <label className="block text-sm font-medium text-white mb-2">Filter by Plan</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE">🆓 Free (£0.00)</option>
              <option value="PLAYER">⚽ Player (£4.99/mo)</option>
              <option value="PLAYER_PRO">⭐ Player Pro (£9.99/mo)</option>
              <option value="COACH">👔 Coach (£19.99/mo)</option>
              <option value="CLUB_MANAGER">🏢 Club Manager (£29.99/mo)</option>
              <option value="LEAGUE_ADMIN">🏆 League Admin (£49.99/mo)</option>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Plan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Billing</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Next Billing
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Days Left
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
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
                        {sub.isFree && '🆓 '}
                        {sub.plan === 'PLAYER_PRO' && '⭐ '}
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
                              : sub.status === 'PAUSED'
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <span
                          className={`text-sm px-2 py-1 rounded border ${getStatusBadgeColor(
                            sub.status
                          )}`}
                        >
                          {sub.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {sub.isFree ? (
                          <p className="text-gray-400">Free Plan</p>
                        ) : (
                          <>
                            <p className="text-white font-medium">
                              £{sub.price.toFixed(2)}/{sub.billingCycle.toLowerCase()}
                            </p>
                            <p className="text-charcoal-400">
                              {sub.billingCycle === 'MONTHLY' ? 'Monthly' : 'Annual'}
                            </p>
                          </>
                        )}
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
                          : sub.status === 'ACTIVE' && !sub.isFree
                          ? `${getDaysUntil(sub.expiresAt)} days`
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:bg-blue-950"
                          onClick={() => {
                            setSelectedSub(sub);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {/* Action Dropdown */}
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-charcoal-400 hover:bg-charcoal-700"
                            onClick={() =>
                              setActionMenuOpen(actionMenuOpen === sub.id ? null : sub.id)
                            }
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>

                          {/* Dropdown Menu */}
                          {actionMenuOpen === sub.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-charcoal-800 border border-charcoal-600 rounded-lg shadow-lg z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => handleExtendSubscription(sub)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-charcoal-700"
                                >
                                  <Calendar className="w-4 h-4" />
                                  Extend Subscription
                                </button>
                                <button
                                  onClick={() => handleChangeTier(sub)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-charcoal-700"
                                >
                                  <Award className="w-4 h-4" />
                                  Change Tier
                                </button>
                                <button
                                  onClick={() => handleUpdatePrice(sub)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-charcoal-700"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  Update Price
                                </button>
                                <button
                                  onClick={() => handlePauseResume(sub)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-charcoal-700"
                                >
                                  {sub.status === 'PAUSED' ? (
                                    <>
                                      <Play className="w-4 h-4" />
                                      Resume
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="w-4 h-4" />
                                      Pause
                                    </>
                                  )}
                                </button>
                                <hr className="my-1 border-charcoal-600" />
                                <button
                                  onClick={() => handleRevokeSubscription(sub)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-950"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Revoke
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
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
        </div>
      </div>

      {/* Grant Subscription Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Grant Subscription</h3>
              <button
                onClick={() => setShowGrantModal(false)}
                className="text-charcoal-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">User ID</label>
                <Input
                  type="text"
                  placeholder="Enter user ID"
                  value={grantForm.userId}
                  onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                  className="bg-charcoal-900 border-charcoal-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Tier</label>
                <select
                  value={grantForm.tier}
                  onChange={(e) => setGrantForm({ ...grantForm, tier: e.target.value })}
                  className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-600 rounded-lg text-white"
                >
                  <option value="FREE">Free (£0.00)</option>
                  <option value="PLAYER">Player (£4.99/mo)</option>
                  <option value="PLAYER_PRO">Player Pro (£9.99/mo)</option>
                  <option value="COACH">Coach (£19.99/mo)</option>
                  <option value="CLUB_MANAGER">Club Manager (£29.99/mo)</option>
                  <option value="LEAGUE_ADMIN">League Admin (£49.99/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Duration (months)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={grantForm.duration}
                  onChange={(e) =>
                    setGrantForm({ ...grantForm, duration: parseInt(e.target.value) })
                  }
                  className="bg-charcoal-900 border-charcoal-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Custom Price (optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Leave empty for default pricing"
                  value={grantForm.customPrice}
                  onChange={(e) => setGrantForm({ ...grantForm, customPrice: e.target.value })}
                  className="bg-charcoal-900 border-charcoal-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Reason (optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Early adopter discount"
                  value={grantForm.reason}
                  onChange={(e) => setGrantForm({ ...grantForm, reason: e.target.value })}
                  className="bg-charcoal-900 border-charcoal-600 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-charcoal-700">
              <Button
                onClick={() => setShowGrantModal(false)}
                variant="outline"
                className="flex-1 text-charcoal-400"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGrantSubscription}
                className="flex-1 bg-gold-600 hover:bg-gold-700 text-charcoal-900"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Grant
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Subscription Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
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
                  <p className="text-white">
                    {selectedSub.isFree ? 'Free' : `£${selectedSub.price.toFixed(2)}`}
                  </p>
                </div>
                <div>
                  <p className="text-charcoal-400 text-sm">Billing Cycle</p>
                  <p className="text-white">{selectedSub.billingCycle}</p>
                </div>
              </div>

              {selectedSub.features && selectedSub.features.length > 0 && (
                <div>
                  <p className="text-charcoal-400 text-sm mb-2">Features</p>
                  <ul className="space-y-1">
                    {selectedSub.features.map((feature, index) => (
                      <li key={index} className="text-white text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-charcoal-700">
              <Button
                onClick={() => handleExtendSubscription(selectedSub)}
                className="flex-1 bg-gold-600 hover:bg-gold-700 text-charcoal-900"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Extend
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-charcoal-400 hover:bg-charcoal-700"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
