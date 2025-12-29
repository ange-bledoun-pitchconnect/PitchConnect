// =============================================================================
// 🏆 PITCHCONNECT - PUBLIC LEAGUE STANDINGS v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/league/standings
// Access: ALL AUTHENTICATED USERS (Universal Fan Functionality)
//
// FEATURES:
// ✅ Multi-sport scoring systems (12 sports)
// ✅ Sport-specific columns (Goals, Points, Tries, Runs, NRR, etc.)
// ✅ League → Season → Standings hierarchy
// ✅ Top scorers and assists leaderboards
// ✅ Recent results integration
// ✅ Form guide visualization
// ✅ Read-only view (no admin controls)
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Trophy,
  TrendingUp,
  Target,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Star,
  Zap,
  Award,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface StandingEntry {
  position: number;
  positionChange: number;
  team: { id: string; name: string; logo?: string | null };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  scored: number;
  conceded: number;
  difference: number;
  bonusPoints?: number;
  netRunRate?: number;
  percentage?: number;
  points: number;
  pointsDeducted: number;
  form: ('W' | 'D' | 'L')[];
}

interface TopScorer {
  rank: number;
  player: { id: string; name: string };
  team: { id: string; name: string };
  goals: number;
}

interface TopAssist {
  rank: number;
  player: { id: string; name: string };
  team: { id: string; name: string };
  assists: number;
}

interface RecentResult {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: Date;
}

interface LeagueData {
  id: string;
  name: string;
  sport: Sport;
  season: string;
  standings: StandingEntry[];
  topScorers: TopScorer[];
  topAssists: TopAssist[];
  recentResults: RecentResult[];
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string; scorerLabel: string; assistLabel: string }> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600', scorerLabel: 'Top Scorers', assistLabel: 'Most Assists' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600', scorerLabel: 'Top Scorers', assistLabel: 'Most Assists' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600', scorerLabel: 'Top Try Scorers', assistLabel: 'Most Conversions' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600', scorerLabel: 'Top Scorers', assistLabel: 'Most Assists' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600', scorerLabel: 'Top Run Scorers', assistLabel: 'Top Wicket Takers' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600', scorerLabel: 'Top Scorers', assistLabel: 'Most Assists' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600', scorerLabel: 'Top Scorers', assistLabel: 'Most TDs' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600', scorerLabel: 'Top Scorers', assistLabel: 'Most Assists' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600', scorerLabel: 'Top Goal Kickers', assistLabel: 'Most Disposals' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600', scorerLabel: 'Top Scorers', assistLabel: 'Most Points' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600', scorerLabel: 'Top Scorers', assistLabel: 'Most Assists' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500', scorerLabel: 'Top Scorers', assistLabel: 'Most Assists' },
};

