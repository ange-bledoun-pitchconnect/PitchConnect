'use client';

// ============================================================================
// 👥 PITCHCONNECT - PLAYERS CLIENT COMPONENT
// ============================================================================
// Full roster management with filters, search, and player cards
// ============================================================================

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  FileText,
  Download,
} from 'lucide-react';
import { Sport, Position, TeamPlayerStatus, InjurySeverity } from '@prisma/client';
import {
  getSportConfig,
  SPORT_POSITIONS,
  formatPositionName,
} from '@/lib/sport-config';
import { format, differenceInYears } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface PlayersClientProps {
  team: {
    id: string;
    name: string;
    club: {
      id: string;
      name: string;
      sport: Sport;
      teamType: string;
      settings: any;
    };
  };
  teamPlayers: TeamPlayerWithRelations[];
  pendingRequests: JoinRequest[];
  stats: PlayerStats;
  permissions: {
    canManagePlayers: boolean;
    canViewContracts: boolean;
    userRole: string;
  };
  sport: Sport;
}

interface TeamPlayerWithRelations {
  id: string;
  jerseyNumber: number | null;
  position: Position | null;
  status: TeamPlayerStatus;
  joinedAt: Date;
  player: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl: string | null;
      dateOfBirth: Date | null;
      phone: string | null;
    };
    injuries: { id: string; severity: InjurySeverity; status: string; expectedReturnDate: Date | null }[];
    contracts: { id: string; endDate: Date }[];
    statistics: any[];
    aggregateStats: any[];
  };
}

