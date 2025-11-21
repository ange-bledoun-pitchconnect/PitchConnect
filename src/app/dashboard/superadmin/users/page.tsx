'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CSVImportModal from '@/components/superadmin/CSVImportModal';
import BulkOperationsModal from '@/components/superadmin/BulkOperationsModal';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Eye,
  Settings as SettingsIcon,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Shield,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  status: string;
  createdAt: string;
  avatar?: string;
  phone?: string;
  lastLogin?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SuperAdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const usersPerPage = 10;

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/superadmin/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetchUsers();
    }
  }, [status, router, fetchUsers]);

  // Filter and search
  useEffect(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter((user) => user.roles.includes(filterRole));
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, filterRole, filterStatus, users]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Selection handlers
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map((u) => u.id));
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/20 to-orange-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-charcoal-700 font-bold text-lg">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">Error Loading Users</h1>
          <p className="text-charcoal-600 mb-6">{error}</p>
          <Button onClick={fetchUsers} className="bg-gold-500 hover:bg-gold-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/superadmin')}
                className="hover:bg-neutral-100"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-charcoal-900 mb-2 flex items-center gap-3">
              <Users className="w-10 h-10 text-gold-500" />
              User Management
            </h1>
            <p className="text-charcoal-600">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} total
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={fetchUsers}
              variant="outline"
              size="sm"
              className="border-charcoal-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowImportModal(true)}
              variant="outline"
              size="sm"
              className="border-gold-300 text-gold-600"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button
              onClick={() => {
                const csv = generateCSV(filteredUsers);
                downloadCSV(csv, 'users-export.csv');
              }}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowAddUserModal(true)}
              size="sm"
              className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-charcoal-900 placeholder-charcoal-400"
                />
              </div>

              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="all">All Roles</option>
                <option value="PLAYER">Player</option>
                <option value="PLAYER_PRO">Player Pro</option>
                <option value="COACH">Coach</option>
                <option value="CLUB_MANAGER">Manager</option>
                <option value="LEAGUE_ADMIN">League Admin</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || filterRole !== 'all' || filterStatus !== 'all') && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-charcoal-600">Active filters:</span>
                {searchQuery && (
                  <Badge variant="outline" className="gap-2">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')}>
                      <AlertCircle className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterRole !== 'all' && (
                  <Badge variant="outline" className="gap-2">
                    Role: {filterRole}
                    <button onClick={() => setFilterRole('all')}>
                      <AlertCircle className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterStatus !== 'all' && (
                  <Badge variant="outline" className="gap-2">
                    Status: {filterStatus}
                    <button onClick={() => setFilterStatus('all')}>
                      <AlertCircle className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterRole('all');
                    setFilterStatus('all');
                  }}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gold-600" />
              <span className="font-semibold text-charcoal-900">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowBulkModal(true)}
                size="sm"
                className="bg-gold-500 hover:bg-gold-600 text-white"
              >
                Bulk Actions
              </Button>
              <Button
                onClick={() => setSelectedUsers([])}
                variant="outline"
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedUsers.length === currentUsers.length &&
                          currentUsers.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {currentUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-gold-50 transition-colors ${
                        selectedUsers.includes(user.id) ? 'bg-gold-50' : ''
                      } ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gold-100 to-orange-100 rounded-full flex items-center justify-center font-bold text-gold-600">
                            {user.firstName?.charAt(0) ||
                              user.email?.charAt(0)?.toUpperCase() ||
                              '?'}
                          </div>
                          <div>
                            <p className="font-bold text-charcoal-900">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email}
                            </p>
                            <p className="text-xs text-charcoal-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-semibold">
                          {user.roles[0] || 'PLAYER'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : user.status === 'SUSPENDED'
                              ? 'bg-orange-100 text-orange-700 border-orange-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }
                        >
                          {user.status === 'ACTIVE' && '● Active'}
                          {user.status === 'SUSPENDED' && '⏸ Suspended'}
                          {user.status === 'INACTIVE' && '○ Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs text-charcoal-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-gold-50"
                            onClick={() => handleViewUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="hover:bg-neutral-100">
                            <SettingsIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {currentUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-charcoal-600 font-medium">No users found</p>
                  <p className="text-sm text-charcoal-500 mt-1">
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-charcoal-600">
              Showing {indexOfFirstUser + 1} to{' '}
              {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-charcoal-700 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          fetchUsers();
        }}
      />

      <BulkOperationsModal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setSelectedUsers([]);
        }}
        selectedUsers={selectedUsers}
        onSuccess={() => {
          setShowBulkModal(false);
          setSelectedUsers([]);
          fetchUsers();
        }}
      />

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-charcoal-900 mb-4">Add New User</h2>
            <p className="text-charcoal-600 mb-6">
              Use CSV Import to add multiple users at once, or create individual users through the
              admin panel.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowAddUserModal(false);
                  setShowImportModal(true);
                }}
                className="flex-1 bg-gold-500 hover:bg-gold-600 text-white"
              >
                Open CSV Import
              </Button>
              <Button onClick={() => setShowAddUserModal(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// USER DETAILS MODAL
// ============================================================================

function UserDetailsModal({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-charcoal-900">User Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <AlertCircle className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-gold-100 to-orange-100 rounded-full flex items-center justify-center font-bold text-2xl text-gold-600">
              {user.firstName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-charcoal-900">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </h3>
              <p className="text-charcoal-600">{user.email}</p>
              <Badge className="mt-2">{user.roles[0] || 'PLAYER'}</Badge>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-charcoal-500 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Status
              </p>
              <p className="font-semibold text-charcoal-900">{user.status}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-charcoal-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined
              </p>
              <p className="font-semibold text-charcoal-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>

            {user.phone && (
              <div className="space-y-1">
                <p className="text-xs text-charcoal-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Phone
                </p>
                <p className="font-semibold text-charcoal-900">{user.phone}</p>
              </div>
            )}

            {user.lastLogin && (
              <div className="space-y-1">
                <p className="text-xs text-charcoal-500">Last Login</p>
                <p className="font-semibold text-charcoal-900">
                  {new Date(user.lastLogin).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button className="flex-1 bg-gold-500 hover:bg-gold-600 text-white">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
            <Button variant="outline" className="flex-1">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Edit User
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateCSV(users: User[]): string {
  const headers = ['Email', 'First Name', 'Last Name', 'Role', 'Status', 'Joined'];
  const rows = users.map((user) => [
    user.email,
    user.firstName || '',
    user.lastName || '',
    user.roles[0] || 'PLAYER',
    user.status,
    new Date(user.createdAt).toLocaleDateString(),
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
