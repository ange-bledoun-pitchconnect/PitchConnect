'use client';

// ============================================================================
// 🏆 PITCHCONNECT - Rankings Client Component v7.6.0
// ============================================================================
// Comprehensive team and player statistics with full 12-sport support
// ============================================================================

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Users,
  Calendar,
  ChevronRight,
  Award,
  Zap,
  Clock,
  AlertTriangle,
  BarChart3,
  Activity,
  Dribbble,
  Circle,
  Hexagon,
  Star,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Sport, SPORT_CONFIGS, getPositionsForSport, formatPosition } from '@/lib/sport-config';

// ============================================================================
// TYPES
// ============================================================================

interface RankingsClientProps {
  team: {
    id: string;
    name: string;
    club: {
      id: string;
      name: string;
      sport: Sport;
      logo?: string | null;
    };
    ageGroup?: string | null;
    gender?: string | null;
  };
  teamStats: TeamStats;
  playerRankings: Record<string, PlayerRanking[]>;
  leagueStandings: LeagueStandings | null;
  matchHistory: MatchResult[];
  sport: Sport;
}

interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  winRate: number;
  form: string[];
  cleanSheets: number;
  sportStats?: Record<string, number>;
}

interface PlayerRanking {
  id: string;
  name: string;
  avatarUrl: string | null;
  jerseyNumber: number | null;
  position: string | null;
  stats: Record<string, number>;
}

interface LeagueStandings {
  competitionId: string;
  competitionName: string;
  standings: StandingEntry[];
  teamPosition: number;
  totalTeams: number;
}

