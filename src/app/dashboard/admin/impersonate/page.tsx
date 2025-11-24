// src/app/dashboard/admin/impersonate/page.tsx
// SuperAdmin View as User (FIXED redirect)

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  UserCheck,
  Shield,
  AlertCircle,
  RefreshCw,
  LogOut,
  User,
  Mail,
  Calendar,
  Activity,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  status: string;
  isSuperAdmin: boolean;
  createdAt: string;
  lastLogin: string | null;
  userRoles?: { roleName: string }[];
  subscription?: { tier: string; status: string };
}

export default function ImpersonatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (search?: string) => {
    setSearching(!!search);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      params.append('limit', '20');

      const response = await fetch(`/api/superadmin/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchUsers(searchTerm);
      } else {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Impersonate user
  const handleImpersonate = async (userId: string) => {
    setImpersonating(userId);

    try {
      const response = await fetch('/api/superadmin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to impersonate user');
      }

      // Redirect to user's dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Impersonate error:', err);
      alert(err instanceof Error ? err.message : 'Failed to impersonate user');
      setImpersonating(null);
    }
  };

  // Get user initials (null-safe)
  const getUserInitials = (user: User): string => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return '?';
  };

  // Get user full name (null-safe)
  const getUserName = (user: User): string => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    
    return 'Unnamed User';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-charcoal-700 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-charcoal-700 rounded animate-pulse"></div>
        </div>
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="h-64 bg-charcoal-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">View as User</h1>
          <p className="text-charcoal-400">
            Impersonate a user to view the system from their perspective
          </p>
        </div>
        <Button
          onClick={() => fetchUsers(searchTerm)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-900 border border-yellow-700 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-yellow-200 font-semibold mb-1">
            Impersonation Mode
          </h3>
          <p className="text-yellow-300 text-sm">
            You'll be logged in as the selected user. All actions will be performed as that user.
            To return to your admin account, use the "Exit Impersonation" button in the header.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-charcoal-500" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-charcoal-900 border-charcoal-600 text-white"
          />
          {searching && (
            <RefreshCw className="absolute right-3 top-3 w-5 h-5 text-charcoal-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-950 border border-red-700 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-200 font-semibold mb-1">Error Loading Users</h3>
            <p className="text-red-300 text-sm">{error}</p>
            <Button
              onClick={() => fetchUsers(searchTerm)}
              className="mt-3 bg-red-800 hover:bg-red-700 text-white"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        {users.length > 0 ? (
          <div className="divide-y divide-charcoal-700">
            {users.map((user) => (
              <div
                key={user.id}
                className="p-6 hover:bg-charcoal-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-white font-bold text-lg">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={getUserName(user)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span>{getUserInitials(user)}</span>
                      )}
                    </div>

                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">
                          {getUserName(user)}
                        </h3>
                        {user.isSuperAdmin && (
                          <span className="px-2 py-0.5 bg-red-900 text-red-200 text-xs font-semibold rounded-full border border-red-700">
                            SUPER ADMIN
                          </span>
                        )}
                        {user.status === 'ACTIVE' && (
                          <span className="px-2 py-0.5 bg-green-900 text-green-200 text-xs font-semibold rounded-full border border-green-700">
                            ACTIVE
                          </span>
                        )}
                        {user.status === 'SUSPENDED' && (
                          <span className="px-2 py-0.5 bg-yellow-900 text-yellow-200 text-xs font-semibold rounded-full border border-yellow-700">
                            SUSPENDED
                          </span>
                        )}
                        {user.status === 'BANNED' && (
                          <span className="px-2 py-0.5 bg-red-900 text-red-200 text-xs font-semibold rounded-full border border-red-700">
                            BANNED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-charcoal-400">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.userRoles && user.userRoles.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>{user.userRoles.map(r => r.roleName).join(', ')}</span>
                          </div>
                        )}
                        {user.subscription && (
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            <span>
                              {user.subscription.tier} - {user.subscription.status}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-xs text-charcoal-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {user.lastLogin && (
                          <div>
                            Last login: {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleImpersonate(user.id)}
                    disabled={impersonating === user.id || user.isSuperAdmin}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {impersonating === user.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Switching...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        View as User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
            <p className="text-charcoal-400 font-medium">
              {searchTerm ? 'No users found' : 'No users available'}
            </p>
            <p className="text-charcoal-500 text-sm mt-1">
              {searchTerm
                ? 'Try adjusting your search query'
                : 'Users will appear here once they register'}
            </p>
          </div>
        )}
      </div>

      {/* User Count */}
      {users.length > 0 && (
        <div className="text-center text-sm text-charcoal-400">
          Showing {users.length} user{users.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}
    </div>
  );
}
