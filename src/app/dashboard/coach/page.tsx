'use client';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Clipboard, Calendar, TrendingUp, Target, BookOpen, ArrowRight } from 'lucide-react';

export default async function CoachPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const user = session.user;
  const firstName = user.firstName || user.name?.split(' ')[0] || 'User';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-2">
          📋 Coach Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Manage your squad, training sessions, and tactical planning
        </p>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Stat Card 1: Squad Size */}
        <div className="group bg-white dark:bg-charcoal-800 rounded-xl shadow-sm hover:shadow-lg border border-neutral-200 dark:border-charcoal-700 hover:border-blue-400 dark:hover:border-blue-600 p-6 transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Squad Size</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <Users className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>

        {/* Stat Card 2: Training Sessions */}
        <div className="group bg-white dark:bg-charcoal-800 rounded-xl shadow-sm hover:shadow-lg border border-neutral-200 dark:border-charcoal-700 hover:border-green-400 dark:hover:border-green-600 p-6 transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Training Sessions</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <Clipboard className="w-10 h-10 text-green-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>

        {/* Stat Card 3: Win Rate */}
        <div className="group bg-white dark:bg-charcoal-800 rounded-xl shadow-sm hover:shadow-lg border border-neutral-200 dark:border-charcoal-700 hover:border-purple-400 dark:hover:border-purple-600 p-6 transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">-</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>

        {/* Stat Card 4: Avg Goals/Game */}
        <div className="group bg-white dark:bg-charcoal-800 rounded-xl shadow-sm hover:shadow-lg border border-neutral-200 dark:border-charcoal-700 hover:border-orange-400 dark:hover:border-orange-600 p-6 transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Avg Goals/Game</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">-</p>
            </div>
            <Target className="w-10 h-10 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
      </div>

      {/* Quick Actions - ✅ FIXED: Using Link components with proper hover effects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Squad Management */}
        <Link
          href="/dashboard/coach/team"
          className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800 dark:hover:border-blue-600 rounded-xl p-6 hover:shadow-lg hover:border-blue-400 transition-all duration-300 transform hover:scale-105"
        >
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Squad Management
          </h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            View roster, set lineups, and manage player availability
          </p>
          <div className="flex items-center gap-2 mt-4 text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Manage Squad</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </Link>

        {/* Card 2: Training Sessions */}
        <Link
          href="/dashboard/coach/training"
          className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-800 dark:hover:border-green-600 rounded-xl p-6 hover:shadow-lg hover:border-green-400 transition-all duration-300 transform hover:scale-105"
        >
          <Clipboard className="w-8 h-8 text-green-600 dark:text-green-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            Training Sessions
          </h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Plan drills, track attendance, and monitor player development
          </p>
          <div className="flex items-center gap-2 mt-4 text-green-600 dark:text-green-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Schedule Training</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </Link>

        {/* Card 3: Tactics & Analysis */}
        <Link
          href="/dashboard/coach/tactics"
          className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-800 dark:hover:border-purple-600 rounded-xl p-6 hover:shadow-lg hover:border-purple-400 transition-all duration-300 transform hover:scale-105"
        >
          <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Tactics & Analysis
          </h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Create formations, analyze opponents, and review match data
          </p>
          <div className="flex items-center gap-2 mt-4 text-purple-600 dark:text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Analyze Tactics</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </Link>
      </div>

      {/* This Week's Training & Upcoming Matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Training Schedule */}
        <div className="group bg-white dark:bg-charcoal-800 rounded-xl shadow-sm hover:shadow-lg border border-neutral-200 dark:border-charcoal-700 p-6 transition-all duration-300">
          <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
            <Clipboard className="w-5 h-5" />
            This Week's Training
          </h2>
          
          {/* Empty State */}
          <div className="text-center py-12">
            <Clipboard className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No sessions scheduled</h3>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-4">
              Plan your first training session
            </p>
            <Link
              href="/dashboard/coach/training"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm"
            >
              Schedule Training
            </Link>
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="group bg-white dark:bg-charcoal-800 rounded-xl shadow-sm hover:shadow-lg border border-neutral-200 dark:border-charcoal-700 p-6 transition-all duration-300">
          <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Matches
          </h2>
          
          {/* Empty State */}
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No upcoming matches</h3>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              Your match schedule will appear here
            </p>
          </div>
        </div>
      </div>

      {/* Squad Overview */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm hover:shadow-lg border border-neutral-200 dark:border-charcoal-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-1 flex items-center gap-2">
              <Users className="w-5 h-5" />
              My Squad
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              Manage your team roster and player details
            </p>
          </div>
          <Link
            href="/dashboard/coach/team"
            className="flex items-center gap-2 px-4 py-2 bg-charcoal-100 dark:bg-charcoal-700 hover:bg-charcoal-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">No squad assigned</h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
            Get assigned to a team to start coaching
          </p>
        </div>
      </div>
    </div>
  );
}