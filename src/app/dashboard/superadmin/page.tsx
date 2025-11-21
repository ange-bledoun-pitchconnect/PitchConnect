'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CSVImportModal from '@/components/superadmin/CSVImportModal';
import BulkOperationsModal from '@/components/superadmin/BulkOperationsModal';
import {
  ShieldCheck,
  Users,
  Target,
  Bell,
  Plus,
  BarChart3,
  AlertCircle,
  Eye,
  CheckCircle2,
  TrendingUp,
  Zap,
  Activity,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Search,
  Upload,
  Settings as SettingsIcon,
  UserX,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface RoleRequest {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    userType: string;
    avatar?: string;
  };
  currentRole: string;
  requestedRole: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  totalLeagues: number;
  totalRevenue: number;
  monthlyRevenue: number;
  subscriptionRate: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface UsersByRole {
  PLAYER: number;
  PLAYER_PRO: number;
  COACH: number;
  CLUB_MANAGER: number;
  LEAGUE_ADMIN: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: { name: string; email: string };
}

interface SuperAdminData {
  admin: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  stats: PlatformStats;
  usersByRole: UsersByRole;
  upgradeRequests: RoleRequest[];
  recentActivity: RecentActivity[];
}

interface RealUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  status: string;
  createdAt: string;
  avatar?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [adminData, setAdminData] = useState<SuperAdminData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/superadmin/dashboard');

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to fetch superadmin data');
      }

      const data = await response.json();
      setAdminData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.email) {
      fetchAdminData();
    }
  }, [status, session, router, fetchAdminData]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/20 to-orange-50/20 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-charcoal-700 font-bold text-lg">Loading SuperAdmin Panel...</p>
          <p className="text-charcoal-500 text-sm mt-2">Preparing your control center</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-charcoal-900 mb-3">Access Denied</h1>
          <p className="text-charcoal-600 mb-8 leading-relaxed">{error}</p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold px-8 py-3 rounded-xl shadow-gold hover:shadow-xl transition-all transform hover:scale-105"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/20 to-orange-50/20 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <ShieldCheck className="w-16 h-16 text-gold-500 mx-auto mb-6 animate-bounce" />
          <h1 className="text-3xl font-bold text-charcoal-900 mb-3">Super Admin Panel</h1>
          <p className="text-charcoal-600 text-lg">Setting up your administrative dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = adminData.upgradeRequests.filter((r) => r.status === 'PENDING');
  const { stats, usersByRole } = adminData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-gold">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-charcoal-900 mb-2">
                Welcome <span className="bg-gradient-to-r from-gold-500 to-orange-400 bg-clip-text text-transparent">
                  {adminData.admin.name}
                </span>!
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-gradient-to-r from-gold-500 to-orange-400 text-white font-bold px-3 py-1">
                  SUPERADMIN
                </Badge>
                <span className="text-charcoal-600 text-sm">
                  Full platform control • All permissions granted
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={fetchAdminData}
              variant="outline"
              className="border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KEY METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg hover:border-gold-300 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-gold-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-charcoal-600 text-xs font-semibold mb-1 uppercase tracking-wide">
              Total Users
            </h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-gold-500 to-orange-400 bg-clip-text text-transparent">
              {stats.totalUsers.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 font-semibold mt-2">
              +{stats.userGrowth}% this month
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg hover:border-purple-300 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-charcoal-600 text-xs font-semibold mb-1 uppercase tracking-wide">
              Active Now
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats.activeUsers.toLocaleString()}
            </p>
            <p className="text-xs text-charcoal-500 mt-2">
              {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% online
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg hover:border-orange-300 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-orange-500" />
              </div>
              <BarChart3 className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-charcoal-600 text-xs font-semibold mb-1 uppercase tracking-wide">
              Total Teams
            </h3>
            <p className="text-3xl font-bold text-orange-500">
              {stats.totalTeams.toLocaleString()}
            </p>
            <p className="text-xs text-charcoal-500 mt-2">Across all clubs</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-300 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-charcoal-600 text-xs font-semibold mb-1 uppercase tracking-wide">
              Total Revenue
            </h3>
            <p className="text-3xl font-bold text-green-600">
              £{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 font-semibold mt-2">
              +{stats.revenueGrowth}% growth
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg hover:border-red-300 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <Bell className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <h3 className="text-charcoal-600 text-xs font-semibold mb-1 uppercase tracking-wide">
              Pending Requests
            </h3>
            <p className="text-3xl font-bold text-red-600">{pendingRequests.length}</p>
            <p className="text-xs text-red-600 font-semibold mt-2">Needs attention</p>
          </div>
        </div>

        {/* TABBED CONTENT */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-2 py-0">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-charcoal-900 mb-6">Users by Role</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="text-sm text-charcoal-600 mb-1">Player (Free)</p>
                  <p className="text-2xl font-bold text-charcoal-900">
                    {usersByRole.PLAYER.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gold-50 to-orange-50 rounded-xl border border-gold-200">
                  <p className="text-sm text-charcoal-600 mb-1">Player Pro</p>
                  <p className="text-2xl font-bold text-gold-600">
                    {usersByRole.PLAYER_PRO.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <p className="text-sm text-charcoal-600 mb-1">Coach</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {usersByRole.COACH.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <p className="text-sm text-charcoal-600 mb-1">Manager</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {usersByRole.CLUB_MANAGER.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <p className="text-sm text-charcoal-600 mb-1">League Admin</p>
                  <p className="text-2xl font-bold text-green-600">
                    {usersByRole.LEAGUE_ADMIN.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-charcoal-900">Recent Activity</h2>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="space-y-3">
                {adminData.recentActivity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 hover:bg-gold-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-gold-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal-900">
                        {activity.description}
                      </p>
                      {activity.user && (
                        <p className="text-xs text-charcoal-600 mt-1">
                          {activity.user.name} ({activity.user.email})
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-charcoal-500 flex-shrink-0">
                      {activity.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <UpgradeRequestsPanel requests={adminData.upgradeRequests} onRefresh={fetchAdminData} />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagementPanel onRefresh={fetchAdminData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================================
// UPGRADE REQUESTS PANEL
// ============================================================================

function UpgradeRequestsPanel({
  requests,
  onRefresh,
}: {
  requests: RoleRequest[];
  onRefresh: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleReview = async (requestId: string, action: 'APPROVE' | 'REJECT', notes?: string) => {
    try {
      setIsProcessing(requestId);
      const response = await fetch('/api/superadmin/upgrade-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, reviewNotes: notes || '' }),
      });

      if (!response.ok) throw new Error('Failed to process request');
      alert(`✅ Request ${action.toLowerCase()}d successfully!`);
      onRefresh();
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-gold-50 to-transparent">
        <h2 className="text-2xl font-bold text-charcoal-900 mb-1">Role Upgrade Requests</h2>
        <p className="text-sm text-charcoal-600">
          {pendingRequests.length} pending • {requests.length} total
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-charcoal-900 mb-2">All caught up!</h3>
          <p className="text-charcoal-600">No upgrade requests at this time</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">Current</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">Requested</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">Date</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gold-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center font-bold text-gold-600">
                        {request.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-charcoal-900">{request.user.name}</p>
                        <p className="text-xs text-charcoal-500">{request.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">{request.currentRole}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-gold-500 text-white">{request.requestedRole}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={
                        request.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : request.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }
                    >
                      {request.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-charcoal-500">{request.requestedAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {request.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleReview(request.id, 'APPROVE')}
                            disabled={isProcessing === request.id}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReview(request.id, 'REJECT')}
                            disabled={isProcessing === request.id}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// USERS MANAGEMENT PANEL - WITH SAFETY CHECKS
// ============================================================================

function UsersManagementPanel({ onRefresh }: { onRefresh: () => void }) {
  const [users, setUsers] = useState<RealUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/superadmin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-charcoal-600">Loading users...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-charcoal-900">User Management</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm text-charcoal-900 placeholder-charcoal-400 bg-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <Button
              onClick={() => setShowImportModal(true)}
              variant="outline"
              className="border-gold-300 text-gold-600"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button
              onClick={() => setShowAddUserModal(true)}
              className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b">
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gold-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center font-bold text-gold-600">
                        {user.firstName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </p>
                        <p className="text-xs text-charcoal-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">{user.roles[0] || 'PLAYER'}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={
                        user.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <SettingsIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-charcoal-600">No users found</p>
            </div>
          )}
        </div>
      </div>

      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          fetchUsers();
        }}
      />

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-charcoal-900 mb-4">Add New User</h2>
            <p className="text-charcoal-600 mb-6">Use CSV Import to add multiple users at once.</p>
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
    </>
  );
}
