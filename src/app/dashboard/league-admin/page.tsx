// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE ADMIN DASHBOARD v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/league-admin
// Access: LEAGUE_ADMIN role, SuperAdmin
//
// FEATURES:
// ✅ Multi-sport support (12 sports)
// ✅ Schema-aligned with League, LeagueSeason, Competition, Match
// ✅ Uses Match.homeTeam/awayTeam (Team relations)
// ✅ League → Season → Standings hierarchy
// ✅ Independent Competition support (FA Cup style)
// ✅ Quick actions for all admin tasks
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  AlertTriangle,
  Target,
  Settings,
  FileText,
  Shield,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type LeagueStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'ARCHIVED';

interface LeagueSummary {
  id: string;
  name: string;
  sport: Sport;
  status: LeagueStatus;
  teamsCount: number;
  currentSeason?: { id: string; name: string } | null;
}

interface UpcomingMatch {
  id: string;
  kickOffTime: Date;
  venue: string | null;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  league?: { id: string; name: string } | null;
  competition?: { id: string; name: string } | null;
  sport: Sport;
}

interface PendingAction {
  type: string;
  count: number;
  description: string;
  href: string;
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500' },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getLeagueAdminData(userId: string) {
  const leagueAdmin = await prisma.leagueAdmin.findUnique({
    where: { userId },
    include: {
      leagues: {
        include: {
          league: {
            include: {
              seasons: { where: { isCurrent: true }, take: 1 },
              _count: { select: { teams: true } },
            },
          },
        },
      },
    },
  });

  if (!leagueAdmin || leagueAdmin.leagues.length === 0) {
    return {
      hasLeagues: false,
      leagues: [],
      stats: { totalLeagues: 0, activeLeagues: 0, totalTeams: 0, upcomingFixtures: 0, pendingResults: 0, completedMatches: 0 },
      upcomingMatches: [],
      pendingActions: [],
    };
  }

  const leagueIds = leagueAdmin.leagues.map(l => l.leagueId);

  const upcomingMatches = await prisma.match.findMany({
    where: { leagueId: { in: leagueIds }, status: 'SCHEDULED', kickOffTime: { gte: new Date() } },
    include: {
      homeTeam: { select: { id: true, name: true, club: { select: { sport: true } } } },
      awayTeam: { select: { id: true, name: true } },
      league: { select: { id: true, name: true } },
      competition: { select: { id: true, name: true } },
    },
    orderBy: { kickOffTime: 'asc' },
    take: 8,
  });

  const pendingResults = await prisma.match.count({
    where: { leagueId: { in: leagueIds }, status: 'FINISHED', homeScore: null },
  });

  const completedMatches = await prisma.match.count({
    where: { leagueId: { in: leagueIds }, status: 'FINISHED', homeScore: { not: null } },
  });

  const pendingActions: PendingAction[] = [];
  if (pendingResults > 0) {
    pendingActions.push({ type: 'RESULT_PENDING', count: pendingResults, description: 'Results awaiting entry', href: '/dashboard/league-admin/results' });
  }

  const leagues: LeagueSummary[] = leagueAdmin.leagues.map(l => ({
    id: l.league.id,
    name: l.league.name,
    sport: l.league.sport as Sport,
    status: l.league.status as LeagueStatus,
    teamsCount: l.league._count.teams,
    currentSeason: l.league.seasons[0] ? { id: l.league.seasons[0].id, name: l.league.seasons[0].name } : null,
  }));

