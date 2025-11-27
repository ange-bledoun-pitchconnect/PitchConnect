// src/app/dashboard/superadmin/users/[userId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface UserDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  status: string;
  subscription?: any;
  createdAt: string;
  lastLogin?: string;
  auditLogs: Array<any>;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    subscriptionTier: '',
  });

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/superadmin/users/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.data);
      setFormData({
        status: data.data.status,
        subscriptionTier: data.data.subscription?.tier || 'FREE',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: formData.status,
          subscriptionTier: formData.subscriptionTier !== 'FREE' ? formData.subscriptionTier : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      toast.success('User updated successfully');
      await fetchUserDetails();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading user details...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">User not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {user.firstName} {user.lastName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info & Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Account Information</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{user.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Subscription Tier</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {user.subscription?.tier || 'FREE'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Login</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Roles</p>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Update User Form */}
          <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Update User</h2>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BANNED">Banned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subscription Tier
                </label>
                <select
                  value={formData.subscriptionTier}
                  onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="FREE">Free</option>
                  <option value="PLAYER_PRO">Player Pro</option>
                  <option value="COACH">Coach</option>
                  <option value="MANAGER">Manager</option>
                  <option value="LEAGUE_ADMIN">League Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full px-4 py-2 bg-gold hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update User'}
              </button>
            </form>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>

          <div className="space-y-4">
            {user.auditLogs?.slice(0, 10).map((log) => (
              <div key={log.id} className="border-l-2 border-gold pl-4 py-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{log.action}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(log.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}

            {(!user.auditLogs || user.auditLogs.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}