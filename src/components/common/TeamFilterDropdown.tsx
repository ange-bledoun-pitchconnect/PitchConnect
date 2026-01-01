/**
 * ============================================================================
 * TeamFilterDropdown Component
 * ============================================================================
 * 
 * Enterprise-grade team filter dropdown with sport filtering support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - COACH: Filter players by team
 * - MANAGER: Team management views
 * - ANALYST: Data filtering
 * - ADMIN: Administrative views
 * - CLUB_MANAGER: Club-wide filtering
 * 
 * SCHEMA ALIGNMENT:
 * - Team model
 * - Sport enum
 * - Organisation model
 * 
 * FEATURES:
 * - Multi-select with checkboxes
 * - Sport-based grouping
 * - Search filter
 * - Select all / Clear all
 * - Dark mode support
 * - Keyboard navigation
 * - Mobile-responsive (bottom sheet on mobile)
 * - Accessible (ARIA labels)
 * 
 * ============================================================================
 */

'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Filter,
  ChevronDown,
  Check,
  X,
  Search,
  Users,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Sport type from schema
 */
type Sport =
  | 'FOOTBALL'
  | 'NETBALL'
  | 'RUGBY'
  | 'CRICKET'
  | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL'
  | 'HOCKEY'
  | 'LACROSSE'
  | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL'
  | 'FUTSAL'
  | 'BEACH_FOOTBALL';

/**
 * Team interface aligned with schema
 */
export interface Team {
  id: string;
  name: string;
  sport?: Sport;
  ageGroup?: string;
  isActive?: boolean;
  playerCount?: number;
}

/**
 * Component props
 */
