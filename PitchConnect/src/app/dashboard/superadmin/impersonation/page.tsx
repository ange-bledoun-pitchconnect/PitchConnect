// src/app/dashboard/superadmin/impersonation/page.tsx
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ImpersonationSession {
  id: string;
  adminId: string;
  targetUserId: string;
  targetUser: {
    email: string;
    firstName: string;
    lastName: string;
  };
  adminUser: {
    email: string;
    firstName: string;
    lastName: string;
  };
  startedAt: string;
  endedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'ACTIVE' | 'ENDED';
}

export default function ImpersonationPage() {
  const [sessions, setSessions] = useState<ImpersonationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonateForm, setImpersonateForm] = useState({
    userId: '',
    reason: '',
  });
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    fetchImpersonationSessions();
  }, []);

  const fetchImpersonationSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/impersonation');

      if (!response.ok) {
        throw new Error('Failed to fetch impersonation sessions');
      }

      const data = await response.json();
      setSessions(data.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load impersonation sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleStartImpersonation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!impersonateForm.userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    try {
      setImpersonating(true);
      const response = await fetch('/api/superadmin/impersonation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          targetUserId: impersonateForm.userId,
          reason: impersonateForm.reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start impersonation');
      }

      toast.success('Impersonation started. You will be logged in as this user.');
      setImpersonateForm({ userId: '', reason: '' });
      await fetchImpersonationSessions();

      // Redirect to user dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast.error('Failed to start impersonation');
    } finally {
      setImpersonating(false);
    }
  };

  const handleEndImpersonation = async (sessionId: string) => {
    try {
      const response = await fetch('/api/superadmin/impersonation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'end',
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to end impersonation');
      }

      toast.success('Impersonation ended');
      await fetchImpersonationSessions();
    } catch (error) {
      console.error('Error ending impersonation:', error);
      toast.error('Failed to end impersonation');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Impersonation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Temporarily login as another user for debugging and support
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
              Impersonation Enabled
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
              All actions while impersonating are logged for audit purposes. Use only for legitimate
              support and debugging activities.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Start Impersonation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Start Impersonation</h2>

            <form onSubmit={handleStartImpersonation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={impersonateForm.userId}
                  onChange={(e) =>
                    setImpersonateForm({ ...impersonateForm, userId: e.target.value })
                  }
                  placeholder="Paste user ID here"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={impersonateForm.reason}
                  onChange={(e) =>
                    setImpersonateForm({ ...impersonateForm, reason: e.target.value })
                  }
                  placeholder="Why are you impersonating this user?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={impersonating}
                className="w-full px-4 py-2 bg-gold hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {impersonating ? 'Starting...' : 'Start Impersonation'}
              </button>
            </form>
          </div>
        </div>

        {/* Impersonation History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-charcoal-800 rounded-lg shadow-sm border border-gray-200 dark:border-charcoal-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-charcoal-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Impersonation History
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No impersonation sessions yet</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-charcoal-700">
                {sessions.map((session) => (
                  <div key={session.id} className="p-6 hover:bg-gray-50 dark:hover:bg-charcoal-700 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              session.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Admin: {session.adminUser.firstName} {session.adminUser.lastName}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">{session.adminUser.email}</p>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">→</span>
                        </div>

                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Target: {session.targetUser.firstName} {session.targetUser.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{session.targetUser.email}</p>
                      </div>

                      {session.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleEndImpersonation(session.id)}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200 rounded text-xs font-semibold transition-colors"
                        >
                          End Session
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-charcoal-600">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Started</p>
                        <p>{new Date(session.startedAt).toLocaleString()}</p>
                      </div>
                      {session.endedAt && (
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">Ended</p>
                          <p>{new Date(session.endedAt).toLocaleString()}</p>
                        </div>
                      )}
                      {session.ipAddress && (
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">IP Address</p>
                          <p className="font-mono">{session.ipAddress}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}