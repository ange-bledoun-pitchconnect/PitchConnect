'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Users,
  Target,
  Calendar,
  Plus,
  TrendingUp,
  Award,
  Activity,
  ChevronRight,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  club: string;
  formation: string;
  playerCount: number;
}

interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  teams: Team[];
}

interface Stats {
  appearances: number;
  goals: number;
  achievements: number;
  teams: number;
}

export default function CoachDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [coachData, setCoachData] = useState<Coach | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({
    appearances: 0,
    goals: 0,
    achievements: 0,
    teams: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoachData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/coach/dashboard');

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to load coach dashboard');
      }

      const data = await response.json();
      setCoachData(data.coach);
      setStats(data.stats);

      if (data.coach?.teams) {
        setSelectedTeams(data.coach.teams.map((t: Team) => t.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching coach data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.email) {
      fetchCoachData();
    }
  }, [status, session, router, fetchCoachData]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-4" />
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
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">Oops! Something went wrong</h1>
          <p className="text-charcoal-600 mb-6">{error}</p>
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

  if (!coachData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-gold-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">Welcome back!</h1>
          <p className="text-charcoal-600 mb-6">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredTeams = coachData.teams.filter((team) => selectedTeams.includes(team.id));

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-charcoal-900 mb-2">
          Welcome back, <span className="gradient-text-gold">{coachData.firstName}</span>! ⚽
        </h1>
        <p className="text-charcoal-600 text-lg">Here&apos;s your coaching overview</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1 - Teams */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-gold-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-gold-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Teams</h3>
          <p className="text-4xl font-bold gradient-text-gold">{stats.teams}</p>
          <p className="text-xs text-charcoal-500 mt-2">Active squads</p>
        </div>

        {/* Stat 2 - Players */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Players</h3>
          <p className="text-4xl font-bold text-purple-600">{stats.appearances}</p>
          <p className="text-xs text-charcoal-500 mt-2">In your squads</p>
        </div>

        {/* Stat 3 - Matches */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Matches</h3>
          <p className="text-4xl font-bold text-orange-500">{stats.goals}</p>
          <p className="text-xs text-charcoal-500 mt-2">This season</p>
        </div>

        {/* Stat 4 - Achievements */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-gold-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-gold-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-gold-600" />
            </div>
            <Award className="w-5 h-5 text-gold-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Achievements</h3>
          <p className="text-4xl font-bold text-gold-600">{stats.achievements}</p>
          <p className="text-xs text-charcoal-500 mt-2">Team milestones</p>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT: Teams */}
        <div className="space-y-6">
          {/* MY TEAMS CARD */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-charcoal-900">My Teams</h2>
              <span className="px-3 py-1 bg-gold-100 text-gold-700 rounded-full text-xs font-semibold">
                {coachData.teams.length} Active
              </span>
            </div>

            {/* Team List */}
            <div className="space-y-3 mb-6">
              {coachData.teams.map((team) => (
                <div
                  key={team.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-102 ${
                    selectedTeams.includes(team.id)
                      ? 'bg-gradient-to-r from-gold-50 to-orange-50 border-gold-400 shadow-md'
                      : 'bg-neutral-50 border-neutral-200 hover:border-gold-300'
                  }`}
                  onClick={() => toggleTeamSelection(team.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-charcoal-900 mb-1">{team.name}</p>
                      <p className="text-xs text-charcoal-500">{team.playerCount} players</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${selectedTeams.includes(team.id) ? 'text-gold-600' : 'text-charcoal-400'}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Add Team Button */}
            <Button className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Add New Team
            </Button>
          </div>
        </div>

        {/* RIGHT: Matches & Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* UPCOMING MATCHES */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-charcoal-900">Upcoming Matches</h2>
              <Button variant="outline" size="sm" className="border-gold-500 text-gold-600 hover:bg-gold-50">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              <div className="p-5 border-l-4 border-gold-500 bg-gradient-to-r from-gold-50 to-transparent rounded-xl hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-charcoal-900 text-lg">
                    {filteredTeams[0]?.name || 'Your Team'} vs Arsenal FC
                  </p>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                    Home
                  </span>
                </div>
                <p className="text-sm text-charcoal-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Saturday, Nov 23 • 3:00 PM
                </p>
              </div>

              <div className="p-5 border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-transparent rounded-xl hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-charcoal-900 text-lg">
                    Manchester United vs {filteredTeams[0]?.name || 'Your Team'}
                  </p>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                    Away
                  </span>
                </div>
                <p className="text-sm text-charcoal-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Wednesday, Nov 27 • 7:30 PM
                </p>
              </div>
            </div>
          </div>

          {/* RECENT PERFORMANCE */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-charcoal-900">Recent Performance</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-charcoal-600">Win Rate:</span>
                <span className="text-sm font-bold text-green-600">65%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-transparent border-l-4 border-green-500 rounded-xl">
                <div>
                  <p className="font-semibold text-charcoal-900">vs Liverpool FC</p>
                  <p className="text-xs text-charcoal-500">3 days ago</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">2-1</p>
                  <p className="text-xs text-green-600 font-semibold">WIN</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent border-l-4 border-gray-400 rounded-xl">
                <div>
                  <p className="font-semibold text-charcoal-900">vs Chelsea FC</p>
                  <p className="text-xs text-charcoal-500">1 week ago</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-600">1-1</p>
                  <p className="text-xs text-gray-600 font-semibold">DRAW</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-transparent border-l-4 border-red-500 rounded-xl">
                <div>
                  <p className="font-semibold text-charcoal-900">vs Tottenham</p>
                  <p className="text-xs text-charcoal-500">2 weeks ago</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">0-2</p>
                  <p className="text-xs text-red-600 font-semibold">LOSS</p>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-6 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50">
              View Full History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
