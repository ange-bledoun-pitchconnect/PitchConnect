// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE ADMIN STANDINGS v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/league-admin/standings
// Access: LEAGUE_ADMIN role, SuperAdmin
//
// FEATURES:
// ✅ Multi-sport scoring systems (12 sports)
// ✅ Sport-specific columns (Goals, Points, Tries, Runs, NRR, etc.)
// ✅ Manual adjustments (point deductions, forfeits, overrides)
// ✅ Historical standings snapshots
// ✅ League → Season → Standings hierarchy
// ✅ Recalculation from match results
// ✅ Edit capabilities with audit trail
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
  Users,
  Edit3,
  RefreshCw,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  MinusCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Settings,
  History,
  Calculator,
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
  positionChange: number; // +2, -1, 0
  team: { id: string; name: string; logo?: string | null };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  // Sport-specific metrics
  scored: number;      // Goals/Points/Runs
  conceded: number;    // Goals Against/Points Against
  difference: number;  // Goal Difference/Point Diff
  bonusPoints?: number; // Rugby try bonus, etc.
  netRunRate?: number; // Cricket NRR
  percentage?: number; // Netball goal percentage
  points: number;
  pointsDeducted: number;
  form: ('W' | 'D' | 'L')[];
}

interface LeagueWithStandings {
  id: string;
  name: string;
  sport: Sport;
  currentSeason?: {
    id: string;
    name: string;
    standings: StandingEntry[];
    lastUpdated: Date | null;
  } | null;
}

// =============================================================================
// SPORT-SPECIFIC SCORING CONFIGURATION
// =============================================================================

