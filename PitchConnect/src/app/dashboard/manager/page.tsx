'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Calendar,
  Clock,
  MapPin,
  Shield,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  competition: string;
  venue?: string;
}

interface RecentPerformance {
  wins: number;
  draws: number;
  losses: number;
}

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [managerData, setManagerData] = useState<Manager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [recentPerformance, setRecentPerformance] = useState<RecentPerformance | null>(null);

  const fetchManagerData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/manager/dashboard');
      if (!response.ok) throw new Error('Failed to fetch manager data');
      
      const data = await response.json();
      setManagerData(data.manager);
      setUpcomingMatches(data.upcomingMatches || []);
      setRecentPerformance(data.recentPerformance || null);
      
      if (data.manager.clubs.length > 0) {
        setSelectedClubId(data.manager.clubs[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching manager data:', err);
      toast.error('Failed to load dashboard data');
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

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/manager/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete team');

      toast.success('Team deleted successfully');
      fetchManagerData();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-200 dark:border-gold-700 border-t-gold-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-2">Oops! Something went wrong</h1>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">{error}</p>
          <Button
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!managerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gold-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-2">Welcome!</h1>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">Setting up your manager dashboard...</p>
        </div>
      </div>
    );
  }

  const club = managerData.clubs.find(club => club.id === selectedClubId) ?? managerData.clubs[0];
  const pendingApprovals = managerData.clubs.reduce((sum, club) => sum + club.pendingRequests, 0);
  const totalTeams = managerData.clubs.reduce((sum, club) => sum + club.teams.length, 0);
  const totalPlayers = managerData.clubs.reduce(
    (sum, club) => sum + club.teams.reduce((acc, t) => acc + t.playerCount, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
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
              <h1 className="text-3xl lg:text-4xl font-bold text-charcoal-900 dark:text-white mb-2">
                Welcome back, <span className="bg-gradient-to-r from-gold-500 to-orange-400 bg-clip-text text-transparent">{managerData.firstName}</span>!
              </h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  Club Manager
                </span>
                <span className="text-charcoal-600 dark:text-charcoal-400 text-sm">
                  Managing {managerData.clubs.length} {managerData.clubs.length === 1 ? 'club' : 'clubs'}
                </span>
              </div>
            </div>
          </div>

          <Link href="/dashboard/manager/clubs/create">
            <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Add Club
            </Button>
          </Link>
        </div>

        {/* CLUB SELECTOR */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardContent className="pt-6">
            <label className="text-sm text-charcoal-700 dark:text-charcoal-300 font-semibold block mb-3">
              Active Club
            </label>
            <select
              value={club?.id || ''}
              onChange={e => setSelectedClubId(e.target.value)}
              className="w-full p-3 border-2 border-neutral-200 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white font-medium hover:border-gold-300 dark:hover:border-gold-600 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-700 transition-all"
            >
              {managerData.clubs.map(clubOption => (
                <option key={clubOption.id} value={clubOption.id}>
                  {clubOption.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1 - Teams */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 hover:shadow-lg dark:hover:shadow-charcoal-900/30 hover:border-gold-300 dark:hover:border-gold-600 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 dark:from-gold-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-gold-600 dark:text-gold-400" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-charcoal-600 dark:text-charcoal-400 text-sm font-medium mb-1">Teams Managed</h3>
              <p className="text-4xl font-bold text-gold-600 dark:text-gold-400">{club?.teams.length || 0}</p>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-500 mt-2">Active teams</p>
            </CardContent>
          </Card>

          {/* Stat 2 - Coaches */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 hover:shadow-lg dark:hover:shadow-charcoal-900/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-charcoal-600 dark:text-charcoal-400 text-sm font-medium mb-1">Coaches Assigned</h3>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {club?.teams.reduce((acc, t) => acc + t.coaches.length, 0) || 0}
              </p>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-500 mt-2">Total coaches</p>
            </CardContent>
          </Card>

          {/* Stat 3 - Players */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 hover:shadow-lg dark:hover:shadow-charcoal-900/30 hover:border-orange-300 dark:hover:border-orange-600 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-charcoal-600 dark:text-charcoal-400 text-sm font-medium mb-1">Total Players</h3>
              <p className="text-4xl font-bold text-orange-500 dark:text-orange-400">
                {club?.teams.reduce((acc, t) => acc + t.playerCount, 0) || 0}
              </p>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-500 mt-2">Across all teams</p>
            </CardContent>
          </Card>

          {/* Stat 4 - Pending */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 hover:shadow-lg dark:hover:shadow-charcoal-900/30 hover:border-red-300 dark:hover:border-red-600 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                {(club?.pendingRequests || 0) > 0 && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <h3 className="text-charcoal-600 dark:text-charcoal-400 text-sm font-medium mb-1">Pending Approvals</h3>
              <p className="text-4xl font-bold text-red-500 dark:text-red-400">{club?.pendingRequests || 0}</p>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-500 mt-2">Requires action</p>
            </CardContent>
          </Card>
        </div>

        {/* RECENT PERFORMANCE */}
        {recentPerformance && (
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gold-500" />
                <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">Recent Performance</h2>
              </div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-4">Last 10 matches across all teams</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      {recentPerformance.wins}
                    </span>
                  </div>
                  <span className="text-sm text-charcoal-600 dark:text-charcoal-400">Wins</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-orange-700 dark:text-orange-300">
                      {recentPerformance.draws}
                    </span>
                  </div>
                  <span className="text-sm text-charcoal-600 dark:text-charcoal-400">Draws</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-red-700 dark:text-red-300">
                      {recentPerformance.losses}
                    </span>
                  </div>
                  <span className="text-sm text-charcoal-600 dark:text-charcoal-400">Losses</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* UPCOMING MATCHES */}
        {upcomingMatches.length > 0 && (
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gold-500" />
                <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">Upcoming Matches</h2>
              </div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-4">Next 5 fixtures across all teams</p>
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
                        {match.competition}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                        <Clock className="w-4 h-4" />
                        {new Date(match.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-charcoal-900 dark:text-white">{match.homeTeam}</span>
                      <span className="text-charcoal-500 dark:text-charcoal-500">vs</span>
                      <span className="font-semibold text-charcoal-900 dark:text-white">{match.awayTeam}</span>
                    </div>
                    {match.venue && (
                      <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400 mt-2">
                        <MapPin className="w-4 h-4" />
                        {match.venue}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* TEAMS TABLE */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 bg-gradient-to-r from-gold-50 dark:from-gold-900/10 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-1">
                  Teams in {club?.name}
                </h2>
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                  Manage all teams, coaches, and players in this club
                </p>
              </div>
              <Link href={`/dashboard/manager/clubs/${club?.id}/teams/create`}>
                <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-md hover:shadow-lg transition-all">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Team
                </Button>
              </Link>
            </div>
          </div>

          {!club?.teams || club.teams.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-charcoal-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-neutral-400 dark:text-charcoal-500" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No teams yet</h3>
              <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
                Get started by adding your first team to this club
              </p>
              <Link href={`/dashboard/manager/clubs/${club?.id}/teams/create`}>
                <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Team
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-charcoal-700 border-b border-neutral-200 dark:border-charcoal-600">
                    <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider">
                      Team Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider">
                      Coaches
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider">
                      Players
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-charcoal-600">
                  {club.teams.map((team, index) => (
                    <tr
                      key={team.id}
                      className={`hover:bg-gold-50 dark:hover:bg-charcoal-700/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white dark:bg-charcoal-800' : 'bg-neutral-50/50 dark:bg-charcoal-700/30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {team.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-charcoal-900 dark:text-white">{team.name}</p>
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{team.coaches.length} coaches</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {team.coaches.map((coach, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                            >
                              {coach.name}
                            </span>
                          ))}
                          {team.coaches.length === 0 && (
                            <span className="text-charcoal-400 dark:text-charcoal-500 text-sm">No coaches</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-semibold">
                          {team.playerCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-charcoal-900 dark:text-white">
                          {team.budget ? `£${team.budget.toLocaleString()}` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/manager/teams/${team.id}/edit`}>
                            <button
                              className="p-2 bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400 rounded-lg hover:bg-gold-200 dark:hover:bg-gold-900/50 transition-colors"
                              title="Edit team"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/dashboard/manager/teams/${team.id}/settings`}>
                            <button
                              className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                              title="Settings"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
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
        </Card>

        {/* PENDING APPROVALS ALERT */}
        {pendingApprovals > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 dark:border-red-400 rounded-xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-1">
                {pendingApprovals} Pending {pendingApprovals === 1 ? 'Approval' : 'Approvals'}
              </h3>
              <p className="text-charcoal-600 dark:text-charcoal-400 mb-4">
                You have requests waiting for your review across all clubs
              </p>
              <Link href="/dashboard/manager/approvals">
                <Button className="bg-red-500 hover:bg-red-600 text-white font-semibold">
                  Review Requests
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
