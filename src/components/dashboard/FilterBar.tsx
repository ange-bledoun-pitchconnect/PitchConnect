/**
 * ============================================================================
 * FilterBar Component
 * ============================================================================
 * 
 * Enterprise-grade filter bar with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All dashboard users
 * - ANALYST: Data filtering
 * - COACH: Team/player filtering
 * - MANAGER: Report filtering
 * 
 * FEATURES:
 * - Sport filter
 * - Team filter
 * - Position filter (sport-specific)
 * - Date range picker
 * - Season filter
 * - Quick presets
 * - Collapsible advanced filters
 * - Filter count badge
 * - Clear all button
 * - Dark mode support
 * - Responsive design
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getAllSports,
  type Sport,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Team {
  id: string;
  name: string;
  sport?: Sport;
}

export interface FilterValues {
  sport?: Sport;
  teamId?: string;
  position?: string;
  dateFrom?: Date;
  dateTo?: Date;
  season?: string;
  status?: string;
  search?: string;
}

export interface FilterBarProps {
  /** Current filter values */
  filters: FilterValues;
  /** Filter change callback */
  onChange: (filters: FilterValues) => void;
  /** Available teams */
  teams?: Team[];
  /** Available seasons */
  seasons?: string[];
  /** Available statuses */
  statuses?: Array<{ value: string; label: string }>;
  /** Show sport filter */
  showSportFilter?: boolean;
  /** Show team filter */
  showTeamFilter?: boolean;
  /** Show position filter */
  showPositionFilter?: boolean;
  /** Show date range */
  showDateRange?: boolean;
  /** Show season filter */
  showSeasonFilter?: boolean;
  /** Show status filter */
  showStatusFilter?: boolean;
  /** Show search */
  showSearch?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Collapsible */
  collapsible?: boolean;
  /** Default collapsed */
  defaultCollapsed?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// DATE PRESETS
// =============================================================================

const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This season', days: 365 },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function FilterBar({
  filters,
  onChange,
  teams = [],
  seasons = [],
  statuses = [],
  showSportFilter = true,
  showTeamFilter = true,
  showPositionFilter = true,
  showDateRange = true,
  showSeasonFilter = false,
  showStatusFilter = false,
  showSearch = false,
  loading = false,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: FilterBarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Get all sports
  const allSports = useMemo(() => getAllSports(), []);

  // Get sport config for selected sport
  const selectedSportConfig = useMemo(() => {
    return filters.sport ? getSportConfig(filters.sport) : null;
  }, [filters.sport]);

  // Get positions for selected sport
  const positions = useMemo(() => {
    if (!selectedSportConfig) return [];
    return selectedSportConfig.positionCategories || [];
  }, [selectedSportConfig]);

  // Filter teams by sport
  const filteredTeams = useMemo(() => {
    if (!filters.sport) return teams;
    return teams.filter((t) => !t.sport || t.sport === filters.sport);
  }, [teams, filters.sport]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sport) count++;
    if (filters.teamId) count++;
    if (filters.position) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.season) count++;
    if (filters.status) count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  // Update filter
  const updateFilter = useCallback(
    (key: keyof FilterValues, value: unknown) => {
      const newFilters = { ...filters, [key]: value || undefined };
      
      // Reset dependent filters
      if (key === 'sport') {
        newFilters.position = undefined;
        // Optionally reset team if not matching sport
      }
      
      onChange(newFilters);
    },
    [filters, onChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    onChange({});
    setLocalSearch('');
  }, [onChange]);

  // Apply date preset
  const applyDatePreset = useCallback(
    (days: number) => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - days);
      onChange({
        ...filters,
        dateFrom: from,
        dateTo: to,
      });
    },
    [filters, onChange]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        updateFilter('search', localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, updateFilter]);

  // Format date for input
  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Primary Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            {showSearch && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Search</Label>
                <Input
                  type="text"
                  placeholder="Search..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            {/* Sport Filter */}
            {showSportFilter && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sport</Label>
                <select
                  value={filters.sport || ''}
                  onChange={(e) => updateFilter('sport', e.target.value as Sport || undefined)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">All Sports</option>
                  {allSports.map((sport) => {
                    const config = getSportConfig(sport);
                    return (
                      <option key={sport} value={sport}>
                        {config.icon} {config.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Team Filter */}
            {showTeamFilter && filteredTeams.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Team</Label>
                <select
                  value={filters.teamId || ''}
                  onChange={(e) => updateFilter('teamId', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">All Teams</option>
                  {filteredTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Position Filter */}
            {showPositionFilter && positions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Position</Label>
                <select
                  value={filters.position || ''}
                  onChange={(e) => updateFilter('position', e.target.value)}
                  disabled={loading || !filters.sport}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">All Positions</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Season Filter */}
            {showSeasonFilter && seasons.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Season</Label>
                <select
                  value={filters.season || ''}
                  onChange={(e) => updateFilter('season', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">All Seasons</option>
                  {seasons.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            {showStatusFilter && statuses.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date Range */}
          {showDateRange && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-sm font-medium mb-3 block">Date Range</Label>
              
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => applyDatePreset(preset.days)}
                    disabled={loading}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    From
                  </Label>
                  <Input
                    type="date"
                    value={formatDateForInput(filters.dateFrom)}
                    onChange={(e) =>
                      updateFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    To
                  </Label>
                  <Input
                    type="date"
                    value={formatDateForInput(filters.dateTo)}
                    onChange={(e) =>
                      updateFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-xs text-gray-500 mb-2 block">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.sport && (
                  <Badge variant="secondary" className="gap-1">
                    {getSportConfig(filters.sport).name}
                    <button onClick={() => updateFilter('sport', undefined)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.teamId && (
                  <Badge variant="secondary" className="gap-1">
                    Team: {teams.find((t) => t.id === filters.teamId)?.name || filters.teamId}
                    <button onClick={() => updateFilter('teamId', undefined)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.position && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.position}
                    <button onClick={() => updateFilter('position', undefined)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge variant="secondary" className="gap-1">
                    From: {filters.dateFrom.toLocaleDateString()}
                    <button onClick={() => updateFilter('dateFrom', undefined)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge variant="secondary" className="gap-1">
                    To: {filters.dateTo.toLocaleDateString()}
                    <button onClick={() => updateFilter('dateTo', undefined)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

FilterBar.displayName = 'FilterBar';

export default FilterBar;