  return {
    hasLeagues: true,
    leagues,
    stats: {
      totalLeagues: leagues.length,
      activeLeagues: leagues.filter(l => l.status === 'ACTIVE').length,
      totalTeams: leagues.reduce((sum, l) => sum + l.teamsCount, 0),
      upcomingFixtures: upcomingMatches.length,
      pendingResults,
      completedMatches,
    },
    upcomingMatches: upcomingMatches.map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      league: m.league,
      competition: m.competition,
      sport: (m.homeTeam.club?.sport as Sport) || 'FOOTBALL',
    })),
    pendingActions,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function LeagueAdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const data = await getLeagueAdminData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">League Administration</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage leagues, fixtures, standings, and competitions</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/league-admin/leagues/create" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-md">
            <Plus className="w-5 h-5" /> New League
          </Link>
          <Link href="/dashboard/league-admin/competitions/create" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-semibold rounded-xl shadow-md">
            <Trophy className="w-5 h-5" /> New Competition
          </Link>
        </div>
      </div>

      {/* Pending Actions */}
      {data.pendingActions.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-800 dark:text-amber-300">Actions Required</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.pendingActions.map((action, i) => (
              <Link key={i} href={action.href} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700 hover:border-amber-400 transition-colors">
                <span className="font-bold text-amber-700 dark:text-amber-400">{action.count}</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">{action.description}</span>
                <ArrowRight className="w-4 h-4 text-amber-500" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Leagues" value={data.stats.totalLeagues} icon={<Trophy className="w-6 h-6 text-green-500" />} />
        <StatCard label="Active" value={data.stats.activeLeagues} icon={<CheckCircle className="w-6 h-6 text-emerald-500" />} />
        <StatCard label="Teams" value={data.stats.totalTeams} icon={<Users className="w-6 h-6 text-blue-500" />} />
        <StatCard label="Upcoming" value={data.stats.upcomingFixtures} icon={<Calendar className="w-6 h-6 text-purple-500" />} />
        <StatCard label="Pending" value={data.stats.pendingResults} icon={<Clock className="w-6 h-6 text-amber-500" />} highlight={data.stats.pendingResults > 0} />
        <StatCard label="Completed" value={data.stats.completedMatches} icon={<BarChart3 className="w-6 h-6 text-indigo-500" />} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction href="/dashboard/league-admin/leagues" icon={<Trophy className="w-7 h-7 text-green-600" />} title="Manage Leagues" gradient="from-green-50 to-emerald-100 dark:from-green-900/20" borderColor="border-green-200 dark:border-green-800" />
        <QuickAction href="/dashboard/league-admin/fixtures" icon={<Calendar className="w-7 h-7 text-purple-600" />} title="Fixtures" gradient="from-purple-50 to-violet-100 dark:from-purple-900/20" borderColor="border-purple-200 dark:border-purple-800" />
        <QuickAction href="/dashboard/league-admin/standings" icon={<BarChart3 className="w-7 h-7 text-orange-600" />} title="Standings" gradient="from-orange-50 to-amber-100 dark:from-orange-900/20" borderColor="border-orange-200 dark:border-orange-800" />
        <QuickAction href="/dashboard/league-admin/competitions" icon={<Target className="w-7 h-7 text-pink-600" />} title="Competitions" gradient="from-pink-50 to-rose-100 dark:from-pink-900/20" borderColor="border-pink-200 dark:border-pink-800" />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Leagues */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-500" /> My Leagues
            </h2>
            <Link href="/dashboard/league-admin/leagues/create" className="px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg">Create</Link>
          </div>
          <div className="p-5">
            {!data.hasLeagues ? (
              <EmptyState icon={<Trophy className="w-16 h-16" />} title="No leagues yet" />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.leagues.map(league => {
                  const sportConfig = SPORT_CONFIG[league.sport];
                  return (
                    <Link key={league.id} href={`/dashboard/league-admin/leagues/${league.id}`} className="group p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-green-300 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-md`}>
                          <span className="text-2xl">{sportConfig.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{league.name}</p>
                            <StatusBadge status={league.status} />
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{league.teamsCount} teams • {sportConfig.label}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" /> Upcoming
            </h2>
            <Link href="/dashboard/league-admin/fixtures" className="text-sm text-purple-600 hover:underline">View All</Link>
          </div>
          <div className="p-4">
            {data.upcomingMatches.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No upcoming fixtures</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingMatches.slice(0, 5).map(match => {
                  const sportConfig = SPORT_CONFIG[match.sport];
                  return (
                    <div key={match.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{sportConfig.icon}</span>
                        <span className="text-xs text-slate-500">{match.league?.name || match.competition?.name}</span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{match.homeTeam.name} vs {match.awayTeam.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(match.kickOffTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Tools */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" /> Admin Tools
          </h2>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AdminTool href="/dashboard/league-admin/teams" icon={<Users className="w-5 h-5" />} label="Teams" />
          <AdminTool href="/dashboard/league-admin/results" icon={<FileText className="w-5 h-5" />} label="Results" />
          <AdminTool href="/dashboard/league-admin/standings" icon={<BarChart3 className="w-5 h-5" />} label="Standings" />
          <AdminTool href="/dashboard/league-admin/referees" icon={<Shield className="w-5 h-5" />} label="Referees" />
          <AdminTool href="/dashboard/league-admin/rules" icon={<FileText className="w-5 h-5" />} label="Rules" />
          <AdminTool href="/dashboard/league-admin/reports" icon={<BarChart3 className="w-5 h-5" />} label="Reports" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({ label, value, icon, highlight = false }: { label: string; value: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-4 ${highlight ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, gradient, borderColor }: { href: string; icon: React.ReactNode; title: string; gradient: string; borderColor: string }) {
  return (
    <Link href={href} className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all`}>
      <div className="mb-2">{icon}</div>
      <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
    </Link>
  );
}

function StatusBadge({ status }: { status: LeagueStatus }) {
  const colors: Record<LeagueStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    ACTIVE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    ARCHIVED: 'bg-slate-100 text-slate-600',
  };
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors[status]}`}>{status}</span>;
}

function AdminTool({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-green-300 transition-all text-center group">
      <div className="text-slate-500 group-hover:text-green-600 transition-colors">{icon}</div>
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </Link>
  );
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-slate-300 mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
    </div>
  );
}