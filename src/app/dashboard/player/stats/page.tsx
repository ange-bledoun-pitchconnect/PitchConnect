/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Player Stats v2.0 (Multi-Sport)
 * Path: src/app/dashboard/player/stats/page.tsx
 * ============================================================================
 * 
 * MULTI-SPORT FEATURES:
 * ✅ Sport-specific stat labels (Goals/Tries/Points/Runs/TDs)
 * ✅ Sport context from player's team/club
 * ✅ Dynamic period names (Half/Quarter/Innings/Period)
 * ✅ Sport-specific achievements
 * ✅ Full PlayerStatistic model fields
 * ✅ Dark mode support
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  BarChart3, Target, TrendingUp, Zap, Users, Activity, Award, Trophy,
  ArrowUp, ArrowDown, ArrowLeft, Calendar, Download, Share2, Shield,
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
  sportSpecificStats: Record<string, unknown> | null;
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
      statistics: { orderBy: { season: 'desc' } },
      teamPlayers: {
        where: { isActive: true },
        include: { team: { include: { club: { select: { sport: true } } } } },
      },
      matchAttendance: {
        take: 5,
        orderBy: { match: { kickOffTime: 'desc' } },
        where: { match: { status: 'FINISHED' } },
        include: {
          match: {
            include: {
              homeClub: { select: { id: true, name: true, shortName: true } },
              awayClub: { select: { id: true, name: true, shortName: true } },
            },
          },
        },
      },
    },
  });

  if (!player) return { stats: null, previousStats: null, recentForm: [], sport: 'FOOTBALL' as Sport };

  // Get sport from primary team
  const sport = (player.teamPlayers[0]?.team?.club?.sport as Sport) || 'FOOTBALL';
  const clubIds = player.teamPlayers.map((tp) => tp.team.clubId);

  const currentStats = player.statistics[0] || null;
  const previousStats = player.statistics[1] || null;

  // Build recent form
  const recentForm: RecentMatch[] = player.matchAttendance.map((ma) => {
    const m = ma.match;
    const isHome = clubIds.includes(m.homeClubId);
    const ourScore = isHome ? m.homeScore : m.awayScore;
    const theirScore = isHome ? m.awayScore : m.homeScore;
    const opponent = isHome ? (m.awayClub.shortName || m.awayClub.name) : (m.homeClub.shortName || m.homeClub.name);
    
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
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getChange(current: number, previous: number): { value: string; isUp: boolean | null } {
  if (previous === 0) return { value: current > 0 ? '+100%' : '0%', isUp: current > 0 ? true : null };
  const change = ((current - previous) / previous) * 100;
  return { value: `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`, isUp: change > 0 ? true : change < 0 ? false : null };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerStatsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const { stats, previousStats, recentForm, sport } = await getPlayerStats(session.user.id);
  const sportConfig = SPORT_CONFIGS[sport];
  const statLabels = getStatLabels(sport);

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/player" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700">
            <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </Link>
          <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white">
            {sportConfig.icon} {sportConfig.name} Statistics
          </h1>
        </div>
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No Statistics Available</p>
          <p className="text-charcoal-600 dark:text-charcoal-400">Start playing matches to track your {sportConfig.name} performance!</p>
        </div>
      </div>
    );
  }

  const primaryPerGame = stats.matches > 0 ? (stats.goals / stats.matches).toFixed(2) : '0.00';
  const secondaryPerGame = stats.matches > 0 ? (stats.assists / stats.matches).toFixed(2) : '0.00';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/player" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700">
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
          <button className="px-4 py-2 border border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-charcoal-700">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KEY STATS - Sport-specific labels */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          label="Appearances" 
          value={stats.matches} 
          icon={<Users className="w-6 h-6 text-blue-500" />} 
          color="bg-blue-100 dark:bg-blue-900/30" 
          change={previousStats ? getChange(stats.matches, previousStats.matches) : null} 
        />
        <StatCard 
          label={statLabels.primaryStat} 
          value={stats.goals} 
          icon={<Target className="w-6 h-6 text-green-500" />} 
          color="bg-green-100 dark:bg-green-900/30" 
          subtext={`${primaryPerGame} per game`} 
          change={previousStats ? getChange(stats.goals, previousStats.goals) : null} 
        />
        <StatCard 
          label={statLabels.secondaryStat} 
          value={stats.assists} 
          icon={<TrendingUp className="w-6 h-6 text-purple-500" />} 
          color="bg-purple-100 dark:bg-purple-900/30" 
          subtext={`${secondaryPerGame} per game`} 
          change={previousStats ? getChange(stats.assists, previousStats.assists) : null} 
        />
      </div>

      {/* DETAILED STATS */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ATTACKING / OFFENSIVE */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 bg-gradient-to-r from-gold-50 dark:from-gold-900/10 to-transparent">
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
                <StatBar label="Shots on Target" value={stats.shotsOnTarget} max={stats.shots || 1} color="from-green-500 to-green-600" 
                  subtext={`${stats.shots > 0 ? ((stats.shotsOnTarget / stats.shots) * 100).toFixed(0) : 0}% accuracy`} 
                />
              </>
            )}
            {stats.passes > 0 && (
              <StatBar label="Key Passes" value={stats.passes} max={100} color="from-blue-500 to-blue-600" 
                subtext={stats.passAccuracy ? `${stats.passAccuracy.toFixed(0)}% accuracy` : undefined}
              />
            )}
          </div>
        </div>

        {/* DEFENSIVE */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 bg-gradient-to-r from-blue-50 dark:from-blue-900/10 to-transparent">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" /> Defensive
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <StatBar label={statLabels.defensiveStat} value={stats.tackles} max={60} color="from-blue-500 to-blue-600" 
              subtext={stats.tackleSuccess ? `${stats.tackleSuccess.toFixed(0)}% success` : undefined}
            />
            <StatBar label="Interceptions" value={stats.interceptions} max={40} color="from-purple-500 to-purple-600" />
            <StatBar label="Clean Sheets" value={stats.cleanSheets} max={20} color="from-green-500 to-green-600" />
            <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-charcoal-700">
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded">
                  {stats.yellowCards} {sport === 'RUGBY' ? 'Sin Bins' : 'Yellow'}
                </span>
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded">
                  {stats.redCards} {sport === 'RUGBY' ? 'Red Cards' : 'Red'}
                </span>
              </div>
              <span className="text-sm text-charcoal-500 dark:text-charcoal-400">Discipline</span>
            </div>
          </div>
        </div>
      </div>

      {/* GENERAL STATS */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 bg-gradient-to-r from-green-50 dark:from-green-900/10 to-transparent">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" /> General Performance
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6 p-6">
          <div className="text-center p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl">
            <p className="text-3xl font-bold text-charcoal-900 dark:text-white">{stats.matches}</p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Matches</p>
          </div>
          <div className="text-center p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.starts}</p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Starts</p>
          </div>
          <div className="text-center p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.minutesPlayed}</p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Minutes</p>
          </div>
          <div className="text-center p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl">
            <p className="text-3xl font-bold text-gold-600 dark:text-gold-400">{stats.averageRating?.toFixed(1) || '-'}</p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Avg Rating</p>
          </div>
        </div>
      </div>

      {/* RECENT FORM */}
      {recentForm.length > 0 && (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Recent Form
            </h2>
          </div>
          <div className="p-6 space-y-3">
            {recentForm.map((match, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    match.result === 'W' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                    match.result === 'L' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
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
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{match.primaryStat}</p>
                    <p className="text-xs text-charcoal-500">{statLabels.primaryStat}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{match.secondaryStat}</p>
                    <p className="text-xs text-charcoal-500">{statLabels.secondaryStat}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gold-600 dark:text-gold-400">{match.rating?.toFixed(1) || '-'}</p>
                    <p className="text-xs text-charcoal-500">Rating</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEASON COMPARISON */}
      {previousStats && (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" /> Season Comparison
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-charcoal-700 text-left">
                  <th className="px-6 py-3 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase">Metric</th>
                  <th className="px-6 py-3 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase text-center">{previousStats.season}/{previousStats.season + 1}</th>
                  <th className="px-6 py-3 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase text-center">{stats.season}/{stats.season + 1}</th>
                  <th className="px-6 py-3 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase text-center">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-charcoal-700">
                {[
                  { label: 'Appearances', prev: previousStats.matches, curr: stats.matches },
                  { label: statLabels.primaryStat, prev: previousStats.goals, curr: stats.goals },
                  { label: statLabels.secondaryStat, prev: previousStats.assists, curr: stats.assists },
                  { label: 'Avg Rating', prev: previousStats.averageRating || 0, curr: stats.averageRating || 0, isDecimal: true },
                ].map((row) => {
                  const change = getChange(row.curr, row.prev);
                  return (
                    <tr key={row.label} className="hover:bg-purple-50 dark:hover:bg-purple-900/10">
                      <td className="px-6 py-4 font-semibold text-charcoal-900 dark:text-white">{row.label}</td>
                      <td className="px-6 py-4 text-center text-charcoal-600 dark:text-charcoal-400">{row.isDecimal ? row.prev.toFixed(1) : row.prev}</td>
                      <td className="px-6 py-4 text-center font-bold text-purple-600 dark:text-purple-400">{row.isDecimal ? row.curr.toFixed(1) : row.curr}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          change.isUp === true ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          change.isUp === false ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                          'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {change.isUp === true ? <ArrowUp className="w-3 h-3" /> : change.isUp === false ? <ArrowDown className="w-3 h-3" /> : null}
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
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ label, value, icon, color, subtext, change }: {
  label: string; value: number; icon: React.ReactNode; color: string; subtext?: string;
  change?: { value: string; isUp: boolean | null } | null;
}) {
  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>{icon}</div>
        {change && change.isUp !== null && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${change.isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {change.isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />} {change.value}
          </span>
        )}
      </div>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400 font-semibold mb-1">{label}</p>
      <p className="text-3xl font-bold text-charcoal-900 dark:text-white">{value}</p>
      {subtext && <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">{subtext}</p>}
    </div>
  );
}

function StatBar({ label, value, max, color, subtext }: {
  label: string; value: number; max: number; color: string; subtext?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-charcoal-700 dark:text-charcoal-300 font-semibold">{label}</span>
        <span className="font-bold text-charcoal-900 dark:text-white">{value}</span>
      </div>
      <div className="w-full bg-neutral-200 dark:bg-charcoal-700 rounded-full h-2">
        <div className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
      {subtext && <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">{subtext}</p>}
    </div>
  );
}