/**
 * ============================================================================
 * 🏆 PITCHCONNECT - League Admin Dashboard v2.0
 * Path: src/app/dashboard/league-admin/page.tsx
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Trophy, Users, Calendar, BarChart3, TrendingUp, CheckCircle, AlertCircle,
  ArrowRight, Clock,
} from 'lucide-react';
import { SPORT_CONFIGS, Sport } from '@/types/player';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getLeagueAdminData(userId: string) {
  const leagueAdmin = await prisma.leagueAdmin.findUnique({
    where: { userId },
    include: {
      leagues: {
        include: {
          league: {
            include: {
              _count: { select: { seasons: true, teams: true } },
            },
          },
        },
      },
    },
  });

  if (!leagueAdmin || leagueAdmin.leagues.length === 0) {
    return { hasLeagues: false, leagues: [], stats: null, upcomingMatches: [] };
  }

  const leagueIds = leagueAdmin.leagues.map(l => l.leagueId);

  const upcomingMatches = await prisma.match.findMany({
    where: { leagueId: { in: leagueIds }, status: 'SCHEDULED', kickOffTime: { gte: new Date() } },
    include: {
      homeTeam: true,
      awayTeam: true,
      league: true,
    },
    orderBy: { kickOffTime: 'asc' },
    take: 5,
  });

  const completedMatches = await prisma.match.count({
    where: { leagueId: { in: leagueIds }, status: 'FINISHED' },
  });

  return {
    hasLeagues: true,
    leagues: leagueAdmin.leagues.map(l => ({
      id: l.league.id,
      name: l.league.name,
      sport: l.league.sport as Sport,
      status: l.league.status,
      teamsCount: l.league._count.teams,
    })),
    stats: {
      totalLeagues: leagueAdmin.leagues.length,
      activeLeagues: leagueAdmin.leagues.filter(l => l.league.status === 'ACTIVE').length,
      totalTeams: leagueAdmin.leagues.reduce((sum, l) => sum + l.league._count.teams, 0),
      upcomingFixtures: upcomingMatches.length,
      completedMatches,
    },
    upcomingMatches: upcomingMatches.map(m => ({
      id: m.id, kickOffTime: m.kickOffTime, venue: m.venue,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name }, 
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name }, 
      league: m.league ? { id: m.league.id, name: m.league.name } : null,
      sport: (m.homeTeam.sport as Sport) || 'FOOTBALL',
    })),
  };
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default async function LeagueAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const data = await getLeagueAdminData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          🏆 League Admin Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Manage leagues, teams, fixtures, and competition settings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Leagues" value={data.stats?.totalLeagues || 0} icon={<Trophy className="w-6 h-6 text-green-500" />} />
        <StatCard label="Active" value={data.stats?.activeLeagues || 0} icon={<CheckCircle className="w-6 h-6 text-emerald-500" />} />
        <StatCard label="Teams" value={data.stats?.totalTeams || 0} icon={<Users className="w-6 h-6 text-blue-500" />} />
        <StatCard label="Upcoming" value={data.stats?.upcomingFixtures || 0} icon={<Calendar className="w-6 h-6 text-purple-500" />} />
        <StatCard label="Completed" value={data.stats?.completedMatches || 0} icon={<BarChart3 className="w-6 h-6 text-orange-500" />} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAction href="/dashboard/league-admin/leagues" icon={<Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />} title="Manage Leagues" description="Create and configure leagues" gradient="from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20" borderColor="border-green-200 dark:border-green-800 hover:border-green-400" />
        <QuickAction href="/dashboard/league-admin/teams" icon={<Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />} title="Team Management" description="Approve and manage teams" gradient="from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20" borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400" />
        <QuickAction href="/dashboard/league-admin/fixtures" icon={<Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />} title="Fixture Scheduling" description="Schedule matches" gradient="from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20" borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400" />
        <QuickAction href="/dashboard/league-admin/standings" icon={<BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />} title="Standings & Results" description="View tables and results" gradient="from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20" borderColor="border-orange-200 dark:border-orange-800 hover:border-orange-400" />
      </div>

      {/* My Leagues */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold-500" /> My Leagues
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Leagues you're managing</p>
          </div>
          <Link href="/dashboard/league-admin/leagues/create" className="px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm">
            Create League
          </Link>
        </div>
        <div className="p-6">
          {!data.hasLeagues ? (
            <EmptyState icon={<Trophy className="w-20 h-20" />} title="No leagues yet" description="Create your first league to start managing competitions" actionLabel="Create Your First League" actionHref="/dashboard/league-admin/leagues/create" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.leagues.map((league) => {
                const sportConfig = SPORT_CONFIGS[league.sport] || SPORT_CONFIGS.FOOTBALL;
                return (
                  <Link key={league.id} href={`/dashboard/league-admin/leagues/${league.id}`} className="group p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl border border-neutral-200 dark:border-charcoal-600 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-md text-2xl">{sportConfig.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-charcoal-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 truncate">{league.name}</p>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{league.teamsCount} teams • {sportConfig.name}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${league.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-charcoal-600 dark:bg-charcoal-600 dark:text-charcoal-400'}`}>{league.status}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-charcoal-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Fixtures */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" /> Upcoming Fixtures
          </h2>
          <Link href="/dashboard/league-admin/fixtures" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">View All</Link>
        </div>
        <div className="p-6">
          {data.upcomingMatches.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
              <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">No upcoming fixtures</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingMatches.map((match) => {
                const sportConfig = SPORT_CONFIGS[match.sport] || SPORT_CONFIGS.FOOTBALL;
                return (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{sportConfig.icon}</span>
                      <div>
                        <p className="font-semibold text-charcoal-900 dark:text-white text-sm">{match.homeTeam.name} vs {match.awayTeam.name}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(match.kickOffTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-charcoal-500 dark:text-charcoal-400 bg-neutral-200 dark:bg-charcoal-600 px-2 py-1 rounded">{match.league.name}</span>
                  </div>
                );
              })}
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

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white mt-1">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, description, gradient, borderColor }: { href: string; icon: React.ReactNode; title: string; description: string; gradient: string; borderColor: string }) {
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

function EmptyState({ icon, title, description, actionLabel, actionHref }: { icon: React.ReactNode; title: string; description: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-charcoal-300 dark:text-charcoal-600 mx-auto mb-6">{icon}</div>
      <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">{actionLabel}</Link>
      )}
    </div>
  );
}