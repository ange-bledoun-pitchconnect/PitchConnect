// =============================================================================
// 🏆 PITCHCONNECT - STANDINGS CLIENT COMPONENT
// =============================================================================
// Interactive client component for league standings
// Handles search, sort, and export functionality
// =============================================================================

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  Trophy,
  Download,
  Search,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
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

interface Standing {
  position: number;
  team: { id: string; name: string; logo?: string | null };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  [key: string]: any; // Sport-specific fields
}

interface ColumnConfig {
  key: string;
  label: string;
  shortLabel: string;
  format?: 'number' | 'signed' | 'decimal' | 'percent';
}

interface StandingsClientProps {
  leagueId: string;
  leagueName: string;
  leagueCode: string;
  sport: Sport;
  sportConfig: { label: string; icon: string; color: string };
  season: string;
  standings: Standing[];
  columns: ColumnConfig[];
  stats: {
    totalTeams: number;
    matchesPlayed: number;
    totalScored: number;
    avgPerMatch: number;
  };
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function StandingsClient({
  leagueId,
  leagueName,
  leagueCode,
  sport,
  sportConfig,
  season,
  standings,
  columns,
  stats,
}: StandingsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('position');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Filter and sort standings
  const filteredStandings = useMemo(() => {
    let result = standings.filter(s =>
      s.team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy !== 'position') {
      result = [...result].sort((a, b) => {
        const valA = a[sortBy] ?? 0;
        const valB = b[sortBy] ?? 0;
        return typeof valB === 'number' && typeof valA === 'number' ? valB - valA : 0;
      });
    }

    return result;
  }, [standings, searchQuery, sortBy]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (standings.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const headers = ['Position', 'Team', ...columns.map(c => c.label)];
    const rows = standings.map(s => [
      s.position,
      s.team.name,
      ...columns.map(c => {
        if (c.key === 'form') return s.form.join('');
        return s[c.key] ?? '';
      }),
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${leagueCode}_standings_${season.replace(/\//g, '-')}.csv`;
    link.click();

    showToast('Standings exported successfully', 'success');
  }, [standings, columns, leagueCode, season, showToast]);

  // Get sort options from columns
  const sortOptions = useMemo(() => [
    { value: 'position', label: 'Position' },
    ...columns
      .filter(c => c.key !== 'form')
      .map(c => ({ value: c.key, label: c.label })),
  ], [columns]);

  // Leader info
  const leader = standings[0];
  const topScorer = standings.reduce((max, s) => 
    (s.goalsFor || s.pointsFor || 0) > (max.goalsFor || max.pointsFor || 0) ? s : max, 
    standings[0]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/leagues/${leagueId}`}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">League Standings</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-slate-600 dark:text-slate-400">{leagueName}</span>
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-semibold">
                {leagueCode}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs font-semibold">
                {season}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl">{sportConfig.icon}</span>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {standings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Goals"
            value={stats.totalScored}
            icon={<Zap className="w-6 h-6 text-blue-500" />}
          />
          <StatCard
            label="Avg Goals/Match"
            value={stats.avgPerMatch.toFixed(2)}
            icon={<Target className="w-6 h-6 text-purple-500" />}
          />
          <StatCard
            label="League Leader"
            value={leader?.team.name || 'N/A'}
            subtext={leader ? `${leader.points} pts` : undefined}
            icon={<Trophy className="w-6 h-6 text-amber-500" />}
          />
          <StatCard
            label="Top Scoring Team"
            value={topScorer?.team.name || 'N/A'}
            subtext={topScorer ? `${topScorer.goalsFor || topScorer.pointsFor || 0} scored` : undefined}
            icon={<TrendingUp className="w-6 h-6 text-orange-500" />}
          />
        </div>
      )}

      {/* Search & Sort */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Current Standings
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {standings.length} teams • Updated after each match
          </p>
        </div>

        {standings.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Standings Yet</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Add teams and play matches to generate league standings
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Team</th>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ${
                        col.key === 'form' ? 'text-center' : 'text-center'
                      }`}
                      title={col.label}
                    >
                      {col.shortLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStandings.map((row, idx) => (
                  <tr
                    key={row.team.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      row.position === 1 ? 'bg-amber-50/50 dark:bg-amber-900/10' :
                      row.position <= 4 ? 'bg-green-50/50 dark:bg-green-900/10' :
                      row.position > standings.length - 3 ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PositionBadge position={row.position} total={standings.length} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/teams/${row.team.id}`}
                        className="font-semibold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      >
                        {row.team.name}
                      </Link>
                    </td>
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-center">
                        {col.key === 'form' ? (
                          <FormDisplay form={row.form} />
                        ) : (
                          <CellValue value={row[col.key]} format={col.format} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        {standings.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded flex items-center justify-center">
                  <Trophy className="w-3 h-3 text-amber-600" />
                </div>
                <span>Champion</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded" />
                <span>Promotion Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded" />
                <span>Relegation Zone</span>
              </div>
            </div>
          </div>
        )}
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
  subtext,
  icon,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 truncate">{value}</p>
          {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtext}</p>}
        </div>
        {icon}
      </div>
    </div>
  );
}

function PositionBadge({ position, total }: { position: number; total: number }) {
  if (position === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
    );
  }

  if (position <= 4) {
    return (
      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />
      </div>
    );
  }

  if (position > total - 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{position}</span>
    </div>
  );
}

function FormDisplay({ form }: { form: ('W' | 'D' | 'L')[] }) {
  return (
    <div className="flex gap-1 justify-center">
      {form.slice(-5).map((result, i) => (
        <span
          key={i}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
            result === 'W' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
            result === 'D' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {result === 'W' ? '✓' : result === 'D' ? '=' : '✕'}
        </span>
      ))}
    </div>
  );
}

function CellValue({ value, format }: { value: any; format?: 'number' | 'signed' | 'decimal' | 'percent' }) {
  if (value === null || value === undefined) {
    return <span className="text-slate-400">—</span>;
  }

  let displayValue = value;
  let className = 'text-slate-700 dark:text-slate-300 font-medium';

  if (format === 'signed' && typeof value === 'number') {
    displayValue = value > 0 ? `+${value}` : value;
    className = value > 0 
      ? 'text-green-600 dark:text-green-400 font-bold' 
      : value < 0 
        ? 'text-red-600 dark:text-red-400 font-bold' 
        : 'text-slate-600 dark:text-slate-400 font-medium';
  }

  if (format === 'decimal' && typeof value === 'number') {
    displayValue = value.toFixed(3);
    className = value > 0 
      ? 'text-green-600 dark:text-green-400 font-bold' 
      : value < 0 
        ? 'text-red-600 dark:text-red-400 font-bold' 
        : 'text-slate-600 dark:text-slate-400 font-medium';
  }

  if (format === 'percent' && typeof value === 'number') {
    displayValue = `${value}%`;
  }

  // Highlight points column
  if (typeof value === 'number' && value >= 0 && !format) {
    className = 'text-slate-900 dark:text-white font-bold';
  }

  return <span className={className}>{displayValue}</span>;
}