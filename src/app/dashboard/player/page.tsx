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
  User as UserIcon,
  Bell,
  Plus,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  position: string;
  isActive: boolean;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  teams: Team[];
  appearances: number;
  goals: number;
  assists: number;
  achievements: number;
  avatarUrl?: string;
}

export default function PlayerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize fetchPlayerData
  const fetchPlayerData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/player/dashboard');
      if (!response.ok) throw new Error('Failed to fetch player data');
      const data = await response.json();
      setPlayerData(data.player);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching player data:', err);
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
      fetchPlayerData();
    }
  }, [status, session, router, fetchPlayerData]);

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

  if (!playerData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome!</h1>
          <p className="text-slate-600 mb-6">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold">⚽</span>
            </div>
            <span className="text-xl font-bold text-[#D4AF37]">PitchConnect</span>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/dashboard/player" className="text-slate-900 hover:text-[#D4AF37] transition font-medium">
              Dashboard
            </a>
            <a href="#" className="text-slate-700 hover:text-[#D4AF37] transition">
              Teams
            </a>
            <a href="#" className="text-slate-700 hover:text-[#D4AF37] transition">
              Matches
            </a>
            <a href="#" className="text-slate-700 hover:text-[#D4AF37] transition">
              Achievements
            </a>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-700 hover:text-[#D4AF37] transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{playerData.firstName}</p>
                <p className="text-xs text-slate-500">Player</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-full flex items-center justify-center overflow-hidden">
                {playerData.avatarUrl ? (
                  <Image
                    src={playerData.avatarUrl}
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

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* HEADER */}
        <div className="mb-12 flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {playerData.avatarUrl ? (
              <Image
                src={playerData.avatarUrl}
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
              Welcome back, {playerData.firstName}!
            </h1>
            <span className="text-[#D4AF37] font-bold text-xs bg-[#D4AF37]/10 px-2 py-1 rounded uppercase tracking-widest">
              PLAYER
            </span>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-xs text-slate-400">Season</span>
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">Appearances</h3>
            <p className="text-3xl font-bold text-[#D4AF37]">{playerData.appearances}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">Goals</h3>
            <p className="text-3xl font-bold text-[#D4AF37]">{playerData.goals}</p>
            <p className="text-xs text-slate-500 mt-2">{playerData.assists} assists</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <Trophy className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">Achievements</h3>
            <p className="text-3xl font-bold text-[#D4AF37]">{playerData.achievements}</p>
            <p className="text-xs text-slate-500 mt-2">Badges unlocked</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">Teams</h3>
            <p className="text-3xl font-bold text-[#D4AF37]">{playerData.teams.length}</p>
            <p className="text-xs text-slate-500 mt-2">Active</p>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Teams List */}
          <div>
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">My Teams</h2>
                <Button className="p-2 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-900 rounded-lg font-bold">
                  <Plus className="w-4 h-4" /> <span className="ml-2 text-sm hidden sm:inline">Join Team</span>
                </Button>
              </div>
              <div className="space-y-2">
                {playerData.teams.length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-8">No teams joined yet</div>
                )}
                {playerData.teams.map(team => (
                  <div key={team.id} className={`p-3 rounded-lg border-l-4 ${team.isActive ? 'border-l-[#D4AF37] bg-[#D4AF37]/5' : 'border-l-slate-200 bg-slate-50'}`}>
                    <div className="font-semibold text-slate-900 text-sm">{team.name}</div>
                    <div className="text-xs text-slate-500">Position: {team.position}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming matches & recent performance */}
          <div className="md:col-span-2 grid grid-cols-1 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Upcoming Matches</h2>
              <div className="space-y-3">
                <div className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition">
                  <p className="text-sm text-slate-900 font-semibold">Team vs Arsenal</p>
                  <p className="text-xs text-slate-500">Saturday, Nov 16 &bull; 3:00 PM</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition">
                  <p className="text-sm text-slate-900 font-semibold">Power League Match</p>
                  <p className="text-xs text-slate-500">Wednesday, Nov 19 &bull; 7:30 PM</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 border-[#D4AF37] text-[#D4AF37]">
                View All Fixtures
              </Button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Achievements</h2>
              <div className="flex gap-4">
                <span className="w-10 h-10 bg-[#D4AF37]/10 flex items-center justify-center rounded-full text-[#D4AF37] text-2xl">🏅</span>
                <span className="w-10 h-10 bg-[#D4AF37]/10 flex items-center justify-center rounded-full text-[#D4AF37] text-2xl">⚽</span>
                <span className="w-10 h-10 bg-[#D4AF37]/10 flex items-center justify-center rounded-full text-[#D4AF37] text-2xl">🎯</span>
              </div>
              <Button variant="outline" className="w-full mt-6 border-[#D4AF37] text-[#D4AF37]">
                View All Achievements
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
