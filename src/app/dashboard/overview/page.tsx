import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Trophy, Users, Calendar, TrendingUp } from 'lucide-react';

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const user = session.user;
  const roles = (user.roles as string[]) || [];
  const firstName = user.firstName || user.name?.split(' ')[0] || 'User';
  const lastName = user.lastName || user.name?.split(' ')[1] || '';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-2">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Here's your dashboard overview and quick access to all your roles
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">
              Your Profile
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              Account information and access levels
            </p>
          </div>
          {user.isSuperAdmin && (
            <span className="px-3 py-1 bg-gradient-to-r from-gold-500 to-orange-400 text-white text-xs font-bold rounded-full">
              🔒 SUPER ADMIN
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mb-1">Email</p>
            <p className="font-semibold text-charcoal-900 dark:text-white">{user.email}</p>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mb-1">Full Name</p>
            <p className="font-semibold text-charcoal-900 dark:text-white">
              {firstName} {lastName}
            </p>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg md:col-span-2">
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mb-2">Active Roles</p>
            <div className="flex flex-wrap gap-2">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold rounded-full"
                  >
                    {role.replace('_', ' ')}
                  </span>
                ))
              ) : (
                <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                  No roles assigned
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Active Roles</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">
                {roles.length + (user.isSuperAdmin ? 1 : 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Teams</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Matches</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Activity</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Role Dashboards */}
      <div>
        <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-4">
          Your Dashboards
        </h2>
        <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-6">
          Quick access to all your role-specific dashboards
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* SuperAdmin Dashboard */}
          {user.isSuperAdmin && (
            <a
              href="/dashboard/superadmin"
              className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all"
            >
              <div className="text-4xl mb-3">🛠️</div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Super Admin
              </h3>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                Manage users, settings, and system configuration
              </p>
            </a>
          )}

          {/* League Admin Dashboard */}
          {roles.includes('LEAGUE_ADMIN') && (
            <a
              href="/dashboard/league-admin"
              className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 hover:shadow-lg hover:border-green-400 dark:hover:border-green-600 transition-all"
            >
              <div className="text-4xl mb-3">⚽</div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                League Admin
              </h3>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                Manage leagues, teams, and fixtures
              </p>
            </a>
          )}

          {/* Player Dashboard */}
          {roles.includes('PLAYER') && (
            <a
              href="/dashboard/player"
              className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6 hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all"
            >
              <div className="text-4xl mb-3">👤</div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Player Dashboard
              </h3>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                View stats, matches, and team information
              </p>
            </a>
          )}

          {/* Coach Dashboard */}
          {roles.includes('COACH') && (
            <a
              href="/dashboard/coach"
              className="group bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-6 hover:shadow-lg hover:border-orange-400 dark:hover:border-orange-600 transition-all"
            >
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Coach Dashboard
              </h3>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                Manage squad, training, and tactics
              </p>
            </a>
          )}

          {/* Manager Dashboard */}
          {(roles.includes('MANAGER') || roles.includes('CLUB_MANAGER')) && (
            <a
              href="/dashboard/manager"
              className="group bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-2 border-pink-200 dark:border-pink-800 rounded-xl p-6 hover:shadow-lg hover:border-pink-400 dark:hover:border-pink-600 transition-all"
            >
              <div className="text-4xl mb-3">👔</div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                Team Manager
              </h3>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                Manage operations, finances, and admin
              </p>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
