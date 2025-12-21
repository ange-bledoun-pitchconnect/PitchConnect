import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Trophy, Users, Calendar, BarChart3, TrendingUp, Shield } from 'lucide-react';

export default async function LeagueAdminPage() {
  const session = await auth();

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
          ⚽ League Admin Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Manage leagues, teams, fixtures, and competition settings
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Active Leagues</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <Trophy className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Registered Teams</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Upcoming Fixtures</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <Calendar className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Matches Played</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <BarChart3 className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <a
          href="/dashboard/leagues"
          className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 hover:shadow-lg hover:border-green-400 dark:hover:border-green-600 transition-all"
        >
          <Trophy className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            Manage Leagues
          </h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Create, edit, and configure league settings and standings
          </p>
        </a>

        <a
          href="/dashboard/league-admin/teams"
          className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all"
        >
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Team Management
          </h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Approve teams, manage registrations, and team assignments
          </p>
        </a>

        <a
          href="/dashboard/league-admin/fixtures"
          className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6 hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all"
        >
          <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Fixture Scheduling
          </h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Schedule matches, set venues, and manage match officials
          </p>
        </a>
      </div>

      {/* My Leagues */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-1 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              My Leagues
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              Leagues you're currently managing
            </p>
          </div>
          <a
            href="/dashboard/leagues/create"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg transition-all text-sm"
          >
            Create League
          </a>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">No leagues yet</h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
            Create your first league to start managing competitions
          </p>
          <a
            href="/dashboard/leagues/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg transition-all"
          >
            Create Your First League
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
        <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Recent Activity
        </h2>
        
        {/* Empty State */}
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No recent activity</h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Your league activity will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
