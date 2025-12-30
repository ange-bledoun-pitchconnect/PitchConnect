/**
 * ============================================================================
 * 📊 PITCHCONNECT - Player Analytics v7.5.0 (Enterprise Multi-Sport)
 * Path: src/app/dashboard/player/analytics/page.tsx
 * ============================================================================
 *
 * FEATURES:
 * ✅ Multi-sport support (12 sports)
 * ✅ Personal performance dashboard
 * ✅ Form tracking with trend analysis
 * ✅ Career totals from PlayerAggregateStats
 * ✅ Attribute ratings visualization
 * ✅ Sport-specific metrics
 * ✅ Dark mode support
 *
 * AFFECTED USER TYPES:
 * - PLAYER: Full access to own analytics
 * - PARENT: Read-only access to children's analytics
 * - COACH: Read access to squad player analytics
 * - ANALYST: Full analytical access
 * - SCOUT: Read access for talent evaluation
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
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
  Calendar,
  Award,
  Activity,
  Zap,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Timer,
  Shield,
  ArrowLeft,
  Flame,
  Brain,
  Heart,
  Wind,
  Crosshair,
} from 'lucide-react';
import { Sport, SPORT_CONFIGS, getStatLabels } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerAnalytics {
  profile: {
    name: string;
    position: string | null;
    age: number | null;
    height: number | null;
    weight: number | null;
    preferredFoot: string | null;
    nationality: string | null;
    overallRating: number;
    formRating: number;
  };
  currentSeason: {
    season: number;
    matches: number;
    starts: number;
    goals: number;
    assists: number;
    minutes: number;
    yellowCards: number;
    redCards: number;
    avgRating: number;
    cleanSheets: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passAccuracy: number | null;
    tackles: number;
    tackleSuccess: number | null;
    interceptions: number;
  };
  careerTotals: {
    matches: number;
    goals: number;
    assists: number;
    minutes: number;
    yellowCards: number;
    redCards: number;
    cleanSheets: number;
    motm: number;
  };
  form: {
    last5: Array<{
      matchId: string;
      opponent: string;
      date: Date;
      rating: number;
      goals: number;
      assists: number;
      result: 'W' | 'D' | 'L';
    }>;
    trend: 'UP' | 'DOWN' | 'STABLE';
    avgLast5: number;
  };
  attributes: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
    mental: number;
  } | null;
  sport: Sport;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getPlayerAnalytics(userId: string): Promise<PlayerAnalytics | null> {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          nationality: true,
        },
      },
      aggregateStats: true,
      analytics: true,
      statistics: {
        orderBy: { season: 'desc' },
        take: 1,
      },
      matchAttendance: {
        where: { match: { status: 'FINISHED' } },
        orderBy: { match: { kickOffTime: 'desc' } },
        take: 10,
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
    },
  });

  if (!player) return null;

  // Get sport from primary team
  const sport = (player.teamPlayers[0]?.team?.club?.sport as Sport) || 'FOOTBALL';
  const teamIds = player.teamPlayers.map((tp) => tp.teamId);
  const clubIds = player.teamPlayers.map((tp) => tp.team.clubId);

  // Calculate age
  let age: number | null = null;
  if (player.user.dateOfBirth) {
    const today = new Date();
    const birth = new Date(player.user.dateOfBirth);
    age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
  }

  // Current season stats
  const currentStats = player.statistics[0];
  const currentSeason = {
    season: currentStats?.season || new Date().getFullYear(),
    matches: currentStats?.matches || 0,
    starts: currentStats?.starts || 0,
    goals: currentStats?.goals || 0,
    assists: currentStats?.assists || 0,
    minutes: currentStats?.minutesPlayed || 0,
    yellowCards: currentStats?.yellowCards || 0,
    redCards: currentStats?.redCards || 0,
    avgRating: currentStats?.averageRating || 0,
    cleanSheets: currentStats?.cleanSheets || 0,
    shots: currentStats?.shots || 0,
    shotsOnTarget: currentStats?.shotsOnTarget || 0,
    passes: currentStats?.passes || 0,
    passAccuracy: currentStats?.passAccuracy || null,
    tackles: currentStats?.tackles || 0,
    tackleSuccess: currentStats?.tackleSuccess || null,
    interceptions: currentStats?.interceptions || 0,
  };

  // Career totals from aggregate stats
  const aggregateStats = player.aggregateStats;
  const careerTotals = {
    matches: aggregateStats?.totalMatches || 0,
    goals: aggregateStats?.totalGoals || 0,
    assists: aggregateStats?.totalAssists || 0,
    minutes: aggregateStats?.totalMinutes || 0,
    yellowCards: aggregateStats?.totalYellowCards || 0,
    redCards: aggregateStats?.totalRedCards || 0,
    cleanSheets: aggregateStats?.totalCleanSheets || 0,
    motm: aggregateStats?.totalMOTM || 0,
  };

  // Form from last 5 matches
  const last5Stats = player.matchAttendance.slice(0, 5);
  const last5 = last5Stats.map((ma) => {
    const match = ma.match;
    const isHome = teamIds.includes(match.homeTeamId || '') || clubIds.includes(match.homeClubId || '');
    const opponent = isHome
      ? (match.awayTeam?.name || match.awayClub?.shortName || match.awayClub?.name || 'Unknown')
      : (match.homeTeam?.name || match.homeClub?.shortName || match.homeClub?.name || 'Unknown');

    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;

    let result: 'W' | 'D' | 'L' = 'D';
    if (teamScore !== null && opponentScore !== null) {
      if (teamScore > opponentScore) result = 'W';
      else if (teamScore < opponentScore) result = 'L';
    }

    return {
      matchId: ma.matchId,
      opponent,
      date: match.kickOffTime,
      rating: ma.rating || 0,
      goals: ma.goals || 0,
      assists: ma.assists || 0,
      result,
    };
  });

  const avgLast5 = last5.length > 0
    ? last5.reduce((sum, m) => sum + m.rating, 0) / last5.length
    : 0;

  // Determine trend
  let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
  if (last5.length >= 3) {
    const recent = last5.slice(0, 2).reduce((s, m) => s + m.rating, 0) / 2;
    const older = last5.slice(2, 5).reduce((s, m) => s + m.rating, 0) / Math.min(3, last5.length - 2);
    if (recent > older + 0.3) trend = 'UP';
    else if (recent < older - 0.3) trend = 'DOWN';
  }

  // Attributes from analytics
  const analytics = player.analytics;
  const attributes = analytics
    ? {
        pace: analytics.pace || 0,
        shooting: analytics.shooting || 0,
        passing: analytics.passing || 0,
        dribbling: analytics.dribbling || 0,
        defending: analytics.defending || 0,
        physical: analytics.physical || 0,
        mental: analytics.mental || 0,
      }
    : null;

  return {
    profile: {
      name: `${player.user.firstName || ''} ${player.user.lastName || ''}`.trim() || 'Unknown Player',
      position: player.primaryPosition,
      age,
      height: player.height,
      weight: player.weight,
      preferredFoot: player.preferredFoot,
      nationality: player.user.nationality,
      overallRating: player.overallRating || 0,
      formRating: player.formRating || 0,
    },
    currentSeason,
    careerTotals,
    form: { last5, trend, avgLast5 },
    attributes,
    sport,
  };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 p-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="h-20 bg-charcoal-700/50 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-charcoal-700/50 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-charcoal-700/50 rounded-xl" />
          <div className="h-64 bg-charcoal-700/50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({
  icon: Icon,
  value,
  label,
  subtitle,
  color = 'blue',
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gold';
}) {
  const colorClasses = {
    blue: 'bg-info-500/10 text-info-400',
    green: 'bg-success-500/10 text-success-400',
    yellow: 'bg-warning-500/10 text-warning-400',
    red: 'bg-error-500/10 text-error-400',
    purple: 'bg-purple-500/10 text-purple-400',
    gold: 'bg-gold-500/10 text-gold-400',
  };

  return (
    <div className="bg-charcoal-800/50 backdrop-blur-sm rounded-xl p-5 border border-charcoal-700/50 hover:border-charcoal-600 transition-colors">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-sm text-charcoal-400">{label}</p>
      {subtitle && <p className="text-xs text-charcoal-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function AttributeBar({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  const getColor = (val: number) => {
    if (val >= 80) return 'from-success-500 to-success-400';
    if (val >= 60) return 'from-info-500 to-info-400';
    if (val >= 40) return 'from-warning-500 to-warning-400';
    return 'from-error-500 to-error-400';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-charcoal-400 flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          {label}
        </span>
        <span className="text-white font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-2 bg-charcoal-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getColor(value)} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = {
    W: 'bg-success-500 text-white',
    D: 'bg-warning-500 text-white',
    L: 'bg-error-500 text-white',
  };

  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${colors[result]}`}
    >
      {result}
    </span>
  );
}

function TrendBadge({ trend }: { trend: 'UP' | 'DOWN' | 'STABLE' }) {
  const config = {
    UP: { icon: TrendingUp, color: 'text-success-400', label: 'Improving' },
    DOWN: { icon: TrendingDown, color: 'text-error-400', label: 'Declining' },
    STABLE: { icon: Minus, color: 'text-charcoal-400', label: 'Stable' },
  };

  const { icon: Icon, color, label } = config[trend];

  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const getColor = (r: number) => {
    if (r >= 8) return 'text-success-400';
    if (r >= 7) return 'text-info-400';
    if (r >= 6) return 'text-warning-400';
    return 'text-error-400';
  };

  return <span className={`font-bold ${getColor(rating)}`}>{rating.toFixed(1)}</span>;
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 p-6">
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-charcoal-800/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <BarChart3 className="h-12 w-12 text-charcoal-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">No Analytics Available</h1>
        <p className="text-charcoal-400 mb-8">
          Your performance analytics will appear here once you start playing matches.
        </p>
        <Link
          href="/dashboard/player"
          className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const stats = await getPlayerAnalytics(session.user.id);

  if (!stats) {
    return <EmptyState />;
  }

  const sportConfig = SPORT_CONFIGS[stats.sport];
  const statLabels = getStatLabels(stats.sport);

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900">
        {/* Header */}
        <div className="border-b border-charcoal-700/50 bg-charcoal-800/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/player"
                  className="p-2 rounded-lg hover:bg-charcoal-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-charcoal-400" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-2xl">{sportConfig.icon}</span>
                    <BarChart3 className="h-7 w-7 text-info-400" />
                    My Analytics
                  </h1>
                  <p className="text-charcoal-400 mt-1">
                    {stats.profile.name} • {stats.profile.position || 'Position TBD'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-bold text-white tabular-nums">
                    {stats.profile.overallRating.toFixed(1)}
                  </p>
                  <p className="text-sm text-charcoal-400">Overall Rating</p>
                </div>
                <div className="w-px h-12 bg-charcoal-700" />
                <div className="text-right">
                  <p className="text-3xl font-bold text-info-400 tabular-nums">
                    {stats.profile.formRating.toFixed(1)}
                  </p>
                  <p className="text-sm text-charcoal-400">Current Form</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Season Stats */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold-400" />
              {stats.currentSeason.season}/{stats.currentSeason.season + 1} Season
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={Trophy} value={stats.currentSeason.matches} label="Matches" color="blue" />
              <StatCard
                icon={Target}
                value={stats.currentSeason.goals}
                label={statLabels.primaryStat}
                color="green"
                subtitle={`${stats.currentSeason.matches > 0 ? (stats.currentSeason.goals / stats.currentSeason.matches).toFixed(2) : '0.00'} per game`}
              />
              <StatCard
                icon={Users}
                value={stats.currentSeason.assists}
                label={statLabels.secondaryStat}
                color="purple"
                subtitle={`${stats.currentSeason.matches > 0 ? (stats.currentSeason.assists / stats.currentSeason.matches).toFixed(2) : '0.00'} per game`}
              />
              <StatCard
                icon={Timer}
                value={Math.round(stats.currentSeason.minutes / 90)}
                label="90s Played"
                color="blue"
              />
              <StatCard
                icon={Star}
                value={stats.currentSeason.avgRating.toFixed(1)}
                label="Avg Rating"
                color="gold"
              />
              <StatCard icon={Shield} value={stats.currentSeason.cleanSheets} label="Clean Sheets" color="green" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 bg-charcoal-800/50 backdrop-blur-sm rounded-xl p-6 border border-charcoal-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-info-400" />
                  Recent Form
                </h2>
                <TrendBadge trend={stats.form.trend} />
              </div>

              {stats.form.last5.length > 0 ? (
                <div className="space-y-3">
                  {stats.form.last5.map((match) => (
                    <Link
                      key={match.matchId}
                      href={`/dashboard/matches/${match.matchId}`}
                      className="flex items-center gap-4 p-3 bg-charcoal-700/30 rounded-lg hover:bg-charcoal-700/50 transition-colors"
                    >
                      <FormBadge result={match.result} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">vs {match.opponent}</p>
                        <p className="text-xs text-charcoal-500">
                          {new Date(match.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {match.goals > 0 && (
                          <span className="text-success-400 flex items-center gap-1">
                            <Target className="w-3 h-3" /> {match.goals}
                          </span>
                        )}
                        {match.assists > 0 && (
                          <span className="text-info-400 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {match.assists}
                          </span>
                        )}
                        <RatingBadge rating={match.rating} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-charcoal-500 text-center py-8">No recent matches</p>
              )}

              <div className="mt-4 pt-4 border-t border-charcoal-700/50 flex items-center justify-between">
                <span className="text-sm text-charcoal-400">Last 5 Average</span>
                <span className="text-lg font-bold text-white tabular-nums">
                  {stats.form.avgLast5.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Attributes */}
            <div className="bg-charcoal-800/50 backdrop-blur-sm rounded-xl p-6 border border-charcoal-700/50">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-400" />
                Attributes
              </h2>

              {stats.attributes ? (
                <div className="space-y-4">
                  <AttributeBar
                    label="Pace"
                    value={stats.attributes.pace}
                    icon={Wind}
                    color="text-success-400"
                  />
                  <AttributeBar
                    label="Shooting"
                    value={stats.attributes.shooting}
                    icon={Crosshair}
                    color="text-error-400"
                  />
                  <AttributeBar
                    label="Passing"
                    value={stats.attributes.passing}
                    icon={Target}
                    color="text-info-400"
                  />
                  <AttributeBar
                    label="Dribbling"
                    value={stats.attributes.dribbling}
                    icon={Flame}
                    color="text-purple-400"
                  />
                  <AttributeBar
                    label="Defending"
                    value={stats.attributes.defending}
                    icon={Shield}
                    color="text-warning-400"
                  />
                  <AttributeBar
                    label="Physical"
                    value={stats.attributes.physical}
                    icon={Heart}
                    color="text-charcoal-400"
                  />
                  <AttributeBar
                    label="Mental"
                    value={stats.attributes.mental}
                    icon={Brain}
                    color="text-purple-400"
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
                  <p className="text-charcoal-500">Play more matches to unlock attribute tracking</p>
                </div>
              )}
            </div>
          </div>

          {/* Career Totals */}
          <div className="mt-8 bg-charcoal-800/50 backdrop-blur-sm rounded-xl p-6 border border-charcoal-700/50">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-gold-400" />
              Career Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center p-4 bg-charcoal-700/30 rounded-lg">
                <p className="text-2xl font-bold text-white tabular-nums">{stats.careerTotals.matches}</p>
                <p className="text-sm text-charcoal-400">Matches</p>
              </div>
              <div className="text-center p-4 bg-charcoal-700/30 rounded-lg">
                <p className="text-2xl font-bold text-success-400 tabular-nums">{stats.careerTotals.goals}</p>
                <p className="text-sm text-charcoal-400">{statLabels.primaryStat}</p>
              </div>
              <div className="text-center p-4 bg-charcoal-700/30 rounded-lg">
                <p className="text-2xl font-bold text-info-400 tabular-nums">{stats.careerTotals.assists}</p>
                <p className="text-sm text-charcoal-400">{statLabels.secondaryStat}</p>
              </div>
              <div className="text-center p-4 bg-charcoal-700/30 rounded-lg">
                <p className="text-2xl font-bold text-white tabular-nums">
                  {Math.round(stats.careerTotals.minutes / 60)}
                </p>
                <p className="text-sm text-charcoal-400">Hours Played</p>
              </div>
              <div className="text-center p-4 bg-charcoal-700/30 rounded-lg">
                <p className="text-2xl font-bold text-success-400 tabular-nums">
                  {stats.careerTotals.cleanSheets}
                </p>
                <p className="text-sm text-charcoal-400">Clean Sheets</p>
              </div>
              <div className="text-center p-4 bg-charcoal-700/30 rounded-lg">
                <p className="text-2xl font-bold text-gold-400 tabular-nums">{stats.careerTotals.motm}</p>
                <p className="text-sm text-charcoal-400">MOTM</p>
              </div>
              <div className="text-center p-4 bg-charcoal-700/30 rounded-lg">
                <p className="text-2xl font-bold text-warning-400 tabular-nums">
                  {stats.careerTotals.yellowCards}
                </p>
                <p className="text-sm text-charcoal-400">Yellow Cards</p>
              </div>
              <div className="text-center p-4 bg-charcoal-700/30 rounded-lg">
                <p className="text-2xl font-bold text-error-400 tabular-nums">{stats.careerTotals.redCards}</p>
                <p className="text-sm text-charcoal-400">Red Cards</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
