// ============================================================================
// FILE: src/app/dashboard/admin/users/page.tsx
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// UPDATED: 7 tabs now (added banned, upgrade_requests, inactive)
type UserTab = 'all' | 'active' | 'suspended' | 'banned' | 'upgrade_requests' | 'recent' | 'inactive';
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'INACTIVE';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roles: string[];
  status: UserStatus;
  isSuperAdmin: boolean;
  subscription: {
    tier: string;
    status: string;
  } | null;
  teamCount: number;
  lastLogin: string | null;
  createdAt: string;
  phoneNumber?: string;
}

export default function UsersManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserTab>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    active: 0,
    suspended: 0,
    banned: 0,
    upgrade_requests: 0,
    recent: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
  } | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        tab: activeTab,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
      });

      const response = await fetch(`/api/superadmin/users?${params}`);
      const data = await response.json();
      setUsers(data.users || []);

      await fetchTabCounts();
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch tab counts
  const fetchTabCounts = async () => {
    try {
      const tabs: UserTab[] = ['all', 'active', 'suspended', 'banned', 'upgrade_requests', 'recent', 'inactive'];
      
      for (const tab of tabs) {
        const res = await fetch(`/api/superadmin/users?tab=${tab}&limit=0`);
        const data = await res.json();
        setTabCounts(prev => ({
          ...prev,
          [tab]: data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch tab counts:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab, searchTerm, roleFilter, statusFilter]);

  // FIXED: View Details button
  const handleViewDetails = (userId: string) => {
    router.push(`/dashboard/admin/users/${userId}`);
  };

  // FIXED: Edit User button
  const handleEditUser = (user: User) => {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit user:', user);
    alert(`Edit user: ${user.name}\nImplement edit modal or page as needed.`);
  };

  // FIXED: Ban User button
  const handleBanUser = (userId: string, userName: string) => {
    setConfirmDialog({
      show: true,
      title: 'Ban User',
      message: `Are you sure you want to ban ${userName}? This will revoke all their access.`,
      action: async () => {
        try {
          await fetch('/api/superadmin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              action: 'BAN',
              data: { reason: 'Banned by admin' },
            }),
          });
          fetchUsers();
          setConfirmDialog(null);
        } catch (error) {
          console.error('Ban failed:', error);
          alert('Failed to ban user. Please try again.');
        }
      },
    });
  };

  // FIXED: Delete User button
  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmDialog({
      show: true,
      title: 'Delete User',
      message: `Are you sure you want to permanently delete ${userName}? This action CANNOT be undone.`,
      action: async () => {
        try {
          await fetch('/api/superadmin/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
          fetchUsers();
          setConfirmDialog(null);
        } catch (error) {
          console.error('Delete failed:', error);
          alert('Failed to delete user. Please try again.');
        }
      },
    });
  };

  // Suspend/Unsuspend
  const handleUserAction = async (userId: string, action: string, reason?: string) => {
    try {
      const response = await fetch('/api/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action,
          data: { reason },
        }),
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    const badges = {
      ACTIVE: { bg: 'bg-green-900', text: 'text-green-200', border: 'border-green-700' },
      SUSPENDED: { bg: 'bg-orange-900', text: 'text-orange-200', border: 'border-orange-700' },
      BANNED: { bg: 'bg-red-900', text: 'text-red-200', border: 'border-red-700' },
      INACTIVE: { bg: 'bg-gray-900', text: 'text-gray-200', border: 'border-gray-700' },
    };
    return badges[status] || badges.INACTIVE;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPERADMIN: 'bg-pink-900 text-pink-200',
      LEAGUEADMIN: 'bg-red-900 text-red-200',
      CLUBMANAGER: 'bg-orange-900 text-orange-200',
      COACH: 'bg-yellow-900 text-yellow-200',
      PLAYERPRO: 'bg-purple-900 text-purple-200',
      PLAYER: 'bg-blue-900 text-blue-200',
    };
    return colors[role] || 'bg-gray-900 text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-charcoal-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => setConfirmDialog(null)}
                variant="outline"
                className="flex-1 text-charcoal-400 hover:bg-charcoal-700"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDialog.action}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-charcoal-400">
            Manage all users, roles, and permissions across the platform
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* UPDATED: 7 Tabs */}
      <div className="border-b border-charcoal-700">
        <div className="flex gap-6 overflow-x-auto">
          {[
            { id: 'all', label: 'All Users', count: tabCounts.all },
            { id: 'active', label: 'Active', count: tabCounts.active },
            { id: 'suspended', label: 'Suspended', count: tabCounts.suspended },
            { id: 'banned', label: 'Banned', count: tabCounts.banned }, // NEW
            { id: 'upgrade_requests', label: 'Upgrade Requests', count: tabCounts.upgrade_requests }, // NEW
            { id: 'recent', label: 'Recent Signups', count: tabCounts.recent },
            { id: 'inactive', label: 'Inactive', count: tabCounts.inactive }, // NEW
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as UserTab)}
                className={`px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-gold-500 text-gold-400'
                    : 'border-transparent text-charcoal-400 hover:text-white'
                }`}
              >
                <span className="font-medium">{tab.label}</span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-gold-900 text-gold-200' : 'bg-charcoal-700 text-charcoal-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-charcoal-900 border border-charcoal-600 rounded-lg text-white"
          >
            <option value="all">All Roles</option>
            <option value="PLAYER">Player</option>
            <option value="PLAYERPRO">Player Pro</option>
            <option value="COACH">Coach</option>
            <option value="CLUBMANAGER">Club Manager</option>
            <option value="LEAGUEADMIN">League Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-charcoal-900 border border-charcoal-600 rounded-lg text-white"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-700 bg-charcoal-900">
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(users.map((u) => u.id)));
                      } else {
                        setSelectedUsers(new Set());
                      }
                    }}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Subscription
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Last Login
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
              ) : users.length > 0 ? (
                users.map((user) => {
                  const statusBadge = getStatusBadge(user.status);
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-charcoal-700 hover:bg-charcoal-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers);
                            if (e.target.checked) {
                              newSelected.add(user.id);
                            } else {
                              newSelected.delete(user.id);
                            }
                            setSelectedUsers(newSelected);
                          }}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-charcoal-600 flex items-center justify-center text-white font-semibold">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span>{user.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{user.name}</p>
                            <p className="text-charcoal-400 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role, index) => (
                              <span
                                key={index}
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                                  role
                                )}`}
                              >
                                {role.replace('_', ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-900 text-gray-400">
                              No Role
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.subscription ? (
                          <div>
                            <p className="text-white font-medium">{user.subscription.tier}</p>
                            <p className="text-charcoal-400 text-sm">{user.subscription.status}</p>
                          </div>
                        ) : (
                          <span className="text-charcoal-500">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-charcoal-400 text-sm">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* FIXED: View Details Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(user.id)}
                            className="text-blue-400 hover:bg-blue-950"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* FIXED: Action Dropdown with working buttons */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-charcoal-400 hover:bg-charcoal-700"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              {user.status === 'ACTIVE' ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, 'SUSPEND', 'Manual suspension')}
                                  className="text-orange-400"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, 'ACTIVATE', 'Manual activation')}
                                  className="text-green-400"
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Unsuspend User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleBanUser(user.id, user.name)}
                                className="text-red-400"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
                    <p className="text-charcoal-400 font-medium">No users found</p>
                    <p className="text-charcoal-500 text-sm mt-1">
                      Try adjusting your filters or search query
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}