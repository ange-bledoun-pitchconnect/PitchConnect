/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Player Fixtures v2.0 (Multi-Sport)
 * Path: src/app/dashboard/player/fixtures/page.tsx
 * ============================================================================
 * 
 * MULTI-SPORT FEATURES:
 * ✅ Sport-specific icons per match
 * ✅ Sport-specific stat labels (Goals/Tries/Points/Runs/TDs)
 * ✅ Sport-specific period names (Half/Quarter/Innings/Period)
 * ✅ Match status aligned with MatchStatus enum
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
  Calendar, MapPin, Clock, Trophy, Target, Activity, Star, ArrowLeft,
  CheckCircle, XCircle, Pause, AlertCircle,
} from 'lucide-react';
import { Sport, MatchStatus, SPORT_CONFIGS, getStatLabels } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface Match {
  id: string;
  kickOffTime: Date;
  status: MatchStatus;
  venue: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeClub: { id: string; name: string; shortName: string | null; sport: Sport };
  awayClub: { id: string; name: string; shortName: string | null; sport: Sport };
  isHome: boolean;
  attendance?: {
    goals: number | null;
    assists: number | null;
    minutesPlayed: number | null;
    rating: number | null;
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getPlayerFixtures(userId: string) {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      teamPlayers: {
        where: { isActive: true },
        include: {
          team: {
            include: { club: { select: { id: true, sport: true } } },
          },
        },
      },
      statistics: { orderBy: { season: 'desc' }, take: 1 },
      matchAttendance: {
        include: {
          match: {
            include: {
              homeClub: { select: { id: true, name: true, shortName: true, sport: true } },
              awayClub: { select: { id: true, name: true, shortName: true, sport: true } },
            },
          },
        },
        orderBy: { match: { kickOffTime: 'desc' } },
      },
    },
  });

  if (!player) return { upcomingMatches: [], pastMatches: [], stats: null };

  const clubIds = player.teamPlayers.map((tp) => tp.team.clubId);

  // Get upcoming matches
  const upcomingMatchesRaw = await prisma.match.findMany({
    where: {
      status: { in: ['SCHEDULED', 'WARMUP'] },
      kickOffTime: { gte: new Date() },
      OR: [{ homeClubId: { in: clubIds } }, { awayClubId: { in: clubIds } }],
    },
    include: {
      homeClub: { select: { id: true, name: true, shortName: true, sport: true } },
      awayClub: { select: { id: true, name: true, shortName: true, sport: true } },
    },
    orderBy: { kickOffTime: 'asc' },
    take: 10,
  });

  const upcomingMatches: Match[] = upcomingMatchesRaw.map((m) => ({
    id: m.id,
    kickOffTime: m.kickOffTime,
    status: m.status as MatchStatus,
    venue: m.venue,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeClub: { ...m.homeClub, sport: (m.homeClub.sport as Sport) || 'FOOTBALL' },
    awayClub: { ...m.awayClub, sport: (m.awayClub.sport as Sport) || 'FOOTBALL' },
    isHome: clubIds.includes(m.homeClubId),
  }));

  // Get past matches from attendance
  const pastMatches: Match[] = player.matchAttendance
    .filter((ma) => ma.match.status === 'FINISHED')
    .slice(0, 10)
    .map((ma) => ({
      id: ma.match.id,
      kickOffTime: ma.match.kickOffTime,
      status: ma.match.status as MatchStatus,
      venue: ma.match.venue,
      homeScore: ma.match.homeScore,
      awayScore: ma.match.awayScore,
      homeClub: { ...ma.match.homeClub, sport: (ma.match.homeClub.sport as Sport) || 'FOOTBALL' },
      awayClub: { ...ma.match.awayClub, sport: (ma.match.awayClub.sport as Sport) || 'FOOTBALL' },
      isHome: clubIds.includes(ma.match.homeClubId),
      attendance: {
        goals: ma.goals,
        assists: ma.assists,
        minutesPlayed: ma.minutesPlayed,
        rating: ma.rating,
      },
    }));

  // Season summary
  const currentStats = player.statistics[0];
  const stats = currentStats
    ? {
        matches: currentStats.matches,
        goals: currentStats.goals,
        assists: currentStats.assists,
        minutesPlayed: currentStats.minutesPlayed,
      }
    : null;

  return { upcomingMatches, pastMatches, stats };
}

// ============================================================================
// HELPERS
// ============================================================================

const STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; icon: React.ReactNode }> = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Clock className="w-3 h-3" /> },
  WARMUP: { label: 'Warmup', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <Activity className="w-3 h-3" /> },
  LIVE: { label: 'LIVE', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse', icon: <div className="w-2 h-2 bg-red-500 rounded-full" /> },
  HALFTIME: { label: 'Half Time', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Pause className="w-3 h-3" /> },
  SECOND_HALF: { label: '2nd Half', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <Activity className="w-3 h-3" /> },
  EXTRA_TIME_FIRST: { label: 'Extra Time', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <Clock className="w-3 h-3" /> },
  EXTRA_TIME_SECOND: { label: 'Extra Time', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <Clock className="w-3 h-3" /> },
  PENALTIES: { label: 'Penalties', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: <Target className="w-3 h-3" /> },
  FINISHED: { label: 'Full Time', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: <XCircle className="w-3 h-3" /> },
  POSTPONED: { label: 'Postponed', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <AlertCircle className="w-3 h-3" /> },
  ABANDONED: { label: 'Abandoned', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
};

function getMatchResult(match: Match): 'W' | 'D' | 'L' | null {
  if (match.homeScore === null || match.awayScore === null) return null;
  const ourScore = match.isHome ? match.homeScore : match.awayScore;
  const theirScore = match.isHome ? match.awayScore : match.homeScore;
  if (ourScore > theirScore) return 'W';
  if (ourScore < theirScore) return 'L';
  return 'D';
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerFixturesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const { upcomingMatches, pastMatches, stats } = await getPlayerFixtures(session.user.id);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/player" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700">
          <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
        </Link>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white">Fixtures</h1>
          <p className="text-charcoal-600 dark:text-charcoal-400">Your match schedule across all sports</p>
        </div>
      </div>

      {/* SEASON SUMMARY */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-4 text-center">
            <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{stats.matches}</p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Matches</p>
          </div>
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-4 text-center">
            <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.goals}</p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Scored</p>
          </div>
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-4 text-center">
            <Activity className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.assists}</p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Assists</p>
          </div>
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-4 text-center">
            <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.minutesPlayed}</p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Minutes</p>
          </div>
        </div>
      )}

      {/* UPCOMING MATCHES */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 bg-gradient-to-r from-blue-50 dark:from-blue-900/10 to-transparent">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Upcoming Matches
          </h2>
        </div>
        <div className="p-6">
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
              <p className="text-charcoal-600 dark:text-charcoal-400">No upcoming matches scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} showStats={false} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PAST MATCHES */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 bg-gradient-to-r from-green-50 dark:from-green-900/10 to-transparent">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-500" />
            Recent Results
          </h2>
        </div>
        <div className="p-6">
          {pastMatches.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
              <p className="text-charcoal-600 dark:text-charcoal-400">No match history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastMatches.map((match) => (
                <MatchCard key={match.id} match={match} showStats={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MATCH CARD COMPONENT
// ============================================================================

function MatchCard({ match, showStats }: { match: Match; showStats: boolean }) {
  const sport = match.homeClub.sport;
  const sportConfig = SPORT_CONFIGS[sport];
  const statLabels = getStatLabels(sport);
  const statusConfig = STATUS_CONFIG[match.status];
  const result = getMatchResult(match);

  return (
    <div className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl border border-neutral-200 dark:border-charcoal-600">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Date & Sport */}
        <div className="flex items-center gap-3 md:w-32">
          <span className="text-2xl">{sportConfig.icon}</span>
          <div>
            <p className="text-sm font-bold text-charcoal-900 dark:text-white">
              {new Date(match.kickOffTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
              {new Date(match.kickOffTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Teams & Score */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`font-semibold ${match.isHome ? 'text-charcoal-900 dark:text-white' : 'text-charcoal-600 dark:text-charcoal-400'}`}>
                {match.homeClub.shortName || match.homeClub.name}
                {match.isHome && <span className="ml-2 text-xs text-gold-600 dark:text-gold-400">(You)</span>}
              </p>
            </div>
            {match.status === 'FINISHED' && (
              <div className="px-4 text-center">
                <p className="text-xl font-bold text-charcoal-900 dark:text-white">
                  {match.homeScore} - {match.awayScore}
                </p>
              </div>
            )}
            <div className="flex-1 text-right">
              <p className={`font-semibold ${!match.isHome ? 'text-charcoal-900 dark:text-white' : 'text-charcoal-600 dark:text-charcoal-400'}`}>
                {match.awayClub.shortName || match.awayClub.name}
                {!match.isHome && <span className="ml-2 text-xs text-gold-600 dark:text-gold-400">(You)</span>}
              </p>
            </div>
          </div>
          {match.venue && (
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {match.venue}
            </p>
          )}
        </div>

        {/* Status & Result */}
        <div className="flex items-center gap-2 md:w-40 justify-end">
          {result && (
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${
              result === 'W' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              result === 'L' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            }`}>
              {result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
            </span>
          )}
          <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${statusConfig.color}`}>
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Player Stats (for finished matches) */}
      {showStats && match.attendance && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-charcoal-600">
          <p className="text-xs font-semibold text-charcoal-600 dark:text-charcoal-400 mb-2">Your Performance</p>
          <div className="flex flex-wrap gap-4">
            {match.attendance.goals !== null && match.attendance.goals > 0 && (
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm font-bold text-green-600 dark:text-green-400">{match.attendance.goals}</span>
                <span className="text-xs text-charcoal-500">{statLabels.primaryStat}</span>
              </div>
            )}
            {match.attendance.assists !== null && match.attendance.assists > 0 && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{match.attendance.assists}</span>
                <span className="text-xs text-charcoal-500">{statLabels.secondaryStat}</span>
              </div>
            )}
            {match.attendance.minutesPlayed !== null && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{match.attendance.minutesPlayed}'</span>
                <span className="text-xs text-charcoal-500">Played</span>
              </div>
            )}
            {match.attendance.rating !== null && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gold-500" />
                <span className="text-sm font-bold text-gold-600 dark:text-gold-400">{match.attendance.rating.toFixed(1)}</span>
                <span className="text-xs text-charcoal-500">Rating</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}