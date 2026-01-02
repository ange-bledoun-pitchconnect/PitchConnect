/**
 * ============================================================================
 * SQUAD WIDGET COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * World-class multi-sport squad display widget.
 * Shows team roster with sport-specific position groupings.
 * 
 * FEATURES:
 * - 12-sport position categorization
 * - Team filtering (multi-team support)
 * - Position-based grouping
 * - Quick stats summary
 * - Grid/list view toggle
 * - Search and filter
 * - Responsive design
 * - Dark mode support
 * 
 * @version 2.0.0
 * @path src/components/sections/squad/SquadWidget.tsx
 * 
 * ============================================================================
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  Shield,
  Target,
  Zap,
  Activity,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamFilter } from '@/lib/dashboard/team-context';
import { PlayerCard, PlayerCardSkeleton, type PlayerCardPlayer } from '@/components/player/PlayerCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SPORT_POSITIONS,
  getSportPositions,
  getPositionsByCategory,
  type PositionCategory,
  type SportPositionConfig,
} from '@/config/sport-positions-config';
import { type Sport } from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

export interface SquadPlayer extends PlayerCardPlayer {
  userId: string;
  currentTeamId: string;
}

export interface TeamSquad {
  teamId: string;
  teamName: string;
  teamColor?: string;
  players: SquadPlayer[];
}

export interface SquadWidgetProps {
  /** Teams and their players */
  teamsData: TeamSquad[];
  /** Sport context for positions */
  sport: Sport;
  /** Widget title */
  title?: string;
  /** Show search bar */
  showSearch?: boolean;
  /** Show position filter */
  showPositionFilter?: boolean;
  /** Show view toggle (grid/list) */
  showViewToggle?: boolean;
  /** Default view mode */
  defaultView?: 'grid' | 'list';
  /** Loading state */
  isLoading?: boolean;
  /** Callback when player is clicked */
  onPlayerClick?: (player: SquadPlayer) => void;
  /** Callback to view player profile */
  onViewProfile?: (playerId: string) => void;
  /** Callback to send message */
  onMessage?: (playerId: string) => void;
  /** Callback to add player */
  onAddPlayer?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// CATEGORY ICONS
// =============================================================================

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  GOALKEEPER: Shield,
  DEFENSE: Shield,
  MIDFIELD: Activity,
  ATTACK: Target,
  FORWARD: Target,
  GUARD: Activity,
  CENTER: Users,
  FRONT_ROW: Zap,
  BACK_ROW: Shield,
  BATTING: Target,
  BOWLING: Activity,
  SHOOTING: Target,
  DEFAULT: Users,
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface PositionStatsProps {
  sport: Sport;
  players: SquadPlayer[];
}

