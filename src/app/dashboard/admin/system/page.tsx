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

  // Fetch system data
  useEffect(() => {
    const fetchSystemData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/superadmin/system?type=${activeTab}`);
        const data = await response.json();
        setHealth(data.health || mockHealth);
        setLogs(data.logs || mockLogs);
      } catch (error) {
        console.error('Failed to fetch system data:', error);
        setHealth(mockHealth);
        setLogs(mockLogs);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemData();
  }, [activeTab]);

  // Mock data
  const mockHealth: SystemHealth = {
    status: 'healthy',
    uptime: 99.98,
    apiResponseTime: 245,
    databaseConnections: 15,
    errorRate: 0.02,
    requestsPerMinute: 1250,
  };

  const mockLogs: AuditLog[] = [
    {
      id: 'log-1',
      performedBy: 'admin-1',
      performedByName: 'Admin User',
      affectedUser: 'user-1',
      affectedUserName: 'John Smith',
      action: 'USER_SUSPENDED',
      entityType: 'User',
      entityId: 'user-1',
      reason: 'Violation of terms',
      timestamp: '2025-11-23T18:30:00Z',
      ipAddress: '192.168.1.100',
    },
    {
      id: 'log-2',
      performedBy: 'admin-1',
      performedByName: 'Admin User',
      affectedUser: 'user-2',
      affectedUserName: 'Sarah Johnson',
      action: 'SUBSCRIPTION_GRANTED',
      entityType: 'Subscription',
      entityId: 'sub-2',
      reason: 'Coach subscription granted for 1 month(s)',
      timestamp: '2025-11-23T17:15:00Z',
      ipAddress: '192.168.1.100',
    },
    {
      id: 'log-3',
      performedBy: 'admin-1',
      performedByName: 'Admin User',
      affectedUser: 'user-3',
      affectedUserName: 'Mike Brown',
      action: 'ROLE_UPGRADED',
      entityType: 'User',
      entityId: 'user-3',
      reason: 'Roles updated to: COACH',
      timestamp: '2025-11-23T16:45:00Z',
      ipAddress: '192.168.1.100',
    },
    {
      id: 'log-4',
      performedBy: 'admin-1',
      performedByName: 'Admin User',
      action: 'SYSTEM_CONFIG_CHANGED',
      entityType: 'System',
      entityId: 'config-1',
      reason: 'Updated payment gateway settings',
      timestamp: '2025-11-23T15:30:00Z',
      ipAddress: '192.168.1.100',
    },
  ];

  // Filter logs
  const getFilteredLogs = () => {
    let filtered = logs;

    // Tab filtering
    switch (activeTab) {
      case 'user_actions':
        filtered = filtered.filter((log) =>
          ['USER_SUSPENDED', 'USER_UPDATED', 'USER_BANNED', 'ROLE_UPGRADED'].includes(log.action)
        );
        break;
      case 'subscription_actions':
        filtered = filtered.filter((log) =>
          ['SUBSCRIPTION_GRANTED', 'SUBSCRIPTION_EXTENDED', 'SUBSCRIPTION_CHANGED'].includes(
            log.action
          )
        );
        break;
      case 'security':
        filtered = filtered.filter((log) =>
          ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'PASSWORD_CHANGED'].includes(log.action)
        );
        break;
      case 'errors':
        filtered = filtered.filter((log) => log.action.includes('ERROR'));
        break;
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.affectedUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
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
    switch (tab) {
      case 'all':
        return logs.length;
      case 'user_actions':
        return logs.filter((log) =>
          ['USER_SUSPENDED', 'USER_UPDATED', 'USER_BANNED', 'ROLE_UPGRADED'].includes(log.action)
        ).length;
      case 'subscription_actions':
        return logs.filter((log) =>
          ['SUBSCRIPTION_GRANTED', 'SUBSCRIPTION_EXTENDED', 'SUBSCRIPTION_CHANGED'].includes(
            log.action
          )
        ).length;
      case 'security':
        return logs.filter((log) =>
          ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'PASSWORD_CHANGED'].includes(log.action)
        ).length;
      case 'errors':
        return logs.filter((log) => log.action.includes('ERROR')).length;
      default:
        return 0;
    }
  };

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
            variant="outline"
            className="text-charcoal-700 hover:bg-charcoal-700"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="text-charcoal-700 hover:bg-charcoal-700">
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
              {health?.status?.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-500" />
              <p className="text-charcoal-400 text-sm">Uptime</p>
            </div>
            <p className="text-2xl font-bold text-white">{health?.uptime}%</p>
          </div>

          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <p className="text-charcoal-400 text-sm">API Response</p>
            </div>
            <p className="text-2xl font-bold text-white">{health?.apiResponseTime}ms</p>
          </div>

          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-500" />
              <p className="text-charcoal-400 text-sm">DB Connections</p>
            </div>
            <p className="text-2xl font-bold text-white">{health?.databaseConnections}</p>
          </div>

          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-charcoal-400 text-sm">Error Rate</p>
            </div>
            <p className="text-2xl font-bold text-white">{health?.errorRate}%</p>
          </div>

          <div className="bg-charcoal-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <p className="text-charcoal-400 text-sm">Requests/min</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {health?.requestsPerMinute.toLocaleString()}
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
        <div className="flex gap-6">
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

      {/* Search */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-charcoal-500" />
            <Input
              type="text"
              placeholder="Search logs by action, user, or reason..."
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
              className="text-charcoal-700 hover:bg-charcoal-700"
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
                          className="text-blue-400 hover:bg-blue-950"
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
            Showing {filteredLogs.length} of {logs.length} logs
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