/**
 * ============================================================================
 * Advanced Filter Component
 * ============================================================================
 * 
 * Enterprise-grade filter panel with multi-sport support and dynamic
 * position filtering based on selected sport.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/filters/advanced-filter.tsx
 * 
 * FEATURES:
 * - Multi-sport position filtering (all 12 sports)
 * - Dynamic position options based on sport selection
 * - Result type filtering (player, club, league, match, team)
 * - Rating range filter
 * - Status filter
 * - Date range filter
 * - Location/region filter
 * - Active filter badges with removal
 * - Save filter presets
 * - Mobile responsive sheet view
 * - Dark mode support
 * - Accessibility compliant
 * 
 * AFFECTED USER ROLES:
 * - All users with search/filter access
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  X,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
  Save,
  Bookmark,
  Calendar,
  MapPin,
  Star,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type Sport,
  SPORT_CONFIG,
  getPositionsForSport,
  ALL_SPORTS,
} from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

export type ResultType = 'player' | 'club' | 'league' | 'match' | 'team' | 'event';

export type PlayerStatus = 'ACTIVE' | 'INJURED' | 'ON_LOAN' | 'SUSPENDED' | 'INACTIVE';

export interface FilterOptions {
  type?: ResultType[];
  sport?: Sport[];
  position?: string[];
  status?: PlayerStatus[];
  minRating?: number;
  maxRating?: number;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterOptions;
}

export interface AdvancedFilterProps {
  /** Initial filter values */
  initialFilters?: FilterOptions;
  /** Callback when filters change */
  onFiltersChange?: (filters: FilterOptions) => void;
  /** Available filter presets */
  presets?: FilterPreset[];
  /** Save preset callback */
  onSavePreset?: (name: string, filters: FilterOptions) => void;
  /** Show sport filter */
  showSportFilter?: boolean;
  /** Show type filter */
  showTypeFilter?: boolean;
  /** Show position filter */
  showPositionFilter?: boolean;
  /** Show rating filter */
  showRatingFilter?: boolean;
  /** Show status filter */
  showStatusFilter?: boolean;
  /** Show date range filter */
  showDateFilter?: boolean;
  /** Show location filter */
  showLocationFilter?: boolean;
  /** Trigger button variant */
  variant?: 'button' | 'icon' | 'inline';
  /** Custom class name */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RESULT_TYPES: { value: ResultType; label: string; icon: string }[] = [
  { value: 'player', label: 'Players', icon: '👤' },
  { value: 'club', label: 'Clubs', icon: '🏢' },
  { value: 'league', label: 'Leagues', icon: '🏆' },
  { value: 'match', label: 'Matches', icon: '⚽' },
  { value: 'team', label: 'Teams', icon: '👥' },
  { value: 'event', label: 'Events', icon: '📅' },
];

const PLAYER_STATUSES: { value: PlayerStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'INJURED', label: 'Injured', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'ON_LOAN', label: 'On Loan', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
];

// =============================================================================
// FILTER SECTION COMPONENT
// =============================================================================

interface FilterSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}

function FilterSection({
  title,
  icon,
  children,
  defaultOpen = true,
  collapsible = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      {collapsible ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-left"
        >
          <h4 className="font-semibold text-sm text-charcoal-700 dark:text-charcoal-300 flex items-center gap-2">
            {icon}
            {title}
          </h4>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-charcoal-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-charcoal-400" />
          )}
        </button>
      ) : (
        <h4 className="font-semibold text-sm text-charcoal-700 dark:text-charcoal-300 flex items-center gap-2">
          {icon}
          {title}
        </h4>
      )}
      {(!collapsible || isOpen) && <div>{children}</div>}
    </div>
  );
}

// =============================================================================
// MULTI-SELECT BUTTON GRID
// =============================================================================

interface MultiSelectGridProps<T extends string> {
  options: { value: T; label: string; icon?: string; color?: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  columns?: 2 | 3 | 4;
}

function MultiSelectGrid<T extends string>({
  options,
  selected,
  onChange,
  columns = 2,
}: MultiSelectGridProps<T>) {
  const toggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={cn('grid gap-2', gridCols[columns])}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <button
            key={option.value}
            onClick={() => toggle(option.value)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1',
              isSelected
                ? option.color || 'bg-primary/20 text-primary ring-2 ring-primary dark:bg-primary/30'
                : 'bg-neutral-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
            )}
          >
            {option.icon && <span>{option.icon}</span>}
            {option.label}
            {isSelected && <Check className="h-3 w-3 ml-1" />}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AdvancedFilter({
  initialFilters = {},
  onFiltersChange,
  presets = [],
  onSavePreset,
  showSportFilter = true,
  showTypeFilter = true,
  showPositionFilter = true,
  showRatingFilter = true,
  showStatusFilter = true,
  showDateFilter = false,
  showLocationFilter = false,
  variant = 'button',
  className = '',
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Update filter and notify parent
  const updateFilter = useCallback(
    <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onFiltersChange?.(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    const emptyFilters: FilterOptions = {};
    setFilters(emptyFilters);
    onFiltersChange?.(emptyFilters);
  }, [onFiltersChange]);

  // Apply preset
  const applyPreset = useCallback(
    (preset: FilterPreset) => {
      setFilters(preset.filters);
      onFiltersChange?.(preset.filters);
    },
    [onFiltersChange]
  );

  // Save current filters as preset
  const handleSavePreset = useCallback(() => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
      setShowSavePreset(false);
    }
  }, [presetName, filters, onSavePreset]);

