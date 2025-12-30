'use client';

// ============================================================================
// 🏆 PITCHCONNECT PLAYER DIRECTORY v7.5.0
// ============================================================================
// Consolidated player management with role-based access
// Supports: SCOUT, ANALYST, ADMIN, SUPERADMIN, COACH, MANAGER
// ============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
  Star,
  Shield,
  MapPin,
  Calendar,
  Activity,
  X,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Grid3X3,
  List,
  FileSpreadsheet,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Sport,
  SPORT_CONFIGS,
  SPORT_POSITIONS,
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  PLAYER_STATUS_OPTIONS,
  getSportOptions,
  getPositionsForSport,
  formatPosition,
  getPlayerPermissions,
  type UserRole,
} from '@/lib/sport-config';

// ============================================================================
// TYPES
// ============================================================================

interface Player {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    dateOfBirth?: string;
  };
  primaryPosition?: string;
  secondaryPosition?: string;
  jerseyNumber?: number;
  height?: number;
  weight?: number;
  nationality?: string;
  isActive: boolean;
  isVerified: boolean;
  overallRating?: number;
  formRating?: number;
  availabilityStatus: string;
  createdAt: string;
  updatedAt: string;
  teamPlayers: {
    team: {
      id: string;
      name: string;
      club: {
        id: string;
        name: string;
        sport: Sport;
        logo?: string;
      };
    };
    isActive: boolean;
    isCaptain: boolean;
  }[];
  statistics: {
    goals: number;
    assists: number;
    matches: number;
  }[];
}

interface FilterState {
  search: string;
  sport: Sport | 'ALL';
  position: string;
  ageGroup: string;
  gender: string;
  status: string;
  clubId: string;
  teamId: string;
  verified: 'ALL' | 'VERIFIED' | 'UNVERIFIED';
  availability: string;
}

interface SortState {
  field: 'name' | 'position' | 'rating' | 'age' | 'createdAt';
  direction: 'asc' | 'desc';
}

// ============================================================================
// MOCK DATA (Replace with API calls)
// ============================================================================

const MOCK_PLAYERS: Player[] = [
  {
    id: '1',
    userId: 'u1',
    user: {
      id: 'u1',
      firstName: 'Marcus',
      lastName: 'Rashford',
      email: 'marcus@example.com',
      avatar: '/avatars/player1.jpg',
      dateOfBirth: '1997-10-31',
    },
    primaryPosition: 'LEFT_WINGER',
    secondaryPosition: 'STRIKER',
    jerseyNumber: 10,
    height: 180,
    weight: 70,
    nationality: 'English',
    isActive: true,
    isVerified: true,
    overallRating: 85,
    formRating: 78,
    availabilityStatus: 'AVAILABLE',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
    teamPlayers: [
      {
        team: {
          id: 't1',
          name: 'First Team',
          club: { id: 'c1', name: 'United FC', sport: 'FOOTBALL', logo: '/clubs/united.png' },
        },
        isActive: true,
        isCaptain: false,
      },
    ],
    statistics: [{ goals: 12, assists: 8, matches: 24 }],
  },
  {
    id: '2',
    userId: 'u2',
    user: {
      id: 'u2',
      firstName: 'Sarah',
      lastName: 'Thompson',
      email: 'sarah@example.com',
      dateOfBirth: '1999-03-15',
    },
    primaryPosition: 'GOAL_SHOOTER',
    jerseyNumber: 7,
    height: 185,
    weight: 72,
    nationality: 'Australian',
    isActive: true,
    isVerified: true,
    overallRating: 88,
    formRating: 90,
    availabilityStatus: 'AVAILABLE',
    createdAt: '2023-02-20T00:00:00Z',
    updatedAt: '2024-11-28T00:00:00Z',
    teamPlayers: [
      {
        team: {
          id: 't2',
          name: 'A Team',
          club: { id: 'c2', name: 'Lightning Netball', sport: 'NETBALL' },
        },
        isActive: true,
        isCaptain: true,
      },
    ],
    statistics: [{ goals: 156, assists: 0, matches: 20 }],
  },
  {
    id: '3',
    userId: 'u3',
    user: {
      id: 'u3',
      firstName: 'James',
      lastName: 'O\'Connor',
      email: 'james@example.com',
      dateOfBirth: '1995-07-22',
    },
    primaryPosition: 'FLY_HALF',
    jerseyNumber: 10,
    height: 183,
    weight: 88,
    nationality: 'Irish',
    isActive: true,
    isVerified: false,
    overallRating: 82,
    formRating: 84,
    availabilityStatus: 'INJURED',
    createdAt: '2023-03-10T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z',
    teamPlayers: [
      {
        team: {
          id: 't3',
          name: 'Senior XV',
          club: { id: 'c3', name: 'Shamrock RFC', sport: 'RUGBY' },
        },
        isActive: true,
        isCaptain: false,
      },
    ],
    statistics: [{ goals: 0, assists: 0, matches: 18 }],
  },
];

