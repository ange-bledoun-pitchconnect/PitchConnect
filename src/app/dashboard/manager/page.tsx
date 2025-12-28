/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Team Manager Dashboard v2.0
 * Path: src/app/dashboard/manager/page.tsx
 * ============================================================================
 * 
 * FIXED: Uses correct Prisma schema field names:
 * - Manager uses clubMemberships (not teams)
 * - Match uses homeTeam/awayTeam (not homeClub/awayClub)
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Building2, Users, DollarSign, FileText, Calendar, TrendingUp, ArrowRight,
  Clock, CheckCircle,
} from 'lucide-react';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getManagerDashboardData(userId: string) {
  // Get manager with club memberships
  const manager = await prisma.manager.findUnique({
    where: { userId },
    include: {
      clubMemberships: {
        where: { isActive: true },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              sport: true,
              teams: {
                select: {
                  id: true,
                  name: true,
                  _count: { select: { players: true, coaches: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!manager || manager.clubMemberships.length === 0) {
    return { hasTeam: false, stats: null, clubs: [], upcomingEvents: [], pendingTasks: [] };
  }

  // Get all teams from the clubs this manager is a member of
  const allTeams = manager.clubMemberships.flatMap(cm => 
    cm.club.teams.map(t => ({ ...t, club: cm.club }))
  );
  const teamIds = allTeams.map(t => t.id);

  // Get upcoming matches for manager's teams
  const upcomingMatches = teamIds.length > 0
    ? await prisma.match.findMany({
        where: {
          status: 'SCHEDULED',
          kickOffTime: { gte: new Date() },
          OR: [
            { homeTeamId: { in: teamIds } },
            { awayTeamId: { in: teamIds } },
          ],
        },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
        orderBy: { kickOffTime: 'asc' },
        take: 5,
      })
    : [];

  // Calculate stats
  const totalMembers = allTeams.reduce((sum, t) => sum + t._count.players + t._count.coaches, 0);
  const totalStaff = allTeams.reduce((sum, t) => sum + t._count.coaches, 0);

  return {
    hasTeam: allTeams.length > 0,
    clubs: manager.clubMemberships.map(cm => ({
      id: cm.club.id,
      name: cm.club.name,
      teams: cm.club.teams,
    })),
    teams: allTeams,
    stats: {
      teamMembers: totalMembers,
      monthlyBudget: 0, // Would come from finance tables
      pendingTasks: 0,
      activeStaff: totalStaff,
    },
    upcomingEvents: upcomingMatches.map(m => ({
      id: m.id,
      type: 'match',
      title: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
      date: m.kickOffTime,
      venue: m.venue,
    })),
    pendingTasks: [],
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function ManagerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const data = await getManagerDashboardData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          👔 Team Manager Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Manage team operations, finances, and administrative tasks
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Team Members"
          value={data.stats?.teamMembers || 0}
          icon={<Users className="w-8 h-8 text-blue-500" />}
          hoverColor="hover:border-blue-400 dark:hover:border-blue-600"
        />
        <StatCard
          label="Monthly Budget"
          value={`£${data.stats?.monthlyBudget || 0}`}
          icon={<DollarSign className="w-8 h-8 text-green-500" />}
          hoverColor="hover:border-green-400 dark:hover:border-green-600"
        />
        <StatCard
          label="Pending Tasks"
          value={data.stats?.pendingTasks || 0}
          icon={<FileText className="w-8 h-8 text-orange-500" />}
          hoverColor="hover:border-orange-400 dark:hover:border-orange-600"
        />
        <StatCard
          label="Active Staff"
          value={data.stats?.activeStaff || 0}
          icon={<Building2 className="w-8 h-8 text-purple-500" />}
          hoverColor="hover:border-purple-400 dark:hover:border-purple-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAction
          href="/dashboard/manager/team"
          icon={<Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          title="Team Management"
          description="Manage players, staff, registrations, and team details"
          gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
          borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400"
        />
        <QuickAction
          href="/dashboard/manager/finances"
          icon={<DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />}
          title="Financial Management"
          description="Track budgets, expenses, fees, and financial reports"
          gradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
          borderColor="border-green-200 dark:border-green-800 hover:border-green-400"
        />
        <QuickAction
          href="/dashboard/manager/facilities"
          icon={<Building2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
          title="Facilities & Resources"
          description="Book training grounds, manage equipment, and facilities"
          gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400"
        />
      </div>

      {/* Pending Tasks & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Pending Tasks
            </h2>
            <Link href="/dashboard/manager/tasks" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-6">
            {data.pendingTasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle className="w-16 h-16" />}
                title="All caught up!"
                description="No pending tasks at the moment"
              />
            ) : (
              <div className="space-y-3">
                {/* Tasks would be listed here */}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Upcoming Events
            </h2>
            <Link href="/dashboard/manager/calendar" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-6">
            {data.upcomingEvents.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-16 h-16" />}
                title="No upcoming events"
                description="Your calendar is clear"
              />
            ) : (
              <div className="space-y-3">
                {data.upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal-900 dark:text-white text-sm">{event.title}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Team Performance
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Overview of team metrics and performance</p>
          </div>
          <Link
            href="/dashboard/manager/performance"
            className="px-4 py-2 bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2 text-sm font-medium"
          >
            View Details <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-6">
          {!data.hasTeam ? (
            <EmptyState
              icon={<TrendingUp className="w-20 h-20" />}
              title="No team assigned"
              description="Get assigned to a club to start managing"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PerformanceCard label="Win Rate" value="-" subtitle="No matches played yet" color="green" />
              <PerformanceCard label="Goals Scored" value="0" subtitle="This season" color="blue" />
              <PerformanceCard label="Clean Sheets" value="0" subtitle="This season" color="purple" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ label, value, icon, hoverColor }: { label: string; value: number | string; icon: React.ReactNode; hoverColor: string }) {
  return (
    <div className={`bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${hoverColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1 font-medium">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-white">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, description, gradient, borderColor }: {
  href: string; icon: React.ReactNode; title: string; description: string; gradient: string; borderColor: string;
}) {
  return (
    <Link href={href} className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-1`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{description}</p>
      <div className="flex items-center gap-2 mt-4 text-gold-600 dark:text-gold-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Manage</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function PerformanceCard({ label, value, subtitle, color }: { label: string; value: string; subtitle: string; color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400 font-medium">{label}</p>
      <p className="text-3xl font-bold text-charcoal-900 dark:text-white mt-1">{value}</p>
      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">{subtitle}</p>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{description}</p>
    </div>
  );
}