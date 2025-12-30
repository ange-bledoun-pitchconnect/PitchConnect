// ============================================================================
// 🏆 PITCHCONNECT - Team Roster Page (Enterprise v7.7.0)
// ============================================================================
// Path: app/dashboard/teams/[teamId]/roster/page.tsx
// Full multi-sport support with enterprise dark mode design
// ============================================================================

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  getSportConfig,
  getPositionsForSport,
  calculateAge,
  PLAYER_STATUS_CONFIG,
  type PositionInfo,
} from '@/lib/sports/sport-config';
import { Sport, Position } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface TeamData {
  id: string;
  name: string;
  club: {
    id: string;
    name: string;
    sport: Sport;
    logo: string | null;
    slug: string;
  };
}

interface PlayerData {
  id: string;
  jerseyNumber: number | null;
  position: Position | null;
  isActive: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  joinedAt: Date;
  player: {
    id: string;
    primaryPosition: Position | null;
    secondaryPosition: Position | null;
    nationality: string | null;
    dateOfBirth: Date | null;
    height: number | null;
    weight: number | null;
    preferredFoot: string | null;
    availabilityStatus: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
      email: string;
    };
    aggregateStats: {
      totalMatches: number;
      totalGoals: number;
      totalAssists: number;
      avgRating: number;
    } | null;
  };
}

interface RosterPageProps {
  team: TeamData;
  players: PlayerData[];
  userPermissions: {
    canManageRoster: boolean;
    canEditPlayers: boolean;
  };
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

type FilterCategory = 'all' | 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'utility';
type SortOption = 'name' | 'number' | 'position' | 'age' | 'rating' | 'joined';
type StatusFilter = 'all' | 'active' | 'injured' | 'suspended' | 'on_loan';

// ============================================================================
// COMPONENTS
// ============================================================================

function SearchInput({ 
  value, 
  onChange,
  placeholder = 'Search players...',
}: { 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl
                   text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50
                   focus:ring-2 focus:ring-amber-500/20 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function PositionFilter({
  positions,
  activeFilter,
  onFilterChange,
  sport,
}: {
  positions: PositionInfo[];
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  sport: Sport;
}) {
  const categories: { key: FilterCategory; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#6b7280' },
    { key: 'goalkeeper', label: 'Goalkeepers', color: '#f59e0b' },
    { key: 'defender', label: 'Defenders', color: '#3b82f6' },
    { key: 'midfielder', label: 'Midfielders', color: '#22c55e' },
    { key: 'forward', label: 'Forwards', color: '#ef4444' },
    { key: 'utility', label: 'Utility', color: '#8b5cf6' },
  ];

  // Count players per category
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: positions.length };
    positions.forEach((p) => {
      result[p.category] = (result[p.category] || 0) + 1;
    });
    return result;
  }, [positions]);

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const count = counts[cat.key] || 0;
        if (cat.key !== 'all' && count === 0) return null;
        
        const isActive = activeFilter === cat.key;
        
