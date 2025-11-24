// src/app/dashboard/admin/impersonate/page.tsx
// SuperAdmin View as User (FIXED redirect)

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  status: string;
  avatar?: string;
}

export default function ImpersonatePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [impersonating, setImpersonating] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search users
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/superadmin/users?search=${encodeURIComponent(searchTerm)}&limit=20`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to search users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle impersonate with confirmation
  const confirmImpersonate = (user: User) => {
    if (user.status !== 'ACTIVE') {
      setError(`Cannot impersonate ${user.status.toLowerCase()} users`);
      return;
    }
    setSelectedUser(user);
  };

  // Execute impersonation
  const handleImpersonate = async () => {
    if (!selectedUser) return;

    setImpersonating(true);
    setError('');

    try {
      // Option 1: Use query parameter (simpler, for testing)
      // Router will pass impersonate userId to dashboard
      router.push(`/dashboard?impersonate=${selectedUser.id}`);

      // Option 2: Use dedicated API (more secure, recommended for production)
      // const response = await fetch('/api/superadmin/impersonate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId: selectedUser.id }),
      // });
      // 
      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.error || 'Failed to impersonate user');
      // }
      // 
      // // Redirect to their dashboard
      // router.push('/dashboard');
    } catch (err) {
      console.error('Impersonate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to impersonate user');
      setImpersonating(false);
    }
  };

  const getRoleBadgeColor = (userType: string) => {
    const colors: Record<string, string> = {
      SUPERADMIN: 'bg-pink-900 text-pink-200 border-pink-700',
      LEAGUEADMIN: 'bg-red-900 text-red-200 border-red-700',
      MANAGER: 'bg-orange-900 text-orange-200 border-orange-700',
      COACH: 'bg-yellow-900 text-yellow-200 border-yellow-700',
      PLAYER_PRO: 'bg-purple-900 text-purple-200 border-purple-700',
      PLAYER: 'bg-blue-900 text-blue-200 border-blue-700',
    };
    return colors[userType] || 'bg-gray-900 text-gray-200 border-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-900 text-green-200 border-green-700',
      SUSPENDED: 'bg-orange-900 text-orange-200 border-orange-700',
      BANNED: 'bg-red-900 text-red-200 border-red-700',
      INACTIVE: 'bg-gray-900 text-gray-200 border-gray-700',
    };
    return colors[status] || 'bg-gray-900 text-gray-200 border-gray-700';
  };

  const formatUserTypeName = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">View as User</h1>
          <p className="text-charcoal-400">
            Impersonate a user to see their dashboard and experience
          </p>
        </div>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="text-charcoal-400 hover:bg-charcoal-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Warning */}
      <div className="bg-orange-950 border border-orange-700 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-orange-200 font-semibold mb-1">Security Notice</h3>
          <p className="text-orange-300 text-sm">
            All impersonation sessions are logged and monitored. You'll see exactly what the
            user sees, including their personal data. Use this feature responsibly and only
            for support or debugging purposes.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Search Users</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-charcoal-500" />
            <Input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-charcoal-900 border-charcoal-600 text-white"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-3 w-5 h-5 text-gold-500 animate-spin" />
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950 border border-red-700 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {users.length > 0 && (
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-charcoal-700">
            <h2 className="text-xl font-bold text-white">Search Results</h2>
            <p className="text-charcoal-400 text-sm mt-1">
              Found {users.length} user{users.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="divide-y divide-charcoal-700">
            {users.map((user) => (
              <div
                key={user.id}
                className="px-6 py-4 hover:bg-charcoal-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-charcoal-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span>{user.firstName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-charcoal-400 text-sm truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Role */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                          user.userType
                        )}`}
                      >
                        {formatUserTypeName(user.userType)}
                      </span>
                      {/* Status */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          user.status
                        )}`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <Button
                  onClick={() => confirmImpersonate(user)}
                  disabled={user.status !== 'ACTIVE'}
                  className="bg-gold-600 hover:bg-gold-700 text-charcoal-900 ml-4 flex-shrink-0"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View as User
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {searchTerm && !loading && users.length === 0 && !error && (
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-12 text-center">
          <Search className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">No users found</h3>
          <p className="text-charcoal-400 text-sm">
            Try searching with a different name, email, or user ID
          </p>
        </div>
      )}

      {/* Empty state */}
      {!searchTerm && users.length === 0 && (
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-12 text-center">
          <Search className="w-16 h-16 text-charcoal-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">
            Search for a user to impersonate
          </h3>
          <p className="text-charcoal-400 mb-6">
            Enter a name, email, or user ID above to find users
          </p>
          <div className="max-w-md mx-auto text-left space-y-2">
            <div className="flex items-start gap-2 text-sm text-charcoal-400">
              <span className="text-gold-500 font-semibold">•</span>
              <span>You'll see exactly what the user sees in their dashboard</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-charcoal-400">
              <span className="text-gold-500 font-semibold">•</span>
              <span>All impersonation sessions are logged for security audits</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-charcoal-400">
              <span className="text-gold-500 font-semibold">•</span>
              <span>Only ACTIVE users can be impersonated</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-charcoal-400">
              <span className="text-gold-500 font-semibold">•</span>
              <span>Look for the admin banner to return to superadmin panel</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Confirm Impersonation</h3>
            </div>

            <div className="space-y-4">
              <p className="text-charcoal-300">You are about to view the platform as:</p>
              
              <div className="bg-charcoal-900 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-charcoal-700 flex items-center justify-center text-white font-semibold">
                    {selectedUser.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span>{selectedUser.firstName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                    <p className="text-charcoal-400 text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(selectedUser.userType)}`}>
                    {formatUserTypeName(selectedUser.userType)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3">
                <p className="text-yellow-200 text-sm">
                  ⚠️ This action will be logged. You'll have full access to this user's data
                  and dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setSelectedUser(null);
                  setError('');
                }}
                variant="outline"
                className="flex-1 text-charcoal-400 hover:bg-charcoal-700"
                disabled={impersonating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImpersonate}
                className="flex-1 bg-gold-600 hover:bg-gold-700 text-charcoal-900"
                disabled={impersonating}
              >
                {impersonating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Switching...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Confirm & View
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