  // Get positions based on selected sports
  const availablePositions = useMemo(() => {
    const sports = filters.sport || [];
    if (sports.length === 0) {
      // If no sport selected, show all positions from all sports
      const allPositions = new Set<string>();
      ALL_SPORTS.forEach((sport) => {
        getPositionsForSport(sport).forEach((pos) => allPositions.add(pos.id));
      });
      return Array.from(allPositions).map((id) => ({ value: id, label: id }));
    }

    // Get positions for selected sports
    const positionSet = new Set<string>();
    sports.forEach((sport) => {
      getPositionsForSport(sport).forEach((pos) => positionSet.add(pos.id));
    });

    return Array.from(positionSet).map((id) => {
      // Find the full position info from any sport
      for (const sport of sports) {
        const positions = getPositionsForSport(sport);
        const found = positions.find((p) => p.id === id);
        if (found) return { value: id, label: found.shortLabel || found.label };
      }
      return { value: id, label: id };
    });
  }, [filters.sport]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type?.length) count++;
    if (filters.sport?.length) count++;
    if (filters.position?.length) count++;
    if (filters.status?.length) count++;
    if (filters.minRating !== undefined && filters.minRating > 0) count++;
    if (filters.maxRating !== undefined && filters.maxRating < 10) count++;
    if (filters.location) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  // Sport options with icons
  const sportOptions = useMemo(
    () =>
      ALL_SPORTS.map((sport) => ({
        value: sport,
        label: SPORT_CONFIG[sport].name,
        icon: SPORT_CONFIG[sport].icon,
      })),
    []
  );

  // Filter content (shared between inline and sheet variants)
  const filterContent = (
    <div className="space-y-6">
      {/* Presets */}
      {presets.length > 0 && (
        <FilterSection title="Saved Filters" icon={<Bookmark className="h-4 w-4" />}>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Result Type Filter */}
      {showTypeFilter && (
        <FilterSection title="Result Type" icon={<Filter className="h-4 w-4" />}>
          <MultiSelectGrid
            options={RESULT_TYPES}
            selected={filters.type || []}
            onChange={(value) => updateFilter('type', value)}
            columns={3}
          />
        </FilterSection>
      )}

      {/* Sport Filter */}
      {showSportFilter && (
        <FilterSection title="Sport" icon={<Activity className="h-4 w-4" />}>
          <div className="max-h-48 overflow-y-auto pr-2">
            <MultiSelectGrid
              options={sportOptions}
              selected={filters.sport || []}
              onChange={(value) => {
                updateFilter('sport', value);
                // Clear positions when sport changes
                updateFilter('position', []);
              }}
              columns={2}
            />
          </div>
        </FilterSection>
      )}

      {/* Position Filter (dynamic based on sport) */}
      {showPositionFilter && availablePositions.length > 0 && (
        <FilterSection title="Position" collapsible>
          <div className="max-h-40 overflow-y-auto pr-2">
            <MultiSelectGrid
              options={availablePositions}
              selected={filters.position || []}
              onChange={(value) => updateFilter('position', value)}
              columns={4}
            />
          </div>
          {filters.sport?.length === 0 && (
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-2">
              💡 Select a sport to see relevant positions
            </p>
          )}
        </FilterSection>
      )}

      {/* Status Filter */}
      {showStatusFilter && (
        <FilterSection title="Player Status" collapsible defaultOpen={false}>
          <MultiSelectGrid
            options={PLAYER_STATUSES}
            selected={filters.status || []}
            onChange={(value) => updateFilter('status', value)}
            columns={2}
          />
        </FilterSection>
      )}

      {/* Rating Filter */}
      {showRatingFilter && (
        <FilterSection title="Rating Range" icon={<Star className="h-4 w-4" />} collapsible defaultOpen={false}>
          <div className="space-y-4 px-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-charcoal-600 dark:text-charcoal-400">
                Min: {filters.minRating?.toFixed(1) || '0.0'}
              </span>
              <span className="text-charcoal-600 dark:text-charcoal-400">
                Max: {filters.maxRating?.toFixed(1) || '10.0'}
              </span>
            </div>
            <Slider
              value={[filters.minRating || 0, filters.maxRating || 10]}
              min={0}
              max={10}
              step={0.5}
              onValueChange={([min, max]) => {
                updateFilter('minRating', min);
                updateFilter('maxRating', max);
              }}
              className="w-full"
            />
          </div>
        </FilterSection>
      )}

      {/* Location Filter */}
      {showLocationFilter && (
        <FilterSection title="Location" icon={<MapPin className="h-4 w-4" />} collapsible defaultOpen={false}>
          <input
            type="text"
            value={filters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value)}
            placeholder="City, region, or country..."
            className="w-full px-3 py-2 border border-neutral-200 dark:border-charcoal-700 rounded-lg bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </FilterSection>
      )}

      {/* Date Range Filter */}
      {showDateFilter && (
        <FilterSection title="Date Range" icon={<Calendar className="h-4 w-4" />} collapsible defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1 block">
                From
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-charcoal-700 rounded-lg bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1 block">
                To
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-charcoal-700 rounded-lg bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </FilterSection>
      )}

      {/* Save Preset */}
      {onSavePreset && activeFilterCount > 0 && (
        <div className="pt-4 border-t border-neutral-200 dark:border-charcoal-700">
          {showSavePreset ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="flex-1 px-3 py-2 border border-neutral-200 dark:border-charcoal-700 rounded-lg bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={handleSavePreset} disabled={!presetName.trim()}>
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowSavePreset(false);
                  setPresetName('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowSavePreset(true)}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Save as Preset
            </Button>
          )}
        </div>
      )}
    </div>
  );

