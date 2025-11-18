'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Users,
  Target,
  TrendingUp,
  Plus,
  Settings,
  AlertCircle,
  Building2,
  UserCheck,
  Activity,
  ArrowUpRight,
  Edit3,
  Trash2,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  coaches: { name: string }[];
  playerCount: number;
  budget?: number;
  pendingRequests: number;
}

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  clubs: {
    id: string;
    name: string;
    teams: Team[];
    totalBudget?: number;
    pendingRequests: number;
  }[];
  avatarUrl?: string;
}

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [managerData, setManagerData] = useState<Manager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  const fetchManagerData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/manager/dashboard');
      if (!response.ok) throw new Error('Failed to fetch manager data');
      const data = await response.json();
      setManagerData(data.manager);
      if (data.manager.clubs.length > 0) {
        setSelectedClubId(data.manager.clubs[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching manager data:', err);
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
      fetchManagerData();
    }
  }, [status, session, router, fetchManagerData]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-charcoal-600 font-semibold">Loading dashboard...</p>
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
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!managerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">Welcome!</h1>
          <p className="text-charcoal-600 mb-6">Setting up your manager dashboard...</p>
        </div>
      </div>
    );
  }

  const club = managerData.clubs.find(club => club.id === selectedClubId) ?? managerData.clubs[0];
  const pendingApprovals = managerData.clubs.reduce((sum, club) => sum + club.pendingRequests, 0);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
            {managerData.avatarUrl ? (
              <Image
                src={managerData.avatarUrl}
                alt="Avatar"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-charcoal-900 mb-2">
              Welcome back, <span className="gradient-text-purple">{managerData.firstName}</span>!
            </h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
                Club Manager
              </span>
              <span className="text-charcoal-600 text-sm">
                Managing {managerData.clubs.length} {managerData.clubs.length === 1 ? 'club' : 'clubs'}
              </span>
            </div>
          </div>
        </div>

        <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Add Club
        </Button>
      </div>

      {/* CLUB SELECTOR */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <label className="text-sm text-charcoal-700 font-semibold block mb-3">Active Club</label>
        <select
          value={club?.id || ''}
          onChange={e => setSelectedClubId(e.target.value)}
          className="w-full p-3 border-2 border-neutral-200 rounded-lg bg-white text-charcoal-900 font-medium hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
        >
          {managerData.clubs.map(clubOption => (
            <option key={clubOption.id} value={clubOption.id}>
              {clubOption.name}
            </option>
          ))}
        </select>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1 - Teams */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Teams Managed</h3>
          <p className="text-4xl font-bold text-purple-600">{club?.teams.length || 0}</p>
          <p className="text-xs text-charcoal-500 mt-2">Active teams</p>
        </div>

        {/* Stat 2 - Coaches */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-gold-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6 text-gold-600" />
            </div>
            <Activity className="w-5 h-5 text-gold-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Coaches Assigned</h3>
          <p className="text-4xl font-bold gradient-text-gold">
            {club?.teams.reduce((acc, t) => acc + t.coaches.length, 0) || 0}
          </p>
          <p className="text-xs text-charcoal-500 mt-2">Total coaches</p>
        </div>

        {/* Stat 3 - Players */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-orange-500" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Players</h3>
          <p className="text-4xl font-bold text-orange-500">
            {club?.teams.reduce((acc, t) => acc + t.playerCount, 0) || 0}
          </p>
          <p className="text-xs text-charcoal-500 mt-2">Across all teams</p>
        </div>

        {/* Stat 4 - Pending */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-red-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            {(club?.pendingRequests || 0) > 0 && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Pending Approvals</h3>
          <p className="text-4xl font-bold text-red-500">{club?.pendingRequests || 0}</p>
          <p className="text-xs text-charcoal-500 mt-2">Requires action</p>
        </div>
      </div>

      {/* TEAMS TABLE */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-purple-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-900 mb-1">
                Teams in {club?.name}
              </h2>
              <p className="text-sm text-charcoal-600">
                Manage all teams, coaches, and players in this club
              </p>
            </div>
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold shadow-md hover:shadow-lg transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Add Team
            </Button>
          </div>
        </div>

        {!club?.teams || club.teams.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">No teams yet</h3>
            <p className="text-charcoal-600 mb-6">Get started by adding your first team to this club</p>
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Team
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Coaches
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Players
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {club.teams.map((team, index) => (
                  <tr
                    key={team.id}
                    className={`hover:bg-purple-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-charcoal-900">{team.name}</p>
                          <p className="text-xs text-charcoal-500">{team.coaches.length} coaches</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {team.coaches.map((coach, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gold-100 text-gold-700 rounded text-xs font-medium"
                          >
                            {coach.name}
                          </span>
                        ))}
                        {team.coaches.length === 0 && (
                          <span className="text-charcoal-400 text-sm">No coaches</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                        {team.playerCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-charcoal-900">
                        {team.budget ? `£${team.budget.toLocaleString()}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                          title="Edit team"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 bg-gold-100 text-gold-600 rounded-lg hover:bg-gold-200 transition-colors"
                          title="Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Delete team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PENDING APPROVALS ALERT */}
      {pendingApprovals > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-charcoal-900 mb-1">
              {pendingApprovals} Pending {pendingApprovals === 1 ? 'Approval' : 'Approvals'}
            </h3>
            <p className="text-charcoal-600 mb-4">
              You have requests waiting for your review across all clubs
            </p>
            <Button className="bg-red-500 hover:bg-red-600 text-white font-semibold">
              Review Requests
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
