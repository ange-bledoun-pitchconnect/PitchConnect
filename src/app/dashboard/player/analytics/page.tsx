// =============================================================================
// 📊 PLAYER ANALYTICS - Personal Performance Dashboard
// =============================================================================
// Path: /dashboard/player/analytics
// Access: Players viewing their own stats
// Features: Personal stats, form, career totals, attributes
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
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
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface PlayerStats {
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
    matches: number;
    goals: number;
    assists: number;
    minutes: number;
    yellowCards: number;
    redCards: number;
    avgRating: number;
    cleanSheets: number;
  };
  careerTotals: {
    matches: number;
    goals: number;
    assists: number;
    minutes: number;
    yellowCards: number;
    redCards: number;
  };
  form: {
    last5: Array<{
      matchId: string;
      opponent: string;
      date: string;
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
}

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getPlayerAnalytics(userId: string): Promise<PlayerStats | null> {
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
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          match: {
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!player) return null;

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

  // Current season stats (simplified - use aggregate stats)
  const aggregateStats = player.aggregateStats;
  const currentSeason = {
    matches: aggregateStats?.totalMatches ?? 0,
    goals: aggregateStats?.totalGoals ?? 0,
    assists: aggregateStats?.totalAssists ?? 0,
    minutes: aggregateStats?.totalMinutes ?? 0,
    yellowCards: aggregateStats?.totalYellowCards ?? 0,
    redCards: aggregateStats?.totalRedCards ?? 0,
    avgRating: aggregateStats?.avgRating ?? 0,
    cleanSheets: aggregateStats?.totalCleanSheets ?? 0,
  };

  // Career totals (same as aggregate for now)
  const careerTotals = {
    matches: aggregateStats?.totalMatches ?? 0,
    goals: aggregateStats?.totalGoals ?? 0,
    assists: aggregateStats?.totalAssists ?? 0,
    minutes: aggregateStats?.totalMinutes ?? 0,
    yellowCards: aggregateStats?.totalYellowCards ?? 0,
    redCards: aggregateStats?.totalRedCards ?? 0,
  };

  // Form from last 5 matches
  const last5Stats = player.statistics.slice(0, 5);
  const last5 = last5Stats.map(stat => {
    const isHome = stat.match.homeClubId === stat.teamId;
    const opponent = isHome ? stat.match.awayTeam.name : stat.match.homeTeam.name;
    const teamScore = isHome ? stat.match.homeScore : stat.match.awayScore;
    const opponentScore = isHome ? stat.match.awayScore : stat.match.homeScore;
    
    let result: 'W' | 'D' | 'L' = 'D';
    if (teamScore !== null && opponentScore !== null) {
      if (teamScore > opponentScore) result = 'W';
      else if (teamScore < opponentScore) result = 'L';
    }

    return {
      matchId: stat.matchId,
      opponent,
      date: stat.match.kickOffTime.toISOString(),
      rating: stat.rating ?? 0,
      goals: stat.goals,
      assists: stat.assists,
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
  const attributes = analytics ? {
    pace: analytics.pace ?? 0,
    shooting: analytics.shooting ?? 0,
    passing: analytics.passing ?? 0,
    dribbling: analytics.dribbling ?? 0,
    defending: analytics.defending ?? 0,
    physical: analytics.physical ?? 0,
    mental: analytics.mental ?? 0,
  } : null;

  return {
    profile: {
      name: `${player.user.firstName} ${player.user.lastName}`,
      position: player.primaryPosition,
      age,
      height: player.height,
      weight: player.weight,
      preferredFoot: player.preferredFoot,
      nationality: player.user.nationality,
      overallRating: player.overallRating ?? 0,
      formRating: player.formRating ?? 0,
    },
    currentSeason,
    careerTotals,
    form: { last5, trend, avgLast5 },
    attributes,
  };
}

// =============================================================================
// COMPONENTS
// =============================================================================

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  subtitle,
  color = 'blue' 
}: { 
  icon: React.ElementType;
  value: string | number;
  label: string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    yellow: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function AttributeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = {
    W: 'bg-emerald-500 text-white',
    D: 'bg-amber-500 text-white',
    L: 'bg-red-500 text-white',
  };

  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${colors[result]}`}>
      {result}
    </span>
  );
}

function TrendBadge({ trend }: { trend: 'UP' | 'DOWN' | 'STABLE' }) {
  const config = {
    UP: { icon: TrendingUp, color: 'text-emerald-400', label: 'Improving' },
    DOWN: { icon: TrendingDown, color: 'text-red-400', label: 'Declining' },
    STABLE: { icon: Minus, color: 'text-slate-400', label: 'Stable' },
  };

  const { icon: Icon, color, label } = config[trend];

  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-slate-800/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <BarChart3 className="h-12 w-12 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">No Analytics Available</h1>
        <p className="text-slate-400 mb-8">
          Your performance analytics will appear here once you start playing matches.
        </p>
        <Link
          href="/dashboard/player"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default async function PlayerAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const stats = await getPlayerAnalytics(session.user.id);

  if (!stats) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="h-7 w-7 text-blue-400" />
                My Analytics
              </h1>
              <p className="text-slate-400 mt-1">{stats.profile.name} • {stats.profile.position || 'Position TBD'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{stats.profile.overallRating.toFixed(1)}</p>
                <p className="text-sm text-slate-400">Overall Rating</p>
              </div>
              <div className="w-px h-12 bg-slate-700" />
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-400">{stats.profile.formRating.toFixed(1)}</p>
                <p className="text-sm text-slate-400">Current Form</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Season Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Trophy} value={stats.currentSeason.matches} label="Matches" color="blue" />
          <StatCard icon={Target} value={stats.currentSeason.goals} label="Goals" color="green" />
          <StatCard icon={Users} value={stats.currentSeason.assists} label="Assists" color="purple" />
          <StatCard icon={Timer} value={Math.round(stats.currentSeason.minutes / 90)} label="90s Played" color="blue" />
          <StatCard icon={Star} value={stats.currentSeason.avgRating.toFixed(1)} label="Avg Rating" color="yellow" />
          <StatCard icon={Shield} value={stats.currentSeason.cleanSheets} label="Clean Sheets" color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                Recent Form
              </h2>
              <TrendBadge trend={stats.form.trend} />
            </div>

            {stats.form.last5.length > 0 ? (
              <div className="space-y-3">
                {stats.form.last5.map((match, i) => (
                  <div key={match.matchId} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                    <FormBadge result={match.result} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">vs {match.opponent}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {match.goals > 0 && (
                        <span className="text-emerald-400">{match.goals} ⚽</span>
                      )}
                      {match.assists > 0 && (
                        <span className="text-blue-400">{match.assists} 🅰️</span>
                      )}
                      <span className={`font-bold ${
                        match.rating >= 7 ? 'text-emerald-400' : 
                        match.rating >= 6 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {match.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No recent matches</p>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-sm text-slate-400">Last 5 Average</span>
              <span className="text-lg font-bold text-white">{stats.form.avgLast5.toFixed(1)}</span>
            </div>
          </div>

          {/* Attributes */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-400" />
              Attributes
            </h2>

            {stats.attributes ? (
              <div className="space-y-4">
                <AttributeBar label="Pace" value={stats.attributes.pace} color="bg-gradient-to-r from-green-500 to-emerald-400" />
                <AttributeBar label="Shooting" value={stats.attributes.shooting} color="bg-gradient-to-r from-red-500 to-orange-400" />
                <AttributeBar label="Passing" value={stats.attributes.passing} color="bg-gradient-to-r from-blue-500 to-cyan-400" />
                <AttributeBar label="Dribbling" value={stats.attributes.dribbling} color="bg-gradient-to-r from-purple-500 to-pink-400" />
                <AttributeBar label="Defending" value={stats.attributes.defending} color="bg-gradient-to-r from-amber-500 to-yellow-400" />
                <AttributeBar label="Physical" value={stats.attributes.physical} color="bg-gradient-to-r from-slate-500 to-slate-400" />
                <AttributeBar label="Mental" value={stats.attributes.mental} color="bg-gradient-to-r from-indigo-500 to-violet-400" />
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                Play more matches to unlock attribute tracking
              </p>
            )}
          </div>
        </div>

        {/* Career Totals */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            Career Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-slate-700/30 rounded-lg">
              <p className="text-2xl font-bold text-white">{stats.careerTotals.matches}</p>
              <p className="text-sm text-slate-400">Matches</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-lg">
              <p className="text-2xl font-bold text-emerald-400">{stats.careerTotals.goals}</p>
              <p className="text-sm text-slate-400">Goals</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-lg">
              <p className="text-2xl font-bold text-blue-400">{stats.careerTotals.assists}</p>
              <p className="text-sm text-slate-400">Assists</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-lg">
              <p className="text-2xl font-bold text-white">{Math.round(stats.careerTotals.minutes / 60)}</p>
              <p className="text-sm text-slate-400">Hours Played</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-lg">
              <p className="text-2xl font-bold text-amber-400">{stats.careerTotals.yellowCards}</p>
              <p className="text-sm text-slate-400">Yellow Cards</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-lg">
              <p className="text-2xl font-bold text-red-400">{stats.careerTotals.redCards}</p>
              <p className="text-sm text-slate-400">Red Cards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}