        return (
          <button
            key={cat.key}
            onClick={() => onFilterChange(cat.key)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-200 border
              ${isActive
                ? 'border-transparent shadow-lg'
                : 'bg-[#2a2a2a] text-gray-300 border-[#3a3a3a] hover:border-[#4a4a4a] hover:text-white'
              }
            `}
            style={isActive ? {
              backgroundColor: `${cat.color}20`,
              borderColor: cat.color,
              color: cat.color,
            } : undefined}
          >
            <span>{cat.label}</span>
            <span className={`
              px-1.5 py-0.5 rounded-md text-xs
              ${isActive ? 'bg-white/20' : 'bg-[#3a3a3a]'}
            `}>
              {cat.key === 'all' ? 'all' : count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  const options: { value: SortOption; label: string }[] = [
    { value: 'number', label: 'Jersey Number' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'position', label: 'Position' },
    { value: 'age', label: 'Age' },
    { value: 'rating', label: 'Rating' },
    { value: 'joined', label: 'Join Date' },
  ];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="appearance-none pl-4 pr-10 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl
                   text-white focus:outline-none focus:border-amber-500/50
                   focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#2a2a2a]">
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = PLAYER_STATUS_CONFIG[status as keyof typeof PLAYER_STATUS_CONFIG] 
    || PLAYER_STATUS_CONFIG.ACTIVE;
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

function PlayerCard({
  player,
  positions,
  sport,
  canEdit,
}: {
  player: PlayerData;
  positions: PositionInfo[];
  sport: Sport;
  canEdit: boolean;
}) {
  const positionInfo = positions.find(p => p.position === player.position || p.position === player.player.primaryPosition);
  const age = calculateAge(player.player.dateOfBirth);
  const stats = player.player.aggregateStats;
  const sportConfig = getSportConfig(sport);

  return (
    <div className="group bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a] overflow-hidden
                    hover:border-amber-500/30 hover:shadow-xl hover:shadow-black/20 
                    transition-all duration-300 hover:-translate-y-1">
      {/* Captain/Vice Captain Badge */}
      {(player.isCaptain || player.isViceCaptain) && (
        <div className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/20">
          <span className="text-xs font-semibold text-amber-400">
            {player.isCaptain ? '👑 Captain' : '⭐ Vice Captain'}
          </span>
        </div>
      )}
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#3a3a3a] ring-2 ring-[#4a4a4a] group-hover:ring-amber-500/30 transition-all">
              {player.player.user.avatar ? (
                <Image
                  src={player.player.user.avatar}
                  alt={`${player.player.user.firstName} ${player.player.user.lastName}`}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-semibold">
                  {player.player.user.firstName[0]}{player.player.user.lastName[0]}
                </div>
              )}
            </div>
            {/* Jersey Number */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 
                            flex items-center justify-center shadow-lg shadow-amber-500/25">
              <span className="text-sm font-bold text-white">
                {player.jerseyNumber || '—'}
              </span>
            </div>
          </div>
          
          {/* Name & Position */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/dashboard/players/${player.player.id}`}
              className="font-bold text-lg text-white hover:text-amber-400 transition-colors block truncate"
            >
              {player.player.user.firstName} {player.player.user.lastName}
            </Link>
            
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {positionInfo && (
                <span
                  className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{
                    backgroundColor: `${positionInfo.color}20`,
                    color: positionInfo.color,
                  }}
                >
                  {positionInfo.name}
                </span>
              )}
              <StatusBadge status={player.player.availabilityStatus} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">{stats?.totalMatches || 0}</div>
            <div className="text-xs text-gray-500">Matches</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">
              {stats?.totalGoals || 0}
              <span className="text-gray-500 text-sm">/{stats?.totalAssists || 0}</span>
            </div>
            <div className="text-xs text-gray-500">G/A</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-amber-400">
              {stats?.avgRating ? stats.avgRating.toFixed(1) : '—'}
            </div>
            <div className="text-xs text-gray-500">Rating</div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-4">
          {age > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {age} years
            </span>
          )}
          {player.player.nationality && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              {player.player.nationality}
            </span>
          )}
          {player.player.height && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {player.player.height}cm
            </span>
          )}
          {player.player.preferredFoot && (
            <span className="flex items-center gap-1">
              🦶 {player.player.preferredFoot}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/dashboard/players/${player.player.id}`}
            className="flex-1 py-2.5 px-4 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl
                       text-center text-sm font-medium text-gray-300 hover:text-white
                       hover:border-amber-500/30 transition-all"
          >
            View Profile
          </Link>
          {canEdit && (
            <button
              className="p-2.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl
                         text-gray-400 hover:text-white hover:border-amber-500/30 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ searchQuery, sport }: { searchQuery: string; sport: Sport }) {
  const config = getSportConfig(sport);
  
  if (searchQuery) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#2a2a2a] flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Players Found</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          No players match your search "{searchQuery}". Try a different search term.
        </p>
      </div>
    );
  }
  
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#2a2a2a] flex items-center justify-center">
        <span className="text-4xl">{config.icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No Players in Roster</h3>
      <p className="text-gray-400 max-w-md mx-auto mb-6">
        This team doesn't have any players yet. Add players to build your {config.name.toLowerCase()} squad.
      </p>
      <Link
        href="#"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500
                   text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25
                   transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add First Player
      </Link>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TeamRosterClient({ team, players, userPermissions }: RosterPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('number');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const router = useRouter();
  const sport = team.club.sport;
  const sportConfig = getSportConfig(sport);
  const positions = getPositionsForSport(sport);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = [...players];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.player.user.firstName.toLowerCase().includes(query) ||
        p.player.user.lastName.toLowerCase().includes(query) ||
        (p.jerseyNumber?.toString() || '').includes(query)
      );
    }
    
    // Position category filter
    if (positionFilter !== 'all') {
      result = result.filter(p => {
        const pos = positions.find(
          pos => pos.position === p.position || pos.position === p.player.primaryPosition
        );
        return pos?.category === positionFilter;
      });
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'number':
          return (a.jerseyNumber || 999) - (b.jerseyNumber || 999);
        case 'name':
          return `${a.player.user.lastName} ${a.player.user.firstName}`
            .localeCompare(`${b.player.user.lastName} ${b.player.user.firstName}`);
        case 'age':
          const ageA = a.player.dateOfBirth ? calculateAge(a.player.dateOfBirth) : 0;
          const ageB = b.player.dateOfBirth ? calculateAge(b.player.dateOfBirth) : 0;
          return ageB - ageA;
        case 'rating':
          return (b.player.aggregateStats?.avgRating || 0) - (a.player.aggregateStats?.avgRating || 0);
        case 'joined':
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        default:
          return 0;
      }
    });
    
    return result;
  }, [players, searchQuery, positionFilter, sortBy, positions]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="/dashboard/teams" className="text-gray-400 hover:text-white transition-colors">
              Teams
            </Link>
            <span className="text-gray-600">/</span>
            <Link 
              href={`/dashboard/teams/${team.id}`}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {team.name}
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-amber-400">Roster</span>
          </nav>

          {/* Title */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              {team.club.logo ? (
                <Image
                  src={team.club.logo}
                  alt={team.club.name}
                  width={64}
                  height={64}
                  className="rounded-xl"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-3xl">{sportConfig.icon}</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    {team.name} Roster
                  </h1>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${sportConfig.color}20`,
                      color: sportConfig.color,
                    }}
                  >
                    <span>{sportConfig.icon}</span>
                    {sportConfig.name}
                  </span>
                </div>
                <p className="text-gray-400">
                  {team.club.name} • {players.length} Players
                </p>
              </div>
            </div>

            {userPermissions.canManageRoster && (
              <Link
                href={`/dashboard/teams/${team.id}/roster/add`}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500
                           text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25
                           transition-all duration-300 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Player
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={`Search ${sportConfig.name.toLowerCase()} players...`}
              />
            </div>
            
            {/* Sort */}
            <SortDropdown value={sortBy} onChange={setSortBy} />
            
            {/* View Toggle */}
            <div className="flex gap-1 p-1 bg-[#2a2a2a] rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Position Filters */}
          <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
            <PositionFilter
              positions={positions}
              activeFilter={positionFilter}
              onFilterChange={setPositionFilter}
              sport={sport}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            Showing <span className="text-white font-medium">{filteredPlayers.length}</span> of{' '}
            <span className="text-white font-medium">{players.length}</span> players
          </p>
        </div>

        {/* Players Grid/List */}
        {filteredPlayers.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                positions={positions}
                sport={sport}
                canEdit={userPermissions.canEditPlayers}
              />
            ))}
          </div>
        ) : (
          <EmptyState searchQuery={searchQuery} sport={sport} />
        )}
      </div>
    </div>
  );
}