// ============================================================================
// ⚽ PITCHCONNECT - MATCH DETAILS PAGE v7.3.0
// ============================================================================
// Path: src/app/dashboard/matches/[matchId]/page.tsx
// Match overview with schema-aligned field names
// Uses: kickOffTime, homeScore, awayScore (not date, homeGoals, awayGoals)
// ============================================================================

import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ClubMemberRole, MatchStatus, MatchAttendanceStatus, Sport } from '@prisma/client';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Activity,
  Trophy,
  ClipboardList,
  Play,
  Edit,
  ArrowLeft,
  UserCheck,
  UserX,
  HelpCircle,
  Share2,
  BarChart3,
  Tv,
  Thermometer,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getSportConfig,
  getSportIcon,
  getSportDisplayName,
  getEventTypeLabel,
  getEventTypeIcon,
} from '@/lib/config/sports';

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: { matchId: string };
}): Promise<Metadata> {
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });

  if (!match) {
    return { title: 'Match Not Found | PitchConnect' };
  }

  return {
    title: `${match.homeTeam.name} vs ${match.awayTeam.name} | PitchConnect`,
    description: `Match details for ${match.homeTeam.name} vs ${match.awayTeam.name}`,
  };
}

// ============================================================================
// TYPES
// ============================================================================

interface MatchPageData {
  id: string;
  status: MatchStatus;
  kickOffTime: Date;
  venue: string | null;
  pitch: string | null;
  weather: string | null;
  temperature: number | null;
  attendance: number | null;
  homeScore: number | null;
  awayScore: number | null;
  homeHalftimeScore: number | null;
  awayHalftimeScore: number | null;
  homeClubId: string;
  awayClubId: string;
  isBroadcasted: boolean;
  broadcastUrl: string | null;
  homeTeam: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    sport: Sport;
    primaryColor: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    sport: Sport;
    primaryColor: string | null;
  };
  league: {
    id: string;
    name: string;
  } | null;
  events: {
    id: string;
    eventType: string;
    minute: number;
    playerId: string | null;
  }[];
  playerAttendance: {
    id: string;
    status: MatchAttendanceStatus;
    playerId: string;
    player: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  }[];
}

// ============================================================================
// PERMISSIONS
// ============================================================================

const MANAGE_MATCH_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
];

