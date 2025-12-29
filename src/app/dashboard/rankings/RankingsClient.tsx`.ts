'use client';

// ============================================================================
// 🏆 PITCHCONNECT - RANKINGS CLIENT COMPONENT
// ============================================================================
// Comprehensive team and player statistics with interactive charts
// ============================================================================

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { Sport, Position } from '@prisma/client';
import {
  getSportConfig,
  SPORT_RANKING_METRICS,
  formatPositionName,
} from '@/lib/sport-config';

// ============================================================================
// TYPES
// ============================================================================

interface RankingsClientProps {
  team: {
    id: string;
    name: string;
    club: { id: string; name: string; sport: Sport; settings: any };
    season: { id: string; name: string; startDate: Date; endDate: Date } | null;
  };
  teamStats: TeamStats;
  playerRankings: PlayerRankings;
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
}

interface PlayerRankings {
  topScorers: PlayerRanking[];
  topAssists: PlayerRanking[];
  mostAppearances: PlayerRanking[];
  mostMinutes: PlayerRanking[];
  disciplinary: PlayerRanking[];
  [key: string]: PlayerRanking[];
}

interface PlayerRanking {
  id: string;
  name: string;
  avatarUrl: string | null;
  jerseyNumber: number | null;
  position: Position | null;
  stats: any;
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
  const sportConfig = getSportConfig(sport);
  const sportMetrics = SPORT_RANKING_METRICS[sport] || [];

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'league'>('overview');
  const [selectedRankingCategory, setSelectedRankingCategory] = useState('topScorers');

  // Get scoring label based on sport
  const getScoringLabel = () => {
    switch (sport) {
      case 'RUGBY':
        return 'Tries';
      case 'AMERICAN_FOOTBALL':
        return 'Touchdowns';
      case 'CRICKET':
        return 'Runs';
      case 'BASKETBALL':
        return 'Points';
      default:
        return 'Goals';
    }
  };

  // Available ranking categories
  const rankingCategories = useMemo(() => {
    const categories = [
      { key: 'topScorers', label: `Top ${getScoringLabel()}`, icon: Target },
      { key: 'topAssists', label: 'Top Assists', icon: Zap },
      { key: 'mostAppearances', label: 'Most Appearances', icon: Users },
      { key: 'mostMinutes', label: 'Most Minutes', icon: Clock },
      { key: 'disciplinary', label: 'Disciplinary', icon: AlertTriangle },
    ];

    // Add sport-specific categories
    if (playerRankings.topTries) {
      categories.push({ key: 'topTries', label: 'Top Tries', icon: Target });
    }
    if (playerRankings.topRebounders) {
      categories.push({ key: 'topRebounders', label: 'Top Rebounders', icon: Activity });
    }
    if (playerRankings.topWickets) {
      categories.push({ key: 'topWickets', label: 'Top Wickets', icon: Target });
    }

    return categories;
  }, [playerRankings, sport]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rankings & Statistics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {team.name} • {team.season?.name || 'Current Season'}
          </p>
        </div>

        {/* Season Selector would go here */}
      </div>

      {/* Team Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          label="Played"
          value={teamStats.played}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          label="Wins"
          value={teamStats.wins}
          icon={<Trophy className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Draws"
          value={teamStats.draws}
          icon={<Activity className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          label="Losses"
          value={teamStats.losses}
          icon={<TrendingDown className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          label="Win Rate"
          value={`${teamStats.winRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Clean Sheets"
          value={teamStats.cleanSheets}
          icon={<Shield className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Form & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Form
          </h3>
          <div className="flex items-center gap-2">
            {teamStats.form.map((result, index) => (
              <div
                key={index}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  result === 'W'
                    ? 'bg-green-500'
                    : result === 'L'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
                }`}
              >
                {result}
              </div>
            ))}
            {teamStats.form.length === 0 && (
              <p className="text-gray-500">No recent matches</p>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Last {teamStats.form.length} matches
          </p>
        </div>

        {/* Goals Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {getScoringLabel()} Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Scored</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {teamStats.goalsFor}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Conceded</span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {teamStats.goalsAgainst}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Difference</span>
                <span
                  className={`text-2xl font-bold ${
                    teamStats.goalDifference > 0
                      ? 'text-green-600 dark:text-green-400'
                      : teamStats.goalDifference < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {teamStats.goalDifference > 0 ? '+' : ''}
                  {teamStats.goalDifference}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Player Rankings
        </button>
        {leagueStandings && (
          <button
            onClick={() => setActiveTab('league')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'league'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
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
            {rankingCategories.map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedRankingCategory(category.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedRankingCategory === category.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </button>
            ))}
          </div>

          {/* Rankings Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {rankingCategories.find((c) => c.key === selectedRankingCategory)?.label}
              </h3>
            </div>

            {playerRankings[selectedRankingCategory]?.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No statistics available yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {playerRankings[selectedRankingCategory]?.map((player, index) => (
                  <RankingRow
                    key={player.id}
                    rank={index + 1}
                    player={player}
                    category={selectedRankingCategory}
                    sport={sport}
                    clubId={team.club.id}
                    teamId={team.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'league' && leagueStandings && (
        <div className="space-y-4">
          {/* League Position Highlight */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      P
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      W
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      D
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      L
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      GF
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      GA
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      GD
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pts
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leagueStandings.standings.map((entry, index) => (
                    <tr
                      key={entry.teamId}
                      className={`${
                        entry.teamId === team.id
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm ${
                            entry.teamId === team.id
                              ? 'font-bold text-primary-600 dark:text-primary-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {entry.team.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        {entry.played}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        {entry.won}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        {entry.drawn}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        {entry.lost}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        {entry.goalsFor}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        {entry.goalsAgainst}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span
                          className={
                            entry.goalDifference > 0
                              ? 'text-green-600'
                              : entry.goalDifference < 0
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }
                        >
                          {entry.goalDifference > 0 ? '+' : ''}
                          {entry.goalDifference}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-gray-900 dark:text-white">
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

      {/* Sport-Specific Metrics Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
          {sportConfig.name} Metrics
        </h4>
        <div className="flex flex-wrap gap-2">
          {sportMetrics.map((metric) => (
            <span
              key={metric.key}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full flex items-center gap-1"
            >
              {metric.icon} {metric.label}
            </span>
          ))}
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
  icon,
  color = 'gray',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'gray' | 'green' | 'yellow' | 'red' | 'blue' | 'purple';
}) {
  const colorClasses = {
    gray: 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
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
  sport,
  clubId,
  teamId,
}: {
  rank: number;
  player: PlayerRanking;
  category: string;
  sport: Sport;
  clubId: string;
  teamId: string;
}) {
  // Get the value to display based on category
  const getValue = () => {
    switch (category) {
      case 'topScorers':
        return player.stats.goals || 0;
      case 'topAssists':
        return player.stats.assists || 0;
      case 'mostAppearances':
        return player.stats.appearances || 0;
      case 'mostMinutes':
        return `${player.stats.minutesPlayed || 0}'`;
      case 'disciplinary':
        return `${player.stats.yellowCards || 0}Y / ${player.stats.redCards || 0}R`;
      case 'topTries':
        return player.stats.tries || 0;
      case 'topRebounders':
        return player.stats.rebounds || 0;
      case 'topWickets':
        return player.stats.wickets || 0;
      default:
        return 0;
    }
  };

  const getRankBadge = () => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (rank === 2) return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <Link
      href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}/players/${player.id}`}
      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      {/* Rank */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadge()}`}>
        {rank}
      </div>

      {/* Player Info */}
      <div className="flex items-center gap-3 flex-1">
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium">
            {player.jerseyNumber || '?'}
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{player.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            #{player.jerseyNumber || '—'} •{' '}
            {player.position ? formatPositionName(player.position) : 'No position'}
          </p>
        </div>
      </div>

      {/* Value */}
      <div className="text-right">
        <p className="text-xl font-bold text-gray-900 dark:text-white">{getValue()}</p>
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400" />
    </Link>
  );
}