// ============================================================================
// PLAYER DIRECTORY PAGE
// ============================================================================

export default function PlayerDirectoryPage() {
  const { data: session } = useSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sport: 'ALL',
    position: '',
    ageGroup: '',
    gender: '',
    status: '',
    clubId: '',
    teamId: '',
    verified: 'ALL',
    availability: '',
  });

  // Sort state
  const [sort, setSort] = useState<SortState>({
    field: 'name',
    direction: 'asc',
  });

  // Get user permissions
  const userRole = (session?.user?.roles?.[0] || 'PLAYER') as UserRole;
  const permissions = getPlayerPermissions(userRole);

  // Fetch players
  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/players?' + new URLSearchParams(filters));
        // const data = await response.json();
        // setPlayers(data.players);

        // Using mock data for now
        await new Promise((resolve) => setTimeout(resolve, 500));
        setPlayers(MOCK_PLAYERS);
      } catch (err) {
        setError('Failed to load players. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (player) =>
          player.user.firstName.toLowerCase().includes(searchLower) ||
          player.user.lastName.toLowerCase().includes(searchLower) ||
          player.user.email.toLowerCase().includes(searchLower) ||
          player.nationality?.toLowerCase().includes(searchLower)
      );
    }

    // Sport filter
    if (filters.sport !== 'ALL') {
      result = result.filter((player) =>
        player.teamPlayers.some((tp) => tp.team.club.sport === filters.sport)
      );
    }

    // Position filter
    if (filters.position) {
      result = result.filter(
        (player) =>
          player.primaryPosition === filters.position ||
          player.secondaryPosition === filters.position
      );
    }

    // Status filter
    if (filters.status) {
      result = result.filter((player) =>
        filters.status === 'ACTIVE' ? player.isActive : !player.isActive
      );
    }

    // Verified filter
    if (filters.verified !== 'ALL') {
      result = result.filter((player) =>
        filters.verified === 'VERIFIED' ? player.isVerified : !player.isVerified
      );
    }

    // Availability filter
    if (filters.availability) {
      result = result.filter((player) => player.availabilityStatus === filters.availability);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'name':
          comparison = `${a.user.lastName} ${a.user.firstName}`.localeCompare(
            `${b.user.lastName} ${b.user.firstName}`
          );
          break;
        case 'rating':
          comparison = (b.overallRating || 0) - (a.overallRating || 0);
          break;
        case 'position':
          comparison = (a.primaryPosition || '').localeCompare(b.primaryPosition || '');
          break;
        case 'age':
          comparison = new Date(a.user.dateOfBirth || 0).getTime() - new Date(b.user.dateOfBirth || 0).getTime();
          break;
        case 'createdAt':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [players, filters, sort]);

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get positions for selected sport
  const availablePositions = useMemo(() => {
    if (filters.sport === 'ALL') {
      return [];
    }
    return getPositionsForSport(filters.sport);
  }, [filters.sport]);

  // Handle filter changes
  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      sport: 'ALL',
      position: '',
      ageGroup: '',
      gender: '',
      status: '',
      clubId: '',
      teamId: '',
      verified: 'ALL',
      availability: '',
    });
    setCurrentPage(1);
  }, []);

  // Toggle player selection
  const togglePlayerSelection = useCallback((playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  }, []);

  // Select all visible players
  const selectAllVisible = useCallback(() => {
    const visibleIds = paginatedPlayers.map((p) => p.id);
    setSelectedPlayers((prev) => {
      const allSelected = visibleIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }
      return [...new Set([...prev, ...visibleIds])];
    });
  }, [paginatedPlayers]);

  // Calculate player age
  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get player's primary sport
  const getPlayerSport = (player: Player): Sport => {
    return player.teamPlayers[0]?.team.club.sport || 'FOOTBALL';
  };

  // Render availability badge
  const renderAvailabilityBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      AVAILABLE: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Available' },
      INJURED: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Injured' },
      SUSPENDED: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Suspended' },
      INTERNATIONAL_DUTY: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Intl Duty' },
      UNAVAILABLE: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: 'Unavailable' },
    };

    const config = statusConfig[status] || statusConfig.UNAVAILABLE;

    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
        {config.label}
      </span>
    );
  };

  // Render player card (grid view)
  const renderPlayerCard = (player: Player) => {
    const sport = getPlayerSport(player);
    const sportConfig = SPORT_CONFIGS[sport];
    const age = calculateAge(player.user.dateOfBirth);
    const isSelected = selectedPlayers.includes(player.id);

    return (
      <div
        key={player.id}
        className={cn(
          'relative bg-zinc-900 border rounded-xl overflow-hidden transition-all duration-200',
          'hover:border-zinc-600 hover:shadow-lg hover:shadow-black/20',
          isSelected ? 'border-green-500 ring-2 ring-green-500/20' : 'border-zinc-800'
        )}
      >
        {/* Selection checkbox */}
        {permissions.canEdit && (
          <button
            onClick={() => togglePlayerSelection(player.id)}
            className={cn(
              'absolute top-3 left-3 z-10 w-5 h-5 rounded border-2 transition-colors',
              isSelected
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-zinc-600 hover:border-zinc-500'
            )}
          >
            {isSelected && <Check className="h-3 w-3 mx-auto" />}
          </button>
        )}

        {/* Sport badge */}
        <div className="absolute top-3 right-3 z-10">
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              sportConfig.bgColor,
              sportConfig.textColor
            )}
          >
            <sportConfig.icon className="h-3 w-3" />
            {sportConfig.shortName}
          </div>
        </div>

        {/* Player header */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                {player.user.avatar ? (
                  <Image
                    src={player.user.avatar}
                    alt={`${player.user.firstName} ${player.user.lastName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-zinc-400">
                    {player.user.firstName[0]}
                    {player.user.lastName[0]}
                  </span>
                )}
              </div>
              {player.jerseyNumber && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{player.jerseyNumber}</span>
                </div>
              )}
            </div>

            {/* Name & Position */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white truncate">
                  {player.user.firstName} {player.user.lastName}
                </h3>
                {player.isVerified && (
                  <Shield className="h-4 w-4 text-blue-400 flex-shrink-0" title="Verified" />
                )}
                {player.teamPlayers.some((tp) => tp.isCaptain) && (
                  <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold rounded">
                    C
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 truncate">
                {formatPosition(player.primaryPosition || '', sport)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-4 py-2 grid grid-cols-3 gap-2 border-t border-zinc-800">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{player.statistics[0]?.matches || 0}</p>
            <p className="text-[10px] text-zinc-500 uppercase">Matches</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{player.statistics[0]?.goals || 0}</p>
            <p className="text-[10px] text-zinc-500 uppercase">{sportConfig.primaryStat}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{player.statistics[0]?.assists || 0}</p>
            <p className="text-[10px] text-zinc-500 uppercase">{sportConfig.secondaryStat}</p>
          </div>
        </div>

        {/* Meta info */}
        <div className="px-4 py-2 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            {age && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {age}y
              </span>
            )}
            {player.nationality && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {player.nationality}
              </span>
            )}
          </div>
          {renderAvailabilityBadge(player.availabilityStatus)}
        </div>

        {/* Rating bar */}
        {player.overallRating && (
          <div className="px-4 py-2 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-500">Overall Rating</span>
              <span className="text-sm font-bold text-white">{player.overallRating}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  player.overallRating >= 80
                    ? 'bg-green-500'
                    : player.overallRating >= 60
                    ? 'bg-blue-500'
                    : player.overallRating >= 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${player.overallRating}%` }}
              />
            </div>
          </div>
        )}

        {/* Team info */}
        {player.teamPlayers[0] && (
          <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-2">
            {player.teamPlayers[0].team.club.logo && (
              <Image
                src={player.teamPlayers[0].team.club.logo}
                alt={player.teamPlayers[0].team.club.name}
                width={20}
                height={20}
                className="rounded"
              />
            )}
            <span className="text-xs text-zinc-400 truncate">
              {player.teamPlayers[0].team.club.name} • {player.teamPlayers[0].team.name}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-2">
          <Link
            href={`/dashboard/players/${player.id}`}
            className="flex-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium text-center transition-colors"
          >
            <Eye className="h-4 w-4 inline mr-1" />
            View
          </Link>
          {permissions.canEdit && (
            <Link
              href={`/dashboard/players/${player.id}/edit`}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
            >
              <Edit className="h-4 w-4" />
            </Link>
          )}
          <button className="px-2 py-1.5 text-zinc-400 hover:text-white transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // Render player row (list view)
  const renderPlayerRow = (player: Player) => {
    const sport = getPlayerSport(player);
    const sportConfig = SPORT_CONFIGS[sport];
    const age = calculateAge(player.user.dateOfBirth);
    const isSelected = selectedPlayers.includes(player.id);

    return (
      <tr
        key={player.id}
        className={cn(
          'border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors',
          isSelected && 'bg-green-500/5'
        )}
      >
        {permissions.canEdit && (
          <td className="px-4 py-3">
            <button
              onClick={() => togglePlayerSelection(player.id)}
              className={cn(
                'w-5 h-5 rounded border-2 transition-colors flex items-center justify-center',
                isSelected
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-zinc-600 hover:border-zinc-500'
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </button>
          </td>
        )}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              {player.user.avatar ? (
                <Image
                  src={player.user.avatar}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-zinc-400">
                  {player.user.firstName[0]}
                  {player.user.lastName[0]}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">
                  {player.user.firstName} {player.user.lastName}
                </span>
                {player.isVerified && <Shield className="h-4 w-4 text-blue-400" />}
              </div>
              <span className="text-sm text-zinc-500">{player.user.email}</span>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs', sportConfig.bgColor, sportConfig.textColor)}>
            <sportConfig.icon className="h-3 w-3" />
            {sportConfig.shortName}
          </div>
        </td>
        <td className="px-4 py-3 text-zinc-300">
          {formatPosition(player.primaryPosition || '', sport)}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="px-2 py-1 bg-zinc-800 rounded text-white font-medium">
            {player.jerseyNumber || '-'}
          </span>
        </td>
        <td className="px-4 py-3 text-zinc-300">{age ? `${age} years` : '-'}</td>
        <td className="px-4 py-3">{renderAvailabilityBadge(player.availabilityStatus)}</td>
        <td className="px-4 py-3">
          {player.overallRating && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="font-medium text-white">{player.overallRating}</span>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/players/${player.id}`}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Link>
            {permissions.canEdit && (
              <Link
                href={`/dashboard/players/${player.id}/edit`}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Link>
            )}
            <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="h-6 w-6 text-green-500" />
                Player Directory
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                {filteredPlayers.length} players found
                {selectedPlayers.length > 0 && (
                  <span className="ml-2 text-green-400">• {selectedPlayers.length} selected</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                  )}
                  title="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                  )}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Export button */}
              <button className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>

              {/* Add player button */}
              {permissions.canAdd && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-green-500/20 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Player
                </button>
              )}
            </div>
          </div>

          {/* Search and filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search players by name, email, or nationality..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
              />
            </div>

            {/* Sport filter */}
            <div className="relative">
              <select
                value={filters.sport}
                onChange={(e) => updateFilter('sport', e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 cursor-pointer"
              >
                <option value="ALL">All Sports</option>
                {getSportOptions().map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {sport.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            </div>

            {/* More filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                showFilters
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {Object.values(filters).filter((v) => v && v !== 'ALL').length > 1 && (
                <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  {Object.values(filters).filter((v) => v && v !== 'ALL').length - 1}
                </span>
              )}
            </button>
          </div>

          {/* Extended filters panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Position */}
                {filters.sport !== 'ALL' && (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Position</label>
                    <select
                      value={filters.position}
                      onChange={(e) => updateFilter('position', e.target.value)}
                      className="w-full appearance-none px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    >
                      <option value="">All Positions</option>
                      {availablePositions.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    className="w-full appearance-none px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Verification */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Verification</label>
                  <select
                    value={filters.verified}
                    onChange={(e) => updateFilter('verified', e.target.value)}
                    className="w-full appearance-none px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  >
                    <option value="ALL">All</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="UNVERIFIED">Unverified</option>
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Availability</label>
                  <select
                    value={filters.availability}
                    onChange={(e) => updateFilter('availability', e.target.value)}
                    className="w-full appearance-none px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  >
                    <option value="">All</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="INJURED">Injured</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INTERNATIONAL_DUTY">International Duty</option>
                  </select>
                </div>

                {/* Reset button */}
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-green-500 animate-spin mb-4" />
            <p className="text-zinc-400">Loading players...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredPlayers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="h-16 w-16 text-zinc-700 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No players found</h3>
            <p className="text-zinc-400 mb-6 text-center max-w-md">
              {filters.search || filters.sport !== 'ALL'
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by adding your first player to the directory.'}
            </p>
            {permissions.canAdd && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium transition-all hover:shadow-lg"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Add Player
              </button>
            )}
          </div>
        )}

        {/* Grid view */}
        {!isLoading && !error && filteredPlayers.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedPlayers.map(renderPlayerCard)}
          </div>
        )}

        {/* List view */}
        {!isLoading && !error && filteredPlayers.length > 0 && viewMode === 'list' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  {permissions.canEdit && (
                    <th className="px-4 py-3 w-10">
                      <button
                        onClick={selectAllVisible}
                        className={cn(
                          'w-5 h-5 rounded border-2 transition-colors flex items-center justify-center',
                          paginatedPlayers.every((p) => selectedPlayers.includes(p.id))
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-zinc-600 hover:border-zinc-500'
                        )}
                      >
                        {paginatedPlayers.every((p) => selectedPlayers.includes(p.id)) && (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400">Player</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400">Sport</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400">Position</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400 text-center">#</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400">Age</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400">Rating</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>{paginatedPlayers.map(renderPlayerRow)}</tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredPlayers.length)} of {filteredPlayers.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-10 h-10 rounded-lg font-medium transition-colors',
                      currentPage === page
                        ? 'bg-green-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    )}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