async function getMatchPermissions(
  userId: string,
  homeClubId: string,
  awayClubId: string
): Promise<{ canManage: boolean; canViewLineup: boolean; canRecordResult: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, roles: true },
  });

  if (user?.isSuperAdmin) {
    return { canManage: true, canViewLineup: true, canRecordResult: true };
  }

  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      isActive: true,
      clubId: { in: [homeClubId, awayClubId] },
    },
    select: { role: true },
  });

  if (!membership) {
    return { canManage: false, canViewLineup: false, canRecordResult: false };
  }

  const canManage = MANAGE_MATCH_ROLES.includes(membership.role);

  return {
    canManage,
    canViewLineup: true, // All members can view lineup
    canRecordResult: canManage || user?.roles?.includes('REFEREE') || false,
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getMatchData(matchId: string): Promise<MatchPageData | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
          sport: true,
          primaryColor: true,
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
          sport: true,
          primaryColor: true,
        },
      },
      league: {
        select: {
          id: true,
          name: true,
        },
      },
      events: {
        orderBy: { minute: 'asc' },
        take: 10,
        select: {
          id: true,
          eventType: true,
          minute: true,
          playerId: true,
        },
      },
      playerAttendance: {
        include: {
          player: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return match;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const StatusBadge = ({ status }: { status: MatchStatus }) => {
  const statusConfig: Record<MatchStatus, { label: string; color: string }> = {
    SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    WARMUP: { label: 'Warm Up', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    LIVE: { label: 'LIVE', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 animate-pulse' },
    HALFTIME: { label: 'Half Time', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    SECOND_HALF: { label: '2nd Half', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    EXTRA_TIME_FIRST: { label: 'Extra Time', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    EXTRA_TIME_SECOND: { label: 'Extra Time', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    PENALTIES: { label: 'Penalties', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    FINISHED: { label: 'Full Time', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    POSTPONED: { label: 'Postponed', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    ABANDONED: { label: 'Abandoned', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    REPLAY_SCHEDULED: { label: 'Replay', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    VOIDED: { label: 'Voided', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    DELAYED: { label: 'Delayed', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    SUSPENDED: { label: 'Suspended', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };

  return <Badge className={config.color}>{config.label}</Badge>;
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function MatchDetailsPage({
  params,
}: {
  params: { matchId: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/dashboard/matches/${params.matchId}`);
  }

  const match = await getMatchData(params.matchId);

  if (!match) {
    notFound();
  }

  const permissions = await getMatchPermissions(
    session.user.id,
    match.homeClubId,
    match.awayClubId
  );

  const sportConfig = getSportConfig(match.homeTeam.sport);
  const sportIcon = getSportIcon(match.homeTeam.sport);

  // Calculate attendance stats
  const attendanceStats = {
    available: match.playerAttendance.filter((a) =>
      ['AVAILABLE', 'CONFIRMED', 'STARTING_LINEUP', 'SUBSTITUTE'].includes(a.status)
    ).length,
    unavailable: match.playerAttendance.filter((a) =>
      ['UNAVAILABLE', 'INJURED', 'ILL', 'SUSPENDED', 'INTERNATIONAL_DUTY', 'LOAN'].includes(a.status)
    ).length,
    pending: match.playerAttendance.filter((a) =>
      ['MAYBE', 'NOT_SELECTED'].includes(a.status) || !a.status
    ).length,
    total: match.playerAttendance.length,
  };

  // Check if match is live or upcoming
  const isLive = ['LIVE', 'HALFTIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND', 'PENALTIES'].includes(match.status);
  const isFinished = ['FINISHED', 'CANCELLED', 'POSTPONED', 'ABANDONED', 'VOIDED'].includes(match.status);
  const isUpcoming = match.status === 'SCHEDULED' || match.status === 'WARMUP';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          href="/dashboard/matches"
          className="inline-flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Matches
        </Link>

        {/* Match Header Card */}
        <Card className="mb-6 overflow-hidden bg-gradient-to-r from-charcoal-900 to-charcoal-800 dark:from-charcoal-800 dark:to-charcoal-700 border-0 text-white">
          <CardContent className="p-6 sm:p-8">
            {/* League & Status */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{sportIcon}</span>
                {match.league && (
                  <span className="text-charcoal-300">{match.league.name}</span>
                )}
              </div>
              <StatusBadge status={match.status} />
            </div>

            {/* Teams & Score */}
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Home Team */}
              <div className="text-center">
                {match.homeTeam.logo ? (
                  <img
                    src={match.homeTeam.logo}
                    alt={match.homeTeam.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 bg-blue-500/30 rounded-xl flex items-center justify-center text-4xl">
                    {sportIcon}
                  </div>
                )}
                <h2 className="font-bold text-lg sm:text-xl">
                  {match.homeTeam.shortName || match.homeTeam.name}
                </h2>
                <Badge variant="outline" className="mt-1 text-blue-300 border-blue-300/50">
                  Home
                </Badge>
              </div>

              {/* Score */}
              <div className="text-center">
                {isFinished || isLive ? (
                  <div className="text-5xl sm:text-6xl font-bold">
                    {match.homeScore ?? 0} - {match.awayScore ?? 0}
                  </div>
                ) : (
                  <div className="text-3xl sm:text-4xl font-medium text-charcoal-400">vs</div>
                )}
                {(match.homeHalftimeScore !== null || match.awayHalftimeScore !== null) && (
                  <div className="text-charcoal-400 text-sm mt-2">
                    HT: {match.homeHalftimeScore ?? '-'} - {match.awayHalftimeScore ?? '-'}
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="text-center">
                {match.awayTeam.logo ? (
                  <img
                    src={match.awayTeam.logo}
                    alt={match.awayTeam.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 bg-orange-500/30 rounded-xl flex items-center justify-center text-4xl">
                    {sportIcon}
                  </div>
                )}
                <h2 className="font-bold text-lg sm:text-xl">
                  {match.awayTeam.shortName || match.awayTeam.name}
                </h2>
                <Badge variant="outline" className="mt-1 text-orange-300 border-orange-300/50">
                  Away
                </Badge>
              </div>
            </div>

            {/* Match Info Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 pt-6 border-t border-white/20 text-sm text-charcoal-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {match.kickOffTime.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {match.kickOffTime.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {match.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {match.venue}
                </div>
              )}
              {match.weather && (
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  {match.weather}
                  {match.temperature && ` (${match.temperature}°C)`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {isLive && match.isBroadcasted && match.broadcastUrl && (
            <Link href={match.broadcastUrl} target="_blank">
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                <Tv className="w-4 h-4 mr-2" />
                Watch Live
              </Button>
            </Link>
          )}

          {permissions.canRecordResult && !isFinished && (
            <Link href={`/dashboard/matches/${match.id}/record-result`}>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                <Trophy className="w-4 h-4 mr-2" />
                Record Result
              </Button>
            </Link>
          )}

          <Link href={`/dashboard/matches/${match.id}/lineup`}>
            <Button variant="outline" className="w-full">
              <Users className="w-4 h-4 mr-2" />
              Lineup
            </Button>
          </Link>

          <Link href={`/dashboard/matches/${match.id}/events`}>
            <Button variant="outline" className="w-full">
              <Activity className="w-4 h-4 mr-2" />
              Events
            </Button>
          </Link>

          {permissions.canManage && (
            <Link href={`/dashboard/matches/${match.id}/attendance`}>
              <Button variant="outline" className="w-full">
                <ClipboardList className="w-4 h-4 mr-2" />
                Attendance
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Overview */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Squad Availability
              </CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Player availability for this match
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceStats.total === 0 ? (
                <div className="text-center py-8 text-charcoal-500 dark:text-charcoal-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No attendance data yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {attendanceStats.available}
                        </span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300">Available</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {attendanceStats.unavailable}
                        </span>
                      </div>
                      <p className="text-xs text-red-700 dark:text-red-300">Unavailable</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <HelpCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {attendanceStats.pending}
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">Pending</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-charcoal-100 dark:bg-charcoal-700 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 h-full"
                      style={{
                        width: `${(attendanceStats.available / attendanceStats.total) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{
                        width: `${(attendanceStats.unavailable / attendanceStats.total) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-yellow-500 h-full"
                      style={{
                        width: `${(attendanceStats.pending / attendanceStats.total) * 100}%`,
                      }}
                    />
                  </div>

                  {permissions.canManage && (
                    <Link
                      href={`/dashboard/matches/${match.id}/attendance`}
                      className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Manage Attendance →
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Match Events
                  </CardTitle>
                  <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                    Recent match events
                  </CardDescription>
                </div>
                <Link href={`/dashboard/matches/${match.id}/events`}>
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {match.events.length === 0 ? (
                <div className="text-center py-8 text-charcoal-500 dark:text-charcoal-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No events recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {match.events.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-lg"
                    >
                      <span className="text-xl">{getEventTypeIcon(event.eventType as any)}</span>
                      <div className="flex-1">
                        <p className="font-medium text-charcoal-900 dark:text-white">
                          {getEventTypeLabel(event.eventType as any)}
                        </p>
                      </div>
                      <span className="font-bold text-charcoal-600 dark:text-charcoal-400">
                        {event.minute}'
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Match Info */}
        <Card className="mt-6 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="text-charcoal-900 dark:text-white">Match Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-lg">
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-1">Sport</p>
                <p className="font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                  {sportIcon} {getSportDisplayName(match.homeTeam.sport)}
                </p>
              </div>
              <div className="p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-lg">
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-1">Kick Off</p>
                <p className="font-semibold text-charcoal-900 dark:text-white">
                  {match.kickOffTime.toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              {match.venue && (
                <div className="p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-lg">
                  <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-1">Venue</p>
                  <p className="font-semibold text-charcoal-900 dark:text-white">{match.venue}</p>
                </div>
              )}
              {match.attendance && (
                <div className="p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-lg">
                  <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-1">Attendance</p>
                  <p className="font-semibold text-charcoal-900 dark:text-white">
                    {match.attendance.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
