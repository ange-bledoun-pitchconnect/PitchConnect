/**
 * ============================================================================
 * 📅 PITCHCONNECT - Player Fixtures v7.5.0 (Enterprise Multi-Sport)
 * Path: src/app/dashboard/player/fixtures/page.tsx
 * ============================================================================
 *
 * FEATURES:
 * ✅ Multi-sport support (12 sports)
 * ✅ Sport-specific stat labels
 * ✅ Both club-level and team-level matches
 * ✅ Match status tracking
 * ✅ Player performance per match
 * ✅ Upcoming and past fixtures
 * ✅ Dark mode support
 *
 * AFFECTED USER TYPES:
 * - PLAYER: View own fixtures and performance
 * - PARENT: View children's fixtures
 * - COACH: View squad member fixtures
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
  Calendar,
  MapPin,
  Clock,
  Trophy,
  Target,
  Activity,
  Star,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Pause,
  AlertCircle,
  ChevronRight,
  Timer,
  Users,
  Zap,
} from 'lucide-react';
import { Sport, SPORT_CONFIGS, getStatLabels, type MatchStatus } from '@/types/player';

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
  competition: string | null;
  homeClub: { id: string; name: string; shortName: string | null };
  awayClub: { id: string; name: string; shortName: string | null };
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  isHome: boolean;
  sport: Sport;
  attendance?: {
    goals: number;
    assists: number;
    minutesPlayed: number;
    rating: number | null;
    started: boolean;
    substitutedOn: number | null;
    substitutedOff: number | null;
  };
}

interface SeasonStats {
  matches: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  avgRating: number | null;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getPlayerFixtures(userId: string) {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      statistics: {
        orderBy: { season: 'desc' },
        take: 1,
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
        include: {
          match: {
            include: {
              homeClub: { select: { id: true, name: true, shortName: true, sport: true } },
              awayClub: { select: { id: true, name: true, shortName: true, sport: true } },
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              competition: { select: { name: true } },
            },
          },
        },
        orderBy: { match: { kickOffTime: 'desc' } },
      },
    },
  });

  if (!player) {
    return { upcomingMatches: [], pastMatches: [], stats: null, primarySport: 'FOOTBALL' as Sport };
  }

  const clubIds = player.teamPlayers.map((tp) => tp.team.clubId);
  const teamIds = player.teamPlayers.map((tp) => tp.teamId);
  const primarySport = (player.teamPlayers[0]?.team?.club?.sport as Sport) || 'FOOTBALL';

  // Get upcoming matches
  const upcomingMatchesRaw = await prisma.match.findMany({
    where: {
      status: { in: ['SCHEDULED', 'WARMUP'] },
      kickOffTime: { gte: new Date() },
      OR: [
        { homeClubId: { in: clubIds } },
        { awayClubId: { in: clubIds } },
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ],
    },
    include: {
      homeClub: { select: { id: true, name: true, shortName: true, sport: true } },
      awayClub: { select: { id: true, name: true, shortName: true, sport: true } },
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      competition: { select: { name: true } },
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
    competition: m.competition?.name || null,
    homeClub: m.homeClub || { id: '', name: 'TBD', shortName: null },
    awayClub: m.awayClub || { id: '', name: 'TBD', shortName: null },
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    isHome: clubIds.includes(m.homeClubId || '') || teamIds.includes(m.homeTeamId || ''),
    sport: (m.homeClub?.sport as Sport) || primarySport,
  }));

  // Get past matches from attendance
  const pastMatches: Match[] = player.matchAttendance
    .filter((ma) => ma.match.status === 'FINISHED')
    .slice(0, 15)
    .map((ma) => ({
      id: ma.match.id,
      kickOffTime: ma.match.kickOffTime,
      status: ma.match.status as MatchStatus,
      venue: ma.match.venue,
      homeScore: ma.match.homeScore,
      awayScore: ma.match.awayScore,
      competition: ma.match.competition?.name || null,
      homeClub: ma.match.homeClub || { id: '', name: 'TBD', shortName: null },
      awayClub: ma.match.awayClub || { id: '', name: 'TBD', shortName: null },
      homeTeam: ma.match.homeTeam,
      awayTeam: ma.match.awayTeam,
      isHome: clubIds.includes(ma.match.homeClubId || '') || teamIds.includes(ma.match.homeTeamId || ''),
      sport: (ma.match.homeClub?.sport as Sport) || primarySport,
      attendance: {
        goals: ma.goals || 0,
        assists: ma.assists || 0,
        minutesPlayed: ma.minutesPlayed || 0,
        rating: ma.rating,
        started: ma.started,
        substitutedOn: ma.substitutedOn,
        substitutedOff: ma.substitutedOff,
      },
    }));

  // Season summary from statistics
  const currentStats = player.statistics[0];
  const stats: SeasonStats | null = currentStats
    ? {
        matches: currentStats.matches,
        goals: currentStats.goals,
        assists: currentStats.assists,
        minutesPlayed: currentStats.minutesPlayed,
        avgRating: currentStats.averageRating,
      }
    : null;

  return { upcomingMatches, pastMatches, stats, primarySport };
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  SCHEDULED: {
    label: 'Scheduled',
    color: 'bg-info-100 text-info-700 dark:bg-info/20 dark:text-info-400',
    icon: Clock,
  },
  WARMUP: {
    label: 'Warmup',
    color: 'bg-warning-100 text-warning-700 dark:bg-warning/20 dark:text-warning-400',
    icon: Activity,
  },
  LIVE: {
    label: 'LIVE',
    color: 'bg-error-100 text-error-700 dark:bg-error/20 dark:text-error-400 animate-pulse',
    icon: Zap,
  },
  HALFTIME: {
    label: 'Half Time',
    color: 'bg-warning-100 text-warning-700 dark:bg-warning/20 dark:text-warning-400',
    icon: Pause,
  },
  SECOND_HALF: {
    label: '2nd Half',
    color: 'bg-error-100 text-error-700 dark:bg-error/20 dark:text-error-400',
    icon: Activity,
  },
  EXTRA_TIME_FIRST: {
    label: 'Extra Time',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    icon: Clock,
  },
  EXTRA_TIME_SECOND: {
    label: 'Extra Time',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    icon: Clock,
  },
  PENALTIES: {
    label: 'Penalties',
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400',
    icon: Target,
  },
  FINISHED: {
    label: 'Full Time',
    color: 'bg-success-100 text-success-700 dark:bg-success/20 dark:text-success-400',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-400',
    icon: XCircle,
  },
  POSTPONED: {
    label: 'Postponed',
    color: 'bg-warning-100 text-warning-700 dark:bg-warning/20 dark:text-warning-400',
    icon: AlertCircle,
  },
  ABANDONED: {
    label: 'Abandoned',
    color: 'bg-error-100 text-error-700 dark:bg-error/20 dark:text-error-400',
    icon: XCircle,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function getMatchResult(match: Match): 'W' | 'D' | 'L' | null {
  if (match.homeScore === null || match.awayScore === null) return null;
  const ourScore = match.isHome ? match.homeScore : match.awayScore;
  const theirScore = match.isHome ? match.awayScore : match.homeScore;
  if (ourScore > theirScore) return 'W';
  if (ourScore < theirScore) return 'L';
  return 'D';
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function FixturesSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="h-12 bg-charcoal-200 dark:bg-charcoal-700 rounded-lg w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-charcoal-200 dark:bg-charcoal-700 rounded-xl" />
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-charcoal-200 dark:bg-charcoal-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function MatchCard({ match, showStats, statLabels }: {
  match: Match;
  showStats: boolean;
  statLabels: ReturnType<typeof getStatLabels>;
}) {
  const sportConfig = SPORT_CONFIGS[match.sport];
  const statusConfig = STATUS_CONFIG[match.status];
  const StatusIcon = statusConfig.icon;
  const result = getMatchResult(match);

  const homeDisplay = match.homeTeam?.name || match.homeClub.shortName || match.homeClub.name;
  const awayDisplay = match.awayTeam?.name || match.awayClub.shortName || match.awayClub.name;

  return (
    <Link
      href={`/dashboard/matches/${match.id}`}
      className="block p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-xl border border-charcoal-200 dark:border-charcoal-600 hover:border-gold-300 dark:hover:border-gold-700 hover:shadow-md transition-all group"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Date & Sport */}
        <div className="flex items-center gap-3 md:w-36">
          <span className="text-2xl">{sportConfig.icon}</span>
          <div>
            <p className="text-sm font-bold text-charcoal-900 dark:text-white">
              {new Date(match.kickOffTime).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
              {new Date(match.kickOffTime).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Teams & Score */}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold truncate ${
                  match.isHome
                    ? 'text-charcoal-900 dark:text-white'
                    : 'text-charcoal-600 dark:text-charcoal-400'
                }`}
              >
                {homeDisplay}
                {match.isHome && (
                  <span className="ml-2 text-xs text-gold-600 dark:text-gold-400">(You)</span>
                )}
              </p>
            </div>

            {match.status === 'FINISHED' && (
              <div className="px-4 text-center shrink-0">
                <p className="text-xl font-bold text-charcoal-900 dark:text-white tabular-nums">
                  {match.homeScore} - {match.awayScore}
                </p>
              </div>
            )}

            <div className="flex-1 text-right min-w-0">
              <p
                className={`font-semibold truncate ${
                  !match.isHome
                    ? 'text-charcoal-900 dark:text-white'
                    : 'text-charcoal-600 dark:text-charcoal-400'
                }`}
              >
                {awayDisplay}
                {!match.isHome && (
                  <span className="ml-2 text-xs text-gold-600 dark:text-gold-400">(You)</span>
                )}
              </p>
            </div>
          </div>

          {/* Venue & Competition */}
          <div className="flex items-center gap-4 mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
            {match.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {match.venue}
              </span>
            )}
            {match.competition && (
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3" /> {match.competition}
              </span>
            )}
          </div>
        </div>

        {/* Status & Result */}
        <div className="flex items-center gap-2 md:w-40 justify-end">
          {result && (
            <span
              className={`px-3 py-1 text-sm font-bold rounded-full ${
                result === 'W'
                  ? 'bg-success-100 text-success-700 dark:bg-success/20 dark:text-success-400'
                  : result === 'L'
                  ? 'bg-error-100 text-error-700 dark:bg-error/20 dark:text-error-400'
                  : 'bg-warning-100 text-warning-700 dark:bg-warning/20 dark:text-warning-400'
              }`}
            >
              {result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
            </span>
          )}
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${statusConfig.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
          <ChevronRight className="w-4 h-4 text-charcoal-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* Player Stats (for finished matches with attendance) */}
      {showStats && match.attendance && (
        <div className="mt-4 pt-4 border-t border-charcoal-200 dark:border-charcoal-600">
          <p className="text-xs font-semibold text-charcoal-600 dark:text-charcoal-400 mb-2">
            Your Performance
          </p>
          <div className="flex flex-wrap gap-4">
            {match.attendance.goals > 0 && (
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-success-500" />
                <span className="text-sm font-bold text-success-600 dark:text-success-400">
                  {match.attendance.goals}
                </span>
                <span className="text-xs text-charcoal-500">{statLabels.primaryStat}</span>
              </div>
            )}
            {match.attendance.assists > 0 && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {match.attendance.assists}
                </span>
                <span className="text-xs text-charcoal-500">{statLabels.secondaryStat}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-info-500" />
              <span className="text-sm font-bold text-info-600 dark:text-info-400">
                {match.attendance.minutesPlayed}'
              </span>
              <span className="text-xs text-charcoal-500">Played</span>
            </div>
            {match.attendance.rating !== null && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gold-500" />
                <span
                  className={`text-sm font-bold ${
                    match.attendance.rating >= 7
                      ? 'text-success-600 dark:text-success-400'
                      : match.attendance.rating >= 6
                      ? 'text-warning-600 dark:text-warning-400'
                      : 'text-error-600 dark:text-error-400'
                  }`}
                >
                  {match.attendance.rating.toFixed(1)}
                </span>
                <span className="text-xs text-charcoal-500">Rating</span>
              </div>
            )}
            {match.attendance.started && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 rounded">
                Started
              </span>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerFixturesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { upcomingMatches, pastMatches, stats, primarySport } = await getPlayerFixtures(session.user.id);
  const sportConfig = SPORT_CONFIGS[primarySport];
  const statLabels = getStatLabels(primarySport);

  return (
    <Suspense fallback={<FixturesSkeleton />}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/player"
            className="p-2 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white flex items-center gap-3">
              <span className="text-3xl">{sportConfig.icon}</span>
              Fixtures
            </h1>
            <p className="text-charcoal-600 dark:text-charcoal-400">
              Your match schedule across all sports
            </p>
          </div>
        </div>

        {/* Season Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-4 text-center">
              <Calendar className="w-6 h-6 text-info-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white tabular-nums">
                {stats.matches}
              </p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Matches</p>
            </div>
            <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-4 text-center">
              <Target className="w-6 h-6 text-success-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 tabular-nums">
                {stats.goals}
              </p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{statLabels.primaryStat}</p>
            </div>
            <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-4 text-center">
              <Activity className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                {stats.assists}
              </p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{statLabels.secondaryStat}</p>
            </div>
            <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-4 text-center">
              <Timer className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                {stats.minutesPlayed}
              </p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Minutes</p>
            </div>
            <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-4 text-center">
              <Star className="w-6 h-6 text-gold-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gold-600 dark:text-gold-400 tabular-nums">
                {stats.avgRating?.toFixed(1) || '-'}
              </p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Avg Rating</p>
            </div>
          </div>
        )}

        {/* Upcoming Matches */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm">
          <div className="p-6 border-b border-charcoal-200 dark:border-charcoal-700 bg-gradient-to-r from-info-50 dark:from-info/5 to-transparent">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-info-500" />
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
                  <MatchCard key={match.id} match={match} showStats={false} statLabels={statLabels} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Past Matches */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm">
          <div className="p-6 border-b border-charcoal-200 dark:border-charcoal-700 bg-gradient-to-r from-success-50 dark:from-success/5 to-transparent">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-success-500" />
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
                  <MatchCard key={match.id} match={match} showStats={true} statLabels={statLabels} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
}