export interface TeamFilterDropdownProps {
  /** Available teams */
  teams: Team[];
  /** Currently selected team IDs */
  selectedTeams: string[];
  /** Change handler */
  onChange: (selected: string[]) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Show sport grouping */
  groupBySport?: boolean;
  /** Show search input */
  showSearch?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Custom class name */
  className?: string;
  /** Max height for dropdown */
  maxHeight?: number;
  /** Position */
  position?: 'left' | 'right';
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_ICONS: Record<Sport, string> = {
  FOOTBALL: '⚽',
  NETBALL: '🏐',
  RUGBY: '🏉',
  CRICKET: '🏏',
  AMERICAN_FOOTBALL: '🏈',
  BASKETBALL: '🏀',
  HOCKEY: '🏒',
  LACROSSE: '🥍',
  AUSTRALIAN_RULES: '🏉',
  GAELIC_FOOTBALL: '🏐',
  FUTSAL: '⚽',
  BEACH_FOOTBALL: '🏖️',
};

const SPORT_LABELS: Record<Sport, string> = {
  FOOTBALL: 'Football',
  NETBALL: 'Netball',
  RUGBY: 'Rugby',
  CRICKET: 'Cricket',
  AMERICAN_FOOTBALL: 'American Football',
  BASKETBALL: 'Basketball',
  HOCKEY: 'Hockey',
  LACROSSE: 'Lacrosse',
  AUSTRALIAN_RULES: 'Australian Rules',
  GAELIC_FOOTBALL: 'Gaelic Football',
  FUTSAL: 'Futsal',
  BEACH_FOOTBALL: 'Beach Football',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TeamFilterDropdown({
  teams,
  selectedTeams,
  onChange,
  isLoading = false,
  disabled = false,
  groupBySport = false,
  showSearch = true,
  placeholder = 'Filter by team',
  className,
  maxHeight = 320,
  position = 'left',
}: TeamFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && showSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, showSearch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter teams based on search
  const filteredTeams = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return teams;

    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        team.ageGroup?.toLowerCase().includes(query) ||
        (team.sport && SPORT_LABELS[team.sport].toLowerCase().includes(query))
    );
  }, [teams, searchQuery]);

  // Group teams by sport
  const groupedTeams = useMemo(() => {
    if (!groupBySport) return { All: filteredTeams };

    return filteredTeams.reduce((groups, team) => {
      const sport = team.sport || 'OTHER';
      if (!groups[sport]) {
        groups[sport] = [];
      }
      groups[sport].push(team);
      return groups;
    }, {} as Record<string, Team[]>);
  }, [filteredTeams, groupBySport]);

  // Handlers
  const toggleTeam = useCallback(
    (id: string) => {
      if (selectedTeams.includes(id)) {
        onChange(selectedTeams.filter((tid) => tid !== id));
      } else {
        onChange([...selectedTeams, id]);
      }
    },
    [selectedTeams, onChange]
  );

  const selectAll = useCallback(() => {
    onChange(filteredTeams.map((t) => t.id));
  }, [filteredTeams, onChange]);

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const isSelected = (id: string) => selectedTeams.includes(id);

  // Button label
  const getButtonLabel = () => {
    if (selectedTeams.length === 0) {
      return placeholder;
    }
    if (selectedTeams.length === 1) {
      const team = teams.find((t) => t.id === selectedTeams[0]);
      return team?.name || '1 team';
    }
    if (selectedTeams.length === teams.length) {
      return 'All teams';
    }
    return `${selectedTeams.length} teams`;
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'justify-between gap-2 min-w-[180px]',
          selectedTeams.length > 0 &&
            'border-primary bg-primary/5 dark:bg-primary/10'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="truncate">{getButtonLabel()}</span>
        </div>
        <div className="flex items-center gap-1">
          {selectedTeams.length > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-xs">
              {selectedTeams.length}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-80 bg-white dark:bg-charcoal-800',
            'border border-gray-200 dark:border-charcoal-700',
            'rounded-lg shadow-xl',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            position === 'right' ? 'right-0' : 'left-0',
            // Mobile: full-width bottom sheet
            'md:relative md:mt-2',
            'max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:m-0',
            'max-md:rounded-b-none max-md:rounded-t-xl max-md:border-0'
          )}
          role="listbox"
          aria-multiselectable="true"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-charcoal-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Filter Teams
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={filteredTeams.length === 0}
                  className="text-xs text-primary hover:underline disabled:opacity-50"
                >
                  Select All
                </button>
                <span className="text-gray-300 dark:text-charcoal-600">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={selectedTeams.length === 0}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search */}
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Team List */}
          <div
            className="overflow-y-auto p-2"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="w-10 h-10 text-gray-300 dark:text-charcoal-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No teams match your search' : 'No teams available'}
                </p>
              </div>
            ) : (
              Object.entries(groupedTeams).map(([group, groupTeams]) => (
                <div key={group}>
                  {/* Group Header (when grouped by sport) */}
                  {groupBySport && group !== 'All' && (
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span>
                        {SPORT_ICONS[group as Sport] || '🏆'}
                      </span>
                      <span>
                        {SPORT_LABELS[group as Sport] || group}
                      </span>
                      <span className="text-gray-400 dark:text-charcoal-500">
                        ({groupTeams.length})
                      </span>
                    </div>
                  )}

                  {/* Team Items */}
                  {groupTeams.map((team) => (
                    <label
                      key={team.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors',
                        'hover:bg-gray-100 dark:hover:bg-charcoal-700',
                        isSelected(team.id) && 'bg-primary/5 dark:bg-primary/10'
                      )}
                    >
                      {/* Checkbox */}
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          isSelected(team.id)
                            ? 'bg-primary border-primary'
                            : 'border-gray-300 dark:border-charcoal-600'
                        )}
                      >
                        {isSelected(team.id) && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected(team.id)}
                        onChange={() => toggleTeam(team.id)}
                        className="sr-only"
                        role="option"
                        aria-selected={isSelected(team.id)}
                      />

                      {/* Team Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {team.sport && !groupBySport && (
                            <span className="text-sm">
                              {SPORT_ICONS[team.sport]}
                            </span>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {team.name}
                          </span>
                        </div>
                        {team.ageGroup && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {team.ageGroup}
                          </span>
                        )}
                      </div>

                      {/* Player Count */}
                      {team.playerCount !== undefined && (
                        <span className="text-xs text-gray-400 dark:text-charcoal-500">
                          {team.playerCount} players
                        </span>
                      )}

                      {/* Active Indicator */}
                      {team.isActive === false && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {selectedTeams.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-900/50 rounded-b-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {selectedTeams.length} of {teams.length} teams selected
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

TeamFilterDropdown.displayName = 'TeamFilterDropdown';

export default TeamFilterDropdown;
