/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Coach Dashboard v2.0
 * Path: src/app/dashboard/coach/page.tsx
 * ============================================================================
 * 
 * FIXED: Uses correct Prisma schema field names:
 * - Coach uses clubMemberships (not teams)
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
  Users, Clipboard, Calendar, TrendingUp, Target, BookOpen, ArrowRight,
  Clock, MapPin,
} from 'lucide-react';
import { SPORT_CONFIGS, Sport } from '@/types/player';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getCoachDashboardData(userId: string) {
  // Get coach with club memberships
  const coach = await prisma.coach.findUnique({
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
                  _count: { select: { players: true } },
                },
              },
            },
          },
        },
      },
      trainingSessions: {
        where: {
          startTime: { gte: new Date() },
        },
        orderBy: { startTime: 'asc' },
        take: 5,
      },
    },
  });

  if (!coach || coach.clubMemberships.length === 0) {
    return { hasTeam: false, stats: null, clubs: [], upcomingMatches: [], trainingSessions: [], primarySport: 'FOOTBALL' as Sport };
  }

  // Get all teams from the clubs this coach is a member of
  const allTeams = coach.clubMemberships.flatMap(cm => 
    cm.club.teams.map(t => ({ ...t, club: cm.club, sport: cm.club.sport as Sport }))
  );
  const teamIds = allTeams.map(t => t.id);
  const primarySport = (coach.clubMemberships[0]?.club?.sport as Sport) || 'FOOTBALL';

  // Get upcoming matches for coach's teams
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
  const totalPlayers = allTeams.reduce((sum, t) => sum + t._count.players, 0);

  return {
    hasTeam: allTeams.length > 0,
    primarySport,
    clubs: coach.clubMemberships.map(cm => ({
      id: cm.club.id,
      name: cm.club.name,
      sport: cm.club.sport as Sport,
      teams: cm.club.teams,
    })),
    teams: allTeams.map(t => ({
      id: t.id,
      name: t.name,
      club: t.club,
      playerCount: t._count.players,
      sport: t.sport,
    })),
    stats: {
      squadSize: totalPlayers,
      trainingSessions: coach.trainingSessions.length,
      winRate: null,
      avgGoals: null,
    },
    upcomingMatches: upcomingMatches.map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      isHome: teamIds.includes(m.homeTeamId),
    })),
    trainingSessions: coach.trainingSessions.map(ts => ({
      id: ts.id,
      name: ts.name,
      startTime: ts.startTime,
    })),
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function CoachPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const data = await getCoachDashboardData(session.user.id);
  const sportConfig = SPORT_CONFIGS[data.primarySport || 'FOOTBALL'];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          📋 Coach Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Manage your squad, training sessions, and tactical planning
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Squad Size" value={data.stats?.squadSize || 0} icon={<Users className="w-8 h-8 text-blue-500" />} hoverColor="hover:border-blue-400" />
        <StatCard label="Training Sessions" value={data.stats?.trainingSessions || 0} icon={<Clipboard className="w-8 h-8 text-green-500" />} hoverColor="hover:border-green-400" />
        <StatCard label="Win Rate" value={data.stats?.winRate?.toFixed(0) + '%' || '-'} icon={<TrendingUp className="w-8 h-8 text-purple-500" />} hoverColor="hover:border-purple-400" />
        <StatCard label="Avg Goals/Game" value={data.stats?.avgGoals?.toFixed(1) || '-'} icon={<Target className="w-8 h-8 text-orange-500" />} hoverColor="hover:border-orange-400" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAction
          href="/dashboard/coach/squad"
          icon={<Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          title="Squad Management"
          description="View roster, set lineups, and manage player availability"
          gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
          borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400"
        />
        <QuickAction
          href="/dashboard/coach/training"
          icon={<Clipboard className="w-8 h-8 text-green-600 dark:text-green-400" />}
          title="Training Sessions"
          description="Plan drills, track attendance, and monitor development"
          gradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
          borderColor="border-green-200 dark:border-green-800 hover:border-green-400"
        />
        <QuickAction
          href="/dashboard/coach/tactics"
          icon={<BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
          title="Tactics & Analysis"
          description="Create formations, analyze opponents, and review data"
          gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400"
        />
      </div>

      {/* Training & Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Week's Training */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-green-500" />
              Upcoming Training
            </h2>
            <Link href="/dashboard/coach/training/new" className="px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm">
              Schedule
            </Link>
          </div>
          <div className="p-6">
            {data.trainingSessions.length === 0 ? (
              <EmptyState icon={<Clipboard className="w-16 h-16" />} title="No sessions scheduled" description="Plan your first training session" actionLabel="Schedule Training" actionHref="/dashboard/coach/training/new" />
            ) : (
              <div className="space-y-3">
                {data.trainingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Clipboard className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal-900 dark:text-white text-sm">{session.name || 'Training Session'}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.startTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Upcoming Matches
            </h2>
            <Link href="/dashboard/coach/fixtures" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-6">
            {data.upcomingMatches.length === 0 ? (
              <EmptyState icon={<Calendar className="w-16 h-16" />} title="No upcoming matches" description="Your match schedule will appear here" />
            ) : (
              <div className="space-y-3">
                {data.upcomingMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-sm font-bold text-charcoal-900 dark:text-white">
                          {new Date(match.kickOffTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                          {new Date(match.kickOffTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-neutral-300 dark:bg-charcoal-600" />
                      <div>
                        <p className="font-semibold text-charcoal-900 dark:text-white text-sm">
                          {match.homeTeam.name} vs {match.awayTeam.name}
                        </p>
                        {match.venue && (
                          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {match.venue}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${match.isHome ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {match.isHome ? 'Home' : 'Away'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Teams */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" />
              My Teams
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Teams you're currently coaching</p>
          </div>
          <Link href="/dashboard/coach/squad" className="px-4 py-2 bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2 text-sm font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-6">
          {!data.hasTeam ? (
            <EmptyState icon={<Users className="w-20 h-20" />} title="No teams assigned" description="Get assigned to a club to start coaching" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.teams?.map((team) => {
                const teamSportConfig = SPORT_CONFIGS[team.sport];
                return (
                  <Link key={team.id} href={`/dashboard/coach/squad/${team.id}`} className="group p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl border border-neutral-200 dark:border-charcoal-600 hover:border-gold-300 dark:hover:border-gold-700 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md text-2xl">
                        {teamSportConfig.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-charcoal-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 truncate">{team.name}</p>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{team.playerCount} players • {team.club.name}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-charcoal-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
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

function EmptyState({ icon, title, description, actionLabel, actionHref }: {
  icon: React.ReactNode; title: string; description: string; actionLabel?: string; actionHref?: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}