  // Active filters display
  const activeFiltersBadges = activeFilterCount > 0 && (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      <span className="text-sm text-charcoal-500 dark:text-charcoal-400">Active:</span>

      {filters.sport?.map((sport) => (
        <Badge key={sport} variant="secondary" className="gap-1 pl-2">
          {SPORT_CONFIG[sport].icon} {SPORT_CONFIG[sport].name}
          <button
            onClick={() =>
              updateFilter(
                'sport',
                filters.sport?.filter((s) => s !== sport)
              )
            }
            className="ml-1 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {filters.type?.map((type) => (
        <Badge key={type} variant="secondary" className="gap-1">
          {RESULT_TYPES.find((t) => t.value === type)?.label}
          <button
            onClick={() =>
              updateFilter(
                'type',
                filters.type?.filter((t) => t !== type)
              )
            }
            className="ml-1 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {filters.position?.map((pos) => (
        <Badge key={pos} variant="secondary" className="gap-1">
          {pos}
          <button
            onClick={() =>
              updateFilter(
                'position',
                filters.position?.filter((p) => p !== pos)
              )
            }
            className="ml-1 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {filters.status?.map((status) => (
        <Badge key={status} variant="secondary" className="gap-1">
          {PLAYER_STATUSES.find((s) => s.value === status)?.label}
          <button
            onClick={() =>
              updateFilter(
                'status',
                filters.status?.filter((s) => s !== status)
              )
            }
            className="ml-1 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {((filters.minRating !== undefined && filters.minRating > 0) ||
        (filters.maxRating !== undefined && filters.maxRating < 10)) && (
        <Badge variant="secondary" className="gap-1">
          Rating: {filters.minRating || 0} - {filters.maxRating || 10}
          <button
            onClick={() => {
              updateFilter('minRating', undefined);
              updateFilter('maxRating', undefined);
            }}
            className="ml-1 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.location && (
        <Badge variant="secondary" className="gap-1">
          📍 {filters.location}
          <button
            onClick={() => updateFilter('location', undefined)}
            className="ml-1 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
        <RotateCcw className="h-3 w-3 mr-1" />
        Clear all
      </Button>
    </div>
  );

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={className}>
        <Card className="p-6">{filterContent}</Card>
        {activeFiltersBadges}
      </div>
    );
  }

  // Button or icon trigger with sheet
  return (
    <div className={cn('relative', className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {variant === 'icon' ? (
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          ) : (
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 bg-primary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
        </SheetTrigger>

        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </SheetTitle>
            <SheetDescription>
              Refine your search with multiple filters
            </SheetDescription>
          </SheetHeader>

          <div className="py-6">{filterContent}</div>

          <SheetFooter className="flex gap-2">
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
            <Button onClick={() => setIsOpen(false)} className="flex-1">
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {activeFiltersBadges}
    </div>
  );
}

AdvancedFilter.displayName = 'AdvancedFilter';

export default AdvancedFilter;
