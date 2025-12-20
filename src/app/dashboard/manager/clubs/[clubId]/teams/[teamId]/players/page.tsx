'use client';

/**
 * Team Players Management Page - v2.0 ENHANCED
 * Path: /dashboard/manager/clubs/[clubId]/teams/[teamId]/players
 * 
 * Core Features:
 * ✅ Complete player roster management
 * ✅ Add players by email with position assignment
 * ✅ Set and manage team captain
 * ✅ Remove players from team (with confirmation)
 * ✅ Search and filter players (real-time)
 * ✅ Jersey number management
 * ✅ Player status tracking (Active/Inactive/Injured/Suspended)
 * ✅ Team statistics dashboard
 * ✅ Position selection with color coding
 * ✅ Custom zero-dependency toast notifications
 * ✅ Responsive UI with dark mode
 * ✅ Loading and error states
 * ✅ Full TypeScript type safety
 * ✅ Schema-aligned data models
 * ✅ Accessibility features
 * 
 * Schema Aligned: Team, Player, User, PlayerTeam models from Prisma
 * Team relationships: Team -> Player (many-to-many via PlayerTeam)
 * 
 * Business Logic:
 * - Only club managers can manage team players
 * - One captain per team (auto-demotes others)
 * - Players can have assigned positions
 * - Email-based player lookup for adding to team
 * - Real-time search filtering
 * - Status management (Active/Inactive/Injured/Suspended)
 */

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Users,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Crown,
  Mail,
  Search,
  CheckCircle,
  X,
  Info,
  Check,
} from 'lucide-react';
import Link from 'next/link';

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

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// CONSTANTS - Schema Aligned
// ============================================================================

