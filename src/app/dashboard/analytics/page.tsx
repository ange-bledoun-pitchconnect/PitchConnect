// =============================================================================
// 📊 ANALYTICS DASHBOARD - Enterprise-Grade Implementation
// =============================================================================
// Path: /dashboard/analytics
// Access: COACH, MANAGER, ANALYST, CLUB_OWNER
// Features: Team performance, match stats, player insights, form analysis
// =============================================================================

import { Suspense } from 'react';
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
  Trophy,
  Target,
  Users,
  Calendar,
  ChevronRight,
  Activity,
  Shield,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ClubAnalytics {
  overview: {
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    cleanSheets: number;
    avgGoalsPerMatch: number;
    avgGoalsConcededPerMatch: number;
  };
  form: {
    last5: string[];
    last10: string[];
    currentStreak: {
      type: 'WIN' | 'DRAW' | 'LOSS' | 'UNBEATEN' | null;
      count: number;
    };
    homeForm: string[];
    awayForm: string[];
  };
  homeVsAway: {
    home: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
    };
    away: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
    };
  };
  topPerformers: {
    topScorers: Array<{
      playerId: string;
      playerName: string;
      goals: number;
      matches: number;
      goalsPerMatch: number;
    }>;
    topAssists: Array<{
      playerId: string;
      playerName: string;
      assists: number;
      matches: number;
      assistsPerMatch: number;
    }>;
    topRated: Array<{
      playerId: string;
      playerName: string;
      avgRating: number;
      matches: number;
    }>;
  };
  recentMatches: Array<{
    id: string;
    opponent: string;
    opponentLogo: string | null;
    isHome: boolean;
    score: string;
    result: 'W' | 'D' | 'L';
    date: string;
    competition: string | null;
  }>;
  monthlyTrends: Array<{
    month: string;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  }>;
}

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getAnalyticsData(userId: string): Promise<{
  clubs: Array<{ id: string; name: string; logo: string | null }>;
  selectedClub: { id: string; name: string; logo: string | null } | null;
  analytics: ClubAnalytics | null;
}> {
  // Get user's clubs (as member, manager, or owner)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clubMemberships: {
        where: { isActive: true },
        include: {
          club: {
            select: { id: true, name: true, logo: true },
          },
        },
      },
      managedClubs: {
        select: { id: true, name: true, logo: true },
      },
      ownedClubs: {
        select: { id: true, name: true, logo: true },
      },
    },
  });

  if (!user) {
    return { clubs: [], selectedClub: null, analytics: null };
  }

  // Combine all clubs user has access to
  const clubsMap = new Map<string, { id: string; name: string; logo: string | null }>();
  
  user.clubMemberships.forEach(m => clubsMap.set(m.club.id, m.club));
  user.managedClubs.forEach(c => clubsMap.set(c.id, c));
  user.ownedClubs.forEach(c => clubsMap.set(c.id, c));

  const clubs = Array.from(clubsMap.values());

  if (clubs.length === 0) {
    return { clubs: [], selectedClub: null, analytics: null };
  }

  // Use first club as default
  const selectedClub = clubs[0];

  // Fetch analytics for selected club
  const analytics = await fetchClubAnalytics(selectedClub.id);

  return { clubs, selectedClub, analytics };
}

