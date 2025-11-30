// ============================================================================
// rc/app/dashboard/admin/feed/page.tsx
// World-Class Activity Feed with Advanced Filters
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  User,
  CreditCard,
  Settings as SettingsIcon,
  Clock,
} from 'lucide-react';

interface FeedActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    type?: string;
  } | null;
  timestamp: string;
  metadata?: any;
}

export default function FeedPage() {
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [activityType, setActivityType] = useState('all');
  const [userType, setUserType] = useState('all');
  const [status, setStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch activities
  const fetchActivities = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        dateRange,
        activityType,
        userType,
        status,
        search: searchTerm,
      });

      const response = await fetch(`/api/superadmin/feed?${params}`);
      const data = await response.json();

      if (response.ok) {
        setActivities(data.activities || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalActivities(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, dateRange, activityType, userType, status, searchTerm]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchActivities();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      USER_REGISTRATION: Users,
      SUBSCRIPTION_CHANGE: CreditCard,
      SYSTEM_ACTION: SettingsIcon,
      TEAM_UPDATE: Activity,
      MATCH_EVENT: TrendingUp,
    };
    const Icon = icons[type] || Activity;
    return <Icon className="w-5 h-5" />;
  };

  // Get activity color
  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      USER_REGISTRATION: 'bg-blue-900 text-blue-200 border-blue-700',
      SUBSCRIPTION_CHANGE: 'bg-green-900 text-green-200 border-green-700',
      SYSTEM_ACTION: 'bg-orange-900 text-orange-200 border-orange-700',
      TEAM_UPDATE: 'bg-purple-900 text-purple-200 border-purple-700',
      MATCH_EVENT: 'bg-pink-900 text-pink-200 border-pink-700',
    };
    return colors[type] || 'bg-gray-900 text-gray-200 border-gray-700';
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Timestamp', 'Type', 'Title', 'Description', 'User'];
    const rows = activities.map((a) => [
      new Date(a.timestamp).toISOString(),
      a.type,
      a.title,
      a.description,
      a.user?.name || 'System',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feed-export-${new Date().toISOString()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Activity Feed</h1>
          <p className="text-charcoal-400">
            Real-time activity stream from all users, clubs, and events
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-charcoal-500">
              {totalActivities} total activities
            </span>
            <span className="text-sm text-charcoal-500">•</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm text-charcoal-500">
                {autoRefresh ? 'Auto-refreshing every 30s' : 'Auto-refresh off'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outline"
            className="text-charcoal-400 hover:bg-charcoal-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="text-charcoal-400 hover:bg-charcoal-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={fetchActivities}
            disabled={refreshing}
            className="bg-gold-600 hover:bg-gold-700 text-charcoal-900"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gold-500" />
            <h2 className="text-lg font-bold text-white">Filters</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-charcoal-400 hover:text-white"
          >
            {showFilters ? 'Hide' : 'Show'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-charcoal-500" />
              <Input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-charcoal-900 border-charcoal-600 text-white"
              />
            </div>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-charcoal-900 border border-charcoal-600 rounded-lg text-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            {/* Activity Type */}
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="px-4 py-2 bg-charcoal-900 border border-charcoal-600 rounded-lg text-white"
            >
              <option value="all">All Activities</option>
              <option value="USER_REGISTRATION">User Registrations</option>
              <option value="SUBSCRIPTION_CHANGE">Subscriptions</option>
              <option value="SYSTEM_ACTION">System Actions</option>
              <option value="TEAM_UPDATE">Team Updates</option>
            </select>

            {/* User Type */}
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="px-4 py-2 bg-charcoal-900 border border-charcoal-600 rounded-lg text-white"
            >
              <option value="all">All Users</option>
              <option value="PLAYER">Players</option>
              <option value="COACH">Coaches</option>
              <option value="CLUBMANAGER">Club Managers</option>
              <option value="LEAGUEADMIN">League Admins</option>
            </select>
          </div>
        )}
      </div>

      {/* Activity Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6 hover:border-charcoal-600 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{activity.title}</h3>
                      <p className="text-charcoal-400 mt-1">{activity.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-charcoal-500 text-sm">
                      <Clock className="w-4 h-4" />
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>

                  {/* User Info */}
                  {activity.user && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-charcoal-700">
                      <div className="w-8 h-8 rounded-full bg-charcoal-600 flex items-center justify-center text-white text-sm font-semibold">
                        {activity.user.avatar ? (
                          <img
                            src={activity.user.avatar}
                            alt={activity.user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          activity.user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{activity.user.name}</p>
                        <p className="text-charcoal-500 text-xs">{activity.user.email}</p>
                      </div>
                      {activity.user.type && (
                        <span className="ml-auto px-2 py-1 bg-charcoal-700 text-charcoal-300 text-xs rounded-full">
                          {activity.user.type}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-12 text-center">
            <Activity className="w-16 h-16 text-charcoal-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Activities Yet</h3>
            <p className="text-charcoal-400">
              Activities will appear here as users interact with the platform
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            variant="outline"
            className="text-charcoal-400 hover:bg-charcoal-700"
          >
            Previous
          </Button>
          <span className="text-white px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            variant="outline"
            className="text-charcoal-400 hover:bg-charcoal-700"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}