interface StandingEntry {
  teamId: string;
  team: { id: string; name: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface MatchResult {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: Date;
}

// ============================================================================
// SPORT-SPECIFIC CONFIGURATIONS
// ============================================================================

const SPORT_SCORING_LABELS: Record<Sport, { primary: string; secondary?: string }> = {
  FOOTBALL: { primary: 'Goals', secondary: 'Assists' },
  FUTSAL: { primary: 'Goals', secondary: 'Assists' },
  BEACH_FOOTBALL: { primary: 'Goals', secondary: 'Assists' },
  RUGBY: { primary: 'Tries', secondary: 'Conversions' },
  AMERICAN_FOOTBALL: { primary: 'Touchdowns', secondary: 'Field Goals' },
  BASKETBALL: { primary: 'Points', secondary: 'Rebounds' },
  CRICKET: { primary: 'Runs', secondary: 'Wickets' },
  HOCKEY: { primary: 'Goals', secondary: 'Assists' },
  NETBALL: { primary: 'Goals' },
  LACROSSE: { primary: 'Goals', secondary: 'Assists' },
  AUSTRALIAN_RULES: { primary: 'Goals', secondary: 'Behinds' },
  GAELIC_FOOTBALL: { primary: 'Goals', secondary: 'Points' },
};

const SPORT_RANKING_CATEGORIES: Record<Sport, { key: string; label: string; statKey: string; icon: typeof Trophy }[]> = {
  FOOTBALL: [
    { key: 'topScorers', label: 'Top Scorers', statKey: 'goals', icon: Target },
    { key: 'topAssists', label: 'Top Assists', statKey: 'assists', icon: Zap },
    { key: 'cleanSheets', label: 'Clean Sheets', statKey: 'cleanSheets', icon: Shield },
    { key: 'mostAppearances', label: 'Most Appearances', statKey: 'appearances', icon: Users },
    { key: 'disciplinary', label: 'Disciplinary', statKey: 'yellowCards', icon: AlertTriangle },
  ],
  RUGBY: [
    { key: 'topTries', label: 'Top Tries', statKey: 'tries', icon: Target },
    { key: 'topConversions', label: 'Top Conversions', statKey: 'conversions', icon: Zap },
    { key: 'mostAppearances', label: 'Most Appearances', statKey: 'appearances', icon: Users },
    { key: 'disciplinary', label: 'Disciplinary', statKey: 'yellowCards', icon: AlertTriangle },
  ],
  BASKETBALL: [
    { key: 'topScorers', label: 'Top Scorers', statKey: 'goals', icon: Target },
    { key: 'topRebounders', label: 'Top Rebounders', statKey: 'rebounds', icon: Activity },
    { key: 'topAssists', label: 'Top Assists', statKey: 'assists', icon: Zap },
    { key: 'mostAppearances', label: 'Most Games', statKey: 'appearances', icon: Users },
  ],
  CRICKET: [
    { key: 'topRunScorers', label: 'Top Run Scorers', statKey: 'runs', icon: Target },
    { key: 'topWicketTakers', label: 'Top Wicket Takers', statKey: 'wickets', icon: Award },
    { key: 'mostAppearances', label: 'Most Matches', statKey: 'appearances', icon: Users },
  ],
  AMERICAN_FOOTBALL: [
    { key: 'topTouchdowns', label: 'Top Touchdowns', statKey: 'touchdowns', icon: Target },
    { key: 'mostAppearances', label: 'Most Games', statKey: 'appearances', icon: Users },
    { key: 'disciplinary', label: 'Penalties', statKey: 'yellowCards', icon: AlertTriangle },
  ],
  NETBALL: [
    { key: 'topScorers', label: 'Top Scorers', statKey: 'goals', icon: Target },
    { key: 'mostAppearances', label: 'Most Games', statKey: 'appearances', icon: Users },
  ],
  HOCKEY: [
    { key: 'topScorers', label: 'Top Scorers', statKey: 'goals', icon: Target },
    { key: 'topAssists', label: 'Top Assists', statKey: 'assists', icon: Zap },
    { key: 'mostAppearances', label: 'Most Games', statKey: 'appearances', icon: Users },
  ],
  LACROSSE: [
    { key: 'topScorers', label: 'Top Scorers', statKey: 'goals', icon: Target },
    { key: 'topAssists', label: 'Top Assists', statKey: 'assists', icon: Zap },
    { key: 'mostAppearances', label: 'Most Games', statKey: 'appearances', icon: Users },
  ],
  AUSTRALIAN_RULES: [
    { key: 'topScorers', label: 'Top Scorers', statKey: 'goals', icon: Target },
    { key: 'mostAppearances', label: 'Most Games', statKey: 'appearances', icon: Users },
  ],
  GAELIC_FOOTBALL: [
    { key: 'topTries', label: 'Top Scores', statKey: 'tries', icon: Target },
    { key: 'mostAppearances', label: 'Most Games', statKey: 'appearances', icon: Users },
  ],
  FUTSAL: [
    { key: 'topScorers', label: 'Top Scorers', statKey: 'goals', icon: Target },
    { key: 'topAssists', label: 'Top Assists', statKey: 'assists', icon: Zap },
    { key: 'mostAppearances', label: 'Most Games', statKey: 'appearances', icon: Users },
  ],
  BEACH_FOOTBALL: [
    { key: 'topScorers', label: 'Top Scorers', statKey: 'goals', icon: Target },
    { key: 'topAssists', label: 'Top Assists', statKey: 'assists', icon: Zap },
    { key: 'mostAppearances', label: 'Most Games', statKey: 'appearances', icon: Users },
  ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function RankingsClient({
  team,
  teamStats,
  playerRankings,
  leagueStandings,
  matchHistory,
  sport,
}: RankingsClientProps) {
  const router = useRouter();
  const sportConfig = SPORT_CONFIGS[sport];
  const scoringLabels = SPORT_SCORING_LABELS[sport];
  const rankingCategories = SPORT_RANKING_CATEGORIES[sport] || SPORT_RANKING_CATEGORIES.FOOTBALL;

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'league'>('overview');
  const [selectedRankingCategory, setSelectedRankingCategory] = useState(rankingCategories[0]?.key || 'topScorers');

  // Get available categories based on what rankings exist
  const availableCategories = useMemo(() => {
    return rankingCategories.filter(
      (cat) => playerRankings[cat.key] && playerRankings[cat.key].length > 0
    );
  }, [rankingCategories, playerRankings]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {team.club.logo && (
                <Image
                  src={team.club.logo}
                  alt={team.club.name}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                  Rankings & Statistics
                </h1>
                <p className="text-sm text-zinc-400">
                  {team.name} • {team.club.name}
                  {team.ageGroup && ` • ${team.ageGroup}`}
                </p>
              </div>
            </div>
          </div>

          {/* Sport Badge */}
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border',
              `bg-gradient-to-r ${sportConfig.gradient}`,
              'border-white/10'
            )}
          >
            <sportConfig.icon className="h-5 w-5 text-white" />
            <span className="text-sm font-medium text-white">{sportConfig.name}</span>
          </div>
        </div>

        {/* Team Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            label="Played"
            value={teamStats.played}
            icon={Calendar}
            color="zinc"
          />
          <StatCard
            label="Wins"
            value={teamStats.wins}
            icon={Trophy}
            color="green"
          />
          <StatCard
            label="Draws"
            value={teamStats.draws}
            icon={Activity}
            color="yellow"
          />
          <StatCard
            label="Losses"
            value={teamStats.losses}
            icon={TrendingDown}
            color="red"
          />
          <StatCard
            label="Win Rate"
            value={`${teamStats.winRate}%`}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            label="Clean Sheets"
            value={teamStats.cleanSheets}
            icon={Shield}
            color="purple"
          />
        </div>

        {/* Form & Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-zinc-400" />
              Recent Form
            </h3>
            <div className="flex items-center gap-2">
              {teamStats.form.length > 0 ? (
                teamStats.form.map((result, index) => (
                  <div
                    key={index}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm',
                      result === 'W' && 'bg-green-500',
                      result === 'L' && 'bg-red-500',
                      result === 'D' && 'bg-zinc-600'
                    )}
                  >
                    {result}
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-sm">No recent matches</p>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-4">
              Last {teamStats.form.length} matches
            </p>
          </div>

          {/* Goals Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-zinc-400" />
              {scoringLabels.primary} Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Scored</span>
                <span className="text-2xl font-bold text-green-400">
                  {teamStats.goalsFor}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Conceded</span>
                <span className="text-2xl font-bold text-red-400">
                  {teamStats.goalsAgainst}
                </span>
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Difference</span>
                  <span
                    className={cn(
                      'text-2xl font-bold',
                      teamStats.goalDifference > 0 && 'text-green-400',
                      teamStats.goalDifference < 0 && 'text-red-400',
                      teamStats.goalDifference === 0 && 'text-zinc-400'
                    )}
                  >
                    {teamStats.goalDifference > 0 ? '+' : ''}
                    {teamStats.goalDifference}
                  </span>
                </div>
              </div>

              {/* Sport-specific stats */}
              {teamStats.sportStats && (
                <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 gap-3">
                  {Object.entries(teamStats.sportStats).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 capitalize">{key}</span>
                      <span className="text-sm font-medium text-white">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px',
              activeTab === 'overview'
                ? 'text-green-400 border-green-500'
                : 'text-zinc-400 border-transparent hover:text-white'
            )}
          >
            Player Rankings
          </button>
          {leagueStandings && (
            <button
              onClick={() => setActiveTab('league')}
              className={cn(
                'px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px',
                activeTab === 'league'
                  ? 'text-green-400 border-green-500'
                  : 'text-zinc-400 border-transparent hover:text-white'
              )}
            >
              League Table
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Category Selector */}
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <button
                    key={category.key}
                    onClick={() => setSelectedRankingCategory(category.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      selectedRankingCategory === category.key
                        ? 'bg-green-500 text-white'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    )}
                  >
                    <CategoryIcon className="h-4 w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>

            {/* Rankings Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <h3 className="font-medium text-white">
                  {availableCategories.find((c) => c.key === selectedRankingCategory)?.label || 'Rankings'}
                </h3>
              </div>

              {!playerRankings[selectedRankingCategory]?.length ? (
                <div className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-500">No statistics available yet</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {playerRankings[selectedRankingCategory].map((player, index) => (
                    <RankingRow
                      key={player.id}
                      rank={index + 1}
                      player={player}
                      category={availableCategories.find((c) => c.key === selectedRankingCategory)}
                      teamId={team.id}
                      clubId={team.club.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'league' && leagueStandings && (
          <div className="space-y-6">
            {/* League Position Highlight */}
            <div
              className={cn(
                'rounded-xl p-6 text-white',
                `bg-gradient-to-r ${sportConfig.gradient}`
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">{leagueStandings.competitionName}</p>
                  <p className="text-4xl font-bold mt-1">
                    {leagueStandings.teamPosition}
                    <span className="text-lg font-normal text-white/70">
                      /{leagueStandings.totalTeams}
                    </span>
                  </p>
                  <p className="text-sm text-white/70 mt-1">Current Position</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{teamStats.points}</p>
                  <p className="text-sm text-white/70">Points</p>
                </div>
              </div>
            </div>

            {/* League Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                        Pos
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                        Team
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                        P
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                        W
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                        D
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                        L
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                        GF
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                        GA
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                        GD
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {leagueStandings.standings.map((entry, index) => (
                      <tr
                        key={entry.teamId}
                        className={cn(
                          'hover:bg-zinc-800/50 transition-colors',
                          entry.teamId === team.id && 'bg-green-500/10'
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-white">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-sm',
                              entry.teamId === team.id
                                ? 'font-bold text-green-400'
                                : 'text-white'
                            )}
                          >
                            {entry.team.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-zinc-400">
                          {entry.played}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-zinc-400">
                          {entry.won}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-zinc-400">
                          {entry.drawn}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-zinc-400">
                          {entry.lost}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-zinc-400">
                          {entry.goalsFor}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-zinc-400">
                          {entry.goalsAgainst}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={cn(
                              entry.goalDifference > 0 && 'text-green-400',
                              entry.goalDifference < 0 && 'text-red-400',
                              entry.goalDifference === 0 && 'text-zinc-400'
                            )}
                          >
                            {entry.goalDifference > 0 ? '+' : ''}
                            {entry.goalDifference}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-white">
                          {entry.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sport Metrics Info */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <sportConfig.icon className="h-4 w-4" />
            {sportConfig.name} Metrics
          </h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 text-xs bg-zinc-800 text-zinc-300 rounded-full">
              {scoringLabels.primary}
            </span>
            {scoringLabels.secondary && (
              <span className="px-3 py-1 text-xs bg-zinc-800 text-zinc-300 rounded-full">
                {scoringLabels.secondary}
              </span>
            )}
            <span className="px-3 py-1 text-xs bg-zinc-800 text-zinc-300 rounded-full">
              Appearances
            </span>
            <span className="px-3 py-1 text-xs bg-zinc-800 text-zinc-300 rounded-full">
              Minutes Played
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'zinc',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'zinc' | 'green' | 'yellow' | 'red' | 'blue' | 'purple';
}) {
  const colorClasses = {
    zinc: 'bg-zinc-800/50 text-zinc-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RANKING ROW COMPONENT
// ============================================================================

function RankingRow({
  rank,
  player,
  category,
  teamId,
  clubId,
}: {
  rank: number;
  player: PlayerRanking;
  category?: { key: string; label: string; statKey: string };
  teamId: string;
  clubId: string;
}) {
  // Get the value to display based on category
  const getValue = () => {
    if (!category) return player.stats.goals || 0;

    const statKey = category.statKey;

    // Handle special cases
    if (category.key === 'disciplinary') {
      return `${player.stats.yellowCards || 0}Y / ${player.stats.redCards || 0}R`;
    }
    if (category.key === 'mostMinutes') {
      return `${player.stats.minutesPlayed || 0}'`;
    }

    return player.stats[statKey] || 0;
  };

  const getRankBadge = () => {
    if (rank === 1)
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (rank === 2)
      return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
    if (rank === 3)
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  return (
    <Link
      href={`/dashboard/clubs/${clubId}/teams/${teamId}/players/${player.id}`}
      className="flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors group"
    >
      {/* Rank */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border',
          getRankBadge()
        )}
      >
        {rank}
      </div>

      {/* Player Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {player.avatarUrl ? (
          <Image
            src={player.avatarUrl}
            alt={player.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-medium text-zinc-400">
            {player.jerseyNumber || '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-white truncate">{player.name}</p>
          <p className="text-sm text-zinc-500 truncate">
            #{player.jerseyNumber || '—'} •{' '}
            {player.position ? formatPosition(player.position) : 'No position'}
          </p>
        </div>
      </div>

      {/* Value */}
      <div className="text-right">
        <p className="text-xl font-bold text-white">{getValue()}</p>
      </div>

      <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
    </Link>
  );
}
