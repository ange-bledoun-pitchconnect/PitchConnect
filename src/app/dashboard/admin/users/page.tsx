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
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  const [bulkAction, setBulkAction] = useState<string | null>(null);
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
      
      console.log('📊 Users fetched:', data.users?.length || 0);
      
      setUsers(data.users || []);
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
      const response = await fetch('/api/superadmin/users?limit=1000');
      const data = await response.json();
      const allUsers = data.users || [];

      const counts = {
        all: allUsers.length,
        active: allUsers.filter((u: User) => u.status === 'ACTIVE').length,
        suspended: allUsers.filter((u: User) => u.status === 'SUSPENDED').length,
        banned: allUsers.filter((u: User) => u.status === 'BANNED').length,
        upgrade_requests: 0,
        recent: allUsers.filter((u: User) => {
          const createdDate = new Date(u.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdDate >= thirtyDaysAgo;
        }).length,
        inactive: allUsers.filter((u: User) => {
          if (!u.lastLogin) return true;
          const lastLoginDate = new Date(u.lastLogin);
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          return lastLoginDate < ninetyDaysAgo;
        }).length,
      };

      setTabCounts(counts);
    } catch (error) {
      console.error('Failed to fetch tab counts:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTabCounts();
  }, [activeTab, searchTerm, roleFilter, statusFilter]);

  // NEW: Bulk action handlers
  const handleBulkAction = async (action: 'SUSPEND' | 'ACTIVATE' | 'BAN' | 'DELETE') => {
    const userIds = Array.from(selectedUsers);
    
    if (userIds.length === 0) {
      alert('Please select users first');
      return;
    }

    const actionLabels = {
      SUSPEND: 'suspend',
      ACTIVATE: 'activate',
      BAN: 'ban',
      DELETE: 'delete',
    };

    setConfirmDialog({
      show: true,
      title: `${actionLabels[action].charAt(0).toUpperCase() + actionLabels[action].slice(1)} Users`,
      message: `Are you sure you want to ${actionLabels[action]} ${userIds.length} user(s)? This action will be logged.`,
      action: async () => {
        setBulkAction(action);
        try {
          if (action === 'DELETE') {
            const response = await fetch(`/api/superadmin/users?userIds=${userIds.join(',')}`, {
              method: 'DELETE',
            });

            if (!response.ok) throw new Error('Bulk delete failed');
          } else {
            const response = await fetch('/api/superadmin/users', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userIds,
                action,
                data: { reason: `Bulk ${actionLabels[action]} by SuperAdmin` },
              }),
            });

            if (!response.ok) throw new Error(`Bulk ${actionLabels[action]} failed`);
          }

          await fetchUsers();
          await fetchTabCounts();
          setSelectedUsers(new Set());
          setConfirmDialog(null);
        } catch (error) {
          console.error(`Bulk ${actionLabels[action]} error:`, error);
          alert(`Failed to ${actionLabels[action]} users. Please try again.`);
        } finally {
          setBulkAction(null);
        }
      },
    });
  };

  const handleViewDetails = (userId: string) => {
    router.push(`/dashboard/admin/users/${userId}`);
  };

  const handleEditUser = (userId: string) => {
    router.push(`/dashboard/admin/users/${userId}`);
  };

  const handleUpgradeDowngrade = (userId: string) => {
    router.push(`/dashboard/admin/users/${userId}?action=upgrade`);
  };

  const handleBanUser = (userId: string, userName: string) => {
    setConfirmDialog({
      show: true,
      title: 'Ban User',
      message: `Are you sure you want to ban ${userName}? This will revoke all their access.`,
      action: async () => {
        try {
          await fetch(`/api/superadmin/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'BANNED' }),
          });
          fetchUsers();
          fetchTabCounts();
          setConfirmDialog(null);
        } catch (error) {
          console.error('Ban failed:', error);
          alert('Failed to ban user. Please try again.');
        }
      },
    });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmDialog({
      show: true,
      title: 'Delete User',
      message: `Are you sure you want to permanently delete ${userName}? This action CANNOT be undone.`,
      action: async () => {
        try {
          const response = await fetch(`/api/superadmin/users/${userId}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            fetchUsers();
            fetchTabCounts();
            setConfirmDialog(null);
          } else {
            throw new Error('Delete failed');
          }
        } catch (error) {
          console.error('Delete failed:', error);
          alert('Failed to delete user. Please try again.');
        }
      },
    });
  };

  const handleUserAction = async (userId: string, newStatus: UserStatus) => {
    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchUsers();
        await fetchTabCounts();
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
      SUPERADMIN: 'bg-pink-900 text-pink-200 border border-pink-700',
      LEAGUE_ADMIN: 'bg-red-900 text-red-200 border border-red-700',
      CLUB_MANAGER: 'bg-orange-900 text-orange-200 border border-orange-700',
      COACH: 'bg-yellow-900 text-yellow-200 border border-yellow-700',
      PLAYER: 'bg-blue-900 text-blue-200 border border-blue-700',
      PARENT: 'bg-purple-900 text-purple-200 border border-purple-700',
      TREASURER: 'bg-green-900 text-green-200 border border-green-700',
    };
    return colors[role] || 'bg-gray-900 text-gray-200 border border-gray-700';
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

      {/* NEW: Bulk Action Bar */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-950 border border-blue-700 rounded-xl p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold">
              {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleBulkAction('SUSPEND')}
              disabled={!!bulkAction}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              size="sm"
            >
              <UserX className="w-4 h-4 mr-2" />
              Suspend Selected
            </Button>
            <Button
              onClick={() => handleBulkAction('ACTIVATE')}
              disabled={!!bulkAction}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Activate Selected
            </Button>
            <Button
              onClick={() => handleBulkAction('DELETE')}
              disabled={!!bulkAction}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
            <Button
              onClick={() => setSelectedUsers(new Set())}
              variant="outline"
              className="text-charcoal-400 hover:bg-charcoal-700"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
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
          onClick={() => {
            fetchUsers();
            fetchTabCounts();
          }}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-charcoal-700">
        <div className="flex gap-6 overflow-x-auto">
          {[
            { id: 'all', label: 'All Users', count: tabCounts.all },
            { id: 'active', label: 'Active', count: tabCounts.active },
            { id: 'suspended', label: 'Suspended', count: tabCounts.suspended },
            { id: 'banned', label: 'Banned', count: tabCounts.banned },
            { id: 'upgrade_requests', label: 'Upgrade Requests', count: tabCounts.upgrade_requests },
            { id: 'recent', label: 'Recent Signups', count: tabCounts.recent },
            { id: 'inactive', label: 'Inactive', count: tabCounts.inactive },
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
            <option value="COACH">Coach</option>
            <option value="CLUB_MANAGER">Club Manager</option>
            <option value="LEAGUE_ADMIN">League Admin</option>
            <option value="PARENT">Parent</option>
            <option value="TREASURER">Treasurer</option>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Roles</th>
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
                                {role.replace(/_/g, ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-900 text-gray-400">
                              No Roles
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(user.id)}
                            className="text-blue-400 hover:bg-blue-950"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

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
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                onClick={() => handleUpgradeDowngrade(user.id)}
                                className="text-blue-400"
                              >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Upgrade/Downgrade Roles
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {user.status === 'ACTIVE' ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, 'SUSPENDED')}
                                  className="text-orange-400"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : user.status === 'SUSPENDED' ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, 'ACTIVE')}
                                  className="text-green-400"
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Activate User
                                </DropdownMenuItem>
                              ) : null}

                              {user.status !== 'BANNED' && (
                                <DropdownMenuItem
                                  onClick={() => handleBanUser(user.id, user.name)}
                                  className="text-red-400"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Ban User
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

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