async function fetchClubAnalytics(clubId: string): Promise<ClubAnalytics | null> {
  try {
    // Fetch matches for this club
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeClubId: clubId }, { awayClubId: clubId }],
        status: 'FINISHED',
      },
      include: {
        homeTeam: { select: { id: true, name: true, logo: true } },
        awayTeam: { select: { id: true, name: true, logo: true } },
        league: { select: { name: true } },
      },
      orderBy: { kickOffTime: 'desc' },
    });

    // Calculate stats
    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;
    let homeWins = 0, homeDraws = 0, homeLosses = 0, homeGoalsFor = 0, homeGoalsAgainst = 0;
    let awayWins = 0, awayDraws = 0, awayLosses = 0, awayGoalsFor = 0, awayGoalsAgainst = 0;
    const results: ('W' | 'D' | 'L')[] = [];
    const homeResults: ('W' | 'D' | 'L')[] = [];
    const awayResults: ('W' | 'D' | 'L')[] = [];

    const monthlyData = new Map<string, { matches: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }>();

    for (const match of matches) {
      const isHome = match.homeClubId === clubId;
      const teamGoals = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
      const opponentGoals = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
      
      let result: 'W' | 'D' | 'L';
      if (teamGoals > opponentGoals) result = 'W';
      else if (teamGoals < opponentGoals) result = 'L';
      else result = 'D';

      results.push(result);
      goalsFor += teamGoals;
      goalsAgainst += opponentGoals;

      if (opponentGoals === 0) cleanSheets++;

      if (result === 'W') wins++;
      else if (result === 'D') draws++;
      else losses++;

      if (isHome) {
        homeResults.push(result);
        homeGoalsFor += teamGoals;
        homeGoalsAgainst += opponentGoals;
        if (result === 'W') homeWins++;
        else if (result === 'D') homeDraws++;
        else homeLosses++;
      } else {
        awayResults.push(result);
        awayGoalsFor += teamGoals;
        awayGoalsAgainst += opponentGoals;
        if (result === 'W') awayWins++;
        else if (result === 'D') awayDraws++;
        else awayLosses++;
      }

      const monthKey = match.kickOffTime.toISOString().slice(0, 7);
      const monthData = monthlyData.get(monthKey) || { matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
      monthData.matches++;
      monthData.goalsFor += teamGoals;
      monthData.goalsAgainst += opponentGoals;
      if (result === 'W') monthData.wins++;
      else if (result === 'D') monthData.draws++;
      else monthData.losses++;
      monthlyData.set(monthKey, monthData);
    }

    const totalMatches = matches.length;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Calculate streak
    let streakType: 'WIN' | 'DRAW' | 'LOSS' | 'UNBEATEN' | null = null;
    let streakCount = 0;
    if (results.length > 0) {
      const first = results[0];
      streakCount = 1;
      for (let i = 1; i < results.length; i++) {
        if (results[i] === first) streakCount++;
        else break;
      }
      streakType = first === 'W' ? 'WIN' : first === 'D' ? 'DRAW' : 'LOSS';
    }

    // Get top performers
    const playerStats = await prisma.playerStatistic.findMany({
      where: {
        player: {
          teamPlayers: {
            some: {
              team: { clubId },
              isActive: true,
            },
          },
        },
      },
      include: {
        player: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const playerAggregates = new Map<string, { goals: number; assists: number; matches: number; totalRating: number; ratingCount: number; name: string }>();
    
    for (const stat of playerStats) {
      const existing = playerAggregates.get(stat.playerId) || {
        goals: 0, assists: 0, matches: 0, totalRating: 0, ratingCount: 0,
        name: `${stat.player.user.firstName} ${stat.player.user.lastName}`,
      };
      existing.goals += stat.goals;
      existing.assists += stat.assists;
      existing.matches += stat.matches;
      if (stat.averageRating) {
        existing.totalRating += stat.averageRating * stat.matches;
        existing.ratingCount += stat.matches;
      }
      playerAggregates.set(stat.playerId, existing);
    }

    const topScorers = Array.from(playerAggregates.entries())
      .map(([id, data]) => ({
        playerId: id,
        playerName: data.name,
        goals: data.goals,
        matches: data.matches,
        goalsPerMatch: data.matches > 0 ? Math.round((data.goals / data.matches) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);

    const topAssists = Array.from(playerAggregates.entries())
      .map(([id, data]) => ({
        playerId: id,
        playerName: data.name,
        assists: data.assists,
        matches: data.matches,
        assistsPerMatch: data.matches > 0 ? Math.round((data.assists / data.matches) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 5);

    const topRated = Array.from(playerAggregates.entries())
      .filter(([, data]) => data.ratingCount >= 3)
      .map(([id, data]) => ({
        playerId: id,
        playerName: data.name,
        avgRating: data.ratingCount > 0 ? Math.round((data.totalRating / data.ratingCount) * 10) / 10 : 0,
        matches: data.matches,
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    const recentMatches = matches.slice(0, 10).map((match) => {
      const isHome = match.homeClubId === clubId;
      const opponent = isHome ? match.awayTeam : match.homeTeam;
      const teamGoals = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
      const opponentGoals = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
      const score = `${teamGoals} - ${opponentGoals}`;
      
      let result: 'W' | 'D' | 'L';
      if (teamGoals > opponentGoals) result = 'W';
      else if (teamGoals < opponentGoals) result = 'L';
      else result = 'D';

      return {
        id: match.id,
        opponent: opponent.name,
        opponentLogo: opponent.logo,
        isHome,
        score,
        result,
        date: match.kickOffTime.toISOString(),
        competition: match.league?.name ?? null,
      };
    });

    const monthlyTrends = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, data]) => ({ month, ...data }));

    return {
      overview: {
        totalMatches,
        wins,
        draws,
        losses,
        winRate,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        cleanSheets,
        avgGoalsPerMatch: totalMatches > 0 ? Math.round((goalsFor / totalMatches) * 100) / 100 : 0,
        avgGoalsConcededPerMatch: totalMatches > 0 ? Math.round((goalsAgainst / totalMatches) * 100) / 100 : 0,
      },
      form: {
        last5: results.slice(0, 5),
        last10: results.slice(0, 10),
        currentStreak: { type: streakType, count: streakCount },
        homeForm: homeResults.slice(0, 5),
        awayForm: awayResults.slice(0, 5),
      },
      homeVsAway: {
        home: {
          played: homeWins + homeDraws + homeLosses,
          wins: homeWins,
          draws: homeDraws,
          losses: homeLosses,
          goalsFor: homeGoalsFor,
          goalsAgainst: homeGoalsAgainst,
        },
        away: {
          played: awayWins + awayDraws + awayLosses,
          wins: awayWins,
          draws: awayDraws,
          losses: awayLosses,
          goalsFor: awayGoalsFor,
          goalsAgainst: awayGoalsAgainst,
        },
      },
      topPerformers: { topScorers, topAssists, topRated },
      recentMatches,
      monthlyTrends,
    };
  } catch (error) {
    console.error('Error fetching club analytics:', error);
    return null;
  }
}

// =============================================================================
// COMPONENTS
// =============================================================================

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'blue' 
}: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-emerald-500/10 text-emerald-500',
    yellow: 'bg-amber-500/10 text-amber-500',
    red: 'bg-red-500/10 text-red-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : 
             trend === 'down' ? <ArrowDownRight className="h-4 w-4" /> : 
             <Minus className="h-4 w-4" />}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
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
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${colors[result]}`}>
      {result}
    </span>
  );
}

function FormDisplay({ results, label }: { results: string[]; label: string }) {
  return (
    <div>
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <div className="flex gap-1.5">
        {results.length > 0 ? (
          results.map((r, i) => <FormBadge key={i} result={r as 'W' | 'D' | 'L'} />)
        ) : (
          <span className="text-slate-500 text-sm">No matches</span>
        )}
      </div>
    </div>
  );
}

function StreakBadge({ streak }: { streak: { type: string | null; count: number } }) {
  if (!streak.type || streak.count === 0) return null;

  const colors = {
    WIN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    DRAW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOSS: 'bg-red-500/20 text-red-400 border-red-500/30',
    UNBEATEN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const labels = {
    WIN: 'Wins',
    DRAW: 'Draws',
    LOSS: 'Losses',
    UNBEATEN: 'Unbeaten',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colors[streak.type as keyof typeof colors]}`}>
      <Zap className="h-4 w-4" />
      <span className="font-medium">{streak.count} {labels[streak.type as keyof typeof labels]}</span>
    </div>
  );
}

function TopPerformerCard({ 
  rank, 
  name, 
  value, 
  subtitle 
}: { 
  rank: number;
  name: string;
  value: string | number;
  subtitle: string;
}) {
  const rankColors = ['text-amber-400', 'text-slate-300', 'text-amber-600'];

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-700/30 transition-colors">
      <div className={`text-lg font-bold ${rankColors[rank - 1] || 'text-slate-500'}`}>
        #{rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{name}</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function RecentMatchRow({ match }: { match: ClubAnalytics['recentMatches'][0] }) {
  const resultColors = {
    W: 'bg-emerald-500',
    D: 'bg-amber-500',
    L: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-700/30 transition-colors">
      <div className={`w-1 h-10 rounded-full ${resultColors[match.result]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{match.isHome ? 'vs' : '@'}</span>
          <span className="font-medium text-white truncate">{match.opponent}</span>
        </div>
        <p className="text-sm text-slate-400">
          {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          {match.competition && ` • ${match.competition}`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-white">{match.score}</p>
      </div>
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
          Join a club or team to access performance analytics. Analytics will appear here once you're part of a club.
        </p>
        <Link
          href="/dashboard/player/browse-teams"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Browse Teams
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { clubs, selectedClub, analytics } = await getAnalyticsData(session.user.id);

  if (!selectedClub || !analytics) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="h-7 w-7 text-blue-400" />
                Analytics
              </h1>
              <p className="text-slate-400 mt-1">Performance insights for {selectedClub.name}</p>
            </div>
            <div className="flex items-center gap-3">
              {clubs.length > 1 && (
                <select className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              )}
              <Link
                href="/dashboard/analytics/advanced"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                <Zap className="h-4 w-4" />
                Advanced AI
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Matches"
            value={analytics.overview.totalMatches}
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="Win Rate"
            value={`${analytics.overview.winRate}%`}
            subtitle={`${analytics.overview.wins}W ${analytics.overview.draws}D ${analytics.overview.losses}L`}
            icon={Trophy}
            trend={analytics.overview.winRate >= 50 ? 'up' : analytics.overview.winRate >= 30 ? 'neutral' : 'down'}
            color="green"
          />
          <StatCard
            title="Goals Scored"
            value={analytics.overview.goalsFor}
            subtitle={`${analytics.overview.avgGoalsPerMatch} per match`}
            icon={Target}
            color="purple"
          />
          <StatCard
            title="Goal Difference"
            value={analytics.overview.goalDifference > 0 ? `+${analytics.overview.goalDifference}` : analytics.overview.goalDifference}
            subtitle={`${analytics.overview.cleanSheets} clean sheets`}
            icon={Shield}
            trend={analytics.overview.goalDifference > 0 ? 'up' : analytics.overview.goalDifference < 0 ? 'down' : 'neutral'}
            color={analytics.overview.goalDifference > 0 ? 'green' : analytics.overview.goalDifference < 0 ? 'red' : 'yellow'}
          />
        </div>

        {/* Form & Streak */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Current Form
            </h2>
            <StreakBadge streak={analytics.form.currentStreak} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormDisplay results={analytics.form.last5} label="Last 5 Matches" />
            <FormDisplay results={analytics.form.homeForm} label="Home Form" />
            <FormDisplay results={analytics.form.awayForm} label="Away Form" />
          </div>
        </div>

        {/* Home vs Away */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🏠 Home Record
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Played</span>
                <span className="text-white font-medium">{analytics.homeVsAway.home.played}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Record</span>
                <span className="text-white font-medium">
                  {analytics.homeVsAway.home.wins}W {analytics.homeVsAway.home.draws}D {analytics.homeVsAway.home.losses}L
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Goals</span>
                <span className="text-white font-medium">
                  {analytics.homeVsAway.home.goalsFor} scored, {analytics.homeVsAway.home.goalsAgainst} conceded
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-4">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ 
                    width: `${analytics.homeVsAway.home.played > 0 
                      ? (analytics.homeVsAway.home.wins / analytics.homeVsAway.home.played) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              ✈️ Away Record
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Played</span>
                <span className="text-white font-medium">{analytics.homeVsAway.away.played}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Record</span>
                <span className="text-white font-medium">
                  {analytics.homeVsAway.away.wins}W {analytics.homeVsAway.away.draws}D {analytics.homeVsAway.away.losses}L
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Goals</span>
                <span className="text-white font-medium">
                  {analytics.homeVsAway.away.goalsFor} scored, {analytics.homeVsAway.away.goalsAgainst} conceded
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-4">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  style={{ 
                    width: `${analytics.homeVsAway.away.played > 0 
                      ? (analytics.homeVsAway.away.wins / analytics.homeVsAway.away.played) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers & Recent Matches */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Scorers */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-400" />
              Top Scorers
            </h3>
            <div className="space-y-1">
              {analytics.topPerformers.topScorers.length > 0 ? (
                analytics.topPerformers.topScorers.map((player, i) => (
                  <TopPerformerCard
                    key={player.playerId}
                    rank={i + 1}
                    name={player.playerName}
                    value={player.goals}
                    subtitle={`${player.goalsPerMatch} per match`}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Top Assists */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Top Assists
            </h3>
            <div className="space-y-1">
              {analytics.topPerformers.topAssists.length > 0 ? (
                analytics.topPerformers.topAssists.map((player, i) => (
                  <TopPerformerCard
                    key={player.playerId}
                    rank={i + 1}
                    name={player.playerName}
                    value={player.assists}
                    subtitle={`${player.assistsPerMatch} per match`}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Recent Matches */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              Recent Results
            </h3>
            <div className="space-y-1">
              {analytics.recentMatches.length > 0 ? (
                analytics.recentMatches.slice(0, 5).map((match) => (
                  <RecentMatchRow key={match.id} match={match} />
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No matches played yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}