interface JoinRequest {
  id: string;
  status: string;
  createdAt: Date;
  message: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface PlayerStats {
  total: number;
  active: number;
  onLoan: number;
  injured: number;
  byPosition: Record<string, number>;
  averageAge: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PlayersClient({
  team,
  teamPlayers,
  pendingRequests,
  stats,
  permissions,
  sport,
}: PlayersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sportConfig = getSportConfig(sport);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<Position | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<TeamPlayerStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  // Sport positions
  const sportPositions = SPORT_POSITIONS[sport] || [];

  // Filtered players
  const filteredPlayers = useMemo(() => {
    return teamPlayers.filter((tp) => {
      // Search filter
      const name = `${tp.player.user.firstName} ${tp.player.user.lastName}`.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        name.includes(searchQuery.toLowerCase()) ||
        tp.jerseyNumber?.toString().includes(searchQuery);

      // Position filter
      const matchesPosition =
        positionFilter === 'ALL' || tp.position === positionFilter;

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || tp.status === statusFilter;

      return matchesSearch && matchesPosition && matchesStatus;
    });
  }, [teamPlayers, searchQuery, positionFilter, statusFilter]);

  // Group players by position
  const playersByPosition = useMemo(() => {
    const groups: Record<string, TeamPlayerWithRelations[]> = {};
    filteredPlayers.forEach((tp) => {
      const pos = tp.position || 'UNASSIGNED';
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push(tp);
    });
    return groups;
  }, [filteredPlayers]);

  // Handle join request
  const handleJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await fetch(`/api/teams/${team.id}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to process join request:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Team Squad
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {team.name} • {sportConfig.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pending Requests Badge */}
          {permissions.canManagePlayers && pendingRequests.length > 0 && (
            <button
              onClick={() => setShowRequestsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {pendingRequests.length} Pending Request{pendingRequests.length > 1 ? 's' : ''}
            </button>
          )}

          {permissions.canManagePlayers && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Players"
          value={stats.total}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="On Loan"
          value={stats.onLoan}
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          title="Injured"
          value={stats.injured}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Avg Age"
          value={stats.averageAge}
          icon={<Calendar className="w-5 h-5" />}
          color="purple"
          suffix=" yrs"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Position Filter */}
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value as Position | 'ALL')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="ALL">All Positions</option>
          {sportPositions.map((pos) => (
            <option key={pos} value={pos}>
              {formatPositionName(pos)}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TeamPlayerStatus | 'ALL')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LOAN">On Loan</option>
          <option value="INJURED">Injured</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-700 shadow'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 shadow'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Export */}
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Players Display */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery || positionFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No players match your filters'
              : 'No players in this team'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || positionFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'Add players to build your squad'}
          </p>
          {permissions.canManagePlayers && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Player
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-8">
          {Object.entries(playersByPosition).map(([position, players]) => (
            <div key={position}>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {position === 'UNASSIGNED' ? 'No Position' : formatPositionName(position as Position)}
                <span className="text-sm font-normal text-gray-500">
                  ({players.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {players.map((tp) => (
                  <PlayerCard
                    key={tp.id}
                    player={tp}
                    clubId={team.club.id}
                    teamId={team.id}
                    canManage={permissions.canManagePlayers}
                    canViewContracts={permissions.canViewContracts}
                    sport={sport}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPlayers.map((tp) => (
                <PlayerRow
                  key={tp.id}
                  player={tp}
                  clubId={team.club.id}
                  teamId={team.id}
                  canManage={permissions.canManagePlayers}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Position Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Position Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sportPositions.map((position) => {
            const count = stats.byPosition[position] || 0;
            return (
              <div
                key={position}
                className={`p-4 rounded-lg text-center ${
                  count > 0
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'bg-gray-50 dark:bg-gray-900/50'
                }`}
              >
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {count}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {formatPositionName(position)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Join Requests Modal */}
      {showRequestsModal && (
        <JoinRequestsModal
          requests={pendingRequests}
          onClose={() => setShowRequestsModal(false)}
          onAction={handleJoinRequest}
        />
      )}
    </div>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({
  title,
  value,
  icon,
  color,
  suffix = '',
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  suffix?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}{suffix}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PLAYER CARD COMPONENT
// ============================================================================

function PlayerCard({
  player,
  clubId,
  teamId,
  canManage,
  canViewContracts,
  sport,
}: {
  player: TeamPlayerWithRelations;
  clubId: string;
  teamId: string;
  canManage: boolean;
  canViewContracts: boolean;
  sport: Sport;
}) {
  const hasInjury = player.player.injuries.length > 0;
  const age = player.player.user.dateOfBirth
    ? differenceInYears(new Date(), new Date(player.player.user.dateOfBirth))
    : null;

  const getStatusBadge = () => {
    const styles: Record<TeamPlayerStatus, string> = {
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      ON_LOAN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      INJURED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      SUSPENDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      RELEASED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      TRANSFERRED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return styles[player.status] || styles.ACTIVE;
  };

  return (
    <Link
      href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}/players/${player.player.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden group"
    >
      {/* Header with number */}
      <div className="relative h-20 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="absolute -bottom-6 left-4">
          {player.player.user.avatarUrl ? (
            <img
              src={player.player.user.avatarUrl}
              alt=""
              className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-300">
              {player.player.user.firstName[0]}
              {player.player.user.lastName[0]}
            </div>
          )}
        </div>
        <div className="absolute top-2 right-2 text-3xl font-bold text-white/80">
          {player.jerseyNumber || '—'}
        </div>
        {hasInjury && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Injured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-8 px-4 pb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {player.player.user.firstName} {player.player.user.lastName}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {player.position ? formatPositionName(player.position) : 'No position'}
        </p>

        <div className="flex items-center justify-between mt-3">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge()}`}>
            {player.status}
          </span>
          {age !== null && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {age} yrs
            </span>
          )}
        </div>

        {/* Quick stats */}
        {player.player.aggregateStats[0] && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {player.player.aggregateStats[0].appearances || 0}
              </p>
              <p className="text-xs text-gray-500">Apps</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {player.player.aggregateStats[0].goals || 0}
              </p>
              <p className="text-xs text-gray-500">Goals</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {player.player.aggregateStats[0].assists || 0}
              </p>
              <p className="text-xs text-gray-500">Assists</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// PLAYER ROW COMPONENT (List View)
// ============================================================================

function PlayerRow({
  player,
  clubId,
  teamId,
  canManage,
}: {
  player: TeamPlayerWithRelations;
  clubId: string;
  teamId: string;
  canManage: boolean;
}) {
  const hasInjury = player.player.injuries.length > 0;
  const age = player.player.user.dateOfBirth
    ? differenceInYears(new Date(), new Date(player.player.user.dateOfBirth))
    : null;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-4">
        <Link
          href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}/players/${player.player.id}`}
          className="flex items-center gap-3"
        >
          <div className="relative">
            {player.player.user.avatarUrl ? (
              <img
                src={player.player.user.avatarUrl}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium">
                {player.jerseyNumber || '?'}
              </div>
            )}
            {hasInjury && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
              {player.player.user.firstName} {player.player.user.lastName}
            </p>
            <p className="text-sm text-gray-500">#{player.jerseyNumber || '—'}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
        {player.position ? formatPositionName(player.position) : '—'}
      </td>
      <td className="px-4 py-4">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            player.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : player.status === 'INJURED'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
          }`}
        >
          {player.status}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
        {age !== null ? `${age} yrs` : '—'}
      </td>
      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
        {format(new Date(player.joinedAt), 'MMM yyyy')}
      </td>
      <td className="px-4 py-4 text-right">
        {canManage && (
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

// ============================================================================
// JOIN REQUESTS MODAL
// ============================================================================

function JoinRequestsModal({
  requests,
  onClose,
  onAction,
}: {
  requests: JoinRequest[];
  onClose: () => void;
  onAction: (id: string, action: 'approve' | 'reject') => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Pending Join Requests
            </h2>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {requests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No pending requests
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {requests.map((request) => (
                  <div key={request.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {request.user.avatarUrl ? (
                        <img
                          src={request.user.avatarUrl}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium">
                          {request.user.firstName[0]}
                          {request.user.lastName[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.user.firstName} {request.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{request.user.email}</p>
                        {request.message && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                            "{request.message}"
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(request.createdAt), 'PPP')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => onAction(request.id, 'approve')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => onAction(request.id, 'reject')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}