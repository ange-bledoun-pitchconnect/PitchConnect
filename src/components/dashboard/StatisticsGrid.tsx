/**
 * ============================================================================
 * StatisticsGrid Component
 * ============================================================================
 * 
 * Enterprise-grade player statistics grid/table with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - ANALYST: Statistical analysis
 * - COACH: Player comparison
 * - SCOUT: Talent evaluation
 * - MANAGER: Squad overview
 * 
 * SCHEMA ALIGNMENT:
 * - Player model
 * - PlayerStats model
 * - Sport enum (all 12 sports)
 * - Position enum (sport-specific)
 * 
 * FEATURES:
 * - Sport-specific column configuration
 * - Sortable columns
 * - Position filtering
 * - Rating color coding
 * - Trend indicators
 * - Pagination
 * - Dark mode support
 * - Export functionality
 * - Responsive design
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getSportStatistics,
  type Sport,
  type SportStatistic,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface PlayerGridData {
  id: string;
  name: string;
  number: number;
  position: string;
  club?: string;
  photo?: string;
  rating: number;
  trend: 'up' | 'down' | 'stable';
  stats: Record<string, number>;
}

export interface StatisticsGridProps {
  /** Sport type for column configuration */
  sport: Sport;
  /** Player data */
  players: PlayerGridData[];
  /** Default sort column */
  defaultSortBy?: string;
  /** Default sort direction */
  defaultSortDirection?: 'asc' | 'desc';
  /** Show search */
  showSearch?: boolean;
  /** Show position filter */
  showPositionFilter?: boolean;
  /** Show export button */
  showExport?: boolean;
  /** Items per page */
  pageSize?: number;
  /** Max visible stat columns */
  maxStatColumns?: number;
  /** On player click */
  onPlayerClick?: (playerId: string) => void;
  /** Custom class name */
  className?: string;
}

type SortDirection = 'asc' | 'desc';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get rating badge color
 */