function PositionStats({ sport, players }: PositionStatsProps) {
  const sportConfig = getSportPositions(sport);
  
  // Count players by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    sportConfig.categories.forEach(cat => {
      const categoryPositions = getPositionsByCategory(sport, cat.category);
      const positionCodes = categoryPositions.map(p => p.code);
      counts[cat.category] = players.filter(p => positionCodes.includes(p.position)).length;
    });
    
    return counts;
  }, [sport, players, sportConfig]);
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {sportConfig.categories.slice(0, 4).map(category => {
        const Icon = CATEGORY_ICONS[category.category] || CATEGORY_ICONS.DEFAULT;
        const count = categoryCounts[category.category] || 0;
        
        return (
          <div
            key={category.category}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-charcoal-800 border border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-600 transition-colors"
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <Icon
                className="h-5 w-5"
                style={{ color: category.color }}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {category.name}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {count}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface PositionGroupProps {
  categoryName: string;
  categoryColor: string;
  players: SquadPlayer[];
  sport: Sport;
  viewMode: 'grid' | 'list';
  onPlayerClick?: (player: SquadPlayer) => void;
  onViewProfile?: (playerId: string) => void;
  onMessage?: (playerId: string) => void;
}

function PositionGroup({
  categoryName,
  categoryColor,
  players,
  sport,
  viewMode,
  onPlayerClick,
  onViewProfile,
  onMessage,
}: PositionGroupProps) {
  if (players.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="w-1 h-6 rounded-full"
          style={{ backgroundColor: categoryColor }}
        />
        <h4 className="font-semibold text-gray-900 dark:text-white">
          {categoryName}
        </h4>
        <Badge variant="secondary" className="text-xs">
          {players.length}
        </Badge>
      </div>
      
      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
            : 'flex flex-col gap-2'
        )}
      >
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            sport={sport}
            size={viewMode === 'grid' ? 'md' : 'sm'}
            showStats={viewMode === 'grid'}
            onClick={() => onPlayerClick?.(player)}
            onViewProfile={onViewProfile}
            onMessage={onMessage}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SquadWidget({
  teamsData,
  sport,
  title = 'Squad Overview',
  showSearch = true,
  showPositionFilter = true,
  showViewToggle = true,
  defaultView = 'grid',
  isLoading = false,
  onPlayerClick,
  onViewProfile,
  onMessage,
  onAddPlayer,
  className,
}: SquadWidgetProps) {
  const { selectedTeams } = useTeamFilter();
  const sportConfig = getSportPositions(sport);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
  const [activeTeamTab, setActiveTeamTab] = useState<string | 'all'>('all');
  
  // Filter teams based on selection
  const visibleTeams = useMemo(() => {
    return teamsData.filter(team => selectedTeams.includes(team.teamId));
  }, [teamsData, selectedTeams]);
  
  // Determine which teams to display
  const displayTeams = useMemo(() => {
    if (activeTeamTab === 'all') {
      return visibleTeams;
    }
    return visibleTeams.filter(t => t.teamId === activeTeamTab);
  }, [visibleTeams, activeTeamTab]);
  
  // Get all players from displayed teams
  const allPlayers = useMemo(() => {
    return displayTeams.flatMap(t => t.players);
  }, [displayTeams]);
  
  // Apply filters
  const filteredPlayers = useMemo(() => {
    let players = allPlayers;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      players = players.filter(p =>
        `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query) ||
        (p.jerseyNumber?.toString() || '').includes(query)
      );
    }
    
    // Position filter
    if (positionFilter !== 'ALL') {
      const categoryPositions = getPositionsByCategory(sport, positionFilter as PositionCategory);
      const positionCodes = categoryPositions.map(p => p.code);
      players = players.filter(p => positionCodes.includes(p.position));
    }
    
    return players;
  }, [allPlayers, searchQuery, positionFilter, sport]);
  
  // Group players by position category
  const playersByCategory = useMemo(() => {
    const grouped = new Map<string, SquadPlayer[]>();
    
    sportConfig.categories.forEach(cat => {
      const categoryPositions = getPositionsByCategory(sport, cat.category);
      const positionCodes = categoryPositions.map(p => p.code);
      const categoryPlayers = filteredPlayers.filter(p => positionCodes.includes(p.position));
      if (categoryPlayers.length > 0) {
        grouped.set(cat.category, categoryPlayers);
      }
    });
    
    return grouped;
  }, [filteredPlayers, sport, sportConfig]);
  
  // Stats calculation
  const stats = useMemo(() => ({
    totalPlayers: filteredPlayers.length,
    teamsCount: displayTeams.length,
  }), [filteredPlayers, displayTeams]);
  
  if (visibleTeams.length === 0) {
    return (
      <div className={cn('rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-charcoal-900 p-8', className)}>
        <div className="flex flex-col items-center justify-center text-center">
          <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No teams selected. Choose teams from the filter above.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-charcoal-900 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-100 dark:bg-gold-900/30 rounded-lg">
              <Users className="h-6 w-6 text-gold-600 dark:text-gold-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.totalPlayers} players across {stats.teamsCount} team{stats.teamsCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {onAddPlayer && (
            <Button onClick={onAddPlayer} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Player
            </Button>
          )}
        </div>
        
        {/* Team Tabs */}
        {visibleTeams.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <button
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTeamTab === 'all'
                  ? 'bg-gold-500 text-white'
                  : 'bg-gray-100 dark:bg-charcoal-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-700'
              )}
              onClick={() => setActiveTeamTab('all')}
            >
              All Teams
            </button>
            {visibleTeams.map(team => (
              <button
                key={team.teamId}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeTeamTab === team.teamId
                    ? 'bg-gold-500 text-white'
                    : 'bg-gray-100 dark:bg-charcoal-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-700'
                )}
                onClick={() => setActiveTeamTab(team.teamId)}
              >
                {team.teamName}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {team.players.length}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Position Stats */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-charcoal-950/50">
        <PositionStats sport={sport} players={filteredPlayers} />
      </div>
      
      {/* Filters */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {/* Position Filter */}
          {showPositionFilter && (
            <Select
              value={positionFilter}
              onValueChange={setPositionFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Positions</SelectItem>
                {sportConfig.categories.map(cat => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-gold-500 text-white'
                    : 'bg-white dark:bg-charcoal-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-700'
                )}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list'
                    ? 'bg-gold-500 text-white'
                    : 'bg-white dark:bg-charcoal-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-700'
                )}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Players Grid */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <PlayerCardSkeleton key={i} size="md" />
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || positionFilter !== 'ALL'
                ? 'No players match your filters'
                : 'No players in this team'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {[...playersByCategory].map(([category, players]) => {
              const categoryConfig = sportConfig.categories.find(c => c.category === category);
              return (
                <PositionGroup
                  key={category}
                  categoryName={categoryConfig?.name || category}
                  categoryColor={categoryConfig?.color || '#6B7280'}
                  players={players}
                  sport={sport}
                  viewMode={viewMode}
                  onPlayerClick={onPlayerClick}
                  onViewProfile={onViewProfile}
                  onMessage={onMessage}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default SquadWidget;