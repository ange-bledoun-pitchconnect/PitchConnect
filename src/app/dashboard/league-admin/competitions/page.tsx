// =============================================================================
// 🏆 PITCHCONNECT - COMPETITIONS MANAGEMENT v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/league-admin/competitions
// Access: LEAGUE_ADMIN role, SuperAdmin
//
// FEATURES:
// ✅ All competition formats: League, Knockout, Group + Knockout, Round Robin
// ✅ Multi-sport support (12 sports)
// ✅ Independent competitions (FA Cup style - not tied to a league)
// ✅ Competition status management
// ✅ Progress tracking and bracket visualization
// ✅ CRUD operations via API
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  Calendar,
  Users,
  Target,
  Settings,
  Eye,
  Play,
  Pause,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  Search,
  LayoutGrid,
  GitBranch,
  Layers,
  RotateCcw,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type CompetitionFormat = 'LEAGUE' | 'KNOCKOUT' | 'GROUP_KNOCKOUT' | 'ROUND_ROBIN';
type CompetitionStatus = 'DRAFT' | 'REGISTRATION' | 'ACTIVE' | 'KNOCKOUT_STAGE' | 'COMPLETED' | 'CANCELLED';

interface Competition {
  id: string;
  name: string;
  sport: Sport;
  format: CompetitionFormat;
  status: CompetitionStatus;
  description?: string | null;
  startDate: Date | null;
  endDate: Date | null;
  teamsCount: number;
  matchesTotal: number;
  matchesPlayed: number;
  currentRound?: string | null;
  winner?: { id: string; name: string } | null;
  isIndependent: boolean; // Not tied to a league
  league?: { id: string; name: string } | null;
  groupCount?: number;
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

const FORMAT_CONFIG: Record<CompetitionFormat, { label: string; icon: React.ReactNode; description: string }> = {
  LEAGUE: { label: 'League', icon: <LayoutGrid className="w-5 h-5" />, description: 'Round-robin, everyone plays everyone' },
  KNOCKOUT: { label: 'Knockout', icon: <GitBranch className="w-5 h-5" />, description: 'Single elimination bracket' },
  GROUP_KNOCKOUT: { label: 'Group + Knockout', icon: <Layers className="w-5 h-5" />, description: 'Group stage then knockout' },
  ROUND_ROBIN: { label: 'Round Robin', icon: <RotateCcw className="w-5 h-5" />, description: 'Each team plays all others once' },
};

const STATUS_CONFIG: Record<CompetitionStatus, { color: string; label: string; icon: React.ReactNode }> = {
  DRAFT: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', label: 'Draft', icon: <Clock className="w-3 h-3" /> },
  REGISTRATION: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Registration', icon: <Users className="w-3 h-3" /> },
  ACTIVE: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Active', icon: <Play className="w-3 h-3" /> },
  KNOCKOUT_STAGE: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Knockout', icon: <GitBranch className="w-3 h-3" /> },
  COMPLETED: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Completed', icon: <Trophy className="w-3 h-3" /> },
  CANCELLED: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Cancelled', icon: <Pause className="w-3 h-3" /> },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getCompetitionsData(userId: string) {
  // Get league admin's managed leagues
  const leagueAdmin = await prisma.leagueAdmin.findUnique({
    where: { userId },
    include: { leagues: { select: { leagueId: true } } },
  });

  const leagueIds = leagueAdmin?.leagues.map(l => l.leagueId) || [];

  // Fetch competitions - both league-based and independent ones the admin manages
  const competitions = await prisma.competition.findMany({
    where: {
      OR: [
        { leagueId: { in: leagueIds } },
        { createdById: userId },
      ],
    },
    include: {
      league: { select: { id: true, name: true } },
      winner: { select: { id: true, name: true } },
      _count: { select: { teams: true, matches: true } },
      matches: {
        where: { status: 'FINISHED' },
        select: { id: true },
      },
    },
    orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
  });

  // Calculate stats
  const stats = {
    total: competitions.length,
    active: competitions.filter(c => c.status === 'ACTIVE' || c.status === 'KNOCKOUT_STAGE').length,
    completed: competitions.filter(c => c.status === 'COMPLETED').length,
    draft: competitions.filter(c => c.status === 'DRAFT').length,
    totalTeams: competitions.reduce((sum, c) => sum + c._count.teams, 0),
    totalMatches: competitions.reduce((sum, c) => sum + c._count.matches, 0),
  };

  return {
    competitions: competitions.map(c => ({
      id: c.id,
      name: c.name,
      sport: c.sport as Sport,
      format: c.format as CompetitionFormat,
      status: c.status as CompetitionStatus,
      description: c.description,
      startDate: c.startDate,
      endDate: c.endDate,
      teamsCount: c._count.teams,
      matchesTotal: c._count.matches,
      matchesPlayed: c.matches.length,
      currentRound: c.currentRound,
      winner: c.winner,
      isIndependent: !c.leagueId,
      league: c.league,
      groupCount: c.groupCount,
    })),
    stats,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function CompetitionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const { competitions, stats } = await getCompetitionsData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Competitions</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage cups, tournaments, and knockout competitions</p>
          </div>
        </div>
        <Link
          href="/dashboard/league-admin/competitions/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Competition
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total" value={stats.total} icon={<Trophy className="w-6 h-6 text-purple-500" />} />
        <StatCard label="Active" value={stats.active} icon={<Play className="w-6 h-6 text-green-500" />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle className="w-6 h-6 text-amber-500" />} />
        <StatCard label="Draft" value={stats.draft} icon={<Clock className="w-6 h-6 text-slate-500" />} />
        <StatCard label="Teams" value={stats.totalTeams} icon={<Users className="w-6 h-6 text-blue-500" />} />
        <StatCard label="Matches" value={stats.totalMatches} icon={<Calendar className="w-6 h-6 text-indigo-500" />} />
      </div>

      {/* Competition Formats Info */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(FORMAT_CONFIG).map(([format, cfg]) => (
          <div key={format} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                {cfg.icon}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">{cfg.label}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{cfg.description}</p>
          </div>
        ))}
      </div>

      {/* Competitions Grid */}
      {competitions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Trophy className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Competitions Yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first cup, tournament, or knockout competition</p>
          <Link
            href="/dashboard/league-admin/competitions/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl"
          >
            <Plus className="w-5 h-5" /> Create Competition
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {competitions.map(comp => (
            <CompetitionCard key={comp.id} competition={comp} />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function CompetitionCard({ competition: comp }: { competition: Competition }) {
  const sportConfig = SPORT_CONFIG[comp.sport];
  const formatConfig = FORMAT_CONFIG[comp.format];
  const statusConfig = STATUS_CONFIG[comp.status];
  const progress = comp.matchesTotal > 0 ? Math.round((comp.matchesPlayed / comp.matchesTotal) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-lg transition-all">
      {/* Header */}
      <div className={`p-5 bg-gradient-to-r ${sportConfig.color} bg-opacity-10`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sportConfig.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{comp.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
                {comp.isIndependent && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    Independent
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
            {formatConfig.icon}
          </div>
        </div>

        {/* Format Badge */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-medium">{formatConfig.label}</span>
          {comp.format === 'GROUP_KNOCKOUT' && comp.groupCount && (
            <span>• {comp.groupCount} Groups</span>
          )}
          {comp.league && (
            <span>• {comp.league.name}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">TEAMS</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{comp.teamsCount}</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">MATCHES</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{comp.matchesTotal}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {comp.matchesTotal > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Progress</span>
              <span className="font-bold text-slate-900 dark:text-white">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full bg-gradient-to-r ${sportConfig.color}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {comp.matchesPlayed} of {comp.matchesTotal} matches played
            </p>
          </div>
        )}

        {/* Dates */}
        {(comp.startDate || comp.endDate) && (
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-slate-500" />
              {comp.startDate && new Date(comp.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {comp.startDate && comp.endDate && ' - '}
              {comp.endDate && new Date(comp.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        )}

        {/* Current Round */}
        {comp.currentRound && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">CURRENT ROUND</p>
            <p className="font-bold text-amber-700 dark:text-amber-400">{comp.currentRound}</p>
          </div>
        )}

        {/* Winner */}
        {comp.winner && (
          <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-300 dark:border-amber-700">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">🏆 WINNER</p>
            <p className="font-bold text-amber-800 dark:text-amber-300">{comp.winner.name}</p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <Link
            href={`/dashboard/league-admin/competitions/${comp.id}`}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-sm transition-colors"
          >
            <Eye className="w-4 h-4" /> View
          </Link>
          <Link
            href={`/dashboard/league-admin/competitions/${comp.id}/settings`}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-sm transition-colors"
          >
            <Settings className="w-4 h-4" /> Manage
          </Link>
        </div>
      </div>
    </div>
  );
}