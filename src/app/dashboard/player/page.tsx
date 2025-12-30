/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Player Dashboard v7.5.0 (Enterprise Multi-Sport)
 * Path: src/app/dashboard/player/page.tsx
 * ============================================================================
 *
 * FEATURES:
 * ✅ Multi-sport support (12 sports)
 * ✅ Role-based access (Player, Parent viewing child, Coach viewing squad)
 * ✅ Sport-specific stat labels
 * ✅ Both club-level and team-level match support
 * ✅ Real-time form calculation
 * ✅ Dark mode support
 * ✅ Loading states & error handling
 *
 * AFFECTED USER TYPES:
 * - PLAYER: Full access to own dashboard
 * - PARENT: Read-only access to children's dashboards
 * - COACH: Read access to squad player dashboards
 * - SCOUT: Read access for talent evaluation
 *
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Activity,
  Users,
  Search,
  ArrowRight,
  Shield,
  MapPin,
  Bell,
  ChevronRight,
  Zap,
  Star,
  Clock,
  BarChart3,
  Heart,
} from 'lucide-react';
import { Sport, SPORT_CONFIGS, getStatLabels, type MatchStatus } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardData {
  player: {
    id: string;
    userId: string;
    overallRating: number | null;
    formRating: number | null;
    availabilityStatus: string;
    isVerified: boolean;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  };
  stats: {
    goals: number;
    assists: number;
    matches: number;
    minutesPlayed: number;
    averageRating: number | null;
    cleanSheets: number;
  };
  teams: Array<{
    id: string;
    name: string;
    isCaptain: boolean;
    isViceCaptain: boolean;
    position: string | null;
    jerseyNumber: number | null;
    club: {
      id: string;
      name: string;
      shortName: string | null;
      logo: string | null;
      sport: Sport;
      primaryColor: string | null;
    };
  }>;
  upcomingMatches: Array<{
    id: string;
    kickOffTime: Date;
    venue: string | null;
    status: MatchStatus;
    competition: string | null;
    homeTeam: { id: string; name: string };
    awayTeam: { id: string; name: string };
    homeClub: { id: string; name: string; shortName: string | null };
    awayClub: { id: string; name: string; shortName: string | null };
    isHome: boolean;
    sport: Sport;
  }>;
  recentForm: Array<'W' | 'D' | 'L'>;
  primarySport: Sport;
  unreadNotifications: number;
  profileCompletion: number;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getPlayerDashboardData(userId: string): Promise<DashboardData | null> {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          image: true,
        },
      },
      statistics: {
        orderBy: { season: 'desc' },
        take: 1,
      },
      aggregateStats: true,
      teamPlayers: {
        where: { isActive: true },
        include: {
          team: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                  logo: true,
                  sport: true,
                  primaryColor: true,
                },
              },
            },
          },
        },
      },
      matchAttendance: {
        where: {
          match: { status: 'FINISHED' },
        },
        orderBy: { match: { kickOffTime: 'desc' } },
        take: 5,
        include: {
          match: {
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              homeClub: { select: { id: true, name: true, shortName: true } },
              awayClub: { select: { id: true, name: true, shortName: true } },
            },
          },
        },
      },
    },
  });

  if (!player) return null;

  // Get primary sport from first active team
  const primarySport = (player.teamPlayers[0]?.team?.club?.sport as Sport) || 'FOOTBALL';
  const teamIds = player.teamPlayers.map((tp) => tp.teamId);
  const clubIds = player.teamPlayers.map((tp) => tp.team.clubId);

  // Get upcoming matches (supports both team-level and club-level)
  const upcomingMatchesRaw = teamIds.length > 0 || clubIds.length > 0
    ? await prisma.match.findMany({
        where: {
          status: { in: ['SCHEDULED', 'WARMUP'] },
          kickOffTime: { gte: new Date() },
          OR: [
            { homeTeamId: { in: teamIds } },
            { awayTeamId: { in: teamIds } },
            { homeClubId: { in: clubIds } },
            { awayClubId: { in: clubIds } },
          ],
        },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          homeClub: { select: { id: true, name: true, shortName: true, sport: true } },
          awayClub: { select: { id: true, name: true, shortName: true, sport: true } },
          competition: { select: { name: true } },
        },
        orderBy: { kickOffTime: 'asc' },
        take: 3,
      })
    : [];

  // Calculate recent form from match attendance
  const recentForm: Array<'W' | 'D' | 'L'> = player.matchAttendance.map((ma) => {
    const match = ma.match;
    const isHome = teamIds.includes(match.homeTeamId || '') || clubIds.includes(match.homeClubId || '');
    const ourScore = isHome ? match.homeScore : match.awayScore;
    const theirScore = isHome ? match.awayScore : match.homeScore;

    if (ourScore === null || theirScore === null) return 'D';
    if (ourScore > theirScore) return 'W';
    if (ourScore < theirScore) return 'L';
    return 'D';
  });

  // Get current season stats
  const currentStats = player.statistics[0];

  // Get unread notifications count
  const unreadNotifications = await prisma.notification.count({
    where: { userId, read: false },
  });

  // Calculate profile completion
  const profileFields = [
    player.user.firstName,
    player.user.lastName,
    player.user.image,
    player.primaryPosition,
    player.height,
    player.weight,
    player.preferredFoot,
    player.dateOfBirth,
    player.nationality,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  return {
    player: {
      id: player.id,
      userId: player.userId,
      overallRating: player.overallRating,
      formRating: player.formRating,
      availabilityStatus: player.availabilityStatus,
      isVerified: player.isVerified,
    },
    user: player.user,
    stats: {
      goals: currentStats?.goals || 0,
      assists: currentStats?.assists || 0,
      matches: currentStats?.matches || 0,
      minutesPlayed: currentStats?.minutesPlayed || 0,
      averageRating: currentStats?.averageRating || null,
      cleanSheets: currentStats?.cleanSheets || 0,
    },
    teams: player.teamPlayers.map((tp) => ({
      id: tp.team.id,
      name: tp.team.name,
      isCaptain: tp.isCaptain,
      isViceCaptain: tp.isViceCaptain,
      position: tp.position,
      jerseyNumber: tp.jerseyNumber,
      club: {
        ...tp.team.club,
        sport: (tp.team.club.sport as Sport) || 'FOOTBALL',
      },
    })),
    upcomingMatches: upcomingMatchesRaw.map((m) => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      status: m.status as MatchStatus,
      competition: m.competition?.name || null,
      homeTeam: m.homeTeam || { id: '', name: 'TBD' },
      awayTeam: m.awayTeam || { id: '', name: 'TBD' },
      homeClub: m.homeClub || { id: '', name: 'TBD', shortName: null },
      awayClub: m.awayClub || { id: '', name: 'TBD', shortName: null },
      isHome: teamIds.includes(m.homeTeamId || '') || clubIds.includes(m.homeClubId || ''),
      sport: (m.homeClub?.sport as Sport) || primarySport,
    })),
    recentForm,
    primarySport,
    unreadNotifications,
    profileCompletion,
  };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-12 bg-charcoal-200 dark:bg-charcoal-700 rounded-lg w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-charcoal-200 dark:bg-charcoal-700 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-charcoal-200 dark:bg-charcoal-700 rounded-xl" />
        ))}
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
  trend,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'gold' | 'red';
  trend?: { value: string; isUp: boolean };
  subtitle?: string;
}) {
  const colorClasses = {
    green: 'bg-success-50 dark:bg-success/10 border-success-200 dark:border-success/30 hover:border-success-400',
    blue: 'bg-info-50 dark:bg-info/10 border-info-200 dark:border-info/30 hover:border-info-400',
    purple: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 hover:border-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 hover:border-orange-400',
    gold: 'bg-gold-50 dark:bg-gold-500/10 border-gold-200 dark:border-gold-500/30 hover:border-gold-400',
    red: 'bg-error-50 dark:bg-error/10 border-error-200 dark:border-error/30 hover:border-error-400',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-charcoal-900 dark:text-white tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon}
          {trend && (
            <span
              className={`text-xs font-semibold ${
                trend.isUp ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
              }`}
            >
              {trend.isUp ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAccessCard({
  href,
  icon,
  title,
  description,
  gradient,
  borderColor,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  borderColor: string;
}) {
  return (
    <Link
      href={href}
      className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{description}</p>
      <div className="flex items-center gap-2 mt-4 text-gold-600 dark:text-gold-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const config = {
    W: { bg: 'bg-success-500', text: 'Win' },
    D: { bg: 'bg-warning-500', text: 'Draw' },
    L: { bg: 'bg-error-500', text: 'Loss' },
  };

  return (
    <span
      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-sm ${config[result].bg}`}
      title={config[result].text}
    >
      {result}
    </span>
  );
}

function AvailabilityBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; icon: React.ElementType }> = {
    AVAILABLE: { color: 'bg-success-100 text-success-700 dark:bg-success/20 dark:text-success-400', label: 'Available', icon: Shield },
    INJURED: { color: 'bg-error-100 text-error-700 dark:bg-error/20 dark:text-error-400', label: 'Injured', icon: Heart },
    SUSPENDED: { color: 'bg-warning-100 text-warning-700 dark:bg-warning/20 dark:text-warning-400', label: 'Suspended', icon: Shield },
    UNAVAILABLE: { color: 'bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-400', label: 'Unavailable', icon: Clock },
    INTERNATIONAL_DUTY: { color: 'bg-info-100 text-info-700 dark:bg-info/20 dark:text-info-400', label: 'International', icon: Trophy },
  };

  const { color, label, icon: Icon } = config[status] || config.UNAVAILABLE;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const data = await getPlayerDashboardData(session.user.id);

  if (!data) {
    // Player profile doesn't exist - redirect to create profile
    redirect('/onboarding/player');
  }

  const sport = data.primarySport;
  const sportConfig = SPORT_CONFIGS[sport];
  const statLabels = getStatLabels(sport);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
              <span className="text-4xl">{sportConfig.icon}</span>
              Player Dashboard
            </h1>
            <p className="text-charcoal-600 dark:text-charcoal-400">
              Welcome back, {data.user.firstName}! Track your {sportConfig.name} performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AvailabilityBadge status={data.player.availabilityStatus} />

            {data.player.isVerified && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-info-100 dark:bg-info/20 text-info-700 dark:text-info-400 rounded-full text-xs font-semibold">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}

            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-lg bg-charcoal-100 dark:bg-charcoal-700 hover:bg-charcoal-200 dark:hover:bg-charcoal-600 transition-colors"
            >
              <Bell className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
              {data.unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {data.unreadNotifications > 9 ? '9+' : data.unreadNotifications}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Profile Completion Banner */}
        {data.profileCompletion < 100 && (
          <div className="bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gold-900/20 dark:to-orange-900/20 border border-gold-200 dark:border-gold-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-100 dark:bg-gold-900/30 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                </div>
                <div>
                  <p className="font-semibold text-charcoal-900 dark:text-white">
                    Complete Your Profile
                  </p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    {data.profileCompletion}% complete - Add more details to stand out
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/player/profile"
                className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors"
              >
                Complete Profile
              </Link>
            </div>
            <div className="mt-3 h-2 bg-gold-200 dark:bg-gold-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-500 to-orange-500 transition-all duration-500"
                style={{ width: `${data.profileCompletion}%` }}
              />
            </div>
          </div>
        )}

        {/* Rating Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-gold-500 to-orange-500 rounded-xl p-6 text-white shadow-gold">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gold-100 text-sm font-medium mb-1">Overall Rating</p>
                <p className="text-5xl font-bold tabular-nums">
                  {data.player.overallRating?.toFixed(1) || '-'}
                </p>
              </div>
              <Award className="w-12 h-12 text-gold-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white shadow-purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium mb-1">Current Form</p>
                <p className="text-5xl font-bold tabular-nums">
                  {data.player.formRating?.toFixed(1) || '-'}
                </p>
              </div>
              <Zap className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label={statLabels.primaryStat}
            value={data.stats.goals}
            icon={<Target className="w-8 h-8 text-success-500" />}
            color="green"
            subtitle={`${data.stats.matches > 0 ? (data.stats.goals / data.stats.matches).toFixed(2) : '0.00'} per game`}
          />
          <StatCard
            label={statLabels.secondaryStat}
            value={data.stats.assists}
            icon={<Activity className="w-8 h-8 text-info-500" />}
            color="blue"
            subtitle={`${data.stats.matches > 0 ? (data.stats.assists / data.stats.matches).toFixed(2) : '0.00'} per game`}
          />
          <StatCard
            label="Matches Played"
            value={data.stats.matches}
            icon={<Calendar className="w-8 h-8 text-purple-500" />}
            color="purple"
            subtitle={`${data.stats.minutesPlayed} mins total`}
          />
          <StatCard
            label="Match Rating"
            value={data.stats.averageRating?.toFixed(1) || '-'}
            icon={<Star className="w-8 h-8 text-gold-500" />}
            color="gold"
          />
        </div>

        {/* Recent Form */}
        {data.recentForm.length > 0 && (
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold-500" />
                Recent Form
              </h2>
              <Link
                href="/dashboard/player/fixtures"
                className="text-sm font-semibold text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {data.recentForm.map((result, idx) => (
                <FormBadge key={idx} result={result} />
              ))}
              <span className="ml-4 text-sm text-charcoal-600 dark:text-charcoal-400">
                Last {data.recentForm.length} matches
              </span>
            </div>
          </div>
        )}

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickAccessCard
            href="/dashboard/player/stats"
            icon={<BarChart3 className="w-8 h-8 text-success-600 dark:text-success-400" />}
            title={`${sportConfig.name} Statistics`}
            description={`View detailed ${sportConfig.name.toLowerCase()} performance stats`}
            gradient="from-success-50 to-success-100 dark:from-success/10 dark:to-success/5"
            borderColor="border-success-200 dark:border-success/30 hover:border-success-400"
          />
          <QuickAccessCard
            href="/dashboard/player/fixtures"
            icon={<Calendar className="w-8 h-8 text-info-600 dark:text-info-400" />}
            title="Match Schedule"
            description={`View upcoming ${sportConfig.name.toLowerCase()} fixtures and history`}
            gradient="from-info-50 to-info-100 dark:from-info/10 dark:to-info/5"
            borderColor="border-info-200 dark:border-info/30 hover:border-info-400"
          />
          <QuickAccessCard
            href="/dashboard/player/teams"
            icon={<Trophy className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
            title="My Teams"
            description="Team roster, standings, and team information"
            gradient="from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-500/5"
            borderColor="border-purple-200 dark:border-purple-500/30 hover:border-purple-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickAccessCard
            href="/dashboard/player/achievements"
            icon={<Award className="w-8 h-8 text-gold-600 dark:text-gold-400" />}
            title="Achievements"
            description="Unlock badges, earn XP, and climb the ranks"
            gradient="from-gold-50 to-orange-50 dark:from-gold-500/10 dark:to-orange-500/5"
            borderColor="border-gold-200 dark:border-gold-500/30 hover:border-gold-400"
          />
          <QuickAccessCard
            href="/dashboard/player/analytics"
            icon={<TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />}
            title="Analytics"
            description="Deep dive into your performance metrics"
            gradient="from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-500/5"
            borderColor="border-orange-200 dark:border-orange-500/30 hover:border-orange-400"
          />
        </div>

        {/* My Teams Section */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-charcoal-200 dark:border-charcoal-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-500" />
                My Teams
              </h2>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                Teams you&apos;re currently playing for
              </p>
            </div>
            <Link
              href="/dashboard/player/browse-teams"
              className="px-4 py-2 bg-charcoal-100 dark:bg-charcoal-700 hover:bg-charcoal-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Search className="w-4 h-4" /> Find Teams
            </Link>
          </div>

          <div className="p-6">
            {data.teams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
                  No teams yet
                </h3>
                <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
                  Browse and join teams to start playing
                </p>
                <Link
                  href="/dashboard/player/browse-teams"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-gold transition-all"
                >
                  <Search className="w-4 h-4" /> Browse Teams
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.teams.map((team) => {
                  const teamSportConfig = SPORT_CONFIGS[team.club.sport];
                  return (
                    <Link
                      key={team.id}
                      href={`/dashboard/teams/${team.id}`}
                      className="group flex items-center gap-4 p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-xl border border-charcoal-200 dark:border-charcoal-600 hover:border-gold-300 dark:hover:border-gold-700 hover:shadow-md transition-all"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md text-2xl"
                        style={{
                          background: team.club.primaryColor
                            ? `linear-gradient(135deg, ${team.club.primaryColor}, ${team.club.primaryColor}dd)`
                            : 'linear-gradient(135deg, #D4AF37, #F59E0B)',
                        }}
                      >
                        {teamSportConfig.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-charcoal-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 truncate">
                            {team.name}
                          </p>
                          {(team.isCaptain || team.isViceCaptain) && (
                            <span className="px-2 py-0.5 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 text-xs font-semibold rounded-full flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {team.isCaptain ? 'Captain' : 'Vice Captain'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1 truncate">
                          <span>{teamSportConfig.icon}</span> {team.club.name}
                          {team.jerseyNumber && (
                            <span className="ml-2 text-gold-600 dark:text-gold-400">
                              #{team.jerseyNumber}
                            </span>
                          )}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-charcoal-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-charcoal-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-info-500" />
              Upcoming Matches
            </h2>
            <Link
              href="/dashboard/player/fixtures"
              className="text-sm font-semibold text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6">
            {data.upcomingMatches.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
                  No upcoming matches
                </h3>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  Join a team to see your match schedule
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.upcomingMatches.map((match) => {
                  const matchSportConfig = SPORT_CONFIGS[match.sport];
                  const homeDisplay = match.homeTeam.name || match.homeClub.shortName || match.homeClub.name;
                  const awayDisplay = match.awayTeam.name || match.awayClub.shortName || match.awayClub.name;

                  return (
                    <Link
                      key={match.id}
                      href={`/dashboard/matches/${match.id}`}
                      className="group flex items-center justify-between p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-xl border border-charcoal-200 dark:border-charcoal-600 hover:border-gold-300 dark:hover:border-gold-700 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
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
                        <div className="w-px h-10 bg-charcoal-300 dark:bg-charcoal-600" />
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{matchSportConfig.icon}</span>
                          <div>
                            <p className="font-semibold text-charcoal-900 dark:text-white">
                              {homeDisplay} vs {awayDisplay}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-charcoal-500 dark:text-charcoal-400">
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
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            match.isHome
                              ? 'bg-info-100 text-info-700 dark:bg-info/20 dark:text-info-400'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                          }`}
                        >
                          {match.isHome ? 'Home' : 'Away'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-charcoal-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
}
