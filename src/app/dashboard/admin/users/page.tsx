// src/app/dashboard/admin/users/page.tsx
// SuperAdmin User Management with Tabs

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Download,
  Upload,
  Mail,
  Shield,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION';
type UserRole = 'PLAYER' | 'PLAYER_PRO' | 'COACH' | 'CLUB_MANAGER' | 'LEAGUE_ADMIN' | 'TREASURER' | 'PARENT' | 'SUPERADMIN';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
  subscriptionStatus?: string;
  teamCount?: number;
}

type TabType = 'all' | 'active' | 'suspended' | 'recent';

export default function UsersManagementPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/superadmin/users');
        const data = await response.json();
        setUsers(data.users || mockUsers); // Use mock data if API fails
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUsers(mockUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Mock data for development
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      role: 'PLAYER',
      status: 'ACTIVE',
      createdAt: '2024-01-15T10:00:00Z',
      lastLogin: '2025-11-23T14:30:00Z',
      subscriptionStatus: 'Player FREE',
      teamCount: 2,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'COACH',
      status: 'ACTIVE',
      createdAt: '2024-02-20T10:00:00Z',
      lastLogin: '2025-11-23T12:15:00Z',
      subscriptionStatus: 'Coach',
      teamCount: 1,
    },
    {
      id: '3',
      name: 'Mike Brown',
      email: 'mike@example.com',
      role: 'CLUB_MANAGER',
      status: 'SUSPENDED',
      createdAt: '2024-03-10T10:00:00Z',
      lastLogin: '2025-11-22T09:00:00Z',
      subscriptionStatus: 'Manager',
      teamCount: 3,
    },
    {
      id: '4',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      role: 'PLAYER_PRO',
      status: 'ACTIVE',
      createdAt: '2025-11-20T10:00:00Z',
      lastLogin: '2025-11-23T16:45:00Z',
      subscriptionStatus: 'Player Pro',
      teamCount: 1,
    },
  ];

  // Filter users based on active tab
  const getFilteredUsers = () => {
    let filtered = users;

    // Tab filtering
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter((u) => u.status === 'ACTIVE');
        break;
      case 'suspended':
        filtered = filtered.filter((u) => u.status === 'SUSPENDED' || u.status === 'BANNED');
        break;
      case 'recent':
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((u) => new Date(u.createdAt) > sevenDaysAgo);
        break;
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filtering
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Status filtering
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  // Get role badge color
  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      PLAYER: 'bg-blue-900 text-blue-200 border-blue-700',
      PLAYER_PRO: 'bg-purple-900 text-purple-200 border-purple-700',
      COACH: 'bg-gold-900 text-gold-200 border-gold-700',
      CLUB_MANAGER: 'bg-orange-900 text-orange-200 border-orange-700',
      LEAGUE_ADMIN: 'bg-red-900 text-red-200 border-red-700',
      TREASURER: 'bg-green-900 text-green-200 border-green-700',
      PARENT: 'bg-indigo-900 text-indigo-200 border-indigo-700',
      SUPERADMIN: 'bg-pink-900 text-pink-200 border-pink-700',
    };
    return colors[role] || 'bg-charcoal-700 text-charcoal-200';
  };

  // Get status badge color
  const getStatusBadgeColor = (status: UserStatus) => {
    const colors: Record<UserStatus, { bg: string; text: string; icon: any }> = {
      ACTIVE: { bg: 'bg-green-900', text: 'text-green-200', icon: CheckCircle2 },
      INACTIVE: { bg: 'bg-gray-900', text: 'text-gray-200', icon: XCircle },
      SUSPENDED: { bg: 'bg-orange-900', text: 'text-orange-200', icon: AlertTriangle },
      BANNED: { bg: 'bg-red-900', text: 'text-red-200', icon: Ban },
      PENDING_VERIFICATION: { bg: 'bg-yellow-900', text: 'text-yellow-200', icon: Clock },
    };
    return colors[status] || { bg: 'bg-charcoal-700', text: 'text-charcoal-200', icon: XCircle };
  };

  // Tab counts
  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'all':
        return users.length;
      case 'active':
        return users.filter((u) => u.status === 'ACTIVE').length;
      case 'suspended':
        return users.filter((u) => u.status === 'SUSPENDED' || u.status === 'BANNED').length;
      case 'recent':
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return users.filter((u) => new Date(u.createdAt) > sevenDaysAgo).length;
      default:
        return 0;
    }
  };

  // Handle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-charcoal-400">
            Manage all users, roles, and permissions across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-charcoal-700 hover:bg-charcoal-700">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" className="text-charcoal-700 hover:bg-charcoal-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gold-600 hover:bg-gold-700 text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-charcoal-700">
        <div className="flex gap-6">
          {[
            { id: 'all', label: 'All Users', icon: Users },
            { id: 'active', label: 'Active', icon: CheckCircle2 },
            { id: 'suspended', label: 'Suspended', icon: Ban },
            { id: 'recent', label: 'Recent Signups', icon: Clock },
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white mb-2">Search Users</label>
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

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500"
            >
              <option value="ALL">All Roles</option>
              <option value="PLAYER">Player</option>
              <option value="PLAYER_PRO">Player Pro</option>
              <option value="COACH">Coach</option>
              <option value="CLUB_MANAGER">Club Manager</option>
              <option value="LEAGUE_ADMIN">League Admin</option>
              <option value="TREASURER">Treasurer</option>
              <option value="PARENT">Parent</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
              <option value="PENDING_VERIFICATION">Pending</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('ALL');
                setStatusFilter('ALL');
              }}
              variant="outline"
              size="sm"
              className="text-charcoal-700 hover:bg-charcoal-700"
            >
              Clear Filters
            </Button>
            <span className="text-sm text-charcoal-400">
              Showing {filteredUsers.length} of {users.length} users
            </span>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            <span className="text-blue-200 font-medium">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-charcoal-700 hover:bg-charcoal-700">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
            <Button size="sm" variant="outline" className="text-charcoal-700 hover:bg-charcoal-700">
              <Ban className="w-4 h-4 mr-2" />
              Suspend
            </Button>
            <Button size="sm" variant="outline" className="text-red-700 hover:bg-red-950">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-700 bg-charcoal-900">
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={selectAllUsers}
                    className="w-4 h-4 rounded border-charcoal-600 text-gold-500 focus:ring-gold-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Subscription</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Teams</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Last Login</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const StatusIcon = getStatusBadgeColor(user.status).icon;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-charcoal-700 hover:bg-charcoal-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 rounded border-charcoal-600 text-gold-500 focus:ring-gold-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {user.name.split(' ').map((n) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{user.name}</p>
                            <p className="text-charcoal-400 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <span className={`text-sm ${getStatusBadgeColor(user.status).text}`}>
                            {user.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-charcoal-300">{user.subscriptionStatus}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-charcoal-300">{user.teamCount || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-charcoal-400">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString('en-GB')
                            : 'Never'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-950">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-gold-400 hover:bg-gold-950">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-charcoal-400 hover:bg-charcoal-700">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
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

        {/* Pagination */}
        <div className="px-6 py-4 bg-charcoal-900 border-t border-charcoal-700 flex items-center justify-between">
          <p className="text-sm text-charcoal-400">
            Showing {filteredUsers.length} of {users.length} users
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