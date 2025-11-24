// src/app/dashboard/admin/system/page.tsx
// SuperAdmin System Health & Audit Logs

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Server,
  Shield,
  TrendingUp,
  Users,
  XCircle,
  Zap,
  AlertCircle,
  X,
} from 'lucide-react';

type LogType = 'all' | 'user_actions' | 'subscription_actions' | 'security' | 'errors';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  apiResponseTime: number;
  databaseConnections: number;
  errorRate: number;
  requestsPerMinute: number;
}

interface AuditLog {
  id: string;
  performedBy: string;
  performedByName: string;
  affectedUser?: string;
  affectedUserName?: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string;
  timestamp: string;
  ipAddress?: string;
}

export default function SystemLogsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<LogType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch system data
  const fetchSystemData = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/superadmin/system?type=${activeTab}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch system data');
      }

      const data = await response.json();
      setHealth(data.health || null);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch system data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load system data');
      setHealth(null);
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, [activeTab]);

  // Filter logs by search term
  const getFilteredLogs = () => {
    if (!searchTerm) return logs;

    return logs.filter(
      (log) =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.affectedUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredLogs = getFilteredLogs();

  const getActionBadgeColor = (action: string) => {
    if (action.includes('SUSPENDED') || action.includes('BANNED') || action.includes('DELETED')) {
      return 'bg-red-900 text-red-200 border-red-700';
    }
    if (action.includes('GRANTED') || action.includes('UPGRADED')) {
      return 'bg-green-900 text-green-200 border-green-700';
    }
    if (action.includes('UPDATED') || action.includes('CHANGED')) {
      return 'bg-blue-900 text-blue-200 border-blue-700';
    }
    if (action.includes('ERROR') || action.includes('FAILED')) {
      return 'bg-red-900 text-red-200 border-red-700';
    }
    return 'bg-charcoal-700 text-charcoal-200 border-charcoal-600';
  };

  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTabCount = (tab: LogType) => {
    if (tab === 'all') return logs.length;

    const actionMap: Record<LogType, string[]> = {
      all: [],
      user_actions: ['USER_SUSPENDED', 'USER_UPDATED', 'USER_BANNED', 'ROLE_UPGRADED'],
      subscription_actions: ['SUBSCRIPTION_GRANTED', 'SUBSCRIPTION_EXTENDED', 'SUBSCRIPTION_CHANGED'],
      security: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'PASSWORD_CHANGED'],
      errors: [], // Special case: includes 'ERROR'
    };

    if (tab === 'errors') {
      return logs.filter((log) => log.action.includes('ERROR')).length;
    }

    return logs.filter((log) => actionMap[tab].includes(log.action)).length;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-charcoal-700 rounded animate-pulse"></div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-charcoal-700 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-charcoal-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="h-64 bg-charcoal-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">System & Logs</h1>
            <p className="text-charcoal-400">System health and audit trails</p>
          </div>
          <Button onClick={fetchSystemData} className="bg-blue-600 hover:bg-blue-700 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <div className="bg-red-950 border border-red-700 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-200 font-semibold mb-1">Failed to Load System Data</h3>
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-red-400 text-xs mt-2">
              Please check your connection and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System & Logs</h1>
          <p className="text-charcoal-400">
            System health monitoring, audit trails, and security events
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchSystemData}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" className="text-charcoal-400 hover:bg-charcoal-700">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">System Health</h2>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className={`font-semibold ${getStatusColor(health?.status || 'healthy')}`}>
              {health?.status?.toUpperCase() || 'HEALTHY'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-500" />
              <p className="text-charcoal-400 text-sm">Uptime</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {health?.uptime !== undefined ? `${health.uptime}%` : '---'}
            </p>
          </div>

          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <p className="text-charcoal-400 text-sm">API Response</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {health?.apiResponseTime !== undefined ? `${health.apiResponseTime}ms` : '---'}
            </p>
          </div>

          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-500" />
              <p className="text-charcoal-400 text-sm">DB Connections</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {health?.databaseConnections !== undefined ? health.databaseConnections : '---'}
            </p>
          </div>

          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-charcoal-400 text-sm">Error Rate</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {health?.errorRate !== undefined ? `${health.errorRate}%` : '---'}
            </p>
          </div>

          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <p className="text-charcoal-400 text-sm">Requests/min</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {health?.requestsPerMinute !== undefined
                ? health.requestsPerMinute.toLocaleString()
                : '---'}
            </p>
          </div>

          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-gold-500" />
              <p className="text-charcoal-400 text-sm">Status</p>
            </div>
            <p className="text-2xl font-bold text-green-500">ONLINE</p>
          </div>
        </div>
      </div>

      {/* Audit Logs Tabs */}
      <div className="border-b border-charcoal-700">
        <div className="flex gap-6 overflow-x-auto">
          {[
            { id: 'all', label: 'All Logs', icon: Activity },
            { id: 'user_actions', label: 'User Actions', icon: Users },
            { id: 'subscription_actions', label: 'Subscriptions', icon: CheckCircle2 },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'errors', label: 'Errors', icon: XCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = getTabCount(tab.id as LogType);

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LogType)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
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

      {/* Search */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-charcoal-500" />
            <Input
              type="text"
              placeholder="Search logs by action, user, reason, or IP address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-charcoal-900 border-charcoal-600 text-white"
            />
          </div>
          {searchTerm && (
            <Button
              onClick={() => setSearchTerm('')}
              variant="outline"
              size="sm"
              className="text-charcoal-400 hover:bg-charcoal-700"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-700 bg-charcoal-900">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Action</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Performed By
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Affected User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Reason</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-charcoal-700 hover:bg-charcoal-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-charcoal-500" />
                        <span className="text-charcoal-300 text-sm">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{log.performedByName}</p>
                      {log.ipAddress && (
                        <p className="text-charcoal-400 text-xs font-mono">{log.ipAddress}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.affectedUserName ? (
                        <p className="text-white">{log.affectedUserName}</p>
                      ) : (
                        <span className="text-charcoal-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-charcoal-300 text-sm max-w-md truncate">{log.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-400 hover:bg-blue-950"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Activity className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
                    <p className="text-charcoal-400 font-medium">No logs found</p>
                    <p className="text-charcoal-500 text-sm mt-1">
                      {searchTerm
                        ? 'Try adjusting your search query'
                        : 'No audit logs available for this filter'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="px-6 py-4 bg-charcoal-900 border-t border-charcoal-700 flex items-center justify-between">
            <p className="text-sm text-charcoal-400">
              Showing {filteredLogs.length} of {logs.length} logs
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled className="text-charcoal-400">
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-charcoal-400 hover:bg-charcoal-700"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-charcoal-800 border-b border-charcoal-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Audit Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-charcoal-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-charcoal-400 text-sm mb-1">Action</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${getActionBadgeColor(
                    selectedLog.action
                  )}`}
                >
                  {selectedLog.action.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-charcoal-400 text-sm mb-1">Timestamp</p>
                  <p className="text-white">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <p className="text-charcoal-400 text-sm mb-1">Entity Type</p>
                  <p className="text-white">{selectedLog.entityType}</p>
                </div>
              </div>

              <div>
                <p className="text-charcoal-400 text-sm mb-1">Performed By</p>
                <p className="text-white font-medium">{selectedLog.performedByName}</p>
                {selectedLog.ipAddress && (
                  <p className="text-charcoal-400 text-sm font-mono mt-1">
                    IP: {selectedLog.ipAddress}
                  </p>
                )}
              </div>

              {selectedLog.affectedUserName && (
                <div>
                  <p className="text-charcoal-400 text-sm mb-1">Affected User</p>
                  <p className="text-white">{selectedLog.affectedUserName}</p>
                  <p className="text-charcoal-400 text-sm font-mono mt-1">
                    ID: {selectedLog.affectedUser}
                  </p>
                </div>
              )}

              <div>
                <p className="text-charcoal-400 text-sm mb-1">Reason</p>
                <p className="text-white">{selectedLog.reason}</p>
              </div>

              <div>
                <p className="text-charcoal-400 text-sm mb-1">Entity ID</p>
                <p className="text-charcoal-300 font-mono text-sm">{selectedLog.entityId}</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-charcoal-900 border-t border-charcoal-700 px-6 py-4 flex justify-end">
              <Button
                onClick={() => setSelectedLog(null)}
                className="bg-charcoal-700 hover:bg-charcoal-600 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
