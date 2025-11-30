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
  User as UserIcon,
  Calendar,
  Bell,
  Plus,
  ShieldCheck,
} from 'lucide-react';

// ========================================
// TYPES
// ========================================

interface Team {
  name: string;
  players: number;
  coaches: number;
}

interface Match {
  date: string;
  home: string;
  away: string;
  status: string;
}

interface League {
  id: string;
  name: string;
  code: string;
  teams: Team[];
  matches: Match[];
  pendingRequests: number;
}

interface LeagueAdmin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  leagues: League[];
  avatarUrl?: string | null;
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function LeagueAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [adminData, setAdminData] = useState<LeagueAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  // ========================================
  // MEMOIZED FUNCTIONS
  // ========================================

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/league-admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch admin data');
      const data = await response.json();
      setAdminData(data.admin);
      if (data.admin?.leagues && data.admin.leagues.length > 0) {
        setSelectedLeagueId(data.admin.leagues[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.email) {
      fetchAdminData();
    }
  }, [status, session, router, fetchAdminData]);

  // ========================================
  // LOADING STATE
  // ========================================

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-900 font-bold"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // ========================================
  // NO DATA STATE
  // ========================================

  if (!adminData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome!</h1>
          <p className="text-slate-600 mb-6">
            Setting up your league admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // GET SELECTED LEAGUE
  // ========================================

  const league: League | undefined =
    adminData.leagues?.find(l => l.id === selectedLeagueId) ??
    adminData.leagues?.[0];

  // ========================================
  // HELPERS
  // ========================================

  const totalPlayers = league?.teams?.reduce((acc, t) => acc + t.players, 0) ?? 0;
  const totalCoaches = league?.teams?.reduce((acc, t) => acc + t.coaches, 0) ?? 0;
  const pendingRequests = league?.pendingRequests ?? 0;
  const teamsCount = league?.teams?.length ?? 0;

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-white">
      {/* ====== NAVBAR ====== */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold">⚽</span>
            </div>
            <span className="text-xl font-bold text-[#D4AF37]">PitchConnect</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/dashboard/league-admin"
              className="text-slate-900 hover:text-[#D4AF37] transition font-medium"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="text-slate-700 hover:text-[#D4AF37] transition"
            >
              Leagues
            </a>
            <a
              href="#"
              className="text-slate-700 hover:text-[#D4AF37] transition"
            >
              Teams
            </a>
            <a
              href="#"
              className="text-slate-700 hover:text-[#D4AF37] transition"
            >
              Matches
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-700 hover:text-[#D4AF37] transition">
              <Bell className="w-5 h-5" />
              {pendingRequests > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">
                  {adminData.firstName}
                </p>
                <p className="text-xs text-[#10B981] font-bold bg-[#10B981]/10 px-2 py-1 rounded uppercase tracking-widest">
                  LEAGUE ADMIN
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-full flex items-center justify-center overflow-hidden">
                {adminData.avatarUrl ? (
                  <Image
                    src={adminData.avatarUrl}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-900" />
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ====== MAIN CONTENT ====== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ====== HEADER ====== */}
        <div className="mb-12 flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {adminData.avatarUrl ? (
              <Image
                src={adminData.avatarUrl}
                alt="Avatar"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-8 h-8 text-slate-900" />
            )}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">
              Welcome back, {adminData.firstName}!
            </h1>
            <div>
              <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded uppercase tracking-widest">
                League Admin
              </span>
            </div>
          </div>
          <div className="ml-auto">
            <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-900 font-bold rounded px-6">
              <Plus className="w-5 h-5 mr-2" />
              Add League
            </Button>
          </div>
        </div>

        {/* ====== LEAGUE SELECTOR ====== */}
        <div className="mb-10">
          <label className="text-sm text-slate-700 font-semibold block mb-1">
            Switch League
          </label>
          <select
            value={league?.id || ''}
            onChange={e => setSelectedLeagueId(e.target.value)}
            className="p-2 border border-slate-200 rounded bg-white text-slate-900"
          >
            {adminData.leagues?.map(lOption => (
              <option key={lOption.id} value={lOption.id}>
                {lOption.name} ({lOption.code})
              </option>
            ))}
          </select>
        </div>

        {/* ====== STATS CARDS ====== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {/* Teams Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">Teams</h3>
            <p className="text-3xl font-bold text-[#D4AF37]">{teamsCount}</p>
          </div>

          {/* Players Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">Players</h3>
            <p className="text-3xl font-bold text-[#D4AF37]">{totalPlayers}</p>
          </div>

          {/* Coaches Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">Coaches</h3>
            <p className="text-3xl font-bold text-[#D4AF37]">{totalCoaches}</p>
          </div>

          {/* Pending Approvals Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <Trophy className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">
              Pending Approvals
            </h3>
            <p className="text-3xl font-bold text-red-500">{pendingRequests}</p>
          </div>
        </div>

        {/* ====== TEAMS AND MATCHES ====== */}
        <div className="grid md:grid-cols-2 gap-10">
          {/* ====== TEAMS TABLE ====== */}
          <div className="bg-white border border-slate-200 rounded-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Teams in {league?.name || 'League'}
              </h2>
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-900 font-bold rounded px-6">
                <Plus className="w-5 h-5 mr-2" />
                Add Team
              </Button>
            </div>
            {!league?.teams || league.teams.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">
                No teams in this league.
              </div>
            ) : (
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="text-slate-700 bg-[#D4AF37]/10">
                    <th className="p-2 text-left font-semibold">Team Name</th>
                    <th className="p-2 text-center font-semibold">Players</th>
                    <th className="p-2 text-center font-semibold">Coaches</th>
                  </tr>
                </thead>
                <tbody>
                  {league.teams.map(team => (
                    <tr
                      key={team.name}
                      className="hover:bg-[#D4AF37]/5 transition"
                    >
                      <td className="p-2 text-slate-900 font-medium">
                        {team.name}
                      </td>
                      <td className="p-2 text-center">{team.players}</td>
                      <td className="p-2 text-center">{team.coaches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ====== MATCHES TABLE ====== */}
          <div className="bg-white border border-slate-200 rounded-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Upcoming Matches
              </h2>
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-900 font-bold rounded px-6">
                <Calendar className="w-5 h-5 mr-2" />
                Add Match
              </Button>
            </div>
            {!league?.matches || league.matches.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">
                No matches scheduled.
              </div>
            ) : (
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="text-slate-700 bg-[#D4AF37]/10">
                    <th className="p-2 text-left font-semibold">Date</th>
                    <th className="p-2 text-left font-semibold">Fixture</th>
                    <th className="p-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {league.matches.map(match => (
                    <tr
                      key={`${match.date}-${match.home}-${match.away}`}
                      className="hover:bg-[#D4AF37]/5 transition"
                    >
                      <td className="p-2">{match.date}</td>
                      <td className="p-2">
                        {match.home} vs {match.away}
                      </td>
                      <td className="p-2">{match.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
