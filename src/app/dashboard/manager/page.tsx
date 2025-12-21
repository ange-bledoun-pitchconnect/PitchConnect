import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Building2, Users, DollarSign, FileText, Calendar, TrendingUp } from 'lucide-react';

export default async function ManagerPage() {
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
          👔 Team Manager Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Manage team operations, finances, and administrative tasks
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Team Members</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Monthly Budget</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">£0</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Pending Tasks</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <FileText className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Active Staff</p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">0</p>
            </div>
            <Building2 className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <a
          href="/dashboard/manager/team"
          className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all"
        >
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Team Management
          </h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Manage players, staff, registrations, and team details
          </p>
        </a>

        <a
          href="/dashboard/manager/finances"
          className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 hover:shadow-lg hover:border-green-400 dark:hover:border-green-600 transition-all"
        >
          <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            Financial Management
          </h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Track budgets, expenses, fees, and financial reports
          </p>
        </a>

        <a
          href="/dashboard/manager/facilities"
          className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6 hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all"
        >
          <Building2 className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Facilities & Resources
          </h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Book training grounds, manage equipment, and facilities
          </p>
        </a>
      </div>

      {/* Pending Tasks & Upcoming Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Pending Tasks */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pending Tasks
          </h2>
          
          {/* Empty State */}
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">All caught up!</h3>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              No pending tasks at the moment
            </p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
          <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events
          </h2>
          
          {/* Empty State */}
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No upcoming events</h3>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              Your calendar is clear
            </p>
          </div>
        </div>
      </div>

      {/* Team Overview */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Team Performance
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              Overview of team metrics and performance
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">No team assigned</h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
            Get assigned to a team to start managing
          </p>
        </div>
      </div>
    </div>
  );
}
