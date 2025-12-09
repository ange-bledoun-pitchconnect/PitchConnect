'use client';

/**
 * Team Players Management Page
 * Path: /dashboard/manager/clubs/[clubId]/teams/[teamId]/players
 * 
 * Core Features:
 * - Complete player roster management
 * - Add players by email with position assignment
 * - Set and manage team captain
 * - Remove players from team
 * - Search and filter players
 * - Real-time player statistics
 * - Jersey number management
 * - Player performance tracking
 * - Responsive UI with dark mode
 * 
 * Schema Aligned: Team, Player, User, PlayerTeam models from Prisma
 * Team relationships: Team -> Player (many-to-many via PlayerTeam)
 * 
 * Business Logic:
 * - Only club managers can manage team players
 * - One captain per team
 * - Players can have assigned positions
 * - Email-based player lookup for adding to team
 */

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Users,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Edit3,
  Crown,
  ShirtIcon,
  Mail,
  Search,
  CheckCircle,
  X,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ============================================================================
// TYPES - Schema Aligned
// ============================================================================

interface PlayerUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface Player {
  id: string;
  userId: string;
  teamId: string;
  position: 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD' | 'WINGER' | 'STRIKER' | null;
  jerseyNumber?: number;
  isCaptain: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'INJURED' | 'SUSPENDED';
  user: PlayerUser;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  name: string;
  clubId: string;
  coach?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  _count?: {
    players: number;
    coaches: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

// ============================================================================
// CONSTANTS - Schema Aligned
// ============================================================================

const PLAYER_POSITIONS = [
  { id: 'GOALKEEPER', label: 'Goalkeeper', abbr: 'GK', color: 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400' },
  { id: 'DEFENDER', label: 'Defender', abbr: 'DEF', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'MIDFIELDER', label: 'Midfielder', abbr: 'MID', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { id: 'FORWARD', label: 'Forward', abbr: 'FWD', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { id: 'WINGER', label: 'Winger', abbr: 'WIN', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 'STRIKER', label: 'Striker', abbr: 'ST', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
];

const PLAYER_STATUS = [
  { id: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { id: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  { id: 'INJURED', label: 'Injured', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { id: 'SUSPENDED', label: 'Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const EMPTY_MESSAGES = {
  noPlayers: {
    title: 'No players yet',
    description: 'Add your first player to get started building your team',
  },
  noSearch: {
    title: 'No players match',
    description: 'Try a different search term or add a new player',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function TeamPlayersPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  useEffect(() => {
    if (clubId && teamId) {
      fetchTeamAndPlayers();
    }
  }, [clubId, teamId]);

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  /**
   * Fetch team details and player roster
   */
  const fetchTeamAndPlayers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [teamRes, playersRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`),
      ]);

      if (!teamRes.ok) {
        throw new Error(`Failed to fetch team: ${teamRes.statusText}`);
      }
      if (!playersRes.ok) {
        throw new Error(`Failed to fetch players: ${playersRes.statusText}`);
      }

      const teamData: ApiResponse<Team> | Team = await teamRes.json();
      const playersData: ApiResponse<Player[]> | Player[] = await playersRes.json();

      // Handle both direct and wrapped responses
      const team = (teamData as ApiResponse<Team>)?.data || (teamData as Team);
      const playersList = (playersData as ApiResponse<Player[]>)?.data || (Array.isArray(playersData) ? playersData : []);

      setTeam(team);
      setPlayers(playersList);

      console.log('✅ Team and players loaded:', team.name, `(${playersList.length} players)`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      console.error('❌ Error fetching data:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, teamId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Add a new player to the team by email
   */
  const handleAddPlayer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!newPlayerEmail.trim()) {
        toast.error('Email is required');
        return;
      }

      try {
        setIsAddingPlayer(true);

        // Find user by email
        const userRes = await fetch(
          `/api/users/search?email=${encodeURIComponent(newPlayerEmail)}`
        );

        if (!userRes.ok) {
          const error = await userRes.json();
          throw new Error(error.error || 'User not found with that email');
        }

        const userData = await userRes.json();

        // Add player to team
        const response = await fetch(
          `/api/manager/clubs/${clubId}/teams/${teamId}/players`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.id,
              position: selectedPosition || null,
              jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
              status: 'ACTIVE',
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add player');
        }

        const newPlayer = await response.json();
        const addedPlayer = newPlayer.data || newPlayer;

        setPlayers([addedPlayer, ...players]);
        setNewPlayerEmail('');
        setSelectedPosition('');
        setJerseyNumber('');

        toast.success(
          `${userData.firstName} ${userData.lastName} added successfully!`
        );

        console.log('✅ Player added:', addedPlayer.id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add player';
        console.error('❌ Error adding player:', errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsAddingPlayer(false);
      }
    },
    [clubId, teamId, players, selectedPosition, newPlayerEmail, jerseyNumber]
  );

  /**
   * Remove a player from the team
   */
  const handleRemovePlayer = useCallback(
    async (playerId: string, playerName: string) => {
      if (
        !confirm(
          `Are you sure you want to remove ${playerName} from ${team?.name}? This action cannot be undone.`
        )
      ) {
        return;
      }

      try {
        const response = await fetch(
          `/api/manager/clubs/${clubId}/teams/${teamId}/players/${playerId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          throw new Error('Failed to remove player');
        }

        setPlayers(players.filter((p) => p.id !== playerId));
        toast.success(`${playerName} removed from team`);

        console.log('✅ Player removed:', playerId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove player';
        console.error('❌ Error removing player:', errorMessage);
        toast.error(errorMessage);
      }
    },
    [clubId, teamId, players, team?.name]
  );

  /**
   * Toggle player captain status
   */
  const handleToggleCaptain = useCallback(
    async (playerId: string, isCaptain: boolean, playerName: string) => {
      try {
        const response = await fetch(
          `/api/manager/clubs/${clubId}/teams/${teamId}/players/${playerId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isCaptain: !isCaptain }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update captain status');
        }

        const result = await response.json();
        const updatedPlayer = result.data || result;

        setPlayers(
          players.map((p) => {
            if (p.id === playerId) {
              return updatedPlayer;
            }
            // Remove captain status from other players if setting new captain
            if (!isCaptain && p.isCaptain) {
              return { ...p, isCaptain: false };
            }
            return p;
          })
        );

        const action = !isCaptain ? 'Appointed' : 'Removed';
        toast.success(`${action} ${playerName} as team captain`);

        console.log('✅ Captain status updated:', playerId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update captain';
        console.error('❌ Error updating captain:', errorMessage);
        toast.error(errorMessage);
      }
    },
    [clubId, teamId, players]
  );

  /**
   * Update player position
   */
  const handleUpdatePosition = useCallback(
    async (playerId: string, newPosition: string, playerName: string) => {
      try {
        const response = await fetch(
          `/api/manager/clubs/${clubId}/teams/${teamId}/players/${playerId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: newPosition || null }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update position');
        }

        const result = await response.json();
        const updatedPlayer = result.data || result;

        setPlayers(players.map((p) => (p.id === playerId ? updatedPlayer : p)));
        setEditingPlayerId(null);

        const posLabel = PLAYER_POSITIONS.find((p) => p.id === newPosition)?.label || 'No position';
        toast.success(`Updated ${playerName}'s position to ${posLabel}`);

        console.log('✅ Position updated:', playerId, newPosition);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update position';
        console.error('❌ Error updating position:', errorMessage);
        toast.error(errorMessage);
      }
    },
    [clubId, teamId, players]
  );

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Filter players by search query
   */
  const filteredPlayers = players.filter((p) =>
    `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Calculate player statistics
   */
  const stats = {
    total: players.length,
    captains: players.filter((p) => p.isCaptain).length,
    withPosition: players.filter((p) => p.position).length,
    active: players.filter((p) => p.status === 'ACTIVE').length,
  };

  /**
   * Get position label and style
   */
  const getPositionLabel = (positionId: string | null) => {
    if (!positionId) return null;
    return PLAYER_POSITIONS.find((p) => p.id === positionId);
  };

  /**
   * Get status badge styling
   */
  const getStatusStyle = (status: string) => {
    return PLAYER_STATUS.find((s) => s.id === status) || PLAYER_STATUS[0];
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gold-200 dark:border-gold-800" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold-500 border-r-gold-400 dark:border-t-gold-400 dark:border-r-gold-300 animate-spin" />
            </div>
          </div>
          <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">
            Loading team roster...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error && !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <Link href={`/dashboard/manager/clubs/${clubId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Club
            </Button>
          </Link>

          <Card className="bg-white dark:bg-charcoal-800 border-red-200 dark:border-red-900/30 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-charcoal-900 dark:text-white mb-1">
                    Error Loading Team
                  </h3>
                  <p className="text-charcoal-600 dark:text-charcoal-400 text-sm">{error}</p>
                  <Button
                    onClick={fetchTeamAndPlayers}
                    className="mt-4 bg-gold-500 hover:bg-gold-600 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER SECTION */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Club
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white">
                  {team?.name}
                </h1>
                <span className="px-3 py-1 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 rounded-full text-sm font-semibold">
                  {stats.total} Players
                </span>
              </div>
              <p className="text-charcoal-600 dark:text-charcoal-400 mt-1">
                Manage your team&apos;s roster and lineup
              </p>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ADD PLAYER FORM - Sidebar */}
          <Card className="lg:col-span-1 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 h-fit shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent dark:from-gold-900/20 dark:to-transparent pb-4">
              <CardTitle className="text-charcoal-900 dark:text-white">Add Player</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Find and add players to your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPlayer} className="space-y-4">
                {/* Email Input */}
                <div>
                  <Label
                    htmlFor="email"
                    className="block text-charcoal-700 dark:text-charcoal-300 mb-2 font-medium text-sm"
                  >
                    Player Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPlayerEmail}
                    onChange={(e) => setNewPlayerEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    disabled={isAddingPlayer}
                  />
                </div>

                {/* Position Selector */}
                <div>
                  <Label
                    htmlFor="position"
                    className="block text-charcoal-700 dark:text-charcoal-300 mb-2 font-medium text-sm"
                  >
                    Position (Optional)
                  </Label>
                  <select
                    id="position"
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    disabled={isAddingPlayer}
                    className="w-full px-3 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-700 transition-all disabled:opacity-50 text-sm"
                  >
                    <option value="">Select position...</option>
                    {PLAYER_POSITIONS.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jersey Number */}
                <div>
                  <Label
                    htmlFor="jersey"
                    className="block text-charcoal-700 dark:text-charcoal-300 mb-2 font-medium text-sm"
                  >
                    Jersey Number (Optional)
                  </Label>
                  <Input
                    id="jersey"
                    type="number"
                    min="1"
                    max="99"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    placeholder="e.g., 7"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    disabled={isAddingPlayer}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isAddingPlayer || !newPlayerEmail.trim()}
                  className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold disabled:opacity-50 transition-all"
                >
                  {isAddingPlayer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Player
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* PLAYERS LIST - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-charcoal-400 dark:text-charcoal-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 text-charcoal-900 dark:text-white placeholder-charcoal-400"
              />
            </div>

            {/* Players Grid or Empty State */}
            {filteredPlayers.length === 0 ? (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardContent className="pt-12 pb-12 text-center">
                  <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
                    {players.length === 0
                      ? EMPTY_MESSAGES.noPlayers.title
                      : EMPTY_MESSAGES.noSearch.title}
                  </h3>
                  <p className="text-charcoal-600 dark:text-charcoal-400">
                    {players.length === 0
                      ? EMPTY_MESSAGES.noPlayers.description
                      : EMPTY_MESSAGES.noSearch.description}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlayers.map((player) => {
                  const positionLabel = getPositionLabel(player.position);
                  const statusStyle = getStatusStyle(player.status);

                  return (
                    <Card
                      key={player.id}
                      className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-sm hover:shadow-md transition-all"
                    >
                      <CardContent className="pt-6">
                        {/* Player Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-charcoal-900 dark:text-white">
                                {player.user.firstName} {player.user.lastName}
                              </h3>
                              {/* Captain Badge with Tooltip */}
                              {player.isCaptain && (
                                <div className="relative group">
                                  <Crown className="w-5 h-5 text-gold-500 animate-pulse" />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-charcoal-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    Team Captain
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{player.user.email}</span>
                            </p>
                          </div>
                          {/* Jersey Number */}
                          {player.jerseyNumber && (
                            <div className="flex-shrink-0 w-10 h-10 bg-gold-100 dark:bg-gold-900/30 rounded-lg flex items-center justify-center ml-2">
                              <span className="font-bold text-gold-700 dark:text-gold-400 text-sm">
                                {player.jerseyNumber}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Position Badge */}
                        {positionLabel && (
                          <div className="mb-3 inline-block">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${positionLabel.color}`}>
                              {positionLabel.abbr}
                            </span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="mb-4 flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle.color}`}>
                            {statusStyle.label}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleCaptain(
                                player.id,
                                player.isCaptain,
                                `${player.user.firstName} ${player.user.lastName}`
                              )
                            }
                            className={`text-xs ${
                              player.isCaptain
                                ? 'text-gold-600 dark:text-gold-400 hover:bg-gold-100 dark:hover:bg-gold-900/30'
                                : 'text-charcoal-600 dark:text-charcoal-400 hover:bg-neutral-100 dark:hover:bg-charcoal-700'
                            }`}
                          >
                            <Crown className="w-4 h-4 mr-1" />
                            {player.isCaptain ? 'Remove' : 'Make'} Captain
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemovePlayer(
                                player.id,
                                `${player.user.firstName} ${player.user.lastName}`
                              )
                            }
                            className="text-xs text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Team Statistics */}
            {players.length > 0 && (
              <Card className="bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gold-900/10 dark:to-orange-900/10 border-neutral-200 dark:border-charcoal-700 shadow-sm">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold uppercase">
                        Total Players
                      </p>
                      <p className="text-3xl font-bold text-gold-600 dark:text-gold-400 mt-2">
                        {stats.total}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold uppercase">
                        Active
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                        {stats.active}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold uppercase">
                        Captains
                      </p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                        {stats.captains}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold uppercase">
                        Positioned
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                        {stats.withPosition}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DISPLAY NAME
// ============================================================================

TeamPlayersPage.displayName = 'TeamPlayersPage';
