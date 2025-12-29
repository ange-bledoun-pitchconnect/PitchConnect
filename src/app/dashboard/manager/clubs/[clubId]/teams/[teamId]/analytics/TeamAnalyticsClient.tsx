// =============================================================================
// 🏆 PITCHCONNECT - TEAM ANALYTICS CLIENT COMPONENT
// =============================================================================
// Interactive analytics with sport-specific metrics
// =============================================================================

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Filter,
  BarChart3,
  Trophy,
  Target,
  Users,
  TrendingUp,
  Award,
  Search,
  ChevronDown,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type Position = string;

interface TeamData {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  sport: Sport;
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  position: Position | null;
  jerseyNumber: number | null;
  matches: number;
  starts: number;
  minutesPlayed: number;
  scoringActions: number;
  assistActions: number;
  yellowCards: number;
  redCards: number;
  scoringPerGame: number;
  assistsPerGame: number;
  cleanSheets?: number;
  saves?: number;
  tackles?: number;
  interceptions?: number;
}

interface TeamStats {
  totalMatches: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalScored: number;
  totalConceded: number;
  winRate: number;
  scoringPerGame: number;
  cleanSheets: number;
}

interface SportPosition {
  value: Position;
  label: string;
  category: string;
}

interface SportMetrics {
  scoringLabel: string;
  scoringLabelPlural: string;
  assistLabel: string;
  assistLabelPlural: string;
  cleanSheetLabel: string;
  additionalMetrics: { key: string; label: string }[];
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface TeamAnalyticsClientProps {
  team: TeamData;
  teamStats: TeamStats;
  playerStats: PlayerStats[];
  sportPositions: SportPosition[];
  sportMetrics: SportMetrics;
}

// =============================================================================
// SPORT ICONS
// =============================================================================

const SPORT_ICONS: Record<Sport, string> = {
  FOOTBALL: '⚽',
  RUGBY: '🏉',
  CRICKET: '🏏',
  BASKETBALL: '🏀',
  NETBALL: '🏐',
  HOCKEY: '🏒',
  AMERICAN_FOOTBALL: '🏈',
  LACROSSE: '🥍',
  AUSTRALIAN_RULES: '🦘',
  GAELIC_FOOTBALL: '☘️',
  FUTSAL: '⚽',
  BEACH_FOOTBALL: '🏖️',
};

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function TeamAnalyticsClient({
  team,
  teamStats,
  playerStats,
  sportPositions,
  sportMetrics,
}: TeamAnalyticsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('scoringActions');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Get unique position categories
  const positionCategories = useMemo(() => {
    const categories = [...new Set(sportPositions.map(p => p.category))];
    return categories;
  }, [sportPositions]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = [...playerStats];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.playerName.toLowerCase().includes(query) ||
        (p.jerseyNumber && p.jerseyNumber.toString().includes(query))
      );
    }