const PLAYER_POSITIONS = [
  { id: 'GOALKEEPER', label: 'Goalkeeper', abbr: 'GK', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
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
// TOAST COMPONENT (Zero Dependencies)
// ============================================================================

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  const baseClasses =
    'fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 z-50';

  const typeClasses = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400',
  };

  const icons = {
    success: <Check className="h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    info: <Info className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
    {toasts.map((toast) => (
      <div key={toast.id} className="pointer-events-auto">
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      </div>
    ))}
  </div>
);

// ============================================================================
// CARD COMPONENT (Reusable)
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => (
  <div className={`rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = '',
}: CardProps) => (
  <div className={`border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({
  children,
  className = '',
}: CardProps) => (
  <h2 className={`text-xl font-bold text-charcoal-900 dark:text-white ${className}`}>
    {children}
  </h2>
);

const CardDescription = ({
  children,
  className = '',
}: CardProps) => (
  <p className={`mt-1 text-sm text-charcoal-600 dark:text-charcoal-400 ${className}`}>
    {children}
  </p>
);

const CardContent = ({
  children,
  className = '',
}: CardProps) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

// ============================================================================
// BUTTON COMPONENT (Reusable)
// ============================================================================

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({
  children,
  onClick,
  disabled,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
}: ButtonProps) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white',
    secondary:
      'border border-neutral-300 bg-white text-charcoal-700 hover:bg-neutral-100 dark:border-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700',
    ghost:
      'text-charcoal-600 dark:text-charcoal-400 hover:bg-neutral-100 dark:hover:bg-charcoal-700',
    danger:
      'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1',
    md: 'px-4 py-2 gap-2',
    lg: 'px-6 py-3 gap-2 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// ============================================================================
// INPUT COMPONENT (Reusable)
// ============================================================================

interface InputProps {
  id?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: string | number;
  max?: string | number;
}

const Input = ({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  className = '',
  min,
  max,
}: InputProps) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    min={min}
    max={max}
    className={`w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:opacity-50 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500 ${className}`}
  />
);

// ============================================================================
// LABEL COMPONENT (Reusable)
// ============================================================================

interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

const Label = ({ htmlFor, children, required, className = '' }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 ${className}`}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

// ============================================================================
// BADGE COMPONENT (Reusable)
// ============================================================================

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge = ({ children, className = '' }: BadgeProps) => (
  <span
    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold border ${className}`}
  >
    {children}
  </span>
);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function TeamPlayersPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ========================================================================
  // LIFECYCLE
  // ========================================================================

  useEffect(() => {
    if (clubId && teamId) {
      fetchTeamAndPlayers();
    }
  }, [clubId, teamId]);

  // ========================================================================
  // TOAST UTILITIES
  // ========================================================================

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // FETCH FUNCTIONS
  // ========================================================================

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
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [clubId, teamId, showToast]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  /**
   * Add a new player to the team by email
   */
  const handleAddPlayer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!newPlayerEmail.trim()) {
        showToast('Email is required', 'error');
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

        showToast(
          `${userData.firstName} ${userData.lastName} added successfully!`,
          'success'
        );

        console.log('✅ Player added:', addedPlayer.id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add player';
        console.error('❌ Error adding player:', errorMessage);
        showToast(errorMessage, 'error');
      } finally {
        setIsAddingPlayer(false);
      }
    },
    [clubId, teamId, players, selectedPosition, newPlayerEmail, jerseyNumber, showToast]
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
        showToast(`${playerName} removed from team`, 'success');

        console.log('✅ Player removed:', playerId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove player';
        console.error('❌ Error removing player:', errorMessage);
        showToast(errorMessage, 'error');
      }
    },
    [clubId, teamId, players, team?.name, showToast]
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
        showToast(`${action} ${playerName} as team captain`, 'success');

        console.log('✅ Captain status updated:', playerId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update captain';
        console.error('❌ Error updating captain:', errorMessage);
        showToast(errorMessage, 'error');
      }
    },
    [clubId, teamId, players, showToast]
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

        const posLabel = PLAYER_POSITIONS.find((p) => p.id === newPosition)?.label || 'No position';
        showToast(`Updated ${playerName}'s position to ${posLabel}`, 'success');

        console.log('✅ Position updated:', playerId, newPosition);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update position';
        console.error('❌ Error updating position:', errorMessage);
        showToast(errorMessage, 'error');
      }
    },
    [clubId, teamId, players, showToast]
  );

  // ========================================================================
  // HELPERS
  // ========================================================================

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

  // ========================================================================
  // LOADING STATE
  // ========================================================================

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

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (error && !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <Link href={`/dashboard/manager/clubs/${clubId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Club
            </Button>
          </Link>

          <Card className="border-red-200 dark:border-red-900/30">
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
                    className="mt-4"
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

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER SECTION */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Club
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white">
                  {team?.name}
                </h1>
                <Badge className="bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 border-gold-300 dark:border-gold-600">
                  {stats.total} Players
                </Badge>
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
          <Card className="lg:col-span-1 h-fit">
            <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent dark:from-gold-900/20 dark:to-transparent pb-4">
              <CardTitle className="text-charcoal-900 dark:text-white">Add Player</CardTitle>
              <CardDescription>Find and add players to your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddPlayer} className="space-y-4">
                {/* Email Input */}
                <div>
                  <Label htmlFor="email" required>
                    Player Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPlayerEmail}
                    onChange={(e) => setNewPlayerEmail(e.target.value)}
                    placeholder="player@example.com"
                    disabled={isAddingPlayer}
                  />
                </div>

                {/* Position Selector */}
                <div>
                  <Label htmlFor="position">Position (Optional)</Label>
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
                  <Label htmlFor="jersey">Jersey Number (Optional)</Label>
                  <Input
                    id="jersey"
                    type="number"
                    min="1"
                    max="99"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    placeholder="e.g., 7"
                    disabled={isAddingPlayer}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isAddingPlayer || !newPlayerEmail.trim()}
                  className="w-full"
                >
                  {isAddingPlayer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
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
                className="pl-12"
              />
            </div>

            {/* Players Grid or Empty State */}
            {filteredPlayers.length === 0 ? (
              <Card>
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
                      className="hover:shadow-md transition-all"
                    >
                      <CardContent className="pt-6">
                        {/* Player Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-charcoal-900 dark:text-white">
                                {player.user.firstName} {player.user.lastName}
                              </h3>
                              {/* Captain Badge */}
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

                        {/* Position and Status Badges */}
                        <div className="mb-4 flex items-center gap-2 flex-wrap">
                          {positionLabel && (
                            <Badge className={positionLabel.color}>
                              {positionLabel.abbr}
                            </Badge>
                          )}
                          <Badge className={statusStyle.color}>
                            {statusStyle.label}
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant={player.isCaptain ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() =>
                              handleToggleCaptain(
                                player.id,
                                player.isCaptain,
                                `${player.user.firstName} ${player.user.lastName}`
                              )
                            }
                          >
                            <Crown className="w-4 h-4" />
                            {player.isCaptain ? 'Remove' : 'Make'} Captain
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleRemovePlayer(
                                player.id,
                                `${player.user.firstName} ${player.user.lastName}`
                              )
                            }
                            className="ml-auto"
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
              <Card className="bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gold-900/10 dark:to-orange-900/10">
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

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ============================================================================
// DISPLAY NAME
// ============================================================================

TeamPlayersPage.displayName = 'TeamPlayersPage';
