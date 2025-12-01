import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const user = session.user;
  const roles = user.roles || [];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user.firstName || user.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Here's your dashboard overview
        </p>

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Roles:</strong> {roles.join(', ')}</p>
            {user.isSuperAdmin && (
              <p className="text-green-600 font-semibold">✓ Super Admin Access</p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {user.isSuperAdmin && (
            <a
              href="/dashboard/superadmin"
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Super Admin
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Manage users, settings, and system configuration
              </p>
            </a>
          )}

          {roles.includes('LEAGUE_ADMIN') && (
            <a
              href="/dashboard/league-admin"
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                League Admin
              </h3>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Manage leagues, teams, and fixtures
              </p>
            </a>
          )}

          {roles.includes('PLAYER') && (
            <a
              href="/dashboard/player"
              className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Player Dashboard
              </h3>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                View stats, matches, and team information
              </p>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