function getRatingColor(rating: number): string {
  if (rating >= 8.5) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (rating >= 7.5) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (rating >= 6.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

/**
 * Export to CSV
 */
function exportToCSV(
  players: PlayerGridData[],
  stats: SportStatistic[],
  filename: string
): void {
  const headers = ['Name', 'Number', 'Position', 'Club', 'Rating', ...stats.map(s => s.label)];
  const rows = players.map(player => [
    player.name,
    player.number.toString(),
    player.position,
    player.club || '',
    player.rating.toFixed(1),
    ...stats.map(s => (player.stats[s.key] ?? 0).toString()),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

// =============================================================================
// COMPONENT
// =============================================================================

export function StatisticsGrid({
  sport,
  players,
  defaultSortBy = 'rating',
  defaultSortDirection = 'desc',
  showSearch = true,
  showPositionFilter = true,
  showExport = true,
  pageSize = 20,
  maxStatColumns = 6,
  onPlayerClick,
  className,
}: StatisticsGridProps) {
  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);
  const sportStats = useMemo(() => getSportStatistics(sport), [sport]);

  // Use top N stats based on maxStatColumns
  const displayStats = useMemo(() => {
    return sportStats.slice(0, maxStatColumns);
  }, [sportStats, maxStatColumns]);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>(defaultSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique positions
  const positions = useMemo(() => {
    const posSet = new Set(players.map(p => p.position));
    return ['all', ...Array.from(posSet)];
  }, [players]);

  // Filter players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          player.name.toLowerCase().includes(query) ||
          player.number.toString().includes(query) ||
          (player.club?.toLowerCase().includes(query) ?? false);
        if (!matchesSearch) return false;
      }

      // Position filter
      if (selectedPosition !== 'all' && player.position !== selectedPosition) {
        return false;
      }

      return true;
    });
  }, [players, searchQuery, selectedPosition]);

  // Sort players
  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      if (sortKey === 'rating') {
        aVal = a.rating;
        bVal = b.rating;
      } else if (sortKey === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        aVal = a.stats[sortKey] ?? 0;
        bVal = b.stats[sortKey] ?? 0;
      }

      const result = aVal - bVal;
      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredPlayers, sortKey, sortDirection]);

  // Paginate
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPlayers.slice(start, start + pageSize);
  }, [sortedPlayers, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedPlayers.length / pageSize);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  }, [sortKey]);

  // Sort icon component
  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-primary" />
      : <ChevronDown className="w-4 h-4 text-primary" />;
  };

  // Handle export
  const handleExport = () => {
    const filename = `${sportConfig.name.toLowerCase()}-player-stats-${new Date().toISOString().split('T')[0]}`;
    exportToCSV(sortedPlayers, displayStats, filename);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>{sportConfig.icon}</span>
              Player Statistics
            </CardTitle>
            <CardDescription>
              {sportConfig.name} season statistics • {sortedPlayers.length} players
            </CardDescription>
          </div>
          {showExport && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Search */}
          {showSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          )}

          {/* Position Filter */}
          {showPositionFilter && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedPosition}
                onChange={(e) => {
                  setSelectedPosition(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos === 'all' ? 'All Positions' : pos}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-800">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    Player
                    <SortIcon columnKey="name" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Position
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  <button
                    onClick={() => handleSort('rating')}
                    className="flex items-center gap-1 hover:text-primary transition-colors mx-auto"
                  >
                    Rating
                    <SortIcon columnKey="rating" />
                  </button>
                </th>
                {displayStats.map((stat) => (
                  <th
                    key={stat.key}
                    className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white"
                  >
                    <button
                      onClick={() => handleSort(stat.key)}
                      className="flex items-center gap-1 hover:text-primary transition-colors mx-auto"
                      title={stat.label}
                    >
                      {stat.shortLabel}
                      <SortIcon columnKey={stat.key} />
                    </button>
                  </th>
                ))}
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white w-16">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlayers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + displayStats.length}
                    className="py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No players found
                  </td>
                </tr>
              ) : (
                paginatedPlayers.map((player, idx) => (
                  <tr
                    key={player.id}
                    onClick={() => onPlayerClick?.(player.id)}
                    className={cn(
                      'border-b border-gray-200 dark:border-gray-700 transition-colors',
                      idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50/50 dark:bg-gray-900/30',
                      'hover:bg-gray-100 dark:hover:bg-gray-800/50',
                      onPlayerClick && 'cursor-pointer'
                    )}
                  >
                    {/* Player */}
                    <td className="py-3 px-4 sticky left-0 bg-inherit">
                      <div className="flex items-center gap-3">
                        {player.photo ? (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={player.photo}
                              alt={player.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {player.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            #{player.number} {player.name}
                          </p>
                          {player.club && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {player.club}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {player.position}
                      </Badge>
                    </td>

                    {/* Rating */}
                    <td className="py-3 px-4 text-center">
                      <Badge className={cn('font-bold', getRatingColor(player.rating))}>
                        {player.rating.toFixed(1)}
                      </Badge>
                    </td>

                    {/* Stats */}
                    {displayStats.map((stat) => (
                      <td
                        key={stat.key}
                        className="py-3 px-4 text-center font-medium text-gray-900 dark:text-white"
                      >
                        {player.stats[stat.key] ?? 0}
                        {stat.type === 'percentage' && '%'}
                      </td>
                    ))}

                    {/* Trend */}
                    <td className="py-3 px-4 text-center">
                      {player.trend === 'up' && (
                        <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />
                      )}
                      {player.trend === 'down' && (
                        <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />
                      )}
                      {player.trend === 'stable' && (
                        <span className="w-4 h-1 bg-gray-400 rounded block mx-auto" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedPlayers.length)} of{' '}
              {sortedPlayers.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

StatisticsGrid.displayName = 'StatisticsGrid';

export default StatisticsGrid;