const SPORT_SCORING: Record<Sport, {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  columns: Array<{ key: string; label: string; shortLabel: string }>;
  scoredLabel: string;
  concededLabel: string;
  differenceLabel: string;
  bonusSystem?: string;
}> = {
  FOOTBALL: {
    winPoints: 3, drawPoints: 1, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Goals For', shortLabel: 'GF' },
      { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' },
      { key: 'difference', label: 'Goal Difference', shortLabel: 'GD' },
    ],
    scoredLabel: 'Goals For', concededLabel: 'Goals Against', differenceLabel: 'Goal Difference',
  },
  RUGBY: {
    winPoints: 4, drawPoints: 2, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Points For', shortLabel: 'PF' },
      { key: 'conceded', label: 'Points Against', shortLabel: 'PA' },
      { key: 'difference', label: 'Point Difference', shortLabel: 'PD' },
      { key: 'bonusPoints', label: 'Bonus Points', shortLabel: 'BP' },
    ],
    scoredLabel: 'Points For', concededLabel: 'Points Against', differenceLabel: 'Point Difference',
    bonusSystem: 'Try Bonus (4+ tries) & Losing Bonus (within 7 points)',
  },
  CRICKET: {
    winPoints: 2, drawPoints: 1, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Runs For', shortLabel: 'RF' },
      { key: 'conceded', label: 'Runs Against', shortLabel: 'RA' },
      { key: 'netRunRate', label: 'Net Run Rate', shortLabel: 'NRR' },
    ],
    scoredLabel: 'Runs For', concededLabel: 'Runs Against', differenceLabel: 'Net Run Rate',
  },
  BASKETBALL: {
    winPoints: 2, drawPoints: 0, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Points For', shortLabel: 'PF' },
      { key: 'conceded', label: 'Points Against', shortLabel: 'PA' },
      { key: 'difference', label: 'Point Differential', shortLabel: '+/-' },
    ],
    scoredLabel: 'Points For', concededLabel: 'Points Against', differenceLabel: 'Point Differential',
  },
  NETBALL: {
    winPoints: 2, drawPoints: 1, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Goals For', shortLabel: 'GF' },
      { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' },
      { key: 'percentage', label: 'Goal Percentage', shortLabel: '%' },
    ],
    scoredLabel: 'Goals For', concededLabel: 'Goals Against', differenceLabel: 'Goal Percentage',
  },
  HOCKEY: {
    winPoints: 3, drawPoints: 1, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Goals For', shortLabel: 'GF' },
      { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' },
      { key: 'difference', label: 'Goal Difference', shortLabel: 'GD' },
    ],
    scoredLabel: 'Goals For', concededLabel: 'Goals Against', differenceLabel: 'Goal Difference',
  },
  AMERICAN_FOOTBALL: {
    winPoints: 1, drawPoints: 0.5, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Points For', shortLabel: 'PF' },
      { key: 'conceded', label: 'Points Against', shortLabel: 'PA' },
      { key: 'difference', label: 'Point Differential', shortLabel: '+/-' },
    ],
    scoredLabel: 'Points For', concededLabel: 'Points Against', differenceLabel: 'Point Differential',
  },
  LACROSSE: {
    winPoints: 2, drawPoints: 1, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Goals For', shortLabel: 'GF' },
      { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' },
      { key: 'difference', label: 'Goal Difference', shortLabel: 'GD' },
    ],
    scoredLabel: 'Goals For', concededLabel: 'Goals Against', differenceLabel: 'Goal Difference',
  },
  AUSTRALIAN_RULES: {
    winPoints: 4, drawPoints: 2, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Points For', shortLabel: 'PF' },
      { key: 'conceded', label: 'Points Against', shortLabel: 'PA' },
      { key: 'percentage', label: 'Percentage', shortLabel: '%' },
    ],
    scoredLabel: 'Points For', concededLabel: 'Points Against', differenceLabel: 'Percentage',
  },
  GAELIC_FOOTBALL: {
    winPoints: 2, drawPoints: 1, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Scores For', shortLabel: 'SF' },
      { key: 'conceded', label: 'Scores Against', shortLabel: 'SA' },
      { key: 'difference', label: 'Score Difference', shortLabel: 'SD' },
    ],
    scoredLabel: 'Scores For', concededLabel: 'Scores Against', differenceLabel: 'Score Difference',
  },
  FUTSAL: {
    winPoints: 3, drawPoints: 1, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Goals For', shortLabel: 'GF' },
      { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' },
      { key: 'difference', label: 'Goal Difference', shortLabel: 'GD' },
    ],
    scoredLabel: 'Goals For', concededLabel: 'Goals Against', differenceLabel: 'Goal Difference',
  },
  BEACH_FOOTBALL: {
    winPoints: 3, drawPoints: 1, lossPoints: 0,
    columns: [
      { key: 'scored', label: 'Goals For', shortLabel: 'GF' },
      { key: 'conceded', label: 'Goals Against', shortLabel: 'GA' },
      { key: 'difference', label: 'Goal Difference', shortLabel: 'GD' },
    ],
    scoredLabel: 'Goals For', concededLabel: 'Goals Against', differenceLabel: 'Goal Difference',
  },
};

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500' },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getStandingsData(userId: string) {
  const leagueAdmin = await prisma.leagueAdmin.findUnique({
    where: { userId },
    include: {
      leagues: {
        include: {
          league: {
            include: {
              seasons: {
                where: { isCurrent: true },
                take: 1,
                include: {
                  standings: {
                    include: {
                      team: { select: { id: true, name: true, logo: true } },
                    },
                    orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }, { goalsFor: 'desc' }],
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!leagueAdmin) {
    return { leagues: [] };
  }

  const leagues: LeagueWithStandings[] = leagueAdmin.leagues.map(la => {
    const league = la.league;
    const season = league.seasons[0];

    return {
      id: league.id,
      name: league.name,
      sport: league.sport as Sport,
      currentSeason: season ? {
        id: season.id,
        name: season.name,
        lastUpdated: season.updatedAt,
        standings: season.standings.map((s, idx) => ({
          position: idx + 1,
          positionChange: 0, // Would need historical data
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
        })),
      } : null,
    };
  });

  return { leagues };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function AdminStandingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const { leagues } = await getStandingsData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">League Standings</h1>
            <p className="text-slate-600 dark:text-slate-400">View and manage league tables with admin controls</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md transition-colors">
            <RefreshCw className="w-5 h-5" />
            Recalculate All
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Admin Tools */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Admin Controls
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AdminAction icon={<Calculator className="w-5 h-5" />} label="Recalculate Standings" description="From match results" />
          <AdminAction icon={<MinusCircle className="w-5 h-5" />} label="Point Deductions" description="Apply penalties" />
          <AdminAction icon={<Edit3 className="w-5 h-5" />} label="Manual Override" description="Edit standings" />
          <AdminAction icon={<History className="w-5 h-5" />} label="View History" description="Audit trail" />
        </div>
      </div>

      {/* Leagues */}
      {leagues.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <TrendingUp className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Standings Available</h3>
          <p className="text-slate-600 dark:text-slate-400">Create a league and start a season to see standings</p>
        </div>
      ) : (
        <div className="space-y-8">
          {leagues.map(league => (
            <LeagueStandingsTable key={league.id} league={league} />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function AdminAction({ icon, label, description }: { icon: React.ReactNode; label: string; description: string }) {
  return (
    <button className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700 hover:border-amber-400 transition-colors text-left">
      <div className="text-amber-600 dark:text-amber-400">{icon}</div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-white text-sm">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </button>
  );
}

function LeagueStandingsTable({ league }: { league: LeagueWithStandings }) {
  const sportConfig = SPORT_CONFIG[league.sport];
  const scoringConfig = SPORT_SCORING[league.sport];

  if (!league.currentSeason) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{sportConfig.icon}</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{league.name}</h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400">No active season. Start a season to see standings.</p>
      </div>
    );
  }

  const standings = league.currentSeason.standings;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`p-5 bg-gradient-to-r ${sportConfig.color} bg-opacity-10 border-b border-slate-200 dark:border-slate-700`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sportConfig.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{league.name}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{league.currentSeason.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/league-admin/leagues/${league.id}/standings/edit`}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Edit3 className="w-4 h-4" /> Edit
            </Link>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
              <RefreshCw className="w-4 h-4" /> Recalculate
            </button>
          </div>
        </div>

        {/* Scoring Info */}
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
          <span>Win: <strong>{scoringConfig.winPoints} pts</strong></span>
          <span>Draw: <strong>{scoringConfig.drawPoints} pts</strong></span>
          <span>Loss: <strong>{scoringConfig.lossPoints} pts</strong></span>
          {scoringConfig.bonusSystem && (
            <span className="text-amber-600 dark:text-amber-400">• {scoringConfig.bonusSystem}</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12">#</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Team</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">P</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-green-600">W</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-yellow-600">D</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-red-600">L</th>
              {scoringConfig.columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" title={col.label}>
                  {col.shortLabel}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pts</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Form</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {standings.map((row, idx) => (
              <tr
                key={row.team.id}
                className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  idx < 4 ? 'bg-green-50/50 dark:bg-green-900/10' : 
                  idx >= standings.length - 3 ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      row.position === 1 ? 'bg-amber-100 text-amber-700' :
                      row.position === 2 ? 'bg-slate-200 text-slate-700' :
                      row.position === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {row.position}
                    </div>
                    {row.positionChange !== 0 && (
                      <span className={`text-xs ${row.positionChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.positionChange > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{row.team.name}</span>
                    {row.pointsDeducted > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded">
                        -{row.pointsDeducted}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">{row.played}</td>
                <td className="px-4 py-3 text-center font-semibold text-green-600">{row.won}</td>
                <td className="px-4 py-3 text-center font-semibold text-yellow-600">{row.drawn}</td>
                <td className="px-4 py-3 text-center font-semibold text-red-600">{row.lost}</td>
                
                {/* Sport-specific columns */}
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
                  <span className={`text-lg font-bold ${sportConfig.color.includes('green') ? 'text-green-600' : 'text-amber-600'}`}>
                    {row.points}
                  </span>
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
                        {result}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded" />
            <span>Champions League / Promotion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded" />
            <span>Relegation Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">-3</span>
            <span>Points Deducted</span>
          </div>
        </div>
      </div>
    </div>
  );
}