// =============================================================================
// 🏆 PITCHCONNECT - COACH DASHBOARD v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/coach
// Access: HEAD_COACH, ASSISTANT_COACH, GOALKEEPING_COACH, FITNESS_COACH, 
//         PERFORMANCE_COACH, YOUTH_COACH, SCOUT_COACH, ANALYST
//
// FEATURES:
// ✅ Multi-sport support (12 sports)
// ✅ Schema-aligned with Coach, ClubMember, Team, Match, TrainingSession
// ✅ Uses clubMemberships relation (not teams)
// ✅ Uses Match.homeTeam/awayTeam (Team relations)
// ✅ Quick actions for squad, training, tactics
// ✅ Upcoming matches and training sessions
// ✅ Team overview with sport-specific stats
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Users,
  Clipboard,
  Calendar,
  TrendingUp,
  Target,
  BookOpen,
  ArrowRight,
  Clock,
  MapPin,
  Trophy,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type CoachType =
  | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'GOALKEEPING_COACH' | 'FITNESS_COACH'
  | 'PERFORMANCE_COACH' | 'YOUTH_COACH' | 'SCOUT_COACH' | 'ANALYST';

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string; scoreLabel: string }> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600', scoreLabel: 'Goals' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600', scoreLabel: 'Goals' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600', scoreLabel: 'Points' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600', scoreLabel: 'Points' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600', scoreLabel: 'Runs' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600', scoreLabel: 'Goals' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600', scoreLabel: 'Points' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600', scoreLabel: 'Goals' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600', scoreLabel: 'Points' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600', scoreLabel: 'Points' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600', scoreLabel: 'Goals' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500', scoreLabel: 'Goals' },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getCoachDashboardData(userId: string) {
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
              logo: true,
              teams: {
                select: {
                  id: true,
                  name: true,
                  ageGroup: true,
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
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
        orderBy: { startTime: 'asc' },
        take: 5,
      },
    },
  });

  if (!coach || coach.clubMemberships.length === 0) {
    return { hasTeam: false, stats: null, clubs: [], teams: [], upcomingMatches: [], trainingSessions: [], recentResults: [], primarySport: 'FOOTBALL' as Sport, coachType: 'HEAD_COACH' as CoachType };
  }

  const allTeams = coach.clubMemberships.flatMap(cm =>
    cm.club.teams.map(t => ({
      id: t.id,
      name: t.name,
      ageGroup: t.ageGroup,
      playerCount: t._count.players,
      club: { id: cm.club.id, name: cm.club.name, sport: cm.club.sport as Sport, logo: cm.club.logo },
    }))
  );

  const teamIds = allTeams.map(t => t.id);
  const primarySport = (coach.clubMemberships[0]?.club?.sport as Sport) || 'FOOTBALL';

  const upcomingMatches = teamIds.length > 0
    ? await prisma.match.findMany({
        where: {
          status: 'SCHEDULED',
          kickOffTime: { gte: new Date() },
          OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
        },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
        orderBy: { kickOffTime: 'asc' },
        take: 5,
      })
    : [];

  const recentResults = teamIds.length > 0
    ? await prisma.match.findMany({
        where: {
          status: 'FINISHED',
          OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
        },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
        orderBy: { kickOffTime: 'desc' },
        take: 5,
      })
    : [];

  const totalPlayers = allTeams.reduce((sum, t) => sum + t.playerCount, 0);

  let wins = 0;
  recentResults.forEach(match => {
    const isHome = teamIds.includes(match.homeTeamId);
    const ourScore = isHome ? match.homeScore : match.awayScore;
    const theirScore = isHome ? match.awayScore : match.homeScore;
    if (ourScore !== null && theirScore !== null && ourScore > theirScore) wins++;
  });

  const winRate = recentResults.length > 0 ? (wins / recentResults.length) * 100 : null;

  return {
    hasTeam: allTeams.length > 0,
    primarySport,
    coachType: (coach.coachType as CoachType) || 'HEAD_COACH',
    clubs: coach.clubMemberships.map(cm => ({
      id: cm.club.id,
      name: cm.club.name,
      sport: cm.club.sport as Sport,
      logo: cm.club.logo,
    })),
    teams: allTeams,
    stats: {
      squadSize: totalPlayers,
      trainingSessions: coach.trainingSessions.length,
      upcomingMatches: upcomingMatches.length,
      winRate,
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
      sessionType: ts.sessionType,
    })),
    recentResults: recentResults.map(m => {
      const isHome = teamIds.includes(m.homeTeamId);
      const ourScore = isHome ? m.homeScore : m.awayScore;
      const theirScore = isHome ? m.awayScore : m.homeScore;
      return {
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        date: m.kickOffTime,
        isWin: ourScore !== null && theirScore !== null ? ourScore > theirScore : null,
      };
    }),
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function CoachDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const data = await getCoachDashboardData(session.user.id);
  const sportConfig = SPORT_CONFIG[data.primarySport];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
            <span className="text-3xl">{sportConfig.icon}</span>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Coach Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400">{data.coachType.replace(/_/g, ' ')} • {sportConfig.label}</p>
          </div>
        </div>
        {data.hasTeam && (
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/coach/training/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-md">
              <Clipboard className="w-5 h-5" /> New Session
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Squad Size" value={data.stats?.squadSize || 0} icon={<Users className="w-8 h-8 text-blue-500" />} color="border-blue-400" />
        <StatCard label="Training Sessions" value={data.stats?.trainingSessions || 0} icon={<Clipboard className="w-8 h-8 text-green-500" />} color="border-green-400" />
        <StatCard label="Win Rate" value={data.stats?.winRate !== null ? `${data.stats.winRate.toFixed(0)}%` : '-'} icon={<TrendingUp className="w-8 h-8 text-purple-500" />} color="border-purple-400" />
        <StatCard label="Upcoming" value={data.stats?.upcomingMatches || 0} icon={<Calendar className="w-8 h-8 text-orange-500" />} color="border-orange-400" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAction href="/dashboard/coach/team" icon={<Users className="w-8 h-8 text-blue-600" />} title="Squad Management" description="View roster and manage availability" gradient="from-blue-50 to-blue-100 dark:from-blue-900/20" borderColor="border-blue-200 dark:border-blue-800" />
        <QuickAction href="/dashboard/coach/training" icon={<Clipboard className="w-8 h-8 text-green-600" />} title="Training Sessions" description="Plan drills and track development" gradient="from-green-50 to-green-100 dark:from-green-900/20" borderColor="border-green-200 dark:border-green-800" />
        <QuickAction href="/dashboard/coach/tactics" icon={<BookOpen className="w-8 h-8 text-purple-600" />} title="Tactics & Formations" description="Create formations and strategies" gradient="from-purple-50 to-purple-100 dark:from-purple-900/20" borderColor="border-purple-200 dark:border-purple-800" />
      </div>

      {/* Training & Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Training */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-green-500" /> Upcoming Training
            </h2>
            <Link href="/dashboard/coach/training/new" className="px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg">Schedule</Link>
          </div>
          <div className="p-5">
            {data.trainingSessions.length === 0 ? (
              <EmptyState icon={<Clipboard className="w-16 h-16" />} title="No sessions scheduled" />
            ) : (
              <div className="space-y-3">
                {data.trainingSessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Clipboard className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{session.name || session.sessionType.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Upcoming Matches
            </h2>
            <Link href="/dashboard/coach/matches" className="text-sm font-medium text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="p-5">
            {data.upcomingMatches.length === 0 ? (
              <EmptyState icon={<Calendar className="w-16 h-16" />} title="No upcoming matches" />
            ) : (
              <div className="space-y-3">
                {data.upcomingMatches.map(match => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(match.kickOffTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                        <p className="text-xs text-slate-500">{new Date(match.kickOffTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-300 dark:bg-slate-600" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{match.homeTeam.name} vs {match.awayTeam.name}</p>
                        {match.venue && <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {match.venue}</p>}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${match.isHome ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" /> My Teams
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Teams you're coaching</p>
          </div>
          <Link href="/dashboard/coach/team" className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-5">
          {!data.hasTeam ? (
            <EmptyState icon={<Users className="w-20 h-20" />} title="No teams assigned" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.teams.map(team => {
                const teamSportConfig = SPORT_CONFIG[team.club.sport];
                return (
                  <Link key={team.id} href={`/dashboard/coach/team/${team.id}`} className="group p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-gold-300 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${teamSportConfig.color} flex items-center justify-center shadow-md`}>
                        <span className="text-2xl">{teamSportConfig.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-gold-600 truncate">{team.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{team.playerCount} players • {team.club.name}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
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

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 ${color} p-5 hover:shadow-lg hover:-translate-y-1 transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, description, gradient, borderColor }: { href: string; icon: React.ReactNode; title: string; description: string; gradient: string; borderColor: string }) {
  return (
    <Link href={href} className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      <div className="flex items-center gap-2 mt-4 text-gold-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Manage</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-slate-300 dark:text-slate-600 mx-auto mb-3">{icon}</div>
      <p className="text-slate-600 dark:text-slate-400 font-medium">{title}</p>
    </div>
  );
}