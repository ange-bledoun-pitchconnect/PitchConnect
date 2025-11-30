// src/app/dashboard/superadmin/subscriptions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  userId: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  tier: string;
  status: string;
  currentPeriodEnd?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    userIds: '',
    tier: 'COACH',
  });

  useEffect(() => {
    fetchSubscriptions();
  }, [page, tierFilter, statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(tierFilter && { tier: tierFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/superadmin/subscriptions?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGrant = async (e: React.FormEvent) => {
    e.preventDefault();

    const userIds = bulkForm.userIds
      .split('\n')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (userIds.length === 0) {
      toast.error('Please enter at least one user ID');
      return;
    }

    try {
      const response = await fetch('/api/superadmin/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk_grant',
          userIds,
          tier: bulkForm.tier,
          durationDays: 365,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to grant subscriptions');
      }

      const data = await response.json();
      toast.success(`Granted ${data.data.granted} subscriptions`);
      setBulkForm({ userIds: '', tier: 'COACH' });
      setShowBulkForm(false);
      await fetchSubscriptions();
    } catch (error) {
      console.error('Error granting subscriptions:', error);
      toast.error('Failed to grant subscriptions');
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage user subscriptions</p>
        </div>
        <button
          onClick={() => setShowBulkForm(!showBulkForm)}
          className="px-4 py-2 bg-gold hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
        >
          {showBulkForm ? 'Cancel' : 'Bulk Grant'}
        </button>
      </div>

      {/* Bulk Grant Form */}
      {showBulkForm && (
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Bulk Grant Subscription</h2>

          <form onSubmit={handleBulkGrant} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User IDs (one per line)
              </label>
              <textarea
                value={bulkForm.userIds}
                onChange={(e) => setBulkForm({ ...bulkForm, userIds: e.target.value })}
                rows={4}
                placeholder="user-id-1\nuser-id-2\nuser-id-3"
                className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subscription Tier
              </label>
              <select
                value={bulkForm.tier}
                onChange={(e) => setBulkForm({ ...bulkForm, tier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="PLAYER_PRO">Player Pro</option>
                <option value="COACH">Coach</option>
                <option value="MANAGER">Manager</option>
                <option value="LEAGUE_ADMIN">League Admin</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-gold hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            >
              Grant Subscriptions
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tier
            </label>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">All Tiers</option>
              <option value="PLAYER_PRO">Player Pro</option>
              <option value="COACH">Coach</option>
              <option value="MANAGER">Manager</option>
              <option value="LEAGUE_ADMIN">League Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-charcoal-800 rounded-lg shadow-sm border border-gray-200 dark:border-charcoal-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No subscriptions found</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-charcoal-700 border-b border-gray-200 dark:border-charcoal-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Expires
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-charcoal-700">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-charcoal-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {sub.user.firstName} {sub.user.lastName}
                      <p className="text-xs text-gray-500">{sub.user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {sub.tier}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        sub.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-charcoal-600 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-charcoal-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
                    className="px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-charcoal-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}