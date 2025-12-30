/**
 * ============================================================================
 * 📊 PITCHCONNECT - Player Stats v7.5.0 (Enterprise Multi-Sport)
 * Path: src/app/dashboard/player/stats/page.tsx
 * ============================================================================
 *
 * FEATURES:
 * ✅ Multi-sport support (12 sports)
 * ✅ Sport-specific stat labels
 * ✅ Season-by-season statistics
 * ✅ Recent form tracking
 * ✅ Season comparison
 * ✅ Export functionality
 * ✅ Dark mode support
 *
 * AFFECTED USER TYPES:
 * - PLAYER: Full access to own stats
 * - PARENT: Read-only access to children's stats
 * - COACH: Read access to squad stats
 * - ANALYST: Full analytical access
 * - SCOUT: Read access for evaluation
 *
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  BarChart3,
  Target,
  TrendingUp,
  Users,
  Activity,
  Award,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Calendar,
  Download,
  Share2,
  Shield,
  Star,
  Timer,
  ChevronRight,
} from 'lucide-react';
import { Sport, SPORT_CONFIGS, getStatLabels } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerStatistic {
  id: string;
  season: number;
  matches: number;
  starts: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  passes: number;
  passAccuracy: number | null;
  tackles: number;
  tackleSuccess: number | null;
  interceptions: number;
  shots: number;
  shotsOnTarget: number;
  cleanSheets: number;
  averageRating: number | null;
}

interface RecentMatch {
  date: Date;
  opponent: string;
  result: 'W' | 'D' | 'L';
  primaryStat: number;
  secondaryStat: number;
  rating: number | null;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getPlayerStats(userId: string) {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      statistics: {
        orderBy: { season: 'desc' },
      },
      teamPlayers: {
        where: { isActive: true },
        include: {
          team: {
            include: {
              club: { select: { id: true, sport: true } },
            },
          },
        },
      },
      matchAttendance: {
        where: { match: { status: 'FINISHED' } },
        take: 5,
        orderBy: { match: { kickOffTime: 'desc' } },
        include: {
          match: {
            include: {
              homeClub: { select: { id: true, name: true, shortName: true } },
              awayClub: { select: { id: true, name: true, shortName: true } },
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!player) {
    return { stats: null, previousStats: null, recentForm: [], sport: 'FOOTBALL' as Sport, allSeasons: [] };
  }

  const sport = (player.teamPlayers[0]?.team?.club?.sport as Sport) || 'FOOTBALL';
  const clubIds = player.teamPlayers.map((tp) => tp.team.clubId);
  const teamIds = player.teamPlayers.map((tp) => tp.teamId);

  const currentStats = player.statistics[0] || null;
  const previousStats = player.statistics[1] || null;

  // Build recent form
  const recentForm: RecentMatch[] = player.matchAttendance.map((ma) => {
    const m = ma.match;
    const isHome = clubIds.includes(m.homeClubId || '') || teamIds.includes(m.homeTeamId || '');
    const ourScore = isHome ? m.homeScore : m.awayScore;
    const theirScore = isHome ? m.awayScore : m.homeScore;
    const opponent = isHome
      ? (m.awayTeam?.name || m.awayClub?.shortName || m.awayClub?.name || 'Unknown')
      : (m.homeTeam?.name || m.homeClub?.shortName || m.homeClub?.name || 'Unknown');

    let result: 'W' | 'D' | 'L' = 'D';
    if (ourScore !== null && theirScore !== null) {
      if (ourScore > theirScore) result = 'W';
      else if (ourScore < theirScore) result = 'L';
    }

    return {
      date: m.kickOffTime,
      opponent,
      result,
      primaryStat: ma.goals || 0,
      secondaryStat: ma.assists || 0,
      rating: ma.rating,
    };
  });

  return {
    stats: currentStats as PlayerStatistic | null,
    previousStats: previousStats as PlayerStatistic | null,
    recentForm,
    sport,
    allSeasons: player.statistics as PlayerStatistic[],
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getChange(current: number, previous: number): { value: string; isUp: boolean | null } {
  if (previous === 0) {
    return { value: current > 0 ? '+100%' : '0%', isUp: current > 0 ? true : null };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`,
    isUp: change > 0 ? true : change < 0 ? false : null,
  };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function StatsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="h-12 bg-charcoal-200 dark:bg-charcoal-700 rounded-lg w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-charcoal-200 dark:bg-charcoal-700 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-64 bg-charcoal-200 dark:bg-charcoal-700 rounded-xl" />
        <div className="h-64 bg-charcoal-200 dark:bg-charcoal-700 rounded-xl" />
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({
  label,
  value,
  icon,
  color,
  subtext,
  change,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
  change?: { value: string; isUp: boolean | null } | null;
}) {
  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>{icon}</div>
        {change && change.isUp !== null && (
          <span
            className={`flex items-center gap-1 text-xs font-semibold ${
              change.isUp ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
            }`}
          >
            {change.isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {change.value}
          </span>
        )}
      </div>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400 font-semibold mb-1">{label}</p>
      <p className="text-3xl font-bold text-charcoal-900 dark:text-white tabular-nums">{value}</p>
      {subtext && <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">{subtext}</p>}
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
  subtext,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  subtext?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-charcoal-700 dark:text-charcoal-300 font-semibold">{label}</span>
        <span className="font-bold text-charcoal-900 dark:text-white tabular-nums">{value}</span>
      </div>
      <div className="w-full bg-charcoal-200 dark:bg-charcoal-700 rounded-full h-2">
        <div
          className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {subtext && <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">{subtext}</p>}
    </div>
  );
}

function EmptyState({ sportConfig }: { sportConfig: (typeof SPORT_CONFIGS)[Sport] }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/player" className="p-2 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700">
          <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
        </Link>
        <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white flex items-center gap-3">
          <span className="text-3xl">{sportConfig.icon}</span>
          {sportConfig.name} Statistics
        </h1>
      </div>
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-12 text-center">
        <BarChart3 className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
        <p className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No Statistics Available</p>
        <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
          Start playing matches to track your {sportConfig.name.toLowerCase()} performance!
        </p>
        <Link
          href="/dashboard/player/browse-teams"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-orange-500 text-white font-semibold rounded-lg"
        >
          <Users className="w-4 h-4" /> Join a Team
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerStatsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { stats, previousStats, recentForm, sport, allSeasons } = await getPlayerStats(session.user.id);
  const sportConfig = SPORT_CONFIGS[sport];
  const statLabels = getStatLabels(sport);

  if (!stats) {
    return <EmptyState sportConfig={sportConfig} />;
  }

  const primaryPerGame = stats.matches > 0 ? (stats.goals / stats.matches).toFixed(2) : '0.00';
  const secondaryPerGame = stats.matches > 0 ? (stats.assists / stats.matches).toFixed(2) : '0.00';

  return (
    <Suspense fallback={<StatsSkeleton />}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/player"
              className="p-2 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white flex items-center gap-3">
                <span className="text-4xl">{sportConfig.icon}</span>
                {sportConfig.name} Statistics
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                {stats.season}/{stats.season + 1} Season • {stats.matches} Appearances
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-charcoal-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2 hover:bg-charcoal-50 dark:hover:bg-charcoal-700 transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-info-500 text-white font-semibold rounded-lg flex items-center gap-2 shadow-purple">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Appearances"
            value={stats.matches}
            icon={<Users className="w-6 h-6 text-info-500" />}
            color="bg-info-100 dark:bg-info/20"
            change={previousStats ? getChange(stats.matches, previousStats.matches) : null}
          />
          <StatCard
            label={statLabels.primaryStat}
            value={stats.goals}
            icon={<Target className="w-6 h-6 text-success-500" />}
            color="bg-success-100 dark:bg-success/20"
            subtext={`${primaryPerGame} per game`}
            change={previousStats ? getChange(stats.goals, previousStats.goals) : null}
          />
          <StatCard
            label={statLabels.secondaryStat}
            value={stats.assists}
            icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
            color="bg-purple-100 dark:bg-purple-500/20"
            subtext={`${secondaryPerGame} per game`}
            change={previousStats ? getChange(stats.assists, previousStats.assists) : null}
          />
        </div>

        {/* Detailed Stats */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Attacking */}
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm">
            <div className="p-6 border-b border-charcoal-200 dark:border-charcoal-700 bg-gradient-to-r from-gold-50 dark:from-gold-900/10 to-transparent">
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-gold-500" />
                {sport === 'AMERICAN_FOOTBALL' ? 'Offensive' : 'Attacking'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <StatBar label={`Total ${statLabels.primaryStat}`} value={stats.goals} max={50} color="from-gold-500 to-orange-400" />
              {stats.shots > 0 && (
                <>
                  <StatBar label="Shots" value={stats.shots} max={50} color="from-purple-500 to-purple-600" />
                  <StatBar
                    label="Shots on Target"
                    value={stats.shotsOnTarget}
                    max={stats.shots || 1}
                    color="from-success-500 to-success-600"
                    subtext={`${stats.shots > 0 ? ((stats.shotsOnTarget / stats.shots) * 100).toFixed(0) : 0}% accuracy`}
                  />
                </>
              )}
              {stats.passes > 0 && (
                <StatBar
                  label="Key Passes"
                  value={stats.passes}
                  max={100}
                  color="from-info-500 to-info-600"
                  subtext={stats.passAccuracy ? `${stats.passAccuracy.toFixed(0)}% accuracy` : undefined}
                />
              )}
            </div>
          </div>

          {/* Defensive */}
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm">
            <div className="p-6 border-b border-charcoal-200 dark:border-charcoal-700 bg-gradient-to-r from-info-50 dark:from-info/5 to-transparent">
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-info-500" /> Defensive
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <StatBar
                label={statLabels.defensiveStat}
                value={stats.tackles}
                max={60}
                color="from-info-500 to-info-600"
                subtext={stats.tackleSuccess ? `${stats.tackleSuccess.toFixed(0)}% success` : undefined}
              />
              <StatBar label="Interceptions" value={stats.interceptions} max={40} color="from-purple-500 to-purple-600" />
              <StatBar label="Clean Sheets" value={stats.cleanSheets} max={20} color="from-success-500 to-success-600" />
              <div className="flex justify-between pt-4 border-t border-charcoal-200 dark:border-charcoal-700">
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-warning-100 dark:bg-warning/20 text-warning-700 dark:text-warning-400 text-xs font-semibold rounded">
                    {stats.yellowCards} {sport === 'RUGBY' ? 'Sin Bins' : 'Yellow'}
                  </span>
                  <span className="px-2 py-1 bg-error-100 dark:bg-error/20 text-error-700 dark:text-error-400 text-xs font-semibold rounded">
                    {stats.redCards} Red
                  </span>
                </div>
                <span className="text-sm text-charcoal-500 dark:text-charcoal-400">Discipline</span>
              </div>
            </div>
          </div>
        </div>

        {/* General Stats */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm">
          <div className="p-6 border-b border-charcoal-200 dark:border-charcoal-700 bg-gradient-to-r from-success-50 dark:from-success/5 to-transparent">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-success-500" /> General Performance
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 p-6">
            <div className="text-center p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-xl">
              <p className="text-3xl font-bold text-charcoal-900 dark:text-white tabular-nums">{stats.matches}</p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Matches</p>
            </div>
            <div className="text-center p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-xl">
              <p className="text-3xl font-bold text-success-600 dark:text-success-400 tabular-nums">{stats.starts}</p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Starts</p>
            </div>
            <div className="text-center p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-xl">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">{stats.minutesPlayed}</p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Minutes</p>
            </div>
            <div className="text-center p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-xl">
              <p className="text-3xl font-bold text-gold-600 dark:text-gold-400 tabular-nums">
                {stats.averageRating?.toFixed(1) || '-'}
              </p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Avg Rating</p>
            </div>
          </div>
        </div>

        {/* Recent Form */}
        {recentForm.length > 0 && (
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm">
            <div className="p-6 border-b border-charcoal-200 dark:border-charcoal-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-info-500" /> Recent Form
              </h2>
              <Link
                href="/dashboard/player/fixtures"
                className="text-sm font-semibold text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-6 space-y-3">
              {recentForm.map((match, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        match.result === 'W'
                          ? 'bg-success-100 text-success-700 dark:bg-success/20 dark:text-success-400'
                          : match.result === 'L'
                          ? 'bg-error-100 text-error-700 dark:bg-error/20 dark:text-error-400'
                          : 'bg-warning-100 text-warning-700 dark:bg-warning/20 dark:text-warning-400'
                      }`}
                    >
                      {match.result}
                    </span>
                    <div>
                      <p className="font-semibold text-charcoal-900 dark:text-white">{match.opponent}</p>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                        {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-success-600 dark:text-success-400 tabular-nums">
                        {match.primaryStat}
                      </p>
                      <p className="text-xs text-charcoal-500">{statLabels.primaryStat}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                        {match.secondaryStat}
                      </p>
                      <p className="text-xs text-charcoal-500">{statLabels.secondaryStat}</p>
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-lg font-bold tabular-nums ${
                          match.rating && match.rating >= 7
                            ? 'text-success-600 dark:text-success-400'
                            : match.rating && match.rating >= 6
                            ? 'text-warning-600 dark:text-warning-400'
                            : 'text-error-600 dark:text-error-400'
                        }`}
                      >
                        {match.rating?.toFixed(1) || '-'}
                      </p>
                      <p className="text-xs text-charcoal-500">Rating</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Season Comparison */}
        {previousStats && (
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm">
            <div className="p-6 border-b border-charcoal-200 dark:border-charcoal-700">
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" /> Season Comparison
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-charcoal-200 dark:border-charcoal-700 text-left">
                    <th className="px-6 py-3 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase text-center">
                      {previousStats.season}/{previousStats.season + 1}
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase text-center">
                      {stats.season}/{stats.season + 1}
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase text-center">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-200 dark:divide-charcoal-700">
                  {[
                    { label: 'Appearances', prev: previousStats.matches, curr: stats.matches },
                    { label: statLabels.primaryStat, prev: previousStats.goals, curr: stats.goals },
                    { label: statLabels.secondaryStat, prev: previousStats.assists, curr: stats.assists },
                    {
                      label: 'Avg Rating',
                      prev: previousStats.averageRating || 0,
                      curr: stats.averageRating || 0,
                      isDecimal: true,
                    },
                  ].map((row) => {
                    const change = getChange(row.curr, row.prev);
                    return (
                      <tr key={row.label} className="hover:bg-purple-50 dark:hover:bg-purple-900/10">
                        <td className="px-6 py-4 font-semibold text-charcoal-900 dark:text-white">{row.label}</td>
                        <td className="px-6 py-4 text-center text-charcoal-600 dark:text-charcoal-400 tabular-nums">
                          {row.isDecimal ? row.prev.toFixed(1) : row.prev}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                          {row.isDecimal ? row.curr.toFixed(1) : row.curr}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              change.isUp === true
                                ? 'bg-success-100 text-success-700 dark:bg-success/20 dark:text-success-400'
                                : change.isUp === false
                                ? 'bg-error-100 text-error-700 dark:bg-error/20 dark:text-error-400'
                                : 'bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-400'
                            }`}
                          >
                            {change.isUp === true ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : change.isUp === false ? (
                              <ArrowDown className="w-3 h-3" />
                            ) : null}
                            {change.value}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