    // Position filter
    if (positionFilter !== 'ALL') {
      const positionsInCategory = sportPositions
        .filter(p => p.category === positionFilter)
        .map(p => p.value);
      filtered = filtered.filter(p => 
        p.position && positionsInCategory.includes(p.position)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy] || 0;
      const bVal = (b as any)[sortBy] || 0;
      return bVal - aVal;
    });

    return filtered;
  }, [playerStats, searchQuery, positionFilter, sortBy, sportPositions]);

  // Get position label
  const getPositionLabel = (position: Position | null): string => {
    if (!position) return '-';
    const pos = sportPositions.find(p => p.value === position);
    return pos?.label || position;
  };

  // Sort options with sport-specific labels
  const sortOptions = useMemo(() => [
    { value: 'scoringActions', label: sportMetrics.scoringLabelPlural },
    { value: 'assistActions', label: sportMetrics.assistLabelPlural },
    { value: 'matches', label: 'Appearances' },
    { value: 'minutesPlayed', label: 'Minutes Played' },
    { value: 'scoringPerGame', label: `${sportMetrics.scoringLabelPlural}/Game` },
    { value: 'yellowCards', label: 'Yellow Cards' },
  ], [sportMetrics]);

  // Download CSV report
  const handleDownloadReport = () => {
    try {
      const headers = [
        'Player',
        'Position',
        'Jersey',
        'Matches',
        'Starts',
        'Minutes',
        sportMetrics.scoringLabelPlural,
        sportMetrics.assistLabelPlural,
        `${sportMetrics.scoringLabelPlural}/Game`,
        `${sportMetrics.assistLabelPlural}/Game`,
        'Yellow Cards',
        'Red Cards',
      ];

      let csv = headers.join(',') + '\n';

      filteredPlayers.forEach(player => {
        const row = [
          `"${player.playerName}"`,
          `"${getPositionLabel(player.position)}"`,
          player.jerseyNumber || '-',
          player.matches,
          player.starts,
          player.minutesPlayed,
          player.scoringActions,
          player.assistActions,
          player.scoringPerGame.toFixed(2),
          player.assistsPerGame.toFixed(2),
          player.yellowCards,
          player.redCards,
        ];
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${team.name}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      showToast('Report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download report', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/10 to-pink-50/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Container */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
                  : toast.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400'
              }`}
            >
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)}><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${team.clubId}/teams/${team.id}`}>
            <button className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Team
            </button>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-3xl">{SPORT_ICONS[team.sport]}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{team.name} Analytics</h1>
                <p className="text-slate-600 dark:text-slate-400">{team.clubName} • {team.sport.replace(/_/g, ' ')}</p>
              </div>
            </div>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </div>

        {/* Team Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Matches"
            value={teamStats.totalMatches}
            icon={BarChart3}
            color="purple"
          />
          <StatCard
            label={`Total ${sportMetrics.scoringLabelPlural}`}
            value={teamStats.totalScored}
            icon={Target}
            color="green"
          />
          <StatCard
            label={`${sportMetrics.scoringLabelPlural}/Game`}
            value={teamStats.scoringPerGame.toFixed(2)}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            label="Win Rate"
            value={`${teamStats.winRate.toFixed(1)}%`}
            icon={Trophy}
            color="amber"
          />
        </div>

        {/* Match Record */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Match Record</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <RecordItem label="Wins" value={teamStats.totalWins} color="green" />
              <RecordItem label="Draws" value={teamStats.totalDraws} color="blue" />
              <RecordItem label="Losses" value={teamStats.totalLosses} color="red" />
              <RecordItem label={sportMetrics.cleanSheetLabel} value={teamStats.cleanSheets} color="purple" />
              <RecordItem label="Conceded" value={teamStats.totalConceded} color="orange" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                Search Player
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Name or jersey number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Position Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                Position
              </label>
              <select
                value={positionFilter}
                onChange={e => setPositionFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Positions</option>
                {positionCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Player Statistics Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Player Statistics ({filteredPlayers.length})
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Detailed performance metrics for all players
            </p>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No players found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Player</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Pos</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Apps</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Mins</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{sportMetrics.scoringLabelPlural}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{sportMetrics.assistLabelPlural}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">/Game</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">YC</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">RC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredPlayers.map((player, idx) => (
                    <tr key={player.playerId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                            {player.jerseyNumber || idx + 1}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{player.playerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                        {getPositionLabel(player.position)}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{player.matches}</td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{player.minutesPlayed}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm">
                          {player.scoringActions}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm">
                          {player.assistActions}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                        {player.scoringPerGame.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {player.yellowCards > 0 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold">
                            {player.yellowCards}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {player.redCards > 0 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
                            {player.redCards}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: 'purple' | 'green' | 'blue' | 'amber';
}) {
  const colorClasses = {
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
    amber: 'from-amber-500 to-orange-500',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function RecordItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'green' | 'blue' | 'red' | 'purple' | 'orange';
}) {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
  };

  return (
    <div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}