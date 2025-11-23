// src/app/dashboard/admin/impersonate/page.tsx
// View as User / Impersonation Tool

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AlertCircle, Eye, LogIn, Search, User, Mail, Clock } from 'lucide-react';

interface UserForImpersonation {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

export default function ImpersonatePage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [users, setUsers] = useState<UserForImpersonation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserForImpersonation | null>(null);
  const [loading, setLoading] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/superadmin/users');
        // const data = await response.json();
        
        // Mock data for now
        setUsers([
          {
            id: '1',
            name: 'John Smith',
            email: 'john@example.com',
            role: 'PLAYER',
            status: 'ACTIVE',
            createdAt: '2024-01-15T10:00:00Z',
            lastLogin: '2025-11-23T14:30:00Z',
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            role: 'COACH',
            status: 'ACTIVE',
            createdAt: '2024-02-20T10:00:00Z',
            lastLogin: '2025-11-23T12:15:00Z',
          },
          {
            id: '3',
            name: 'Mike Brown',
            email: 'mike@example.com',
            role: 'CLUB_MANAGER',
            status: 'ACTIVE',
            createdAt: '2024-03-10T10:00:00Z',
            lastLogin: '2025-11-22T09:00:00Z',
          },
          {
            id: '4',
            name: 'Emma Wilson',
            email: 'emma@example.com',
            role: 'LEAGUE_ADMIN',
            status: 'ACTIVE',
            createdAt: '2024-01-05T10:00:00Z',
            lastLogin: '2025-11-21T16:45:00Z',
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleImpersonate = async (user: UserForImpersonation) => {
    setImpersonating(true);
    try {
      // TODO: Call API to start impersonation session
      // This should:
      // 1. Log the impersonation action
      // 2. Create a temporary session
      // 3. Redirect to user's dashboard

      // For now, just redirect (in production, this would be handled by the API)
      window.location.href = `/dashboard/impersonate/${user.id}`;
    } catch (error) {
      console.error('Failed to impersonate user:', error);
      setImpersonating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      PLAYER: 'bg-blue-900 text-blue-200',
      PLAYER_PRO: 'bg-purple-900 text-purple-200',
      COACH: 'bg-gold-900 text-gold-200',
      CLUB_MANAGER: 'bg-orange-900 text-orange-200',
      LEAGUE_ADMIN: 'bg-red-900 text-red-200',
      SUPERADMIN: 'bg-pink-900 text-pink-200',
    };
    return colors[role] || 'bg-charcoal-700 text-charcoal-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">View as User</h1>
        <p className="text-charcoal-400">
          Impersonate users to test their experience and debug issues
        </p>
      </div>

      {/* Warning Banner */}
      <div className="p-4 bg-red-950 border border-red-800 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-200 font-semibold text-sm">
            Impersonation Warning
          </p>
          <p className="text-red-300 text-sm mt-1">
            When you impersonate a user, you will see exactly what they see. All actions
            will be logged and attributed to you. Use this feature responsibly for testing
            and support purposes only. Session will auto-logout after 30 minutes.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-charcoal-500" />
              <Input
                type="text"
                placeholder="Name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-charcoal-900 border-charcoal-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Filter by Role
            </label>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-charcoal-900 border-charcoal-600"
            >
              <option value="ALL">All Roles</option>
              <option value="PLAYER">Player</option>
              <option value="PLAYER_PRO">Player Pro</option>
              <option value="COACH">Coach</option>
              <option value="CLUB_MANAGER">Club Manager</option>
              <option value="LEAGUE_ADMIN">League Admin</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('ALL');
              }}
              variant="outline"
              className="w-full text-charcoal-700 hover:bg-charcoal-700"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-700 bg-charcoal-900">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Last Login
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-charcoal-700 hover:bg-charcoal-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-charcoal-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm text-green-400">{user.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-charcoal-400 text-sm">
                        <Clock className="w-4 h-4" />
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('en-GB')
                          : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleImpersonate(user)}
                        disabled={impersonating}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View as User
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <p className="text-charcoal-400">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Results Info */}
        <div className="px-6 py-4 bg-charcoal-900 border-t border-charcoal-700">
          <p className="text-sm text-charcoal-400">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <h3 className="font-bold text-white mb-3">✓ What You'll See</h3>
          <ul className="space-y-2 text-charcoal-300 text-sm">
            <li>• Their complete dashboard view</li>
            <li>• All their teams and data</li>
            <li>• Their actual permissions</li>
            <li>• Their navigation options</li>
          </ul>
        </div>
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <h3 className="font-bold text-white mb-3">⚠️ Important Notes</h3>
          <ul className="space-y-2 text-charcoal-300 text-sm">
            <li>• All actions are logged with your ID</li>
            <li>• Session expires after 30 minutes</li>
            <li>• Email notifications are NOT sent</li>
            <li>• Use for testing and debugging only</li>
          </ul>
        </div>
      </div>
    </div>
  );
}