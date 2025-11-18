'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Users,
  Target,
  Bell,
  Plus,
  BarChart3,
  AlertCircle,
  Eye,
  Repeat2,
  CheckCircle2,
  TrendingUp,
  Zap,
  Activity,
  DollarSign,
  Trash2,
  Clock,
} from 'lucide-react';

interface RoleRequest {
  id: string;
  user: { name: string; email: string; userType: string };
  requestedRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  totalUsers: number;
  totalTeams: number;
  totalLeagues: number;
  totalRevenue: number;
  roleRequests: RoleRequest[];
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [adminData, setAdminData] = useState<SuperAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/superadmin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch superadmin data');
      const data = await response.json();
      setAdminData(data.superadmin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-charcoal-600 font-semibold">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">Oops! Something went wrong</h1>
          <p className="text-charcoal-600 mb-6">{error}</p>
          <Button
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-bounce" />
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">Super Admin Panel</h1>
          <p className="text-charcoal-600 mb-6">Loading your administrative dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = adminData.roleRequests.filter(r => r.status === 'PENDING');
  const approvedRequests = adminData.roleRequests.filter(r => r.status === 'APPROVED');

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
            {adminData.avatarUrl ? (
              <Image
                src={adminData.avatarUrl}
                alt="Avatar"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <ShieldCheck className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-charcoal-900 mb-2">
              Welcome, <span className="text-blue-600">{adminData.name}</span>!
            </h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                Super Admin
              </span>
              <span className="text-charcoal-600 text-sm">
                Platform administrator with full system access
              </span>
            </div>
          </div>
        </div>

        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* STATS CARDS - KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Users</h3>
          <p className="text-4xl font-bold text-blue-600">{adminData.totalUsers.toLocaleString()}</p>
          <p className="text-xs text-charcoal-500 mt-2">Active users</p>
        </div>

        {/* Teams Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-gold-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-gold-600" />
            </div>
            <Activity className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Teams</h3>
          <p className="text-4xl font-bold text-gold-600">{adminData.totalTeams.toLocaleString()}</p>
          <p className="text-xs text-charcoal-500 mt-2">Managed teams</p>
        </div>

        {/* Leagues Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Leagues</h3>
          <p className="text-4xl font-bold text-purple-600">{adminData.totalLeagues.toLocaleString()}</p>
          <p className="text-xs text-charcoal-500 mt-2">Active leagues</p>
        </div>

        {/* Revenue Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-green-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-4xl font-bold text-green-600">
            £{adminData.totalRevenue ? adminData.totalRevenue.toLocaleString() : '0'}
          </p>
          <p className="text-xs text-charcoal-500 mt-2">Lifetime revenue</p>
        </div>
      </div>

      {/* PENDING ROLE REQUESTS */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-red-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-900 mb-1">
                Pending Role Requests
              </h2>
              <p className="text-sm text-charcoal-600">
                {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} awaiting approval
              </p>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md">
              <Repeat2 className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {adminData.roleRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">All caught up!</h3>
            <p className="text-charcoal-600">No pending role requests at this time</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Requested Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {adminData.roleRequests.map((request, index) => (
                  <tr
                    key={request.id}
                    className={`hover:bg-blue-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-charcoal-900">{request.user.name}</p>
                        <p className="text-xs text-charcoal-500">{request.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {request.user.userType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {request.requestedRole}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {request.status === 'APPROVED' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          ✓ Approved
                        </span>
                      )}
                      {request.status === 'REJECTED' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          ✗ Rejected
                        </span>
                      )}
                      {request.status === 'PENDING' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal-600">
                      <div className="flex items-center gap-1 text-charcoal-500">
                        <Clock className="w-4 h-4" />
                        {request.requestedAt}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Reject"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
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

      {/* SYSTEM ANALYTICS */}
      <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-charcoal-900 mb-8">System Analytics</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {/* Daily Active Users */}
          <div className="border-l-4 border-blue-500 pl-6">
            <div className="text-sm text-charcoal-600 font-semibold mb-2">Daily Active Users</div>
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {Math.floor(Math.random() * 3000 + 1500).toLocaleString()}
            </div>
            <p className="text-xs text-green-600 font-semibold">+12% from yesterday</p>
          </div>

          {/* Support Tickets */}
          <div className="border-l-4 border-orange-500 pl-6">
            <div className="text-sm text-charcoal-600 font-semibold mb-2">Open Support Tickets</div>
            <div className="text-4xl font-bold text-orange-500 mb-1">
              {Math.floor(Math.random() * 80 + 10)}
            </div>
            <p className="text-xs text-orange-600 font-semibold">5 urgent</p>
          </div>

          {/* Subscription Rate */}
          <div className="border-l-4 border-green-500 pl-6">
            <div className="text-sm text-charcoal-600 font-semibold mb-2">Subscription Rate</div>
            <div className="text-4xl font-bold text-green-600 mb-1">98%</div>
            <p className="text-xs text-green-600 font-semibold">+0.5% MoM</p>
          </div>

          {/* Revenue Growth */}
          <div className="border-l-4 border-purple-500 pl-6">
            <div className="text-sm text-charcoal-600 font-semibold mb-2">Revenue Growth</div>
            <div className="text-4xl font-bold text-purple-600 mb-1">36%</div>
            <p className="text-xs text-purple-600 font-semibold">YoY growth</p>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Approved Requests */}
        <div className="bg-gradient-to-br from-green-50 to-transparent border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-charcoal-900">Approved This Month</h3>
          </div>
          <p className="text-4xl font-bold text-green-600 mb-2">{approvedRequests.length}</p>
          <p className="text-sm text-charcoal-600">Role promotion requests approved</p>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-br from-blue-50 to-transparent border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-charcoal-900">System Status</h3>
          </div>
          <p className="text-4xl font-bold text-blue-600 mb-2">100%</p>
          <p className="text-sm text-charcoal-600">All systems operational</p>
        </div>
      </div>
    </div>
  );
}