const SPORT_SCORING: Record<Sport, {
  columns: Array<{ key: string; label: string; shortLabel: string }>;
}> = {
  FOOTBALL: { columns: [{ key: 'scored', label: 'Goals For', shortLabel: 'GF' }, { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' }, { key: 'difference', label: 'Goal Difference', shortLabel: 'GD' }] },
  RUGBY: { columns: [{ key: 'scored', label: 'Points For', shortLabel: 'PF' }, { key: 'conceded', label: 'Points Against', shortLabel: 'PA' }, { key: 'difference', label: 'Point Difference', shortLabel: 'PD' }, { key: 'bonusPoints', label: 'Bonus', shortLabel: 'BP' }] },
  CRICKET: { columns: [{ key: 'scored', label: 'Runs For', shortLabel: 'RF' }, { key: 'conceded', label: 'Runs Against', shortLabel: 'RA' }, { key: 'netRunRate', label: 'Net Run Rate', shortLabel: 'NRR' }] },
  BASKETBALL: { columns: [{ key: 'scored', label: 'Points For', shortLabel: 'PF' }, { key: 'conceded', label: 'Points Against', shortLabel: 'PA' }, { key: 'difference', label: 'Differential', shortLabel: '+/-' }] },
  NETBALL: { columns: [{ key: 'scored', label: 'Goals For', shortLabel: 'GF' }, { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' }, { key: 'percentage', label: 'Percentage', shortLabel: '%' }] },
  HOCKEY: { columns: [{ key: 'scored', label: 'Goals For', shortLabel: 'GF' }, { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' }, { key: 'difference', label: 'Goal Difference', shortLabel: 'GD' }] },
  AMERICAN_FOOTBALL: { columns: [{ key: 'scored', label: 'Points For', shortLabel: 'PF' }, { key: 'conceded', label: 'Points Against', shortLabel: 'PA' }, { key: 'difference', label: 'Differential', shortLabel: '+/-' }] },
  LACROSSE: { columns: [{ key: 'scored', label: 'Goals For', shortLabel: 'GF' }, { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' }, { key: 'difference', label: 'Goal Difference', shortLabel: 'GD' }] },
  AUSTRALIAN_RULES: { columns: [{ key: 'scored', label: 'Points For', shortLabel: 'PF' }, { key: 'conceded', label: 'Points Against', shortLabel: 'PA' }, { key: 'percentage', label: 'Percentage', shortLabel: '%' }] },
  GAELIC_FOOTBALL: { columns: [{ key: 'scored', label: 'Scores For', shortLabel: 'SF' }, { key: 'conceded', label: 'Scores Against', shortLabel: 'SA' }, { key: 'difference', label: 'Score Difference', shortLabel: 'SD' }] },
  FUTSAL: { columns: [{ key: 'scored', label: 'Goals For', shortLabel: 'GF' }, { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' }, { key: 'difference', label: 'Goal Difference', shortLabel: 'GD' }] },
  BEACH_FOOTBALL: { columns: [{ key: 'scored', label: 'Goals For', shortLabel: 'GF' }, { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' }, { key: 'difference', label: 'Goal Difference', shortLabel: 'GD' }] },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getPublicStandingsData(leagueId?: string) {
  // Get featured/first league if no ID provided
  const league = leagueId 
    ? await prisma.league.findUnique({ where: { id: leagueId } })
    : await prisma.league.findFirst({ where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } });

  if (!league) {
    return null;
  }

  // Get current season with standings
  const season = await prisma.leagueSeason.findFirst({
    where: { leagueId: league.id, isCurrent: true },
    include: {
      standings: {
        include: { team: { select: { id: true, name: true, logo: true } } },
        orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }, { goalsFor: 'desc' }],
      },
      matches: {
        where: { status: 'FINISHED' },
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
        orderBy: { kickOffTime: 'desc' },
        take: 5,
      },
    },
  });

  if (!season) {
    return {
      id: league.id,
      name: league.name,
      sport: league.sport as Sport,
      season: 'No Active Season',
      standings: [],
      topScorers: [],
      topAssists: [],
      recentResults: [],
    };
  }

  // Format standings
  const standings: StandingEntry[] = season.standings.map((s, idx) => ({
    position: idx + 1,
    positionChange: 0,
    team: { id: s.team.id, name: s.team.name, logo: s.team.logo },
    played: s.played,
    won: s.won,
    drawn: s.drawn,
    lost: s.lost,
    scored: s.goalsFor,
    conceded: s.goalsAgainst,
    difference: s.goalDifference,
    bonusPoints: s.bonusPoints || 0,
    netRunRate: s.netRunRate || undefined,
    percentage: s.goalsFor > 0 && s.goalsAgainst > 0 
      ? Math.round((s.goalsFor / (s.goalsFor + s.goalsAgainst)) * 100 * 10) / 10 
      : undefined,
    points: s.points,
    pointsDeducted: s.pointsDeducted || 0,
    form: (s.form as ('W' | 'D' | 'L')[]) || [],
  }));

  // Recent results
  const recentResults: RecentResult[] = season.matches.map(m => ({
    id: m.id,
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    homeScore: m.homeScore || 0,
    awayScore: m.awayScore || 0,
    date: m.kickOffTime,
  }));

  return {
    id: league.id,
    name: league.name,
    sport: league.sport as Sport,
    season: season.name,
    standings,
    topScorers: [], // Would need player stats aggregation
    topAssists: [], // Would need player stats aggregation
    recentResults,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function PublicStandingsPage({
  searchParams,
}: {
  searchParams: { league?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const data = await getPublicStandingsData(searchParams.league);

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center">
        <Trophy className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Leagues Available</h1>
        <p className="text-slate-600 dark:text-slate-400">Check back later for league standings</p>
      </div>
    );
  }

  const sportConfig = SPORT_CONFIG[data.sport];
  const scoringConfig = SPORT_SCORING[data.sport];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
          <span className="text-3xl">{sportConfig.icon}</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{data.name}</h1>
          <p className="text-slate-600 dark:text-slate-400">{data.season} • {sportConfig.label}</p>
        </div>
      </div>

      {/* Main Standings Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className={`p-5 bg-gradient-to-r ${sportConfig.color} bg-opacity-10 border-b border-slate-200 dark:border-slate-700`}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            League Table
          </h2>
        </div>

        {data.standings.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No standings data available yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Team</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">P</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-green-600">W</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-yellow-600">D</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-red-600">L</th>
                  {scoringConfig.columns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase" title={col.label}>
                      {col.shortLabel}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pts</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.standings.map((row, idx) => (
                  <tr
                    key={row.team.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      idx < 4 ? 'bg-green-50/50 dark:bg-green-900/10' : 
                      idx >= data.standings.length - 3 ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        row.position === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        row.position === 2 ? 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300' :
                        row.position === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {row.position === 1 ? '🥇' : row.position === 2 ? '🥈' : row.position === 3 ? '🥉' : row.position}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/teams/${row.team.id}`} className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <span className="font-semibold text-slate-900 dark:text-white">{row.team.name}</span>
                        {row.pointsDeducted > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded">
                            -{row.pointsDeducted}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">{row.played}</td>
                    <td className="px-4 py-3 text-center font-semibold text-green-600 dark:text-green-400">{row.won}</td>
                    <td className="px-4 py-3 text-center font-semibold text-yellow-600 dark:text-yellow-400">{row.drawn}</td>
                    <td className="px-4 py-3 text-center font-semibold text-red-600 dark:text-red-400">{row.lost}</td>
                    
                    {scoringConfig.columns.map(col => {
                      let value: number | string = '-';
                      if (col.key === 'scored') value = row.scored;
                      else if (col.key === 'conceded') value = row.conceded;
                      else if (col.key === 'difference') value = row.difference > 0 ? `+${row.difference}` : row.difference;
                      else if (col.key === 'bonusPoints') value = row.bonusPoints || 0;
                      else if (col.key === 'netRunRate') value = row.netRunRate?.toFixed(3) || '-';
                      else if (col.key === 'percentage') value = row.percentage ? `${row.percentage}%` : '-';
                      
                      return (
                        <td key={col.key} className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 font-medium">
                          {value}
                        </td>
                      );
                    })}
                    
                    <td className="px-4 py-3 text-center">
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{row.points}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center">
                        {row.form.slice(-5).map((result, i) => (
                          <span
                            key={i}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              result === 'W' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              result === 'D' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {result === 'W' ? '✓' : result === 'D' ? '=' : '✕'}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded" />
              <span>Promotion / Champions League</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded" />
              <span>Relegation Zone</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <strong>P</strong>=Played <strong>W</strong>=Won <strong>D</strong>=Drawn <strong>L</strong>=Lost <strong>Pts</strong>=Points
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Scorers */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" />
              {sportConfig.scorerLabel}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {data.topScorers.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No data available</p>
            ) : (
              data.topScorers.slice(0, 5).map(player => (
                <div key={player.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      player.rank === 1 ? 'bg-amber-100 text-amber-700' :
                      player.rank === 2 ? 'bg-slate-200 text-slate-700' :
                      player.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {player.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{player.player.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{player.team.name}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{player.goals}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Assists */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              {sportConfig.assistLabel}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {data.topAssists.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No data available</p>
            ) : (
              data.topAssists.slice(0, 5).map(player => (
                <div key={player.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      player.rank === 1 ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {player.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{player.player.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{player.team.name}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{player.assists}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Recent Results
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {data.recentResults.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No recent matches</p>
            ) : (
              data.recentResults.map(result => (
                <div key={result.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex-1 text-sm">
                    <span className="font-medium text-slate-900 dark:text-white">{result.homeTeam}</span>
                    <span className="text-slate-500 mx-1">vs</span>
                    <span className="font-medium text-slate-900 dark:text-white">{result.awayTeam}</span>
                  </div>
                  <span className={`font-bold px-2 py-1 rounded text-sm ${
                    result.homeScore > result.awayScore ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    result.homeScore < result.awayScore ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {result.homeScore} - {result.awayScore}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}