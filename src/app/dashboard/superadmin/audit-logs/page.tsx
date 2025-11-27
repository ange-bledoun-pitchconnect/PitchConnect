// src/app/dashboard/superadmin/audit-logs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  performedById: string;
  performedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  targetUserId?: string;
  action: string;
  details: Record<string, any>;
  timestamp: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter, dateFrom, dateTo]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(actionFilter && { action: actionFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/superadmin/audit-logs?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (action.includes('DELETED')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (action.includes('SUSPENDED') || action.includes('BANNED')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (action.includes('REFUNDED') || action.includes('PAYMENT')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (action.includes('IMPERSONAT')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const actionOptions = [
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'USER_SUSPENDED',
    'USER_BANNED',
    'USER_UNBANNED',
    'SUBSCRIPTION_GRANTED',
    'SUBSCRIPTION_CANCELLED',
    'PAYMENT_REFUNDED',
    'USER_IMPERSONATED',
    'IMPERSONATION_ENDED',
    'DATA_EXPORTED',
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Complete history of all SuperAdmin actions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action Type
            </label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">All Actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-charcoal-800 rounded-lg shadow-sm border border-gray-200 dark:border-charcoal-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit logs found</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-charcoal-700 border-b border-gray-200 dark:border-charcoal-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Target User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-charcoal-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-charcoal-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div>
                        <p className="font-semibold">
                          {log.performedBy.firstName} {log.performedBy.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{log.performedBy.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getActionBadgeColor(log.action)}`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {log.targetUserId ? (
                        <code className="bg-gray-100 dark:bg-charcoal-700 px-2 py-1 rounded text-xs">
                          {log.targetUserId.substring(0, 8)}...
                        </code>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <details className="cursor-pointer">
                        <summary className="text-gold hover:text-orange-600 font-medium">
                          View
                        </summary>
                        <div className="mt-2 bg-gray-50 dark:bg-charcoal-700 p-3 rounded text-xs font-mono">
                          <pre className="whitespace-pre-wrap break-words">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-charcoal-600 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.pages} • Total: {pagination.total} logs
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

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Logs</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {pagination?.total.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Logs This Month</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {logs.length > 0 ? logs.length : '—'}
          </p>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Last Action</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
            {logs.length > 0
              ? new Date(logs[0].timestamp).toLocaleTimeString()
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}